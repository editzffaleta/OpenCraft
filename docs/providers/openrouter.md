---
summary: "Usar a API unificada do OpenRouter para acessar muitos modelos no OpenCraft"
read_when:
  - Você quer uma única chave de API para muitos LLMs
  - Você quer rodar modelos via OpenRouter no OpenCraft
title: "OpenRouter"
---

# OpenRouter

O OpenRouter fornece uma **API unificada** que roteia requisições para muitos modelos atrás de um único
endpoint e chave de API. É compatível com OpenAI, então a maioria dos SDKs OpenAI funciona trocando a URL base.

## Configuração CLI

```bash
opencraft onboard --auth-choice apiKey --token-provider openrouter --token "$OPENROUTER_API_KEY"
```

## Trecho de config

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/anthropic/claude-sonnet-4-5" },
    },
  },
}
```

## Notas

- Refs de modelo são `openrouter/<provedor>/<modelo>`.
- Para mais opções de modelo/provedor, veja [/concepts/model-providers](/concepts/model-providers).
- O OpenRouter usa um token Bearer com sua chave de API internamente.
