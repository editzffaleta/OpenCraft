import os from "node:os";
import path from "node:path";
import type { PluginRuntime } from "opencraft/plugin-sdk/msteams";

export const msteamsRuntimeStub = {
  state: {
    resolveStateDir: (env: NodeJS.ProcessEnv = process.env, homedir?: () => string) => {
      const override = env.OPENCRAFT_STATE_DIR?.trim() || env.OPENCRAFT_STATE_DIR?.trim();
      if (override) {
        return override;
      }
      const resolvedHome = homedir ? homedir() : os.homedir();
      return path.join(resolvedHome, ".opencraft");
    },
  },
} as unknown as PluginRuntime;
