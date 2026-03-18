# Design de Integração do Kilo Gateway Provider

## Visão Geral

Este documento descreve o design para integrar o "Kilo Gateway" como um provider de primeira classe no OpenCraft, modelado após a implementação existente do OpenRouter. O Kilo Gateway usa uma API de completions compatível com OpenAI com uma URL base diferente.

## Decisões de Design

### 1. Nomenclatura do Provider

**Recomendação: `kilocode`**

Justificativa:

- Corresponde ao exemplo de configuração do usuário fornecido (chave de provider `kilocode`)
- Consistente com os padrões de nomenclatura de provider existentes (ex.: `openrouter`, `opencode`, `moonshot`)
- Curto e memorável
- Evita confusão com termos genéricos "kilo" ou "gateway"

Alternativa considerada: `kilo-gateway` - rejeitada porque nomes hifenizados são menos comuns no codebase e `kilocode` é mais conciso.

### 2. Referência de Modelo Padrão

**Recomendação: `kilocode/anthropic/claude-opus-4.6`**

Justificativa:

- Baseado no exemplo de configuração do usuário
- Claude Opus 4.5 é um modelo padrão capaz
- A seleção explícita de modelo evita dependência de auto-roteamento

### 3. Configuração de URL Base

**Recomendação: Padrão codificado com override de configuração**

- **URL Base Padrão:** `https://api.kilo.ai/api/gateway/`
- **Configurável:** Sim, via `models.providers.kilocode.baseUrl`

Isso corresponde ao padrão usado por outros providers como Moonshot, Venice e Synthetic.

### 4. Varredura de Modelos

**Recomendação: Sem endpoint dedicado de varredura de modelos inicialmente**

Justificativa:

- O Kilo Gateway faz proxy para o OpenRouter, então os modelos são dinâmicos
- Os usuários podem configurar modelos manualmente em sua configuração
- Se o Kilo Gateway expuser um endpoint `/models` no futuro, a varredura pode ser adicionada

### 5. Tratamento Especial

**Recomendação: Herdar o comportamento do OpenRouter para modelos Anthropic**

Como o Kilo Gateway faz proxy para o OpenRouter, o mesmo tratamento especial deve se aplicar:

- Elegibilidade de Cache TTL para modelos `anthropic/*`
- Parâmetros extras (cacheControlTtl) para modelos `anthropic/*`
- A política de transcript segue os padrões do OpenRouter

## Arquivos a Modificar

### Gerenciamento Central de Credenciais

#### 1. `src/commands/onboard-auth.credentials.ts`

Adicionar:

```typescript
export const KILOCODE_DEFAULT_MODEL_REF = "kilocode/anthropic/claude-opus-4.6";

export async function setKilocodeApiKey(key: string, agentDir?: string) {
  upsertAuthProfile({
    profileId: "kilocode:default",
    credential: {
      type: "api_key",
      provider: "kilocode",
      key,
    },
    agentDir: resolveAuthAgentDir(agentDir),
  });
}
```

#### 2. `src/agents/model-auth.ts`

Adicionar ao `envMap` em `resolveEnvApiKey()`:

```typescript
const envMap: Record<string, string> = {
  // ... entradas existentes
  kilocode: "KILOCODE_API_KEY",
};
```

#### 3. `src/config/io.ts`

Adicionar a `SHELL_ENV_EXPECTED_KEYS`:

```typescript
const SHELL_ENV_EXPECTED_KEYS = [
  // ... entradas existentes
  "KILOCODE_API_KEY",
];
```

### Aplicação de Configuração

#### 4. `src/commands/onboard-auth.config-core.ts`

Adicionar novas funções:

```typescript
export const KILOCODE_BASE_URL = "https://api.kilo.ai/api/gateway/";

export function applyKilocodeProviderConfig(cfg: OpenCraftConfig): OpenCraftConfig {
  const models = { ...cfg.agents?.defaults?.models };
  models[KILOCODE_DEFAULT_MODEL_REF] = {
    ...models[KILOCODE_DEFAULT_MODEL_REF],
    alias: models[KILOCODE_DEFAULT_MODEL_REF]?.alias ?? "Kilo Gateway",
  };

  const providers = { ...cfg.models?.providers };
  const existingProvider = providers.kilocode;
  const { apiKey: existingApiKey, ...existingProviderRest } = (existingProvider ?? {}) as Record<
    string,
    unknown
  > as { apiKey?: string };
  const resolvedApiKey = typeof existingApiKey === "string" ? existingApiKey : undefined;
  const normalizedApiKey = resolvedApiKey?.trim();

  providers.kilocode = {
    ...existingProviderRest,
    baseUrl: KILOCODE_BASE_URL,
    api: "openai-completions",
    ...(normalizedApiKey ? { apiKey: normalizedApiKey } : {}),
  };

  return {
    ...cfg,
    agents: {
      ...cfg.agents,
      defaults: {
        ...cfg.agents?.defaults,
        models,
      },
    },
    models: {
      mode: cfg.models?.mode ?? "merge",
      providers,
    },
  };
}

export function applyKilocodeConfig(cfg: OpenCraftConfig): OpenCraftConfig {
  const next = applyKilocodeProviderConfig(cfg);
  const existingModel = next.agents?.defaults?.model;
  return {
    ...next,
    agents: {
      ...next.agents,
      defaults: {
        ...next.agents?.defaults,
        model: {
          ...(existingModel && "fallbacks" in (existingModel as Record<string, unknown>)
            ? {
                fallbacks: (existingModel as { fallbacks?: string[] }).fallbacks,
              }
            : undefined),
          primary: KILOCODE_DEFAULT_MODEL_REF,
        },
      },
    },
  };
}
```

### Sistema de Escolha de Auth

#### 5. `src/commands/onboard-types.ts`

Adicionar ao tipo `AuthChoice`:

```typescript
export type AuthChoice =
  // ... escolhas existentes
  "kilocode-api-key";
// ...
```

Adicionar a `OnboardOptions`:

```typescript
export type OnboardOptions = {
  // ... opções existentes
  kilocodeApiKey?: string;
  // ...
};
```

#### 6. `src/commands/auth-choice-options.ts`

Adicionar a `AuthChoiceGroupId`:

```typescript
export type AuthChoiceGroupId =
  // ... grupos existentes
  "kilocode";
// ...
```

Adicionar a `AUTH_CHOICE_GROUP_DEFS`:

```typescript
{
  value: "kilocode",
  label: "Kilo Gateway",
  hint: "API key (OpenRouter-compatible)",
  choices: ["kilocode-api-key"],
},
```

Adicionar a `buildAuthChoiceOptions()`:

```typescript
options.push({
  value: "kilocode-api-key",
  label: "Kilo Gateway API key",
  hint: "OpenRouter-compatible gateway",
});
```

#### 7. `src/commands/auth-choice.preferred-provider.ts`

Adicionar mapeamento:

```typescript
const PREFERRED_PROVIDER_BY_AUTH_CHOICE: Partial<Record<AuthChoice, string>> = {
  // ... mapeamentos existentes
  "kilocode-api-key": "kilocode",
};
```

### Aplicação da Escolha de Auth

#### 8. `src/commands/auth-choice.apply.api-providers.ts`

Adicionar import:

```typescript
import {
  // ... imports existentes
  applyKilocodeConfig,
  applyKilocodeProviderConfig,
  KILOCODE_DEFAULT_MODEL_REF,
  setKilocodeApiKey,
} from "./onboard-auth.js";
```

Adicionar tratamento para `kilocode-api-key`:

```typescript
if (authChoice === "kilocode-api-key") {
  const store = ensureAuthProfileStore(params.agentDir, {
    allowKeychainPrompt: false,
  });
  const profileOrder = resolveAuthProfileOrder({
    cfg: nextConfig,
    store,
    provider: "kilocode",
  });
  const existingProfileId = profileOrder.find((profileId) => Boolean(store.profiles[profileId]));
  const existingCred = existingProfileId ? store.profiles[existingProfileId] : undefined;
  let profileId = "kilocode:default";
  let mode: "api_key" | "oauth" | "token" = "api_key";
  let hasCredential = false;

  if (existingProfileId && existingCred?.type) {
    profileId = existingProfileId;
    mode =
      existingCred.type === "oauth" ? "oauth" : existingCred.type === "token" ? "token" : "api_key";
    hasCredential = true;
  }

  if (!hasCredential && params.opts?.token && params.opts?.tokenProvider === "kilocode") {
    await setKilocodeApiKey(normalizeApiKeyInput(params.opts.token), params.agentDir);
    hasCredential = true;
  }

  if (!hasCredential) {
    const envKey = resolveEnvApiKey("kilocode");
    if (envKey) {
      const useExisting = await params.prompter.confirm({
        message: `Use existing KILOCODE_API_KEY (${envKey.source}, ${formatApiKeyPreview(envKey.apiKey)})?`,
        initialValue: true,
      });
      if (useExisting) {
        await setKilocodeApiKey(envKey.apiKey, params.agentDir);
        hasCredential = true;
      }
    }
  }

  if (!hasCredential) {
    const key = await params.prompter.text({
      message: "Enter Kilo Gateway API key",
      validate: validateApiKeyInput,
    });
    await setKilocodeApiKey(normalizeApiKeyInput(String(key)), params.agentDir);
    hasCredential = true;
  }

  if (hasCredential) {
    nextConfig = applyAuthProfileConfig(nextConfig, {
      profileId,
      provider: "kilocode",
      mode,
    });
  }
  {
    const applied = await applyDefaultModelChoice({
      config: nextConfig,
      setDefaultModel: params.setDefaultModel,
      defaultModel: KILOCODE_DEFAULT_MODEL_REF,
      applyDefaultConfig: applyKilocodeConfig,
      applyProviderConfig: applyKilocodeProviderConfig,
      noteDefault: KILOCODE_DEFAULT_MODEL_REF,
      noteAgentModel,
      prompter: params.prompter,
    });
    nextConfig = applied.config;
    agentModelOverride = applied.agentModelOverride ?? agentModelOverride;
  }
  return { config: nextConfig, agentModelOverride };
}
```

Também adicione o mapeamento de tokenProvider no início da função:

```typescript
if (params.opts.tokenProvider === "kilocode") {
  authChoice = "kilocode-api-key";
}
```

### Registro no CLI

#### 9. `src/cli/program/register.onboard.ts`

Adicionar opção CLI:

```typescript
.option("--kilocode-api-key <key>", "Kilo Gateway API key")
```

Adicionar ao handler de ação:

```typescript
kilocodeApiKey: opts.kilocodeApiKey as string | undefined,
```

Atualizar o texto de ajuda de auth-choice:

```typescript
.option(
  "--auth-choice <choice>",
  "Auth: setup-token|token|chutes|openai-codex|openai-api-key|openrouter-api-key|kilocode-api-key|ai-gateway-api-key|...",
)
```

### Onboarding Não-Interativo

#### 10. `src/commands/onboard-non-interactive/local/auth-choice.ts`

Adicionar tratamento para `kilocode-api-key`:

```typescript
if (authChoice === "kilocode-api-key") {
  const resolved = await resolveNonInteractiveApiKey({
    provider: "kilocode",
    cfg: baseConfig,
    flagValue: opts.kilocodeApiKey,
    flagName: "--kilocode-api-key",
    envVar: "KILOCODE_API_KEY",
  });
  await setKilocodeApiKey(resolved.apiKey, agentDir);
  nextConfig = applyAuthProfileConfig(nextConfig, {
    profileId: "kilocode:default",
    provider: "kilocode",
    mode: "api_key",
  });
  // ... aplicar modelo padrão
}
```

### Atualizações de Export

#### 11. `src/commands/onboard-auth.ts`

Adicionar exports:

```typescript
export {
  // ... exports existentes
  applyKilocodeConfig,
  applyKilocodeProviderConfig,
  KILOCODE_BASE_URL,
} from "./onboard-auth.config-core.js";

export {
  // ... exports existentes
  KILOCODE_DEFAULT_MODEL_REF,
  setKilocodeApiKey,
} from "./onboard-auth.credentials.js";
```

### Tratamento Especial (Opcional)

#### 12. `src/agents/pi-embedded-runner/cache-ttl.ts`

Adicionar suporte ao Kilo Gateway para modelos Anthropic:

```typescript
export function isCacheTtlEligibleProvider(provider: string, modelId: string): boolean {
  const normalizedProvider = provider.toLowerCase();
  const normalizedModelId = modelId.toLowerCase();
  if (normalizedProvider === "anthropic") return true;
  if (normalizedProvider === "openrouter" && normalizedModelId.startsWith("anthropic/"))
    return true;
  if (normalizedProvider === "kilocode" && normalizedModelId.startsWith("anthropic/")) return true;
  return false;
}
```

#### 13. `src/agents/transcript-policy.ts`

Adicionar tratamento do Kilo Gateway (similar ao OpenRouter):

```typescript
const isKilocodeGemini = provider === "kilocode" && modelId.toLowerCase().includes("gemini");

// Incluir na verificação needsNonImageSanitize
const needsNonImageSanitize =
  isGoogle || isAnthropic || isMistral || isOpenRouterGemini || isKilocodeGemini;
```

## Estrutura de Configuração

### Exemplo de Configuração do Usuário

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "kilocode": {
        "baseUrl": "https://api.kilo.ai/api/gateway/",
        "apiKey": "xxxxx",
        "api": "openai-completions",
        "models": [
          {
            "id": "anthropic/claude-opus-4.6",
            "name": "Anthropic: Claude Opus 4.6"
          },
          { "id": "minimax/minimax-m2.5:free", "name": "Minimax: Minimax M2.5" }
        ]
      }
    }
  }
}
```

### Estrutura do Perfil de Auth

```json
{
  "profiles": {
    "kilocode:default": {
      "type": "api_key",
      "provider": "kilocode",
      "key": "xxxxx"
    }
  }
}
```

## Considerações de Teste

1. **Testes Unitários:**
   - Teste que `setKilocodeApiKey()` escreve o perfil correto
   - Teste que `applyKilocodeConfig()` define os padrões corretos
   - Teste que `resolveEnvApiKey("kilocode")` retorna a variável de env correta

2. **Testes de Integração:**
   - Teste o fluxo de configuração com `--auth-choice kilocode-api-key`
   - Teste a configuração não-interativa com `--kilocode-api-key`
   - Teste a seleção de modelo com o prefixo `kilocode/`

3. **Testes E2E:**
   - Teste chamadas reais de API através do Kilo Gateway (testes ao vivo)

## Notas de Migração

- Nenhuma migração necessária para usuários existentes
- Novos usuários podem usar imediatamente a escolha de auth `kilocode-api-key`
- Configuração manual existente com o provider `kilocode` continuará funcionando

## Considerações Futuras

1. **Catálogo de Modelos:** Se o Kilo Gateway expuser um endpoint `/models`, adicionar suporte de varredura similar a `scanOpenRouterModels()`

2. **Suporte OAuth:** Se o Kilo Gateway adicionar OAuth, estender o sistema de auth adequadamente

3. **Rate Limiting:** Considerar adicionar tratamento de rate limit específico para o Kilo Gateway, se necessário

4. **Documentação:** Adicionar docs em `docs/providers/kilocode.md` explicando configuração e uso

## Resumo das Mudanças

| Arquivo                                                     | Tipo de Mudança | Descrição                                                               |
| ----------------------------------------------------------- | --------------- | ----------------------------------------------------------------------- |
| `src/commands/onboard-auth.credentials.ts`                  | Adicionar       | `KILOCODE_DEFAULT_MODEL_REF`, `setKilocodeApiKey()`                     |
| `src/agents/model-auth.ts`                                  | Modificar       | Adicionar `kilocode` ao `envMap`                                        |
| `src/config/io.ts`                                          | Modificar       | Adicionar `KILOCODE_API_KEY` às chaves de env do shell                  |
| `src/commands/onboard-auth.config-core.ts`                  | Adicionar       | `applyKilocodeProviderConfig()`, `applyKilocodeConfig()`                |
| `src/commands/onboard-types.ts`                             | Modificar       | Adicionar `kilocode-api-key` a `AuthChoice`, adicionar `kilocodeApiKey` às opções |
| `src/commands/auth-choice-options.ts`                       | Modificar       | Adicionar grupo e opção `kilocode`                                      |
| `src/commands/auth-choice.preferred-provider.ts`            | Modificar       | Adicionar mapeamento `kilocode-api-key`                                 |
| `src/commands/auth-choice.apply.api-providers.ts`           | Modificar       | Adicionar tratamento de `kilocode-api-key`                              |
| `src/cli/program/register.onboard.ts`                       | Modificar       | Adicionar opção `--kilocode-api-key`                                    |
| `src/commands/onboard-non-interactive/local/auth-choice.ts` | Modificar       | Adicionar tratamento não-interativo                                     |
| `src/commands/onboard-auth.ts`                              | Modificar       | Exportar novas funções                                                  |
| `src/agents/pi-embedded-runner/cache-ttl.ts`                | Modificar       | Adicionar suporte kilocode                                              |
| `src/agents/transcript-policy.ts`                           | Modificar       | Adicionar tratamento Gemini do kilocode                                 |
