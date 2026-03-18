---
summary: "CLI reference for `opencraft setup` (initialize config + workspace)"
read_when:
  - You’re doing first-run setup without full CLI onboarding
  - You want to set the default workspace path
title: "setup"
---

# `opencraft setup`

Initialize `~/.opencraft/opencraft.json` and the agent workspace.

Related:

- Getting started: [Getting started](/start/getting-started)
- CLI onboarding: [Onboarding (CLI)](/start/wizard)

## Examples

```bash
opencraft setup
opencraft setup --workspace ~/.opencraft/workspace
```

To run onboarding via setup:

```bash
opencraft setup --wizard
```
