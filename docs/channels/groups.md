---
summary: "Comportamento de chat em grupo entre plataformas (WhatsApp/Telegram/Discord/Slack/Signal/iMessage/Microsoft Teams/Zalo)"
read_when:
  - Alterando comportamento de chat em grupo ou controle de menção
title: "Grupos"
---

# Grupos

O OpenCraft trata chats em grupo de forma consistente entre plataformas: WhatsApp, Telegram, Discord, Slack, Signal, iMessage, Microsoft Teams, Zalo.

## Introdução para iniciantes (2 minutos)

O OpenCraft "vive" nas suas próprias contas de mensagens. Não há um usuário bot separado do WhatsApp.
Se **você** está em um grupo, o OpenCraft pode ver esse grupo e responder lá.

Comportamento padrão:

- Grupos são restritos (`groupPolicy: "allowlist"`).
- Respostas requerem uma menção, a menos que você desabilite explicitamente o controle de menção.

Tradução: remetentes na lista de permissão podem acionar o OpenCraft ao mencioná-lo.

> TL;DR
>
> - **Acesso a DM** é controlado por `*.allowFrom`.
> - **Acesso a grupo** é controlado por `*.groupPolicy` + listas de permissão (`*.groups`, `*.groupAllowFrom`).
> - **Acionamento por resposta** é controlado pelo controle de menção (`requireMention`, `/activation`).

Fluxo rápido (o que acontece com uma mensagem de grupo):

```
groupPolicy? disabled -> descartar
groupPolicy? allowlist -> grupo permitido? não -> descartar
requireMention? yes -> mencionado? não -> armazenar apenas como contexto
caso contrário -> responder
```

![Fluxo de mensagem de grupo](/images/groups-flow.svg)

Se você quiser...

| Objetivo                                              | O que definir                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| Permitir todos os grupos mas responder apenas em @menções | `groups: { "*": { requireMention: true } }`                   |
| Desabilitar todas as respostas em grupo               | `groupPolicy: "disabled"`                                          |
| Apenas grupos específicos                             | `groups: { "<group-id>": { ... } }` (sem chave `"*"`)             |
| Apenas você pode acionar em grupos                    | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+5511..."]`         |

## Chaves de sessão

- Sessões de grupo usam chaves de sessão `agent:<agentId>:<channel>:group:<id>` (salas/canais usam `agent:<agentId>:<channel>:channel:<id>`).
- Tópicos de fórum do Telegram adicionam `:topic:<threadId>` ao id do grupo para que cada tópico tenha sua própria sessão.
- Chats diretos usam a sessão principal (ou por remetente, se configurado).
- Heartbeats são ignorados para sessões de grupo.

## Padrão: DMs pessoais + grupos públicos (agente único)

Sim — isso funciona bem se seu tráfego "pessoal" são **DMs** e seu tráfego "público" são **grupos**.

Por quê: no modo de agente único, DMs tipicamente chegam na chave de sessão **main** (`agent:main:main`), enquanto grupos sempre usam chaves de sessão **não-main** (`agent:main:<channel>:group:<id>`). Se você habilitar sandboxing com `mode: "non-main"`, essas sessões de grupo executam no Docker enquanto sua sessão principal de DM permanece no host.

Isso lhe dá um "cérebro" de agente (workspace + memória compartilhados), mas duas posturas de execução:

- **DMs**: ferramentas completas (host)
- **Grupos**: sandbox + ferramentas restritas (Docker)

> Se você precisar de workspaces/personas verdadeiramente separados ("pessoal" e "público" nunca devem se misturar), use um segundo agente + bindings. Veja [Roteamento Multi-Agente](/concepts/multi-agent).

Exemplo (DMs no host, grupos em sandbox + ferramentas apenas de mensagens):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // grupos/canais são non-main -> em sandbox
        scope: "session", // isolamento mais forte (um container por grupo/canal)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // Se allow não estiver vazio, todo o resto é bloqueado (deny ainda vence).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Quer "grupos podem ver apenas a pasta X" em vez de "sem acesso ao host"? Mantenha `workspaceAccess: "none"` e monte apenas caminhos na lista de permissão no sandbox:

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
            "/home/user/CompartilhadoAmigos:/data:ro",
          ],
        },
      },
    },
  },
}
```

Relacionados:

- Chaves e padrões de configuração: [Configuração do Gateway](/gateway/configuration#agentsdefaultssandbox)
- Depurando por que uma ferramenta está bloqueada: [Sandbox vs Política de Ferramenta vs Elevado](/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalhes de bind mounts: [Sandboxing](/gateway/sandboxing#custom-bind-mounts)

## Rótulos de exibição

- Rótulos de UI usam `displayName` quando disponível, formatado como `<channel>:<token>`.
- `#sala` é reservado para salas/canais; chats em grupo usam `g-<slug>` (minúsculas, espaços -> `-`, mantém `#@+._-`).

## Política de grupo

Controle como mensagens de grupo/sala são tratadas por canal:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+5511999999999"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // id numérico de usuário Telegram (o wizard pode resolver @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+5511999999999"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["usuario@org.com"],
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
      groupAllowFrom: ["@dono:example.org"],
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| Política      | Comportamento                                                           |
| ------------- | ----------------------------------------------------------------------- |
| `"open"`      | Grupos ignoram listas de permissão; controle de menção ainda se aplica. |
| `"disabled"`  | Bloqueia todas as mensagens de grupo completamente.                     |
| `"allowlist"` | Permite apenas grupos/salas que correspondem à lista de permissão configurada. |

Notas:

- `groupPolicy` é separado do controle de menção (que requer @menções).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: use `groupAllowFrom` (fallback: `allowFrom` explícito).
- Aprovações de pareamento de DM (entradas do store `*-allowFrom`) se aplicam apenas ao acesso de DM; a autorização de remetente em grupo permanece explícita nas listas de permissão de grupo.
- Discord: a lista de permissão usa `channels.discord.guilds.<id>.channels`.
- Slack: a lista de permissão usa `channels.slack.channels`.
- Matrix: a lista de permissão usa `channels.matrix.groups` (IDs de sala, aliases ou nomes). Use `channels.matrix.groupAllowFrom` para restringir remetentes; listas de permissão de `users` por sala também são suportadas.
- DMs de grupo são controlados separadamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
- A lista de permissão do Telegram pode corresponder a IDs de usuário (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) ou usernames (`"@alice"` ou `"alice"`); prefixos são insensíveis a maiúsculas.
- O padrão é `groupPolicy: "allowlist"`; se sua lista de permissão de grupos estiver vazia, as mensagens de grupo são bloqueadas.
- Segurança em runtime: quando um bloco de provedor está completamente ausente (`channels.<provedor>` ausente), a política de grupo recorre a um modo fail-closed (tipicamente `allowlist`) em vez de herdar `channels.defaults.groupPolicy`.

Modelo mental rápido (ordem de avaliação para mensagens de grupo):

1. `groupPolicy` (open/disabled/allowlist)
2. listas de permissão de grupo (`*.groups`, `*.groupAllowFrom`, lista de permissão específica do canal)
3. controle de menção (`requireMention`, `/activation`)

## Controle de menção (padrão)

Mensagens de grupo requerem uma menção, a menos que seja substituído por grupo. Os padrões ficam por subsistema em `*.groups."*"`.

Responder a uma mensagem do bot conta como uma menção implícita (quando o canal suporta metadados de resposta). Isso se aplica ao Telegram, WhatsApp, Slack, Discord e Microsoft Teams.

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
          mentionPatterns: ["@opencraft", "opencraft", "\\+5511999999999"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

Notas:

- `mentionPatterns` são padrões de regex insensíveis a maiúsculas e seguros; padrões inválidos e formas inseguras de repetição aninhada são ignorados.
- Plataformas que fornecem menções explícitas ainda passam; padrões são um fallback.
- Substituição por agente: `agents.list[].groupChat.mentionPatterns` (útil quando múltiplos agentes compartilham um grupo).
- O controle de menção só é aplicado quando a detecção de menção é possível (menções nativas ou `mentionPatterns` configurados).
- Padrões do Discord ficam em `channels.discord.guilds."*"` (substituível por guilda/canal).
- O contexto de histórico de grupo é encapsulado uniformemente entre canais e é **apenas pendente** (mensagens ignoradas devido ao controle de menção); use `messages.groupChat.historyLimit` para o padrão global e `channels.<canal>.historyLimit` (ou `channels.<canal>.accounts.*.historyLimit`) para substituições. Defina `0` para desabilitar.

## Restrições de ferramentas em grupo/canal (opcional)

Algumas configurações de canal suportam restrição de quais ferramentas estão disponíveis **dentro de um grupo/sala/canal específico**.

- `tools`: permitir/negar ferramentas para todo o grupo.
- `toolsBySender`: substituições por remetente dentro do grupo.
  Use prefixos de chave explícitos:
  `id:<senderId>`, `e164:<telefone>`, `username:<handle>`, `name:<displayName>`, e o curinga `"*"`.
  Chaves legadas sem prefixo ainda são aceitas e correspondidas apenas como `id:`.

Ordem de resolução (o mais específico vence):

1. correspondência de `toolsBySender` do grupo/canal
2. `tools` do grupo/canal
3. correspondência de `toolsBySender` padrão (`"*"`)
4. `tools` padrão (`"*"`)

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

- Restrições de ferramentas de grupo/canal são aplicadas em adição à política global/do agente de ferramentas (deny ainda vence).
- Alguns canais usam aninhamento diferente para salas/canais (por exemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, MS Teams `teams.*.channels.*`).

## Listas de permissão de grupo

Quando `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` está configurado, as chaves atuam como uma lista de permissão de grupos. Use `"*"` para permitir todos os grupos enquanto ainda define o comportamento de menção padrão.

Intenções comuns (copiar/colar):

1. Desabilitar todas as respostas em grupo

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Permitir apenas grupos específicos (WhatsApp)

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

3. Permitir todos os grupos mas exigir menção (explícito)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Apenas o proprietário pode acionar em grupos (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+5511999999999"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Ativação (apenas proprietário)

Os proprietários de grupos podem alternar a ativação por grupo:

- `/activation mention`
- `/activation always`

O proprietário é determinado por `channels.whatsapp.allowFrom` (ou o E.164 self do bot quando não definido). Envie o comando como uma mensagem independente. Outras plataformas atualmente ignoram `/activation`.

## Campos de contexto

Payloads de entrada de grupo definem:

- `ChatType=group`
- `GroupSubject` (se conhecido)
- `GroupMembers` (se conhecido)
- `WasMentioned` (resultado do controle de menção)
- Tópicos de fórum do Telegram também incluem `MessageThreadId` e `IsForum`.

O prompt de sistema do agente inclui uma introdução de grupo no primeiro turno de uma nova sessão de grupo. Ele lembra o modelo para responder como um humano, evitar tabelas Markdown e evitar digitar sequências literais `\n`.

## Especificidades do iMessage

- Prefira `chat_id:<id>` ao rotear ou adicionar à lista de permissão.
- Listar chats: `imsg chats --limit 20`.
- Respostas de grupo sempre voltam para o mesmo `chat_id`.

## Especificidades do WhatsApp

Veja [Mensagens de grupo](/channels/group-messages) para comportamento exclusivo do WhatsApp (injeção de histórico, detalhes de tratamento de menção).
