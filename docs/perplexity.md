---
summary: "Perplexity Search API e compatibilidade Sonar/OpenRouter para web_search"
read_when:
  - Você quer usar o Perplexity Search para busca na web
  - Você precisa de configuração de PERPLEXITY_API_KEY ou OPENROUTER_API_KEY
title: "Perplexity Search"
---

# Perplexity Search API

O OpenCraft suporta a Perplexity Search API como provedor de `web_search`.
Ela retorna resultados estruturados com campos `title`, `url` e `snippet`.

Para compatibilidade, o OpenCraft também suporta configurações legadas de Perplexity Sonar/OpenRouter.
Se você usar `OPENROUTER_API_KEY`, uma chave `sk-or-...` em `tools.web.search.perplexity.apiKey`, ou definir `tools.web.search.perplexity.baseUrl` / `model`, o provedor muda para o caminho de chat-completions e retorna respostas sintetizadas por IA com citações em vez de resultados estruturados da Search API.

## Obtendo uma chave de API do Perplexity

1. Crie uma conta no Perplexity em [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Gere uma chave de API no dashboard
3. Armazene a chave na config ou defina `PERPLEXITY_API_KEY` no ambiente do Gateway.

## Compatibilidade com OpenRouter

Se você já usava o OpenRouter para Perplexity Sonar, mantenha `provider: "perplexity"` e defina `OPENROUTER_API_KEY` no ambiente do Gateway, ou armazene uma chave `sk-or-...` em `tools.web.search.perplexity.apiKey`.

Controles legados opcionais:

- `tools.web.search.perplexity.baseUrl`
- `tools.web.search.perplexity.model`

## Exemplos de config

### Perplexity Search API nativa

```json5
{
  tools: {
    web: {
      search: {
        provider: "perplexity",
        perplexity: {
          apiKey: "pplx-...",
        },
      },
    },
  },
}
```

### Compatibilidade OpenRouter / Sonar

```json5
{
  tools: {
    web: {
      search: {
        provider: "perplexity",
        perplexity: {
          apiKey: "<openrouter-api-key>",
          baseUrl: "https://openrouter.ai/api/v1",
          model: "perplexity/sonar-pro",
        },
      },
    },
  },
}
```

## Onde definir a chave

**Via config:** rode `opencraft configure --section web`. Armazena a chave em
`~/.opencraft/opencraft.json` sob `tools.web.search.perplexity.apiKey`.
Este campo também aceita objetos SecretRef.

**Via ambiente:** defina `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`
no ambiente do processo do Gateway. Para uma instalação de gateway, coloque em
`~/.opencraft/.env` (ou no ambiente do serviço). Veja [Variáveis de env](/help/faq#how-does-openclaw-load-environment-variables).

Se `provider: "perplexity"` estiver configurado e o SecretRef da chave Perplexity não for resolvido sem fallback de env, a inicialização/recarga falha rapidamente.

## Parâmetros da tool

Estes parâmetros se aplicam ao caminho nativo da Perplexity Search API.

| Parâmetro             | Descrição                                                    |
| --------------------- | ------------------------------------------------------------ |
| `query`               | Consulta de busca (obrigatório)                              |
| `count`               | Número de resultados a retornar (1-10, padrão: 5)            |
| `country`             | Código de país ISO de 2 letras (ex.: "US", "BR")             |
| `language`            | Código de idioma ISO 639-1 (ex.: "en", "pt", "fr")          |
| `freshness`           | Filtro de tempo: `day` (24h), `week`, `month` ou `year`     |
| `date_after`          | Apenas resultados publicados após esta data (YYYY-MM-DD)     |
| `date_before`         | Apenas resultados publicados antes desta data (YYYY-MM-DD)   |
| `domain_filter`       | Array de allowlist/denylist de domínios (máx 20)             |
| `max_tokens`          | Orçamento total de conteúdo (padrão: 25000, máx: 1000000)   |
| `max_tokens_per_page` | Limite de tokens por página (padrão: 2048)                   |

Para o caminho de compatibilidade legado Sonar/OpenRouter, apenas `query` e `freshness` são suportados.
Filtros exclusivos da Search API como `country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens` e `max_tokens_per_page` retornam erros explícitos.

**Exemplos:**

```javascript
// Busca específica por país e idioma
await web_search({
  query: "energia renovável",
  country: "BR",
  language: "pt",
});

// Resultados recentes (última semana)
await web_search({
  query: "notícias de IA",
  freshness: "week",
});

// Busca por intervalo de datas
await web_search({
  query: "desenvolvimentos em IA",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtragem de domínio (allowlist)
await web_search({
  query: "pesquisa climática",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Filtragem de domínio (denylist - prefixo com -)
await web_search({
  query: "avaliações de produtos",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Mais extração de conteúdo
await web_search({
  query: "pesquisa detalhada de IA",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Regras de filtro de domínio

- Máximo de 20 domínios por filtro
- Não é possível misturar allowlist e denylist na mesma requisição
- Use o prefixo `-` para entradas de denylist (ex.: `["-reddit.com"]`)

## Notas

- A Perplexity Search API retorna resultados de busca na web estruturados (`title`, `url`, `snippet`)
- OpenRouter ou `baseUrl` / `model` explícito muda o Perplexity de volta para chat completions do Sonar para compatibilidade
- Os resultados são armazenados em cache por 15 minutos por padrão (configurável via `cacheTtlMinutes`)

Veja [Ferramentas Web](/tools/web) para a configuração completa de web_search.
Veja a [documentação da Perplexity Search API](https://docs.perplexity.ai/docs/search/quickstart) para mais detalhes.
