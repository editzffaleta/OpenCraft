---
summary: "Visão geral da família de modelos GLM + como usar no OpenCraft"
read_when:
  - Você quer modelos GLM no OpenCraft
  - Você precisa da convenção de nomenclatura e configuração dos modelos
title: "Modelos GLM"
---

# Modelos GLM

GLM é uma **família de modelos** (não uma empresa) disponível através da plataforma Z.AI. No OpenCraft, os modelos
GLM são acessados via o provider `zai` e IDs de modelo como `zai/glm-5`.

## Configuração via CLI

```bash
# Coding Plan Global, recomendado para usuários do Coding Plan
opencraft onboard --auth-choice zai-coding-global

# Coding Plan CN (região China), recomendado para usuários do Coding Plan
opencraft onboard --auth-choice zai-coding-cn

# API Geral
opencraft onboard --auth-choice zai-global

# API Geral CN (região China)
opencraft onboard --auth-choice zai-cn
```

## Trecho de configuração

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

## Notas

- As versões e disponibilidade do GLM podem mudar; verifique a documentação do Z.AI para as mais recentes.
- Exemplos de IDs de modelo incluem `glm-5`, `glm-4.7` e `glm-4.6`.
- Para detalhes do provider, veja [/providers/zai](/providers/zai).
