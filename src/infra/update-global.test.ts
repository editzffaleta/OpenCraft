import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { captureEnv } from "../test-utils/env.js";
import {
  canResolveRegistryVersionForPackageTarget,
  cleanupGlobalRenameDirs,
  detectGlobalInstallManagerByPresence,
  detectGlobalInstallManagerForRoot,
  globalInstallArgs,
  globalInstallFallbackArgs,
  isExplicitPackageInstallSpec,
  isMainPackageTarget,
  OPENCRAFT_MAIN_PACKAGE_SPEC,
  resolveGlobalPackageRoot,
  resolveGlobalInstallSpec,
  resolveGlobalRoot,
  type CommandRunner,
} from "./update-global.js";

describe("update global helpers", () => {
  let envSnapshot: ReturnType<typeof captureEnv> | undefined;

  afterEach(() => {
    envSnapshot?.restore();
    envSnapshot = undefined;
  });

  it("prefers explicit package spec overrides", () => {
    envSnapshot = captureEnv(["OPENCRAFT_UPDATE_PACKAGE_SPEC"]);
    process.env.OPENCRAFT_UPDATE_PACKAGE_SPEC = "file:/tmp/opencraft.tgz";

    expect(resolveGlobalInstallSpec({ packageName: "opencraft", tag: "latest" })).toBe(
      "file:/tmp/opencraft.tgz",
    );
    expect(
      resolveGlobalInstallSpec({
        packageName: "opencraft",
        tag: "beta",
        env: { OPENCRAFT_UPDATE_PACKAGE_SPEC: "opencraft@next" },
      }),
    ).toBe("opencraft@next");
  });

  it("resolves global roots and package roots from runner output", async () => {
    const runCommand: CommandRunner = async (argv) => {
      if (argv[0] === "npm") {
        return { stdout: "/tmp/npm-root\n", stderr: "", code: 0 };
      }
      if (argv[0] === "pnpm") {
        return { stdout: "", stderr: "", code: 1 };
      }
      throw new Error(`unexpected command: ${argv.join(" ")}`);
    };

    await expect(resolveGlobalRoot("npm", runCommand, 1000)).resolves.toBe("/tmp/npm-root");
    await expect(resolveGlobalRoot("pnpm", runCommand, 1000)).resolves.toBeNull();
    await expect(resolveGlobalRoot("bun", runCommand, 1000)).resolves.toContain(
      path.join(".bun", "install", "global", "node_modules"),
    );
    await expect(resolveGlobalPackageRoot("npm", runCommand, 1000)).resolves.toBe(
      path.join("/tmp/npm-root", "opencraft"),
    );
  });

  it("maps main and explicit install specs for global installs", () => {
    expect(resolveGlobalInstallSpec({ packageName: "opencraft", tag: "main" })).toBe(
      OPENCRAFT_MAIN_PACKAGE_SPEC,
    );
    expect(
      resolveGlobalInstallSpec({
        packageName: "opencraft",
        tag: "github:opencraft/opencraft#feature/my-branch",
      }),
    ).toBe("github:opencraft/opencraft#feature/my-branch");
    expect(
      resolveGlobalInstallSpec({
        packageName: "opencraft",
        tag: "https://example.com/opencraft-main.tgz",
      }),
    ).toBe("https://example.com/opencraft-main.tgz");
  });

  it("classifies main and raw install specs separately from registry selectors", () => {
    expect(isMainPackageTarget("main")).toBe(true);
    expect(isMainPackageTarget(" MAIN ")).toBe(true);
    expect(isMainPackageTarget("beta")).toBe(false);

    expect(isExplicitPackageInstallSpec("github:opencraft/opencraft#main")).toBe(true);
    expect(isExplicitPackageInstallSpec("https://example.com/opencraft-main.tgz")).toBe(true);
    expect(isExplicitPackageInstallSpec("file:/tmp/opencraft-main.tgz")).toBe(true);
    expect(isExplicitPackageInstallSpec("beta")).toBe(false);

    expect(canResolveRegistryVersionForPackageTarget("latest")).toBe(true);
    expect(canResolveRegistryVersionForPackageTarget("2026.3.14")).toBe(true);
    expect(canResolveRegistryVersionForPackageTarget("main")).toBe(false);
    expect(canResolveRegistryVersionForPackageTarget("github:opencraft/opencraft#main")).toBe(false);
  });

  it("detects install managers from resolved roots and on-disk presence", async () => {
    const base = await fs.mkdtemp(path.join(os.tmpdir(), "opencraft-update-global-"));
    const npmRoot = path.join(base, "npm-root");
    const pnpmRoot = path.join(base, "pnpm-root");
    const bunRoot = path.join(base, ".bun", "install", "global", "node_modules");
    const pkgRoot = path.join(pnpmRoot, "opencraft");
    await fs.mkdir(pkgRoot, { recursive: true });
    await fs.mkdir(path.join(npmRoot, "opencraft"), { recursive: true });
    await fs.mkdir(path.join(bunRoot, "opencraft"), { recursive: true });

    envSnapshot = captureEnv(["BUN_INSTALL"]);
    process.env.BUN_INSTALL = path.join(base, ".bun");

    const runCommand: CommandRunner = async (argv) => {
      if (argv[0] === "npm") {
        return { stdout: `${npmRoot}\n`, stderr: "", code: 0 };
      }
      if (argv[0] === "pnpm") {
        return { stdout: `${pnpmRoot}\n`, stderr: "", code: 0 };
      }
      throw new Error(`unexpected command: ${argv.join(" ")}`);
    };

    await expect(detectGlobalInstallManagerForRoot(runCommand, pkgRoot, 1000)).resolves.toBe(
      "pnpm",
    );
    await expect(detectGlobalInstallManagerByPresence(runCommand, 1000)).resolves.toBe("npm");

    await fs.rm(path.join(npmRoot, "opencraft"), { recursive: true, force: true });
    await fs.rm(path.join(pnpmRoot, "opencraft"), { recursive: true, force: true });
    await expect(detectGlobalInstallManagerByPresence(runCommand, 1000)).resolves.toBe("bun");
  });

  it("builds install argv and npm fallback argv", () => {
    expect(globalInstallArgs("npm", "opencraft@latest")).toEqual([
      "npm",
      "i",
      "-g",
      "opencraft@latest",
      "--no-fund",
      "--no-audit",
      "--loglevel=error",
    ]);
    expect(globalInstallArgs("pnpm", "opencraft@latest")).toEqual([
      "pnpm",
      "add",
      "-g",
      "opencraft@latest",
    ]);
    expect(globalInstallArgs("bun", "opencraft@latest")).toEqual([
      "bun",
      "add",
      "-g",
      "opencraft@latest",
    ]);

    expect(globalInstallFallbackArgs("npm", "opencraft@latest")).toEqual([
      "npm",
      "i",
      "-g",
      "opencraft@latest",
      "--omit=optional",
      "--no-fund",
      "--no-audit",
      "--loglevel=error",
    ]);
    expect(globalInstallFallbackArgs("pnpm", "opencraft@latest")).toBeNull();
  });

  it("cleans only renamed package directories", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "opencraft-update-cleanup-"));
    await fs.mkdir(path.join(root, ".opencraft-123"), { recursive: true });
    await fs.mkdir(path.join(root, ".opencraft-456"), { recursive: true });
    await fs.writeFile(path.join(root, ".opencraft-file"), "nope", "utf8");
    await fs.mkdir(path.join(root, "opencraft"), { recursive: true });

    await expect(
      cleanupGlobalRenameDirs({
        globalRoot: root,
        packageName: "opencraft",
      }),
    ).resolves.toEqual({
      removed: [".opencraft-123", ".opencraft-456"],
    });
    await expect(fs.stat(path.join(root, "opencraft"))).resolves.toBeDefined();
    await expect(fs.stat(path.join(root, ".opencraft-file"))).resolves.toBeDefined();
  });
});
