---
summary: "Status de suporte, capacidades e configuração do Bot Microsoft Teams"
read_when:
  - Trabalhando em funcionalidades do canal MS Teams
title: "Microsoft Teams"
---

# Microsoft Teams (plugin)

> "Abandon all hope, ye who enter here."

Atualizado: 2026-01-21

Status: texto + anexos de DM são suportados; envio de arquivos em canais/grupos requer `sharePointSiteId` + permissões Graph (veja [Enviando arquivos em chats de grupo](#enviando-arquivos-em-chats-de-grupo)). Enquetes são enviadas via Adaptive Cards.

## Plugin necessário

O Microsoft Teams é distribuído como Plugin e não está incluído na instalação principal.

**Alteração importante (2026.1.15):** O MS Teams saiu do core. Se você o usa, deve instalar o Plugin.

Explicação: mantém instalações do core mais leves e permite que as dependências do MS Teams sejam atualizadas independentemente.

Instalar via CLI (registro npm):

```bash
opencraft plugins install @opencraft/msteams
```

Checkout local (ao executar a partir de um repositório git):

```bash
opencraft plugins install ./extensions/msteams
```

Se você escolher Teams durante a configuração e um checkout git for detectado,
o OpenCraft oferecerá o caminho de instalação local automaticamente.

Detalhes: [Plugins](/tools/plugin)

## Configuração rápida (iniciante)

1. Instale o Plugin Microsoft Teams.
2. Crie um **Azure Bot** (App ID + client secret + tenant ID).
3. Configure o OpenCraft com essas credenciais.
4. Exponha `/api/messages` (porta 3978 por padrão) via URL pública ou túnel.
5. Instale o pacote do app Teams e inicie o Gateway.

Configuração mínima:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Nota: chats de grupo são bloqueados por padrão (`channels.msteams.groupPolicy: "allowlist"`). Para permitir respostas em grupo, defina `channels.msteams.groupAllowFrom` (ou use `groupPolicy: "open"` para permitir qualquer membro, com exigência de menção).

## Objetivos

- Conversar com o OpenCraft via DMs, chats de grupo ou canais do Teams.
- Manter o roteamento determinístico: respostas sempre voltam para o canal de onde vieram.
- Padrão para comportamento seguro de canal (menções necessárias a menos que configurado de outra forma).

## Gravações de configuração

Por padrão, o Microsoft Teams pode gravar atualizações de configuração acionadas por `/config set|unset` (requer `commands.config: true`).

Desabilitar com:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Controle de acesso (DMs + grupos)

**Acesso a DMs**

- Padrão: `channels.msteams.dmPolicy = "pairing"`. Remetentes desconhecidos são ignorados até serem aprovados.
- `channels.msteams.allowFrom` deve usar IDs de objeto AAD estáveis.
- UPNs/nomes de exibição são mutáveis; correspondência direta é desabilitada por padrão e só é habilitada com `channels.msteams.dangerouslyAllowNameMatching: true`.
- O assistente pode resolver nomes para IDs via Microsoft Graph quando as credenciais permitem.

**Acesso a grupos**

- Padrão: `channels.msteams.groupPolicy = "allowlist"` (bloqueado a menos que você adicione `groupAllowFrom`). Use `channels.defaults.groupPolicy` para sobrescrever o padrão quando não definido.
- `channels.msteams.groupAllowFrom` controla quais remetentes podem acionar em chats de grupo/canais (retorna para `channels.msteams.allowFrom`).
- Defina `groupPolicy: "open"` para permitir qualquer membro (ainda com exigência de menção por padrão).
- Para não permitir **nenhum canal**, defina `channels.msteams.groupPolicy: "disabled"`.

Exemplo:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Allowlist de equipes + canais**

- Delimite respostas de grupo/canal listando equipes e canais em `channels.msteams.teams`.
- As chaves devem usar IDs de equipe estáveis e IDs de conversa de canal.
- Quando `groupPolicy="allowlist"` e uma allowlist de equipes está presente, apenas equipes/canais listados são aceitos (com exigência de menção).
- O assistente de configuração aceita entradas `Team/Channel` e as armazena para você.
- Na inicialização, o OpenCraft resolve nomes de equipe/canal e allowlist de usuários para IDs (quando permissões Graph permitem)
  e registra o mapeamento; nomes de equipe/canal não resolvidos são mantidos como digitados, mas ignorados para roteamento por padrão, a menos que `channels.msteams.dangerouslyAllowNameMatching: true` esteja habilitado.

Exemplo:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## Como funciona

1. Instale o Plugin Microsoft Teams.
2. Crie um **Azure Bot** (App ID + secret + tenant ID).
3. Construa um **pacote de app Teams** que referencia o Bot e inclui as permissões RSC abaixo.
4. Faça upload/instale o app Teams em uma equipe (ou escopo pessoal para DMs).
5. Configure `msteams` em `~/.editzffaleta/OpenCraft.json` (ou variáveis de ambiente) e inicie o Gateway.
6. O Gateway escuta tráfego Webhook do Bot Framework em `/api/messages` por padrão.

## Configuração do Azure Bot (Pré-requisitos)

Antes de configurar o OpenCraft, você precisa criar um recurso Azure Bot.

### Passo 1: Criar Azure Bot

1. Vá para [Criar Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Preencha a aba **Basics**:

   | Campo              | Valor                                                      |
   | ------------------ | ---------------------------------------------------------- |
   | **Bot handle**     | Nome do seu Bot, ex.: `opencraft-msteams` (deve ser único) |
   | **Subscription**   | Selecione sua assinatura Azure                             |
   | **Resource group** | Crie novo ou use existente                                 |
   | **Pricing tier**   | **Free** para dev/testes                                   |
   | **Type of App**    | **Single Tenant** (recomendado - veja nota abaixo)         |
   | **Creation type**  | **Create new Microsoft App ID**                            |

> **Aviso de descontinuação:** A criação de novos bots multi-tenant foi descontinuada após 2025-07-31. Use **Single Tenant** para novos bots.

3. Clique em **Review + create** e depois **Create** (aguarde ~1-2 minutos)

### Passo 2: Obter Credenciais

1. Vá para o recurso Azure Bot e depois **Configuration**
2. Copie **Microsoft App ID** -- este é o seu `appId`
3. Clique em **Manage Password** e vá para App Registration
4. Em **Certificates & secrets** e depois **New client secret** e copie o **Value** -- este é o seu `appPassword`
5. Vá para **Overview** e copie **Directory (tenant) ID** -- este é o seu `tenantId`

### Passo 3: Configurar Messaging Endpoint

1. No Azure Bot e depois **Configuration**
2. Defina **Messaging endpoint** para a URL do seu Webhook:
   - Produção: `https://your-domain.com/api/messages`
   - Dev local: Use um túnel (veja [Desenvolvimento Local](#desenvolvimento-local-tunelamento) abaixo)

### Passo 4: Habilitar Canal Teams

1. No Azure Bot e depois **Channels**
2. Clique em **Microsoft Teams** e depois Configure e depois Save
3. Aceite os Termos de Serviço

## Desenvolvimento Local (Tunelamento)

O Teams não consegue alcançar `localhost`. Use um túnel para desenvolvimento local:

**Opção A: ngrok**

```bash
ngrok http 3978
# Copie a URL https, ex.: https://abc123.ngrok.io
# Defina messaging endpoint para: https://abc123.ngrok.io/api/messages
```

**Opção B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Use a URL do Tailscale funnel como messaging endpoint
```

## Teams Developer Portal (Alternativa)

Em vez de criar manualmente um ZIP de manifesto, você pode usar o [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Clique em **+ New app**
2. Preencha informações básicas (nome, descrição, informações do desenvolvedor)
3. Vá para **App features** e depois **Bot**
4. Selecione **Enter a bot ID manually** e cole o App ID do seu Azure Bot
5. Marque escopos: **Personal**, **Team**, **Group Chat**
6. Clique em **Distribute** e depois **Download app package**
7. No Teams: **Apps** e depois **Manage your apps** e depois **Upload a custom app** e selecione o ZIP

Isso geralmente é mais fácil do que editar manifestos JSON manualmente.

## Testando o Bot

**Opção A: Azure Web Chat (verificar Webhook primeiro)**

1. No Portal Azure e depois recurso Azure Bot e depois **Test in Web Chat**
2. Envie uma mensagem - você deve ver uma resposta
3. Isso confirma que o endpoint do Webhook funciona antes da configuração do Teams

**Opção B: Teams (após instalação do app)**

1. Instale o app Teams (sideload ou catálogo da organização)
2. Encontre o Bot no Teams e envie uma DM
3. Verifique os logs do Gateway para atividade de entrada

## Configuração (mínima, apenas texto)

1. **Instale o Plugin Microsoft Teams**
   - Do npm: `opencraft plugins install @opencraft/msteams`
   - De um checkout local: `opencraft plugins install ./extensions/msteams`

2. **Registro do Bot**
   - Crie um Azure Bot (veja acima) e anote:
     - App ID
     - Client secret (senha do app)
     - Tenant ID (single-tenant)

3. **Manifesto do app Teams**
   - Inclua uma entrada `bot` com `botId = <App ID>`.
   - Escopos: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (necessário para tratamento de arquivos no escopo pessoal).
   - Adicione permissões RSC (abaixo).
   - Crie ícones: `outline.png` (32x32) e `color.png` (192x192).
   - Compacte os três arquivos juntos: `manifest.json`, `outline.png`, `color.png`.

4. **Configure o OpenCraft**

   ```json
   {
     "msteams": {
       "enabled": true,
       "appId": "<APP_ID>",
       "appPassword": "<APP_PASSWORD>",
       "tenantId": "<TENANT_ID>",
       "webhook": { "port": 3978, "path": "/api/messages" }
     }
   }
   ```

   Você também pode usar variáveis de ambiente em vez de chaves de configuração:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **Endpoint do Bot**
   - Defina o Messaging Endpoint do Azure Bot para:
     - `https://<host>:3978/api/messages` (ou o caminho/porta escolhido).

6. **Execute o Gateway**
   - O canal Teams inicia automaticamente quando o Plugin está instalado e a configuração `msteams` existe com credenciais.

## Contexto de histórico

- `channels.msteams.historyLimit` controla quantas mensagens recentes de canal/grupo são incluídas no prompt.
- Retorna para `messages.groupChat.historyLimit`. Defina `0` para desabilitar (padrão 50).
- O histórico de DM pode ser limitado com `channels.msteams.dmHistoryLimit` (turnos do usuário). Sobrescritas por usuário: `channels.msteams.dms["<user_id>"].historyLimit`.

## Permissões RSC Atuais do Teams (Manifesto)

Estas são as **permissões resourceSpecific existentes** no manifesto do app Teams. Elas se aplicam apenas dentro da equipe/chat onde o app está instalado.

**Para canais (escopo de equipe):**

- `ChannelMessage.Read.Group` (Application) - receber todas as mensagens do canal sem @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Para chats de grupo:**

- `ChatMessage.Read.Chat` (Application) - receber todas as mensagens do chat de grupo sem @mention

## Exemplo de Manifesto Teams (editado)

Exemplo mínimo e válido com os campos obrigatórios. Substitua IDs e URLs.

```json
{
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  "manifestVersion": "1.23",
  "version": "1.0.0",
  "id": "00000000-0000-0000-0000-000000000000",
  "name": { "short": "OpenCraft" },
  "developer": {
    "name": "Your Org",
    "websiteUrl": "https://example.com",
    "privacyUrl": "https://example.com/privacy",
    "termsOfUseUrl": "https://example.com/terms"
  },
  "description": { "short": "OpenCraft in Teams", "full": "OpenCraft in Teams" },
  "icons": { "outline": "outline.png", "color": "color.png" },
  "accentColor": "#5B6DEF",
  "bots": [
    {
      "botId": "11111111-1111-1111-1111-111111111111",
      "scopes": ["personal", "team", "groupChat"],
      "isNotificationOnly": false,
      "supportsCalling": false,
      "supportsVideo": false,
      "supportsFiles": true
    }
  ],
  "webApplicationInfo": {
    "id": "11111111-1111-1111-1111-111111111111"
  },
  "authorization": {
    "permissions": {
      "resourceSpecific": [
        { "name": "ChannelMessage.Read.Group", "type": "Application" },
        { "name": "ChannelMessage.Send.Group", "type": "Application" },
        { "name": "Member.Read.Group", "type": "Application" },
        { "name": "Owner.Read.Group", "type": "Application" },
        { "name": "ChannelSettings.Read.Group", "type": "Application" },
        { "name": "TeamMember.Read.Group", "type": "Application" },
        { "name": "TeamSettings.Read.Group", "type": "Application" },
        { "name": "ChatMessage.Read.Chat", "type": "Application" }
      ]
    }
  }
}
```

### Ressalvas do manifesto (campos obrigatórios)

- `bots[].botId` **deve** corresponder ao App ID do Azure Bot.
- `webApplicationInfo.id` **deve** corresponder ao App ID do Azure Bot.
- `bots[].scopes` deve incluir as superfícies que você planeja usar (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` é necessário para tratamento de arquivos no escopo pessoal.
- `authorization.permissions.resourceSpecific` deve incluir leitura/envio de canal se você quer tráfego de canal.

### Atualizando um app existente

Para atualizar um app Teams já instalado (ex.: para adicionar permissões RSC):

1. Atualize seu `manifest.json` com as novas configurações
2. **Incremente o campo `version`** (ex.: `1.0.0` para `1.1.0`)
3. **Re-compacte** o manifesto com ícones (`manifest.json`, `outline.png`, `color.png`)
4. Faça upload do novo zip:
   - **Opção A (Teams Admin Center):** Teams Admin Center e depois Teams apps e depois Manage apps e depois encontre seu app e depois Upload new version
   - **Opção B (Sideload):** No Teams e depois Apps e depois Manage your apps e depois Upload a custom app
5. **Para canais de equipe:** Reinstale o app em cada equipe para que as novas permissões entrem em vigor
6. **Feche completamente e reinicie o Teams** (não apenas feche a janela) para limpar metadados do app em cache

## Capacidades: apenas RSC vs Graph

### Com **apenas RSC do Teams** (app instalado, sem permissões Graph API)

Funciona:

- Ler conteúdo de **texto** de mensagens de canal.
- Enviar conteúdo de **texto** de mensagens de canal.
- Receber anexos de **arquivos pessoais (DM)**.

Não funciona:

- Conteúdo de **imagens ou arquivos** de canal/grupo (payload inclui apenas stub HTML).
- Download de anexos armazenados no SharePoint/OneDrive.
- Leitura de histórico de mensagens (além do evento Webhook ao vivo).

### Com **RSC do Teams + permissões de Application do Microsoft Graph**

Adiciona:

- Download de conteúdos hospedados (imagens coladas em mensagens).
- Download de anexos de arquivo armazenados no SharePoint/OneDrive.
- Leitura de histórico de mensagens de canal/chat via Graph.

### RSC vs Graph API

| Capacidade                  | Permissões RSC           | Graph API                                      |
| --------------------------- | ------------------------ | ---------------------------------------------- |
| **Mensagens em tempo real** | Sim (via Webhook)        | Não (apenas polling)                           |
| **Histórico de mensagens**  | Não                      | Sim (pode consultar histórico)                 |
| **Complexidade de setup**   | Apenas manifesto         | Requer consentimento do admin + fluxo de Token |
| **Funciona offline**        | Não (deve estar rodando) | Sim (consulta a qualquer momento)              |

**Resumo:** RSC é para escuta em tempo real; Graph API é para acesso histórico. Para recuperar mensagens perdidas enquanto offline, você precisa da Graph API com `ChannelMessage.Read.All` (requer consentimento do admin).

## Mídia + histórico habilitados via Graph (necessário para canais)

Se você precisa de imagens/arquivos em **canais** ou quer buscar **histórico de mensagens**, deve habilitar permissões do Microsoft Graph e conceder consentimento do admin.

1. No Entra ID (Azure AD) e depois **App Registration**, adicione permissões de **Application** do Microsoft Graph:
   - `ChannelMessage.Read.All` (anexos de canal + histórico)
   - `Chat.Read.All` ou `ChatMessage.Read.All` (chats de grupo)
2. **Conceda consentimento do admin** para o tenant.
3. Incremente a **versão do manifesto** do app Teams, re-faça upload e **reinstale o app no Teams**.
4. **Feche completamente e reinicie o Teams** para limpar metadados do app em cache.

**Permissão adicional para menções de usuário:** Menções de usuário com @ funcionam por padrão para usuários na conversa. No entanto, se você quer buscar dinamicamente e mencionar usuários que **não estão na conversa atual**, adicione a permissão `User.Read.All` (Application) e conceda consentimento do admin.

## Limitações Conhecidas

### Timeouts de Webhook

O Teams entrega mensagens via Webhook HTTP. Se o processamento demorar muito (ex.: respostas lentas de LLM), você pode ver:

- Timeouts do Gateway
- Teams reenviando a mensagem (causando duplicatas)
- Respostas perdidas

O OpenCraft lida com isso retornando rapidamente e enviando respostas proativamente, mas respostas muito lentas ainda podem causar problemas.

### Formatação

O markdown do Teams é mais limitado que o do Slack ou Discord:

- Formatação básica funciona: **negrito**, _itálico_, `código`, links
- Markdown complexo (tabelas, listas aninhadas) pode não renderizar corretamente
- Adaptive Cards são suportados para enquetes e envios de cards arbitrários (veja abaixo)

## Configuração

Configurações principais (veja `/gateway/configuration` para padrões compartilhados de canal):

- `channels.msteams.enabled`: habilitar/desabilitar o canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenciais do Bot.
- `channels.msteams.webhook.port` (padrão `3978`)
- `channels.msteams.webhook.path` (padrão `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing)
- `channels.msteams.allowFrom`: allowlist de DM (IDs de objeto AAD recomendados). O assistente resolve nomes para IDs durante a configuração quando o acesso Graph está disponível.
- `channels.msteams.dangerouslyAllowNameMatching`: toggle de emergência para reabilitar correspondência mutável de UPN/nome de exibição e roteamento direto de nomes de equipe/canal.
- `channels.msteams.textChunkLimit`: tamanho do bloco de texto de saída.
- `channels.msteams.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- `channels.msteams.mediaAllowHosts`: allowlist para hosts de anexos de entrada (padrão para domínios Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist para anexar cabeçalhos Authorization em tentativas de mídia (padrão para hosts Graph + Bot Framework).
- `channels.msteams.requireMention`: exigir @mention em canais/grupos (padrão true).
- `channels.msteams.replyStyle`: `thread | top-level` (veja [Estilo de Resposta](#estilo-de-resposta-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: sobrescrita por equipe.
- `channels.msteams.teams.<teamId>.requireMention`: sobrescrita por equipe.
- `channels.msteams.teams.<teamId>.tools`: sobrescritas padrão de política de ferramentas por equipe (`allow`/`deny`/`alsoAllow`) usadas quando uma sobrescrita de canal está ausente.
- `channels.msteams.teams.<teamId>.toolsBySender`: sobrescritas padrão de política de ferramentas por remetente por equipe (curinga `"*"` suportado).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: sobrescrita por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: sobrescrita por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: sobrescritas de política de ferramentas por canal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: sobrescritas de política de ferramentas por remetente por canal (curinga `"*"` suportado).
- Chaves `toolsBySender` devem usar prefixos explícitos:
  `id:`, `e164:`, `username:`, `name:` (chaves legadas sem prefixo ainda mapeiam apenas para `id:`).
- `channels.msteams.sharePointSiteId`: ID do site SharePoint para uploads de arquivos em chats de grupo/canais (veja [Enviando arquivos em chats de grupo](#enviando-arquivos-em-chats-de-grupo)).

## Roteamento e Sessões

- Chaves de sessão seguem o formato padrão do agente (veja [/concepts/session](/concepts/session)):
  - Mensagens diretas compartilham a sessão principal (`agent:<agentId>:<mainKey>`).
  - Mensagens de canal/grupo usam ID de conversa:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de Resposta: Threads vs Posts

O Teams introduziu recentemente dois estilos de UI de canal sobre o mesmo modelo de dados subjacente:

| Estilo                   | Descrição                                                       | `replyStyle` recomendado |
| ------------------------ | --------------------------------------------------------------- | ------------------------ |
| **Posts** (clássico)     | Mensagens aparecem como cards com respostas em thread por baixo | `thread` (padrão)        |
| **Threads** (tipo Slack) | Mensagens fluem linearmente, mais parecido com o Slack          | `top-level`              |

**O problema:** A API do Teams não expõe qual estilo de UI um canal usa. Se você usar o `replyStyle` errado:

- `thread` em um canal estilo Threads -- respostas aparecem aninhadas de forma estranha
- `top-level` em um canal estilo Posts -- respostas aparecem como posts separados de nível superior em vez de no thread

**Solução:** Configure `replyStyle` por canal baseado em como o canal está configurado:

```json
{
  "msteams": {
    "replyStyle": "thread",
    "teams": {
      "19:abc...@thread.tacv2": {
        "channels": {
          "19:xyz...@thread.tacv2": {
            "replyStyle": "top-level"
          }
        }
      }
    }
  }
}
```

## Anexos e Imagens

**Limitações atuais:**

- **DMs:** Imagens e anexos de arquivo funcionam via APIs de arquivo do Bot Teams.
- **Canais/grupos:** Anexos residem no armazenamento M365 (SharePoint/OneDrive). O payload do Webhook inclui apenas um stub HTML, não os bytes reais do arquivo. **Permissões Graph API são necessárias** para baixar anexos de canal.

Sem permissões Graph, mensagens de canal com imagens serão recebidas apenas como texto (o conteúdo da imagem não é acessível ao Bot).
Por padrão, o OpenCraft só baixa mídia de hostnames Microsoft/Teams. Sobrescreva com `channels.msteams.mediaAllowHosts` (use `["*"]` para permitir qualquer host).
Cabeçalhos Authorization são anexados apenas para hosts em `channels.msteams.mediaAuthAllowHosts` (padrão para hosts Graph + Bot Framework). Mantenha esta lista restrita (evite sufixos multi-tenant).

## Enviando arquivos em chats de grupo

Bots podem enviar arquivos em DMs usando o fluxo FileConsentCard (integrado). No entanto, **enviar arquivos em chats de grupo/canais** requer configuração adicional:

| Contexto                        | Como os arquivos são enviados                       | Configuração necessária                      |
| ------------------------------- | --------------------------------------------------- | -------------------------------------------- |
| **DMs**                         | FileConsentCard -- usuário aceita -- Bot faz upload | Funciona por padrão                          |
| **Chats de grupo/canais**       | Upload para SharePoint -- link de compartilhamento  | Requer `sharePointSiteId` + permissões Graph |
| **Imagens (qualquer contexto)** | Base64 inline                                       | Funciona por padrão                          |

### Por que chats de grupo precisam do SharePoint

Bots não têm um OneDrive pessoal (o endpoint Graph API `/me/drive` não funciona para identidades de aplicação). Para enviar arquivos em chats de grupo/canais, o Bot faz upload para um **site SharePoint** e cria um link de compartilhamento.

### Configuração

1. **Adicione permissões Graph API** no Entra ID (Azure AD) e depois App Registration:
   - `Sites.ReadWrite.All` (Application) - upload de arquivos para SharePoint
   - `Chat.Read.All` (Application) - opcional, habilita links de compartilhamento por usuário

2. **Conceda consentimento do admin** para o tenant.

3. **Obtenha o ID do site SharePoint:**

   ```bash
   # Via Graph Explorer ou curl com um Token válido:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Exemplo: para um site em "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Resposta inclui: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Configure o OpenCraft:**

   ```json5
   {
     channels: {
       msteams: {
         // ... outras configurações ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Comportamento de compartilhamento

| Permissão                               | Comportamento de compartilhamento                                             |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| Apenas `Sites.ReadWrite.All`            | Link de compartilhamento organizacional (qualquer pessoa na org pode acessar) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Link de compartilhamento por usuário (apenas membros do chat podem acessar)   |

O compartilhamento por usuário é mais seguro, pois apenas os participantes do chat podem acessar o arquivo. Se a permissão `Chat.Read.All` estiver ausente, o Bot retorna para compartilhamento organizacional.

### Comportamento de fallback

| Cenário                                                  | Resultado                                               |
| -------------------------------------------------------- | ------------------------------------------------------- |
| Chat de grupo + arquivo + `sharePointSiteId` configurado | Upload para SharePoint, enviar link de compartilhamento |
| Chat de grupo + arquivo + sem `sharePointSiteId`         | Tenta upload OneDrive (pode falhar), envia apenas texto |
| Chat pessoal + arquivo                                   | Fluxo FileConsentCard (funciona sem SharePoint)         |
| Qualquer contexto + imagem                               | Base64 inline (funciona sem SharePoint)                 |

### Local de armazenamento dos arquivos

Arquivos enviados são armazenados em uma pasta `/OpenCraftShared/` na biblioteca de documentos padrão do site SharePoint configurado.

## Enquetes (Adaptive Cards)

O OpenCraft envia enquetes do Teams como Adaptive Cards (não há API nativa de enquetes do Teams).

- CLI: `opencraft message poll --channel msteams --target conversation:<id> ...`
- Votos são registrados pelo Gateway em `~/.opencraft/msteams-polls.json`.
- O Gateway deve ficar online para registrar votos.
- Enquetes ainda não publicam resumos de resultados automaticamente (inspecione o arquivo de armazenamento se necessário).

## Adaptive Cards (arbitrários)

Envie qualquer JSON de Adaptive Card para usuários ou conversas do Teams usando a ferramenta `message` ou CLI.

O parâmetro `card` aceita um objeto JSON de Adaptive Card. Quando `card` é fornecido, o texto da mensagem é opcional.

**Ferramenta do agente:**

```json
{
  "action": "send",
  "channel": "msteams",
  "target": "user:<id>",
  "card": {
    "type": "AdaptiveCard",
    "version": "1.5",
    "body": [{ "type": "TextBlock", "text": "Hello!" }]
  }
}
```

**CLI:**

```bash
opencraft message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

Veja a [documentação de Adaptive Cards](https://adaptivecards.io/) para esquema e exemplos de cards. Para detalhes de formato de alvo, veja [Formatos de alvo](#formatos-de-alvo) abaixo.

## Formatos de alvo

Alvos do MSTeams usam prefixos para distinguir entre usuários e conversas:

| Tipo de alvo        | Formato                          | Exemplo                                           |
| ------------------- | -------------------------------- | ------------------------------------------------- |
| Usuário (por ID)    | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`       |
| Usuário (por nome)  | `user:<display-name>`            | `user:John Smith` (requer Graph API)              |
| Grupo/canal         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`          |
| Grupo/canal (bruto) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (se contém `@thread`) |

**Exemplos CLI:**

```bash
# Enviar para um usuário por ID
opencraft message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Enviar para um usuário por nome de exibição (aciona busca Graph API)
opencraft message send --channel msteams --target "user:John Smith" --message "Hello"

# Enviar para um chat de grupo ou canal
opencraft message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Enviar um Adaptive Card para uma conversa
opencraft message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
```

**Exemplos da ferramenta do agente:**

```json
{
  "action": "send",
  "channel": "msteams",
  "target": "user:John Smith",
  "message": "Hello!"
}
```

```json
{
  "action": "send",
  "channel": "msteams",
  "target": "conversation:19:abc...@thread.tacv2",
  "card": {
    "type": "AdaptiveCard",
    "version": "1.5",
    "body": [{ "type": "TextBlock", "text": "Hello" }]
  }
}
```

Nota: Sem o prefixo `user:`, nomes padrão para resolução de grupo/equipe. Sempre use `user:` ao direcionar pessoas por nome de exibição.

## Mensagens proativas

- Mensagens proativas só são possíveis **depois** que um usuário interagiu, porque armazenamos referências de conversa nesse momento.
- Veja `/gateway/configuration` para `dmPolicy` e controle de allowlist.

## IDs de Equipe e Canal (Armadilha Comum)

O parâmetro de consulta `groupId` nas URLs do Teams **NÃO** é o ID da equipe usado para configuração. Extraia os IDs do caminho da URL:

**URL da equipe:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID da Equipe (decodifique a URL)
```

**URL do canal:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID do Canal (decodifique a URL)
```

**Para configuração:**

- ID da Equipe = segmento do caminho após `/team/` (decodificado, ex.: `19:Bk4j...@thread.tacv2`)
- ID do Canal = segmento do caminho após `/channel/` (decodificado)
- **Ignore** o parâmetro de consulta `groupId`

## Canais Privados

Bots têm suporte limitado em canais privados:

| Funcionalidade                    | Canais Padrão | Canais Privados             |
| --------------------------------- | ------------- | --------------------------- |
| Instalação do Bot                 | Sim           | Limitado                    |
| Mensagens em tempo real (Webhook) | Sim           | Pode não funcionar          |
| Permissões RSC                    | Sim           | Pode se comportar diferente |
| @mentions                         | Sim           | Se o Bot estiver acessível  |
| Histórico Graph API               | Sim           | Sim (com permissões)        |

**Soluções alternativas se canais privados não funcionarem:**

1. Use canais padrão para interações com o Bot
2. Use DMs - usuários sempre podem enviar mensagem diretamente para o Bot
3. Use Graph API para acesso histórico (requer `ChannelMessage.Read.All`)

## Solução de problemas

### Problemas comuns

- **Imagens não aparecem em canais:** Permissões Graph ou consentimento do admin ausentes. Reinstale o app Teams e feche/reabra completamente o Teams.
- **Sem respostas no canal:** Menções são necessárias por padrão; defina `channels.msteams.requireMention=false` ou configure por equipe/canal.
- **Incompatibilidade de versão (Teams ainda mostra manifesto antigo):** Remova + re-adicione o app e feche completamente o Teams para atualizar.
- **401 Unauthorized do Webhook:** Esperado ao testar manualmente sem JWT Azure - significa que o endpoint é acessível mas a autenticação falhou. Use o Azure Web Chat para testar adequadamente.

### Erros de upload do manifesto

- **"Icon file cannot be empty":** O manifesto referencia arquivos de ícone que têm 0 bytes. Crie ícones PNG válidos (32x32 para `outline.png`, 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** O app ainda está instalado em outra equipe/chat. Encontre e desinstale primeiro, ou aguarde 5-10 minutos para propagação.
- **"Something went wrong" no upload:** Faça upload via [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), abra DevTools do navegador (F12) e depois aba Network, e verifique o corpo da resposta para o erro real.
- **Sideload falhando:** Tente "Upload an app to your org's app catalog" em vez de "Upload a custom app" - isso frequentemente contorna restrições de sideload.

### Permissões RSC não funcionando

1. Verifique se `webApplicationInfo.id` corresponde exatamente ao App ID do seu Bot
2. Re-faça upload do app e reinstale na equipe/chat
3. Verifique se o admin da organização bloqueou permissões RSC
4. Confirme que você está usando o escopo correto: `ChannelMessage.Read.Group` para equipes, `ChatMessage.Read.Chat` para chats de grupo

## Referências

- [Criar Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Guia de configuração do Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - criar/gerenciar apps Teams
- [Esquema de manifesto do app Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receber mensagens de canal com RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referência de permissões RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Tratamento de arquivos do Bot Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/grupo requer Graph)
- [Mensagens proativas](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
