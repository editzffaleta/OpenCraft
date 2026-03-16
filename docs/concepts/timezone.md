---
summary: "Tratamento de fuso horário para agentes, envelopes e prompts"
read_when:
  - Você precisa entender como timestamps são normalizados para o modelo
  - Configurando o fuso horário do usuário para system prompts
title: "Fusos Horários"
---

# Fusos Horários

O OpenCraft padroniza timestamps para que o modelo veja um **único tempo de referência**.

## Envelopes de mensagem (local por padrão)

Mensagens de entrada são envolvidas em um envelope como:

```
[Provider ... 2026-01-05 16:26 PST] texto da mensagem
```

O timestamp no envelope é **local do host por padrão**, com precisão de minutos.

Você pode sobrescrever isso com:

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
- `envelopeTimezone: "user"` usa `agents.defaults.userTimezone` (faz fallback para o fuso horário do host).
- Use um fuso horário IANA explícito (ex.: `"Europe/Vienna"`) para um offset fixo.
- `envelopeTimestamp: "off"` remove timestamps absolutos dos headers de envelope.
- `envelopeElapsed: "off"` remove sufixos de tempo decorrido (o estilo `+2m`).

### Exemplos

**Local (padrão):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] olá
```

**Fuso horário fixo:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] olá
```

**Tempo decorrido:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] acompanhamento
```

## Payloads de ferramentas (dados brutos do provedor + campos normalizados)

Chamadas de ferramentas (`channels.discord.readMessages`, `channels.slack.readMessages`, etc.) retornam **timestamps brutos do provedor**.
Também anexamos campos normalizados para consistência:

- `timestampMs` (milissegundos UTC epoch)
- `timestampUtc` (string UTC ISO 8601)

Campos brutos do provedor são preservados.

## Fuso horário do usuário para o system prompt

Defina `agents.defaults.userTimezone` para dizer ao modelo o fuso horário local do usuário. Se estiver
não definido, o OpenCraft resolve o **fuso horário do host em runtime** (sem escrita de config).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

O system prompt inclui:

- Seção `Current Date & Time` com hora local e fuso horário
- `Time format: 12-hour` ou `24-hour`

Você pode controlar o formato do prompt com `agents.defaults.timeFormat` (`auto` | `12` | `24`).

Veja [Data e Hora](/date-time) para o comportamento completo e exemplos.
