---
summary: "Sub-agentes: criando execuções isoladas de agente que anunciam resultados de volta ao chat solicitante"
read_when:
  - Você quer trabalho em background/paralelo via agente
  - Você está mudando a política de sessions_spawn ou tools de sub-agente
  - Você está implementando ou solucionando problemas de sessões de subagente vinculadas a thread
title: "Sub-Agentes"
---

# Sub-agentes

Sub-agentes são execuções de agente em background criadas a partir de uma execução de agente existente. Eles rodam em sua própria sessão (`agent:<agentId>:subagent:<uuid>`) e, quando terminam, **anunciam** seu resultado de volta ao canal de chat solicitante.

## Slash command

Use `/subagents` para inspecionar ou controlar execuções de sub-agente para a **sessão atual**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <mensagem>`
- `/subagents steer <id|#> <mensagem>`
- `/subagents spawn <agentId> <tarefa> [--model <modelo>] [--thinking <nível>]`

Controles de vínculo de thread:

Esses comandos funcionam em canais que suportam vínculos de thread persistentes. Veja **Canais com suporte a threads** abaixo.

- `/focus <rótulo-subagente|chave-sessão|id-sessão|rótulo-sessão>`
- `/unfocus`
- `/agents`
- `/session idle <duração|off>`
- `/session max-age <duração|off>`

`/subagents info` mostra metadados de execução (status, timestamps, id de sessão, caminho do transcript, limpeza).

### Comportamento de spawn

`/subagents spawn` inicia um sub-agente em background como um comando de usuário, não um relay interno, e envia uma única atualização de conclusão de volta ao chat solicitante quando a execução termina.

- O comando de spawn é não-bloqueante; retorna um id de execução imediatamente.
- Na conclusão, o sub-agente anuncia uma mensagem de resumo/resultado de volta ao canal de chat solicitante.
- Para spawns manuais, a entrega é resiliente:
  - O OpenCraft tenta entrega `agent` direta primeiro com uma chave de idempotência estável.
  - Se a entrega direta falhar, cai para roteamento de fila.
  - Se o roteamento de fila ainda não estiver disponível, o anúncio é re-tentado com backoff exponencial curto antes de desistir.
- O handoff de conclusão para a sessão solicitante é contexto interno gerado pelo runtime (não texto do usuário) e inclui:
  - `Result` (texto de resposta do `assistant`, ou `toolResult` mais recente se a resposta do assistente estiver vazia)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - estatísticas compactas de runtime/token
  - uma instrução de entrega dizendo ao agente solicitante para reescrever na voz normal do assistente (não encaminhar metadados internos brutos)
- `--model` e `--thinking` sobrescrevem os padrões para aquela execução específica.
- Use `info`/`log` para inspecionar detalhes e saída após a conclusão.
- `/subagents spawn` é modo one-shot (`mode: "run"`). Para sessões vinculadas a thread persistentes, use `sessions_spawn` com `thread: true` e `mode: "session"`.
- Para sessões de harness ACP (Codex, Claude Code, Gemini CLI), use `sessions_spawn` com `runtime: "acp"` e veja [ACP Agents](/tools/acp-agents).

Objetivos principais:

- Paralelizar trabalho de "pesquisa / tarefa longa / tool lenta" sem bloquear a execução principal.
- Manter sub-agentes isolados por padrão (separação de sessão + sandboxing opcional).
- Manter a superfície de tool difícil de usar indevidamente: sub-agentes **não** recebem tools de sessão por padrão.
- Suportar profundidade de aninhamento configurável para padrões de orquestrador.

Nota de custo: cada sub-agente tem seu **próprio** contexto e uso de tokens. Para tarefas
pesadas ou repetitivas, defina um modelo mais barato para sub-agentes e mantenha seu agente principal em um modelo de maior qualidade.
Você pode configurar isso via `agents.defaults.subagents.model` ou overrides por agente.

## Tool

Use `sessions_spawn`:

- Inicia uma execução de sub-agente (`deliver: false`, lane global: `subagent`)
- Depois executa uma etapa de anúncio e posta a resposta do anúncio no canal de chat solicitante
- Modelo padrão: herda do chamador a menos que você defina `agents.defaults.subagents.model` (ou por agente `agents.list[].subagents.model`); um `sessions_spawn.model` explícito ainda vence.
- Thinking padrão: herda do chamador a menos que você defina `agents.defaults.subagents.thinking` (ou por agente `agents.list[].subagents.thinking`); um `sessions_spawn.thinking` explícito ainda vence.
- Timeout de execução padrão: se `sessions_spawn.runTimeoutSeconds` for omitido, o OpenCraft usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário cai para `0` (sem timeout).

Parâmetros da tool:

- `task` (obrigatório)
- `label?` (opcional)
- `agentId?` (opcional; criar sob outro id de agente se permitido)
- `model?` (opcional; sobrescreve o modelo do sub-agente; valores inválidos são ignorados e o sub-agente roda no modelo padrão com um aviso no resultado da tool)
- `thinking?` (opcional; sobrescreve o nível de thinking para a execução do sub-agente)
- `runTimeoutSeconds?` (padrão é `agents.defaults.subagents.runTimeoutSeconds` quando definido, caso contrário `0`; quando definido, a execução do sub-agente é abortada após N segundos)
- `thread?` (padrão `false`; quando `true`, solicita vínculo de thread de canal para esta sessão de sub-agente)
- `mode?` (`run|session`)
  - padrão é `run`
  - se `thread: true` e mode omitido, padrão torna-se `session`
  - `mode: "session"` requer `thread: true`
- `cleanup?` (`delete|keep`, padrão `keep`)
- `sandbox?` (`inherit|require`, padrão `inherit`; `require` rejeita spawn a menos que o runtime filho alvo esteja em sandbox)
- `sessions_spawn` **não** aceita parâmetros de entrega de canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Para entrega, use `message`/`sessions_send` da execução criada.

## Sessões vinculadas a thread

Quando os vínculos de thread estão habilitados para um canal, um sub-agente pode permanecer vinculado a uma thread para que mensagens de usuário subsequentes naquela thread continuem roteando para a mesma sessão de sub-agente.

### Canais com suporte a threads

- Discord (atualmente o único canal suportado): suporta sessões de subagente vinculadas a thread persistentes (`sessions_spawn` com `thread: true`), controles manuais de thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), e chaves de adaptador `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` e `channels.discord.threadBindings.spawnSubagentSessions`.

Fluxo rápido:

1. Crie com `sessions_spawn` usando `thread: true` (e opcionalmente `mode: "session"`).
2. O OpenCraft cria ou vincula uma thread a esse alvo de sessão no canal ativo.
3. Respostas e mensagens de seguimento naquela thread roteiam para a sessão vinculada.
4. Use `/session idle` para inspecionar/atualizar o auto-unfocus por inatividade e `/session max-age` para controlar o limite fixo.
5. Use `/unfocus` para desvinculação manual.

Controles manuais:

- `/focus <alvo>` vincula a thread atual (ou cria uma) a um alvo de sub-agente/sessão.
- `/unfocus` remove o vínculo para a thread vinculada atual.
- `/agents` lista execuções ativas e estado de vínculo (`thread:<id>` ou `unbound`).
- `/session idle` e `/session max-age` só funcionam para threads vinculadas focadas.

Chaves de configuração:

- Padrão global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Override de canal e chaves de auto-bind de spawn são específicos do adaptador. Veja **Canais com suporte a threads** acima.

Veja [Referência de Configuração](/gateway/configuration-reference) e [Slash commands](/tools/slash-commands) para detalhes atuais do adaptador.

Allowlist:

- `agents.list[].subagents.allowAgents`: lista de ids de agente que podem ser targets via `agentId` (`["*"]` para permitir qualquer). Padrão: apenas o agente solicitante.
- Guard de herança de sandbox: se a sessão solicitante está em sandbox, `sessions_spawn` rejeita targets que rodariam sem sandbox.

Descoberta:

- Use `agents_list` para ver quais ids de agente são atualmente permitidos para `sessions_spawn`.

Auto-arquivamento:

- Sessões de sub-agente são automaticamente arquivadas após `agents.defaults.subagents.archiveAfterMinutes` (padrão: 60).
- Arquivamento usa `sessions.delete` e renomeia o transcript para `*.deleted.<timestamp>` (mesma pasta).
- `cleanup: "delete"` arquiva imediatamente após o anúncio (ainda mantém o transcript via renomeação).
- Auto-arquivamento é best-effort; timers pendentes são perdidos se o gateway reiniciar.
- `runTimeoutSeconds` **não** faz auto-arquivamento; apenas para a execução. A sessão permanece até o auto-arquivamento.
- Auto-arquivamento se aplica igualmente a sessões de profundidade 1 e 2.

## Sub-Agentes Aninhados

Por padrão, sub-agentes não podem criar seus próprios sub-agentes (`maxSpawnDepth: 1`). Você pode habilitar um nível de aninhamento definindo `maxSpawnDepth: 2`, o que permite o **padrão de orquestrador**: principal → sub-agente orquestrador → sub-sub-agentes trabalhadores.

### Como habilitar

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permitir sub-agentes criarem filhos (padrão: 1)
        maxChildrenPerAgent: 5, // máx filhos ativos por sessão de agente (padrão: 5)
        maxConcurrent: 8, // cap de concorrência de lane global (padrão: 8)
        runTimeoutSeconds: 900, // timeout padrão para sessions_spawn quando omitido (0 = sem timeout)
      },
    },
  },
}
```

### Níveis de profundidade

| Profundidade | Formato da chave de sessão                   | Papel                                                  | Pode criar?                       |
| ------------ | -------------------------------------------- | ------------------------------------------------------ | --------------------------------- |
| 0            | `agent:<id>:main`                            | Agente principal                                       | Sempre                            |
| 1            | `agent:<id>:subagent:<uuid>`                 | Sub-agente (orquestrador quando profundidade 2 permitida) | Apenas se `maxSpawnDepth >= 2`  |
| 2            | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agente (trabalhador folha)                     | Nunca                             |

### Cadeia de anúncio

Resultados fluem de volta pela cadeia:

1. Trabalhador profundidade 2 termina → anuncia para seu pai (orquestrador profundidade 1)
2. Orquestrador profundidade 1 recebe o anúncio, sintetiza resultados, termina → anuncia para o principal
3. Agente principal recebe o anúncio e entrega ao usuário

Cada nível vê apenas anúncios de seus filhos diretos.

### Política de tools por profundidade

- Papel e escopo de controle são escritos nos metadados de sessão no momento do spawn. Isso evita que chaves de sessão planas ou restauradas recuperem acidentalmente privilégios de orquestrador.
- **Profundidade 1 (orquestrador, quando `maxSpawnDepth >= 2`)**: Recebe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gerenciar seus filhos. Outras tools de sessão/sistema permanecem negadas.
- **Profundidade 1 (folha, quando `maxSpawnDepth == 1`)**: Sem tools de sessão (comportamento padrão atual).
- **Profundidade 2 (trabalhador folha)**: Sem tools de sessão — `sessions_spawn` é sempre negado na profundidade 2. Não pode criar filhos adicionais.

### Limite de spawn por agente

Cada sessão de agente (em qualquer profundidade) pode ter no máximo `maxChildrenPerAgent` (padrão: 5) filhos ativos por vez. Isso previne fan-out descontrolado de um único orquestrador.

### Parada em cascata

Parar um orquestrador de profundidade 1 automaticamente para todos os seus filhos de profundidade 2:

- `/stop` no chat principal para todos os agentes de profundidade 1 e cascateia para seus filhos de profundidade 2.
- `/subagents kill <id>` para um sub-agente específico e cascateia para seus filhos.
- `/subagents kill all` para todos os sub-agentes do solicitante e cascateia.

## Autenticação

A autenticação de sub-agente é resolvida pelo **id do agente**, não pelo tipo de sessão:

- A chave de sessão do sub-agente é `agent:<agentId>:subagent:<uuid>`.
- O armazém de autenticação é carregado do `agentDir` daquele agente.
- Os perfis de autenticação do agente principal são mesclados como um **fallback**; perfis de agente sobrescrevem perfis principais em conflitos.

Nota: a mesclagem é aditiva, então perfis principais estão sempre disponíveis como fallbacks. Autenticação totalmente isolada por agente ainda não é suportada.

## Anúncio

Sub-agentes reportam de volta via uma etapa de anúncio:

- A etapa de anúncio roda dentro da sessão do sub-agente (não da sessão solicitante).
- Se o sub-agente responder exatamente `ANNOUNCE_SKIP`, nada é postado.
- Caso contrário, a entrega depende da profundidade do solicitante:
  - sessões solicitantes de nível superior usam uma chamada `agent` de seguimento com entrega externa (`deliver=true`)
  - sessões de sub-agente solicitante aninhadas recebem uma injeção de seguimento interna (`deliver=false`) para que o orquestrador possa sintetizar resultados filhos em-sessão
  - se uma sessão de sub-agente solicitante aninhada desaparecer, o OpenCraft cai para o solicitante daquela sessão quando disponível
- A agregação de conclusão de filhos tem escopo para a execução solicitante atual ao construir descobertas de conclusão aninhadas, evitando que saídas de filhos de execuções anteriores vazem para o anúncio atual.
- Respostas de anúncio preservam roteamento de thread/tópico quando disponível nos adaptadores de canal.
- Contexto de anúncio é normalizado para um bloco de evento interno estável:
  - source (`subagent` ou `cron`)
  - chave/id de sessão filho
  - tipo de anúncio + rótulo de tarefa
  - linha de status derivada do resultado do runtime (`success`, `error`, `timeout` ou `unknown`)
  - conteúdo do resultado da etapa de anúncio (ou `(no output)` se ausente)
  - uma instrução de seguimento descrevendo quando responder vs. ficar em silêncio
- `Status` não é inferido da saída do modelo; vem de sinais de resultado do runtime.

Payloads de anúncio incluem uma linha de estatísticas no final (mesmo quando encapsulados):

- Runtime (ex.: `runtime 5m12s`)
- Uso de tokens (entrada/saída/total)
- Custo estimado quando precificação de modelo está configurada (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` e caminho do transcript (para que o agente principal possa buscar histórico via `sessions_history` ou inspecionar o arquivo em disco)
- Metadados internos são destinados apenas para orquestração; respostas voltadas ao usuário devem ser reescritas na voz normal do assistente.

## Política de Tools (tools de sub-agente)

Por padrão, sub-agentes recebem **todas as tools exceto tools de sessão** e tools do sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Quando `maxSpawnDepth >= 2`, sub-agentes orquestradores de profundidade 1 adicionalmente recebem `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` para que possam gerenciar seus filhos.

Override via config:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny vence
        deny: ["gateway", "cron"],
        // se allow estiver definido, torna-se allow-only (deny ainda vence)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concorrência

Sub-agentes usam uma lane de fila in-process dedicada:

- Nome da lane: `subagent`
- Concorrência: `agents.defaults.subagents.maxConcurrent` (padrão `8`)

## Parada

- Enviar `/stop` no chat solicitante aborta a sessão solicitante e para quaisquer execuções de sub-agente ativas criadas a partir dela, cascateando para filhos aninhados.
- `/subagents kill <id>` para um sub-agente específico e cascateia para seus filhos.

## Limitações

- O anúncio de sub-agente é **best-effort**. Se o gateway reiniciar, trabalho pendente de "anunciar de volta" é perdido.
- Sub-agentes ainda compartilham os mesmos recursos de processo do gateway; trate `maxConcurrent` como uma válvula de segurança.
- `sessions_spawn` é sempre não-bloqueante: retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- Contexto de sub-agente injeta apenas `AGENTS.md` + `TOOLS.md` (sem `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ou `BOOTSTRAP.md`).
- Profundidade máxima de aninhamento é 5 (intervalo `maxSpawnDepth`: 1–5). Profundidade 2 é recomendada para a maioria dos casos de uso.
- `maxChildrenPerAgent` limita filhos ativos por sessão (padrão: 5, intervalo: 1–20).
