import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "opencraft",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "opencraft", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "opencraft", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "opencraft", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "opencraft", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "opencraft", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "opencraft", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it.each([
    ["--dev first", ["node", "opencraft", "--dev", "--profile", "work", "status"]],
    ["--profile first", ["node", "opencraft", "--profile", "work", "--dev", "status"]],
  ])("rejects combining --dev with --profile (%s)", (_name, argv) => {
    const res = parseCliProfileArgs(argv);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".opencraft-dev");
    expect(env.OPENCRAFT_PROFILE).toBe("dev");
    expect(env.OPENCRAFT_STATE_DIR).toBe(expectedStateDir);
    expect(env.OPENCRAFT_CONFIG_PATH).toBe(path.join(expectedStateDir, "opencraft.json"));
    expect(env.OPENCRAFT_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      OPENCRAFT_STATE_DIR: "/custom",
      OPENCRAFT_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.OPENCRAFT_STATE_DIR).toBe("/custom");
    expect(env.OPENCRAFT_GATEWAY_PORT).toBe("19099");
    expect(env.OPENCRAFT_CONFIG_PATH).toBe(path.join("/custom", "opencraft.json"));
  });

  it("uses OPENCRAFT_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      OPENCRAFT_HOME: "/srv/opencraft-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/opencraft-home");
    expect(env.OPENCRAFT_STATE_DIR).toBe(path.join(resolvedHome, ".opencraft-work"));
    expect(env.OPENCRAFT_CONFIG_PATH).toBe(
      path.join(resolvedHome, ".opencraft-work", "opencraft.json"),
    );
  });
});

describe("formatCliCommand", () => {
  it.each([
    {
      name: "no profile is set",
      cmd: "opencraft doctor --fix",
      env: {},
      expected: "opencraft doctor --fix",
    },
    {
      name: "profile is default",
      cmd: "opencraft doctor --fix",
      env: { OPENCRAFT_PROFILE: "default" },
      expected: "opencraft doctor --fix",
    },
    {
      name: "profile is Default (case-insensitive)",
      cmd: "opencraft doctor --fix",
      env: { OPENCRAFT_PROFILE: "Default" },
      expected: "opencraft doctor --fix",
    },
    {
      name: "profile is invalid",
      cmd: "opencraft doctor --fix",
      env: { OPENCRAFT_PROFILE: "bad profile" },
      expected: "opencraft doctor --fix",
    },
    {
      name: "--profile is already present",
      cmd: "opencraft --profile work doctor --fix",
      env: { OPENCRAFT_PROFILE: "work" },
      expected: "opencraft --profile work doctor --fix",
    },
    {
      name: "--dev is already present",
      cmd: "opencraft --dev doctor",
      env: { OPENCRAFT_PROFILE: "dev" },
      expected: "opencraft --dev doctor",
    },
  ])("returns command unchanged when $name", ({ cmd, env, expected }) => {
    expect(formatCliCommand(cmd, env)).toBe(expected);
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("opencraft doctor --fix", { OPENCRAFT_PROFILE: "work" })).toBe(
      "opencraft --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("opencraft doctor --fix", { OPENCRAFT_PROFILE: "  jbopencraft  " })).toBe(
      "opencraft --profile jbopencraft doctor --fix",
    );
  });

  it("handles command with no args after opencraft", () => {
    expect(formatCliCommand("opencraft", { OPENCRAFT_PROFILE: "test" })).toBe(
      "opencraft --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm opencraft doctor", { OPENCRAFT_PROFILE: "work" })).toBe(
      "pnpm opencraft --profile work doctor",
    );
  });
});
