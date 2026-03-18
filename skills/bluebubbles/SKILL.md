---
name: bluebubbles
description: Use quando precisar enviar ou gerenciar iMessages via BlueBubbles (integração iMessage recomendada). As chamadas passam pela ferramenta genérica de mensagens com channel="bluebubbles".
metadata: { "opencraft": { "emoji": "🫧", "requires": { "config": ["channels.bluebubbles"] } } }
---

# Ações do BlueBubbles

## Visão Geral

O BlueBubbles é a integração iMessage recomendada do OpenCraft. Use a ferramenta `message` com `channel: "bluebubbles"` para enviar mensagens e gerenciar conversas do iMessage: enviar textos e anexos, reagir (tapbacks), editar/cancelar envio, responder em threads e gerenciar participantes/nomes/ícones de grupos.

## Dados a coletar

- `target` (prefira `chat_guid:...`; também aceita `+15551234567` em formato E.164 ou `user@example.com`)
- texto da `message` para envio/edição/resposta
- `messageId` para reagir/editar/cancelar envio/responder
- `path` do anexo para arquivos locais, ou `buffer` + `filename` para base64

Se o usuário for vago ("manda mensagem para a minha mãe"), peça o handle do destinatário ou o guid do chat e o conteúdo exato da mensagem.

## Ações

### Enviar uma mensagem

```json
{
  "action": "send",
  "channel": "bluebubbles",
  "target": "+15551234567",
  "message": "hello from OpenCraft"
}
```

### Reagir (tapback)

```json
{
  "action": "react",
  "channel": "bluebubbles",
  "target": "+15551234567",
  "messageId": "<message-guid>",
  "emoji": "❤️"
}
```

### Remover uma reação

```json
{
  "action": "react",
  "channel": "bluebubbles",
  "target": "+15551234567",
  "messageId": "<message-guid>",
  "emoji": "❤️",
  "remove": true
}
```

### Editar uma mensagem enviada anteriormente

```json
{
  "action": "edit",
  "channel": "bluebubbles",
  "target": "+15551234567",
  "messageId": "<message-guid>",
  "message": "updated text"
}
```

### Cancelar envio de uma mensagem

```json
{
  "action": "unsend",
  "channel": "bluebubbles",
  "target": "+15551234567",
  "messageId": "<message-guid>"
}
```

### Responder a uma mensagem específica

```json
{
  "action": "reply",
  "channel": "bluebubbles",
  "target": "+15551234567",
  "replyTo": "<message-guid>",
  "message": "replying to that"
}
```

### Enviar um anexo

```json
{
  "action": "sendAttachment",
  "channel": "bluebubbles",
  "target": "+15551234567",
  "path": "/tmp/photo.jpg",
  "caption": "here you go"
}
```

### Enviar com um efeito do iMessage

```json
{
  "action": "sendWithEffect",
  "channel": "bluebubbles",
  "target": "+15551234567",
  "message": "big news",
  "effect": "balloons"
}
```

## Observações

- Requer configuração de gateway `channels.bluebubbles` (serverUrl/password/webhookPath).
- Prefira alvos `chat_guid` quando disponíveis (especialmente para chats em grupo).
- O BlueBubbles suporta ações avançadas, mas algumas dependem da versão do macOS (por exemplo, editar pode estar quebrado no macOS 26 Tahoe).
- O gateway pode expor tanto IDs curtos quanto completos de mensagens; IDs completos são mais duráveis entre reinicializações.
- A referência para desenvolvedores do plugin subjacente está em `extensions/bluebubbles/README.md`.

## Ideias para experimentar

- Reagir com um tapback para confirmar uma solicitação.
- Responder em thread quando um usuário referencia uma mensagem específica.
- Enviar um anexo de arquivo com uma legenda curta.
