---
name: spotify-player
description: Reprodução/pesquisa do Spotify no terminal via spogo (preferido) ou spotify_player.
homepage: https://www.spotify.com
metadata:
  {
    "opencraft":
      {
        "emoji": "🎵",
        "requires": { "anyBins": ["spogo", "spotify_player"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "spogo",
              "tap": "steipete/tap",
              "bins": ["spogo"],
              "label": "Instalar spogo (brew)",
            },
            {
              "id": "brew",
              "kind": "brew",
              "formula": "spotify_player",
              "bins": ["spotify_player"],
              "label": "Instalar spotify_player (brew)",
            },
          ],
      },
  }
---

# spogo / spotify_player

Use `spogo` **(preferido)** para reprodução/pesquisa no Spotify. Use `spotify_player` como alternativa se necessário.

Requisitos

- Conta Spotify Premium.
- `spogo` ou `spotify_player` instalado.

Configuração do spogo

- Importar cookies: `spogo auth import --browser chrome`

Comandos CLI comuns

- Pesquisar: `spogo search track "query"`
- Reprodução: `spogo play|pause|next|prev`
- Dispositivos: `spogo device list`, `spogo device set "<name|id>"`
- Status: `spogo status`

Comandos do spotify_player (alternativa)

- Pesquisar: `spotify_player search "query"`
- Reprodução: `spotify_player playback play|pause|next|previous`
- Conectar dispositivo: `spotify_player connect`
- Curtir faixa: `spotify_player like`

Observações

- Pasta de configuração: `~/.config/spotify-player` (ex.: `app.toml`).
- Para integração com Spotify Connect, defina um `client_id` de usuário na configuração.
- Os atalhos da TUI estão disponíveis via `?` no app.
