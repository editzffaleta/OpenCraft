---
title: Lobster
summary: "Runtime de workflow tipado para OpenCraft com gates de aprovação resumíveis."
description: Runtime de workflow tipado para OpenCraft -- pipelines combináveis com gates de aprovação.
read_when:
  - Você quer workflows determinísticos multi-etapa com aprovações explícitas
  - Você precisa retomar um workflow sem re-executar etapas anteriores
---

# Lobster

Lobster é um shell de workflow que permite ao OpenCraft executar sequências de ferramentas multi-etapa como uma única operação determinística com checkpoints de aprovação explícitos.

## Gancho

Seu assistente pode construir as ferramentas que gerenciam ele mesmo. Peça um workflow, e 30 minutos depois você tem uma CLI mais pipelines que rodam como uma chamada. Lobster é a peça que faltava: pipelines determinísticos, aprovações explícitas e estado resumível.

## Por quê

Hoje, workflows complexos requerem muitas chamadas de ferramenta ida e volta. Cada chamada custa tokens, e o LLM tem que orquestrar cada etapa. Lobster move essa orquestração para um runtime tipado:

- **Uma chamada em vez de muitas**: O OpenCraft executa uma chamada de ferramenta Lobster e obtém um resultado estruturado.
- **Aprovações integradas**: Efeitos colaterais (enviar email, postar comentário) pausam o workflow até aprovação explícita.
- **Resumível**: Workflows pausados retornam um Token; aprove e retome sem re-executar tudo.

## Por que uma DSL em vez de programas simples?

Lobster é intencionalmente pequena. O objetivo não é "uma nova linguagem", é uma especificação de pipeline previsível e amigável para IA com aprovações e tokens de retomada de primeira classe.

- **Aprovar/retomar é integrado**: Um programa normal pode solicitar aprovação humana, mas não pode _pausar e retomar_ com um Token durável sem que você invente esse runtime.
- **Determinismo + auditabilidade**: Pipelines são dados, então são fáceis de logar, comparar, reproduzir e revisar.
- **Superfície restrita para IA**: Uma gramática pequena + piping JSON reduz caminhos de código "criativos" e torna a validação realista.
- **Política de segurança integrada**: Timeouts, limites de saída, verificações de sandbox e allowlists são aplicados pelo runtime, não cada script.
- **Ainda programável**: Cada etapa pode chamar qualquer CLI ou script. Se quiser JS/TS, gere arquivos `.lobster` a partir de código.

## Como funciona

O OpenCraft inicia a CLI local `lobster` em **modo ferramenta** e analisa um envelope JSON do stdout.
Se o pipeline pausar para aprovação, a ferramenta retorna um `resumeToken` para que você possa continuar depois.

## Padrão: pequena CLI + pipes JSON + aprovações

Construa comandos pequenos que falam JSON, depois encadeie-os em uma única chamada Lobster. (Nomes de comando de exemplo abaixo -- substitua pelos seus.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

Se o pipeline solicitar aprovação, retome com o Token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

A IA dispara o workflow; Lobster executa as etapas. Gates de aprovação mantêm efeitos colaterais explícitos e auditáveis.

Exemplo: mapear itens de entrada em chamadas de ferramenta:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | opencraft.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Etapas LLM somente JSON (llm-task)

Para workflows que precisam de uma **etapa LLM estruturada**, habilite a ferramenta de Plugin
opcional `llm-task` e chame-a do Lobster. Isso mantém o workflow
determinístico enquanto ainda permite classificar/resumir/redigir com um modelo.

Habilite a ferramenta:

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

Use em um pipeline:

```lobster
opencraft.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
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

Lobster pode executar arquivos de workflow YAML/JSON com campos `name`, `args`, `steps`, `env`, `condition` e `approval`. Em chamadas de ferramenta do OpenCraft, defina `pipeline` como o caminho do arquivo.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Notas:

- `stdin: $step.stdout` e `stdin: $step.json` passam a saída de uma etapa anterior.
- `condition` (ou `when`) pode condicionar etapas em `$step.approved`.

## Instalar Lobster

Instale a CLI Lobster no **mesmo host** que executa o Gateway do OpenCraft (veja o [repositório Lobster](https://github.com/opencraft/lobster)), e garanta que `lobster` está no `PATH`.

## Habilitar a ferramenta

Lobster é uma ferramenta de Plugin **opcional** (não habilitada por padrão).

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

Evite usar `tools.allow: ["lobster"]` a menos que pretenda rodar em modo restritivo de allowlist.

Nota: allowlists são opt-in para Plugins opcionais. Se sua allowlist nomeia apenas
ferramentas de Plugin (como `lobster`), o OpenCraft mantém ferramentas core habilitadas. Para restringir ferramentas
core, inclua as ferramentas core ou grupos que deseja na allowlist também.

## Exemplo: Triagem de email

Sem Lobster:

```
Usuário: "Check my email and draft replies"
-> opencraft chama gmail.list
-> LLM resume
-> Usuário: "draft replies to #2 and #5"
-> LLM redige
-> Usuário: "send #2"
-> opencraft chama gmail.send
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
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

Usuário aprova -> retomar:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Um workflow. Determinístico. Seguro.

## Parâmetros da ferramenta

### `run`

Executar um pipeline em modo ferramenta.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Executar um arquivo de workflow com args:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
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

- `cwd`: Diretório de trabalho relativo para o pipeline (deve permanecer dentro do diretório de trabalho do processo atual).
- `timeoutMs`: Encerrar o subprocesso se exceder esta duração (padrão: 20000).
- `maxStdoutBytes`: Encerrar o subprocesso se stdout exceder este tamanho (padrão: 512000).
- `argsJson`: String JSON passada para `lobster run --args-json` (apenas arquivos de workflow).

## Envelope de saída

Lobster retorna um envelope JSON com um de três status:

- `ok` -> concluído com sucesso
- `needs_approval` -> pausado; `requiresApproval.resumeToken` é necessário para retomar
- `cancelled` -> explicitamente negado ou cancelado

A ferramenta apresenta o envelope tanto em `content` (JSON formatado) quanto em `details` (objeto bruto).

## Aprovações

Se `requiresApproval` estiver presente, inspecione o prompt e decida:

- `approve: true` -> retomar e continuar efeitos colaterais
- `approve: false` -> cancelar e finalizar o workflow

Use `approve --preview-from-stdin --limit N` para anexar uma prévia JSON a solicitações de aprovação sem cola personalizada de jq/heredoc. Tokens de retomada agora são compactos: Lobster armazena estado de retomada de workflow sob seu diretório de estado e retorna uma chave de Token pequena.

## OpenProse

OpenProse combina bem com Lobster: use `/prose` para orquestrar preparação multi-agente, depois execute um pipeline Lobster para aprovações determinísticas. Se um programa Prose precisar de Lobster, permita a ferramenta `lobster` para sub-agents via `tools.subagents.tools`. Veja [OpenProse](/prose).

## Segurança

- **Apenas subprocesso local** -- sem chamadas de rede do próprio Plugin.
- **Sem segredos** -- Lobster não gerencia OAuth; chama ferramentas OpenCraft que o fazem.
- **Consciente de sandbox** -- desabilitado quando o contexto da ferramenta está em sandbox.
- **Endurecido** -- nome fixo de executável (`lobster`) no `PATH`; timeouts e limites de saída aplicados.

## Solução de problemas

- **`lobster subprocess timed out`** -> aumente `timeoutMs`, ou divida um pipeline longo.
- **`lobster output exceeded maxStdoutBytes`** -> aumente `maxStdoutBytes` ou reduza o tamanho da saída.
- **`lobster returned invalid JSON`** -> garanta que o pipeline roda em modo ferramenta e imprime apenas JSON.
- **`lobster failed (code ...)`** -> execute o mesmo pipeline em um terminal para inspecionar stderr.

## Saiba mais

- [Plugins](/tools/plugin)
- [Autoria de ferramentas de Plugin](/plugins/agent-tools)

## Estudo de caso: workflows da comunidade

Um exemplo público: uma CLI "segundo cérebro" + pipelines Lobster que gerenciam três cofres Markdown (pessoal, parceiro, compartilhado). A CLI emite JSON para estatísticas, listagens de caixa de entrada e escaneamentos de itens obsoletos; Lobster encadeia esses comandos em workflows como `weekly-review`, `inbox-triage`, `memory-consolidation` e `shared-task-sync`, cada um com gates de aprovação. A IA lida com julgamento (categorização) quando disponível e recorre a regras determinísticas quando não.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositório: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)
