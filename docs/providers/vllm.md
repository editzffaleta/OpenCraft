---
summary: "Rodar o OpenCraft com vLLM (servidor local compatível com OpenAI)"
read_when:
  - Você quer rodar o OpenCraft contra um servidor vLLM local
  - Você quer endpoints /v1 compatíveis com OpenAI com seus próprios modelos
title: "vLLM"
---

# vLLM

O vLLM pode servir modelos open-source (e alguns personalizados) via uma API HTTP **compatível com OpenAI**. O OpenCraft pode conectar ao vLLM usando a API `openai-completions`.

O OpenCraft também pode **auto-descobrir** modelos disponíveis no vLLM quando você opta com `VLLM_API_KEY` (qualquer valor funciona se seu servidor não enforça auth) e não define uma entrada explícita `models.providers.vllm`.

## Início rápido

1. Inicie o vLLM com um servidor compatível com OpenAI.

Sua URL base deve expor endpoints `/v1` (ex: `/v1/models`, `/v1/chat/completions`). O vLLM geralmente roda em:

- `http://127.0.0.1:8000/v1`

2. Opte pelo provedor (qualquer valor funciona se nenhuma auth estiver configurada):

```bash
export VLLM_API_KEY="vllm-local"
```

3. Selecione um modelo (substitua por um dos IDs de modelo do seu vLLM):

```json5
{
  agents: {
    defaults: {
      model: { primary: "vllm/your-model-id" },
    },
  },
}
```

## Descoberta de modelos (provedor implícito)

Quando `VLLM_API_KEY` está definido (ou um perfil de auth existe) e você **não** define `models.providers.vllm`, o OpenCraft consultará:

- `GET http://127.0.0.1:8000/v1/models`

...e converterá os IDs retornados em entradas de modelo.

Se você definir `models.providers.vllm` explicitamente, a auto-descoberta é pulada e você deve definir modelos manualmente.

## Configuração explícita (modelos manuais)

Use config explícita quando:

- O vLLM roda em outro host/porta.
- Você quer fixar valores de `contextWindow`/`maxTokens`.
- Seu servidor requer uma chave de API real (ou você quer controlar headers).

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Modelo vLLM Local",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Troubleshooting

- Verifique se o servidor está acessível:

```bash
curl http://127.0.0.1:8000/v1/models
```

- Se as requisições falharem com erros de auth, defina um `VLLM_API_KEY` real que corresponda à sua configuração de servidor, ou configure o provedor explicitamente em `models.providers.vllm`.
