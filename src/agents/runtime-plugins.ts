import type { OpenCraftConfig } from "../config/config.js";
import { loadOpenCraftPlugins } from "../plugins/loader.js";
import { resolveUserPath } from "../utils.js";

export function ensureRuntimePluginsLoaded(params: {
  config?: OpenCraftConfig;
  workspaceDir?: string | null;
}): void {
  const workspaceDir =
    typeof params.workspaceDir === "string" && params.workspaceDir.trim()
      ? resolveUserPath(params.workspaceDir)
      : undefined;

  loadOpenCraftPlugins({
    config: params.config,
    workspaceDir,
  });
}
