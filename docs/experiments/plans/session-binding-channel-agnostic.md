---
summary: "Arquitetura de vinculação de sessão agnóstica de canal e escopo de entrega da iteração 1"
read_when:
  - Refatorando roteamento de sessão agnóstico de canal e vinculações
  - Investigando entrega de sessão duplicada, obsoleta ou ausente entre canais
owner: "onutc"
status: "in-progress"
last_updated: "2026-02-21"
title: "Session Binding Channel Agnostic Plan"
---

# Plano de Vinculação de Sessão Agnóstico de Canal

## Visão Geral

Este documento define o modelo de vinculação de sessão agnóstico de canal de longo prazo e o escopo concreto para a próxima iteração de implementação.

Objetivo:

- tornar roteamento de sessão vinculado a subagente uma capacidade do core
- manter comportamento específico de canal nos adaptadores
- evitar regressões no comportamento normal do Discord

## Por que isso existe

Comportamento atual mistura:

- política de conteúdo de conclusão
- política de roteamento de destino
- detalhes específicos do Discord

Isso causou edge cases como:

- entrega duplicada principal e thread sob execuções concorrentes
- uso de Token obsoleto em managers de vinculação reutilizados
- contabilidade de atividade ausente para envios via Webhook

## Escopo da Iteração 1

Esta iteração é intencionalmente limitada.

### 1. Adicionar interfaces core agnósticas de canal

Adicionar tipos e interfaces de serviço core para vinculações e roteamento.

Tipos core propostos:

```ts
export type BindingTargetKind = "subagent" | "session";
export type BindingStatus = "active" | "ending" | "ended";

export type ConversationRef = {
  channel: string;
  accountId: string;
  conversationId: string;
  parentConversationId?: string;
};

export type SessionBindingRecord = {
  bindingId: string;
  targetSessionKey: string;
  targetKind: BindingTargetKind;
  conversation: ConversationRef;
  status: BindingStatus;
  boundAt: number;
  expiresAt?: number;
  metadata?: Record<string, unknown>;
};
```

Contrato de serviço core:

```ts
export interface SessionBindingService {
  bind(input: {
    targetSessionKey: string;
    targetKind: BindingTargetKind;
    conversation: ConversationRef;
    metadata?: Record<string, unknown>;
    ttlMs?: number;
  }): Promise<SessionBindingRecord>;

  listBySession(targetSessionKey: string): SessionBindingRecord[];
  resolveByConversation(ref: ConversationRef): SessionBindingRecord | null;
  touch(bindingId: string, at?: number): void;
  unbind(input: {
    bindingId?: string;
    targetSessionKey?: string;
    reason: string;
  }): Promise<SessionBindingRecord[]>;
}
```

### 2. Adicionar um roteador de entrega core para conclusões de subagente

Adicionar um caminho único de resolução de destino para eventos de conclusão.

Contrato do roteador:

```ts
export interface BoundDeliveryRouter {
  resolveDestination(input: {
    eventKind: "task_completion";
    targetSessionKey: string;
    requester?: ConversationRef;
    failClosed: boolean;
  }): {
    binding: SessionBindingRecord | null;
    mode: "bound" | "fallback";
    reason: string;
  };
}
```

Para esta iteração:

- somente `task_completion` é roteado por este novo caminho
- caminhos existentes para outros tipos de evento permanecem como estão

### 3. Manter Discord como adaptador

Discord permanece como a primeira implementação de adaptador.

Responsabilidades do adaptador:

- criar/reusar conversas de thread
- enviar mensagens vinculadas via Webhook ou envio de canal
- validar estado da thread (arquivada/deletada)
- mapear metadados do adaptador (identidade de Webhook, IDs de thread)

### 4. Corrigir problemas de correção atualmente conhecidos

Obrigatório nesta iteração:

- atualizar uso de Token ao reusar manager de vinculação de thread existente
- registrar atividade de saída para envios baseados em Webhook do Discord
- parar fallback implícito para canal principal quando um destino de thread vinculado é selecionado para conclusão em modo sessão

### 5. Preservar padrões de segurança de runtime atuais

Nenhuma mudança de comportamento para usuários com spawn vinculado a thread desabilitado.

Padrões permanecem:

- `channels.discord.threadBindings.spawnSubagentSessions = false`

Resultado:

- usuários normais do Discord ficam no comportamento atual
- novo caminho core afeta somente roteamento de conclusão de sessão vinculada onde habilitado

## Fora da iteração 1

Explicitamente adiado:

- alvos de vinculação ACP (`targetKind: "acp"`)
- novos adaptadores de canal além do Discord
- substituição global de todos os caminhos de entrega (`spawn_ack`, futuro `subagent_message`)
- mudanças a nível de protocolo
- redesign de migração/versionamento de armazenamento para toda persistência de vinculação

Notas sobre ACP:

- design de interface mantém espaço para ACP
- implementação ACP não é iniciada nesta iteração

## Invariantes de roteamento

Estas invariantes são obrigatórias para a iteração 1.

- seleção de destino e geração de conteúdo são passos separados
- se conclusão em modo sessão resolve para um destino vinculado ativo, entrega deve direcionar aquele destino
- nenhum reroteamento oculto de destino vinculado para canal principal
- comportamento de fallback deve ser explícito e observável

## Compatibilidade e rollout

Alvo de compatibilidade:

- nenhuma regressão para usuários com spawn vinculado a thread desligado
- nenhuma mudança para canais não-Discord nesta iteração

Rollout:

1. Entregar interfaces e roteador atrás dos portões de funcionalidade atuais.
2. Rotear entregas vinculadas de modo conclusão do Discord através do roteador.
3. Manter caminho legado para fluxos não vinculados.
4. Verificar com testes direcionados e logs de runtime canary.

## Testes obrigatórios na iteração 1

Cobertura unitária e de integração obrigatória:

- rotação de Token do manager usa Token mais recente após reuso do manager
- envios via Webhook atualizam timestamps de atividade do canal
- duas sessões vinculadas ativas no mesmo canal solicitante não duplicam para canal principal
- conclusão para execução em modo sessão vinculado resolve somente para destino de thread
- flag de spawn desabilitado mantém comportamento legado inalterado

## Arquivos de implementação propostos

Core:

- `src/infra/outbound/session-binding-service.ts` (novo)
- `src/infra/outbound/bound-delivery-router.ts` (novo)
- `src/agents/subagent-announce.ts` (integração de resolução de destino de conclusão)

Adaptador e runtime Discord:

- `src/discord/monitor/thread-bindings.manager.ts`
- `src/discord/monitor/reply-delivery.ts`
- `src/discord/send.outbound.ts`

Testes:

- `src/discord/monitor/provider*.test.ts`
- `src/discord/monitor/reply-delivery.test.ts`
- `src/agents/subagent-announce.format.test.ts`

## Critérios de conclusão da iteração 1

- interfaces core existem e estão conectadas para roteamento de conclusão
- correções acima estão mescladas com testes
- nenhuma entrega de conclusão duplicada principal e thread em execuções vinculadas em modo sessão
- nenhuma mudança de comportamento para deploys com spawn vinculado desabilitado
- ACP permanece explicitamente adiado
