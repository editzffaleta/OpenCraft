---
summary: "Roteamento multi-agente: agentes isolados, contas de canal e bindings"
title: Multi-Agent Routing
read_when: "Voce quer multiplos agentes isolados (workspaces + autenticacao) em um processo de Gateway."
status: active
---

# Roteamento Multi-Agente

Objetivo: multiplos agentes _isolados_ (workspace separado + `agentDir` + sessoes), mais multiplas contas de canal (ex. dois WhatsApps) em um unico Gateway em execucao. As mensagens de entrada sao roteadas para um agente via bindings.

## O que e "um agente"?

Um **agente** e um cerebro completamente isolado com seu proprio:

- **Workspace** (arquivos, AGENTS.md/SOUL.md/USER.md, notas locais, regras de persona).
- **Diretorio de estado** (`agentDir`) para perfis de autenticacao, registro de modelos e configuracao por agente.
- **Armazenamento de sessoes** (historico de chat + estado de roteamento) sob `~/.opencraft/agents/<agentId>/sessions`.

Os perfis de autenticacao sao **por agente**. Cada agente le do seu proprio:

```text
~/.opencraft/agents/<agentId>/agent/auth-profiles.json
```

As credenciais do agente principal **nao** sao compartilhadas automaticamente. Nunca reutilize `agentDir`
entre agentes (causa colisoes de autenticacao/sessao). Se voce quiser compartilhar credenciais,
copie `auth-profiles.json` para o `agentDir` do outro agente.

Skills sao por agente via a pasta `skills/` de cada workspace, com Skills
compartilhadas disponiveis em `~/.opencraft/skills`. Veja [Skills: por agente vs compartilhadas](/tools/skills#per-agent-vs-shared-skills).

O Gateway pode hospedar **um agente** (padrao) ou **muitos agentes** lado a lado.

**Nota sobre workspace:** o workspace de cada agente e o **cwd padrao**, nao um
sandbox rigido. Caminhos relativos resolvem dentro do workspace, mas caminhos absolutos podem
alcancar outros locais do host, a menos que o sandboxing esteja habilitado. Veja
[Sandboxing](/gateway/sandboxing).

## Caminhos (mapa rapido)

- Configuracao: `~/.editzffaleta/OpenCraft.json` (ou `OPENCRAFT_CONFIG_PATH`)
- Diretorio de estado: `~/.opencraft` (ou `OPENCRAFT_STATE_DIR`)
- Workspace: `~/.opencraft/workspace` (ou `~/.opencraft/workspace-<agentId>`)
- Diretorio do agente: `~/.opencraft/agents/<agentId>/agent` (ou `agents.list[].agentDir`)
- Sessoes: `~/.opencraft/agents/<agentId>/sessions`

### Modo de agente unico (padrao)

Se voce nao fizer nada, o OpenCraft executa um unico agente:

- `agentId` padrao e **`main`**.
- As sessoes sao chaveadas como `agent:main:<mainKey>`.
- O workspace padrao e `~/.opencraft/workspace` (ou `~/.opencraft/workspace-<profile>` quando `OPENCRAFT_PROFILE` esta definido).
- O estado padrao e `~/.opencraft/agents/main/agent`.

## Auxiliar de agente

Use o assistente de agente para adicionar um novo agente isolado:

```bash
opencraft agents add work
```

Depois adicione `bindings` (ou deixe o assistente fazer isso) para rotear mensagens de entrada.

Verifique com:

```bash
opencraft agents list --bindings
```

## Inicio rapido

<Steps>
  <Step title="Crie cada workspace de agente">

Use o assistente ou crie workspaces manualmente:

```bash
opencraft agents add coding
opencraft agents add social
```

Cada agente recebe seu proprio workspace com `SOUL.md`, `AGENTS.md` e opcional `USER.md`, mais um `agentDir` dedicado e armazenamento de sessoes sob `~/.opencraft/agents/<agentId>`.

  </Step>

  <Step title="Crie contas de canal">

Crie uma conta por agente nos seus canais preferidos:

- Discord: um Bot por agente, habilite o Message Content Intent, copie cada Token.
- Telegram: um Bot por agente via BotFather, copie cada Token.
- WhatsApp: vincule cada numero de telefone por conta.

```bash
opencraft channels login --channel whatsapp --account work
```

Veja os guias de canal: [Discord](/channels/discord), [Telegram](/channels/telegram), [WhatsApp](/channels/whatsapp).

  </Step>

  <Step title="Adicione agentes, contas e bindings">

Adicione agentes sob `agents.list`, contas de canal sob `channels.<channel>.accounts` e conecte-os com `bindings` (exemplos abaixo).

  </Step>

  <Step title="Reinicie e verifique">

```bash
opencraft gateway restart
opencraft agents list --bindings
opencraft channels status --probe
```

  </Step>
</Steps>

## Multiplos agentes = multiplas pessoas, multiplas personalidades

Com **multiplos agentes**, cada `agentId` se torna uma **persona totalmente isolada**:

- **Numeros de telefone/contas diferentes** (por `accountId` de canal).
- **Personalidades diferentes** (por arquivos de workspace do agente como `AGENTS.md` e `SOUL.md`).
- **Autenticacao + sessoes separadas** (sem interferencia, a menos que explicitamente habilitado).

Isso permite que **multiplas pessoas** compartilhem um servidor Gateway mantendo seus "cerebros" de IA e dados isolados.

## Um numero de WhatsApp, multiplas pessoas (divisao por DM)

Voce pode rotear **DMs diferentes do WhatsApp** para agentes diferentes enquanto permanece em **uma conta de WhatsApp**. Faca a correspondencia pelo E.164 do remetente (como `+15551234567`) com `peer.kind: "direct"`. As respostas ainda vem do mesmo numero de WhatsApp (sem identidade de remetente por agente).

Detalhe importante: chats diretos colapsam para a **chave de sessao principal** do agente, entao o isolamento verdadeiro requer **um agente por pessoa**.

Exemplo:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.opencraft/workspace-alex" },
      { id: "mia", workspace: "~/.opencraft/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

Notas:

- O controle de acesso DM e **global por conta de WhatsApp** (pareamento/lista de permissoes), nao por agente.
- Para grupos compartilhados, vincule o grupo a um agente ou use [Grupos de broadcast](/channels/broadcast-groups).

## Regras de roteamento (como as mensagens escolhem um agente)

Bindings sao **deterministicos** e **mais especifico vence**:

1. Correspondencia de `peer` (ID exato de DM/grupo/canal)
2. Correspondencia de `parentPeer` (heranca de thread)
3. `guildId + roles` (roteamento por role do Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. Correspondencia de `accountId` para um canal
7. Correspondencia em nivel de canal (`accountId: "*"`)
8. Fallback para agente padrao (`agents.list[].default`, senao primeira entrada da lista, padrao: `main`)

Se multiplos bindings corresponderem no mesmo nivel, o primeiro na ordem de configuracao vence.
Se um binding define multiplos campos de correspondencia (por exemplo `peer` + `guildId`), todos os campos especificados sao necessarios (semantica `AND`).

Detalhe importante sobre escopo de conta:

- Um binding que omite `accountId` corresponde apenas a conta padrao.
- Use `accountId: "*"` para um fallback em nivel de canal entre todas as contas.
- Se voce adicionar posteriormente o mesmo binding para o mesmo agente com um ID de conta explicito, o OpenCraft atualiza o binding existente de apenas canal para com escopo de conta em vez de duplica-lo.

## Multiplas contas / numeros de telefone

Canais que suportam **multiplas contas** (ex. WhatsApp) usam `accountId` para identificar
cada login. Cada `accountId` pode ser roteado para um agente diferente, entao um servidor pode hospedar
multiplos numeros de telefone sem misturar sessoes.

Se voce quiser uma conta padrao em nivel de canal quando `accountId` for omitido, defina
`channels.<channel>.defaultAccount` (opcional). Quando nao definido, o OpenCraft recorre a
`default` se presente, caso contrario o primeiro ID de conta configurado (ordenado).

Canais comuns que suportam este padrao incluem:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Conceitos

- `agentId`: um "cerebro" (workspace, autenticacao por agente, armazenamento de sessoes por agente).
- `accountId`: uma instancia de conta de canal (ex. conta WhatsApp `"personal"` vs `"biz"`).
- `binding`: roteia mensagens de entrada para um `agentId` por `(channel, accountId, peer)` e opcionalmente IDs de guild/team.
- Chats diretos colapsam para `agent:<agentId>:<mainKey>` ("principal" por agente; `session.mainKey`).

## Exemplos por plataforma

### Bots Discord por agente

Cada conta de Bot Discord mapeia para um `accountId` unico. Vincule cada conta a um agente e mantenha listas de permissoes por Bot.

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.opencraft/workspace-main" },
      { id: "coding", workspace: "~/.opencraft/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

Notas:

- Convide cada Bot para o servidor e habilite o Message Content Intent.
- Os Token ficam em `channels.discord.accounts.<id>.token` (a conta padrao pode usar `DISCORD_BOT_TOKEN`).

### Bots Telegram por agente

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.opencraft/workspace-main" },
      { id: "alerts", workspace: "~/.opencraft/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

Notas:

- Crie um Bot por agente com o BotFather e copie cada Token.
- Os Token ficam em `channels.telegram.accounts.<id>.botToken` (a conta padrao pode usar `TELEGRAM_BOT_TOKEN`).

### Numeros de WhatsApp por agente

Vincule cada conta antes de iniciar o Gateway:

```bash
opencraft channels login --channel whatsapp --account personal
opencraft channels login --channel whatsapp --account biz
```

`~/.editzffaleta/OpenCraft.json` (JSON5):

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.opencraft/workspace-home",
        agentDir: "~/.opencraft/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.opencraft/workspace-work",
        agentDir: "~/.opencraft/agents/work/agent",
      },
    ],
  },

  // Roteamento deterministico: primeira correspondencia vence (mais especifico primeiro).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Substituicao opcional por peer (exemplo: enviar um grupo especifico para o agente work).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Desligado por padrao: mensagens entre agentes devem ser explicitamente habilitadas + na lista de permissoes.
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // Substituicao opcional. Padrao: ~/.opencraft/credentials/whatsapp/personal
          // authDir: "~/.opencraft/credentials/whatsapp/personal",
        },
        biz: {
          // Substituicao opcional. Padrao: ~/.opencraft/credentials/whatsapp/biz
          // authDir: "~/.opencraft/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## Exemplo: chat diario no WhatsApp + trabalho profundo no Telegram

Divida por canal: roteie WhatsApp para um agente rapido do dia a dia e Telegram para um agente Opus.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.opencraft/workspace-chat",
        model: "anthropic/claude-sonnet-4-5",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.opencraft/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

Notas:

- Se voce tem multiplas contas para um canal, adicione `accountId` ao binding (por exemplo `{ channel: "whatsapp", accountId: "personal" }`).
- Para rotear um unico DM/grupo para o Opus enquanto mantém o resto no chat, adicione um binding `match.peer` para aquele peer; correspondencias de peer sempre vencem sobre regras em nivel de canal.

## Exemplo: mesmo canal, um peer para o Opus

Mantenha o WhatsApp no agente rapido, mas roteie um DM para o Opus:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.opencraft/workspace-chat",
        model: "anthropic/claude-sonnet-4-5",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.opencraft/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

Bindings de peer sempre vencem, entao mantenha-os acima da regra em nivel de canal.

## Agente familiar vinculado a um grupo de WhatsApp

Vincule um agente familiar dedicado a um unico grupo de WhatsApp, com controle de mencao
e uma politica de ferramentas mais restrita:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.opencraft/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

Notas:

- Listas de permissao/negacao de ferramentas sao **ferramentas**, nao Skills. Se um Skill precisa executar um
  binario, certifique-se de que `exec` esta permitido e o binario existe no sandbox.
- Para controle mais rigoroso, defina `agents.list[].groupChat.mentionPatterns` e mantenha
  as listas de permissoes de grupo habilitadas para o canal.

## Sandbox e Configuracao de Ferramentas por Agente

A partir da v2026.1.6, cada agente pode ter suas proprias restricoes de sandbox e ferramentas:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.opencraft/workspace-personal",
        sandbox: {
          mode: "off",  // Sem sandbox para o agente pessoal
        },
        // Sem restricoes de ferramentas - todas as ferramentas disponiveis
      },
      {
        id: "family",
        workspace: "~/.opencraft/workspace-family",
        sandbox: {
          mode: "all",     // Sempre em sandbox
          scope: "agent",  // Um container por agente
          docker: {
            // Configuracao unica opcional apos criacao do container
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Apenas ferramenta de leitura
          deny: ["exec", "write", "edit", "apply_patch"],    // Negar outras
        },
      },
    ],
  },
}
```

Nota: `setupCommand` fica sob `sandbox.docker` e executa uma vez na criacao do container.
Substituicoes por agente `sandbox.docker.*` sao ignoradas quando o escopo resolvido e `"shared"`.

**Beneficios:**

- **Isolamento de seguranca**: Restrinja ferramentas para agentes nao confiaveis
- **Controle de recursos**: Coloque agentes especificos em sandbox enquanto mantém outros no host
- **Politicas flexiveis**: Permissoes diferentes por agente

Nota: `tools.elevated` e **global** e baseado no remetente; nao e configuravel por agente.
Se voce precisa de limites por agente, use `agents.list[].tools` para negar `exec`.
Para direcionamento de grupo, use `agents.list[].groupChat.mentionPatterns` para que @mencoes mapeiem corretamente para o agente pretendido.

Veja [Sandbox e Ferramentas Multi-Agente](/tools/multi-agent-sandbox-tools) para exemplos detalhados.
