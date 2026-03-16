---
summary: "Exponha um endpoint HTTP /v1/responses compatível com OpenResponses do Gateway"
read_when:
  - Integrando clientes que falam a API OpenResponses
  - Você quer inputs baseados em itens, chamadas de tool do cliente ou eventos SSE
title: "OpenResponses API"
---

# OpenResponses API (HTTP)

O Gateway do OpenCraft pode servir um endpoint `POST /v1/responses` compatível com OpenResponses.

Este endpoint está **desabilitado por padrão**. Habilite-o na config primeiro.

- `POST /v1/responses`
- Mesma porta que o Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Internamente, as requisições são executadas como um run normal de agente do Gateway (mesmo caminho de código que
`opencraft agent`), então roteamento/permissões/config correspondem ao seu Gateway.

## Autenticação, segurança e roteamento

O comportamento operacional corresponde ao [OpenAI Chat Completions](/gateway/openai-http-api):

- use `Authorization: Bearer <token>` com a config de auth normal do Gateway
- trate o endpoint como acesso total ao operador para a instância do gateway
- selecione agentes com `model: "openclaw:<agentId>"`, `model: "agent:<agentId>"`, ou `x-openclaw-agent-id`
- use `x-openclaw-session-key` para roteamento explícito de sessão

Habilite ou desabilite este endpoint com `gateway.http.endpoints.responses.enabled`.

## Comportamento de sessão

Por padrão o endpoint é **stateless por requisição** (uma nova chave de sessão é gerada a cada chamada).

Se a requisição incluir uma string `user` do OpenResponses, o Gateway deriva uma chave de sessão estável
a partir dela, para que chamadas repetidas possam compartilhar uma sessão do agente.

## Formato da requisição (suportado)

A requisição segue a API OpenResponses com input baseado em itens. Suporte atual:

- `input`: string ou array de objetos de item.
- `instructions`: mesclado ao system prompt.
- `tools`: definições de tools do cliente (ferramentas de função).
- `tool_choice`: filtrar ou exigir tools do cliente.
- `stream`: habilita streaming SSE.
- `max_output_tokens`: limite de saída best-effort (dependente do provedor).
- `user`: roteamento estável de sessão.

Aceitos mas **atualmente ignorados**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `previous_response_id`
- `truncation`

## Itens (input)

### `message`

Roles: `system`, `developer`, `user`, `assistant`.

- `system` e `developer` são adicionados ao system prompt.
- O item `user` ou `function_call_output` mais recente torna-se a "mensagem atual."
- Mensagens user/assistant anteriores são incluídas como histórico para contexto.

### `function_call_output` (tools baseadas em turno)

Envie resultados de tool de volta ao modelo:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"22C\"}"
}
```

### `reasoning` e `item_reference`

Aceitos por compatibilidade de schema mas ignorados ao construir o prompt.

## Tools (ferramentas de função do lado do cliente)

Forneça tools com `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Se o agente decidir chamar uma tool, a resposta retorna um item de saída `function_call`.
Você então envia uma requisição de acompanhamento com `function_call_output` para continuar o turno.

## Imagens (`input_image`)

Suporta fontes base64 ou URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Tipos MIME permitidos (atual): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Tamanho máximo (atual): 10MB.

## Arquivos (`input_file`)

Suporta fontes base64 ou URL:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

Tipos MIME permitidos (atual): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Tamanho máximo (atual): 5MB.

Comportamento atual:

- O conteúdo do arquivo é decodificado e adicionado ao **system prompt**, não à mensagem do usuário,
  para que permaneça efêmero (não persistido no histórico de sessão).
- PDFs são analisados para texto. Se pouco texto for encontrado, as primeiras páginas são rasterizadas
  em imagens e passadas ao modelo.

O parse de PDF usa o build legado `pdfjs-dist` compatível com Node (sem worker). O build moderno
do PDF.js espera workers/globals DOM do browser, então não é usado no Gateway.

Padrões de fetch de URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (total de partes `input_file` + `input_image` baseadas em URL por requisição)
- Requisições são guardadas (resolução DNS, bloqueio de IP privado, limites de redirect, timeouts).
- Allowlists de hostname opcionais são suportadas por tipo de input (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host exato: `"cdn.example.com"`
  - Subdomínios wildcard: `"*.assets.example.com"` (não corresponde ao apex)

## Limites de arquivo + imagem (config)

Os padrões podem ser ajustados em `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Padrões quando omitidos:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4.000.000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- Fontes `input_image` HEIC/HEIF são aceitas e normalizadas para JPEG antes da entrega ao provedor.

Nota de segurança:

- Allowlists de URL são aplicadas antes do fetch e em hops de redirect.
- Colocar um hostname na allowlist não bypassa o bloqueio de IP privado/interno.
- Para gateways expostos à internet, aplique controles de egress de rede além dos guardas no nível da aplicação.
  Veja [Segurança](/gateway/security).

## Streaming (SSE)

Defina `stream: true` para receber Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Cada linha de evento é `event: <type>` e `data: <json>`
- Stream termina com `data: [DONE]`

Tipos de evento atualmente emitidos:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (em caso de erro)

## Uso

`usage` é populado quando o provedor subjacente reporta contagens de tokens.

## Erros

Erros usam um objeto JSON como:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Casos comuns:

- `401` auth ausente/inválida
- `400` corpo de requisição inválido
- `405` método errado

## Exemplos

Sem streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "oi"
  }'
```

Com streaming:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "oi"
  }'
```
