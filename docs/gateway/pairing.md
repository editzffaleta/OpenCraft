---
summary: "Pareamento de node sob responsabilidade do Gateway (Opção B) para iOS e outros nodes remotos"
read_when:
  - Implementando aprovações de pareamento de node sem UI macOS
  - Adicionando fluxos CLI para aprovar nodes remotos
  - Estendendo o protocolo do gateway com gerenciamento de node
title: "Pareamento sob Responsabilidade do Gateway"
---

# Pareamento sob responsabilidade do Gateway (Opção B)

No pareamento sob responsabilidade do Gateway, o **Gateway** é a fonte de verdade sobre quais nodes
têm permissão para entrar. UIs (app macOS, futuros clientes) são apenas frontends que
aprovam ou rejeitam requisições pendentes.

**Importante:** Nodes WS usam **pareamento de dispositivo** (role `node`) durante `connect`.
`node.pair.*` é um store de pareamento separado e **não** controla o handshake WS.
Apenas clientes que chamam explicitamente `node.pair.*` usam este fluxo.

## Conceitos

- **Requisição pendente**: um node pediu para entrar; requer aprovação.
- **Node pareado**: node aprovado com um token de auth emitido.
- **Transporte**: o endpoint Gateway WS encaminha requisições mas não decide
  a adesão. (Suporte à bridge TCP legada está depreciado/removido.)

## Como o pareamento funciona

1. Um node conecta ao Gateway WS e solicita pareamento.
2. O Gateway armazena uma **requisição pendente** e emite `node.pair.requested`.
3. Você aprova ou rejeita a requisição (CLI ou UI).
4. Na aprovação, o Gateway emite um **novo token** (tokens são rotacionados no re-pareamento).
5. O node reconecta usando o token e está agora "pareado".

Requisições pendentes expiram automaticamente após **5 minutos**.

## Fluxo CLI (amigável a headless)

```bash
opencraft nodes pending
opencraft nodes approve <requestId>
opencraft nodes reject <requestId>
opencraft nodes status
opencraft nodes rename --node <id|name|ip> --name "iPad da Sala"
```

`nodes status` mostra nodes pareados/conectados e suas capacidades.

## Superfície de API (protocolo do gateway)

Eventos:

- `node.pair.requested` — emitido quando uma nova requisição pendente é criada.
- `node.pair.resolved` — emitido quando uma requisição é aprovada/rejeitada/expirada.

Métodos:

- `node.pair.request` — criar ou reutilizar uma requisição pendente.
- `node.pair.list` — listar nodes pendentes + pareados.
- `node.pair.approve` — aprovar uma requisição pendente (emite token).
- `node.pair.reject` — rejeitar uma requisição pendente.
- `node.pair.verify` — verificar `{ nodeId, token }`.

Notas:

- `node.pair.request` é idempotente por node: chamadas repetidas retornam a mesma
  requisição pendente.
- Aprovação **sempre** gera um token novo; nenhum token é retornado de
  `node.pair.request`.
- Requisições podem incluir `silent: true` como um hint para fluxos de aprovação automática.

## Aprovação automática (app macOS)

O app macOS pode opcionalmente tentar uma **aprovação silenciosa** quando:

- a requisição está marcada como `silent`, e
- o app consegue verificar uma conexão SSH ao host do gateway usando o mesmo usuário.

Se a aprovação silenciosa falhar, volta ao prompt normal "Aprovar/Rejeitar".

## Armazenamento (local, privado)

O estado de pareamento é armazenado no diretório de state do Gateway (padrão `~/.opencraft`):

- `~/.opencraft/nodes/paired.json`
- `~/.opencraft/nodes/pending.json`

Se você substituir `OPENCLAW_STATE_DIR`, a pasta `nodes/` se move junto.

Notas de segurança:

- Tokens são segredos; trate `paired.json` como sensível.
- Rotacionar um token requer re-aprovação (ou excluir a entrada do node).

## Comportamento do transporte

- O transporte é **stateless**; não armazena adesão.
- Se o Gateway estiver offline ou o pareamento estiver desabilitado, nodes não conseguem parear.
- Se o Gateway estiver em modo remoto, o pareamento ainda acontece contra o store do Gateway remoto.
