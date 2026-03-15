---
name: slack
description: Use quando precisar controlar o Slack pelo OpenCraft via ferramenta slack, incluindo reagir a mensagens ou fixar/desafixar itens em canais ou DMs do Slack.
metadata: { "opencraft": { "emoji": "💬", "requires": { "config": ["channels.slack"] } } }
---

# Ações no Slack

## Visão Geral

Use `slack` para reagir, gerenciar fixações, enviar/editar/deletar mensagens e buscar informações de membros. A ferramenta usa o bot token configurado para o OpenCraft.

## Entradas a coletar

- `channelId` e `messageId` (timestamp de mensagem do Slack, ex: `1712023032.1234`).
- Para reações, um `emoji` (Unicode ou `:nome:`).
- Para envios de mensagem, um alvo `to` (`channel:<id>` ou `user:<id>`) e `content`.

As linhas de contexto de mensagem incluem campos `slack message id` e `channel` que você pode reutilizar diretamente.

## Ações

### Grupos de ação

| Grupo de ação | Padrão   | Notas                         |
| ------------- | -------- | ----------------------------- |
| reactions     | habilitado | Reagir + listar reações     |
| messages      | habilitado | Ler/enviar/editar/deletar   |
| pins          | habilitado | Fixar/desafixar/listar      |
| memberInfo    | habilitado | Informações de membro       |
| emojiList     | habilitado | Lista de emoji personalizado|

### Reagir a uma mensagem

```json
{
  "action": "react",
  "channelId": "C123",
  "messageId": "1712023032.1234",
  "emoji": "✅"
}
```

### Listar reações

```json
{
  "action": "reactions",
  "channelId": "C123",
  "messageId": "1712023032.1234"
}
```

### Enviar uma mensagem

```json
{
  "action": "sendMessage",
  "to": "channel:C123",
  "content": "Olá do OpenCraft"
}
```

### Editar uma mensagem

```json
{
  "action": "editMessage",
  "channelId": "C123",
  "messageId": "1712023032.1234",
  "content": "Texto atualizado"
}
```

### Deletar uma mensagem

```json
{
  "action": "deleteMessage",
  "channelId": "C123",
  "messageId": "1712023032.1234"
}
```

### Ler mensagens recentes

```json
{
  "action": "readMessages",
  "channelId": "C123",
  "limit": 20
}
```

### Fixar uma mensagem

```json
{
  "action": "pinMessage",
  "channelId": "C123",
  "messageId": "1712023032.1234"
}
```

### Desafixar uma mensagem

```json
{
  "action": "unpinMessage",
  "channelId": "C123",
  "messageId": "1712023032.1234"
}
```

### Listar itens fixados

```json
{
  "action": "listPins",
  "channelId": "C123"
}
```

### Informações de membro

```json
{
  "action": "memberInfo",
  "userId": "U123"
}
```

### Lista de emoji

```json
{
  "action": "emojiList"
}
```

## Ideias para experimentar

- Reagir com ✅ para marcar tarefas concluídas.
- Fixar decisões importantes ou atualizações de status semanal.
