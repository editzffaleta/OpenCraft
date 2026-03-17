---
summary: "CLI reference for `opencraft logs` (tail gateway logs via RPC)"
read_when:
  - You need to tail Gateway logs remotely (without SSH)
  - You want JSON log lines for tooling
title: "logs"
---

# `opencraft logs`

Tail Gateway file logs over RPC (works in remote mode).

Related:

- Logging overview: [Logging](/logging)

## Examples

```bash
opencraft logs
opencraft logs --follow
opencraft logs --json
opencraft logs --limit 500
opencraft logs --local-time
opencraft logs --follow --local-time
```

Use `--local-time` to render timestamps in your local timezone.
