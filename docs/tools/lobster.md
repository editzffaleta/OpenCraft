---
title: Lobster
summary: "Runtime de workflow tipado para o OpenCraft com gates de aprovação retomáveis."
description: Runtime de workflow tipado para o OpenCraft — pipelines composáveis com gates de aprovação.
read_when:
  - Você quer workflows multi-etapas determinísticos com aprovações explícitas
  - Você precisa retomar um workflow sem re-executar etapas anteriores
---

# Lobster

Lobster é um shell de workflow que permite ao OpenCraft executar sequências multi-etapas de tools como uma única operação determinística com checkpoints de aprovação explícitos.

## Proposta

Seu assistente pode construir as tools que gerenciam a si mesmo. Peça um workflow, e 30 minutos depois você tem um CLI mais pipelines que rodam como uma única chamada. O Lobster é a peça que faltava: pipelines determinísticos, aprovações explícitas e estado retomável.

## Por que

Hoje, workflows complexos requerem muitas chamadas de tool de ida e volta. Cada chamada custa tokens, e o LLM precisa orquestrar cada etapa. O Lobster move essa orquestração para um runtime tipado:

- **Uma chamada em vez de muitas**: o OpenCraft roda uma chamada da tool Lobster e obtém um resultado estruturado.
- **Aprovações embutidas**: efeitos colaterais (enviar email, postar comentário) pausam o workflow até serem explicitamente aprovados.
- **Retomável**: workflows pausados retornam um token; aprove e retome sem re-executar tudo.

## Por que uma DSL em vez de programas simples?

O Lobster é intencionalmente pequeno. O objetivo não é "uma nova linguagem", é uma spec de pipeline previsível e amigável para IA com aprovações de primeira classe e tokens de retomada.

- **Aprovar/retomar é embutido**: um programa normal pode solicitar um humano, mas não pode _pausar e retomar_ com um token durável sem você inventar aquele runtime sozinho.
- **Determinismo + auditabilidade**: pipelines são dados, então são fáceis de logar, fazer diff, replay e revisar.
- **Superfície restrita para IA**: uma gramática pequena + piping JSON reduz caminhos de código "criativos" e torna a validação realista.
- **Política de segurança embutida**: timeouts, caps de saída, verificações de sandbox e allowlists são aplicados pelo runtime, não por cada script.
- **Ainda programável**: cada etapa pode chamar qualquer CLI ou script. Se você quer JS/TS, gere arquivos `.lobster` a partir de código.

## Como funciona

O OpenCraft lança o CLI local `lobster` em **modo tool** e analisa um envelope JSON do stdout.
Se o pipeline pausar para aprovação, a tool retorna um `resumeToken` para que você possa continuar mais tarde.

## Padrão: CLI pequeno + pipes JSON + aprovações

Construa pequenos comandos que falam JSON, depois encadeie-os em uma única chamada Lobster. (Nomes de comando de exemplo abaixo — substitua pelos seus.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Aplicar mudanças?'",
  "timeoutMs": 30000
}
```

Se o pipeline solicitar aprovação, retome com o token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

A IA aciona o workflow; o Lobster executa as etapas. Gates de aprovação mantêm efeitos colaterais explícitos e auditáveis.

Exemplo: mapear itens de entrada em chamadas de tool:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Etapas LLM somente JSON (llm-task)

Para workflows que precisam de uma **etapa LLM estruturada**, habilite a tool de plugin opcional
`llm-task` e chame-a do Lobster. Isso mantém o workflow
determinístico enquanto ainda permite classificar/resumir/rascunhar com um modelo.

Habilitar a tool:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

Usar em um pipeline:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Dado o email de entrada, retorne intenção e rascunho.",
  "thinking": "low",
  "input": { "subject": "Olá", "body": "Você pode ajudar?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Veja [LLM Task](/tools/llm-task) para detalhes e opções de configuração.

## Arquivos de workflow (.lobster)

O Lobster pode rodar arquivos de workflow YAML/JSON com campos `name`, `args`, `steps`, `env`, `condition` e `approval`. Em chamadas de tool do OpenCraft, defina `pipeline` para o caminho do arquivo.

```yaml
name: triagem-inbox
args:
  tag:
    default: "familia"
steps:
  - id: coletar
    command: inbox list --json
  - id: categorizar
    command: inbox categorize --json
    stdin: $coletar.stdout
  - id: aprovar
    command: inbox apply --approve
    stdin: $categorizar.stdout
    approval: required
  - id: executar
    command: inbox apply --execute
    stdin: $categorizar.stdout
    condition: $aprovar.approved
```

Notas:

- `stdin: $etapa.stdout` e `stdin: $etapa.json` passam a saída de uma etapa anterior.
- `condition` (ou `when`) pode controlar etapas em `$etapa.approved`.

## Instalar o Lobster

Instale o CLI Lobster no **mesmo host** que roda o Gateway do OpenCraft (veja o [repositório Lobster](https://github.com/openclaw/lobster)), e garanta que `lobster` está no `PATH`.

## Habilitar a tool

O Lobster é uma tool de plugin **opcional** (não habilitada por padrão).

Recomendado (aditivo, seguro):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Ou por agente:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

Evite usar `tools.allow: ["lobster"]` a menos que você pretenda rodar em modo allowlist restritivo.

Nota: allowlists são opt-in para plugins opcionais. Se sua allowlist apenas nomeia
tools de plugin (como `lobster`), o OpenCraft mantém as tools principais habilitadas. Para restringir tools
principais, inclua também as tools ou grupos principais que você quer na allowlist.

## Exemplo: Triagem de email

Sem Lobster:

```
Usuário: "Verifique meu email e rascunhe respostas"
→ opencraft chama gmail.list
→ LLM resume
→ Usuário: "rascunhe respostas para #2 e #5"
→ LLM rascunha
→ Usuário: "envie #2"
→ opencraft chama gmail.send
(repete diariamente, sem memória do que foi triado)
```

Com Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Retorna um envelope JSON (truncado):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 precisam de respostas, 2 precisam de ação" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Enviar 2 rascunhos de resposta?",
    "items": [],
    "resumeToken": "..."
  }
}
```

Usuário aprova → retomar:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Um workflow. Determinístico. Seguro.

## Parâmetros da tool

### `run`

Rodar um pipeline em modo tool.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Rodar um arquivo de workflow com args:

```json
{
  "action": "run",
  "pipeline": "/caminho/para/triagem-inbox.lobster",
  "argsJson": "{\"tag\":\"familia\"}"
}
```

### `resume`

Continuar um workflow pausado após aprovação.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Entradas opcionais

- `cwd`: Diretório de trabalho relativo para o pipeline (deve ficar dentro do diretório de trabalho do processo atual).
- `timeoutMs`: Matar o subprocesso se exceder esta duração (padrão: 20000).
- `maxStdoutBytes`: Matar o subprocesso se stdout exceder este tamanho (padrão: 512000).
- `argsJson`: String JSON passada para `lobster run --args-json` (somente arquivos de workflow).

## Envelope de saída

O Lobster retorna um envelope JSON com um de três status:

- `ok` → concluído com sucesso
- `needs_approval` → pausado; `requiresApproval.resumeToken` é necessário para retomar
- `cancelled` → explicitamente negado ou cancelado

A tool apresenta o envelope tanto em `content` (JSON formatado) quanto em `details` (objeto bruto).

## Aprovações

Se `requiresApproval` estiver presente, inspecione o prompt e decida:

- `approve: true` → retomar e continuar efeitos colaterais
- `approve: false` → cancelar e finalizar o workflow

Use `approve --preview-from-stdin --limit N` para anexar uma pré-visualização JSON a requisições de aprovação sem cola jq/heredoc personalizada. Tokens de retomada agora são compactos: o Lobster armazena o estado de retomada do workflow no seu diretório de estado e entrega de volta uma chave de token pequena.

## OpenProse

O OpenProse combina bem com o Lobster: use `/prose` para orquestrar preparação multi-agente, depois rode um pipeline Lobster para aprovações determinísticas. Se um programa Prose precisar do Lobster, permita a tool `lobster` para sub-agentes via `tools.subagents.tools`. Veja [OpenProse](/prose).

## Segurança

- **Somente subprocesso local** — sem chamadas de rede do próprio plugin.
- **Sem secrets** — o Lobster não gerencia OAuth; chama tools do OpenCraft que fazem isso.
- **Ciente de sandbox** — desabilitado quando o contexto da tool está em sandbox.
- **Hardened** — nome de executável fixo (`lobster`) no `PATH`; timeouts e caps de saída aplicados.

## Solução de problemas

- **`lobster subprocess timed out`** → aumente `timeoutMs` ou divida um pipeline longo.
- **`lobster output exceeded maxStdoutBytes`** → aumente `maxStdoutBytes` ou reduza o tamanho da saída.
- **`lobster returned invalid JSON`** → garanta que o pipeline roda em modo tool e imprime apenas JSON.
- **`lobster failed (code …)`** → rode o mesmo pipeline em um terminal para inspecionar stderr.

## Saiba mais

- [Plugins](/tools/plugin)
- [Autoria de tools de plugin](/plugins/agent-tools)

## Estudo de caso: workflows da comunidade

Um exemplo público: um CLI de "segundo cérebro" + pipelines Lobster que gerenciam três cofres Markdown (pessoal, parceiro, compartilhado). O CLI emite JSON para estatísticas, listagens de inbox e scans obsoletos; o Lobster encadeia esses comandos em workflows como `weekly-review`, `inbox-triage`, `memory-consolidation` e `shared-task-sync`, cada um com gates de aprovação. A IA lida com julgamento (categorização) quando disponível e volta para regras determinísticas quando não está.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)
