#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const logLevel = process.env.OPENCRAFT_BUILD_VERBOSE ? "info" : "warn";
const extraArgs = process.argv.slice(2);
const result = spawnSync(
  "pnpm",
  ["exec", "tsdown", "--config-loader", "unrun", "--logLevel", logLevel, ...extraArgs],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
