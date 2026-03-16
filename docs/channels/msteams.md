---
summary: "Status de suporte ao Microsoft Teams, capacidades e configuração"
read_when:
  - Trabalhando em recursos do canal MS Teams
title: "Microsoft Teams"
---

# Microsoft Teams (plugin)

> "Abandone toda esperança, vós que entrais aqui."

Atualizado: 2026-01-21

Status: texto + anexos de DM são suportados; envio de arquivos em canal/grupo requer `sharePointSiteId` + permissões Graph (veja [Enviando arquivos em chats em grupo](#enviando-arquivos-em-chats-em-grupo)). Enquetes são enviadas via Adaptive Cards.

## Plugin necessário

O Microsoft Teams vem como plugin e não está incluído na instalação principal.

**Mudança incompatível (2026.1.15):** o MS Teams saiu do core. Se você o usa, deve instalar o plugin.

Explicação: mantém as instalações principais mais leves e permite que as dependências do MS Teams sejam atualizadas de forma independente.

Instalar via CLI (registro npm):

```bash
opencraft plugins install @openclaw/msteams
```

Checkout local (quando executando a partir de um repositório git):

```bash
opencraft plugins install ./extensions/msteams
```

Se você escolher Teams durante configure/onboarding e um checkout git for detectado,
o OpenCraft oferecerá o caminho de instalação local automaticamente.

Detalhes: [Plugins](/tools/plugin)

## Configuração rápida (iniciante)

1. Instale o plugin Microsoft Teams.
2. Crie um **Azure Bot** (App ID + segredo de cliente + ID de tenant).
3. Configure o OpenCraft com essas credenciais.
4. Exponha `/api/messages` (porta 3978 por padrão) via URL pública ou tunnel.
5. Instale o pacote do app Teams e inicie o gateway.

Config mínima:

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

Nota: chats em grupo são bloqueados por padrão (`channels.msteams.groupPolicy: "allowlist"`). Para permitir respostas em grupo, defina `channels.msteams.groupAllowFrom` (ou use `groupPolicy: "open"` para permitir qualquer membro, com controle por menção).

## Objetivos

- Falar com o OpenCraft via DMs do Teams, chats em grupo ou canais.
- Manter o roteamento determinístico: as respostas sempre voltam para o canal de onde chegaram.
- Padrão para comportamento seguro de canal (menções obrigatórias a menos que configurado de outra forma).

## Escritas de config

Por padrão, o Microsoft Teams tem permissão para escrever atualizações de config acionadas por `/config set|unset` (requer `commands.config: true`).

Desabilitar com:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Controle de acesso (DMs + grupos)

**Acesso a DM**

- Padrão: `channels.msteams.dmPolicy = "pairing"`. Remetentes desconhecidos são ignorados até aprovação.
- `channels.msteams.allowFrom` deve usar IDs de objeto AAD estáveis.
- UPNs/nomes de exibição são mutáveis; correspondência direta é desabilitada por padrão e habilitada apenas com `channels.msteams.dangerouslyAllowNameMatching: true`.
- O assistente pode resolver nomes para IDs via Microsoft Graph quando as credenciais permitem.

**Acesso a grupo**

- Padrão: `channels.msteams.groupPolicy = "allowlist"` (bloqueado a menos que você adicione `groupAllowFrom`). Use `channels.defaults.groupPolicy` para substituir o padrão quando não definido.
- `channels.msteams.groupAllowFrom` controla quais remetentes podem acionar em chats/canais de grupo (recorre a `channels.msteams.allowFrom`).
- Defina `groupPolicy: "open"` para permitir qualquer membro (ainda com controle por menção por padrão).
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

**Allowlist de Teams + canal**

- Escope as respostas de grupo/canal listando equipes e canais em `channels.msteams.teams`.
- As chaves devem usar IDs de equipe estáveis e IDs de conversa de canal.
- Quando `groupPolicy="allowlist"` e uma allowlist de equipes está presente, apenas equipes/canais listados são aceitos (com controle por menção).
- O assistente de configuração aceita entradas `Equipe/Canal` e as armazena para você.
- Na inicialização, o OpenCraft resolve nomes de equipe/canal e usuário nas allowlists para IDs (quando as permissões Graph permitem)
  e registra o mapeamento; nomes não resolvidos de equipe/canal são mantidos como digitados mas ignorados para roteamento por padrão a menos que `channels.msteams.dangerouslyAllowNameMatching: true` esteja habilitado.

Exemplo:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "Minha Equipe": {
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

1. Instale o plugin Microsoft Teams.
2. Crie um **Azure Bot** (App ID + segredo + ID de tenant).
3. Construa um **pacote de app Teams** que referencia o bot e inclui as permissões RSC abaixo.
4. Faça upload/instale o app Teams em uma equipe (ou escopo pessoal para DMs).
5. Configure `msteams` em `~/.opencraft/opencraft.json` (ou variáveis de ambiente) e inicie o gateway.
6. O gateway escuta o tráfego de webhook do Bot Framework em `/api/messages` por padrão.

## Configuração do Azure Bot (Pré-requisitos)

Antes de configurar o OpenCraft, você precisa criar um recurso Azure Bot.

### Passo 1: Criar Azure Bot

1. Acesse [Criar Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Preencha a aba **Básico**:

   | Campo                  | Valor                                                          |
   | ---------------------- | -------------------------------------------------------------- |
   | **Handle do bot**      | Nome do bot, ex.: `opencraft-msteams` (deve ser único)         |
   | **Assinatura**         | Selecione sua assinatura Azure                                 |
   | **Grupo de recursos**  | Crie novo ou use existente                                     |
   | **Nível de preço**     | **Grátis** para dev/teste                                      |
   | **Tipo de App**        | **Single Tenant** (recomendado - veja nota abaixo)             |
   | **Tipo de criação**    | **Create new Microsoft App ID**                                |

> **Aviso de descontinuação:** A criação de novos bots multi-tenant foi descontinuada após 2025-07-31. Use **Single Tenant** para novos bots.

3. Clique em **Revisar + criar** → **Criar** (aguarde ~1-2 minutos)

### Passo 2: Obter Credenciais

1. Vá para seu recurso Azure Bot → **Configuração**
2. Copie o **Microsoft App ID** → este é seu `appId`
3. Clique em **Gerenciar Senha** → vá para o Registro de App
4. Em **Certificados e segredos** → **Novo segredo de cliente** → copie o **Valor** → este é seu `appPassword`
5. Vá para **Visão geral** → copie o **ID de Diretório (tenant)** → este é seu `tenantId`

### Passo 3: Configurar Endpoint de Mensagens

1. No Azure Bot → **Configuração**
2. Defina o **Endpoint de mensagens** para sua URL de webhook:
   - Produção: `https://seu-dominio.com/api/messages`
   - Dev local: Use um tunnel (veja [Desenvolvimento Local](#desenvolvimento-local-tunneling) abaixo)

### Passo 4: Habilitar Canal Teams

1. No Azure Bot → **Canais**
2. Clique em **Microsoft Teams** → Configurar → Salvar
3. Aceite os Termos de Serviço

## Desenvolvimento Local (Tunneling)

O Teams não consegue alcançar `localhost`. Use um tunnel para desenvolvimento local:

**Opção A: ngrok**

```bash
ngrok http 3978
# Copie a URL https, ex.: https://abc123.ngrok.io
# Defina o endpoint de mensagens como: https://abc123.ngrok.io/api/messages
```

**Opção B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Use sua URL do Tailscale funnel como endpoint de mensagens
```

## Portal do Desenvolvedor Teams (Alternativa)

Em vez de criar um ZIP de manifesto manualmente, você pode usar o [Portal do Desenvolvedor Teams](https://dev.teams.microsoft.com/apps):

1. Clique em **+ Novo app**
2. Preencha informações básicas (nome, descrição, info do desenvolvedor)
3. Vá para **Recursos do App** → **Bot**
4. Selecione **Inserir um bot ID manualmente** e cole o App ID do Azure Bot
5. Marque escopos: **Personal**, **Team**, **Group Chat**
6. Clique em **Distribuir** → **Baixar pacote do app**
7. No Teams: **Apps** → **Gerenciar seus apps** → **Carregar um app personalizado** → selecione o ZIP

Isso geralmente é mais fácil do que editar manifestos JSON manualmente.

## Testando o Bot

**Opção A: Azure Web Chat (verificar webhook primeiro)**

1. No Portal Azure → seu recurso Azure Bot → **Testar no Web Chat**
2. Envie uma mensagem - você deve ver uma resposta
3. Isso confirma que o endpoint do webhook funciona antes da configuração do Teams

**Opção B: Teams (após instalação do app)**

1. Instale o app Teams (sideload ou catálogo org)
2. Encontre o bot no Teams e envie um DM
3. Verifique os logs do gateway para a atividade recebida

## Configuração (somente texto mínimo)

1. **Instale o plugin Microsoft Teams**
   - Do npm: `opencraft plugins install @openclaw/msteams`
   - De um checkout local: `opencraft plugins install ./extensions/msteams`

2. **Registro do bot**
   - Crie um Azure Bot (veja acima) e anote:
     - App ID
     - Segredo do cliente (App password)
     - ID do Tenant (single-tenant)

3. **Manifesto do app Teams**
   - Inclua uma entrada `bot` com `botId = <App ID>`.
   - Escopos: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (obrigatório para tratamento de arquivos no escopo pessoal).
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

   Você também pode usar variáveis de ambiente em vez de chaves de config:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **Endpoint do bot**
   - Defina o Endpoint de Mensagens do Azure Bot como:
     - `https://<host>:3978/api/messages` (ou seu caminho/porta escolhido).

6. **Execute o gateway**
   - O canal Teams inicia automaticamente quando o plugin está instalado e a config `msteams` existe com credenciais.

## Contexto de histórico

- `channels.msteams.historyLimit` controla quantas mensagens recentes de canal/grupo são incluídas no prompt.
- Recorre a `messages.groupChat.historyLimit`. Defina `0` para desabilitar (padrão 50).
- O histórico de DM pode ser limitado com `channels.msteams.dmHistoryLimit` (turnos do usuário). Substituições por usuário: `channels.msteams.dms["<user_id>"].historyLimit`.

## Permissões RSC Atuais do Teams (Manifesto)

Estas são as **permissões resourceSpecific existentes** no nosso manifesto de app Teams. Elas se aplicam apenas dentro da equipe/chat onde o app está instalado.

**Para canais (escopo de equipe):**

- `ChannelMessage.Read.Group` (Application) - recebe todas as mensagens de canal sem @menção
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Para chats em grupo:**

- `ChatMessage.Read.Chat` (Application) - recebe todas as mensagens de chat em grupo sem @menção

## Exemplo de Manifesto Teams (reduzido)

Exemplo mínimo e válido com os campos obrigatórios. Substitua IDs e URLs.

```json
{
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  "manifestVersion": "1.23",
  "version": "1.0.0",
  "id": "00000000-0000-0000-0000-000000000000",
  "name": { "short": "OpenCraft" },
  "developer": {
    "name": "Sua Org",
    "websiteUrl": "https://example.com",
    "privacyUrl": "https://example.com/privacy",
    "termsOfUseUrl": "https://example.com/terms"
  },
  "description": { "short": "OpenCraft no Teams", "full": "OpenCraft no Teams" },
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
- `bots[].supportsFiles: true` é obrigatório para tratamento de arquivos no escopo pessoal.
- `authorization.permissions.resourceSpecific` deve incluir leitura/envio de canal se você quiser tráfego de canal.

### Atualizando um app existente

Para atualizar um app Teams já instalado (ex.: para adicionar permissões RSC):

1. Atualize seu `manifest.json` com as novas configurações
2. **Incremente o campo `version`** (ex.: `1.0.0` → `1.1.0`)
3. **Re-compacte** o manifesto com ícones (`manifest.json`, `outline.png`, `color.png`)
4. Faça upload do novo zip:
   - **Opção A (Teams Admin Center):** Teams Admin Center → Apps do Teams → Gerenciar apps → encontre seu app → Carregar nova versão
   - **Opção B (Sideload):** No Teams → Apps → Gerenciar seus apps → Carregar um app personalizado
5. **Para canais de equipe:** Reinstale o app em cada equipe para que as novas permissões entrem em vigor
6. **Feche e reabra o Teams completamente** (não apenas feche a janela) para limpar metadados de app em cache

## Capacidades: apenas RSC vs Graph

### Com **apenas RSC do Teams** (app instalado, sem permissões Graph API)

Funciona:

- Ler **texto** de mensagem de canal.
- Enviar **texto** de mensagem de canal.
- Receber anexos de arquivo de **pessoal (DM)**.

NÃO funciona:

- **Conteúdo de imagem ou arquivo** de canal/grupo (payload inclui apenas stub HTML).
- Download de anexos armazenados no SharePoint/OneDrive.
- Leitura do histórico de mensagens (além do evento de webhook ao vivo).

### Com **RSC do Teams + permissões de aplicativo Microsoft Graph**

Adiciona:

- Download de conteúdo hospedado (imagens coladas em mensagens).
- Download de anexos de arquivo armazenados no SharePoint/OneDrive.
- Leitura do histórico de mensagens de canal/chat via Graph.

### RSC vs Graph API

| Capacidade              | Permissões RSC           | Graph API                                   |
| ----------------------- | ------------------------ | ------------------------------------------- |
| **Mensagens em tempo real** | Sim (via webhook)    | Não (apenas polling)                        |
| **Mensagens históricas**    | Não                  | Sim (pode consultar histórico)              |
| **Complexidade de setup**   | Apenas manifesto do app | Requer consentimento de admin + fluxo de token |
| **Funciona offline**        | Não (deve estar rodando) | Sim (consulte a qualquer hora)             |

**Conclusão:** RSC é para escuta em tempo real; Graph API é para acesso histórico. Para recuperar mensagens perdidas enquanto offline, você precisa do Graph API com `ChannelMessage.Read.All` (requer consentimento de admin).

## Mídia + histórico habilitados pelo Graph (obrigatório para canais)

Se você precisar de imagens/arquivos em **canais** ou quiser buscar **histórico de mensagens**, deve habilitar permissões do Microsoft Graph e conceder consentimento de admin.

1. No **Registro de App** do Entra ID (Azure AD), adicione permissões de **Aplicativo** do Microsoft Graph:
   - `ChannelMessage.Read.All` (anexos de canal + histórico)
   - `Chat.Read.All` ou `ChatMessage.Read.All` (chats em grupo)
2. **Conceda consentimento de admin** para o tenant.
3. Atualize a **versão do manifesto** do app Teams, re-faça upload e **reinstale o app no Teams**.
4. **Feche e reabra o Teams completamente** para limpar metadados de app em cache.

**Permissão adicional para menções de usuário:** @menções de usuário funcionam nativamente para usuários na conversa. No entanto, se você quiser pesquisar e mencionar dinamicamente usuários que **não estão na conversa atual**, adicione a permissão `User.Read.All` (Application) e conceda consentimento de admin.

## Limitações Conhecidas

### Timeouts de webhook

O Teams entrega mensagens via webhook HTTP. Se o processamento demorar muito (ex.: respostas lentas do LLM), você pode ver:

- Timeouts do gateway
- O Teams retentando a mensagem (causando duplicatas)
- Respostas descartadas

O OpenCraft trata isso retornando rapidamente e enviando respostas proativamente, mas respostas muito lentas ainda podem causar problemas.

### Formatação

O markdown do Teams é mais limitado que Slack ou Discord:

- Formatação básica funciona: **negrito**, _itálico_, `código`, links
- Markdown complexo (tabelas, listas aninhadas) pode não renderizar corretamente
- Adaptive Cards são suportados para enquetes e envios de card arbitrários (veja abaixo)

## Configuração

Configurações principais (veja `/gateway/configuration` para padrões de canal compartilhados):

- `channels.msteams.enabled`: habilitar/desabilitar o canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenciais do bot.
- `channels.msteams.webhook.port` (padrão `3978`)
- `channels.msteams.webhook.path` (padrão `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing)
- `channels.msteams.allowFrom`: allowlist de DM (IDs de objeto AAD recomendados). O assistente resolve nomes para IDs durante a configuração quando o acesso Graph está disponível.
- `channels.msteams.dangerouslyAllowNameMatching`: toggle de emergência para reabilitar correspondência mutável de UPN/nome de exibição e roteamento direto de nome de equipe/canal.
- `channels.msteams.textChunkLimit`: tamanho do bloco de texto de saída.
- `channels.msteams.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- `channels.msteams.mediaAllowHosts`: allowlist para hosts de anexo de entrada (padrão para domínios Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist para anexar headers Authorization em novas tentativas de mídia (padrão para hosts Graph + Bot Framework).
- `channels.msteams.requireMention`: exigir @menção em canais/grupos (padrão true).
- `channels.msteams.replyStyle`: `thread | top-level` (veja [Estilo de Resposta](#estilo-de-resposta-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: substituição por equipe.
- `channels.msteams.teams.<teamId>.requireMention`: substituição por equipe.
- `channels.msteams.teams.<teamId>.tools`: substituições padrão de política de ferramenta por equipe (`allow`/`deny`/`alsoAllow`) usadas quando uma substituição de canal está ausente.
- `channels.msteams.teams.<teamId>.toolsBySender`: substituições padrão de política de ferramenta por remetente por equipe (wildcard `"*"` suportado).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: substituição por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: substituição por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: substituições de política de ferramenta por canal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: substituições de política de ferramenta por remetente por canal (wildcard `"*"` suportado).
- As chaves de `toolsBySender` devem usar prefixos explícitos:
  `id:`, `e164:`, `username:`, `name:` (chaves legadas sem prefixo ainda mapeiam apenas para `id:`).
- `channels.msteams.sharePointSiteId`: ID do site SharePoint para uploads de arquivo em chats em grupo/canais (veja [Enviando arquivos em chats em grupo](#enviando-arquivos-em-chats-em-grupo)).

## Roteamento e Sessões

- As chaves de sessão seguem o formato padrão de agente (veja [/concepts/session](/concepts/session)):
  - Mensagens diretas compartilham a sessão principal (`agent:<agentId>:<mainKey>`).
  - Mensagens de canal/grupo usam id de conversa:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de Resposta: Threads vs Posts

O Teams introduziu recentemente dois estilos de UI de canal sobre o mesmo modelo de dados subjacente:

| Estilo                   | Descrição                                                    | `replyStyle` recomendado |
| ------------------------ | ------------------------------------------------------------ | ------------------------ |
| **Posts** (clássico)     | Mensagens aparecem como cards com respostas encadeadas abaixo | `thread` (padrão)        |
| **Threads** (estilo Slack) | Mensagens fluem linearmente, mais parecido com Slack        | `top-level`              |

**O problema:** a API do Teams não expõe qual estilo de UI um canal usa. Se você usar o `replyStyle` errado:

- `thread` em um canal estilo Threads → respostas aparecem aninhadas de forma estranha
- `top-level` em um canal estilo Posts → respostas aparecem como posts separados de nível superior em vez de na thread

**Solução:** Configure `replyStyle` por canal com base em como o canal está configurado:

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

- **DMs:** Imagens e anexos de arquivo funcionam via APIs de arquivo do bot Teams.
- **Canais/grupos:** Os anexos ficam no armazenamento M365 (SharePoint/OneDrive). O payload do webhook inclui apenas um stub HTML, não os bytes reais do arquivo. **Permissões Graph API são obrigatórias** para baixar anexos de canal.

Sem permissões Graph, mensagens de canal com imagens serão recebidas apenas como texto (o conteúdo da imagem não está acessível ao bot).
Por padrão, o OpenCraft só baixa mídia de hostnames Microsoft/Teams. Substitua com `channels.msteams.mediaAllowHosts` (use `["*"]` para permitir qualquer host).
Headers de autorização são anexados apenas para hosts em `channels.msteams.mediaAuthAllowHosts` (padrão para hosts Graph + Bot Framework). Mantenha esta lista estrita (evite sufixos multi-tenant).

## Enviando arquivos em chats em grupo

Bots podem enviar arquivos em DMs usando o fluxo FileConsentCard (integrado). No entanto, **enviar arquivos em chats em grupo/canais** requer configuração adicional:

| Contexto                    | Como os arquivos são enviados                    | Configuração necessária                                    |
| --------------------------- | ------------------------------------------------ | ---------------------------------------------------------- |
| **DMs**                     | FileConsentCard → usuário aceita → bot sobe      | Funciona nativamente                                       |
| **Chats em grupo/canais**   | Upload para SharePoint → link de compartilhamento | Requer `sharePointSiteId` + permissões Graph               |
| **Imagens (qualquer contexto)** | Base64-encoded inline                        | Funciona nativamente                                       |

### Por que chats em grupo precisam do SharePoint

Bots não têm um drive pessoal no OneDrive (o endpoint Graph API `/me/drive` não funciona para identidades de aplicativo). Para enviar arquivos em chats em grupo/canais, o bot faz upload para um **site SharePoint** e cria um link de compartilhamento.

### Configuração

1. **Adicione permissões Graph API** no Entra ID (Azure AD) → Registro de App:
   - `Sites.ReadWrite.All` (Application) - fazer upload de arquivos para SharePoint
   - `Chat.Read.All` (Application) - opcional, habilita links de compartilhamento por usuário

2. **Conceda consentimento de admin** para o tenant.

3. **Obtenha seu ID de site SharePoint:**

   ```bash
   # Via Graph Explorer ou curl com um token válido:
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
         // ... outras config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Comportamento de compartilhamento

| Permissão                                       | Comportamento de compartilhamento                             |
| ----------------------------------------------- | ------------------------------------------------------------- |
| Apenas `Sites.ReadWrite.All`                    | Link de compartilhamento para toda a organização (qualquer um na org pode acessar) |
| `Sites.ReadWrite.All` + `Chat.Read.All`         | Link de compartilhamento por usuário (apenas membros do chat podem acessar) |

O compartilhamento por usuário é mais seguro, pois apenas os participantes do chat podem acessar o arquivo. Se a permissão `Chat.Read.All` estiver ausente, o bot recorre ao compartilhamento para toda a organização.

### Comportamento de fallback

| Cenário                                             | Resultado                                              |
| --------------------------------------------------- | ------------------------------------------------------ |
| Chat em grupo + arquivo + `sharePointSiteId` configurado | Upload para SharePoint, enviar link de compartilhamento |
| Chat em grupo + arquivo + sem `sharePointSiteId`    | Tentar upload no OneDrive (pode falhar), enviar apenas texto |
| Chat pessoal + arquivo                              | Fluxo FileConsentCard (funciona sem SharePoint)        |
| Qualquer contexto + imagem                          | Base64-encoded inline (funciona sem SharePoint)        |

### Local de armazenamento dos arquivos

Os arquivos enviados são armazenados em uma pasta `/OpenCraftShared/` na biblioteca de documentos padrão do site SharePoint configurado.

## Enquetes (Adaptive Cards)

O OpenCraft envia enquetes do Teams como Adaptive Cards (não há API nativa de enquete do Teams).

- CLI: `opencraft message poll --channel msteams --target conversation:<id> ...`
- Votos são registrados pelo gateway em `~/.opencraft/msteams-polls.json`.
- O gateway deve ficar online para registrar votos.
- As enquetes ainda não publicam resumos de resultados automaticamente (inspecione o arquivo de store se necessário).

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
    "body": [{ "type": "TextBlock", "text": "Olá!" }]
  }
}
```

**CLI:**

```bash
opencraft message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Olá!"}]}'
```

Veja a [documentação de Adaptive Cards](https://adaptivecards.io/) para schema e exemplos de card. Para detalhes de formato de alvo, veja [Formatos de alvo](#formatos-de-alvo) abaixo.

## Formatos de alvo

Alvos do MSTeams usam prefixos para distinguir entre usuários e conversas:

| Tipo de alvo          | Formato                          | Exemplo                                             |
| --------------------- | -------------------------------- | --------------------------------------------------- |
| Usuário (por ID)      | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Usuário (por nome)    | `user:<display-name>`            | `user:João Silva` (requer Graph API)                |
| Grupo/canal           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grupo/canal (bruto)   | `<conversation-id>`              | `19:abc123...@thread.tacv2` (se contém `@thread`)   |

**Exemplos de CLI:**

```bash
# Enviar para um usuário por ID
opencraft message send --channel msteams --target "user:40a1a0ed-..." --message "Olá"

# Enviar para um usuário por nome de exibição (aciona consulta Graph API)
opencraft message send --channel msteams --target "user:João Silva" --message "Olá"

# Enviar para um chat em grupo ou canal
opencraft message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Olá"

# Enviar um Adaptive Card para uma conversa
opencraft message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Olá"}]}'
```

**Exemplos de ferramenta do agente:**

```json
{
  "action": "send",
  "channel": "msteams",
  "target": "user:João Silva",
  "message": "Olá!"
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
    "body": [{ "type": "TextBlock", "text": "Olá" }]
  }
}
```

Nota: Sem o prefixo `user:`, nomes padrão para resolução de grupo/equipe. Sempre use `user:` ao ter como alvo pessoas por nome de exibição.

## Mensagens proativas

- Mensagens proativas são possíveis apenas **após** um usuário ter interagido, pois armazenamos referências de conversa nesse momento.
- Veja `/gateway/configuration` para gating de `dmPolicy` e allowlist.

## IDs de Equipe e Canal (Armadilha Comum)

O parâmetro de consulta `groupId` nas URLs do Teams **NÃO** é o ID de equipe usado para configuração. Extraia IDs do caminho da URL em vez disso:

**URL de equipe:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID da equipe (URL-decodifique isto)
```

**URL de canal:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/NomeDoCanal?groupId=...
                                      └─────────────────────────┘
                                      ID do canal (URL-decodifique isto)
```

**Para config:**

- ID da equipe = segmento de caminho após `/team/` (URL-decodificado, ex.: `19:Bk4j...@thread.tacv2`)
- ID do canal = segmento de caminho após `/channel/` (URL-decodificado)
- **Ignore** o parâmetro de consulta `groupId`

## Canais Privados

Os bots têm suporte limitado em canais privados:

| Recurso                      | Canais Padrão  | Canais Privados       |
| ---------------------------- | -------------- | --------------------- |
| Instalação do bot            | Sim            | Limitado              |
| Mensagens em tempo real (webhook) | Sim       | Pode não funcionar    |
| Permissões RSC               | Sim            | Pode ter comportamento diferente |
| @menções                     | Sim            | Se o bot está acessível |
| Histórico via Graph API      | Sim            | Sim (com permissões)  |

**Soluções alternativas se canais privados não funcionam:**

1. Use canais padrão para interações com bot
2. Use DMs - usuários sempre podem enviar mensagem ao bot diretamente
3. Use Graph API para acesso histórico (requer `ChannelMessage.Read.All`)

## Solução de problemas

### Problemas comuns

- **Imagens não aparecem nos canais:** permissões Graph ou consentimento de admin ausentes. Reinstale o app Teams e feche/reabra o Teams completamente.
- **Sem respostas no canal:** menções são obrigatórias por padrão; defina `channels.msteams.requireMention=false` ou configure por equipe/canal.
- **Incompatibilidade de versão (Teams ainda mostra manifesto antigo):** remova + adicione novamente o app e feche o Teams completamente para atualizar.
- **401 Unauthorized do webhook:** esperado ao testar manualmente sem JWT Azure - significa que o endpoint está acessível mas a autenticação falhou. Use o Azure Web Chat para testar adequadamente.

### Erros de upload de manifesto

- **"Icon file cannot be empty":** o manifesto referencia arquivos de ícone com 0 bytes. Crie ícones PNG válidos (32x32 para `outline.png`, 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** o app ainda está instalado em outra equipe/chat. Encontre e desinstale primeiro, ou aguarde 5-10 minutos para propagação.
- **"Something went wrong" no upload:** faça upload via [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) em vez disso, abra o DevTools do navegador (F12) → aba Network, e verifique o corpo da resposta para o erro real.
- **Sideload falhando:** tente "Carregar um app para o catálogo de apps da sua org" em vez de "Carregar um app personalizado" - isso frequentemente contorna as restrições de sideload.

### Permissões RSC não funcionando

1. Verifique se `webApplicationInfo.id` corresponde exatamente ao App ID do seu bot
2. Re-faça upload do app e reinstale na equipe/chat
3. Verifique se o administrador da sua org bloqueou permissões RSC
4. Confirme que você está usando o escopo correto: `ChannelMessage.Read.Group` para equipes, `ChatMessage.Read.Chat` para chats em grupo

## Referências

- [Criar Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Guia de configuração do Azure Bot
- [Portal do Desenvolvedor Teams](https://dev.teams.microsoft.com/apps) - criar/gerenciar apps Teams
- [Schema do manifesto do app Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receber mensagens de canal com RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referência de permissões RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Tratamento de arquivo do bot Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/grupo requer Graph)
- [Mensagens proativas](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
