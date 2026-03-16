---
summary: "Tools de busca web + fetch (provedores Brave, Gemini, Grok, Kimi e Perplexity)"
read_when:
  - Você quer habilitar web_search ou web_fetch
  - Você precisa configurar uma chave de API de provedor
  - Você quer usar Gemini com grounding do Google Search
title: "Web Tools"
---

# Web tools

O OpenCraft inclui duas tools web leves:

- `web_search` — Buscar na web usando a Brave Search API, Gemini com grounding do Google Search, Grok, Kimi ou Perplexity Search API.
- `web_fetch` — Fetch HTTP + extração legível (HTML → markdown/texto).

Estas **não** são automação de browser. Para sites pesados em JS ou com login, use a
[Tool Browser](/tools/browser).

## Como funciona

- `web_search` chama seu provedor configurado e retorna resultados.
- Resultados são cacheados por query por 15 minutos (configurável).
- `web_fetch` faz um GET HTTP simples e extrai conteúdo legível
  (HTML → markdown/texto). Ele **não** executa JavaScript.
- `web_fetch` está habilitado por padrão (a menos que explicitamente desabilitado).

Veja [Configuração do Brave Search](/brave-search) e [Configuração do Perplexity Search](/perplexity) para detalhes específicos por provedor.

## Escolhendo um provedor de busca

| Provedor                  | Formato de resultado                   | Filtros específicos do provedor               | Notas                                                                             | Chave API                                    |
| ------------------------- | -------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------- |
| **Brave Search API**      | Resultados estruturados com snippets   | `country`, `language`, `ui_lang`, tempo       | Suporta modo Brave `llm-context`                                                  | `BRAVE_API_KEY`                              |
| **Gemini**                | Respostas sintetizadas por IA + citações | —                                           | Usa grounding do Google Search                                                    | `GEMINI_API_KEY`                             |
| **Grok**                  | Respostas sintetizadas por IA + citações | —                                           | Usa respostas com grounding web do xAI                                            | `XAI_API_KEY`                                |
| **Kimi**                  | Respostas sintetizadas por IA + citações | —                                           | Usa busca web do Moonshot                                                         | `KIMI_API_KEY` / `MOONSHOT_API_KEY`          |
| **Perplexity Search API** | Resultados estruturados com snippets   | `country`, `language`, tempo, `domain_filter` | Suporta controles de extração de conteúdo; OpenRouter usa caminho de compatibilidade Sonar | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` |

### Auto-detecção

A tabela acima está em ordem alfabética. Se nenhum `provider` está explicitamente definido, a auto-detecção em runtime verifica provedores nesta ordem:

1. **Brave** — var de env `BRAVE_API_KEY` ou config `tools.web.search.apiKey`
2. **Gemini** — var de env `GEMINI_API_KEY` ou config `tools.web.search.gemini.apiKey`
3. **Grok** — var de env `XAI_API_KEY` ou config `tools.web.search.grok.apiKey`
4. **Kimi** — var de env `KIMI_API_KEY` / `MOONSHOT_API_KEY` ou config `tools.web.search.kimi.apiKey`
5. **Perplexity** — `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, ou config `tools.web.search.perplexity.apiKey`

Se nenhuma chave for encontrada, volta para Brave (você receberá um erro de chave ausente pedindo para configurar uma).

Comportamento de SecretRef em runtime:

- SecretRefs de web tool são resolvidos atomicamente na inicialização/reload do gateway.
- No modo auto-detect, o OpenCraft resolve apenas a chave do provedor selecionado. SecretRefs de provedores não selecionados ficam inativos até serem selecionados.
- Se o SecretRef do provedor selecionado não estiver resolvido e nenhum fallback de env existir, inicialização/reload falha imediatamente.

## Configurando busca web

Use `opencraft configure --section web` para configurar sua chave API e escolher um provedor.

### Brave Search

1. Crie uma conta da Brave Search API em [brave.com/search/api](https://brave.com/search/api/)
2. No painel, escolha o plano **Search** e gere uma chave API.
3. Execute `opencraft configure --section web` para armazenar a chave na config, ou defina `BRAVE_API_KEY` no seu ambiente.

Cada plano Brave inclui **$5/mês em crédito gratuito** (renovável). O plano Search
custa $5 por 1.000 requisições, então o crédito cobre 1.000 queries/mês. Defina
seu limite de uso no painel do Brave para evitar cobranças inesperadas. Veja o
[portal da API Brave](https://brave.com/search/api/) para planos atuais e
preços.

### Perplexity Search

1. Crie uma conta Perplexity em [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Gere uma chave API no painel
3. Execute `opencraft configure --section web` para armazenar a chave na config, ou defina `PERPLEXITY_API_KEY` no seu ambiente.

Para compatibilidade legada Sonar/OpenRouter, defina `OPENROUTER_API_KEY`, ou configure `tools.web.search.perplexity.apiKey` com uma chave `sk-or-...`. Definir `tools.web.search.perplexity.baseUrl` ou `model` também faz o Perplexity voltar para o caminho de compatibilidade chat-completions.

Veja [Docs da API Perplexity Search](https://docs.perplexity.ai/guides/search-quickstart) para mais detalhes.

### Onde armazenar a chave

**Via config:** execute `opencraft configure --section web`. Armazena a chave no caminho de config específico do provedor:

- Brave: `tools.web.search.apiKey`
- Gemini: `tools.web.search.gemini.apiKey`
- Grok: `tools.web.search.grok.apiKey`
- Kimi: `tools.web.search.kimi.apiKey`
- Perplexity: `tools.web.search.perplexity.apiKey`

Todos esses campos também suportam objetos SecretRef.

**Via ambiente:** defina vars de env do provedor no ambiente do processo Gateway:

- Brave: `BRAVE_API_KEY`
- Gemini: `GEMINI_API_KEY`
- Grok: `XAI_API_KEY`
- Kimi: `KIMI_API_KEY` ou `MOONSHOT_API_KEY`
- Perplexity: `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`

Para uma instalação de gateway, coloque-as em `~/.opencraft/.env` (ou no seu ambiente de serviço). Veja [Vars de env](/help/faq#how-does-opencraft-load-environment-variables).

### Exemplos de config

**Brave Search:**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "brave",
        apiKey: "SUA_BRAVE_API_KEY", // opcional se BRAVE_API_KEY estiver definido // pragma: allowlist secret
      },
    },
  },
}
```

**Modo Brave LLM Context:**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "brave",
        apiKey: "SUA_BRAVE_API_KEY", // opcional se BRAVE_API_KEY estiver definido // pragma: allowlist secret
        brave: {
          mode: "llm-context",
        },
      },
    },
  },
}
```

`llm-context` retorna chunks extraídos de página para grounding em vez de snippets Brave padrão.
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
          apiKey: "pplx-...", // opcional se PERPLEXITY_API_KEY estiver definido
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
          apiKey: "<openrouter-api-key>", // opcional se OPENROUTER_API_KEY estiver definido
          baseUrl: "https://openrouter.ai/api/v1",
          model: "perplexity/sonar-pro",
        },
      },
    },
  },
}
```

## Usando Gemini (grounding do Google Search)

Modelos Gemini suportam [grounding do Google Search](https://ai.google.dev/gemini-api/docs/grounding) integrado,
que retorna respostas sintetizadas por IA com base em resultados ao vivo do Google Search com citações.

### Obtendo uma chave de API Gemini

1. Vá para [Google AI Studio](https://aistudio.google.com/apikey)
2. Crie uma chave API
3. Defina `GEMINI_API_KEY` no ambiente do Gateway, ou configure `tools.web.search.gemini.apiKey`

### Configurando busca Gemini

```json5
{
  tools: {
    web: {
      search: {
        provider: "gemini",
        gemini: {
          // Chave API (opcional se GEMINI_API_KEY estiver definido)
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
Para uma instalação de gateway, coloque em `~/.opencraft/.env`.

### Notas

- URLs de citação do grounding Gemini são automaticamente resolvidas de URLs de redirecionamento do Google para URLs diretas.
- Resolução de redirecionamento usa o caminho de guarda SSRF (HEAD + verificações de redirecionamento + validação http/https) antes de retornar a URL de citação final.
- Resolução de redirecionamento usa padrões SSRF estritos, então redirecionamentos para alvos privados/internos são bloqueados.
- O modelo padrão (`gemini-2.5-flash`) é rápido e econômico. Qualquer modelo Gemini que suporte grounding pode ser usado.

## web_search

Buscar na web usando seu provedor configurado.

### Requisitos

- `tools.web.search.enabled` não deve ser `false` (padrão: habilitado)
- Chave API para seu provedor escolhido:
  - **Brave**: `BRAVE_API_KEY` ou `tools.web.search.apiKey`
  - **Gemini**: `GEMINI_API_KEY` ou `tools.web.search.gemini.apiKey`
  - **Grok**: `XAI_API_KEY` ou `tools.web.search.grok.apiKey`
  - **Kimi**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, ou `tools.web.search.kimi.apiKey`
  - **Perplexity**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, ou `tools.web.search.perplexity.apiKey`
- Todos os campos de chave de provedor acima suportam objetos SecretRef.

### Config

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "BRAVE_API_KEY_AQUI", // opcional se BRAVE_API_KEY estiver definido
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

### Parâmetros da tool

Todos os parâmetros funcionam para Brave e para a API Perplexity Search nativa, a menos que indicado.

O caminho de compatibilidade OpenRouter / Sonar do Perplexity suporta apenas `query` e `freshness`.
Se você definir `tools.web.search.perplexity.baseUrl` / `model`, usar `OPENROUTER_API_KEY`, ou configurar uma chave `sk-or-...`, filtros somente da Search API retornam erros explícitos.

| Parâmetro             | Descrição                                             |
| --------------------- | ----------------------------------------------------- |
| `query`               | Query de busca (obrigatório)                          |
| `count`               | Resultados a retornar (1-10, padrão: 5)               |
| `country`             | Código de país ISO de 2 letras (ex: "BR", "US")       |
| `language`            | Código de idioma ISO 639-1 (ex: "pt", "en")           |
| `freshness`           | Filtro de tempo: `day`, `week`, `month` ou `year`     |
| `date_after`          | Resultados após esta data (AAAA-MM-DD)                |
| `date_before`         | Resultados antes desta data (AAAA-MM-DD)              |
| `ui_lang`             | Código de idioma da UI (somente Brave)                |
| `domain_filter`       | Array de allowlist/denylist de domínio (somente Perplexity) |
| `max_tokens`          | Orçamento total de conteúdo, padrão 25000 (somente Perplexity) |
| `max_tokens_per_page` | Limite de token por página, padrão 2048 (somente Perplexity) |

**Exemplos:**

```javascript
// Busca específica em português
await web_search({
  query: "assistente de IA no Brasil",
  country: "BR",
  language: "pt",
});

// Resultados recentes (semana passada)
await web_search({
  query: "notícias tecnologia",
  freshness: "week",
});

// Busca por intervalo de datas
await web_search({
  query: "desenvolvimentos em IA",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtro de domínio (somente Perplexity)
await web_search({
  query: "pesquisa climática",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Excluir domínios (somente Perplexity)
await web_search({
  query: "avaliações de produto",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

Quando o modo Brave `llm-context` está habilitado, `ui_lang`, `freshness`, `date_after` e
`date_before` não são suportados. Use o modo Brave `web` para esses filtros.

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
          apiKey: "FIRECRAWL_API_KEY_AQUI", // opcional se FIRECRAWL_API_KEY estiver definido
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

### Parâmetros da tool web_fetch

- `url` (obrigatório, somente http/https)
- `extractMode` (`markdown` | `text`)
- `maxChars` (truncar páginas longas)

Notas:

- `web_fetch` usa Readability (extração de conteúdo principal) primeiro, depois Firecrawl (se configurado). Se ambos falharem, a tool retorna um erro.
- Requisições Firecrawl usam modo de contorno de bot e cacheia resultados por padrão.
- SecretRefs do Firecrawl são resolvidos apenas quando o Firecrawl está ativo (`tools.web.fetch.enabled !== false` e `tools.web.fetch.firecrawl.enabled !== false`).
- Se o Firecrawl está ativo e seu SecretRef não está resolvido sem fallback `FIRECRAWL_API_KEY`, inicialização/reload falha imediatamente.
- `web_fetch` envia um User-Agent similar ao Chrome e `Accept-Language` por padrão; sobrescreva `userAgent` se necessário.
- `web_fetch` bloqueia hostnames privados/internos e verifica novamente redirecionamentos (limite com `maxRedirects`).
- `maxChars` é limitado por `tools.web.fetch.maxCharsCap`.
- `web_fetch` limita o tamanho do corpo de resposta baixado para `tools.web.fetch.maxResponseBytes` antes de analisar; respostas muito grandes são truncadas e incluem um aviso.
- `web_fetch` é extração best-effort; alguns sites precisarão da tool browser.
- Veja [Firecrawl](/tools/firecrawl) para configuração de chave e detalhes do serviço.
- Respostas são cacheadas (padrão 15 minutos) para reduzir fetches repetidos.
- Se você usar perfis de tool/allowlists, adicione `web_search`/`web_fetch` ou `group:web`.
- Se a chave API estiver faltando, `web_search` retorna uma dica de configuração curta com link para docs.
