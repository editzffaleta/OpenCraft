---
summary: "Referência do CLI para `opencraft system` (eventos de sistema, heartbeat, presence)"
read_when:
  - Você quer enfileirar um evento de sistema sem criar um cron job
  - Você precisa habilitar ou desabilitar heartbeats
  - Você quer inspecionar entradas de presença de sistema
title: "system"
---

# `opencraft system`

Helpers de nível de sistema para o Gateway: enfileirar eventos de sistema, controlar heartbeats
e ver presença.

## Comandos comuns

```bash
opencraft system event --text "Check for urgent follow-ups" --mode now
opencraft system heartbeat enable
opencraft system heartbeat last
opencraft system presence
```

## `system event`

Enfileirar um evento de sistema na sessão **main**. O próximo heartbeat irá injetá-lo
como uma linha `System:` no prompt. Use `--mode now` para acionar o heartbeat
imediatamente; `next-heartbeat` aguarda o próximo tick agendado.

Flags:

- `--text <text>`: texto do evento de sistema (obrigatório).
- `--mode <mode>`: `now` ou `next-heartbeat` (padrão).
- `--json`: saída legível por máquina.

## `system heartbeat last|enable|disable`

Controles de heartbeat:

- `last`: mostrar o último evento de heartbeat.
- `enable`: ligar heartbeats de volta (use se foram desabilitados).
- `disable`: pausar heartbeats.

Flags:

- `--json`: saída legível por máquina.

## `system presence`

Listar as entradas de presença de sistema atuais que o Gateway conhece (nodes,
instâncias e linhas de status similares).

Flags:

- `--json`: saída legível por máquina.

## Notas

- Requer um Gateway em execução acessível pela sua config atual (local ou remoto).
- Eventos de sistema são efêmeros e não persistem entre reinicializações.
