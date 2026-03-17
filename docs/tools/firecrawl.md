---
summary: "Pesquisa, scraping e fallback web_fetch com Firecrawl"
read_when:
  - Você quer extração web via Firecrawl
  - Você precisa de uma chave de API Firecrawl
  - Você quer Firecrawl como provedor de web_search
  - Você quer extração anti-bot para web_fetch
title: "Firecrawl"
---

# Firecrawl

O OpenCraft pode usar **Firecrawl** de três formas:

- como provedor de `web_search`
- como ferramentas explícitas de Plugin: `firecrawl_search` e `firecrawl_scrape`
- como extrator de fallback para `web_fetch`

É um serviço hospedado de extração/pesquisa que suporta contornar bots e cache,
o que ajuda com sites pesados em JS ou páginas que bloqueiam fetches HTTP simples.

## Obter uma chave de API

1. Crie uma conta Firecrawl e gere uma chave de API.
2. Armazene na config ou defina `FIRECRAWL_API_KEY` no ambiente do Gateway.

## Configurar pesquisa Firecrawl

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
        provider: "firecrawl",
        firecrawl: {
          apiKey: "FIRECRAWL_API_KEY_HERE",
          baseUrl: "https://api.firecrawl.dev",
        },
      },
    },
  },
}
```

Notas:

- Escolher Firecrawl no onboarding ou `opencraft configure --section web` habilita o Plugin Firecrawl integrado automaticamente.
- `web_search` com Firecrawl suporta `query` e `count`.
- Para controles específicos do Firecrawl como `sources`, `categories` ou scraping de resultados, use `firecrawl_search`.

## Configurar scrape Firecrawl + fallback web_fetch

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
      fetch: {
        firecrawl: {
          apiKey: "FIRECRAWL_API_KEY_HERE",
          baseUrl: "https://api.firecrawl.dev",
          onlyMainContent: true,
          maxAgeMs: 172800000,
          timeoutSeconds: 60,
        },
      },
    },
  },
}
```

Notas:

- `firecrawl.enabled` é `true` por padrão a menos que explicitamente definido como `false`.
- Tentativas de fallback Firecrawl são executadas apenas quando uma chave de API está disponível (`tools.web.fetch.firecrawl.apiKey` ou `FIRECRAWL_API_KEY`).
- `maxAgeMs` controla a idade máxima dos resultados em cache (ms). Padrão é 2 dias.

`firecrawl_scrape` reutiliza as mesmas configurações e variáveis de ambiente de `tools.web.fetch.firecrawl.*`.

## Ferramentas do Plugin Firecrawl

### `firecrawl_search`

Use quando quiser controles de pesquisa específicos do Firecrawl em vez do `web_search` genérico.

Parâmetros principais:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Use para páginas pesadas em JS ou protegidas contra bots onde o `web_fetch` simples é fraco.

Parâmetros principais:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Modo stealth / contornar bots

Firecrawl expõe um parâmetro de **modo proxy** para contornar bots (`basic`, `stealth` ou `auto`).
O OpenCraft sempre usa `proxy: "auto"` mais `storeInCache: true` para requisições Firecrawl.
Se proxy for omitido, Firecrawl usa `auto` por padrão. `auto` tenta novamente com proxies stealth se uma tentativa básica falhar, o que pode usar mais créditos
do que scraping apenas básico.

## Como `web_fetch` usa Firecrawl

Ordem de extração do `web_fetch`:

1. Readability (local)
2. Firecrawl (se configurado)
3. Limpeza básica de HTML (último fallback)

Veja [Ferramentas Web](/tools/web) para a configuração completa de ferramentas web.
