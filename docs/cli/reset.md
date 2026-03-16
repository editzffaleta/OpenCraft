---
summary: "Referência do CLI para `opencraft reset` (resetar estado/config local)"
read_when:
  - Você quer apagar o estado local mantendo o CLI instalado
  - Você quer um dry-run do que seria removido
title: "reset"
---

# `opencraft reset`

Resetar config/estado local (mantém o CLI instalado).

```bash
opencraft backup create
opencraft reset
opencraft reset --dry-run
opencraft reset --scope config+creds+sessions --yes --non-interactive
```

Rode `opencraft backup create` primeiro se quiser um snapshot restaurável antes de remover o estado local.
