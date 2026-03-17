---
summary: "Configure Moonshot K2 vs Kimi Coding (providers + chaves separados)"
read_when:
  - Você quer configurar Moonshot K2 (Moonshot Open Platform) vs Kimi Coding
  - Você precisa entender endpoints, chaves e referências de modelo separados
  - Você quer config pronta para copiar/colar para qualquer provider
title: "Moonshot AI"
---

# Moonshot AI (Kimi)

O Moonshot fornece a API Kimi com endpoints compatíveis com OpenAI. Configure o
provider e defina o modelo padrão como `moonshot/kimi-k2.5`, ou use
Kimi Coding com `kimi-coding/k2p5`.

IDs de modelo Kimi K2 atuais:

[//]: # "moonshot-kimi-k2-ids:start"

- `kimi-k2.5`
- `kimi-k2-0905-preview`
- `kimi-k2-turbo-preview`
- `kimi-k2-thinking`
- `kimi-k2-thinking-turbo`

[//]: # "moonshot-kimi-k2-ids:end"

```bash
opencraft onboard --auth-choice moonshot-api-key
```

Kimi Coding:

```bash
opencraft onboard --auth-choice kimi-code-api-key
```

Nota: Moonshot e Kimi Coding são providers separados. As chaves não são intercambiáveis, os endpoints diferem e as referências de modelo diferem (Moonshot usa `moonshot/...`, Kimi Coding usa `kimi-coding/...`).

## Trecho de config (Moonshot API)

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: {
        // moonshot-kimi-k2-aliases:start
        "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
        "moonshot/kimi-k2-0905-preview": { alias: "Kimi K2" },
        "moonshot/kimi-k2-turbo-preview": { alias: "Kimi K2 Turbo" },
        "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
        "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
        // moonshot-kimi-k2-aliases:end
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          // moonshot-kimi-k2-models:start
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          {
            id: "kimi-k2-0905-preview",
            name: "Kimi K2 0905 Preview",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          {
            id: "kimi-k2-turbo-preview",
            name: "Kimi K2 Turbo",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          {
            id: "kimi-k2-thinking",
            name: "Kimi K2 Thinking",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          {
            id: "kimi-k2-thinking-turbo",
            name: "Kimi K2 Thinking Turbo",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          // moonshot-kimi-k2-models:end
        ],
      },
    },
  },
}
```

## Kimi Coding

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: {
        "kimi-coding/k2p5": { alias: "Kimi K2.5" },
      },
    },
  },
}
```

## Notas

- As referências de modelo Moonshot usam `moonshot/<modelId>`. As referências de modelo Kimi Coding usam `kimi-coding/<modelId>`.
- Substitua preços e metadados de contexto em `models.providers` se necessário.
- Se o Moonshot publicar limites de contexto diferentes para um modelo, ajuste
  `contextWindow` de acordo.
- Use `https://api.moonshot.ai/v1` para o endpoint internacional e `https://api.moonshot.cn/v1` para o endpoint da China.

## Modo de pensamento nativo (Moonshot)

O Moonshot Kimi suporta pensamento nativo binário:

- `thinking: { type: "enabled" }`
- `thinking: { type: "disabled" }`

Configure por modelo via `agents.defaults.models.<provider/model>.params`:

```json5
{
  agents: {
    defaults: {
      models: {
        "moonshot/kimi-k2.5": {
          params: {
            thinking: { type: "disabled" },
          },
        },
      },
    },
  },
}
```

O OpenCraft também mapeia os níveis de `/think` em tempo de execução para o Moonshot:

- `/think off` -> `thinking.type=disabled`
- qualquer nível de pensamento diferente de off -> `thinking.type=enabled`

Quando o pensamento Moonshot está habilitado, `tool_choice` deve ser `auto` ou `none`. O OpenCraft normaliza valores incompatíveis de `tool_choice` para `auto` para compatibilidade.
