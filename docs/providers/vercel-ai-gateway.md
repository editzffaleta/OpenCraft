---
title: "Vercel AI Gateway"
summary: "Configuração do Vercel AI Gateway (auth + seleção de modelo)"
read_when:
  - Você quer usar o Vercel AI Gateway com o OpenCraft
  - Você precisa da variável de env de chave de API ou da opção de auth CLI
---

# Vercel AI Gateway

O [Vercel AI Gateway](https://vercel.com/ai-gateway) fornece uma API unificada para acessar centenas de modelos por um único endpoint.

- Provedor: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- API: compatível com Anthropic Messages
- O OpenCraft auto-descobre o catálogo `/v1/models` do Gateway, então `/models vercel-ai-gateway`
  inclui refs de modelo atuais como `vercel-ai-gateway/openai/gpt-5.4`.

## Início rápido

1. Defina a chave de API (recomendado: armazene-a para o Gateway):

```bash
opencraft onboard --auth-choice ai-gateway-api-key
```

2. Defina um modelo padrão:

```json5
{
  agents: {
    defaults: {
      model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
    },
  },
}
```

## Exemplo não-interativo

```bash
opencraft onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Nota sobre ambiente

Se o Gateway roda como daemon (launchd/systemd), certifique-se de que `AI_GATEWAY_API_KEY`
está disponível para esse processo (por exemplo, em `~/.opencraft/.env` ou via
`env.shellEnv`).

## Abreviação de ID de modelo

O OpenCraft aceita refs de modelo Claude abreviados do Vercel e as normaliza em
runtime:

- `vercel-ai-gateway/claude-opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4.6`
- `vercel-ai-gateway/opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4-6`
