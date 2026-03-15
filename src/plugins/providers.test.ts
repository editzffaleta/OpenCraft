import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolvePluginProviders } from "./providers.js";

const loadOpenCraftPluginsMock = vi.fn();

vi.mock("./loader.js", () => ({
  loadOpenCraftPlugins: (...args: unknown[]) => loadOpenCraftPluginsMock(...args),
}));

describe("resolvePluginProviders", () => {
  beforeEach(() => {
    loadOpenCraftPluginsMock.mockReset();
    loadOpenCraftPluginsMock.mockReturnValue({
      providers: [{ provider: { id: "demo-provider" } }],
    });
  });

  it("forwards an explicit env to plugin loading", () => {
    const env = { OPENCRAFT_HOME: "/srv/opencraft-home" } as NodeJS.ProcessEnv;

    const providers = resolvePluginProviders({
      workspaceDir: "/workspace/explicit",
      env,
    });

    expect(providers).toEqual([{ id: "demo-provider" }]);
    expect(loadOpenCraftPluginsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceDir: "/workspace/explicit",
        env,
      }),
    );
  });
});
