---
name: eightctl
description: Controle pods Eight Sleep (status, temperatura, alarmes, agendamentos).
homepage: https://eightctl.sh
metadata:
  {
    "opencraft":
      {
        "emoji": "🛌",
        "requires": { "bins": ["eightctl"] },
        "install":
          [
            {
              "id": "go",
              "kind": "go",
              "module": "github.com/steipete/eightctl/cmd/eightctl@latest",
              "bins": ["eightctl"],
              "label": "Instalar eightctl (go)",
            },
          ],
      },
  }
---

# eightctl

Use `eightctl` para controle do pod Eight Sleep. Requer autenticação.

Autenticação

- Config: `~/.config/eightctl/config.yaml`
- Env: `EIGHTCTL_EMAIL`, `EIGHTCTL_PASSWORD`

Início rápido

- `eightctl status`
- `eightctl on|off`
- `eightctl temp 20`

Tarefas comuns

- Alarmes: `eightctl alarm list|create|dismiss`
- Agendamentos: `eightctl schedule list|create|update`
- Áudio: `eightctl audio state|play|pause`
- Base: `eightctl base info|angle`

Notas

- A API é não oficial e com limite de taxa; evite logins repetidos.
- Confirme antes de alterar temperatura ou alarmes.
