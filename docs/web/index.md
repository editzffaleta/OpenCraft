---
summary: "Superfícies web do Gateway: Control UI, modos de bind e segurança"
read_when:
  - Você quer acessar o Gateway via Tailscale
  - Você quer a Control UI no browser e edição de config
title: "Web"
---

# Web (Gateway)

O Gateway serve uma pequena **Control UI no browser** (Vite + Lit) na mesma porta do WebSocket do Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (ex.: `/opencraft`)

As capacidades ficam em [Control UI](/web/control-ui).
Esta página foca em modos de bind, segurança e superfícies voltadas para a web.

## Webhooks

Quando `hooks.enabled=true`, o Gateway também expõe um pequeno endpoint de webhook no mesmo servidor HTTP.
Veja [Configuração do Gateway](/gateway/configuration) → `hooks` para auth + payloads.

## Config (padrão ativado)

A Control UI está **habilitada por padrão** quando os assets estão presentes (`dist/control-ui`).
Você pode controlá-la via config:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/opencraft" }, // basePath opcional
  },
}
```

## Acesso via Tailscale

### Serve integrado (recomendado)

Mantenha o Gateway no loopback e deixe o Tailscale Serve fazer proxy:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Então inicie o gateway:

```bash
opencraft gateway
```

Abra:

- `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

### Bind tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "seu-token" },
  },
}
```

Então inicie o gateway (token necessário para binds não-loopback):

```bash
opencraft gateway
```

Abra:

- `http://<tailscale-ip>:18789/` (ou seu `gateway.controlUi.basePath` configurado)

### Internet pública (Funnel)

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

- Auth do Gateway é necessária por padrão (token/senha ou headers de identidade Tailscale).
- Binds não-loopback ainda **exigem** token/senha compartilhada (`gateway.auth` ou env).
- O wizard gera um token de gateway por padrão (mesmo no loopback).
- A UI envia `connect.params.auth.token` ou `connect.params.auth.password`.
- Para deployments da Control UI não-loopback, defina `gateway.controlUi.allowedOrigins`
  explicitamente (origens completas). Sem isso, a inicialização do gateway é recusada por padrão.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita
  o modo de fallback de origem por header Host, mas é uma degradação perigosa de segurança.
- Com Serve, headers de identidade Tailscale podem satisfazer auth da Control UI/WebSocket
  quando `gateway.auth.allowTailscale` é `true` (sem token/senha necessária).
  Endpoints HTTP API ainda requerem token/senha. Defina
  `gateway.auth.allowTailscale: false` para exigir credenciais explícitas. Veja
  [Tailscale](/gateway/tailscale) e [Segurança](/gateway/security). Este
  fluxo sem token assume que o host do gateway é confiável.
- `gateway.tailscale.mode: "funnel"` requer `gateway.auth.mode: "password"` (senha compartilhada).

## Compilando a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Compile-os com:

```bash
pnpm ui:build # auto-instala deps da UI na primeira execução
```
