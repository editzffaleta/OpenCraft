---
summary: "Referência do CLI para `opencraft uninstall` (remover serviço do gateway + dados locais)"
read_when:
  - Você quer remover o serviço do gateway e/ou estado local
  - Você quer fazer um dry-run primeiro
title: "uninstall"
---

# `opencraft uninstall`

Desinstalar o serviço do gateway + dados locais (CLI permanece).

```bash
opencraft backup create
opencraft uninstall
opencraft uninstall --all --yes
opencraft uninstall --dry-run
```

Rode `opencraft backup create` primeiro se quiser um snapshot restaurável antes de remover estado ou workspaces.
