---
summary: "Parsing de localização de canal de entrada (Telegram + WhatsApp) e campos de contexto"
read_when:
  - Adicionando ou modificando parsing de localização de canal
  - Usando campos de contexto de localização em prompts ou ferramentas do agente
title: "Parsing de Localização de Canal"
---

# Parsing de localização de canal

O OpenCraft normaliza localizações compartilhadas de canais de chat em:

- texto legível por humanos adicionado ao corpo de entrada, e
- campos estruturados no payload de contexto de auto-resposta.

Atualmente suportado:

- **Telegram** (pins de localização + venues + localizações ao vivo)
- **WhatsApp** (locationMessage + liveLocationMessage)
- **Matrix** (`m.location` com `geo_uri`)

## Formatação de texto

As localizações são renderizadas como linhas amigáveis sem colchetes:

- Pin:
  - `📍 48.858844, 2.294351 ±12m`
- Local nomeado:
  - `📍 Torre Eiffel — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- Compartilhamento ao vivo:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Se o canal incluir uma legenda/comentário, ele é adicionado na linha seguinte:

```
📍 48.858844, 2.294351 ±12m
Encontre-me aqui
```

## Campos de contexto

Quando uma localização está presente, esses campos são adicionados ao `ctx`:

- `LocationLat` (número)
- `LocationLon` (número)
- `LocationAccuracy` (número, metros; opcional)
- `LocationName` (string; opcional)
- `LocationAddress` (string; opcional)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (booleano)

## Notas por canal

- **Telegram**: venues mapeiam para `LocationName/LocationAddress`; localizações ao vivo usam `live_period`.
- **WhatsApp**: `locationMessage.comment` e `liveLocationMessage.caption` são adicionados como a linha de legenda.
- **Matrix**: `geo_uri` é parsado como uma localização de pin; altitude é ignorada e `LocationIsLive` é sempre false.
