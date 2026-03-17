---
title: IRC
description: Conecte o OpenCraft a canais IRC e mensagens diretas.
summary: "Configuracao do Plugin IRC, controles de acesso e solucao de problemas"
read_when:
  - You want to connect OpenCraft to IRC channels or DMs
  - You are configuring IRC allowlists, group policy, or mention gating
---

Use IRC quando voce quiser o OpenCraft em canais classicos (`#room`) e mensagens diretas.
IRC e fornecido como um Plugin de extensao, mas e configurado na configuracao principal em `channels.irc`.

## Inicio rapido

1. Habilite a configuracao IRC em `~/.editzffaleta/OpenCraft.json`.
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

3. Inicie/reinicie o Gateway:

```bash
opencraft gateway run
```

## Padroes de seguranca

- `channels.irc.dmPolicy` tem padrao `"pairing"`.
- `channels.irc.groupPolicy` tem padrao `"allowlist"`.
- Com `groupPolicy="allowlist"`, defina `channels.irc.groups` para definir canais permitidos.
- Use TLS (`channels.irc.tls=true`) a menos que voce intencionalmente aceite transporte em texto plano.

## Controle de acesso

Existem dois "portoes" separados para canais IRC:

1. **Acesso ao canal** (`groupPolicy` + `groups`): se o Bot aceita mensagens de um canal.
2. **Acesso de remetente** (`groupAllowFrom` / `groups["#channel"].allowFrom` por canal): quem tem permissao para acionar o Bot dentro daquele canal.

Chaves de configuracao:

- Lista de permitidos de DM (acesso de remetente de DM): `channels.irc.allowFrom`
- Lista de permitidos de remetente de grupo (acesso de remetente de canal): `channels.irc.groupAllowFrom`
- Controles por canal (canal + remetente + regras de mencao): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` permite canais nao configurados (**ainda com controle por mencao por padrao**)

Entradas de lista de permitidos devem usar identidades estaveis de remetente (`nick!user@host`).
Correspondencia por nick simples e mutavel e so e habilitada quando `channels.irc.dangerouslyAllowNameMatching: true`.

### Armadilha comum: `allowFrom` e para DMs, nao canais

Se voce ver nos logs algo como:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...significa que o remetente nao foi permitido para mensagens de **grupo/canal**. Corrija isso:

- definindo `channels.irc.groupAllowFrom` (global para todos os canais), ou
- definindo listas de permitidos de remetente por canal: `channels.irc.groups["#channel"].allowFrom`

Exemplo (permitir qualquer pessoa em `#tuirc-dev` conversar com o Bot):

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

## Acionamento de resposta (mencoes)

Mesmo se um canal e permitido (via `groupPolicy` + `groups`) e o remetente e permitido, o OpenCraft usa por padrao o **controle por mencao** em contextos de grupo.

Isso significa que voce pode ver nos logs algo como `drop channel ... (missing-mention)` a menos que a mensagem inclua um padrao de mencao que corresponda ao Bot.

Para fazer o Bot responder em um canal IRC **sem precisar de uma mencao**, desabilite o controle por mencao para aquele canal:

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

Ou para permitir **todos** os canais IRC (sem lista de permitidos por canal) e ainda responder sem mencoes:

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

## Nota de seguranca (recomendado para canais publicos)

Se voce permitir `allowFrom: ["*"]` em um canal publico, qualquer pessoa pode enviar prompts ao Bot.
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

### Ferramentas diferentes por remetente (proprietario tem mais poder)

Use `toolsBySender` para aplicar uma politica mais restrita para `"*"` e uma mais permissiva para seu nick:

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

- Chaves de `toolsBySender` devem usar `id:` para valores de identidade de remetente IRC:
  `id:eigen` ou `id:eigen!~eigen@174.127.248.171` para correspondencia mais forte.
- Chaves legadas sem prefixo ainda sao aceitas e correspondidas apenas como `id:`.
- A primeira politica de remetente correspondente vence; `"*"` e o fallback coringa.

Para mais sobre acesso a grupo vs controle por mencao (e como interagem), veja: [/channels/groups](/channels/groups).

## NickServ

Para se identificar com NickServ apos conectar:

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

Registro unico opcional ao conectar:

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

Desabilite `register` apos o nick ser registrado para evitar tentativas repetidas de REGISTER.

## Variaveis de ambiente

A conta padrao suporta:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (separados por virgula)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

## Solucao de problemas

- Se o Bot conecta mas nunca responde em canais, verifique `channels.irc.groups` **e** se o controle por mencao esta descartando mensagens (`missing-mention`). Se voce quer que ele responda sem pings, defina `requireMention:false` para o canal.
- Se o login falhar, verifique a disponibilidade do nick e a senha do servidor.
- Se TLS falhar em uma rede personalizada, verifique host/porta e configuracao do certificado.
