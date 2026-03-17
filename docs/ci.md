---
title: Pipeline de CI
description: Como funciona o pipeline de CI do OpenCraft
summary: "Grafo de jobs de CI, gates de escopo e comandos locais equivalentes"
read_when:
  - Você precisa entender por que um job de CI foi ou não executado
  - Você está depurando verificações com falha no GitHub Actions
---

# Pipeline de CI

O CI executa em cada push para `main` e em cada pull request. Ele usa escopo inteligente para pular jobs custosos quando apenas áreas não relacionadas foram alteradas.

## Visão Geral dos Jobs

| Job               | Propósito                                                                  | Quando executa                                   |
| ----------------- | -------------------------------------------------------------------------- | ------------------------------------------------ |
| `docs-scope`      | Detectar alterações apenas em docs                                         | Sempre                                           |
| `changed-scope`   | Detectar quais áreas mudaram (node/macos/android/windows)                  | Alterações fora de docs                          |
| `check`           | Tipos TypeScript, lint, formatação                                         | Fora de docs, alterações em node                 |
| `check-docs`      | Lint de Markdown + verificação de links quebrados                          | Docs alterados                                   |
| `secrets`         | Detectar segredos vazados                                                  | Sempre                                           |
| `build-artifacts` | Compilar dist uma vez, compartilhar com `release-check`                    | Pushes para `main`, alterações em node           |
| `release-check`   | Validar conteúdo do npm pack                                               | Pushes para `main` após build                    |
| `checks`          | Testes Node + verificação de protocolo em PRs; compatibilidade Bun em push | Fora de docs, alterações em node                 |
| `compat-node22`   | Compatibilidade mínima com runtime Node suportado                          | Pushes para `main`, alterações em node           |
| `checks-windows`  | Testes específicos para Windows                                            | Fora de docs, alterações relevantes para Windows |
| `macos`           | Lint/build/teste Swift + testes TS                                         | PRs com alterações em macos                      |
| `android`         | Build Gradle + testes                                                      | Fora de docs, alterações em android              |

## Ordem Fail-Fast

Os jobs são ordenados para que verificações baratas falhem antes que os custosos executem:

1. `docs-scope` + `changed-scope` + `check` + `secrets` (paralelo, gates baratos primeiro)
2. PRs: `checks` (teste Node Linux dividido em 2 shards), `checks-windows`, `macos`, `android`
3. Pushes para `main`: `build-artifacts` + `release-check` + compatibilidade Bun + `compat-node22`

A lógica de escopo está em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`.

## Runners

| Runner                           | Jobs                                                 |
| -------------------------------- | ---------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | Maioria dos jobs Linux, incluindo detecção de escopo |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                     |
| `macos-latest`                   | `macos`, `ios`                                       |

## Equivalentes Locais

```bash
pnpm check          # tipos + lint + formatação
pnpm test           # testes vitest
pnpm check:docs     # formatação de docs + lint + links quebrados
pnpm release:check  # validar npm pack
```
