---
summary: "Comportamento de streaming + chunking (respostas em bloco, preview streaming em canais, mapeamento de modos)"
read_when:
  - Explicando como streaming ou chunking funciona nos canais
  - Alterando comportamento de block streaming ou chunking de canal
  - Depurando respostas em bloco duplicadas/antecipadas ou preview streaming de canal
title: "Streaming and Chunking"
---

# Streaming + chunking

O OpenCraft possui duas camadas de streaming separadas:

- **Block streaming (canais):** emite **blocos** completos conforme o assistente escreve. Estas são mensagens normais do canal (não deltas de Token).
- **Preview streaming (Telegram/Discord/Slack):** atualiza uma **mensagem de preview** temporária durante a geração.

**Não há streaming verdadeiro de delta de Token** para mensagens de canal hoje. Preview streaming é baseado em mensagens (enviar + edições/adições).

## Block streaming (mensagens de canal)

Block streaming envia a saída do assistente em pedaços grosseiros conforme ficam disponíveis.

```
Saída do modelo
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emite blocos conforme o buffer cresce
       └─ (blockStreamingBreak=message_end)
            └─ chunker faz flush no message_end
                   └─ envio para o canal (respostas em bloco)
```

Legenda:

- `text_delta/events`: eventos de stream do modelo (podem ser esparsos para modelos sem streaming).
- `chunker`: `EmbeddedBlockChunker` aplicando limites mínimo/máximo + preferência de quebra.
- `envio para o canal`: mensagens de saída reais (respostas em bloco).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (padrão off).
- Overrides de canal: `*.blockStreaming` (e variantes por conta) para forçar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (mesclar blocos de stream antes do envio).
- Limite rígido do canal: `*.textChunkLimit` (ex., `channels.whatsapp.textChunkLimit`).
- Modo de chunk do canal: `*.chunkMode` (`length` padrão, `newline` divide em linhas em branco (limites de parágrafo) antes do chunking por tamanho).
- Limite suave do Discord: `channels.discord.maxLinesPerMessage` (padrão 17) divide respostas altas para evitar corte na UI.

**Semântica de limite:**

- `text_end`: transmite blocos assim que o chunker emite; faz flush em cada `text_end`.
- `message_end`: aguarda até a mensagem do assistente terminar, depois faz flush do conteúdo bufferizado.

`message_end` ainda usa o chunker se o texto bufferizado exceder `maxChars`, então pode emitir múltiplos chunks no final.

## Algoritmo de chunking (limites baixo/alto)

Block chunking é implementado por `EmbeddedBlockChunker`:

- **Limite baixo:** não emite até o buffer >= `minChars` (a menos que forçado).
- **Limite alto:** prefere divisões antes de `maxChars`; se forçado, divide em `maxChars`.
- **Preferência de quebra:** `paragraph` → `newline` → `sentence` → `whitespace` → quebra forçada.
- **Blocos de código:** nunca divide dentro de fences; quando forçado em `maxChars`, fecha + reabre o fence para manter o Markdown válido.

`maxChars` é limitado ao `textChunkLimit` do canal, então você não pode exceder os limites por canal.

## Coalescência (mesclar blocos de stream)

Quando block streaming está habilitado, o OpenCraft pode **mesclar chunks de bloco consecutivos**
antes de enviá-los. Isso reduz "spam de linha única" enquanto ainda fornece
saída progressiva.

- A coalescência aguarda por **intervalos ociosos** (`idleMs`) antes de fazer flush.
- Buffers são limitados por `maxChars` e farão flush se excederem.
- `minChars` evita que fragmentos pequenos sejam enviados até que texto suficiente se acumule
  (o flush final sempre envia o texto restante).
- O separador é derivado de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espaço).
- Overrides de canal estão disponíveis via `*.blockStreamingCoalesce` (incluindo configurações por conta).
- O `minChars` padrão de coalescência é aumentado para 1500 para Signal/Slack/Discord, a menos que sobrescrito.

## Ritmo semelhante ao humano entre blocos

Quando block streaming está habilitado, você pode adicionar uma **pausa aleatória** entre
respostas em bloco (após o primeiro bloco). Isso faz com que respostas com múltiplas bolhas pareçam
mais naturais.

- Configuração: `agents.defaults.humanDelay` (override por agente via `agents.list[].humanDelay`).
- Modos: `off` (padrão), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Aplica-se apenas a **respostas em bloco**, não a respostas finais ou resumos de ferramentas.

## "Transmitir chunks ou tudo"

Isso se mapeia para:

- **Transmitir chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emitir conforme avança). Canais não-Telegram também precisam de `*.blockStreaming: true`.
- **Transmitir tudo no final:** `blockStreamingBreak: "message_end"` (flush único, possivelmente múltiplos chunks se muito longo).
- **Sem block streaming:** `blockStreamingDefault: "off"` (apenas resposta final).

**Nota sobre canais:** Block streaming está **desligado a menos que**
`*.blockStreaming` esteja explicitamente definido como `true`. Canais podem transmitir um preview ao vivo
(`channels.<channel>.streaming`) sem respostas em bloco.

Lembrete de localização da configuração: os padrões `blockStreaming*` ficam em
`agents.defaults`, não na raiz da configuração.

## Modos de preview streaming

Chave canônica: `channels.<channel>.streaming`

Modos:

- `off`: desabilita preview streaming.
- `partial`: preview único que é substituído pelo texto mais recente.
- `block`: atualizações de preview em etapas chunked/adicionadas.
- `progress`: preview de progresso/status durante a geração, resposta final na conclusão.

### Mapeamento de canais

| Canal    | `off` | `partial` | `block` | `progress`            |
| -------- | ----- | --------- | ------- | --------------------- |
| Telegram | ✅    | ✅        | ✅      | mapeia para `partial` |
| Discord  | ✅    | ✅        | ✅      | mapeia para `partial` |
| Slack    | ✅    | ✅        | ✅      | ✅                    |

Apenas Slack:

- `channels.slack.nativeStreaming` alterna chamadas à API de streaming nativo do Slack quando `streaming=partial` (padrão: `true`).

Migração de chave legada:

- Telegram: `streamMode` + booleano `streaming` migram automaticamente para o enum `streaming`.
- Discord: `streamMode` + booleano `streaming` migram automaticamente para o enum `streaming`.
- Slack: `streamMode` migra automaticamente para o enum `streaming`; booleano `streaming` migra automaticamente para `nativeStreaming`.

### Comportamento em tempo de execução

Telegram:

- Usa `sendMessage` + `editMessageText` para atualizações de preview em DMs e grupos/tópicos.
- Preview streaming é ignorado quando block streaming do Telegram está explicitamente habilitado (para evitar streaming duplo).
- `/reasoning stream` pode escrever raciocínio no preview.

Discord:

- Usa envio + edição de mensagens de preview.
- Modo `block` usa chunking de rascunho (`draftChunk`).
- Preview streaming é ignorado quando block streaming do Discord está explicitamente habilitado.

Slack:

- `partial` pode usar streaming nativo do Slack (`chat.startStream`/`append`/`stop`) quando disponível.
- `block` usa previews de rascunho no estilo append.
- `progress` usa texto de preview de status, depois a resposta final.
