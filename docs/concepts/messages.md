---
summary: "Fluxo de mensagens, sessões, enfileiramento e visibilidade de raciocínio"
read_when:
  - Explicando como mensagens de entrada se tornam respostas
  - Esclarecendo sessões, modos de enfileiramento ou comportamento de streaming
  - Documentando visibilidade de raciocínio e implicações de uso
title: "Messages"
---

# Mensagens

Esta página conecta como o OpenCraft lida com mensagens de entrada, sessões, enfileiramento,
streaming e visibilidade de raciocínio.

## Fluxo de mensagens (visão geral)

```
Mensagem de entrada
  -> roteamento/bindings -> chave de sessão
  -> fila (se uma execução estiver ativa)
  -> execução do agente (streaming + ferramentas)
  -> respostas de saída (limites do canal + chunking)
```

Controles principais ficam na configuração:

- `messages.*` para prefixos, enfileiramento e comportamento de grupo.
- `agents.defaults.*` para streaming de blocos e padrões de chunking.
- Sobrescritas de canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) para limites e toggles de streaming.

Veja [Configuração](/gateway/configuration) para o schema completo.

## Deduplicação de entrada

Canais podem reenviar a mesma mensagem após reconexões. O OpenCraft mantém um
cache de curta duração indexado por canal/conta/peer/sessão/id da mensagem para que
entregas duplicadas não acionem outra execução do agente.

## Debouncing de entrada

Mensagens consecutivas rápidas do **mesmo remetente** podem ser agrupadas em um único
turno do agente via `messages.inbound`. O debouncing é escopado por canal + conversa
e usa a mensagem mais recente para threading/IDs de resposta.

Configuração (padrão global + sobrescritas por canal):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Notas:

- Debounce se aplica a mensagens **somente texto**; mídia/anexos fazem flush imediato.
- Comandos de controle ignoram o debouncing para permanecerem standalone.

## Sessões e dispositivos

Sessões são de propriedade do Gateway, não dos clientes.

- Chats diretos são consolidados na chave de sessão main do agente.
- Grupos/canais obtêm suas próprias chaves de sessão.
- O armazenamento de sessão e transcrições ficam no host do Gateway.

Múltiplos dispositivos/canais podem mapear para a mesma sessão, mas o histórico não é
totalmente sincronizado de volta para cada cliente. Recomendação: use um dispositivo principal para conversas
longas para evitar contexto divergente. A Control UI e TUI sempre mostram a
transcrição de sessão do Gateway, então são a fonte de verdade.

Detalhes: [Gerenciamento de sessão](/concepts/session).

## Corpos de entrada e contexto de histórico

O OpenCraft separa o **corpo do prompt** do **corpo do comando**:

- `Body`: texto do prompt enviado ao agente. Pode incluir envelopes de canal e
  wrappers de histórico opcionais.
- `CommandBody`: texto bruto do usuário para parsing de diretiva/comando.
- `RawBody`: alias legado para `CommandBody` (mantido para compatibilidade).

Quando um canal fornece histórico, usa um wrapper compartilhado:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para **chats não-diretos** (grupos/canais/salas), o **corpo da mensagem atual** é prefixado com o
label do remetente (mesmo estilo usado para entradas de histórico). Isso mantém mensagens
em tempo real e enfileiradas/histórico consistentes no prompt do agente.

Buffers de histórico são **somente pendentes**: incluem mensagens de grupo que _não_
acionaram uma execução (por exemplo, mensagens bloqueadas por menção) e **excluem** mensagens
já na transcrição da sessão.

A remoção de diretivas se aplica apenas à seção da **mensagem atual** para que o histórico
permaneça intacto. Canais que envolvem histórico devem definir `CommandBody` (ou
`RawBody`) como o texto original da mensagem e manter `Body` como o prompt combinado.
Buffers de histórico são configuráveis via `messages.groupChat.historyLimit` (padrão
global) e sobrescritas por canal como `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (defina `0` para desabilitar).

## Enfileiramento e followups

Se uma execução já estiver ativa, mensagens de entrada podem ser enfileiradas, direcionadas para
a execução atual ou coletadas para um turno de followup.

- Configure via `messages.queue` (e `messages.queue.byChannel`).
- Modos: `interrupt`, `steer`, `followup`, `collect`, além de variantes de backlog.

Detalhes: [Enfileiramento](/concepts/queue).

## Streaming, chunking e batching

O streaming de blocos envia respostas parciais conforme o modelo produz blocos de texto.
O chunking respeita os limites de texto do canal e evita dividir código cercado.

Configurações principais:

- `agents.defaults.blockStreamingDefault` (`on|off`, padrão off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching baseado em ociosidade)
- `agents.defaults.humanDelay` (pausa humana entre respostas em bloco)
- Sobrescritas de canal: `*.blockStreaming` e `*.blockStreamingCoalesce` (canais não-Telegram requerem `*.blockStreaming: true` explícito)

Detalhes: [Streaming + chunking](/concepts/streaming).

## Visibilidade de raciocínio e tokens

O OpenCraft pode expor ou ocultar o raciocínio do modelo:

- `/reasoning on|off|stream` controla a visibilidade.
- O conteúdo de raciocínio ainda conta para o uso de tokens quando produzido pelo modelo.
- Telegram suporta stream de raciocínio no bubble de rascunho.

Detalhes: [Diretivas de thinking + raciocínio](/tools/thinking) e [Uso de tokens](/reference/token-use).

## Prefixos, threading e respostas

A formatação de mensagens de saída é centralizada em `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata de prefixo de saída), além de `channels.whatsapp.messagePrefix` (prefixo de entrada do WhatsApp)
- Threading de respostas via `replyToMode` e padrões por canal

Detalhes: [Configuração](/gateway/configuration#messages) e documentação dos canais.
