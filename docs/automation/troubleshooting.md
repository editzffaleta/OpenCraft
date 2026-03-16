---
summary: "Solucionar problemas de agendamento e entrega de cron e heartbeat"
read_when:
  - Cron não rodou
  - Cron rodou mas nenhuma mensagem foi entregue
  - Heartbeat parece silencioso ou pulado
title: "Resolução de Problemas de Automação"
---

# Resolução de problemas de automação

Use esta página para problemas de agendador e entrega (`cron` + `heartbeat`).

## Escada de comandos

```bash
opencraft status
opencraft gateway status
opencraft logs --follow
opencraft doctor
opencraft channels status --probe
```

Depois rode verificações de automação:

```bash
opencraft cron status
opencraft cron list
opencraft system heartbeat last
```

## Cron não disparando

```bash
opencraft cron status
opencraft cron list
opencraft cron runs --id <jobId> --limit 20
opencraft logs --follow
```

Saída boa parece:

- `cron status` relata habilitado e um `nextWakeAtMs` futuro.
- Job está habilitado e tem um agendamento/timezone válido.
- `cron runs` mostra `ok` ou razão de skip explícita.

Assinaturas comuns:

- `cron: scheduler disabled; jobs will not run automatically` → cron desabilitado em config/env.
- `cron: timer tick failed` → tick do agendador travou; inspecione contexto de stack/log circundante.
- `reason: not-due` na saída de execução → execução manual chamada sem `--force` e job não está due ainda.

## Cron disparou mas sem entrega

```bash
opencraft cron runs --id <jobId> --limit 20
opencraft cron list
opencraft channels status --probe
opencraft logs --follow
```

Saída boa parece:

- Status de execução é `ok`.
- Modo/alvo de entrega estão definidos para jobs isolados.
- Probe de canal relata canal alvo conectado.

Assinaturas comuns:

- Execução bem-sucedida mas modo de entrega é `none` → nenhuma mensagem externa é esperada.
- Alvo de entrega ausente/inválido (`channel`/`to`) → execução pode ter sucesso internamente mas pular saída.
- Erros de auth de canal (`unauthorized`, `missing_scope`, `Forbidden`) → entrega bloqueada por credenciais/permissões do canal.

## Heartbeat suprimido ou pulado

```bash
opencraft system heartbeat last
opencraft logs --follow
opencraft config get agents.defaults.heartbeat
opencraft channels status --probe
```

Saída boa parece:

- Heartbeat habilitado com intervalo não-zero.
- Último resultado do heartbeat é `ran` (ou razão de skip é compreendida).

Assinaturas comuns:

- `heartbeat skipped` com `reason=quiet-hours` → fora de `activeHours`.
- `requests-in-flight` → lane principal ocupada; heartbeat adiado.
- `empty-heartbeat-file` → heartbeat de intervalo pulado porque `HEARTBEAT.md` não tem conteúdo acionável e nenhum evento cron marcado está na fila.
- `alerts-disabled` → configurações de visibilidade suprimem mensagens de heartbeat de saída.

## Armadilhas de timezone e activeHours

```bash
opencraft config get agents.defaults.heartbeat.activeHours
opencraft config get agents.defaults.heartbeat.activeHours.timezone
opencraft config get agents.defaults.userTimezone || echo "agents.defaults.userTimezone não definido"
opencraft cron list
opencraft logs --follow
```

Regras rápidas:

- `Config path not found: agents.defaults.userTimezone` significa que a chave não está definida; heartbeat faz fallback para timezone do host (ou `activeHours.timezone` se definido).
- Cron sem `--tz` usa timezone do host do gateway.
- `activeHours` do heartbeat usa resolução de timezone configurada (`user`, `local`, ou tz IANA explícito).
- Timestamps ISO sem timezone são tratados como UTC para agendamentos `at` do cron.

Assinaturas comuns:

- Jobs rodam no horário de relógio errado após mudanças de timezone do host.
- Heartbeat sempre pulado durante seu horário diurno porque `activeHours.timezone` está errado.

Relacionado:

- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)
- [/automation/cron-vs-heartbeat](/automation/cron-vs-heartbeat)
- [/concepts/timezone](/concepts/timezone)
