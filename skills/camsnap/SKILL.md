---
name: camsnap
description: Capturar frames ou clipes de câmeras RTSP/ONVIF.
homepage: https://camsnap.ai
metadata:
  {
    "opencraft":
      {
        "emoji": "📸",
        "requires": { "bins": ["camsnap"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "steipete/tap/camsnap",
              "bins": ["camsnap"],
              "label": "Instalar camsnap (brew)",
            },
          ],
      },
  }
---

# camsnap

Use `camsnap` para capturar snapshots, clipes ou eventos de movimento de câmeras configuradas.

Configuração

- Arquivo de configuração: `~/.config/camsnap/config.yaml`
- Adicionar câmera: `camsnap add --name kitchen --host 192.168.0.10 --user user --pass pass`

Comandos comuns

- Descobrir: `camsnap discover --info`
- Snapshot: `camsnap snap kitchen --out shot.jpg`
- Clipe: `camsnap clip kitchen --dur 5s --out clip.mp4`
- Monitorar movimento: `camsnap watch kitchen --threshold 0.2 --action '...'`
- Diagnóstico: `camsnap doctor --probe`

Observações

- Requer `ffmpeg` no PATH.
- Prefira uma captura de teste curta antes de clipes mais longos.
