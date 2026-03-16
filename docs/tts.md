---
summary: "Texto para fala (TTS) para respostas de saída"
read_when:
  - Habilitando texto para fala para respostas
  - Configurando provedores TTS ou limites
  - Usando comandos /tts
title: "Texto para Fala"
---

# Texto para Fala (TTS)

O OpenCraft pode converter respostas de saída em áudio usando ElevenLabs, OpenAI ou Edge TTS.
Funciona em qualquer lugar que o OpenCraft possa enviar áudio; o Telegram recebe uma bolha de nota de voz arredondada.

## Serviços suportados

- **ElevenLabs** (provedor primário ou de fallback)
- **OpenAI** (provedor primário ou de fallback; também usado para resumos)
- **Edge TTS** (provedor primário ou de fallback; usa `node-edge-tts`, padrão quando não há chaves de API)

### Notas sobre Edge TTS

O Edge TTS usa o serviço TTS neural online do Microsoft Edge via a biblioteca `node-edge-tts`.
É um serviço hospedado (não local), usa os endpoints da Microsoft e
não requer uma chave de API. O `node-edge-tts` expõe opções de configuração de fala e
formatos de saída, mas nem todas as opções são suportadas pelo serviço Edge.

Como o Edge TTS é um serviço web público sem SLA ou cota publicados, trate-o
como best-effort. Se precisar de limites garantidos e suporte, use OpenAI ou ElevenLabs.
A API REST de Fala da Microsoft documenta um limite de 10 minutos de áudio por requisição; o Edge TTS
não publica limites, então assuma limites similares ou menores.

## Chaves opcionais

Se quiser OpenAI ou ElevenLabs:

- `ELEVENLABS_API_KEY` (ou `XI_API_KEY`)
- `OPENAI_API_KEY`

O Edge TTS **não** requer uma chave de API. Se nenhuma chave de API for encontrada, o OpenCraft usa
Edge TTS por padrão (a menos que desabilitado via `messages.tts.edge.enabled=false`).

Se múltiplos provedores estiverem configurados, o provedor selecionado é usado primeiro e os outros são opções de fallback.
O auto-resumo usa o `summaryModel` configurado (ou `agents.defaults.model.primary`),
então esse provedor também deve estar autenticado se você habilitar resumos.

## Links de serviço

- [Guia de Texto para Fala OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Referência da API de Áudio OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Texto para Fala ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticação ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formatos de saída de fala Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Está habilitado por padrão?

Não. O TTS automático está **desligado** por padrão. Habilite-o na config com
`messages.tts.auto` ou por sessão com `/tts always` (alias: `/tts on`).

O Edge TTS **está** habilitado por padrão assim que o TTS for ativado, e é usado automaticamente
quando não há chaves de API OpenAI ou ElevenLabs disponíveis.

## Config

A config de TTS fica em `messages.tts` no `opencraft.json`.
O schema completo está em [Configuração do Gateway](/gateway/configuration).

### Config mínima (habilitar + provedor)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI primário com ElevenLabs de fallback

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "pt",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
    },
  },
}
```

### Edge TTS primário (sem chave de API)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "edge",
      edge: {
        enabled: true,
        voice: "pt-BR-FranciscaNeural",
        lang: "pt-BR",
        outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        rate: "+10%",
        pitch: "-5%",
      },
    },
  },
}
```

### Desabilitar Edge TTS

```json5
{
  messages: {
    tts: {
      edge: {
        enabled: false,
      },
    },
  },
}
```

### Limites personalizados + caminho de prefs

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.opencraft/settings/tts.json",
    },
  },
}
```

### Responder apenas com áudio após uma nota de voz recebida

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Desabilitar auto-resumo para respostas longas

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Então rode:

```
/tts summary off
```

### Notas sobre campos

- `auto`: modo de TTS automático (`off`, `always`, `inbound`, `tagged`).
  - `inbound` envia áudio apenas após uma nota de voz recebida.
  - `tagged` envia áudio apenas quando a resposta inclui tags `[[tts]]`.
- `enabled`: toggle legado (o doctor migra isso para `auto`).
- `mode`: `"final"` (padrão) ou `"all"` (inclui respostas de tool/bloco).
- `provider`: `"elevenlabs"`, `"openai"` ou `"edge"` (fallback é automático).
- Se `provider` estiver **indefinido**, o OpenCraft prefere `openai` (se houver chave), depois `elevenlabs` (se houver chave),
  caso contrário `edge`.
- `summaryModel`: modelo barato opcional para auto-resumo; padrão para `agents.defaults.model.primary`.
  - Aceita `provedor/modelo` ou um alias de modelo configurado.
- `modelOverrides`: permite que o modelo emita diretivas TTS (ativado por padrão).
  - `allowProvider` padrão é `false` (troca de provedor é opt-in).
- `maxTextLength`: limite máximo para entrada TTS (chars). `/tts audio` falha se excedido.
- `timeoutMs`: timeout de requisição (ms).
- `prefsPath`: sobrescrever o caminho JSON de prefs locais (provedor/limite/resumo).
- Valores de `apiKey` caem de volta para variáveis de env (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `OPENAI_API_KEY`).
- `elevenlabs.baseUrl`: sobrescrever URL base da API ElevenLabs.
- `openai.baseUrl`: sobrescrever o endpoint TTS do OpenAI.
  - Ordem de resolução: `messages.tts.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Valores não-padrão são tratados como endpoints TTS compatíveis com OpenAI, então nomes de modelo e voz personalizados são aceitos.
- `elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `elevenlabs.applyTextNormalization`: `auto|on|off`
- `elevenlabs.languageCode`: 2 letras ISO 639-1 (ex.: `pt`, `en`)
- `elevenlabs.seed`: inteiro `0..4294967295` (determinismo best-effort)
- `edge.enabled`: permitir uso do Edge TTS (padrão `true`; sem chave de API).
- `edge.voice`: nome de voz neural Edge (ex.: `pt-BR-FranciscaNeural`).
- `edge.lang`: código de idioma (ex.: `pt-BR`).
- `edge.outputFormat`: formato de saída Edge (ex.: `audio-24khz-48kbitrate-mono-mp3`).
  - Veja os formatos de saída de fala Microsoft para valores válidos; nem todos os formatos são suportados pelo Edge.
- `edge.rate` / `edge.pitch` / `edge.volume`: strings de porcentagem (ex.: `+10%`, `-5%`).
- `edge.saveSubtitles`: escrever legendas JSON junto ao arquivo de áudio.
- `edge.proxy`: URL de proxy para requisições Edge TTS.
- `edge.timeoutMs`: sobrescrição de timeout de requisição (ms).

## Sobrescrições dirigidas pelo modelo (padrão ativado)

Por padrão, o modelo **pode** emitir diretivas TTS para uma única resposta.
Quando `messages.tts.auto` é `tagged`, essas diretivas são necessárias para acionar o áudio.

Quando habilitado, o modelo pode emitir diretivas `[[tts:...]]` para sobrescrever a voz
para uma única resposta, mais um bloco opcional `[[tts:text]]...[[/tts:text]]` para
fornecer tags expressivas (risos, pistas de canto, etc.) que devem aparecer apenas no áudio.

Diretivas `provider=...` são ignoradas a menos que `modelOverrides.allowProvider: true`.

Exemplo de payload de resposta:

```
Aqui está.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](ri) Leia a música mais uma vez.[[/tts:text]]
```

Chaves de diretiva disponíveis (quando habilitadas):

- `provider` (`openai` | `elevenlabs` | `edge`, requer `allowProvider: true`)
- `voice` (voz OpenAI) ou `voiceId` (ElevenLabs)
- `model` (modelo TTS OpenAI ou id de modelo ElevenLabs)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Desabilitar todas as sobrescrições do modelo:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

Allowlist opcional (habilitar troca de provedor mantendo outros ajustes configuráveis):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Preferências por usuário

Slash commands escrevem sobrescrições locais em `prefsPath` (padrão:
`~/.opencraft/settings/tts.json`, sobrescrever com `OPENCLAW_TTS_PREFS` ou
`messages.tts.prefsPath`).

Campos armazenados:

- `enabled`
- `provider`
- `maxLength` (limite de resumo; padrão 1500 chars)
- `summarize` (padrão `true`)

Estes sobrescrevem `messages.tts.*` para aquele host.

## Formatos de saída (fixos)

- **Telegram**: nota de voz Opus (`opus_48000_64` do ElevenLabs, `opus` do OpenAI).
  - 48kHz / 64kbps é um bom tradeoff para nota de voz e necessário para a bolha arredondada.
- **Outros canais**: MP3 (`mp3_44100_128` do ElevenLabs, `mp3` do OpenAI).
  - 44.1kHz / 128kbps é o balanço padrão para clareza de fala.
- **Edge TTS**: usa `edge.outputFormat` (padrão `audio-24khz-48kbitrate-mono-mp3`).
  - O `node-edge-tts` aceita um `outputFormat`, mas nem todos os formatos estão disponíveis
    no serviço Edge.
  - Valores de formato de saída seguem os formatos de saída de fala Microsoft (incluindo Ogg/WebM Opus).
  - O `sendVoice` do Telegram aceita OGG/MP3/M4A; use OpenAI/ElevenLabs se precisar de notas de voz Opus garantidas.
  - Se o formato de saída Edge configurado falhar, o OpenCraft tenta novamente com MP3.

Formatos OpenAI/ElevenLabs são fixos; o Telegram espera Opus para UX de nota de voz.

## Comportamento do TTS automático

Quando habilitado, o OpenCraft:

- pula TTS se a resposta já contém mídia ou uma diretiva `MEDIA:`.
- pula respostas muito curtas (< 10 chars).
- resume respostas longas quando habilitado usando `agents.defaults.model.primary` (ou `summaryModel`).
- anexa o áudio gerado à resposta.

Se a resposta exceder `maxLength` e o resumo estiver desligado (ou sem chave de API para o
modelo de resumo), o áudio é pulado e a resposta de texto normal é enviada.

## Diagrama de fluxo

```
Resposta -> TTS habilitado?
  não  -> enviar texto
  sim  -> tem mídia / MEDIA: / curta?
          sim -> enviar texto
          não  -> comprimento > limite?
                   não  -> TTS -> anexar áudio
                   sim  -> resumo habilitado?
                            não  -> enviar texto
                            sim  -> resumir (summaryModel ou agents.defaults.model.primary)
                                      -> TTS -> anexar áudio
```

## Uso do slash command

Há um único comando: `/tts`.
Veja [Slash commands](/tools/slash-commands) para detalhes de habilitação.

Nota do Discord: `/tts` é um comando interno do Discord, então o OpenCraft registra
`/voice` como o comando nativo lá. O texto `/tts ...` ainda funciona.

```
/tts off
/tts always
/tts inbound
/tts tagged
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Olá do OpenCraft
```

Notas:

- Comandos requerem um remetente autorizado (regras de allowlist/proprietário ainda se aplicam).
- `commands.text` ou o registro de comando nativo deve estar habilitado.
- `off|always|inbound|tagged` são toggles por sessão (`/tts on` é alias para `/tts always`).
- `limit` e `summary` são armazenados em prefs locais, não na config principal.
- `/tts audio` gera uma resposta de áudio única (não ativa o TTS de forma persistente).

## Tool do agente

A tool `tts` converte texto em fala e retorna um caminho `MEDIA:`. Quando o
resultado é compatível com Telegram, a tool inclui `[[audio_as_voice]]` para que
o Telegram envie uma bolha de voz.

## RPC do Gateway

Métodos do Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
