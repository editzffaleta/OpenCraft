import { emptyPluginConfigSchema, type OpenCraftPluginApi } from "opencraft/plugin-sdk/core";
import { buildMicrosoftSpeechProvider } from "../../src/tts/providers/microsoft.js";

const microsoftPlugin = {
  id: "microsoft",
  name: "Microsoft Speech",
  description: "Bundled Microsoft speech provider",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenCraftPluginApi) {
    api.registerSpeechProvider(buildMicrosoftSpeechProvider());
  },
};

export default microsoftPlugin;
