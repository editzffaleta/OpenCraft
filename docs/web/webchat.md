---
summary: "Host estático de WebChat loopback e uso do Gateway WS para UI de chat"
read_when:
  - Depurando ou configurando acesso ao WebChat
title: "WebChat"
---

# WebChat (UI de WebSocket do Gateway)

Status: a UI de chat SwiftUI do macOS/iOS fala diretamente com o WebSocket do Gateway.

## O que é

- Uma UI de chat nativa para o gateway (sem browser embutido e sem servidor estático local).
- Usa as mesmas sessões e regras de roteamento que outros canais.
- Roteamento determinístico: respostas sempre voltam para o WebChat.

## Início rápido

1. Inicie o gateway.
2. Abra a UI WebChat (app macOS/iOS) ou a aba de chat da Control UI.
3. Certifique-se de que a auth do gateway está configurada (necessária por padrão, mesmo no loopback).

## Como funciona (comportamento)

- A UI conecta ao WebSocket do Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` é limitado para estabilidade: o Gateway pode truncar campos de texto longos, omitir metadados pesados e substituir entradas muito grandes por `[chat.history omitted: message too large]`.
- `chat.inject` acrescenta uma nota de assistente diretamente ao transcript e a transmite para a UI (sem execução de agente).
- Execuções abortadas podem manter saída parcial do assistente visível na UI.
- O Gateway persiste texto parcial de assistente abortado no histórico do transcript quando há saída em buffer, e marca essas entradas com metadados de abort.
- O histórico é sempre buscado do gateway (sem monitoramento de arquivo local).
- Se o gateway estiver inacessível, o WebChat fica somente leitura.

## Painel de tools de agentes da Control UI

- O painel Tools de `/agents` da Control UI busca um catálogo em runtime via `tools.catalog` e rotula cada
  tool como `core` ou `plugin:<id>` (mais `optional` para tools opcionais de plugin).
- Se `tools.catalog` estiver indisponível, o painel cai de volta para uma lista estática embutida.
- O painel edita config de perfil e sobrescrição, mas o acesso em runtime efetivo ainda segue a
  precedência de política (`allow`/`deny`, sobrescrições por agente e provedor/canal).

## Uso remoto

- Modo remoto tunela o WebSocket do gateway via SSH/Tailscale.
- Você não precisa rodar um servidor WebChat separado.

## Referência de configuração (WebChat)

Configuração completa: [Configuração](/gateway/configuration)

Opções de canal:

- Sem bloco dedicado `webchat.*`. O WebChat usa o endpoint do gateway + configurações de auth abaixo.

Opções globais relacionadas:

- `gateway.port`, `gateway.bind`: host/porta WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`: auth WebSocket (token/senha).
- `gateway.auth.mode: "trusted-proxy"`: auth de reverse-proxy para clientes browser (veja [Auth de Proxy Confiável](/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: alvo de gateway remoto.
- `session.*`: padrões de armazenamento de sessão e chave principal.
