---
summary: "Ciclo de vida do loop do agente, streams e semântica de espera"
read_when:
  - Você precisa de um passo a passo exato do loop do agente ou eventos de ciclo de vida
title: "Agent Loop"
---

# Agent Loop (OpenCraft)

Um loop agentic é a execução completa "real" de um agente: entrada → montagem de contexto → inferência do modelo →
execução de ferramentas → respostas em streaming → persistência. É o caminho autoritativo que transforma uma mensagem
em ações e uma resposta final, mantendo o estado da sessão consistente.

No OpenCraft, um loop é uma execução única e serializada por sessão que emite eventos de ciclo de vida e stream
enquanto o modelo pensa, chama ferramentas e transmite a saída. Este documento explica como esse loop autêntico é
conectado de ponta a ponta.

## Pontos de entrada

- Gateway RPC: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Como funciona (visão geral)

1. O RPC `agent` valida os parâmetros, resolve a sessão (sessionKey/sessionId), persiste os metadados da sessão e retorna `{ runId, acceptedAt }` imediatamente.
2. `agentCommand` executa o agente:
   - resolve modelo + padrões de thinking/verbose
   - carrega snapshot de Skills
   - chama `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emite **lifecycle end/error** se o loop embutido não emitir um
3. `runEmbeddedPiAgent`:
   - serializa execuções via filas por sessão + globais
   - resolve modelo + perfil de autenticação e constrói a sessão pi
   - se inscreve nos eventos pi e transmite deltas de assistente/ferramenta
   - aplica timeout -> aborta a execução se excedido
   - retorna payloads + metadados de uso
4. `subscribeEmbeddedPiSession` conecta eventos do pi-agent-core ao stream `agent` do OpenCraft:
   - eventos de ferramenta => `stream: "tool"`
   - deltas do assistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentJob`:
   - aguarda **lifecycle end/error** para o `runId`
   - retorna `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Enfileiramento + concorrência

- As execuções são serializadas por chave de sessão (faixa de sessão) e opcionalmente por uma faixa global.
- Isso evita condições de corrida de ferramentas/sessão e mantém o histórico da sessão consistente.
- Os canais de mensagens podem escolher modos de fila (collect/steer/followup) que alimentam esse sistema de faixas.
  Veja [Fila de Comandos](/concepts/queue).

## Preparação de sessão + workspace

- O workspace é resolvido e criado; execuções em sandbox podem redirecionar para um workspace root em sandbox.
- Skills são carregadas (ou reutilizadas de um snapshot) e injetadas no ambiente e no prompt.
- Arquivos de bootstrap/contexto são resolvidos e injetados no relatório do prompt do sistema.
- Um lock de escrita de sessão é adquirido; o `SessionManager` é aberto e preparado antes do streaming.

## Montagem do prompt + prompt do sistema

- O prompt do sistema é construído a partir do prompt base do OpenCraft, prompt de Skills, contexto de bootstrap e sobrescritas por execução.
- Limites específicos do modelo e tokens reservados para compactação são aplicados.
- Veja [Prompt do sistema](/concepts/system-prompt) para o que o modelo vê.

## Pontos de hook (onde você pode interceptar)

O OpenCraft possui dois sistemas de hook:

- **Hooks internos** (hooks do Gateway): scripts orientados a eventos para comandos e eventos de ciclo de vida.
- **Hooks de Plugin**: pontos de extensão dentro do ciclo de vida do agente/ferramenta e do pipeline do Gateway.

### Hooks internos (hooks do Gateway)

- **`agent:bootstrap`**: executa enquanto constrói arquivos de bootstrap antes do prompt do sistema ser finalizado.
  Use isto para adicionar/remover arquivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` e outros eventos de comando (veja a documentação de Hooks).

Veja [Hooks](/automation/hooks) para configuração e exemplos.

### Hooks de Plugin (ciclo de vida do agente + Gateway)

Estes são executados dentro do loop do agente ou pipeline do Gateway:

- **`before_model_resolve`**: executa pré-sessão (sem `messages`) para sobrescrever deterministicamente provedor/modelo antes da resolução do modelo.
- **`before_prompt_build`**: executa após o carregamento da sessão (com `messages`) para injetar `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` antes do envio do prompt. Use `prependContext` para texto dinâmico por turno e campos de contexto do sistema para orientações estáveis que devem ficar no espaço do prompt do sistema.
- **`before_agent_start`**: hook de compatibilidade legado que pode executar em qualquer fase; prefira os hooks explícitos acima.
- **`agent_end`**: inspeciona a lista final de mensagens e metadados de execução após a conclusão.
- **`before_compaction` / `after_compaction`**: observa ou anota ciclos de compactação.
- **`before_tool_call` / `after_tool_call`**: intercepta parâmetros/resultados de ferramentas.
- **`tool_result_persist`**: transforma sincronamente resultados de ferramentas antes de serem escritos na transcrição da sessão.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensagem de entrada + saída.
- **`session_start` / `session_end`**: limites do ciclo de vida da sessão.
- **`gateway_start` / `gateway_stop`**: eventos de ciclo de vida do Gateway.

Veja [Plugins](/tools/plugin#plugin-hooks) para a API de hooks e detalhes de registro.

## Streaming + respostas parciais

- Deltas do assistente são transmitidos do pi-agent-core e emitidos como eventos `assistant`.
- O streaming de blocos pode emitir respostas parciais em `text_end` ou `message_end`.
- O streaming de raciocínio pode ser emitido como um stream separado ou como respostas em bloco.
- Veja [Streaming](/concepts/streaming) para comportamento de chunking e resposta em bloco.

## Execução de ferramentas + ferramentas de mensagem

- Eventos de início/atualização/fim de ferramenta são emitidos no stream `tool`.
- Resultados de ferramentas são sanitizados por tamanho e payloads de imagem antes de registrar/emitir.
- Envios de ferramentas de mensagem são rastreados para suprimir confirmações duplicadas do assistente.

## Formatação de resposta + supressão

- Payloads finais são montados a partir de:
  - texto do assistente (e raciocínio opcional)
  - resumos inline de ferramentas (quando verbose + permitido)
  - texto de erro do assistente quando o modelo apresenta erro
- `NO_REPLY` é tratado como um token silencioso e filtrado dos payloads de saída.
- Duplicatas de ferramentas de mensagem são removidas da lista final de payloads.
- Se nenhum payload renderizável permanecer e uma ferramenta apresentou erro, uma resposta de fallback de erro de ferramenta é emitida
  (a menos que uma ferramenta de mensagem já tenha enviado uma resposta visível ao usuário).

## Compactação + retentativas

- A auto-compactação emite eventos de stream `compaction` e pode acionar uma retentativa.
- Na retentativa, buffers em memória e resumos de ferramentas são resetados para evitar saída duplicada.
- Veja [Compactação](/concepts/compaction) para o pipeline de compactação.

## Streams de eventos (atual)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (e como fallback por `agentCommand`)
- `assistant`: deltas transmitidos do pi-agent-core
- `tool`: eventos de ferramentas transmitidos do pi-agent-core

## Tratamento do canal de chat

- Deltas do assistente são acumulados em mensagens `delta` de chat.
- Um `final` de chat é emitido no **lifecycle end/error**.

## Timeouts

- `agent.wait` padrão: 30s (apenas a espera). O parâmetro `timeoutMs` sobrescreve.
- Runtime do agente: `agents.defaults.timeoutSeconds` padrão 600s; aplicado no timer de abort em `runEmbeddedPiAgent`.

## Onde as coisas podem terminar prematuramente

- Timeout do agente (abort)
- AbortSignal (cancelamento)
- Desconexão do Gateway ou timeout do RPC
- Timeout do `agent.wait` (apenas espera, não para o agente)
