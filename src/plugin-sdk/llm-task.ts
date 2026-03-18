// Narrow plugin-sdk surface for the bundled llm-task plugin.
// Keep this list additive and scoped to symbols used under extensions/llm-task.

export { definePluginEntry } from "./core.js";
export { resolvePreferredOpenCraftTmpDir } from "../infra/tmp-opencraft-dir.js";
export {
  formatThinkingLevels,
  formatXHighModelHint,
  normalizeThinkLevel,
  supportsXHighThinking,
} from "../auto-reply/thinking.js";
export type { AnyAgentTool, OpenCraftPluginApi } from "../plugins/types.js";
