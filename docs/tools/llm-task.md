---
summary: "Tasks LLM somente JSON para workflows (tool de plugin opcional)"
read_when:
  - Você quer uma etapa LLM somente JSON dentro de workflows
  - Você precisa de saída LLM validada por schema para automação
title: "LLM Task"
---

# LLM Task

`llm-task` é uma **tool de plugin opcional** que executa uma task LLM somente JSON e
retorna saída estruturada (opcionalmente validada contra JSON Schema).

É ideal para motores de workflow como o Lobster: você pode adicionar uma única etapa LLM
sem escrever código OpenCraft personalizado para cada workflow.

## Habilitar o plugin

1. Habilite o plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Coloque a tool na allowlist (ela é registrada com `optional: true`):

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

`allowedModels` é uma allowlist de strings `provedor/modelo`. Se definido, qualquer requisição
fora da lista é rejeitada.

## Parâmetros da tool

- `prompt` (string, obrigatório)
- `input` (qualquer tipo, opcional)
- `schema` (object, JSON Schema opcional)
- `provider` (string, opcional)
- `model` (string, opcional)
- `thinking` (string, opcional)
- `authProfileId` (string, opcional)
- `temperature` (number, opcional)
- `maxTokens` (number, opcional)
- `timeoutMs` (number, opcional)

`thinking` aceita os presets padrão de raciocínio do OpenCraft, como `low` ou `medium`.

## Saída

Retorna `details.json` contendo o JSON analisado (e valida contra
`schema` quando fornecido).

## Exemplo: etapa de workflow Lobster

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Dado o email de entrada, retorne intenção e rascunho.",
  "thinking": "low",
  "input": {
    "subject": "Olá",
    "body": "Você pode ajudar?"
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

- A tool é **somente JSON** e instrui o modelo a produzir apenas JSON (sem
  code fences, sem comentários).
- Nenhuma tool é exposta ao modelo para esta execução.
- Trate a saída como não confiável a menos que você valide com `schema`.
- Coloque aprovações antes de qualquer etapa com efeitos colaterais (enviar, postar, exec).
