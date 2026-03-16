---
summary: "Plano: Adicionar endpoint /v1/responses do OpenResponses e descontinuar chat completions de forma limpa"
read_when:
  - Projetando ou implementando suporte ao gateway `/v1/responses`
  - Planejando migração da compatibilidade com Chat Completions
owner: "opencraft"
status: "draft"
last_updated: "2026-01-19"
title: "Plano Gateway OpenResponses"
---

# Plano de Integração do Gateway OpenResponses

## Contexto

O Gateway OpenCraft atualmente expõe um endpoint mínimo de Chat Completions compatível com OpenAI em
`/v1/chat/completions` (veja [API HTTP OpenAI](/gateway/openai-http-api)).

Open Responses é um padrão de inferência aberto baseado na API Responses do OpenAI. Ele é projetado
para fluxos de trabalho agênticos e usa entradas baseadas em itens mais eventos de streaming semântico. A
especificação OpenResponses define `/v1/responses`, não `/v1/chat/completions`.

## Objetivos

- Adicionar um endpoint `/v1/responses` que adere à semântica do OpenResponses.
- Manter Chat Completions como uma camada de compatibilidade fácil de desabilitar e eventualmente remover.
- Padronizar validação e parsing com esquemas isolados e reutilizáveis.

## Não-Objetivos

- Paridade completa de recursos OpenResponses na primeira passagem (imagens, arquivos, ferramentas hospedadas).
- Substituição da lógica interna de execução do agente ou orquestração de ferramentas.
- Mudança do comportamento existente de `/v1/chat/completions` durante a primeira fase.

## Resumo de Pesquisa

Fontes: OpenAPI do OpenResponses, site de especificação do OpenResponses e post do blog do Hugging Face.

Pontos-chave extraídos:

- `POST /v1/responses` aceita campos `CreateResponseBody` como `model`, `input` (string ou
  `ItemParam[]`), `instructions`, `tools`, `tool_choice`, `stream`, `max_output_tokens` e
  `max_tool_calls`.
- `ItemParam` é uma union discriminada de:
  - itens `message` com roles `system`, `developer`, `user`, `assistant`
  - `function_call` e `function_call_output`
  - `reasoning`
  - `item_reference`
- Respostas bem-sucedidas retornam um `ResponseResource` com `object: "response"`, `status` e
  itens de `output`.
- Streaming usa eventos semânticos como:
  - `response.created`, `response.in_progress`, `response.completed`, `response.failed`
  - `response.output_item.added`, `response.output_item.done`
  - `response.content_part.added`, `response.content_part.done`
  - `response.output_text.delta`, `response.output_text.done`
- A especificação requer:
  - `Content-Type: text/event-stream`
  - `event:` deve corresponder ao campo `type` do JSON
  - evento terminal deve ser o literal `[DONE]`
- Itens de reasoning podem expor `content`, `encrypted_content` e `summary`.
- Exemplos do HF incluem `OpenResponses-Version: latest` nas requisições (header opcional).

## Arquitetura Proposta

- Adicionar `src/gateway/open-responses.schema.ts` contendo apenas esquemas Zod (sem importações de gateway).
- Adicionar `src/gateway/openresponses-http.ts` (ou `open-responses-http.ts`) para `/v1/responses`.
- Manter `src/gateway/openai-http.ts` intacto como adaptador de compatibilidade legado.
- Adicionar configuração `gateway.http.endpoints.responses.enabled` (padrão `false`).
- Manter `gateway.http.endpoints.chatCompletions.enabled` independente; permitir que ambos os endpoints sejam
  alternados separadamente.
- Emitir aviso na inicialização quando Chat Completions estiver habilitado para sinalizar status legado.

## Caminho de Descontinuação para Chat Completions

- Manter limites estritos de módulo: sem tipos de esquema compartilhados entre responses e chat completions.
- Tornar Chat Completions opt-in por configuração para que possa ser desabilitado sem mudanças de código.
- Atualizar docs para rotular Chat Completions como legado assim que `/v1/responses` estiver estável.
- Etapa futura opcional: mapear requisições de Chat Completions para o handler Responses para um caminho de
  remoção mais simples.

## Subconjunto Suportado na Fase 1

- Aceitar `input` como string ou `ItemParam[]` com roles de mensagem e `function_call_output`.
- Extrair mensagens de system e developer para `extraSystemPrompt`.
- Usar a mensagem mais recente `user` ou `function_call_output` como mensagem atual para execuções do agente.
- Rejeitar partes de conteúdo não suportadas (imagem/arquivo) com `invalid_request_error`.
- Retornar uma única mensagem de assistant com conteúdo `output_text`.
- Retornar `usage` com valores zerados até que a contabilização de tokens seja conectada.

## Estratégia de Validação (Sem SDK)

- Implementar esquemas Zod para o subconjunto suportado de:
  - `CreateResponseBody`
  - Unions de `ItemParam` + partes de conteúdo de mensagem
  - `ResponseResource`
  - Formatos de eventos de streaming usados pelo gateway
- Manter esquemas em um único módulo isolado para evitar divergência e permitir futura geração de código.

## Implementação de Streaming (Fase 1)

- Linhas SSE com `event:` e `data:`.
- Sequência necessária (mínimo viável):
  - `response.created`
  - `response.output_item.added`
  - `response.content_part.added`
  - `response.output_text.delta` (repetir conforme necessário)
  - `response.output_text.done`
  - `response.content_part.done`
  - `response.completed`
  - `[DONE]`

## Plano de Testes e Verificação

- Adicionar cobertura e2e para `/v1/responses`:
  - Autenticação necessária
  - Formato de resposta não-stream
  - Ordenação de eventos de stream e `[DONE]`
  - Roteamento de sessão com headers e `user`
- Manter `src/gateway/openai-http.test.ts` inalterado.
- Manual: curl para `/v1/responses` com `stream: true` e verificar ordenação de eventos e
  `[DONE]` terminal.

## Atualizações de Documentação (Acompanhamento)

- Adicionar uma nova página de docs para uso e exemplos de `/v1/responses`.
- Atualizar `/gateway/openai-http-api` com uma nota de legado e ponteiro para `/v1/responses`.
