---
summary: "Integrar agentes de codificação ACP via um plano de controle ACP de primeira classe no núcleo e runtimes com suporte de plugin (acpx primeiro)"
owner: "onutc"
status: "draft"
last_updated: "2026-02-25"
title: "Agentes ACP Vinculados a Thread"
---

# Agentes ACP Vinculados a Thread

## Visão Geral

Este plano define como o OpenCraft deve suportar agentes de codificação ACP em canais com capacidade de thread (Discord primeiro) com ciclo de vida e recuperação de nível de produção.

Documento relacionado:

- [Plano de Refatoração de Streaming Unificado de Runtime](/experiments/plans/acp-unified-streaming-refactor)

Experiência do usuário alvo:

- um usuário cria ou foca uma sessão ACP em uma thread
- mensagens do usuário naquela thread são roteadas para a sessão ACP vinculada
- a saída do agente é transmitida de volta para a mesma persona de thread
- a sessão pode ser persistente ou de uso único com controles de limpeza explícitos

## Resumo de decisão

A recomendação de longo prazo é uma arquitetura híbrida:

- O núcleo do OpenCraft possui preocupações do plano de controle ACP
  - identidade e metadados de sessão
  - decisões de vinculação a thread e roteamento
  - invariantes de entrega e supressão de duplicatas
  - semântica de limpeza e recuperação do ciclo de vida
- O backend do runtime ACP é plugável
  - primeiro backend é um serviço de plugin suportado pelo acpx
  - o runtime faz transporte ACP, enfileiramento, cancelamento, reconexão

O OpenCraft não deve reimplementar internos de transporte ACP no núcleo.
O OpenCraft não deve depender de um caminho de interceptação somente por plugin para roteamento.

## Arquitetura norte-estrela (santo graal)

Tratar ACP como um plano de controle de primeira classe no OpenCraft, com adaptadores de runtime plugáveis.

Invariantes inegociáveis:

- toda vinculação de thread ACP referencia um registro de sessão ACP válido
- toda sessão ACP tem estado explícito de ciclo de vida (`creating`, `idle`, `running`, `cancelling`, `closed`, `error`)
- toda execução ACP tem estado explícito de execução (`queued`, `running`, `completed`, `failed`, `cancelled`)
- spawn, bind e enfileiramento inicial são atômicos
- retentativas de comando são idempotentes (sem execuções duplicadas ou saídas Discord duplicadas)
- a saída do canal de thread vinculado é uma projeção de eventos de execução ACP, nunca efeitos colaterais ad-hoc

Modelo de propriedade de longo prazo:

- `AcpSessionManager` é o único escritor e orquestrador ACP
- o manager vive no processo do gateway primeiro; pode ser movido para um sidecar dedicado mais tarde atrás da mesma interface
- por chave de sessão ACP, o manager possui um ator em memória (execução de comando serializada)
- adaptadores (`acpx`, backends futuros) são implementações de transporte/runtime apenas

Modelo de persistência de longo prazo:

- mover estado do plano de controle ACP para um armazenamento SQLite dedicado (modo WAL) no diretório de estado do OpenCraft
- manter `SessionEntry.acp` como projeção de compatibilidade durante migração, não como fonte da verdade
- armazenar eventos ACP de forma append-only para suportar replay, recuperação de falhas e entrega determinística

### Estratégia de entrega (ponte para o santo graal)

- ponte de curto prazo
  - manter mecânica atual de vinculação a thread e superfície de configuração ACP existente
  - corrigir bugs de lacuna de metadados e rotear turnos ACP por um único branch ACP central
  - adicionar chaves de idempotência e verificações de roteamento fail-closed imediatamente
- transição de longo prazo
  - mover fonte da verdade ACP para DB do plano de controle + atores
  - fazer entrega de thread vinculado puramente baseada em projeção de eventos
  - remover comportamento de fallback legado que depende de metadados de entrada de sessão oportunistas

## Por que não somente plugin

Os hooks de plugin atuais não são suficientes para roteamento de sessão ACP ponta a ponta sem mudanças no núcleo.

- o roteamento de entrada de vinculação a thread resolve para uma chave de sessão no dispatch central primeiro
- hooks de mensagem são fire-and-forget e não podem curto-circuitar o caminho principal de resposta
- comandos de plugin são bons para operações de controle, mas não para substituir o fluxo de dispatch por turno do núcleo

Resultado:

- o runtime ACP pode ser pluginizado
- o branch de roteamento ACP deve existir no núcleo

## Fundação existente para reutilizar

Já implementado e deve permanecer canônico:

- alvo de vinculação a thread suporta `subagent` e `acp`
- substituição de roteamento de thread de entrada resolve por vinculação antes do dispatch normal
- identidade de thread de saída via webhook na entrega de resposta
- fluxo `/focus` e `/unfocus` com compatibilidade de alvo ACP
- armazenamento de vinculação persistente com restauração na inicialização
- ciclo de vida de desvinculação em archive, delete, unfocus, reset e delete

Este plano estende essa fundação em vez de substituí-la.

## Arquitetura

### Modelo de limite

Núcleo (deve estar no núcleo do OpenCraft):

- branch de dispatch em modo sessão ACP no pipeline de resposta
- arbitragem de entrega para evitar duplicação no canal pai mais thread
- persistência do plano de controle ACP (com projeção de compatibilidade de `SessionEntry.acp` durante migração)
- semântica de desvinculação de ciclo de vida e desanexação de runtime vinculada a reset/delete de sessão

Backend de plugin (implementação acpx):

- supervisão de worker do runtime ACP
- invocação do processo acpx e análise de eventos
- handlers de comando ACP (`/acp ...`) e UX do operador
- padrões de configuração específicos do backend e diagnósticos

### Modelo de propriedade do runtime

- um processo gateway possui estado de orquestração ACP
- a execução ACP roda em processos filhos supervisionados via backend acpx
- a estratégia de processo é de longa duração por chave de sessão ACP ativa, não por mensagem

Isso evita o custo de inicialização a cada prompt e mantém semântica de cancelamento e reconexão confiável.

### Contrato de runtime central

Adicionar um contrato de runtime ACP central para que o código de roteamento não dependa de detalhes da CLI e possa trocar de backends sem mudar a lógica de dispatch:

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

- primeiro backend: `AcpxRuntime` fornecido como serviço de plugin
- o núcleo resolve o runtime via registry e falha com erro explícito de operador quando nenhum backend de runtime ACP está disponível

### Modelo de dados do plano de controle e persistência

A fonte da verdade de longo prazo é um banco de dados ACP SQLite dedicado (modo WAL), para atualizações transacionais e recuperação segura após falhas:

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
  - `scope`, `idempotency_key`, `result_json`, `created_at`, único `(scope, idempotency_key)`

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
- IDs de processo e sockets ficam apenas em memória
- ciclo de vida durável e status de execução vivem no DB ACP, não em JSON de sessão genérico
- se o proprietário do runtime morrer, o gateway reidrata do DB ACP e retoma a partir dos checkpoints

### Roteamento e entrega

Entrada:

- manter busca de vinculação a thread atual como primeiro passo de roteamento
- se o alvo vinculado for sessão ACP, rotear para o branch de runtime ACP em vez de `getReplyFromConfig`
- comando explícito `/acp steer` usa `mode: "steer"`

Saída:

- stream de eventos ACP é normalizado para chunks de resposta do OpenCraft
- o alvo de entrega é resolvido pelo caminho de destino vinculado existente
- quando uma thread vinculada está ativa para aquele turno de sessão, a conclusão do canal pai é suprimida

Política de streaming:

- transmitir saída parcial com janela de coalescência
- intervalo mínimo configurável e bytes máximos de chunk para ficar abaixo dos limites de taxa do Discord
- mensagem final sempre emitida na conclusão ou falha

### Máquinas de estado e limites de transação

Máquina de estado de sessão:

- `creating -> idle -> running -> idle`
- `running -> cancelling -> idle | error`
- `idle -> closed`
- `error -> idle | closed`

Máquina de estado de execução:

- `queued -> running -> completed`
- `running -> failed | cancelled`
- `queued -> cancelled`

Limites de transação necessários:

- transação de spawn
  - criar linha de sessão ACP
  - criar/atualizar linha de vinculação a thread ACP
  - enfileirar linha de execução inicial
- transação de close
  - marcar sessão como closed
  - deletar/expirar linhas de vinculação
  - escrever evento final de close
- transação de cancel
  - marcar execução alvo como cancelling/cancelled com chave de idempotência

Nenhum sucesso parcial é permitido através desses limites.

### Modelo de ator por sessão

`AcpSessionManager` executa um ator por chave de sessão ACP:

- o mailbox do ator serializa efeitos colaterais de `submit`, `cancel`, `close` e `stream`
- o ator possui hidratação do handle de runtime e ciclo de vida do processo do adaptador de runtime para aquela sessão
- o ator escreve eventos de execução em ordem (`seq`) antes de qualquer entrega no Discord
- o ator atualiza checkpoints de entrega após envio de saída bem-sucedido

Isso remove corridas entre turnos e previne saída de thread duplicada ou fora de ordem.

### Idempotência e projeção de entrega

Todas as ações ACP externas devem carregar chaves de idempotência:

- chave de idempotência de spawn
- chave de idempotência de prompt/steer
- chave de idempotência de cancel
- chave de idempotência de close

Regras de entrega:

- mensagens Discord são derivadas de `acp_events` mais `acp_delivery_checkpoint`
- retentativas retomam a partir do checkpoint sem reenviar chunks já entregues
- emissão de resposta final é exatamente uma vez por execução pela lógica de projeção

### Recuperação e auto-recuperação

Na inicialização do gateway:

- carregar sessões ACP não terminais (`creating`, `idle`, `running`, `cancelling`, `error`)
- recriar atores preguiçosamente no primeiro evento de entrada ou avidamente sob capacidade configurada
- reconciliar execuções `running` com heartbeats ausentes e marcar como `failed` ou recuperar via adaptador

Em mensagem de thread Discord de entrada:

- se a vinculação existir mas a sessão ACP estiver ausente, falhar fechado com mensagem explícita de vinculação obsoleta
- opcionalmente desvincular automaticamente vinculação obsoleta após validação segura para o operador
- nunca rotear silenciosamente vinculações ACP obsoletas para o caminho normal de LLM

### Ciclo de vida e segurança

Operações suportadas:

- cancelar execução atual: `/acp cancel`
- desvincular thread: `/unfocus`
- fechar sessão ACP: `/acp close`
- fechar automaticamente sessões ociosas por TTL efetivo

Política de TTL:

- TTL efetivo é o mínimo de
  - TTL global/sessão
  - TTL de vinculação a thread Discord
  - TTL do proprietário do runtime ACP

Controles de segurança:

- lista de permissões de agentes ACP por nome
- restringir raízes de workspace para sessões ACP
- passagem de lista de permissões de env
- máximo de sessões ACP concorrentes por conta e globalmente
- backoff de reinicialização limitado para falhas de runtime

## Superfície de configuração

Chaves centrais:

- `acp.enabled`
- `acp.dispatch.enabled` (chave kill de roteamento ACP independente)
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

Chaves de plugin/backend (seção de plugin acpx):

- substituições de comando/caminho do backend
- lista de permissões de env do backend
- presets por agente do backend
- timeouts de inicialização/parada do backend
- máximo de execuções em andamento por sessão do backend

## Especificação de implementação

### Módulos do plano de controle (novos)

Adicionar módulos dedicados do plano de controle ACP no núcleo:

- `src/acp/control-plane/manager.ts`
  - possui atores ACP, transições de ciclo de vida, serialização de comandos
- `src/acp/control-plane/store.ts`
  - gerenciamento de esquema SQLite, transações, helpers de consulta
- `src/acp/control-plane/events.ts`
  - definições tipadas de eventos ACP e serialização
- `src/acp/control-plane/checkpoint.ts`
  - checkpoints de entrega duráveis e cursores de replay
- `src/acp/control-plane/idempotency.ts`
  - reserva de chave de idempotência e replay de resposta
- `src/acp/control-plane/recovery.ts`
  - reconciliação no boot e plano de reidratação de atores

Módulos de bridge de compatibilidade:

- `src/acp/runtime/session-meta.ts`
  - permanece temporariamente para projeção em `SessionEntry.acp`
  - deve parar de ser fonte da verdade após transição de migração

### Invariantes necessários (devem ser aplicados em código)

- criação de sessão ACP e vinculação a thread são atômicas (transação única)
- há no máximo uma execução ativa por ator de sessão ACP por vez
- `seq` de evento é estritamente crescente por execução
- checkpoint de entrega nunca avança além do último evento confirmado
- replay de idempotência retorna payload de sucesso anterior para chaves de comando duplicadas
- metadados ACP obsoletos/ausentes não podem rotear para o caminho de resposta não-ACP normal

### Pontos de contato do núcleo

Arquivos do núcleo a alterar:

- `src/auto-reply/reply/dispatch-from-config.ts`
  - branch ACP chama `AcpSessionManager.submit` e entrega de projeção de eventos
  - remover fallback ACP direto que contorna invariantes do plano de controle
- `src/auto-reply/reply/inbound-context.ts` (ou limite de contexto normalizado mais próximo)
  - expor chaves de roteamento normalizadas e sementes de idempotência para o plano de controle ACP
- `src/config/sessions/types.ts`
  - manter `SessionEntry.acp` como campo de compatibilidade somente de projeção
- `src/gateway/server-methods/sessions.ts`
  - reset/delete/archive devem chamar o caminho de transação close/unbind do manager ACP
- `src/infra/outbound/bound-delivery-router.ts`
  - aplicar comportamento fail-closed de destino para turnos de sessão ACP vinculada
- `src/discord/monitor/thread-bindings.ts`
  - adicionar helpers de validação de vinculação ACP obsoleta conectados a buscas do plano de controle
- `src/auto-reply/reply/commands-acp.ts`
  - rotear spawn/cancel/close/steer pelas APIs do manager ACP
- `src/agents/acp-spawn.ts`
  - parar escritas ad-hoc de metadados; chamar transação de spawn do manager ACP
- `src/plugin-sdk/**` e bridge de runtime de plugin
  - expor registro de backend ACP e semântica de saúde de forma limpa

Arquivos do núcleo explicitamente não substituídos:

- `src/discord/monitor/message-handler.preflight.ts`
  - manter comportamento de substituição de vinculação a thread como resolvedor canônico de chave de sessão

### API do registry de runtime ACP

Adicionar um módulo de registry central:

- `src/acp/runtime/registry.ts`

API necessária:

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
- o serviço de plugin registra o backend no `start` e cancela o registro no `stop`
- buscas de runtime são somente leitura e locais ao processo

### Contrato do plugin de runtime acpx (detalhe de implementação)

Para o primeiro backend de produção (`extensions/acpx`), OpenCraft e acpx são
conectados com um contrato de comando estrito:

- id do backend: `acpx`
- id do serviço de plugin: `acpx-runtime`
- codificação do handle de runtime: `runtimeSessionName = acpx:v1:<base64url(json)>`
- campos do payload codificado:
  - `name` (sessão nomeada acpx; usa `sessionKey` do OpenCraft)
  - `agent` (comando de agente acpx)
  - `cwd` (raiz do workspace da sessão)
  - `mode` (`persistent | oneshot`)

Mapeamento de comandos:

- garantir sessão:
  - `acpx --format json --json-strict --cwd <cwd> <agent> sessions ensure --name <name>`
- turno de prompt:
  - `acpx --format json --json-strict --cwd <cwd> <agent> prompt --session <name> --file -`
- cancelar:
  - `acpx --format json --json-strict --cwd <cwd> <agent> cancel --session <name>`
- fechar:
  - `acpx --format json --json-strict --cwd <cwd> <agent> sessions close <name>`

Streaming:

- OpenCraft consome eventos ndjson de `acpx --format json --json-strict`
- `text` => `text_delta/output`
- `thought` => `text_delta/thought`
- `tool_call` => `tool_call`
- `done` => `done`
- `error` => `error`

### Patch do esquema de sessão

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

- fase A: escrita dupla (projeção `acp` + fonte da verdade ACP SQLite)
- fase B: leitura primária do ACP SQLite, fallback de leitura do `SessionEntry.acp` legado
- fase C: comando de migração preenche linhas ACP ausentes a partir de entradas legadas válidas
- fase D: remover fallback de leitura e manter projeção opcional apenas para UX
- campos legados (`cliSessionIds`, `claudeCliSessionId`) permanecem intocados

### Contrato de erro

Adicionar códigos de erro ACP estáveis e mensagens voltadas ao usuário:

- `ACP_BACKEND_MISSING`
  - mensagem: `O backend de runtime ACP não está configurado. Instale e habilite o plugin de runtime acpx.`
- `ACP_BACKEND_UNAVAILABLE`
  - mensagem: `O backend de runtime ACP está indisponível no momento. Tente novamente em instantes.`
- `ACP_SESSION_INIT_FAILED`
  - mensagem: `Não foi possível inicializar o runtime da sessão ACP.`
- `ACP_TURN_FAILED`
  - mensagem: `O turno ACP falhou antes da conclusão.`

Regras:

- retornar mensagem acionável e segura para o usuário na thread
- registrar erro detalhado do backend/sistema apenas nos logs de runtime
- nunca recorrer silenciosamente ao caminho normal de LLM quando o roteamento ACP foi explicitamente selecionado

### Arbitragem de entrega duplicada

Regra de roteamento única para turnos vinculados ACP:

- se uma vinculação de thread ativa existir para a sessão ACP alvo e o contexto do solicitante, entregar apenas para aquela thread vinculada
- não enviar também para o canal pai no mesmo turno
- se a seleção do destino vinculado for ambígua, falhar fechado com erro explícito (sem fallback implícito para o pai)
- se nenhuma vinculação ativa existir, usar comportamento normal de destino de sessão

### Observabilidade e prontidão operacional

Métricas necessárias:

- contagem de sucesso/falha de spawn ACP por backend e código de erro
- percentis de latência de execução ACP (espera na fila, tempo de turno do runtime, tempo de projeção de entrega)
- contagem de reinicialização de ator ACP e motivo de reinicialização
- contagem de detecção de vinculação obsoleta
- taxa de acerto de replay de idempotência
- contadores de retry de entrega Discord e limite de taxa

Logs necessários:

- logs estruturados com chave por `sessionKey`, `runId`, `backend`, `threadId`, `idempotencyKey`
- logs explícitos de transição de estado para máquinas de estado de sessão e execução
- logs de comando do adaptador com argumentos seguros para redação e resumo de saída

Diagnósticos necessários:

- `/acp sessions` inclui estado, execução ativa, último erro e status de vinculação
- `/acp doctor` (ou equivalente) valida registro do backend, saúde do armazenamento e vinculações obsoletas

### Precedência de configuração e valores efetivos

Precedência de habilitação ACP:

- substituição de conta: `channels.discord.accounts.<id>.threadBindings.spawnAcpSessions`
- substituição de canal: `channels.discord.threadBindings.spawnAcpSessions`
- portão ACP global: `acp.enabled`
- portão de dispatch: `acp.dispatch.enabled`
- disponibilidade do backend: backend registrado para `acp.backend`

Comportamento de habilitação automática:

- quando ACP está configurado (`acp.enabled=true`, `acp.dispatch.enabled=true` ou
  `acp.backend=acpx`), a habilitação automática do plugin marca `plugins.entries.acpx.enabled=true`
  a menos que esteja na lista de negação ou explicitamente desabilitado

Valor efetivo de TTL:

- `min(session ttl, discord thread binding ttl, acp runtime ttl)`

### Mapa de testes

Testes unitários:

- `src/acp/runtime/registry.test.ts` (novo)
- `src/auto-reply/reply/dispatch-from-config.acp.test.ts` (novo)
- `src/infra/outbound/bound-delivery-router.test.ts` (estender casos fail-closed ACP)
- `src/config/sessions/types.test.ts` ou testes de armazenamento de sessão mais próximos (persistência de metadados ACP)

Testes de integração:

- `src/discord/monitor/reply-delivery.test.ts` (comportamento do alvo de entrega ACP vinculado)
- `src/discord/monitor/message-handler.preflight*.test.ts` (continuidade de roteamento de chave de sessão ACP vinculada)
- testes de runtime de plugin acpx no pacote de backend (register/start/stop de serviço + normalização de eventos)

Testes e2e do gateway:

- `src/gateway/server.sessions.gateway-server-sessions-a.e2e.test.ts` (estender cobertura do ciclo de vida ACP reset/delete)
- roundtrip e2e de turno ACP em thread para spawn, mensagem, stream, cancel, unfocus, recuperação de reinicialização

### Guarda de implantação

Adicionar chave kill de dispatch ACP independente:

- `acp.dispatch.enabled` padrão `false` para o primeiro lançamento
- quando desabilitado:
  - comandos de controle ACP spawn/focus ainda podem vincular sessões
  - o caminho de dispatch ACP não é ativado
  - o usuário recebe mensagem explícita de que o dispatch ACP está desabilitado por política
- após validação canário, o padrão pode ser alterado para `true` em um lançamento posterior

## Plano de comandos e UX

### Novos comandos

- `/acp spawn <agent-id> [--mode persistent|oneshot] [--thread auto|here|off]`
- `/acp cancel [session]`
- `/acp steer <instruction>`
- `/acp close [session]`
- `/acp sessions`

### Compatibilidade de comandos existentes

- `/focus <sessionKey>` continua a suportar alvos ACP
- `/unfocus` mantém a semântica atual
- `/session idle` e `/session max-age` substituem a substituição antiga de TTL

## Implantação em fases

### Fase 0 ADR e congelamento de esquema

- publicar ADR para propriedade do plano de controle ACP e limites do adaptador
- congelar esquema DB (`acp_sessions`, `acp_runs`, `acp_bindings`, `acp_events`, `acp_delivery_checkpoint`, `acp_idempotency`)
- definir códigos de erro ACP estáveis, contrato de eventos e guardas de transição de estado

### Fase 1 Fundação do plano de controle no núcleo

- implementar `AcpSessionManager` e runtime de ator por sessão
- implementar armazenamento SQLite ACP e helpers de transação
- implementar armazenamento de idempotência e helpers de replay
- implementar módulos de append de eventos + checkpoint de entrega
- conectar APIs de spawn/cancel/close ao manager com garantias transacionais

### Fase 2 Roteamento central e integração do ciclo de vida

- rotear turnos ACP vinculados a thread do pipeline de dispatch para o manager ACP
- aplicar roteamento fail-closed quando invariantes de vinculação/sessão ACP falham
- integrar ciclo de vida de reset/delete/archive/unfocus com transações de close/unbind ACP
- adicionar detecção de vinculação obsoleta e política opcional de desvinculação automática

### Fase 3 Adaptador/plugin de backend acpx

- implementar adaptador `acpx` contra contrato de runtime (`ensureSession`, `submit`, `stream`, `cancel`, `close`)
- adicionar verificações de saúde do backend e registro de inicialização/teardown
- normalizar eventos ndjson do acpx em eventos de runtime ACP
- aplicar timeouts do backend, supervisão de processo e política de reinicialização/backoff

### Fase 4 Projeção de entrega e UX do canal (Discord primeiro)

- implementar projeção de canal orientada a eventos com retomada de checkpoint (Discord primeiro)
- coalescência de chunks de streaming com política de flush ciente de limite de taxa
- garantir exatamente uma mensagem de conclusão final por execução
- publicar `/acp spawn`, `/acp cancel`, `/acp steer`, `/acp close`, `/acp sessions`

### Fase 5 Migração e transição

- introduzir escrita dupla para projeção `SessionEntry.acp` mais fonte da verdade ACP SQLite
- adicionar utilitário de migração para linhas de metadados ACP legadas
- alternar caminho de leitura para ACP SQLite como primário
- remover roteamento de fallback legado que depende de `SessionEntry.acp` ausente

### Fase 6 Consolidação, SLOs e limites de escala

- aplicar limites de concorrência (global/conta/sessão), políticas de fila e orçamentos de timeout
- adicionar telemetria completa, dashboards e limiares de alerta
- testar caos para recuperação de falhas e supressão de entrega duplicada
- publicar runbook para indisponibilidade de backend, corrupção de DB e remediação de vinculação obsoleta

### Checklist de implementação completo

- módulos do plano de controle central e testes
- migrações de DB e plano de rollback
- integração da API do manager ACP em dispatch e comandos
- interface de registro do adaptador na bridge de runtime de plugin
- implementação e testes do adaptador acpx
- lógica de projeção de entrega de canal com capacidade de thread com replay de checkpoint (Discord primeiro)
- hooks de ciclo de vida para reset/delete/archive/unfocus
- detector de vinculação obsoleta e diagnósticos voltados ao operador
- validação de configuração e testes de precedência para todas as novas chaves ACP
- docs operacionais e runbook de resolução de problemas

## Plano de testes

Testes unitários:

- limites de transação de DB ACP (atomicidade de spawn/bind/enqueue, cancel, close)
- guardas de transição de máquina de estado ACP para sessões e execuções
- semântica de reserva/replay de idempotência em todos os comandos ACP
- serialização e ordenação de fila do ator por sessão
- parser de eventos acpx e coalescedor de chunk
- política de reinicialização e backoff do supervisor de runtime
- precedência de configuração e cálculo de TTL efetivo
- seleção do branch de roteamento ACP central e comportamento fail-closed quando backend/sessão é inválido

Testes de integração:

- processo adaptador ACP falso para streaming determinístico e comportamento de cancel
- integração do manager ACP + dispatch com persistência transacional
- roteamento de entrada vinculado a thread para chave de sessão ACP
- entrega de saída vinculada a thread suprime duplicação no canal pai
- replay de checkpoint recupera após falha de entrega e retoma do último evento
- registro e teardown do serviço de plugin do backend de runtime ACP

Testes e2e do gateway:

- spawn ACP com thread, trocar prompts multi-turno, unfocus
- reinicialização do gateway com DB ACP e vinculações persistidos, depois continuar mesma sessão
- sessões ACP concorrentes em múltiplas threads não têm interferência cruzada
- retentativas de comando duplicadas (mesma chave de idempotência) não criam execuções ou respostas duplicadas
- cenário de vinculação obsoleta produz erro explícito e comportamento opcional de limpeza automática

## Riscos e mitigações

- Entregas duplicadas durante transição
  - Mitigação: resolvedor de destino único e checkpoint de eventos idempotente
- Rotatividade de processo de runtime sob carga
  - Mitigação: proprietários de longa duração por sessão + limites de concorrência + backoff
- Plugin ausente ou mal configurado
  - Mitigação: erro explícito voltado ao operador e roteamento ACP fail-closed (sem fallback implícito para caminho de sessão normal)
- Confusão de configuração entre portões de subagent e ACP
  - Mitigação: chaves ACP explícitas e feedback de comando que inclui a fonte de política efetiva
- Corrupção do armazenamento do plano de controle ou bugs de migração
  - Mitigação: modo WAL, hooks de backup/restauração, testes de smoke de migração e diagnósticos de fallback somente leitura
- Deadlocks de ator ou privação de mailbox
  - Mitigação: timers watchdog, probes de saúde do ator e profundidade de mailbox limitada com telemetria de rejeição

## Checklist de aceitação

- spawn de sessão ACP pode criar ou vincular uma thread em um adaptador de canal suportado (atualmente Discord)
- todas as mensagens de thread roteiam apenas para a sessão ACP vinculada
- saídas ACP aparecem na mesma identidade de thread com streaming ou em lotes
- sem saída duplicada no canal pai para turnos vinculados
- spawn+bind+enqueue inicial são atômicos no armazenamento persistente
- retentativas de comando ACP são idempotentes e não duplicam execuções ou saídas
- cancel, close, unfocus, archive, reset e delete realizam limpeza determinística
- reinicialização após falha preserva mapeamento e retoma continuidade multi-turno
- sessões ACP vinculadas a thread concorrentes funcionam de forma independente
- estado de backend ACP ausente produz erro claro e acionável
- vinculações obsoletas são detectadas e surfacadas explicitamente (com limpeza automática segura opcional)
- métricas e diagnósticos do plano de controle estão disponíveis para operadores
- nova cobertura de testes unitários, integração e e2e passa

## Adendo: refatorações direcionadas para implementação atual (status)

Estes são acompanhamentos não bloqueantes para manter o caminho ACP sustentável após o conjunto de recursos atual ser publicado.

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

- o manager está dividido em:
  - `src/acp/control-plane/manager.ts` (fachada pública + singleton)
  - `src/acp/control-plane/manager.core.ts` (implementação do manager)
  - `src/acp/control-plane/manager.types.ts` (tipos/deps do manager)
  - `src/acp/control-plane/manager.utils.ts` (funções de normalização + helper)

### 4) Limpeza opcional do adaptador de runtime acpx

- `extensions/acpx/src/runtime.ts` pode ser dividido em:
- execução/supervisão de processo
- análise/normalização de eventos ndjson
- superfície de API de runtime (`submit`, `cancel`, `close`, etc.)
- melhora a testabilidade e facilita a auditoria do comportamento do backend
