import type { OpenCraftConfig } from "../../config/config.js";
import type { RuntimeWebSearchMetadata } from "../../secrets/runtime-web-tools.types.js";
import { __testing as runtimeTesting } from "../../web-search/runtime.js";
import type { AnyAgentTool } from "./common.js";
import {
  __testing as coreTesting,
  createWebSearchTool as createWebSearchToolCore,
} from "./web-search-core.js";

export function createWebSearchTool(options?: {
  config?: OpenCraftConfig;
  sandboxed?: boolean;
  runtimeWebSearch?: RuntimeWebSearchMetadata;
}): AnyAgentTool | null {
  return createWebSearchToolCore(options);
}

export const __testing = {
  ...coreTesting,
  resolveSearchProvider: (
    search?: OpenCraftConfig["tools"] extends infer Tools
      ? Tools extends { web?: infer Web }
        ? Web extends { search?: infer Search }
          ? Search
          : undefined
        : undefined
      : undefined,
  ) => runtimeTesting.resolveWebSearchProviderId({ search }),
};
