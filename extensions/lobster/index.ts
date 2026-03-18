import {
  definePluginEntry,
  type AnyAgentTool,
  type OpenCraftPluginApi,
  type OpenCraftPluginToolFactory,
} from "opencraft/plugin-sdk/lobster";
import { createLobsterTool } from "./src/lobster-tool.js";

export default definePluginEntry({
  id: "lobster",
  name: "Lobster",
  description: "Optional local shell helper tools",
  register(api: OpenCraftPluginApi) {
    api.registerTool(
      ((ctx) => {
        if (ctx.sandboxed) {
          return null;
        }
        return createLobsterTool(api) as AnyAgentTool;
      }) as OpenCraftPluginToolFactory,
      { optional: true },
    );
  },
});
