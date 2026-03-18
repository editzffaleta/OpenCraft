# LLM Task (plugin)

Adiciona uma ferramenta de agente **opcional** `llm-task` para executar tarefas LLM **somente com JSON**
(rascunho, resumo, classificação) com validação opcional de JSON Schema.

Projetado para ser chamado a partir de motores de workflow (por exemplo, Lobster via
`opencraft.invoke --each`) sem adicionar novo código ao OpenCraft por workflow.

## Ativar

1. Ative o plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Adicione a ferramenta à lista de permitidas (ela é registrada com `optional: true`):

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

## Configuração (opcional)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.2",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai-codex/gpt-5.2"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` é uma lista de permissões de strings `provider/model`. Se definida, qualquer requisição
fora da lista será rejeitada.

## API da ferramenta

### Parâmetros

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

### Saída

Retorna `details.json` contendo o JSON analisado (e valida contra
`schema` quando fornecido).

## Notas

- A ferramenta é **somente JSON** e instrui o modelo a gerar apenas JSON
  (sem delimitadores de código, sem comentários).
- Nenhuma ferramenta é exposta ao modelo nesta execução.
- Efeitos colaterais devem ser tratados fora desta ferramenta (por exemplo, aprovações no
  Lobster) antes de chamar ferramentas que enviam mensagens/e-mails.

## Nota sobre extensão incluída

Esta extensão depende de módulos internos do OpenCraft (o executor de agentes embutido).
Ela foi projetada para ser distribuída como uma extensão **incluída** do OpenCraft (como o `lobster`) e
ativada via `plugins.entries` + listas de permissões de ferramentas.

Ela **não** foi projetada para ser copiada para
`~/.opencraft/extensions` como um diretório de plugin independente.
