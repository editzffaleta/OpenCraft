---
summary: "Como o app mac incorpora o WebChat do gateway e como depurá-lo"
read_when:
  - Depurando a view WebChat do mac ou porta loopback
title: "WebChat"
---

# WebChat (app macOS)

O app de barra de menu macOS incorpora a UI do WebChat como uma view SwiftUI nativa. Ele
se conecta ao Gateway e usa como padrão a **sessão main** para o agente selecionado
(com um seletor de sessão para outras sessões).

- **Modo local**: conecta diretamente ao WebSocket do Gateway local.
- **Modo remoto**: encaminha a porta de controle do Gateway via SSH e usa esse
  túnel como plano de dados.

## Lançamento e depuração

- Manual: menu Lobster → "Open Chat".
- Abertura automática para testes:

  ```bash
  dist/OpenCraft.app/Contents/MacOS/OpenCraft --webchat
  ```

- Logs: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, categoria `WebChatSwiftUI`).

## Como está conectado

- Plano de dados: métodos WS do Gateway `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` e eventos `chat`, `agent`, `presence`, `tick`, `health`.
- Sessão: usa como padrão a sessão primária (`main`, ou `global` quando o escopo é
  global). A UI pode alternar entre sessões.
- O onboarding usa uma sessão dedicada para manter a configuração inicial separada.

## Superfície de segurança

- O modo remoto encaminha apenas a porta de controle do WebSocket do Gateway via SSH.

## Limitações conhecidas

- A UI é otimizada para sessões de chat (não é um sandbox completo de navegador).
