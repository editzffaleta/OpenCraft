---
title: "Cache de Prompt"
summary: "Controles de cache de prompt, ordem de merge, comportamento por provedor e padrões de ajuste"
read_when:
  - Você quer reduzir custos de tokens de prompt com retenção de cache
  - Você precisa de comportamento de cache por agente em configurações multi-agente
  - Você está ajustando heartbeat e poda cache-ttl juntos
---

# Cache de prompt

O cache de prompt significa que o provedor de modelo pode reutilizar prefixos de prompt inalterados (geralmente instruções de sistema/desenvolvedor e outros contextos estáveis) entre os turnos em vez de reprocessá-los a cada vez. A primeira requisição correspondente escreve tokens de cache (`cacheWrite`), e requisições correspondentes posteriores podem lê-los de volta (`cacheRead`).

Por que isso importa: menor custo de tokens, respostas mais rápidas e desempenho mais previsível para sessões de longa duração. Sem caching, prompts repetidos pagam o custo completo do prompt a cada turno, mesmo quando a maior parte da entrada não mudou.

Esta página cobre todos os controles relacionados a cache que afetam a reutilização de prompts e o custo de tokens.

Para detalhes de preços da Anthropic, veja:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

## Controles principais

### `cacheRetention` (modelo e por agente)

Defina a retenção de cache nos parâmetros do modelo:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Override por agente:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Ordem de merge de config:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (id de agente correspondente; sobrescreve por chave)

### `cacheControlTtl` legado

Valores legados ainda são aceitos e mapeados:

- `5m` -> `short`
- `1h` -> `long`

Prefira `cacheRetention` para nova configuração.

### `contextPruning.mode: "cache-ttl"`

Poda o contexto antigo de tool-result após janelas de TTL de cache para que requisições pós-inatividade não rearmazenem em cache histórico muito grande.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Veja [Poda de Sessão](/concepts/session-pruning) para comportamento completo.

### Keep-warm de heartbeat

O heartbeat pode manter as janelas de cache aquecidas e reduzir escritas de cache repetidas após lacunas de inatividade.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

O heartbeat por agente é suportado em `agents.list[].heartbeat`.

## Comportamento por provedor

### Anthropic (API direta)

- `cacheRetention` é suportado.
- Com perfis de auth de chave API da Anthropic, o OpenCraft semeia `cacheRetention: "short"` para refs de modelos Anthropic quando não definido.

### Amazon Bedrock

- Refs de modelos Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) suportam passagem explícita de `cacheRetention`.
- Modelos Bedrock não-Anthropic são forçados para `cacheRetention: "none"` em runtime.

### Modelos Anthropic no OpenRouter

Para refs de modelos `openrouter/anthropic/*`, o OpenCraft injeta `cache_control` da Anthropic em blocos de prompt de sistema/desenvolvedor para melhorar a reutilização do cache de prompt.

### Outros provedores

Se o provedor não suporta este modo de cache, `cacheRetention` não tem efeito.

## Padrões de ajuste

### Tráfego misto (padrão recomendado)

Mantenha uma linha de base de longa duração no seu agente principal, desabilite caching em agentes notificadores com muita atividade:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Linha de base com foco em custo

- Defina `cacheRetention: "short"` como linha de base.
- Habilite `contextPruning.mode: "cache-ttl"`.
- Mantenha o heartbeat abaixo do seu TTL apenas para agentes que se beneficiam de caches aquecidos.

## Diagnósticos de cache

O OpenCraft expõe diagnósticos dedicados de cache-trace para execuções de agente embutidas.

### Config `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.opencraft/logs/cache-trace.jsonl" # opcional
    includeMessages: false # padrão true
    includePrompt: false # padrão true
    includeSystem: false # padrão true
```

Padrões:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Toggles de env (depuração pontual)

- `OPENCLAW_CACHE_TRACE=1` habilita o cache tracing.
- `OPENCLAW_CACHE_TRACE_FILE=/caminho/para/cache-trace.jsonl` sobrescreve o caminho de saída.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` alterna a captura de payload completo de mensagens.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` alterna a captura de texto do prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` alterna a captura do system prompt.

### O que inspecionar

- Os eventos de cache trace são JSONL e incluem snapshots em estágio como `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- O impacto de tokens de cache por turno é visível nas superfícies de uso normais via `cacheRead` e `cacheWrite` (por exemplo `/usage full` e resumos de uso de sessão).

## Troubleshooting rápido

- `cacheWrite` alto na maioria dos turnos: verifique entradas de system prompt voláteis e confirme se o modelo/provedor suporta suas configurações de cache.
- Nenhum efeito de `cacheRetention`: confirme se a chave do modelo corresponde a `agents.defaults.models["provider/model"]`.
- Requisições Bedrock Nova/Mistral com configurações de cache: forçamento esperado para `none` em runtime.

Docs relacionados:

- [Anthropic](/providers/anthropic)
- [Uso e Custos de Tokens](/reference/token-use)
- [Poda de Sessão](/concepts/session-pruning)
- [Referência de Configuração do Gateway](/gateway/configuration-reference)
