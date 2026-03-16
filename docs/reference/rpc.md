---
summary: "Adaptadores RPC para CLIs externos (signal-cli, imsg legado) e padrões do gateway"
read_when:
  - Adicionando ou alterando integrações de CLI externas
  - Depurando adaptadores RPC (signal-cli, imsg)
title: "Adaptadores RPC"
---

# Adaptadores RPC

O OpenCraft integra CLIs externos via JSON-RPC. Dois padrões são usados hoje.

## Padrão A: daemon HTTP (signal-cli)

- `signal-cli` roda como daemon com JSON-RPC sobre HTTP.
- Stream de eventos é SSE (`/api/v1/events`).
- Probe de saúde: `/api/v1/check`.
- O OpenCraft gerencia o ciclo de vida quando `channels.signal.autoStart=true`.

Veja [Signal](/channels/signal) para configuração e endpoints.

## Padrão B: processo filho stdio (legado: imsg)

> **Nota:** Para novas configurações de iMessage, use [BlueBubbles](/channels/bluebubbles) em vez disso.

- O OpenCraft inicia `imsg rpc` como processo filho (integração legada de iMessage).
- JSON-RPC é delimitado por linhas via stdin/stdout (um objeto JSON por linha).
- Sem porta TCP, sem necessidade de daemon.

Métodos principais usados:

- `watch.subscribe` → notificações (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnósticos)

Veja [iMessage](/channels/imessage) para configuração legada e endereçamento (`chat_id` preferido).

## Diretrizes de adaptador

- O Gateway gerencia o processo (início/parada vinculados ao ciclo de vida do provedor).
- Mantenha os clientes RPC resilientes: timeouts, reiniciar ao sair.
- Prefira IDs estáveis (ex: `chat_id`) em vez de strings de exibição.
