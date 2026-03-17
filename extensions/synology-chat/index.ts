import type { OpenCraftPluginApi } from "opencraft/plugin-sdk/synology-chat";
import { emptyPluginConfigSchema } from "opencraft/plugin-sdk/synology-chat";
import { synologyChatPlugin } from "./src/channel.js";
import { setSynologyRuntime } from "./src/runtime.js";

const plugin = {
  id: "synology-chat",
  name: "Synology Chat",
  description: "Native Synology Chat channel plugin for OpenCraft",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenCraftPluginApi) {
    setSynologyRuntime(api.runtime);
    api.registerChannel({ plugin: synologyChatPlugin });
  },
};

export default plugin;
