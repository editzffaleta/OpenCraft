---
summary: "Referência CLI para `opencraft nodes` (list/status/approve/invoke, câmera/canvas/tela)"
read_when:
  - Você está gerenciando nós pareados (câmeras, tela, canvas)
  - Você precisa aprovar solicitações ou invocar comandos de nó
title: "nodes"
---

# `opencraft nodes`

Gerenciar nós pareados (dispositivos) e invocar capacidades de nó.

Relacionado:

- Visão geral de nós: [Nodes](/nodes)
- Câmera: [Camera nodes](/nodes/camera)
- Imagens: [Image nodes](/nodes/images)

Opções comuns:

- `--url`, `--token`, `--timeout`, `--json`

## Comandos comuns

```bash
opencraft nodes list
opencraft nodes list --connected
opencraft nodes list --last-connected 24h
opencraft nodes pending
opencraft nodes approve <requestId>
opencraft nodes status
opencraft nodes status --connected
opencraft nodes status --last-connected 24h
```

`nodes list` imprime tabelas de pendentes/pareados. Linhas pareadas incluem a idade da conexão mais recente (Last Connect).
Use `--connected` para mostrar apenas nós atualmente conectados. Use `--last-connected <duration>` para
filtrar nós que se conectaram dentro de uma duração (ex.: `24h`, `7d`).

## Invocar / executar

```bash
opencraft nodes invoke --node <id|name|ip> --command <command> --params <json>
opencraft nodes run --node <id|name|ip> <command...>
opencraft nodes run --raw "git status"
opencraft nodes run --agent main --node <id|name|ip> --raw "git status"
```

Flags de invocação:

- `--params <json>`: string de objeto JSON (padrão `{}`).
- `--invoke-timeout <ms>`: timeout de invocação do nó (padrão `15000`).
- `--idempotency-key <key>`: chave de idempotência opcional.

### Padrões no estilo exec

`nodes run` espelha o comportamento de exec do modelo (padrões + aprovações):

- Lê `tools.exec.*` (mais sobrescritas `agents.list[].tools.exec.*`).
- Usa aprovações de exec (`exec.approval.request`) antes de invocar `system.run`.
- `--node` pode ser omitido quando `tools.exec.node` está definido.
- Requer um nó que anuncie `system.run` (aplicativo companion macOS ou host de nó headless).

Flags:

- `--cwd <path>`: diretório de trabalho.
- `--env <key=val>`: sobrescrita de env (repetível). Nota: hosts de nó ignoram sobrescritas de `PATH` (e `tools.exec.pathPrepend` não é aplicado a hosts de nó).
- `--command-timeout <ms>`: timeout do comando.
- `--invoke-timeout <ms>`: timeout de invocação do nó (padrão `30000`).
- `--needs-screen-recording`: requer permissão de gravação de tela.
- `--raw <command>`: executar uma string de shell (`/bin/sh -lc` ou `cmd.exe /c`).
  No modo de lista de permissão em hosts de nó Windows, execuções com wrapper de shell `cmd.exe /c` requerem aprovação
  (entrada na lista de permissão sozinha não permite automaticamente o formulário de wrapper).
- `--agent <id>`: aprovações/listas de permissão com escopo de agente (padrão: agente configurado).
- `--ask <off|on-miss|always>`, `--security <deny|allowlist|full>`: sobrescritas.
