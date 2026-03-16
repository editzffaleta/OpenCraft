---
summary: "Referência do CLI para `opencraft pairing` (aprovar/listar solicitações de pareamento)"
read_when:
  - Você está usando DMs em modo pairing e precisa aprovar remetentes
title: "pairing"
---

# `opencraft pairing`

Aprovar ou inspecionar solicitações de pareamento de DM (para canais que suportam pareamento).

Relacionado:

- Fluxo de pareamento: [Pairing](/channels/pairing)

## Comandos

```bash
opencraft pairing list telegram
opencraft pairing list --channel telegram --account work
opencraft pairing list telegram --json

opencraft pairing approve telegram <code>
opencraft pairing approve --channel telegram --account work <code> --notify
```

## Notas

- Entrada de canal: passe posicionalmente (`pairing list telegram`) ou com `--channel <channel>`.
- `pairing list` suporta `--account <accountId>` para canais multi-conta.
- `pairing approve` suporta `--account <accountId>` e `--notify`.
- Se apenas um canal com capacidade de pareamento estiver configurado, `pairing approve <code>` é permitido.
