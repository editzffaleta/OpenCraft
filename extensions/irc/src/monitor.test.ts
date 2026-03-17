import { describe, expect, it } from "vitest";
import { resolveIrcInboundTarget } from "./monitor.js";

describe("irc monitor inbound target", () => {
  it("keeps channel target for group messages", () => {
    expect(
      resolveIrcInboundTarget({
        target: "#opencraft",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: true,
      target: "#opencraft",
      rawTarget: "#opencraft",
    });
  });

  it("maps DM target to sender nick and preserves raw target", () => {
    expect(
      resolveIrcInboundTarget({
        target: "opencraft-bot",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: false,
      target: "alice",
      rawTarget: "opencraft-bot",
    });
  });

  it("falls back to raw target when sender nick is empty", () => {
    expect(
      resolveIrcInboundTarget({
        target: "opencraft-bot",
        senderNick: " ",
      }),
    ).toEqual({
      isGroup: false,
      target: "opencraft-bot",
      rawTarget: "opencraft-bot",
    });
  });
});
