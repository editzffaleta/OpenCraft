---
summary: "Solucionar problemas de agendamento e entrega de Cron e heartbeat"
read_when:
  - Cron não executou
  - Cron executou mas nenhuma mensagem foi entregue
  - Heartbeat parece silencioso ou foi pulado
title: "Automation Troubleshooting"
---

# Solução de problemas de automação

Use esta página para problemas de agendador e entrega (`cron` + `heartbeat`).

## Escada de comandos

```bash
opencraft status
opencraft gateway status
opencraft logs --follow
opencraft doctor
opencraft channels status --probe
```

Depois execute verificações de automação:

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

Uma saída boa se parece com:

- `cron status` reporta habilitado e um `nextWakeAtMs` futuro.
- O job está habilitado e tem um agendamento/fuso horário válido.
- `cron runs` mostra `ok` ou razão explícita de pulo.

Assinaturas comuns:

- `cron: scheduler disabled; jobs will not run automatically` → Cron desabilitado na configuração/env.
- `cron: timer tick failed` → tick do agendador falhou; inspecione o stack/contexto de log ao redor.
- `reason: not-due` na saída de execução → execução manual chamada sem `--force` e o job ainda não está no horário.

## Cron disparou mas sem entrega

```bash
opencraft cron runs --id <jobId> --limit 20
opencraft cron list
opencraft channels status --probe
opencraft logs --follow
```

Uma saída boa se parece com:

- Status da execução é `ok`.
- Modo/alvo de entrega estão definidos para jobs isolados.
- Sondagem do canal reporta canal alvo conectado.

Assinaturas comuns:

- Execução bem-sucedida mas modo de entrega é `none` → nenhuma mensagem externa é esperada.
- Alvo de entrega ausente/inválido (`channel`/`to`) → execução pode ter sucesso internamente mas pular saída.
- Erros de autenticação do canal (`unauthorized`, `missing_scope`, `Forbidden`) → entrega bloqueada por credenciais/permissões do canal.

## Heartbeat suprimido ou pulado

```bash
opencraft system heartbeat last
opencraft logs --follow
opencraft config get agents.defaults.heartbeat
opencraft channels status --probe
```

Uma saída boa se parece com:

- Heartbeat habilitado com intervalo diferente de zero.
- Último resultado do heartbeat é `ran` (ou razão de pulo é compreendida).

Assinaturas comuns:

- `heartbeat skipped` com `reason=quiet-hours` → fora do `activeHours`.
- `requests-in-flight` → faixa principal ocupada; heartbeat adiado.
- `empty-heartbeat-file` → heartbeat de intervalo pulado porque `HEARTBEAT.md` não tem conteúdo acionável e nenhum evento Cron marcado está na fila.
- `alerts-disabled` → configurações de visibilidade suprimem mensagens de heartbeat de saída.

## Armadilhas de fuso horário e activeHours

```bash
opencraft config get agents.defaults.heartbeat.activeHours
opencraft config get agents.defaults.heartbeat.activeHours.timezone
opencraft config get agents.defaults.userTimezone || echo "agents.defaults.userTimezone not set"
opencraft cron list
opencraft logs --follow
```

Regras rápidas:

- `Config path not found: agents.defaults.userTimezone` significa que a chave não está definida; heartbeat recorre ao fuso horário do host (ou `activeHours.timezone` se definido).
- Cron sem `--tz` usa o fuso horário do host do Gateway.
- `activeHours` do heartbeat usa resolução de fuso horário configurada (`user`, `local`, ou tz IANA explícito).
- Timestamps ISO sem fuso horário são tratados como UTC para agendamentos Cron `at`.

Assinaturas comuns:

- Jobs executam no horário errado após mudanças de fuso horário do host.
- Heartbeat sempre pulado durante o dia porque `activeHours.timezone` está errado.

Relacionados:

- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)
- [/automation/cron-vs-heartbeat](/automation/cron-vs-heartbeat)
- [/concepts/timezone](/concepts/timezone)
