---
summary: "Usar Z.AI (modelos GLM) com o OpenCraft"
read_when:
  - Você quer modelos Z.AI / GLM no OpenCraft
  - Você precisa de uma configuração simples com ZAI_API_KEY
title: "Z.AI"
---

# Z.AI

O Z.AI é a plataforma de API para modelos **GLM**. Fornece APIs REST para GLM e usa chaves de API
para autenticação. Crie sua chave de API no console do Z.AI. O OpenCraft usa o provedor `zai`
com uma chave de API do Z.AI.

## Configuração CLI

```bash
# Coding Plan Global, recomendado para usuários do Coding Plan
opencraft onboard --auth-choice zai-coding-global

# Coding Plan CN (região China), recomendado para usuários do Coding Plan
opencraft onboard --auth-choice zai-coding-cn

# API geral
opencraft onboard --auth-choice zai-global

# API geral CN (região China)
opencraft onboard --auth-choice zai-cn
```

## Trecho de config

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

## Notas

- Modelos GLM estão disponíveis como `zai/<model>` (exemplo: `zai/glm-5`).
- `tool_stream` está habilitado por padrão para streaming de chamadas de tool do Z.AI. Defina
  `agents.defaults.models["zai/<model>"].params.tool_stream` como `false` para desabilitá-lo.
- Veja [/providers/glm](/providers/glm) para a visão geral da família de modelos.
- O Z.AI usa auth Bearer com sua chave de API.
