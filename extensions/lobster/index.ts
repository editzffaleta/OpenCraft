import type {
  AnyAgentTool,
  OpenCraftPluginApi,
  OpenCraftPluginToolFactory,
} from "opencraft/plugin-sdk/lobster";
import { createLobsterTool } from "./src/lobster-tool.js";

export default function register(api: OpenCraftPluginApi) {
  api.registerTool(
    ((ctx) => {
      if (ctx.sandboxed) {
        return null;
      }
      return createLobsterTool(api) as AnyAgentTool;
    }) as OpenCraftPluginToolFactory,
    { optional: true },
  );
}
