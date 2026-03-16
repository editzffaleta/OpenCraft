---
summary: "Plano de refatoração do santo graal para um pipeline de streaming de runtime unificado entre main, subagent e ACP"
owner: "onutc"
status: "draft"
last_updated: "2026-02-25"
title: "Plano de Refatoração de Streaming Unificado de Runtime"
---

# Plano de Refatoração de Streaming Unificado de Runtime

## Objetivo

Entregar um pipeline de streaming compartilhado único para `main`, `subagent` e `acp`, de modo que todos os runtimes obtenham comportamento idêntico de coalescência, chunking, ordenação de entrega e recuperação de falhas.

## Por Que Existe

- O comportamento atual está dividido entre múltiplos caminhos de formatação específicos por runtime.
- Bugs de formatação/coalescência podem ser corrigidos em um caminho, mas permanecem em outros.
- Consistência de entrega, supressão de duplicatas e semântica de recuperação são mais difíceis de raciocinar.

## Arquitetura Alvo

Pipeline único, adaptadores específicos por runtime:

1. Adaptadores de runtime emitem apenas eventos canônicos.
2. Montador de stream compartilhado coalece e finaliza eventos de texto/ferramenta/status.
3. Projetor de canal compartilhado aplica chunking/formatação específica do canal uma vez.
4. Livro-razão de entrega compartilhado impõe semântica de envio/replay idempotente.
5. Adaptador de canal de saída executa envios e registra checkpoints de entrega.

Contrato de evento canônico:

- `turn_started`
- `text_delta`
- `block_final`
- `tool_started`
- `tool_finished`
- `status`
- `turn_completed`
- `turn_failed`
- `turn_cancelled`

## Fluxos de Trabalho

### 1) Contrato de streaming canônico

- Definir esquema de evento estrito + validação no núcleo.
- Adicionar testes de contrato de adaptador para garantir que cada runtime emita eventos compatíveis.
- Rejeitar eventos de runtime malformados cedo e fornecer diagnósticos estruturados.

### 2) Processador de stream compartilhado

- Substituir lógica de coalescedor/projetor específica por runtime com um único processador.
- O processador possui buffering de delta de texto, flush ocioso, divisão de chunk máximo e flush de conclusão.
- Mover resolução de configuração ACP/main/subagent para um único helper para evitar divergência.

### 3) Projeção de canal compartilhada

- Manter adaptadores de canal simples: aceitar blocos finalizados e enviar.
- Mover peculiaridades de chunking específicas do Discord apenas para o projetor de canal.
- Manter o pipeline agnóstico ao canal antes da projeção.

### 4) Livro-razão de entrega + replay

- Adicionar IDs de entrega por turno/por chunk.
- Registrar checkpoints antes e depois do envio físico.
- Na reinicialização, replay de chunks pendentes de forma idempotente e evitar duplicatas.

### 5) Migração e transição

- Fase 1: modo shadow (novo pipeline calcula saída mas caminho antigo envia; comparar).
- Fase 2: transição runtime por runtime (`acp`, depois `subagent`, depois `main` ou ordem inversa por risco).
- Fase 3: excluir código de streaming legado específico por runtime.

## Não-Objetivos

- Nenhuma mudança no modelo de política/permissões do ACP nesta refatoração.
- Nenhuma expansão de recurso específico de canal fora de correções de compatibilidade de projeção.
- Nenhum redesenho de transporte/backend (contrato de plugin acpx permanece como está, a menos que necessário para paridade de eventos).

## Riscos e Mitigações

- Risco: regressões comportamentais em caminhos existentes de main/subagent.
  Mitigação: diffing em modo shadow + testes de contrato de adaptador + testes e2e de canal.
- Risco: envios duplicados durante recuperação de falha.
  Mitigação: IDs de entrega duráveis + replay idempotente no adaptador de entrega.
- Risco: adaptadores de runtime divergem novamente.
  Mitigação: suite de testes de contrato compartilhado obrigatório para todos os adaptadores.

## Critérios de Aceitação

- Todos os runtimes passam nos testes de contrato de streaming compartilhado.
- Discord ACP/main/subagent produzem comportamento equivalente de espaçamento/chunking para pequenos deltas.
- Replay de falha/reinicialização não envia chunk duplicado para o mesmo ID de entrega.
- Caminho legado de projetor/coalescedor ACP é removido.
- Resolução de configuração de streaming é compartilhada e independente de runtime.
