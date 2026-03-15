---
name: discord
description: "Operações no Discord via ferramenta message (channel=discord)."
metadata: { "opencraft": { "emoji": "🎮", "requires": { "config": ["channels.discord.token"] } } }
allowed-tools: ["message"]
---

# Discord (Via `message`)

Use a ferramenta `message`. Nenhuma ferramenta `discord` específica do provedor é exposta ao agente.

## Obrigatórios

- Sempre: `channel: "discord"`.
- Respeite o gating: `channels.discord.actions.*` (alguns estão desativados por padrão: `roles`, `moderation`, `presence`, `channels`).
- Prefira ids explícitos: `guildId`, `channelId`, `messageId`, `userId`.
- Multi-conta: `accountId` opcional.

## Diretrizes

- Evite tabelas Markdown em mensagens de saída do Discord.
- Mencione usuários como `<@USER_ID>`.
- Prefira componentes Discord v2 (`components`) para UI rica; use `embeds` legado apenas quando necessário.

## Alvos

- Ações de envio: `to: "channel:<id>"` ou `to: "user:<id>"`.
- Ações específicas de mensagem: `channelId: "<id>"` (ou `to`) + `messageId: "<id>"`.

## Ações Comuns (Exemplos)

Enviar mensagem:

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "olá",
  "silent": true
}
```

Enviar com mídia:

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "veja o anexo",
  "media": "file:///tmp/exemplo.png"
}
```

- `silent: true` opcional para suprimir notificações do Discord.

Enviar com componentes v2 (recomendado para UI rica):

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "Atualização de status",
  "components": "[Componentes Carbon v2]"
}
```

- `components` espera instâncias de componentes Carbon (Container, TextDisplay, etc.) de integrações JS/TS.
- Não combine `components` com `embeds` (Discord rejeita v2 + embeds).

Embeds legados (não recomendado):

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "Atualização de status",
  "embeds": [{ "title": "Legado", "description": "Embeds são legado." }]
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

Editar / deletar:

```json
{
  "action": "edit",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456",
  "message": "erro corrigido"
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
  "pollQuestion": "Almoço?",
  "pollOption": ["Pizza", "Sushi", "Salada"],
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
  "threadName": "triagem de bug"
}
```

Pesquisar:

```json
{
  "action": "search",
  "channel": "discord",
  "guildId": "999",
  "query": "notas de release",
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
  "activityName": "com fogo",
  "status": "online"
}
```

## Estilo de Escrita (Discord)

- Curto, conversacional, pouca cerimônia.
- Sem tabelas markdown.
- Mencione usuários como `<@USER_ID>`.
