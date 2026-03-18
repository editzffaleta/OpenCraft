---
name: openai-whisper
description: Transcrição de fala para texto local com o CLI Whisper (sem chave de API).
homepage: https://openai.com/research/whisper
metadata:
  {
    "opencraft":
      {
        "emoji": "🎤",
        "requires": { "bins": ["whisper"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "openai-whisper",
              "bins": ["whisper"],
              "label": "Instalar OpenAI Whisper (brew)",
            },
          ],
      },
  }
---

# Whisper (CLI)

Use `whisper` para transcrever áudio localmente.

Início rápido

- `whisper /path/audio.mp3 --model medium --output_format txt --output_dir .`
- `whisper /path/audio.m4a --task translate --output_format srt`

Observações

- Os modelos são baixados para `~/.cache/whisper` na primeira execução.
- `--model` tem como padrão `turbo` nesta instalação.
- Use modelos menores para velocidade, maiores para precisão.
