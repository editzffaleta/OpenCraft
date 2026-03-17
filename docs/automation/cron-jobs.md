---
summary: "Cron jobs + wakeups para o agendador do Gateway"
read_when:
  - Agendando jobs em segundo plano ou wakeups
  - Conectando automação que deve executar com ou junto aos heartbeats
  - Decidindo entre heartbeat e Cron para tarefas agendadas
title: "Cron Jobs"
---

# Cron jobs (agendador do Gateway)

> **Cron vs Heartbeat?** Veja [Cron vs Heartbeat](/automation/cron-vs-heartbeat) para orientação sobre quando usar cada um.

Cron é o agendador integrado do Gateway. Ele persiste jobs, acorda o agente no
horário certo e pode opcionalmente entregar a saída de volta para um chat.

Se você quer _"executar isso toda manhã"_ ou _"cutucar o agente em 20 minutos"_,
Cron é o mecanismo.

Solução de problemas: [/automation/troubleshooting](/automation/troubleshooting)

## Resumo

- Cron executa **dentro do Gateway** (não dentro do modelo).
- Jobs persistem em `~/.opencraft/cron/` para que reinicializações não percam agendamentos.
- Dois estilos de execução:
  - **Sessão principal**: enfileira um evento do sistema, depois executa no próximo heartbeat.
  - **Isolado**: executa uma rodada dedicada do agente em `cron:<jobId>` ou uma sessão personalizada, com entrega (announce por padrão ou nenhuma).
  - **Sessão atual**: vincula à sessão onde o Cron é criado (`sessionTarget: "current"`).
  - **Sessão personalizada**: executa em uma sessão nomeada persistente (`sessionTarget: "session:custom-id"`).
- Wakeups são de primeira classe: um job pode solicitar "acordar agora" vs "próximo heartbeat".
- Postagem via Webhook é por job via `delivery.mode = "webhook"` + `delivery.to = "<url>"`.
- Fallback legado permanece para jobs armazenados com `notify: true` quando `cron.webhook` está definido, migre esses jobs para o modo de entrega Webhook.
- Para upgrades, `opencraft doctor --fix` pode normalizar campos legados do armazenamento Cron antes que o agendador os toque.

## Início rápido (acionável)

Crie um lembrete único, verifique se ele existe e execute-o imediatamente:

```bash
opencraft cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

opencraft cron list
opencraft cron run <job-id>
opencraft cron runs --id <job-id>
```

Agende um job isolado recorrente com entrega:

```bash
opencraft cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

## Equivalentes de chamada de ferramenta (ferramenta Cron do Gateway)

Para os formatos JSON canônicos e exemplos, veja [Esquema JSON para chamadas de ferramenta](/automation/cron-jobs#json-schema-for-tool-calls).

## Onde os Cron jobs são armazenados

Cron jobs são persistidos no host do Gateway em `~/.opencraft/cron/jobs.json` por padrão.
O Gateway carrega o arquivo na memória e o escreve de volta nas alterações, então edições manuais
são seguras apenas quando o Gateway está parado. Prefira `opencraft cron add/edit` ou a API de
chamada de ferramenta Cron para alterações.

## Visão geral amigável para iniciantes

Pense em um Cron job como: **quando** executar + **o que** fazer.

1. **Escolha um agendamento**
   - Lembrete único → `schedule.kind = "at"` (CLI: `--at`)
   - Job recorrente → `schedule.kind = "every"` ou `schedule.kind = "cron"`
   - Se seu timestamp ISO omitir um fuso horário, ele é tratado como **UTC**.

2. **Escolha onde ele executa**
   - `sessionTarget: "main"` → executar durante o próximo heartbeat com contexto principal.
   - `sessionTarget: "isolated"` → executar uma rodada dedicada do agente em `cron:<jobId>`.
   - `sessionTarget: "current"` → vincular à sessão atual (resolvido no momento da criação para `session:<sessionKey>`).
   - `sessionTarget: "session:custom-id"` → executar em uma sessão nomeada persistente que mantém contexto entre execuções.

   Comportamento padrão (inalterado):
   - Payloads `systemEvent` usam `main` por padrão
   - Payloads `agentTurn` usam `isolated` por padrão

   Para usar vinculação à sessão atual, defina explicitamente `sessionTarget: "current"`.

3. **Escolha o payload**
   - Sessão principal → `payload.kind = "systemEvent"`
   - Sessão isolada → `payload.kind = "agentTurn"`

Opcional: jobs únicos (`schedule.kind = "at"`) são deletados após sucesso por padrão. Defina
`deleteAfterRun: false` para mantê-los (eles serão desabilitados após sucesso).

## Conceitos

### Jobs

Um Cron job é um registro armazenado com:

- um **agendamento** (quando deve executar),
- um **payload** (o que deve fazer),
- **modo de entrega** opcional (`announce`, `webhook`, ou `none`).
- **vinculação de agente** opcional (`agentId`): executar o job sob um agente específico; se
  ausente ou desconhecido, o Gateway recorre ao agente padrão.

Jobs são identificados por um `jobId` estável (usado pelas APIs do CLI/Gateway).
Em chamadas de ferramenta do agente, `jobId` é canônico; `id` legado é aceito por compatibilidade.
Jobs únicos são auto-deletados após sucesso por padrão; defina `deleteAfterRun: false` para mantê-los.

### Agendamentos

Cron suporta três tipos de agendamento:

- `at`: timestamp único via `schedule.at` (ISO 8601).
- `every`: intervalo fixo (ms).
- `cron`: expressão Cron de 5 campos (ou 6 campos com segundos) com fuso horário IANA opcional.

Expressões Cron usam `croner`. Se um fuso horário for omitido, o
fuso horário local do host do Gateway é usado.

Para reduzir picos de carga no topo da hora em muitos Gateways, o OpenCraft aplica uma
janela de escalonamento determinística por job de até 5 minutos para expressões recorrentes
no topo da hora (por exemplo `0 * * * *`, `0 */2 * * *`). Expressões de hora fixa
como `0 7 * * *` permanecem exatas.

Para qualquer agendamento Cron, você pode definir uma janela de escalonamento explícita com `schedule.staggerMs`
(`0` mantém temporização exata). Atalhos do CLI:

- `--stagger 30s` (ou `1m`, `5m`) para definir uma janela de escalonamento explícita.
- `--exact` para forçar `staggerMs = 0`.

### Execução principal vs isolada

#### Jobs de sessão principal (eventos do sistema)

Jobs principais enfileiram um evento do sistema e opcionalmente acordam o executor de heartbeat.
Eles devem usar `payload.kind = "systemEvent"`.

- `wakeMode: "now"` (padrão): evento dispara uma execução imediata de heartbeat.
- `wakeMode: "next-heartbeat"`: evento espera o próximo heartbeat agendado.

Esta é a melhor opção quando você quer o prompt normal do heartbeat + contexto da sessão principal.
Veja [Heartbeat](/gateway/heartbeat).

#### Jobs isolados (sessões Cron dedicadas)

Jobs isolados executam uma rodada dedicada do agente na sessão `cron:<jobId>` ou uma sessão personalizada.

Comportamentos principais:

- O prompt é prefixado com `[cron:<jobId> <nome do job>]` para rastreabilidade.
- Cada execução inicia um **id de sessão novo** (sem continuação de conversa anterior), a menos que use uma sessão personalizada.
- Sessões personalizadas (`session:xxx`) persistem contexto entre execuções, habilitando fluxos de trabalho como standups diários que se baseiam em resumos anteriores.
- Comportamento padrão: se `delivery` for omitido, jobs isolados anunciam um resumo (`delivery.mode = "announce"`).
- `delivery.mode` escolhe o que acontece:
  - `announce`: entrega um resumo para o canal alvo e publica um breve resumo na sessão principal.
  - `webhook`: POST do payload do evento finalizado para `delivery.to` quando o evento finalizado inclui um resumo.
  - `none`: somente interno (sem entrega, sem resumo na sessão principal).
- `wakeMode` controla quando o resumo da sessão principal é publicado:
  - `now`: heartbeat imediato.
  - `next-heartbeat`: espera o próximo heartbeat agendado.

Use jobs isolados para tarefas ruidosas, frequentes ou "trabalhos de fundo" que não devem poluir
seu histórico de chat principal.

### Formatos de payload (o que executa)

Dois tipos de payload são suportados:

- `systemEvent`: somente sessão principal, roteado através do prompt de heartbeat.
- `agentTurn`: somente sessão isolada, executa uma rodada dedicada do agente.

Campos comuns de `agentTurn`:

- `message`: prompt de texto obrigatório.
- `model` / `thinking`: sobrescritas opcionais (veja abaixo).
- `timeoutSeconds`: sobrescrita opcional de timeout.
- `lightContext`: modo opcional de bootstrap leve para jobs que não precisam de injeção de arquivos de bootstrap do workspace.

Configuração de entrega:

- `delivery.mode`: `none` | `announce` | `webhook`.
- `delivery.channel`: `last` ou um canal específico.
- `delivery.to`: alvo específico do canal (announce) ou URL do Webhook (modo webhook).
- `delivery.bestEffort`: evitar falhar o job se a entrega announce falhar.

A entrega announce suprime envios de ferramenta de mensagens para a execução; use `delivery.channel`/`delivery.to`
para direcionar o chat em vez disso. Quando `delivery.mode = "none"`, nenhum resumo é publicado na sessão principal.

Se `delivery` for omitido para jobs isolados, o OpenCraft usa `announce` por padrão.

#### Fluxo de entrega announce

Quando `delivery.mode = "announce"`, o Cron entrega diretamente via os adaptadores de canal de saída.
O agente principal não é iniciado para elaborar ou encaminhar a mensagem.

Detalhes do comportamento:

- Conteúdo: a entrega usa os payloads de saída da execução isolada (texto/mídia) com chunking normal e
  formatação de canal.
- Respostas somente de heartbeat (`HEARTBEAT_OK` sem conteúdo real) não são entregues.
- Se a execução isolada já enviou uma mensagem para o mesmo alvo via a ferramenta de mensagem, a entrega é
  pulada para evitar duplicatas.
- Alvos de entrega ausentes ou inválidos falham o job a menos que `delivery.bestEffort = true`.
- Um resumo curto é publicado na sessão principal somente quando `delivery.mode = "announce"`.
- O resumo da sessão principal respeita `wakeMode`: `now` dispara um heartbeat imediato e
  `next-heartbeat` espera o próximo heartbeat agendado.

#### Fluxo de entrega Webhook

Quando `delivery.mode = "webhook"`, o Cron posta o payload do evento finalizado para `delivery.to` quando o evento finalizado inclui um resumo.

Detalhes do comportamento:

- O endpoint deve ser uma URL HTTP(S) válida.
- Nenhuma entrega de canal é tentada no modo Webhook.
- Nenhum resumo de sessão principal é publicado no modo Webhook.
- Se `cron.webhookToken` estiver definido, o cabeçalho de autenticação é `Authorization: Bearer <cron.webhookToken>`.
- Fallback descontinuado: jobs legados armazenados com `notify: true` ainda postam para `cron.webhook` (se configurado), com um aviso para que você possa migrar para `delivery.mode = "webhook"`.

### Sobrescritas de modelo e pensamento

Jobs isolados (`agentTurn`) podem sobrescrever o modelo e nível de pensamento:

- `model`: String provedor/modelo (ex., `anthropic/claude-sonnet-4-20250514`) ou alias (ex., `opus`)
- `thinking`: Nível de pensamento (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`; somente modelos GPT-5.2 + Codex)

Nota: Você pode definir `model` em jobs de sessão principal também, mas isso muda o
modelo compartilhado da sessão principal. Recomendamos sobrescritas de modelo somente para jobs isolados para evitar
mudanças inesperadas de contexto.

Prioridade de resolução:

1. Sobrescrita do payload do job (maior prioridade)
2. Padrões específicos do hook (ex., `hooks.gmail.model`)
3. Padrão de configuração do agente

### Contexto de bootstrap leve

Jobs isolados (`agentTurn`) podem definir `lightContext: true` para executar com contexto de bootstrap leve.

- Use isso para tarefas agendadas que não precisam de injeção de arquivos de bootstrap do workspace.
- Na prática, o runtime embarcado executa com `bootstrapContextMode: "lightweight"`, que mantém o contexto de bootstrap do Cron vazio propositalmente.
- Equivalentes no CLI: `opencraft cron add --light-context ...` e `opencraft cron edit --light-context`.

### Entrega (canal + alvo)

Jobs isolados podem entregar saída para um canal via a configuração de `delivery` de nível superior:

- `delivery.mode`: `announce` (entrega de canal), `webhook` (HTTP POST), ou `none`.
- `delivery.channel`: `whatsapp` / `telegram` / `discord` / `slack` / `mattermost` (Plugin) / `signal` / `imessage` / `last`.
- `delivery.to`: alvo destinatário específico do canal.

Entrega `announce` é válida apenas para jobs isolados (`sessionTarget: "isolated"`).
Entrega `webhook` é válida tanto para jobs principais quanto isolados.

Se `delivery.channel` ou `delivery.to` for omitido, o Cron pode recorrer à
"última rota" da sessão principal (o último lugar onde o agente respondeu).

Lembretes de formato de alvo:

- Alvos Slack/Discord/Mattermost (Plugin) devem usar prefixos explícitos (ex. `channel:<id>`, `user:<id>`) para evitar ambiguidade.
  IDs de 26 caracteres do Mattermost são resolvidos **usuário primeiro** (DM se o usuário existir, canal caso contrário) — use `user:<id>` ou `channel:<id>` para roteamento determinístico.
- Tópicos do Telegram devem usar o formato `:topic:` (veja abaixo).

#### Alvos de entrega do Telegram (tópicos / threads de fórum)

O Telegram suporta tópicos de fórum via `message_thread_id`. Para entrega Cron, você pode codificar
o tópico/thread no campo `to`:

- `-1001234567890` (somente id do chat)
- `-1001234567890:topic:123` (preferido: marcador explícito de tópico)
- `-1001234567890:123` (abreviação: sufixo numérico)

Alvos prefixados como `telegram:...` / `telegram:group:...` também são aceitos:

- `telegram:group:-1001234567890:topic:123`

## Esquema JSON para chamadas de ferramenta

Use estes formatos ao chamar ferramentas `cron.*` do Gateway diretamente (chamadas de ferramenta do agente ou RPC).
Flags do CLI aceitam durações humanas como `20m`, mas chamadas de ferramenta devem usar uma string ISO 8601
para `schedule.at` e milissegundos para `schedule.everyMs`.

### Parâmetros de cron.add

Job único, sessão principal (evento do sistema):

```json
{
  "name": "Reminder",
  "schedule": { "kind": "at", "at": "2026-02-01T16:00:00Z" },
  "sessionTarget": "main",
  "wakeMode": "now",
  "payload": { "kind": "systemEvent", "text": "Reminder text" },
  "deleteAfterRun": true
}
```

Job isolado recorrente com entrega:

```json
{
  "name": "Morning brief",
  "schedule": { "kind": "cron", "expr": "0 7 * * *", "tz": "America/Los_Angeles" },
  "sessionTarget": "isolated",
  "wakeMode": "next-heartbeat",
  "payload": {
    "kind": "agentTurn",
    "message": "Summarize overnight updates.",
    "lightContext": true
  },
  "delivery": {
    "mode": "announce",
    "channel": "slack",
    "to": "channel:C1234567890",
    "bestEffort": true
  }
}
```

Job recorrente vinculado à sessão atual (auto-resolvido na criação):

```json
{
  "name": "Daily standup",
  "schedule": { "kind": "cron", "expr": "0 9 * * *" },
  "sessionTarget": "current",
  "payload": {
    "kind": "agentTurn",
    "message": "Summarize yesterday's progress."
  }
}
```

Job recorrente em uma sessão persistente personalizada:

```json
{
  "name": "Project monitor",
  "schedule": { "kind": "every", "everyMs": 300000 },
  "sessionTarget": "session:project-alpha-monitor",
  "payload": {
    "kind": "agentTurn",
    "message": "Check project status and update the running log."
  }
}
```

Notas:

- `schedule.kind`: `at` (`at`), `every` (`everyMs`), ou `cron` (`expr`, `tz` opcional).
- `schedule.at` aceita ISO 8601 (fuso horário opcional; tratado como UTC quando omitido).
- `everyMs` é em milissegundos.
- `sessionTarget`: `"main"`, `"isolated"`, `"current"`, ou `"session:<custom-id>"`.
- `"current"` é resolvido para `"session:<sessionKey>"` no momento da criação.
- Sessões personalizadas (`session:xxx`) mantêm contexto persistente entre execuções.
- Campos opcionais: `agentId`, `description`, `enabled`, `deleteAfterRun` (padrão true para `at`),
  `delivery`.
- `wakeMode` padrão é `"now"` quando omitido.

### Parâmetros de cron.update

```json
{
  "jobId": "job-123",
  "patch": {
    "enabled": false,
    "schedule": { "kind": "every", "everyMs": 3600000 }
  }
}
```

Notas:

- `jobId` é canônico; `id` é aceito por compatibilidade.
- Use `agentId: null` no patch para limpar uma vinculação de agente.

### Parâmetros de cron.run e cron.remove

```json
{ "jobId": "job-123", "mode": "force" }
```

```json
{ "jobId": "job-123" }
```

## Armazenamento e histórico

- Armazenamento de jobs: `~/.opencraft/cron/jobs.json` (JSON gerenciado pelo Gateway).
- Histórico de execuções: `~/.opencraft/cron/runs/<jobId>.jsonl` (JSONL, podado automaticamente por tamanho e contagem de linhas).
- Sessões de execução Cron isoladas em `sessions.json` são podadas por `cron.sessionRetention` (padrão `24h`; defina `false` para desabilitar).
- Sobrescrever caminho do armazenamento: `cron.store` na configuração.

## Política de retry

Quando um job falha, o OpenCraft classifica erros como **transientes** (podem ser retentados) ou **permanentes** (desabilitar imediatamente).

### Erros transientes (retentados)

- Limite de taxa (429, muitas requisições, recurso esgotado)
- Sobrecarga do provedor (por exemplo Anthropic `529 overloaded_error`, resumos de fallback de sobrecarga)
- Erros de rede (timeout, ECONNRESET, falha de fetch, socket)
- Erros de servidor (5xx)
- Erros relacionados ao Cloudflare

### Erros permanentes (sem retry)

- Falhas de autenticação (API key inválida, não autorizado)
- Erros de configuração ou validação
- Outros erros não transientes

### Comportamento padrão (sem configuração)

**Jobs únicos (`schedule.kind: "at"`):**

- Em erro transiente: retenta até 3 vezes com backoff exponencial (30s → 1m → 5m).
- Em erro permanente: desabilita imediatamente.
- Em sucesso ou pulo: desabilita (ou deleta se `deleteAfterRun: true`).

**Jobs recorrentes (`cron` / `every`):**

- Em qualquer erro: aplica backoff exponencial (30s → 1m → 5m → 15m → 60m) antes da próxima execução agendada.
- Job permanece habilitado; backoff reinicia após a próxima execução bem-sucedida.

Configure `cron.retry` para sobrescrever esses padrões (veja [Configuração](/automation/cron-jobs#configuration)).

## Configuração

```json5
{
  cron: {
    enabled: true, // padrão true
    store: "~/.opencraft/cron/jobs.json",
    maxConcurrentRuns: 1, // padrão 1
    // Opcional: sobrescrever política de retry para jobs únicos
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhook: "https://example.invalid/legacy", // fallback descontinuado para jobs armazenados com notify:true
    webhookToken: "replace-with-dedicated-webhook-token", // Token bearer opcional para modo Webhook
    sessionRetention: "24h", // string de duração ou false
    runLog: {
      maxBytes: "2mb", // padrão 2_000_000 bytes
      keepLines: 2000, // padrão 2000
    },
  },
}
```

Comportamento de poda do log de execução:

- `cron.runLog.maxBytes`: tamanho máximo do arquivo de log de execução antes da poda.
- `cron.runLog.keepLines`: ao podar, manter apenas as N linhas mais recentes.
- Ambos se aplicam a arquivos `cron/runs/<jobId>.jsonl`.

Comportamento do Webhook:

- Preferido: defina `delivery.mode: "webhook"` com `delivery.to: "https://..."` por job.
- URLs de Webhook devem ser URLs `http://` ou `https://` válidas.
- Quando postado, o payload é o JSON do evento Cron finalizado.
- Se `cron.webhookToken` estiver definido, o cabeçalho de autenticação é `Authorization: Bearer <cron.webhookToken>`.
- Se `cron.webhookToken` não estiver definido, nenhum cabeçalho `Authorization` é enviado.
- Fallback descontinuado: jobs legados armazenados com `notify: true` ainda usam `cron.webhook` quando presente.

Desabilitar Cron completamente:

- `cron.enabled: false` (configuração)
- `OPENCRAFT_SKIP_CRON=1` (env)

## Manutenção

Cron tem dois caminhos de manutenção integrados: retenção de sessão de execução isolada e poda de log de execução.

### Padrões

- `cron.sessionRetention`: `24h` (defina `false` para desabilitar poda de sessão de execução)
- `cron.runLog.maxBytes`: `2_000_000` bytes
- `cron.runLog.keepLines`: `2000`

### Como funciona

- Execuções isoladas criam entradas de sessão (`...:cron:<jobId>:run:<uuid>`) e arquivos de transcrição.
- O ceifador remove entradas de sessão de execução expiradas mais antigas que `cron.sessionRetention`.
- Para sessões de execução removidas que não são mais referenciadas pelo armazenamento de sessão, o OpenCraft arquiva arquivos de transcrição e limpa arquivos deletados antigos na mesma janela de retenção.
- Após cada adição de execução, `cron/runs/<jobId>.jsonl` é verificado por tamanho:
  - se o tamanho do arquivo exceder `runLog.maxBytes`, é reduzido para as `runLog.keepLines` linhas mais recentes.

### Aviso de desempenho para agendadores de alto volume

Configurações de Cron de alta frequência podem gerar grandes volumes de sessão de execução e log de execução. A manutenção é integrada, mas limites soltos ainda podem criar trabalho evitável de IO e limpeza.

O que observar:

- janelas longas de `cron.sessionRetention` com muitas execuções isoladas
- `cron.runLog.keepLines` alto combinado com `runLog.maxBytes` grande
- muitos jobs recorrentes ruidosos escrevendo no mesmo `cron/runs/<jobId>.jsonl`

O que fazer:

- mantenha `cron.sessionRetention` o mais curto que suas necessidades de depuração/auditoria permitirem
- mantenha logs de execução limitados com `runLog.maxBytes` e `runLog.keepLines` moderados
- mova jobs de fundo ruidosos para modo isolado com regras de entrega que evitem conversa desnecessária
- revise o crescimento periodicamente com `opencraft cron runs` e ajuste a retenção antes que os logs fiquem grandes

### Exemplos de personalização

Manter sessões de execução por uma semana e permitir logs de execução maiores:

```json5
{
  cron: {
    sessionRetention: "7d",
    runLog: {
      maxBytes: "10mb",
      keepLines: 5000,
    },
  },
}
```

Desabilitar poda de sessão de execução isolada mas manter poda de log de execução:

```json5
{
  cron: {
    sessionRetention: false,
    runLog: {
      maxBytes: "5mb",
      keepLines: 3000,
    },
  },
}
```

Ajustar para uso de Cron de alto volume (exemplo):

```json5
{
  cron: {
    sessionRetention: "12h",
    runLog: {
      maxBytes: "3mb",
      keepLines: 1500,
    },
  },
}
```

## Início rápido do CLI

Lembrete único (UTC ISO, auto-deletar após sucesso):

```bash
opencraft cron add \
  --name "Send reminder" \
  --at "2026-01-12T18:00:00Z" \
  --session main \
  --system-event "Reminder: submit expense report." \
  --wake now \
  --delete-after-run
```

Lembrete único (sessão principal, acordar imediatamente):

```bash
opencraft cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Job isolado recorrente (anunciar no WhatsApp):

```bash
opencraft cron add \
  --name "Morning status" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize inbox + calendar for today." \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

Cron job recorrente com escalonamento explícito de 30 segundos:

```bash
opencraft cron add \
  --name "Minute watcher" \
  --cron "0 * * * * *" \
  --tz "UTC" \
  --stagger 30s \
  --session isolated \
  --message "Run minute watcher checks." \
  --announce
```

Job isolado recorrente (entregar para um tópico do Telegram):

```bash
opencraft cron add \
  --name "Nightly summary (topic)" \
  --cron "0 22 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize today; send to the nightly topic." \
  --announce \
  --channel telegram \
  --to "-1001234567890:topic:123"
```

Job isolado com sobrescrita de modelo e pensamento:

```bash
opencraft cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

Seleção de agente (configurações multi-agente):

```bash
# Fixar um job ao agente "ops" (recorre ao padrão se esse agente estiver ausente)
opencraft cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops

# Trocar ou limpar o agente em um job existente
opencraft cron edit <jobId> --agent ops
opencraft cron edit <jobId> --clear-agent
```

Execução manual (force é o padrão, use `--due` para executar apenas quando no horário):

```bash
opencraft cron run <jobId>
opencraft cron run <jobId> --due
```

`cron.run` agora confirma assim que a execução manual é enfileirada, não após o job terminar. Respostas de enfileiramento bem-sucedidas se parecem com `{ ok: true, enqueued: true, runId }`. Se o job já está executando ou `--due` não encontra nada no horário, a resposta permanece `{ ok: true, ran: false, reason }`. Use `opencraft cron runs --id <jobId>` ou o método `cron.runs` do Gateway para inspecionar a entrada finalizada eventual.

Editar um job existente (campos de patch):

```bash
opencraft cron edit <jobId> \
  --message "Updated prompt" \
  --model "opus" \
  --thinking low
```

Forçar um Cron job existente a executar exatamente no agendamento (sem escalonamento):

```bash
opencraft cron edit <jobId> --exact
```

Histórico de execução:

```bash
opencraft cron runs --id <jobId> --limit 50
```

Evento do sistema imediato sem criar um job:

```bash
opencraft system event --mode now --text "Next heartbeat: check battery."
```

## Superfície da API do Gateway

- `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`
- `cron.run` (force ou due), `cron.runs`
  Para eventos do sistema imediatos sem um job, use [`opencraft system event`](/cli/system).

## Solução de problemas

### "Nada executa"

- Verifique se o Cron está habilitado: `cron.enabled` e `OPENCRAFT_SKIP_CRON`.
- Verifique se o Gateway está executando continuamente (Cron executa dentro do processo do Gateway).
- Para agendamentos `cron`: confirme fuso horário (`--tz`) vs o fuso horário do host.

### Um job recorrente continua atrasando após falhas

- O OpenCraft aplica backoff exponencial de retry para jobs recorrentes após erros consecutivos:
  30s, 1m, 5m, 15m, depois 60m entre retentativas.
- O backoff reinicia automaticamente após a próxima execução bem-sucedida.
- Jobs únicos (`at`) retentam erros transientes (limite de taxa, sobrecarregado, rede, erro de servidor) até 3 vezes com backoff; erros permanentes desabilitam imediatamente. Veja [Política de retry](/automation/cron-jobs#retry-policy).

### Telegram entrega no lugar errado

- Para tópicos de fórum, use `-100…:topic:<id>` para que seja explícito e inequívoco.
- Se você vê prefixos `telegram:...` em logs ou alvos de "última rota" armazenados, isso é normal;
  entrega Cron os aceita e ainda analisa IDs de tópico corretamente.

### Retentativas de entrega announce de subagente

- Quando uma execução de subagente completa, o Gateway anuncia o resultado para a sessão solicitante.
- Se o fluxo de announce retorna `false` (ex. sessão solicitante está ocupada), o Gateway retenta até 3 vezes com rastreamento via `announceRetryCount`.
- Announces mais antigos que 5 minutos após `endedAt` são expirados à força para evitar que entradas obsoletas fiquem em loop indefinidamente.
- Se você vê entregas announce repetidas nos logs, verifique o registro de subagentes para entradas com valores altos de `announceRetryCount`.
