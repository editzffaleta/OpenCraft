---
summary: "Referência CLI para `opencraft reset` (resetar estado/configuração local)"
read_when:
  - Você quer limpar o estado local mantendo o CLI instalado
  - Você quer uma simulação do que seria removido
title: "reset"
---

# `opencraft reset`

Resetar configuração/estado local (mantém o CLI instalado).

```bash
opencraft backup create
opencraft reset
opencraft reset --dry-run
opencraft reset --scope config+creds+sessions --yes --non-interactive
```

Execute `opencraft backup create` primeiro se quiser um snapshot restaurável antes de remover o estado local.
