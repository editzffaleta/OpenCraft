import { describe, expect, it } from "vitest";
import {
  ensureOpenCraftExecMarkerOnProcess,
  markOpenCraftExecEnv,
  OPENCRAFT_CLI_ENV_VALUE,
  OPENCRAFT_CLI_ENV_VAR,
} from "./opencraft-exec-env.js";

describe("markOpenCraftExecEnv", () => {
  it("returns a cloned env object with the exec marker set", () => {
    const env = { PATH: "/usr/bin", OPENCRAFT_CLI: "0" };
    const marked = markOpenCraftExecEnv(env);

    expect(marked).toEqual({
      PATH: "/usr/bin",
      OPENCRAFT_CLI: OPENCRAFT_CLI_ENV_VALUE,
    });
    expect(marked).not.toBe(env);
    expect(env.OPENCRAFT_CLI).toBe("0");
  });
});

describe("ensureOpenCraftExecMarkerOnProcess", () => {
  it("mutates and returns the provided process env", () => {
    const env: NodeJS.ProcessEnv = { PATH: "/usr/bin" };

    expect(ensureOpenCraftExecMarkerOnProcess(env)).toBe(env);
    expect(env[OPENCRAFT_CLI_ENV_VAR]).toBe(OPENCRAFT_CLI_ENV_VALUE);
  });

  it("defaults to mutating process.env when no env object is provided", () => {
    const previous = process.env[OPENCRAFT_CLI_ENV_VAR];
    delete process.env[OPENCRAFT_CLI_ENV_VAR];

    try {
      expect(ensureOpenCraftExecMarkerOnProcess()).toBe(process.env);
      expect(process.env[OPENCRAFT_CLI_ENV_VAR]).toBe(OPENCRAFT_CLI_ENV_VALUE);
    } finally {
      if (previous === undefined) {
        delete process.env[OPENCRAFT_CLI_ENV_VAR];
      } else {
        process.env[OPENCRAFT_CLI_ENV_VAR] = previous;
      }
    }
  });
});
