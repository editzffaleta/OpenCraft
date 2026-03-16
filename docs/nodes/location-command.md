---
summary: "Comando de localização para nodes (location.get), modos de permissão e comportamento em foreground no Android"
read_when:
  - Adicionando suporte de localização em node ou UI de permissões
  - Desenhando permissões de localização Android ou comportamento em foreground
title: "Comando de Localização"
---

# Comando de localização (nodes)

## Resumo

- `location.get` é um comando de node (via `node.invoke`).
- Desativado por padrão.
- Configurações do app Android usam um seletor: Desativado / Enquanto Usando.
- Toggle separado: Localização Precisa.

## Por que um seletor (e não apenas um switch)

Permissões do SO são em múltiplos níveis. Podemos expor um seletor no app, mas o SO ainda decide a concessão real.

- iOS/macOS podem expor **Enquanto Usando** ou **Sempre** em prompts/Configurações do sistema.
- App Android suporta atualmente apenas localização em foreground.
- Localização precisa é uma concessão separada (iOS 14+ "Précise", Android "fine" vs "coarse").

O seletor na UI orienta nosso modo solicitado; a concessão real fica nas configurações do SO.

## Modelo de configurações

Por dispositivo node:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Comportamento da UI:

- Selecionar `whileUsing` solicita permissão de foreground.
- Se o SO negar o nível solicitado, reverter para o nível mais alto concedido e mostrar status.

## Mapeamento de permissões (node.permissions)

Opcional. Node macOS reporta `location` via o mapa de permissões; iOS/Android podem omiti-lo.

## Comando: `location.get`

Chamado via `node.invoke`.

Params (sugeridos):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Payload de resposta:

```json
{
  "lat": -23.5505,
  "lon": -46.6333,
  "accuracyMeters": 12.5,
  "altitudeMeters": 760.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Erros (códigos estáveis):

- `LOCATION_DISABLED`: seletor está desativado.
- `LOCATION_PERMISSION_REQUIRED`: permissão faltando para o modo solicitado.
- `LOCATION_BACKGROUND_UNAVAILABLE`: app está em background mas apenas Enquanto Usando está permitido.
- `LOCATION_TIMEOUT`: nenhum fix no tempo.
- `LOCATION_UNAVAILABLE`: falha do sistema / sem provedores.

## Comportamento em background

- App Android nega `location.get` enquanto em background.
- Mantenha o OpenCraft aberto ao solicitar localização no Android.
- Outras plataformas de node podem diferir.

## Integração com modelo/tooling

- Superfície de tool: a tool `nodes` adiciona ação `location_get` (node obrigatório).
- CLI: `opencraft nodes location get --node <id>`.
- Diretrizes do agente: chamar apenas quando o usuário habilitou localização e entende o escopo.

## Textos de UX (sugeridos)

- Desativado: "Compartilhamento de localização está desativado."
- Enquanto Usando: "Apenas quando o OpenCraft está aberto."
- Precisa: "Usar localização GPS precisa. Desative para compartilhar localização aproximada."
