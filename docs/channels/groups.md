---
summary: "Comportamento de chat em grupo em diferentes superficies (WhatsApp/Telegram/Discord/Slack/Signal/iMessage/Microsoft Teams/Zalo)"
read_when:
  - Changing group chat behavior or mention gating
title: "Groups"
---

# Grupos

O OpenCraft trata chats em grupo de forma consistente entre superficies: WhatsApp, Telegram, Discord, Slack, Signal, iMessage, Microsoft Teams, Zalo.

## Introducao para iniciantes (2 minutos)

O OpenCraft "vive" nas suas proprias contas de mensagem. Nao existe um usuario de Bot separado no WhatsApp.
Se **voce** esta em um grupo, o OpenCraft pode ver aquele grupo e responder nele.

Comportamento padrao:

- Grupos sao restritos (`groupPolicy: "allowlist"`).
- Respostas requerem uma mencao a menos que voce desabilite explicitamente o controle por mencao.

Traducao: remetentes permitidos podem acionar o OpenCraft mencionando-o.

> Resumo
>
> - **Acesso a DM** e controlado por `*.allowFrom`.
> - **Acesso a grupo** e controlado por `*.groupPolicy` + listas de permitidos (`*.groups`, `*.groupAllowFrom`).
> - **Acionamento de resposta** e controlado pelo controle por mencao (`requireMention`, `/activation`).

Fluxo rapido (o que acontece com uma mensagem de grupo):

```
groupPolicy? disabled -> descartar
groupPolicy? allowlist -> grupo permitido? nao -> descartar
requireMention? yes -> mencionado? nao -> armazenar apenas para contexto
caso contrario -> responder
```

![Fluxo de mensagens de grupo](/images/groups-flow.svg)

Se voce quer...

| Objetivo                                              | O que definir                                              |
| ----------------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos os grupos mas so responder com @mencao | `groups: { "*": { requireMention: true } }`                |
| Desabilitar todas as respostas de grupo               | `groupPolicy: "disabled"`                                  |
| Apenas grupos especificos                             | `groups: { "<group-id>": { ... } }` (sem chave `"*"`)      |
| Apenas voce pode acionar em grupos                    | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Chaves de sessao

- Sessoes de grupo usam chaves de sessao `agent:<agentId>:<channel>:group:<id>` (salas/canais usam `agent:<agentId>:<channel>:channel:<id>`).
- Topicos de forum do Telegram adicionam `:topic:<threadId>` ao ID do grupo para que cada topico tenha sua propria sessao.
- Chats diretos usam a sessao principal (ou por remetente se configurado).
- Heartbeats sao pulados para sessoes de grupo.

## Padrao: DMs pessoais + grupos publicos (agente unico)

Sim -- isso funciona bem se seu trafego "pessoal" sao **DMs** e seu trafego "publico" sao **grupos**.

Motivo: no modo de agente unico, DMs normalmente caem na chave de sessao **principal** (`agent:main:main`), enquanto grupos sempre usam chaves de sessao **nao-principal** (`agent:main:<channel>:group:<id>`). Se voce habilitar sandboxing com `mode: "non-main"`, essas sessoes de grupo rodam no Docker enquanto sua sessao principal de DM permanece no host.

Isso da a voce um "cerebro" de agente (workspace + memoria compartilhados), mas duas posturas de execucao:

- **DMs**: ferramentas completas (host)
- **Grupos**: sandbox + ferramentas restritas (Docker)

> Se voce precisa de workspaces/personas verdadeiramente separados ("pessoal" e "publico" nunca devem se misturar), use um segundo agente + bindings. Veja [Roteamento multi-agente](/concepts/multi-agent).

Exemplo (DMs no host, grupos em sandbox + ferramentas somente de mensagem):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // grupos/canais sao nao-principal -> sandboxed
        scope: "session", // isolamento mais forte (um container por grupo/canal)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // Se allow nao esta vazio, todo o resto e bloqueado (deny ainda vence).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Quer "grupos podem ver apenas a pasta X" em vez de "sem acesso ao host"? Mantenha `workspaceAccess: "none"` e monte apenas caminhos permitidos no sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

Relacionado:

- Chaves de configuracao e padroes: [Configuracao do Gateway](/gateway/configuration#agentsdefaultssandbox)
- Depurando por que uma ferramenta esta bloqueada: [Sandbox vs Politica de Ferramentas vs Elevado](/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalhes de bind mounts: [Sandboxing](/gateway/sandboxing#custom-bind-mounts)

## Labels de exibicao

- Labels da UI usam `displayName` quando disponivel, formatado como `<channel>:<token>`.
- `#room` e reservado para salas/canais; chats em grupo usam `g-<slug>` (minusculo, espacos -> `-`, mantém `#@+._-`).

## Politica de grupo

Controle como mensagens de grupo/sala sao tratadas por canal:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // ID numerico do usuario Telegram (o assistente pode resolver @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| Politica      | Comportamento                                                                   |
| ------------- | ------------------------------------------------------------------------------- |
| `"open"`      | Grupos ignoram listas de permitidos; controle por mencao ainda se aplica.       |
| `"disabled"`  | Bloqueia todas as mensagens de grupo completamente.                             |
| `"allowlist"` | Permite apenas grupos/salas que correspondam a lista de permitidos configurada. |

Notas:

- `groupPolicy` e separado do controle por mencao (que requer @mencoes).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: use `groupAllowFrom` (fallback: `allowFrom` explicito).
- Aprovacoes de pareamento de DM (entradas `*-allowFrom` no armazenamento) se aplicam apenas ao acesso de DM; autorizacao de remetente em grupo permanece explicita nas listas de permitidos de grupo.
- Discord: lista de permitidos usa `channels.discord.guilds.<id>.channels`.
- Slack: lista de permitidos usa `channels.slack.channels`.
- Matrix: lista de permitidos usa `channels.matrix.groups` (IDs de sala, aliases ou nomes). Use `channels.matrix.groupAllowFrom` para restringir remetentes; listas de permitidos `users` por sala tambem sao suportadas.
- DMs de grupo sao controlados separadamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Lista de permitidos do Telegram pode corresponder IDs de usuario (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) ou usernames (`"@alice"` ou `"alice"`); prefixos sao case-insensitive.
- O padrao e `groupPolicy: "allowlist"`; se sua lista de permitidos de grupo estiver vazia, mensagens de grupo sao bloqueadas.
- Seguranca em runtime: quando um bloco de provedor esta completamente ausente (`channels.<provider>` ausente), a politica de grupo cai para um modo fail-closed (tipicamente `allowlist`) em vez de herdar `channels.defaults.groupPolicy`.

Modelo mental rapido (ordem de avaliacao para mensagens de grupo):

1. `groupPolicy` (open/disabled/allowlist)
2. listas de permitidos de grupo (`*.groups`, `*.groupAllowFrom`, lista de permitidos especifica do canal)
3. controle por mencao (`requireMention`, `/activation`)

## Controle por mencao (padrao)

Mensagens de grupo requerem uma mencao a menos que substituidas por grupo. Padroes vivem por subsistema em `*.groups."*"`.

Responder a uma mensagem do Bot conta como uma mencao implicita (quando o canal suporta metadados de resposta). Isso se aplica a Telegram, WhatsApp, Slack, Discord e Microsoft Teams.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@opencraft", "opencraft", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

Notas:

- `mentionPatterns` sao padroes regex seguros case-insensitive; padroes invalidos e formas de repeticao aninhada insegura sao ignorados.
- Superficies que fornecem mencoes explicitas ainda passam; padroes sao um fallback.
- Substituicao por agente: `agents.list[].groupChat.mentionPatterns` (util quando multiplos agentes compartilham um grupo).
- O controle por mencao so e aplicado quando a deteccao de mencao e possivel (mencoes nativas ou `mentionPatterns` estao configurados).
- Padroes do Discord vivem em `channels.discord.guilds."*"` (substituiveis por guild/canal).
- O contexto de historico de grupo e envolvido uniformemente entre canais e e **somente pendente** (mensagens puladas devido ao controle por mencao); use `messages.groupChat.historyLimit` para o padrao global e `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) para substituicoes. Defina `0` para desabilitar.

## Restricoes de ferramentas por grupo/canal (opcional)

Algumas configuracoes de canal suportam restringir quais ferramentas estao disponiveis **dentro de um grupo/sala/canal especifico**.

- `tools`: permitir/bloquear ferramentas para todo o grupo.
- `toolsBySender`: substituicoes por remetente dentro do grupo.
  Use prefixos de chave explicitos:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e coringa `"*"`.
  Chaves legadas sem prefixo ainda sao aceitas e correspondidas apenas como `id:`.

Ordem de resolucao (mais especifico vence):

1. correspondencia `toolsBySender` do grupo/canal
2. `tools` do grupo/canal
3. correspondencia `toolsBySender` padrao (`"*"`)
4. `tools` padrao (`"*"`)

Exemplo (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

Notas:

- Restricoes de ferramentas por grupo/canal sao aplicadas alem da politica global/agente de ferramentas (deny ainda vence).
- Alguns canais usam aninhamento diferente para salas/canais (ex.: Discord `guilds.*.channels.*`, Slack `channels.*`, MS Teams `teams.*.channels.*`).

## Listas de permitidos de grupo

Quando `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` esta configurado, as chaves atuam como uma lista de permitidos de grupo. Use `"*"` para permitir todos os grupos enquanto ainda define o comportamento padrao de mencao.

Intencoes comuns (copiar/colar):

1. Desabilitar todas as respostas de grupo

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Permitir apenas grupos especificos (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. Permitir todos os grupos mas requerer mencao (explicito)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Apenas o proprietario pode acionar em grupos (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Ativacao (somente proprietario)

Proprietarios de grupo podem alternar a ativacao por grupo:

- `/activation mention`
- `/activation always`

O proprietario e determinado por `channels.whatsapp.allowFrom` (ou o E.164 do proprio Bot quando nao definido). Envie o comando como uma mensagem standalone. Outras superficies atualmente ignoram `/activation`.

## Campos de contexto

Payloads de entrada de grupo definem:

- `ChatType=group`
- `GroupSubject` (se conhecido)
- `GroupMembers` (se conhecido)
- `WasMentioned` (resultado do controle por mencao)
- Topicos de forum do Telegram tambem incluem `MessageThreadId` e `IsForum`.

O prompt de sistema do agente inclui uma introducao de grupo no primeiro turno de uma nova sessao de grupo. Ele lembra o modelo de responder como um humano, evitar tabelas Markdown e evitar digitar sequencias literais `\n`.

## Especificidades do iMessage

- Prefira `chat_id:<id>` ao rotear ou criar listas de permitidos.
- Liste chats: `imsg chats --limit 20`.
- Respostas de grupo sempre voltam para o mesmo `chat_id`.

## Especificidades do WhatsApp

Veja [Mensagens de grupo](/channels/group-messages) para comportamento especifico do WhatsApp (injecao de historico, detalhes de tratamento de mencao).
