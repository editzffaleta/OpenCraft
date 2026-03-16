---
summary: "Referência: regras de sanitização e reparo de transcript específicas por provedor"
read_when:
  - Você está depurando rejeições de requisição de provedor relacionadas ao formato do transcript
  - Você está alterando a sanitização de transcript ou lógica de reparo de tool-call
  - Você está investigando incompatibilidades de id de tool-call entre provedores
title: "Higiene de Transcript"
---

# Higiene de Transcript (Correções por Provedor)

Este documento descreve **correções específicas por provedor** aplicadas a transcritos antes de uma execução
(construção do contexto do modelo). Esses são ajustes **em memória** usados para satisfazer requisitos
estritos do provedor. Esses passos de higiene **não** reescrevem o transcript JSONL armazenado
no disco; porém, um passo separado de reparo de arquivo de sessão pode reescrever arquivos JSONL malformados
descartando linhas inválidas antes de a sessão ser carregada. Quando um reparo ocorre, o arquivo
original é arquivado junto ao arquivo de sessão.

O escopo inclui:

- Sanitização de id de tool call
- Validação de entrada de tool call
- Reparo de pareamento de resultado de tool
- Validação de turno / ordenação
- Limpeza de assinatura de pensamento
- Sanitização de payload de imagem
- Marcação de proveniência de entrada do usuário (para prompts roteados entre sessões)

Se você precisar de detalhes de armazenamento de transcript, veja:

- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## Onde isso roda

Toda a higiene de transcript é centralizada no runner embutido:

- Seleção de política: `src/agents/transcript-policy.ts`
- Aplicação de sanitização/reparo: `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/google.ts`

A política usa `provider`, `modelApi` e `modelId` para decidir o que aplicar.

Separado da higiene de transcript, os arquivos de sessão são reparados (se necessário) antes do carregamento:

- `repairSessionFileIfNeeded` em `src/agents/session-file-repair.ts`
- Chamado de `run/attempt.ts` e `compact.ts` (runner embutido)

---

## Regra global: sanitização de imagem

Payloads de imagem são sempre sanitizados para evitar rejeição do lado do provedor por limites de tamanho
(reduzir/recomprimir imagens base64 muito grandes).

Isso também ajuda a controlar a pressão de tokens gerada por imagens para modelos com capacidade de visão.
Dimensões máximas menores geralmente reduzem o uso de tokens; dimensões maiores preservam mais detalhes.

Implementação:

- `sanitizeSessionMessagesImages` em `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` em `src/agents/tool-images.ts`
- O lado máximo de imagem é configurável via `agents.defaults.imageMaxDimensionPx` (padrão: `1200`).

---

## Regra global: tool calls malformadas

Blocos de tool-call do assistente que estão sem `input` e `arguments` são descartados
antes do contexto do modelo ser construído. Isso evita rejeições do provedor por tool
calls parcialmente persistidas (por exemplo, após uma falha de limite de taxa).

Implementação:

- `sanitizeToolCallInputs` em `src/agents/session-transcript-repair.ts`
- Aplicado em `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/google.ts`

---

## Regra global: proveniência de entrada entre sessões

Quando um agente envia um prompt para outra sessão via `sessions_send` (incluindo
passos de resposta/anúncio agente-para-agente), o OpenCraft persiste o turno de usuário criado com:

- `message.provenance.kind = "inter_session"`

Esses metadados são escritos no momento do append do transcript e não mudam o papel
(`role: "user"` permanece para compatibilidade com o provedor). Os leitores de transcript podem usar
isso para evitar tratar prompts internos roteados como instruções de autoria do usuário final.

Durante a reconstrução do contexto, o OpenCraft também prepend um marcador curto `[Inter-session message]`
nesses turnos de usuário em memória para que o modelo possa distingui-los de
instruções externas do usuário final.

---

## Matriz de provedores (comportamento atual)

**OpenAI / OpenAI Codex**

- Somente sanitização de imagem.
- Descartar assinaturas de raciocínio órfãs (itens de raciocínio autônomos sem um bloco de conteúdo subsequente) para transcritos OpenAI Responses/Codex.
- Sem sanitização de id de tool call.
- Sem reparo de pareamento de resultado de tool.
- Sem validação de turno ou reordenação.
- Sem resultados de tool sintéticos.
- Sem remoção de assinatura de pensamento.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitização de id de tool call: alfanumérico estrito.
- Reparo de pareamento de resultado de tool e resultados de tool sintéticos.
- Validação de turno (alternação de turno no estilo Gemini).
- Correção de ordenação de turno do Google (prepend um pequeno bootstrap de usuário se o histórico começar com assistente).
- Antigravity Claude: normalizar assinaturas de pensamento; descartar blocos de pensamento não assinados.

**Anthropic / Minimax (compatível com Anthropic)**

- Reparo de pareamento de resultado de tool e resultados de tool sintéticos.
- Validação de turno (mesclar turnos de usuário consecutivos para satisfazer alternação estrita).

**Mistral (incluindo detecção baseada em model-id)**

- Sanitização de id de tool call: strict9 (alfanumérico comprimento 9).

**OpenRouter Gemini**

- Limpeza de assinatura de pensamento: remover valores `thought_signature` não-base64 (manter base64).

**Todo o resto**

- Somente sanitização de imagem.

---

## Comportamento histórico (pré-2026.1.22)

Antes do release 2026.1.22, o OpenCraft aplicava múltiplas camadas de higiene de transcript:

- Uma **extensão transcript-sanitize** rodava em cada construção de contexto e podia:
  - Reparar pareamento de uso/resultado de tool.
  - Sanitizar ids de tool call (incluindo um modo não-estrito que preservava `_`/`-`).
- O runner também realizava sanitização específica do provedor, o que duplicava trabalho.
- Mutações adicionais ocorriam fora da política do provedor, incluindo:
  - Remoção de tags `<final>` do texto do assistente antes da persistência.
  - Descarte de turnos de erro de assistente vazios.
  - Corte de conteúdo do assistente após tool calls.

Essa complexidade causou regressões entre provedores (notavelmente o pareamento `call_id|fc_id` do `openai-responses`). A limpeza do 2026.1.22 removeu a extensão, centralizou a lógica no runner, e tornou o OpenAI **sem toque** além da sanitização de imagem.
