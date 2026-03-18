---
name: discord
description: "Operações no Discord via a ferramenta message (channel=discord)."
metadata: { "opencraft": { "emoji": "🎮", "requires": { "config": ["channels.discord.token"] } } }
allowed-tools: ["message"]
---

# Discord (Via `message`)

Use a ferramenta `message`. Nenhuma ferramenta `discord` específica do provedor é exposta ao agente.

## Obrigações

- Sempre: `channel: "discord"`.
- Respeite o gating: `channels.discord.actions.*` (alguns estão desativados por padrão: `roles`, `moderation`, `presence`, `channels`).
- Prefira IDs explícitos: `guildId`, `channelId`, `messageId`, `userId`.
- Multi-conta: `accountId` opcional.

## Diretrizes

- Evite tabelas Markdown em mensagens enviadas ao Discord.
- Mencione usuários como `<@USER_ID>`.
- Prefira componentes Discord v2 (`components`) para UI rica; use `embeds` legado somente quando necessário.

## Alvos

- Ações de envio: `to: "channel:<id>"` ou `to: "user:<id>"`.
- Ações específicas de mensagem: `channelId: "<id>"` (ou `to`) + `messageId: "<id>"`.

## Ações comuns (exemplos)

Enviar mensagem:

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "hello",
  "silent": true
}
```

Enviar com mídia:

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "see attachment",
  "media": "file:///tmp/example.png"
}
```

- `silent: true` opcional para suprimir notificações do Discord.

Enviar com componentes v2 (recomendado para UI rica):

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "Status update",
  "components": "[Carbon v2 components]"
}
```

- `components` espera instâncias de componentes Carbon (Container, TextDisplay, etc.) de integrações JS/TS.
- Não combine `components` com `embeds` (o Discord rejeita v2 + embeds).

Embeds legado (não recomendado):

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "Status update",
  "embeds": [{ "title": "Legacy", "description": "Embeds are legacy." }]
}
```

- `embeds` são ignorados quando componentes v2 estão presentes.

Reagir:

```json
{
  "action": "react",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456",
  "emoji": "✅"
}
```

Ler:

```json
{
  "action": "read",
  "channel": "discord",
  "to": "channel:123",
  "limit": 20
}
```

Editar / excluir:

```json
{
  "action": "edit",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456",
  "message": "fixed typo"
}
```

```json
{
  "action": "delete",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456"
}
```

Enquete:

```json
{
  "action": "poll",
  "channel": "discord",
  "to": "channel:123",
  "pollQuestion": "Lunch?",
  "pollOption": ["Pizza", "Sushi", "Salad"],
  "pollMulti": false,
  "pollDurationHours": 24
}
```

Fixar mensagens:

```json
{
  "action": "pin",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456"
}
```

Threads:

```json
{
  "action": "thread-create",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456",
  "threadName": "bug triage"
}
```

Pesquisar:

```json
{
  "action": "search",
  "channel": "discord",
  "guildId": "999",
  "query": "release notes",
  "channelIds": ["123", "456"],
  "limit": 10
}
```

Presença (frequentemente com gating):

```json
{
  "action": "set-presence",
  "channel": "discord",
  "activityType": "playing",
  "activityName": "with fire",
  "status": "online"
}
```

## Estilo de escrita (Discord)

- Curto, conversacional, sem cerimônias.
- Sem tabelas markdown.
- Mencione usuários como `<@USER_ID>`.
