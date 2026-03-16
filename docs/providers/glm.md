---
summary: "Visão geral da família de modelos GLM e como usá-la no OpenCraft"
read_when:
  - Você quer modelos GLM no OpenCraft
  - Você precisa da convenção de nomenclatura de modelos e configuração
title: "Modelos GLM"
---

# Modelos GLM

O GLM é uma **família de modelos** (não uma empresa) disponível pela plataforma Z.AI. No OpenCraft, os
modelos GLM são acessados via provedor `zai` e IDs de modelo como `zai/glm-5`.

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

- Versões e disponibilidade do GLM podem mudar; verifique os docs do Z.AI para as mais recentes.
- Exemplos de IDs de modelo incluem `glm-5`, `glm-4.7` e `glm-4.6`.
- Para detalhes do provedor, veja [/providers/zai](/providers/zai).
