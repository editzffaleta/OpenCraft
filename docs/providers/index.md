---
summary: "Providers de modelo (LLMs) suportados pelo OpenCraft"
read_when:
  - Você quer escolher um provider de modelo
  - Você precisa de uma visão geral rápida dos backends de LLM suportados
title: "Providers de Modelo"
---

# Providers de Modelo

O OpenCraft pode usar muitos providers de LLM. Escolha um provider, autentique-se e depois defina o
modelo padrão como `provider/model`.

Procurando documentação de canais de chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/etc.)? Veja [Canais](/channels).

## Início rápido

1. Autentique-se com o provider (geralmente via `opencraft onboard`).
2. Defina o modelo padrão:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Documentação dos providers

- [Amazon Bedrock](/providers/bedrock)
- [Anthropic (API + Claude Code CLI)](/providers/anthropic)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [Modelos GLM](/providers/glm)
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
- [Venice (Venice AI, foco em privacidade)](/providers/venice)
- [vLLM (modelos locais)](/providers/vllm)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## Providers de transcrição

- [Deepgram (transcrição de áudio)](/providers/deepgram)

## Ferramentas comunitárias

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - Proxy comunitário para credenciais de assinatura Claude (verifique a política/termos da Anthropic antes de usar)

Para o catálogo completo de providers (xAI, Groq, Mistral, etc.) e configuração avançada,
veja [Providers de modelo](/concepts/model-providers).
