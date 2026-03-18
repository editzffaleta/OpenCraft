---
name: gifgrep
description: Pesquise provedores de GIF via CLI/TUI, baixe resultados e extraia frames estáticos/planilhas.
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

Use `gifgrep` para pesquisar provedores de GIF (Tenor/Giphy), navegar em uma TUI, baixar resultados e extrair frames estáticos ou planilhas.

GIF-Grab (fluxo de trabalho do gifgrep)

- Pesquisar → visualizar → baixar → extrair (frame estático/planilha) para revisão e compartilhamento rápidos.

Início rápido

- `gifgrep cats --max 5`
- `gifgrep cats --format url | head -n 5`
- `gifgrep search --json cats | jq '.[0].url'`
- `gifgrep tui "office handshake"`
- `gifgrep cats --download --max 1 --format url`

TUI + visualizações

- TUI: `gifgrep tui "query"`
- Visualizações estáticas via CLI: `--thumbs` (apenas Kitty/Ghostty; frame estático)

Download + revelar

- `--download` salva em `~/Downloads`
- `--reveal` exibe o último download no Finder

Frames estáticos + planilhas

- `gifgrep still ./clip.gif --at 1.5s -o still.png`
- `gifgrep sheet ./clip.gif --frames 9 --cols 3 -o sheet.png`
- Planilhas = grade PNG única de frames amostrados (ótimo para revisão rápida, docs, PRs, chat).
- Ajuste: `--frames` (contagem), `--cols` (largura da grade), `--padding` (espaçamento).

Provedores

- `--source auto|tenor|giphy`
- `GIPHY_API_KEY` necessário para `--source giphy`
- `TENOR_API_KEY` opcional (chave demo do Tenor usada se não definida)

Saída

- `--json` imprime um array de resultados (`id`, `title`, `url`, `preview_url`, `tags`, `width`, `height`)
- `--format` para campos compatíveis com pipe (ex.: `url`)

Ajustes de ambiente

- `GIFGREP_SOFTWARE_ANIM=1` para forçar animação por software
- `GIFGREP_CELL_ASPECT=0.5` para ajustar a geometria de visualização
