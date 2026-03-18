# Padrões do Codebase OpenCraft

**Sempre reutilize código existente — sem redundância!**

## Stack de Tecnologia

- **Runtime**: Node 22+ (Bun também suportado para dev/scripts)
- **Linguagem**: TypeScript (ESM, modo strict)
- **Gerenciador de Pacotes**: pnpm (mantenha `pnpm-lock.yaml` sincronizado)
- **Lint/Format**: Oxlint, Oxfmt (`pnpm check`)
- **Testes**: Vitest com cobertura V8
- **CLI Framework**: Commander + clack/prompts
- **Build**: tsdown (saída em `dist/`)

## Regras Anti-Redundância

- Evite arquivos que apenas re-exportam de outro arquivo. Importe diretamente da fonte original.
- Se uma função já existe, importe-a — NÃO crie uma duplicata em outro arquivo.
- Antes de criar qualquer formatador, utilitário ou helper, procure implementações existentes primeiro.

## Locais de Fonte de Verdade

### Utilitários de Formatação (`src/infra/`)

- **Formatação de tempo**: `src\infra\format-time`

**NUNCA crie funções locais `formatAge`, `formatDuration`, `formatElapsedTime` — importe dos módulos centralizados.**

### Saída de Terminal (`src/terminal/`)

- Tabelas: `src/terminal/table.ts` (`renderTable`)
- Temas/cores: `src/terminal/theme.ts` (`theme.success`, `theme.muted`, etc.)
- Progresso: `src/cli/progress.ts` (spinners, barras de progresso)

### Padrões de CLI

- Wiring de opções CLI: `src/cli/`
- Comandos: `src/commands/`
- Injeção de dependências via `createDefaultDeps`

## Convenções de Import

- Use extensão `.js` para imports entre pacotes (ESM)
- Apenas imports diretos — sem arquivos wrapper de re-export
- Tipos: `import type { X }` para imports apenas de tipo

## Qualidade de Código

- TypeScript (ESM), tipagem estrita, evite `any`
- Mantenha arquivos abaixo de ~700 LOC — extraia helpers quando maior
- Testes colocados junto ao código: `*.test.ts` ao lado dos arquivos fonte
- Execute `pnpm check` antes de commits (lint + format)
- Execute `pnpm tsgo` para verificação de tipos

## Stack e Comandos

- **Gerenciador de pacotes**: pnpm (`pnpm install`)
- **Dev**: `pnpm opencraft ...` ou `pnpm dev`
- **Verificação de tipos**: `pnpm tsgo`
- **Lint/format**: `pnpm check`
- **Testes**: `pnpm test`
- **Build**: `pnpm build`

Se você estiver codificando junto com um humano, NÃO use scripts/committer, mas git diretamente e execute os comandos acima manualmente para garantir qualidade.
