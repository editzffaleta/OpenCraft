---
summary: "Gateway web surfaces: Control UI, bind modes e segurança"
read_when:
  - Você quer acessar o Gateway sobre Tailscale
  - Você quer o browser Control UI e config editing
title: "Web"
---

# Web (Gateway)

O Gateway serve um pequeno **browser Control UI** (Vite + Lit) do mesmo port que o Gateway WebSocket:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (ex. `/opencraft`)

Capacidades vivem em [Control UI](/web/control-ui).
Esta página se foca em bind modes, segurança e web-facing surfaces.

## Webhooks

Quando `hooks.enabled=true`, o Gateway também expõe um pequeno webhook endpoint no mesmo HTTP server.
Veja [Gateway configuration](/gateway/configuration) → `hooks` para auth + payloads.

## Config (default-on)

Control UI é **habilitado por padrão** quando assets estão presentes (`dist/control-ui`).
Você pode controlá-lo via config:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/opencraft" }, // basePath opcional
  },
}
```

## Tailscale access

### Integrated Serve (recomendado)

Mantenha o Gateway em loopback e deixe Tailscale Serve fazer proxy:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Depois inicie o gateway:

```bash
opencraft gateway
```

Abra:

- `https://<magicdns>/` (ou seu configurado `gateway.controlUi.basePath`)

### Tailnet bind + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Depois inicie o gateway (token necessário para non-loopback binds):

```bash
opencraft gateway
```

Abra:

- `http://<tailscale-ip>:18789/` (ou seu configurado `gateway.controlUi.basePath`)

### Public internet (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // ou OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Notas de segurança

- Gateway auth é necessário por padrão (token/password ou Tailscale identity headers).
- Non-loopback binds ainda **requerem** um shared token/password (`gateway.auth` ou env).
- O wizard gera um gateway token por padrão (mesmo em loopback).
- A UI envia `connect.params.auth.token` ou `connect.params.auth.password`.
- Para non-loopback Control UI deployments, defina `gateway.controlUi.allowedOrigins` explicitamente (full origins). Sem ele, startup do gateway é recusado por padrão.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita Host-header origin fallback mode, mas é um dangerous security downgrade.
- Com Serve, Tailscale identity headers podem satisfazer Control UI/WebSocket auth quando `gateway.auth.allowTailscale` é `true` (nenhum token/password requerido).
  HTTP API endpoints ainda requerem token/password. Defina `gateway.auth.allowTailscale: false` para requer explicit credentials. Veja [Tailscale](/gateway/tailscale) e [Security](/gateway/security). Este fluxo tokenless assume o host do gateway é confiável.
- `gateway.tailscale.mode: "funnel"` requer `gateway.auth.mode: "password"` (shared password).

## Construindo a UI

O Gateway serve static files de `dist/control-ui`. Construa-os com:

```bash
pnpm ui:build # auto-installs UI deps on first run
```
