import { emptyPluginConfigSchema, type OpenCraftPluginApi } from "opencraft/plugin-sdk/core";
import { buildOpenAISpeechProvider } from "../../src/tts/providers/openai.js";
import { buildOpenAICodexProviderPlugin } from "./openai-codex-provider.js";
import { buildOpenAIProvider } from "./openai-provider.js";

const openAIPlugin = {
  id: "openai",
  name: "OpenAI Provider",
  description: "Bundled OpenAI provider plugins",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenCraftPluginApi) {
    api.registerProvider(buildOpenAIProvider());
    api.registerProvider(buildOpenAICodexProviderPlugin());
    api.registerSpeechProvider(buildOpenAISpeechProvider());
  },
};

export default openAIPlugin;
