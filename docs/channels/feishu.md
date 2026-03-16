---
summary: "Visão geral do bot Feishu, recursos e configuração"
read_when:
  - Você quer conectar um bot Feishu/Lark
  - Você está configurando o canal Feishu
title: Feishu
---

# Bot Feishu

Feishu (Lark) é uma plataforma de chat para equipes usada por empresas para mensagens e colaboração. Este plugin conecta o OpenCraft a um bot Feishu/Lark usando a assinatura de eventos WebSocket da plataforma para que as mensagens possam ser recebidas sem expor uma URL de webhook pública.

---

## Plugin integrado

O Feishu vem integrado nas versões atuais do OpenCraft, portanto não é necessária uma instalação separada de plugin.

Se você estiver usando uma build antiga ou uma instalação personalizada que não inclui o Feishu integrado, instale manualmente:

```bash
opencraft plugins install @openclaw/feishu
```

---

## Início rápido

Há duas formas de adicionar o canal Feishu:

### Método 1: assistente de onboarding (recomendado)

Se você acabou de instalar o OpenCraft, execute o assistente:

```bash
opencraft onboard
```

O assistente orienta você em:

1. Criação de um app Feishu e coleta de credenciais
2. Configuração das credenciais do app no OpenCraft
3. Inicialização do gateway

✅ **Após a configuração**, verifique o status do gateway:

- `opencraft gateway status`
- `opencraft logs --follow`

### Método 2: configuração via CLI

Se você já completou a instalação inicial, adicione o canal via CLI:

```bash
opencraft channels add
```

Escolha **Feishu**, depois insira o App ID e o App Secret.

✅ **Após a configuração**, gerencie o gateway:

- `opencraft gateway status`
- `opencraft gateway restart`
- `opencraft logs --follow`

---

## Passo 1: Criar um app Feishu

### 1. Abra a Plataforma Aberta do Feishu

Acesse a [Plataforma Aberta do Feishu](https://open.feishu.cn/app) e faça login.

Tenants Lark (global) devem usar [https://open.larksuite.com/app](https://open.larksuite.com/app) e definir `domain: "lark"` na config do Feishu.

### 2. Crie um app

1. Clique em **Criar app empresarial**
2. Preencha o nome + descrição do app
3. Escolha um ícone para o app

![Criar app empresarial](../images/feishu-step2-create-app.png)

### 3. Copie as credenciais

Em **Credenciais e Informações Básicas**, copie:

- **App ID** (formato: `cli_xxx`)
- **App Secret**

❗ **Importante:** mantenha o App Secret em segredo.

![Obter credenciais](../images/feishu-step3-credentials.png)

### 4. Configure as permissões

Em **Permissões**, clique em **Importar em lote** e cole:

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

![Configurar permissões](../images/feishu-step4-permissions.png)

### 5. Habilite a capacidade de bot

Em **Capacidade do App** > **Bot**:

1. Habilite a capacidade de bot
2. Defina o nome do bot

![Habilitar capacidade de bot](../images/feishu-step5-bot-capability.png)

### 6. Configure a assinatura de eventos

⚠️ **Importante:** antes de configurar a assinatura de eventos, certifique-se de que:

1. Você já executou `opencraft channels add` para o Feishu
2. O gateway está em execução (`opencraft gateway status`)

Em **Assinatura de Eventos**:

1. Escolha **Usar conexão longa para receber eventos** (WebSocket)
2. Adicione o evento: `im.message.receive_v1`

⚠️ Se o gateway não estiver em execução, a configuração de conexão longa pode falhar ao salvar.

![Configurar assinatura de eventos](../images/feishu-step6-event-subscription.png)

### 7. Publique o app

1. Crie uma versão em **Gerenciamento e Lançamento de Versão**
2. Envie para revisão e publique
3. Aguarde a aprovação do administrador (apps empresariais geralmente aprovam automaticamente)

---

## Passo 2: Configurar o OpenCraft

### Configurar com o assistente (recomendado)

```bash
opencraft channels add
```

Escolha **Feishu** e cole seu App ID + App Secret.

### Configurar via arquivo de config

Edite `~/.opencraft/opencraft.json`:

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
          botName: "Meu assistente de IA",
        },
      },
    },
  },
}
```

Se você usar `connectionMode: "webhook"`, defina tanto `verificationToken` quanto `encryptKey`. O servidor webhook do Feishu faz bind em `127.0.0.1` por padrão; defina `webhookHost` apenas se precisar intencionalmente de um endereço de bind diferente.

#### Token de Verificação e Chave de Criptografia (modo webhook)

Ao usar o modo webhook, defina `channels.feishu.verificationToken` e `channels.feishu.encryptKey` na sua config. Para obter os valores:

1. Na Plataforma Aberta do Feishu, abra seu app
2. Vá em **Desenvolvimento** → **Eventos e Callbacks** (开发配置 → 事件与回调)
3. Abra a aba **Criptografia** (加密策略)
4. Copie o **Token de Verificação** e a **Chave de Criptografia**

A imagem abaixo mostra onde encontrar o **Token de Verificação**. A **Chave de Criptografia** está listada na mesma seção de **Criptografia**.

![Localização do Token de Verificação](../images/feishu-verification-token.png)

### Configurar via variáveis de ambiente

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Domínio Lark (global)

Se o seu tenant é no Lark (internacional), defina o domínio como `lark` (ou uma string de domínio completa). Você pode definir em `channels.feishu.domain` ou por conta (`channels.feishu.accounts.<id>.domain`).

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

### Flags de otimização de cota

Você pode reduzir o uso da API do Feishu com duas flags opcionais:

- `typingIndicator` (padrão `true`): quando `false`, pula chamadas de reação de digitação.
- `resolveSenderNames` (padrão `true`): quando `false`, pula chamadas de consulta de perfil do remetente.

Defina no nível superior ou por conta:

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

### 1. Inicie o gateway

```bash
opencraft gateway
```

### 2. Envie uma mensagem de teste

No Feishu, encontre seu bot e envie uma mensagem.

### 3. Aprove o pareamento

Por padrão, o bot responde com um código de pareamento. Aprove-o:

```bash
opencraft pairing approve feishu <CÓDIGO>
```

Após a aprovação, você pode conversar normalmente.

---

## Visão geral

- **Canal bot Feishu**: bot Feishu gerenciado pelo gateway
- **Roteamento determinístico**: respostas sempre voltam para o Feishu
- **Isolamento de sessão**: DMs compartilham uma sessão principal; grupos são isolados
- **Conexão WebSocket**: conexão longa via SDK do Feishu, sem URL pública necessária

---

## Controle de acesso

### Mensagens diretas

- **Padrão**: `dmPolicy: "pairing"` (usuários desconhecidos recebem um código de pareamento)
- **Aprovar pareamento**:

  ```bash
  opencraft pairing list feishu
  opencraft pairing approve feishu <CÓDIGO>
  ```

- **Modo allowlist**: defina `channels.feishu.allowFrom` com Open IDs permitidos

### Chats em grupo

**1. Política de grupo** (`channels.feishu.groupPolicy`):

- `"open"` = permite todos nos grupos (padrão)
- `"allowlist"` = permite apenas `groupAllowFrom`
- `"disabled"` = desabilita mensagens de grupo

**2. Requisito de menção** (`channels.feishu.groups.<chat_id>.requireMention`):

- `true` = requer @menção (padrão)
- `false` = responde sem menções

---

## Exemplos de configuração de grupo

### Permitir todos os grupos, exigir @menção (padrão)

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      // requireMention padrão: true
    },
  },
}
```

### Permitir todos os grupos, sem @menção necessária

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

### Permitir apenas grupos específicos

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // IDs de grupo do Feishu (chat_id) parecem com: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Restringir quais remetentes podem enviar mensagens em um grupo (allowlist de remetente)

Além de permitir o próprio grupo, **todas as mensagens** naquele grupo são controladas pelo open_id do remetente: apenas usuários listados em `groups.<chat_id>.allowFrom` têm suas mensagens processadas; mensagens de outros membros são ignoradas (este é controle completo no nível do remetente, não apenas para comandos de controle como /reset ou /new).

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // IDs de usuário do Feishu (open_id) parecem com: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

## Obter IDs de grupo/usuário

### IDs de grupo (chat_id)

IDs de grupo parecem com `oc_xxx`.

**Método 1 (recomendado)**

1. Inicie o gateway e @mencione o bot no grupo
2. Execute `opencraft logs --follow` e procure `chat_id`

**Método 2**

Use o debugger de API do Feishu para listar chats de grupo.

### IDs de usuário (open_id)

IDs de usuário parecem com `ou_xxx`.

**Método 1 (recomendado)**

1. Inicie o gateway e envie um DM ao bot
2. Execute `opencraft logs --follow` e procure `open_id`

**Método 2**

Verifique as solicitações de pareamento para Open IDs de usuário:

```bash
opencraft pairing list feishu
```

---

## Comandos comuns

| Comando   | Descrição              |
| --------- | ---------------------- |
| `/status` | Mostrar status do bot  |
| `/reset`  | Resetar a sessão       |
| `/model`  | Mostrar/trocar modelo  |

> Nota: o Feishu ainda não suporta menus de comando nativos, então os comandos devem ser enviados como texto.

## Comandos de gerenciamento do gateway

| Comando                       | Descrição                        |
| ----------------------------- | -------------------------------- |
| `opencraft gateway status`    | Mostrar status do gateway        |
| `opencraft gateway install`   | Instalar/iniciar serviço gateway |
| `opencraft gateway stop`      | Parar serviço gateway            |
| `opencraft gateway restart`   | Reiniciar serviço gateway        |
| `opencraft logs --follow`     | Acompanhar logs do gateway       |

---

## Solução de problemas

### Bot não responde em chats em grupo

1. Certifique-se de que o bot foi adicionado ao grupo
2. Certifique-se de @mencionar o bot (comportamento padrão)
3. Verifique se `groupPolicy` não está definido como `"disabled"`
4. Verifique os logs: `opencraft logs --follow`

### Bot não recebe mensagens

1. Certifique-se de que o app está publicado e aprovado
2. Certifique-se de que a assinatura de eventos inclui `im.message.receive_v1`
3. Certifique-se de que **conexão longa** está habilitada
4. Certifique-se de que as permissões do app estão completas
5. Certifique-se de que o gateway está em execução: `opencraft gateway status`
6. Verifique os logs: `opencraft logs --follow`

### Vazamento do App Secret

1. Redefina o App Secret na Plataforma Aberta do Feishu
2. Atualize o App Secret na sua config
3. Reinicie o gateway

### Falhas no envio de mensagens

1. Certifique-se de que o app tem permissão `im:message:send_as_bot`
2. Certifique-se de que o app está publicado
3. Verifique os logs para erros detalhados

---

## Configuração avançada

### Múltiplas contas

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

`defaultAccount` controla qual conta Feishu é usada quando as APIs de saída não especificam um `accountId` explicitamente.

### Limites de mensagem

- `textChunkLimit`: tamanho do bloco de texto de saída (padrão: 2000 caracteres)
- `mediaMaxMb`: limite de upload/download de mídia (padrão: 30MB)

### Streaming

O Feishu suporta respostas em streaming via cards interativos. Quando habilitado, o bot atualiza um card conforme gera texto.

```json5
{
  channels: {
    feishu: {
      streaming: true, // habilitar saída de card em streaming (padrão true)
      blockStreaming: true, // habilitar streaming em blocos (padrão true)
    },
  },
}
```

Defina `streaming: false` para aguardar a resposta completa antes de enviar.

### Sessões ACP

O Feishu suporta ACP para:

- DMs
- conversas de tópico em grupo

O ACP do Feishu é baseado em comandos de texto. Não há menus de slash-command nativos, então use mensagens `/acp ...` diretamente na conversa.

#### Bindings ACP persistentes

Use bindings ACP tipados no nível superior para fixar um DM ou conversa de tópico do Feishu a uma sessão ACP persistente.

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

#### Spawn ACP vinculado a thread a partir do chat

Em um DM ou conversa de tópico do Feishu, você pode gerar e vincular uma sessão ACP no local:

```text
/acp spawn codex --thread here
```

Notas:

- `--thread here` funciona para DMs e tópicos do Feishu.
- Mensagens de acompanhamento no DM/tópico vinculado são roteadas diretamente para aquela sessão ACP.
- v1 não tem como alvo chats de grupo genéricos sem tópico.

### Roteamento multi-agente

Use `bindings` para rotear DMs ou grupos do Feishu para agentes diferentes.

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
- `match.peer.id`: Open ID do usuário (`ou_xxx`) ou ID do grupo (`oc_xxx`)

Veja [Obter IDs de grupo/usuário](#obter-ids-de-grupousuário) para dicas de consulta.

---

## Referência de configuração

Configuração completa: [Configuração do gateway](/gateway/configuration)

Opções principais:

| Configuração                                      | Descrição                                    | Padrão           |
| ------------------------------------------------- | -------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Habilitar/desabilitar canal                  | `true`           |
| `channels.feishu.domain`                          | Domínio da API (`feishu` ou `lark`)          | `feishu`         |
| `channels.feishu.connectionMode`                  | Modo de transporte de eventos                | `websocket`      |
| `channels.feishu.defaultAccount`                  | ID de conta padrão para roteamento de saída  | `default`        |
| `channels.feishu.verificationToken`               | Obrigatório para modo webhook                | -                |
| `channels.feishu.encryptKey`                      | Obrigatório para modo webhook                | -                |
| `channels.feishu.webhookPath`                     | Caminho da rota de webhook                   | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host de bind do webhook                      | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Porta de bind do webhook                     | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                       | -                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                   | -                |
| `channels.feishu.accounts.<id>.domain`            | Substituição de domínio da API por conta     | `feishu`         |
| `channels.feishu.dmPolicy`                        | Política de DM                               | `pairing`        |
| `channels.feishu.allowFrom`                       | Lista de permissão de DM (lista de open_id)  | -                |
| `channels.feishu.groupPolicy`                     | Política de grupo                            | `open`           |
| `channels.feishu.groupAllowFrom`                  | Lista de permissão de grupo                  | -                |
| `channels.feishu.groups.<chat_id>.requireMention` | Exigir @menção                               | `true`           |
| `channels.feishu.groups.<chat_id>.enabled`        | Habilitar grupo                              | `true`           |
| `channels.feishu.textChunkLimit`                  | Tamanho do bloco de mensagem                 | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limite de tamanho de mídia                   | `30`             |
| `channels.feishu.streaming`                       | Habilitar saída de card em streaming         | `true`           |
| `channels.feishu.blockStreaming`                  | Habilitar streaming em blocos                | `true`           |

---

## Referência de dmPolicy

| Valor         | Comportamento                                                           |
| ------------- | ----------------------------------------------------------------------- |
| `"pairing"`   | **Padrão.** Usuários desconhecidos recebem um código de pareamento      |
| `"allowlist"` | Apenas usuários em `allowFrom` podem conversar                          |
| `"open"`      | Permite todos os usuários (requer `"*"` em allowFrom)                   |
| `"disabled"`  | Desabilitar DMs                                                         |

---

## Tipos de mensagem suportados

### Receber

- ✅ Texto
- ✅ Rich text (post)
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio
- ✅ Vídeo
- ✅ Stickers

### Enviar

- ✅ Texto
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio
- ⚠️ Rich text (suporte parcial)
