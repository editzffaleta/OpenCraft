import type { OpenCraftConfig } from "../../config/config.js";

export function createPerSenderSessionConfig(
  overrides: Partial<NonNullable<OpenCraftConfig["session"]>> = {},
): NonNullable<OpenCraftConfig["session"]> {
  return {
    mainKey: "main",
    scope: "per-sender",
    ...overrides,
  };
}
