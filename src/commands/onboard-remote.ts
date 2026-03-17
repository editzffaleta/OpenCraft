import type { OpenCraftConfig } from "../config/config.js";
import type { SecretInput } from "../config/types.secrets.js";
import { isSecureWebSocketUrl } from "../gateway/net.js";
import type { GatewayBonjourBeacon } from "../infra/bonjour-discovery.js";
import { discoverGatewayBeacons } from "../infra/bonjour-discovery.js";
import { resolveWideAreaDiscoveryDomain } from "../infra/widearea-dns.js";
import type { WizardPrompter } from "../wizard/prompts.js";
import {
  promptSecretRefForSetup,
  resolveSecretInputModeForEnvSelection,
} from "./auth-choice.apply-helpers.js";
import { detectBinary } from "./onboard-helpers.js";
import type { SecretInputMode } from "./onboard-types.js";

const DEFAULT_GATEWAY_URL = "ws://127.0.0.1:18789";

function pickHost(beacon: GatewayBonjourBeacon): string | undefined {
  // Security: TXT is unauthenticated. Prefer the resolved service endpoint host.
  return beacon.host || beacon.tailnetDns || beacon.lanHost;
}

function buildLabel(beacon: GatewayBonjourBeacon): string {
  const host = pickHost(beacon);
  // Security: Prefer the resolved service endpoint port.
  const port = beacon.port ?? beacon.gatewayPort ?? 18789;
  const title = beacon.displayName ?? beacon.instanceName;
  const hint = host ? `${host}:${port}` : "host unknown";
  return `${title} (${hint})`;
}

function ensureWsUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_GATEWAY_URL;
  }
  return trimmed;
}

function validateGatewayWebSocketUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed.startsWith("ws://") && !trimmed.startsWith("wss://")) {
    return "A URL deve começar com ws:// ou wss://";
  }
  if (
    !isSecureWebSocketUrl(trimmed, {
      allowPrivateWs: process.env.OPENCRAFT_ALLOW_INSECURE_PRIVATE_WS === "1",
    })
  ) {
    return (
      "Use wss:// para hosts remotos, ou ws://127.0.0.1/localhost via Túnel SSH. " +
      "Break-glass: OPENCRAFT_ALLOW_INSECURE_PRIVATE_WS=1 para redes privadas confiáveis."
    );
  }
  return undefined;
}

export async function promptRemoteGatewayConfig(
  cfg: OpenCraftConfig,
  prompter: WizardPrompter,
  options?: { secretInputMode?: SecretInputMode },
): Promise<OpenCraftConfig> {
  let selectedBeacon: GatewayBonjourBeacon | null = null;
  let suggestedUrl = cfg.gateway?.remote?.url ?? DEFAULT_GATEWAY_URL;

  const hasBonjourTool = (await detectBinary("dns-sd")) || (await detectBinary("avahi-browse"));
  const wantsDiscover = hasBonjourTool
    ? await prompter.confirm({
        message: "Descobrir gateway na LAN (Bonjour)?",
        initialValue: true,
      })
    : false;

  if (!hasBonjourTool) {
    await prompter.note(
      [
        "A descoberta Bonjour requer dns-sd (macOS) ou avahi-browse (Linux).",
        "Docs: https://docs.opencraft.ai/gateway/discovery",
      ].join("\n"),
      "Descoberta",
    );
  }

  if (wantsDiscover) {
    const wideAreaDomain = resolveWideAreaDiscoveryDomain({
      configDomain: cfg.discovery?.wideArea?.domain,
    });
    const spin = prompter.progress("Procurando gateways…");
    const beacons = await discoverGatewayBeacons({ timeoutMs: 2000, wideAreaDomain });
    spin.stop(
      beacons.length > 0
        ? `Encontrado(s) ${beacons.length} gateway(s)`
        : "Nenhum gateway encontrado",
    );

    if (beacons.length > 0) {
      const selection = await prompter.select({
        message: "Selecionar gateway",
        options: [
          ...beacons.map((beacon, index) => ({
            value: String(index),
            label: buildLabel(beacon),
          })),
          { value: "manual", label: "Inserir URL manualmente" },
        ],
      });
      if (selection !== "manual") {
        const idx = Number.parseInt(String(selection), 10);
        selectedBeacon = Number.isFinite(idx) ? (beacons[idx] ?? null) : null;
      }
    }
  }

  if (selectedBeacon) {
    const host = pickHost(selectedBeacon);
    const port = selectedBeacon.port ?? selectedBeacon.gatewayPort ?? 18789;
    if (host) {
      const mode = await prompter.select({
        message: "Método de conexão",
        options: [
          {
            value: "direct",
            label: `WebSocket direto do gateway (${host}:${port})`,
          },
          { value: "ssh", label: "Túnel SSH (loopback)" },
        ],
      });
      if (mode === "direct") {
        suggestedUrl = `wss://${host}:${port}`;
        await prompter.note(
          [
            "O acesso remoto direto usa TLS por padrão.",
            `Usando: ${suggestedUrl}`,
            "Se seu gateway é apenas loopback, escolha Túnel SSH e mantenha ws://127.0.0.1:18789.",
          ].join("\n"),
          "Remoto direto",
        );
      } else {
        suggestedUrl = DEFAULT_GATEWAY_URL;
        await prompter.note(
          [
            "Inicie um túnel antes de usar o CLI:",
            `ssh -N -L 18789:127.0.0.1:18789 <user>@${host}${
              selectedBeacon.sshPort ? ` -p ${selectedBeacon.sshPort}` : ""
            }`,
            "Docs: https://docs.opencraft.ai/gateway/remote",
          ].join("\n"),
          "Túnel SSH",
        );
      }
    }
  }

  const urlInput = await prompter.text({
    message: "URL WebSocket do gateway",
    initialValue: suggestedUrl,
    validate: (value) => validateGatewayWebSocketUrl(String(value)),
  });
  const url = ensureWsUrl(String(urlInput));

  const authChoice = await prompter.select({
    message: "Autenticação do gateway",
    options: [
      { value: "token", label: "Token (recomendado)" },
      { value: "password", label: "Senha" },
      { value: "off", label: "Sem autenticação" },
    ],
  });

  let token: SecretInput | undefined = cfg.gateway?.remote?.token;
  let password: SecretInput | undefined = cfg.gateway?.remote?.password;
  if (authChoice === "token") {
    const selectedMode = await resolveSecretInputModeForEnvSelection({
      prompter,
      explicitMode: options?.secretInputMode,
      copy: {
        modeMessage: "Como você quer fornecer este token do gateway?",
        plaintextLabel: "Inserir token agora",
        plaintextHint: "Armazena o token diretamente na configuração do OpenCraft",
      },
    });
    if (selectedMode === "ref") {
      const resolved = await promptSecretRefForSetup({
        provider: "gateway-remote-token",
        config: cfg,
        prompter,
        preferredEnvVar: "OPENCLAW_GATEWAY_TOKEN",
        copy: {
          sourceMessage: "Onde este token do gateway está armazenado?",
          envVarPlaceholder: "OPENCLAW_GATEWAY_TOKEN",
        },
      });
      token = resolved.ref;
    } else {
      token = String(
        await prompter.text({
          message: "Token do gateway",
          initialValue: typeof token === "string" ? token : undefined,
          validate: (value) => (value?.trim() ? undefined : "Obrigatório"),
        }),
      ).trim();
    }
    password = undefined;
  } else if (authChoice === "password") {
    const selectedMode = await resolveSecretInputModeForEnvSelection({
      prompter,
      explicitMode: options?.secretInputMode,
      copy: {
        modeMessage: "Como você quer fornecer esta senha do gateway?",
        plaintextLabel: "Inserir senha agora",
        plaintextHint: "Armazena a senha diretamente na configuração do OpenCraft",
      },
    });
    if (selectedMode === "ref") {
      const resolved = await promptSecretRefForSetup({
        provider: "gateway-remote-password",
        config: cfg,
        prompter,
        preferredEnvVar: "OPENCLAW_GATEWAY_PASSWORD",
        copy: {
          sourceMessage: "Onde esta senha do gateway está armazenada?",
          envVarPlaceholder: "OPENCLAW_GATEWAY_PASSWORD",
        },
      });
      password = resolved.ref;
    } else {
      password = String(
        await prompter.text({
          message: "Senha do gateway",
          initialValue: typeof password === "string" ? password : undefined,
          validate: (value) => (value?.trim() ? undefined : "Obrigatório"),
        }),
      ).trim();
    }
    token = undefined;
  } else {
    token = undefined;
    password = undefined;
  }

  return {
    ...cfg,
    gateway: {
      ...cfg.gateway,
      mode: "remote",
      remote: {
        url,
        ...(token !== undefined ? { token } : {}),
        ...(password !== undefined ? { password } : {}),
      },
    },
  };
}
