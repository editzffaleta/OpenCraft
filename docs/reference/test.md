---
summary: "Como executar testes localmente (vitest) e quando usar modos force/coverage"
read_when:
  - Executando ou corrigindo testes
title: "Testes"
---

# Testes

- Kit completo de testes (suítes, live, Docker): [Testes](/help/testing)

- `pnpm test:force`: Encerra qualquer processo gateway remanescente ocupando a porta de controle padrão, depois executa a suíte Vitest completa com uma porta gateway isolada para que testes de servidor não colidam com uma instância em execução. Use quando uma execução anterior do gateway deixou a porta 18789 ocupada.
- `pnpm test:coverage`: Executa a suíte unitária com cobertura V8 (via `vitest.unit.config.ts`). Thresholds globais são 70% linhas/branches/funções/statements. A cobertura exclui entrypoints pesados de integração (fiação CLI, bridges gateway/telegram, servidor estático webchat) para manter o alvo focado em lógica testável unitariamente.
- `pnpm test` no Node 22, 23 e 24 usa Vitest `vmForks` por padrão para inicialização mais rápida. Node 25+ faz fallback para `forks` até ser revalidado. Você pode forçar o comportamento com `OPENCRAFT_TEST_VM_FORKS=0|1`.
- `pnpm test`: executa a faixa rápida de unidade core por padrão para feedback local rápido.
- `pnpm test:channels`: executa suítes pesadas de canais.
- `pnpm test:extensions`: executa suítes de extensão/plugin.
- Integração Gateway: opt-in via `OPENCRAFT_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: Executa testes de fumaça end-to-end do gateway (pareamento multi-instância WS/HTTP/node). Padrão é `vmForks` + workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCRAFT_E2E_WORKERS=<n>` e defina `OPENCRAFT_E2E_VERBOSE=1` para logs detalhados.
- `pnpm test:live`: Executa testes live de provedor (minimax/zai). Requer chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico por provedor) para não pular.

## Gate de PR local

Para verificações locais de gate/land de PR, execute:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` falhar intermitentemente em um host sobrecarregado, reexecute uma vez antes de tratar como regressão, depois isole com `pnpm vitest run <path/to/test>`. Para hosts com restrição de memória, use:

- `OPENCRAFT_TEST_PROFILE=low OPENCRAFT_TEST_SERIAL_GATEWAY=1 pnpm test`

## Benchmark de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/editzffaleta/OpenCraft/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt padrão: "Reply with a single word: ok. No punctuation or extra text."

Última execução (2025-12-31, 20 execuções):

- minimax mediana 1279ms (min 1114, max 2431)
- opus mediana 2454ms (min 1224, max 3170)

## Benchmark de inicialização do CLI

Script: [`scripts/bench-cli-startup.ts`](https://github.com/editzffaleta/OpenCraft/blob/main/scripts/bench-cli-startup.ts)

Uso:

- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --entry dist/entry.js --timeout-ms 45000`

Este benchmark testa estes comandos:

- `--version`
- `--help`
- `health --json`
- `status --json`
- `status`

A saída inclui avg, p50, p95, min/max e distribuição de exit-code/signal para cada comando.

## Onboarding E2E (Docker)

Docker é opcional; isso é necessário apenas para testes de fumaça de onboarding em container.

Fluxo completo cold-start em um container Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Este script conduz o assistente interativo via pseudo-tty, verifica arquivos de config/workspace/sessão, depois inicia o gateway e executa `opencraft health`.

## Teste de fumaça de importação QR (Docker)

Garante que `qrcode-terminal` carrega nos runtimes Docker Node suportados (Node 24 padrão, Node 22 compatível):

```bash
pnpm test:docker:qr
```
