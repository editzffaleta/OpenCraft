---
summary: "Execute OpenCraft com LLMs locais (LM Studio, vLLM, LiteLLM, endpoints customizados compatíveis com OpenAI)"
read_when:
  - Você quer servir modelos do seu próprio setup GPU
  - Você está conectando LM Studio ou um proxy compatível com OpenAI
  - Você precisa da orientação mais segura para modelos locais
title: "Local Models"
---

# Modelos locais

Local é viável, mas OpenCraft espera contexto grande + defesas fortes contra injeção de prompt. Placas pequenas truncam contexto e vazam segurança. Mire alto: **≥2 Mac Studios maximizados ou setup GPU equivalente (~$30k+)**. Uma única **GPU de 24 GB** funciona apenas para prompts mais leves com maior latência. Use a **variante de modelo maior / tamanho completo que você consegue executar**; checkpoints agressivamente quantizados ou "pequenos" aumentam o risco de injeção de prompt (veja [Security](/gateway/security)).

Se você quer o setup local com menor fricção, comece com [Ollama](/providers/ollama) e `opencraft onboard`. Esta página é o guia opinativo para stacks locais de alto desempenho e servidores locais customizados compatíveis com OpenAI.

## Recomendado: LM Studio + MiniMax M2.5 (Responses API, tamanho completo)

Melhor stack local atual. Carregue MiniMax M2.5 no LM Studio, habilite o servidor local (padrão `http://127.0.0.1:1234`) e use Responses API para manter raciocínio separado do texto final.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.5-gs32" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/minimax-m2.5-gs32": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Checklist de setup**

- Instale o LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- No LM Studio, baixe o **maior build do MiniMax M2.5 disponível** (evite variantes "small"/fortemente quantizadas), inicie o servidor, confirme que `http://127.0.0.1:1234/v1/models` o lista.
- Mantenha o modelo carregado; cold-load adiciona latência de inicialização.
- Ajuste `contextWindow`/`maxTokens` se seu build do LM Studio difere.
- Para WhatsApp, use Responses API para que apenas o texto final seja enviado.

Mantenha modelos hospedados configurados mesmo ao executar local; use `models.mode: "merge"` para que fallbacks permaneçam disponíveis.

### Config híbrida: primário hospedado, fallback local

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-5",
        fallbacks: ["lmstudio/minimax-m2.5-gs32", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
        "lmstudio/minimax-m2.5-gs32": { alias: "MiniMax Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Local-first com rede de segurança hospedada

Inverta a ordem de primário e fallback; mantenha o mesmo bloco de providers e `models.mode: "merge"` para que você possa usar Sonnet ou Opus como fallback quando o setup local estiver fora do ar.

### Hospedagem regional / roteamento de dados

- Variantes hospedadas MiniMax/Kimi/GLM também existem no OpenRouter com endpoints fixados por região (ex. hospedado nos EUA). Escolha a variante regional lá para manter tráfego na jurisdição escolhida enquanto ainda usa `models.mode: "merge"` para fallbacks Anthropic/OpenAI.
- Apenas local permanece o caminho de privacidade mais forte; roteamento regional hospedado é o meio-termo quando você precisa de recursos de provider mas quer controle sobre fluxo de dados.

## Outros proxies locais compatíveis com OpenAI

vLLM, LiteLLM, OAI-proxy ou gateways customizados funcionam se expõem um endpoint estilo OpenAI `/v1`. Substitua o bloco de provider acima com seu endpoint e ID de modelo:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Mantenha `models.mode: "merge"` para que modelos hospedados permaneçam disponíveis como fallbacks.

## Solução de problemas

- Gateway consegue alcançar o proxy? `curl http://127.0.0.1:1234/v1/models`.
- Modelo do LM Studio descarregado? Recarregue; cold start é uma causa comum de "travamento".
- Erros de contexto? Diminua `contextWindow` ou aumente o limite do seu servidor.
- Segurança: modelos locais pulam filtros do lado do provider; mantenha agentes restritos e compactação ligada para limitar o raio de impacto de injeção de prompt.
