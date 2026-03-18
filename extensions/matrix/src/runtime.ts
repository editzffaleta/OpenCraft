import type { PluginRuntime } from "opencraft/plugin-sdk/matrix";
import { createPluginRuntimeStore } from "opencraft/plugin-sdk/runtime-store";

const { setRuntime: setMatrixRuntime, getRuntime: getMatrixRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Matrix runtime not initialized");
export { getMatrixRuntime, setMatrixRuntime };
