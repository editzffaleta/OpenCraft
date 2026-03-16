---
summary: "Comportamento de streaming + chunking (respostas em bloco, streaming de preview de canal, mapeamento de modo)"
read_when:
  - Explicando como streaming ou chunking funciona nos canais
  - Alterando streaming de bloco ou comportamento de chunking de canal
  - Depurando respostas em bloco duplicadas/antecipadas ou streaming de preview de canal
title: "Streaming e Chunking"
---

# Streaming + chunking

O OpenCraft tem duas camadas de streaming separadas:

- **Streaming de bloco (canais):** emitir **blocos** concluídos conforme o assistente escreve. Estas são mensagens de canal normais (não deltas de token).
- **Streaming de preview (Telegram/Discord/Slack):** atualizar uma **mensagem de preview** temporária durante a geração.

Não há **streaming real de delta de token** para mensagens de canal hoje. O streaming de preview é baseado em mensagens (send + edições/appends).

## Streaming de bloco (mensagens de canal)

O streaming de bloco envia a saída do assistente em chunks grossos conforme fica disponível.

```
Saída do modelo
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emite blocos conforme o buffer cresce
       └─ (blockStreamingBreak=message_end)
            └─ chunker flush em message_end
                   └─ envio de canal (respostas em bloco)
```

Legenda:

- `text_delta/events`: eventos de stream do modelo (podem ser esparsos para modelos sem streaming).
- `chunker`: `EmbeddedBlockChunker` aplicando limites min/max + preferência de quebra.
- `channel send`: mensagens de saída reais (respostas em bloco).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (padrão off).
- Overrides de canal: `*.blockStreaming` (e variantes por conta) para forçar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (mesclar blocos em streaming antes do envio).
- Cap rígido de canal: `*.textChunkLimit` (ex.: `channels.whatsapp.textChunkLimit`).
- Modo de chunk de canal: `*.chunkMode` (`length` padrão, `newline` divide em linhas em branco (limites de parágrafo) antes do chunking por comprimento).
- Cap suave do Discord: `channels.discord.maxLinesPerMessage` (padrão 17) divide respostas altas para evitar recorte na UI.

**Semântica de limite:**

- `text_end`: transmitir blocos assim que o chunker emite; flush em cada `text_end`.
- `message_end`: aguardar até que a mensagem do assistente termine, depois fazer flush da saída armazenada.

`message_end` ainda usa o chunker se o texto armazenado exceder `maxChars`, então pode emitir múltiplos chunks no final.

## Algoritmo de chunking (limites baixo/alto)

O chunking de bloco é implementado por `EmbeddedBlockChunker`:

- **Limite baixo:** não emitir até que o buffer >= `minChars` (a não ser que forçado).
- **Limite alto:** preferir divisões antes de `maxChars`; se forçado, dividir em `maxChars`.
- **Preferência de quebra:** `paragraph` → `newline` → `sentence` → `whitespace` → quebra rígida.
- **Fences de código:** nunca dividir dentro de fences; quando forçado em `maxChars`, fechar + reabrir a fence para manter o Markdown válido.

`maxChars` é limitado ao `textChunkLimit` do canal, então você não pode exceder os caps por canal.

## Coalescing (mesclar blocos em streaming)

Quando o streaming de bloco está habilitado, o OpenCraft pode **mesclar chunks de bloco consecutivos**
antes de enviá-los. Isso reduz "spam de linha única" enquanto ainda fornece
saída progressiva.

- O coalescing aguarda **gaps ociosos** (`idleMs`) antes de fazer flush.
- Buffers são limitados por `maxChars` e farão flush se excederem.
- `minChars` impede fragmentos pequenos de serem enviados até que texto suficiente se acumule
  (flush final sempre envia texto restante).
- O joiner é derivado de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espaço).
- Overrides de canal estão disponíveis via `*.blockStreamingCoalesce` (incluindo configs por conta).
- `minChars` padrão de coalesce é elevado para 1500 para Signal/Slack/Discord a não ser que sobrescrito.

## Ritmo humanizado entre blocos

Quando o streaming de bloco está habilitado, você pode adicionar uma **pausa aleatória** entre
respostas em bloco (após o primeiro bloco). Isso torna respostas com múltiplas bolhas
mais naturais.

- Config: `agents.defaults.humanDelay` (override por agente via `agents.list[].humanDelay`).
- Modos: `off` (padrão), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Aplica-se apenas a **respostas em bloco**, não respostas finais ou resumos de ferramentas.

## "Stream de chunks ou tudo"

Isso mapeia para:

- **Stream de chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emitir conforme vai). Canais não-Telegram também precisam de `*.blockStreaming: true`.
- **Stream tudo no final:** `blockStreamingBreak: "message_end"` (flush de uma vez, possivelmente múltiplos chunks se muito longo).
- **Sem streaming de bloco:** `blockStreamingDefault: "off"` (apenas resposta final).

**Nota de canal:** O streaming de bloco está **desligado a não ser que**
`*.blockStreaming` seja explicitamente definido como `true`. Canais podem transmitir um preview ao vivo
(`channels.<channel>.streaming`) sem respostas em bloco.

Lembrete de localização de config: os padrões `blockStreaming*` ficam em
`agents.defaults`, não na config raiz.

## Modos de streaming de preview

Chave canônica: `channels.<channel>.streaming`

Modos:

- `off`: desabilitar streaming de preview.
- `partial`: preview único que é substituído com o texto mais recente.
- `block`: preview atualiza em passos chunked/appended.
- `progress`: preview de progresso/status durante geração, resposta final na conclusão.

### Mapeamento de canal

| Canal    | `off` | `partial` | `block` | `progress`        |
| -------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅    | ✅        | ✅      | mapeia para `partial` |
| Discord  | ✅    | ✅        | ✅      | mapeia para `partial` |
| Slack    | ✅    | ✅        | ✅      | ✅                |

Apenas Slack:

- `channels.slack.nativeStreaming` alterna chamadas da API de streaming nativo do Slack quando `streaming=partial` (padrão: `true`).

Migração de chave legada:

- Telegram: `streamMode` + booleano `streaming` auto-migram para enum `streaming`.
- Discord: `streamMode` + booleano `streaming` auto-migram para enum `streaming`.
- Slack: `streamMode` auto-migra para enum `streaming`; booleano `streaming` auto-migra para `nativeStreaming`.

### Comportamento de runtime

Telegram:

- Usa `sendMessage` + atualizações de preview `editMessageText` em DMs e grupo/tópicos.
- O streaming de preview é pulado quando o streaming de bloco do Telegram está explicitamente habilitado (para evitar streaming duplo).
- `/reasoning stream` pode escrever raciocínio para o preview.

Discord:

- Usa mensagens de preview send + edit.
- Modo `block` usa chunking de rascunho (`draftChunk`).
- O streaming de preview é pulado quando o streaming de bloco do Discord está explicitamente habilitado.

Slack:

- `partial` pode usar o streaming nativo do Slack (`chat.startStream`/`append`/`stop`) quando disponível.
- `block` usa previews de rascunho no estilo append.
- `progress` usa texto de preview de status, depois resposta final.
