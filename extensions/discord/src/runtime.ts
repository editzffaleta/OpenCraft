import type { PluginRuntime } from "opencraft/plugin-sdk/core";
import { createPluginRuntimeStore } from "opencraft/plugin-sdk/runtime-store";

const { setRuntime: setDiscordRuntime, getRuntime: getDiscordRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Discord runtime not initialized");
export { getDiscordRuntime, setDiscordRuntime };
