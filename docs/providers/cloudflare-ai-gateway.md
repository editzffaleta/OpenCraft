---
title: "Cloudflare AI Gateway"
summary: "Configuração do Cloudflare AI Gateway (auth + seleção de modelo)"
read_when:
  - Você quer usar o Cloudflare AI Gateway com o OpenCraft
  - Você precisa do ID de conta, ID de gateway ou variável de env de chave de API
---

# Cloudflare AI Gateway

O Cloudflare AI Gateway fica na frente das APIs de provedores e permite adicionar analytics, cache e controles. Para Anthropic, o OpenCraft usa a API de Mensagens Anthropic pelo seu endpoint do Gateway.

- Provedor: `cloudflare-ai-gateway`
- URL base: `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
- Modelo padrão: `cloudflare-ai-gateway/claude-sonnet-4-5`
- Chave de API: `CLOUDFLARE_AI_GATEWAY_API_KEY` (sua chave de API do provedor para requisições pelo Gateway)

Para modelos Anthropic, use sua chave de API Anthropic.

## Início rápido

1. Defina a chave de API do provedor e os detalhes do Gateway:

```bash
opencraft onboard --auth-choice cloudflare-ai-gateway-api-key
```

2. Defina um modelo padrão:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
    },
  },
}
```

## Exemplo não-interativo

```bash
opencraft onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Gateways autenticados

Se você habilitou autenticação de Gateway no Cloudflare, adicione o header `cf-aig-authorization` (além da sua chave de API do provedor).

```json5
{
  models: {
    providers: {
      "cloudflare-ai-gateway": {
        headers: {
          "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
        },
      },
    },
  },
}
```

## Nota sobre ambiente

Se o Gateway roda como daemon (launchd/systemd), certifique-se de que `CLOUDFLARE_AI_GATEWAY_API_KEY` está disponível para esse processo (por exemplo, em `~/.opencraft/.env` ou via `env.shellEnv`).
