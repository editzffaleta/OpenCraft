---
summary: "Clusters de refatoração com maior potencial de redução de LOC"
read_when:
  - Você quer reduzir o total de LOC sem alterar o comportamento
  - Você está escolhendo a próxima passagem de deduplicação ou extração
title: "Backlog de Clusters de Refatoração"
---

# Backlog de Clusters de Refatoração

Classificado por provável redução de LOC, segurança e abrangência.

## 1. Scaffolding de configuração e segurança de plugins de canal

Cluster de maior valor.

Formatos repetidos em muitos plugins de canal:

- `config.listAccountIds`
- `config.resolveAccount`
- `config.defaultAccountId`
- `config.setAccountEnabled`
- `config.deleteAccount`
- `config.describeAccount`
- `security.resolveDmPolicy`

Exemplos representativos:

- `extensions/telegram/src/channel.ts`
- `extensions/googlechat/src/channel.ts`
- `extensions/slack/src/channel.ts`
- `extensions/discord/src/channel.ts`
- `extensions/matrix/src/channel.ts`
- `extensions/irc/src/channel.ts`
- `extensions/signal/src/channel.ts`
- `extensions/mattermost/src/channel.ts`

Formato de extração provável:

- `buildChannelConfigAdapter(...)`
- `buildMultiAccountConfigAdapter(...)`
- `buildDmSecurityAdapter(...)`

Economia esperada:

- ~250-450 LOC

Risco:

- Médio. Cada canal tem um `isConfigured`, avisos e normalização ligeiramente diferentes.

## 2. Boilerplate de singleton de runtime de extensão

Muito seguro.

Quase toda extensão tem o mesmo holder de runtime:

- `let runtime: PluginRuntime | null = null`
- `setXRuntime`
- `getXRuntime`

Exemplos representativos:

- `extensions/telegram/src/runtime.ts`
- `extensions/matrix/src/runtime.ts`
- `extensions/slack/src/runtime.ts`
- `extensions/discord/src/runtime.ts`
- `extensions/whatsapp/src/runtime.ts`
- `extensions/imessage/src/runtime.ts`
- `extensions/twitch/src/runtime.ts`

Variantes com casos especiais:

- `extensions/bluebubbles/src/runtime.ts`
- `extensions/line/src/runtime.ts`
- `extensions/synology-chat/src/runtime.ts`

Formato de extração provável:

- `createPluginRuntimeStore<T>(errorMessage)`

Economia esperada:

- ~180-260 LOC

Risco:

- Baixo

## 3. Passos de prompt de onboarding e patch de configuração

Grande área de superfície.

Muitos arquivos de onboarding repetem:

- resolver account id
- prompt de entradas de allowlist
- mesclar allowFrom
- definir política de DM
- prompt de segredos
- patch de configuração de nível superior vs com escopo de conta

Exemplos representativos:

- `extensions/bluebubbles/src/onboarding.ts`
- `extensions/googlechat/src/onboarding.ts`
- `extensions/msteams/src/onboarding.ts`
- `extensions/zalo/src/onboarding.ts`
- `extensions/zalouser/src/onboarding.ts`
- `extensions/nextcloud-talk/src/onboarding.ts`
- `extensions/matrix/src/onboarding.ts`
- `extensions/irc/src/onboarding.ts`

Seam de helper existente:

- `src/channels/plugins/onboarding/helpers.ts`

Formato de extração provável:

- `promptAllowFromList(...)`
- `buildDmPolicyAdapter(...)`
- `applyScopedAccountPatch(...)`
- `promptSecretFields(...)`

Economia esperada:

- ~300-600 LOC

Risco:

- Médio. Fácil de super-generalizar; manter helpers estreitos e combináveis.

## 4. Fragmentos de config-schema multi-conta

Fragmentos de schema repetidos entre extensões.

Padrões comuns:

- `const allowFromEntry = z.union([z.string(), z.number()])`
- schema de conta mais:
  - `accounts: z.object({}).catchall(accountSchema).optional()`
  - `defaultAccount: z.string().optional()`
- campos repetidos de DM/grupo
- campos repetidos de política de markdown/ferramenta

Exemplos representativos:

- `extensions/bluebubbles/src/config-schema.ts`
- `extensions/zalo/src/config-schema.ts`
- `extensions/zalouser/src/config-schema.ts`
- `extensions/matrix/src/config-schema.ts`
- `extensions/nostr/src/config-schema.ts`

Formato de extração provável:

- `AllowFromEntrySchema`
- `buildMultiAccountChannelSchema(accountSchema)`
- `buildCommonDmGroupFields(...)`

Economia esperada:

- ~120-220 LOC

Risco:

- Baixo a médio. Alguns schemas são simples, outros são especiais.

## 5. Ciclo de vida de startup de webhook e monitor

Bom cluster de valor médio.

Padrões repetidos de `startAccount` / configuração de monitor:

- resolver conta
- computar caminho de webhook
- registrar startup
- iniciar monitor
- aguardar abort
- cleanup
- atualizações do sink de status

Exemplos representativos:

- `extensions/googlechat/src/channel.ts`
- `extensions/bluebubbles/src/channel.ts`
- `extensions/zalo/src/channel.ts`
- `extensions/telegram/src/channel.ts`
- `extensions/nextcloud-talk/src/channel.ts`

Seam de helper existente:

- `src/plugin-sdk/channel-lifecycle.ts`

Formato de extração provável:

- helper para ciclo de vida de monitor de conta
- helper para startup de conta com webhook

Economia esperada:

- ~150-300 LOC

Risco:

- Médio a alto. Detalhes de transporte divergem rapidamente.

## 6. Limpeza de clones exatos pequenos

Bucket de limpeza de baixo risco.

Exemplos:

- detecção de argv do gateway duplicada:
  - `src/infra/gateway-lock.ts`
  - `src/cli/daemon-cli/lifecycle.ts`
- renderização de diagnósticos de porta duplicada:
  - `src/cli/daemon-cli/restart-health.ts`
- construção de chave de sessão duplicada:
  - `src/web/auto-reply/monitor/broadcast.ts`

Economia esperada:

- ~30-60 LOC

Risco:

- Baixo

## Clusters de testes

### Fixtures de eventos de webhook do LINE

Exemplos representativos:

- `src/line/bot-handlers.test.ts`

Extração provável:

- `makeLineEvent(...)`
- `runLineEvent(...)`
- `makeLineAccount(...)`

Economia esperada:

- ~120-180 LOC

### Matriz de autenticação de comandos nativos do Telegram

Exemplos representativos:

- `src/telegram/bot-native-commands.group-auth.test.ts`
- `src/telegram/bot-native-commands.plugin-auth.test.ts`

Extração provável:

- construtor de contexto de fórum
- helper de asserção de mensagem negada
- casos de autenticação orientados por tabela

Economia esperada:

- ~80-140 LOC

### Configuração de ciclo de vida do Zalo

Exemplos representativos:

- `extensions/zalo/src/monitor.lifecycle.test.ts`

Extração provável:

- harness compartilhado de configuração de monitor

Economia esperada:

- ~50-90 LOC

### Testes de opção não suportada de llm-context do Brave

Exemplos representativos:

- `src/agents/tools/web-tools.enabled-defaults.test.ts`

Extração provável:

- matriz `it.each(...)`

Economia esperada:

- ~30-50 LOC

## Ordem sugerida

1. Boilerplate de singleton de runtime
2. Limpeza de clones exatos pequenos
3. Extração de builders de configuração e segurança
4. Extração de helpers de teste
5. Extração de passos de onboarding
6. Extração de helper de ciclo de vida de monitor
