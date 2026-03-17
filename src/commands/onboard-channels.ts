import { resolveAgentWorkspaceDir, resolveDefaultAgentId } from "../agents/agent-scope.js";
import { listChannelPluginCatalogEntries } from "../channels/plugins/catalog.js";
import { resolveChannelDefaultAccountId } from "../channels/plugins/helpers.js";
import {
  getChannelSetupPlugin,
  listChannelSetupPlugins,
} from "../channels/plugins/setup-registry.js";
import type { ChannelSetupPlugin } from "../channels/plugins/setup-wizard-types.js";
import {
  formatChannelPrimerLine,
  formatChannelSelectionLine,
  listChatChannels,
} from "../channels/registry.js";
import { formatCliCommand } from "../cli/command-format.js";
import type { OpenCraftConfig } from "../config/config.js";
import { isChannelConfigured } from "../config/plugin-auto-enable.js";
import type { DmPolicy } from "../config/types.js";
import { enablePluginInConfig } from "../plugins/enable.js";
import { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "../routing/session-key.js";
import type { RuntimeEnv } from "../runtime.js";
import { formatDocsLink } from "../terminal/links.js";
import type { WizardPrompter, WizardSelectOption } from "../wizard/prompts.js";
import { resolveChannelSetupEntries } from "./channel-setup/discovery.js";
import {
  ensureChannelSetupPluginInstalled,
  loadChannelSetupPluginRegistrySnapshotForChannel,
} from "./channel-setup/plugin-install.js";
import { resolveChannelSetupWizardAdapterForPlugin } from "./channel-setup/registry.js";
import type {
  ChannelSetupWizardAdapter,
  ChannelSetupConfiguredResult,
  ChannelSetupDmPolicy,
  ChannelSetupResult,
  ChannelSetupStatus,
  SetupChannelsOptions,
} from "./channel-setup/types.js";
import type { ChannelChoice } from "./onboard-types.js";

type ConfiguredChannelAction = "update" | "disable" | "delete" | "skip";

type ChannelStatusSummary = {
  installedPlugins: ReturnType<typeof listChannelSetupPlugins>;
  catalogEntries: ReturnType<typeof listChannelPluginCatalogEntries>;
  installedCatalogEntries: ReturnType<typeof listChannelPluginCatalogEntries>;
  statusByChannel: Map<ChannelChoice, ChannelSetupStatus>;
  statusLines: string[];
};

function formatAccountLabel(accountId: string): string {
  return accountId === DEFAULT_ACCOUNT_ID ? "padrão (principal)" : accountId;
}

async function promptConfiguredAction(params: {
  prompter: WizardPrompter;
  label: string;
  supportsDisable: boolean;
  supportsDelete: boolean;
}): Promise<ConfiguredChannelAction> {
  const { prompter, label, supportsDisable, supportsDelete } = params;
  const updateOption: WizardSelectOption<ConfiguredChannelAction> = {
    value: "update",
    label: "Modificar configurações",
  };
  const disableOption: WizardSelectOption<ConfiguredChannelAction> = {
    value: "disable",
    label: "Desativar (mantém config)",
  };
  const deleteOption: WizardSelectOption<ConfiguredChannelAction> = {
    value: "delete",
    label: "Excluir configuração",
  };
  const skipOption: WizardSelectOption<ConfiguredChannelAction> = {
    value: "skip",
    label: "Pular (manter como está)",
  };
  const options: Array<WizardSelectOption<ConfiguredChannelAction>> = [
    updateOption,
    ...(supportsDisable ? [disableOption] : []),
    ...(supportsDelete ? [deleteOption] : []),
    skipOption,
  ];
  return await prompter.select({
    message: `${label} já configurado. O que você quer fazer?`,
    options,
    initialValue: "update",
  });
}

async function promptRemovalAccountId(params: {
  cfg: OpenCraftConfig;
  prompter: WizardPrompter;
  label: string;
  channel: ChannelChoice;
  plugin?: ChannelSetupPlugin;
}): Promise<string> {
  const { cfg, prompter, label, channel } = params;
  const plugin = params.plugin ?? getChannelSetupPlugin(channel);
  if (!plugin) {
    return DEFAULT_ACCOUNT_ID;
  }
  const accountIds = plugin.config.listAccountIds(cfg).filter(Boolean);
  const defaultAccountId = resolveChannelDefaultAccountId({ plugin, cfg, accountIds });
  if (accountIds.length <= 1) {
    return defaultAccountId;
  }
  const selected = await prompter.select({
    message: `Conta ${label}`,
    options: accountIds.map((accountId) => ({
      value: accountId,
      label: formatAccountLabel(accountId),
    })),
    initialValue: defaultAccountId,
  });
  return normalizeAccountId(selected) ?? defaultAccountId;
}

async function collectChannelStatus(params: {
  cfg: OpenCraftConfig;
  options?: SetupChannelsOptions;
  accountOverrides: Partial<Record<ChannelChoice, string>>;
  installedPlugins?: ChannelSetupPlugin[];
  resolveAdapter?: (channel: ChannelChoice) => ChannelSetupWizardAdapter | undefined;
}): Promise<ChannelStatusSummary> {
  const installedPlugins = params.installedPlugins ?? listChannelSetupPlugins();
  const workspaceDir = resolveAgentWorkspaceDir(params.cfg, resolveDefaultAgentId(params.cfg));
  const { installedCatalogEntries, installableCatalogEntries } = resolveChannelSetupEntries({
    cfg: params.cfg,
    installedPlugins,
    workspaceDir,
  });
  const resolveAdapter =
    params.resolveAdapter ??
    ((channel: ChannelChoice) =>
      resolveChannelSetupWizardAdapterForPlugin(
        installedPlugins.find((plugin) => plugin.id === channel),
      ));
  const statusEntries = await Promise.all(
    installedPlugins.flatMap((plugin) => {
      const adapter = resolveAdapter(plugin.id);
      if (!adapter) {
        return [];
      }
      return adapter.getStatus({
        cfg: params.cfg,
        options: params.options,
        accountOverrides: params.accountOverrides,
      });
    }),
  );
  const statusByChannel = new Map(statusEntries.map((entry) => [entry.channel, entry]));
  const fallbackStatuses = listChatChannels()
    .filter((meta) => !statusByChannel.has(meta.id))
    .map((meta) => {
      const configured = isChannelConfigured(params.cfg, meta.id);
      const statusLabel = configured ? "configurado (plugin desativado)" : "não configurado";
      return {
        channel: meta.id,
        configured,
        statusLines: [`${meta.label}: ${statusLabel}`],
        selectionHint: configured ? "configurado · plugin desativado" : "não configurado",
        quickstartScore: 0,
      };
    });
  const discoveredPluginStatuses = installedCatalogEntries
    .filter((entry) => !statusByChannel.has(entry.id as ChannelChoice))
    .map((entry) => {
      const configured = isChannelConfigured(params.cfg, entry.id);
      const pluginEnabled =
        params.cfg.plugins?.entries?.[entry.pluginId ?? entry.id]?.enabled !== false;
      const statusLabel = configured
        ? pluginEnabled
          ? "configurado"
          : "configurado (plugin desativado)"
        : pluginEnabled
          ? "instalado"
          : "instalado (plugin desativado)";
      return {
        channel: entry.id as ChannelChoice,
        configured,
        statusLines: [`${entry.meta.label}: ${statusLabel}`],
        selectionHint: statusLabel,
        quickstartScore: 0,
      };
    });
  const catalogStatuses = installableCatalogEntries.map((entry) => ({
    channel: entry.id,
    configured: false,
    statusLines: [`${entry.meta.label}: instalar plugin para ativar`],
    selectionHint: "plugin · install",
    quickstartScore: 0,
  }));
  const combinedStatuses = [
    ...statusEntries,
    ...fallbackStatuses,
    ...discoveredPluginStatuses,
    ...catalogStatuses,
  ];
  const mergedStatusByChannel = new Map(combinedStatuses.map((entry) => [entry.channel, entry]));
  const statusLines = combinedStatuses.flatMap((entry) => entry.statusLines);
  return {
    installedPlugins,
    catalogEntries: installableCatalogEntries,
    installedCatalogEntries,
    statusByChannel: mergedStatusByChannel,
    statusLines,
  };
}

export async function noteChannelStatus(params: {
  cfg: OpenCraftConfig;
  prompter: WizardPrompter;
  options?: SetupChannelsOptions;
  accountOverrides?: Partial<Record<ChannelChoice, string>>;
}): Promise<void> {
  const { statusLines } = await collectChannelStatus({
    cfg: params.cfg,
    options: params.options,
    accountOverrides: params.accountOverrides ?? {},
  });
  if (statusLines.length > 0) {
    await params.prompter.note(statusLines.join("\n"), "Status dos canais");
  }
}

async function noteChannelPrimer(
  prompter: WizardPrompter,
  channels: Array<{ id: ChannelChoice; blurb: string; label: string }>,
): Promise<void> {
  const channelLines = channels.map((channel) =>
    formatChannelPrimerLine({
      id: channel.id,
      label: channel.label,
      selectionLabel: channel.label,
      docsPath: "/",
      blurb: channel.blurb,
    }),
  );
  await prompter.note(
    [
      "Segurança de DM: o padrão é pareamento; DMs desconhecidos recebem um código de pareamento.",
      `Aprovar com: ${formatCliCommand("opencraft pairing approve <channel> <code>")}`,
      'DMs públicos requerem dmPolicy="open" + allowFrom=["*"].',
      "DMs multiusuário: execute: " +
        formatCliCommand('opencraft config set session.dmScope "per-channel-peer"') +
        ' (ou "per-account-channel-peer" para canais com múltiplas contas) para isolar sessões.',
      `Docs: ${formatDocsLink("/channels/pairing", "channels/pairing")}`,
      "",
      ...channelLines,
    ].join("\n"),
    "Como os canais funcionam",
  );
}

function resolveQuickstartDefault(
  statusByChannel: Map<ChannelChoice, { quickstartScore?: number }>,
): ChannelChoice | undefined {
  let best: { channel: ChannelChoice; score: number } | null = null;
  for (const [channel, status] of statusByChannel) {
    if (status.quickstartScore == null) {
      continue;
    }
    if (!best || status.quickstartScore > best.score) {
      best = { channel, score: status.quickstartScore };
    }
  }
  return best?.channel;
}

async function maybeConfigureDmPolicies(params: {
  cfg: OpenCraftConfig;
  selection: ChannelChoice[];
  prompter: WizardPrompter;
  accountIdsByChannel?: Map<ChannelChoice, string>;
  resolveAdapter?: (channel: ChannelChoice) => ChannelSetupWizardAdapter | undefined;
}): Promise<OpenCraftConfig> {
  const { selection, prompter, accountIdsByChannel } = params;
  const resolve = params.resolveAdapter ?? (() => undefined);
  const dmPolicies = selection
    .map((channel) => resolve(channel)?.dmPolicy)
    .filter(Boolean) as ChannelSetupDmPolicy[];
  if (dmPolicies.length === 0) {
    return params.cfg;
  }

  const wants = await prompter.confirm({
    message: "Configurar políticas de acesso a DM agora? (padrão: pareamento)",
    initialValue: false,
  });
  if (!wants) {
    return params.cfg;
  }

  let cfg = params.cfg;
  const selectPolicy = async (policy: ChannelSetupDmPolicy) => {
    await prompter.note(
      [
        "Padrão: pareamento (DMs desconhecidos recebem um código de pareamento).",
        `Aprovar: ${formatCliCommand(`opencraft pairing approve ${policy.channel} <code>`)}`,
        `DMs com allowlist: ${policy.policyKey}="allowlist" + entradas em ${policy.allowFromKey}.`,
        `DMs públicos: ${policy.policyKey}="open" + ${policy.allowFromKey} inclui "*".`,
        "DMs multiusuário: execute: " +
          formatCliCommand('opencraft config set session.dmScope "per-channel-peer"') +
          ' (ou "per-account-channel-peer" para canais com múltiplas contas) para isolar sessões.',
        `Docs: ${formatDocsLink("/channels/pairing", "channels/pairing")}`,
      ].join("\n"),
      `Acesso DM ${policy.label}`,
    );
    return (await prompter.select({
      message: `Política DM ${policy.label}`,
      options: [
        { value: "pairing", label: "Pareamento (recomendado)" },
        { value: "allowlist", label: "Allowlist (somente usuários específicos)" },
        { value: "open", label: "Aberto (DMs públicos de entrada)" },
        { value: "disabled", label: "Desativado (ignorar DMs)" },
      ],
    })) as DmPolicy;
  };

  for (const policy of dmPolicies) {
    const current = policy.getCurrent(cfg);
    const nextPolicy = await selectPolicy(policy);
    if (nextPolicy !== current) {
      cfg = policy.setPolicy(cfg, nextPolicy);
    }
    if (nextPolicy === "allowlist" && policy.promptAllowFrom) {
      cfg = await policy.promptAllowFrom({
        cfg,
        prompter,
        accountId: accountIdsByChannel?.get(policy.channel),
      });
    }
  }

  return cfg;
}

// Channel-specific prompts moved into setup flow adapters.

export async function setupChannels(
  cfg: OpenCraftConfig,
  runtime: RuntimeEnv,
  prompter: WizardPrompter,
  options?: SetupChannelsOptions,
): Promise<OpenCraftConfig> {
  let next = cfg;
  const forceAllowFromChannels = new Set(options?.forceAllowFromChannels ?? []);
  const accountOverrides: Partial<Record<ChannelChoice, string>> = {
    ...options?.accountIds,
  };
  const scopedPluginsById = new Map<ChannelChoice, ChannelSetupPlugin>();
  const resolveWorkspaceDir = () => resolveAgentWorkspaceDir(next, resolveDefaultAgentId(next));
  const rememberScopedPlugin = (plugin: ChannelSetupPlugin) => {
    const channel = plugin.id;
    scopedPluginsById.set(channel, plugin);
    options?.onResolvedPlugin?.(channel, plugin);
  };
  const getVisibleChannelPlugin = (channel: ChannelChoice): ChannelSetupPlugin | undefined =>
    scopedPluginsById.get(channel) ?? getChannelSetupPlugin(channel);
  const listVisibleInstalledPlugins = (): ChannelSetupPlugin[] => {
    const merged = new Map<string, ChannelSetupPlugin>();
    for (const plugin of listChannelSetupPlugins()) {
      merged.set(plugin.id, plugin);
    }
    for (const plugin of scopedPluginsById.values()) {
      merged.set(plugin.id, plugin);
    }
    return Array.from(merged.values());
  };
  const loadScopedChannelPlugin = async (
    channel: ChannelChoice,
    pluginId?: string,
  ): Promise<ChannelSetupPlugin | undefined> => {
    const existing = getVisibleChannelPlugin(channel);
    if (existing) {
      return existing;
    }
    const snapshot = loadChannelSetupPluginRegistrySnapshotForChannel({
      cfg: next,
      runtime,
      channel,
      ...(pluginId ? { pluginId } : {}),
      workspaceDir: resolveWorkspaceDir(),
    });
    const plugin =
      snapshot.channels.find((entry) => entry.plugin.id === channel)?.plugin ??
      snapshot.channelSetups.find((entry) => entry.plugin.id === channel)?.plugin;
    if (plugin) {
      rememberScopedPlugin(plugin);
      return plugin;
    }
    return undefined;
  };
  const getVisibleSetupFlowAdapter = (channel: ChannelChoice) => {
    const scopedPlugin = scopedPluginsById.get(channel);
    if (scopedPlugin) {
      return resolveChannelSetupWizardAdapterForPlugin(scopedPlugin);
    }
    return resolveChannelSetupWizardAdapterForPlugin(getChannelSetupPlugin(channel));
  };
  const preloadConfiguredExternalPlugins = () => {
    // Keep setup memory bounded by snapshot-loading only configured external plugins.
    const workspaceDir = resolveWorkspaceDir();
    for (const entry of listChannelPluginCatalogEntries({ workspaceDir })) {
      const channel = entry.id as ChannelChoice;
      if (getVisibleChannelPlugin(channel)) {
        continue;
      }
      const explicitlyEnabled =
        next.plugins?.entries?.[entry.pluginId ?? channel]?.enabled === true;
      if (!explicitlyEnabled && !isChannelConfigured(next, channel)) {
        continue;
      }
      void loadScopedChannelPlugin(channel, entry.pluginId);
    }
  };
  if (options?.whatsappAccountId?.trim()) {
    accountOverrides.whatsapp = options.whatsappAccountId.trim();
  }
  preloadConfiguredExternalPlugins();

  const {
    installedPlugins,
    catalogEntries,
    installedCatalogEntries,
    statusByChannel,
    statusLines,
  } = await collectChannelStatus({
    cfg: next,
    options,
    accountOverrides,
    installedPlugins: listVisibleInstalledPlugins(),
    resolveAdapter: getVisibleSetupFlowAdapter,
  });
  if (!options?.skipStatusNote && statusLines.length > 0) {
    await prompter.note(statusLines.join("\n"), "Status dos canais");
  }

  const shouldConfigure = options?.skipConfirm
    ? true
    : await prompter.confirm({
        message: "Configurar canais de chat agora?",
        initialValue: true,
      });
  if (!shouldConfigure) {
    return cfg;
  }

  const corePrimer = listChatChannels().map((meta) => ({
    id: meta.id,
    label: meta.label,
    blurb: meta.blurb,
  }));
  const coreIds = new Set(corePrimer.map((entry) => entry.id));
  const primerChannels = [
    ...corePrimer,
    ...installedPlugins
      .filter((plugin) => !coreIds.has(plugin.id))
      .map((plugin) => ({
        id: plugin.id,
        label: plugin.meta.label,
        blurb: plugin.meta.blurb,
      })),
    ...installedCatalogEntries
      .filter((entry) => !coreIds.has(entry.id as ChannelChoice))
      .map((entry) => ({
        id: entry.id as ChannelChoice,
        label: entry.meta.label,
        blurb: entry.meta.blurb,
      })),
    ...catalogEntries
      .filter((entry) => !coreIds.has(entry.id as ChannelChoice))
      .map((entry) => ({
        id: entry.id as ChannelChoice,
        label: entry.meta.label,
        blurb: entry.meta.blurb,
      })),
  ];
  await noteChannelPrimer(prompter, primerChannels);

  const quickstartDefault =
    options?.initialSelection?.[0] ?? resolveQuickstartDefault(statusByChannel);

  const shouldPromptAccountIds = options?.promptAccountIds === true;
  const accountIdsByChannel = new Map<ChannelChoice, string>();
  const recordAccount = (channel: ChannelChoice, accountId: string) => {
    options?.onAccountId?.(channel, accountId);
    const adapter = getVisibleSetupFlowAdapter(channel);
    adapter?.onAccountRecorded?.(accountId, options);
    accountIdsByChannel.set(channel, accountId);
  };

  const selection: ChannelChoice[] = [];
  const addSelection = (channel: ChannelChoice) => {
    if (!selection.includes(channel)) {
      selection.push(channel);
    }
  };

  const resolveDisabledHint = (channel: ChannelChoice): string | undefined => {
    if (
      typeof (next.channels as Record<string, { enabled?: boolean }> | undefined)?.[channel]
        ?.enabled === "boolean"
    ) {
      return (next.channels as Record<string, { enabled?: boolean }>)[channel]?.enabled === false
        ? "disabled"
        : undefined;
    }
    const plugin = getVisibleChannelPlugin(channel);
    if (!plugin) {
      if (next.plugins?.entries?.[channel]?.enabled === false) {
        return "plugin disabled";
      }
      if (next.plugins?.enabled === false) {
        return "plugins disabled";
      }
      return undefined;
    }
    const accountId = resolveChannelDefaultAccountId({ plugin, cfg: next });
    const account = plugin.config.resolveAccount(next, accountId);
    let enabled: boolean | undefined;
    if (plugin.config.isEnabled) {
      enabled = plugin.config.isEnabled(account, next);
    } else if (typeof (account as { enabled?: boolean })?.enabled === "boolean") {
      enabled = (account as { enabled?: boolean }).enabled;
    }
    return enabled === false ? "disabled" : undefined;
  };

  const buildSelectionOptions = (
    entries: Array<{
      id: ChannelChoice;
      meta: { id: string; label: string; selectionLabel?: string };
    }>,
  ) =>
    entries.map((entry) => {
      const status = statusByChannel.get(entry.id);
      const disabledHint = resolveDisabledHint(entry.id);
      const hint = [status?.selectionHint, disabledHint].filter(Boolean).join(" · ") || undefined;
      return {
        value: entry.meta.id,
        label: entry.meta.selectionLabel ?? entry.meta.label,
        ...(hint ? { hint } : {}),
      };
    });

  const getChannelEntries = () => {
    const resolved = resolveChannelSetupEntries({
      cfg: next,
      installedPlugins: listVisibleInstalledPlugins(),
      workspaceDir: resolveWorkspaceDir(),
    });
    return {
      entries: resolved.entries,
      catalogById: resolved.installableCatalogById,
      installedCatalogById: resolved.installedCatalogById,
    };
  };

  const refreshStatus = async (channel: ChannelChoice) => {
    const adapter = getVisibleSetupFlowAdapter(channel);
    if (!adapter) {
      return;
    }
    const status = await adapter.getStatus({ cfg: next, options, accountOverrides });
    statusByChannel.set(channel, status);
  };

  const enableBundledPluginForSetup = async (channel: ChannelChoice): Promise<boolean> => {
    if (getVisibleChannelPlugin(channel)) {
      await refreshStatus(channel);
      return true;
    }
    const result = enablePluginInConfig(next, channel);
    next = result.config;
    if (!result.enabled) {
      await prompter.note(
        `Não foi possível ativar ${channel}: ${result.reason ?? "plugin desativado"}.`,
        "Configuração de canal",
      );
      return false;
    }
    const plugin = await loadScopedChannelPlugin(channel);
    const adapter = getVisibleSetupFlowAdapter(channel);
    if (!plugin) {
      if (adapter) {
        await prompter.note(
          `Plugin ${channel} não disponível (continuando com a configuração). Se o canal ainda não funcionar após a configuração, execute \`${formatCliCommand(
            "opencraft plugins list",
          )}\` e \`${formatCliCommand("opencraft plugins enable " + channel)}\`, depois reinicie o gateway.`,
          "Configuração de canal",
        );
        await refreshStatus(channel);
        return true;
      }
      await prompter.note(`Plugin ${channel} não disponível.`, "Configuração de canal");
      return false;
    }
    await refreshStatus(channel);
    return true;
  };

  const applySetupResult = async (channel: ChannelChoice, result: ChannelSetupResult) => {
    next = result.cfg;
    if (result.accountId) {
      recordAccount(channel, result.accountId);
    }
    addSelection(channel);
    await refreshStatus(channel);
  };

  const applyCustomSetupResult = async (
    channel: ChannelChoice,
    result: ChannelSetupConfiguredResult,
  ) => {
    if (result === "skip") {
      return false;
    }
    await applySetupResult(channel, result);
    return true;
  };

  const configureChannel = async (channel: ChannelChoice) => {
    const adapter = getVisibleSetupFlowAdapter(channel);
    if (!adapter) {
      await prompter.note(
        `${channel} ainda não suporta configuração guiada.`,
        "Configuração de canal",
      );
      return;
    }
    const result = await adapter.configure({
      cfg: next,
      runtime,
      prompter,
      options,
      accountOverrides,
      shouldPromptAccountIds,
      forceAllowFrom: forceAllowFromChannels.has(channel),
    });
    await applySetupResult(channel, result);
  };

  const handleConfiguredChannel = async (channel: ChannelChoice, label: string) => {
    const plugin = getVisibleChannelPlugin(channel);
    const adapter = getVisibleSetupFlowAdapter(channel);
    if (adapter?.configureWhenConfigured) {
      const custom = await adapter.configureWhenConfigured({
        cfg: next,
        runtime,
        prompter,
        options,
        accountOverrides,
        shouldPromptAccountIds,
        forceAllowFrom: forceAllowFromChannels.has(channel),
        configured: true,
        label,
      });
      if (!(await applyCustomSetupResult(channel, custom))) {
        return;
      }
      return;
    }
    const supportsDisable = Boolean(
      options?.allowDisable && (plugin?.config.setAccountEnabled || adapter?.disable),
    );
    const supportsDelete = Boolean(options?.allowDisable && plugin?.config.deleteAccount);
    const action = await promptConfiguredAction({
      prompter,
      label,
      supportsDisable,
      supportsDelete,
    });

    if (action === "skip") {
      return;
    }
    if (action === "update") {
      await configureChannel(channel);
      return;
    }
    if (!options?.allowDisable) {
      return;
    }

    if (action === "delete" && !supportsDelete) {
      await prompter.note(
        `${label} não suporta exclusão de entradas de configuração.`,
        "Remover canal",
      );
      return;
    }

    const shouldPromptAccount =
      action === "delete"
        ? Boolean(plugin?.config.deleteAccount)
        : Boolean(plugin?.config.setAccountEnabled);
    const accountId = shouldPromptAccount
      ? await promptRemovalAccountId({
          cfg: next,
          prompter,
          label,
          channel,
          plugin,
        })
      : DEFAULT_ACCOUNT_ID;
    const resolvedAccountId =
      normalizeAccountId(accountId) ??
      (plugin ? resolveChannelDefaultAccountId({ plugin, cfg: next }) : DEFAULT_ACCOUNT_ID);
    const accountLabel = formatAccountLabel(resolvedAccountId);

    if (action === "delete") {
      const confirmed = await prompter.confirm({
        message: `Excluir conta "${accountLabel}" do ${label}?`,
        initialValue: false,
      });
      if (!confirmed) {
        return;
      }
      if (plugin?.config.deleteAccount) {
        next = plugin.config.deleteAccount({ cfg: next, accountId: resolvedAccountId });
      }
      await refreshStatus(channel);
      return;
    }

    if (plugin?.config.setAccountEnabled) {
      next = plugin.config.setAccountEnabled({
        cfg: next,
        accountId: resolvedAccountId,
        enabled: false,
      });
    } else if (adapter?.disable) {
      next = adapter.disable(next);
    }
    await refreshStatus(channel);
  };

  const handleChannelChoice = async (channel: ChannelChoice) => {
    const { catalogById, installedCatalogById } = getChannelEntries();
    const catalogEntry = catalogById.get(channel);
    const installedCatalogEntry = installedCatalogById.get(channel);
    if (catalogEntry) {
      const workspaceDir = resolveWorkspaceDir();
      const result = await ensureChannelSetupPluginInstalled({
        cfg: next,
        entry: catalogEntry,
        prompter,
        runtime,
        workspaceDir,
      });
      next = result.cfg;
      if (!result.installed) {
        return;
      }
      await loadScopedChannelPlugin(channel, result.pluginId ?? catalogEntry.pluginId);
      await refreshStatus(channel);
    } else if (installedCatalogEntry) {
      const plugin = await loadScopedChannelPlugin(channel, installedCatalogEntry.pluginId);
      if (!plugin) {
        await prompter.note(`Plugin ${channel} não disponível.`, "Configuração de canal");
        return;
      }
      await refreshStatus(channel);
    } else {
      const enabled = await enableBundledPluginForSetup(channel);
      if (!enabled) {
        return;
      }
    }

    const plugin = getVisibleChannelPlugin(channel);
    const adapter = getVisibleSetupFlowAdapter(channel);
    const label = plugin?.meta.label ?? catalogEntry?.meta.label ?? channel;
    const status = statusByChannel.get(channel);
    const configured = status?.configured ?? false;
    if (adapter?.configureInteractive) {
      const custom = await adapter.configureInteractive({
        cfg: next,
        runtime,
        prompter,
        options,
        accountOverrides,
        shouldPromptAccountIds,
        forceAllowFrom: forceAllowFromChannels.has(channel),
        configured,
        label,
      });
      if (!(await applyCustomSetupResult(channel, custom))) {
        return;
      }
      return;
    }
    if (configured) {
      await handleConfiguredChannel(channel, label);
      return;
    }
    await configureChannel(channel);
  };

  if (options?.quickstartDefaults) {
    const { entries } = getChannelEntries();
    const choice = (await prompter.select({
      message: "Selecionar canal (QuickStart)",
      options: [
        ...buildSelectionOptions(entries),
        {
          value: "__skip__",
          label: "Pular por enquanto",
          hint: `Você pode adicionar canais depois via \`${formatCliCommand("opencraft channels add")}\``,
        },
      ],
      initialValue: quickstartDefault,
    })) as ChannelChoice | "__skip__";
    if (choice !== "__skip__") {
      await handleChannelChoice(choice);
    }
  } else {
    const doneValue = "__done__" as const;
    const initialValue = options?.initialSelection?.[0] ?? quickstartDefault;
    while (true) {
      const { entries } = getChannelEntries();
      const choice = (await prompter.select({
        message: "Selecionar um canal",
        options: [
          ...buildSelectionOptions(entries),
          {
            value: doneValue,
            label: "Concluído",
            hint: selection.length > 0 ? "Done" : "Pular por enquanto",
          },
        ],
        initialValue,
      })) as ChannelChoice | typeof doneValue;
      if (choice === doneValue) {
        break;
      }
      await handleChannelChoice(choice);
    }
  }

  options?.onSelection?.(selection);

  const selectionNotes = new Map<string, string>();
  const { entries: selectionEntries } = getChannelEntries();
  for (const entry of selectionEntries) {
    selectionNotes.set(entry.id, formatChannelSelectionLine(entry.meta, formatDocsLink));
  }
  const selectedLines = selection
    .map((channel) => selectionNotes.get(channel))
    .filter((line): line is string => Boolean(line));
  if (selectedLines.length > 0) {
    await prompter.note(selectedLines.join("\n"), "Canais selecionados");
  }

  if (!options?.skipDmPolicyPrompt) {
    next = await maybeConfigureDmPolicies({
      cfg: next,
      selection,
      prompter,
      accountIdsByChannel,
      resolveAdapter: getVisibleSetupFlowAdapter,
    });
  }

  return next;
}
