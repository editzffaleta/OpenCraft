---
name: songsee
description: Gere espectrogramas e visualizações de painel de recursos a partir de áudio com o CLI songsee.
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

Gere espectrogramas + painéis de recursos a partir de áudio.

Início rápido

- Espectrograma: `songsee faixa.mp3`
- Multi-painel: `songsee faixa.mp3 --viz spectrogram,mel,chroma,hpss,selfsim,loudness,tempogram,mfcc,flux`
- Fatia de tempo: `songsee faixa.mp3 --start 12.5 --duration 8 -o fatia.jpg`
- Stdin: `cat faixa.mp3 | songsee - --format png -o saida.png`

Flags comuns

- `--viz` lista (repetível ou separado por vírgula)
- `--style` paleta (classic, magma, inferno, viridis, gray)
- `--width` / `--height` tamanho da saída
- `--window` / `--hop` configurações FFT
- `--min-freq` / `--max-freq` faixa de frequência
- `--start` / `--duration` fatia de tempo
- `--format` jpg|png

Notas

- WAV/MP3 decodificados nativamente; outros formatos usam ffmpeg se disponível.
- Múltiplos `--viz` renderizam uma grade.
