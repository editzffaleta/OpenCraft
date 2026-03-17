import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { withTempDir } from "../test-helpers/temp-dir.js";
import {
  resolveDefaultConfigCandidates,
  resolveConfigPathCandidate,
  resolveConfigPath,
  resolveOAuthDir,
  resolveOAuthPath,
  resolveStateDir,
} from "./paths.js";

describe("oauth paths", () => {
  it("prefers OPENCRAFT_OAUTH_DIR over OPENCRAFT_STATE_DIR", () => {
    const env = {
      OPENCRAFT_OAUTH_DIR: "/custom/oauth",
      OPENCRAFT_STATE_DIR: "/custom/state",
    } as NodeJS.ProcessEnv;

    expect(resolveOAuthDir(env, "/custom/state")).toBe(path.resolve("/custom/oauth"));
    expect(resolveOAuthPath(env, "/custom/state")).toBe(
      path.join(path.resolve("/custom/oauth"), "oauth.json"),
    );
  });

  it("derives oauth path from OPENCRAFT_STATE_DIR when unset", () => {
    const env = {
      OPENCRAFT_STATE_DIR: "/custom/state",
    } as NodeJS.ProcessEnv;

    expect(resolveOAuthDir(env, "/custom/state")).toBe(path.join("/custom/state", "credentials"));
    expect(resolveOAuthPath(env, "/custom/state")).toBe(
      path.join("/custom/state", "credentials", "oauth.json"),
    );
  });
});

describe("state + config path candidates", () => {
  function expectOpenCraftHomeDefaults(env: NodeJS.ProcessEnv): void {
    const configuredHome = env.OPENCRAFT_HOME;
    if (!configuredHome) {
      throw new Error("OPENCRAFT_HOME must be set for this assertion helper");
    }
    const resolvedHome = path.resolve(configuredHome);
    expect(resolveStateDir(env)).toBe(path.join(resolvedHome, ".opencraft"));

    const candidates = resolveDefaultConfigCandidates(env);
    expect(candidates[0]).toBe(path.join(resolvedHome, ".opencraft", "opencraft.json"));
  }

  it("uses OPENCRAFT_STATE_DIR when set", () => {
    const env = {
      OPENCRAFT_STATE_DIR: "/new/state",
    } as NodeJS.ProcessEnv;

    expect(resolveStateDir(env, () => "/home/test")).toBe(path.resolve("/new/state"));
  });

  it("uses OPENCRAFT_HOME for default state/config locations", () => {
    const env = {
      OPENCRAFT_HOME: "/srv/opencraft-home",
    } as NodeJS.ProcessEnv;
    expectOpenCraftHomeDefaults(env);
  });

  it("prefers OPENCRAFT_HOME over HOME for default state/config locations", () => {
    const env = {
      OPENCRAFT_HOME: "/srv/opencraft-home",
      HOME: "/home/other",
    } as NodeJS.ProcessEnv;
    expectOpenCraftHomeDefaults(env);
  });

  it("orders default config candidates in a stable order", () => {
    const home = "/home/test";
    const resolvedHome = path.resolve(home);
    const candidates = resolveDefaultConfigCandidates({} as NodeJS.ProcessEnv, () => home);
    const expected = [
      path.join(resolvedHome, ".opencraft", "opencraft.json"),
      path.join(resolvedHome, ".opencraft", "clawdbot.json"),
      path.join(resolvedHome, ".opencraft", "moldbot.json"),
      path.join(resolvedHome, ".opencraft", "moltbot.json"),
      path.join(resolvedHome, ".clawdbot", "opencraft.json"),
      path.join(resolvedHome, ".clawdbot", "clawdbot.json"),
      path.join(resolvedHome, ".clawdbot", "moldbot.json"),
      path.join(resolvedHome, ".clawdbot", "moltbot.json"),
      path.join(resolvedHome, ".moldbot", "opencraft.json"),
      path.join(resolvedHome, ".moldbot", "clawdbot.json"),
      path.join(resolvedHome, ".moldbot", "moldbot.json"),
      path.join(resolvedHome, ".moldbot", "moltbot.json"),
      path.join(resolvedHome, ".moltbot", "opencraft.json"),
      path.join(resolvedHome, ".moltbot", "clawdbot.json"),
      path.join(resolvedHome, ".moltbot", "moldbot.json"),
      path.join(resolvedHome, ".moltbot", "moltbot.json"),
    ];
    expect(candidates).toEqual(expected);
  });

  it("prefers ~/.opencraft when it exists and legacy dir is missing", async () => {
    await withTempDir({ prefix: "opencraft-state-" }, async (root) => {
      const newDir = path.join(root, ".opencraft");
      await fs.mkdir(newDir, { recursive: true });
      const resolved = resolveStateDir({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(newDir);
    });
  });

  it("falls back to existing legacy state dir when ~/.opencraft is missing", async () => {
    await withTempDir({ prefix: "opencraft-state-legacy-" }, async (root) => {
      const legacyDir = path.join(root, ".clawdbot");
      await fs.mkdir(legacyDir, { recursive: true });
      const resolved = resolveStateDir({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(legacyDir);
    });
  });

  it("CONFIG_PATH prefers existing config when present", async () => {
    await withTempDir({ prefix: "opencraft-config-" }, async (root) => {
      const legacyDir = path.join(root, ".opencraft");
      await fs.mkdir(legacyDir, { recursive: true });
      const legacyPath = path.join(legacyDir, "opencraft.json");
      await fs.writeFile(legacyPath, "{}", "utf-8");

      const resolved = resolveConfigPathCandidate({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(legacyPath);
    });
  });

  it("respects state dir overrides when config is missing", async () => {
    await withTempDir({ prefix: "opencraft-config-override-" }, async (root) => {
      const legacyDir = path.join(root, ".opencraft");
      await fs.mkdir(legacyDir, { recursive: true });
      const legacyConfig = path.join(legacyDir, "opencraft.json");
      await fs.writeFile(legacyConfig, "{}", "utf-8");

      const overrideDir = path.join(root, "override");
      const env = { OPENCRAFT_STATE_DIR: overrideDir } as NodeJS.ProcessEnv;
      const resolved = resolveConfigPath(env, overrideDir, () => root);
      expect(resolved).toBe(path.join(overrideDir, "opencraft.json"));
    });
  });
});
