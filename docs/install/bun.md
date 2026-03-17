---
summary: "Fluxo de trabalho com Bun (experimental): instalação e problemas conhecidos vs pnpm"
read_when:
  - Você quer o loop de desenvolvimento local mais rápido (bun + watch)
  - Você encontrou problemas de instalação/patch/lifecycle scripts do Bun
title: "Bun (Experimental)"
---

# Bun (experimental)

Objetivo: executar este repositório com **Bun** (opcional, não recomendado para WhatsApp/Telegram)
sem divergir dos fluxos de trabalho do pnpm.

⚠️ **Não recomendado para o runtime do Gateway** (bugs no WhatsApp/Telegram). Use Node.js para produção.

## Status

- Bun é um runtime local opcional para executar TypeScript diretamente (`bun run …`, `bun --watch …`).
- `pnpm` é o padrão para builds e continua totalmente suportado (e usado por algumas ferramentas de documentação).
- Bun não pode usar `pnpm-lock.yaml` e vai ignorá-lo.

## Instalação

Padrão:

```sh
bun install
```

Nota: `bun.lock`/`bun.lockb` estão no gitignore, então não há churn no repositório de qualquer forma. Se você não quiser _nenhuma escrita de lockfile_:

```sh
bun install --no-save
```

## Build / Teste (Bun)

```sh
bun run build
bun run vitest run
```

## Lifecycle scripts do Bun (bloqueados por padrão)

Bun pode bloquear lifecycle scripts de dependências a menos que explicitamente confiáveis (`bun pm untrusted` / `bun pm trust`).
Para este repositório, os scripts comumente bloqueados não são necessários:

- `@whiskeysockets/baileys` `preinstall`: verifica se Node major >= 20 (OpenCraft usa Node 24 por padrão e ainda suporta Node 22 LTS, atualmente `22.16+`).
- `protobufjs` `postinstall`: emite avisos sobre esquemas de versão incompatíveis (sem artefatos de build).

Se você encontrar um problema real de runtime que exija esses scripts, confie neles explicitamente:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Ressalvas

- Alguns scripts ainda usam pnpm hardcoded (ex.: `docs:build`, `ui:*`, `protocol:check`). Execute-os via pnpm por enquanto.
