---
summary: "Análise de localização de canais de entrada (Telegram + WhatsApp) e campos de contexto"
read_when:
  - Adicionando ou modificando análise de localização de canais
  - Usando campos de contexto de localização em prompts ou ferramentas de agente
title: "Channel Location Parsing"
---

# Análise de localização de canais

O OpenCraft normaliza localizações compartilhadas de canais de chat em:

- texto legível anexado ao corpo da mensagem de entrada, e
- campos estruturados no payload de contexto de resposta automática.

Atualmente suportados:

- **Telegram** (pins de localização + locais + localizações ao vivo)
- **WhatsApp** (locationMessage + liveLocationMessage)
- **Matrix** (`m.location` com `geo_uri`)

## Formatação de texto

As localizações são renderizadas como linhas amigáveis sem colchetes:

- Pin:
  - `📍 48.858844, 2.294351 ±12m`
- Local nomeado:
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- Compartilhamento ao vivo:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Se o canal inclui uma legenda/comentário, ele é anexado na próxima linha:

```
📍 48.858844, 2.294351 ±12m
Meet here
```

## Campos de contexto

Quando uma localização está presente, estes campos são adicionados ao `ctx`:

- `LocationLat` (number)
- `LocationLon` (number)
- `LocationAccuracy` (number, metros; opcional)
- `LocationName` (string; opcional)
- `LocationAddress` (string; opcional)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (boolean)

## Notas dos canais

- **Telegram**: locais são mapeados para `LocationName/LocationAddress`; localizações ao vivo usam `live_period`.
- **WhatsApp**: `locationMessage.comment` e `liveLocationMessage.caption` são anexados como linha de legenda.
- **Matrix**: `geo_uri` é analisado como localização de pin; altitude é ignorada e `LocationIsLive` é sempre false.
