---
summary: "Referência do CLI para `opencraft cron` (agendar e rodar jobs em background)"
read_when:
  - Você quer jobs agendados e wakeups
  - Você está depurando execução de cron e logs
title: "cron"
---

# `opencraft cron`

Gerenciar cron jobs para o agendador do Gateway.

Relacionado:

- Cron jobs: [Cron jobs](/automation/cron-jobs)

Dica: rode `opencraft cron --help` para a superfície completa de comandos.

Nota: jobs isolados de `cron add` padrão para entrega `--announce`. Use `--no-deliver` para manter
saída interna. `--deliver` permanece como alias depreciado para `--announce`.

Nota: jobs one-shot (`--at`) deletam após sucesso por padrão. Use `--keep-after-run` para mantê-los.

Nota: jobs recorrentes agora usam backoff exponencial de retry após erros consecutivos (30s → 1m → 5m → 15m → 60m), depois retornam ao agendamento normal após a próxima execução bem-sucedida.

Nota: `opencraft cron run` agora retorna assim que a execução manual está na fila para execução. Respostas bem-sucedidas incluem `{ ok: true, enqueued: true, runId }`; use `opencraft cron runs --id <job-id>` para acompanhar o resultado eventual.

Nota: retenção/poda é controlada na config:

- `cron.sessionRetention` (padrão `24h`) poda sessões de execução isoladas concluídas.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podam `~/.opencraft/cron/runs/<jobId>.jsonl`.

Nota de upgrade: se você tem cron jobs mais antigos de antes do formato atual de entrega/store, rode
`opencraft doctor --fix`. Doctor agora normaliza campos legados de cron (`jobId`, `schedule.cron`,
campos de entrega de nível superior, aliases de entrega de `provider` no payload) e migra
jobs simples de fallback de webhook `notify: true` para entrega webhook explícita quando `cron.webhook` está
configurado.

## Edições comuns

Atualizar configurações de entrega sem mudar a mensagem:

```bash
opencraft cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desabilitar entrega para um job isolado:

```bash
opencraft cron edit <job-id> --no-deliver
```

Habilitar contexto de bootstrap leve para um job isolado:

```bash
opencraft cron edit <job-id> --light-context
```

Announce para um canal específico:

```bash
opencraft cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Criar um job isolado com contexto de bootstrap leve:

```bash
opencraft cron add \
  --name "Briefing matinal leve" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Resumir atualizações da noite." \
  --light-context \
  --no-deliver
```

`--light-context` se aplica apenas a jobs isolados de turno de agente. Para execuções cron, modo leve mantém o contexto de bootstrap vazio em vez de injetar o conjunto completo de bootstrap do workspace.
