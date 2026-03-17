// Narrow plugin-sdk surface for the bundled diffs plugin.
// Keep this list additive and scoped to symbols used under extensions/diffs.

export type { OpenCraftConfig } from "../config/config.js";
export { resolvePreferredOpenCraftTmpDir } from "../infra/tmp-opencraft-dir.js";
export type {
  AnyAgentTool,
  OpenCraftPluginApi,
  OpenCraftPluginConfigSchema,
  PluginLogger,
} from "../plugins/types.js";
