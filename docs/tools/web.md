---
summary: "Ferramentas de pesquisa + fetch web (provedores Brave, Firecrawl, Gemini, Grok, Kimi e Perplexity)"
read_when:
  - Você quer habilitar web_search ou web_fetch
  - Você precisa de configuração de chave de API de provedor
  - Você quer usar Gemini com Google Search grounding
title: "Ferramentas Web"
---

# Ferramentas web

O OpenCraft inclui duas ferramentas web leves:

- `web_search` -- Pesquisar na web usando Brave Search API, Firecrawl Search, Gemini com Google Search grounding, Grok, Kimi ou Perplexity Search API.
- `web_fetch` -- HTTP fetch + extração legível (HTML -> markdown/texto).

Estas **não** são automação de browser. Para sites pesados em JS ou logins, use a
[ferramenta Browser](/tools/browser).

## Como funciona

- `web_search` chama seu provedor configurado e retorna resultados.
- Resultados são cacheados por consulta por 15 minutos (configurável).
- `web_fetch` faz um GET HTTP simples e extrai conteúdo legível
  (HTML -> markdown/texto). Ele **não** executa JavaScript.
- `web_fetch` é habilitado por padrão (a menos que explicitamente desabilitado).
- O Plugin Firecrawl integrado também adiciona `firecrawl_search` e `firecrawl_scrape` quando habilitado.

Veja [Configuração do Brave Search](/brave-search) e [Configuração do Perplexity Search](/perplexity) para detalhes específicos do provedor.

## Escolhendo um provedor de pesquisa

| Provedor                  | Formato do resultado                     | Filtros específicos do provedor                             | Notas                                                                                      | Chave de API                                |
| ------------------------- | ---------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------- |
| **Brave Search API**      | Resultados estruturados com snippets     | `country`, `language`, `ui_lang`, tempo                     | Suporta modo `llm-context` do Brave                                                        | `BRAVE_API_KEY`                             |
| **Firecrawl Search**      | Resultados estruturados com snippets     | Use `firecrawl_search` para opções específicas do Firecrawl | Melhor para combinar pesquisa com scraping/extração Firecrawl                              | `FIRECRAWL_API_KEY`                         |
| **Gemini**                | Respostas sintetizadas por IA + citações | --                                                          | Usa Google Search grounding                                                                | `GEMINI_API_KEY`                            |
| **Grok**                  | Respostas sintetizadas por IA + citações | --                                                          | Usa respostas web-grounded da xAI                                                          | `XAI_API_KEY`                               |
| **Kimi**                  | Respostas sintetizadas por IA + citações | --                                                          | Usa pesquisa web Moonshot                                                                  | `KIMI_API_KEY` / `MOONSHOT_API_KEY`         |
| **Perplexity Search API** | Resultados estruturados com snippets     | `country`, `language`, tempo, `domain_filter`               | Suporta controles de extração de conteúdo; OpenRouter usa caminho de compatibilidade Sonar | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` |

### Auto-detecção

A tabela acima é alfabética. Se nenhum `provider` for explicitamente definido, a auto-detecção em runtime verifica provedores nesta ordem:

1. **Brave** -- variável de ambiente `BRAVE_API_KEY` ou config `tools.web.search.apiKey`
2. **Gemini** -- variável de ambiente `GEMINI_API_KEY` ou config `tools.web.search.gemini.apiKey`
3. **Grok** -- variável de ambiente `XAI_API_KEY` ou config `tools.web.search.grok.apiKey`
4. **Kimi** -- variável de ambiente `KIMI_API_KEY` / `MOONSHOT_API_KEY` ou config `tools.web.search.kimi.apiKey`
5. **Perplexity** -- `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` ou config `tools.web.search.perplexity.apiKey`
6. **Firecrawl** -- variável de ambiente `FIRECRAWL_API_KEY` ou config `tools.web.search.firecrawl.apiKey`

Se nenhuma chave for encontrada, recorre ao Brave (você receberá um erro de chave ausente pedindo para configurar uma).

Comportamento de SecretRef em runtime:

- SecretRefs de ferramentas web são resolvidos atomicamente na inicialização/reload do Gateway.
- No modo auto-detecção, o OpenCraft resolve apenas a chave do provedor selecionado. SecretRefs de provedores não selecionados permanecem inativos até selecionados.
- Se o SecretRef do provedor selecionado não estiver resolvido e nenhum fallback de variável de ambiente do provedor existir, a inicialização/reload falha imediatamente.

## Configurando pesquisa web

Use `opencraft configure --section web` para configurar sua chave de API e escolher um provedor.

### Brave Search

1. Crie uma conta Brave Search API em [brave.com/search/api](https://brave.com/search/api/)
2. No painel, escolha o plano **Search** e gere uma chave de API.
3. Execute `opencraft configure --section web` para armazenar a chave na config, ou defina `BRAVE_API_KEY` no seu ambiente.

Cada plano Brave inclui **\$5/mês em crédito gratuito** (renovável). O plano Search
custa \$5 por 1.000 requisições, então o crédito cobre 1.000 consultas/mês. Defina
seu limite de uso no painel Brave para evitar cobranças inesperadas. Veja o
[portal de API Brave](https://brave.com/search/api/) para planos e
preços atuais.

### Perplexity Search

1. Crie uma conta Perplexity em [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Gere uma chave de API no painel
3. Execute `opencraft configure --section web` para armazenar a chave na config, ou defina `PERPLEXITY_API_KEY` no seu ambiente.

Para compatibilidade legada Sonar/OpenRouter, defina `OPENROUTER_API_KEY` em vez disso, ou configure `tools.web.search.perplexity.apiKey` com uma chave `sk-or-...`. Definir `tools.web.search.perplexity.baseUrl` ou `model` também opta Perplexity de volta ao caminho de compatibilidade chat-completions.

Veja [Documentação da API Perplexity Search](https://docs.perplexity.ai/guides/search-quickstart) para mais detalhes.

### Onde armazenar a chave

**Via config:** execute `opencraft configure --section web`. Armazena a chave no caminho de config específico do provedor:

- Brave: `tools.web.search.apiKey`
- Firecrawl: `tools.web.search.firecrawl.apiKey`
- Gemini: `tools.web.search.gemini.apiKey`
- Grok: `tools.web.search.grok.apiKey`
- Kimi: `tools.web.search.kimi.apiKey`
- Perplexity: `tools.web.search.perplexity.apiKey`

Todos esses campos também suportam objetos SecretRef.

**Via ambiente:** defina variáveis de ambiente do provedor no ambiente do processo do Gateway:

- Brave: `BRAVE_API_KEY`
- Firecrawl: `FIRECRAWL_API_KEY`
- Gemini: `GEMINI_API_KEY`
- Grok: `XAI_API_KEY`
- Kimi: `KIMI_API_KEY` ou `MOONSHOT_API_KEY`
- Perplexity: `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`

Para uma instalação de Gateway, coloque em `~/.opencraft/.env` (ou seu ambiente de serviço). Veja [Variáveis de ambiente](/help/faq#how-does-opencraft-load-environment-variables).

### Exemplos de config

**Brave Search:**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "brave",
        apiKey: "YOUR_BRAVE_API_KEY", // opcional se BRAVE_API_KEY está definido // pragma: allowlist secret
      },
    },
  },
}
```

**Firecrawl Search:**

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
      },
    },
  },
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "firecrawl",
        firecrawl: {
          apiKey: "fc-...", // opcional se FIRECRAWL_API_KEY está definido
          baseUrl: "https://api.firecrawl.dev",
        },
      },
    },
  },
}
```

Quando você escolhe Firecrawl no onboarding ou `opencraft configure --section web`, o OpenCraft habilita o Plugin Firecrawl integrado automaticamente para que `web_search`, `firecrawl_search` e `firecrawl_scrape` estejam todos disponíveis.

**Modo Brave LLM Context:**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "brave",
        apiKey: "YOUR_BRAVE_API_KEY", // opcional se BRAVE_API_KEY está definido // pragma: allowlist secret
        brave: {
          mode: "llm-context",
        },
      },
    },
  },
}
```

`llm-context` retorna trechos de página extraídos para grounding em vez de snippets padrão do Brave.
Neste modo, `country` e `language` / `search_lang` ainda funcionam, mas `ui_lang`,
`freshness`, `date_after` e `date_before` são rejeitados.

**Perplexity Search:**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "perplexity",
        perplexity: {
          apiKey: "pplx-...", // opcional se PERPLEXITY_API_KEY está definido
        },
      },
    },
  },
}
```

**Perplexity via OpenRouter / compatibilidade Sonar:**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "perplexity",
        perplexity: {
          apiKey: "<openrouter-api-key>", // opcional se OPENROUTER_API_KEY está definido
          baseUrl: "https://openrouter.ai/api/v1",
          model: "perplexity/sonar-pro",
        },
      },
    },
  },
}
```

## Usando Gemini (Google Search grounding)

Modelos Gemini suportam [Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding) integrado,
que retorna respostas sintetizadas por IA apoiadas por resultados ao vivo do Google Search com citações.

### Obtendo uma chave de API Gemini

1. Vá para [Google AI Studio](https://aistudio.google.com/apikey)
2. Crie uma chave de API
3. Defina `GEMINI_API_KEY` no ambiente do Gateway, ou configure `tools.web.search.gemini.apiKey`

### Configurando pesquisa Gemini

```json5
{
  tools: {
    web: {
      search: {
        provider: "gemini",
        gemini: {
          // Chave de API (opcional se GEMINI_API_KEY está definido)
          apiKey: "AIza...",
          // Modelo (padrão "gemini-2.5-flash")
          model: "gemini-2.5-flash",
        },
      },
    },
  },
}
```

**Alternativa via ambiente:** defina `GEMINI_API_KEY` no ambiente do Gateway.
Para uma instalação de Gateway, coloque em `~/.opencraft/.env`.

### Notas

- URLs de citação do Gemini grounding são automaticamente resolvidas das
  URLs de redirecionamento do Google para URLs diretas.
- A resolução de redirecionamento usa o caminho de proteção SSRF (HEAD + verificações de redirecionamento + validação http/https) antes de retornar a URL final da citação.
- A resolução de redirecionamento usa padrões estritos de SSRF, então redirecionamentos para alvos privados/internos são bloqueados.
- O modelo padrão (`gemini-2.5-flash`) é rápido e econômico.
  Qualquer modelo Gemini que suporte grounding pode ser usado.

## web_search

Pesquisar na web usando seu provedor configurado.

### Requisitos

- `tools.web.search.enabled` não deve ser `false` (padrão: habilitado)
- Chave de API para seu provedor escolhido:
  - **Brave**: `BRAVE_API_KEY` ou `tools.web.search.apiKey`
  - **Firecrawl**: `FIRECRAWL_API_KEY` ou `tools.web.search.firecrawl.apiKey`
  - **Gemini**: `GEMINI_API_KEY` ou `tools.web.search.gemini.apiKey`
  - **Grok**: `XAI_API_KEY` ou `tools.web.search.grok.apiKey`
  - **Kimi**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` ou `tools.web.search.kimi.apiKey`
  - **Perplexity**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` ou `tools.web.search.perplexity.apiKey`
- Todos os campos de chave de provedor acima suportam objetos SecretRef.

### Config

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "BRAVE_API_KEY_HERE", // opcional se BRAVE_API_KEY está definido
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

### Parâmetros da ferramenta

Os parâmetros dependem do provedor selecionado.

O caminho de compatibilidade OpenRouter / Sonar do Perplexity suporta apenas `query` e `freshness`.
Se você definir `tools.web.search.perplexity.baseUrl` / `model`, usar `OPENROUTER_API_KEY` ou configurar uma chave `sk-or-...`, filtros exclusivos da Search API retornam erros explícitos.

| Parâmetro             | Descrição                                                     |
| --------------------- | ------------------------------------------------------------- |
| `query`               | Consulta de pesquisa (obrigatório)                            |
| `count`               | Resultados a retornar (1-10, padrão: 5)                       |
| `country`             | Código ISO de país com 2 letras (ex., "US", "DE")             |
| `language`            | Código ISO 639-1 de idioma (ex., "en", "de")                  |
| `freshness`           | Filtro de tempo: `day`, `week`, `month` ou `year`             |
| `date_after`          | Resultados após esta data (YYYY-MM-DD)                        |
| `date_before`         | Resultados antes desta data (YYYY-MM-DD)                      |
| `ui_lang`             | Código de idioma da UI (apenas Brave)                         |
| `domain_filter`       | Array de allowlist/denylist de domínio (apenas Perplexity)    |
| `max_tokens`          | Orçamento total de conteúdo, padrão 25000 (apenas Perplexity) |
| `max_tokens_per_page` | Limite de Token por página, padrão 2048 (apenas Perplexity)   |

`web_search` do Firecrawl suporta `query` e `count`. Para controles específicos do Firecrawl como `sources`, `categories`, scraping de resultados ou timeout de scrape, use `firecrawl_search` do Plugin Firecrawl integrado.

**Exemplos:**

```javascript
// Pesquisa específica para Alemanha
await web_search({
  query: "TV online schauen",
  country: "DE",
  language: "de",
});

// Resultados recentes (última semana)
await web_search({
  query: "TMBG interview",
  freshness: "week",
});

// Pesquisa por faixa de datas
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtragem de domínio (apenas Perplexity)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Excluir domínios (apenas Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Mais extração de conteúdo (apenas Perplexity)
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

Quando o modo `llm-context` do Brave está habilitado, `ui_lang`, `freshness`, `date_after` e
`date_before` não são suportados. Use o modo `web` do Brave para esses filtros.

## web_fetch

Buscar uma URL e extrair conteúdo legível.

### Requisitos do web_fetch

- `tools.web.fetch.enabled` não deve ser `false` (padrão: habilitado)
- Fallback Firecrawl opcional: defina `tools.web.fetch.firecrawl.apiKey` ou `FIRECRAWL_API_KEY`.
- `tools.web.fetch.firecrawl.apiKey` suporta objetos SecretRef.

### Config do web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        readability: true,
        firecrawl: {
          enabled: true,
          apiKey: "FIRECRAWL_API_KEY_HERE", // opcional se FIRECRAWL_API_KEY está definido
          baseUrl: "https://api.firecrawl.dev",
          onlyMainContent: true,
          maxAgeMs: 86400000, // ms (1 dia)
          timeoutSeconds: 60,
        },
      },
    },
  },
}
```

### Parâmetros da ferramenta web_fetch

- `url` (obrigatório, apenas http/https)
- `extractMode` (`markdown` | `text`)
- `maxChars` (truncar páginas longas)

Notas:

- `web_fetch` usa Readability (extração de conteúdo principal) primeiro, depois Firecrawl (se configurado). Se ambos falharem, a ferramenta retorna um erro.
- Requisições Firecrawl usam modo de contornar bots e resultados em cache por padrão.
- SecretRefs do Firecrawl são resolvidos apenas quando Firecrawl está ativo (`tools.web.fetch.enabled !== false` e `tools.web.fetch.firecrawl.enabled !== false`).
- Se Firecrawl está ativo e seu SecretRef não está resolvido sem fallback `FIRECRAWL_API_KEY`, inicialização/reload falha imediatamente.
- `web_fetch` envia um User-Agent estilo Chrome e `Accept-Language` por padrão; substitua `userAgent` se necessário.
- `web_fetch` bloqueia hostnames privados/internos e re-verifica redirecionamentos (limite com `maxRedirects`).
- `maxChars` é limitado a `tools.web.fetch.maxCharsCap`.
- `web_fetch` limita o tamanho do corpo da resposta baixada a `tools.web.fetch.maxResponseBytes` antes do parsing; respostas acima do tamanho são truncadas e incluem um aviso.
- `web_fetch` é extração de melhor esforço; alguns sites precisarão da ferramenta browser.
- Veja [Firecrawl](/tools/firecrawl) para configuração de chave e detalhes do serviço.
- Respostas são cacheadas (padrão 15 minutos) para reduzir fetches repetidos.
- Se você usar perfis de ferramenta/allowlists, adicione `web_search`/`web_fetch` ou `group:web`.
- Se a chave de API estiver ausente, `web_search` retorna uma dica curta de configuração com link para documentação.
