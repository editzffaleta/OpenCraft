---
summary: "Janela de contexto + compactação: como o OpenCraft mantém sessões dentro dos limites do modelo"
read_when:
  - Você quer entender a auto-compactação e /compact
  - Você está depurando sessões longas que atingem limites de contexto
title: "Compactação"
---

# Janela de Contexto & Compactação

Todo modelo tem uma **janela de contexto** (máximo de tokens que pode ver). Chats de longa duração acumulam mensagens e resultados de ferramentas; uma vez que a janela esteja apertada, o OpenCraft **compacta** o histórico mais antigo para ficar dentro dos limites.

## O que é compactação

A compactação **resume a conversa mais antiga** em uma entrada de resumo compacto e mantém as mensagens recentes intactas. O resumo é armazenado no histórico da sessão, então requisições futuras usam:

- O resumo de compactação
- Mensagens recentes após o ponto de compactação

A compactação **persiste** no histórico JSONL da sessão.

## Configuração

Use a configuração `agents.defaults.compaction` em seu `opencraft.json` para configurar o comportamento de compactação (modo, tokens alvo, etc.).
A sumarização de compactação preserva identificadores opacos por padrão (`identifierPolicy: "strict"`). Você pode sobrescrever isso com `identifierPolicy: "off"` ou fornecer texto personalizado com `identifierPolicy: "custom"` e `identifierInstructions`.

Você pode opcionalmente especificar um modelo diferente para sumarização de compactação via `agents.defaults.compaction.model`. Isso é útil quando seu modelo primário é local ou pequeno e você quer que os resumos de compactação sejam produzidos por um modelo mais capaz. O override aceita qualquer string `provider/model-id`:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-5"
      }
    }
  }
}
```

Isso também funciona com modelos locais, por exemplo um segundo modelo Ollama dedicado à sumarização ou um especialista de compactação fine-tuned:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Quando não definido, a compactação usa o modelo primário do agente.

## Auto-compactação (ativada por padrão)

Quando uma sessão se aproxima ou excede a janela de contexto do modelo, o OpenCraft aciona a auto-compactação e pode tentar novamente a requisição original usando o contexto compactado.

Você verá:

- `🧹 Auto-compaction complete` no modo verbose
- `/status` mostrando `🧹 Compactions: <contagem>`

Antes da compactação, o OpenCraft pode executar uma **rodada silenciosa de flush de memória** para armazenar notas duráveis em disco. Veja [Memória](/concepts/memory) para detalhes e configuração.

## Compactação manual

Use `/compact` (opcionalmente com instruções) para forçar uma passagem de compactação:

```
/compact Foque em decisões e questões abertas
```

## Fonte da janela de contexto

A janela de contexto é específica por modelo. O OpenCraft usa a definição do modelo do catálogo do provedor configurado para determinar os limites.

## Compactação vs poda

- **Compactação**: resume e **persiste** no JSONL.
- **Poda de sessão**: apara resultados de ferramentas antigos apenas **em memória**, por requisição.

Veja [/concepts/session-pruning](/concepts/session-pruning) para detalhes de poda.

## Compactação server-side do OpenAI

O OpenCraft também suporta hints de compactação server-side do OpenAI Responses para
modelos OpenAI diretos compatíveis. Isso é separado da compactação local do OpenCraft
e pode funcionar junto com ela.

- Compactação local: o OpenCraft resume e persiste no JSONL da sessão.
- Compactação server-side: o OpenAI compacta o contexto no lado do provedor quando
  `store` + `context_management` estão habilitados.

Veja [provedor OpenAI](/providers/openai) para parâmetros de modelo e overrides.

## Dicas

- Use `/compact` quando as sessões parecerem obsoletas ou o contexto estiver saturado.
- Outputs grandes de ferramentas já são truncados; a poda pode reduzir ainda mais o acúmulo de resultados de ferramentas.
- Se você precisar de uma lousa em branco, `/new` ou `/reset` inicia um novo ID de sessão.
