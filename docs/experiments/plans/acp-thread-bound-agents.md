---
summary: "Integrar agentes de codificação ACP via um plano de controle ACP de primeira classe no core e runtimes baseados em Plugin (acpx primeiro)"
owner: "onutc"
status: "draft"
last_updated: "2026-02-25"
title: "ACP Thread Bound Agents"
---

# Agentes ACP Vinculados a Threads

## Visão Geral

Este plano define como o OpenCraft deve suportar agentes de codificação ACP em canais com capacidade de thread (Discord primeiro) com ciclo de vida e recuperação em nível de produção.

Documento relacionado:

- [Plano de Refatoração Unificada de Streaming de Runtime](/experiments/plans/acp-unified-streaming-refactor)

Experiência alvo do usuário:

- um usuário cria ou foca uma sessão ACP em uma thread
- mensagens do usuário naquela thread são roteadas para a sessão ACP vinculada
- a saída do agente é transmitida de volta para a mesma persona da thread
- a sessão pode ser persistente ou única com controles explícitos de limpeza

## Resumo de decisões

Recomendação de longo prazo é uma arquitetura híbrida:

- O core do OpenCraft é dono das preocupações do plano de controle ACP
  - identidade de sessão e metadados
  - vinculação de thread e decisões de roteamento
  - invariantes de entrega e supressão de duplicatas
  - semânticas de limpeza e recuperação de ciclo de vida
- O backend de runtime ACP é plugável
  - primeiro backend é um serviço Plugin baseado em acpx
  - runtime faz transporte ACP, enfileiramento, cancelamento, reconexão

O OpenCraft não deve reimplementar internos de transporte ACP no core.
O OpenCraft não deve depender de um caminho de interceptação somente por Plugin para roteamento.

## Arquitetura norte-estrela (holy grail)

Tratar ACP como um plano de controle de primeira classe no OpenCraft, com adaptadores de runtime plugáveis.

Invariantes não negociáveis:

- toda vinculação de thread ACP referencia um registro de sessão ACP válido
- toda sessão ACP tem estado de ciclo de vida explícito (`creating`, `idle`, `running`, `cancelling`, `closed`, `error`)
- toda execução ACP tem estado de execução explícito (`queued`, `running`, `completed`, `failed`, `cancelled`)
- criação, vinculação e enfileiramento inicial são atômicos
- retentativas de comando são idempotentes (sem execuções duplicadas ou saídas duplicadas no Discord)
- a saída do canal de thread vinculada é uma projeção de eventos de execução ACP, nunca efeitos colaterais ad-hoc

Modelo de propriedade de longo prazo:

- `AcpSessionManager` é o único escritor e orquestrador ACP
- o manager vive no processo do Gateway primeiro; pode ser movido para um sidecar dedicado depois atrás da mesma interface
- por chave de sessão ACP, o manager possui um ator em memória (execução de comando serializada)
- adaptadores (`acpx`, backends futuros) são implementações somente de transporte/runtime

Modelo de persistência de longo prazo:

- mover estado do plano de controle ACP para um armazenamento SQLite dedicado (modo WAL) sob o diretório de estado do OpenCraft
- manter `SessionEntry.acp` como projeção de compatibilidade durante a migração, não fonte da verdade
- armazenar eventos ACP em modo somente-adição para suportar replay, recuperação de crash e entrega determinística

### Estratégia de entrega (ponte para holy-grail)

- ponte de curto prazo
  - manter mecânicas atuais de vinculação de thread e superfície de configuração ACP existente
  - corrigir bugs de gap de metadados e rotear rodadas ACP através de um único branch ACP no core
  - adicionar chaves de idempotência e verificações de roteamento fail-closed imediatamente
- cutover de longo prazo
  - mover fonte da verdade ACP para DB do plano de controle + atores
  - tornar entrega de thread vinculada puramente baseada em projeção de eventos
  - remover comportamento de fallback legado que depende de metadados oportunísticos de entrada de sessão

## Por que não somente Plugin

Hooks de Plugin atuais não são suficientes para roteamento de sessão ACP ponta a ponta sem mudanças no core.

- roteamento de entrada de vinculação de thread resolve para uma chave de sessão no dispatch do core primeiro
- hooks de mensagem são fire-and-forget e não podem curto-circuitar o caminho de resposta principal
- comandos de Plugin são bons para operações de controle mas não para substituir o fluxo de dispatch por turno do core

Resultado:

- Runtime ACP pode ser pluginizado
- Branch de roteamento ACP deve existir no core

## Fundação existente para reusar

Já implementado e deve permanecer canônico:

- alvo de vinculação de thread suporta `subagent` e `acp`
- sobrescrita de roteamento de entrada de thread resolve por vinculação antes do dispatch normal
- identidade de thread de saída via Webhook na entrega de resposta
- fluxo `/focus` e `/unfocus` com compatibilidade de alvo ACP
- armazenamento de vinculação persistente com restauração na inicialização
- ciclo de vida de desvinculação em archive, delete, unfocus, reset e delete

Este plano estende essa fundação em vez de substituí-la.

## Arquitetura

### Modelo de fronteira

Core (deve estar no core do OpenCraft):

- Branch de dispatch de modo sessão ACP no pipeline de resposta
- arbitragem de entrega para evitar duplicação pai + thread
- persistência do plano de controle ACP (com projeção de compatibilidade `SessionEntry.acp` durante migração)
- semânticas de desvinculação e desconexão de runtime ligadas a reset/delete de sessão

Backend Plugin (implementação acpx):

- supervisão de worker de runtime ACP
- invocação de processo acpx e parsing de eventos
- handlers de comando ACP (`/acp ...`) e UX de operador
- padrões de configuração específicos do backend e diagnósticos

### Modelo de propriedade de runtime

- um processo Gateway é dono do estado de orquestração ACP
- execução ACP roda em processos filhos supervisionados via backend acpx
- estratégia de processo é longa vida por chave de sessão ACP ativa, não por mensagem

Isso evita custo de inicialização em cada prompt e mantém semânticas de cancelamento e reconexão confiáveis.

### Contrato de runtime core

Adicionar um contrato de runtime ACP no core para que código de roteamento não dependa de detalhes de CLI e possa trocar backends sem mudar lógica de dispatch:

```ts
export type AcpRuntimePromptMode = "prompt" | "steer";

export type AcpRuntimeHandle = {
  sessionKey: string;
  backend: string;
  runtimeSessionName: string;
};

export type AcpRuntimeEvent =
  | { type: "text_delta"; stream: "output" | "thought"; text: string }
  | { type: "tool_call"; name: string; argumentsText: string }
  | { type: "done"; usage?: Record<string, number> }
  | { type: "error"; code: string; message: string; retryable?: boolean };

export interface AcpRuntime {
  ensureSession(input: {
    sessionKey: string;
    agent: string;
    mode: "persistent" | "oneshot";
    cwd?: string;
    env?: Record<string, string>;
    idempotencyKey: string;
  }): Promise<AcpRuntimeHandle>;

  submit(input: {
    handle: AcpRuntimeHandle;
    text: string;
    mode: AcpRuntimePromptMode;
    idempotencyKey: string;
  }): Promise<{ runtimeRunId: string }>;

  stream(input: {
    handle: AcpRuntimeHandle;
    runtimeRunId: string;
    onEvent: (event: AcpRuntimeEvent) => Promise<void> | void;
    signal?: AbortSignal;
  }): Promise<void>;

  cancel(input: {
    handle: AcpRuntimeHandle;
    runtimeRunId?: string;
    reason?: string;
    idempotencyKey: string;
  }): Promise<void>;

  close(input: { handle: AcpRuntimeHandle; reason: string; idempotencyKey: string }): Promise<void>;

  health?(): Promise<{ ok: boolean; details?: string }>;
}
```

Detalhe de implementação:

- primeiro backend: `AcpxRuntime` enviado como serviço Plugin
- core resolve runtime via registro e falha com erro explícito de operador quando nenhum backend de runtime ACP está disponível

### Modelo de dados e persistência do plano de controle

Fonte da verdade de longo prazo é um banco de dados SQLite ACP dedicado (modo WAL), para atualizações transacionais e recuperação segura de crash:

- `acp_sessions`
  - `session_key` (pk), `backend`, `agent`, `mode`, `cwd`, `state`, `created_at`, `updated_at`, `last_error`
- `acp_runs`
  - `run_id` (pk), `session_key` (fk), `state`, `requester_message_id`, `idempotency_key`, `started_at`, `ended_at`, `error_code`, `error_message`
- `acp_bindings`
  - `binding_key` (pk), `thread_id`, `channel_id`, `account_id`, `session_key` (fk), `expires_at`, `bound_at`
- `acp_events`
  - `event_id` (pk), `run_id` (fk), `seq`, `kind`, `payload_json`, `created_at`
- `acp_delivery_checkpoint`
  - `run_id` (pk/fk), `last_event_seq`, `last_discord_message_id`, `updated_at`
- `acp_idempotency`
  - `scope`, `idempotency_key`, `result_json`, `created_at`, unique `(scope, idempotency_key)`

```ts
export type AcpSessionMeta = {
  backend: string;
  agent: string;
  runtimeSessionName: string;
  mode: "persistent" | "oneshot";
  cwd?: string;
  state: "idle" | "running" | "error";
  lastActivityAt: number;
  lastError?: string;
};
```

Regras de armazenamento:

- manter `SessionEntry.acp` como projeção de compatibilidade durante migração
- IDs de processo e sockets ficam somente em memória
- ciclo de vida durável e status de execução ficam no DB ACP, não em JSON de sessão genérico
- se o dono do runtime morrer, o Gateway reidrata do DB ACP e retoma dos checkpoints

### Roteamento e entrega

Entrada:

- manter busca de vinculação de thread atual como primeiro passo de roteamento
- se alvo vinculado é sessão ACP, rotear para branch de runtime ACP em vez de `getReplyFromConfig`
- comando explícito `/acp steer` usa `mode: "steer"`

Saída:

- fluxo de eventos ACP é normalizado para chunks de resposta do OpenCraft
- alvo de entrega é resolvido através do caminho existente de destino vinculado
- quando uma thread vinculada está ativa para aquele turno de sessão, conclusão do canal pai é suprimida

Política de streaming:

- transmitir saída parcial com janela de coalescência
- intervalo mínimo configurável e bytes máximos por chunk para ficar dentro dos limites de taxa do Discord
- mensagem final sempre emitida na conclusão ou falha

### Máquinas de estado e fronteiras de transação

Máquina de estado de sessão:

- `creating -> idle -> running -> idle`
- `running -> cancelling -> idle | error`
- `idle -> closed`
- `error -> idle | closed`

Máquina de estado de execução:

- `queued -> running -> completed`
- `running -> failed | cancelled`
- `queued -> cancelled`

Fronteiras de transação obrigatórias:

- transação de criação
  - criar linha de sessão ACP
  - criar/atualizar linha de vinculação de thread ACP
  - enfileirar linha de execução inicial
- transação de fechamento
  - marcar sessão como fechada
  - deletar/expirar linhas de vinculação
  - escrever evento final de fechamento
- transação de cancelamento
  - marcar execução alvo como cancelling/cancelled com chave de idempotência

Nenhum sucesso parcial é permitido nessas fronteiras.

### Modelo de ator por sessão

`AcpSessionManager` executa um ator por chave de sessão ACP:

- caixa de correio do ator serializa efeitos colaterais de `submit`, `cancel`, `close` e `stream`
- ator é dono da hidratação do handle de runtime e do ciclo de vida do processo do adaptador de runtime para aquela sessão
- ator escreve eventos de execução em ordem (`seq`) antes de qualquer entrega Discord
- ator atualiza checkpoints de entrega após envio de saída bem-sucedido

Isso remove corridas entre turnos e previne saída de thread duplicada ou fora de ordem.

### Idempotência e projeção de entrega

Todas as ações ACP externas devem carregar chaves de idempotência:

- chave de idempotência de criação
- chave de idempotência de prompt/steer
- chave de idempotência de cancelamento
- chave de idempotência de fechamento

Regras de entrega:

- mensagens Discord são derivadas de `acp_events` mais `acp_delivery_checkpoint`
- retentativas retomam do checkpoint sem re-enviar chunks já entregues
- emissão de resposta final é exatamente uma vez por execução da lógica de projeção

### Recuperação e auto-cura

Na inicialização do Gateway:

- carregar sessões ACP não terminais (`creating`, `idle`, `running`, `cancelling`, `error`)
- recriar atores preguiçosamente no primeiro evento de entrada ou avidamente sob limite configurado
- reconciliar quaisquer execuções `running` sem heartbeats e marcar `failed` ou recuperar via adaptador

Em mensagem de thread Discord de entrada:

- se vinculação existe mas sessão ACP está ausente, falhar fechado com mensagem explícita de vinculação obsoleta
- opcionalmente auto-desvincular vinculação obsoleta após validação segura do operador
- nunca rotear silenciosamente vinculações ACP obsoletas para caminho LLM normal

### Ciclo de vida e segurança

Operações suportadas:

- cancelar execução atual: `/acp cancel`
- desvincular thread: `/unfocus`
- fechar sessão ACP: `/acp close`
- auto fechar sessões ociosas por TTL efetivo

Política de TTL:

- TTL efetivo é o mínimo de
  - TTL global/sessão
  - TTL de vinculação de thread Discord
  - TTL do dono de runtime ACP

Controles de segurança:

- lista de permissão de agentes ACP por nome
- restringir raízes de workspace para sessões ACP
- passthrough de lista de permissão de env
- máximo de sessões ACP concorrentes por conta e globalmente
- backoff limitado de reinicialização para crashes de runtime

## Superfície de configuração

Chaves do core:

- `acp.enabled`
- `acp.dispatch.enabled` (kill switch independente de roteamento ACP)
- `acp.backend` (padrão `acpx`)
- `acp.defaultAgent`
- `acp.allowedAgents[]`
- `acp.maxConcurrentSessions`
- `acp.stream.coalesceIdleMs`
- `acp.stream.maxChunkChars`
- `acp.runtime.ttlMinutes`
- `acp.controlPlane.store` (padrão `sqlite`)
- `acp.controlPlane.storePath`
- `acp.controlPlane.recovery.eagerActors`
- `acp.controlPlane.recovery.reconcileRunningAfterMs`
- `acp.controlPlane.checkpoint.flushEveryEvents`
- `acp.controlPlane.checkpoint.flushEveryMs`
- `acp.idempotency.ttlHours`
- `channels.discord.threadBindings.spawnAcpSessions`

Chaves de Plugin/backend (seção do Plugin acpx):

- sobrescritas de comando/caminho do backend
- lista de permissão de env do backend
- presets por agente do backend
- timeouts de inicialização/parada do backend
- máximo de execuções em voo por sessão do backend

## Especificação de implementação

### Módulos do plano de controle (novos)

Adicionar módulos dedicados de plano de controle ACP no core:

- `src/acp/control-plane/manager.ts`
  - dono de atores ACP, transições de ciclo de vida, serialização de comandos
- `src/acp/control-plane/store.ts`
  - gerenciamento de esquema SQLite, transações, helpers de consulta
- `src/acp/control-plane/events.ts`
  - definições de eventos ACP tipados e serialização
- `src/acp/control-plane/checkpoint.ts`
  - checkpoints de entrega duráveis e cursores de replay
- `src/acp/control-plane/idempotency.ts`
  - reserva de chave de idempotência e replay de resposta
- `src/acp/control-plane/recovery.ts`
  - reconciliação no boot e plano de reidratação de ator

Módulos de ponte de compatibilidade:

- `src/acp/runtime/session-meta.ts`
  - permanece temporariamente para projeção em `SessionEntry.acp`
  - deve parar de ser fonte da verdade após cutover de migração

### Invariantes obrigatórias (devem ser impostas no código)

- Criação de sessão ACP e vinculação de thread são atômicas (transação única)
- há no máximo uma execução ativa por ator de sessão ACP por vez
- `seq` de evento é estritamente crescente por execução
- checkpoint de entrega nunca avança além do último evento commitado
- replay de idempotência retorna payload de sucesso anterior para chaves de comando duplicadas
- metadados ACP obsoletos/ausentes não podem rotear para caminho de resposta normal não-ACP

### Pontos de contato do core

Arquivos do core a alterar:

- `src/auto-reply/reply/dispatch-from-config.ts`
  - Branch ACP chama `AcpSessionManager.submit` e entrega por projeção de eventos
  - remover fallback ACP direto que ignora invariantes do plano de controle
- `src/auto-reply/reply/inbound-context.ts` (ou fronteira de contexto normalizado mais próxima)
  - expor chaves de roteamento normalizadas e sementes de idempotência para plano de controle ACP
- `src/config/sessions/types.ts`
  - manter `SessionEntry.acp` como campo de compatibilidade somente projeção
- `src/gateway/server-methods/sessions.ts`
  - reset/delete/archive devem chamar caminho de transação close/unbind do manager ACP
- `src/infra/outbound/bound-delivery-router.ts`
  - impor comportamento de destino fail-closed para turnos de sessão ACP vinculados
- `src/discord/monitor/thread-bindings.ts`
  - adicionar helpers de validação de vinculação obsoleta ACP conectados a buscas do plano de controle
- `src/auto-reply/reply/commands-acp.ts`
  - rotear spawn/cancel/close/steer através de APIs do manager ACP
- `src/agents/acp-spawn.ts`
  - parar escritas ad-hoc de metadados; chamar transação de spawn do manager ACP
- `src/plugin-sdk/**` e ponte de runtime de Plugin
  - expor registro de backend ACP e semânticas de saúde de forma limpa

Arquivos do core explicitamente não substituídos:

- `src/discord/monitor/message-handler.preflight.ts`
  - manter comportamento de sobrescrita de vinculação de thread como o resolver canônico de session-key

### API de registro de runtime ACP

Adicionar um módulo de registro no core:

- `src/acp/runtime/registry.ts`

API obrigatória:

```ts
export type AcpRuntimeBackend = {
  id: string;
  runtime: AcpRuntime;
  healthy?: () => boolean;
};

export function registerAcpRuntimeBackend(backend: AcpRuntimeBackend): void;
export function unregisterAcpRuntimeBackend(id: string): void;
export function getAcpRuntimeBackend(id?: string): AcpRuntimeBackend | null;
export function requireAcpRuntimeBackend(id?: string): AcpRuntimeBackend;
```

Comportamento:

- `requireAcpRuntimeBackend` lança um erro tipado de backend ACP ausente quando indisponível
- serviço Plugin registra backend no `start` e desregistra no `stop`
- buscas de runtime são somente leitura e locais ao processo

### Contrato de Plugin de runtime acpx (detalhe de implementação)

Para o primeiro backend de produção (`extensions/acpx`), o OpenCraft e acpx são
conectados com um contrato de comando estrito:

- id do backend: `acpx`
- id do serviço Plugin: `acpx-runtime`
- codificação de handle de runtime: `runtimeSessionName = acpx:v1:<base64url(json)>`
- campos do payload codificado:
  - `name` (sessão nomeada acpx; usa `sessionKey` do OpenCraft)
  - `agent` (comando de agente acpx)
  - `cwd` (raiz do workspace da sessão)
  - `mode` (`persistent | oneshot`)

Mapeamento de comandos:

- ensure session:
  - `acpx --format json --json-strict --cwd <cwd> <agent> sessions ensure --name <name>`
- prompt turn:
  - `acpx --format json --json-strict --cwd <cwd> <agent> prompt --session <name> --file -`
- cancel:
  - `acpx --format json --json-strict --cwd <cwd> <agent> cancel --session <name>`
- close:
  - `acpx --format json --json-strict --cwd <cwd> <agent> sessions close <name>`

Streaming:

- OpenCraft consome eventos ndjson de `acpx --format json --json-strict`
- `text` => `text_delta/output`
- `thought` => `text_delta/thought`
- `tool_call` => `tool_call`
- `done` => `done`
- `error` => `error`

### Patch de esquema de sessão

Patch de `SessionEntry` em `src/config/sessions/types.ts`:

```ts
type SessionAcpMeta = {
  backend: string;
  agent: string;
  runtimeSessionName: string;
  mode: "persistent" | "oneshot";
  cwd?: string;
  state: "idle" | "running" | "error";
  lastActivityAt: number;
  lastError?: string;
};
```

Campo persistido:

- `SessionEntry.acp?: SessionAcpMeta`

Regras de migração:

- fase A: escrita dupla (projeção `acp` + fonte da verdade SQLite ACP)
- fase B: leitura primária do SQLite ACP, leitura de fallback do legado `SessionEntry.acp`
- fase C: comando de migração preenche linhas ACP ausentes de entradas legadas válidas
- fase D: remover leitura de fallback e manter projeção opcional somente para UX
- campos legados (`cliSessionIds`, `claudeCliSessionId`) permanecem inalterados

### Contrato de erros

Adicionar códigos de erro ACP estáveis e mensagens voltadas ao usuário:

- `ACP_BACKEND_MISSING`
  - mensagem: `ACP runtime backend is not configured. Install and enable the acpx runtime plugin.`
- `ACP_BACKEND_UNAVAILABLE`
  - mensagem: `ACP runtime backend is currently unavailable. Try again in a moment.`
- `ACP_SESSION_INIT_FAILED`
  - mensagem: `Could not initialize ACP session runtime.`
- `ACP_TURN_FAILED`
  - mensagem: `ACP turn failed before completion.`

Regras:

- retornar mensagem acionável segura para o usuário na thread
- registrar erro detalhado de backend/sistema somente em logs de runtime
- nunca recorrer silenciosamente ao caminho LLM normal quando roteamento ACP foi explicitamente selecionado

### Arbitragem de entrega duplicada

Regra única de roteamento para turnos vinculados ACP:

- se uma vinculação de thread ativa existe para a sessão ACP alvo e contexto do solicitante, entregar somente para aquela thread vinculada
- não enviar também para canal pai no mesmo turno
- se seleção de destino vinculado é ambígua, falhar fechado com erro explícito (sem fallback implícito para pai)
- se nenhuma vinculação ativa existe, usar comportamento normal de destino de sessão

### Observabilidade e prontidão operacional

Métricas obrigatórias:

- contagem de sucesso/falha de criação ACP por backend e código de erro
- percentis de latência de execução ACP (espera em fila, tempo de turno de runtime, tempo de projeção de entrega)
- contagem de reinicialização de ator ACP e motivo de reinicialização
- contagem de detecção de vinculação obsoleta
- taxa de acerto de replay de idempotência
- contadores de retry e limite de taxa de entrega Discord

Logs obrigatórios:

- logs estruturados indexados por `sessionKey`, `runId`, `backend`, `threadId`, `idempotencyKey`
- logs explícitos de transição de estado para máquinas de estado de sessão e execução
- logs de comando do adaptador com argumentos seguros para redação e resumo de saída

Diagnósticos obrigatórios:

- `/acp sessions` inclui estado, execução ativa, último erro e status de vinculação
- `/acp doctor` (ou equivalente) valida registro de backend, saúde do armazenamento e vinculações obsoletas

### Precedência de configuração e valores efetivos

Precedência de habilitação ACP:

- sobrescrita de conta: `channels.discord.accounts.<id>.threadBindings.spawnAcpSessions`
- sobrescrita de canal: `channels.discord.threadBindings.spawnAcpSessions`
- portão ACP global: `acp.enabled`
- portão de dispatch: `acp.dispatch.enabled`
- disponibilidade de backend: backend registrado para `acp.backend`

Comportamento de auto-habilitação:

- quando ACP está configurado (`acp.enabled=true`, `acp.dispatch.enabled=true`, ou
  `acp.backend=acpx`), auto-habilitação de Plugin marca `plugins.entries.acpx.enabled=true`
  a menos que na lista de negação ou explicitamente desabilitado

Valor efetivo de TTL:

- `min(session ttl, discord thread binding ttl, acp runtime ttl)`

### Mapa de testes

Testes unitários:

- `src/acp/runtime/registry.test.ts` (novo)
- `src/auto-reply/reply/dispatch-from-config.acp.test.ts` (novo)
- `src/infra/outbound/bound-delivery-router.test.ts` (estender casos fail-closed ACP)
- `src/config/sessions/types.test.ts` ou testes de armazenamento de sessão mais próximos (persistência de metadados ACP)

Testes de integração:

- `src/discord/monitor/reply-delivery.test.ts` (comportamento de alvo de entrega ACP vinculado)
- `src/discord/monitor/message-handler.preflight*.test.ts` (continuidade de roteamento de session-key ACP vinculado)
- testes de runtime de Plugin acpx no pacote do backend (registrar/iniciar/parar serviço + normalização de eventos)

Testes e2e do Gateway:

- `src/gateway/server.sessions.gateway-server-sessions-a.e2e.test.ts` (estender cobertura de ciclo de vida reset/delete ACP)
- roundtrip e2e de turno de thread ACP para spawn, mensagem, stream, cancel, unfocus, recuperação de restart

### Guarda de rollout

Adicionar kill switch independente de dispatch ACP:

- `acp.dispatch.enabled` padrão `false` para primeiro release
- quando desabilitado:
  - comandos de controle de spawn/focus ACP ainda podem vincular sessões
  - caminho de dispatch ACP não ativa
  - usuário recebe mensagem explícita de que dispatch ACP está desabilitado por política
- após validação canary, padrão pode ser invertido para `true` em um release posterior

## Plano de comando e UX

### Novos comandos

- `/acp spawn <agent-id> [--mode persistent|oneshot] [--thread auto|here|off]`
- `/acp cancel [session]`
- `/acp steer <instruction>`
- `/acp close [session]`
- `/acp sessions`

### Compatibilidade de comandos existentes

- `/focus <sessionKey>` continua a suportar alvos ACP
- `/unfocus` mantém semânticas atuais
- `/session idle` e `/session max-age` substituem a sobrescrita antiga de TTL

## Rollout em fases

### Fase 0 ADR e congelamento de esquema

- enviar ADR para propriedade do plano de controle ACP e fronteiras de adaptador
- congelar esquema de DB (`acp_sessions`, `acp_runs`, `acp_bindings`, `acp_events`, `acp_delivery_checkpoint`, `acp_idempotency`)
- definir códigos de erro ACP estáveis, contrato de eventos e guardas de transição de estado

### Fase 1 Fundação do plano de controle no core

- implementar `AcpSessionManager` e runtime de ator por sessão
- implementar armazenamento SQLite ACP e helpers de transação
- implementar armazenamento de idempotência e helpers de replay
- implementar adição de eventos + módulos de checkpoint de entrega
- conectar APIs de spawn/cancel/close ao manager com garantias transacionais

### Fase 2 Integração de roteamento e ciclo de vida no core

- rotear turnos ACP vinculados a thread do pipeline de dispatch para o manager ACP
- impor roteamento fail-closed quando invariantes de vinculação/sessão ACP falham
- integrar ciclo de vida de reset/delete/archive/unfocus com transações de close/unbind ACP
- adicionar detecção de vinculação obsoleta e política opcional de auto-desvinculação

### Fase 3 Adaptador/Plugin de backend acpx

- implementar adaptador `acpx` contra contrato de runtime (`ensureSession`, `submit`, `stream`, `cancel`, `close`)
- adicionar verificações de saúde do backend e registro de inicialização/teardown
- normalizar eventos ndjson acpx para eventos de runtime ACP
- impor timeouts do backend, supervisão de processo e política de restart/backoff

### Fase 4 Projeção de entrega e UX de canal (Discord primeiro)

- implementar projeção de canal orientada a eventos com retomada de checkpoint (Discord primeiro)
- coalescer chunks de streaming com política de flush ciente de limite de taxa
- garantir mensagem final de conclusão exatamente uma vez por execução
- enviar `/acp spawn`, `/acp cancel`, `/acp steer`, `/acp close`, `/acp sessions`

### Fase 5 Migração e cutover

- introduzir escrita dupla para projeção `SessionEntry.acp` mais fonte da verdade SQLite ACP
- adicionar utilitário de migração para linhas de metadados ACP legados
- inverter caminho de leitura para SQLite ACP primário
- remover roteamento de fallback legado que depende de `SessionEntry.acp` ausente

### Fase 6 Endurecimento, SLOs e limites de escala

- impor limites de concorrência (global/conta/sessão), políticas de fila e orçamentos de timeout
- adicionar telemetria completa, dashboards e limiares de alerta
- testar caos em recuperação de crash e supressão de entrega duplicada
- publicar runbook para queda de backend, corrupção de DB e remediação de vinculação obsoleta

### Checklist completo de implementação

- módulos de plano de controle core e testes
- migrações de DB e plano de rollback
- integração da API do manager ACP através de dispatch e comandos
- interface de registro de adaptador na ponte de runtime de Plugin
- implementação do adaptador acpx e testes
- lógica de projeção de entrega de canal com capacidade de thread com replay de checkpoint (Discord primeiro)
- hooks de ciclo de vida para reset/delete/archive/unfocus
- detector de vinculação obsoleta e diagnósticos voltados ao operador
- validação de configuração e testes de precedência para todas as novas chaves ACP
- documentação operacional e runbook de troubleshooting

## Plano de testes

Testes unitários:

- fronteiras de transação de DB ACP (atomicidade de spawn/bind/enqueue, cancel, close)
- guardas de transição de máquina de estado ACP para sessões e execuções
- semânticas de reserva/replay de idempotência em todos os comandos ACP
- serialização de ator por sessão e ordenação de fila
- parser de eventos acpx e coalescedor de chunks
- supervisor de runtime e política de restart e backoff
- precedência de configuração e cálculo de TTL efetivo
- seleção de branch de roteamento ACP no core e comportamento fail-closed quando backend/sessão é inválido

Testes de integração:

- processo de adaptador ACP fake para streaming determinístico e comportamento de cancelamento
- integração de manager ACP + dispatch com persistência transacional
- roteamento de entrada vinculado a thread para chave de sessão ACP
- entrega de saída vinculada a thread suprime duplicação de canal pai
- replay de checkpoint recupera após falha de entrega e retoma do último evento
- registro e teardown de serviço Plugin do backend de runtime ACP

Testes e2e do Gateway:

- criar ACP com thread, trocar prompts multi-turno, unfocus
- restart do Gateway com DB ACP persistido e vinculações, depois continuar mesma sessão
- sessões ACP concorrentes em múltiplas threads não têm cross-talk
- retentativas de comando duplicado (mesma chave de idempotência) não criam execuções ou respostas duplicadas
- cenário de vinculação obsoleta gera erro explícito e comportamento opcional de auto-limpeza

## Riscos e mitigações

- Entregas duplicadas durante transição
  - Mitigação: resolver de destino único e checkpoint de evento idempotente
- Churn de processo de runtime sob carga
  - Mitigação: donos de longa vida por sessão + limites de concorrência + backoff
- Plugin ausente ou mal configurado
  - Mitigação: erro explícito voltado ao operador e roteamento ACP fail-closed (sem fallback implícito para caminho de sessão normal)
- Confusão de configuração entre portões de subagente e ACP
  - Mitigação: chaves ACP explícitas e feedback de comando que inclui fonte de política efetiva
- Corrupção de armazenamento do plano de controle ou bugs de migração
  - Mitigação: modo WAL, hooks de backup/restauração, testes de fumaça de migração e diagnósticos de fallback somente leitura
- Deadlocks de ator ou esgotamento de caixa de correio
  - Mitigação: timers watchdog, probes de saúde de ator e profundidade limitada de caixa de correio com telemetria de rejeição

## Checklist de aceitação

- Criação de sessão ACP pode criar ou vincular uma thread em um adaptador de canal suportado (atualmente Discord)
- todas as mensagens de thread roteiam somente para sessão ACP vinculada
- saídas ACP aparecem na mesma identidade de thread com streaming ou lotes
- nenhuma saída duplicada no canal pai para turnos vinculados
- spawn+bind+enqueue inicial são atômicos no armazenamento persistente
- retentativas de comando ACP são idempotentes e não duplicam execuções ou saídas
- cancel, close, unfocus, archive, reset e delete executam limpeza determinística
- restart após crash preserva mapeamento e retoma continuidade multi-turno
- sessões ACP vinculadas a thread concorrentes funcionam independentemente
- estado de backend ACP ausente produz erro claro e acionável
- vinculações obsoletas são detectadas e exibidas explicitamente (com auto-limpeza segura opcional)
- métricas e diagnósticos do plano de controle estão disponíveis para operadores
- nova cobertura unitária, de integração e e2e passa

## Adendo: refatorações direcionadas para implementação atual (status)

Estes são follow-ups não bloqueantes para manter o caminho ACP sustentável após o conjunto de funcionalidades atual ser entregue.

### 1) Centralizar avaliação de política de dispatch ACP (concluído)

- implementado via helpers de política ACP compartilhados em `src/acp/policy.ts`
- dispatch, handlers de ciclo de vida de comando ACP e caminho de spawn ACP agora consomem lógica de política compartilhada

### 2) Dividir handler de comando ACP por domínio de subcomando (concluído)

- `src/auto-reply/reply/commands-acp.ts` agora é um roteador fino
- comportamento de subcomando está dividido em:
  - `src/auto-reply/reply/commands-acp/lifecycle.ts`
  - `src/auto-reply/reply/commands-acp/runtime-options.ts`
  - `src/auto-reply/reply/commands-acp/diagnostics.ts`
  - helpers compartilhados em `src/auto-reply/reply/commands-acp/shared.ts`

### 3) Dividir manager de sessão ACP por responsabilidade (concluído)

- manager está dividido em:
  - `src/acp/control-plane/manager.ts` (fachada pública + singleton)
  - `src/acp/control-plane/manager.core.ts` (implementação do manager)
  - `src/acp/control-plane/manager.types.ts` (tipos/deps do manager)
  - `src/acp/control-plane/manager.utils.ts` (normalização + funções helper)

### 4) Limpeza opcional do adaptador de runtime acpx

- `extensions/acpx/src/runtime.ts` pode ser dividido em:
- execução/supervisão de processo
- parsing/normalização de eventos ndjson
- superfície da API de runtime (`submit`, `cancel`, `close`, etc.)
- melhora testabilidade e torna comportamento do backend mais fácil de auditar
