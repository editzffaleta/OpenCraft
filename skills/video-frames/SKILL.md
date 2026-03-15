---
name: video-frames
description: Extrai frames ou clipes curtos de vídeos usando ffmpeg.
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
{baseDir}/scripts/frame.sh /caminho/para/video.mp4 --out /tmp/frame.jpg
```

Em um timestamp:

```bash
{baseDir}/scripts/frame.sh /caminho/para/video.mp4 --time 00:00:10 --out /tmp/frame-10s.jpg
```

## Notas

- Prefira `--time` para "o que está acontecendo por aqui?".
- Use `.jpg` para compartilhamento rápido; use `.png` para frames de UI nítidos.
