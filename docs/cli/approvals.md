---
summary: "Referência do CLI para `opencraft approvals` (aprovações de exec para gateway ou hosts de node)"
read_when:
  - Você quer editar aprovações de exec via CLI
  - Você precisa gerenciar allowlists em gateway ou hosts de node
title: "approvals"
---

# `opencraft approvals`

Gerenciar aprovações de exec para o **host local**, **host do gateway** ou um **host de node**.
Por padrão, comandos visam o arquivo de aprovações local no disco. Use `--gateway` para visar o gateway, ou `--node` para visar um node específico.

Relacionado:

- Aprovações de exec: [Exec approvals](/tools/exec-approvals)
- Nodes: [Nodes](/nodes)

## Comandos comuns

```bash
opencraft approvals get
opencraft approvals get --node <id|name|ip>
opencraft approvals get --gateway
```

## Substituir aprovações de um arquivo

```bash
opencraft approvals set --file ./exec-approvals.json
opencraft approvals set --node <id|name|ip> --file ./exec-approvals.json
opencraft approvals set --gateway --file ./exec-approvals.json
```

## Helpers de allowlist

```bash
opencraft approvals allowlist add "~/Projects/**/bin/rg"
opencraft approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
opencraft approvals allowlist add --agent "*" "/usr/bin/uname"

opencraft approvals allowlist remove "~/Projects/**/bin/rg"
```

## Notas

- `--node` usa o mesmo resolvedor que `opencraft nodes` (id, nome, ip, ou prefixo de id).
- `--agent` padrão para `"*"`, que se aplica a todos os agentes.
- O host de node deve anunciar `system.execApprovals.get/set` (app macOS ou host de node headless).
- Arquivos de aprovações são armazenados por host em `~/.opencraft/exec-approvals.json`.
