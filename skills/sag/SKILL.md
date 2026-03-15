---
name: sag
description: Síntese de voz ElevenLabs com UX estilo say do Mac.
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

Use `sag` para TTS da ElevenLabs com reprodução local.

Chave de API (obrigatória)

- `ELEVENLABS_API_KEY` (preferido)
- `SAG_API_KEY` também suportado pelo CLI

Início rápido

- `sag "Olá a todos"`
- `sag speak -v "Roger" "Olá"`
- `sag voices`
- `sag prompting` (dicas específicas do modelo)

Notas sobre modelos

- Padrão: `eleven_v3` (expressivo)
- Estável: `eleven_multilingual_v2`
- Rápido: `eleven_flash_v2_5`

Regras de pronúncia + entrega

- Primeira correção: reescreva (ex: "key-note"), adicione hífens, ajuste maiúsculas.
- Números/unidades/URLs: `--normalize auto` (ou `off` se prejudicar nomes).
- Viés de idioma: `--lang pt|en|de|fr|...` para guiar a normalização.
- v3: SSML `<break>` não suportado; use `[pause]`, `[short pause]`, `[long pause]`.
- v2/v2.5: SSML `<break time="1.5s" />` suportado; `<phoneme>` não exposto no `sag`.

Tags de áudio v3 (coloque no início de uma linha)

- `[whispers]`, `[shouts]`, `[sings]`
- `[laughs]`, `[starts laughing]`, `[sighs]`, `[exhales]`
- `[sarcastic]`, `[curious]`, `[excited]`, `[crying]`, `[mischievously]`
- Exemplo: `sag "[whispers] mantenha isso quieto. [short pause] ok?"`

Padrões de voz

- `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`

Confirme a voz + locutor antes de saídas longas.

## Respostas de voz no chat

Quando o usuário pedir uma resposta em "voz" (ex: "voz de cientista louco", "explique em voz"), gere o áudio e envie:

```bash
# Gerar arquivo de áudio
sag -v Clawd -o /tmp/voice-reply.mp3 "Sua mensagem aqui"

# Depois inclua na resposta:
# MEDIA:/tmp/voice-reply.mp3
```

Dicas de personagem de voz:

- Cientista louco: use tags `[excited]`, pausas dramáticas `[short pause]`, varie a intensidade
- Calmo: use `[whispers]` ou ritmo mais lento
- Dramático: use `[sings]` ou `[shouts]` com parcimônia

Voz padrão para Clawd: `lj2rcrvANS3gaWWnczSX` (ou apenas `-v Clawd`)
