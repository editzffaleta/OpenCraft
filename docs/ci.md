---
title: Pipeline de CI
description: Como o pipeline de CI do OpenCraft funciona
summary: "Grafo de jobs de CI, portões de escopo e equivalentes de comandos locais"
read_when:
  - Você precisa entender por que um job de CI rodou ou não
  - Você está depurando verificações do GitHub Actions que falharam
---

# Pipeline de CI

O CI roda a cada push para `main` e em cada pull request. Ele usa escopo inteligente para pular jobs custosos quando apenas áreas não relacionadas mudaram.

## Visão Geral dos Jobs

| Job               | Propósito                                                   | Quando roda                              |
| ----------------- | ----------------------------------------------------------- | ---------------------------------------- |
| `docs-scope`      | Detectar mudanças somente em docs                           | Sempre                                   |
| `changed-scope`   | Detectar quais áreas mudaram (node/macos/android/windows)   | Mudanças não-doc                         |
| `check`           | Tipos TypeScript, lint, formato                             | Mudanças não-doc, mudanças node          |
| `check-docs`      | Lint de Markdown + verificação de links quebrados           | Docs alterados                           |
| `secrets`         | Detectar segredos vazados                                   | Sempre                                   |
| `build-artifacts` | Compilar dist uma vez, compartilhar com `release-check`     | Pushes para `main`, mudanças node        |
| `release-check`   | Validar conteúdo do npm pack                                | Pushes para `main` após build            |
| `checks`          | Testes Node + verificação de protocolo em PRs; compat Bun em push | Mudanças não-doc, mudanças node   |
| `compat-node22`   | Compatibilidade com runtime Node mínimo suportado           | Pushes para `main`, mudanças node        |
| `checks-windows`  | Testes específicos do Windows                               | Mudanças não-doc, mudanças windows       |
| `macos`           | Lint/build/test Swift + testes TS                           | PRs com mudanças macos                   |
| `android`         | Build Gradle + testes                                       | Mudanças não-doc, mudanças android       |

## Ordem de Fail-Fast

Os jobs são ordenados para que verificações baratas falhem antes das custosas rodarem:

1. `docs-scope` + `changed-scope` + `check` + `secrets` (paralelo, portões baratos primeiro)
2. PRs: `checks` (testes Linux Node divididos em 2 shards), `checks-windows`, `macos`, `android`
3. Pushes para `main`: `build-artifacts` + `release-check` + compat Bun + `compat-node22`

A lógica de escopo vive em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`.

## Runners

| Runner                           | Jobs                                              |
| -------------------------------- | ------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | Maioria dos jobs Linux, incluindo detecção de escopo |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                  |
| `macos-latest`                   | `macos`, `ios`                                    |

## Equivalentes Locais

```bash
pnpm check          # tipos + lint + formato
pnpm test           # testes vitest
pnpm check:docs     # formato docs + lint + links quebrados
pnpm release:check  # validar npm pack
```
