---
name: sherpa-onnx-tts
description: Text-to-speech local via sherpa-onnx (offline, sem nuvem)
metadata:
  {
    "opencraft":
      {
        "emoji": "🔉",
        "os": ["darwin", "linux", "win32"],
        "requires": { "env": ["SHERPA_ONNX_RUNTIME_DIR", "SHERPA_ONNX_MODEL_DIR"] },
        "install":
          [
            {
              "id": "download-runtime-macos",
              "kind": "download",
              "os": ["darwin"],
              "url": "https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.12.23/sherpa-onnx-v1.12.23-osx-universal2-shared.tar.bz2",
              "archive": "tar.bz2",
              "extract": true,
              "stripComponents": 1,
              "targetDir": "runtime",
              "label": "Baixar runtime sherpa-onnx (macOS)",
            },
            {
              "id": "download-runtime-linux-x64",
              "kind": "download",
              "os": ["linux"],
              "url": "https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.12.23/sherpa-onnx-v1.12.23-linux-x64-shared.tar.bz2",
              "archive": "tar.bz2",
              "extract": true,
              "stripComponents": 1,
              "targetDir": "runtime",
              "label": "Baixar runtime sherpa-onnx (Linux x64)",
            },
            {
              "id": "download-runtime-win-x64",
              "kind": "download",
              "os": ["win32"],
              "url": "https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.12.23/sherpa-onnx-v1.12.23-win-x64-shared.tar.bz2",
              "archive": "tar.bz2",
              "extract": true,
              "stripComponents": 1,
              "targetDir": "runtime",
              "label": "Baixar runtime sherpa-onnx (Windows x64)",
            },
            {
              "id": "download-model-lessac",
              "kind": "download",
              "url": "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-en_US-lessac-high.tar.bz2",
              "archive": "tar.bz2",
              "extract": true,
              "targetDir": "models",
              "label": "Baixar Piper en_US lessac (high)",
            },
          ],
      },
  }
---

# sherpa-onnx-tts

TTS local usando o CLI offline sherpa-onnx.

## Instalação

1. Baixe o runtime para o seu sistema operacional (extrai em `~/.opencraft/tools/sherpa-onnx-tts/runtime`)
2. Baixe um modelo de voz (extrai em `~/.opencraft/tools/sherpa-onnx-tts/models`)

Atualize `~/.editzffaleta/OpenCraft.json`:

```json5
{
  skills: {
    entries: {
      "sherpa-onnx-tts": {
        env: {
          SHERPA_ONNX_RUNTIME_DIR: "~/.opencraft/tools/sherpa-onnx-tts/runtime",
          SHERPA_ONNX_MODEL_DIR: "~/.opencraft/tools/sherpa-onnx-tts/models/vits-piper-en_US-lessac-high",
        },
      },
    },
  },
}
```

O wrapper está na pasta desta skill. Execute-o diretamente ou adicione-o ao PATH:

```bash
export PATH="{baseDir}/bin:$PATH"
```

## Uso

```bash
{baseDir}/bin/sherpa-onnx-tts -o ./tts.wav "Hello from local TTS."
```

Observações:

- Escolha um modelo diferente nas releases `tts-models` do sherpa-onnx se quiser outra voz.
- Se o diretório do modelo tiver múltiplos arquivos `.onnx`, defina `SHERPA_ONNX_MODEL_FILE` ou passe `--model-file`.
- Você também pode passar `--tokens-file` ou `--data-dir` para substituir os padrões.
- Windows: execute `node {baseDir}\\bin\\sherpa-onnx-tts -o tts.wav "Hello from local TTS."`
