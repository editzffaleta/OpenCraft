---
summary: "Tarefas LLM somente JSON para workflows (ferramenta de Plugin opcional)"
read_when:
  - Você quer uma etapa LLM somente JSON dentro de workflows
  - Você precisa de saída LLM validada por schema para automação
title: "LLM Task"
---

# LLM Task

`llm-task` é uma **ferramenta de Plugin opcional** que executa uma tarefa LLM somente JSON e
retorna saída estruturada (opcionalmente validada contra JSON Schema).

Isso é ideal para mecanismos de workflow como Lobster: você pode adicionar uma única etapa LLM
sem escrever código OpenCraft personalizado para cada workflow.

## Habilitar o Plugin

1. Habilite o Plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Coloque a ferramenta na allowlist (ela é registrada com `optional: true`):

```json
{
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

## Config (opcional)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.4",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai-codex/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` é uma allowlist de strings `provider/model`. Se definida, qualquer requisição
fora da lista é rejeitada.

## Parâmetros da ferramenta

- `prompt` (string, obrigatório)
- `input` (qualquer, opcional)
- `schema` (objeto, JSON Schema opcional)
- `provider` (string, opcional)
- `model` (string, opcional)
- `thinking` (string, opcional)
- `authProfileId` (string, opcional)
- `temperature` (número, opcional)
- `maxTokens` (número, opcional)
- `timeoutMs` (número, opcional)

`thinking` aceita os presets de raciocínio padrão do OpenCraft, como `low` ou `medium`.

## Saída

Retorna `details.json` contendo o JSON parseado (e valida contra
`schema` quando fornecido).

## Exemplo: etapa de workflow Lobster

```lobster
opencraft.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
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

## Notas de segurança

- A ferramenta é **somente JSON** e instrui o modelo a produzir apenas JSON (sem
  cercas de código, sem comentários).
- Nenhuma ferramenta é exposta ao modelo para esta execução.
- Trate a saída como não confiável a menos que você valide com `schema`.
- Coloque aprovações antes de qualquer etapa com efeitos colaterais (enviar, postar, exec).
