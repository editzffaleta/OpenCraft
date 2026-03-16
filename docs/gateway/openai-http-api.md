---
summary: "Exponha um endpoint HTTP /v1/chat/completions compatível com OpenAI do Gateway"
read_when:
  - Integrando ferramentas que esperam OpenAI Chat Completions
title: "OpenAI Chat Completions"
---

# OpenAI Chat Completions (HTTP)

O Gateway do OpenCraft pode servir um pequeno endpoint de Chat Completions compatível com OpenAI.

Este endpoint está **desabilitado por padrão**. Habilite-o na config primeiro.

- `POST /v1/chat/completions`
- Mesma porta que o Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Internamente, as requisições são executadas como um run normal de agente do Gateway (mesmo caminho de código que `opencraft agent`), então roteamento/permissões/config correspondem ao seu Gateway.

## Autenticação

Usa a configuração de auth do Gateway. Envie um bearer token:

- `Authorization: Bearer <token>`

Notas:

- Quando `gateway.auth.mode="token"`, use `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, use `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Se `gateway.auth.rateLimit` estiver configurado e muitas falhas de auth ocorrerem, o endpoint retorna `429` com `Retry-After`.

## Fronteira de segurança (importante)

Trate este endpoint como uma superfície de **acesso total ao operador** para a instância do gateway.

- Auth bearer HTTP aqui não é um modelo de escopo estreito por usuário.
- Um token/senha válido do Gateway para este endpoint deve ser tratado como uma credencial de owner/operador.
- Requisições rodam pelo mesmo caminho de agente de plano de controle que ações de operador confiável.
- Não há fronteira de tool separada por usuário/não-owner neste endpoint; uma vez que um chamador passa a auth do Gateway aqui, o OpenCraft trata esse chamador como um operador confiável para este gateway.
- Se a política do agente alvo permite tools sensíveis, este endpoint pode usá-las.
- Mantenha este endpoint em loopback/tailnet/ingress privado; não o exponha diretamente à internet pública.

Veja [Segurança](/gateway/security) e [Acesso remoto](/gateway/remote).

## Escolhendo um agente

Sem headers customizados necessários: encode o id do agente no campo `model` do OpenAI:

- `model: "openclaw:<agentId>"` (exemplo: `"openclaw:main"`, `"openclaw:beta"`)
- `model: "agent:<agentId>"` (alias)

Ou direcione a um agente OpenCraft específico por header:

- `x-openclaw-agent-id: <agentId>` (padrão: `main`)

Avançado:

- `x-openclaw-session-key: <sessionKey>` para controle completo de roteamento de sessão.

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

Se a requisição incluir uma string `user` do OpenAI, o Gateway deriva uma chave de sessão estável a partir dela, para que chamadas repetidas possam compartilhar uma sessão do agente.

## Streaming (SSE)

Defina `stream: true` para receber Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Cada linha de evento é `data: <json>`
- Stream termina com `data: [DONE]`

## Exemplos

Sem streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "messages": [{"role":"user","content":"oi"}]
  }'
```

Com streaming:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "messages": [{"role":"user","content":"oi"}]
  }'
```
