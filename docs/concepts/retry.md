---
summary: "Politica de retry para chamadas de saida a provedores"
read_when:
  - Atualizando comportamento de retry de provedor ou padroes
  - Depurando erros de envio de provedor ou limites de taxa
title: "Retry Policy"
---

# Politica de retry

## Objetivos

- Retry por requisicao HTTP, nao por fluxo de multiplas etapas.
- Preservar a ordenacao tentando novamente apenas a etapa atual.
- Evitar duplicacao de operacoes nao idempotentes.

## Padroes

- Tentativas: 3
- Limite maximo de atraso: 30000 ms
- Jitter: 0.1 (10 por cento)
- Padroes por provedor:
  - Atraso minimo Telegram: 400 ms
  - Atraso minimo Discord: 500 ms

## Comportamento

### Discord

- Tenta novamente apenas em erros de limite de taxa (HTTP 429).
- Usa `retry_after` do Discord quando disponivel, caso contrario backoff exponencial.

### Telegram

- Tenta novamente em erros transitorios (429, timeout, connect/reset/closed, temporariamente indisponivel).
- Usa `retry_after` quando disponivel, caso contrario backoff exponencial.
- Erros de parse de Markdown nao sao tentados novamente; eles recorrem a texto simples.

## Configuracao

Defina a politica de retry por provedor em `~/.editzffaleta/OpenCraft.json`:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Notas

- Retries se aplicam por requisicao (envio de mensagem, upload de midia, reacao, enquete, sticker).
- Fluxos compostos nao tentam novamente etapas ja concluidas.
