---
summary: "Execução em background e gerenciamento de processos"
read_when:
  - Adicionando ou modificando comportamento de exec em background
  - Debugando tarefas exec de longa duração
title: "Background Exec and Process Tool"
---

# Background Exec + Process Tool

OpenCraft executa comandos shell através da ferramenta `exec` e mantém tarefas de longa duração em memória. A ferramenta `process` gerencia essas sessões em background.

## Ferramenta exec

Parâmetros principais:

- `command` (obrigatório)
- `yieldMs` (padrão 10000): enviar para background automaticamente após este delay
- `background` (bool): enviar para background imediatamente
- `timeout` (segundos, padrão 1800): encerrar o processo após este timeout
- `elevated` (bool): executar no host se o modo elevated estiver habilitado/permitido
- Precisa de um TTY real? Defina `pty: true`.
- `workdir`, `env`

Comportamento:

- Execuções em foreground retornam a saída diretamente.
- Quando em background (explícito ou por timeout), a ferramenta retorna `status: "running"` + `sessionId` e uma prévia curta.
- A saída é mantida em memória até que a sessão seja consultada ou limpa.
- Se a ferramenta `process` estiver bloqueada, `exec` executa de forma síncrona e ignora `yieldMs`/`background`.
- Comandos exec gerados recebem `OPENCRAFT_SHELL=exec` para regras de shell/profile sensíveis ao contexto.

## Bridging de processos filhos

Ao gerar processos filhos de longa duração fora das ferramentas exec/process (por exemplo, respawns de CLI ou helpers do gateway), conecte o helper de bridge de processos filhos para que sinais de terminação sejam encaminhados e listeners sejam desconectados em saída/erro. Isso evita processos órfãos no systemd e mantém o comportamento de shutdown consistente entre plataformas.

Overrides de ambiente:

- `PI_BASH_YIELD_MS`: yield padrão (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: limite de saída em memória (chars)
- `OPENCRAFT_BASH_PENDING_MAX_OUTPUT_CHARS`: limite de stdout/stderr pendente por stream (chars)
- `PI_BASH_JOB_TTL_MS`: TTL para sessões finalizadas (ms, limitado a 1m–3h)

Config (preferido):

- `tools.exec.backgroundMs` (padrão 10000)
- `tools.exec.timeoutSec` (padrão 1800)
- `tools.exec.cleanupMs` (padrão 1800000)
- `tools.exec.notifyOnExit` (padrão true): enfileirar um evento de sistema + solicitar heartbeat quando um exec em background termina.
- `tools.exec.notifyOnExitEmptySuccess` (padrão false): quando true, também enfileira eventos de conclusão para execuções em background bem-sucedidas que não produziram saída.

## Ferramenta process

Ações:

- `list`: sessões em execução + finalizadas
- `poll`: drenar nova saída para uma sessão (também reporta status de saída)
- `log`: ler a saída agregada (suporta `offset` + `limit`)
- `write`: enviar stdin (`data`, opcional `eof`)
- `kill`: encerrar uma sessão em background
- `clear`: remover uma sessão finalizada da memória
- `remove`: encerrar se estiver em execução, caso contrário limpar se finalizada

Notas:

- Apenas sessões em background são listadas/persistidas em memória.
- Sessões são perdidas ao reiniciar o processo (sem persistência em disco).
- Logs de sessão só são salvos no histórico do chat se você executar `process poll/log` e o resultado da ferramenta for registrado.
- `process` tem escopo por agente; ele só vê sessões iniciadas por aquele agente.
- `process list` inclui um `name` derivado (verbo do comando + alvo) para varreduras rápidas.
- `process log` usa `offset`/`limit` baseado em linhas.
- Quando tanto `offset` quanto `limit` são omitidos, retorna as últimas 200 linhas e inclui uma dica de paginação.
- Quando `offset` é fornecido e `limit` é omitido, retorna de `offset` até o fim (sem limite de 200).

## Exemplos

Executar uma tarefa longa e consultar depois:

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
