---
title: "Fluxo de Desenvolvimento Pi"
summary: "Fluxo de trabalho do desenvolvedor para integração Pi: build, teste e validação ao vivo"
read_when:
  - Trabalhando no código ou testes de integração Pi
  - Executando fluxos de lint, typecheck e teste ao vivo específicos do Pi
---

# Fluxo de Desenvolvimento Pi

Este guia resume um fluxo de trabalho sensato para trabalhar na integração Pi no OpenCraft.

## Verificação de Tipos e Linting

- Verificação de tipos e build: `pnpm build`
- Lint: `pnpm lint`
- Verificação de formatação: `pnpm format`
- Gate completo antes de fazer push: `pnpm lint && pnpm build && pnpm test`

## Executando Testes Pi

Execute o conjunto de testes focados em Pi diretamente com Vitest:

```bash
pnpm test -- \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-extensions/**/*.test.ts"
```

Para incluir o exercício de provedor ao vivo:

```bash
OPENCRAFT_LIVE_TEST=1 pnpm test -- src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Isso cobre as principais suítes unitárias do Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-extensions/*.test.ts`

## Testes Manuais

Fluxo recomendado:

- Execute o Gateway em modo dev:
  - `pnpm gateway:dev`
- Acione o agente diretamente:
  - `pnpm opencraft agent --message "Hello" --thinking low`
- Use o TUI para depuração interativa:
  - `pnpm tui`

Para comportamento de chamada de ferramenta, solicite uma ação de `read` ou `exec` para que você possa ver o streaming de ferramentas e o tratamento de payload.

## Reset Completo

O estado fica no diretório de estado do OpenCraft. O padrão é `~/.opencraft`. Se `OPENCRAFT_STATE_DIR` estiver definido, use esse diretório.

Para resetar tudo:

- `opencraft.json` para configuração
- `credentials/` para perfis de autenticação e Tokens
- `agents/<agentId>/sessions/` para histórico de sessões do agente
- `agents/<agentId>/sessions.json` para o índice de sessões
- `sessions/` se caminhos legados existirem
- `workspace/` se você quiser um workspace em branco

Se você quiser resetar apenas sessões, delete `agents/<agentId>/sessions/` e `agents/<agentId>/sessions.json` para aquele agente. Mantenha `credentials/` se você não quiser reautenticar.

## Referências

- [https://docs.opencraft.ai/testing](https://docs.opencraft.ai/testing)
- [https://docs.opencraft.ai/start/getting-started](https://docs.opencraft.ai/start/getting-started)
