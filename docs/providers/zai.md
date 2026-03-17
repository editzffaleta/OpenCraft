---
summary: "Use o Z.AI (modelos GLM) com o OpenCraft"
read_when:
  - Você quer modelos Z.AI / GLM no OpenCraft
  - Você precisa de uma configuração simples de ZAI_API_KEY
title: "Z.AI"
---

# Z.AI

Z.AI é a plataforma de API para modelos **GLM**. Ela fornece APIs REST para GLM e usa API keys
para autenticação. Crie sua API key no console do Z.AI. O OpenCraft usa o provider `zai`
com uma API key Z.AI.

## Configuração via CLI

```bash
# Coding Plan Global, recomendado para usuários do Coding Plan
opencraft onboard --auth-choice zai-coding-global

# Coding Plan CN (região da China), recomendado para usuários do Coding Plan
opencraft onboard --auth-choice zai-coding-cn

# API geral
opencraft onboard --auth-choice zai-global

# API geral CN (região da China)
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
- `tool_stream` está habilitado por padrão para streaming de chamadas de ferramentas do Z.AI. Defina
  `agents.defaults.models["zai/<model>"].params.tool_stream` como `false` para desabilitar.
- Veja [/providers/glm](/providers/glm) para a visão geral da família de modelos.
- O Z.AI usa autenticação Bearer com sua API key.
