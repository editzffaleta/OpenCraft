---
summary: "Texto para fala (TTS) para respostas de saída"
read_when:
  - Habilitando texto para fala nas respostas
  - Configurando provedores ou limites de TTS
  - Usando comandos /tts
title: "Texto para Fala"
---

# Texto para fala (TTS)

O OpenCraft pode converter respostas de saída em áudio usando ElevenLabs, Microsoft ou OpenAI.
Funciona em qualquer lugar onde o OpenCraft possa enviar áudio; no Telegram aparece como bolha redonda de nota de voz.

## Serviços suportados

- **ElevenLabs** (provedor primário ou de fallback)
- **Microsoft** (provedor primário ou de fallback; a implementação incluída atualmente usa `node-edge-tts`, padrão quando não há chaves de API)
- **OpenAI** (provedor primário ou de fallback; também usado para resumos)

### Notas sobre fala Microsoft

O provedor de fala Microsoft incluído atualmente usa o serviço de TTS neural online do Microsoft Edge
via a biblioteca `node-edge-tts`. É um serviço hospedado (não
local), usa endpoints da Microsoft e não requer chave de API.
`node-edge-tts` expõe opções de configuração de fala e formatos de saída, mas
nem todas as opções são suportadas pelo serviço. Configuração e entrada de diretiva legada
usando `edge` ainda funciona e é normalizada para `microsoft`.

Como este caminho é um serviço web público sem SLA ou cota publicados,
trate-o como melhor esforço. Se você precisar de limites e suporte garantidos, use OpenAI
ou ElevenLabs.

## Chaves opcionais

Se você quiser OpenAI ou ElevenLabs:

- `ELEVENLABS_API_KEY` (ou `XI_API_KEY`)
- `OPENAI_API_KEY`

Fala Microsoft **não** requer chave de API. Se nenhuma chave de API for encontrada,
o OpenCraft usa Microsoft por padrão (a menos que desabilitado via
`messages.tts.microsoft.enabled=false` ou `messages.tts.edge.enabled=false`).

Se múltiplos provedores estiverem configurados, o provedor selecionado é usado primeiro e os outros são opções de fallback.
O auto-resumo usa o `summaryModel` configurado (ou `agents.defaults.model.primary`),
então esse provedor também deve estar autenticado se você habilitar resumos.

## Links de serviços

- [Guia de texto para fala OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Referência da API de áudio OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Texto para fala ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticação ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formatos de saída de fala Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Está habilitado por padrão?

Não. Auto-TTS está **desligado** por padrão. Habilite na configuração com
`messages.tts.auto` ou por sessão com `/tts always` (alias: `/tts on`).

Fala Microsoft **está** habilitada por padrão uma vez que TTS esteja ativo, e é usada automaticamente
quando nenhuma chave de API OpenAI ou ElevenLabs está disponível.

## Configuração

A configuração de TTS fica em `messages.tts` no `opencraft.json`.
Schema completo está em [Configuração do Gateway](/gateway/configuration).

### Configuração mínima (habilitar + provedor)

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

### OpenAI primário com fallback ElevenLabs

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
        languageCode: "en",
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

### Microsoft primário (sem chave de API)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      microsoft: {
        enabled: true,
        voice: "en-US-MichelleNeural",
        lang: "en-US",
        outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        rate: "+10%",
        pitch: "-5%",
      },
    },
  },
}
```

### Desabilitar fala Microsoft

```json5
{
  messages: {
    tts: {
      microsoft: {
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

Depois execute:

```
/tts summary off
```

### Notas sobre campos

- `auto`: modo de auto-TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` envia áudio apenas após uma nota de voz recebida.
  - `tagged` envia áudio apenas quando a resposta inclui tags `[[tts]]`.
- `enabled`: toggle legado (doctor migra isso para `auto`).
- `mode`: `"final"` (padrão) ou `"all"` (inclui respostas de ferramenta/bloco).
- `provider`: ID do provedor de fala como `"elevenlabs"`, `"microsoft"` ou `"openai"` (fallback é automático).
- Se `provider` **não estiver definido**, o OpenCraft prefere `openai` (se tiver chave), depois `elevenlabs` (se tiver chave),
  caso contrário `microsoft`.
- `provider: "edge"` legado ainda funciona e é normalizado para `microsoft`.
- `summaryModel`: modelo barato opcional para auto-resumo; padrão é `agents.defaults.model.primary`.
  - Aceita `provider/model` ou um alias de modelo configurado.
- `modelOverrides`: permite que o modelo emita diretivas TTS (ativado por padrão).
  - `allowProvider` padrão é `false` (troca de provedor é opt-in).
- `maxTextLength`: limite rígido para entrada TTS (caracteres). `/tts audio` falha se excedido.
- `timeoutMs`: timeout da requisição (ms).
- `prefsPath`: substituir o caminho do JSON de prefs local (provedor/limite/resumo).
- Valores de `apiKey` recorrem a variáveis de ambiente (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `OPENAI_API_KEY`).
- `elevenlabs.baseUrl`: substituir URL base da API ElevenLabs.
- `openai.baseUrl`: substituir o endpoint de TTS OpenAI.
  - Ordem de resolução: `messages.tts.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Valores não padrão são tratados como endpoints TTS compatíveis com OpenAI, então nomes personalizados de modelo e voz são aceitos.
- `elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `elevenlabs.applyTextNormalization`: `auto|on|off`
- `elevenlabs.languageCode`: ISO 639-1 de 2 letras (por exemplo `en`, `de`)
- `elevenlabs.seed`: inteiro `0..4294967295` (determinismo de melhor esforço)
- `microsoft.enabled`: permitir uso de fala Microsoft (padrão `true`; sem chave de API).
- `microsoft.voice`: nome de voz neural Microsoft (por exemplo `en-US-MichelleNeural`).
- `microsoft.lang`: código de idioma (por exemplo `en-US`).
- `microsoft.outputFormat`: formato de saída Microsoft (por exemplo `audio-24khz-48kbitrate-mono-mp3`).
  - Consulte formatos de saída de fala Microsoft para valores válidos; nem todos os formatos são suportados pelo transporte baseado em Edge incluído.
- `microsoft.rate` / `microsoft.pitch` / `microsoft.volume`: strings de porcentagem (por exemplo `+10%`, `-5%`).
- `microsoft.saveSubtitles`: gravar legendas JSON ao lado do arquivo de áudio.
- `microsoft.proxy`: URL de proxy para requisições de fala Microsoft.
- `microsoft.timeoutMs`: substituição de timeout da requisição (ms).
- `edge.*`: alias legado para as mesmas configurações Microsoft.

## Substituições direcionadas pelo modelo (ativado por padrão)

Por padrão, o modelo **pode** emitir diretivas TTS para uma única resposta.
Quando `messages.tts.auto` é `tagged`, essas diretivas são necessárias para acionar o áudio.

Quando habilitado, o modelo pode emitir diretivas `[[tts:...]]` para substituir a voz
para uma única resposta, mais um bloco opcional `[[tts:text]]...[[/tts:text]]` para
fornecer tags expressivas (risadas, dicas de canto, etc) que devem aparecer apenas no
áudio.

Diretivas `provider=...` são ignoradas a menos que `modelOverrides.allowProvider: true`.

Exemplo de payload de resposta:

```
Aqui está.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](risos) Leia a música mais uma vez.[[/tts:text]]
```

Chaves de diretiva disponíveis (quando habilitado):

- `provider` (ID de provedor de fala registrado, por exemplo `openai`, `elevenlabs` ou `microsoft`; requer `allowProvider: true`)
- `voice` (voz OpenAI) ou `voiceId` (ElevenLabs)
- `model` (modelo TTS OpenAI ou ID de modelo ElevenLabs)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Desabilitar todas as substituições do modelo:

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

Lista de permissão opcional (habilitar troca de provedor mantendo outros controles configuráveis):

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

Comandos slash gravam substituições locais em `prefsPath` (padrão:
`~/.opencraft/settings/tts.json`, substitua com `OPENCRAFT_TTS_PREFS` ou
`messages.tts.prefsPath`).

Campos armazenados:

- `enabled`
- `provider`
- `maxLength` (limite de resumo; padrão 1500 caracteres)
- `summarize` (padrão `true`)

Esses substituem `messages.tts.*` para aquele host.

## Formatos de saída (fixos)

- **Telegram**: nota de voz Opus (`opus_48000_64` do ElevenLabs, `opus` do OpenAI).
  - 48kHz / 64kbps é um bom equilíbrio para nota de voz e necessário para a bolha redonda.
- **Outros canais**: MP3 (`mp3_44100_128` do ElevenLabs, `mp3` do OpenAI).
  - 44.1kHz / 128kbps é o equilíbrio padrão para clareza de fala.
- **Microsoft**: usa `microsoft.outputFormat` (padrão `audio-24khz-48kbitrate-mono-mp3`).
  - O transporte incluído aceita um `outputFormat`, mas nem todos os formatos estão disponíveis no serviço.
  - Valores de formato de saída seguem os formatos de saída de fala Microsoft (incluindo Ogg/WebM Opus).
  - `sendVoice` do Telegram aceita OGG/MP3/M4A; use OpenAI/ElevenLabs se você precisar
    de notas de voz Opus garantidas. citeturn1search1
  - Se o formato de saída Microsoft configurado falhar, o OpenCraft retenta com MP3.

Formatos OpenAI/ElevenLabs são fixos; Telegram espera Opus para experiência de nota de voz.

## Comportamento do auto-TTS

Quando habilitado, o OpenCraft:

- pula TTS se a resposta já contém mídia ou uma diretiva `MEDIA:`.
- pula respostas muito curtas (< 10 caracteres).
- resume respostas longas quando habilitado usando `agents.defaults.model.primary` (ou `summaryModel`).
- anexa o áudio gerado à resposta.

Se a resposta exceder `maxLength` e o resumo estiver desligado (ou sem chave de API para o
modelo de resumo), o áudio
é pulado e a resposta de texto normal é enviada.

## Diagrama de fluxo

```
Resposta -> TTS habilitado?
  não -> enviar texto
  sim -> tem mídia / MEDIA: / curto?
          sim -> enviar texto
          não -> comprimento > limite?
                   não -> TTS -> anexar áudio
                   sim -> resumo habilitado?
                            não -> enviar texto
                            sim -> resumir (summaryModel ou agents.defaults.model.primary)
                                      -> TTS -> anexar áudio
```

## Uso do comando slash

Existe um único comando: `/tts`.
Consulte [Comandos slash](/tools/slash-commands) para detalhes de habilitação.

Nota do Discord: `/tts` é um comando integrado do Discord, então o OpenCraft registra
`/voice` como o comando nativo lá. `/tts ...` em texto ainda funciona.

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

- Comandos requerem um remetente autorizado (regras de lista de permissão/proprietário ainda se aplicam).
- `commands.text` ou registro de comando nativo deve estar habilitado.
- `off|always|inbound|tagged` são toggles por sessão (`/tts on` é um alias para `/tts always`).
- `limit` e `summary` são armazenados em prefs locais, não na configuração principal.
- `/tts audio` gera uma resposta de áudio única (não ativa TTS).

## Ferramenta do agente

A ferramenta `tts` converte texto em fala e retorna um caminho `MEDIA:`. Quando o
resultado é compatível com Telegram, a ferramenta inclui `[[audio_as_voice]]` para que
o Telegram envie uma bolha de voz.

## RPC do Gateway

Métodos do Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
