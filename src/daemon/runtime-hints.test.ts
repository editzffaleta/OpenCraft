import { describe, expect, it } from "vitest";
import { buildPlatformRuntimeLogHints, buildPlatformServiceStartHints } from "./runtime-hints.js";

describe("buildPlatformRuntimeLogHints", () => {
  it("renders launchd log hints on darwin", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "darwin",
        env: {
          OPENCRAFT_STATE_DIR: "/tmp/opencraft-state",
          OPENCRAFT_LOG_PREFIX: "gateway",
        },
        systemdServiceName: "opencraft-gateway",
        windowsTaskName: "OpenCraft Gateway",
      }),
    ).toEqual([
      "Launchd stdout (if installed): /tmp/opencraft-state/logs/gateway.log",
      "Launchd stderr (if installed): /tmp/opencraft-state/logs/gateway.err.log",
    ]);
  });

  it("renders systemd and windows hints by platform", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "linux",
        systemdServiceName: "opencraft-gateway",
        windowsTaskName: "OpenCraft Gateway",
      }),
    ).toEqual(["Logs: journalctl --user -u opencraft-gateway.service -n 200 --no-pager"]);
    expect(
      buildPlatformRuntimeLogHints({
        platform: "win32",
        systemdServiceName: "opencraft-gateway",
        windowsTaskName: "OpenCraft Gateway",
      }),
    ).toEqual(['Logs: schtasks /Query /TN "OpenCraft Gateway" /V /FO LIST']);
  });
});

describe("buildPlatformServiceStartHints", () => {
  it("builds platform-specific service start hints", () => {
    expect(
      buildPlatformServiceStartHints({
        platform: "darwin",
        installCommand: "opencraft gateway install",
        startCommand: "opencraft gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.opencraft.gateway.plist",
        systemdServiceName: "opencraft-gateway",
        windowsTaskName: "OpenCraft Gateway",
      }),
    ).toEqual([
      "opencraft gateway install",
      "opencraft gateway",
      "launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.opencraft.gateway.plist",
    ]);
    expect(
      buildPlatformServiceStartHints({
        platform: "linux",
        installCommand: "opencraft gateway install",
        startCommand: "opencraft gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.opencraft.gateway.plist",
        systemdServiceName: "opencraft-gateway",
        windowsTaskName: "OpenCraft Gateway",
      }),
    ).toEqual([
      "opencraft gateway install",
      "opencraft gateway",
      "systemctl --user start opencraft-gateway.service",
    ]);
  });
});
