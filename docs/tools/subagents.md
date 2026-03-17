---
summary: "Sub-agents: gerando execuções isoladas de agente que anunciam resultados de volta ao chat solicitante"
read_when:
  - Você quer trabalho em segundo plano/paralelo via agente
  - Você está alterando sessions_spawn ou política de ferramenta de subagent
  - Você está implementando ou solucionando problemas de sessões de subagent vinculadas a thread
title: "Sub-Agents"
---

# Sub-agents

Sub-agents são execuções de agente em segundo plano geradas a partir de uma execução de agente existente. Eles rodam em sua própria sessão (`agent:<agentId>:subagent:<uuid>`) e, quando terminam, **anunciam** seu resultado de volta ao canal de chat solicitante.

## Slash command

Use `/subagents` para inspecionar ou controlar execuções de subagent para a **sessão atual**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Controles de vínculo de thread:

Esses comandos funcionam em canais que suportam vínculos persistentes de thread. Veja **Canais com suporte a threads** abaixo.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` mostra metadados da execução (status, timestamps, id da sessão, caminho da transcrição, limpeza).

### Comportamento de spawn

`/subagents spawn` inicia um subagent em segundo plano como comando de usuário, não um relay interno, e envia uma atualização final de conclusão de volta ao chat solicitante quando a execução termina.

- O comando spawn é não-bloqueante; retorna um id de execução imediatamente.
- Na conclusão, o subagent anuncia uma mensagem de resumo/resultado de volta ao canal de chat solicitante.
- Para spawns manuais, a entrega é resiliente:
  - O OpenCraft tenta entrega direta `agent` primeiro com uma chave de idempotência estável.
  - Se a entrega direta falhar, recorre ao roteamento por fila.
  - Se o roteamento por fila ainda não estiver disponível, o anúncio é retentado com backoff exponencial curto antes de desistir.
- O handoff de conclusão para a sessão solicitante é contexto interno gerado pelo runtime (não texto de autoria do usuário) e inclui:
  - `Result` (texto de resposta do `assistant`, ou último `toolResult` se a resposta do assistente estiver vazia)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - estatísticas compactas de runtime/Token
  - uma instrução de entrega dizendo ao agente solicitante para reescrever em voz normal de assistente (não encaminhar metadados internos brutos)
- `--model` e `--thinking` substituem padrões para aquela execução específica.
- Use `info`/`log` para inspecionar detalhes e saída após conclusão.
- `/subagents spawn` é modo único (`mode: "run"`). Para sessões persistentes vinculadas a thread, use `sessions_spawn` com `thread: true` e `mode: "session"`.
- Para sessões de harness ACP (Codex, Claude Code, Gemini CLI), use `sessions_spawn` com `runtime: "acp"` e veja [ACP Agents](/tools/acp-agents).

Objetivos principais:

- Paralelizar trabalho de "pesquisa / tarefa longa / ferramenta lenta" sem bloquear a execução principal.
- Manter sub-agents isolados por padrão (separação de sessão + sandbox opcional).
- Manter a superfície de ferramentas difícil de usar de forma incorreta: sub-agents **não** recebem ferramentas de sessão por padrão.
- Suportar profundidade de aninhamento configurável para padrões de orquestrador.

Nota de custo: cada subagent tem seu **próprio** contexto e uso de Token. Para tarefas pesadas ou repetitivas,
defina um modelo mais barato para sub-agents e mantenha seu agente principal em um modelo de maior qualidade.
Você pode configurar isso via `agents.defaults.subagents.model` ou substituições por agente.

## Ferramenta

Use `sessions_spawn`:

- Inicia uma execução de subagent (`deliver: false`, lane global: `subagent`)
- Depois executa uma etapa de anúncio e posta a resposta de anúncio no canal de chat solicitante
- Modelo padrão: herda do chamador a menos que você defina `agents.defaults.subagents.model` (ou por agente `agents.list[].subagents.model`); um `sessions_spawn.model` explícito ainda vence.
- Thinking padrão: herda do chamador a menos que você defina `agents.defaults.subagents.thinking` (ou por agente `agents.list[].subagents.thinking`); um `sessions_spawn.thinking` explícito ainda vence.
- Timeout padrão de execução: se `sessions_spawn.runTimeoutSeconds` for omitido, o OpenCraft usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário recorre a `0` (sem timeout).

Parâmetros da ferramenta:

- `task` (obrigatório)
- `label?` (opcional)
- `agentId?` (opcional; gerar sob outro id de agente se permitido)
- `model?` (opcional; substitui o modelo do subagent; valores inválidos são pulados e o subagent roda no modelo padrão com um aviso no resultado da ferramenta)
- `thinking?` (opcional; substitui nível de thinking para a execução do subagent)
- `runTimeoutSeconds?` (padrão é `agents.defaults.subagents.runTimeoutSeconds` quando definido, caso contrário `0`; quando definido, a execução do subagent é abortada após N segundos)
- `thread?` (padrão `false`; quando `true`, solicita vínculo de thread do canal para esta sessão de subagent)
- `mode?` (`run|session`)
  - padrão é `run`
  - se `thread: true` e `mode` omitido, padrão se torna `session`
  - `mode: "session"` requer `thread: true`
- `cleanup?` (`delete|keep`, padrão `keep`)
- `sandbox?` (`inherit|require`, padrão `inherit`; `require` rejeita spawn a menos que o runtime filho alvo esteja em sandbox)
- `sessions_spawn` **não** aceita parâmetros de entrega de canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Para entrega, use `message`/`sessions_send` da execução gerada.

## Sessões vinculadas a thread

Quando vínculos de thread estão habilitados para um canal, um subagent pode permanecer vinculado a uma thread para que mensagens subsequentes do usuário naquela thread continuem sendo roteadas para a mesma sessão de subagent.

### Canais com suporte a threads

- Discord (atualmente o único canal suportado): suporta sessões persistentes de subagent vinculadas a thread (`sessions_spawn` com `thread: true`), controles manuais de thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), e chaves de adaptador `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` e `channels.discord.threadBindings.spawnSubagentSessions`.

Fluxo rápido:

1. Gere com `sessions_spawn` usando `thread: true` (e opcionalmente `mode: "session"`).
2. O OpenCraft cria ou vincula uma thread àquele alvo de sessão no canal ativo.
3. Respostas e mensagens subsequentes naquela thread são roteadas para a sessão vinculada.
4. Use `/session idle` para inspecionar/atualizar auto-desvínculo por inatividade e `/session max-age` para controlar o limite rígido.
5. Use `/unfocus` para desvincular manualmente.

Controles manuais:

- `/focus <target>` vincula a thread atual (ou cria uma) a um alvo de subagent/sessão.
- `/unfocus` remove o vínculo da thread vinculada atual.
- `/agents` lista execuções ativas e estado de vínculo (`thread:<id>` ou `unbound`).
- `/session idle` e `/session max-age` funcionam apenas para threads vinculadas focadas.

Switches de config:

- Padrão global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Substituição de canal e chaves de auto-vínculo de spawn são específicas do adaptador. Veja **Canais com suporte a threads** acima.

Veja [Referência de Configuração](/gateway/configuration-reference) e [Slash commands](/tools/slash-commands) para detalhes atuais do adaptador.

Allowlist:

- `agents.list[].subagents.allowAgents`: lista de ids de agente que podem ser alvo via `agentId` (`["*"]` para permitir qualquer). Padrão: apenas o agente solicitante.
- Proteção de herança de sandbox: se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita alvos que rodariam sem sandbox.

Descoberta:

- Use `agents_list` para ver quais ids de agente são permitidos atualmente para `sessions_spawn`.

Auto-arquivamento:

- Sessões de subagent são automaticamente arquivadas após `agents.defaults.subagents.archiveAfterMinutes` (padrão: 60).
- Arquivamento usa `sessions.delete` e renomeia a transcrição para `*.deleted.<timestamp>` (mesma pasta).
- `cleanup: "delete"` arquiva imediatamente após anúncio (ainda mantém a transcrição via renomeação).
- Auto-arquivamento é melhor esforço; timers pendentes são perdidos se o Gateway reiniciar.
- `runTimeoutSeconds` **não** auto-arquiva; apenas para a execução. A sessão permanece até o auto-arquivamento.
- Auto-arquivamento se aplica igualmente a sessões de profundidade 1 e profundidade 2.

## Sub-Agents Aninhados

Por padrão, sub-agents não podem gerar seus próprios sub-agents (`maxSpawnDepth: 1`). Você pode habilitar um nível de aninhamento definindo `maxSpawnDepth: 2`, que permite o **padrão orquestrador**: principal -> subagent orquestrador -> sub-sub-agents trabalhadores.

### Como habilitar

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permitir sub-agents gerarem filhos (padrão: 1)
        maxChildrenPerAgent: 5, // máximo de filhos ativos por sessão de agente (padrão: 5)
        maxConcurrent: 8, // limite global de concorrência (padrão: 8)
        runTimeoutSeconds: 900, // timeout padrão para sessions_spawn quando omitido (0 = sem timeout)
      },
    },
  },
}
```

### Níveis de profundidade

| Profundidade | Formato da chave de sessão                   | Papel                                                   | Pode gerar?                    |
| ------------ | -------------------------------------------- | ------------------------------------------------------- | ------------------------------ |
| 0            | `agent:<id>:main`                            | Agente principal                                        | Sempre                         |
| 1            | `agent:<id>:subagent:<uuid>`                 | Subagent (orquestrador quando profundidade 2 permitida) | Apenas se `maxSpawnDepth >= 2` |
| 2            | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agente (trabalhador folha)                      | Nunca                          |

### Cadeia de anúncio

Resultados fluem de volta pela cadeia:

1. Trabalhador profundidade 2 termina -> anuncia para seu pai (orquestrador profundidade 1)
2. Orquestrador profundidade 1 recebe o anúncio, sintetiza resultados, termina -> anuncia para o principal
3. Agente principal recebe o anúncio e entrega ao usuário

Cada nível só vê anúncios de seus filhos diretos.

### Política de ferramenta por profundidade

- Papel e escopo de controle são escritos nos metadados da sessão no momento do spawn. Isso mantém chaves de sessão planas ou restauradas de reganharem acidentalmente privilégios de orquestrador.
- **Profundidade 1 (orquestrador, quando `maxSpawnDepth >= 2`)**: Recebe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gerenciar seus filhos. Outras ferramentas de sessão/sistema permanecem negadas.
- **Profundidade 1 (folha, quando `maxSpawnDepth == 1`)**: Sem ferramentas de sessão (comportamento padrão atual).
- **Profundidade 2 (trabalhador folha)**: Sem ferramentas de sessão -- `sessions_spawn` é sempre negado na profundidade 2. Não pode gerar mais filhos.

### Limite de spawn por agente

Cada sessão de agente (em qualquer profundidade) pode ter no máximo `maxChildrenPerAgent` (padrão: 5) filhos ativos por vez. Isso previne fan-out descontrolado de um único orquestrador.

### Parada em cascata

Parar um orquestrador profundidade 1 automaticamente para todos os seus filhos profundidade 2:

- `/stop` no chat principal para todos os agentes profundidade 1 e cascateia para seus filhos profundidade 2.
- `/subagents kill <id>` para um subagent específico e cascateia para seus filhos.
- `/subagents kill all` para todos os sub-agents do solicitante e cascateia.

## Autenticação

Autenticação de subagent é resolvida por **id de agente**, não por tipo de sessão:

- A chave de sessão do subagent é `agent:<agentId>:subagent:<uuid>`.
- O armazenamento de autenticação é carregado do `agentDir` daquele agente.
- Os perfis de autenticação do agente principal são mesclados como **fallback**; perfis do agente substituem perfis principais em conflitos.

Nota: a mesclagem é aditiva, então perfis principais sempre estão disponíveis como fallbacks. Autenticação totalmente isolada por agente ainda não é suportada.

## Anúncio

Sub-agents reportam de volta via uma etapa de anúncio:

- A etapa de anúncio roda dentro da sessão do subagent (não da sessão solicitante).
- Se o subagent responder exatamente `ANNOUNCE_SKIP`, nada é postado.
- Caso contrário, a entrega depende da profundidade do solicitante:
  - sessões solicitantes de nível superior usam uma chamada `agent` de acompanhamento com entrega externa (`deliver=true`)
  - sessões solicitantes de subagent aninhadas recebem uma injeção de acompanhamento interna (`deliver=false`) para que o orquestrador possa sintetizar resultados dos filhos na sessão
  - se uma sessão solicitante de subagent aninhada não existir mais, o OpenCraft recorre ao solicitante daquela sessão quando disponível
- Agregação de conclusão de filhos é escopada à execução atual do solicitante ao construir descobertas de conclusão aninhadas, prevenindo saídas obsoletas de filhos de execuções anteriores de vazar para o anúncio atual.
- Respostas de anúncio preservam roteamento de thread/tópico quando disponível em adaptadores de canal.
- Contexto de anúncio é normalizado para um bloco de evento interno estável:
  - fonte (`subagent` ou `cron`)
  - chave/id de sessão filho
  - tipo de anúncio + rótulo da tarefa
  - linha de status derivada do resultado do runtime (`success`, `error`, `timeout` ou `unknown`)
  - conteúdo do resultado da etapa de anúncio (ou `(no output)` se ausente)
  - uma instrução de acompanhamento descrevendo quando responder vs. ficar em silêncio
- `Status` não é inferido da saída do modelo; vem de sinais de resultado do runtime.

Payloads de anúncio incluem uma linha de estatísticas no final (mesmo quando encapsulados):

- Runtime (ex., `runtime 5m12s`)
- Uso de Token (entrada/saída/total)
- Custo estimado quando preço do modelo está configurado (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` e caminho da transcrição (para que o agente principal possa buscar histórico via `sessions_history` ou inspecionar o arquivo em disco)
- Metadados internos são destinados apenas à orquestração; respostas voltadas ao usuário devem ser reescritas em voz normal de assistente.

## Política de Ferramenta (ferramentas de subagent)

Por padrão, sub-agents recebem **todas as ferramentas exceto ferramentas de sessão** e ferramentas de sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Quando `maxSpawnDepth >= 2`, sub-agents orquestradores de profundidade 1 recebem adicionalmente `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` para poderem gerenciar seus filhos.

Substituir via config:

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
        // se allow for definido, torna-se apenas allow (deny ainda vence)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concorrência

Sub-agents usam uma lane dedicada de fila em processo:

- Nome da lane: `subagent`
- Concorrência: `agents.defaults.subagents.maxConcurrent` (padrão `8`)

## Parando

- Enviar `/stop` no chat solicitante aborta a sessão solicitante e para qualquer execução ativa de subagent gerada a partir dela, cascateando para filhos aninhados.
- `/subagents kill <id>` para um subagent específico e cascateia para seus filhos.

## Limitações

- Anúncio de subagent é **melhor esforço**. Se o Gateway reiniciar, trabalho de "anunciar de volta" pendente é perdido.
- Sub-agents ainda compartilham os mesmos recursos de processo do Gateway; trate `maxConcurrent` como uma válvula de segurança.
- `sessions_spawn` é sempre não-bloqueante: retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- Contexto de subagent injeta apenas `AGENTS.md` + `TOOLS.md` (sem `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ou `BOOTSTRAP.md`).
- Profundidade máxima de aninhamento é 5 (faixa de `maxSpawnDepth`: 1-5). Profundidade 2 é recomendada para a maioria dos casos de uso.
- `maxChildrenPerAgent` limita filhos ativos por sessão (padrão: 5, faixa: 1-20).
