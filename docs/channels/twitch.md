---
summary: "Configuração e setup de Bot de chat da Twitch"
read_when:
  - Setting up Twitch chat integration for OpenCraft
title: "Twitch"
---

# Twitch (plugin)

Suporte a chat da Twitch via conexão IRC. O OpenCraft se conecta como um usuário Twitch (conta de Bot) para receber e enviar mensagens em canais.

## Plugin necessário

Twitch é distribuído como um plugin e não está incluso na instalação principal.

Instalar via CLI (registro npm):

```bash
opencraft plugins install @opencraft/twitch
```

Checkout local (ao executar a partir de um repositório git):

```bash
opencraft plugins install ./extensions/twitch
```

Detalhes: [Plugins](/tools/plugin)

## Configuração rápida (iniciante)

1. Crie uma conta Twitch dedicada para o Bot (ou use uma conta existente).
2. Gere as credenciais: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Selecione **Bot Token**
   - Verifique se os escopos `chat:read` e `chat:write` estão selecionados
   - Copie o **Client ID** e o **Access Token**
3. Encontre seu ID de usuário Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
4. Configure o Token:
   - Env: `OPENCRAFT_TWITCH_ACCESS_TOKEN=...` (apenas conta padrão)
   - Ou config: `channels.twitch.accessToken`
   - Se ambos estiverem definidos, a config tem precedência (env é fallback apenas para conta padrão).
5. Inicie o Gateway.

**⚠️ Importante:** Adicione controle de acesso (`allowFrom` ou `allowedRoles`) para impedir que usuários não autorizados acionem o Bot. `requireMention` tem valor padrão `true`.

Configuração mínima:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "opencraft", // Conta Twitch do Bot
      accessToken: "oauth:abc123...", // OAuth Access Token (ou use a variável de ambiente OPENCRAFT_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID do Token Generator
      channel: "vevisk", // Qual chat do canal Twitch entrar (obrigatório)
      allowFrom: ["123456789"], // (recomendado) Apenas seu ID de usuário Twitch - obtenha em https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## O que é

- Um canal Twitch gerenciado pelo Gateway.
- Roteamento determinístico: respostas sempre retornam para a Twitch.
- Cada conta mapeia para uma chave de sessão isolada `agent:<agentId>:twitch:<accountName>`.
- `username` é a conta do Bot (quem autentica), `channel` é qual sala de chat entrar.

## Configuração (detalhada)

### Gerar credenciais

Use o [Twitch Token Generator](https://twitchtokengenerator.com/):

- Selecione **Bot Token**
- Verifique se os escopos `chat:read` e `chat:write` estão selecionados
- Copie o **Client ID** e o **Access Token**

Não é necessário registro manual de aplicativo. Tokens expiram após várias horas.

### Configurar o Bot

**Variável de ambiente (apenas conta padrão):**

```bash
OPENCRAFT_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**Ou config:**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "opencraft",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

Se ambos env e config estiverem definidos, a config tem precedência.

### Controle de acesso (recomendado)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recomendado) Apenas seu ID de usuário Twitch
    },
  },
}
```

Prefira `allowFrom` para uma allowlist rígida. Use `allowedRoles` em vez disso se você quiser acesso baseado em papéis.

**Papéis disponíveis:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Por que IDs de usuário?** Nomes de usuário podem mudar, permitindo personificação. IDs de usuário são permanentes.

Encontre seu ID de usuário Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/) (Converta seu nome de usuário Twitch para ID)

## Renovação de Token (opcional)

Tokens do [Twitch Token Generator](https://twitchtokengenerator.com/) não podem ser renovados automaticamente - regenere quando expirar.

Para renovação automática de Token, crie seu próprio aplicativo Twitch no [Twitch Developer Console](https://dev.twitch.tv/console) e adicione à config:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

O Bot renova tokens automaticamente antes da expiração e registra os eventos de renovação.

## Suporte a múltiplas contas

Use `channels.twitch.accounts` com tokens por conta. Veja [`gateway/configuration`](/gateway/configuration) para o padrão compartilhado.

Exemplo (uma conta de Bot em dois canais):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "opencraft",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "opencraft",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**Nota:** Cada conta precisa do seu próprio Token (um Token por canal).

## Controle de acesso

### Restrições baseadas em papéis

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### Allowlist por ID de usuário (mais seguro)

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### Acesso baseado em papéis (alternativa)

`allowFrom` é uma allowlist rígida. Quando definida, apenas esses IDs de usuário são permitidos.
Se você quiser acesso baseado em papéis, deixe `allowFrom` indefinido e configure `allowedRoles` em vez disso:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### Desabilitar requisito de @menção

Por padrão, `requireMention` é `true`. Para desabilitar e responder a todas as mensagens:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## Solução de problemas

Primeiro, execute os comandos de diagnóstico:

```bash
opencraft doctor
opencraft channels status --probe
```

### Bot não responde a mensagens

**Verifique o controle de acesso:** Certifique-se de que seu ID de usuário está em `allowFrom`, ou temporariamente remova
`allowFrom` e defina `allowedRoles: ["all"]` para testar.

**Verifique se o Bot está no canal:** O Bot deve entrar no canal especificado em `channel`.

### Problemas com Token

**"Failed to connect" ou erros de autenticação:**

- Verifique se `accessToken` é o valor do OAuth access token (tipicamente começa com o prefixo `oauth:`)
- Verifique se o Token tem os escopos `chat:read` e `chat:write`
- Se estiver usando renovação de Token, verifique se `clientSecret` e `refreshToken` estão definidos

### Renovação de Token não funciona

**Verifique os logs para eventos de renovação:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Se você vir "token refresh disabled (no refresh token)":

- Certifique-se de que `clientSecret` foi fornecido
- Certifique-se de que `refreshToken` foi fornecido

## Configuração

**Configuração da conta:**

- `username` - Nome de usuário do Bot
- `accessToken` - OAuth access token com `chat:read` e `chat:write`
- `clientId` - Client ID da Twitch (do Token Generator ou seu aplicativo)
- `channel` - Canal para entrar (obrigatório)
- `enabled` - Habilitar esta conta (padrão: `true`)
- `clientSecret` - Opcional: para renovação automática de Token
- `refreshToken` - Opcional: para renovação automática de Token
- `expiresIn` - Expiração do Token em segundos
- `obtainmentTimestamp` - Timestamp de obtenção do Token
- `allowFrom` - Allowlist de IDs de usuário
- `allowedRoles` - Controle de acesso baseado em papéis (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - Exigir @menção (padrão: `true`)

**Opções do provedor:**

- `channels.twitch.enabled` - Habilitar/desabilitar inicialização do canal
- `channels.twitch.username` - Nome de usuário do Bot (configuração simplificada de conta única)
- `channels.twitch.accessToken` - OAuth access token (configuração simplificada de conta única)
- `channels.twitch.clientId` - Client ID da Twitch (configuração simplificada de conta única)
- `channels.twitch.channel` - Canal para entrar (configuração simplificada de conta única)
- `channels.twitch.accounts.<accountName>` - Configuração multi-conta (todos os campos de conta acima)

Exemplo completo:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "opencraft",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Ações de ferramentas

O agente pode chamar `twitch` com ação:

- `send` - Enviar uma mensagem para um canal

Exemplo:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Segurança e operações

- **Trate tokens como senhas** - Nunca faça commit de tokens no git
- **Use renovação automática de Token** para Bots de longa duração
- **Use allowlists de ID de usuário** em vez de nomes de usuário para controle de acesso
- **Monitore os logs** para eventos de renovação de Token e status da conexão
- **Defina escopos mínimos para tokens** - Solicite apenas `chat:read` e `chat:write`
- **Se ficar travado**: Reinicie o Gateway após confirmar que nenhum outro processo é dono da sessão

## Limites

- **500 caracteres** por mensagem (dividido automaticamente em limites de palavras)
- Markdown é removido antes da divisão
- Sem limitação de taxa (usa os limites de taxa integrados da Twitch)
