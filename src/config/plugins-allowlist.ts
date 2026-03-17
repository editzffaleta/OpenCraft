import type { OpenCraftConfig } from "./config.js";

export function ensurePluginAllowlisted(cfg: OpenCraftConfig, pluginId: string): OpenCraftConfig {
  const allow = cfg.plugins?.allow;
  if (!Array.isArray(allow) || allow.includes(pluginId)) {
    return cfg;
  }
  return {
    ...cfg,
    plugins: {
      ...cfg.plugins,
      allow: [...allow, pluginId],
    },
  };
}
