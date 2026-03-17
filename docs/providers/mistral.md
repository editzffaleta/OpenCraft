---
summary: "Use modelos Mistral e transcrição Voxtral com o OpenCraft"
read_when:
  - Você quer usar modelos Mistral no OpenCraft
  - Você precisa de onboarding de API key Mistral e referências de modelo
title: "Mistral"
---

# Mistral

O OpenCraft suporta Mistral tanto para roteamento de modelos de texto/imagem (`mistral/...`) quanto para
transcrição de áudio via Voxtral na compreensão de mídia.
O Mistral também pode ser usado para embeddings de memória (`memorySearch.provider = "mistral"`).

## Configuração via CLI

```bash
opencraft onboard --auth-choice mistral-api-key
# ou não interativo
opencraft onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Trecho de config (provider de LLM)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## Trecho de config (transcrição de áudio com Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

## Notas

- A autenticação Mistral usa `MISTRAL_API_KEY`.
- A URL base do provider padrão é `https://api.mistral.ai/v1`.
- O modelo padrão de onboarding é `mistral/mistral-large-latest`.
- O modelo de áudio padrão para compreensão de mídia do Mistral é `voxtral-mini-latest`.
- O caminho de transcrição de mídia usa `/v1/audio/transcriptions`.
- O caminho de embeddings de memória usa `/v1/embeddings` (modelo padrão: `mistral-embed`).
