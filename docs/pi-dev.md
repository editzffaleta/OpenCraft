---
title: "Fluxo de Desenvolvimento do Pi"
summary: "Fluxo de desenvolvimento para integração com Pi: build, teste e validação ao vivo"
read_when:
  - Trabalhando no código de integração com Pi ou testes
  - Rodando fluxos de lint, typecheck e testes ao vivo específicos do Pi
---

# Fluxo de Desenvolvimento do Pi

Este guia resume um fluxo sano para trabalhar na integração com Pi no OpenCraft.

## Verificação de Tipos e Lint

- Verificar tipos e build: `pnpm build`
- Lint: `pnpm lint`
- Verificação de formato: `pnpm format`
- Gate completo antes de enviar: `pnpm lint && pnpm build && pnpm test`

## Rodando Testes do Pi

Rode o conjunto de testes focado no Pi diretamente com o Vitest:

```bash
pnpm test -- \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-extensions/**/*.test.ts"
```

Para incluir o exercício ao vivo do provedor:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test -- src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Isso cobre os principais suites unitários do Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-extensions/*.test.ts`

## Testes Manuais

Fluxo recomendado:

- Rodar o gateway em modo dev:
  - `pnpm gateway:dev`
- Acionar o agente diretamente:
  - `pnpm opencraft agent --message "Olá" --thinking low`
- Usar o TUI para depuração interativa:
  - `pnpm tui`

Para comportamento de chamada de tool, solicite uma ação `read` ou `exec` para ver o streaming de tools e o tratamento de payload.

## Reset do Zero

O estado fica no diretório de estado do OpenCraft. O padrão é `~/.opencraft`. Se `OPENCLAW_STATE_DIR` estiver definido, use esse diretório.

Para resetar tudo:

- `opencraft.json` para config
- `credentials/` para perfis de auth e tokens
- `agents/<agentId>/sessions/` para histórico de sessão do agente
- `agents/<agentId>/sessions.json` para o índice de sessões
- `sessions/` se existirem caminhos legados
- `workspace/` se quiser um workspace em branco

Se quiser resetar apenas sessões, delete `agents/<agentId>/sessions/` e `agents/<agentId>/sessions.json` para aquele agente. Mantenha `credentials/` se não quiser se reautenticar.

## Referências

- [https://docs.openclaw.ai/testing](https://docs.openclaw.ai/testing)
- [https://docs.openclaw.ai/start/getting-started](https://docs.openclaw.ai/start/getting-started)
