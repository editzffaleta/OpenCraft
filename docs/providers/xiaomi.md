---
summary: "Use o Xiaomi MiMo (mimo-v2-flash) com o OpenCraft"
read_when:
  - Você quer modelos Xiaomi MiMo no OpenCraft
  - Você precisa configurar XIAOMI_API_KEY
title: "Xiaomi MiMo"
---

# Xiaomi MiMo

Xiaomi MiMo é a plataforma de API para modelos **MiMo**. Ela fornece APIs REST compatíveis com os
formatos OpenAI e Anthropic e usa API keys para autenticação. Crie sua API key no
[console Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys). O OpenCraft usa
o provider `xiaomi` com uma API key Xiaomi MiMo.

## Visão geral do modelo

- **mimo-v2-flash**: janela de contexto de 262144 Token, compatível com a API Anthropic Messages.
- URL base: `https://api.xiaomimimo.com/anthropic`
- Autorização: `Bearer $XIAOMI_API_KEY`

## Configuração via CLI

```bash
opencraft onboard --auth-choice xiaomi-api-key
# ou não interativo
opencraft onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## Trecho de config

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/anthropic",
        api: "anthropic-messages",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Notas

- Referência de modelo: `xiaomi/mimo-v2-flash`.
- O provider é injetado automaticamente quando `XIAOMI_API_KEY` está definido (ou existe um perfil de autenticação).
- Veja [/concepts/model-providers](/concepts/model-providers) para regras de provider.
