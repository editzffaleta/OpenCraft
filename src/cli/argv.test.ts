import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getCommandPositionalsWithRootOptions,
  getCommandPathWithRootOptions,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  isRootHelpInvocation,
  isRootVersionInvocation,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it.each([
    {
      name: "help flag",
      argv: ["node", "opencraft", "--help"],
      expected: true,
    },
    {
      name: "version flag",
      argv: ["node", "opencraft", "-V"],
      expected: true,
    },
    {
      name: "normal command",
      argv: ["node", "opencraft", "status"],
      expected: false,
    },
    {
      name: "root -v alias",
      argv: ["node", "opencraft", "-v"],
      expected: true,
    },
    {
      name: "root -v alias with profile",
      argv: ["node", "opencraft", "--profile", "work", "-v"],
      expected: true,
    },
    {
      name: "root -v alias with log-level",
      argv: ["node", "opencraft", "--log-level", "debug", "-v"],
      expected: true,
    },
    {
      name: "subcommand -v should not be treated as version",
      argv: ["node", "opencraft", "acp", "-v"],
      expected: false,
    },
    {
      name: "root -v alias with equals profile",
      argv: ["node", "opencraft", "--profile=work", "-v"],
      expected: true,
    },
    {
      name: "subcommand path after global root flags should not be treated as version",
      argv: ["node", "opencraft", "--dev", "skills", "list", "-v"],
      expected: false,
    },
  ])("detects help/version flags: $name", ({ argv, expected }) => {
    expect(hasHelpOrVersion(argv)).toBe(expected);
  });

  it.each([
    {
      name: "root --version",
      argv: ["node", "opencraft", "--version"],
      expected: true,
    },
    {
      name: "root -V",
      argv: ["node", "opencraft", "-V"],
      expected: true,
    },
    {
      name: "root -v alias with profile",
      argv: ["node", "opencraft", "--profile", "work", "-v"],
      expected: true,
    },
    {
      name: "subcommand version flag",
      argv: ["node", "opencraft", "status", "--version"],
      expected: false,
    },
    {
      name: "unknown root flag with version",
      argv: ["node", "opencraft", "--unknown", "--version"],
      expected: false,
    },
  ])("detects root-only version invocations: $name", ({ argv, expected }) => {
    expect(isRootVersionInvocation(argv)).toBe(expected);
  });

  it.each([
    {
      name: "root --help",
      argv: ["node", "opencraft", "--help"],
      expected: true,
    },
    {
      name: "root -h",
      argv: ["node", "opencraft", "-h"],
      expected: true,
    },
    {
      name: "root --help with profile",
      argv: ["node", "opencraft", "--profile", "work", "--help"],
      expected: true,
    },
    {
      name: "subcommand --help",
      argv: ["node", "opencraft", "status", "--help"],
      expected: false,
    },
    {
      name: "help before subcommand token",
      argv: ["node", "opencraft", "--help", "status"],
      expected: false,
    },
    {
      name: "help after -- terminator",
      argv: ["node", "opencraft", "nodes", "run", "--", "git", "--help"],
      expected: false,
    },
    {
      name: "unknown root flag before help",
      argv: ["node", "opencraft", "--unknown", "--help"],
      expected: false,
    },
    {
      name: "unknown root flag after help",
      argv: ["node", "opencraft", "--help", "--unknown"],
      expected: false,
    },
  ])("detects root-only help invocations: $name", ({ argv, expected }) => {
    expect(isRootHelpInvocation(argv)).toBe(expected);
  });

  it.each([
    {
      name: "single command with trailing flag",
      argv: ["node", "opencraft", "status", "--json"],
      expected: ["status"],
    },
    {
      name: "two-part command",
      argv: ["node", "opencraft", "agents", "list"],
      expected: ["agents", "list"],
    },
    {
      name: "terminator cuts parsing",
      argv: ["node", "opencraft", "status", "--", "ignored"],
      expected: ["status"],
    },
  ])("extracts command path: $name", ({ argv, expected }) => {
    expect(getCommandPath(argv, 2)).toEqual(expected);
  });

  it("extracts command path while skipping known root option values", () => {
    expect(
      getCommandPathWithRootOptions(
        ["node", "opencraft", "--profile", "work", "--no-color", "config", "validate"],
        2,
      ),
    ).toEqual(["config", "validate"]);
  });

  it("extracts routed config get positionals with interleaved root options", () => {
    expect(
      getCommandPositionalsWithRootOptions(
        ["node", "opencraft", "config", "get", "--log-level", "debug", "update.channel", "--json"],
        {
          commandPath: ["config", "get"],
          booleanFlags: ["--json"],
        },
      ),
    ).toEqual(["update.channel"]);
  });

  it("extracts routed config unset positionals with interleaved root options", () => {
    expect(
      getCommandPositionalsWithRootOptions(
        ["node", "opencraft", "config", "unset", "--profile", "work", "update.channel"],
        {
          commandPath: ["config", "unset"],
        },
      ),
    ).toEqual(["update.channel"]);
  });

  it("returns null when routed command sees unknown options", () => {
    expect(
      getCommandPositionalsWithRootOptions(
        ["node", "opencraft", "config", "get", "--mystery", "value", "update.channel"],
        {
          commandPath: ["config", "get"],
          booleanFlags: ["--json"],
        },
      ),
    ).toBeNull();
  });

  it.each([
    {
      name: "returns first command token",
      argv: ["node", "opencraft", "agents", "list"],
      expected: "agents",
    },
    {
      name: "returns null when no command exists",
      argv: ["node", "opencraft"],
      expected: null,
    },
    {
      name: "skips known root option values",
      argv: ["node", "opencraft", "--log-level", "debug", "status"],
      expected: "status",
    },
  ])("returns primary command: $name", ({ argv, expected }) => {
    expect(getPrimaryCommand(argv)).toBe(expected);
  });

  it.each([
    {
      name: "detects flag before terminator",
      argv: ["node", "opencraft", "status", "--json"],
      flag: "--json",
      expected: true,
    },
    {
      name: "ignores flag after terminator",
      argv: ["node", "opencraft", "--", "--json"],
      flag: "--json",
      expected: false,
    },
  ])("parses boolean flags: $name", ({ argv, flag, expected }) => {
    expect(hasFlag(argv, flag)).toBe(expected);
  });

  it.each([
    {
      name: "value in next token",
      argv: ["node", "opencraft", "status", "--timeout", "5000"],
      expected: "5000",
    },
    {
      name: "value in equals form",
      argv: ["node", "opencraft", "status", "--timeout=2500"],
      expected: "2500",
    },
    {
      name: "missing value",
      argv: ["node", "opencraft", "status", "--timeout"],
      expected: null,
    },
    {
      name: "next token is another flag",
      argv: ["node", "opencraft", "status", "--timeout", "--json"],
      expected: null,
    },
    {
      name: "flag appears after terminator",
      argv: ["node", "opencraft", "--", "--timeout=99"],
      expected: undefined,
    },
  ])("extracts flag values: $name", ({ argv, expected }) => {
    expect(getFlagValue(argv, "--timeout")).toBe(expected);
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "opencraft", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "opencraft", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "opencraft", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it.each([
    {
      name: "missing flag",
      argv: ["node", "opencraft", "status"],
      expected: undefined,
    },
    {
      name: "missing value",
      argv: ["node", "opencraft", "status", "--timeout"],
      expected: null,
    },
    {
      name: "valid positive integer",
      argv: ["node", "opencraft", "status", "--timeout", "5000"],
      expected: 5000,
    },
    {
      name: "invalid integer",
      argv: ["node", "opencraft", "status", "--timeout", "nope"],
      expected: undefined,
    },
  ])("parses positive integer flag values: $name", ({ argv, expected }) => {
    expect(getPositiveIntFlagValue(argv, "--timeout")).toBe(expected);
  });

  it("builds parse argv from raw args", () => {
    const cases = [
      {
        rawArgs: ["node", "opencraft", "status"],
        expected: ["node", "opencraft", "status"],
      },
      {
        rawArgs: ["node-22", "opencraft", "status"],
        expected: ["node-22", "opencraft", "status"],
      },
      {
        rawArgs: ["node-22.2.0.exe", "opencraft", "status"],
        expected: ["node-22.2.0.exe", "opencraft", "status"],
      },
      {
        rawArgs: ["node-22.2", "opencraft", "status"],
        expected: ["node-22.2", "opencraft", "status"],
      },
      {
        rawArgs: ["node-22.2.exe", "opencraft", "status"],
        expected: ["node-22.2.exe", "opencraft", "status"],
      },
      {
        rawArgs: ["/usr/bin/node-22.2.0", "opencraft", "status"],
        expected: ["/usr/bin/node-22.2.0", "opencraft", "status"],
      },
      {
        rawArgs: ["node24", "opencraft", "status"],
        expected: ["node24", "opencraft", "status"],
      },
      {
        rawArgs: ["/usr/bin/node24", "opencraft", "status"],
        expected: ["/usr/bin/node24", "opencraft", "status"],
      },
      {
        rawArgs: ["node24.exe", "opencraft", "status"],
        expected: ["node24.exe", "opencraft", "status"],
      },
      {
        rawArgs: ["nodejs", "opencraft", "status"],
        expected: ["nodejs", "opencraft", "status"],
      },
      {
        rawArgs: ["node-dev", "opencraft", "status"],
        expected: ["node", "opencraft", "node-dev", "opencraft", "status"],
      },
      {
        rawArgs: ["opencraft", "status"],
        expected: ["node", "opencraft", "status"],
      },
      {
        rawArgs: ["bun", "src/entry.ts", "status"],
        expected: ["bun", "src/entry.ts", "status"],
      },
    ] as const;

    for (const testCase of cases) {
      const parsed = buildParseArgv({
        programName: "opencraft",
        rawArgs: [...testCase.rawArgs],
      });
      expect(parsed).toEqual([...testCase.expected]);
    }
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "opencraft",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "opencraft", "status"]);
  });

  it("decides when to migrate state", () => {
    const nonMutatingArgv = [
      ["node", "opencraft", "status"],
      ["node", "opencraft", "health"],
      ["node", "opencraft", "sessions"],
      ["node", "opencraft", "config", "get", "update"],
      ["node", "opencraft", "config", "unset", "update"],
      ["node", "opencraft", "models", "list"],
      ["node", "opencraft", "models", "status"],
      ["node", "opencraft", "memory", "status"],
      ["node", "opencraft", "agent", "--message", "hi"],
    ] as const;
    const mutatingArgv = [
      ["node", "opencraft", "agents", "list"],
      ["node", "opencraft", "message", "send"],
    ] as const;

    for (const argv of nonMutatingArgv) {
      expect(shouldMigrateState([...argv])).toBe(false);
    }
    for (const argv of mutatingArgv) {
      expect(shouldMigrateState([...argv])).toBe(true);
    }
  });

  it.each([
    { path: ["status"], expected: false },
    { path: ["config", "get"], expected: false },
    { path: ["models", "status"], expected: false },
    { path: ["agents", "list"], expected: true },
  ])("reuses command path for migrate state decisions: $path", ({ path, expected }) => {
    expect(shouldMigrateStateFromPath(path)).toBe(expected);
  });
});
