---
summary: "Como áudio/notas de voz recebidos são baixados, transcritos e injetados nas respostas"
read_when:
  - Alterando transcrição de áudio ou tratamento de mídia
title: "Áudio e Notas de Voz"
---

# Áudio / Notas de Voz — 2026-01-17

## O que funciona

- **Compreensão de mídia (áudio)**: Se a compreensão de áudio estiver habilitada (ou auto-detectada), o OpenCraft:
  1. Localiza o primeiro anexo de áudio (caminho local ou URL) e baixa se necessário.
  2. Aplica `maxBytes` antes de enviar para cada entrada de modelo.
  3. Executa a primeira entrada de modelo elegível em ordem (provedor ou CLI).
  4. Se falhar ou pular (tamanho/timeout), tenta a próxima entrada.
  5. Em caso de sucesso, substitui `Body` por um bloco `[Audio]` e define `{{Transcript}}`.
- **Parsing de comandos**: Quando a transcrição é bem-sucedida, `CommandBody`/`RawBody` são definidos para a transcrição para que comandos slash ainda funcionem.
- **Logging verboso**: No `--verbose`, registramos quando a transcrição roda e quando substitui o corpo.

## Auto-detecção (padrão)

Se você **não configurar modelos** e `tools.media.audio.enabled` **não** estiver definido como `false`,
o OpenCraft auto-detecta nesta ordem e para na primeira opção funcional:

1. **CLIs locais** (se instalados)
   - `sherpa-onnx-offline` (requer `SHERPA_ONNX_MODEL_DIR` com encoder/decoder/joiner/tokens)
   - `whisper-cli` (de `whisper-cpp`; usa `WHISPER_CPP_MODEL` ou o modelo tiny incluído)
   - `whisper` (CLI Python; baixa modelos automaticamente)
2. **Gemini CLI** (`gemini`) usando `read_many_files`
3. **Chaves de provedor** (OpenAI → Groq → Deepgram → Google)

Para desabilitar auto-detecção, defina `tools.media.audio.enabled: false`.
Para personalizar, defina `tools.media.audio.models`.
Nota: A detecção de binários é melhor esforço entre macOS/Linux/Windows; certifique-se de que o CLI está no `PATH` (expandimos `~`), ou defina um modelo CLI explícito com caminho completo do comando.

## Exemplos de configuração

### Provedor + fallback CLI (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Somente provedor com limitação por escopo

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Somente provedor (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Somente provedor (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Ecoar transcrição no chat (opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // padrão é false
        echoFormat: '📝 "{transcript}"', // opcional, suporta {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Notas e limites

- A autenticação do provedor segue a ordem padrão de autenticação de modelo (perfis de autenticação, variáveis de ambiente, `models.providers.*.apiKey`).
- Deepgram usa `DEEPGRAM_API_KEY` quando `provider: "deepgram"` é usado.
- Detalhes de configuração do Deepgram: [Deepgram (transcrição de áudio)](/providers/deepgram).
- Detalhes de configuração do Mistral: [Mistral](/providers/mistral).
- Provedores de áudio podem sobrescrever `baseUrl`, `headers` e `providerOptions` via `tools.media.audio`.
- Limite de tamanho padrão é 20MB (`tools.media.audio.maxBytes`). Áudio excedente é pulado para esse modelo e a próxima entrada é tentada.
- Arquivos de áudio pequenos/vazios abaixo de 1024 bytes são pulados antes da transcrição por provedor/CLI.
- O `maxChars` padrão para áudio é **não definido** (transcrição completa). Defina `tools.media.audio.maxChars` ou `maxChars` por entrada para truncar a saída.
- O padrão auto do OpenAI é `gpt-4o-mini-transcribe`; defina `model: "gpt-4o-transcribe"` para maior precisão.
- Use `tools.media.audio.attachments` para processar múltiplas notas de voz (`mode: "all"` + `maxAttachments`).
- A transcrição está disponível para templates como `{{Transcript}}`.
- `tools.media.audio.echoTranscript` é desligado por padrão; habilite para enviar confirmação da transcrição de volta ao chat de origem antes do processamento pelo agente.
- `tools.media.audio.echoFormat` personaliza o texto do eco (placeholder: `{transcript}`).
- O stdout do CLI é limitado (5MB); mantenha a saída do CLI concisa.

### Suporte a proxy de ambiente

A transcrição de áudio baseada em provedor respeita variáveis de ambiente padrão de proxy de saída:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se nenhuma variável de proxy estiver definida, é usado egresso direto. Se a configuração do proxy estiver malformada, o OpenCraft registra um aviso e faz fallback para fetch direto.

## Detecção de Menções em Grupos

Quando `requireMention: true` está definido para um chat de grupo, o OpenCraft agora transcreve áudio **antes** de verificar menções. Isso permite que notas de voz sejam processadas mesmo quando contêm menções.

**Como funciona:**

1. Se uma mensagem de voz não tem corpo de texto e o grupo requer menções, o OpenCraft realiza uma transcrição "preflight".
2. A transcrição é verificada por padrões de menção (ex.: `@NomeDoBot`, gatilhos de emoji).
3. Se uma menção for encontrada, a mensagem segue pelo pipeline completo de resposta.
4. A transcrição é usada para detecção de menções para que notas de voz possam passar a barreira de menção.

**Comportamento de fallback:**

- Se a transcrição falhar durante o preflight (timeout, erro de API, etc.), a mensagem é processada baseada apenas na detecção de menções por texto.
- Isso garante que mensagens mistas (texto + áudio) nunca sejam incorretamente descartadas.

**Opt-out por grupo/tópico do Telegram:**

- Defina `channels.telegram.groups.<chatId>.disableAudioPreflight: true` para pular verificações de menção por transcrição preflight para esse grupo.
- Defina `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` para sobrescrever por tópico (`true` para pular, `false` para forçar habilitar).
- O padrão é `false` (preflight habilitado quando condições de barreira de menção são atendidas).

**Exemplo:** Um usuário envia uma nota de voz dizendo "Ei @Claude, como está o tempo?" em um grupo Telegram com `requireMention: true`. A nota de voz é transcrita, a menção é detectada e o agente responde.

## Armadilhas

- Regras de escopo usam primeira correspondência vence. `chatType` é normalizado para `direct`, `group` ou `room`.
- Certifique-se de que seu CLI sai com 0 e imprime texto puro; JSON precisa ser massageado via `jq -r .text`.
- Para `parakeet-mlx`, se você passar `--output-dir`, o OpenCraft lê `<output-dir>/<media-basename>.txt` quando `--output-format` é `txt` (ou omitido); formatos de saída não-`txt` fazem fallback para parsing de stdout.
- Mantenha timeouts razoáveis (`timeoutSeconds`, padrão 60s) para evitar bloquear a fila de respostas.
- A transcrição preflight processa apenas o **primeiro** anexo de áudio para detecção de menções. Áudio adicional é processado durante a fase principal de compreensão de mídia.
