---
summary: "Política de retry para chamadas de provedor de saída"
read_when:
  - Atualizando comportamento de retry do provedor ou padrões
  - Depurando erros de envio do provedor ou rate limits
title: "Política de Retry"
---

# Política de retry

## Objetivos

- Retry por requisição HTTP, não por fluxo multi-etapa.
- Preservar ordenação fazendo retry apenas do passo atual.
- Evitar duplicar operações não-idempotentes.

## Padrões

- Tentativas: 3
- Cap de delay máximo: 30000 ms
- Jitter: 0.1 (10 por cento)
- Padrões do provedor:
  - Delay mínimo do Telegram: 400 ms
  - Delay mínimo do Discord: 500 ms

## Comportamento

### Discord

- Retry apenas em erros de rate-limit (HTTP 429).
- Usa `retry_after` do Discord quando disponível, caso contrário backoff exponencial.

### Telegram

- Retry em erros transientes (429, timeout, connect/reset/closed, temporariamente indisponível).
- Usa `retry_after` quando disponível, caso contrário backoff exponencial.
- Erros de parse de Markdown não são re-tentados; fazem fallback para texto simples.

## Configuração

Defina a política de retry por provedor em `~/.opencraft/opencraft.json`:

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

- Retries se aplicam por requisição (envio de mensagem, upload de mídia, reação, enquete, sticker).
- Fluxos compostos não fazem retry de passos concluídos.
