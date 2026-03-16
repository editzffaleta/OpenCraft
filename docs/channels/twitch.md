---
summary: "Configuração do bot de chat Twitch"
read_when:
  - Configurando integração de chat Twitch para o OpenCraft
title: "Twitch"
---

# Twitch (plugin)

Suporte a chat Twitch via conexão IRC. O OpenCraft se conecta como um usuário Twitch (conta bot) para receber e enviar mensagens em canais.

## Plugin necessário

O Twitch é distribuído como plugin e não está incluído na instalação principal.

Instale via CLI (registro npm):

```bash
opencraft plugins install @openclaw/twitch
```

Checkout local (quando executando a partir de um repositório git):

```bash
opencraft plugins install ./extensions/twitch
```

Detalhes: [Plugins](/tools/plugin)

## Configuração rápida (iniciantes)

1. Crie uma conta Twitch dedicada para o bot (ou use uma conta existente).
2. Gere credenciais: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Selecione **Bot Token**
   - Verifique se os escopos `chat:read` e `chat:write` estão selecionados
   - Copie o **Client ID** e o **Access Token**
3. Encontre seu ID de usuário Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
4. Configure o token:
   - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (somente conta padrão)
   - Ou config: `channels.twitch.accessToken`
   - Se ambos estiverem definidos, a config tem precedência (o fallback de env é somente para a conta padrão).
5. Inicie o gateway.

**⚠️ Importante:** Adicione controle de acesso (`allowFrom` ou `allowedRoles`) para evitar que usuários não autorizados acionem o bot. `requireMention` é `true` por padrão.

Config mínima:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "opencraft", // Conta Twitch do bot
      accessToken: "oauth:abc123...", // OAuth Access Token (ou use a variável de ambiente OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID do Token Generator
      channel: "vevisk", // Chat do canal Twitch a entrar (obrigatório)
      allowFrom: ["123456789"], // (recomendado) Apenas seu ID de usuário Twitch - obtenha em https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## O que é

- Um canal Twitch de propriedade do Gateway.
- Roteamento determinístico: respostas sempre voltam para o Twitch.
- Cada conta mapeia para uma chave de sessão isolada `agent:<agentId>:twitch:<accountName>`.
- `username` é a conta do bot (quem autentica), `channel` é qual sala de chat entrar.

## Configuração (detalhada)

### Gerar credenciais

Use o [Twitch Token Generator](https://twitchtokengenerator.com/):

- Selecione **Bot Token**
- Verifique se os escopos `chat:read` e `chat:write` estão selecionados
- Copie o **Client ID** e o **Access Token**

Nenhum registro manual de aplicativo é necessário. Os tokens expiram após algumas horas.

### Configurar o bot

**Variável de ambiente (somente conta padrão):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
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

Se tanto env quanto config estiverem definidos, a config tem precedência.

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

Prefira `allowFrom` para uma allowlist rígida. Use `allowedRoles` se quiser acesso baseado em função.

**Funções disponíveis:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Por que IDs de usuário?** Usernames podem mudar, permitindo personificação. IDs de usuário são permanentes.

Encontre seu ID de usuário Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/) (Converta seu username Twitch para ID)

## Renovação de token (opcional)

Tokens do [Twitch Token Generator](https://twitchtokengenerator.com/) não podem ser renovados automaticamente — regenere quando expirarem.

Para renovação automática de token, crie seu próprio aplicativo Twitch no [Twitch Developer Console](https://dev.twitch.tv/console) e adicione à config:

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

O bot renova automaticamente os tokens antes da expiração e registra os eventos de renovação.

## Suporte a múltiplas contas

Use `channels.twitch.accounts` com tokens por conta. Veja [`gateway/configuration`](/gateway/configuration) para o padrão compartilhado.

Exemplo (uma conta bot em dois canais):

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

**Nota:** Cada conta precisa do seu próprio token (um token por canal).

## Controle de acesso

### Restrições baseadas em função

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

### Acesso baseado em função (alternativa)

`allowFrom` é uma allowlist rígida. Quando definido, apenas esses IDs de usuário são permitidos.
Se quiser acesso baseado em função, deixe `allowFrom` sem definição e configure `allowedRoles`:

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

### Bot não responde às mensagens

**Verifique o controle de acesso:** Certifique-se de que seu ID de usuário está em `allowFrom`, ou remova temporariamente
`allowFrom` e defina `allowedRoles: ["all"]` para testar.

**Verifique se o bot está no canal:** O bot deve entrar no canal especificado em `channel`.

### Problemas com token

**"Failed to connect" ou erros de autenticação:**

- Verifique se `accessToken` é o valor do OAuth access token (normalmente começa com o prefixo `oauth:`)
- Verifique se o token tem os escopos `chat:read` e `chat:write`
- Se estiver usando renovação de token, verifique se `clientSecret` e `refreshToken` estão definidos

### Renovação de token não funciona

**Verifique os logs para eventos de renovação:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Se você vir "token refresh disabled (no refresh token)":

- Certifique-se de que `clientSecret` está fornecido
- Certifique-se de que `refreshToken` está fornecido

## Config

**Config de conta:**

- `username` - Username do bot
- `accessToken` - OAuth access token com `chat:read` e `chat:write`
- `clientId` - Twitch Client ID (do Token Generator ou do seu app)
- `channel` - Canal a entrar (obrigatório)
- `enabled` - Habilitar esta conta (padrão: `true`)
- `clientSecret` - Opcional: para renovação automática de token
- `refreshToken` - Opcional: para renovação automática de token
- `expiresIn` - Validade do token em segundos
- `obtainmentTimestamp` - Timestamp de obtenção do token
- `allowFrom` - Allowlist de ID de usuário
- `allowedRoles` - Controle de acesso baseado em função (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - Requer @menção (padrão: `true`)

**Opções do provedor:**

- `channels.twitch.enabled` - Habilitar/desabilitar inicialização do canal
- `channels.twitch.username` - Username do bot (config simplificada de conta única)
- `channels.twitch.accessToken` - OAuth access token (config simplificada de conta única)
- `channels.twitch.clientId` - Twitch Client ID (config simplificada de conta única)
- `channels.twitch.channel` - Canal a entrar (config simplificada de conta única)
- `channels.twitch.accounts.<accountName>` - Config multi-conta (todos os campos de conta acima)

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

## Ações de ferramenta

O agente pode chamar `twitch` com ação:

- `send` - Enviar uma mensagem para um canal

Exemplo:

```json5
{
  action: "twitch",
  params: {
    message: "Olá Twitch!",
    to: "#mychannel",
  },
}
```

## Segurança e operações

- **Trate tokens como senhas** - Nunca commite tokens no git
- **Use renovação automática de token** para bots de longa duração
- **Use allowlists de ID de usuário** em vez de usernames para controle de acesso
- **Monitore os logs** para eventos de renovação de token e status de conexão
- **Escopos mínimos de token** - Solicite apenas `chat:read` e `chat:write`
- **Se travado**: Reinicie o gateway após confirmar que nenhum outro processo possui a sessão

## Limites

- **500 caracteres** por mensagem (dividido automaticamente nos limites de palavra)
- Markdown é removido antes do chunking
- Sem limitação de taxa (usa os limites de taxa integrados do Twitch)
