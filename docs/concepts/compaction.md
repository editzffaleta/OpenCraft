---
summary: "Janela de contexto + compactação: como o OpenCraft mantém sessões dentro dos limites do modelo"
read_when:
  - Você quer entender a auto-compactação e o /compact
  - Você está depurando sessões longas atingindo limites de contexto
title: "Compaction"
---

# Janela de Contexto e Compactação

Todo modelo tem uma **janela de contexto** (máximo de tokens que ele pode ver). Conversas longas acumulam mensagens e resultados de ferramentas; quando a janela fica apertada, o OpenCraft **compacta** o histórico mais antigo para permanecer dentro dos limites.

## O que é compactação

A compactação **resume a conversa mais antiga** em uma entrada de resumo compacto e mantém as mensagens recentes intactas. O resumo é armazenado no histórico da sessão, então futuras requisições usam:

- O resumo da compactação
- Mensagens recentes após o ponto de compactação

A compactação **persiste** no histórico JSONL da sessão.

## Configuração

Use a configuração `agents.defaults.compaction` no seu `opencraft.json` para configurar o comportamento de compactação (modo, tokens alvo, etc.).
A sumarização da compactação preserva identificadores opacos por padrão (`identifierPolicy: "strict"`). Você pode sobrescrever isso com `identifierPolicy: "off"` ou fornecer texto personalizado com `identifierPolicy: "custom"` e `identifierInstructions`.

Você pode opcionalmente especificar um modelo diferente para sumarização de compactação via `agents.defaults.compaction.model`. Isso é útil quando seu modelo principal é um modelo local ou pequeno e você quer que os resumos de compactação sejam produzidos por um modelo mais capaz. A sobrescrita aceita qualquer string `provider/model-id`:

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

Isso também funciona com modelos locais, por exemplo um segundo modelo Ollama dedicado à sumarização ou um especialista em compactação ajustado:

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

Quando não definido, a compactação usa o modelo principal do agente.

## Auto-compactação (ativada por padrão)

Quando uma sessão se aproxima ou excede a janela de contexto do modelo, o OpenCraft aciona a auto-compactação e pode retentatar a requisição original usando o contexto compactado.

Você verá:

- `🧹 Auto-compaction complete` no modo verbose
- `/status` mostrando `🧹 Compactions: <count>`

Antes da compactação, o OpenCraft pode executar um turno **silencioso de flush de memória** para armazenar
notas duráveis no disco. Veja [Memória](/concepts/memory) para detalhes e configuração.

## Compactação manual

Use `/compact` (opcionalmente com instruções) para forçar uma passagem de compactação:

```
/compact Focus on decisions and open questions
```

## Origem da janela de contexto

A janela de contexto é específica do modelo. O OpenCraft usa a definição do modelo do catálogo de provedor configurado para determinar os limites.

## Compactação vs pruning

- **Compactação**: resume e **persiste** no JSONL.
- **Pruning de sessão**: reduz apenas **resultados de ferramentas** antigos, **em memória**, por requisição.

Veja [/concepts/session-pruning](/concepts/session-pruning) para detalhes de pruning.

## Compactação server-side da OpenAI

O OpenCraft também suporta hints de compactação server-side do OpenAI Responses para
modelos OpenAI diretos compatíveis. Isso é separado da compactação local do OpenCraft
e pode funcionar junto com ela.

- Compactação local: o OpenCraft resume e persiste no JSONL da sessão.
- Compactação server-side: a OpenAI compacta o contexto no lado do provedor quando
  `store` + `context_management` estão habilitados.

Veja [Provedor OpenAI](/providers/openai) para parâmetros de modelo e sobrescritas.

## Dicas

- Use `/compact` quando as sessões parecerem defasadas ou o contexto estiver inchado.
- Saídas grandes de ferramentas já são truncadas; o pruning pode reduzir ainda mais o acúmulo de resultados de ferramentas.
- Se você precisa de uma lousa limpa, `/new` ou `/reset` inicia uma nova sessão.
