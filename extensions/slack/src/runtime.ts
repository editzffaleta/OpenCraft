import type { PluginRuntime } from "opencraft/plugin-sdk/core";
import { createPluginRuntimeStore } from "opencraft/plugin-sdk/runtime-store";

const { setRuntime: setSlackRuntime, getRuntime: getSlackRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Slack runtime not initialized");
export { getSlackRuntime, setSlackRuntime };
