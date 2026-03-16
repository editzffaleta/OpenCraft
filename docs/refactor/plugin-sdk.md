---
summary: "Plano: um Plugin SDK + runtime limpo para todos os conectores de mensagens"
read_when:
  - Definindo ou refatorando a arquitetura de plugins
  - Migrando conectores de canal para o Plugin SDK/runtime
title: "Refatoração do Plugin SDK"
---

# Plano de Refatoração do Plugin SDK + Runtime

Objetivo: cada conector de mensagens é um plugin (embutido ou externo) usando uma API estável única.
Nenhum plugin importa diretamente de `src/**`. Todas as dependências passam pelo SDK ou runtime.

## Por que agora

- Os conectores atuais misturam padrões: importações diretas do core, bridges apenas de dist e helpers personalizados.
- Isso torna as atualizações frágeis e bloqueia uma superfície limpa de plugin externo.

## Arquitetura alvo (duas camadas)

### 1) Plugin SDK (tempo de compilação, estável, publicável)

Escopo: tipos, helpers e utilitários de configuração. Sem estado de runtime, sem efeitos colaterais.

Conteúdo (exemplos):

- Tipos: `ChannelPlugin`, adapters, `ChannelMeta`, `ChannelCapabilities`, `ChannelDirectoryEntry`.
- Helpers de configuração: `buildChannelConfigSchema`, `setAccountEnabledInConfigSection`, `deleteAccountFromConfigSection`,
  `applyAccountNameToChannelSection`.
- Helpers de pareamento: `PAIRING_APPROVED_MESSAGE`, `formatPairingApproveHint`.
- Helpers de onboarding: `promptChannelAccessConfig`, `addWildcardAllowFrom`, tipos de onboarding.
- Helpers de parâmetros de ferramenta: `createActionGate`, `readStringParam`, `readNumberParam`, `readReactionParams`, `jsonResult`.
- Helper de link de docs: `formatDocsLink`.

Entrega:

- Publicar como `opencraft/plugin-sdk` (ou exportar do core sob `opencraft/plugin-sdk`).
- Semver com garantias explícitas de estabilidade.

### 2) Plugin Runtime (superfície de execução, injetada)

Escopo: tudo que toca o comportamento de runtime do core.
Acessado via `OpenClawPluginApi.runtime` para que plugins nunca importem de `src/**`.

Superfície proposta (mínima mas completa):

```ts
export type PluginRuntime = {
  channel: {
    text: {
      chunkMarkdownText(text: string, limit: number): string[];
      resolveTextChunkLimit(cfg: OpenClawConfig, channel: string, accountId?: string): number;
      hasControlCommand(text: string, cfg: OpenClawConfig): boolean;
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
      createReplyDispatcherWithTyping?: unknown; // adapter for Teams-style flows
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
      buildMentionRegexes(cfg: OpenClawConfig, agentId?: string): RegExp[];
      matchesMentionPatterns(text: string, regexes: RegExp[]): boolean;
    };
    groups: {
      resolveGroupPolicy(
        cfg: OpenClawConfig,
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
        cfg: OpenClawConfig,
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
      resolveInboundDebounceMs(cfg: OpenClawConfig, channel: string): number;
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
    resolveStateDir(cfg: OpenClawConfig): string;
  };
};
```

Notas:

- O runtime é a única forma de acessar o comportamento do core.
- O SDK é intencionalmente pequeno e estável.
- Cada método do runtime mapeia para uma implementação existente no core (sem duplicação).

## Plano de migração (faseado, seguro)

### Fase 0: scaffolding

- Introduzir `opencraft/plugin-sdk`.
- Adicionar `api.runtime` a `OpenClawPluginApi` com a superfície acima.
- Manter as importações existentes durante uma janela de transição (avisos de deprecação).

### Fase 1: limpeza de bridge (baixo risco)

- Substituir `core-bridge.ts` por extensão com `api.runtime`.
- Migrar BlueBubbles, Zalo, Zalo Personal primeiro (já próximos).
- Remover código de bridge duplicado.

### Fase 2: plugins com importações diretas leves

- Migrar Matrix para SDK + runtime.
- Validar lógica de onboarding, diretório e menção de grupo.

### Fase 3: plugins com importações diretas pesadas

- Migrar MS Teams (maior conjunto de helpers de runtime).
- Garantir que a semântica de reply/typing corresponda ao comportamento atual.

### Fase 4: pluginização do iMessage

- Mover iMessage para `extensions/imessage`.
- Substituir chamadas diretas ao core por `api.runtime`.
- Manter chaves de configuração, comportamento da CLI e documentação intactos.

### Fase 5: aplicação

- Adicionar regra de lint / verificação de CI: nenhum `extensions/**` importa de `src/**`.
- Adicionar verificações de compatibilidade de versão do plugin SDK/runtime (semver de runtime + SDK).

## Compatibilidade e versionamento

- SDK: semver, publicado, mudanças documentadas.
- Runtime: versionado por release do core. Adicionar `api.runtime.version`.
- Plugins declaram um intervalo de runtime necessário (ex.: `openclawRuntime: ">=2026.2.0"`).

## Estratégia de testes

- Testes unitários de nível de adapter (funções de runtime exercidas com implementação real do core).
- Testes golden por plugin: garantir que não haja desvio de comportamento (roteamento, pareamento, allowlist, filtragem de menção).
- Um único plugin de exemplo end-to-end usado em CI (instalar + executar + smoke).

## Questões em aberto

- Onde hospedar os tipos do SDK: pacote separado ou export do core?
- Distribuição de tipos do runtime: no SDK (apenas tipos) ou no core?
- Como expor links de docs para plugins embutidos vs externos?
- Permitimos importações diretas limitadas do core para plugins dentro do repo durante a transição?

## Critérios de sucesso

- Todos os conectores de canal são plugins usando SDK + runtime.
- Nenhum `extensions/**` importa de `src/**`.
- Novos templates de conector dependem apenas do SDK + runtime.
- Plugins externos podem ser desenvolvidos e atualizados sem acesso ao código-fonte do core.

Docs relacionados: [Plugins](/tools/plugin), [Canais](/channels/index), [Configuração](/gateway/configuration).
