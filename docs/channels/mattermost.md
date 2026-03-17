---
summary: "Configuração do Bot Mattermost e configuração do OpenCraft"
read_when:
  - Configurando o Mattermost
  - Depurando roteamento do Mattermost
title: "Mattermost"
---

# Mattermost (plugin)

Status: suportado via Plugin (Token de Bot + eventos WebSocket). Canais, grupos e DMs são suportados.
O Mattermost é uma plataforma de mensagens para equipes auto-hospedável; veja o site oficial em
[mattermost.com](https://mattermost.com) para detalhes do produto e downloads.

## Plugin necessário

O Mattermost é distribuído como Plugin e não está incluído na instalação principal.

Instalar via CLI (registro npm):

```bash
opencraft plugins install @opencraft/mattermost
```

Checkout local (ao executar a partir de um repositório git):

```bash
opencraft plugins install ./extensions/mattermost
```

Se você escolher Mattermost durante a configuração e um checkout git for detectado,
o OpenCraft oferecerá o caminho de instalação local automaticamente.

Detalhes: [Plugins](/tools/plugin)

## Configuração rápida

1. Instale o Plugin Mattermost.
2. Crie uma conta de Bot no Mattermost e copie o **Token de Bot**.
3. Copie a **URL base** do Mattermost (ex.: `https://chat.example.com`).
4. Configure o OpenCraft e inicie o Gateway.

Configuração mínima:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## Comandos slash nativos

Os comandos slash nativos são opcionais. Quando habilitados, o OpenCraft registra comandos slash `oc_*` via
API do Mattermost e recebe POSTs de callback no servidor HTTP do Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use quando o Mattermost não consegue alcançar o Gateway diretamente (proxy reverso/URL pública).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Notas:

- `native: "auto"` é desabilitado por padrão para o Mattermost. Defina `native: true` para habilitar.
- Se `callbackUrl` for omitido, o OpenCraft deriva um a partir do host/porta do Gateway + `callbackPath`.
- Para configurações de múltiplas contas, `commands` pode ser definido no nível superior ou em
  `channels.mattermost.accounts.<id>.commands` (valores da conta sobrescrevem campos de nível superior).
- Callbacks de comando são validados com Tokens por comando e falham de forma fechada quando a verificação de Token falha.
- Requisito de acessibilidade: o endpoint de callback deve ser acessível pelo servidor Mattermost.
  - Não defina `callbackUrl` como `localhost` a menos que o Mattermost rode no mesmo host/namespace de rede que o OpenCraft.
  - Não defina `callbackUrl` como a URL base do Mattermost a menos que essa URL faça proxy reverso de `/api/channels/mattermost/command` para o OpenCraft.
  - Uma verificação rápida é `curl https://<gateway-host>/api/channels/mattermost/command`; um GET deve retornar `405 Method Not Allowed` do OpenCraft, não `404`.
- Requisito de allowlist de saída do Mattermost:
  - Se seu callback tem como alvo endereços privados/tailnet/internos, defina
    `ServiceSettings.AllowedUntrustedInternalConnections` do Mattermost para incluir o host/domínio do callback.
  - Use entradas de host/domínio, não URLs completas.
    - Correto: `gateway.tailnet-name.ts.net`
    - Incorreto: `https://gateway.tailnet-name.ts.net`

## Variáveis de ambiente (conta padrão)

Defina estas no host do Gateway se preferir variáveis de ambiente:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Variáveis de ambiente aplicam-se apenas à conta **padrão** (`default`). Outras contas devem usar valores de configuração.

## Modos de chat

O Mattermost responde a DMs automaticamente. O comportamento em canais é controlado por `chatmode`:

- `oncall` (padrão): responde apenas quando mencionado com @ em canais.
- `onmessage`: responde a toda mensagem no canal.
- `onchar`: responde quando uma mensagem começa com um prefixo gatilho.

Exemplo de configuração:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Notas:

- `onchar` ainda responde a menções explícitas com @.
- `channels.mattermost.requireMention` é respeitado para configurações legadas, mas `chatmode` é preferido.

## Threads e sessões

Use `channels.mattermost.replyToMode` para controlar se as respostas de canais e grupos ficam no
canal principal ou iniciam um thread sob a postagem que acionou.

- `off` (padrão): responde em um thread apenas quando a postagem de entrada já está em um.
- `first`: para postagens de nível superior em canais/grupos, inicia um thread sob aquela postagem e roteia a
  conversa para uma sessão com escopo de thread.
- `all`: mesmo comportamento que `first` para o Mattermost atualmente.
- Mensagens diretas ignoram esta configuração e permanecem sem thread.

Exemplo de configuração:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Notas:

- Sessões com escopo de thread usam o ID da postagem que acionou como raiz do thread.
- `first` e `all` são atualmente equivalentes porque, uma vez que o Mattermost tem uma raiz de thread,
  blocos e mídia de acompanhamento continuam nesse mesmo thread.

## Controle de acesso (DMs)

- Padrão: `channels.mattermost.dmPolicy = "pairing"` (remetentes desconhecidos recebem um código de pareamento).
- Aprovar via:
  - `opencraft pairing list mattermost`
  - `opencraft pairing approve mattermost <CODE>`
- DMs públicas: `channels.mattermost.dmPolicy="open"` mais `channels.mattermost.allowFrom=["*"]`.

## Canais (grupos)

- Padrão: `channels.mattermost.groupPolicy = "allowlist"` (com exigência de menção).
- Adicione remetentes à allowlist com `channels.mattermost.groupAllowFrom` (IDs de usuário recomendados).
- Correspondência por `@username` é mutável e só é habilitada quando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canais abertos: `channels.mattermost.groupPolicy="open"` (com exigência de menção).
- Nota de tempo de execução: se `channels.mattermost` estiver completamente ausente, o tempo de execução retorna para `groupPolicy="allowlist"` para verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

## Alvos para entrega de saída

Use estes formatos de alvo com `opencraft message send` ou Cron/Webhooks:

- `channel:<id>` para um canal
- `user:<id>` para uma DM
- `@username` para uma DM (resolvido via API do Mattermost)

IDs opacos simples (como `64ifufp...`) são **ambíguos** no Mattermost (ID de usuário vs ID de canal).

O OpenCraft os resolve **usuário primeiro**:

- Se o ID existe como um usuário (`GET /api/v4/users/<id>` sucede), o OpenCraft envia uma **DM** resolvendo o canal direto via `/api/v4/channels/direct`.
- Caso contrário, o ID é tratado como um **ID de canal**.

Se você precisa de comportamento determinístico, sempre use os prefixos explícitos (`user:<id>` / `channel:<id>`).

## Reações (ferramenta de mensagem)

- Use `message action=react` com `channel=mattermost`.
- `messageId` é o ID da postagem do Mattermost.
- `emoji` aceita nomes como `thumbsup` ou `:+1:` (dois pontos são opcionais).
- Defina `remove=true` (boolean) para remover uma reação.
- Eventos de adicionar/remover reação são encaminhados como eventos do sistema para a sessão do agente roteado.

Exemplos:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuração:

- `channels.mattermost.actions.reactions`: habilitar/desabilitar ações de reação (padrão true).
- Sobrescrita por conta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Botões interativos (ferramenta de mensagem)

Envie mensagens com botões clicáveis. Quando um usuário clica em um botão, o agente recebe a
seleção e pode responder.

Habilite botões adicionando `inlineButtons` às capacidades do canal:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Use `message action=send` com um parâmetro `buttons`. Botões são um array 2D (linhas de botões):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Campos dos botões:

- `text` (obrigatório): rótulo de exibição.
- `callback_data` (obrigatório): valor enviado de volta ao clicar (usado como ID da ação).
- `style` (opcional): `"default"`, `"primary"` ou `"danger"`.

Quando um usuário clica em um botão:

1. Todos os botões são substituídos por uma linha de confirmação (ex.: "✓ **Yes** selected by @user").
2. O agente recebe a seleção como uma mensagem de entrada e responde.

Notas:

- Callbacks de botões usam verificação HMAC-SHA256 (automática, sem configuração necessária).
- O Mattermost remove dados de callback de suas respostas API (recurso de segurança), então todos os botões
  são removidos ao clicar -- remoção parcial não é possível.
- IDs de ação contendo hífens ou underscores são sanitizados automaticamente
  (limitação de roteamento do Mattermost).

Configuração:

- `channels.mattermost.capabilities`: array de strings de capacidade. Adicione `"inlineButtons"` para
  habilitar a descrição da ferramenta de botões no prompt do sistema do agente.
- `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para callbacks de
  botões (por exemplo `https://gateway.example.com`). Use quando o Mattermost não consegue
  alcançar o Gateway no host de ligação diretamente.
- Em configurações de múltiplas contas, você também pode definir o mesmo campo em
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Se `interactions.callbackBaseUrl` for omitido, o OpenCraft deriva a URL de callback de
  `gateway.customBindHost` + `gateway.port`, depois retorna para `http://localhost:<port>`.
- Regra de acessibilidade: a URL de callback do botão deve ser acessível pelo servidor Mattermost.
  `localhost` só funciona quando Mattermost e OpenCraft rodam no mesmo host/namespace de rede.
- Se seu alvo de callback é privado/tailnet/interno, adicione seu host/domínio a
  `ServiceSettings.AllowedUntrustedInternalConnections` do Mattermost.

### Integração direta com API (scripts externos)

Scripts externos e Webhooks podem postar botões diretamente via API REST do Mattermost
em vez de passar pela ferramenta `message` do agente. Use `buildButtonAttachments()` da
extensão quando possível; se postar JSON bruto, siga estas regras:

**Estrutura do payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // apenas alfanumérico -- veja abaixo
            type: "button", // obrigatório, ou cliques são silenciosamente ignorados
            name: "Approve", // rótulo de exibição
            style: "primary", // opcional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // deve corresponder ao id do botão (para busca de nome)
                action: "approve",
                // ... quaisquer campos personalizados ...
                _token: "<hmac>", // veja seção HMAC abaixo
              },
            },
          },
        ],
      },
    ],
  },
}
```

**Regras críticas:**

1. Attachments vão em `props.attachments`, não em `attachments` de nível superior (silenciosamente ignorado).
2. Toda ação precisa de `type: "button"` -- sem isso, cliques são engolidos silenciosamente.
3. Toda ação precisa de um campo `id` -- o Mattermost ignora ações sem IDs.
4. O `id` da ação deve ser **apenas alfanumérico** (`[a-zA-Z0-9]`). Hífens e underscores quebram
   o roteamento de ações do servidor Mattermost (retorna 404). Remova-os antes de usar.
5. `context.action_id` deve corresponder ao `id` do botão para que a mensagem de confirmação mostre o
   nome do botão (ex.: "Approve") em vez de um ID bruto.
6. `context.action_id` é obrigatório -- o handler de interação retorna 400 sem ele.

**Geração de Token HMAC:**

O Gateway verifica cliques de botões com HMAC-SHA256. Scripts externos devem gerar Tokens
que correspondam à lógica de verificação do Gateway:

1. Derive o segredo a partir do Token de Bot:
   `HMAC-SHA256(key="opencraft-mattermost-interactions", data=botToken)`
2. Construa o objeto de contexto com todos os campos **exceto** `_token`.
3. Serialize com **chaves ordenadas** e **sem espaços** (o Gateway usa `JSON.stringify`
   com chaves ordenadas, que produz saída compacta).
4. Assine: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Adicione o digest hexadecimal resultante como `_token` no contexto.

Exemplo em Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"opencraft-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

Armadilhas comuns do HMAC:

- O `json.dumps` do Python adiciona espaços por padrão (`{"key": "val"}`). Use
  `separators=(",", ":")` para corresponder à saída compacta do JavaScript (`{"key":"val"}`).
- Sempre assine **todos** os campos do contexto (menos `_token`). O Gateway remove `_token` e depois
  assina tudo que resta. Assinar um subconjunto causa falha silenciosa de verificação.
- Use `sort_keys=True` -- o Gateway ordena as chaves antes de assinar, e o Mattermost pode
  reordenar campos do contexto ao armazenar o payload.
- Derive o segredo a partir do Token de Bot (determinístico), não de bytes aleatórios. O segredo
  deve ser o mesmo no processo que cria os botões e no Gateway que verifica.

## Adaptador de diretório

O Plugin Mattermost inclui um adaptador de diretório que resolve nomes de canais e usuários
via API do Mattermost. Isso habilita alvos `#channel-name` e `@username` em
`opencraft message send` e entregas de Cron/Webhook.

Nenhuma configuração é necessária -- o adaptador usa o Token de Bot da configuração da conta.

## Múltiplas contas

O Mattermost suporta múltiplas contas em `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Solução de problemas

- Sem respostas em canais: verifique se o Bot está no canal e mencione-o (oncall), use um prefixo gatilho (onchar) ou defina `chatmode: "onmessage"`.
- Erros de autenticação: verifique o Token de Bot, a URL base e se a conta está habilitada.
- Problemas com múltiplas contas: variáveis de ambiente aplicam-se apenas à conta `default`.
- Botões aparecem como caixas brancas: o agente pode estar enviando dados de botão malformados. Verifique se cada botão tem os campos `text` e `callback_data`.
- Botões renderizam mas cliques não fazem nada: verifique que `AllowedUntrustedInternalConnections` na configuração do servidor Mattermost inclui `127.0.0.1 localhost`, e que `EnablePostActionIntegration` é `true` em ServiceSettings.
- Botões retornam 404 ao clicar: o `id` do botão provavelmente contém hífens ou underscores. O roteador de ações do Mattermost quebra com IDs não alfanuméricos. Use apenas `[a-zA-Z0-9]`.
- Logs do Gateway mostram `invalid _token`: incompatibilidade de HMAC. Verifique se você assina todos os campos do contexto (não um subconjunto), usa chaves ordenadas e usa JSON compacto (sem espaços). Veja a seção HMAC acima.
- Logs do Gateway mostram `missing _token in context`: o campo `_token` não está no contexto do botão. Certifique-se de que está incluído ao construir o payload de integração.
- Confirmação mostra ID bruto em vez do nome do botão: `context.action_id` não corresponde ao `id` do botão. Defina ambos com o mesmo valor sanitizado.
- Agente não sabe sobre botões: adicione `capabilities: ["inlineButtons"]` à configuração do canal Mattermost.
