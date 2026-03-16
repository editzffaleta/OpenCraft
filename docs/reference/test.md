---
summary: "Como executar testes localmente (vitest) e quando usar modos force/coverage"
read_when:
  - Executando ou corrigindo testes
title: "Testes"
---

# Testes

- Kit de testes completo (suítes, live, Docker): [Testes](/help/testing)

- `pnpm test:force`: Mata qualquer processo gateway remanescente segurando a porta de controle padrão, depois executa a suíte completa Vitest com uma porta de gateway isolada para que os testes de servidor não colidam com uma instância em execução. Use isso quando uma execução anterior do gateway deixou a porta 18789 ocupada.
- `pnpm test:coverage`: Executa a suíte de unidade com cobertura V8 (via `vitest.unit.config.ts`). Os thresholds globais são 70% de linhas/branches/funções/declarações. A cobertura exclui entrypoints com muita integração (wire CLI, bridges gateway/telegram, servidor estático webchat) para manter o alvo focado em lógica testável por unidade.
- `pnpm test` no Node 22, 23 e 24 usa Vitest `vmForks` por padrão para inicialização mais rápida. Node 25+ faz fallback para `forks` até ser revalidado. Você pode forçar o comportamento com `OPENCLAW_TEST_VM_FORKS=0|1`.
- `pnpm test`: executa a lane de unidade central rápida por padrão para feedback local rápido.
- `pnpm test:channels`: executa suítes com muitos canais.
- `pnpm test:extensions`: executa suítes de extensão/plugin.
- Integração de gateway: opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: Executa testes de smoke end-to-end do gateway (WS/HTTP/pareamento de nó multi-instância). Usa `vmForks` + workers adaptativos por padrão em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e defina `OPENCLAW_E2E_VERBOSE=1` para logs verbose.
- `pnpm test:live`: Executa testes live de provedor (minimax/zai). Requer chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico do provedor) para desativar o skip.

## Gate local de PR

Para verificações locais de land/gate de PR, execute:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` flakear em um host carregado, execute novamente uma vez antes de tratar como regressão, depois isole com `pnpm vitest run <caminho/para/teste>`. Para hosts com memória limitada, use:

- `OPENCLAW_TEST_PROFILE=low OPENCLAW_TEST_SERIAL_GATEWAY=1 pnpm test`

## Benchmark de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt padrão: "Reply with a single word: ok. No punctuation or extra text."

Última execução (31/12/2025, 20 execuções):

- minimax mediana 1279ms (mín 1114, máx 2431)
- opus mediana 2454ms (mín 1224, máx 3170)

## Benchmark de inicialização do CLI

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

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

A saída inclui avg, p50, p95, mín/máx e distribuição de exit-code/sinal para cada comando.

## Onboarding E2E (Docker)

O Docker é opcional; isso só é necessário para testes de smoke de onboarding em container.

Fluxo completo de cold-start em um container Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Este script conduz o wizard interativo via pseudo-tty, verifica arquivos de config/workspace/sessão, depois inicia o gateway e executa `opencraft health`.

## Smoke de importação QR (Docker)

Garante que `qrcode-terminal` carregue sob os runtimes Node do Docker suportados (padrão Node 24, compatível com Node 22):

```bash
pnpm test:docker:qr
```
