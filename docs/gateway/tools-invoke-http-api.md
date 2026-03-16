---
summary: "Invoque uma única tool diretamente via endpoint HTTP do Gateway"
read_when:
  - Chamando tools sem rodar um turno completo do agente
  - Construindo automações que precisam de aplicação de política de tool
title: "Tools Invoke API"
---

# Tools Invoke (HTTP)

O Gateway do OpenCraft expõe um endpoint HTTP simples para invocar uma única tool diretamente. Ele está sempre habilitado, mas portado por auth do Gateway e política de tool.

- `POST /tools/invoke`
- Mesma porta que o Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

O tamanho máximo de payload padrão é 2 MB.

## Autenticação

Usa a configuração de auth do Gateway. Envie um bearer token:

- `Authorization: Bearer <token>`

Notas:

- Quando `gateway.auth.mode="token"`, use `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, use `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Se `gateway.auth.rateLimit` estiver configurado e muitas falhas de auth ocorrerem, o endpoint retorna `429` com `Retry-After`.

## Corpo da requisição

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Campos:

- `tool` (string, obrigatório): nome da tool a invocar.
- `action` (string, opcional): mapeado nos args se o schema da tool suporta `action` e o payload de args o omitiu.
- `args` (objeto, opcional): argumentos específicos da tool.
- `sessionKey` (string, opcional): chave de sessão alvo. Se omitida ou `"main"`, o Gateway usa a chave de sessão main configurada (respeita `session.mainKey` e agente padrão, ou `global` em escopo global).
- `dryRun` (boolean, opcional): reservado para uso futuro; atualmente ignorado.

## Comportamento de política + roteamento

A disponibilidade de tool é filtrada pela mesma cadeia de política usada pelos agentes do Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- políticas de grupo (se a chave de sessão mapeia para um grupo ou canal)
- política de subagente (ao invocar com uma chave de sessão de subagente)

Se uma tool não é permitida pela política, o endpoint retorna **404**.

O HTTP do Gateway também aplica uma lista de negação rígida por padrão (mesmo que a política de sessão permita a tool):

- `sessions_spawn`
- `sessions_send`
- `gateway`
- `whatsapp_login`

Você pode personalizar esta lista de negação via `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Tools adicionais a bloquear via HTTP /tools/invoke
      deny: ["browser"],
      // Remover tools da lista de negação padrão
      allow: ["gateway"],
    },
  },
}
```

Para ajudar políticas de grupo a resolver contexto, você pode opcionalmente definir:

- `x-openclaw-message-channel: <channel>` (exemplo: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (quando múltiplas contas existem)

## Respostas

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (requisição inválida ou erro de input da tool)
- `401` → não autorizado
- `429` → rate-limited por auth (`Retry-After` definido)
- `404` → tool não disponível (não encontrada ou não na allowlist)
- `405` → método não permitido
- `500` → `{ ok: false, error: { type, message } }` (erro inesperado de execução de tool; mensagem sanitizada)

## Exemplo

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```
