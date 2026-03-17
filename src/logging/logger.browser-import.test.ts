import { afterEach, describe, expect, it, vi } from "vitest";

type LoggerModule = typeof import("./logger.js");

const originalGetBuiltinModule = (
  process as NodeJS.Process & { getBuiltinModule?: (id: string) => unknown }
).getBuiltinModule;

async function importBrowserSafeLogger(params?: {
  resolvePreferredOpenCraftTmpDir?: ReturnType<typeof vi.fn>;
}): Promise<{
  module: LoggerModule;
  resolvePreferredOpenCraftTmpDir: ReturnType<typeof vi.fn>;
}> {
  vi.resetModules();
  const resolvePreferredOpenCraftTmpDir =
    params?.resolvePreferredOpenCraftTmpDir ??
    vi.fn(() => {
      throw new Error("resolvePreferredOpenCraftTmpDir should not run during browser-safe import");
    });

  vi.doMock("../infra/tmp-opencraft-dir.js", async () => {
    const actual = await vi.importActual<typeof import("../infra/tmp-opencraft-dir.js")>(
      "../infra/tmp-opencraft-dir.js",
    );
    return {
      ...actual,
      resolvePreferredOpenCraftTmpDir,
    };
  });

  Object.defineProperty(process, "getBuiltinModule", {
    configurable: true,
    value: undefined,
  });

  const module = await import("./logger.js");
  return { module, resolvePreferredOpenCraftTmpDir };
}

describe("logging/logger browser-safe import", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("../infra/tmp-opencraft-dir.js");
    Object.defineProperty(process, "getBuiltinModule", {
      configurable: true,
      value: originalGetBuiltinModule,
    });
  });

  it("does not resolve the preferred temp dir at import time when node fs is unavailable", async () => {
    const { module, resolvePreferredOpenCraftTmpDir } = await importBrowserSafeLogger();

    expect(resolvePreferredOpenCraftTmpDir).not.toHaveBeenCalled();
    expect(module.DEFAULT_LOG_DIR).toBe("/tmp/opencraft");
    expect(module.DEFAULT_LOG_FILE).toBe("/tmp/opencraft/opencraft.log");
  });

  it("disables file logging when imported in a browser-like environment", async () => {
    const { module, resolvePreferredOpenCraftTmpDir } = await importBrowserSafeLogger();

    expect(module.getResolvedLoggerSettings()).toMatchObject({
      level: "silent",
      file: "/tmp/opencraft/opencraft.log",
    });
    expect(module.isFileLogLevelEnabled("info")).toBe(false);
    expect(() => module.getLogger().info("browser-safe")).not.toThrow();
    expect(resolvePreferredOpenCraftTmpDir).not.toHaveBeenCalled();
  });
});
