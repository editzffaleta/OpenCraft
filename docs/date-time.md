---
summary: "Tratamento de data e hora em envelopes, prompts, tools e conectores"
read_when:
  - Você está mudando como timestamps são mostrados ao modelo ou usuários
  - Você está depurando formatação de tempo em mensagens ou saída do system prompt
title: "Data e Hora"
---

# Data & Hora

O OpenCraft usa por padrão **horário local do host para timestamps de transporte** e **fuso horário do usuário apenas no system prompt**.
Timestamps de provedores são preservados para que tools mantenham sua semântica nativa (horário atual disponível via `session_status`).

## Envelopes de mensagem (local por padrão)

Mensagens recebidas são embrulhadas com um timestamp (precisão de minuto):

```
[Provider ... 2026-01-05 16:26 PST] texto da mensagem
```

Este timestamp de envelope é **local do host por padrão**, independentemente do fuso horário do provedor.

Você pode sobrescrever este comportamento:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | fuso IANA
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` usa UTC.
- `envelopeTimezone: "local"` usa o fuso horário do host.
- `envelopeTimezone: "user"` usa `agents.defaults.userTimezone` (cai de volta para fuso do host).
- Use um fuso IANA explícito (ex.: `"America/Sao_Paulo"`) para um fuso fixo.
- `envelopeTimestamp: "off"` remove timestamps absolutos dos cabeçalhos de envelope.
- `envelopeElapsed: "off"` remove sufixos de tempo decorrido (estilo `+2m`).

### Exemplos

**Local (padrão):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Fuso horário do usuário:**

```
[WhatsApp +1555 2026-01-18 00:19 BRT] hello
```

**Tempo decorrido habilitado:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## System prompt: Data e Hora Atual

Se o fuso horário do usuário for conhecido, o system prompt inclui uma seção dedicada de
**Data e Hora Atual** com o **fuso horário apenas** (sem clock/formato de hora)
para manter o cache de prompt estável:

```
Time zone: America/Sao_Paulo
```

Quando o agente precisar do horário atual, use a tool `session_status`; o card de status
inclui uma linha de timestamp.

## Linhas de evento de sistema (local por padrão)

Eventos de sistema em fila inseridos no contexto do agente são prefixados com um timestamp usando
a mesma seleção de fuso que os envelopes de mensagem (padrão: local do host).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Configurar fuso e formato do usuário

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Sao_Paulo",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` define o **fuso horário local do usuário** para o contexto do prompt.
- `timeFormat` controla a **exibição 12h/24h** no prompt. `auto` segue preferências do OS.

## Detecção de formato de hora (auto)

Quando `timeFormat: "auto"`, o OpenCraft inspeciona a preferência do OS (macOS/Windows)
e cai de volta para formatação por locale. O valor detectado é **armazenado em cache por processo**
para evitar chamadas repetidas ao sistema.

## Payloads de tools + conectores (tempo nativo do provedor + campos normalizados)

Tools de canal retornam **timestamps nativos do provedor** e adicionam campos normalizados para consistência:

- `timestampMs`: milissegundos epoch (UTC)
- `timestampUtc`: string UTC ISO 8601

Campos nativos do provedor são preservados para que nada se perca.

- Slack: strings tipo epoch da API
- Discord: timestamps ISO UTC
- Telegram/WhatsApp: timestamps numéricos/ISO específicos do provedor

Se precisar de horário local, converta depois usando o fuso horário conhecido.

## Documentação relacionada

- [System Prompt](/concepts/system-prompt)
- [Fusos Horários](/concepts/timezone)
- [Mensagens](/concepts/messages)
