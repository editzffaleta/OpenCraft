import { createPluginRuntimeStore } from "opencraft/plugin-sdk/compat";
import type { PluginRuntime } from "opencraft/plugin-sdk/zalo";

const { setRuntime: setZaloRuntime, getRuntime: getZaloRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Zalo runtime not initialized");
export { getZaloRuntime, setZaloRuntime };
