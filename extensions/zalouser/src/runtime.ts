import { createPluginRuntimeStore } from "opencraft/plugin-sdk/runtime-store";
import type { PluginRuntime } from "opencraft/plugin-sdk/zalouser";

const { setRuntime: setZalouserRuntime, getRuntime: getZalouserRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Zalouser runtime not initialized");
export { getZalouserRuntime, setZalouserRuntime };
