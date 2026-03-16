---
summary: "Usar a API compatível com OpenAI da NVIDIA no OpenCraft"
read_when:
  - Você quer usar modelos NVIDIA no OpenCraft
  - Você precisa configurar NVIDIA_API_KEY
title: "NVIDIA"
---

# NVIDIA

A NVIDIA fornece uma API compatível com OpenAI em `https://integrate.api.nvidia.com/v1` para modelos Nemotron e NeMo. Autentique-se com uma chave de API do [NVIDIA NGC](https://catalog.ngc.nvidia.com/).

## Configuração CLI

Exporte a chave uma vez, depois execute o onboarding e defina um modelo NVIDIA:

```bash
export NVIDIA_API_KEY="nvapi-..."
opencraft onboard --auth-choice skip
opencraft models set nvidia/nvidia/llama-3.1-nemotron-70b-instruct
```

Se ainda passar `--token`, lembre-se de que ele fica no histórico do shell e na saída do `ps`; prefira a variável de env quando possível.

## Trecho de config

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/llama-3.1-nemotron-70b-instruct" },
    },
  },
}
```

## IDs de modelo

- `nvidia/llama-3.1-nemotron-70b-instruct` (padrão)
- `meta/llama-3.3-70b-instruct`
- `nvidia/mistral-nemo-minitron-8b-8k-instruct`

## Notas

- Endpoint `/v1` compatível com OpenAI; use uma chave de API do NVIDIA NGC.
- O provedor é habilitado automaticamente quando `NVIDIA_API_KEY` está definido; usa padrões estáticos (janela de contexto de 131.072 tokens, máximo de 4.096 tokens).
