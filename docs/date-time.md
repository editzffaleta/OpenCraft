---
summary: "Tratamento de data e hora em envelopes, prompts, ferramentas e conectores"
read_when:
  - Você está alterando como timestamps são exibidos para o modelo ou usuários
  - Você está depurando formatação de hora em mensagens ou saída do system prompt
title: "Data e Hora"
---

# Data e Hora

O OpenCraft usa por padrão **hora local do host para timestamps de transporte** e **fuso horário do usuário apenas no system prompt**.
Timestamps dos provedores são preservados para que ferramentas mantenham sua semântica nativa (a hora atual está disponível via `session_status`).

## Envelopes de mensagem (local por padrão)

Mensagens de entrada são encapsuladas com um timestamp (precisão de minuto):

```
[Provider ... 2026-01-05 16:26 PST] texto da mensagem
```

Este timestamp do envelope é **local do host por padrão**, independentemente do fuso horário do provedor.

Você pode substituir este comportamento:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | fuso horário IANA
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` usa UTC.
- `envelopeTimezone: "local"` usa o fuso horário do host.
- `envelopeTimezone: "user"` usa `agents.defaults.userTimezone` (recorre ao fuso horário do host).
- Use um fuso horário IANA explícito (por exemplo, `"America/Chicago"`) para um fuso fixo.
- `envelopeTimestamp: "off"` remove timestamps absolutos dos cabeçalhos de envelope.
- `envelopeElapsed: "off"` remove sufixos de tempo decorrido (estilo `+2m`).

### Exemplos

**Local (padrão):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] olá
```

**Fuso horário do usuário:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] olá
```

**Tempo decorrido habilitado:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] acompanhamento
```

## System prompt: Data e Hora Atual

Se o fuso horário do usuário for conhecido, o system prompt inclui uma seção dedicada
**Data e Hora Atual** com apenas o **fuso horário** (sem formato de relógio/hora)
para manter o cache de prompt estável:

```
Time zone: America/Chicago
```

Quando o agente precisa da hora atual, use a ferramenta `session_status`; o cartão de status
inclui uma linha de timestamp.

## Linhas de eventos do sistema (local por padrão)

Eventos de sistema enfileirados inseridos no contexto do agente são prefixados com um timestamp usando a
mesma seleção de fuso horário dos envelopes de mensagem (padrão: local do host).

```
System: [2026-01-12 12:19:17 PST] Modelo alterado.
```

### Configurar fuso horário + formato do usuário

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` define o **fuso horário local do usuário** para contexto do prompt.
- `timeFormat` controla a **exibição 12h/24h** no prompt. `auto` segue as preferências do sistema operacional.

## Detecção de formato de hora (auto)

Quando `timeFormat: "auto"`, o OpenCraft inspeciona a preferência do sistema operacional (macOS/Windows)
e recorre à formatação de localidade. O valor detectado é **cacheado por processo**
para evitar chamadas repetidas ao sistema.

## Payloads de ferramentas + conectores (hora nativa do provedor + campos normalizados)

Ferramentas de canal retornam **timestamps nativos do provedor** e adicionam campos normalizados para consistência:

- `timestampMs`: milissegundos epoch (UTC)
- `timestampUtc`: string ISO 8601 UTC

Campos brutos do provedor são preservados para que nada se perca.

- Slack: strings tipo epoch da API
- Discord: timestamps UTC ISO
- Telegram/WhatsApp: timestamps numéricos/ISO específicos do provedor

Se você precisar da hora local, converta-a downstream usando o fuso horário conhecido.

## Documentação relacionada

- [System Prompt](/concepts/system-prompt)
- [Fusos Horários](/concepts/timezone)
- [Mensagens](/concepts/messages)
