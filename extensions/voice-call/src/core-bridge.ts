import type { OpenCraftPluginApi } from "opencraft/plugin-sdk/voice-call";
import type { VoiceCallTtsConfig } from "./config.js";

export type CoreConfig = {
  session?: {
    store?: string;
  };
  messages?: {
    tts?: VoiceCallTtsConfig;
  };
  [key: string]: unknown;
};

export type CoreAgentDeps = OpenCraftPluginApi["runtime"]["agent"];
