---
summary: 'Notas sobre crash "__name is not a function" do Node + tsx e soluções alternativas'
read_when:
  - Depurando scripts de desenvolvimento exclusivos do Node ou falhas no modo watch
  - Investigando crashes do loader tsx/esbuild no OpenCraft
title: "Node + tsx Crash"
---

# Crash "\_\_name is not a function" do Node + tsx

## Resumo

Executar o OpenCraft via Node com `tsx` falha na inicialização com:

```
[opencraft] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Isso começou após trocar os scripts de desenvolvimento de Bun para `tsx` (commit `2871657e`, 06-01-2026). O mesmo caminho de runtime funcionava com Bun.

## Ambiente

- Node: v25.x (observado no v25.3.0)
- tsx: 4.21.0
- SO: macOS (reprodução provavelmente também em outras plataformas que executam Node 25)

## Reprodução (somente Node)

```bash
# na raiz do repositório
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Reprodução mínima no repositório

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Verificação de versão do Node

- Node 25.3.0: falha
- Node 22.22.0 (Homebrew `node@22`): falha
- Node 24: ainda não instalado aqui; necessita verificação

## Notas / hipótese

- `tsx` usa esbuild para transformar TS/ESM. O `keepNames` do esbuild emite um helper `__name` e envolve definições de funções com `__name(...)`.
- O crash indica que `__name` existe mas não é uma função em runtime, o que implica que o helper está ausente ou foi sobrescrito para este módulo no caminho do loader do Node 25.
- Problemas similares com o helper `__name` foram reportados em outros consumidores do esbuild quando o helper está ausente ou reescrito.

## Histórico de regressão

- `2871657e` (06-01-2026): scripts mudaram de Bun para tsx para tornar Bun opcional.
- Antes disso (caminho Bun), `opencraft status` e `gateway:watch` funcionavam.

## Soluções alternativas

- Use Bun para scripts de desenvolvimento (reversão temporária atual).
- Use Node + tsc watch, depois execute a saída compilada:

  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```

- Confirmado localmente: `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status` funciona no Node 25.
- Desabilitar esbuild keepNames no loader TS se possível (previne inserção do helper `__name`); tsx atualmente não expõe isso.
- Testar Node LTS (22/24) com `tsx` para ver se o problema é específico do Node 25.

## Referências

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Próximos passos

- Reproduzir no Node 22/24 para confirmar regressão do Node 25.
- Testar `tsx` nightly ou fixar em versão anterior se uma regressão conhecida existir.
- Se reproduzir no Node LTS, registrar uma reprodução mínima upstream com o stack trace do `__name`.
