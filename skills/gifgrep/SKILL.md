---
name: gifgrep
description: Pesquise provedores de GIF com CLI/TUI, baixe resultados e extraia frames/sheets.
homepage: https://gifgrep.com
metadata:
  {
    "opencraft":
      {
        "emoji": "🧲",
        "requires": { "bins": ["gifgrep"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "steipete/tap/gifgrep",
              "bins": ["gifgrep"],
              "label": "Instalar gifgrep (brew)",
            },
            {
              "id": "go",
              "kind": "go",
              "module": "github.com/steipete/gifgrep/cmd/gifgrep@latest",
              "bins": ["gifgrep"],
              "label": "Instalar gifgrep (go)",
            },
          ],
      },
  }
---

# gifgrep

Use `gifgrep` para pesquisar provedores de GIF (Tenor/Giphy), navegar em uma TUI, baixar resultados e extrair frames ou sheets.

GIF-Grab (fluxo do gifgrep)

- Pesquisar → pré-visualizar → baixar → extrair (frame/sheet) para revisão e compartilhamento rápidos.

Início rápido

- `gifgrep gatos --max 5`
- `gifgrep gatos --format url | head -n 5`
- `gifgrep search --json gatos | jq '.[0].url'`
- `gifgrep tui "aperto de mão no escritório"`
- `gifgrep gatos --download --max 1 --format url`

TUI + pré-visualizações

- TUI: `gifgrep tui "consulta"`
- Pré-visualizações CLI de frames: `--thumbs` (apenas Kitty/Ghostty; frame fixo)

Download + revelar

- `--download` salva em `~/Downloads`
- `--reveal` mostra o último download no Finder

Frames + sheets

- `gifgrep still ./clip.gif --at 1.5s -o still.png`
- `gifgrep sheet ./clip.gif --frames 9 --cols 3 -o sheet.png`
- Sheets = grade PNG única de frames amostrados (ótimo para revisão rápida, docs, PRs, chat).
- Ajuste: `--frames` (quantidade), `--cols` (largura da grade), `--padding` (espaçamento).

Provedores

- `--source auto|tenor|giphy`
- `GIPHY_API_KEY` necessário para `--source giphy`
- `TENOR_API_KEY` opcional (chave demo do Tenor usada se não definida)

Saída

- `--json` imprime array de resultados (`id`, `title`, `url`, `preview_url`, `tags`, `width`, `height`)
- `--format` para campos compatíveis com pipes (ex: `url`)

Ajustes de ambiente

- `GIFGREP_SOFTWARE_ANIM=1` para forçar animação por software
- `GIFGREP_CELL_ASPECT=0.5` para ajustar a geometria de pré-visualização
