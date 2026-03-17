---
summary: "Referência: regras de sanitização e reparo de transcrição específicas por provedor"
read_when:
  - Você está depurando rejeições de requisições do provedor ligadas ao formato da transcrição
  - Você está alterando lógica de sanitização de transcrição ou reparo de chamadas de ferramentas
  - Você está investigando incompatibilidades de id de chamadas de ferramentas entre provedores
title: "Higiene de Transcrição"
---

# Higiene de Transcrição (Correções por Provedor)

Este documento descreve **correções específicas por provedor** aplicadas às transcrições antes de uma execução
(construção do contexto do modelo). Estes são ajustes **em memória** usados para satisfazer requisitos
estritos do provedor. Estas etapas de higiene **não** reescrevem a transcrição JSONL armazenada
em disco; porém, uma passagem separada de reparo de arquivo de sessão pode reescrever arquivos JSONL malformados
removendo linhas inválidas antes da sessão ser carregada. Quando um reparo ocorre, o arquivo
original é salvo como backup junto ao arquivo de sessão.

O escopo inclui:

- Sanitização de id de chamada de ferramenta
- Validação de entrada de chamada de ferramenta
- Reparo de pareamento de resultado de ferramenta
- Validação / ordenação de turnos
- Limpeza de assinatura de pensamento
- Sanitização de payload de imagem
- Marcação de proveniência de entrada de usuário (para prompts roteados entre sessões)

Se você precisa de detalhes de armazenamento de transcrição, veja:

- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## Onde isso executa

Toda a higiene de transcrição está centralizada no runner embutido:

- Seleção de política: `src/agents/transcript-policy.ts`
- Aplicação de sanitização/reparo: `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/google.ts`

A política usa `provider`, `modelApi` e `modelId` para decidir o que aplicar.

Separado da higiene de transcrição, arquivos de sessão são reparados (se necessário) antes do carregamento:

- `repairSessionFileIfNeeded` em `src/agents/session-file-repair.ts`
- Chamado de `run/attempt.ts` e `compact.ts` (runner embutido)

---

## Regra global: sanitização de imagem

Payloads de imagem são sempre sanitizados para prevenir rejeição do lado do provedor devido a limites
de tamanho (redução de escala/recompressão de imagens base64 superdimensionadas).

Isso também ajuda a controlar a pressão de tokens causada por imagens para modelos com capacidade de visão.
Dimensões máximas menores geralmente reduzem o uso de tokens; dimensões maiores preservam detalhes.

Implementação:

- `sanitizeSessionMessagesImages` em `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` em `src/agents/tool-images.ts`
- Lado máximo da imagem é configurável via `agents.defaults.imageMaxDimensionPx` (padrão: `1200`).

---

## Regra global: chamadas de ferramenta malformadas

Blocos de chamada de ferramenta do assistente que estão faltando tanto `input` quanto `arguments` são descartados
antes do contexto do modelo ser construído. Isso previne rejeições do provedor de chamadas de ferramenta
parcialmente persistidas (por exemplo, após uma falha de rate limit).

Implementação:

- `sanitizeToolCallInputs` em `src/agents/session-transcript-repair.ts`
- Aplicado em `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/google.ts`

---

## Regra global: proveniência de entrada entre sessões

Quando um agente envia um prompt para outra sessão via `sessions_send` (incluindo
etapas de reply/announce agente-para-agente), o OpenCraft persiste o turno de usuário criado com:

- `message.provenance.kind = "inter_session"`

Estes metadados são escritos no momento de append da transcrição e não alteram a role
(`role: "user"` permanece para compatibilidade com o provedor). Leitores de transcrição podem usar
isso para evitar tratar prompts internos roteados como instruções autoradas pelo usuário final.

Durante a reconstrução de contexto, o OpenCraft também prepende um breve marcador `[Inter-session message]`
a esses turnos de usuário em memória para que o modelo possa distingui-los de
instruções de usuário final externo.

---

## Matriz de provedores (comportamento atual)

**OpenAI / OpenAI Codex**

- Apenas sanitização de imagem.
- Descarta assinaturas de raciocínio órfãs (itens de raciocínio independentes sem bloco de conteúdo seguinte) para transcrições OpenAI Responses/Codex.
- Sem sanitização de id de chamada de ferramenta.
- Sem reparo de pareamento de resultado de ferramenta.
- Sem validação ou reordenação de turnos.
- Sem resultados sintéticos de ferramenta.
- Sem remoção de assinatura de pensamento.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitização de id de chamada de ferramenta: alfanumérico estrito.
- Reparo de pareamento de resultado de ferramenta e resultados sintéticos de ferramenta.
- Validação de turnos (alternação de turnos estilo Gemini).
- Correção de ordenação de turnos Google (prepend um pequeno bootstrap de usuário se o histórico começa com assistente).
- Antigravity Claude: normalizar assinaturas de pensamento; descartar blocos de pensamento não assinados.

**Anthropic / Minimax (compatível com Anthropic)**

- Reparo de pareamento de resultado de ferramenta e resultados sintéticos de ferramenta.
- Validação de turnos (mesclar turnos consecutivos de usuário para satisfazer alternação estrita).

**Mistral (incluindo detecção baseada em model-id)**

- Sanitização de id de chamada de ferramenta: strict9 (alfanumérico comprimento 9).

**OpenRouter Gemini**

- Limpeza de assinatura de pensamento: remover valores `thought_signature` não-base64 (manter base64).

**Todos os outros**

- Apenas sanitização de imagem.

---

## Comportamento histórico (pré-2026.1.22)

Antes do lançamento 2026.1.22, o OpenCraft aplicava múltiplas camadas de higiene de transcrição:

- Uma **extensão de sanitização de transcrição** executava em cada construção de contexto e podia:
  - Reparar pareamento de tool use/result.
  - Sanitizar ids de chamada de ferramenta (incluindo um modo não estrito que preservava `_`/`-`).
- O runner também realizava sanitização específica por provedor, que duplicava trabalho.
- Mutações adicionais ocorriam fora da política de provedor, incluindo:
  - Remoção de tags `<final>` do texto do assistente antes da persistência.
  - Descarte de turnos de erro vazios do assistente.
  - Corte do conteúdo do assistente após chamadas de ferramenta.

Essa complexidade causava regressões entre provedores (notavelmente pareamento `call_id|fc_id` do
`openai-responses`). A limpeza de 2026.1.22 removeu a extensão, centralizou
a lógica no runner e tornou o OpenAI **sem toque** além da sanitização de imagem.
