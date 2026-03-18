import { createPluginRuntimeStore } from "opencraft/plugin-sdk/runtime-store";
import type { PluginRuntime } from "opencraft/plugin-sdk/twitch";

const { setRuntime: setTwitchRuntime, getRuntime: getTwitchRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Twitch runtime not initialized");
export { getTwitchRuntime, setTwitchRuntime };
