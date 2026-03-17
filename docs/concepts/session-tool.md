---
summary: "Ferramentas de sessão do agente para listar sessões, buscar histórico e enviar mensagens entre sessões"
read_when:
  - Adicionando ou modificando ferramentas de sessão
title: "Session Tools"
---

# Ferramentas de Sessão

Objetivo: conjunto pequeno e difícil de usar incorretamente para que agentes possam listar sessões, buscar histórico e enviar mensagens para outra sessão.

## Nomes das Ferramentas

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

## Modelo de Chaves

- O bucket de chat direto principal é sempre a chave literal `"main"` (resolvida para a chave principal do agente atual).
- Chats em grupo usam `agent:<agentId>:<channel>:group:<id>` ou `agent:<agentId>:<channel>:channel:<id>` (passe a chave completa).
- Tarefas Cron usam `cron:<job.id>`.
- Hooks usam `hook:<uuid>` a menos que definido explicitamente.
- Sessões de nó usam `node-<nodeId>` a menos que definido explicitamente.

`global` e `unknown` são valores reservados e nunca são listados. Se `session.scope = "global"`, fazemos alias para `main` em todas as ferramentas para que os chamadores nunca vejam `global`.

## sessions_list

Lista sessões como um array de linhas.

Parâmetros:

- `kinds?: string[]` filtro: qualquer um de `"main" | "group" | "cron" | "hook" | "node" | "other"`
- `limit?: number` máximo de linhas (padrão: padrão do servidor, limitado ex. 200)
- `activeMinutes?: number` apenas sessões atualizadas nos últimos N minutos
- `messageLimit?: number` 0 = sem mensagens (padrão 0); >0 = incluir as últimas N mensagens

Comportamento:

- `messageLimit > 0` busca `chat.history` por sessão e inclui as últimas N mensagens.
- Resultados de ferramentas são filtrados na saída da lista; use `sessions_history` para mensagens de ferramentas.
- Quando executado em uma sessão de agente **sandboxed**, as ferramentas de sessão usam por padrão **visibilidade apenas de sessões geradas** (veja abaixo).

Formato da linha (JSON):

- `key`: chave da sessão (string)
- `kind`: `main | group | cron | hook | node | other`
- `channel`: `whatsapp | telegram | discord | signal | imessage | webchat | internal | unknown`
- `displayName` (rótulo de exibição do grupo, se disponível)
- `updatedAt` (ms)
- `sessionId`
- `model`, `contextTokens`, `totalTokens`
- `thinkingLevel`, `verboseLevel`, `systemSent`, `abortedLastRun`
- `sendPolicy` (override de sessão, se definido)
- `lastChannel`, `lastTo`
- `deliveryContext` (`{ channel, to, accountId }` normalizado, quando disponível)
- `transcriptPath` (caminho derivado por melhor esforço do diretório do store + sessionId)
- `messages?` (apenas quando `messageLimit > 0`)

## sessions_history

Busca a transcrição de uma sessão.

Parâmetros:

- `sessionKey` (obrigatório; aceita chave de sessão ou `sessionId` do `sessions_list`)
- `limit?: number` máximo de mensagens (limitado pelo servidor)
- `includeTools?: boolean` (padrão false)

Comportamento:

- `includeTools=false` filtra mensagens com `role: "toolResult"`.
- Retorna o array de mensagens no formato bruto da transcrição.
- Quando recebe um `sessionId`, o OpenCraft o resolve para a chave de sessão correspondente (ids ausentes geram erro).

## sessions_send

Envia uma mensagem para outra sessão.

Parâmetros:

- `sessionKey` (obrigatório; aceita chave de sessão ou `sessionId` do `sessions_list`)
- `message` (obrigatório)
- `timeoutSeconds?: number` (padrão >0; 0 = dispare e esqueça)

Comportamento:

- `timeoutSeconds = 0`: enfileira e retorna `{ runId, status: "accepted" }`.
- `timeoutSeconds > 0`: aguarda até N segundos pela conclusão, depois retorna `{ runId, status: "ok", reply }`.
- Se a espera expirar: `{ runId, status: "timeout", error }`. A execução continua; chame `sessions_history` depois.
- Se a execução falhar: `{ runId, status: "error", error }`.
- Execuções de anúncio de entrega rodam após a execução primária completar e são por melhor esforço; `status: "ok"` não garante que o anúncio foi entregue.
- Aguarda via `agent.wait` do Gateway (lado do servidor), então reconexões não descartam a espera.
- O contexto de mensagem agente-para-agente é injetado para a execução primária.
- Mensagens entre sessões são persistidas com `message.provenance.kind = "inter_session"` para que leitores da transcrição possam distinguir instruções de agentes roteadas de entrada de usuário externo.
- Após a execução primária completar, o OpenCraft executa um **loop de resposta**:
  - Rodada 2+ alterna entre os agentes solicitante e alvo.
  - Responda exatamente `REPLY_SKIP` para interromper o ping-pong.
  - Máximo de turnos é `session.agentToAgent.maxPingPongTurns` (0–5, padrão 5).
- Quando o loop termina, o OpenCraft executa a **etapa de anúncio agente-para-agente** (apenas agente alvo):
  - Responda exatamente `ANNOUNCE_SKIP` para ficar em silêncio.
  - Qualquer outra resposta é enviada para o canal alvo.
  - A etapa de anúncio inclui a requisição original + resposta da rodada 1 + última resposta do ping-pong.

## Campo Channel

- Para grupos, `channel` é o canal registrado na entrada da sessão.
- Para chats diretos, `channel` é mapeado a partir de `lastChannel`.
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

Override em tempo de execução (por entrada de sessão):

- `sendPolicy: "allow" | "deny"` (não definido = herdar configuração)
- Configurável via `sessions.patch` ou `/send on|off|inherit` (mensagem autônoma, apenas proprietário).

Pontos de aplicação:

- `chat.send` / `agent` (Gateway)
- Lógica de entrega de auto-resposta

## sessions_spawn

Gera uma execução de sub-agente em uma sessão isolada e anuncia o resultado de volta ao canal de chat do solicitante.

Parâmetros:

- `task` (obrigatório)
- `label?` (opcional; usado para logs/UI)
- `agentId?` (opcional; gerar sob outro id de agente, se permitido)
- `model?` (opcional; sobrescreve o modelo do sub-agente; valores inválidos geram erro)
- `thinking?` (opcional; sobrescreve o nível de thinking para a execução do sub-agente)
- `runTimeoutSeconds?` (usa `agents.defaults.subagents.runTimeoutSeconds` quando definido, caso contrário `0`; quando definido, aborta a execução do sub-agente após N segundos)
- `thread?` (padrão false; solicita roteamento vinculado a thread para este spawn quando suportado pelo canal/Plugin)
- `mode?` (`run|session`; padrão `run`, mas usa `session` quando `thread=true`; `mode="session"` requer `thread=true`)
- `cleanup?` (`delete|keep`, padrão `keep`)
- `sandbox?` (`inherit|require`, padrão `inherit`; `require` rejeita spawn a menos que o runtime filho alvo seja sandboxed)
- `attachments?` (array opcional de arquivos inline; apenas runtime de sub-agente, ACP rejeita). Cada entrada: `{ name, content, encoding?: "utf8" | "base64", mimeType? }`. Arquivos são materializados no workspace filho em `.opencraft/attachments/<uuid>/`. Retorna um recibo com sha256 por arquivo.
- `attachAs?` (opcional; dica `{ mountPath? }` reservada para futuras implementações de montagem)

Lista de permissão:

- `agents.list[].subagents.allowAgents`: lista de ids de agente permitidos via `agentId` (`["*"]` para permitir qualquer um). Padrão: apenas o agente solicitante.
- Proteção de herança de sandbox: se a sessão solicitante for sandboxed, `sessions_spawn` rejeita alvos que executariam sem sandbox.

Descoberta:

- Use `agents_list` para descobrir quais ids de agente são permitidos para `sessions_spawn`.

Comportamento:

- Inicia uma nova sessão `agent:<agentId>:subagent:<uuid>` com `deliver: false`.
- Sub-agentes usam por padrão o conjunto completo de ferramentas **menos ferramentas de sessão** (configurável via `tools.subagents.tools`).
- Sub-agentes não podem chamar `sessions_spawn` (sem geração de sub-agente a partir de sub-agente).
- Sempre não-bloqueante: retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- Com `thread=true`, Plugin de canal podem vincular entrega/roteamento a um alvo de thread (suporte ao Discord é controlado por `session.threadBindings.*` e `channels.discord.threadBindings.*`).
- Após a conclusão, o OpenCraft executa uma **etapa de anúncio** do sub-agente e publica o resultado no canal de chat do solicitante.
  - Se a resposta final do assistente estiver vazia, o último `toolResult` do histórico do sub-agente é incluído como `Result`.
- Responda exatamente `ANNOUNCE_SKIP` durante a etapa de anúncio para ficar em silêncio.
- Respostas de anúncio são normalizadas para `Status`/`Result`/`Notes`; `Status` vem do resultado do runtime (não do texto do modelo).
- Sessões de sub-agente são auto-arquivadas após `agents.defaults.subagents.archiveAfterMinutes` (padrão: 60).
- Respostas de anúncio incluem uma linha de estatísticas (runtime, Token, sessionKey/sessionId, caminho da transcrição e custo opcional).

## Visibilidade de Sessão Sandbox

Ferramentas de sessão podem ter escopo reduzido para limitar acesso entre sessões.

Comportamento padrão:

- `tools.sessions.visibility` usa `tree` como padrão (sessão atual + sessões de sub-agentes geradas).
- Para sessões sandboxed, `agents.defaults.sandbox.sessionToolsVisibility` pode limitar rigidamente a visibilidade.

Configuração:

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

- `self`: apenas a chave da sessão atual.
- `tree`: sessão atual + sessões geradas pela sessão atual.
- `agent`: qualquer sessão pertencente ao id de agente atual.
- `all`: qualquer sessão (acesso entre agentes ainda requer `tools.agentToAgent`).
- Quando uma sessão é sandboxed e `sessionToolsVisibility="spawned"`, o OpenCraft limita a visibilidade para `tree` mesmo que você defina `tools.sessions.visibility="all"`.
