import type { OpenCraftPluginApi } from "opencraft/plugin-sdk/googlechat";
import { emptyPluginConfigSchema } from "opencraft/plugin-sdk/googlechat";
import { googlechatPlugin } from "./src/channel.js";
import { setGoogleChatRuntime } from "./src/runtime.js";

const plugin = {
  id: "googlechat",
  name: "Google Chat",
  description: "OpenCraft Google Chat channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenCraftPluginApi) {
    setGoogleChatRuntime(api.runtime);
    api.registerChannel(googlechatPlugin);
  },
};

export default plugin;
