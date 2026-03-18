import { createPluginRuntimeStore } from "opencraft/plugin-sdk/runtime-store";
import type { PluginRuntime } from "opencraft/plugin-sdk/zalo";

const { setRuntime: setZaloRuntime, getRuntime: getZaloRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Zalo runtime not initialized");
export { getZaloRuntime, setZaloRuntime };
