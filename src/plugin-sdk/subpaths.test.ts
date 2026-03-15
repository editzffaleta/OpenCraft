import * as compatSdk from "opencraft/plugin-sdk/compat";
import * as discordSdk from "opencraft/plugin-sdk/discord";
import * as imessageSdk from "opencraft/plugin-sdk/imessage";
import * as lineSdk from "opencraft/plugin-sdk/line";
import * as msteamsSdk from "opencraft/plugin-sdk/msteams";
import * as signalSdk from "opencraft/plugin-sdk/signal";
import * as slackSdk from "opencraft/plugin-sdk/slack";
import * as telegramSdk from "opencraft/plugin-sdk/telegram";
import * as whatsappSdk from "opencraft/plugin-sdk/whatsapp";
import { describe, expect, it } from "vitest";

const bundledExtensionSubpathLoaders = [
  { id: "acpx", load: () => import("opencraft/plugin-sdk/acpx") },
  { id: "bluebubbles", load: () => import("opencraft/plugin-sdk/bluebubbles") },
  { id: "copilot-proxy", load: () => import("opencraft/plugin-sdk/copilot-proxy") },
  { id: "device-pair", load: () => import("opencraft/plugin-sdk/device-pair") },
  { id: "diagnostics-otel", load: () => import("opencraft/plugin-sdk/diagnostics-otel") },
  { id: "diffs", load: () => import("opencraft/plugin-sdk/diffs") },
  { id: "feishu", load: () => import("opencraft/plugin-sdk/feishu") },
  {
    id: "google-gemini-cli-auth",
    load: () => import("opencraft/plugin-sdk/google-gemini-cli-auth"),
  },
  { id: "googlechat", load: () => import("opencraft/plugin-sdk/googlechat") },
  { id: "irc", load: () => import("opencraft/plugin-sdk/irc") },
  { id: "llm-task", load: () => import("opencraft/plugin-sdk/llm-task") },
  { id: "lobster", load: () => import("opencraft/plugin-sdk/lobster") },
  { id: "matrix", load: () => import("opencraft/plugin-sdk/matrix") },
  { id: "mattermost", load: () => import("opencraft/plugin-sdk/mattermost") },
  { id: "memory-core", load: () => import("opencraft/plugin-sdk/memory-core") },
  { id: "memory-lancedb", load: () => import("opencraft/plugin-sdk/memory-lancedb") },
  {
    id: "minimax-portal-auth",
    load: () => import("opencraft/plugin-sdk/minimax-portal-auth"),
  },
  { id: "nextcloud-talk", load: () => import("opencraft/plugin-sdk/nextcloud-talk") },
  { id: "nostr", load: () => import("opencraft/plugin-sdk/nostr") },
  { id: "open-prose", load: () => import("opencraft/plugin-sdk/open-prose") },
  { id: "phone-control", load: () => import("opencraft/plugin-sdk/phone-control") },
  { id: "qwen-portal-auth", load: () => import("opencraft/plugin-sdk/qwen-portal-auth") },
  { id: "synology-chat", load: () => import("opencraft/plugin-sdk/synology-chat") },
  { id: "talk-voice", load: () => import("opencraft/plugin-sdk/talk-voice") },
  { id: "test-utils", load: () => import("opencraft/plugin-sdk/test-utils") },
  { id: "thread-ownership", load: () => import("opencraft/plugin-sdk/thread-ownership") },
  { id: "tlon", load: () => import("opencraft/plugin-sdk/tlon") },
  { id: "twitch", load: () => import("opencraft/plugin-sdk/twitch") },
  { id: "voice-call", load: () => import("opencraft/plugin-sdk/voice-call") },
  { id: "zalo", load: () => import("opencraft/plugin-sdk/zalo") },
  { id: "zalouser", load: () => import("opencraft/plugin-sdk/zalouser") },
] as const;

describe("plugin-sdk subpath exports", () => {
  it("exports compat helpers", () => {
    expect(typeof compatSdk.emptyPluginConfigSchema).toBe("function");
    expect(typeof compatSdk.resolveControlCommandGate).toBe("function");
  });

  it("exports Discord helpers", () => {
    expect(typeof discordSdk.resolveDiscordAccount).toBe("function");
    expect(typeof discordSdk.inspectDiscordAccount).toBe("function");
    expect(typeof discordSdk.discordOnboardingAdapter).toBe("object");
  });

  it("exports Slack helpers", () => {
    expect(typeof slackSdk.resolveSlackAccount).toBe("function");
    expect(typeof slackSdk.inspectSlackAccount).toBe("function");
    expect(typeof slackSdk.handleSlackMessageAction).toBe("function");
  });

  it("exports Telegram helpers", () => {
    expect(typeof telegramSdk.resolveTelegramAccount).toBe("function");
    expect(typeof telegramSdk.inspectTelegramAccount).toBe("function");
    expect(typeof telegramSdk.telegramOnboardingAdapter).toBe("object");
  });

  it("exports Signal helpers", () => {
    expect(typeof signalSdk.resolveSignalAccount).toBe("function");
    expect(typeof signalSdk.signalOnboardingAdapter).toBe("object");
  });

  it("exports iMessage helpers", () => {
    expect(typeof imessageSdk.resolveIMessageAccount).toBe("function");
    expect(typeof imessageSdk.imessageOnboardingAdapter).toBe("object");
  });

  it("exports WhatsApp helpers", () => {
    // WhatsApp-specific functions (resolveWhatsAppAccount, whatsappOnboardingAdapter) moved to extensions/whatsapp/src/
    expect(typeof whatsappSdk.WhatsAppConfigSchema).toBe("object");
    expect(typeof whatsappSdk.resolveWhatsAppOutboundTarget).toBe("function");
    expect(typeof whatsappSdk.resolveWhatsAppMentionStripRegexes).toBe("function");
    expect("resolveWhatsAppMentionStripPatterns" in whatsappSdk).toBe(false);
  });

  it("exports LINE helpers", () => {
    expect(typeof lineSdk.processLineMessage).toBe("function");
    expect(typeof lineSdk.createInfoCard).toBe("function");
  });

  it("exports Microsoft Teams helpers", () => {
    expect(typeof msteamsSdk.resolveControlCommandGate).toBe("function");
    expect(typeof msteamsSdk.loadOutboundMediaFromUrl).toBe("function");
  });

  it("exports acpx helpers", async () => {
    const acpxSdk = await import("opencraft/plugin-sdk/acpx");
    expect(typeof acpxSdk.listKnownProviderAuthEnvVarNames).toBe("function");
    expect(typeof acpxSdk.omitEnvKeysCaseInsensitive).toBe("function");
  });

  it("resolves bundled extension subpaths", async () => {
    for (const { id, load } of bundledExtensionSubpathLoaders) {
      const mod = await load();
      expect(typeof mod).toBe("object");
      expect(mod, `subpath ${id} should resolve`).toBeTruthy();
    }
  });

  it("keeps the newly added bundled plugin-sdk contracts available", async () => {
    const bluebubbles = await import("opencraft/plugin-sdk/bluebubbles");
    expect(typeof bluebubbles.parseFiniteNumber).toBe("function");

    const mattermost = await import("opencraft/plugin-sdk/mattermost");
    expect(typeof mattermost.parseStrictPositiveInteger).toBe("function");

    const nextcloudTalk = await import("opencraft/plugin-sdk/nextcloud-talk");
    expect(typeof nextcloudTalk.waitForAbortSignal).toBe("function");

    const twitch = await import("opencraft/plugin-sdk/twitch");
    expect(typeof twitch.DEFAULT_ACCOUNT_ID).toBe("string");
    expect(typeof twitch.normalizeAccountId).toBe("function");

    const zalo = await import("opencraft/plugin-sdk/zalo");
    expect(typeof zalo.resolveClientIp).toBe("function");
  });
});
