---
summary: "Rodar o OpenCraft com SGLang (servidor self-hosted compatível com OpenAI)"
read_when:
  - Você quer rodar o OpenCraft contra um servidor SGLang local
  - Você quer endpoints /v1 compatíveis com OpenAI com seus próprios modelos
title: "SGLang"
---

# SGLang

O SGLang pode servir modelos open-source via uma API HTTP **compatível com OpenAI**.
O OpenCraft pode conectar ao SGLang usando a API `openai-completions`.

O OpenCraft também pode **auto-descobrir** modelos disponíveis no SGLang quando você opta
com `SGLANG_API_KEY` (qualquer valor funciona se seu servidor não enforça auth)
e não define uma entrada explícita `models.providers.sglang`.

## Início rápido

1. Inicie o SGLang com um servidor compatível com OpenAI.

Sua URL base deve expor endpoints `/v1` (por exemplo `/v1/models`,
`/v1/chat/completions`). O SGLang geralmente roda em:

- `http://127.0.0.1:30000/v1`

2. Opte pelo provedor (qualquer valor funciona se nenhuma auth estiver configurada):

```bash
export SGLANG_API_KEY="sglang-local"
```

3. Execute o onboarding e escolha `SGLang`, ou defina um modelo diretamente:

```bash
opencraft onboard
```

```json5
{
  agents: {
    defaults: {
      model: { primary: "sglang/your-model-id" },
    },
  },
}
```

## Descoberta de modelos (provedor implícito)

Quando `SGLANG_API_KEY` está definido (ou um perfil de auth existe) e você **não**
define `models.providers.sglang`, o OpenCraft consultará:

- `GET http://127.0.0.1:30000/v1/models`

e converterá os IDs retornados em entradas de modelo.

Se você definir `models.providers.sglang` explicitamente, a auto-descoberta é pulada e
você deve definir modelos manualmente.

## Configuração explícita (modelos manuais)

Use config explícita quando:

- O SGLang roda em outro host/porta.
- Você quer fixar valores de `contextWindow`/`maxTokens`.
- Seu servidor requer uma chave de API real (ou você quer controlar headers).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Modelo SGLang Local",
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
curl http://127.0.0.1:30000/v1/models
```

- Se as requisições falharem com erros de auth, defina um `SGLANG_API_KEY` real que corresponda
  à sua configuração de servidor, ou configure o provedor explicitamente em
  `models.providers.sglang`.
