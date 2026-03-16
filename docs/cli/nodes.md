---
summary: "Referência do CLI para `opencraft nodes` (list/status/approve/invoke, câmera/canvas/tela)"
read_when:
  - Você está gerenciando nodes pareados (câmeras, tela, canvas)
  - Você precisa aprovar solicitações ou invocar comandos de node
title: "nodes"
---

# `opencraft nodes`

Gerenciar nodes pareados (dispositivos) e invocar capacidades de node.

Relacionado:

- Visão geral de nodes: [Nodes](/nodes)
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

`nodes list` imprime tabelas de pending/paired. Linhas pareadas incluem a idade de conexão mais recente (Last Connect).
Use `--connected` para mostrar apenas nodes atualmente conectados. Use `--last-connected <duration>` para
filtrar nodes que conectaram dentro de uma duração (ex. `24h`, `7d`).

## Invocar / rodar

```bash
opencraft nodes invoke --node <id|name|ip> --command <command> --params <json>
opencraft nodes run --node <id|name|ip> <command...>
opencraft nodes run --raw "git status"
opencraft nodes run --agent main --node <id|name|ip> --raw "git status"
```

Flags de invoke:

- `--params <json>`: string de objeto JSON (padrão `{}`).
- `--invoke-timeout <ms>`: timeout de invoke do node (padrão `15000`).
- `--idempotency-key <key>`: chave de idempotência opcional.

### Padrões estilo exec

`nodes run` espelha o comportamento de exec do modelo (padrões + aprovações):

- Lê `tools.exec.*` (mais overrides de `agents.list[].tools.exec.*`).
- Usa aprovações de exec (`exec.approval.request`) antes de invocar `system.run`.
- `--node` pode ser omitido quando `tools.exec.node` estiver definido.
- Requer um node que anuncie `system.run` (app companion macOS ou host de node headless).

Flags:

- `--cwd <path>`: diretório de trabalho.
- `--env <key=val>`: override de env (repetível). Nota: hosts de node ignoram overrides de `PATH` (e `tools.exec.pathPrepend` não é aplicado a hosts de node).
- `--command-timeout <ms>`: timeout de comando.
- `--invoke-timeout <ms>`: timeout de invoke do node (padrão `30000`).
- `--needs-screen-recording`: requer permissão de gravação de tela.
- `--raw <command>`: rodar uma string shell (`/bin/sh -lc` ou `cmd.exe /c`).
  Em modo allowlist em hosts de node Windows, execuções de wrapper shell `cmd.exe /c` requerem aprovação
  (entrada de allowlist sozinha não auto-permite a forma wrapper).
- `--agent <id>`: aprovações/allowlists com escopo de agente (padrão: agente configurado).
- `--ask <off|on-miss|always>`, `--security <deny|allowlist|full>`: overrides.
