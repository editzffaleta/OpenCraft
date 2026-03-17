import fs from "node:fs/promises";
import path from "node:path";
import { DEFAULT_BOOTSTRAP_FILENAME } from "../agents/workspace.js";
import { formatCliCommand } from "../cli/command-format.js";
import {
  buildGatewayInstallPlan,
  gatewayInstallErrorHint,
} from "../commands/daemon-install-helpers.js";
import {
  DEFAULT_GATEWAY_DAEMON_RUNTIME,
  GATEWAY_DAEMON_RUNTIME_OPTIONS,
} from "../commands/daemon-runtime.js";
import { resolveGatewayInstallToken } from "../commands/gateway-install-token.js";
import { formatHealthCheckFailure } from "../commands/health-format.js";
import { healthCommand } from "../commands/health.js";
import {
  detectBrowserOpenSupport,
  formatControlUiSshHint,
  openUrl,
  probeGatewayReachable,
  waitForGatewayReachable,
  resolveControlUiLinks,
} from "../commands/onboard-helpers.js";
import type { OnboardOptions } from "../commands/onboard-types.js";
import type { OpenCraftConfig } from "../config/config.js";
import { describeGatewayServiceRestart, resolveGatewayService } from "../daemon/service.js";
import { isSystemdUserServiceAvailable } from "../daemon/systemd.js";
import { ensureControlUiAssetsBuilt } from "../infra/control-ui-assets.js";
import type { RuntimeEnv } from "../runtime.js";
import { restoreTerminalState } from "../terminal/restore.js";
import { runTui } from "../tui/tui.js";
import { resolveUserPath } from "../utils.js";
import { setupOnboardingShellCompletion } from "./onboarding.completion.js";
import { resolveOnboardingSecretInputString } from "./onboarding.secret-input.js";
import type { GatewayWizardSettings, WizardFlow } from "./onboarding.types.js";
import type { WizardPrompter } from "./prompts.js";

type FinalizeOnboardingOptions = {
  flow: WizardFlow;
  opts: OnboardOptions;
  baseConfig: OpenCraftConfig;
  nextConfig: OpenCraftConfig;
  workspaceDir: string;
  settings: GatewayWizardSettings;
  prompter: WizardPrompter;
  runtime: RuntimeEnv;
};

export async function finalizeOnboardingWizard(
  options: FinalizeOnboardingOptions,
): Promise<{ launchedTui: boolean }> {
  const { flow, opts, baseConfig, nextConfig, settings, prompter, runtime } = options;

  const withWizardProgress = async <T>(
    label: string,
    options: { doneMessage?: string | (() => string | undefined) },
    work: (progress: { update: (message: string) => void }) => Promise<T>,
  ): Promise<T> => {
    const progress = prompter.progress(label);
    try {
      return await work(progress);
    } finally {
      progress.stop(
        typeof options.doneMessage === "function" ? options.doneMessage() : options.doneMessage,
      );
    }
  };

  const systemdAvailable =
    process.platform === "linux" ? await isSystemdUserServiceAvailable() : true;
  if (process.platform === "linux" && !systemdAvailable) {
    await prompter.note(
      "Serviços de usuário systemd não estão disponíveis. Pulando verificações de linger e instalação do serviço.",
      "Systemd",
    );
  }

  if (process.platform === "linux" && systemdAvailable) {
    const { ensureSystemdUserLingerInteractive } = await import("../commands/systemd-linger.js");
    await ensureSystemdUserLingerInteractive({
      runtime,
      prompter: {
        confirm: prompter.confirm,
        note: prompter.note,
      },
      reason:
        "As instalações Linux usam um serviço de usuário systemd por padrão. Sem lingering, o systemd encerra a sessão de usuário no logout/inatividade e mata o Gateway.",
      requireConfirm: false,
    });
  }

  const explicitInstallDaemon =
    typeof opts.installDaemon === "boolean" ? opts.installDaemon : undefined;
  let installDaemon: boolean;
  if (explicitInstallDaemon !== undefined) {
    installDaemon = explicitInstallDaemon;
  } else if (process.platform === "linux" && !systemdAvailable) {
    installDaemon = false;
  } else if (flow === "quickstart") {
    installDaemon = true;
  } else {
    installDaemon = await prompter.confirm({
      message: "Instalar serviço do Gateway (recomendado)",
      initialValue: true,
    });
  }

  if (process.platform === "linux" && !systemdAvailable && installDaemon) {
    await prompter.note(
      "Serviços de usuário systemd não estão disponíveis; pulando instalação do serviço. Use seu supervisor de containers ou `docker compose up -d`.",
      "Serviço do Gateway",
    );
    installDaemon = false;
  }

  if (installDaemon) {
    const daemonRuntime =
      flow === "quickstart"
        ? DEFAULT_GATEWAY_DAEMON_RUNTIME
        : await prompter.select({
            message: "Runtime do serviço do Gateway",
            options: GATEWAY_DAEMON_RUNTIME_OPTIONS,
            initialValue: opts.daemonRuntime ?? DEFAULT_GATEWAY_DAEMON_RUNTIME,
          });
    if (flow === "quickstart") {
      await prompter.note(
        "O QuickStart usa Node para o serviço do Gateway (estável e suportado).",
        "Runtime do serviço do Gateway",
      );
    }
    const service = resolveGatewayService();
    const loaded = await service.isLoaded({ env: process.env });
    let restartWasScheduled = false;
    if (loaded) {
      const action = await prompter.select({
        message: "Serviço do Gateway já instalado",
        options: [
          { value: "restart", label: "Reiniciar" },
          { value: "reinstall", label: "Reinstalar" },
          { value: "skip", label: "Pular" },
        ],
      });
      if (action === "restart") {
        let restartDoneMessage = "Serviço do Gateway reiniciado.";
        await withWizardProgress(
          "Serviço do Gateway",
          { doneMessage: () => restartDoneMessage },
          async (progress) => {
            progress.update("Reiniciando o serviço do Gateway…");
            const restartResult = await service.restart({
              env: process.env,
              stdout: process.stdout,
            });
            const restartStatus = describeGatewayServiceRestart("Gateway", restartResult);
            restartDoneMessage = restartStatus.progressMessage;
            restartWasScheduled = restartStatus.scheduled;
          },
        );
      } else if (action === "reinstall") {
        await withWizardProgress(
          "Serviço do Gateway",
          { doneMessage: "Serviço do Gateway desinstalado." },
          async (progress) => {
            progress.update("Desinstalando o serviço do Gateway…");
            await service.uninstall({ env: process.env, stdout: process.stdout });
          },
        );
      }
    }

    if (
      !loaded ||
      (!restartWasScheduled && loaded && !(await service.isLoaded({ env: process.env })))
    ) {
      const progress = prompter.progress("Serviço do Gateway");
      let installError: string | null = null;
      try {
        progress.update("Preparando o serviço do Gateway…");
        const tokenResolution = await resolveGatewayInstallToken({
          config: nextConfig,
          env: process.env,
        });
        for (const warning of tokenResolution.warnings) {
          await prompter.note(warning, "Serviço do Gateway");
        }
        if (tokenResolution.unavailableReason) {
          installError = [
            "Instalação do Gateway bloqueada:",
            tokenResolution.unavailableReason,
            "Corrija a configuração de autenticação do gateway e execute o onboarding novamente.",
          ].join(" ");
        } else {
          const { programArguments, workingDirectory, environment } = await buildGatewayInstallPlan(
            {
              env: process.env,
              port: settings.port,
              runtime: daemonRuntime,
              warn: (message, title) => prompter.note(message, title),
              config: nextConfig,
            },
          );

          progress.update("Instalando o serviço do Gateway…");
          await service.install({
            env: process.env,
            stdout: process.stdout,
            programArguments,
            workingDirectory,
            environment,
          });
        }
      } catch (err) {
        installError = err instanceof Error ? err.message : String(err);
      } finally {
        progress.stop(
          installError
            ? "Falha na instalação do serviço do Gateway."
            : "Serviço do Gateway instalado.",
        );
      }
      if (installError) {
        await prompter.note(
          `Falha na instalação do serviço do Gateway: ${installError}`,
          "Gateway",
        );
        await prompter.note(gatewayInstallErrorHint(), "Gateway");
      }
    }
  }

  if (!opts.skipHealth) {
    const probeLinks = resolveControlUiLinks({
      bind: nextConfig.gateway?.bind ?? "loopback",
      port: settings.port,
      customBindHost: nextConfig.gateway?.customBindHost,
      basePath: undefined,
    });
    // Daemon install/restart can briefly flap the WS; wait a bit so health check doesn't false-fail.
    await waitForGatewayReachable({
      url: probeLinks.wsUrl,
      token: settings.gatewayToken,
      deadlineMs: 15_000,
    });
    try {
      await healthCommand({ json: false, timeoutMs: 10_000 }, runtime);
    } catch (err) {
      runtime.error(formatHealthCheckFailure(err));
      await prompter.note(
        [
          "Docs:",
          "https://docs.opencraft.ai/gateway/health",
          "https://docs.opencraft.ai/gateway/troubleshooting",
        ].join("\n"),
        "Ajuda com verificação de saúde",
      );
    }
  }

  const controlUiEnabled =
    nextConfig.gateway?.controlUi?.enabled ?? baseConfig.gateway?.controlUi?.enabled ?? true;
  if (!opts.skipUi && controlUiEnabled) {
    const controlUiAssets = await ensureControlUiAssetsBuilt(runtime);
    if (!controlUiAssets.ok && controlUiAssets.message) {
      runtime.error(controlUiAssets.message);
    }
  }

  await prompter.note(
    [
      "Adicione nós para funcionalidades extras:",
      "- macOS app (system + notifications)",
      "- iOS app (camera/canvas)",
      "- Android app (camera/canvas)",
    ].join("\n"),
    "Aplicativos opcionais",
  );

  const controlUiBasePath =
    nextConfig.gateway?.controlUi?.basePath ?? baseConfig.gateway?.controlUi?.basePath;
  const links = resolveControlUiLinks({
    bind: settings.bind,
    port: settings.port,
    customBindHost: settings.customBindHost,
    basePath: controlUiBasePath,
  });
  const authedUrl =
    settings.authMode === "token" && settings.gatewayToken
      ? `${links.httpUrl}#token=${encodeURIComponent(settings.gatewayToken)}`
      : links.httpUrl;
  let resolvedGatewayPassword = "";
  if (settings.authMode === "password") {
    try {
      resolvedGatewayPassword =
        (await resolveOnboardingSecretInputString({
          config: nextConfig,
          value: nextConfig.gateway?.auth?.password,
          path: "gateway.auth.password",
          env: process.env,
        })) ?? "";
    } catch (error) {
      await prompter.note(
        [
          "Não foi possível resolver o SecretRef gateway.auth.password para autenticação de onboarding.",
          error instanceof Error ? error.message : String(error),
        ].join("\n"),
        "Gateway auth",
      );
    }
  }

  const gatewayProbe = await probeGatewayReachable({
    url: links.wsUrl,
    token: settings.authMode === "token" ? settings.gatewayToken : undefined,
    password: settings.authMode === "password" ? resolvedGatewayPassword : "",
  });
  const gatewayStatusLine = gatewayProbe.ok
    ? "Gateway: reachable"
    : `Gateway: not detected${gatewayProbe.detail ? ` (${gatewayProbe.detail})` : ""}`;
  const bootstrapPath = path.join(
    resolveUserPath(options.workspaceDir),
    DEFAULT_BOOTSTRAP_FILENAME,
  );
  const hasBootstrap = await fs
    .access(bootstrapPath)
    .then(() => true)
    .catch(() => false);

  await prompter.note(
    [
      `Interface web: ${links.httpUrl}`,
      settings.authMode === "token" && settings.gatewayToken
        ? `Interface web (com token): ${authedUrl}`
        : undefined,
      `Gateway WS: ${links.wsUrl}`,
      gatewayStatusLine,
      "Docs: https://docs.opencraft.ai/web/control-ui",
    ]
      .filter(Boolean)
      .join("\n"),
    "Interface de Controle",
  );

  let controlUiOpened = false;
  let controlUiOpenHint: string | undefined;
  let seededInBackground = false;
  let hatchChoice: "tui" | "web" | "later" | null = null;
  let launchedTui = false;

  if (!opts.skipUi && gatewayProbe.ok) {
    if (hasBootstrap) {
      await prompter.note(
        [
          "Esta é a ação que define a identidade do seu agente.",
          "Por favor, dedique seu tempo.",
          "Quanto mais você contar, melhor será a experiência.",
          'Enviaremos: "Wake up, my friend!"',
        ].join("\n"),
        "Iniciar TUI (melhor opção!)",
      );
    }

    await prompter.note(
      [
        "Token do Gateway: autenticação compartilhada para o Gateway + Interface de Controle.",
        "Armazenado em: ~/.opencraft/opencraft.json (gateway.auth.token) ou OPENCRAFT_GATEWAY_TOKEN.",
        `Ver token: ${formatCliCommand("opencraft config get gateway.auth.token")}`,
        `Gerar token: ${formatCliCommand("opencraft doctor --generate-gateway-token")}`,
        "A interface web mantém os tokens de URL do dashboard em memória para a aba atual e os remove da URL após o carregamento.",
        `Abra o dashboard a qualquer momento: ${formatCliCommand("opencraft dashboard --no-open")}`,
        "Se solicitado: cole o token nas configurações da Interface de Controle (ou use a URL do dashboard com token).",
      ].join("\n"),
      "Token",
    );

    hatchChoice = await prompter.select({
      message: "Como você quer inicializar seu bot?",
      options: [
        { value: "tui", label: "Inicializar no TUI (recomendado)" },
        { value: "web", label: "Abrir a Interface Web" },
        { value: "later", label: "Fazer isso depois" },
      ],
      initialValue: "tui",
    });

    if (hatchChoice === "tui") {
      restoreTerminalState("pre-onboarding tui", { resumeStdinIfPaused: true });
      await runTui({
        url: links.wsUrl,
        token: settings.authMode === "token" ? settings.gatewayToken : undefined,
        password: settings.authMode === "password" ? resolvedGatewayPassword : "",
        // Safety: onboarding TUI should not auto-deliver to lastProvider/lastTo.
        deliver: false,
        message: hasBootstrap ? "Wake up, my friend!" : undefined,
      });
      launchedTui = true;
    } else if (hatchChoice === "web") {
      const browserSupport = await detectBrowserOpenSupport();
      if (browserSupport.ok) {
        controlUiOpened = await openUrl(authedUrl);
        if (!controlUiOpened) {
          controlUiOpenHint = formatControlUiSshHint({
            port: settings.port,
            basePath: controlUiBasePath,
            token: settings.authMode === "token" ? settings.gatewayToken : undefined,
          });
        }
      } else {
        controlUiOpenHint = formatControlUiSshHint({
          port: settings.port,
          basePath: controlUiBasePath,
          token: settings.authMode === "token" ? settings.gatewayToken : undefined,
        });
      }
      await prompter.note(
        [
          `Link do dashboard (com token): ${authedUrl}`,
          controlUiOpened
            ? "Aberto no seu navegador. Mantenha essa aba para controlar o OpenCraft."
            : "Copie/cole esta URL em um navegador nesta máquina para controlar o OpenCraft.",
          controlUiOpenHint,
        ]
          .filter(Boolean)
          .join("\n"),
        "Dashboard pronto",
      );
    } else {
      await prompter.note(
        `Quando estiver pronto: ${formatCliCommand("opencraft dashboard --no-open")}`,
        "Depois",
      );
    }
  } else if (opts.skipUi) {
    await prompter.note("Pulando prompts da Interface de Controle/TUI.", "Interface de Controle");
  }

  await prompter.note(
    [
      "Faça backup do workspace do seu agente.",
      "Docs: https://docs.opencraft.ai/concepts/agent-workspace",
    ].join("\n"),
    "Backup do workspace",
  );

  await prompter.note(
    "Executar agentes no seu computador é arriscado — proteja sua configuração: https://docs.opencraft.ai/security",
    "Segurança",
  );

  await setupOnboardingShellCompletion({ flow, prompter });

  const shouldOpenControlUi =
    !opts.skipUi &&
    settings.authMode === "token" &&
    Boolean(settings.gatewayToken) &&
    hatchChoice === null;
  if (shouldOpenControlUi) {
    const browserSupport = await detectBrowserOpenSupport();
    if (browserSupport.ok) {
      controlUiOpened = await openUrl(authedUrl);
      if (!controlUiOpened) {
        controlUiOpenHint = formatControlUiSshHint({
          port: settings.port,
          basePath: controlUiBasePath,
          token: settings.gatewayToken,
        });
      }
    } else {
      controlUiOpenHint = formatControlUiSshHint({
        port: settings.port,
        basePath: controlUiBasePath,
        token: settings.gatewayToken,
      });
    }

    await prompter.note(
      [
        `Link do dashboard (com token): ${authedUrl}`,
        controlUiOpened
          ? "Aberto no seu navegador. Mantenha essa aba para controlar o OpenCraft."
          : "Copie/cole esta URL em um navegador nesta máquina para controlar o OpenCraft.",
        controlUiOpenHint,
      ]
        .filter(Boolean)
        .join("\n"),
      "Dashboard pronto",
    );
  }

  const webSearchProvider = nextConfig.tools?.web?.search?.provider;
  const webSearchEnabled = nextConfig.tools?.web?.search?.enabled;
  if (webSearchProvider) {
    const { SEARCH_PROVIDER_OPTIONS, resolveExistingKey, hasExistingKey, hasKeyInEnv } =
      await import("../commands/onboard-search.js");
    const entry = SEARCH_PROVIDER_OPTIONS.find((e) => e.value === webSearchProvider);
    const label = entry?.label ?? webSearchProvider;
    const storedKey = resolveExistingKey(nextConfig, webSearchProvider);
    const keyConfigured = hasExistingKey(nextConfig, webSearchProvider);
    const envAvailable = entry ? hasKeyInEnv(entry) : false;
    const hasKey = keyConfigured || envAvailable;
    const keySource = storedKey
      ? "Chave de API: armazenada na configuração."
      : keyConfigured
        ? "Chave de API: configurada via referência de secret."
        : envAvailable
          ? `Chave de API: fornecida via variável de ambiente ${entry?.envKeys.join(" / ")}.`
          : undefined;
    if (webSearchEnabled !== false && hasKey) {
      await prompter.note(
        [
          "A busca na web está ativada, então seu agente pode pesquisar online quando necessário.",
          "",
          `Provedor: ${label}`,
          ...(keySource ? [keySource] : []),
          "Docs: https://docs.opencraft.ai/tools/web",
        ].join("\n"),
        "Busca na web",
      );
    } else if (!hasKey) {
      await prompter.note(
        [
          `O provedor ${label} está selecionado mas nenhuma chave de API foi encontrada.`,
          "web_search não funcionará até que uma chave seja adicionada.",
          `  ${formatCliCommand("opencraft configure --section web")}`,
          "",
          `Obtenha sua chave em: ${entry?.signupUrl ?? "https://docs.opencraft.ai/tools/web"}`,
          "Docs: https://docs.opencraft.ai/tools/web",
        ].join("\n"),
        "Busca na web",
      );
    } else {
      await prompter.note(
        [
          `Busca na web (${label}) está configurada mas desativada.`,
          `Reativar: ${formatCliCommand("opencraft configure --section web")}`,
          "",
          "Docs: https://docs.opencraft.ai/tools/web",
        ].join("\n"),
        "Busca na web",
      );
    }
  } else {
    // Legacy configs may have a working key (e.g. apiKey or BRAVE_API_KEY) without
    // an explicit provider. Runtime auto-detects these, so avoid saying "skipped".
    const { SEARCH_PROVIDER_OPTIONS, hasExistingKey, hasKeyInEnv } =
      await import("../commands/onboard-search.js");
    const legacyDetected = SEARCH_PROVIDER_OPTIONS.find(
      (e) => hasExistingKey(nextConfig, e.value) || hasKeyInEnv(e),
    );
    if (legacyDetected) {
      await prompter.note(
        [
          `Busca na web disponível via ${legacyDetected.label} (detectada automaticamente).`,
          "Docs: https://docs.opencraft.ai/tools/web",
        ].join("\n"),
        "Busca na web",
      );
    } else {
      await prompter.note(
        [
          "Busca na web foi pulada. Você pode ativá-la depois:",
          `  ${formatCliCommand("opencraft configure --section web")}`,
          "",
          "Docs: https://docs.opencraft.ai/tools/web",
        ].join("\n"),
        "Busca na web",
      );
    }
  }

  await prompter.note(
    'O que fazer agora: https://opencraft.ai/showcase ("O Que as Pessoas Estão Construindo").',
    "E agora",
  );

  await prompter.outro(
    controlUiOpened
      ? "Configuração concluída. Dashboard aberto; mantenha essa aba para controlar o OpenCraft."
      : seededInBackground
        ? "Configuração concluída. Interface web iniciada em segundo plano; abra-a a qualquer momento com o link do dashboard acima."
        : "Configuração concluída. Use o link do dashboard acima para controlar o OpenCraft.",
  );

  return { launchedTui };
}
