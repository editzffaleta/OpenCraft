---
name: bluebubbles
description: Use quando precisar enviar ou gerenciar iMessages via BlueBubbles (integração iMessage recomendada). As chamadas passam pela ferramenta message genérica com channel="bluebubbles".
metadata: { "opencraft": { "emoji": "🫧", "requires": { "config": ["channels.bluebubbles"] } } }
---

# Ações BlueBubbles

## Visão Geral

BlueBubbles é a integração iMessage recomendada do OpenCraft. Use a ferramenta `message` com `channel: "bluebubbles"` para enviar mensagens e gerenciar conversas iMessage: enviar textos e anexos, reagir (tapbacks), editar/desfazer envio, responder em threads e gerenciar participantes/nomes/ícones de grupos.

## Entradas a coletar

- `target` (prefira `chat_guid:...`; também `+5511999999999` em E.164 ou `usuario@exemplo.com`)
- Texto `message` para envio/edição/resposta
- `messageId` para react/editar/desfazer/responder
- `path` de anexo para arquivos locais, ou `buffer` + `filename` para base64

Se o usuário for vago ("manda mensagem pra minha mãe"), peça o handle do destinatário ou chat guid e o conteúdo exato da mensagem.

## Ações

### Enviar uma mensagem

```json
{
  "action": "send",
  "channel": "bluebubbles",
  "target": "+5511999999999",
  "message": "olá do OpenCraft"
}
```

### Reagir (tapback)

```json
{
  "action": "react",
  "channel": "bluebubbles",
  "target": "+5511999999999",
  "messageId": "<message-guid>",
  "emoji": "❤️"
}
```

### Remover uma reação

```json
{
  "action": "react",
  "channel": "bluebubbles",
  "target": "+5511999999999",
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
  "target": "+5511999999999",
  "messageId": "<message-guid>",
  "message": "texto atualizado"
}
```

### Desfazer envio de uma mensagem

```json
{
  "action": "unsend",
  "channel": "bluebubbles",
  "target": "+5511999999999",
  "messageId": "<message-guid>"
}
```

### Responder a uma mensagem específica

```json
{
  "action": "reply",
  "channel": "bluebubbles",
  "target": "+5511999999999",
  "replyTo": "<message-guid>",
  "message": "respondendo a isso"
}
```

### Enviar um anexo

```json
{
  "action": "sendAttachment",
  "channel": "bluebubbles",
  "target": "+5511999999999",
  "path": "/tmp/foto.jpg",
  "caption": "aqui está"
}
```

### Enviar com efeito iMessage

```json
{
  "action": "sendWithEffect",
  "channel": "bluebubbles",
  "target": "+5511999999999",
  "message": "grande novidade",
  "effect": "balloons"
}
```

## Notas

- Requer configuração do gateway `channels.bluebubbles` (serverUrl/password/webhookPath).
- Prefira targets `chat_guid` quando os tiver (especialmente para chats em grupo).
- BlueBubbles suporta ações ricas, mas algumas dependem da versão do macOS (por exemplo, editar pode estar quebrado no macOS 26 Tahoe).
- O gateway pode expor IDs de mensagem curtos e completos; IDs completos são mais duráveis entre reinicializações.
- Referência de desenvolvedor para o plugin subjacente em `extensions/bluebubbles/README.md`.

## Ideias para experimentar

- Reagir com tapback para confirmar uma solicitação.
- Responder em thread quando um usuário referencia uma mensagem específica.
- Enviar um anexo de arquivo com uma legenda curta.
