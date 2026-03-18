import type { PluginRuntime } from "opencraft/plugin-sdk/googlechat";
import { createPluginRuntimeStore } from "opencraft/plugin-sdk/runtime-store";

const { setRuntime: setGoogleChatRuntime, getRuntime: getGoogleChatRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Google Chat runtime not initialized");
export { getGoogleChatRuntime, setGoogleChatRuntime };
