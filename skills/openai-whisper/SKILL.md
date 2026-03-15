---
name: openai-whisper
description: Transcrição de fala local com o CLI do Whisper (sem chave de API).
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

- `whisper /caminho/audio.mp3 --model medium --output_format txt --output_dir .`
- `whisper /caminho/audio.m4a --task translate --output_format srt`

Notas

- Os modelos são baixados para `~/.cache/whisper` na primeira execução.
- `--model` usa `turbo` como padrão nesta instalação.
- Use modelos menores para velocidade, maiores para precisão.
