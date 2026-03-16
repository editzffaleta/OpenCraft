---
title: Refatoração de Espelhamento de Sessão de Saída (Issue #1520)
description: Acompanhar notas, decisões, testes e itens em aberto da refatoração de espelhamento de sessão de saída.
summary: "Notas de refatoração para espelhamento de envios de saída em sessões do canal alvo"
read_when:
  - Trabalhando no comportamento de espelhamento de transcrição/sessão de saída
  - Depurando derivação de sessionKey para caminhos de ferramentas send/message
---

# Refatoração de Espelhamento de Sessão de Saída (Issue #1520)

## Status

- Em andamento.
- Roteamento do canal de núcleo + plugin atualizado para espelhamento de saída.
- O envio do gateway agora deriva a sessão alvo quando sessionKey é omitido.

## Contexto

Envios de saída eram espelhados na sessão do agente _atual_ (chave de sessão da ferramenta) em vez da sessão do canal alvo. O roteamento de entrada usa chaves de sessão de canal/peer, então as respostas de saída chegavam na sessão errada e alvos de primeiro contato frequentemente não tinham entradas de sessão.

## Objetivos

- Espelhar mensagens de saída na chave de sessão do canal alvo.
- Criar entradas de sessão na saída quando ausentes.
- Manter o escopo de thread/tópico alinhado com as chaves de sessão de entrada.
- Cobrir os canais centrais mais as extensões incluídas.

## Resumo de Implementação

- Novo helper de roteamento de sessão de saída:
  - `src/infra/outbound/outbound-session.ts`
  - `resolveOutboundSessionRoute` constrói sessionKey alvo usando `buildAgentSessionKey` (dmScope + identityLinks).
  - `ensureOutboundSessionEntry` escreve `MsgContext` mínimo via `recordSessionMetaFromInbound`.
- `runMessageAction` (send) deriva sessionKey alvo e passa para `executeSendAction` para espelhamento.
- `message-tool` não espelha mais diretamente; apenas resolve agentId a partir da chave de sessão atual.
- O caminho de envio do plugin espelha via `appendAssistantMessageToSessionTranscript` usando a sessionKey derivada.
- O envio do gateway deriva uma chave de sessão alvo quando nenhuma é fornecida (agente padrão) e garante uma entrada de sessão.

## Tratamento de Thread/Tópico

- Slack: replyTo/threadId -> `resolveThreadSessionKeys` (sufixo).
- Discord: threadId/replyTo -> `resolveThreadSessionKeys` com `useSuffix=false` para corresponder à entrada (id do canal da thread já escopa a sessão).
- Telegram: IDs de tópico mapeiam para `chatId:topic:<id>` via `buildTelegramGroupPeerId`.

## Extensões Cobertas

- Matrix, MS Teams, Mattermost, BlueBubbles, Nextcloud Talk, Zalo, Zalo Personal, Nostr, Tlon.
- Notas:
  - Alvos do Mattermost agora removem `@` para roteamento de chave de sessão DM.
  - Zalo Personal usa tipo de peer DM para alvos 1:1 (group apenas quando `group:` está presente).
  - Alvos de grupo do BlueBubbles removem prefixos `chat_*` para corresponder às chaves de sessão de entrada.
  - Espelhamento de auto-thread do Slack corresponde ids de canal sem distinção de maiúsculas/minúsculas.
  - O envio do gateway converte para minúsculas as chaves de sessão fornecidas antes do espelhamento.

## Decisões

- **Derivação de sessão de envio do gateway**: se `sessionKey` for fornecido, usá-lo. Se omitido, derivar uma sessionKey a partir do alvo + agente padrão e espelhar lá.
- **Criação de entrada de sessão**: sempre usar `recordSessionMetaFromInbound` com `Provider/From/To/ChatType/AccountId/Originating*` alinhados aos formatos de entrada.
- **Normalização do alvo**: o roteamento de saída usa alvos resolvidos (pós `resolveChannelTarget`) quando disponíveis.
- **Caixa da chave de sessão**: canonicalizar chaves de sessão para minúsculas na escrita e durante migrações.

## Testes Adicionados/Atualizados

- `src/infra/outbound/outbound.test.ts`
  - Chave de sessão de thread do Slack.
  - Chave de sessão de tópico do Telegram.
  - dmScope identityLinks com Discord.
- `src/agents/tools/message-tool.test.ts`
  - Deriva agentId a partir da chave de sessão (sem sessionKey passado).
- `src/gateway/server-methods/send.test.ts`
  - Deriva chave de sessão quando omitida e cria entrada de sessão.

## Itens em Aberto / Acompanhamentos

- O plugin voice-call usa chaves de sessão `voice:<phone>` personalizadas. O mapeamento de saída não está padronizado aqui; se message-tool deve suportar envios via voice-call, adicionar mapeamento explícito.
- Confirmar se algum plugin externo usa formatos `From/To` não padrão além do conjunto incluído.

## Arquivos Tocados

- `src/infra/outbound/outbound-session.ts`
- `src/infra/outbound/outbound-send-service.ts`
- `src/infra/outbound/message-action-runner.ts`
- `src/agents/tools/message-tool.ts`
- `src/gateway/server-methods/send.ts`
- Testes em:
  - `src/infra/outbound/outbound.test.ts`
  - `src/agents/tools/message-tool.test.ts`
  - `src/gateway/server-methods/send.test.ts`
