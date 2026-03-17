---
summary: "Execute o OpenCraft com vLLM (servidor local compatível com OpenAI)"
read_when:
  - Você quer executar o OpenCraft contra um servidor vLLM local
  - Você quer endpoints /v1 compatíveis com OpenAI com seus próprios modelos
title: "vLLM"
---

# vLLM

O vLLM pode servir modelos open-source (e alguns personalizados) via uma API HTTP **compatível com OpenAI**. O OpenCraft pode se conectar ao vLLM usando a API `openai-completions`.

O OpenCraft também pode **descobrir automaticamente** modelos disponíveis do vLLM quando você opta por usar `VLLM_API_KEY` (qualquer valor funciona se seu servidor não exigir autenticação) e você não define uma entrada explícita em `models.providers.vllm`.

## Início rápido

1. Inicie o vLLM com um servidor compatível com OpenAI.

Sua URL base deve expor endpoints `/v1` (por exemplo `/v1/models`, `/v1/chat/completions`). O vLLM normalmente roda em:

- `http://127.0.0.1:8000/v1`

2. Opte por participar (qualquer valor funciona se não houver autenticação configurada):

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

## Descoberta de modelos (provider implícito)

Quando `VLLM_API_KEY` está definido (ou existe um perfil de autenticação) e você **não** define `models.providers.vllm`, o OpenCraft irá consultar:

- `GET http://127.0.0.1:8000/v1/models`

...e converter os IDs retornados em entradas de modelo.

Se você definir `models.providers.vllm` explicitamente, a descoberta automática é ignorada e você deve definir os modelos manualmente.

## Configuração explícita (modelos manuais)

Use config explícito quando:

- O vLLM roda em um host/porta diferente.
- Você quer fixar valores de `contextWindow`/`maxTokens`.
- Seu servidor requer uma API key real (ou você quer controlar os headers).

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
            name: "Local vLLM Model",
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

## Solução de problemas

- Verifique se o servidor está acessível:

```bash
curl http://127.0.0.1:8000/v1/models
```

- Se as requisições falharem com erros de autenticação, defina uma `VLLM_API_KEY` real que corresponda à configuração do seu servidor, ou configure o provider explicitamente em `models.providers.vllm`.
