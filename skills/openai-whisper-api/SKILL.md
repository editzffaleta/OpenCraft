---
name: openai-whisper-api
description: Transcreva áudio via API de Transcrições de Áudio da OpenAI (Whisper).
homepage: https://platform.openai.com/docs/guides/speech-to-text
metadata:
  {
    "opencraft":
      {
        "emoji": "🌐",
        "requires": { "bins": ["curl"], "env": ["OPENAI_API_KEY"] },
        "primaryEnv": "OPENAI_API_KEY",
      },
  }
---

# API OpenAI Whisper (curl)

Transcreva um arquivo de áudio via endpoint `/v1/audio/transcriptions` da OpenAI.

## Início rápido

```bash
{baseDir}/scripts/transcribe.sh /path/to/audio.m4a
```

Padrões:

- Modelo: `whisper-1`
- Saída: `<input>.txt`

## Flags úteis

```bash
{baseDir}/scripts/transcribe.sh /path/to/audio.ogg --model whisper-1 --out /tmp/transcript.txt
{baseDir}/scripts/transcribe.sh /path/to/audio.m4a --language en
{baseDir}/scripts/transcribe.sh /path/to/audio.m4a --prompt "Speaker names: Peter, Daniel"
{baseDir}/scripts/transcribe.sh /path/to/audio.m4a --json --out /tmp/transcript.json
```

## Chave de API

Defina `OPENAI_API_KEY`, ou configure-a em `~/.editzffaleta/OpenCraft.json`:

```json5
{
  skills: {
    "openai-whisper-api": {
      apiKey: "OPENAI_KEY_HERE",
    },
  },
}
```
