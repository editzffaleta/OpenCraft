---
name: goplaces
description: Consulte a API Google Places (Nova) via CLI goplaces para pesquisa de texto, detalhes de lugar, resolução e avaliações. Use para busca amigável de lugares ou saída JSON para scripts.
homepage: https://github.com/steipete/goplaces
metadata:
  {
    "opencraft":
      {
        "emoji": "📍",
        "requires": { "bins": ["goplaces"], "env": ["GOOGLE_PLACES_API_KEY"] },
        "primaryEnv": "GOOGLE_PLACES_API_KEY",
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "steipete/tap/goplaces",
              "bins": ["goplaces"],
              "label": "Instalar goplaces (brew)",
            },
          ],
      },
  }
---

# goplaces

CLI moderno da API Google Places (Nova). Saída legível por padrão, `--json` para scripts.

Instalação

- Homebrew: `brew install steipete/tap/goplaces`

Configuração

- `GOOGLE_PLACES_API_KEY` obrigatório.
- Opcional: `GOOGLE_PLACES_BASE_URL` para testes/proxy.

Comandos comuns

- Pesquisar: `goplaces search "café" --open-now --min-rating 4 --limit 5`
- Bias de localização: `goplaces search "pizza" --lat -23.5 --lng -46.6 --radius-m 3000`
- Paginação: `goplaces search "pizza" --page-token "NEXT_PAGE_TOKEN"`
- Resolver: `goplaces resolve "Pinheiros, São Paulo" --limit 5`
- Detalhes: `goplaces details <place_id> --reviews`
- JSON: `goplaces search "sushi" --json`

Notas

- `--no-color` ou `NO_COLOR` desativa cor ANSI.
- Níveis de preço: 0..4 (gratuito → muito caro).
- Filtro de tipo envia apenas o primeiro valor `--type` (API aceita um).
