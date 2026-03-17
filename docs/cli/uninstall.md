---
summary: "Referência CLI para `opencraft uninstall` (remover serviço do Gateway + dados locais)"
read_when:
  - Você quer remover o serviço do Gateway e/ou estado local
  - Você quer uma simulação primeiro
title: "uninstall"
---

# `opencraft uninstall`

Desinstalar o serviço do Gateway + dados locais (CLI permanece).

```bash
opencraft backup create
opencraft uninstall
opencraft uninstall --all --yes
opencraft uninstall --dry-run
```

Execute `opencraft backup create` primeiro se quiser um snapshot restaurável antes de remover estado ou workspaces.
