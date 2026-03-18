import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OpenCraftConfig } from "../config/config.js";
import * as imageGenerationRuntime from "../image-generation/runtime.js";
import { createOpenCraftTools } from "./opencraft-tools.js";

vi.mock("../plugins/tools.js", () => ({
  resolvePluginTools: () => [],
}));

function asConfig(value: unknown): OpenCraftConfig {
  return value as OpenCraftConfig;
}

function stubImageGenerationProviders() {
  vi.spyOn(imageGenerationRuntime, "listRuntimeImageGenerationProviders").mockReturnValue([
    {
      id: "openai",
      defaultModel: "gpt-image-1",
      models: ["gpt-image-1"],
      supportedSizes: ["1024x1024"],
      generateImage: vi.fn(async () => {
        throw new Error("not used");
      }),
    },
  ]);
}

describe("opencraft tools image generation registration", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEYS", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEYS", "");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("registers image_generate when image-generation config is present", () => {
    const tools = createOpenCraftTools({
      config: asConfig({
        agents: {
          defaults: {
            imageGenerationModel: {
              primary: "openai/gpt-image-1",
            },
          },
        },
      }),
      agentDir: "/tmp/opencraft-agent-main",
    });

    expect(tools.map((tool) => tool.name)).toContain("image_generate");
  });

  it("registers image_generate when a compatible provider has env-backed auth", () => {
    stubImageGenerationProviders();
    vi.stubEnv("OPENAI_API_KEY", "openai-test");

    const tools = createOpenCraftTools({
      config: asConfig({}),
      agentDir: "/tmp/opencraft-agent-main",
    });

    expect(tools.map((tool) => tool.name)).toContain("image_generate");
  });

  it("omits image_generate when config is absent and no compatible provider auth exists", () => {
    stubImageGenerationProviders();

    const tools = createOpenCraftTools({
      config: asConfig({}),
      agentDir: "/tmp/opencraft-agent-main",
    });

    expect(tools.map((tool) => tool.name)).not.toContain("image_generate");
  });
});
