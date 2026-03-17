export const OPENCRAFT_CLI_ENV_VAR = "OPENCRAFT_CLI";
export const OPENCRAFT_CLI_ENV_VALUE = "1";

export function markOpenCraftExecEnv<T extends Record<string, string | undefined>>(env: T): T {
  return {
    ...env,
    [OPENCRAFT_CLI_ENV_VAR]: OPENCRAFT_CLI_ENV_VALUE,
  };
}

export function ensureOpenCraftExecMarkerOnProcess(
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  env[OPENCRAFT_CLI_ENV_VAR] = OPENCRAFT_CLI_ENV_VALUE;
  return env;
}
