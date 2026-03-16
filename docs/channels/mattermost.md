---
summary: "Configuração do bot Mattermost e config do OpenCraft"
read_when:
  - Configurando o Mattermost
  - Depurando roteamento do Mattermost
title: "Mattermost"
---

# Mattermost (plugin)

Status: suportado via plugin (token de bot + eventos WebSocket). Canais, grupos e DMs são suportados.
O Mattermost é uma plataforma de mensagens para equipes self-hostável; veja o site oficial em
[mattermost.com](https://mattermost.com) para detalhes do produto e downloads.

## Plugin necessário

O Mattermost vem como plugin e não está incluído na instalação principal.

Instalar via CLI (registro npm):

```bash
opencraft plugins install @openclaw/mattermost
```

Checkout local (quando executando a partir de um repositório git):

```bash
opencraft plugins install ./extensions/mattermost
```

Se você escolher Mattermost durante configure/onboarding e um checkout git for detectado,
o OpenCraft oferecerá o caminho de instalação local automaticamente.

Detalhes: [Plugins](/tools/plugin)

## Configuração rápida

1. Instale o plugin Mattermost.
2. Crie uma conta de bot no Mattermost e copie o **token do bot**.
3. Copie a **URL base** do Mattermost (ex.: `https://chat.example.com`).
4. Configure o OpenCraft e inicie o gateway.

Config mínima:

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

## Slash commands nativos

Slash commands nativos são opt-in. Quando habilitados, o OpenCraft registra slash commands `oc_*` via
a API do Mattermost e recebe callback POSTs no servidor HTTP do gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use quando o Mattermost não puder alcançar o gateway diretamente (proxy reverso/URL pública).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Notas:

- `native: "auto"` padrão é desabilitado para o Mattermost. Defina `native: true` para habilitar.
- Se `callbackUrl` for omitido, o OpenCraft deriva um a partir do host/porta do gateway + `callbackPath`.
- Para configurações com múltiplas contas, `commands` pode ser definido no nível superior ou em
  `channels.mattermost.accounts.<id>.commands` (valores de conta substituem campos de nível superior).
- Callbacks de comando são validados com tokens por comando e falham fechados quando as verificações de token falham.
- Requisito de acessibilidade: o endpoint de callback deve ser acessível a partir do servidor Mattermost.
  - Não defina `callbackUrl` como `localhost` a menos que o Mattermost execute no mesmo host/namespace de rede que o OpenCraft.
  - Não defina `callbackUrl` como sua URL base do Mattermost a menos que essa URL faça proxy reverso de `/api/channels/mattermost/command` para o OpenCraft.
  - Uma verificação rápida é `curl https://<gateway-host>/api/channels/mattermost/command`; um GET deve retornar `405 Method Not Allowed` do OpenCraft, não `404`.
- Requisito de allowlist de egresso do Mattermost:
  - Se o callback tem como alvo endereços privados/tailnet/internos, defina
    `ServiceSettings.AllowedUntrustedInternalConnections` do Mattermost para incluir o host/domínio do callback.
  - Use entradas de host/domínio, não URLs completas.
    - Bom: `gateway.tailnet-name.ts.net`
    - Ruim: `https://gateway.tailnet-name.ts.net`

## Variáveis de ambiente (conta padrão)

Defina no host gateway se preferir variáveis de ambiente:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Variáveis de ambiente se aplicam apenas à conta **padrão** (`default`). Outras contas devem usar valores de config.

## Modos de chat

O Mattermost responde a DMs automaticamente. O comportamento de canal é controlado por `chatmode`:

- `oncall` (padrão): responde apenas quando @mencionado em canais.
- `onmessage`: responde a cada mensagem de canal.
- `onchar`: responde quando uma mensagem começa com um prefixo de gatilho.

Exemplo de config:

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

- `onchar` ainda responde a @menções explícitas.
- `channels.mattermost.requireMention` é respeitado para configs legadas, mas `chatmode` é preferido.

## Threading e sessões

Use `channels.mattermost.replyToMode` para controlar se as respostas de canal e grupo ficam no
canal principal ou iniciam uma thread sob o post que as acionou.

- `off` (padrão): apenas responde em uma thread quando o post de entrada já está em uma.
- `first`: para posts de canal/grupo de nível superior, inicia uma thread sob aquele post e roteia a
  conversa para uma sessão com escopo de thread.
- `all`: mesmo comportamento que `first` para o Mattermost atualmente.
- Mensagens diretas ignoram esta configuração e permanecem sem thread.

Exemplo de config:

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

- Sessões com escopo de thread usam o id do post acionador como raiz da thread.
- `first` e `all` são atualmente equivalentes porque uma vez que o Mattermost tem uma raiz de thread,
  blocos de acompanhamento e mídia continuam naquela mesma thread.

## Controle de acesso (DMs)

- Padrão: `channels.mattermost.dmPolicy = "pairing"` (remetentes desconhecidos recebem um código de pareamento).
- Aprovar via:
  - `opencraft pairing list mattermost`
  - `opencraft pairing approve mattermost <CÓDIGO>`
- DMs públicos: `channels.mattermost.dmPolicy="open"` mais `channels.mattermost.allowFrom=["*"]`.

## Canais (grupos)

- Padrão: `channels.mattermost.groupPolicy = "allowlist"` (controle por menção).
- Adicione remetentes à allowlist com `channels.mattermost.groupAllowFrom` (IDs de usuário recomendados).
- Correspondência de `@username` é mutável e habilitada apenas quando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canais abertos: `channels.mattermost.groupPolicy="open"` (controle por menção).
- Nota de runtime: se `channels.mattermost` estiver completamente ausente, o runtime recorre a `groupPolicy="allowlist"` para verificações de grupo (mesmo se `channels.defaults.groupPolicy` estiver definido).

## Alvos para entrega de saída

Use estes formatos de alvo com `opencraft message send` ou entregas via cron/webhooks:

- `channel:<id>` para um canal
- `user:<id>` para um DM
- `@username` para um DM (resolvido via API do Mattermost)

IDs opacos bare (como `64ifufp...`) são **ambíguos** no Mattermost (ID de usuário vs ID de canal).

O OpenCraft os resolve **usuário primeiro**:

- Se o ID existe como usuário (`GET /api/v4/users/<id>` bem-sucedido), o OpenCraft envia um **DM** resolvendo o canal direto via `/api/v4/channels/direct`.
- Caso contrário, o ID é tratado como um **ID de canal**.

Se precisar de comportamento determinístico, sempre use os prefixos explícitos (`user:<id>` / `channel:<id>`).

## Reações (ferramenta de mensagem)

- Use `message action=react` com `channel=mattermost`.
- `messageId` é o id do post Mattermost.
- `emoji` aceita nomes como `thumbsup` ou `:+1:` (dois-pontos são opcionais).
- Defina `remove=true` (booleano) para remover uma reação.
- Eventos de adição/remoção de reação são encaminhados como eventos do sistema para a sessão de agente roteada.

Exemplos:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Config:

- `channels.mattermost.actions.reactions`: habilitar/desabilitar ações de reação (padrão true).
- Substituição por conta: `channels.mattermost.accounts.<id>.actions.reactions`.

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
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Sim","callback_data":"yes"},{"text":"Não","callback_data":"no"}]]
```

Campos do botão:

- `text` (obrigatório): rótulo de exibição.
- `callback_data` (obrigatório): valor enviado de volta ao clicar (usado como ID da ação).
- `style` (opcional): `"default"`, `"primary"` ou `"danger"`.

Quando um usuário clica em um botão:

1. Todos os botões são substituídos por uma linha de confirmação (ex.: "✓ **Sim** selecionado por @user").
2. O agente recebe a seleção como uma mensagem de entrada e responde.

Notas:

- Callbacks de botão usam verificação HMAC-SHA256 (automática, sem config necessária).
- O Mattermost remove os dados de callback de suas respostas de API (recurso de segurança), então todos os botões
  são removidos ao clicar — remoção parcial não é possível.
- IDs de ação contendo hífens ou underscores são sanitizados automaticamente
  (limitação de roteamento do Mattermost).

Config:

- `channels.mattermost.capabilities`: array de strings de capacidade. Adicione `"inlineButtons"` para
  habilitar a descrição da ferramenta de botões no system prompt do agente.
- `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para callbacks de botão
  (por exemplo `https://gateway.example.com`). Use quando o Mattermost não puder
  alcançar o gateway em seu host de bind diretamente.
- Em configurações com múltiplas contas, você também pode definir o mesmo campo em
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Se `interactions.callbackBaseUrl` for omitido, o OpenCraft deriva a URL de callback de
  `gateway.customBindHost` + `gateway.port`, e então recorre a `http://localhost:<port>`.
- Regra de acessibilidade: a URL de callback do botão deve ser acessível pelo servidor Mattermost.
  `localhost` só funciona quando o Mattermost e o OpenCraft executam no mesmo host/namespace de rede.
- Se o alvo do callback for privado/tailnet/interno, adicione seu host/domínio ao
  `ServiceSettings.AllowedUntrustedInternalConnections` do Mattermost.

### Integração direta com API (scripts externos)

Scripts externos e webhooks podem postar botões diretamente via REST API do Mattermost
em vez de passar pela ferramenta `message` do agente. Use `buildButtonAttachments()` da
extensão quando possível; se postando JSON bruto, siga estas regras:

**Estrutura do payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Escolha uma opção:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // apenas alfanumérico — veja abaixo
            type: "button", // obrigatório, ou cliques são silenciosamente ignorados
            name: "Aprovar", // rótulo de exibição
            style: "primary", // opcional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // deve corresponder ao id do botão (para pesquisa de nome)
                action: "approve",
                // ... quaisquer campos personalizados ...
                _token: "<hmac>", // veja a seção HMAC abaixo
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

1. Os anexos ficam em `props.attachments`, não em `attachments` de nível superior (silenciosamente ignorado).
2. Toda ação precisa de `type: "button"` — sem isso, cliques são descartados silenciosamente.
3. Toda ação precisa de um campo `id` — o Mattermost ignora ações sem IDs.
4. O `id` da ação deve ser **apenas alfanumérico** (`[a-zA-Z0-9]`). Hífens e underscores quebram
   o roteamento de ação server-side do Mattermost (retorna 404). Remova-os antes de usar.
5. `context.action_id` deve corresponder ao `id` do botão para que a mensagem de confirmação mostre o
   nome do botão (ex.: "Aprovar") em vez de um ID bruto.
6. `context.action_id` é obrigatório — o handler de interação retorna 400 sem ele.

**Geração de token HMAC:**

O gateway verifica cliques de botão com HMAC-SHA256. Scripts externos devem gerar tokens
que correspondam à lógica de verificação do gateway:

1. Derive o segredo a partir do token do bot:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Construa o objeto de contexto com todos os campos **exceto** `_token`.
3. Serialize com **chaves ordenadas** e **sem espaços** (o gateway usa `JSON.stringify`
   com chaves ordenadas, que produz saída compacta).
4. Assine: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Adicione o digest hex resultante como `_token` no contexto.

Exemplo Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
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
- Sempre assine **todos** os campos de contexto (menos `_token`). O gateway remove `_token` e depois
  assina tudo restante. Assinar um subconjunto causa falha silenciosa de verificação.
- Use `sort_keys=True` — o gateway ordena as chaves antes de assinar, e o Mattermost pode
  reordenar os campos de contexto ao armazenar o payload.
- Derive o segredo a partir do token do bot (determinístico), não de bytes aleatórios. O segredo
  deve ser o mesmo entre o processo que cria botões e o gateway que verifica.

## Adaptador de diretório

O plugin Mattermost inclui um adaptador de diretório que resolve nomes de canal e usuário
via API do Mattermost. Isso habilita alvos `#nome-do-canal` e `@username` em
`opencraft message send` e entregas via cron/webhook.

Nenhuma configuração é necessária — o adaptador usa o token do bot a partir da config da conta.

## Múltiplas contas

O Mattermost suporta múltiplas contas em `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Principal", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alertas", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Solução de problemas

- Sem respostas em canais: certifique-se de que o bot está no canal e mencione-o (oncall), use um prefixo de gatilho (onchar) ou defina `chatmode: "onmessage"`.
- Erros de autenticação: verifique o token do bot, a URL base e se a conta está habilitada.
- Problemas com múltiplas contas: variáveis de ambiente se aplicam apenas à conta `default`.
- Botões aparecem como caixas brancas: o agente pode estar enviando dados de botão malformados. Verifique se cada botão tem os campos `text` e `callback_data`.
- Botões renderizam mas cliques não funcionam: verifique `AllowedUntrustedInternalConnections` na config do servidor Mattermost inclui `127.0.0.1 localhost`, e que `EnablePostActionIntegration` é `true` em ServiceSettings.
- Botões retornam 404 ao clicar: o `id` do botão provavelmente contém hífens ou underscores. O roteador de ação do Mattermost quebra em IDs não-alfanuméricos. Use apenas `[a-zA-Z0-9]`.
- Gateway registra `invalid _token`: incompatibilidade HMAC. Verifique se você assina todos os campos de contexto (não um subconjunto), usa chaves ordenadas e JSON compacto (sem espaços). Veja a seção HMAC acima.
- Gateway registra `missing _token in context`: o campo `_token` não está no contexto do botão. Certifique-se de que está incluído ao construir o payload de integração.
- Confirmação mostra ID bruto em vez do nome do botão: `context.action_id` não corresponde ao `id` do botão. Defina ambos para o mesmo valor sanitizado.
- Agente não conhece os botões: adicione `capabilities: ["inlineButtons"]` à config do canal Mattermost.
