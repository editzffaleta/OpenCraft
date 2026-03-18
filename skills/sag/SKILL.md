---
name: sag
description: Text-to-speech do ElevenLabs com UX estilo comando say do Mac.
homepage: https://sag.sh
metadata:
  {
    "opencraft":
      {
        "emoji": "🔊",
        "requires": { "bins": ["sag"], "env": ["ELEVENLABS_API_KEY"] },
        "primaryEnv": "ELEVENLABS_API_KEY",
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "steipete/tap/sag",
              "bins": ["sag"],
              "label": "Instalar sag (brew)",
            },
          ],
      },
  }
---

# sag

Use `sag` para TTS do ElevenLabs com reprodução local.

Chave de API (obrigatória)

- `ELEVENLABS_API_KEY` (preferida)
- `SAG_API_KEY` também suportada pelo CLI

Início rápido

- `sag "Hello there"`
- `sag speak -v "Roger" "Hello"`
- `sag voices`
- `sag prompting` (dicas específicas por modelo)

Observações sobre modelos

- Padrão: `eleven_v3` (expressivo)
- Estável: `eleven_multilingual_v2`
- Rápido: `eleven_flash_v2_5`

Regras de pronúncia e entonação

- Primeira correção: reescreva a pronúncia (ex.: "key-note"), adicione hifens, ajuste capitalização.
- Números/unidades/URLs: `--normalize auto` (ou `off` se prejudicar nomes).
- Viés de idioma: `--lang en|de|fr|...` para orientar a normalização.
- v3: SSML `<break>` não suportado; use `[pause]`, `[short pause]`, `[long pause]`.
- v2/v2.5: SSML `<break time="1.5s" />` suportado; `<phoneme>` não exposto no `sag`.

Tags de áudio v3 (coloque no início de uma linha)

- `[whispers]`, `[shouts]`, `[sings]`
- `[laughs]`, `[starts laughing]`, `[sighs]`, `[exhales]`
- `[sarcastic]`, `[curious]`, `[excited]`, `[crying]`, `[mischievously]`
- Exemplo: `sag "[whispers] keep this quiet. [short pause] ok?"`

Voz padrão

- `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`

Confirme a voz e o locutor antes de saídas longas.

## Respostas por voz no chat

Quando Peter pedir uma resposta em "voz" (ex.: "voz de cientista louco", "explique em voz"), gere o áudio e envie:

```bash
# Gerar arquivo de áudio
sag -v Clawd -o /tmp/voice-reply.mp3 "Your message here"

# Depois inclua na resposta:
# MEDIA:/tmp/voice-reply.mp3
```

Dicas de personagem de voz:

- Cientista louco: Use tags `[excited]`, pausas dramáticas `[short pause]`, varie a intensidade
- Calmo: Use `[whispers]` ou ritmo mais lento
- Dramático: Use `[sings]` ou `[shouts]` com moderação

Voz padrão para Clawd: `lj2rcrvANS3gaWWnczSX` (ou apenas `-v Clawd`)
