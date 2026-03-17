---
summary: "Referência CLI para `opencraft approvals` (aprovações de execução para hosts gateway ou node)"
read_when:
  - Você quer editar aprovações de execução pela CLI
  - Você precisa gerenciar listas de permissão em hosts gateway ou node
title: "approvals"
---

# `opencraft approvals`

Gerencie aprovações de execução para o **host local**, **host gateway** ou um **host node**.
Por padrão, os comandos direcionam o arquivo de aprovações local em disco. Use `--gateway` para direcionar o gateway, ou `--node` para direcionar um node específico.

Relacionado:

- Aprovações de execução: [Aprovações de execução](/tools/exec-approvals)
- Nodes: [Nodes](/nodes)

## Comandos comuns

```bash
opencraft approvals get
opencraft approvals get --node <id|nome|ip>
opencraft approvals get --gateway
```

## Substituir aprovações a partir de um arquivo

```bash
opencraft approvals set --file ./exec-approvals.json
opencraft approvals set --node <id|nome|ip> --file ./exec-approvals.json
opencraft approvals set --gateway --file ./exec-approvals.json
```

## Auxiliares de lista de permissão

```bash
opencraft approvals allowlist add "~/Projects/**/bin/rg"
opencraft approvals allowlist add --agent main --node <id|nome|ip> "/usr/bin/uptime"
opencraft approvals allowlist add --agent "*" "/usr/bin/uname"

opencraft approvals allowlist remove "~/Projects/**/bin/rg"
```

## Observações

- `--node` usa o mesmo resolvedor que `opencraft nodes` (id, nome, ip ou prefixo de id).
- `--agent` padrão é `"*"`, que se aplica a todos os agentes.
- O host node deve anunciar `system.execApprovals.get/set` (app macOS ou host node headless).
- Arquivos de aprovações são armazenados por host em `~/.opencraft/exec-approvals.json`.
