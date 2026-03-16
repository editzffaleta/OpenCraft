---
summary: Notas e soluções para o crash "\_\_name is not a function" no Node + tsx
read_when:
  - Depurando scripts de desenvolvimento exclusivos do Node ou falhas no modo watch
  - Investigando crashes do carregador tsx/esbuild no OpenCraft
title: "Crash no Node + tsx"
---

# Crash "\_\_name is not a function" no Node + tsx

## Resumo

Executar o OpenCraft via Node com `tsx` falha na inicialização com:

```
[opencraft] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Isso começou após a mudança dos scripts de desenvolvimento do Bun para o `tsx` (commit `2871657e`, 2026-01-06). O mesmo caminho de execução funcionava com o Bun.

## Ambiente

- Node: v25.x (observado na v25.3.0)
- tsx: 4.21.0
- SO: macOS (reprodução provável em outras plataformas que executam Node 25)

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

## Verificação da versão do Node

- Node 25.3.0: falha
- Node 22.22.0 (Homebrew `node@22`): falha
- Node 24: não instalado aqui ainda; precisa de verificação

## Notas / hipótese

- O `tsx` usa o esbuild para transformar TS/ESM. O `keepNames` do esbuild emite um helper `__name` e envolve definições de função com `__name(...)`.
- O crash indica que `__name` existe mas não é uma função em tempo de execução, o que implica que o helper está ausente ou sobrescrito neste módulo no caminho do carregador do Node 25.
- Problemas similares com o helper `__name` foram relatados em outros consumidores do esbuild quando o helper está ausente ou reescrito.

## Histórico de regressão

- `2871657e` (2026-01-06): scripts migrados do Bun para tsx para tornar o Bun opcional.
- Antes disso (caminho Bun), `opencraft status` e `gateway:watch` funcionavam.

## Soluções alternativas

- Usar Bun para scripts de desenvolvimento (reversão temporária atual).
- Usar Node + tsc watch, depois executar o output compilado:

  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch opencraft.mjs status
  ```

- Confirmado localmente: `pnpm exec tsc -p tsconfig.json` + `node opencraft.mjs status` funciona no Node 25.
- Desativar `keepNames` do esbuild no carregador TS, se possível (evita a inserção do helper `__name`); o tsx atualmente não expõe essa opção.
- Testar Node LTS (22/24) com `tsx` para verificar se o problema é específico do Node 25.

## Referências

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Próximos passos

- Reproduzir no Node 22/24 para confirmar regressão no Node 25.
- Testar versão nightly do `tsx` ou fixar em versão anterior se houver regressão conhecida.
- Se reproduzir no Node LTS, abrir issue com reprodução mínima upstream com o stack trace do `__name`.
