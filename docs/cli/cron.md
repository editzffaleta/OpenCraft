---
summary: "Referência CLI para `opencraft cron` (agendar e executar tarefas em segundo plano)"
read_when:
  - Você quer tarefas agendadas e despertares
  - Você está depurando execução e logs de Cron
title: "cron"
---

# `opencraft cron`

Gerencie tarefas Cron para o agendador do Gateway.

Relacionado:

- Tarefas Cron: [Tarefas Cron](/automation/cron-jobs)

Dica: execute `opencraft cron --help` para a superfície completa de comandos.

Nota: tarefas isoladas de `cron add` usam entrega `--announce` por padrão. Use `--no-deliver` para manter
a saída interna. `--deliver` permanece como alias obsoleto para `--announce`.

Nota: tarefas únicas (`--at`) são deletadas após sucesso por padrão. Use `--keep-after-run` para mantê-las.

Nota: tarefas recorrentes agora usam backoff exponencial de retry após erros consecutivos (30s → 1m → 5m → 15m → 60m), e retornam ao agendamento normal após a próxima execução bem-sucedida.

Nota: `opencraft cron run` agora retorna assim que a execução manual é enfileirada. Respostas bem-sucedidas incluem `{ ok: true, enqueued: true, runId }`; use `opencraft cron runs --id <job-id>` para acompanhar o resultado final.

Nota: retenção/limpeza é controlada na config:

- `cron.sessionRetention` (padrão `24h`) limpa sessões de execução isoladas concluídas.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` limpam `~/.opencraft/cron/runs/<jobId>.jsonl`.

Nota de atualização: se você tem tarefas Cron mais antigas de antes do formato atual de entrega/armazenamento, execute
`opencraft doctor --fix`. O Doctor agora normaliza campos Cron legados (`jobId`, `schedule.cron`,
campos de entrega de nível superior, aliases de entrega `provider` no payload) e migra tarefas simples
de fallback webhook `notify: true` para entrega webhook explícita quando `cron.webhook` está
configurado.

## Edições comuns

Atualize configurações de entrega sem alterar a mensagem:

```bash
opencraft cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desabilite a entrega para uma tarefa isolada:

```bash
opencraft cron edit <job-id> --no-deliver
```

Habilite contexto de bootstrap leve para uma tarefa isolada:

```bash
opencraft cron edit <job-id> --light-context
```

Anuncie para um canal específico:

```bash
opencraft cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Crie uma tarefa isolada com contexto de bootstrap leve:

```bash
opencraft cron add \
  --name "Resumo matinal leve" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Resuma as atualizações da noite." \
  --light-context \
  --no-deliver
```

`--light-context` se aplica apenas a tarefas de turno de agente isoladas. Para execuções Cron, o modo leve mantém o contexto de bootstrap vazio em vez de injetar o conjunto completo de bootstrap do workspace.
