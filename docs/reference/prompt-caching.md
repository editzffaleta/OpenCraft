---
title: "Prompt Caching"
summary: "Controles de prompt caching, ordem de merge, comportamento por provedor e padrões de ajuste"
read_when:
  - Você quer reduzir custos de tokens de prompt com retenção de cache
  - Você precisa de comportamento de cache por agente em configurações multi-agente
  - Você está ajustando heartbeat e poda de cache-ttl juntos
---

# Prompt caching

Prompt caching significa que o provedor de modelo pode reutilizar prefixos de prompt inalterados (geralmente instruções de sistema/desenvolvedor e outro contexto estável) entre turnos, em vez de reprocessá-los toda vez. A primeira requisição correspondente escreve tokens de cache (`cacheWrite`), e requisições correspondentes posteriores podem lê-los de volta (`cacheRead`).

Por que isso importa: menor custo de tokens, respostas mais rápidas e desempenho mais previsível para sessões de longa duração. Sem caching, prompts repetidos pagam o custo total do prompt a cada turno, mesmo quando a maior parte da entrada não mudou.

Esta página cobre todos os controles relacionados a cache que afetam a reutilização de prompt e o custo de tokens.

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

Substituição por agente:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Ordem de merge da config:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (id do agente correspondente; substitui por chave)

### `cacheControlTtl` legado

Valores legados ainda são aceitos e mapeados:

- `5m` -> `short`
- `1h` -> `long`

Prefira `cacheRetention` para novas configs.

### `contextPruning.mode: "cache-ttl"`

Poda contexto antigo de resultados de ferramentas após janelas de TTL de cache para que requisições pós-ociosidade não recacheiem histórico superdimensionado.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Veja [Poda de Sessão](/concepts/session-pruning) para o comportamento completo.

### Manutenção de cache por heartbeat

O heartbeat pode manter janelas de cache aquecidas e reduzir escritas de cache repetidas após intervalos ociosos.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat por agente é suportado em `agents.list[].heartbeat`.

## Comportamento por provedor

### Anthropic (API direta)

- `cacheRetention` é suportado.
- Com perfis de autenticação por chave de API Anthropic, o OpenCraft define `cacheRetention: "short"` para refs de modelo Anthropic quando não configurado.

### Amazon Bedrock

- Refs de modelo Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) suportam passagem explícita de `cacheRetention`.
- Modelos Bedrock não-Anthropic são forçados para `cacheRetention: "none"` em tempo de execução.

### Modelos Anthropic via OpenRouter

Para refs de modelo `openrouter/anthropic/*`, o OpenCraft injeta `cache_control` da Anthropic em blocos de prompt de sistema/desenvolvedor para melhorar a reutilização de prompt-cache.

### Outros provedores

Se o provedor não suporta este modo de cache, `cacheRetention` não tem efeito.

## Padrões de ajuste

### Tráfego misto (padrão recomendado)

Mantenha uma baseline de longa duração no seu agente principal, desabilite caching em agentes notificadores intermitentes:

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

### Baseline focada em custo

- Defina a baseline `cacheRetention: "short"`.
- Habilite `contextPruning.mode: "cache-ttl"`.
- Mantenha o heartbeat abaixo do seu TTL apenas para agentes que se beneficiam de caches aquecidos.

## Diagnósticos de cache

O OpenCraft expõe diagnósticos dedicados de rastreamento de cache para execuções de agentes embutidos.

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

- `filePath`: `$OPENCRAFT_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Toggles de ambiente (depuração pontual)

- `OPENCRAFT_CACHE_TRACE=1` habilita rastreamento de cache.
- `OPENCRAFT_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` substitui o caminho de saída.
- `OPENCRAFT_CACHE_TRACE_MESSAGES=0|1` alterna captura completa de payload de mensagens.
- `OPENCRAFT_CACHE_TRACE_PROMPT=0|1` alterna captura de texto do prompt.
- `OPENCRAFT_CACHE_TRACE_SYSTEM=0|1` alterna captura do prompt de sistema.

### O que inspecionar

- Eventos de rastreamento de cache são JSONL e incluem snapshots preparados como `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- O impacto de tokens de cache por turno é visível nas superfícies normais de uso via `cacheRead` e `cacheWrite` (por exemplo `/usage full` e resumos de uso de sessão).

## Solução rápida de problemas

- Alto `cacheWrite` na maioria dos turnos: verifique entradas voláteis do prompt de sistema e confirme que o modelo/provedor suporta suas configurações de cache.
- Sem efeito de `cacheRetention`: confirme que a chave do modelo corresponde a `agents.defaults.models["provider/model"]`.
- Requisições Bedrock Nova/Mistral com configurações de cache: forçamento esperado em tempo de execução para `none`.

Documentos relacionados:

- [Anthropic](/providers/anthropic)
- [Uso e Custos de Token](/reference/token-use)
- [Poda de Sessão](/concepts/session-pruning)
- [Referência de Configuração do Gateway](/gateway/configuration-reference)
