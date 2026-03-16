---
summary: "Execução exec em background e gerenciamento de processos"
read_when:
  - Adicionando ou modificando comportamento de exec em background
  - Depurando tarefas exec de longa duração
title: "Background Exec and Process Tool"
---

# Background Exec + Process Tool

OpenCraft roda comandos shell pela tool `exec` e mantém tarefas de longa duração em memória. A tool `process` gerencia essas sessões em background.

## Tool exec

Parâmetros principais:

- `command` (obrigatório)
- `yieldMs` (padrão 10000): auto-background após este atraso
- `background` (bool): background imediatamente
- `timeout` (segundos, padrão 1800): matar o processo após este timeout
- `elevated` (bool): rodar no host se o modo elevated estiver habilitado/permitido
- Precisa de um TTY real? Defina `pty: true`.
- `workdir`, `env`

Comportamento:

- Execuções em foreground retornam output diretamente.
- Quando em background (explícito ou timeout), a tool retorna `status: "running"` + `sessionId` e um tail curto.
- Output é mantido em memória até que a sessão seja consultada ou limpa.
- Se a tool `process` for desabilitada, `exec` roda de forma síncrona e ignora `yieldMs`/`background`.
- Comandos exec gerados recebem `OPENCLAW_SHELL=exec` para regras de shell/perfil contextuais.

## Bridging de processo filho

Ao gerar processos filhos de longa duração fora das tools exec/process (por exemplo, respawns de CLI ou helpers do gateway), anexe o helper de bridge de processo filho para que sinais de terminação sejam encaminhados e listeners sejam desanexados na saída/erro. Isso evita processos órfãos no systemd e mantém o comportamento de shutdown consistente entre plataformas.

Overrides de ambiente:

- `PI_BASH_YIELD_MS`: yield padrão (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: cap de output em memória (chars)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: cap de stdout/stderr pendente por stream (chars)
- `PI_BASH_JOB_TTL_MS`: TTL para sessões finalizadas (ms, limitado a 1m–3h)

Config (preferido):

- `tools.exec.backgroundMs` (padrão 10000)
- `tools.exec.timeoutSec` (padrão 1800)
- `tools.exec.cleanupMs` (padrão 1800000)
- `tools.exec.notifyOnExit` (padrão true): enfileirar um evento de sistema + solicitar heartbeat quando um exec em background sair.
- `tools.exec.notifyOnExitEmptySuccess` (padrão false): quando true, também enfileirar eventos de conclusão para execuções em background bem-sucedidas que não produziram output.

## Tool process

Ações:

- `list`: sessões em execução + finalizadas
- `poll`: drenar novo output de uma sessão (também reporta status de saída)
- `log`: ler o output agregado (suporta `offset` + `limit`)
- `write`: enviar stdin (`data`, `eof` opcional)
- `kill`: terminar uma sessão em background
- `clear`: remover uma sessão finalizada da memória
- `remove`: matar se em execução, caso contrário limpar se finalizada

Notas:

- Apenas sessões em background são listadas/persistidas em memória.
- Sessões são perdidas na reinicialização do processo (sem persistência em disco).
- Logs de sessão só são salvos no histórico de chat se você rodar `process poll/log` e o resultado da tool for registrado.
- `process` tem escopo por agente; só vê sessões iniciadas por aquele agente.
- `process list` inclui um `name` derivado (verbo do comando + alvo) para varreduras rápidas.
- `process log` usa `offset`/`limit` baseado em linha.
- Quando tanto `offset` quanto `limit` são omitidos, retorna as últimas 200 linhas e inclui um hint de paginação.
- Quando `offset` é fornecido e `limit` é omitido, retorna de `offset` até o fim (sem limite de 200).

## Exemplos

Rodar uma tarefa longa e consultar depois:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Iniciar imediatamente em background:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Enviar stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```
