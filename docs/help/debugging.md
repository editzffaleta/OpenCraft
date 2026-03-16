---
summary: "Ferramentas de depuração: modo watch, streams brutas do modelo e rastreamento de vazamento de raciocínio"
read_when:
  - Você precisa inspecionar a saída bruta do modelo para vazamento de raciocínio
  - Você quer executar o Gateway em modo watch durante iterações
  - Você precisa de um fluxo de depuração reproduzível
title: "Depuração"
---

# Depuração

Esta página cobre helpers de depuração para saída de streaming, especialmente quando um
provedor mistura raciocínio no texto normal.

## Substituições de config em tempo de execução

Use `/debug` no chat para definir substituições de config **apenas em tempo de execução** (memória, não disco).
`/debug` é desabilitado por padrão; habilite com `commands.debug: true`.
Útil quando você precisa alternar configurações obscuras sem editar `opencraft.json`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[opencraft]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` limpa todas as substituições e retorna à configuração em disco.

## Modo watch do Gateway

Para iteração rápida, execute o gateway sob o observador de arquivos:

```bash
pnpm gateway:watch
```

Isso equivale a:

```bash
node --watch-path src --watch-path tsconfig.json --watch-path package.json --watch-preserve-output scripts/run-node.mjs gateway --force
```

Adicione quaisquer flags CLI do gateway após `gateway:watch` e eles serão passados
a cada reinicialização.

## Perfil dev + gateway dev (--dev)

Use o perfil dev para isolar estado e criar uma configuração segura e descartável para
depuração. Há **dois** flags `--dev`:

- **`--dev` global (perfil):** isola estado em `~/.openclaw-dev` e
  padroniza a porta do gateway para `19001` (portas derivadas mudam com ela).
- **`gateway --dev`: diz ao Gateway para criar automaticamente um config + workspace padrão**
  quando ausente (e pular BOOTSTRAP.md).

Fluxo recomendado (perfil dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev opencraft tui
```

Se você ainda não tem uma instalação global, execute o CLI via `pnpm opencraft ...`.

O que isso faz:

1. **Isolamento de perfil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/opencraft.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas ajustam conforme necessário)

2. **Bootstrap dev** (`gateway --dev`)
   - Escreve uma config mínima se ausente (`gateway.mode=local`, bind loopback).
   - Define `agent.workspace` para o workspace dev.
   - Define `agent.skipBootstrap=true` (sem BOOTSTRAP.md).
   - Cria arquivos do workspace se ausentes:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidade padrão: **C3-PO** (droide de protocolo).
   - Pula provedores de canal em modo dev (`OPENCLAW_SKIP_CHANNELS=1`).

Fluxo de reset (início limpo):

```bash
pnpm gateway:dev:reset
```

Nota: `--dev` é um flag de **perfil global** e pode ser consumido por alguns runners.
Se precisar especificá-lo explicitamente, use a forma de variável de ambiente:

```bash
OPENCLAW_PROFILE=dev opencraft gateway --dev --reset
```

`--reset` apaga config, credenciais, sessões e o workspace dev (usando
`trash`, não `rm`), depois recria a configuração dev padrão.

Dica: se um gateway não-dev já estiver em execução (launchd/systemd), pare-o primeiro:

```bash
opencraft gateway stop
```

## Log de stream bruta (OpenCraft)

O OpenCraft pode registrar o **stream bruto do assistente** antes de qualquer filtragem/formatação.
Esta é a melhor forma de ver se o raciocínio está chegando como deltas de texto simples
(ou como blocos de thinking separados).

Habilite via CLI:

```bash
pnpm gateway:watch --raw-stream
```

Substituição opcional de caminho:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.opencraft/logs/raw-stream.jsonl
```

Variáveis de ambiente equivalentes:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.opencraft/logs/raw-stream.jsonl
```

Arquivo padrão:

`~/.opencraft/logs/raw-stream.jsonl`

## Log de chunks brutos (pi-mono)

Para capturar **chunks brutos compatíveis com OpenAI** antes de serem analisados em blocos,
o pi-mono expõe um logger separado:

```bash
PI_RAW_STREAM=1
```

Caminho opcional:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Arquivo padrão:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Nota: isso só é emitido por processos que usam o provedor `openai-completions` do pi-mono.

## Notas de segurança

- Logs de stream bruta podem incluir prompts completos, saída de ferramentas e dados do usuário.
- Mantenha os logs localmente e delete-os após a depuração.
- Se compartilhar logs, remova segredos e PII primeiro.
