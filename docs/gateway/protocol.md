---
summary: "Protocolo WebSocket do Gateway: handshake, frames, versionamento"
read_when:
  - Implementando ou atualizando clientes WS do gateway
  - Depurando incompatibilidades de protocolo ou falhas de conexão
  - Regenerando schema/modelos do protocolo
title: "Protocolo do Gateway"
---

# Protocolo do gateway (WebSocket)

O protocolo WS do Gateway é o **único plano de controle + transporte de node** para
o OpenCraft. Todos os clientes (CLI, web UI, app macOS, nodes iOS/Android, nodes
headless) conectam via WebSocket e declaram seu **role** + **escopo** no
momento do handshake.

## Transporte

- WebSocket, frames de texto com payloads JSON.
- Primeiro frame **deve** ser uma requisição `connect`.

## Handshake (connect)

Gateway → Cliente (challenge pré-connect):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Cliente → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "pt-BR",
    "userAgent": "opencraft-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → Cliente:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

Quando um token de dispositivo é emitido, `hello-ok` também inclui:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

### Exemplo de node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "pt-BR",
    "userAgent": "opencraft-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Framing

- **Requisição**: `{type:"req", id, method, params}`
- **Resposta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

Métodos com efeitos colaterais exigem **chaves de idempotência** (veja schema).

## Roles + escopos

### Roles

- `operator` = cliente de plano de controle (CLI/UI/automação).
- `node` = host de capacidade (câmera/tela/canvas/system.run).

### Escopos (operator)

Escopos comuns:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`

O escopo do método é apenas o primeiro portão. Alguns slash commands acessados via
`chat.send` aplicam verificações mais rigorosas no nível de comando por cima. Por exemplo, escritas
persistentes `/config set` e `/config unset` exigem `operator.admin`.

### Caps/commands/permissions (node)

Nodes declaram claims de capacidade no momento do connect:

- `caps`: categorias de capacidade de alto nível.
- `commands`: allowlist de comandos para invoke.
- `permissions`: toggles granulares (ex. `screen.record`, `camera.capture`).

O Gateway trata esses como **claims** e aplica allowlists no lado do servidor.

## Presença

- `system-presence` retorna entradas chaveadas por identidade de dispositivo.
- Entradas de presença incluem `deviceId`, `roles` e `scopes` para que UIs possam mostrar uma única linha por dispositivo
  mesmo quando ele conecta como **operator** e **node**.

### Métodos auxiliares de node

- Nodes podem chamar `skills.bins` para buscar a lista atual de executáveis de skill
  para verificações de auto-allow.

### Métodos auxiliares de operator

- Operators podem chamar `tools.catalog` (`operator.read`) para buscar o catálogo de tools em runtime para um
  agente. A resposta inclui tools agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: owner do plugin quando `source="plugin"`
  - `optional`: se uma tool de plugin é opcional

## Aprovações de exec

- Quando uma requisição de exec precisa de aprovação, o gateway transmite `exec.approval.requested`.
- Clientes operator resolvem chamando `exec.approval.resolve` (requer escopo `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan` (canonical `argv`/`cwd`/`rawCommand`/metadados de sessão). Requisições sem `systemRunPlan` são rejeitadas.

## Versionamento

- `PROTOCOL_VERSION` fica em `src/gateway/protocol/schema.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita incompatibilidades.
- Schemas + modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Auth

- Se `OPENCLAW_GATEWAY_TOKEN` (ou `--token`) estiver definido, `connect.params.auth.token`
  deve corresponder ou o socket é fechado.
- Após o pareamento, o Gateway emite um **device token** escopado ao role + escopos da conexão.
  É retornado em `hello-ok.auth.deviceToken` e deve ser
  persistido pelo cliente para connects futuros.
- Device tokens podem ser rotacionados/revogados via `device.token.rotate` e
  `device.token.revoke` (requer escopo `operator.pairing`).
- Falhas de auth incluem `error.details.code` mais hints de recuperação:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem tentar uma nova tentativa limitada com um token por dispositivo em cache.
  - Se essa nova tentativa falhar, clientes devem parar loops automáticos de reconexão e exibir orientação de ação do operador.

## Identidade de dispositivo + pareamento

- Nodes devem incluir uma identidade de dispositivo estável (`device.id`) derivada de
  um fingerprint de keypair.
- Gateways emitem tokens por dispositivo + role.
- Aprovações de pareamento são necessárias para novos IDs de dispositivo a menos que auto-aprovação
  local esteja habilitada.
- Conexões **locais** incluem loopback e o próprio endereço tailnet do host do gateway
  (para que binds tailnet no mesmo host ainda possam auto-aprovar).
- Todos os clientes WS devem incluir identidade `device` durante `connect` (operator + node).
  A Control UI pode omiti-la apenas nestes modos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade com HTTP inseguro somente localhost.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, downgrade severo de segurança).
- Todas as conexões devem assinar o nonce `connect.challenge` fornecido pelo servidor.

### Diagnósticos de migração de auth de dispositivo

Para clientes legados que ainda usam comportamento de assinatura pré-challenge, `connect` agora retorna
códigos de detalhe `DEVICE_AUTH_*` em `error.details.code` com um `error.details.reason` estável.

Falhas comuns de migração:

| Mensagem                    | details.code                     | details.reason           | Significado                                               |
| --------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Cliente omitiu `device.nonce` (ou enviou em branco).      |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Cliente assinou com nonce obsoleto/errado.                |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload de assinatura não corresponde ao payload v2.      |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp assinado está fora da defasagem permitida.      |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` não corresponde ao fingerprint da chave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Formato/canonicalização da chave pública falhou.          |

Alvo de migração:

- Sempre aguarde `connect.challenge`.
- Assine o payload v2 que inclui o nonce do servidor.
- Envie o mesmo nonce em `connect.params.device.nonce`.
- O payload de assinatura preferido é `v3`, que vincula `platform` e `deviceFamily`
  além dos campos device/client/role/scopes/token/nonce.
- Assinaturas `v2` legadas permanecem aceitas por compatibilidade, mas o
  pinning de metadados de dispositivo pareado ainda controla a política de comando na reconexão.

## TLS + pinning

- TLS é suportado para conexões WS.
- Clientes podem opcionalmente fixar o fingerprint do certificado do gateway (veja config `gateway.tls`
  mais `gateway.remote.tlsFingerprint` ou CLI `--tls-fingerprint`).

## Escopo

Este protocolo expõe a **API completa do gateway** (status, canais, modelos, chat,
agente, sessões, nodes, aprovações, etc.). A superfície exata é definida pelos
schemas TypeBox em `src/gateway/protocol/schema.ts`.
