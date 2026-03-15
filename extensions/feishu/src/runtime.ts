import { createPluginRuntimeStore } from "opencraft/plugin-sdk/compat";
import type { PluginRuntime } from "opencraft/plugin-sdk/feishu";

const { setRuntime: setFeishuRuntime, getRuntime: getFeishuRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Feishu runtime not initialized");
export { getFeishuRuntime, setFeishuRuntime };
