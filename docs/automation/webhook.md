---
summary: "Ingresso de Webhook para wake e execuções isoladas de agente"
read_when:
  - Adicionando ou alterando endpoints de Webhook
  - Conectando sistemas externos ao OpenCraft
title: "Webhooks"
---

# Webhooks

O Gateway pode expor um pequeno endpoint HTTP de Webhook para gatilhos externos.

## Habilitar

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    // Opcional: restringir roteamento explícito de `agentId` a esta lista de permissão.
    // Omita ou inclua "*" para permitir qualquer agente.
    // Defina [] para negar todo roteamento explícito de `agentId`.
    allowedAgentIds: ["hooks", "main"],
  },
}
```

Notas:

- `hooks.token` é obrigatório quando `hooks.enabled=true`.
- `hooks.path` padrão é `/hooks`.

## Autenticação

Toda requisição deve incluir o Token de hook. Prefira cabeçalhos:

- `Authorization: Bearer <token>` (recomendado)
- `x-opencraft-token: <token>`
- Tokens em query-string são rejeitados (`?token=...` retorna `400`).

## Endpoints

### `POST /hooks/wake`

Payload:

```json
{ "text": "System line", "mode": "now" }
```

- `text` **obrigatório** (string): A descrição do evento (ex., "New email received").
- `mode` opcional (`now` | `next-heartbeat`): Se deve disparar um heartbeat imediato (padrão `now`) ou esperar a próxima verificação periódica.

Efeito:

- Enfileira um evento do sistema para a sessão **principal**
- Se `mode=now`, dispara um heartbeat imediato

### `POST /hooks/agent`

Payload:

```json
{
  "message": "Run this",
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
- `name` opcional (string): Nome legível do hook (ex., "GitHub"), usado como prefixo em resumos de sessão.
- `agentId` opcional (string): Rotear este hook para um agente específico. IDs desconhecidos recorrem ao agente padrão. Quando definido, o hook executa usando o workspace e configuração do agente resolvido.
- `sessionKey` opcional (string): A chave usada para identificar a sessão do agente. Por padrão, este campo é rejeitado a menos que `hooks.allowRequestSessionKey=true`.
- `wakeMode` opcional (`now` | `next-heartbeat`): Se deve disparar um heartbeat imediato (padrão `now`) ou esperar a próxima verificação periódica.
- `deliver` opcional (booleano): Se `true`, a resposta do agente será enviada para o canal de mensagens. Padrão é `true`. Respostas que são apenas confirmações de heartbeat são automaticamente puladas.
- `channel` opcional (string): O canal de mensagens para entrega. Um de: `last`, `whatsapp`, `telegram`, `discord`, `slack`, `mattermost` (Plugin), `signal`, `imessage`, `msteams`. Padrão é `last`.
- `to` opcional (string): O identificador do destinatário para o canal (ex., número de telefone para WhatsApp/Signal, ID do chat para Telegram, ID do canal para Discord/Slack/Mattermost (Plugin), ID da conversa para MS Teams). Padrão é o último destinatário na sessão principal.
- `model` opcional (string): Sobrescrita de modelo (ex., `anthropic/claude-3-5-sonnet` ou um alias). Deve estar na lista de modelos permitidos se restrito.
- `thinking` opcional (string): Sobrescrita de nível de pensamento (ex., `low`, `medium`, `high`).
- `timeoutSeconds` opcional (número): Duração máxima para a execução do agente em segundos.

Efeito:

- Executa uma rodada de agente **isolada** (chave de sessão própria)
- Sempre publica um resumo na sessão **principal**
- Se `wakeMode=now`, dispara um heartbeat imediato

## Política de chave de sessão (mudança incompatível)

Sobrescritas de `sessionKey` no payload de `/hooks/agent` estão desabilitadas por padrão.

- Recomendado: defina um `hooks.defaultSessionKey` fixo e mantenha sobrescritas de requisição desligadas.
- Opcional: permita sobrescritas de requisição apenas quando necessário, e restrinja prefixos.

Configuração recomendada:

```json5
{
  hooks: {
    enabled: true,
    token: "${OPENCRAFT_HOOKS_TOKEN}",
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
  },
}
```

Configuração de compatibilidade (comportamento legado):

```json5
{
  hooks: {
    enabled: true,
    token: "${OPENCRAFT_HOOKS_TOKEN}",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:"], // fortemente recomendado
  },
}
```

### `POST /hooks/<name>` (mapeado)

Nomes de hook personalizados são resolvidos via `hooks.mappings` (veja configuração). Um mapeamento pode
transformar payloads arbitrários em ações `wake` ou `agent`, com templates opcionais ou
transformações de código.

Opções de mapeamento (resumo):

- `hooks.presets: ["gmail"]` habilita o mapeamento integrado do Gmail.
- `hooks.mappings` permite definir `match`, `action` e templates na configuração.
- `hooks.transformsDir` + `transform.module` carrega um módulo JS/TS para lógica personalizada.
  - `hooks.transformsDir` (se definido) deve permanecer dentro da raiz de transformações sob seu diretório de configuração do OpenCraft (tipicamente `~/.opencraft/hooks/transforms`).
  - `transform.module` deve resolver dentro do diretório efetivo de transformações (caminhos de travessia/escape são rejeitados).
- Use `match.source` para manter um endpoint genérico de ingestão (roteamento baseado em payload).
- Transformações TS requerem um loader TS (ex. `bun` ou `tsx`) ou `.js` pré-compilado em runtime.
- Defina `deliver: true` + `channel`/`to` nos mapeamentos para rotear respostas para uma superfície de chat
  (`channel` padrão é `last` e recorre ao WhatsApp).
- `agentId` roteia o hook para um agente específico; IDs desconhecidos recorrem ao agente padrão.
- `hooks.allowedAgentIds` restringe roteamento explícito de `agentId`. Omita (ou inclua `*`) para permitir qualquer agente. Defina `[]` para negar roteamento explícito de `agentId`.
- `hooks.defaultSessionKey` define a sessão padrão para execuções de agente de hook quando nenhuma chave explícita é fornecida.
- `hooks.allowRequestSessionKey` controla se payloads de `/hooks/agent` podem definir `sessionKey` (padrão: `false`).
- `hooks.allowedSessionKeyPrefixes` opcionalmente restringe valores explícitos de `sessionKey` de payloads de requisição e mapeamentos.
- `allowUnsafeExternalContent: true` desabilita o wrapper de segurança de conteúdo externo para aquele hook
  (perigoso; somente para fontes internas confiáveis).
- `opencraft webhooks gmail setup` escreve a configuração `hooks.gmail` para `opencraft webhooks gmail run`.
  Veja [Gmail Pub/Sub](/automation/gmail-pubsub) para o fluxo completo de watch do Gmail.

## Respostas

- `200` para `/hooks/wake`
- `200` para `/hooks/agent` (execução assíncrona aceita)
- `401` em falha de autenticação
- `429` após falhas repetidas de autenticação do mesmo cliente (verifique `Retry-After`)
- `400` em payload inválido
- `413` em payloads muito grandes

## Exemplos

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-opencraft-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","wakeMode":"next-heartbeat"}'
```

### Usar um modelo diferente

Adicione `model` ao payload do agente (ou mapeamento) para sobrescrever o modelo para aquela execução:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-opencraft-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.2-mini"}'
```

Se você impõe `agents.defaults.models`, certifique-se de que o modelo de sobrescrita está incluído lá.

```bash
curl -X POST http://127.0.0.1:18789/hooks/gmail \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"source":"gmail","messages":[{"from":"Ada","subject":"Hello","snippet":"Hi"}]}'
```

## Segurança

- Mantenha endpoints de hook atrás de loopback, tailnet, ou proxy reverso confiável.
- Use um Token de hook dedicado; não reutilize Tokens de autenticação do Gateway.
- Falhas repetidas de autenticação são limitadas por taxa por endereço de cliente para retardar tentativas de força bruta.
- Se você usa roteamento multi-agente, defina `hooks.allowedAgentIds` para limitar a seleção explícita de `agentId`.
- Mantenha `hooks.allowRequestSessionKey=false` a menos que você precise de sessões selecionadas pelo chamador.
- Se você habilitar `sessionKey` de requisição, restrinja `hooks.allowedSessionKeyPrefixes` (por exemplo, `["hook:"]`).
- Evite incluir payloads brutos sensíveis em logs de Webhook.
- Payloads de hook são tratados como não confiáveis e envolvidos com limites de segurança por padrão.
  Se você precisar desabilitar isso para um hook específico, defina `allowUnsafeExternalContent: true`
  no mapeamento daquele hook (perigoso).
