import { describe, expect, it } from "vitest";
import {
  formatPrereleaseResolutionError,
  isExactSemverVersion,
  isPrereleaseSemverVersion,
  isPrereleaseResolutionAllowed,
  parseRegistryNpmSpec,
  validateRegistryNpmSpec,
} from "./npm-registry-spec.js";

describe("npm registry spec validation", () => {
  it("accepts bare package names, exact versions, and dist-tags", () => {
    expect(validateRegistryNpmSpec("@opencraft/voice-call")).toBeNull();
    expect(validateRegistryNpmSpec("@opencraft/voice-call@1.2.3")).toBeNull();
    expect(validateRegistryNpmSpec("@opencraft/voice-call@1.2.3-beta.4")).toBeNull();
    expect(validateRegistryNpmSpec("@opencraft/voice-call@latest")).toBeNull();
    expect(validateRegistryNpmSpec("@opencraft/voice-call@beta")).toBeNull();
  });

  it("rejects semver ranges", () => {
    expect(validateRegistryNpmSpec("@opencraft/voice-call@^1.2.3")).toContain(
      "exact version or dist-tag",
    );
    expect(validateRegistryNpmSpec("@opencraft/voice-call@~1.2.3")).toContain(
      "exact version or dist-tag",
    );
  });

  it("rejects unsupported registry protocols and malformed selectors", () => {
    expect(validateRegistryNpmSpec("https://npmjs.org/pkg.tgz")).toContain("URLs are not allowed");
    expect(validateRegistryNpmSpec("git+ssh://github.com/opencraft/opencraft")).toContain(
      "URLs are not allowed",
    );
    expect(validateRegistryNpmSpec("@opencraft/voice-call@")).toContain(
      "missing version/tag after @",
    );
    expect(validateRegistryNpmSpec("@opencraft/voice-call@../beta")).toContain(
      "invalid version/tag",
    );
  });
});

describe("npm registry spec parsing helpers", () => {
  it("parses bare, tag, and exact prerelease specs", () => {
    expect(parseRegistryNpmSpec("@opencraft/voice-call")).toEqual({
      name: "@opencraft/voice-call",
      raw: "@opencraft/voice-call",
      selectorKind: "none",
      selectorIsPrerelease: false,
    });
    expect(parseRegistryNpmSpec("@opencraft/voice-call@beta")).toEqual({
      name: "@opencraft/voice-call",
      raw: "@opencraft/voice-call@beta",
      selector: "beta",
      selectorKind: "tag",
      selectorIsPrerelease: false,
    });
    expect(parseRegistryNpmSpec("@opencraft/voice-call@1.2.3-beta.1")).toEqual({
      name: "@opencraft/voice-call",
      raw: "@opencraft/voice-call@1.2.3-beta.1",
      selector: "1.2.3-beta.1",
      selectorKind: "exact-version",
      selectorIsPrerelease: true,
    });
  });

  it("detects exact and prerelease semver versions", () => {
    expect(isExactSemverVersion("v1.2.3")).toBe(true);
    expect(isExactSemverVersion("1.2")).toBe(false);
    expect(isPrereleaseSemverVersion("1.2.3-beta.1")).toBe(true);
    expect(isPrereleaseSemverVersion("1.2.3")).toBe(false);
  });
});

describe("npm prerelease resolution policy", () => {
  it("blocks prerelease resolutions for bare specs", () => {
    const spec = parseRegistryNpmSpec("@opencraft/voice-call");
    expect(spec).not.toBeNull();
    expect(
      isPrereleaseResolutionAllowed({
        spec: spec!,
        resolvedVersion: "1.2.3-beta.1",
      }),
    ).toBe(false);
  });

  it("blocks prerelease resolutions for latest", () => {
    const spec = parseRegistryNpmSpec("@opencraft/voice-call@latest");
    expect(spec).not.toBeNull();
    expect(
      isPrereleaseResolutionAllowed({
        spec: spec!,
        resolvedVersion: "1.2.3-rc.1",
      }),
    ).toBe(false);
  });

  it("allows prerelease resolutions when the user explicitly opted in", () => {
    const tagSpec = parseRegistryNpmSpec("@opencraft/voice-call@beta");
    const versionSpec = parseRegistryNpmSpec("@opencraft/voice-call@1.2.3-beta.1");

    expect(tagSpec).not.toBeNull();
    expect(versionSpec).not.toBeNull();
    expect(
      isPrereleaseResolutionAllowed({
        spec: tagSpec!,
        resolvedVersion: "1.2.3-beta.4",
      }),
    ).toBe(true);
    expect(
      isPrereleaseResolutionAllowed({
        spec: versionSpec!,
        resolvedVersion: "1.2.3-beta.1",
      }),
    ).toBe(true);
  });

  it("allows stable resolutions even for bare and latest specs", () => {
    const bareSpec = parseRegistryNpmSpec("@opencraft/voice-call");
    const latestSpec = parseRegistryNpmSpec("@opencraft/voice-call@latest");

    expect(bareSpec).not.toBeNull();
    expect(latestSpec).not.toBeNull();
    expect(
      isPrereleaseResolutionAllowed({
        spec: bareSpec!,
        resolvedVersion: "1.2.3",
      }),
    ).toBe(true);
    expect(
      isPrereleaseResolutionAllowed({
        spec: latestSpec!,
        resolvedVersion: undefined,
      }),
    ).toBe(true);
  });

  it("formats prerelease resolution guidance based on selector intent", () => {
    const bareSpec = parseRegistryNpmSpec("@opencraft/voice-call");
    const tagSpec = parseRegistryNpmSpec("@opencraft/voice-call@beta");

    expect(bareSpec).not.toBeNull();
    expect(tagSpec).not.toBeNull();
    expect(
      formatPrereleaseResolutionError({
        spec: bareSpec!,
        resolvedVersion: "1.2.3-beta.1",
      }),
    ).toContain(`Use "@opencraft/voice-call@beta"`);
    expect(
      formatPrereleaseResolutionError({
        spec: tagSpec!,
        resolvedVersion: "1.2.3-rc.1",
      }),
    ).toContain("Use an explicit prerelease tag or exact prerelease version");
  });
});
