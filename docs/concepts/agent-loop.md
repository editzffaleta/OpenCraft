---
summary: "Ciclo de vida do loop do agente, streams e semântica de espera"
read_when:
  - Você precisa de um passo a passo exato do loop do agente ou eventos de ciclo de vida
title: "Loop do Agente"
---

# Loop do Agente (OpenCraft)

Um loop agêntico é a execução "real" completa de um agente: intake → montagem de contexto → inferência do modelo →
execução de ferramenta → respostas em streaming → persistência. É o caminho autoritativo que transforma uma mensagem
em ações e uma resposta final, mantendo o estado da sessão consistente.

No OpenCraft, um loop é uma única execução serializada por sessão que emite eventos de ciclo de vida e stream
enquanto o modelo pensa, chama ferramentas e faz streaming de output. Este doc explica como esse loop autêntico está
conectado de ponta a ponta.

## Pontos de entrada

- Gateway RPC: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Como funciona (alto nível)

1. O RPC `agent` valida parâmetros, resolve a sessão (sessionKey/sessionId), persiste metadados da sessão, retorna `{ runId, acceptedAt }` imediatamente.
2. `agentCommand` executa o agente:
   - resolve modelo + padrões de thinking/verbose
   - carrega snapshot de skills
   - chama `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emite **lifecycle end/error** se o loop embarcado não emitir um
3. `runEmbeddedPiAgent`:
   - serializa execuções via filas por sessão + globais
   - resolve modelo + perfil de auth e constrói a sessão pi
   - assina eventos pi e faz streaming de deltas de assistente/ferramenta
   - aplica timeout -> aborta execução se excedido
   - retorna payloads + metadados de uso
4. `subscribeEmbeddedPiSession` faz bridge de eventos pi-agent-core para o stream `agent` do OpenCraft:
   - eventos de ferramenta => `stream: "tool"`
   - deltas de assistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentJob`:
   - aguarda **lifecycle end/error** para `runId`
   - retorna `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Enfileiramento + concorrência

- Execuções são serializadas por chave de sessão (lane de sessão) e opcionalmente através de uma lane global.
- Isso previne corridas de ferramenta/sessão e mantém o histórico de sessão consistente.
- Canais de mensagens podem escolher modos de fila (collect/steer/followup) que alimentam este sistema de lanes.
  Veja [Fila de Comandos](/concepts/queue).

## Preparação de sessão + workspace

- Workspace é resolvido e criado; execuções em sandbox podem redirecionar para um workspace root sandbox.
- Skills são carregados (ou reutilizados de um snapshot) e injetados em env e prompt.
- Arquivos de bootstrap/contexto são resolvidos e injetados no relatório do system prompt.
- Um lock de escrita de sessão é adquirido; `SessionManager` é aberto e preparado antes do streaming.

## Montagem de prompt + system prompt

- O system prompt é construído a partir do prompt base do OpenCraft, prompt de skills, contexto de bootstrap e overrides por execução.
- Limites específicos do modelo e tokens de reserva de compactação são aplicados.
- Veja [System prompt](/concepts/system-prompt) para o que o modelo vê.

## Pontos de hook (onde você pode interceptar)

O OpenCraft tem dois sistemas de hook:

- **Hooks internos** (hooks do Gateway): scripts orientados a eventos para comandos e eventos de ciclo de vida.
- **Hooks de plugin**: pontos de extensão dentro do ciclo de vida do agente/ferramenta e pipeline do gateway.

### Hooks internos (hooks do Gateway)

- **`agent:bootstrap`**: executa enquanto constrói arquivos de bootstrap antes do system prompt ser finalizado.
  Use isso para adicionar/remover arquivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` e outros eventos de comando (veja doc de Hooks).

Veja [Hooks](/automation/hooks) para configuração e exemplos.

### Hooks de plugin (ciclo de vida do agente + gateway)

Estes executam dentro do loop do agente ou pipeline do gateway:

- **`before_model_resolve`**: executa pré-sessão (sem `messages`) para sobrescrever deterministicamente provedor/modelo antes da resolução do modelo.
- **`before_prompt_build`**: executa após carregamento da sessão (com `messages`) para injetar `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` antes da submissão do prompt. Use `prependContext` para texto dinâmico por turno e campos de contexto de sistema para orientação estável que deve ficar no espaço do system prompt.
- **`before_agent_start`**: hook de compatibilidade legada que pode executar em qualquer fase; prefira os hooks explícitos acima.
- **`agent_end`**: inspeciona a lista de mensagens final e metadados de execução após conclusão.
- **`before_compaction` / `after_compaction`**: observa ou anota ciclos de compactação.
- **`before_tool_call` / `after_tool_call`**: intercepta parâmetros/resultados de ferramentas.
- **`tool_result_persist`**: transforma sincronamente resultados de ferramentas antes de serem escritos na transcrição da sessão.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensagem de entrada + saída.
- **`session_start` / `session_end`**: limites de ciclo de vida de sessão.
- **`gateway_start` / `gateway_stop`**: eventos de ciclo de vida do gateway.

Veja [Plugins](/tools/plugin#plugin-hooks) para a API de hook e detalhes de registro.

## Streaming + respostas parciais

- Deltas de assistente são streamados do pi-agent-core e emitidos como eventos `assistant`.
- O streaming de bloco pode emitir respostas parciais em `text_end` ou `message_end`.
- O streaming de raciocínio pode ser emitido como um stream separado ou como respostas em bloco.
- Veja [Streaming](/concepts/streaming) para comportamento de chunking e respostas em bloco.

## Execução de ferramentas + ferramentas de mensagens

- Eventos de início/atualização/fim de ferramenta são emitidos no stream `tool`.
- Resultados de ferramentas são sanitizados por tamanho e payloads de imagem antes de registrar/emitir.
- Envios de ferramentas de mensagem são rastreados para suprimir confirmações duplicadas do assistente.

## Formatação + supressão de respostas

- Payloads finais são montados a partir de:
  - texto do assistente (e raciocínio opcional)
  - sumários de ferramentas inline (quando verbose + permitido)
  - texto de erro do assistente quando o modelo erra
- `NO_REPLY` é tratado como token silencioso e filtrado dos payloads de saída.
- Duplicatas de ferramentas de mensagem são removidas da lista de payload final.
- Se nenhum payload renderizável permanecer e uma ferramenta falhou, uma resposta de erro de ferramenta fallback é emitida
  (a menos que uma ferramenta de mensagem já tenha enviado uma resposta visível ao usuário).

## Compactação + retentativas

- Auto-compactação emite eventos de stream `compaction` e pode acionar uma retentativa.
- Na retentativa, buffers em memória e sumários de ferramentas são resetados para evitar output duplicado.
- Veja [Compactação](/concepts/compaction) para o pipeline de compactação.

## Streams de eventos (hoje)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (e como fallback por `agentCommand`)
- `assistant`: deltas streamados do pi-agent-core
- `tool`: eventos de ferramentas streamados do pi-agent-core

## Tratamento de canal de chat

- Deltas de assistente são bufferizados em mensagens de chat `delta`.
- Um chat `final` é emitido em **lifecycle end/error**.

## Timeouts

- Padrão de `agent.wait`: 30s (apenas a espera). O parâmetro `timeoutMs` sobrescreve.
- Runtime do agente: padrão `agents.defaults.timeoutSeconds` 600s; aplicado no timer de aborto de `runEmbeddedPiAgent`.

## Onde as coisas podem terminar cedo

- Timeout do agente (abortar)
- AbortSignal (cancelar)
- Desconexão do gateway ou timeout de RPC
- Timeout de `agent.wait` (apenas espera, não para o agente)
