---
summary: "Arquitetura de vinculação de sessão agnóstica ao canal e escopo de entrega da iteração 1"
read_when:
  - Refatorando roteamento de sessão agnóstico ao canal e vinculações
  - Investigando entrega de sessão duplicada, obsoleta ou ausente entre canais
owner: "onutc"
status: "in-progress"
last_updated: "2026-02-21"
title: "Plano de Vinculação de Sessão Agnóstica ao Canal"
---

# Plano de Vinculação de Sessão Agnóstica ao Canal

## Visão Geral

Este documento define o modelo de vinculação de sessão agnóstica ao canal de longo prazo e o escopo concreto para a próxima iteração de implementação.

Objetivo:

- tornar o roteamento de sessão vinculada a subagente uma capacidade central
- manter comportamento específico de canal nos adaptadores
- evitar regressões no comportamento normal do Discord

## Por Que Existe

O comportamento atual mistura:

- política de conteúdo de conclusão
- política de roteamento de destino
- detalhes específicos do Discord

Isso causou casos extremos como:

- entrega duplicada para canal principal e thread em execuções concorrentes
- uso de token obsoleto em gerenciadores de vinculação reutilizados
- contabilidade de atividade ausente para envios via webhook

## Escopo da Iteração 1

Esta iteração é intencionalmente limitada.

### 1. Adicionar interfaces centrais agnósticas ao canal

Adicionar tipos centrais e interfaces de serviço para vinculações e roteamento.

Tipos centrais propostos:

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

Contrato de serviço central:

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

### 2. Adicionar um roteador central de entrega para conclusões de subagente

Adicionar um único caminho de resolução de destino para eventos de conclusão.

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

- apenas `task_completion` é roteado por este novo caminho
- caminhos existentes para outros tipos de evento permanecem como estão

### 3. Manter Discord como adaptador

O Discord permanece como primeira implementação de adaptador.

Responsabilidades do adaptador:

- criar/reutilizar conversas de thread
- enviar mensagens vinculadas via webhook ou envio de canal
- validar estado de thread (arquivado/excluído)
- mapear metadados do adaptador (identidade de webhook, IDs de thread)

### 4. Corrigir problemas de corretude conhecidos atualmente

Necessário nesta iteração:

- atualizar uso de token ao reutilizar gerenciador de vinculação de thread existente
- registrar atividade de saída para envios Discord baseados em webhook
- parar fallback implícito para canal principal quando um destino de thread vinculado é selecionado para conclusão em modo sessão

### 5. Preservar padrões de segurança de runtime atuais

Sem mudança de comportamento para usuários com spawn vinculado a thread desabilitado.

Padrões permanecem:

- `channels.discord.threadBindings.spawnSubagentSessions = false`

Resultado:

- usuários normais do Discord ficam no comportamento atual
- novo caminho central afeta apenas roteamento de conclusão de sessão vinculada onde habilitado

## Não Incluído na Iteração 1

Explicitamente adiado:

- alvos de vinculação ACP (`targetKind: "acp"`)
- novos adaptadores de canal além do Discord
- substituição global de todos os caminhos de entrega (`spawn_ack`, futuro `subagent_message`)
- mudanças de nível de protocolo
- redesenho de migração/versionamento de armazenamento para toda a persistência de vinculação

Notas sobre ACP:

- o design de interface mantém espaço para ACP
- a implementação ACP não é iniciada nesta iteração

## Invariantes de Roteamento

Estes invariantes são obrigatórios para a iteração 1.

- seleção de destino e geração de conteúdo são etapas separadas
- se a conclusão em modo sessão resolver para um destino vinculado ativo, a entrega deve ter como alvo esse destino
- nenhum redirecionamento oculto de destino vinculado para o canal principal
- comportamento de fallback deve ser explícito e observável

## Compatibilidade e Implantação

Alvo de compatibilidade:

- sem regressão para usuários com spawn vinculado a thread desativado
- sem mudança para canais não Discord nesta iteração

Implantação:

1. Disponibilizar interfaces e roteador atrás dos portões de recurso atuais.
2. Rotear entregas de modo vinculado de conclusão Discord pelo roteador.
3. Manter caminho legado para fluxos não vinculados.
4. Verificar com testes direcionados e logs de runtime canário.

## Testes Necessários na Iteração 1

Cobertura de unidade e integração necessária:

- rotação de token do gerenciador usa token mais recente após reutilização do gerenciador
- envios de webhook atualizam timestamps de atividade do canal
- duas sessões vinculadas ativas no mesmo canal de solicitante não duplicam para o canal principal
- conclusão para execução em modo sessão vinculada resolve apenas para destino de thread
- flag de spawn desabilitado mantém comportamento legado inalterado

## Arquivos de Implementação Propostos

Central:

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

## Critérios de Conclusão para a Iteração 1

- interfaces centrais existem e estão conectadas para roteamento de conclusão
- correções de corretude acima foram integradas com testes
- sem entrega de conclusão duplicada para canal principal e thread em execuções em modo sessão vinculada
- sem mudança de comportamento para implantações com spawn vinculado desabilitado
- ACP permanece explicitamente adiado
