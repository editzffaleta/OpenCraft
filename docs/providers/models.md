---
summary: "Providers de modelo (LLMs) suportados pelo OpenCraft"
read_when:
  - Você quer escolher um provider de modelo
  - Você quer exemplos rápidos de configuração de autenticação de LLM + seleção de modelo
title: "Início Rápido de Providers de Modelo"
---

# Providers de Modelo

O OpenCraft pode usar diversos providers de LLM. Escolha um, autentique-se e defina o modelo
padrão como `provider/model`.

## Início rápido (dois passos)

1. Autentique-se com o provider (geralmente via `opencraft onboard`).
2. Defina o modelo padrão:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Providers suportados (conjunto inicial)

- [OpenAI (API + Codex)](/providers/openai)
- [Anthropic (API + Claude Code CLI)](/providers/anthropic)
- [OpenRouter](/providers/openrouter)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [Mistral](/providers/mistral)
- [Synthetic](/providers/synthetic)
- [OpenCode (Zen + Go)](/providers/opencode)
- [Z.AI](/providers/zai)
- [Modelos GLM](/providers/glm)
- [MiniMax](/providers/minimax)
- [Venice (Venice AI)](/providers/venice)
- [Amazon Bedrock](/providers/bedrock)
- [Qianfan](/providers/qianfan)

Para o catálogo completo de providers (xAI, Groq, Mistral, etc.) e configuração avançada,
veja [Providers de modelo](/concepts/model-providers).
