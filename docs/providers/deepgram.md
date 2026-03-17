---
summary: "Transcrição Deepgram para notas de voz recebidas"
read_when:
  - Você quer Deepgram para conversão de fala em texto para anexos de áudio
  - Você precisa de um exemplo rápido de configuração Deepgram
title: "Deepgram"
---

# Deepgram (Transcrição de Áudio)

O Deepgram é uma API de conversão de fala em texto. No OpenCraft, é usado para **transcrição
de áudio/notas de voz recebidas** via `tools.media.audio`.

Quando habilitado, o OpenCraft envia o arquivo de áudio para o Deepgram e injeta a transcrição
no pipeline de resposta (`{{Transcript}}` + bloco `[Audio]`). Isso **não é streaming**;
usa o endpoint de transcrição pré-gravada.

Site: [https://deepgram.com](https://deepgram.com)
Documentação: [https://developers.deepgram.com](https://developers.deepgram.com)

## Início rápido

1. Defina sua chave de API:

```
DEEPGRAM_API_KEY=dg_...
```

2. Habilite o provider:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## Opções

- `model`: ID do modelo Deepgram (padrão: `nova-3`)
- `language`: dica de idioma (opcional)
- `tools.media.audio.providerOptions.deepgram.detect_language`: habilitar detecção de idioma (opcional)
- `tools.media.audio.providerOptions.deepgram.punctuate`: habilitar pontuação (opcional)
- `tools.media.audio.providerOptions.deepgram.smart_format`: habilitar formatação inteligente (opcional)

Exemplo com idioma:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
      },
    },
  },
}
```

Exemplo com opções do Deepgram:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        providerOptions: {
          deepgram: {
            detect_language: true,
            punctuate: true,
            smart_format: true,
          },
        },
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## Notas

- A autenticação segue a ordem padrão de autenticação do provider; `DEEPGRAM_API_KEY` é o caminho mais simples.
- Sobrescreva endpoints ou headers com `tools.media.audio.baseUrl` e `tools.media.audio.headers` ao usar um proxy.
- A saída segue as mesmas regras de áudio que outros providers (limites de tamanho, timeouts, injeção de transcrição).
