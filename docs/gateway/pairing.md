---
summary: "Pairing de node controlado pelo Gateway (Opção B) para iOS e outros nodes remotos"
read_when:
  - Implementando aprovações de pairing de node sem UI macOS
  - Adicionando fluxos CLI para aprovar nodes remotos
  - Estendendo protocolo do gateway com gerenciamento de nodes
title: "Gateway-Owned Pairing"
---

# Pairing controlado pelo Gateway (Opção B)

No pairing controlado pelo Gateway, o **Gateway** é a fonte de verdade para quais nodes podem entrar. UIs (app macOS, futuros clientes) são apenas frontends que aprovam ou rejeitam requisições pendentes.

**Importante:** Nodes WS usam **pairing de dispositivo** (role `node`) durante `connect`. `node.pair.*` é um store de pairing separado e **não** controla o handshake WS. Apenas clientes que explicitamente chamam `node.pair.*` usam este fluxo.

## Conceitos

- **Requisição pendente**: um node pediu para entrar; requer aprovação.
- **Node pareado**: node aprovado com um token de auth emitido.
- **Transporte**: o endpoint WS do Gateway encaminha requisições mas não decide participação. (Suporte a TCP bridge legado está descontinuado/removido.)

## Como o pairing funciona

1. Um node conecta ao Gateway WS e solicita pairing.
2. O Gateway armazena uma **requisição pendente** e emite `node.pair.requested`.
3. Você aprova ou rejeita a requisição (CLI ou UI).
4. Na aprovação, o Gateway emite um **novo token** (tokens são rotacionados no re-pairing).
5. O node reconecta usando o token e agora está "pareado".

Requisições pendentes expiram automaticamente após **5 minutos**.

## Fluxo CLI (amigável para headless)

```bash
opencraft nodes pending
opencraft nodes approve <requestId>
opencraft nodes reject <requestId>
opencraft nodes status
opencraft nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra nodes pareados/conectados e suas capabilities.

## Superfície de API (protocolo do gateway)

Eventos:

- `node.pair.requested` — emitido quando uma nova requisição pendente é criada.
- `node.pair.resolved` — emitido quando uma requisição é aprovada/rejeitada/expirada.

Métodos:

- `node.pair.request` — criar ou reusar uma requisição pendente.
- `node.pair.list` — listar nodes pendentes + pareados.
- `node.pair.approve` — aprovar uma requisição pendente (emite token).
- `node.pair.reject` — rejeitar uma requisição pendente.
- `node.pair.verify` — verificar `{ nodeId, token }`.

Notas:

- `node.pair.request` é idempotente por node: chamadas repetidas retornam a mesma requisição pendente.
- Aprovação **sempre** gera um token novo; nenhum token é jamais retornado de `node.pair.request`.
- Requisições podem incluir `silent: true` como dica para fluxos de auto-aprovação.

## Auto-aprovação (app macOS)

O app macOS pode opcionalmente tentar uma **aprovação silenciosa** quando:

- a requisição está marcada como `silent`, e
- o app pode verificar uma conexão SSH ao host do gateway usando o mesmo usuário.

Se a aprovação silenciosa falha, ele volta para o prompt normal de "Aprovar/Rejeitar".

## Armazenamento (local, privado)

O estado de pairing é armazenado no diretório de estado do Gateway (padrão `~/.opencraft`):

- `~/.opencraft/nodes/paired.json`
- `~/.opencraft/nodes/pending.json`

Se você sobrescrever `OPENCRAFT_STATE_DIR`, a pasta `nodes/` move junto.

Notas de segurança:

- Tokens são secrets; trate `paired.json` como sensível.
- Rotacionar um token requer re-aprovação (ou deletar a entrada do node).

## Comportamento de transporte

- O transporte é **stateless**; ele não armazena participação.
- Se o Gateway está offline ou pairing está desabilitado, nodes não podem parear.
- Se o Gateway está em modo remoto, pairing ainda acontece contra o store do Gateway remoto.
