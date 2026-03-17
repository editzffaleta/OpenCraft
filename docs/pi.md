---
title: "Arquitetura de Integração Pi"
summary: "Arquitetura da integração do agente Pi embutido do OpenCraft e ciclo de vida de sessão"
read_when:
  - Entendendo o design da integração do SDK Pi no OpenCraft
  - Modificando ciclo de vida de sessão do agente, ferramentas ou conexão de provedores para Pi
---

# Arquitetura de Integração Pi

Este documento descreve como o OpenCraft se integra com o [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) e seus pacotes irmãos (`pi-ai`, `pi-agent-core`, `pi-tui`) para alimentar suas capacidades de agente de IA.

## Visão Geral

O OpenCraft usa o SDK Pi para embutir um agente de codificação de IA na sua arquitetura de Gateway de mensagens. Em vez de iniciar o Pi como um subprocesso ou usar modo RPC, o OpenCraft importa e instancia diretamente o `AgentSession` do Pi via `createAgentSession()`. Esta abordagem embutida fornece:

- Controle total sobre o ciclo de vida da sessão e tratamento de eventos
- Injeção de ferramentas personalizadas (mensagens, sandbox, ações específicas de canal)
- Personalização de system prompt por canal/contexto
- Persistência de sessão com suporte a ramificação/compactação
- Rotação de perfil de autenticação multi-conta com failover
- Troca de modelo agnóstica de provedor

## Dependências de Pacotes

```json
{
  "@mariozechner/pi-agent-core": "0.49.3",
  "@mariozechner/pi-ai": "0.49.3",
  "@mariozechner/pi-coding-agent": "0.49.3",
  "@mariozechner/pi-tui": "0.49.3"
}
```

| Pacote            | Propósito                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `pi-ai`           | Abstrações LLM principais: `Model`, `streamSimple`, tipos de mensagem, APIs de provedor                           |
| `pi-agent-core`   | Loop do agente, execução de ferramentas, tipos `AgentMessage`                                                     |
| `pi-coding-agent` | SDK de alto nível: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, ferramentas integradas |
| `pi-tui`          | Componentes de UI de terminal (usados no modo TUI local do OpenCraft)                                             |

## Estrutura de Arquivos

```
src/agents/
├── pi-embedded-runner.ts          # Re-exportações de pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Ponto de entrada principal: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Lógica de tentativa única com setup de sessão
│   │   ├── params.ts              # Tipo RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Construir payloads de resposta dos resultados da execução
│   │   ├── images.ts              # Injeção de imagem para modelo de visão
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Detecção de erro de aborto
│   ├── cache-ttl.ts               # Rastreamento de TTL de cache para poda de contexto
│   ├── compact.ts                 # Lógica de compactação manual/automática
│   ├── extensions.ts              # Carregar extensões Pi para execuções embutidas
│   ├── extra-params.ts            # Parâmetros de stream específicos do provedor
│   ├── google.ts                  # Correções de ordenação de turnos Google/Gemini
│   ├── history.ts                 # Limitação de histórico (DM vs grupo)
│   ├── lanes.ts                   # Faixas de comando de sessão/global
│   ├── logger.ts                  # Logger de subsistema
│   ├── model.ts                   # Resolução de modelo via ModelRegistry
│   ├── runs.ts                    # Rastreamento de execução ativa, aborto, fila
│   ├── sandbox-info.ts            # Info de sandbox para system prompt
│   ├── session-manager-cache.ts   # Cache de instância SessionManager
│   ├── session-manager-init.ts    # Inicialização de arquivo de sessão
│   ├── system-prompt.ts           # Construtor de system prompt
│   ├── tool-split.ts              # Dividir ferramentas em builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapeamento de ThinkLevel, descrição de erro
├── pi-embedded-subscribe.ts       # Assinatura/despacho de evento de sessão
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fábrica de handlers de evento
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chunking de bloco de resposta em streaming
├── pi-embedded-messaging.ts       # Rastreamento de envio de ferramenta de mensagens
├── pi-embedded-helpers.ts         # Classificação de erro, validação de turno
├── pi-embedded-helpers/           # Módulos auxiliares
├── pi-embedded-utils.ts           # Utilitários de formatação
├── pi-tools.ts                    # createOpenCraftCodingTools()
├── pi-tools.abort.ts              # Encapsulamento de AbortSignal para ferramentas
├── pi-tools.policy.ts             # Política de allowlist/denylist de ferramentas
├── pi-tools.read.ts               # Personalizações da ferramenta de leitura
├── pi-tools.schema.ts             # Normalização de schema de ferramentas
├── pi-tools.types.ts              # Alias de tipo AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adaptador AgentTool -> ToolDefinition
├── pi-settings.ts                 # Substituições de configurações
├── pi-extensions/                 # Extensões Pi personalizadas
│   ├── compaction-safeguard.ts    # Extensão de proteção
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Extensão de poda de contexto por cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Resolução de perfil de autenticação
├── auth-profiles.ts               # Armazenamento de perfis, cooldown, failover
├── model-selection.ts             # Resolução de modelo padrão
├── models-config.ts               # Geração de models.json
├── model-catalog.ts               # Cache de catálogo de modelos
├── context-window-guard.ts        # Validação de janela de contexto
├── failover-error.ts              # Classe FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Resolução de parâmetros do system prompt
├── system-prompt-report.ts        # Geração de relatório de depuração
├── tool-summaries.ts              # Resumos de descrição de ferramentas
├── tool-policy.ts                 # Resolução de política de ferramentas
├── transcript-policy.ts           # Política de validação de transcrição
├── skills.ts                      # Construção de snapshot/prompt de Skill
├── skills/                        # Subsistema de Skills
├── sandbox.ts                     # Resolução de contexto de sandbox
├── sandbox/                       # Subsistema de sandbox
├── channel-tools.ts               # Injeção de ferramentas específicas de canal
├── opencraft-tools.ts              # Ferramentas específicas do OpenCraft
├── bash-tools.ts                  # Ferramentas exec/process
├── apply-patch.ts                 # Ferramenta apply_patch (OpenAI)
├── tools/                         # Implementações individuais de ferramentas
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── discord-actions*.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── slack-actions.ts
│   ├── telegram-actions.ts
│   ├── web-*.ts
│   └── whatsapp-actions.ts
└── ...
```

## Fluxo Principal de Integração

### 1. Executando um Agente Embutido

O ponto de entrada principal é `runEmbeddedPiAgent()` em `pi-embedded-runner/run.ts`:

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: opencraftConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-20250514",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. Criação de Sessão

Dentro de `runEmbeddedAttempt()` (chamado por `runEmbeddedPiAgent()`), o SDK Pi é usado:

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. Assinatura de Eventos

`subscribeEmbeddedPiSession()` assina os eventos do `AgentSession` do Pi:

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

Eventos tratados incluem:

- `message_start` / `message_end` / `message_update` (streaming de texto/raciocínio)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `auto_compaction_start` / `auto_compaction_end`

### 4. Prompting

Após a configuração, a sessão recebe o prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

O SDK lida com o loop completo do agente: envio para LLM, execução de chamadas de ferramenta, streaming de respostas.

A injeção de imagem é local ao prompt: o OpenCraft carrega referências de imagem do prompt atual e
as passa via `images` apenas para aquele turno. Ele não re-examina turnos anteriores do histórico
para reinjetar payloads de imagem.

## Arquitetura de Ferramentas

### Pipeline de Ferramentas

1. **Ferramentas Base**: `codingTools` do Pi (read, bash, edit, write)
2. **Substituições Personalizadas**: OpenCraft substitui bash por `exec`/`process`, personaliza read/edit/write para sandbox
3. **Ferramentas OpenCraft**: mensagens, navegador, canvas, sessões, Cron, Gateway, etc.
4. **Ferramentas de Canal**: ferramentas de ação específicas para Discord/Telegram/Slack/WhatsApp
5. **Filtragem por Política**: ferramentas filtradas por perfil, provedor, agente, grupo, políticas de sandbox
6. **Normalização de Schema**: schemas limpos para peculiaridades do Gemini/OpenAI
7. **Encapsulamento de AbortSignal**: ferramentas encapsuladas para respeitar sinais de aborto

### Adaptador de Definição de Ferramenta

O `AgentTool` do pi-agent-core tem uma assinatura `execute` diferente do `ToolDefinition` do pi-coding-agent. O adaptador em `pi-tool-definition-adapter.ts` faz a ponte:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // assinatura do pi-coding-agent difere do pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Estratégia de Divisão de Ferramentas

`splitSdkTools()` passa todas as ferramentas via `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Vazio. Substituímos tudo
    customTools: toToolDefinitions(options.tools),
  };
}
```

Isso garante que a filtragem por política, integração com sandbox e o conjunto estendido de ferramentas do OpenCraft permaneçam consistentes entre provedores.

## Construção do System Prompt

O system prompt é construído em `buildAgentSystemPrompt()` (`system-prompt.ts`). Ele monta um prompt completo com seções incluindo Ferramentas, Estilo de Chamada de Ferramenta, Proteções de Segurança, Referência do CLI OpenCraft, Skills, Docs, Workspace, Sandbox, Mensagens, Tags de Resposta, Voz, Respostas Silenciosas, Heartbeats, Metadados de runtime, além de Memória e Reações quando habilitados, e arquivos de contexto opcionais e conteúdo extra de system prompt. Seções são reduzidas para modo de prompt mínimo usado por subagentes.

O prompt é aplicado após a criação da sessão via `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gerenciamento de Sessão

### Arquivos de Sessão

Sessões são arquivos JSONL com estrutura de árvore (vinculação id/parentId). O `SessionManager` do Pi lida com a persistência:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

O OpenCraft encapsula isso com `guardSessionManager()` para segurança de resultado de ferramenta.

### Cache de Sessão

`session-manager-cache.ts` faz cache de instâncias do SessionManager para evitar parsing repetido de arquivo:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitação de Histórico

`limitHistoryTurns()` recorta o histórico de conversa baseado no tipo de canal (DM vs grupo).

### Compactação

A auto-compactação é acionada por estouro de contexto. `compactEmbeddedPiSessionDirect()` lida com compactação manual:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Autenticação e Resolução de Modelo

### Perfis de Autenticação

O OpenCraft mantém um armazenamento de perfis de autenticação com múltiplas chaves de API por provedor:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Perfis rotacionam em falhas com rastreamento de cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Resolução de Modelo

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Usa ModelRegistry e AuthStorage do Pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` aciona fallback de modelo quando configurado:

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Extensões Pi

O OpenCraft carrega extensões Pi personalizadas para comportamento especializado:

### Proteção de Compactação

`src/agents/pi-extensions/compaction-safeguard.ts` adiciona proteções à compactação, incluindo orçamento adaptativo de Tokens mais resumos de falha de ferramentas e operações de arquivo:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Poda de Contexto

`src/agents/pi-extensions/context-pruning.ts` implementa poda de contexto baseada em cache-TTL:

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## Streaming e Respostas em Bloco

### Chunking de Bloco

`EmbeddedBlockChunker` gerencia streaming de texto em blocos discretos de resposta:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Remoção de Tags Thinking/Final

A saída em streaming é processada para remover blocos `<think>`/`<thinking>` e extrair conteúdo `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Remove conteúdo <think>...</think>
  // Se enforceFinalTag, retorna apenas conteúdo <final>...</final>
};
```

### Diretivas de Resposta

Diretivas de resposta como `[[media:url]]`, `[[voice]]`, `[[reply:id]]` são analisadas e extraídas:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Tratamento de Erros

### Classificação de Erros

`pi-embedded-helpers.ts` classifica erros para tratamento apropriado:

```typescript
isContextOverflowError(errorText)     // Contexto muito grande
isCompactionFailureError(errorText)   // Compactação falhou
isAuthAssistantError(lastAssistant)   // Falha de autenticação
isRateLimitAssistantError(...)        // Limite de taxa atingido
isFailoverAssistantError(...)         // Deve fazer failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback de Nível de Raciocínio

Se um nível de raciocínio não for suportado, ele faz fallback:

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## Integração com Sandbox

Quando o modo sandbox está habilitado, ferramentas e caminhos são restritos:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Usa ferramentas read/edit/write em sandbox
  // Exec roda em container
  // Navegador usa URL bridge
}
```

## Tratamento Específico por Provedor

### Anthropic

- Remoção de string mágica de recusa
- Validação de turno para papéis consecutivos
- Compatibilidade de parâmetros Claude Code

### Google/Gemini

- Correções de ordenação de turnos (`applyGoogleTurnOrderingFix`)
- Sanitização de schema de ferramentas (`sanitizeToolsForGoogle`)
- Sanitização de histórico de sessão (`sanitizeSessionHistory`)

### OpenAI

- Ferramenta `apply_patch` para modelos Codex
- Tratamento de downgrade de nível de raciocínio

## Integração TUI

O OpenCraft também possui um modo TUI local que usa componentes do pi-tui diretamente:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Isso fornece a experiência de terminal interativo similar ao modo nativo do Pi.

## Diferenças Principais do Pi CLI

| Aspecto                 | Pi CLI                            | OpenCraft Embutido                                                                               |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| Invocação               | comando `pi` / RPC                | SDK via `createAgentSession()`                                                                   |
| Ferramentas             | Ferramentas de codificação padrão | Conjunto personalizado de ferramentas OpenCraft                                                  |
| System prompt           | AGENTS.md + prompts               | Dinâmico por canal/contexto                                                                      |
| Armazenamento de sessão | `~/.pi/agent/sessions/`           | `~/.opencraft/agents/<agentId>/sessions/` (ou `$OPENCRAFT_STATE_DIR/agents/<agentId>/sessions/`) |
| Autenticação            | Credencial única                  | Multi-perfil com rotação                                                                         |
| Extensões               | Carregadas do disco               | Caminhos programáticos + disco                                                                   |
| Tratamento de eventos   | Renderização TUI                  | Baseado em callbacks (onBlockReply, etc.)                                                        |

## Considerações Futuras

Áreas para potencial refatoração:

1. **Alinhamento de assinatura de ferramenta**: atualmente adaptando entre assinaturas do pi-agent-core e pi-coding-agent
2. **Encapsulamento do session manager**: `guardSessionManager` adiciona segurança mas aumenta complexidade
3. **Carregamento de extensões**: poderia usar o `ResourceLoader` do Pi mais diretamente
4. **Complexidade do handler de streaming**: `subscribeEmbeddedPiSession` cresceu bastante
5. **Peculiaridades de provedor**: muitos codepaths específicos de provedor que o Pi poderia potencialmente tratar

## Testes

A cobertura da integração Pi abrange estas suítes:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-auth-json.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-embedded-helpers*.test.ts`
- `src/agents/pi-embedded-runner*.test.ts`
- `src/agents/pi-embedded-runner/**/*.test.ts`
- `src/agents/pi-embedded-subscribe*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-tool-definition-adapter*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-extensions/**/*.test.ts`

Ao vivo/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (habilite `OPENCRAFT_LIVE_TEST=1`)

Para comandos de execução atuais, consulte [Fluxo de Desenvolvimento Pi](/pi-dev).
