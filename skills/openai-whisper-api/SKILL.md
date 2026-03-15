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

# OpenAI Whisper API (curl)

Transcreva um arquivo de áudio via endpoint `/v1/audio/transcriptions` da OpenAI.

## Início rápido

```bash
{baseDir}/scripts/transcribe.sh /caminho/para/audio.m4a
```

Padrões:

- Modelo: `whisper-1`
- Saída: `<entrada>.txt`

## Flags úteis

```bash
{baseDir}/scripts/transcribe.sh /caminho/para/audio.ogg --model whisper-1 --out /tmp/transcript.txt
{baseDir}/scripts/transcribe.sh /caminho/para/audio.m4a --language pt
{baseDir}/scripts/transcribe.sh /caminho/para/audio.m4a --prompt "Nomes dos falantes: Pedro, Daniel"
{baseDir}/scripts/transcribe.sh /caminho/para/audio.m4a --json --out /tmp/transcript.json
```

## Chave de API

Defina `OPENAI_API_KEY`, ou configure em `~/.opencraft/opencraft.json`:

```json5
{
  skills: {
    "openai-whisper-api": {
      apiKey: "SUA_CHAVE_OPENAI",
    },
  },
}
```
