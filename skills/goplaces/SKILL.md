---
name: goplaces
description: Consultar a API do Google Places (Nova) via CLI goplaces para pesquisa de texto, detalhes de lugar, resolução e avaliações. Use para busca de lugares amigável para humanos ou saída JSON para scripts.
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

CLI moderna para a API do Google Places (Nova). Saída legível por humanos por padrão, `--json` para scripts.

Instalação

- Homebrew: `brew install steipete/tap/goplaces`

Configuração

- `GOOGLE_PLACES_API_KEY` é obrigatório.
- Opcional: `GOOGLE_PLACES_BASE_URL` para testes/proxy.

Comandos comuns

- Pesquisar: `goplaces search "coffee" --open-now --min-rating 4 --limit 5`
- Com viés de localização: `goplaces search "pizza" --lat 40.8 --lng -73.9 --radius-m 3000`
- Paginação: `goplaces search "pizza" --page-token "NEXT_PAGE_TOKEN"`
- Resolver: `goplaces resolve "Soho, London" --limit 5`
- Detalhes: `goplaces details <place_id> --reviews`
- JSON: `goplaces search "sushi" --json`

Observações

- `--no-color` ou `NO_COLOR` desativa a cor ANSI.
- Níveis de preço: 0..4 (grátis → muito caro).
- O filtro de tipo envia apenas o primeiro valor `--type` (a API aceita um).
