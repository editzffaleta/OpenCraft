---
summary: "Referência CLI para `opencraft system` (eventos do sistema, heartbeat, presença)"
read_when:
  - Você quer enfileirar um evento do sistema sem criar um job Cron
  - Você precisa habilitar ou desabilitar heartbeats
  - Você quer inspecionar entradas de presença do sistema
title: "system"
---

# `opencraft system`

Auxiliares de nível de sistema para o Gateway: enfileirar eventos do sistema, controlar heartbeats
e visualizar presença.

## Comandos comuns

```bash
opencraft system event --text "Check for urgent follow-ups" --mode now
opencraft system heartbeat enable
opencraft system heartbeat last
opencraft system presence
```

## `system event`

Enfileirar um evento do sistema na sessão **principal**. O próximo heartbeat irá injetá-lo
como uma linha `System:` no prompt. Use `--mode now` para acionar o heartbeat
imediatamente; `next-heartbeat` espera pelo próximo tick agendado.

Flags:

- `--text <text>`: texto do evento do sistema obrigatório.
- `--mode <mode>`: `now` ou `next-heartbeat` (padrão).
- `--json`: saída legível por máquina.

## `system heartbeat last|enable|disable`

Controles de heartbeat:

- `last`: mostrar o último evento de heartbeat.
- `enable`: reativar heartbeats (use se foram desabilitados).
- `disable`: pausar heartbeats.

Flags:

- `--json`: saída legível por máquina.

## `system presence`

Listar as entradas de presença atuais do sistema que o Gateway conhece (nós,
instâncias e linhas de status similares).

Flags:

- `--json`: saída legível por máquina.

## Notas

- Requer um Gateway em execução acessível pela sua configuração atual (local ou remoto).
- Eventos do sistema são efêmeros e não são persistidos entre reinicializações.
