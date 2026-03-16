---
title: "Poda de Sessão"
summary: "Poda de sessão: aparagem de resultados de ferramentas para reduzir inchaço de contexto"
read_when:
  - Você quer reduzir o crescimento de contexto do LLM a partir de saídas de ferramentas
  - Você está ajustando agents.defaults.contextPruning
---

# Poda de Sessão

A poda de sessão apara **resultados de ferramentas antigos** do contexto em memória logo antes de cada chamada ao LLM. Ela **não** reescreve o histórico de sessão em disco (`*.jsonl`).

## Quando roda

- Quando `mode: "cache-ttl"` está habilitado e a última chamada Anthropic para a sessão é mais antiga que `ttl`.
- Afeta apenas as mensagens enviadas ao modelo para aquela requisição.
- Ativo apenas para chamadas à API Anthropic (e modelos Anthropic no OpenRouter).
- Para melhores resultados, combine `ttl` com sua política de `cacheRetention` do modelo (`short` = 5m, `long` = 1h).
- Após uma poda, a janela de TTL é resetada para que requisições subsequentes mantenham cache até que `ttl` expire novamente.

## Padrões inteligentes (Anthropic)

- Perfis **OAuth ou setup-token**: habilitar poda `cache-ttl` e definir heartbeat para `1h`.
- Perfis **de chave de API**: habilitar poda `cache-ttl`, definir heartbeat para `30m` e padrão `cacheRetention: "short"` em modelos Anthropic.
- Se você definir qualquer um desses valores explicitamente, o OpenCraft **não** os sobrescreve.

## O que isso melhora (custo + comportamento de cache)

- **Por que podar:** O cache de prompt Anthropic só se aplica dentro do TTL. Se uma sessão ficar ociosa além do TTL, a próxima requisição re-armazena todo o prompt em cache a não ser que você o apare primeiro.
- **O que fica mais barato:** a poda reduz o tamanho de `cacheWrite` para aquela primeira requisição após o TTL expirar.
- **Por que o reset de TTL importa:** uma vez que a poda roda, a janela de cache é resetada, então requisições de acompanhamento podem reutilizar o prompt recém-armazenado em cache em vez de re-armazenar todo o histórico novamente.
- **O que ela não faz:** a poda não adiciona tokens ou "dobra" custos; ela apenas muda o que é armazenado em cache naquela primeira requisição pós-TTL.

## O que pode ser podado

- Apenas mensagens `toolResult`.
- Mensagens de usuário + assistente são **nunca** modificadas.
- As últimas `keepLastAssistants` mensagens de assistente são protegidas; resultados de ferramentas após esse corte não são podados.
- Se não houver mensagens de assistente suficientes para estabelecer o corte, a poda é ignorada.
- Resultados de ferramentas contendo **blocos de imagem** são pulados (nunca aparados/limpos).

## Estimativa da janela de contexto

A poda usa uma janela de contexto estimada (chars ≈ tokens × 4). A janela base é resolvida nesta ordem:

1. Override `models.providers.*.models[].contextWindow`.
2. `contextWindow` da definição do modelo (do registro de modelos).
3. Padrão de `200000` tokens.

Se `agents.defaults.contextTokens` estiver definido, é tratado como um limite (mínimo) na janela resolvida.

## Modo

### cache-ttl

- A poda só roda se a última chamada Anthropic for mais antiga que `ttl` (padrão `5m`).
- Quando roda: mesmo comportamento de soft-trim + hard-clear de antes.

## Poda suave vs rígida

- **Soft-trim**: apenas para resultados de ferramentas superdimensionados.
  - Mantém cabeça + cauda, insere `...` e anexa uma nota com o tamanho original.
  - Pula resultados com blocos de imagem.
- **Hard-clear**: substitui todo o resultado da ferramenta por `hardClear.placeholder`.

## Seleção de ferramentas

- `tools.allow` / `tools.deny` suportam wildcards `*`.
- Deny vence.
- O matching é insensível a maiúsculas/minúsculas.
- Lista de allow vazia => todas as ferramentas permitidas.

## Interação com outros limites

- Ferramentas embutidas já truncam sua própria saída; a poda de sessão é uma camada extra que impede que chats de longa duração acumulem saída excessiva de ferramentas no contexto do modelo.
- A compactação é separada: a compactação resume e persiste, a poda é transiente por requisição. Veja [/concepts/compaction](/concepts/compaction).

## Padrões (quando habilitada)

- `ttl`: `"5m"`
- `keepLastAssistants`: `3`
- `softTrimRatio`: `0.3`
- `hardClearRatio`: `0.5`
- `minPrunableToolChars`: `50000`
- `softTrim`: `{ maxChars: 4000, headChars: 1500, tailChars: 1500 }`
- `hardClear`: `{ enabled: true, placeholder: "[Old tool result content cleared]" }`

## Exemplos

Padrão (desligado):

```json5
{
  agents: { defaults: { contextPruning: { mode: "off" } } },
}
```

Habilitar poda com consciência de TTL:

```json5
{
  agents: { defaults: { contextPruning: { mode: "cache-ttl", ttl: "5m" } } },
}
```

Restringir poda a ferramentas específicas:

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl",
        tools: { allow: ["exec", "read"], deny: ["*image*"] },
      },
    },
  },
}
```

Veja a referência de config: [Configuração do Gateway](/gateway/configuration)
