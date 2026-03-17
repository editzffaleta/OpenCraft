---
summary: "Use a API compatível com Anthropic do Synthetic no OpenCraft"
read_when:
  - Você quer usar o Synthetic como provider de modelo
  - Você precisa de uma API key ou configuração de URL base do Synthetic
title: "Synthetic"
---

# Synthetic

O Synthetic expõe endpoints compatíveis com Anthropic. O OpenCraft o registra como o
provider `synthetic` e usa a API Anthropic Messages.

## Configuração rápida

1. Defina `SYNTHETIC_API_KEY` (ou execute o assistente abaixo).
2. Execute o onboarding:

```bash
opencraft onboard --auth-choice synthetic-api-key
```

O modelo padrão é definido como:

```
synthetic/hf:MiniMaxAI/MiniMax-M2.5
```

## Exemplo de config

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Nota: O cliente Anthropic do OpenCraft adiciona `/v1` à URL base, então use
`https://api.synthetic.new/anthropic` (não `/anthropic/v1`). Se o Synthetic mudar
sua URL base, sobrescreva `models.providers.synthetic.baseUrl`.

## Catálogo de modelos

Todos os modelos abaixo usam custo `0` (entrada/saída/cache).

| ID do modelo                                           | Janela de contexto | Token máximo | Raciocínio | Entrada      |
| ------------------------------------------------------ | ------------------ | ------------ | ---------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192000             | 65536        | false      | text         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256000             | 8192         | true       | text         |
| `hf:zai-org/GLM-4.7`                                   | 198000             | 128000       | false      | text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128000             | 8192         | false      | text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128000             | 8192         | false      | text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128000             | 8192         | false      | text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128000             | 8192         | false      | text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159000             | 8192         | false      | text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128000             | 8192         | false      | text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524000             | 8192         | false      | text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256000             | 8192         | false      | text         |
| `hf:openai/gpt-oss-120b`                               | 128000             | 8192         | false      | text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256000             | 8192         | false      | text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256000             | 8192         | false      | text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250000             | 8192         | false      | text + image |
| `hf:zai-org/GLM-4.5`                                   | 128000             | 128000       | false      | text         |
| `hf:zai-org/GLM-4.6`                                   | 198000             | 128000       | false      | text         |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128000             | 8192         | false      | text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256000             | 8192         | true       | text         |

## Notas

- As referências de modelo usam `synthetic/<modelId>`.
- Se você habilitar uma lista de modelos permitidos (`agents.defaults.models`), adicione todos os modelos que
  planeja usar.
- Veja [Providers de modelo](/concepts/model-providers) para regras de provider.
