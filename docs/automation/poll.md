---
summary: "Envio de enquetes via gateway + CLI"
read_when:
  - Adicionando ou modificando suporte a enquetes
  - Depurando envios de enquetes via CLI ou gateway
title: "Enquetes"
---

# Enquetes

## Canais suportados

- Telegram
- WhatsApp (canal web)
- Discord
- MS Teams (Adaptive Cards)

## CLI

```bash
# Telegram
opencraft message poll --channel telegram --target 123456789 \
  --poll-question "Lançar?" --poll-option "Sim" --poll-option "Não"
opencraft message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Escolha um horário" --poll-option "10h" --poll-option "14h" \
  --poll-duration-seconds 300

# WhatsApp
opencraft message poll --target +15555550123 \
  --poll-question "Almoço hoje?" --poll-option "Sim" --poll-option "Não" --poll-option "Talvez"
opencraft message poll --target 123456789@g.us \
  --poll-question "Horário da reunião?" --poll-option "10h" --poll-option "14h" --poll-option "16h" --poll-multi

# Discord
opencraft message poll --channel discord --target channel:123456789 \
  --poll-question "Lanche?" --poll-option "Pizza" --poll-option "Sushi"
opencraft message poll --channel discord --target channel:123456789 \
  --poll-question "Plano?" --poll-option "A" --poll-option "B" --poll-duration-hours 48

# MS Teams
opencraft message poll --channel msteams --target conversation:19:abc@thread.tacv2 \
  --poll-question "Almoço?" --poll-option "Pizza" --poll-option "Sushi"
```

Opções:

- `--channel`: `whatsapp` (padrão), `telegram`, `discord`, ou `msteams`
- `--poll-multi`: permitir selecionar múltiplas opções
- `--poll-duration-hours`: apenas Discord (padrão 24 quando omitido)
- `--poll-duration-seconds`: apenas Telegram (5-600 segundos)
- `--poll-anonymous` / `--poll-public`: visibilidade de enquete apenas Telegram

## Gateway RPC

Método: `poll`

Parâmetros:

- `to` (string, obrigatório)
- `question` (string, obrigatório)
- `options` (string[], obrigatório)
- `maxSelections` (number, opcional)
- `durationHours` (number, opcional)
- `durationSeconds` (number, opcional, apenas Telegram)
- `isAnonymous` (boolean, opcional, apenas Telegram)
- `channel` (string, opcional, padrão: `whatsapp`)
- `idempotencyKey` (string, obrigatório)

## Diferenças por canal

- Telegram: 2-10 opções. Suporta tópicos de fórum via `threadId` ou alvos `:topic:`. Usa `durationSeconds` em vez de `durationHours`, limitado a 5-600 segundos. Suporta enquetes anônimas e públicas.
- WhatsApp: 2-12 opções, `maxSelections` deve estar dentro do count de opções, ignora `durationHours`.
- Discord: 2-10 opções, `durationHours` limitado a 1-768 horas (padrão 24). `maxSelections > 1` habilita multi-select; Discord não suporta um count estrito de seleção.
- MS Teams: Enquetes de Adaptive Card (gerenciadas pelo OpenCraft). Sem API de enquete nativa; `durationHours` é ignorado.

## Ferramenta de agente (Message)

Use a ferramenta `message` com ação `poll` (`to`, `pollQuestion`, `pollOption`, `pollMulti` opcional, `pollDurationHours`, `channel`).

Para Telegram, a ferramenta também aceita `pollDurationSeconds`, `pollAnonymous` e `pollPublic`.

Use `action: "poll"` para criação de enquete. Campos de enquete passados com `action: "send"` são rejeitados.

Nota: Discord não tem modo "escolher exatamente N"; `pollMulti` mapeia para multi-select.
Enquetes do Teams são renderizadas como Adaptive Cards e requerem que o gateway permaneça online
para registrar votos em `~/.opencraft/msteams-polls.json`.
