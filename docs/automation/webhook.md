---
summary: "Ingress de webhook para wake e execuções isoladas do agente"
read_when:
  - Adicionando ou alterando endpoints de webhook
  - Conectando sistemas externos ao OpenCraft
title: "Webhooks"
---

# Webhooks

O Gateway pode expor um pequeno endpoint HTTP de webhook para triggers externos.

## Habilitar

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    // Opcional: restringir roteamento explícito de `agentId` a esta allowlist.
    // Omita ou inclua "*" para permitir qualquer agente.
    // Defina [] para negar todo roteamento explícito de `agentId`.
    allowedAgentIds: ["hooks", "main"],
  },
}
```

Notas:

- `hooks.token` é obrigatório quando `hooks.enabled=true`.
- `hooks.path` padrão para `/hooks`.

## Auth

Cada requisição deve incluir o token de hook. Prefira headers:

- `Authorization: Bearer <token>` (recomendado)
- `x-openclaw-token: <token>`
- Tokens em query-string são rejeitados (`?token=...` retorna `400`).

## Endpoints

### `POST /hooks/wake`

Payload:

```json
{ "text": "Linha de sistema", "mode": "now" }
```

- `text` **obrigatório** (string): A descrição do evento (ex.: "Novo email recebido").
- `mode` opcional (`now` | `next-heartbeat`): Se deve acionar um heartbeat imediato (padrão `now`) ou aguardar a próxima verificação periódica.

Efeito:

- Enfileira um system event para a sessão **principal**
- Se `mode=now`, aciona um heartbeat imediato

### `POST /hooks/agent`

Payload:

```json
{
  "message": "Rodar isso",
  "name": "Email",
  "agentId": "hooks",
  "sessionKey": "hook:email:msg-123",
  "wakeMode": "now",
  "deliver": true,
  "channel": "last",
  "to": "+15551234567",
  "model": "openai/gpt-5.2-mini",
  "thinking": "low",
  "timeoutSeconds": 120
}
```

- `message` **obrigatório** (string): O prompt ou mensagem para o agente processar.
- `name` opcional (string): Nome legível para o hook (ex.: "GitHub"), usado como prefixo em resumos de sessão.
- `agentId` opcional (string): Roteie este hook para um agente específico. IDs desconhecidos fazem fallback para o agente padrão. Quando definido, o hook roda usando o workspace e configuração do agente resolvido.
- `sessionKey` opcional (string): A chave usada para identificar a sessão do agente. Por padrão este campo é rejeitado a menos que `hooks.allowRequestSessionKey=true`.
- `wakeMode` opcional (`now` | `next-heartbeat`): Se deve acionar um heartbeat imediato (padrão `now`) ou aguardar a próxima verificação periódica.
- `deliver` opcional (boolean): Se `true`, a resposta do agente será enviada para o canal de mensagens. Padrão `true`. Respostas que são apenas reconhecimentos de heartbeat são automaticamente puladas.
- `channel` opcional (string): O canal de mensagens para entrega. Um de: `last`, `whatsapp`, `telegram`, `discord`, `slack`, `mattermost` (plugin), `signal`, `imessage`, `msteams`. Padrão `last`.
- `to` opcional (string): O identificador do destinatário para o canal (ex.: número de telefone para WhatsApp/Signal, chat ID para Telegram, channel ID para Discord/Slack/Mattermost (plugin), conversation ID para MS Teams). Padrão para o último destinatário na sessão principal.
- `model` opcional (string): Override de modelo (ex.: `anthropic/claude-3-5-sonnet` ou um alias). Deve estar na lista de modelos permitidos se restrita.
- `thinking` opcional (string): Override de nível de thinking (ex.: `low`, `medium`, `high`).
- `timeoutSeconds` opcional (number): Duração máxima para a execução do agente em segundos.

Efeito:

- Roda um turno do agente **isolado** (própria session key)
- Sempre posta um resumo na sessão **principal**
- Se `wakeMode=now`, aciona um heartbeat imediato

## Política de session key (mudança de comportamento)

Overrides de `sessionKey` no payload de `/hooks/agent` são desabilitados por padrão.

- Recomendado: defina um `hooks.defaultSessionKey` fixo e mantenha overrides de requisição desabilitados.
- Opcional: permita overrides de requisição apenas quando necessário, e restrinja prefixos.

Config recomendada:

```json5
{
  hooks: {
    enabled: true,
    token: "${OPENCLAW_HOOKS_TOKEN}",
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
  },
}
```

Config de compatibilidade (comportamento legado):

```json5
{
  hooks: {
    enabled: true,
    token: "${OPENCLAW_HOOKS_TOKEN}",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:"], // fortemente recomendado
  },
}
```

### `POST /hooks/<name>` (mapeado)

Nomes de hook customizados são resolvidos via `hooks.mappings` (veja configuração). Um mapeamento pode
transformar payloads arbitrários em ações `wake` ou `agent`, com templates ou
transforms de código opcionais.

Opções de mapeamento (resumo):

- `hooks.presets: ["gmail"]` habilita o mapeamento Gmail embutido.
- `hooks.mappings` permite definir `match`, `action` e templates na config.
- `hooks.transformsDir` + `transform.module` carrega um módulo JS/TS para lógica customizada.
  - `hooks.transformsDir` (se definido) deve permanecer dentro da raiz de transforms no seu diretório de config do OpenCraft (tipicamente `~/.opencraft/hooks/transforms`).
  - `transform.module` deve resolver dentro do diretório de transforms efetivo (paths de travessia/escape são rejeitados).
- Use `match.source` para manter um endpoint de ingest genérico (roteamento orientado a payload).
- Transforms TS requerem um carregador TS (ex.: `bun` ou `tsx`) ou `.js` pré-compilado em runtime.
- Defina `deliver: true` + `channel`/`to` em mapeamentos para rotear respostas para uma superfície de chat
  (`channel` padrão para `last` e faz fallback para WhatsApp).
- `agentId` roteia o hook para um agente específico; IDs desconhecidos fazem fallback para o agente padrão.
- `hooks.allowedAgentIds` restringe roteamento explícito de `agentId`. Omita (ou inclua `*`) para permitir qualquer agente. Defina `[]` para negar roteamento explícito de `agentId`.
- `hooks.defaultSessionKey` define a sessão padrão para execuções de agente de hook quando nenhuma chave explícita é fornecida.
- `hooks.allowRequestSessionKey` controla se payloads de `/hooks/agent` podem definir `sessionKey` (padrão: `false`).
- `hooks.allowedSessionKeyPrefixes` opcionalmente restringe valores explícitos de `sessionKey` de payloads de requisição e mapeamentos.
- `allowUnsafeExternalContent: true` desabilita o wrapper de segurança de conteúdo externo para esse hook
  (perigoso; apenas para fontes internas confiáveis).
- `opencraft webhooks gmail setup` escreve config `hooks.gmail` para `opencraft webhooks gmail run`.
  Veja [Gmail Pub/Sub](/automation/gmail-pubsub) para o fluxo completo do Gmail watch.

## Respostas

- `200` para `/hooks/wake`
- `200` para `/hooks/agent` (execução assíncrona aceita)
- `401` em falha de auth
- `429` após falhas de auth repetidas do mesmo cliente (verifique `Retry-After`)
- `400` em payload inválido
- `413` em payloads muito grandes

## Exemplos

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"Novo email recebido","mode":"now"}'
```

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Resumir caixa de entrada","name":"Email","wakeMode":"next-heartbeat"}'
```

### Usar um modelo diferente

Adicione `model` ao payload do agente (ou mapeamento) para sobrescrever o modelo para essa execução:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Resumir caixa de entrada","name":"Email","model":"openai/gpt-5.2-mini"}'
```

Se você aplica `agents.defaults.models`, certifique-se de que o modelo de override está incluído lá.

```bash
curl -X POST http://127.0.0.1:18789/hooks/gmail \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"source":"gmail","messages":[{"from":"Ada","subject":"Olá","snippet":"Oi"}]}'
```

## Segurança

- Mantenha endpoints de hook atrás de loopback, tailnet, ou proxy reverso confiável.
- Use um token de hook dedicado; não reutilize tokens de auth do gateway.
- Falhas de auth repetidas são limitadas por taxa por endereço de cliente para desacelerar tentativas de força bruta.
- Se você usa roteamento multi-agente, defina `hooks.allowedAgentIds` para limitar seleção explícita de `agentId`.
- Mantenha `hooks.allowRequestSessionKey=false` a menos que você requeira sessões selecionadas pelo chamador.
- Se você habilitar `sessionKey` de requisição, restrinja `hooks.allowedSessionKeyPrefixes` (por exemplo, `["hook:"]`).
- Evite incluir payloads brutos sensíveis em logs de webhook.
- Payloads de hook são tratados como não confiáveis e envolvidos com limites de segurança por padrão.
  Se você precisar desabilitar isso para um hook específico, defina `allowUnsafeExternalContent: true`
  no mapeamento desse hook (perigoso).
