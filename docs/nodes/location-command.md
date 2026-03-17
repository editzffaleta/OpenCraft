---
summary: "Comando de localização para nodes (location.get), modos de permissão e comportamento de primeiro plano no Android"
read_when:
  - Adicionando suporte a node de localização ou UI de permissões
  - Projetando permissões de localização ou comportamento de primeiro plano no Android
title: "Comando de Localização"
---

# Comando de localização (nodes)

## Resumo

- `location.get` é um comando de node (via `node.invoke`).
- Desligado por padrão.
- As configurações do app Android usam um seletor: Desligado / Enquanto Usando.
- Toggle separado: Localização Precisa.

## Por que um seletor (não apenas um switch)

Permissões do SO são multi-nível. Podemos expor um seletor no app, mas o SO ainda decide a concessão real.

- iOS/macOS podem expor **Enquanto Usando** ou **Sempre** em prompts/Ajustes do sistema.
- O app Android atualmente suporta apenas localização em primeiro plano.
- Localização precisa é uma concessão separada ("Precisa" no iOS 14+, "fine" vs "coarse" no Android).

O seletor na UI determina nosso modo solicitado; a concessão real fica nos ajustes do SO.

## Modelo de configurações

Por dispositivo node:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Comportamento da UI:

- Selecionar `whileUsing` solicita permissão de primeiro plano.
- Se o SO negar o nível solicitado, reverte para o nível mais alto concedido e mostra o status.

## Mapeamento de permissões (node.permissions)

Opcional. O node macOS reporta `location` via o mapa de permissões; iOS/Android podem omiti-lo.

## Comando: `location.get`

Chamado via `node.invoke`.

Parâmetros (sugeridos):

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
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Erros (códigos estáveis):

- `LOCATION_DISABLED`: seletor está desligado.
- `LOCATION_PERMISSION_REQUIRED`: permissão faltando para o modo solicitado.
- `LOCATION_BACKGROUND_UNAVAILABLE`: app está em background mas apenas Enquanto Usando é permitido.
- `LOCATION_TIMEOUT`: sem fix no tempo.
- `LOCATION_UNAVAILABLE`: falha do sistema / sem provedores.

## Comportamento em background

- O app Android nega `location.get` enquanto em background.
- Mantenha o OpenCraft aberto ao solicitar localização no Android.
- Outras plataformas de node podem ter comportamento diferente.

## Integração com modelo/ferramentas

- Superfície de ferramenta: a ferramenta `nodes` adiciona ação `location_get` (node necessário).
- CLI: `opencraft nodes location get --node <id>`.
- Diretrizes do agente: chame apenas quando o usuário habilitou localização e entende o escopo.

## Texto da UX (sugerido)

- Desligado: "Compartilhamento de localização está desabilitado."
- Enquanto Usando: "Apenas quando o OpenCraft está aberto."
- Precisa: "Usar localização GPS precisa. Desligue para compartilhar localização aproximada."
