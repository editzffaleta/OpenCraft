---
summary: "Rode o OpenCraft em LLMs locais (LM Studio, vLLM, LiteLLM, endpoints OpenAI customizados)"
read_when:
  - Você quer servir modelos do seu próprio servidor GPU
  - Você está configurando LM Studio ou um proxy compatível com OpenAI
  - Você precisa da orientação mais segura para modelos locais
title: "Modelos Locais"
---

# Modelos locais

Local é viável, mas o OpenCraft exige contexto grande + defesas fortes contra prompt injection. Cards pequenos truncam contexto e vazam segurança. Mire alto: **≥2 Mac Studios no máximo ou rig de GPU equivalente (~$30k+)**. Uma GPU única de **24 GB** funciona apenas para prompts mais leves com maior latência. Use a **variante de modelo maior/completa que você conseguir rodar**; checkpoints agressivamente quantizados ou "pequenos" aumentam o risco de prompt injection (veja [Segurança](/gateway/security)).

Se você quer a configuração local com menor fricção, comece com [Ollama](/providers/ollama) e `opencraft onboard`. Esta página é o guia opinado para stacks locais mais avançados e servidores locais compatíveis com OpenAI customizados.

## Recomendado: LM Studio + MiniMax M2.5 (Responses API, tamanho completo)

Melhor stack local atual. Carregue MiniMax M2.5 no LM Studio, habilite o servidor local (padrão `http://127.0.0.1:1234`), e use a Responses API para manter o reasoning separado do texto final.

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

**Checklist de configuração**

- Instale o LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- No LM Studio, baixe o **maior build MiniMax M2.5 disponível** (evite variantes "small"/fortemente quantizadas), inicie o servidor, confirme que `http://127.0.0.1:1234/v1/models` o lista.
- Mantenha o modelo carregado; cold-load adiciona latência de inicialização.
- Ajuste `contextWindow`/`maxTokens` se seu build LM Studio for diferente.
- Para WhatsApp, use a Responses API para que apenas o texto final seja enviado.

Mantenha modelos hospedados configurados mesmo ao rodar localmente; use `models.mode: "merge"` para que fallbacks permaneçam disponíveis.

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

Inverta a ordem do primário e fallback; mantenha o mesmo bloco de providers e `models.mode: "merge"` para poder fazer fallback para Sonnet ou Opus quando o servidor local estiver fora.

### Hospedagem regional / roteamento de dados

- Variantes hospedadas MiniMax/Kimi/GLM também existem no OpenRouter com endpoints fixados por região (ex. hospedagem nos EUA). Escolha a variante regional lá para manter o tráfego na sua jurisdição preferida enquanto ainda usa `models.mode: "merge"` para fallbacks Anthropic/OpenAI.
- Local-only permanece o caminho mais forte de privacidade; roteamento regional hospedado é o meio-termo quando você precisa de recursos de provedor mas quer controle sobre o fluxo de dados.

## Outros proxies locais compatíveis com OpenAI

vLLM, LiteLLM, OAI-proxy ou gateways customizados funcionam se expuserem um endpoint `/v1` no estilo OpenAI. Substitua o bloco de provider acima pelo seu endpoint e ID de modelo:

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
            name: "Modelo Local",
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

## Resolução de problemas

- O Gateway consegue alcançar o proxy? `curl http://127.0.0.1:1234/v1/models`.
- Modelo LM Studio descarregado? Recarregue; cold start é uma causa comum de "travamento".
- Erros de contexto? Diminua `contextWindow` ou aumente o limite do seu servidor.
- Segurança: modelos locais pulam filtros do lado do provedor; mantenha agentes restritos e compactação ativada para limitar o raio de explosão de prompt injection.
