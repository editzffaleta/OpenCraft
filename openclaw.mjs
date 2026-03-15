#!/usr/bin/env node
// Backward-compatibility alias: openclaw → opencraft
// Allows existing scripts and muscle memory to keep working.
// This shim will be removed after the transition period.
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
await import(resolve(__dir, "opencraft.mjs"));
