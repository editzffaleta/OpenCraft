---
summary: "Plano: um SDK de Plugin limpo + runtime para todos os conectores de mensagens"
read_when:
  - Definindo ou refatorando a arquitetura de Plugin
  - Migrando conectores de canal para o SDK/runtime de Plugin
title: "Plugin SDK Refactor"
---

# Plano de Refatoração do Plugin SDK + Runtime

Objetivo: todo conector de mensagens é um Plugin (bundled ou externo) usando uma API estável.
Nenhum Plugin importa de `src/**` diretamente. Todas as dependências passam pelo SDK ou runtime.

## Por que agora

- Conectores atuais misturam padrões: importações diretas do core, bridges somente de dist e helpers personalizados.
- Isso torna upgrades frágeis e bloqueia uma superfície limpa de Plugin externo.

## Arquitetura alvo (duas camadas)

### 1) Plugin SDK (compile-time, estável, publicável)

Escopo: tipos, helpers e utilitários de configuração. Sem estado de runtime, sem efeitos colaterais.

Conteúdos (exemplos):

- Tipos: `ChannelPlugin`, adaptadores, `ChannelMeta`, `ChannelCapabilities`, `ChannelDirectoryEntry`.
- Helpers de configuração: `buildChannelConfigSchema`, `setAccountEnabledInConfigSection`, `deleteAccountFromConfigSection`,
  `applyAccountNameToChannelSection`.
- Helpers de pareamento: `PAIRING_APPROVED_MESSAGE`, `formatPairingApproveHint`.
- Pontos de entrada de setup: `setup` + `setupWizard` de propriedade do host; evitar helpers amplos de onboarding público.
- Helpers de parâmetros de ferramenta: `createActionGate`, `readStringParam`, `readNumberParam`, `readReactionParams`, `jsonResult`.
- Helper de link de documentação: `formatDocsLink`.

Entrega:

- Publicar como `opencraft/plugin-sdk` (ou exportar do core sob `opencraft/plugin-sdk`).
- Semver com garantias explícitas de estabilidade.

### 2) Plugin Runtime (superfície de execução, injetado)

Escopo: tudo que toca comportamento de runtime do core.
Acessado via `OpenCraftPluginApi.runtime` para que Plugins nunca importem `src/**`.

Superfície proposta (mínima mas completa):

```ts
export type PluginRuntime = {
  channel: {
    text: {
      chunkMarkdownText(text: string, limit: number): string[];
      resolveTextChunkLimit(cfg: OpenCraftConfig, channel: string, accountId?: string): number;
      hasControlCommand(text: string, cfg: OpenCraftConfig): boolean;
    };
    reply: {
      dispatchReplyWithBufferedBlockDispatcher(params: {
        ctx: unknown;
        cfg: unknown;
        dispatcherOptions: {
          deliver: (payload: {
            text?: string;
            mediaUrls?: string[];
            mediaUrl?: string;
          }) => void | Promise<void>;
          onError?: (err: unknown, info: { kind: string }) => void;
        };
      }): Promise<void>;
      createReplyDispatcherWithTyping?: unknown; // adaptador para fluxos estilo Teams
    };
    routing: {
      resolveAgentRoute(params: {
        cfg: unknown;
        channel: string;
        accountId: string;
        peer: { kind: RoutePeerKind; id: string };
      }): { sessionKey: string; accountId: string };
    };
    pairing: {
      buildPairingReply(params: { channel: string; idLine: string; code: string }): string;
      readAllowFromStore(channel: string): Promise<string[]>;
      upsertPairingRequest(params: {
        channel: string;
        id: string;
        meta?: { name?: string };
      }): Promise<{ code: string; created: boolean }>;
    };
    media: {
      fetchRemoteMedia(params: { url: string }): Promise<{ buffer: Buffer; contentType?: string }>;
      saveMediaBuffer(
        buffer: Uint8Array,
        contentType: string | undefined,
        direction: "inbound" | "outbound",
        maxBytes: number,
      ): Promise<{ path: string; contentType?: string }>;
    };
    mentions: {
      buildMentionRegexes(cfg: OpenCraftConfig, agentId?: string): RegExp[];
      matchesMentionPatterns(text: string, regexes: RegExp[]): boolean;
    };
    groups: {
      resolveGroupPolicy(
        cfg: OpenCraftConfig,
        channel: string,
        accountId: string,
        groupId: string,
      ): {
        allowlistEnabled: boolean;
        allowed: boolean;
        groupConfig?: unknown;
        defaultConfig?: unknown;
      };
      resolveRequireMention(
        cfg: OpenCraftConfig,
        channel: string,
        accountId: string,
        groupId: string,
        override?: boolean,
      ): boolean;
    };
    debounce: {
      createInboundDebouncer<T>(opts: {
        debounceMs: number;
        buildKey: (v: T) => string | null;
        shouldDebounce: (v: T) => boolean;
        onFlush: (entries: T[]) => Promise<void>;
        onError?: (err: unknown) => void;
      }): { push: (v: T) => void; flush: () => Promise<void> };
      resolveInboundDebounceMs(cfg: OpenCraftConfig, channel: string): number;
    };
    commands: {
      resolveCommandAuthorizedFromAuthorizers(params: {
        useAccessGroups: boolean;
        authorizers: Array<{ configured: boolean; allowed: boolean }>;
      }): boolean;
    };
  };
  logging: {
    shouldLogVerbose(): boolean;
    getChildLogger(name: string): PluginLogger;
  };
  state: {
    resolveStateDir(cfg: OpenCraftConfig): string;
  };
};
```

Notas:

- Runtime é a única forma de acessar comportamento do core.
- SDK é intencionalmente pequeno e estável.
- Cada método do runtime mapeia para uma implementação core existente (sem duplicação).

## Plano de migração (faseado, seguro)

### Fase 0: scaffolding

- Introduzir `opencraft/plugin-sdk`.
- Adicionar `api.runtime` ao `OpenCraftPluginApi` com a superfície acima.
- Manter importações existentes durante uma janela de transição (avisos de depreciação).

### Fase 1: limpeza de bridges (baixo risco)

- Substituir `core-bridge.ts` por extensão com `api.runtime`.
- Migrar BlueBubbles, Zalo, Zalo Personal primeiro (já próximos).
- Remover código de bridge duplicado.

### Fase 2: Plugins de importação direta leves

- Migrar Matrix para SDK + runtime.
- Validar onboarding, diretório, lógica de menção de grupo.

### Fase 3: Plugins de importação direta pesados

- Migrar MS Teams (maior conjunto de helpers de runtime).
- Garantir que semânticas de resposta/digitação correspondam ao comportamento atual.

### Fase 4: pluginização do iMessage

- Mover iMessage para `extensions/imessage`.
- Substituir chamadas diretas ao core com `api.runtime`.
- Manter chaves de configuração, comportamento do CLI e documentação intactos.

### Fase 5: imposição

- Adicionar regra de lint / verificação de CI: nenhuma importação de `extensions/**` de `src/**`.
- Adicionar verificações de compatibilidade de SDK/versão do Plugin (semver runtime + SDK).

## Compatibilidade e versionamento

- SDK: semver, publicado, mudanças documentadas.
- Runtime: versionado por release do core. Adicionar `api.runtime.version`.
- Plugins declaram range de runtime obrigatório (ex., `opencraftRuntime: ">=2026.2.0"`).

## Estratégia de testes

- Testes unitários a nível de adaptador (funções de runtime exercitadas com implementação real do core).
- Testes golden por Plugin: garantir nenhuma divergência de comportamento (roteamento, pareamento, lista de permissão, gating de menção).
- Uma única amostra de Plugin ponta a ponta usada no CI (instalar + executar + fumaça).

## Perguntas em aberto

- Onde hospedar tipos do SDK: pacote separado ou export do core?
- Distribuição de tipos de runtime: no SDK (somente tipos) ou no core?
- Como expor links de documentação para Plugins bundled vs externos?
- Permitimos importações diretas limitadas do core para Plugins in-repo durante a transição?

## Critérios de sucesso

- Todos os conectores de canal são Plugins usando SDK + runtime.
- Nenhuma importação de `extensions/**` de `src/**`.
- Templates de novos conectores dependem somente de SDK + runtime.
- Plugins externos podem ser desenvolvidos e atualizados sem acesso ao código-fonte do core.

Documentação relacionada: [Plugins](/tools/plugin), [Canais](/channels/index), [Configuração](/gateway/configuration).

## Costuras implementadas de propriedade do canal

Trabalho recente de refatoração ampliou o contrato de Plugin de canal para que o core possa parar de ser
dono de UX e comportamento de roteamento específicos de canal:

- `messaging.buildCrossContextComponents`: marcadores de UI cross-context de propriedade do canal
  (por exemplo containers de componentes v2 do Discord)
- `messaging.enableInteractiveReplies`: toggles de normalização de resposta de propriedade do canal
  (por exemplo respostas interativas do Slack)
- `messaging.resolveOutboundSessionRoute`: roteamento de sessão de saída de propriedade do canal
- `status.formatCapabilitiesProbe` / `status.buildCapabilitiesDiagnostics`: display de probe de
  `/channels capabilities` de propriedade do canal e auditorias/escopos extras
- `threading.resolveAutoThreadId`: auto-threading de mesma conversa de propriedade do canal
- `threading.resolveReplyTransport`: mapeamento de entrega reply-vs-thread de propriedade do canal
- `actions.requiresTrustedRequesterSender`: portões de confiança de ação privilegiada de propriedade do canal
- `execApprovals.*`: estado de superfície de aprovação exec de propriedade do canal, supressão de encaminhamento,
  UX de payload pendente e hooks pré-entrega
- `lifecycle.onAccountConfigChanged` / `lifecycle.onAccountRemoved`: limpeza de propriedade do canal em
  mutação/remoção de configuração
- `allowlist.supportsScope`: anúncio de escopo de lista de permissão de propriedade do canal

Esses hooks devem ser preferidos sobre novos branches `channel === "discord"` / `telegram`
em fluxos core compartilhados.
