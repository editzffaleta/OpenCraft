---
name: video-frames
description: Extrair frames ou clipes curtos de vídeos usando ffmpeg.
homepage: https://ffmpeg.org
metadata:
  {
    "opencraft":
      {
        "emoji": "🎬",
        "requires": { "bins": ["ffmpeg"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "ffmpeg",
              "bins": ["ffmpeg"],
              "label": "Instalar ffmpeg (brew)",
            },
          ],
      },
  }
---

# Video Frames (ffmpeg)

Extraia um único frame de um vídeo ou crie miniaturas rápidas para inspeção.

## Início rápido

Primeiro frame:

```bash
{baseDir}/scripts/frame.sh /path/to/video.mp4 --out /tmp/frame.jpg
```

Em um timestamp específico:

```bash
{baseDir}/scripts/frame.sh /path/to/video.mp4 --time 00:00:10 --out /tmp/frame-10s.jpg
```

## Observações

- Prefira `--time` para "o que está acontecendo por aqui?".
- Use `.jpg` para compartilhamento rápido; use `.png` para frames de UI nítidos.
