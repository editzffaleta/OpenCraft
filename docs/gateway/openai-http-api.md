---
summary: "Expor um endpoint HTTP /v1/chat/completions compatível com OpenAI a partir do Gateway"
read_when:
  - Integrando ferramentas que esperam OpenAI Chat Completions
title: "OpenAI Chat Completions"
---

# OpenAI Chat Completions (HTTP)

O Gateway do OpenCraft pode servir um pequeno endpoint de Chat Completions compatível com OpenAI.

Este endpoint está **desabilitado por padrão**. Habilite-o na config primeiro.

- `POST /v1/chat/completions`
- Mesma porta que o Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

Por baixo, as requisições são executadas como uma execução normal de agente do Gateway (mesmo codepath que `opencraft agent`), então roteamento/permissões/config correspondem ao seu Gateway.

## Autenticação

Usa a configuração de auth do Gateway. Envie um bearer token:

- `Authorization: Bearer <token>`

Notas:

- Quando `gateway.auth.mode="token"`, use `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, use `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Se `gateway.auth.rateLimit` está configurado e muitas falhas de auth ocorrem, o endpoint retorna `429` com `Retry-After`.

## Limite de segurança (importante)

Trate este endpoint como uma superfície de **acesso completo de operador** para a instância do gateway.

- A auth de bearer HTTP aqui não é um modelo de escopo restrito por usuário.
- Um token/password de Gateway válido para este endpoint deve ser tratado como uma credencial de proprietário/operador.
- Requisições passam pelo mesmo caminho de agente do control-plane que ações confiáveis de operador.
- Não há um limite de ferramenta separado não-proprietário/por-usuário neste endpoint; uma vez que um chamador passa a auth do Gateway aqui, OpenCraft trata esse chamador como um operador confiável para este gateway.
- Se a política do agente alvo permite ferramentas sensíveis, este endpoint pode usá-las.
- Mantenha este endpoint em loopback/tailnet/ingress privado apenas; não o exponha diretamente à internet pública.

Veja [Security](/gateway/security) e [Remote access](/gateway/remote).

## Escolhendo um agente

Nenhum header customizado necessário: codifique o id do agente no campo `model` do OpenAI:

- `model: "opencraft:<agentId>"` (exemplo: `"opencraft:main"`, `"opencraft:beta"`)
- `model: "agent:<agentId>"` (alias)

Ou direcione um agente OpenCraft específico por header:

- `x-opencraft-agent-id: <agentId>` (padrão: `main`)

Avançado:

- `x-opencraft-session-key: <sessionKey>` para controlar totalmente o roteamento de sessão.

## Habilitando o endpoint

Defina `gateway.http.endpoints.chatCompletions.enabled` como `true`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## Desabilitando o endpoint

Defina `gateway.http.endpoints.chatCompletions.enabled` como `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Comportamento de sessão

Por padrão o endpoint é **stateless por requisição** (uma nova chave de sessão é gerada a cada chamada).

Se a requisição inclui uma string `user` do OpenAI, o Gateway deriva uma chave de sessão estável a partir dela, para que chamadas repetidas possam compartilhar uma sessão de agente.

## Streaming (SSE)

Defina `stream: true` para receber Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Cada linha de evento é `data: <json>`
- Stream termina com `data: [DONE]`

## Exemplos

Sem streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-opencraft-agent-id: main' \
  -d '{
    "model": "opencraft",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Com streaming:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-opencraft-agent-id: main' \
  -d '{
    "model": "opencraft",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```
