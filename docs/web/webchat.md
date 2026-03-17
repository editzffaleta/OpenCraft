---
summary: "Loopback WebChat static host e Gateway WS usage para chat UI"
read_when:
  - Debugando ou configurando WebChat access
title: "WebChat"
---

# WebChat (Gateway WebSocket UI)

Status: o macOS/iOS SwiftUI chat UI fala diretamente com o Gateway WebSocket.

## O que é

- Uma native chat UI para o gateway (sem embedded browser e sem local static server).
- Usa as mesmas sessions e routing rules que outros canais.
- Roteamento determinístico: replies sempre voltam para WebChat.

## Quick start

1. Inicie o gateway.
2. Abra a WebChat UI (macOS/iOS app) ou a Control UI chat tab.
3. Garanta gateway auth está configurado (necessário por padrão, mesmo em loopback).

## Como funciona (comportamento)

- A UI se conecta ao Gateway WebSocket e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` é bounded para estabilidade: Gateway pode truncate long text fields, omitir heavy metadata, e replace oversized entries com `[chat.history omitted: message too large]`.
- `chat.inject` appende uma assistant note diretamente ao transcript e broadcast para a UI (sem agent run).
- Aborted runs podem manter partial assistant output visível na UI.
- Gateway persists aborted partial assistant text em transcript history quando buffered output existe, e marca aquelas entries com abort metadata.
- History é sempre fetched do gateway (sem local file watching).
- Se o gateway é unreachable, WebChat é read-only.

## Control UI agents tools panel

- O Control UI `/agents` Tools panel busca um runtime catalog via `tools.catalog` e labels cada tool como `core` ou `plugin:<id>` (mais `optional` para optional plugin tools).
- Se `tools.catalog` é unavailable, o panel cai para um built-in static list.
- O panel edita profile e override config, mas effective runtime access ainda segue policy precedence (`allow`/`deny`, per-agent e provider/channel overrides).

## Uso remoto

- Modo remoto tunnels o gateway WebSocket sobre SSH/Tailscale.
- Você não precisa executar um WebChat server separado.

## Configuration reference (WebChat)

Configuração completa: [Configuration](/gateway/configuration)

Opções de canal:

- Nenhum bloco `webchat.*` dedicado. WebChat usa o endpoint do gateway + settings de auth abaixo.

Opções globais relacionadas:

- `gateway.port`, `gateway.bind`: WebSocket host/port.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`: WebSocket auth (token/password).
- `gateway.auth.mode: "trusted-proxy"`: reverse-proxy auth para browser clients (veja [Trusted Proxy Auth](/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: remote gateway target.
- `session.*`: session storage e main key defaults.
