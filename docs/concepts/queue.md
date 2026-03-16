---
summary: "Design da fila de comandos que serializa execuções de auto-resposta de entrada"
read_when:
  - Alterando execução de auto-resposta ou concorrência
title: "Fila de Comandos"
---

# Fila de Comandos (2026-01-16)

Serializamos execuções de auto-resposta de entrada (todos os canais) por meio de uma pequena fila em processo para evitar que múltiplas execuções de agente colidam, enquanto ainda permitimos paralelismo seguro entre sessões.

## Por quê

- Execuções de auto-resposta podem ser caras (chamadas LLM) e podem colidir quando múltiplas mensagens de entrada chegam próximas uma da outra.
- Serializar evita competição por recursos compartilhados (arquivos de sessão, logs, stdin da CLI) e reduz a chance de rate limits upstream.

## Como funciona

- Uma fila FIFO com consciência de lane drena cada lane com um limite de concorrência configurável (padrão 1 para lanes não configuradas; main padrão 4, subagente 8).
- `runEmbeddedPiAgent` enfileira por **chave de sessão** (lane `session:<key>`) para garantir apenas uma execução ativa por sessão.
- Cada execução de sessão é então enfileirada em uma **lane global** (`main` por padrão) para que o paralelismo geral seja limitado por `agents.defaults.maxConcurrent`.
- Quando o logging verbose está habilitado, execuções enfileiradas emitem um aviso curto se esperaram mais de ~2s antes de iniciar.
- Indicadores de digitação ainda disparam imediatamente no enfileiramento (quando suportado pelo canal) para que a experiência do usuário não seja alterada enquanto aguardamos nossa vez.

## Modos de fila (por canal)

Mensagens de entrada podem direcionar a execução atual, aguardar um turno de followup, ou ambos:

- `steer`: injetar imediatamente na execução atual (cancela chamadas de ferramenta pendentes após o próximo limite de ferramenta). Se não estiver em streaming, faz fallback para followup.
- `followup`: enfileirar para o próximo turno do agente após a execução atual terminar.
- `collect`: coalescer todas as mensagens enfileiradas em um **único** turno de followup (padrão). Se mensagens visam diferentes canais/threads, elas drenam individualmente para preservar o roteamento.
- `steer-backlog` (também `steer+backlog`): direcionar agora **e** preservar a mensagem para um turno de followup.
- `interrupt` (legado): abortar a execução ativa para aquela sessão, depois executar a mensagem mais nova.
- `queue` (alias legado): mesmo que `steer`.

Steer-backlog significa que você pode obter uma resposta de followup após a execução direcionada, então
superfícies de streaming podem parecer duplicadas. Prefira `collect`/`steer` se você quiser
uma resposta por mensagem de entrada.
Envie `/queue collect` como um comando standalone (por sessão) ou defina `messages.queue.byChannel.discord: "collect"`.

Padrões (quando não definido na config):

- Todas as superfícies → `collect`

Configure globalmente ou por canal via `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opções de fila

As opções se aplicam a `followup`, `collect` e `steer-backlog` (e a `steer` quando faz fallback para followup):

- `debounceMs`: aguardar quietude antes de iniciar um turno de followup (evita "continue, continue").
- `cap`: max de mensagens enfileiradas por sessão.
- `drop`: política de overflow (`old`, `new`, `summarize`).

Summarize mantém uma lista curta de marcadores de mensagens descartadas e a injeta como um prompt de followup sintético.
Padrões: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Overrides por sessão

- Envie `/queue <mode>` como um comando standalone para armazenar o modo para a sessão atual.
- As opções podem ser combinadas: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` limpa o override de sessão.

## Escopo e garantias

- Aplica-se a execuções de agente de auto-resposta em todos os canais de entrada que usam o pipeline de resposta do gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, etc.).
- Lane padrão (`main`) é para todo o processo para entradas + heartbeats principais; defina `agents.defaults.maxConcurrent` para permitir múltiplas sessões em paralelo.
- Lanes adicionais podem existir (ex.: `cron`, `subagent`) para que jobs em background possam rodar em paralelo sem bloquear respostas de entrada.
- Lanes por sessão garantem que apenas uma execução de agente toque uma dada sessão por vez.
- Sem dependências externas ou threads de worker em background; TypeScript puro + promises.

## Solução de problemas

- Se comandos parecerem travados, habilite logs verbose e procure por linhas "queued for …ms" para confirmar que a fila está drenando.
- Se você precisar de profundidade da fila, habilite logs verbose e observe as linhas de timing da fila.
