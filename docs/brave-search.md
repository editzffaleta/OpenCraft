---
summary: "Configuração da Brave Search API para web_search"
read_when:
  - Você quer usar o Brave Search para web_search
  - Você precisa de um BRAVE_API_KEY ou detalhes do plano
title: "Brave Search"
---

# Brave Search API

O OpenCraft suporta a Brave Search API como provedor de `web_search`.

## Obtenha uma chave de API

1. Crie uma conta na Brave Search API em [https://brave.com/search/api/](https://brave.com/search/api/)
2. No dashboard, escolha o plano **Search** e gere uma chave de API.
3. Armazene a chave na config ou defina `BRAVE_API_KEY` no ambiente do Gateway.

## Exemplo de config

```json5
{
  tools: {
    web: {
      search: {
        provider: "brave",
        apiKey: "BRAVE_API_KEY_HERE",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

## Parâmetros da tool

| Parâmetro     | Descrição                                                                 |
| ------------- | ------------------------------------------------------------------------- |
| `query`       | Consulta de busca (obrigatório)                                           |
| `count`       | Número de resultados a retornar (1-10, padrão: 5)                        |
| `country`     | Código de país ISO de 2 letras (ex.: "US", "BR")                         |
| `language`    | Código de idioma ISO 639-1 para resultados de busca (ex.: "en", "pt")    |
| `ui_lang`     | Código de idioma ISO para elementos de UI                                 |
| `freshness`   | Filtro de tempo: `day` (24h), `week`, `month` ou `year`                  |
| `date_after`  | Apenas resultados publicados após esta data (YYYY-MM-DD)                  |
| `date_before` | Apenas resultados publicados antes desta data (YYYY-MM-DD)                |

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
```

## Notas

- O OpenCraft usa o plano **Search** do Brave. Se você tem uma assinatura legada (ex.: o plano Free original com 2.000 consultas/mês), ela continua válida, mas não inclui recursos mais novos como LLM Context ou limites de taxa maiores.
- Cada plano Brave inclui **$5/mês em crédito gratuito** (renovando). O plano Search custa $5 por 1.000 requisições, então o crédito cobre 1.000 consultas/mês. Defina seu limite de uso no dashboard do Brave para evitar cobranças inesperadas. Veja o [portal da Brave API](https://brave.com/search/api/) para os planos atuais.
- O plano Search inclui o endpoint LLM Context e direitos de inferência de IA. Armazenar resultados para treinar ou ajustar modelos requer um plano com direitos explícitos de armazenamento. Veja os [Termos de Serviço](https://api-dashboard.search.brave.com/terms-of-service) do Brave.
- Os resultados são armazenados em cache por 15 minutos por padrão (configurável via `cacheTtlMinutes`).

Veja [Ferramentas Web](/tools/web) para a configuração completa de web_search.
