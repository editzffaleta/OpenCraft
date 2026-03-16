---
title: IRC
description: Conecte o OpenCraft a canais IRC e mensagens diretas.
summary: "Configuração do plugin IRC, controles de acesso e solução de problemas"
read_when:
  - Você quer conectar o OpenCraft a canais IRC ou DMs
  - Você está configurando allowlists, política de grupo ou controle por menção do IRC
---

Use o IRC quando quiser o OpenCraft em canais clássicos (`#sala`) e mensagens diretas.
O IRC vem como um plugin de extensão, mas é configurado na config principal em `channels.irc`.

## Início rápido

1. Habilite a config do IRC em `~/.opencraft/opencraft.json`.
2. Defina pelo menos:

```json
{
  "channels": {
    "irc": {
      "enabled": true,
      "host": "irc.libera.chat",
      "port": 6697,
      "tls": true,
      "nick": "opencraft-bot",
      "channels": ["#opencraft"]
    }
  }
}
```

3. Inicie/reinicie o gateway:

```bash
opencraft gateway run
```

## Padrões de segurança

- `channels.irc.dmPolicy` padrão é `"pairing"`.
- `channels.irc.groupPolicy` padrão é `"allowlist"`.
- Com `groupPolicy="allowlist"`, defina `channels.irc.groups` para definir os canais permitidos.
- Use TLS (`channels.irc.tls=true`) a menos que aceite intencionalmente transporte em texto simples.

## Controle de acesso

Há dois "portões" separados para canais IRC:

1. **Acesso ao canal** (`groupPolicy` + `groups`): se o bot aceita mensagens de um canal.
2. **Acesso do remetente** (`groupAllowFrom` / `groups["#canal"].allowFrom` por canal): quem tem permissão para acionar o bot dentro daquele canal.

Chaves de config:

- Allowlist de DM (acesso de remetente de DM): `channels.irc.allowFrom`
- Allowlist de remetentes de grupo (acesso de remetente de canal): `channels.irc.groupAllowFrom`
- Controles por canal (canal + remetente + regras de menção): `channels.irc.groups["#canal"]`
- `channels.irc.groupPolicy="open"` permite canais não configurados (**ainda com controle por menção por padrão**)

As entradas da allowlist devem usar identidades de remetente estáveis (`nick!user@host`).
A correspondência de nick bare é mutável e habilitada apenas quando `channels.irc.dangerouslyAllowNameMatching: true`.

### Armadilha comum: `allowFrom` é para DMs, não canais

Se você vir logs como:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…significa que o remetente não foi permitido para mensagens de **grupo/canal**. Corrija definindo:

- `channels.irc.groupAllowFrom` (global para todos os canais), ou
- allowlists de remetente por canal: `channels.irc.groups["#canal"].allowFrom`

Exemplo (permitir qualquer um em `#tuirc-dev` falar com o bot):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Acionamento de resposta (menções)

Mesmo que um canal seja permitido (via `groupPolicy` + `groups`) e o remetente seja permitido, o OpenCraft usa **controle por menção** em contextos de grupo por padrão.

Isso significa que você pode ver logs como `drop channel … (missing-mention)` a menos que a mensagem inclua um padrão de menção que corresponda ao bot.

Para fazer o bot responder em um canal IRC **sem precisar de uma menção**, desabilite o controle por menção para aquele canal:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Ou para permitir **todos** os canais IRC (sem allowlist por canal) e ainda responder sem menções:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Nota de segurança (recomendado para canais públicos)

Se você permitir `allowFrom: ["*"]` em um canal público, qualquer um pode acionar o bot.
Para reduzir o risco, restrinja as ferramentas para aquele canal.

### Mesmas ferramentas para todos no canal

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Ferramentas diferentes por remetente (proprietário tem mais poder)

Use `toolsBySender` para aplicar uma política mais restritiva a `"*"` e uma mais permissiva ao seu nick:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Notas:

- As chaves `toolsBySender` devem usar `id:` para valores de identidade de remetente IRC:
  `id:eigen` ou `id:eigen!~eigen@174.127.248.171` para correspondência mais forte.
- Chaves legadas sem prefixo ainda são aceitas e correspondidas apenas como `id:`.
- A primeira política de remetente correspondente vence; `"*"` é o fallback curinga.

Para mais sobre acesso de grupo vs controle por menção (e como eles interagem), veja: [/channels/groups](/channels/groups).

## NickServ

Para identificar com o NickServ após a conexão:

```json
{
  "channels": {
    "irc": {
      "nickserv": {
        "enabled": true,
        "service": "NickServ",
        "password": "sua-senha-nickserv"
      }
    }
  }
}
```

Registro único opcional na conexão:

```json
{
  "channels": {
    "irc": {
      "nickserv": {
        "register": true,
        "registerEmail": "bot@example.com"
      }
    }
  }
}
```

Desabilite `register` após o nick estar registrado para evitar tentativas repetidas de REGISTER.

## Variáveis de ambiente

A conta padrão suporta:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (separados por vírgula)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

## Solução de problemas

- Se o bot conecta mas nunca responde em canais, verifique `channels.irc.groups` **e** se o controle por menção está descartando mensagens (`missing-mention`). Se quiser que responda sem pings, defina `requireMention:false` para o canal.
- Se o login falhar, verifique a disponibilidade do nick e a senha do servidor.
- Se o TLS falhar em uma rede personalizada, verifique o host/porta e a configuração do certificado.
