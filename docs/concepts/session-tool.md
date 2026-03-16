---
summary: "Ferramentas de sessão do agente para listar sessões, buscar histórico e enviar mensagens entre sessões"
read_when:
  - Adicionando ou modificando ferramentas de sessão
title: "Ferramentas de Sessão"
---

# Ferramentas de Sessão

Objetivo: conjunto de ferramentas pequeno e difícil de usar incorretamente para que agentes possam listar sessões, buscar histórico e enviar para outra sessão.

## Nomes das Ferramentas

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

## Modelo de Chave

- O bucket de chat direto principal é sempre a chave literal `"main"` (resolvida para a chave principal do agente atual).
- Chats em grupo usam `agent:<agentId>:<channel>:group:<id>` ou `agent:<agentId>:<channel>:channel:<id>` (passe a chave completa).
- Jobs cron usam `cron:<job.id>`.
- Hooks usam `hook:<uuid>` a não ser que seja explicitamente definido.
- Sessões de node usam `node-<nodeId>` a não ser que seja explicitamente definido.

`global` e `unknown` são valores reservados e nunca são listados. Se `session.scope = "global"`, é alias para `main` em todas as ferramentas para que chamadores nunca vejam `global`.

## sessions_list

Lista sessões como um array de linhas.

Parâmetros:

- `kinds?: string[]` filtro: qualquer de `"main" | "group" | "cron" | "hook" | "node" | "other"`
- `limit?: number` max de linhas (padrão: padrão do servidor, limite ex.: 200)
- `activeMinutes?: number` apenas sessões atualizadas dentro de N minutos
- `messageLimit?: number` 0 = sem mensagens (padrão 0); >0 = incluir últimas N mensagens

Comportamento:

- `messageLimit > 0` busca `chat.history` por sessão e inclui as últimas N mensagens.
- Resultados de ferramentas são filtrados na saída de lista; use `sessions_history` para mensagens de ferramentas.
- Quando rodando em uma sessão de agente **em sandbox**, ferramentas de sessão padrão para **visibilidade somente de spawn** (veja abaixo).

Formato de linha (JSON):

- `key`: chave de sessão (string)
- `kind`: `main | group | cron | hook | node | other`
- `channel`: `whatsapp | telegram | discord | signal | imessage | webchat | internal | unknown`
- `displayName` (rótulo de exibição do grupo se disponível)
- `updatedAt` (ms)
- `sessionId`
- `model`, `contextTokens`, `totalTokens`
- `thinkingLevel`, `verboseLevel`, `systemSent`, `abortedLastRun`
- `sendPolicy` (override de sessão se definido)
- `lastChannel`, `lastTo`
- `deliveryContext` (normalizado `{ channel, to, accountId }` quando disponível)
- `transcriptPath` (caminho de melhor esforço derivado do diretório da store + sessionId)
- `messages?` (apenas quando `messageLimit > 0`)

## sessions_history

Busca transcrição de uma sessão.

Parâmetros:

- `sessionKey` (obrigatório; aceita chave de sessão ou `sessionId` de `sessions_list`)
- `limit?: number` max de mensagens (servidor limita)
- `includeTools?: boolean` (padrão false)

Comportamento:

- `includeTools=false` filtra mensagens `role: "toolResult"`.
- Retorna array de mensagens no formato bruto de transcrição.
- Quando dado um `sessionId`, o OpenCraft o resolve para a chave de sessão correspondente (ids ausentes resultam em erro).

## sessions_send

Envia uma mensagem para outra sessão.

Parâmetros:

- `sessionKey` (obrigatório; aceita chave de sessão ou `sessionId` de `sessions_list`)
- `message` (obrigatório)
- `timeoutSeconds?: number` (padrão >0; 0 = fire-and-forget)

Comportamento:

- `timeoutSeconds = 0`: enfileirar e retornar `{ runId, status: "accepted" }`.
- `timeoutSeconds > 0`: aguardar até N segundos pela conclusão, depois retornar `{ runId, status: "ok", reply }`.
- Se a espera expirar: `{ runId, status: "timeout", error }`. A execução continua; chame `sessions_history` depois.
- Se a execução falhar: `{ runId, status: "error", error }`.
- A execução de announce de entrega roda após a execução primária ser concluída e é de melhor esforço; `status: "ok"` não garante que o announce foi entregue.
- Aguarda via gateway `agent.wait` (server-side) para que reconexões não percam a espera.
- O contexto de mensagem agente-para-agente é injetado para a execução primária.
- Mensagens entre sessões são persistidas com `message.provenance.kind = "inter_session"` para que leitores de transcrição possam distinguir instruções de agente roteadas de entrada de usuário externo.
- Após a conclusão da execução primária, o OpenCraft roda um **loop de reply-back**:
  - Rodada 2+ alterna entre agentes solicitante e alvo.
  - Responda exatamente `REPLY_SKIP` para parar o ping-pong.
  - O max de turnos é `session.agentToAgent.maxPingPongTurns` (0-5, padrão 5).
- Uma vez que o loop termina, o OpenCraft roda o **passo de announce agente-para-agente** (apenas agente alvo):
  - Responda exatamente `ANNOUNCE_SKIP` para ficar silencioso.
  - Qualquer outra resposta é enviada para o canal alvo.
  - O passo de announce inclui a requisição original + resposta da rodada 1 + última resposta de ping-pong.

## Campo Channel

- Para grupos, `channel` é o canal registrado na entrada de sessão.
- Para chats diretos, `channel` mapeia de `lastChannel`.
- Para cron/hook/node, `channel` é `internal`.
- Se ausente, `channel` é `unknown`.

## Segurança / Política de Envio

Bloqueio baseado em política por canal/tipo de chat (não por id de sessão).

```json
{
  "session": {
    "sendPolicy": {
      "rules": [
        {
          "match": { "channel": "discord", "chatType": "group" },
          "action": "deny"
        }
      ],
      "default": "allow"
    }
  }
}
```

Override de runtime (por entrada de sessão):

- `sendPolicy: "allow" | "deny"` (não definido = herdar config)
- Configurável via `sessions.patch` ou `/send on|off|inherit` apenas do proprietário (mensagem standalone).

Pontos de aplicação:

- `chat.send` / `agent` (gateway)
- lógica de entrega de auto-resposta

## sessions_spawn

Spawna uma execução de sub-agente em uma sessão isolada e anuncia o resultado de volta para o canal de chat solicitante.

Parâmetros:

- `task` (obrigatório)
- `label?` (opcional; usado para logs/UI)
- `agentId?` (opcional; spawnar sob outro id de agente se permitido)
- `model?` (opcional; sobrescreve o modelo do sub-agente; valores inválidos resultam em erro)
- `thinking?` (opcional; sobrescreve o nível de thinking para a execução do sub-agente)
- `runTimeoutSeconds?` (padrão para `agents.defaults.subagents.runTimeoutSeconds` quando definido, caso contrário `0`; quando definido, aborta a execução do sub-agente após N segundos)
- `thread?` (padrão false; solicitar roteamento vinculado a thread para este spawn quando suportado pelo canal/plugin)
- `mode?` (`run|session`; padrão `run`, mas padrão `session` quando `thread=true`; `mode="session"` requer `thread=true`)
- `cleanup?` (`delete|keep`, padrão `keep`)
- `sandbox?` (`inherit|require`, padrão `inherit`; `require` rejeita spawn a não ser que o runtime filho alvo esteja em sandbox)
- `attachments?` (array opcional de arquivos inline; apenas runtime subagente, ACP rejeita). Cada entrada: `{ name, content, encoding?: "utf8" | "base64", mimeType? }`. Arquivos são materializados no workspace filho em `.openclaw/attachments/<uuid>/`. Retorna um recibo com sha256 por arquivo.
- `attachAs?` (opcional; hint `{ mountPath? }` reservado para implementações de mount futuras)

Allowlist:

- `agents.list[].subagents.allowAgents`: lista de ids de agente permitidos via `agentId` (`["*"]` para permitir qualquer). Padrão: apenas o agente solicitante.
- Guarda de herança de sandbox: se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita alvos que rodariam sem sandbox.

Descoberta:

- Use `agents_list` para descobrir quais ids de agente são permitidos para `sessions_spawn`.

Comportamento:

- Inicia uma nova sessão `agent:<agentId>:subagent:<uuid>` com `deliver: false`.
- Sub-agentes padrão para o conjunto completo de ferramentas **menos ferramentas de sessão** (configurável via `tools.subagents.tools`).
- Sub-agentes não têm permissão de chamar `sessions_spawn` (sem spawning sub-agente → sub-agente).
- Sempre não-bloqueante: retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- Com `thread=true`, plugins de canal podem vincular entrega/roteamento a um alvo de thread (o suporte Discord é controlado por `session.threadBindings.*` e `channels.discord.threadBindings.*`).
- Após a conclusão, o OpenCraft roda um **passo de announce** do sub-agente e posta o resultado no canal de chat solicitante.
  - Se a resposta final do assistente estiver vazia, o `toolResult` mais recente do histórico do sub-agente é incluído como `Result`.
- Responda exatamente `ANNOUNCE_SKIP` durante o passo de announce para ficar silencioso.
- Respostas de announce são normalizadas para `Status`/`Result`/`Notes`; `Status` vem do resultado de runtime (não texto do modelo).
- Sessões de sub-agente são auto-arquivadas após `agents.defaults.subagents.archiveAfterMinutes` (padrão: 60).
- Respostas de announce incluem uma linha de stats (runtime, tokens, sessionKey/sessionId, caminho de transcrição e custo opcional).

## Visibilidade de Sessão em Sandbox

Ferramentas de sessão podem ser escopadas para reduzir acesso entre sessões.

Comportamento padrão:

- `tools.sessions.visibility` padrão é `tree` (sessão atual + sessões de sub-agente spawnadas).
- Para sessões em sandbox, `agents.defaults.sandbox.sessionToolsVisibility` pode limitar a visibilidade.

Config:

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      // padrão: "tree"
      visibility: "tree",
    },
  },
  agents: {
    defaults: {
      sandbox: {
        // padrão: "spawned"
        sessionToolsVisibility: "spawned", // ou "all"
      },
    },
  },
}
```

Notas:

- `self`: apenas a chave de sessão atual.
- `tree`: sessão atual + sessões spawnadas pela sessão atual.
- `agent`: qualquer sessão pertencente ao id de agente atual.
- `all`: qualquer sessão (acesso entre agentes ainda requer `tools.agentToAgent`).
- Quando uma sessão está em sandbox e `sessionToolsVisibility="spawned"`, o OpenCraft limita a visibilidade a `tree` mesmo que você defina `tools.sessions.visibility="all"`.
