---
summary: "Usar modelos Mistral e transcrição Voxtral com o OpenCraft"
read_when:
  - Você quer usar modelos Mistral no OpenCraft
  - Você precisa de onboarding de chave de API Mistral e refs de modelo
title: "Mistral"
---

# Mistral

O OpenCraft suporta Mistral para roteamento de modelo de texto/imagem (`mistral/...`) e
transcrição de áudio via Voxtral no entendimento de mídia.
O Mistral também pode ser usado para embeddings de memória (`memorySearch.provider = "mistral"`).

## Configuração CLI

```bash
opencraft onboard --auth-choice mistral-api-key
# ou não-interativo
opencraft onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Trecho de config (provedor LLM)

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

- Auth do Mistral usa `MISTRAL_API_KEY`.
- URL base do provedor padrão é `https://api.mistral.ai/v1`.
- Modelo padrão do onboarding é `mistral/mistral-large-latest`.
- Modelo de áudio padrão para entendimento de mídia com Mistral é `voxtral-mini-latest`.
- Caminho de transcrição de mídia usa `/v1/audio/transcriptions`.
- Caminho de embeddings de memória usa `/v1/embeddings` (modelo padrão: `mistral-embed`).
