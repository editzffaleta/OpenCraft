import { withProgress } from "../cli/progress.js";
import { loadConfig } from "../config/config.js";
import { describeGatewayServiceRestart, resolveGatewayService } from "../daemon/service.js";
import { isNonFatalSystemdInstallProbeError } from "../daemon/systemd.js";
import type { RuntimeEnv } from "../runtime.js";
import { note } from "../terminal/note.js";
import { confirm, select } from "./configure.shared.js";
import { buildGatewayInstallPlan, gatewayInstallErrorHint } from "./daemon-install-helpers.js";
import {
  DEFAULT_GATEWAY_DAEMON_RUNTIME,
  GATEWAY_DAEMON_RUNTIME_OPTIONS,
  type GatewayDaemonRuntime,
} from "./daemon-runtime.js";
import { resolveGatewayInstallToken } from "./gateway-install-token.js";
import { guardCancel } from "./onboard-helpers.js";
import { ensureSystemdUserLingerInteractive } from "./systemd-linger.js";

export async function maybeInstallDaemon(params: {
  runtime: RuntimeEnv;
  port: number;
  daemonRuntime?: GatewayDaemonRuntime;
}) {
  const service = resolveGatewayService();
  let loaded = false;
  try {
    loaded = await service.isLoaded({ env: process.env });
  } catch (error) {
    if (!isNonFatalSystemdInstallProbeError(error)) {
      throw error;
    }
    loaded = false;
  }
  let shouldCheckLinger = false;
  let shouldInstall = true;
  let daemonRuntime = params.daemonRuntime ?? DEFAULT_GATEWAY_DAEMON_RUNTIME;
  if (loaded) {
    const action = guardCancel(
      await select({
        message: "Serviço do Gateway já instalado",
        options: [
          { value: "restart", label: "Reiniciar" },
          { value: "reinstall", label: "Reinstalar" },
          { value: "skip", label: "Pular" },
        ],
      }),
      params.runtime,
    );
    if (action === "restart") {
      await withProgress(
        { label: "Gateway service", indeterminate: true, delayMs: 0 },
        async (progress) => {
          progress.setLabel("Reiniciando o serviço do Gateway…");
          const restartResult = await service.restart({
            env: process.env,
            stdout: process.stdout,
          });
          progress.setLabel(
            describeGatewayServiceRestart("Gateway", restartResult).progressMessage,
          );
        },
      );
      shouldCheckLinger = true;
      shouldInstall = false;
    }
    if (action === "skip") {
      return;
    }
    if (action === "reinstall") {
      await withProgress(
        { label: "Gateway service", indeterminate: true, delayMs: 0 },
        async (progress) => {
          progress.setLabel("Desinstalando o serviço do Gateway…");
          await service.uninstall({ env: process.env, stdout: process.stdout });
          progress.setLabel("Serviço do Gateway desinstalado.");
        },
      );
    }
  }

  if (shouldInstall) {
    let installError: string | null = null;
    if (!params.daemonRuntime) {
      if (GATEWAY_DAEMON_RUNTIME_OPTIONS.length === 1) {
        daemonRuntime = GATEWAY_DAEMON_RUNTIME_OPTIONS[0]?.value ?? DEFAULT_GATEWAY_DAEMON_RUNTIME;
      } else {
        daemonRuntime = guardCancel(
          await select({
            message: "Runtime do serviço do Gateway",
            options: GATEWAY_DAEMON_RUNTIME_OPTIONS,
            initialValue: DEFAULT_GATEWAY_DAEMON_RUNTIME,
          }),
          params.runtime,
        ) as GatewayDaemonRuntime;
      }
    }
    await withProgress(
      { label: "Gateway service", indeterminate: true, delayMs: 0 },
      async (progress) => {
        progress.setLabel("Preparando o serviço do Gateway…");

        const cfg = loadConfig();
        const tokenResolution = await resolveGatewayInstallToken({
          config: cfg,
          env: process.env,
        });
        for (const warning of tokenResolution.warnings) {
          note(warning, "Gateway");
        }
        if (tokenResolution.unavailableReason) {
          installError = [
            "Instalação do Gateway bloqueada:",
            tokenResolution.unavailableReason,
            "Corrija a configuração de autenticação do gateway e execute o configure novamente.",
          ].join(" ");
          progress.setLabel("Instalação do serviço do Gateway bloqueada.");
          return;
        }
        const { programArguments, workingDirectory, environment } = await buildGatewayInstallPlan({
          env: process.env,
          port: params.port,
          runtime: daemonRuntime,
          warn: (message, title) => note(message, title),
          config: cfg,
        });

        progress.setLabel("Instalando o serviço do Gateway…");
        try {
          await service.install({
            env: process.env,
            stdout: process.stdout,
            programArguments,
            workingDirectory,
            environment,
          });
          progress.setLabel("Serviço do Gateway instalado.");
        } catch (err) {
          installError = err instanceof Error ? err.message : String(err);
          progress.setLabel("Falha na instalação do serviço do Gateway.");
        }
      },
    );
    if (installError) {
      note("Falha na instalação do serviço do Gateway: " + installError, "Gateway");
      note(gatewayInstallErrorHint(), "Gateway");
      return;
    }
    shouldCheckLinger = true;
  }

  if (shouldCheckLinger) {
    await ensureSystemdUserLingerInteractive({
      runtime: params.runtime,
      prompter: {
        confirm: async (p) => guardCancel(await confirm(p), params.runtime),
        note,
      },
      reason:
        "Linux installs use a systemd user service. Without lingering, systemd stops the user session on logout/idle and kills the Gateway.",
      requireConfirm: true,
    });
  }
}
