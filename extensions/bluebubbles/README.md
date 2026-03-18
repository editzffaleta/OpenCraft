# Extensão BlueBubbles (referência para desenvolvedores)

Este diretório contém o **plugin de canal externo BlueBubbles** para o OpenCraft.

Se você estiver procurando **como usar o BlueBubbles como usuário de agente/ferramenta**, consulte:

- `skills/bluebubbles/SKILL.md`

## Estrutura

- Pacote da extensão: `extensions/bluebubbles/` (entrada: `index.ts`).
- Implementação do canal: `extensions/bluebubbles/src/channel.ts`.
- Tratamento de webhooks: `extensions/bluebubbles/src/monitor.ts` (registra rota por conta via `registerPluginHttpRoute`).
- Utilitários REST: `extensions/bluebubbles/src/send.ts` + `extensions/bluebubbles/src/probe.ts`.
- Bridge de runtime: `extensions/bluebubbles/src/runtime.ts` (definido via `api.runtime`).
- Entrada no catálogo para seleção de configuração: `src/channels/plugins/catalog.ts`.

## Utilitários internos (use estes, não chamadas diretas à API)

- `probeBlueBubbles` em `extensions/bluebubbles/src/probe.ts` para verificações de saúde.
- `sendMessageBlueBubbles` em `extensions/bluebubbles/src/send.ts` para entrega de texto.
- `resolveChatGuidForTarget` em `extensions/bluebubbles/src/send.ts` para busca de chat.
- `sendBlueBubblesReaction` em `extensions/bluebubbles/src/reactions.ts` para tapbacks.
- `sendBlueBubblesTyping` + `markBlueBubblesChatRead` em `extensions/bluebubbles/src/chat.ts`.
- `downloadBlueBubblesAttachment` em `extensions/bluebubbles/src/attachments.ts` para mídia recebida.
- `buildBlueBubblesApiUrl` + `blueBubblesFetchWithTimeout` em `extensions/bluebubbles/src/types.ts` para a infraestrutura REST compartilhada.

## Webhooks

- O BlueBubbles envia JSON via POST ao servidor HTTP do gateway.
- Normalize os IDs de remetente/chat de forma defensiva (os payloads variam por versão).
- Ignore mensagens marcadas como enviadas por si mesmo.
- Roteie para o pipeline de resposta principal via o runtime do plugin (`api.runtime`) e os utilitários do `opencraft/plugin-sdk`.
- Para anexos/stickers, use placeholders `<media:...>` quando o texto estiver vazio e anexe os caminhos de mídia via `MediaUrl(s)` no contexto de entrada.

## Configuração (núcleo)

- `channels.bluebubbles.serverUrl` (URL base), `channels.bluebubbles.password`, `channels.bluebubbles.webhookPath`.
- Controle de ações: `channels.bluebubbles.actions.reactions` (padrão: true).

## Notas sobre a ferramenta de mensagens

- **Reações:** a ação `react` requer um `target` (número de telefone ou identificador de chat) além do `messageId`.
  Exemplo:
  `action=react target=+15551234567 messageId=ABC123 emoji=❤️`
