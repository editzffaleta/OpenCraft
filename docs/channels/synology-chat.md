---
summary: "Configuração de webhook do Synology Chat e config do OpenCraft"
read_when:
  - Configurando o Synology Chat com o OpenCraft
  - Depurando roteamento de webhook do Synology Chat
title: "Synology Chat"
---

# Synology Chat (plugin)

Status: suportado via plugin como canal de mensagens diretas usando webhooks do Synology Chat.
O plugin aceita mensagens de entrada dos webhooks de saída do Synology Chat e envia respostas
por meio de um webhook de entrada do Synology Chat.

## Plugin necessário

O Synology Chat é baseado em plugin e não faz parte da instalação padrão do canal principal.

Instale a partir de um checkout local:

```bash
opencraft plugins install ./extensions/synology-chat
```

Detalhes: [Plugins](/tools/plugin)

## Configuração rápida

1. Instale e habilite o plugin do Synology Chat.
2. Nas integrações do Synology Chat:
   - Crie um webhook de entrada e copie sua URL.
   - Crie um webhook de saída com seu token secreto.
3. Aponte a URL do webhook de saída para o gateway do OpenCraft:
   - `https://gateway-host/webhook/synology` por padrão.
   - Ou seu `channels.synology-chat.webhookPath` personalizado.
4. Configure `channels.synology-chat` no OpenCraft.
5. Reinicie o gateway e envie um DM para o bot do Synology Chat.

Config mínima:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Variáveis de ambiente

Para a conta padrão, você pode usar variáveis de ambiente:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (separados por vírgula)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Valores de config substituem variáveis de ambiente.

## Política de DM e controle de acesso

- `dmPolicy: "allowlist"` é o padrão recomendado.
- `allowedUserIds` aceita uma lista (ou string separada por vírgula) de IDs de usuário do Synology.
- No modo `allowlist`, uma lista `allowedUserIds` vazia é tratada como configuração incorreta e a rota do webhook não iniciará (use `dmPolicy: "open"` para permitir todos).
- `dmPolicy: "open"` permite qualquer remetente.
- `dmPolicy: "disabled"` bloqueia DMs.
- Aprovações de pareamento funcionam com:
  - `opencraft pairing list synology-chat`
  - `opencraft pairing approve synology-chat <CÓDIGO>`

## Entrega de saída

Use IDs numéricos de usuário do Synology Chat como alvos.

Exemplos:

```bash
opencraft message send --channel synology-chat --target 123456 --text "Olá do OpenCraft"
opencraft message send --channel synology-chat --target synology-chat:123456 --text "Olá novamente"
```

Envios de mídia são suportados por entrega de arquivo baseada em URL.

## Multi-conta

Múltiplas contas do Synology Chat são suportadas em `channels.synology-chat.accounts`.
Cada conta pode substituir token, URL de entrada, caminho do webhook, política de DM e limites.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Notas de segurança

- Mantenha o `token` em segredo e rotacione-o se vazar.
- Mantenha `allowInsecureSsl: false` a menos que confie explicitamente em um certificado local autoassinado do NAS.
- Requisições de webhook de entrada são verificadas por token e limitadas por taxa por remetente.
- Prefira `dmPolicy: "allowlist"` para produção.
