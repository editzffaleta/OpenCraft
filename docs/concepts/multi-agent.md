---
summary: "Roteamento multi-agente: agentes isolados, contas de canal e bindings"
title: Roteamento Multi-Agente
read_when: "Você quer múltiplos agentes isolados (workspaces + auth) em um único processo de gateway."
status: active
---

# Roteamento Multi-Agente

Objetivo: múltiplos agentes _isolados_ (workspace + `agentDir` + sessões separados), mais múltiplas contas de canal (ex.: dois WhatsApps) em um Gateway em execução. Mensagens de entrada são roteadas para um agente via bindings.

## O que é "um agente"?

Um **agente** é um cérebro completamente isolado com seu próprio:

- **Workspace** (arquivos, AGENTS.md/SOUL.md/USER.md, notas locais, regras de persona).
- **Diretório de estado** (`agentDir`) para perfis de auth, registro de modelo e config por agente.
- **Armazenamento de sessão** (histórico de chat + estado de roteamento) em `~/.opencraft/agents/<agentId>/sessions`.

Perfis de auth são **por agente**. Cada agente lê de seu próprio:

```text
~/.opencraft/agents/<agentId>/agent/auth-profiles.json
```

Credenciais do agente principal **não** são compartilhadas automaticamente. Nunca reutilize `agentDir`
entre agentes (isso causa colisões de auth/sessão). Se você quiser compartilhar credenciais,
copie `auth-profiles.json` para o `agentDir` do outro agente.

Skills são por agente via a pasta `skills/` de cada workspace, com skills compartilhados
disponíveis em `~/.opencraft/skills`. Veja [Skills: por agente vs compartilhados](/tools/skills#per-agent-vs-shared-skills).

O Gateway pode hospedar **um agente** (padrão) ou **muitos agentes** lado a lado.

**Nota sobre workspace:** o workspace de cada agente é o **cwd padrão**, não um
sandbox rígido. Caminhos relativos resolvem dentro do workspace, mas caminhos absolutos podem
alcançar outros locais do host a não ser que o sandboxing esteja habilitado. Veja
[Sandboxing](/gateway/sandboxing).

## Caminhos (mapa rápido)

- Config: `~/.opencraft/opencraft.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado: `~/.opencraft` (ou `OPENCLAW_STATE_DIR`)
- Workspace: `~/.opencraft/workspace` (ou `~/.opencraft/workspace-<agentId>`)
- Diretório do agente: `~/.opencraft/agents/<agentId>/agent` (ou `agents.list[].agentDir`)
- Sessões: `~/.opencraft/agents/<agentId>/sessions`

### Modo agente único (padrão)

Se você não fizer nada, o OpenCraft roda um único agente:

- `agentId` padrão é **`main`**.
- Sessões são chaveadas como `agent:main:<mainKey>`.
- Workspace padrão é `~/.opencraft/workspace` (ou `~/.opencraft/workspace-<profile>` quando `OPENCLAW_PROFILE` estiver definido).
- Estado padrão é `~/.opencraft/agents/main/agent`.

## Helper de agente

Use o assistente de agente para adicionar um novo agente isolado:

```bash
opencraft agents add work
```

Depois adicione `bindings` (ou deixe o assistente fazer isso) para rotear mensagens de entrada.

Verifique com:

```bash
opencraft agents list --bindings
```

## Início rápido

<Steps>
  <Step title="Criar cada workspace de agente">

Use o assistente ou crie workspaces manualmente:

```bash
opencraft agents add coding
opencraft agents add social
```

Cada agente recebe seu próprio workspace com `SOUL.md`, `AGENTS.md` e `USER.md` opcional, mais um `agentDir` dedicado e armazenamento de sessão em `~/.opencraft/agents/<agentId>`.

  </Step>

  <Step title="Criar contas de canal">

Crie uma conta por agente nos seus canais preferidos:

- Discord: um bot por agente, habilite Message Content Intent, copie cada token.
- Telegram: um bot por agente via BotFather, copie cada token.
- WhatsApp: vincule cada número de telefone por conta.

```bash
opencraft channels login --channel whatsapp --account work
```

Veja guias de canal: [Discord](/channels/discord), [Telegram](/channels/telegram), [WhatsApp](/channels/whatsapp).

  </Step>

  <Step title="Adicionar agentes, contas e bindings">

Adicione agentes em `agents.list`, contas de canal em `channels.<channel>.accounts` e conecte-os com `bindings` (exemplos abaixo).

  </Step>

  <Step title="Reiniciar e verificar">

```bash
opencraft gateway restart
opencraft agents list --bindings
opencraft channels status --probe
```

  </Step>
</Steps>

## Múltiplos agentes = múltiplas pessoas, múltiplas personalidades

Com **múltiplos agentes**, cada `agentId` se torna uma **persona completamente isolada**:

- **Números de telefone/contas diferentes** (por `accountId` de canal).
- **Personalidades diferentes** (arquivos de workspace por agente como `AGENTS.md` e `SOUL.md`).
- **Auth + sessões separadas** (sem comunicação cruzada a não ser que habilitada explicitamente).

Isso permite que **múltiplas pessoas** compartilhem um servidor Gateway enquanto mantêm seus "cérebros" de IA e dados isolados.

## Um número de WhatsApp, múltiplas pessoas (split por DM)

Você pode rotear **diferentes DMs do WhatsApp** para diferentes agentes enquanto permanece em **uma conta do WhatsApp**. Combine no E.164 do remetente (como `+15551234567`) com `peer.kind: "direct"`. Respostas ainda vêm do mesmo número de WhatsApp (sem identidade de remetente por agente).

Detalhe importante: chats diretos colapsam para a **chave de sessão principal** do agente, então isolamento real requer **um agente por pessoa**.

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

- Controle de acesso a DM é **global por conta WhatsApp** (pareamento/allowlist), não por agente.
- Para grupos compartilhados, vincule o grupo a um agente ou use [Grupos de broadcast](/channels/broadcast-groups).

## Regras de roteamento (como mensagens escolhem um agente)

Bindings são **determinísticos** e **o mais específico vence**:

1. match de `peer` (id exato de DM/grupo/canal)
2. match de `parentPeer` (herança de thread)
3. `guildId + roles` (roteamento por role do Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. match de `accountId` para um canal
7. match de nível de canal (`accountId: "*"`)
8. fallback para o agente padrão (`agents.list[].default`, senão primeira entrada da lista, padrão: `main`)

Se múltiplos bindings corresponderem no mesmo tier, o primeiro na ordem de config vence.
Se um binding define múltiplos campos de match (por exemplo `peer` + `guildId`), todos os campos especificados são necessários (semântica `AND`).

Detalhe importante sobre escopo de conta:

- Um binding que omite `accountId` corresponde apenas à conta padrão.
- Use `accountId: "*"` para um fallback de canal amplo em todas as contas.
- Se você adicionar o mesmo binding para o mesmo agente com um id de conta explícito, o OpenCraft atualiza o binding somente-canal existente para escopo de conta em vez de duplicá-lo.

## Múltiplas contas / números de telefone

Canais que suportam **múltiplas contas** (ex.: WhatsApp) usam `accountId` para identificar
cada login. Cada `accountId` pode ser roteado para um agente diferente, então um servidor pode hospedar
múltiplos números de telefone sem misturar sessões.

Se você quiser uma conta padrão de canal amplo quando `accountId` for omitido, defina
`channels.<channel>.defaultAccount` (opcional). Quando não definido, o OpenCraft faz fallback
para `default` se presente, caso contrário o primeiro id de conta configurado (ordenado).

Canais comuns que suportam este padrão incluem:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Conceitos

- `agentId`: um "cérebro" (workspace, auth por agente, armazenamento de sessão por agente).
- `accountId`: uma instância de conta de canal (ex.: conta WhatsApp `"personal"` vs `"biz"`).
- `binding`: roteia mensagens de entrada para um `agentId` por `(channel, accountId, peer)` e opcionalmente ids de guild/team.
- Chats diretos colapsam para `agent:<agentId>:<mainKey>` (por agente "main"; `session.mainKey`).

## Exemplos de plataforma

### Bots Discord por agente

Cada conta de bot Discord mapeia para um `accountId` único. Vincule cada conta a um agente e mantenha allowlists por bot.

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

- Convide cada bot para o guild e habilite o Message Content Intent.
- Tokens ficam em `channels.discord.accounts.<id>.token` (conta padrão pode usar `DISCORD_BOT_TOKEN`).

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

- Crie um bot por agente com o BotFather e copie cada token.
- Tokens ficam em `channels.telegram.accounts.<id>.botToken` (conta padrão pode usar `TELEGRAM_BOT_TOKEN`).

### Números WhatsApp por agente

Vincule cada conta antes de iniciar o gateway:

```bash
opencraft channels login --channel whatsapp --account personal
opencraft channels login --channel whatsapp --account biz
```

`~/.opencraft/opencraft.json` (JSON5):

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

  // Roteamento determinístico: o primeiro match vence (mais específico primeiro).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Override por peer opcional (exemplo: enviar um grupo específico para o agente work).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Desligado por padrão: mensagens agente-para-agente devem ser explicitamente habilitadas + allowlistadas.
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
          // Override opcional. Padrão: ~/.opencraft/credentials/whatsapp/personal
          // authDir: "~/.opencraft/credentials/whatsapp/personal",
        },
        biz: {
          // Override opcional. Padrão: ~/.opencraft/credentials/whatsapp/biz
          // authDir: "~/.opencraft/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## Exemplo: chat diário WhatsApp + trabalho profundo Telegram

Divida por canal: roteie WhatsApp para um agente cotidiano rápido e Telegram para um agente Opus.

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

- Se você tiver múltiplas contas para um canal, adicione `accountId` ao binding (por exemplo `{ channel: "whatsapp", accountId: "personal" }`).
- Para rotear um único DM/grupo para Opus enquanto mantém o resto no chat, adicione um binding `match.peer` para esse peer; matches de peer sempre vencem sobre regras de canal amplo.

## Exemplo: mesmo canal, um peer para Opus

Mantenha WhatsApp no agente rápido, mas roteie um DM para Opus:

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

Bindings de peer sempre vencem, então mantenha-os acima da regra de canal amplo.

## Agente familiar vinculado a um grupo do WhatsApp

Vincule um agente familiar dedicado a um único grupo do WhatsApp, com
controle por menção e uma política de ferramentas mais restrita:

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

- Listas de allow/deny de ferramentas são **ferramentas**, não skills. Se um skill precisar rodar um
  binário, garanta que `exec` esteja permitido e o binário exista no sandbox.
- Para controle mais estrito, defina `agents.list[].groupChat.mentionPatterns` e mantenha
  as allowlists de grupo habilitadas para o canal.

## Configuração de Sandbox e Ferramentas por Agente

A partir do v2026.1.6, cada agente pode ter seu próprio sandbox e restrições de ferramentas:

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
        // Sem restrições de ferramentas - todas as ferramentas disponíveis
      },
      {
        id: "family",
        workspace: "~/.opencraft/workspace-family",
        sandbox: {
          mode: "all",     // Sempre em sandbox
          scope: "agent",  // Um container por agente
          docker: {
            // Configuração opcional única após criação do container
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Apenas ferramenta read
          deny: ["exec", "write", "edit", "apply_patch"],    // Negar outras
        },
      },
    ],
  },
}
```

Nota: `setupCommand` fica em `sandbox.docker` e roda uma vez na criação do container.
Overrides `sandbox.docker.*` por agente são ignorados quando o escopo resolvido é `"shared"`.

**Benefícios:**

- **Isolamento de segurança**: Restrinja ferramentas para agentes não confiáveis
- **Controle de recursos**: Coloque em sandbox agentes específicos enquanto mantém outros no host
- **Políticas flexíveis**: Permissões diferentes por agente

Nota: `tools.elevated` é **global** e baseado em remetente; não é configurável por agente.
Se você precisar de limites por agente, use `agents.list[].tools` para negar `exec`.
Para direcionamento de grupo, use `agents.list[].groupChat.mentionPatterns` para que @menções mapeiem claramente para o agente pretendido.

Veja [Sandbox e Ferramentas Multi-Agente](/tools/multi-agent-sandbox-tools) para exemplos detalhados.
