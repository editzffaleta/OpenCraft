---
summary: "Referência CLI para `opencraft message` (envio + ações de canal)"
read_when:
  - Adicionando ou modificando ações CLI de mensagem
  - Alterando comportamento de canal de saída
title: "message"
---

# `opencraft message`

Comando único de saída para enviar mensagens e ações de canal
(Discord/Google Chat/Slack/Mattermost (Plugin)/Telegram/WhatsApp/Signal/iMessage/MS Teams).

## Uso

```
opencraft message <subcommand> [flags]
```

Seleção de canal:

- `--channel` obrigatório se mais de um canal estiver configurado.
- Se exatamente um canal estiver configurado, ele se torna o padrão.
- Valores: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams` (Mattermost requer Plugin)

Formatos de destino (`--target`):

- WhatsApp: E.164 ou JID de grupo
- Telegram: id do chat ou `@username`
- Discord: `channel:<id>` ou `user:<id>` (ou menção `<@id>`; ids numéricos puros são tratados como canais)
- Google Chat: `spaces/<spaceId>` ou `users/<userId>`
- Slack: `channel:<id>` ou `user:<id>` (id de canal puro é aceito)
- Mattermost (Plugin): `channel:<id>`, `user:<id>`, ou `@username` (ids puros são tratados como canais)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>`, ou `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>`, ou `chat_identifier:<id>`
- MS Teams: id de conversa (`19:...@thread.tacv2`) ou `conversation:<id>` ou `user:<aad-object-id>`

Busca por nome:

- Para provedores suportados (Discord/Slack/etc), nomes de canal como `Help` ou `#help` são resolvidos via cache de diretório.
- Em caso de cache miss, o OpenCraft tentará uma busca ao vivo no diretório quando o provedor suportar.

## Flags comuns

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (canal ou usuário de destino para send/poll/read/etc)
- `--targets <name>` (repetível; apenas broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## Ações

### Principais

- `send`
  - Canais: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/MS Teams
  - Obrigatório: `--target`, mais `--message` ou `--media`
  - Opcional: `--media`, `--reply-to`, `--thread-id`, `--gif-playback`
  - Apenas Telegram: `--buttons` (requer `channels.telegram.capabilities.inlineButtons` para permitir)
  - Apenas Telegram: `--force-document` (enviar imagens e GIFs como documentos para evitar compressão do Telegram)
  - Apenas Telegram: `--thread-id` (id do tópico do fórum)
  - Apenas Slack: `--thread-id` (timestamp da thread; `--reply-to` usa o mesmo campo)
  - Apenas WhatsApp: `--gif-playback`

- `poll`
  - Canais: WhatsApp/Telegram/Discord/Matrix/MS Teams
  - Obrigatório: `--target`, `--poll-question`, `--poll-option` (repetível)
  - Opcional: `--poll-multi`
  - Apenas Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Apenas Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Canais: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal
  - Obrigatório: `--message-id`, `--target`
  - Opcional: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Nota: `--remove` requer `--emoji` (omita `--emoji` para limpar suas próprias reações onde suportado; veja /tools/reactions)
  - Apenas WhatsApp: `--participant`, `--from-me`
  - Reações em grupo Signal: `--target-author` ou `--target-author-uuid` obrigatório

- `reactions`
  - Canais: Discord/Google Chat/Slack
  - Obrigatório: `--message-id`, `--target`
  - Opcional: `--limit`

- `read`
  - Canais: Discord/Slack
  - Obrigatório: `--target`
  - Opcional: `--limit`, `--before`, `--after`
  - Apenas Discord: `--around`

- `edit`
  - Canais: Discord/Slack
  - Obrigatório: `--message-id`, `--message`, `--target`

- `delete`
  - Canais: Discord/Slack/Telegram
  - Obrigatório: `--message-id`, `--target`

- `pin` / `unpin`
  - Canais: Discord/Slack
  - Obrigatório: `--message-id`, `--target`

- `pins` (listar)
  - Canais: Discord/Slack
  - Obrigatório: `--target`

- `permissions`
  - Canais: Discord
  - Obrigatório: `--target`

- `search`
  - Canais: Discord
  - Obrigatório: `--guild-id`, `--query`
  - Opcional: `--channel-id`, `--channel-ids` (repetível), `--author-id`, `--author-ids` (repetível), `--limit`

### Threads

- `thread create`
  - Canais: Discord
  - Obrigatório: `--thread-name`, `--target` (id do canal)
  - Opcional: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Canais: Discord
  - Obrigatório: `--guild-id`
  - Opcional: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Canais: Discord
  - Obrigatório: `--target` (id da thread), `--message`
  - Opcional: `--media`, `--reply-to`

### Emojis

- `emoji list`
  - Discord: `--guild-id`
  - Slack: sem flags extras

- `emoji upload`
  - Canais: Discord
  - Obrigatório: `--guild-id`, `--emoji-name`, `--media`
  - Opcional: `--role-ids` (repetível)

### Stickers

- `sticker send`
  - Canais: Discord
  - Obrigatório: `--target`, `--sticker-id` (repetível)
  - Opcional: `--message`

- `sticker upload`
  - Canais: Discord
  - Obrigatório: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Cargos / Canais / Membros / Voz

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` para Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Eventos

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Opcional: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderação (Discord)

- `timeout`: `--guild-id`, `--user-id` (opcional `--duration-min` ou `--until`; omita ambos para limpar timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` também suporta `--reason`

### Broadcast

- `broadcast`
  - Canais: qualquer canal configurado; use `--channel all` para direcionar todos os provedores
  - Obrigatório: `--targets` (repetível)
  - Opcional: `--message`, `--media`, `--dry-run`

## Exemplos

Enviar uma resposta no Discord:

```
opencraft message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Enviar uma mensagem no Discord com componentes:

```
opencraft message send --channel discord \
  --target channel:123 --message "Choose:" \
  --components '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve","style":"success"},{"label":"Decline","style":"danger"}]}]}'
```

Veja [Componentes Discord](/channels/discord#interactive-components) para o esquema completo.

Criar uma enquete no Discord:

```
opencraft message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Criar uma enquete no Telegram (encerramento automático em 2 minutos):

```
opencraft message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Enviar uma mensagem proativa no Teams:

```
opencraft message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Criar uma enquete no Teams:

```
opencraft message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Reagir no Slack:

```
opencraft message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Reagir em um grupo Signal:

```
opencraft message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Enviar botões inline no Telegram:

```
opencraft message send --channel telegram --target @mychat --message "Choose:" \
  --buttons '[ [{"text":"Yes","callback_data":"cmd:yes"}], [{"text":"No","callback_data":"cmd:no"}] ]'
```

Enviar uma imagem do Telegram como documento para evitar compressão:

```bash
opencraft message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```
