---
summary: "Entendimento de mídia de entrada (opcional) com fallbacks de provedor + CLI"
read_when:
  - Desenhando ou refatorando entendimento de mídia
  - Ajustando pré-processamento de áudio/vídeo/imagem de entrada
title: "Entendimento de Mídia"
---

# Entendimento de Mídia (Entrada) — 2026-01-17

O OpenCraft pode **resumir mídia de entrada** (imagem/áudio/vídeo) antes que o pipeline de resposta rode. Ele auto-detecta quando ferramentas locais ou chaves de provedor estão disponíveis e pode ser desativado ou personalizado. Se o entendimento estiver desativado, os modelos ainda recebem os arquivos/URLs originais normalmente.

## Objetivos

- Opcional: pré-digerir mídia de entrada em texto curto para roteamento mais rápido e melhor análise de comandos.
- Preservar entrega de mídia original ao modelo (sempre).
- Suportar **APIs de provedor** e **fallbacks CLI**.
- Permitir múltiplos modelos com fallback ordenado (erro/tamanho/timeout).

## Comportamento de alto nível

1. Coletar anexos de entrada (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Para cada capacidade habilitada (imagem/áudio/vídeo), selecionar anexos por política (padrão: **primeiro**).
3. Escolher a primeira entrada de modelo elegível (tamanho + capacidade + autenticação).
4. Se um modelo falhar ou a mídia for muito grande, **fazer fallback para a próxima entrada**.
5. Em caso de sucesso:
   - `Body` se torna bloco `[Image]`, `[Audio]` ou `[Video]`.
   - Áudio define `{{Transcript}}`; análise de comandos usa texto de legenda quando presente,
     caso contrário o transcript.
   - Legendas são preservadas como `User text:` dentro do bloco.

Se o entendimento falhar ou estiver desativado, **o fluxo de resposta continua** com o corpo + anexos originais.

## Visão geral da configuração

`tools.media` suporta **modelos compartilhados** mais overrides por capacidade:

- `tools.media.models`: lista de modelos compartilhados (use `capabilities` para restringir).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - padrões (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - overrides de provedor (`baseUrl`, `headers`, `providerOptions`)
  - opções de áudio Deepgram via `tools.media.audio.providerOptions.deepgram`
  - controles de eco de transcript de áudio (`echoTranscript`, padrão `false`; `echoFormat`)
  - **lista `models` por capacidade** opcional (preferida antes dos modelos compartilhados)
  - política `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (restrição opcional por canal/chatType/chave de sessão)
- `tools.media.concurrency`: máximo de execuções de capacidade simultâneas (padrão **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* lista compartilhada */
      ],
      image: {
        /* overrides opcionais */
      },
      audio: {
        /* overrides opcionais */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* overrides opcionais */
      },
    },
  },
}
```

### Entradas de modelo

Cada entrada `models[]` pode ser de **provedor** ou **CLI**:

```json5
{
  type: "provider", // padrão se omitido
  provider: "openai",
  model: "gpt-5.2",
  prompt: "Descreva a imagem em <= 500 caracteres.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // opcional, usado para entradas multi-modal
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Leia a mídia em {{MediaPath}} e descreva em <= {{MaxChars}} caracteres.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

Templates CLI também podem usar:

- `{{MediaDir}}` (diretório contendo o arquivo de mídia)
- `{{OutputDir}}` (diretório scratch criado para esta execução)
- `{{OutputBase}}` (caminho base do arquivo scratch, sem extensão)

## Padrões e limites

Padrões recomendados:

- `maxChars`: **500** para imagem/vídeo (curto, compatível com comandos)
- `maxChars`: **não definido** para áudio (transcript completo a menos que você defina um limite)
- `maxBytes`:
  - imagem: **10MB**
  - áudio: **20MB**
  - vídeo: **50MB**

Regras:

- Se a mídia exceder `maxBytes`, aquele modelo é pulado e o **próximo modelo é tentado**.
- Arquivos de áudio menores que **1024 bytes** são tratados como vazios/corrompidos e pulados antes da transcrição por provedor/CLI.
- Se o modelo retornar mais que `maxChars`, a saída é cortada.
- `prompt` padrão é simples "Descreva o {media}." mais orientação de `maxChars` (somente imagem/vídeo).
- Se `<capability>.enabled: true` mas nenhum modelo está configurado, o OpenCraft tenta o
  **modelo de resposta ativo** quando seu provedor suporta a capacidade.

### Auto-detecção de entendimento de mídia (padrão)

Se `tools.media.<capability>.enabled` **não** estiver definido como `false` e você não tiver
configurado modelos, o OpenCraft auto-detecta nesta ordem e **para na primeira
opção funcional**:

1. **CLIs locais** (apenas áudio; se instalados)
   - `sherpa-onnx-offline` (requer `SHERPA_ONNX_MODEL_DIR` com encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` ou o modelo tiny embutido)
   - `whisper` (CLI Python; baixa modelos automaticamente)
2. **Gemini CLI** (`gemini`) usando `read_many_files`
3. **Chaves de provedor**
   - Áudio: OpenAI → Groq → Deepgram → Google
   - Imagem: OpenAI → Anthropic → Google → MiniMax
   - Vídeo: Google

Para desativar a auto-detecção, defina:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

Nota: Detecção de binários é best-effort em macOS/Linux/Windows; certifique-se de que o CLI está no `PATH` (expandimos `~`), ou defina um modelo CLI explícito com caminho completo do comando.

### Suporte a proxy de ambiente (modelos de provedor)

Quando o entendimento de mídia **de áudio** e **vídeo** baseado em provedor está habilitado, o OpenCraft
respeita vars de ambiente de proxy de saída padrão para chamadas HTTP de provedor:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se nenhuma var de proxy estiver definida, entendimento de mídia usa egress direto.
Se o valor do proxy estiver malformado, o OpenCraft loga um aviso e volta para fetch
direto.

## Capacidades (opcional)

Se você definir `capabilities`, a entrada roda apenas para aqueles tipos de mídia. Para listas
compartilhadas, o OpenCraft pode inferir padrões:

- `openai`, `anthropic`, `minimax`: **imagem**
- `google` (Gemini API): **imagem + áudio + vídeo**
- `groq`: **áudio**
- `deepgram`: **áudio**

Para entradas CLI, **defina `capabilities` explicitamente** para evitar correspondências surpreendentes.
Se você omitir `capabilities`, a entrada é elegível para a lista em que aparece.

## Matriz de suporte de provedor (integrações OpenCraft)

| Capacidade | Integração de provedor                           | Notas                                                     |
| ---------- | ------------------------------------------------ | --------------------------------------------------------- |
| Imagem     | OpenAI / Anthropic / Google / outros via `pi-ai` | Qualquer modelo com capacidade de imagem no registro funciona. |
| Áudio      | OpenAI, Groq, Deepgram, Google, Mistral          | Transcrição de provedor (Whisper/Deepgram/Gemini/Voxtral). |
| Vídeo      | Google (Gemini API)                              | Entendimento de vídeo pelo provedor.                      |

## Orientação de seleção de modelo

- Prefira o modelo de última geração mais forte disponível para cada capacidade de mídia quando qualidade e segurança importam.
- Para agentes habilitados com tools que lidam com entradas não confiáveis, evite modelos de mídia mais antigos/fracos.
- Mantenha pelo menos um fallback por capacidade para disponibilidade (modelo de qualidade + modelo mais rápido/barato).
- Fallbacks CLI (`whisper-cli`, `whisper`, `gemini`) são úteis quando APIs de provedor estão indisponíveis.
- Nota sobre `parakeet-mlx`: com `--output-dir`, o OpenCraft lê `<output-dir>/<media-basename>.txt` quando o formato de saída é `txt` (ou não especificado); formatos não-`txt` voltam para stdout.

## Política de anexos

`attachments` por capacidade controla quais anexos são processados:

- `mode`: `first` (padrão) ou `all`
- `maxAttachments`: limitar o número processado (padrão **1**)
- `prefer`: `first`, `last`, `path`, `url`

Quando `mode: "all"`, as saídas são rotuladas `[Image 1/2]`, `[Audio 2/2]`, etc.

## Exemplos de configuração

### 1) Lista de modelos compartilhados + overrides

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.2", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Leia a mídia em {{MediaPath}} e descreva em <= {{MaxChars}} caracteres.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) Apenas áudio + vídeo (imagem desativada)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Leia a mídia em {{MediaPath}} e descreva em <= {{MaxChars}} caracteres.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Entendimento de imagem opcional

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.2" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Leia a mídia em {{MediaPath}} e descreva em <= {{MaxChars}} caracteres.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Entrada única multi-modal (capacidades explícitas)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## Saída de status

Quando o entendimento de mídia roda, `/status` inclui uma linha de resumo curta:

```
📎 Mídia: imagem ok (openai/gpt-5.2) · áudio pulado (maxBytes)
```

Isso mostra resultados por capacidade e o provedor/modelo escolhido quando aplicável.

## Notas

- O entendimento é **best-effort**. Erros não bloqueiam respostas.
- Anexos ainda são passados aos modelos mesmo quando o entendimento está desativado.
- Use `scope` para limitar onde o entendimento roda (ex: apenas DMs).

## Docs relacionados

- [Configuração](/gateway/configuration)
- [Suporte a Imagem e Mídia](/nodes/images)
