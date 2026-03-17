import { describe, expect, it } from "vitest";
import { shortenText } from "./text-format.js";

describe("shortenText", () => {
  it("returns original text when it fits", () => {
    expect(shortenText("opencraft", 16)).toBe("opencraft");
  });

  it("truncates and appends ellipsis when over limit", () => {
    expect(shortenText("opencraft-status-output", 10)).toBe("opencraft-…");
  });

  it("counts multi-byte characters correctly", () => {
    expect(shortenText("hello🙂world", 7)).toBe("hello🙂…");
  });
});
