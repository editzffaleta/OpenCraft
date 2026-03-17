---
summary: "Schemas TypeBox como fonte única de verdade para o protocolo do Gateway"
read_when:
  - Atualizando schemas de protocolo ou codegen
title: "TypeBox"
---

# TypeBox como fonte única de verdade do protocolo

Última atualização: 2026-01-10

TypeBox é uma biblioteca de schemas TypeScript-first. Nós a usamos para definir o **protocolo
WebSocket do Gateway** (handshake, requisição/resposta, eventos do servidor). Esses schemas
geram **validação em tempo de execução**, **exportação de JSON Schema** e **codegen Swift** para
o app macOS. Uma única fonte de verdade; todo o resto é gerado.

Se você quer o contexto de protocolo de nível mais alto, comece com
[Arquitetura do Gateway](/concepts/architecture).

## Modelo mental (30 segundos)

Toda mensagem WebSocket do Gateway é um dos três frames:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

O primeiro frame **deve** ser uma requisição `connect`. Depois disso, clientes podem chamar
métodos (ex. `health`, `send`, `chat.send`) e se inscrever em eventos (ex.
`presence`, `tick`, `agent`).

Fluxo de conexão (mínimo):

```
Cliente                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Métodos e eventos comuns:

| Categoria | Exemplos                                                  | Notas                                           |
| --------- | --------------------------------------------------------- | ----------------------------------------------- |
| Core      | `connect`, `health`, `status`                             | `connect` deve ser primeiro                     |
| Mensagens | `send`, `poll`, `agent`, `agent.wait`                     | efeitos colaterais precisam de `idempotencyKey` |
| Chat      | `chat.history`, `chat.send`, `chat.abort`, `chat.inject`  | WebChat usa estes                               |
| Sessões   | `sessions.list`, `sessions.patch`, `sessions.delete`      | administração de sessões                        |
| Nós       | `node.list`, `node.invoke`, `node.pair.*`                 | WebSocket do Gateway + ações de nó              |
| Eventos   | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown` | push do servidor                                |

A lista oficial vive em `src/gateway/server.ts` (`METHODS`, `EVENTS`).

## Onde os schemas ficam

- Fonte: `src/gateway/protocol/schema.ts`
- Validadores em tempo de execução (AJV): `src/gateway/protocol/index.ts`
- Handshake do servidor + dispatch de métodos: `src/gateway/server.ts`
- Cliente de nó: `src/gateway/client.ts`
- JSON Schema gerado: `dist/protocol.schema.json`
- Modelos Swift gerados: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline atual

- `pnpm protocol:gen`
  - escreve JSON Schema (draft-07) em `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - gera modelos Swift do Gateway
- `pnpm protocol:check`
  - executa ambos os geradores e verifica se a saída está commitada

## Como os schemas são usados em tempo de execução

- **Lado do servidor**: todo frame de entrada é validado com AJV. O handshake só
  aceita uma requisição `connect` cujos params correspondam a `ConnectParams`.
- **Lado do cliente**: o cliente JS valida frames de evento e resposta antes
  de usá-los.
- **Superfície de métodos**: o Gateway anuncia os `methods` e
  `events` suportados no `hello-ok`.

## Frames de exemplo

Connect (primeira mensagem):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 2,
    "maxProtocol": 2,
    "client": {
      "id": "opencraft-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

Resposta hello-ok:

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 2,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Requisição + resposta:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Evento:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Cliente mínimo (Node.js)

Menor fluxo útil: connect + health.

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

## Exemplo prático: adicionar um método de ponta a ponta

Exemplo: adicionar uma nova requisição `system.echo` que retorna `{ ok: true, text }`.

1. **Schema (fonte de verdade)**

Adicione em `src/gateway/protocol/schema.ts`:

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

Adicione ambos ao `ProtocolSchemas` e exporte os tipos:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validação**

Em `src/gateway/protocol/index.ts`, exporte um validador AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Comportamento do servidor**

Adicione um handler em `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Registre-o em `src/gateway/server-methods.ts` (já mescla `systemHandlers`),
depois adicione `"system.echo"` a `METHODS` em `src/gateway/server.ts`.

4. **Regenerar**

```bash
pnpm protocol:check
```

5. **Testes + documentação**

Adicione um teste de servidor em `src/gateway/server.*.test.ts` e documente o método nos docs.

## Comportamento do codegen Swift

O gerador Swift emite:

- Enum `GatewayFrame` com cases `req`, `res`, `event` e `unknown`
- Structs/enums de payload fortemente tipados
- Valores de `ErrorCode` e `GATEWAY_PROTOCOL_VERSION`

Tipos de frame desconhecidos são preservados como payloads brutos para compatibilidade futura.

## Versionamento + compatibilidade

- `PROTOCOL_VERSION` vive em `src/gateway/protocol/schema.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita incompatibilidades.
- Os modelos Swift mantêm tipos de frame desconhecidos para evitar quebrar clientes mais antigos.

## Padrões e convenções de schema

- A maioria dos objetos usa `additionalProperties: false` para payloads estritos.
- `NonEmptyString` é o padrão para IDs e nomes de método/evento.
- O `GatewayFrame` de nível superior usa um **discriminador** em `type`.
- Métodos com efeitos colaterais geralmente requerem um `idempotencyKey` nos params
  (exemplo: `send`, `poll`, `agent`, `chat.send`).
- `agent` aceita `internalEvents` opcional para contexto de orquestração gerado em tempo de execução
  (por exemplo, handoff de conclusão de sub-agente/cron); trate isso como superfície de API interna.

## JSON Schema ao vivo

O JSON Schema gerado está no repositório em `dist/protocol.schema.json`. O
arquivo bruto publicado está tipicamente disponível em:

- [https://raw.githubusercontent.com/editzffaleta/OpenCraft/main/dist/protocol.schema.json](https://raw.githubusercontent.com/editzffaleta/OpenCraft/main/dist/protocol.schema.json)

## Quando você alterar schemas

1. Atualize os schemas TypeBox.
2. Execute `pnpm protocol:check`.
3. Comite o schema regenerado + modelos Swift.
