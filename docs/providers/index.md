---
summary: "Provedores de modelo (LLMs) suportados pelo OpenCraft"
read_when:
  - Você quer escolher um provedor de modelo
  - Você precisa de uma visão geral rápida dos backends LLM suportados
title: "Provedores de Modelo"
---

# Provedores de Modelo

O OpenCraft pode usar muitos provedores LLM. Escolha um provedor, autentique, depois defina o
modelo padrão como `provedor/modelo`.

Procurando docs de canais de chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/etc.)? Veja [Canais](/channels).

## Início rápido

1. Autentique com o provedor (geralmente via `opencraft onboard`).
2. Defina o modelo padrão:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Docs de provedores

- [Amazon Bedrock](/providers/bedrock)
- [Anthropic (API + Claude Code CLI)](/providers/anthropic)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [GLM models](/providers/glm)
- [Hugging Face (Inference)](/providers/huggingface)
- [Kilocode](/providers/kilocode)
- [LiteLLM (gateway unificado)](/providers/litellm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama (modelos em nuvem + locais)](/providers/ollama)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode (Zen + Go)](/providers/opencode)
- [OpenRouter](/providers/openrouter)
- [Qianfan](/providers/qianfan)
- [Qwen (OAuth)](/providers/qwen)
- [Together AI](/providers/together)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Venice (Venice AI, focado em privacidade)](/providers/venice)
- [vLLM (modelos locais)](/providers/vllm)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## Provedores de transcrição

- [Deepgram (transcrição de áudio)](/providers/deepgram)

## Ferramentas da comunidade

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - Proxy comunitário para credenciais de assinatura Claude (verifique a política/termos da Anthropic antes de usar)

Para o catálogo completo de provedores (xAI, Groq, Mistral, etc.) e configuração avançada,
veja [Provedores de modelo](/concepts/model-providers).
