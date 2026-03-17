---
summary: "Use a API unificada do OpenRouter para acessar diversos modelos no OpenCraft"
read_when:
  - Você quer uma única API key para vários LLMs
  - Você quer executar modelos via OpenRouter no OpenCraft
title: "OpenRouter"
---

# OpenRouter

O OpenRouter fornece uma **API unificada** que roteia requisições para diversos modelos por trás de um único
endpoint e API key. É compatível com OpenAI, então a maioria dos SDKs OpenAI funciona trocando a URL base.

## Configuração via CLI

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

- As referências de modelo são `openrouter/<provider>/<model>`.
- Para mais opções de modelo/provider, veja [/concepts/model-providers](/concepts/model-providers).
- O OpenRouter usa um Bearer Token com sua API key internamente.
