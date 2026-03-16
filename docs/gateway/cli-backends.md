---
summary: "Backends CLI: fallback apenas-texto via CLIs de IA locais"
read_when:
  - Você quer um fallback confiável quando provedores de API falham
  - Você está rodando Claude Code CLI ou outros CLIs de IA locais e quer reutilizá-los
  - Você precisa de um path apenas-texto, sem tools, que ainda suporte sessões e imagens
title: "CLI Backends"
---

# Backends CLI (runtime de fallback)

OpenCraft pode rodar **CLIs de IA locais** como um **fallback apenas-texto** quando provedores de API estão indisponíveis,
com rate limit, ou temporariamente com problemas. Isso é intencionalmente conservador:

- **Tools são desabilitadas** (sem chamadas de tools).
- **Texto entra → texto sai** (confiável).
- **Sessões são suportadas** (para que turnos de acompanhamento permaneçam coerentes).
- **Imagens podem ser passadas** se o CLI aceitar paths de imagem.

Isso é projetado como uma **rede de segurança** em vez de um path principal. Use quando quiser
respostas de texto "sempre funcionam" sem depender de APIs externas.

## Início rápido para iniciantes

Você pode usar o Claude Code CLI **sem qualquer config** (OpenCraft vem com um padrão built-in):

```bash
opencraft agent --message "hi" --model claude-cli/opus-4.6
```

Codex CLI também funciona imediatamente:

```bash
opencraft agent --message "hi" --model codex-cli/gpt-5.4
```

Se seu gateway roda sob launchd/systemd e PATH é mínimo, adicione apenas o
path do comando:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

É isso. Sem chaves, sem config de auth extra além do próprio CLI.

## Usando como fallback

Adicione um backend CLI à sua lista de fallback para que rode apenas quando modelos primários falham:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/opus-4.6", "claude-cli/opus-4.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/opus-4.6": {},
        "claude-cli/opus-4.5": {},
      },
    },
  },
}
```

Notas:

- Se você usar `agents.defaults.models` (allowlist), deve incluir `claude-cli/...`.
- Se o provedor primário falhar (auth, rate limits, timeouts), OpenCraft irá
  tentar o backend CLI em seguida.

## Visão geral de configuração

Todos os backends CLI ficam em:

```
agents.defaults.cliBackends
```

Cada entrada é identificada por um **id de provedor** (ex. `claude-cli`, `my-cli`).
O id do provedor se torna o lado esquerdo da sua ref de modelo:

```
<provider>/<model>
```

### Exemplo de configuração

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-opus-4-5": "opus",
            "claude-sonnet-4-5": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Como funciona

1. **Seleciona um backend** com base no prefixo do provedor (`claude-cli/...`).
2. **Constrói um system prompt** usando o mesmo prompt OpenCraft + contexto de workspace.
3. **Executa o CLI** com um id de sessão (se suportado) para que o histórico permaneça consistente.
4. **Analisa a saída** (JSON ou texto simples) e retorna o texto final.
5. **Persiste ids de sessão** por backend, para que acompanhamentos reutilizem a mesma sessão CLI.

## Sessões

- Se o CLI suporta sessões, defina `sessionArg` (ex. `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) quando o ID precisa ser inserido
  em múltiplas flags.
- Se o CLI usa um **subcomando de resume** com flags diferentes, defina
  `resumeArgs` (substitui `args` ao resumir) e opcionalmente `resumeOutput`
  (para resumes não-JSON).
- `sessionMode`:
  - `always`: sempre enviar um id de sessão (novo UUID se nenhum armazenado).
  - `existing`: apenas enviar um id de sessão se um foi armazenado antes.
  - `none`: nunca enviar um id de sessão.

## Imagens (pass-through)

Se seu CLI aceita paths de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenCraft escreverá imagens base64 em arquivos temporários. Se `imageArg` estiver definido, esses
paths são passados como args do CLI. Se `imageArg` estiver ausente, OpenCraft anexa os
paths de arquivo ao prompt (injeção de path), que é suficiente para CLIs que auto-carregam
arquivos locais de paths simples (comportamento do Claude Code CLI).

## Entradas / saídas

- `output: "json"` (padrão) tenta analisar JSON e extrair texto + id de sessão.
- `output: "jsonl"` analisa streams JSONL (Codex CLI `--json`) e extrai a
  última mensagem do agente mais `thread_id` quando presente.
- `output: "text"` trata stdout como a resposta final.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como o último arg do CLI.
- `input: "stdin"` envia o prompt via stdin.
- Se o prompt for muito longo e `maxPromptArgChars` estiver definido, stdin é usado.

## Padrões (built-in)

OpenCraft vem com um padrão para `claude-cli`:

- `command: "claude"`
- `args: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

OpenCraft também vem com um padrão para `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Sobrescreva apenas quando necessário (comum: path `command` absoluto).

## Limitações

- **Sem tools OpenCraft** (o backend CLI nunca recebe chamadas de tools). Alguns CLIs
  podem ainda rodar sua própria tooling de agente.
- **Sem streaming** (output do CLI é coletado então retornado).
- **Saídas estruturadas** dependem do formato JSON do CLI.
- **Sessões Codex CLI** resumem via output de texto (sem JSONL), que é menos
  estruturado que o run inicial `--json`. Sessões OpenCraft ainda funcionam
  normalmente.

## Resolução de problemas

- **CLI não encontrado**: defina `command` para um path completo.
- **Nome de modelo errado**: use `modelAliases` para mapear `provider/model` → modelo CLI.
- **Sem continuidade de sessão**: certifique-se de que `sessionArg` está definido e `sessionMode` não é
  `none` (Codex CLI atualmente não pode resumir com saída JSON).
- **Imagens ignoradas**: defina `imageArg` (e verifique se o CLI suporta paths de arquivo).
