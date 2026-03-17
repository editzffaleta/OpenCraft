import { describe, expect, it } from "vitest";
import { coerceIdentityValue } from "./assistant-identity-values.js";

describe("shared/assistant-identity-values", () => {
  it("returns undefined for missing or blank values", () => {
    expect(coerceIdentityValue(undefined, 10)).toBeUndefined();
    expect(coerceIdentityValue("   ", 10)).toBeUndefined();
    expect(coerceIdentityValue(42 as unknown as string, 10)).toBeUndefined();
  });

  it("trims values and preserves strings within the limit", () => {
    expect(coerceIdentityValue("  OpenCraft  ", 20)).toBe("OpenCraft");
    expect(coerceIdentityValue("  OpenCraft  ", 9)).toBe("OpenCraft");
  });

  it("truncates overlong trimmed values at the exact limit", () => {
    expect(coerceIdentityValue("  OpenCraft Assistant  ", 9)).toBe("OpenCraft");
  });

  it("returns an empty string when truncating to a zero-length limit", () => {
    expect(coerceIdentityValue("  OpenCraft  ", 0)).toBe("");
    expect(coerceIdentityValue("  OpenCraft  ", -1)).toBe("OpenCraf");
  });
});
