import { emptyPluginConfigSchema, type OpenCraftPluginApi } from "opencraft/plugin-sdk/core";
import { buildElevenLabsSpeechProvider } from "../../src/tts/providers/elevenlabs.js";

const elevenLabsPlugin = {
  id: "elevenlabs",
  name: "ElevenLabs Speech",
  description: "Bundled ElevenLabs speech provider",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenCraftPluginApi) {
    api.registerSpeechProvider(buildElevenLabsSpeechProvider());
  },
};

export default elevenLabsPlugin;
