import { definePluginEntry } from "opencraft/plugin-sdk/core";
import { buildMicrosoftSpeechProvider } from "opencraft/plugin-sdk/speech";

export default definePluginEntry({
  id: "microsoft",
  name: "Microsoft Speech",
  description: "Bundled Microsoft speech provider",
  register(api) {
    api.registerSpeechProvider(buildMicrosoftSpeechProvider());
  },
});
