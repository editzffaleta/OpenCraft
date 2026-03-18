---
name: songsee
description: Gere espectrogramas e visualizações de painel de características de áudio com o CLI songsee.
homepage: https://github.com/steipete/songsee
metadata:
  {
    "opencraft":
      {
        "emoji": "🌊",
        "requires": { "bins": ["songsee"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "steipete/tap/songsee",
              "bins": ["songsee"],
              "label": "Instalar songsee (brew)",
            },
          ],
      },
  }
---

# songsee

Gere espectrogramas + painéis de características a partir de áudio.

Início rápido

- Espectrograma: `songsee track.mp3`
- Multi-painel: `songsee track.mp3 --viz spectrogram,mel,chroma,hpss,selfsim,loudness,tempogram,mfcc,flux`
- Recorte de tempo: `songsee track.mp3 --start 12.5 --duration 8 -o slice.jpg`
- Stdin: `cat track.mp3 | songsee - --format png -o out.png`

Flags comuns

- `--viz` lista (repetível ou separada por vírgulas)
- `--style` paleta (classic, magma, inferno, viridis, gray)
- `--width` / `--height` tamanho da saída
- `--window` / `--hop` configurações de FFT
- `--min-freq` / `--max-freq` faixa de frequência
- `--start` / `--duration` recorte de tempo
- `--format` jpg|png

Observações

- WAV/MP3 decodificados nativamente; outros formatos usam ffmpeg se disponível.
- Múltiplos `--viz` renderizam uma grade.
