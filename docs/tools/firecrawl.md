---
summary: "Fallback Firecrawl para web_fetch (extração anti-bot + cache)"
read_when:
  - Você quer extração web com suporte ao Firecrawl
  - Você precisa de uma chave de API do Firecrawl
  - Você quer extração anti-bot para web_fetch
title: "Firecrawl"
---

# Firecrawl

O OpenCraft pode usar o **Firecrawl** como extrator de fallback para `web_fetch`. É um serviço
hospedado de extração de conteúdo que suporta contorno de bot e cache, o que ajuda
com sites pesados em JS ou páginas que bloqueiam fetches HTTP simples.

## Obter uma chave de API

1. Crie uma conta no Firecrawl e gere uma chave de API.
2. Armazene-a na configuração ou defina `FIRECRAWL_API_KEY` no ambiente do gateway.

## Configurar o Firecrawl

```json5
{
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

- `firecrawl.enabled` padrão é `true` a menos que seja explicitamente definido como `false`.
- Tentativas de fallback do Firecrawl só rodam quando uma chave de API está disponível (`tools.web.fetch.firecrawl.apiKey` ou `FIRECRAWL_API_KEY`).
- `maxAgeMs` controla o quão antigos podem ser os resultados em cache (ms). O padrão é 2 dias.

## Stealth / contorno de bot

O Firecrawl expõe um parâmetro de **modo proxy** para contorno de bot (`basic`, `stealth` ou `auto`).
O OpenCraft sempre usa `proxy: "auto"` mais `storeInCache: true` para requisições Firecrawl.
Se o proxy for omitido, o Firecrawl padrão é `auto`. `auto` tenta novamente com proxies stealth se uma tentativa básica falhar, o que pode usar mais créditos
do que scraping somente básico.

## Como `web_fetch` usa o Firecrawl

Ordem de extração do `web_fetch`:

1. Readability (local)
2. Firecrawl (se configurado)
3. Limpeza HTML básica (último fallback)

Veja [Ferramentas Web](/tools/web) para a configuração completa de ferramentas web.
