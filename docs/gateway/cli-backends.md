---
summary: "CLI backends: fallback apenas texto via CLIs de IA locais"
read_when:
  - Você quer um fallback confiável quando providers de API falham
  - Você está executando Claude Code CLI ou outros CLIs de IA locais e quer reutilizá-los
  - Você precisa de um caminho apenas texto, sem ferramentas, que ainda suporte sessões e imagens
title: "CLI Backends"
---

# CLI backends (runtime de fallback)

OpenCraft pode executar **CLIs de IA locais** como **fallback apenas texto** quando providers de API estão fora do ar, com rate-limit ou temporariamente com problemas. Isso é intencionalmente conservador:

- **Ferramentas são desabilitadas** (sem chamadas de ferramenta).
- **Texto entra → texto sai** (confiável).
- **Sessões são suportadas** (para que turnos de follow-up permaneçam coerentes).
- **Imagens podem ser passadas** se o CLI aceitar caminhos de imagem.

Isso é projetado como uma **rede de segurança** em vez de um caminho primário. Use quando você quer respostas de texto "sempre funciona" sem depender de APIs externas.

## Início rápido para iniciantes

Você pode usar o Claude Code CLI **sem nenhuma configuração** (OpenCraft inclui um padrão built-in):

```bash
opencraft agent --message "hi" --model claude-cli/opus-4.6
```

O Codex CLI também funciona imediatamente:

```bash
opencraft agent --message "hi" --model codex-cli/gpt-5.4
```

Se seu gateway executa sob launchd/systemd e o PATH é mínimo, adicione apenas o caminho do comando:

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

É isso. Sem chaves, sem configuração extra de auth necessária além do próprio CLI.

## Usando como fallback

Adicione um CLI backend à sua lista de fallback para que ele só execute quando modelos primários falham:

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
- Se o provider primário falhar (auth, rate limits, timeouts), OpenCraft tentará o CLI backend em seguida.

## Visão geral da configuração

Todos os CLI backends ficam em:

```
agents.defaults.cliBackends
```

Cada entrada é chaveada por um **provider id** (ex. `claude-cli`, `my-cli`).
O provider id se torna o lado esquerdo da sua ref de modelo:

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

1. **Seleciona um backend** baseado no prefixo do provider (`claude-cli/...`).
2. **Constrói um system prompt** usando o mesmo prompt do OpenCraft + contexto do workspace.
3. **Executa o CLI** com um id de sessão (se suportado) para que o histórico permaneça consistente.
4. **Faz parse da saída** (JSON ou texto puro) e retorna o texto final.
5. **Persiste ids de sessão** por backend, para que follow-ups reutilizem a mesma sessão do CLI.

## Sessões

- Se o CLI suporta sessões, defina `sessionArg` (ex. `--session-id`) ou `sessionArgs` (placeholder `{sessionId}`) quando o ID precisa ser inserido em múltiplas flags.
- Se o CLI usa um **subcomando de resumo** com flags diferentes, defina `resumeArgs` (substitui `args` ao resumir) e opcionalmente `resumeOutput` (para resumos não-JSON).
- `sessionMode`:
  - `always`: sempre enviar um id de sessão (novo UUID se nenhum armazenado).
  - `existing`: enviar id de sessão apenas se um já foi armazenado antes.
  - `none`: nunca enviar um id de sessão.

## Imagens (pass-through)

Se seu CLI aceita caminhos de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenCraft escreverá imagens base64 em arquivos temporários. Se `imageArg` está definido, esses caminhos são passados como args do CLI. Se `imageArg` está ausente, OpenCraft acrescenta os caminhos de arquivo ao prompt (injeção de caminho), o que é suficiente para CLIs que auto-carregam arquivos locais a partir de caminhos simples (comportamento do Claude Code CLI).

## Entradas / saídas

- `output: "json"` (padrão) tenta fazer parse de JSON e extrair texto + id de sessão.
- `output: "jsonl"` faz parse de streams JSONL (Codex CLI `--json`) e extrai a última mensagem do agente mais `thread_id` quando presente.
- `output: "text"` trata stdout como a resposta final.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como último arg do CLI.
- `input: "stdin"` envia o prompt via stdin.
- Se o prompt é muito longo e `maxPromptArgChars` está definido, stdin é usado.

## Padrões (built-in)

OpenCraft inclui um padrão para `claude-cli`:

- `command: "claude"`
- `args: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

OpenCraft também inclui um padrão para `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Sobrescreva apenas se necessário (comum: caminho absoluto do `command`).

## Limitações

- **Sem ferramentas OpenCraft** (o CLI backend nunca recebe chamadas de ferramenta). Alguns CLIs podem ainda executar suas próprias ferramentas de agente.
- **Sem streaming** (saída do CLI é coletada e depois retornada).
- **Saídas estruturadas** dependem do formato JSON do CLI.
- **Sessões do Codex CLI** são resumidas via saída de texto (sem JSONL), o que é menos estruturado do que a execução inicial `--json`. Sessões do OpenCraft ainda funcionam normalmente.

## Solução de problemas

- **CLI não encontrado**: defina `command` com um caminho completo.
- **Nome de modelo errado**: use `modelAliases` para mapear `provider/model` → modelo do CLI.
- **Sem continuidade de sessão**: garanta que `sessionArg` está definido e `sessionMode` não é `none` (Codex CLI atualmente não pode resumir com saída JSON).
- **Imagens ignoradas**: defina `imageArg` (e verifique se o CLI suporta caminhos de arquivo).
