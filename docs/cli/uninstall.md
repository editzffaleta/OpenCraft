---
summary: "CLI reference for `opencraft uninstall` (remove gateway service + local data)"
read_when:
  - You want to remove the gateway service and/or local state
  - You want a dry-run first
title: "uninstall"
---

# `opencraft uninstall`

Uninstall the gateway service + local data (CLI remains).

```bash
opencraft backup create
opencraft uninstall
opencraft uninstall --all --yes
opencraft uninstall --dry-run
```

Run `opencraft backup create` first if you want a restorable snapshot before removing state or workspaces.
