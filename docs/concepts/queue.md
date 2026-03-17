---
summary: "Design da fila de comandos que serializa execucoes de auto-resposta de entrada"
read_when:
  - Alterando execucao de auto-resposta ou concorrencia
title: "Command Queue"
---

# Fila de Comandos (2026-01-16)

Serializamos execucoes de auto-resposta de entrada (todos os canais) por meio de uma pequena fila em processo para evitar que multiplas execucoes de agente colidam, enquanto ainda permitimos paralelismo seguro entre sessoes.

## Por que

- Execucoes de auto-resposta podem ser custosas (chamadas de LLM) e podem colidir quando multiplas mensagens de entrada chegam proximas uma da outra.
- A serializacao evita competicao por recursos compartilhados (arquivos de sessao, logs, stdin do CLI) e reduz a chance de limites de taxa upstream.

## Como funciona

- Uma fila FIFO com reconhecimento de faixa drena cada faixa com um limite de concorrencia configuravel (padrao 1 para faixas nao configuradas; principal padrao 4, subagente 8).
- `runEmbeddedPiAgent` enfileira por **chave de sessao** (faixa `session:<key>`) para garantir apenas uma execucao ativa por sessao.
- Cada execucao de sessao e entao enfileirada em uma **faixa global** (`main` por padrao) para que o paralelismo geral seja limitado por `agents.defaults.maxConcurrent`.
- Quando o log detalhado esta habilitado, execucoes enfileiradas emitem um breve aviso se esperaram mais de ~2s antes de iniciar.
- Indicadores de digitacao ainda disparam imediatamente ao enfileirar (quando suportado pelo canal) para que a experiencia do usuario permaneca inalterada enquanto aguardamos nossa vez.

## Modos de fila (por canal)

Mensagens de entrada podem direcionar a execucao atual, aguardar um turno de followup ou ambos:

- `steer`: injetar imediatamente na execucao atual (cancela chamadas de ferramenta pendentes apos o proximo limite de ferramenta). Se nao estiver em stream, recorre a followup.
- `followup`: enfileirar para o proximo turno do agente apos a execucao atual terminar.
- `collect`: coalescer todas as mensagens enfileiradas em um **unico** turno de followup (padrao). Se as mensagens visam canais/threads diferentes, elas sao drenadas individualmente para preservar o roteamento.
- `steer-backlog` (tambem `steer+backlog`): direcionar agora **e** preservar a mensagem para um turno de followup.
- `interrupt` (legado): abortar a execucao ativa para aquela sessao, depois executar a mensagem mais recente.
- `queue` (alias legado): mesmo que `steer`.

Steer-backlog significa que voce pode receber uma resposta de followup apos a execucao direcionada, entao
superficies de stream podem parecer duplicatas. Prefira `collect`/`steer` se voce quer
uma resposta por mensagem de entrada.
Envie `/queue collect` como um comando independente (por sessao) ou defina `messages.queue.byChannel.discord: "collect"`.

Padroes (quando nao definido na configuracao):

- Todas as superficies → `collect`

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

## Opcoes da fila

Opcoes se aplicam a `followup`, `collect` e `steer-backlog` (e a `steer` quando recorre a followup):

- `debounceMs`: aguardar silencio antes de iniciar um turno de followup (previne "continue, continue").
- `cap`: maximo de mensagens enfileiradas por sessao.
- `drop`: politica de estouro (`old`, `new`, `summarize`).

Summarize mantem uma lista curta com marcadores das mensagens descartadas e a injeta como um prompt de followup sintetico.
Padroes: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Substituicoes por sessao

- Envie `/queue <mode>` como um comando independente para armazenar o modo para a sessao atual.
- Opcoes podem ser combinadas: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` limpa a substituicao da sessao.

## Escopo e garantias

- Aplica-se a execucoes de agente de auto-resposta em todos os canais de entrada que usam o pipeline de resposta do Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, etc.).
- A faixa padrao (`main`) e de todo o processo para entrada + heartbeats principais; defina `agents.defaults.maxConcurrent` para permitir multiplas sessoes em paralelo.
- Faixas adicionais podem existir (ex. `cron`, `subagent`) para que trabalhos em segundo plano possam executar em paralelo sem bloquear respostas de entrada.
- Faixas por sessao garantem que apenas uma execucao de agente toque uma determinada sessao por vez.
- Sem dependencias externas ou threads de trabalho em segundo plano; puro TypeScript + promises.

## Solucao de problemas

- Se comandos parecerem travados, habilite logs detalhados e procure por linhas "queued for …ms" para confirmar que a fila esta drenando.
- Se voce precisa da profundidade da fila, habilite logs detalhados e observe as linhas de tempo da fila.
