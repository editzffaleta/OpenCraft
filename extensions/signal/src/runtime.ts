import type { PluginRuntime } from "opencraft/plugin-sdk/core";
import { createPluginRuntimeStore } from "opencraft/plugin-sdk/runtime-store";

const { setRuntime: setSignalRuntime, getRuntime: getSignalRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Signal runtime not initialized");
export { getSignalRuntime, setSignalRuntime };
