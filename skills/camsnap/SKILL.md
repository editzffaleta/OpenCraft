---
name: camsnap
description: Capture frames ou clipes de câmeras RTSP/ONVIF.
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

- Arquivo de config: `~/.config/camsnap/config.yaml`
- Adicionar câmera: `camsnap add --name cozinha --host 192.168.0.10 --user usuario --pass senha`

Comandos comuns

- Descobrir: `camsnap discover --info`
- Snapshot: `camsnap snap cozinha --out foto.jpg`
- Clipe: `camsnap clip cozinha --dur 5s --out clipe.mp4`
- Monitorar movimento: `camsnap watch cozinha --threshold 0.2 --action '...'`
- Diagnóstico: `camsnap doctor --probe`

Notas

- Requer `ffmpeg` no PATH.
- Prefira uma captura de teste curta antes de clipes mais longos.
