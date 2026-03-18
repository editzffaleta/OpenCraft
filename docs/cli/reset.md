---
summary: "CLI reference for `opencraft reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `opencraft reset`

Reset local config/state (keeps the CLI installed).

```bash
opencraft backup create
opencraft reset
opencraft reset --dry-run
opencraft reset --scope config+creds+sessions --yes --non-interactive
```

Run `opencraft backup create` first if you want a restorable snapshot before removing local state.
