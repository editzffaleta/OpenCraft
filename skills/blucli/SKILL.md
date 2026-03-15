---
name: blucli
description: CLI BluOS (blu) para descoberta, reprodução, agrupamento e volume.
homepage: https://blucli.sh
metadata:
  {
    "opencraft":
      {
        "emoji": "🫐",
        "requires": { "bins": ["blu"] },
        "install":
          [
            {
              "id": "go",
              "kind": "go",
              "module": "github.com/steipete/blucli/cmd/blu@latest",
              "bins": ["blu"],
              "label": "Instalar blucli (go)",
            },
          ],
      },
  }
---

# blucli (blu)

Use `blu` para controlar players Bluesound/NAD.

Início rápido

- `blu devices` (escolha o alvo)
- `blu --device <id> status`
- `blu play|pause|stop`
- `blu volume set 15`

Seleção de alvo (por ordem de prioridade)

- `--device <id|nome|alias>`
- `BLU_DEVICE`
- padrão da configuração (se definido)

Tarefas comuns

- Agrupamento: `blu group status|add|remove`
- Pesquisar/reproduzir no TuneIn: `blu tunein search "consulta"`, `blu tunein play "consulta"`

Prefira `--json` para scripts. Confirme o dispositivo alvo antes de alterar a reprodução.
