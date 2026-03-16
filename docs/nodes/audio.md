---
summary: "Como áudio/notas de voz de entrada são baixados, transcritos e injetados nas respostas"
read_when:
  - Alterando transcrição de áudio ou tratamento de mídia
title: "Áudio e Notas de Voz"
---

# Áudio / Notas de Voz — 2026-01-17

## O que funciona

- **Entendimento de mídia (áudio)**: Se o entendimento de áudio está habilitado (ou auto-detectado), o OpenCraft:
  1. Localiza o primeiro anexo de áudio (caminho local ou URL) e faz download se necessário.
  2. Aplica `maxBytes` antes de enviar para cada entrada de modelo.
  3. Roda a primeira entrada de modelo elegível em ordem (provedor ou CLI).
  4. Se falhar ou pular (tamanho/timeout), tenta a próxima entrada.
  5. Em caso de sucesso, substitui `Body` por um bloco `[Audio]` e define `{{Transcript}}`.
- **Análise de comandos**: Quando a transcrição tem sucesso, `CommandBody`/`RawBody` são definidos para o transcript para que slash commands ainda funcionem.
- **Logging verboso**: Em `--verbose`, logamos quando a transcrição roda e quando substitui o corpo.

## Auto-detecção (padrão)

Se você **não configurar modelos** e `tools.media.audio.enabled` **não** estiver definido como `false`,
o OpenCraft auto-detecta nesta ordem e para na primeira opção funcional:

1. **CLIs locais** (se instalados)
   - `sherpa-onnx-offline` (requer `SHERPA_ONNX_MODEL_DIR` com encoder/decoder/joiner/tokens)
   - `whisper-cli` (do `whisper-cpp`; usa `WHISPER_CPP_MODEL` ou o modelo tiny embutido)
   - `whisper` (CLI Python; baixa modelos automaticamente)
2. **Gemini CLI** (`gemini`) usando `read_many_files`
3. **Chaves de provedor** (OpenAI → Groq → Deepgram → Google)

Para desativar a auto-detecção, defina `tools.media.audio.enabled: false`.
Para personalizar, defina `tools.media.audio.models`.
Nota: Detecção de binários é best-effort em macOS/Linux/Windows; certifique-se de que o CLI está no `PATH` (expandimos `~`), ou defina um modelo CLI explícito com caminho completo do comando.

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

### Apenas provedor com escopo restrito

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

### Apenas provedor (Deepgram)

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

### Apenas provedor (Mistral Voxtral)

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

### Ecoar transcript no chat (opt-in)

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

- Autenticação de provedor segue a ordem padrão de autenticação de modelo (perfis de autenticação, vars de ambiente, `models.providers.*.apiKey`).
- Deepgram usa `DEEPGRAM_API_KEY` quando `provider: "deepgram"` é usado.
- Detalhes de configuração Deepgram: [Deepgram (transcrição de áudio)](/providers/deepgram).
- Detalhes de configuração Mistral: [Mistral](/providers/mistral).
- Provedores de áudio podem sobrescrever `baseUrl`, `headers` e `providerOptions` via `tools.media.audio`.
- Limite de tamanho padrão é 20MB (`tools.media.audio.maxBytes`). Áudio muito grande é pulado para aquele modelo e a próxima entrada é tentada.
- Arquivos de áudio pequenos/vazios abaixo de 1024 bytes são pulados antes da transcrição por provedor/CLI.
- `maxChars` padrão para áudio é **não definido** (transcript completo). Defina `tools.media.audio.maxChars` ou `maxChars` por entrada para reduzir a saída.
- Padrão OpenAI automático é `gpt-4o-mini-transcribe`; defina `model: "gpt-4o-transcribe"` para maior precisão.
- Use `tools.media.audio.attachments` para processar múltiplas notas de voz (`mode: "all"` + `maxAttachments`).
- Transcript está disponível para templates como `{{Transcript}}`.
- `tools.media.audio.echoTranscript` está desativado por padrão; habilite para enviar confirmação do transcript de volta ao chat de origem antes do processamento pelo agente.
- `tools.media.audio.echoFormat` personaliza o texto de eco (placeholder: `{transcript}`).
- Stdout do CLI é limitado (5MB); mantenha saída do CLI concisa.

### Suporte a proxy de ambiente

Transcrição de áudio baseada em provedor respeita vars de ambiente de proxy de saída padrão:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se nenhuma var de proxy estiver definida, egress direto é usado. Se a configuração de proxy estiver malformada, o OpenCraft loga um aviso e volta para fetch direto.

## Detecção de Menção em Grupos

Quando `requireMention: true` está definido para um chat em grupo, o OpenCraft transcreve áudio **antes** de verificar menções. Isso permite que notas de voz sejam processadas mesmo quando contêm menções.

**Como funciona:**

1. Se uma mensagem de voz não tem corpo de texto e o grupo requer menções, o OpenCraft faz uma transcrição "preflight".
2. O transcript é verificado em busca de padrões de menção (ex: `@NomeBot`, gatilhos emoji).
3. Se uma menção for encontrada, a mensagem prossegue pelo pipeline de resposta completo.
4. O transcript é usado para detecção de menção para que notas de voz possam passar pelo gate de menção.

**Comportamento de fallback:**

- Se a transcrição falhar durante o preflight (timeout, erro de API, etc.), a mensagem é processada com base na detecção de menção apenas por texto.
- Isso garante que mensagens mistas (texto + áudio) nunca sejam descartadas incorretamente.

**Opt-out por grupo/tópico Telegram:**

- Defina `channels.telegram.groups.<chatId>.disableAudioPreflight: true` para pular verificações de menção no transcript preflight para aquele grupo.
- Defina `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` para sobrescrever por tópico (`true` para pular, `false` para forçar ativação).
- Padrão é `false` (preflight habilitado quando condições de gate de menção correspondem).

**Exemplo:** Um usuário envia uma nota de voz dizendo "Ei @Claude, qual é a previsão do tempo?" em um grupo Telegram com `requireMention: true`. A nota de voz é transcrita, a menção é detectada e o agente responde.

## Armadilhas

- Regras de escopo usam primeiro-match ganha. `chatType` é normalizado para `direct`, `group` ou `room`.
- Certifique-se de que seu CLI sai com 0 e imprime texto simples; JSON precisa ser processado via `jq -r .text`.
- Para `parakeet-mlx`, se você passar `--output-dir`, o OpenCraft lê `<output-dir>/<media-basename>.txt` quando `--output-format` é `txt` (ou omitido); formatos de saída não-`txt` voltam para análise de stdout.
- Mantenha timeouts razoáveis (`timeoutSeconds`, padrão 60s) para evitar bloquear a fila de respostas.
- Transcrição preflight processa apenas o **primeiro** anexo de áudio para detecção de menção. Áudio adicional é processado durante a fase principal de entendimento de mídia.
