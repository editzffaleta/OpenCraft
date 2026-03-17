---
summary: "Visao geral do Bot Feishu, recursos e configuracao"
read_when:
  - You want to connect a Feishu/Lark bot
  - You are configuring the Feishu channel
title: Feishu
---

# Bot Feishu

Feishu (Lark) e uma plataforma de chat de equipe usada por empresas para mensagens e colaboracao. Este Plugin conecta o OpenCraft a um Bot Feishu/Lark usando a inscricao de eventos via WebSocket da plataforma para que as mensagens possam ser recebidas sem expor uma URL publica de Webhook.

---

## Plugin integrado

Feishu ja vem integrado nas versoes atuais do OpenCraft, entao nenhuma instalacao separada de Plugin e
necessaria.

Se voce estiver usando uma versao mais antiga ou uma instalacao personalizada que nao inclui o
Feishu integrado, instale-o manualmente:

```bash
opencraft plugins install @opencraft/feishu
```

---

## Inicio rapido

Ha duas formas de adicionar o canal Feishu:

### Metodo 1: onboarding (recomendado)

Se voce acabou de instalar o OpenCraft, execute o onboarding:

```bash
opencraft onboard
```

O assistente guia voce por:

1. Criar um app Feishu e coletar credenciais
2. Configurar as credenciais do app no OpenCraft
3. Iniciar o Gateway

Apos a configuracao, verifique o status do Gateway:

- `opencraft gateway status`
- `opencraft logs --follow`

### Metodo 2: Configuracao via CLI

Se voce ja completou a instalacao inicial, adicione o canal via CLI:

```bash
opencraft channels add
```

Escolha **Feishu**, depois insira o App ID e o App Secret.

Apos a configuracao, gerencie o Gateway:

- `opencraft gateway status`
- `opencraft gateway restart`
- `opencraft logs --follow`

---

## Passo 1: Criar um app Feishu

### 1. Abra a Plataforma Aberta Feishu

Visite a [Plataforma Aberta Feishu](https://open.feishu.cn/app) e faca login.

Tenants Lark (global) devem usar [https://open.larksuite.com/app](https://open.larksuite.com/app) e definir `domain: "lark"` na configuracao do Feishu.

### 2. Crie um app

1. Clique em **Create enterprise app**
2. Preencha o nome do app + descricao
3. Escolha um icone para o app

![Create enterprise app](../images/feishu-step2-create-app.png)

### 3. Copie as credenciais

Em **Credentials & Basic Info**, copie:

- **App ID** (formato: `cli_xxx`)
- **App Secret**

**Importante:** mantenha o App Secret privado.

![Get credentials](../images/feishu-step3-credentials.png)

### 4. Configure as permissoes

Em **Permissions**, clique em **Batch import** e cole:

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:read",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

![Configure permissions](../images/feishu-step4-permissions.png)

### 5. Habilite a capacidade de Bot

Em **App Capability** > **Bot**:

1. Habilite a capacidade de Bot
2. Defina o nome do Bot

![Enable bot capability](../images/feishu-step5-bot-capability.png)

### 6. Configure a inscricao de eventos

**Importante:** antes de configurar a inscricao de eventos, certifique-se de que:

1. Voce ja executou `opencraft channels add` para Feishu
2. O Gateway esta em execucao (`opencraft gateway status`)

Em **Event Subscription**:

1. Escolha **Use long connection to receive events** (WebSocket)
2. Adicione o evento: `im.message.receive_v1`

Se o Gateway nao estiver em execucao, a configuracao de conexao longa pode falhar ao salvar.

![Configure event subscription](../images/feishu-step6-event-subscription.png)

### 7. Publique o app

1. Crie uma versao em **Version Management & Release**
2. Envie para revisao e publique
3. Aguarde a aprovacao do administrador (apps empresariais geralmente sao aprovados automaticamente)

---

## Passo 2: Configurar o OpenCraft

### Configure com o assistente (recomendado)

```bash
opencraft channels add
```

Escolha **Feishu** e cole seu App ID + App Secret.

### Configure via arquivo de configuracao

Edite `~/.editzffaleta/OpenCraft.json`:

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          botName: "Meu assistente IA",
        },
      },
    },
  },
}
```

Se voce usar `connectionMode: "webhook"`, defina tanto `verificationToken` quanto `encryptKey`. O servidor de Webhook do Feishu faz bind em `127.0.0.1` por padrao; defina `webhookHost` apenas se voce intencionalmente precisar de um endereco de bind diferente.

#### Verification Token e Encrypt Key (modo Webhook)

Ao usar o modo Webhook, defina tanto `channels.feishu.verificationToken` quanto `channels.feishu.encryptKey` na sua configuracao. Para obter os valores:

1. Na Plataforma Aberta Feishu, abra seu app
2. Va em **Development** -> **Events & Callbacks** (开发配置 -> 事件与回调)
3. Abra a aba **Encryption** (加密策略)
4. Copie **Verification Token** e **Encrypt Key**

A captura de tela abaixo mostra onde encontrar o **Verification Token**. O **Encrypt Key** esta listado na mesma secao **Encryption**.

![Verification Token location](../images/feishu-verification-token.png)

### Configure via variaveis de ambiente

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Dominio Lark (global)

Se o seu tenant esta no Lark (internacional), defina o dominio como `lark` (ou uma string de dominio completa). Voce pode defini-lo em `channels.feishu.domain` ou por conta (`channels.feishu.accounts.<id>.domain`).

```json5
{
  channels: {
    feishu: {
      domain: "lark",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
        },
      },
    },
  },
}
```

### Flags de otimizacao de cota

Voce pode reduzir o uso da API Feishu com duas flags opcionais:

- `typingIndicator` (padrao `true`): quando `false`, pula chamadas de reacao de digitacao.
- `resolveSenderNames` (padrao `true`): quando `false`, pula chamadas de busca de perfil do remetente.

Defina-as no nivel superior ou por conta:

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          typingIndicator: true,
          resolveSenderNames: false,
        },
      },
    },
  },
}
```

---

## Passo 3: Iniciar + testar

### 1. Inicie o Gateway

```bash
opencraft gateway
```

### 2. Envie uma mensagem de teste

No Feishu, encontre seu Bot e envie uma mensagem.

### 3. Aprove o pareamento

Por padrao, o Bot responde com um codigo de pareamento. Aprove-o:

```bash
opencraft pairing approve feishu <CODE>
```

Apos a aprovacao, voce pode conversar normalmente.

---

## Visao geral

- **Canal de Bot Feishu**: Bot Feishu gerenciado pelo Gateway
- **Roteamento deterministico**: respostas sempre retornam ao Feishu
- **Isolamento de sessao**: DMs compartilham uma sessao principal; grupos sao isolados
- **Conexao WebSocket**: conexao longa via SDK Feishu, sem necessidade de URL publica

---

## Controle de acesso

### Mensagens diretas

- **Padrao**: `dmPolicy: "pairing"` (usuarios desconhecidos recebem um codigo de pareamento)
- **Aprovar pareamento**:

  ```bash
  opencraft pairing list feishu
  opencraft pairing approve feishu <CODE>
  ```

- **Modo lista de permitidos**: defina `channels.feishu.allowFrom` com Open IDs permitidos

### Chats em grupo

**1. Politica de grupo** (`channels.feishu.groupPolicy`):

- `"open"` = permitir todos nos grupos (padrao)
- `"allowlist"` = permitir apenas `groupAllowFrom`
- `"disabled"` = desabilitar mensagens de grupo

**2. Requisito de mencao** (`channels.feishu.groups.<chat_id>.requireMention`):

- `true` = requer @mencao (padrao)
- `false` = responder sem mencoes

---

## Exemplos de configuracao de grupo

### Permitir todos os grupos, requer @mencao (padrao)

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      // requireMention padrao: true
    },
  },
}
```

### Permitir todos os grupos, sem @mencao necessaria

```json5
{
  channels: {
    feishu: {
      groups: {
        oc_xxx: { requireMention: false },
      },
    },
  },
}
```

### Permitir apenas grupos especificos

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // IDs de grupo Feishu (chat_id) se parecem com: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Restringir quais remetentes podem enviar mensagens em um grupo (lista de permitidos de remetentes)

Alem de permitir o grupo em si, **todas as mensagens** naquele grupo sao controladas pelo open_id do remetente: apenas usuarios listados em `groups.<chat_id>.allowFrom` tem suas mensagens processadas; mensagens de outros membros sao ignoradas (isso e controle completo no nivel do remetente, nao apenas para comandos de controle como /reset ou /new).

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // IDs de usuario Feishu (open_id) se parecem com: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

## Obter IDs de grupo/usuario

### IDs de grupo (chat_id)

IDs de grupo se parecem com `oc_xxx`.

**Metodo 1 (recomendado)**

1. Inicie o Gateway e @mencione o Bot no grupo
2. Execute `opencraft logs --follow` e procure por `chat_id`

**Metodo 2**

Use o depurador de API do Feishu para listar chats em grupo.

### IDs de usuario (open_id)

IDs de usuario se parecem com `ou_xxx`.

**Metodo 1 (recomendado)**

1. Inicie o Gateway e envie uma DM para o Bot
2. Execute `opencraft logs --follow` e procure por `open_id`

**Metodo 2**

Verifique as solicitacoes de pareamento para Open IDs de usuarios:

```bash
opencraft pairing list feishu
```

---

## Comandos comuns

| Comando   | Descricao             |
| --------- | --------------------- |
| `/status` | Mostrar status do Bot |
| `/reset`  | Resetar a sessao      |
| `/model`  | Mostrar/trocar modelo |

> Nota: Feishu ainda nao suporta menus de comando nativos, entao os comandos devem ser enviados como texto.

## Comandos de gerenciamento do Gateway

| Comando                     | Descricao                        |
| --------------------------- | -------------------------------- |
| `opencraft gateway status`  | Mostrar status do Gateway        |
| `opencraft gateway install` | Instalar/iniciar servico Gateway |
| `opencraft gateway stop`    | Parar servico Gateway            |
| `opencraft gateway restart` | Reiniciar servico Gateway        |
| `opencraft logs --follow`   | Acompanhar logs do Gateway       |

---

## Solucao de problemas

### Bot nao responde em chats de grupo

1. Certifique-se de que o Bot foi adicionado ao grupo
2. Certifique-se de @mencionar o Bot (comportamento padrao)
3. Verifique se `groupPolicy` nao esta definido como `"disabled"`
4. Verifique os logs: `opencraft logs --follow`

### Bot nao recebe mensagens

1. Certifique-se de que o app esta publicado e aprovado
2. Certifique-se de que a inscricao de eventos inclui `im.message.receive_v1`
3. Certifique-se de que a **conexao longa** esta habilitada
4. Certifique-se de que as permissoes do app estao completas
5. Certifique-se de que o Gateway esta em execucao: `opencraft gateway status`
6. Verifique os logs: `opencraft logs --follow`

### Vazamento do App Secret

1. Resete o App Secret na Plataforma Aberta Feishu
2. Atualize o App Secret na sua configuracao
3. Reinicie o Gateway

### Falhas no envio de mensagens

1. Certifique-se de que o app tem a permissao `im:message:send_as_bot`
2. Certifique-se de que o app esta publicado
3. Verifique os logs para erros detalhados

---

## Configuracao avancada

### Multiplas contas

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          botName: "Bot principal",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          botName: "Bot de backup",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` controla qual conta Feishu e usada quando APIs de saida nao especificam um `accountId` explicitamente.

### Limites de mensagem

- `textChunkLimit`: tamanho do bloco de texto de saida (padrao: 2000 caracteres)
- `mediaMaxMb`: limite de upload/download de midia (padrao: 30MB)

### Streaming

Feishu suporta respostas em streaming via cards interativos. Quando habilitado, o Bot atualiza um card conforme gera texto.

```json5
{
  channels: {
    feishu: {
      streaming: true, // habilitar saida de card em streaming (padrao true)
      blockStreaming: true, // habilitar streaming em nivel de bloco (padrao true)
    },
  },
}
```

Defina `streaming: false` para aguardar a resposta completa antes de enviar.

### Sessoes ACP

Feishu suporta ACP para:

- DMs
- conversas em topicos de grupo

ACP no Feishu e orientado por comandos de texto. Nao ha menus de slash-command nativos, entao use mensagens `/acp ...` diretamente na conversa.

#### Bindings ACP persistentes

Use bindings ACP tipados de nivel superior para fixar uma DM ou conversa de topico do Feishu a uma sessao ACP persistente.

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/opencraft",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Spawn de ACP vinculado a thread a partir do chat

Em uma DM ou conversa de topico do Feishu, voce pode criar e vincular uma sessao ACP no local:

```text
/acp spawn codex --thread here
```

Notas:

- `--thread here` funciona para DMs e topicos do Feishu.
- Mensagens seguintes na DM/topico vinculado sao roteadas diretamente para aquela sessao ACP.
- A v1 nao direciona chats de grupo genericos sem topico.

### Roteamento multi-agente

Use `bindings` para rotear DMs ou grupos do Feishu para diferentes agentes.

```json5
{
  agents: {
    list: [
      { id: "main" },
      {
        id: "clawd-fan",
        workspace: "/home/user/clawd-fan",
        agentDir: "/home/user/.opencraft/agents/clawd-fan/agent",
      },
      {
        id: "clawd-xi",
        workspace: "/home/user/clawd-xi",
        agentDir: "/home/user/.opencraft/agents/clawd-xi/agent",
      },
    ],
  },
  bindings: [
    {
      agentId: "main",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "clawd-fan",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_yyy" },
      },
    },
    {
      agentId: "clawd-xi",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Campos de roteamento:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` ou `"group"`
- `match.peer.id`: Open ID do usuario (`ou_xxx`) ou ID do grupo (`oc_xxx`)

Veja [Obter IDs de grupo/usuario](#obter-ids-de-grupousuario) para dicas de busca.

---

## Referencia de configuracao

Configuracao completa: [Configuracao do Gateway](/gateway/configuration)

Opcoes principais:

| Configuracao                                      | Descricao                                      | Padrao           |
| ------------------------------------------------- | ---------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Habilitar/desabilitar canal                    | `true`           |
| `channels.feishu.domain`                          | Dominio da API (`feishu` ou `lark`)            | `feishu`         |
| `channels.feishu.connectionMode`                  | Modo de transporte de eventos                  | `websocket`      |
| `channels.feishu.defaultAccount`                  | ID de conta padrao para roteamento de saida    | `default`        |
| `channels.feishu.verificationToken`               | Necessario para modo Webhook                   | -                |
| `channels.feishu.encryptKey`                      | Necessario para modo Webhook                   | -                |
| `channels.feishu.webhookPath`                     | Caminho da rota do Webhook                     | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host de bind do Webhook                        | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Porta de bind do Webhook                       | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                         | -                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                     | -                |
| `channels.feishu.accounts.<id>.domain`            | Substituicao de dominio API por conta          | `feishu`         |
| `channels.feishu.dmPolicy`                        | Politica de DM                                 | `pairing`        |
| `channels.feishu.allowFrom`                       | Lista de permitidos para DM (lista de open_id) | -                |
| `channels.feishu.groupPolicy`                     | Politica de grupo                              | `open`           |
| `channels.feishu.groupAllowFrom`                  | Lista de permitidos de grupo                   | -                |
| `channels.feishu.groups.<chat_id>.requireMention` | Requer @mencao                                 | `true`           |
| `channels.feishu.groups.<chat_id>.enabled`        | Habilitar grupo                                | `true`           |
| `channels.feishu.textChunkLimit`                  | Tamanho do bloco de mensagem                   | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limite de tamanho de midia                     | `30`             |
| `channels.feishu.streaming`                       | Habilitar saida de card em streaming           | `true`           |
| `channels.feishu.blockStreaming`                  | Habilitar streaming em blocos                  | `true`           |

---

## Referencia de dmPolicy

| Valor         | Comportamento                                                                         |
| ------------- | ------------------------------------------------------------------------------------- |
| `"pairing"`   | **Padrao.** Usuarios desconhecidos recebem um codigo de pareamento; deve ser aprovado |
| `"allowlist"` | Apenas usuarios em `allowFrom` podem conversar                                        |
| `"open"`      | Permitir todos os usuarios (requer `"*"` em allowFrom)                                |
| `"disabled"`  | Desabilitar DMs                                                                       |

---

## Tipos de mensagem suportados

### Recebimento

- Texto
- Rich text (post)
- Imagens
- Arquivos
- Audio
- Video/midia
- Stickers

### Envio

- Texto
- Imagens
- Arquivos
- Audio
- Video/midia
- Cards interativos
- Rich text (formatacao e cards estilo post, nao recursos arbitrarios de autoria do Feishu)

### Threads e respostas

- Respostas inline
- Respostas em thread de topico onde o Feishu expoe `reply_in_thread`
- Respostas de midia permanecem conscientes da thread ao responder a uma mensagem de thread/topico

## Superficie de acoes em runtime

Feishu atualmente expoe estas acoes em runtime:

- `send`
- `read`
- `edit`
- `thread-reply`
- `pin`
- `list-pins`
- `unpin`
- `member-info`
- `channel-info`
- `channel-list`
- `react` e `reactions` quando reacoes estao habilitadas na configuracao
