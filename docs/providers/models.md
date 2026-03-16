---
summary: "Provedores de modelo (LLMs) suportados pelo OpenCraft"
read_when:
  - Você quer escolher um provedor de modelo
  - Você quer exemplos rápidos de configuração de auth + seleção de modelo LLM
title: "Início Rápido de Provedores de Modelo"
---

# Provedores de Modelo

O OpenCraft pode usar muitos provedores de LLM. Escolha um, autentique-se e defina o
modelo padrão como `provedor/modelo`.

## Início rápido (dois passos)

1. Autentique-se com o provedor (geralmente via `opencraft onboard`).
2. Defina o modelo padrão:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provedores suportados (conjunto inicial)

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

Para o catálogo completo de provedores (xAI, Groq, Mistral, etc.) e configuração avançada,
veja [Provedores de modelo](/concepts/model-providers).
