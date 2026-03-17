---
summary: "Invocar uma única ferramenta diretamente via o endpoint HTTP do Gateway"
read_when:
  - Chamando ferramentas sem executar um turno completo de agente
  - Construindo automações que precisam de aplicação de política de ferramentas
title: "Tools Invoke API"
---

# Tools Invoke (HTTP)

O Gateway do OpenCraft expõe um endpoint HTTP simples para invocar uma única ferramenta diretamente. Ele está sempre habilitado, mas protegido por auth do Gateway e política de ferramentas.

- `POST /tools/invoke`
- Mesma porta que o Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/tools/invoke`

Tamanho máximo de payload padrão é 2 MB.

## Autenticação

Usa a configuração de auth do Gateway. Envie um bearer token:

- `Authorization: Bearer <token>`

Notas:

- Quando `gateway.auth.mode="token"`, use `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, use `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Se `gateway.auth.rateLimit` está configurado e muitas falhas de auth ocorrem, o endpoint retorna `429` com `Retry-After`.

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

- `tool` (string, obrigatório): nome da ferramenta a invocar.
- `action` (string, opcional): mapeado nos args se o schema da ferramenta suporta `action` e o payload de args o omitiu.
- `args` (objeto, opcional): argumentos específicos da ferramenta.
- `sessionKey` (string, opcional): chave de sessão alvo. Se omitido ou `"main"`, o Gateway usa a chave de sessão principal configurada (respeita `session.mainKey` e agente padrão, ou `global` no escopo global).
- `dryRun` (boolean, opcional): reservado para uso futuro; atualmente ignorado.

## Comportamento de política + roteamento

A disponibilidade de ferramentas é filtrada pela mesma cadeia de políticas usada por agentes do Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- políticas de grupo (se a chave de sessão mapeia para um grupo ou canal)
- política de subagente (ao invocar com uma chave de sessão de subagente)

Se uma ferramenta não é permitida pela política, o endpoint retorna **404**.

O Gateway HTTP também aplica uma lista de negação rígida por padrão (mesmo que a política de sessão permita a ferramenta):

- `sessions_spawn`
- `sessions_send`
- `gateway`
- `whatsapp_login`

Você pode customizar esta lista de negação via `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Ferramentas adicionais para bloquear via HTTP /tools/invoke
      deny: ["browser"],
      // Remover ferramentas da lista de negação padrão
      allow: ["gateway"],
    },
  },
}
```

Para ajudar políticas de grupo a resolver contexto, você pode opcionalmente definir:

- `x-opencraft-message-channel: <channel>` (exemplo: `slack`, `telegram`)
- `x-opencraft-account-id: <accountId>` (quando múltiplas contas existem)

## Respostas

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (requisição inválida ou erro de input de ferramenta)
- `401` → não autorizado
- `429` → rate-limited de auth (`Retry-After` definido)
- `404` → ferramenta não disponível (não encontrada ou não na allowlist)
- `405` → método não permitido
- `500` → `{ ok: false, error: { type, message } }` (erro inesperado de execução de ferramenta; mensagem sanitizada)

## Exemplo

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```
