---
summary: "Fluxo de trabalho com Bun (experimental): instalações e diferenças em relação ao pnpm"
read_when:
  - Você quer o loop de desenvolvimento local mais rápido (bun + watch)
  - Você encontrou problemas de instalação/patch/scripts de ciclo de vida com o Bun
title: "Bun (Experimental)"
---

# Bun (experimental)

Objetivo: executar este repositório com **Bun** (opcional, não recomendado para WhatsApp/Telegram)
sem divergir dos fluxos de trabalho do pnpm.

⚠️ **Não recomendado para o runtime do Gateway** (bugs com WhatsApp/Telegram). Use Node para produção.

## Status

- O Bun é um runtime local opcional para executar TypeScript diretamente (`bun run …`, `bun --watch …`).
- `pnpm` é o padrão para builds e permanece totalmente suportado (e usado por algumas ferramentas de docs).
- O Bun não pode usar `pnpm-lock.yaml` e irá ignorá-lo.

## Instalar

Padrão:

```sh
bun install
```

Nota: `bun.lock`/`bun.lockb` são ignorados pelo gitignore, então não há alterações no repositório de qualquer forma. Se você quiser _sem escritas de lockfile_:

```sh
bun install --no-save
```

## Build / Teste (Bun)

```sh
bun run build
bun run vitest run
```

## Scripts de ciclo de vida do Bun (bloqueados por padrão)

O Bun pode bloquear scripts de ciclo de vida de dependências a menos que sejam explicitamente confiados (`bun pm untrusted` / `bun pm trust`).
Para este repositório, os scripts comumente bloqueados não são necessários:

- `@whiskeysockets/baileys` `preinstall`: verifica se o Node major >= 20 (o OpenCraft usa Node 24 por padrão e ainda suporta Node 22 LTS, atualmente `22.16+`).
- `protobufjs` `postinstall`: emite avisos sobre esquemas de versão incompatíveis (sem artefatos de build).

Se você encontrar um problema real de runtime que requer esses scripts, confie neles explicitamente:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Ressalvas

- Alguns scripts ainda hardcodam pnpm (ex.: `docs:build`, `ui:*`, `protocol:check`). Execute-os via pnpm por enquanto.
