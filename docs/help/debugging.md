---
summary: "Ferramentas de depuração: modo watch, streams de modelo brutos e rastreamento de vazamento de raciocínio"
read_when:
  - Você precisa inspecionar saída bruta do modelo para vazamento de raciocínio
  - Você quer rodar o Gateway em modo watch enquanto itera
  - Você precisa de um fluxo de trabalho de depuração repetível
title: "Depuração"
---

# Depuração

Esta página cobre helpers de depuração para saída em streaming, especialmente quando um
provedor mistura raciocínio no texto normal.

## Overrides de depuração em runtime

Use `/debug` no chat para definir overrides de configuração **somente em runtime** (memória, não disco).
`/debug` é desabilitado por padrão; habilite com `commands.debug: true`.
Isso é útil quando você precisa alternar configurações obscuras sem editar `opencraft.json`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[opencraft]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` limpa todos os overrides e retorna à configuração em disco.

## Modo watch do Gateway

Para iteração rápida, rode o gateway sob o file watcher:

```bash
pnpm gateway:watch
```

Isso mapeia para:

```bash
node scripts/watch-node.mjs gateway --force
```

O watcher reinicia em arquivos relevantes para build sob `src/`, arquivos fonte de extensões,
`package.json` e `opencraft.plugin.json` de extensões como metadados, `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Mudanças em metadados de extensões reiniciam o
gateway sem forçar um rebuild `tsdown`; mudanças em fonte e configuração ainda
recompilam `dist` primeiro.

Adicione quaisquer flags CLI do gateway após `gateway:watch` e elas serão passadas a cada
reinicialização.

## Perfil dev + gateway dev (--dev)

Use o perfil dev para isolar estado e montar uma configuração segura e descartável para
depuração. Existem **duas** flags `--dev`:

- **`--dev` global (perfil):** isola estado sob `~/.opencraft-dev` e
  usa porta padrão do gateway `19001` (portas derivadas mudam junto).
- **`gateway --dev`: diz ao Gateway para auto-criar uma config padrão +
  workspace** quando faltando (e pular BOOTSTRAP.md).

Fluxo recomendado (perfil dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCRAFT_PROFILE=dev opencraft tui
```

Se você ainda não tem uma instalação global, rode o CLI via `pnpm opencraft ...`.

O que isso faz:

1. **Isolamento de perfil** (`--dev` global)
   - `OPENCRAFT_PROFILE=dev`
   - `OPENCRAFT_STATE_DIR=~/.opencraft-dev`
   - `OPENCRAFT_CONFIG_PATH=~/.opencraft-dev/opencraft.json`
   - `OPENCRAFT_GATEWAY_PORT=19001` (browser/canvas mudam junto)

2. **Bootstrap dev** (`gateway --dev`)
   - Escreve uma config mínima se faltando (`gateway.mode=local`, bind loopback).
   - Define `agent.workspace` para o workspace dev.
   - Define `agent.skipBootstrap=true` (sem BOOTSTRAP.md).
   - Semeia arquivos do workspace se faltando:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidade padrão: **C3-PO** (droid de protocolo).
   - Pula provedores de canal no modo dev (`OPENCRAFT_SKIP_CHANNELS=1`).

Fluxo de reset (início limpo):

```bash
pnpm gateway:dev:reset
```

Nota: `--dev` é uma flag de perfil **global** e é consumida por alguns runners.
Se você precisar escrevê-la por extenso, use a forma de variável de ambiente:

```bash
OPENCRAFT_PROFILE=dev opencraft gateway --dev --reset
```

`--reset` apaga config, credenciais, sessões e o workspace dev (usando
`trash`, não `rm`), depois recria a configuração dev padrão.

Dica: se um gateway não-dev já está rodando (launchd/systemd), pare-o primeiro:

```bash
opencraft gateway stop
```

## Logging de stream bruto (OpenCraft)

O OpenCraft pode registrar o **stream bruto do assistente** antes de qualquer filtragem/formatação.
Esta é a melhor forma de ver se o raciocínio está chegando como deltas de texto puro
(ou como blocos de pensamento separados).

Habilite via CLI:

```bash
pnpm gateway:watch --raw-stream
```

Override de caminho opcional:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.opencraft/logs/raw-stream.jsonl
```

Variáveis de ambiente equivalentes:

```bash
OPENCRAFT_RAW_STREAM=1
OPENCRAFT_RAW_STREAM_PATH=~/.opencraft/logs/raw-stream.jsonl
```

Arquivo padrão:

`~/.opencraft/logs/raw-stream.jsonl`

## Logging de chunk bruto (pi-mono)

Para capturar **chunks brutos compat-OpenAI** antes de serem parseados em blocos,
pi-mono expõe um logger separado:

```bash
PI_RAW_STREAM=1
```

Caminho opcional:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Arquivo padrão:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Nota: isso só é emitido por processos usando o
> provedor `openai-completions` do pi-mono.

## Notas de segurança

- Logs de stream bruto podem incluir prompts completos, saída de ferramentas e dados do usuário.
- Mantenha logs locais e delete-os após depuração.
- Se você compartilhar logs, limpe secrets e PII primeiro.
