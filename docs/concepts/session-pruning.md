---
title: "Session Pruning"
summary: "Session pruning: recorte de resultados de ferramentas para reduzir o inchaço de contexto"
read_when:
  - Você quer reduzir o crescimento de contexto do LLM a partir de saídas de ferramentas
  - Você está ajustando agents.defaults.contextPruning
---

# Session Pruning

Session pruning recorta **resultados antigos de ferramentas** do contexto em memória logo antes de cada chamada ao LLM. Ele **não** reescreve o histórico de sessão em disco (`*.jsonl`).

## Quando é executado

- Quando `mode: "cache-ttl"` está habilitado e a última chamada Anthropic para a sessão é mais antiga que o `ttl`.
- Afeta apenas as mensagens enviadas ao modelo para aquela requisição.
- Ativo apenas para chamadas à API da Anthropic (e modelos Anthropic via OpenRouter).
- Para melhores resultados, combine o `ttl` com a política de `cacheRetention` do seu modelo (`short` = 5m, `long` = 1h).
- Após um pruning, a janela de TTL é reiniciada, então as requisições subsequentes mantêm o cache até o `ttl` expirar novamente.

## Padrões inteligentes (Anthropic)

- Perfis **OAuth ou setup-token**: habilitam pruning `cache-ttl` e definem heartbeat para `1h`.
- Perfis **API key**: habilitam pruning `cache-ttl`, definem heartbeat para `30m` e usam `cacheRetention: "short"` como padrão em modelos Anthropic.
- Se você definir qualquer um desses valores explicitamente, o OpenCraft **não** os sobrescreve.

## O que isso melhora (custo + comportamento de cache)

- **Por que fazer pruning:** O cache de prompt da Anthropic só se aplica dentro do TTL. Se uma sessão ficar ociosa além do TTL, a próxima requisição recacheia o prompt completo, a menos que você o recorte primeiro.
- **O que fica mais barato:** o pruning reduz o tamanho do **cacheWrite** para aquela primeira requisição após o TTL expirar.
- **Por que o reset do TTL importa:** uma vez que o pruning é executado, a janela de cache é reiniciada, então as requisições seguintes podem reutilizar o prompt recém-cacheado em vez de recachear o histórico completo novamente.
- **O que ele não faz:** o pruning não adiciona Token ou "dobra" custos; ele apenas muda o que é cacheado naquela primeira requisição pós-TTL.

## O que pode ser podado

- Apenas mensagens `toolResult`.
- Mensagens de usuário e assistente **nunca** são modificadas.
- As últimas `keepLastAssistants` mensagens do assistente são protegidas; resultados de ferramentas após esse ponto de corte não são podados.
- Se não houver mensagens de assistente suficientes para estabelecer o ponto de corte, o pruning é ignorado.
- Resultados de ferramentas contendo **blocos de imagem** são ignorados (nunca recortados/limpos).

## Estimativa da janela de contexto

O pruning usa uma janela de contexto estimada (caracteres ≈ tokens × 4). A janela base é resolvida nesta ordem:

1. Override em `models.providers.*.models[].contextWindow`.
2. `contextWindow` da definição do modelo (do registro de modelos).
3. Padrão de `200000` Token.

Se `agents.defaults.contextTokens` estiver definido, ele é tratado como um limite (mínimo) na janela resolvida.

## Modo

### cache-ttl

- O pruning só é executado se a última chamada Anthropic for mais antiga que o `ttl` (padrão `5m`).
- Quando é executado: mesmo comportamento de soft-trim + hard-clear de antes.

## Pruning suave vs rígido

- **Soft-trim**: apenas para resultados de ferramentas grandes demais.
  - Mantém o início + final, insere `...` e adiciona uma nota com o tamanho original.
  - Ignora resultados com blocos de imagem.
- **Hard-clear**: substitui o resultado inteiro da ferramenta por `hardClear.placeholder`.

## Seleção de ferramentas

- `tools.allow` / `tools.deny` suportam curingas `*`.
- Deny vence.
- A correspondência é case-insensitive.
- Lista de allow vazia => todas as ferramentas são permitidas.

## Interação com outros limites

- Ferramentas integradas já truncam sua própria saída; session pruning é uma camada extra que evita que conversas longas acumulem muita saída de ferramentas no contexto do modelo.
- Compactação é separada: compactação resume e persiste, pruning é transitório por requisição. Veja [/concepts/compaction](/concepts/compaction).

## Padrões (quando habilitado)

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

Habilitar pruning com reconhecimento de TTL:

```json5
{
  agents: { defaults: { contextPruning: { mode: "cache-ttl", ttl: "5m" } } },
}
```

Restringir pruning a ferramentas específicas:

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

Veja a referência de configuração: [Gateway Configuration](/gateway/configuration)
