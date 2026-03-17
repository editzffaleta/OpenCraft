---
summary: "Referência CLI para `opencraft directory` (self, contatos, grupos)"
read_when:
  - Você quer consultar contatos/grupos/IDs próprios para um canal
  - Você está desenvolvendo um adaptador de diretório de canal
title: "directory"
---

# `opencraft directory`

Consultas de diretório para canais que suportam (contatos/pares, grupos e "eu").

## Flags comuns

- `--channel <nome>`: id/alias do canal (obrigatório quando múltiplos canais estão configurados; automático quando apenas um está configurado)
- `--account <id>`: id da conta (padrão: padrão do canal)
- `--json`: saída JSON

## Observações

- `directory` serve para ajudar você a encontrar IDs que pode colar em outros comandos (especialmente `opencraft message send --target ...`).
- Para muitos canais, os resultados são baseados em config (listas de permissão / grupos configurados) em vez de um diretório ativo do provedor.
- A saída padrão é `id` (e às vezes `name`) separados por tabulação; use `--json` para scripts.

## Usando resultados com `message send`

```bash
opencraft directory peers list --channel slack --query "U0"
opencraft message send --channel slack --target user:U012ABCDEF --message "olá"
```

## Formatos de ID (por canal)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grupo)
- Telegram: `@usuario` ou id numérico de chat; grupos são ids numéricos
- Slack: `user:U…` e `channel:C…`
- Discord: `user:<id>` e `channel:<id>`
- Matrix (plugin): `user:@usuario:servidor`, `room:!roomId:servidor`, ou `#alias:servidor`
- Microsoft Teams (plugin): `user:<id>` e `conversation:<id>`
- Zalo (plugin): id de usuário (Bot API)
- Zalo Personal / `zalouser` (plugin): id de thread (DM/grupo) do `zca` (`me`, `friend list`, `group list`)

## Self ("eu")

```bash
opencraft directory self --channel zalouser
```

## Contatos (contatos/usuários)

```bash
opencraft directory peers list --channel zalouser
opencraft directory peers list --channel zalouser --query "nome"
opencraft directory peers list --channel zalouser --limit 50
```

## Grupos

```bash
opencraft directory groups list --channel zalouser
opencraft directory groups list --channel zalouser --query "trabalho"
opencraft directory groups members --channel zalouser --group-id <id>
```
