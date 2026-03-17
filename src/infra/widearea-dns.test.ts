import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as utils from "../utils.js";
import {
  getWideAreaZonePath,
  normalizeWideAreaDomain,
  renderWideAreaGatewayZoneText,
  resolveWideAreaDiscoveryDomain,
  type WideAreaGatewayZoneOpts,
  writeWideAreaGatewayZone,
} from "./widearea-dns.js";

const baseZoneOpts: WideAreaGatewayZoneOpts = {
  domain: "opencraft.internal.",
  gatewayPort: 18789,
  displayName: "Mac Studio (OpenCraft)",
  tailnetIPv4: "100.123.224.76",
  hostLabel: "studio-london",
  instanceLabel: "studio-london",
};

function makeZoneOpts(overrides: Partial<WideAreaGatewayZoneOpts> = {}): WideAreaGatewayZoneOpts {
  return { ...baseZoneOpts, ...overrides };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("wide-area DNS discovery domain helpers", () => {
  it.each([
    { value: "opencraft.internal", expected: "opencraft.internal." },
    { value: "opencraft.internal.", expected: "opencraft.internal." },
    { value: "  opencraft.internal  ", expected: "opencraft.internal." },
    { value: "", expected: null },
    { value: "   ", expected: null },
    { value: null, expected: null },
    { value: undefined, expected: null },
  ])("normalizes domains for %j", ({ value, expected }) => {
    expect(normalizeWideAreaDomain(value)).toBe(expected);
  });

  it.each([
    {
      name: "prefers config domain over env",
      params: {
        env: { OPENCRAFT_WIDE_AREA_DOMAIN: "env.internal" } as NodeJS.ProcessEnv,
        configDomain: "config.internal",
      },
      expected: "config.internal.",
    },
    {
      name: "falls back to env domain",
      params: {
        env: { OPENCRAFT_WIDE_AREA_DOMAIN: "env.internal" } as NodeJS.ProcessEnv,
      },
      expected: "env.internal.",
    },
    {
      name: "returns null when both sources are blank",
      params: {
        env: { OPENCRAFT_WIDE_AREA_DOMAIN: "   " } as NodeJS.ProcessEnv,
        configDomain: " ",
      },
      expected: null,
    },
  ])("$name", ({ params, expected }) => {
    expect(resolveWideAreaDiscoveryDomain(params)).toBe(expected);
  });

  it("builds the default zone path from the normalized domain", () => {
    expect(getWideAreaZonePath("opencraft.internal.")).toBe(
      path.join(utils.CONFIG_DIR, "dns", "opencraft.internal.db"),
    );
  });
});

describe("wide-area DNS-SD zone rendering", () => {
  it("renders a zone with gateway PTR/SRV/TXT records", () => {
    const txt = renderWideAreaGatewayZoneText({
      domain: "opencraft.internal.",
      serial: 2025121701,
      gatewayPort: 18789,
      displayName: "Mac Studio (OpenCraft)",
      tailnetIPv4: "100.123.224.76",
      tailnetIPv6: "fd7a:115c:a1e0::8801:e04c",
      hostLabel: "studio-london",
      instanceLabel: "studio-london",
      sshPort: 22,
      cliPath: "/opt/homebrew/bin/opencraft",
    });

    expect(txt).toContain(`$ORIGIN opencraft.internal.`);
    expect(txt).toContain(`studio-london IN A 100.123.224.76`);
    expect(txt).toContain(`studio-london IN AAAA fd7a:115c:a1e0::8801:e04c`);
    expect(txt).toContain(`_opencraft-gw._tcp IN PTR studio-london._opencraft-gw._tcp`);
    expect(txt).toContain(`studio-london._opencraft-gw._tcp IN SRV 0 0 18789 studio-london`);
    expect(txt).toContain(`displayName=Mac Studio (OpenCraft)`);
    expect(txt).toContain(`gatewayPort=18789`);
    expect(txt).toContain(`sshPort=22`);
    expect(txt).toContain(`cliPath=/opt/homebrew/bin/opencraft`);
  });

  it("includes tailnetDns when provided", () => {
    const txt = renderWideAreaGatewayZoneText({
      domain: "opencraft.internal.",
      serial: 2025121701,
      gatewayPort: 18789,
      displayName: "Mac Studio (OpenCraft)",
      tailnetIPv4: "100.123.224.76",
      tailnetDns: "peters-mac-studio-1.sheep-coho.ts.net",
      hostLabel: "studio-london",
      instanceLabel: "studio-london",
    });

    expect(txt).toContain(`tailnetDns=peters-mac-studio-1.sheep-coho.ts.net`);
  });

  it("includes gateway TLS TXT fields and trims display metadata", () => {
    const txt = renderWideAreaGatewayZoneText({
      domain: "opencraft.internal",
      serial: 2025121701,
      gatewayPort: 18789,
      displayName: "  Mac Studio (OpenCraft)  ",
      tailnetIPv4: "100.123.224.76",
      hostLabel: " Studio London ",
      instanceLabel: " Studio London ",
      gatewayTlsEnabled: true,
      gatewayTlsFingerprintSha256: "abc123",
      tailnetDns: " tailnet.ts.net ",
      cliPath: " /opt/homebrew/bin/opencraft ",
    });

    expect(txt).toContain(`$ORIGIN opencraft.internal.`);
    expect(txt).toContain(`studio-london IN A 100.123.224.76`);
    expect(txt).toContain(`studio-london._opencraft-gw._tcp IN TXT`);
    expect(txt).toContain(`displayName=Mac Studio (OpenCraft)`);
    expect(txt).toContain(`gatewayTls=1`);
    expect(txt).toContain(`gatewayTlsSha256=abc123`);
    expect(txt).toContain(`tailnetDns=tailnet.ts.net`);
    expect(txt).toContain(`cliPath=/opt/homebrew/bin/opencraft`);
  });
});

describe("wide-area DNS zone writes", () => {
  it("rejects blank domains", async () => {
    await expect(writeWideAreaGatewayZone(makeZoneOpts({ domain: "   " }))).rejects.toThrow(
      "wide-area discovery domain is required",
    );
  });

  it("skips rewriting unchanged content", async () => {
    vi.spyOn(utils, "ensureDir").mockResolvedValue(undefined);
    const existing = renderWideAreaGatewayZoneText({ ...makeZoneOpts(), serial: 2026031301 });
    vi.spyOn(fs, "readFileSync").mockReturnValue(existing);
    const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => undefined);

    const result = await writeWideAreaGatewayZone(makeZoneOpts());

    expect(result).toEqual({
      zonePath: getWideAreaZonePath("opencraft.internal."),
      changed: false,
    });
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("increments same-day serials when content changes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-13T12:00:00.000Z"));
    vi.spyOn(utils, "ensureDir").mockResolvedValue(undefined);
    vi.spyOn(fs, "readFileSync").mockReturnValue(
      renderWideAreaGatewayZoneText({ ...makeZoneOpts(), serial: 2026031304 }),
    );
    const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => undefined);

    const result = await writeWideAreaGatewayZone(
      makeZoneOpts({ gatewayTlsEnabled: true, gatewayTlsFingerprintSha256: "abc123" }),
    );

    expect(result).toEqual({
      zonePath: getWideAreaZonePath("opencraft.internal."),
      changed: true,
    });
    expect(writeSpy).toHaveBeenCalledWith(
      getWideAreaZonePath("opencraft.internal."),
      expect.stringContaining("@ IN SOA ns1 hostmaster 2026031305 7200 3600 1209600 60"),
      "utf-8",
    );
  });
});
