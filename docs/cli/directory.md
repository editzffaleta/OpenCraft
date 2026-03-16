---
summary: "Referência do CLI para `opencraft directory` (self, peers, grupos)"
read_when:
  - Você quer buscar ids de contatos/grupos/self para um canal
  - Você está desenvolvendo um adaptador de diretório de canal
title: "directory"
---

# `opencraft directory`

Buscas de diretório para canais que suportam (contatos/peers, grupos e "me").

## Flags comuns

- `--channel <name>`: id/alias do canal (obrigatório quando múltiplos canais estão configurados; automático quando apenas um está configurado)
- `--account <id>`: id da conta (padrão: padrão do canal)
- `--json`: saída JSON

## Notas

- `directory` é para ajudar você a encontrar IDs que pode colar em outros comandos (especialmente `opencraft message send --target ...`).
- Para muitos canais, os resultados são baseados em config (allowlists / grupos configurados) em vez de um diretório de provedor ao vivo.
- A saída padrão é `id` (e às vezes `name`) separados por tab; use `--json` para scripts.

## Usando resultados com `message send`

```bash
opencraft directory peers list --channel slack --query "U0"
opencraft message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formatos de ID (por canal)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grupo)
- Telegram: `@username` ou id numérico do chat; grupos são ids numéricos
- Slack: `user:U…` e `channel:C…`
- Discord: `user:<id>` e `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server`, ou `#alias:server`
- Microsoft Teams (plugin): `user:<id>` e `conversation:<id>`
- Zalo (plugin): id de usuário (Bot API)
- Zalo Personal / `zalouser` (plugin): id de thread (DM/grupo) de `zca` (`me`, `friend list`, `group list`)

## Self ("me")

```bash
opencraft directory self --channel zalouser
```

## Peers (contatos/usuários)

```bash
opencraft directory peers list --channel zalouser
opencraft directory peers list --channel zalouser --query "name"
opencraft directory peers list --channel zalouser --limit 50
```

## Grupos

```bash
opencraft directory groups list --channel zalouser
opencraft directory groups list --channel zalouser --query "work"
opencraft directory groups members --channel zalouser --group-id <id>
```
