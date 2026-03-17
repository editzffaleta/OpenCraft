---
summary: "Modo Talk: conversas de voz contínuas com TTS do ElevenLabs"
read_when:
  - Implementando modo Talk no macOS/iOS/Android
  - Alterando comportamento de voz/TTS/interrupção
title: "Modo Talk"
---

# Modo Talk

O modo Talk é um loop de conversa por voz contínua:

1. Ouvir fala
2. Enviar transcript ao modelo (sessão main, chat.send)
3. Aguardar a resposta
4. Falar via ElevenLabs (reprodução em streaming)

## Comportamento (macOS)

- **Overlay sempre visível** enquanto o modo Talk está habilitado.
- Transições de fase **Ouvindo → Pensando → Falando**.
- Em uma **pausa curta** (janela de silêncio), o transcript atual é enviado.
- Respostas são **escritas no WebChat** (igual a digitar).
- **Interromper ao falar** (padrão ativado): se o usuário começa a falar enquanto o assistente está falando, paramos a reprodução e registramos o timestamp de interrupção para o próximo prompt.

## Diretivas de voz nas respostas

O assistente pode prefixar sua resposta com uma **única linha JSON** para controlar a voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Regras:

- Apenas primeira linha não-vazia.
- Chaves desconhecidas são ignoradas.
- `once: true` aplica apenas à resposta atual.
- Sem `once`, a voz se torna o novo padrão para o modo Talk.
- A linha JSON é removida antes da reprodução TTS.

Chaves suportadas:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Configuração (`~/.opencraft/opencraft.json`)

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Padrões:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: quando não definido, o Talk mantém a janela de pausa padrão da plataforma antes de enviar o transcript (`700 ms on macOS and Android, 900 ms on iOS`)
- `voiceId`: volta para `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (ou primeira voz ElevenLabs quando a chave API está disponível)
- `modelId`: padrão `eleven_v3` quando não definido
- `apiKey`: volta para `ELEVENLABS_API_KEY` (ou perfil shell do gateway se disponível)
- `outputFormat`: padrão `pcm_44100` no macOS/iOS e `pcm_24000` no Android (defina `mp3_*` para forçar streaming MP3)

## UI macOS

- Toggle na barra de menus: **Talk**
- Aba de configuração: grupo **Modo Talk** (voice id + toggle de interrupção)
- Overlay:
  - **Ouvindo**: nuvem pulsa com nível do mic
  - **Pensando**: animação afundando
  - **Falando**: anéis irradiando
  - Clicar na nuvem: parar de falar
  - Clicar no X: sair do modo Talk

## Notas

- Requer permissões de Fala + Microfone.
- Usa `chat.send` contra chave de sessão `main`.
- TTS usa API de streaming do ElevenLabs com `ELEVENLABS_API_KEY` e reprodução incremental no macOS/iOS/Android para menor latência.
- `stability` para `eleven_v3` é validado para `0.0`, `0.5` ou `1.0`; outros modelos aceitam `0..1`.
- `latency_tier` é validado para `0..4` quando definido.
- Android suporta formatos de saída `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` para streaming AudioTrack de baixa latência.
