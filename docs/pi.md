---
title: "Arquitetura de Integração com Pi"
summary: "Arquitetura da integração embutida do agente Pi no OpenCraft e ciclo de vida de sessão"
read_when:
  - Entendendo o design de integração do SDK Pi no OpenCraft
  - Modificando ciclo de vida de sessão de agente, tooling ou fiação de provedor para Pi
---

# Arquitetura de Integração com Pi

Este documento descreve como o OpenCraft integra com o [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) e seus pacotes irmãos (`pi-ai`, `pi-agent-core`, `pi-tui`) para alimentar suas capacidades de agente de IA.

## Visão Geral

O OpenCraft usa o SDK Pi para embutir um agente de codificação de IA em sua arquitetura de gateway de mensagens. Em vez de spawnar o Pi como subprocesso ou usar o modo RPC, o OpenCraft importa e instancia diretamente o `AgentSession` do Pi via `createAgentSession()`. Esta abordagem embutida fornece:

- Controle total sobre ciclo de vida de sessão e tratamento de eventos
- Injeção personalizada de tools (mensagens, sandbox, ações específicas de canal)
- Personalização do system prompt por canal/contexto
- Persistência de sessão com suporte a branching/compaction
- Rotação de perfil de auth multi-conta com failover
- Troca de modelos agnóstica de provedor

## Dependências de Pacote

```json
{
  "@mariozechner/pi-agent-core": "0.49.3",
  "@mariozechner/pi-ai": "0.49.3",
  "@mariozechner/pi-coding-agent": "0.49.3",
  "@mariozechner/pi-tui": "0.49.3"
}
```

| Pacote            | Propósito                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Abstrações principais de LLM: `Model`, `streamSimple`, tipos de mensagem, APIs de provedor            |
| `pi-agent-core`   | Loop de agente, execução de tools, tipos `AgentMessage`                                               |
| `pi-coding-agent` | SDK de alto nível: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, tools embutidas |
| `pi-tui`          | Componentes de UI de terminal (usados no modo TUI local do OpenCraft)                                 |

## Estrutura de Arquivos

```
src/agents/
├── pi-embedded-runner.ts          # Re-exporta de pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Entrada principal: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Lógica de tentativa única com setup de sessão
│   │   ├── params.ts              # Tipo RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Construir payloads de resposta dos resultados de run
│   │   ├── images.ts              # Injeção de imagem para modelo de visão
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Detecção de erro de abort
│   ├── cache-ttl.ts               # Rastreamento de TTL de cache para context pruning
│   ├── compact.ts                 # Lógica de compaction manual/automático
│   ├── extensions.ts              # Carregar extensões Pi para runs embutidos
│   ├── extra-params.ts            # Parâmetros de stream específicos do provedor
│   ├── google.ts                  # Correções de ordenação de turno Google/Gemini
│   ├── history.ts                 # Limitação de histórico (DM vs grupo)
│   ├── lanes.ts                   # Lanes de comandos de sessão/global
│   ├── logger.ts                  # Logger de subsistema
│   ├── model.ts                   # Resolução de modelo via ModelRegistry
│   ├── runs.ts                    # Rastreamento de run ativo, abort, fila
│   ├── sandbox-info.ts            # Info de sandbox para system prompt
│   ├── session-manager-cache.ts   # Cache de instâncias de SessionManager
│   ├── session-manager-init.ts    # Inicialização de arquivo de sessão
│   ├── system-prompt.ts           # Construtor de system prompt
│   ├── tool-split.ts              # Dividir tools em builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapeamento de ThinkLevel, descrição de erro
├── pi-embedded-subscribe.ts       # Subscrição/despacho de eventos de sessão
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fábrica de handlers de evento
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chunking de resposta de bloco em streaming
├── pi-embedded-messaging.ts       # Rastreamento de envio de tool de mensagens
├── pi-embedded-helpers.ts         # Classificação de erro, validação de turno
├── pi-embedded-helpers/           # Módulos helper
├── pi-embedded-utils.ts           # Utilitários de formatação
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Wrapping de AbortSignal para tools
├── pi-tools.policy.ts             # Política de allowlist/denylist de tools
├── pi-tools.read.ts               # Personalizações da tool read
├── pi-tools.schema.ts             # Normalização de schema de tool
├── pi-tools.types.ts              # Alias de tipo AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adaptador AgentTool -> ToolDefinition
├── pi-settings.ts                 # Sobrescrições de configurações
├── pi-extensions/                 # Extensões Pi personalizadas
│   ├── compaction-safeguard.ts    # Extensão de salvaguarda
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Extensão de context pruning por cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Resolução de perfil de auth
├── auth-profiles.ts               # Armazenamento de perfil, cooldown, failover
├── model-selection.ts             # Resolução de modelo padrão
├── models-config.ts               # Geração de models.json
├── model-catalog.ts               # Cache de catálogo de modelos
├── context-window-guard.ts        # Validação de janela de contexto
├── failover-error.ts              # Classe FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Resolução de parâmetros do system prompt
├── system-prompt-report.ts        # Geração de relatório de debug
├── tool-summaries.ts              # Resumos de descrição de tools
├── tool-policy.ts                 # Resolução de política de tools
├── transcript-policy.ts           # Política de validação de transcrição
├── skills.ts                      # Snapshot/construção de prompt de skill
├── skills/                        # Subsistema de skills
├── sandbox.ts                     # Resolução de contexto de sandbox
├── sandbox/                       # Subsistema de sandbox
├── channel-tools.ts               # Injeção de tool específica de canal
├── openclaw-tools.ts              # Tools específicas do OpenCraft
├── bash-tools.ts                  # Tools de exec/processo
├── apply-patch.ts                 # tool apply_patch (OpenAI)
├── tools/                         # Implementações individuais de tools
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

### 1. Rodando um Agente Embutido

O ponto de entrada principal é `runEmbeddedPiAgent()` em `pi-embedded-runner/run.ts`:

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+5511999999999",
  sessionFile: "/caminho/para/session.jsonl",
  workspaceDir: "/caminho/para/workspace",
  config: openclawConfig,
  prompt: "Olá, como vai?",
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

### 3. Subscrição de Eventos

`subscribeEmbeddedPiSession()` subscreve aos eventos `AgentSession` do Pi:

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

- `message_start` / `message_end` / `message_update` (texto/pensamento em streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `auto_compaction_start` / `auto_compaction_end`

### 4. Prompting

Após o setup, a sessão recebe o prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

O SDK trata o loop completo do agente: enviar para o LLM, executar chamadas de tool, responder em streaming.

A injeção de imagem é local por prompt: o OpenCraft carrega refs de imagem do prompt atual e as passa via `images` apenas para aquele turno. Ele não varre turnos de histórico mais antigos para re-injetar payloads de imagem.

## Arquitetura de Tools

### Pipeline de Tools

1. **Tools Base**: `codingTools` do Pi (read, bash, edit, write)
2. **Substituições Personalizadas**: O OpenCraft substitui bash por `exec`/`process`, personaliza read/edit/write para sandbox
3. **Tools do OpenCraft**: mensagens, browser, canvas, sessões, cron, gateway, etc.
4. **Tools de Canal**: tools de ação específicas do Discord/Telegram/Slack/WhatsApp
5. **Filtragem de Política**: Tools filtradas por perfil, provedor, agente, grupo, políticas de sandbox
6. **Normalização de Schema**: Schemas limpos para quirks do Gemini/OpenAI
7. **Wrapping de AbortSignal**: Tools embrulhadas para respeitar sinais de abort

### Adaptador de Definição de Tool

`AgentTool` do pi-agent-core tem uma assinatura de `execute` diferente do `ToolDefinition` do pi-coding-agent. O adaptador em `pi-tool-definition-adapter.ts` faz a ponte:

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

### Estratégia de Divisão de Tools

`splitSdkTools()` passa todas as tools via `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Vazio. Sobrescrevemos tudo
    customTools: toToolDefinitions(options.tools),
  };
}
```

Isso garante que a filtragem de política, integração com sandbox e conjunto estendido de tools do OpenCraft permaneçam consistentes entre provedores.

## Construção do System Prompt

O system prompt é construído em `buildAgentSystemPrompt()` (`system-prompt.ts`). Ele monta um prompt completo com seções incluindo Tooling, Estilo de Chamada de Tool, Salvaguardas de segurança, Referência CLI do OpenCraft, Skills, Docs, Workspace, Sandbox, Mensagens, Tags de Resposta, Voz, Respostas Silenciosas, Heartbeats, metadados de Runtime, mais Memória e Reações quando habilitados, e arquivos de contexto opcionais e conteúdo extra do system prompt. As seções são aparadas para o modo de prompt mínimo usado por subagentes.

O prompt é aplicado após a criação da sessão via `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gerenciamento de Sessão

### Arquivos de Sessão

Sessões são arquivos JSONL com estrutura de árvore (ligação por id/parentId). O `SessionManager` do Pi trata a persistência:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

O OpenCraft embrulha isso com `guardSessionManager()` para segurança do resultado de tools.

### Cache de Sessão

`session-manager-cache.ts` armazena em cache instâncias de SessionManager para evitar parsing repetido de arquivo:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitação de Histórico

`limitHistoryTurns()` apara o histórico de conversa com base no tipo de canal (DM vs grupo).

### Compaction

O auto-compaction dispara no overflow de contexto. `compactEmbeddedPiSessionDirect()` trata o compaction manual:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Autenticação & Resolução de Modelo

### Perfis de Auth

O OpenCraft mantém um armazenamento de perfil de auth com múltiplas chaves de API por provedor:

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

### Salvaguarda de Compaction

`src/agents/pi-extensions/compaction-safeguard.ts` adiciona salvaguardas ao compaction, incluindo orçamento de tokens adaptativo mais resumos de falhas de tool e operações de arquivo:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context Pruning

`src/agents/pi-extensions/context-pruning.ts` implementa context pruning baseado em cache-TTL:

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

## Streaming & Respostas de Bloco

### Chunking de Bloco

`EmbeddedBlockChunker` gerencia texto em streaming em blocos de resposta discretos:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Remoção de Tags de Thinking/Final

A saída em streaming é processada para remover blocos `<think>`/`<thinking>` e extrair conteúdo `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Remove conteúdo <think>...</think>
  // Se enforceFinalTag, retorna apenas conteúdo <final>...</final>
};
```

### Diretivas de Resposta

Diretivas de resposta como `[[media:url]]`, `[[voice]]`, `[[reply:id]]` são parseadas e extraídas:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Tratamento de Erros

### Classificação de Erros

`pi-embedded-helpers.ts` classifica erros para tratamento adequado:

```typescript
isContextOverflowError(errorText)     // Contexto muito grande
isCompactionFailureError(errorText)   // Falha no compaction
isAuthAssistantError(lastAssistant)   // Falha de auth
isRateLimitAssistantError(...)        // Rate limit
isFailoverAssistantError(...)         // Deve fazer failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback de Nível de Thinking

Se um nível de thinking não for suportado, ele cai de volta:

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

Quando o modo sandbox está habilitado, tools e caminhos são restritos:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Usar tools de read/edit/write em sandbox
  // Exec roda em container
  // Browser usa URL de bridge
}
```

## Tratamento Específico de Provedor

### Anthropic

- Remoção de string mágica de recusa
- Validação de turno para papéis consecutivos
- Compatibilidade de parâmetro Claude Code

### Google/Gemini

- Correções de ordenação de turno (`applyGoogleTurnOrderingFix`)
- Sanitização de schema de tool (`sanitizeToolsForGoogle`)
- Sanitização de histórico de sessão (`sanitizeSessionHistory`)

### OpenAI

- Tool `apply_patch` para modelos Codex
- Tratamento de downgrade de nível de thinking

## Integração TUI

O OpenCraft também tem um modo TUI local que usa componentes pi-tui diretamente:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Isso fornece a experiência de terminal interativo similar ao modo nativo do Pi.

## Principais Diferenças em Relação ao CLI Pi

| Aspecto         | CLI Pi                  | OpenCraft Embutido                                                                                        |
| --------------- | ----------------------- | --------------------------------------------------------------------------------------------------------- |
| Invocação       | comando `pi` / RPC      | SDK via `createAgentSession()`                                                                            |
| Tools           | Tools de codificação padrão | Suite de tools personalizada do OpenCraft                                                             |
| System prompt   | AGENTS.md + prompts     | Dinâmico por canal/contexto                                                                               |
| Armazenamento de sessão | `~/.pi/agent/sessions/` | `~/.opencraft/agents/<agentId>/sessions/` (ou `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Credencial única        | Multi-perfil com rotação                                                                                  |
| Extensões       | Carregadas do disco     | Programáticas + caminhos no disco                                                                         |
| Tratamento de eventos | Renderização TUI   | Baseado em callback (onBlockReply, etc.)                                                                  |

## Considerações Futuras

Áreas para possível refatoração:

1. **Alinhamento de assinatura de tool**: Atualmente adaptando entre assinaturas pi-agent-core e pi-coding-agent
2. **Wrapping de session manager**: `guardSessionManager` adiciona segurança mas aumenta complexidade
3. **Carregamento de extensão**: Poderia usar o `ResourceLoader` do Pi mais diretamente
4. **Complexidade do handler de streaming**: `subscribeEmbeddedPiSession` cresceu bastante
5. **Quirks de provedor**: Muitos caminhos de código específicos de provedor que o Pi potencialmente poderia tratar

## Testes

A cobertura de integração com Pi abrange estes suites:

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

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (habilitar com `OPENCLAW_LIVE_TEST=1`)

Para comandos de execução atuais, veja [Fluxo de Desenvolvimento do Pi](/pi-dev).
