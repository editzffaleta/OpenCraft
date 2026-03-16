---
summary: "Cron jobs + wakeups para o agendador do Gateway"
read_when:
  - Agendando jobs em background ou wakeups
  - Conectando automação que deve rodar com ou ao lado de heartbeats
  - Decidindo entre heartbeat e cron para tarefas agendadas
title: "Cron Jobs"
---

# Cron jobs (agendador do Gateway)

> **Cron vs Heartbeat?** Veja [Cron vs Heartbeat](/automation/cron-vs-heartbeat) para orientação sobre quando usar cada um.

Cron é o agendador embutido do Gateway. Persiste jobs, acorda o agente no
momento certo, e pode opcionalmente entregar saída de volta para um chat.

Se você quer _"rodar isso toda manhã"_ ou _"cutucar o agente em 20 minutos"_,
cron é o mecanismo.

Resolução de problemas: [/automation/troubleshooting](/automation/troubleshooting)

## TL;DR

- Cron roda **dentro do Gateway** (não dentro do modelo).
- Jobs persistem em `~/.opencraft/cron/` para que reinicializações não percam agendamentos.
- Dois estilos de execução:
  - **Sessão principal**: enfileira um system event, depois roda no próximo heartbeat.
  - **Isolado**: roda um turno dedicado do agente em `cron:<jobId>` ou uma sessão customizada, com entrega (announce por padrão ou none).
  - **Sessão atual**: vincula à sessão onde o cron foi criado (`sessionTarget: "current"`).
  - **Sessão customizada**: roda em uma sessão com nome persistente (`sessionTarget: "session:custom-id"`).
- Wakeups são de primeira classe: um job pode requisitar "wake now" vs "próximo heartbeat".
- Posting de webhook é por job via `delivery.mode = "webhook"` + `delivery.to = "<url>"`.
- Fallback legado permanece para jobs armazenados com `notify: true` quando `cron.webhook` está definido; migre esses jobs para modo de entrega webhook.
- Para upgrades, `opencraft doctor --fix` pode normalizar campos legados do store cron antes que o agendador os toque.

## Início rápido (acionável)

Criar um lembrete one-shot, verificar se existe, e rodá-lo imediatamente:

```bash
opencraft cron add \
  --name "Lembrete" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Lembrete: verificar o rascunho de docs do cron" \
  --wake now \
  --delete-after-run

opencraft cron list
opencraft cron run <job-id>
opencraft cron runs --id <job-id>
```

Agendar um job isolado recorrente com entrega:

```bash
opencraft cron add \
  --name "Briefing matinal" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Resumir atualizações da noite." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

## Equivalentes de tool-call (ferramenta cron do Gateway)

Para as formas JSON canônicas e exemplos, veja [JSON schema para tool calls](/automation/cron-jobs#json-schema-para-tool-calls).

## Onde cron jobs são armazenados

Cron jobs são persistidos no host do Gateway em `~/.opencraft/cron/jobs.json` por padrão.
O Gateway carrega o arquivo na memória e o escreve de volta nas mudanças, então edições manuais
são seguras apenas quando o Gateway está parado. Prefira `opencraft cron add/edit` ou a API de tool call do cron para mudanças.

## Visão geral amigável para iniciantes

Pense em um cron job como: **quando** rodar + **o que** fazer.

1. **Escolha um agendamento**
   - Lembrete one-shot → `schedule.kind = "at"` (CLI: `--at`)
   - Job repetido → `schedule.kind = "every"` ou `schedule.kind = "cron"`
   - Se o seu timestamp ISO omitir um timezone, é tratado como **UTC**.

2. **Escolha onde roda**
   - `sessionTarget: "main"` → roda durante o próximo heartbeat com contexto principal.
   - `sessionTarget: "isolated"` → roda um turno dedicado do agente em `cron:<jobId>`.
   - `sessionTarget: "current"` → vincula à sessão atual (resolvido em tempo de criação para `session:<sessionKey>`).
   - `sessionTarget: "session:custom-id"` → roda em uma sessão com nome persistente que mantém contexto entre execuções.

   Comportamento padrão (inalterado):
   - Payloads `systemEvent` padrão para `main`
   - Payloads `agentTurn` padrão para `isolated`

   Para usar vinculação de sessão atual, defina explicitamente `sessionTarget: "current"`.

3. **Escolha o payload**
   - Sessão principal → `payload.kind = "systemEvent"`
   - Sessão isolada → `payload.kind = "agentTurn"`

Opcional: jobs one-shot (`schedule.kind = "at"`) deletam após sucesso por padrão. Defina
`deleteAfterRun: false` para mantê-los (eles desabilitarão após sucesso).

## Conceitos

### Jobs

Um cron job é um registro armazenado com:

- um **agendamento** (quando deve rodar),
- um **payload** (o que deve fazer),
- **modo de entrega** opcional (`announce`, `webhook`, ou `none`).
- **vinculação de agente** opcional (`agentId`): rodar o job sob um agente específico; se
  ausente ou desconhecido, o gateway faz fallback para o agente padrão.

Jobs são identificados por um `jobId` estável (usado por APIs CLI/Gateway).
Em tool calls de agente, `jobId` é canônico; `id` legado é aceito por compatibilidade.
Jobs one-shot auto-deletam após sucesso por padrão; defina `deleteAfterRun: false` para mantê-los.

### Agendamentos

Cron suporta três tipos de agendamento:

- `at`: timestamp one-shot via `schedule.at` (ISO 8601).
- `every`: intervalo fixo (ms).
- `cron`: expressão cron de 5 campos (ou 6 campos com segundos) com timezone IANA opcional.

Expressões cron usam `croner`. Se um timezone for omitido, o timezone local
do host do Gateway é usado.

Para reduzir picos de carga no topo da hora em muitos gateways, o OpenCraft aplica uma
janela de stagger determinística por job de até 5 minutos para expressões recorrentes
no topo da hora (por exemplo `0 * * * *`, `0 */2 * * *`). Expressões de hora fixa
como `0 7 * * *` permanecem exatas.

Para qualquer agendamento cron, você pode definir uma janela de stagger explícita com `schedule.staggerMs`
(`0` mantém timing exato). Atalhos CLI:

- `--stagger 30s` (ou `1m`, `5m`) para definir uma janela de stagger explícita.
- `--exact` para forçar `staggerMs = 0`.

### Execução principal vs isolada

#### Jobs de sessão principal (system events)

Jobs principais enfileiram um system event e opcionalmente acordam o runner de heartbeat.
Devem usar `payload.kind = "systemEvent"`.

- `wakeMode: "now"` (padrão): evento aciona uma execução imediata de heartbeat.
- `wakeMode: "next-heartbeat"`: evento espera pelo próximo heartbeat agendado.

Melhor encaixe quando você quer o prompt de heartbeat normal + contexto da sessão principal.
Veja [Heartbeat](/gateway/heartbeat).

#### Jobs isolados (sessões cron dedicadas)

Jobs isolados rodam um turno dedicado do agente na sessão `cron:<jobId>` ou uma sessão customizada.

Comportamentos principais:

- Prompt é prefixado com `[cron:<jobId> <nome do job>]` para rastreabilidade.
- Cada execução inicia um **novo session id** (sem carregamento de conversa anterior), exceto ao usar sessão customizada.
- Sessões customizadas (`session:xxx`) persistem contexto entre execuções, permitindo workflows como standups diários que constroem sobre resumos anteriores.
- Comportamento padrão: se `delivery` for omitido, jobs isolados anunciam um resumo (`delivery.mode = "announce"`).
- `delivery.mode` escolhe o que acontece:
  - `announce`: entregar um resumo ao canal alvo e postar um breve resumo na sessão principal.
  - `webhook`: POSTar o payload do evento finalizado para `delivery.to` quando o evento finalizado inclui um resumo.
  - `none`: apenas interno (sem entrega, sem resumo na sessão principal).
- `wakeMode` controla quando o resumo da sessão principal é postado:
  - `now`: heartbeat imediato.
  - `next-heartbeat`: aguarda o próximo heartbeat agendado.

Use jobs isolados para tarefas barulhentas, frequentes, ou "tarefas de fundo" que não devem
poluir seu histórico de chat principal.

### Formas de payload (o que roda)

Dois tipos de payload são suportados:

- `systemEvent`: somente sessão principal, roteado pelo prompt de heartbeat.
- `agentTurn`: somente sessão isolada, roda um turno dedicado do agente.

Campos comuns de `agentTurn`:

- `message`: prompt de texto obrigatório.
- `model` / `thinking`: overrides opcionais (veja abaixo).
- `timeoutSeconds`: override de timeout opcional.
- `lightContext`: modo de bootstrap leve opcional para jobs que não precisam de injeção de arquivos de bootstrap do workspace.

Config de entrega:

- `delivery.mode`: `none` | `announce` | `webhook`.
- `delivery.channel`: `last` ou um canal específico.
- `delivery.to`: alvo específico do canal (announce) ou URL do webhook (modo webhook).
- `delivery.bestEffort`: evitar falhar o job se a entrega announce falhar.

Entrega announce suprime envios de ferramentas de mensagem para a execução; use `delivery.channel`/`delivery.to`
para direcionar o chat. Quando `delivery.mode = "none"`, nenhum resumo é postado na sessão principal.

Se `delivery` for omitido para jobs isolados, o OpenCraft padrão para `announce`.

#### Fluxo de entrega announce

Quando `delivery.mode = "announce"`, o cron entrega diretamente via adaptadores de canal de saída.
O agente principal não é iniciado para criar ou encaminhar a mensagem.

Detalhes de comportamento:

- Conteúdo: entrega usa os payloads de saída da execução isolada (texto/mídia) com chunking normal e
  formatação de canal.
- Respostas apenas de heartbeat (`HEARTBEAT_OK` sem conteúdo real) não são entregues.
- Se a execução isolada já enviou uma mensagem para o mesmo alvo via ferramenta de mensagem, a entrega é
  pulada para evitar duplicatas.
- Alvos de entrega ausentes ou inválidos falham o job a menos que `delivery.bestEffort = true`.
- Um resumo curto é postado na sessão principal apenas quando `delivery.mode = "announce"`.
- O resumo da sessão principal respeita `wakeMode`: `now` aciona um heartbeat imediato e
  `next-heartbeat` aguarda o próximo heartbeat agendado.

#### Fluxo de entrega webhook

Quando `delivery.mode = "webhook"`, o cron posta o payload do evento finalizado para `delivery.to` quando o evento finalizado inclui um resumo.

Detalhes de comportamento:

- O endpoint deve ser uma URL HTTP(S) válida.
- Nenhuma entrega de canal é tentada no modo webhook.
- Nenhum resumo de sessão principal é postado no modo webhook.
- Se `cron.webhookToken` estiver definido, o header de auth é `Authorization: Bearer <cron.webhookToken>`.
- Fallback depreciado: jobs legados armazenados com `notify: true` ainda postam para `cron.webhook` (se configurado), com um aviso para você migrar para `delivery.mode = "webhook"`.

### Overrides de modelo e thinking

Jobs isolados (`agentTurn`) podem sobrescrever o modelo e o nível de thinking:

- `model`: String de provider/modelo (ex.: `anthropic/claude-sonnet-4-20250514`) ou alias (ex.: `opus`)
- `thinking`: Nível de thinking (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`; apenas modelos GPT-5.2 + Codex)

Nota: Você pode definir `model` em jobs de sessão principal também, mas isso muda o modelo
compartilhado da sessão principal. Recomendamos overrides de modelo apenas para jobs isolados para evitar
mudanças inesperadas de contexto.

Prioridade de resolução:

1. Override de payload do job (mais alto)
2. Padrões específicos do hook (ex.: `hooks.gmail.model`)
3. Padrão de config do agente

### Contexto de bootstrap leve

Jobs isolados (`agentTurn`) podem definir `lightContext: true` para rodar com contexto de bootstrap leve.

- Use para tarefas agendadas de rotina que não precisam de injeção de arquivos de bootstrap do workspace.
- Na prática, o runtime embutido roda com `bootstrapContextMode: "lightweight"`, que mantém o contexto de bootstrap do cron vazio propositalmente.
- Equivalentes CLI: `opencraft cron add --light-context ...` e `opencraft cron edit --light-context`.

### Entrega (canal + alvo)

Jobs isolados podem entregar saída para um canal via config de `delivery` de nível superior:

- `delivery.mode`: `announce` (entrega de canal), `webhook` (HTTP POST), ou `none`.
- `delivery.channel`: `whatsapp` / `telegram` / `discord` / `slack` / `mattermost` (plugin) / `signal` / `imessage` / `last`.
- `delivery.to`: alvo de destinatário específico do canal.

Entrega `announce` é válida apenas para jobs isolados (`sessionTarget: "isolated"`).
Entrega `webhook` é válida para jobs principais e isolados.

Se `delivery.channel` ou `delivery.to` for omitido, o cron pode fazer fallback para a
"última rota" da sessão principal (o último lugar que o agente respondeu).

Lembretes de formato de alvo:

- Alvos Slack/Discord/Mattermost (plugin) devem usar prefixos explícitos (ex.: `channel:<id>`, `user:<id>`) para evitar ambiguidade.
  IDs Mattermost de 26 chars sem prefixo são resolvidos **usuário-primeiro** (DM se o usuário existir, canal caso contrário) — use `user:<id>` ou `channel:<id>` para roteamento determinístico.
- Tópicos do Telegram devem usar a forma `:topic:` (veja abaixo).

#### Alvos de entrega do Telegram (tópicos / threads de fórum)

Telegram suporta tópicos de fórum via `message_thread_id`. Para entrega cron, você pode codificar
o tópico/thread no campo `to`:

- `-1001234567890` (apenas chat id)
- `-1001234567890:topic:123` (preferido: marcador de tópico explícito)
- `-1001234567890:123` (abreviação: sufixo numérico)

Alvos prefixados como `telegram:...` / `telegram:group:...` também são aceitos:

- `telegram:group:-1001234567890:topic:123`

## JSON schema para tool calls

Use essas formas ao chamar as ferramentas `cron.*` do Gateway diretamente (tool calls de agente ou RPC).
Flags CLI aceitam durações humanas como `20m`, mas tool calls devem usar uma string ISO 8601
para `schedule.at` e milissegundos para `schedule.everyMs`.

### Parâmetros de cron.add

Job one-shot, sessão principal (system event):

```json
{
  "name": "Lembrete",
  "schedule": { "kind": "at", "at": "2026-02-01T16:00:00Z" },
  "sessionTarget": "main",
  "wakeMode": "now",
  "payload": { "kind": "systemEvent", "text": "Texto do lembrete" },
  "deleteAfterRun": true
}
```

Job recorrente, isolado com entrega:

```json
{
  "name": "Briefing matinal",
  "schedule": { "kind": "cron", "expr": "0 7 * * *", "tz": "America/Los_Angeles" },
  "sessionTarget": "isolated",
  "wakeMode": "next-heartbeat",
  "payload": {
    "kind": "agentTurn",
    "message": "Resumir atualizações da noite.",
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
  "name": "Standup diário",
  "schedule": { "kind": "cron", "expr": "0 9 * * *" },
  "sessionTarget": "current",
  "payload": {
    "kind": "agentTurn",
    "message": "Resumir o progresso de ontem."
  }
}
```

Job recorrente em uma sessão persistente customizada:

```json
{
  "name": "Monitor de projeto",
  "schedule": { "kind": "every", "everyMs": 300000 },
  "sessionTarget": "session:project-alpha-monitor",
  "payload": {
    "kind": "agentTurn",
    "message": "Verificar status do projeto e atualizar o log em execução."
  }
}
```

Notas:

- `schedule.kind`: `at` (`at`), `every` (`everyMs`), ou `cron` (`expr`, `tz` opcional).
- `schedule.at` aceita ISO 8601 (timezone opcional; tratado como UTC quando omitido).
- `everyMs` é milissegundos.
- `sessionTarget`: `"main"`, `"isolated"`, `"current"`, ou `"session:<custom-id>"`.
- `"current"` é resolvido para `"session:<sessionKey>"` em tempo de criação.
- Sessões customizadas (`session:xxx`) mantêm contexto persistente entre execuções.
- Campos opcionais: `agentId`, `description`, `enabled`, `deleteAfterRun` (padrão true para `at`),
  `delivery`.
- `wakeMode` padrão para `"now"` quando omitido.

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

- Store de jobs: `~/.opencraft/cron/jobs.json` (JSON gerenciado pelo Gateway).
- Histórico de execuções: `~/.opencraft/cron/runs/<jobId>.jsonl` (JSONL, auto-podado por tamanho e contagem de linhas).
- Sessões de execução cron isoladas em `sessions.json` são podadas por `cron.sessionRetention` (padrão `24h`; defina `false` para desabilitar).
- Sobrescrever path do store: `cron.store` na config.

## Política de retry

Quando um job falha, o OpenCraft classifica erros como **transitórios** (retryable) ou **permanentes** (desabilitar imediatamente).

### Erros transitórios (com retry)

- Rate limit (429, muitas requisições, recurso esgotado)
- Sobrecarga do provedor (por exemplo Anthropic `529 overloaded_error`, resumos de fallback de sobrecarga)
- Erros de rede (timeout, ECONNRESET, fetch falhou, socket)
- Erros de servidor (5xx)
- Erros relacionados ao Cloudflare

### Erros permanentes (sem retry)

- Falhas de auth (chave de API inválida, não autorizado)
- Erros de config ou validação
- Outros erros não transitórios

### Comportamento padrão (sem config)

**Jobs one-shot (`schedule.kind: "at"`):**

- Em erro transitório: retry até 3 vezes com backoff exponencial (30s → 1m → 5m).
- Em erro permanente: desabilitar imediatamente.
- Em sucesso ou skip: desabilitar (ou deletar se `deleteAfterRun: true`).

**Jobs recorrentes (`cron` / `every`):**

- Em qualquer erro: aplicar backoff exponencial (30s → 1m → 5m → 15m → 60m) antes da próxima execução agendada.
- Job permanece habilitado; backoff reseta após a próxima execução bem-sucedida.

Configure `cron.retry` para sobrescrever esses padrões (veja [Configuração](/automation/cron-jobs#configuracao)).

## Configuração

```json5
{
  cron: {
    enabled: true, // padrão true
    store: "~/.opencraft/cron/jobs.json",
    maxConcurrentRuns: 1, // padrão 1
    // Opcional: sobrescrever política de retry para jobs one-shot
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhook: "https://example.invalid/legacy", // fallback depreciado para jobs notify:true armazenados
    webhookToken: "substituir-por-token-de-webhook-dedicado", // token bearer opcional para modo webhook
    sessionRetention: "24h", // string de duração ou false
    runLog: {
      maxBytes: "2mb", // padrão 2_000_000 bytes
      keepLines: 2000, // padrão 2000
    },
  },
}
```

Comportamento de poda de run-log:

- `cron.runLog.maxBytes`: tamanho máximo do arquivo de run-log antes da poda.
- `cron.runLog.keepLines`: ao podar, manter apenas as N linhas mais recentes.
- Ambos se aplicam a arquivos `cron/runs/<jobId>.jsonl`.

Comportamento de webhook:

- Preferido: defina `delivery.mode: "webhook"` com `delivery.to: "https://..."` por job.
- URLs de webhook devem ser URLs `http://` ou `https://` válidas.
- Quando postado, payload é o JSON do evento cron finalizado.
- Se `cron.webhookToken` estiver definido, header de auth é `Authorization: Bearer <cron.webhookToken>`.
- Se `cron.webhookToken` não estiver definido, nenhum header `Authorization` é enviado.
- Fallback depreciado: jobs legados armazenados com `notify: true` ainda usam `cron.webhook` quando presente.

Desabilitar cron completamente:

- `cron.enabled: false` (config)
- `OPENCLAW_SKIP_CRON=1` (env)

## Manutenção

Cron tem dois caminhos de manutenção embutidos: retenção de sessão de execução isolada e poda de run-log.

### Padrões

- `cron.sessionRetention`: `24h` (defina `false` para desabilitar poda de sessão de execução)
- `cron.runLog.maxBytes`: `2_000_000` bytes
- `cron.runLog.keepLines`: `2000`

### Como funciona

- Execuções isoladas criam entradas de sessão (`...:cron:<jobId>:run:<uuid>`) e arquivos de transcript.
- O reaper remove entradas de sessão de execução expiradas mais antigas que `cron.sessionRetention`.
- Para sessões de execução removidas que não são mais referenciadas pelo store de sessão, o OpenCraft arquiva arquivos de transcript e limpa arquivos deletados antigos na mesma janela de retenção.
- Após cada append de execução, `cron/runs/<jobId>.jsonl` é verificado por tamanho:
  - se o tamanho do arquivo exceder `runLog.maxBytes`, ele é aparado para as `runLog.keepLines` linhas mais recentes.

### Ressalva de performance para agendadores de alto volume

Configurações de cron de alta frequência podem gerar grandes footprints de sessão de execução e run-log. A manutenção é embutida, mas limites frouxos ainda podem criar IO e trabalho de limpeza desnecessários.

O que monitorar:

- janelas longas de `cron.sessionRetention` com muitas execuções isoladas
- `cron.runLog.keepLines` alto combinado com grande `runLog.maxBytes`
- muitos jobs recorrentes barulhentos escrevendo para o mesmo `cron/runs/<jobId>.jsonl`

O que fazer:

- mantenha `cron.sessionRetention` tão curto quanto suas necessidades de debugging/auditoria permitirem
- mantenha run logs limitados com `runLog.maxBytes` e `runLog.keepLines` moderados
- mova jobs de fundo barulhentos para modo isolado com regras de entrega que evitem chatice desnecessária
- revise o crescimento periodicamente com `opencraft cron runs` e ajuste a retenção antes que os logs fiquem grandes

### Exemplos de customização

Manter sessões de execução por uma semana e permitir run logs maiores:

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

Desabilitar poda de sessão de execução isolada mas manter poda de run-log:

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

Ajustar para uso cron de alto volume (exemplo):

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

Lembrete one-shot (UTC ISO, auto-delete após sucesso):

```bash
opencraft cron add \
  --name "Enviar lembrete" \
  --at "2026-01-12T18:00:00Z" \
  --session main \
  --system-event "Lembrete: submeter relatório de despesas." \
  --wake now \
  --delete-after-run
```

Lembrete one-shot (sessão principal, acordar imediatamente):

```bash
opencraft cron add \
  --name "Verificação de calendário" \
  --at "20m" \
  --session main \
  --system-event "Próximo heartbeat: verificar calendário." \
  --wake now
```

Job isolado recorrente (announce para WhatsApp):

```bash
opencraft cron add \
  --name "Status matinal" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Resumir caixa de entrada + calendário para hoje." \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

Cron job recorrente com stagger explícito de 30 segundos:

```bash
opencraft cron add \
  --name "Watcher de minuto" \
  --cron "0 * * * * *" \
  --tz "UTC" \
  --stagger 30s \
  --session isolated \
  --message "Rodar verificações do watcher de minuto." \
  --announce
```

Job isolado recorrente (entregar para um tópico do Telegram):

```bash
opencraft cron add \
  --name "Resumo noturno (tópico)" \
  --cron "0 22 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Resumir hoje; enviar para o tópico noturno." \
  --announce \
  --channel telegram \
  --to "-1001234567890:topic:123"
```

Job isolado com override de modelo e thinking:

```bash
opencraft cron add \
  --name "Análise profunda" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Análise semanal profunda do progresso do projeto." \
  --model "opus" \
  --thinking high \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

Seleção de agente (configurações multi-agente):

```bash
# Fixar um job ao agente "ops" (faz fallback para padrão se esse agente estiver ausente)
opencraft cron add --name "Varredura ops" --cron "0 6 * * *" --session isolated --message "Verificar fila de ops" --agent ops

# Trocar ou limpar o agente em um job existente
opencraft cron edit <jobId> --agent ops
opencraft cron edit <jobId> --clear-agent
```

Execução manual (force é o padrão, use `--due` para rodar apenas quando due):

```bash
opencraft cron run <jobId>
opencraft cron run <jobId> --due
```

`cron.run` agora confirma uma vez que a execução manual está na fila, não após o job terminar. Respostas de fila bem-sucedidas parecem `{ ok: true, enqueued: true, runId }`. Se o job já estiver rodando ou `--due` não encontrar nada due, a resposta permanece `{ ok: true, ran: false, reason }`. Use `opencraft cron runs --id <jobId>` ou o método de gateway `cron.runs` para inspecionar a entrada finalizada eventual.

Editar um job existente (patch de campos):

```bash
opencraft cron edit <jobId> \
  --message "Prompt atualizado" \
  --model "opus" \
  --thinking low
```

Forçar um cron job existente a rodar exatamente no agendamento (sem stagger):

```bash
opencraft cron edit <jobId> --exact
```

Histórico de execuções:

```bash
opencraft cron runs --id <jobId> --limit 50
```

System event imediato sem criar um job:

```bash
opencraft system event --mode now --text "Próximo heartbeat: verificar bateria."
```

## Superfície de API do Gateway

- `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`
- `cron.run` (force ou due), `cron.runs`
  Para system events imediatos sem um job, use [`opencraft system event`](/cli/system).

## Resolução de problemas

### "Nada roda"

- Verificar se cron está habilitado: `cron.enabled` e `OPENCLAW_SKIP_CRON`.
- Verificar se o Gateway está rodando continuamente (cron roda dentro do processo do Gateway).
- Para agendamentos `cron`: confirmar timezone (`--tz`) vs o timezone do host.

### Um job recorrente continua atrasando após falhas

- O OpenCraft aplica backoff exponencial de retry para jobs recorrentes após erros consecutivos:
  30s, 1m, 5m, 15m, depois 60m entre retries.
- Backoff reseta automaticamente após a próxima execução bem-sucedida.
- Jobs one-shot (`at`) fazem retry de erros transitórios (rate limit, overloaded, network, server_error) até 3 vezes com backoff; erros permanentes desabilitam imediatamente. Veja [Política de retry](/automation/cron-jobs#politica-de-retry).

### Telegram entrega para o lugar errado

- Para tópicos de fórum, use `-100…:topic:<id>` para que seja explícito e inequívoco.
- Se você vir prefixos `telegram:...` em logs ou alvos de "última rota" armazenados, isso é normal;
  a entrega cron os aceita e ainda analisa IDs de tópico corretamente.

### Retries de entrega announce de subagente

- Quando uma execução de subagente completa, o gateway anuncia o resultado para a sessão do requisitante.
- Se o fluxo de announce retornar `false` (ex.: sessão do requisitante está ocupada), o gateway faz retry até 3 vezes com rastreamento via `announceRetryCount`.
- Announces com mais de 5 minutos após `endedAt` são forçosamente expirados para evitar que entradas obsoletas fiquem em loop indefinidamente.
- Se você vir entregas de announce repetidas nos logs, verifique o registro de subagente por entradas com valores altos de `announceRetryCount`.
