---
summary: "Plano de refatoração holy grail para um pipeline de streaming de runtime unificado para main, subagent e ACP"
owner: "onutc"
status: "draft"
last_updated: "2026-02-25"
title: "Unified Runtime Streaming Refactor Plan"
---

# Plano de Refatoração Unificada de Streaming de Runtime

## Objetivo

Entregar um pipeline de streaming compartilhado para `main`, `subagent` e `acp` para que todos os runtimes obtenham comportamento idêntico de coalescência, chunking, ordenação de entrega e recuperação de crash.

## Por que isso existe

- O comportamento atual está dividido em múltiplos caminhos de formatação específicos de runtime.
- Bugs de formatação/coalescência podem ser corrigidos em um caminho mas permanecer em outros.
- Consistência de entrega, supressão de duplicatas e semânticas de recuperação são mais difíceis de raciocinar.

## Arquitetura alvo

Pipeline único, adaptadores específicos de runtime:

1. Adaptadores de runtime emitem somente eventos canônicos.
2. Montador de stream compartilhado coalece e finaliza eventos de texto/ferramenta/status.
3. Projetor de canal compartilhado aplica chunking/formatação específica do canal uma vez.
4. Ledger de entrega compartilhado impõe semânticas de envio/replay idempotentes.
5. Adaptador de canal de saída executa envios e registra checkpoints de entrega.

Contrato canônico de eventos:

- `turn_started`
- `text_delta`
- `block_final`
- `tool_started`
- `tool_finished`
- `status`
- `turn_completed`
- `turn_failed`
- `turn_cancelled`

## Frentes de trabalho

### 1) Contrato canônico de streaming

- Definir esquema estrito de eventos + validação no core.
- Adicionar testes de contrato de adaptador para garantir que cada runtime emita eventos compatíveis.
- Rejeitar eventos de runtime malformados cedo e exibir diagnósticos estruturados.

### 2) Processador de stream compartilhado

- Substituir lógica de coalescedor/projetor específica de runtime com um processador.
- O processador é dono do buffer de deltas de texto, flush por ociosidade, divisão de chunk máximo e flush de conclusão.
- Mover resolução de configuração de ACP/main/subagent para um helper para prevenir divergência.

### 3) Projeção de canal compartilhada

- Manter adaptadores de canal simples: aceitar blocos finalizados e enviar.
- Mover peculiaridades de chunking específicas do Discord para somente o projetor de canal.
- Manter o pipeline agnóstico de canal antes da projeção.

### 4) Ledger de entrega + replay

- Adicionar IDs de entrega por turno/por chunk.
- Registrar checkpoints antes e depois do envio físico.
- No restart, reproduzir chunks pendentes idempotentemente e evitar duplicatas.

### 5) Migração e cutover

- Fase 1: modo shadow (novo pipeline computa saída mas caminho antigo envia; comparar).
- Fase 2: cutover runtime por runtime (`acp`, depois `subagent`, depois `main` ou inverso por risco).
- Fase 3: deletar código legado de streaming específico de runtime.

## Não-objetivos

- Nenhuma mudança no modelo de política/permissões ACP nesta refatoração.
- Nenhuma expansão de funcionalidade específica de canal fora de correções de compatibilidade de projeção.
- Nenhum redesign de transporte/backend (contrato de Plugin acpx permanece como está a menos que necessário para paridade de eventos).

## Riscos e mitigações

- Risco: regressões comportamentais em caminhos existentes de main/subagent.
  Mitigação: diff em modo shadow + testes de contrato de adaptador + testes e2e de canal.
- Risco: envios duplicados durante recuperação de crash.
  Mitigação: IDs de entrega duráveis + replay idempotente no adaptador de entrega.
- Risco: adaptadores de runtime divergem novamente.
  Mitigação: suíte obrigatória de testes de contrato compartilhado para todos os adaptadores.

## Critérios de aceitação

- Todos os runtimes passam nos testes de contrato de streaming compartilhado.
- ACP/main/subagent no Discord produzem comportamento equivalente de espaçamento/chunking para deltas pequenos.
- Replay de crash/restart não envia chunk duplicado para o mesmo ID de entrega.
- Caminho legado de projetor/coalescedor ACP é removido.
- Resolução de configuração de streaming é compartilhada e independente de runtime.
