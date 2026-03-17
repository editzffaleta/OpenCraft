---
summary: "Configuração de Webhook do Synology Chat e configuração do OpenCraft"
read_when:
  - Configurando Synology Chat com OpenCraft
  - Depurando roteamento de Webhook do Synology Chat
title: "Synology Chat"
---

# Synology Chat (plugin)

Status: suportado via Plugin como canal de mensagem direta usando Webhooks do Synology Chat.
O Plugin aceita mensagens de entrada de Webhooks de saída do Synology Chat e envia respostas
através de um Webhook de entrada do Synology Chat.

## Plugin necessário

O Synology Chat é baseado em Plugin e não faz parte da instalação padrão do core.

Instalar a partir de um checkout local:

```bash
opencraft plugins install ./extensions/synology-chat
```

Detalhes: [Plugins](/tools/plugin)

## Configuração rápida

1. Instale e habilite o Plugin Synology Chat.
   - `opencraft onboard` agora mostra o Synology Chat na mesma lista de configuração de canais que `opencraft channels add`.
   - Configuração não interativa: `opencraft channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Nas integrações do Synology Chat:
   - Crie um Webhook de entrada e copie sua URL.
   - Crie um Webhook de saída com seu Token secreto.
3. Aponte a URL do Webhook de saída para o Gateway do OpenCraft:
   - `https://gateway-host/webhook/synology` por padrão.
   - Ou seu `channels.synology-chat.webhookPath` personalizado.
4. Finalize a configuração no OpenCraft.
   - Guiado: `opencraft onboard`
   - Direto: `opencraft channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Reinicie o Gateway e envie uma DM para o Bot do Synology Chat.

Configuração mínima:

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
- `OPENCRAFT_BOT_NAME`

Valores de configuração sobrescrevem variáveis de ambiente.

## Política de DM e controle de acesso

- `dmPolicy: "allowlist"` é o padrão recomendado.
- `allowedUserIds` aceita uma lista (ou string separada por vírgula) de IDs de usuário do Synology.
- No modo `allowlist`, uma lista `allowedUserIds` vazia é tratada como erro de configuração e a rota de Webhook não será iniciada (use `dmPolicy: "open"` para permitir todos).
- `dmPolicy: "open"` permite qualquer remetente.
- `dmPolicy: "disabled"` bloqueia DMs.
- Aprovações de pareamento funcionam com:
  - `opencraft pairing list synology-chat`
  - `opencraft pairing approve synology-chat <CODE>`

## Entrega de saída

Use IDs numéricos de usuário do Synology Chat como alvos.

Exemplos:

```bash
opencraft message send --channel synology-chat --target 123456 --text "Hello from OpenCraft"
opencraft message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Envio de mídia é suportado por entrega de arquivos baseada em URL.

## Múltiplas contas

Múltiplas contas Synology Chat são suportadas em `channels.synology-chat.accounts`.
Cada conta pode sobrescrever Token, URL de entrada, caminho de Webhook, política de DM e limites.

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

- Mantenha o `token` secreto e rotacione se vazado.
- Mantenha `allowInsecureSsl: false` a menos que você confie explicitamente em um certificado auto-assinado do NAS local.
- Solicitações de Webhook de entrada são verificadas por Token e limitadas por taxa por remetente.
- Prefira `dmPolicy: "allowlist"` para produção.
