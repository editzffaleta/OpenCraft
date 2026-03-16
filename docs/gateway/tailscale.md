---
summary: "Tailscale Serve/Funnel integrado para o dashboard do Gateway"
read_when:
  - Expondo a Control UI do Gateway fora do localhost
  - Automatizando acesso ao dashboard tailnet ou público
title: "Tailscale"
---

# Tailscale (dashboard do Gateway)

O OpenCraft pode auto-configurar o Tailscale **Serve** (tailnet) ou **Funnel** (público) para o
dashboard do Gateway e porta WebSocket. Isso mantém o Gateway vinculado ao loopback enquanto
o Tailscale fornece HTTPS, roteamento e (para Serve) headers de identidade.

## Modos

- `serve`: Serve somente tailnet via `tailscale serve`. O gateway permanece em `127.0.0.1`.
- `funnel`: HTTPS público via `tailscale funnel`. O OpenCraft requer uma senha compartilhada.
- `off`: Padrão (sem automação Tailscale).

## Auth

Defina `gateway.auth.mode` para controlar o handshake:

- `token` (padrão quando `OPENCLAW_GATEWAY_TOKEN` está definido)
- `password` (segredo compartilhado via `OPENCLAW_GATEWAY_PASSWORD` ou config)

Quando `tailscale.mode = "serve"` e `gateway.auth.allowTailscale` é `true`,
a auth de Control UI/WebSocket pode usar headers de identidade Tailscale
(`tailscale-user-login`) sem fornecer token/senha. O OpenCraft verifica
a identidade resolvendo o endereço `x-forwarded-for` via o daemon Tailscale
local (`tailscale whois`) e correspondendo ao header antes de aceitá-lo.
O OpenCraft trata uma requisição como Serve apenas quando ela chega do loopback com
os headers `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host` do Tailscale.
Endpoints HTTP API (por exemplo `/v1/*`, `/tools/invoke` e `/api/channels/*`)
ainda exigem auth de token/senha.
Este fluxo sem token assume que o host do gateway é confiável. Se código local não confiável
pode rodar no mesmo host, desabilite `gateway.auth.allowTailscale` e exija
auth de token/senha em vez disso.
Para exigir credenciais explícitas, defina `gateway.auth.allowTailscale: false` ou
force `gateway.auth.mode: "password"`.

## Exemplos de config

### Somente tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Abra: `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

### Somente tailnet (bind ao IP Tailnet)

Use isso quando você quer que o Gateway escute diretamente no IP Tailnet (sem Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "seu-token" },
  },
}
```

Conecte de outro dispositivo Tailnet:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Nota: loopback (`http://127.0.0.1:18789`) **não** funcionará neste modo.

### Internet pública (Funnel + senha compartilhada)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "substitua-aqui" },
  },
}
```

Prefira `OPENCLAW_GATEWAY_PASSWORD` a commitar uma senha em disco.

## Exemplos de CLI

```bash
opencraft gateway --tailscale serve
opencraft gateway --tailscale funnel --auth password
```

## Notas

- Tailscale Serve/Funnel requer que o CLI `tailscale` esteja instalado e logado.
- `tailscale.mode: "funnel"` recusa iniciar a menos que o modo de auth seja `password` para evitar exposição pública.
- Defina `gateway.tailscale.resetOnExit` se você quer que o OpenCraft desfaça a configuração `tailscale serve`
  ou `tailscale funnel` ao desligar.
- `gateway.bind: "tailnet"` é um bind direto ao Tailnet (sem HTTPS, sem Serve/Funnel).
- `gateway.bind: "auto"` prefere loopback; use `tailnet` se quiser somente Tailnet.
- Serve/Funnel expõem apenas a **Control UI do Gateway + WS**. Nodes conectam pelo
  mesmo endpoint Gateway WS, então Serve pode funcionar para acesso de node.

## Controle de browser (Gateway remoto + browser local)

Se você roda o Gateway em uma máquina mas quer controlar um browser em outra máquina,
rode um **host de node** na máquina com o browser e mantenha ambos na mesma tailnet.
O Gateway fará proxy das ações de browser para o node; nenhum servidor de controle separado ou URL Serve necessário.

Evite Funnel para controle de browser; trate o pareamento de node como acesso de operador.

## Pré-requisitos e limites do Tailscale

- Serve requer HTTPS habilitado para sua tailnet; o CLI solicita se estiver faltando.
- Serve injeta headers de identidade Tailscale; Funnel não.
- Funnel requer Tailscale v1.38.3+, MagicDNS, HTTPS habilitado e um atributo de node funnel.
- Funnel suporta apenas as portas `443`, `8443` e `10000` via TLS.
- Funnel no macOS requer a variante open-source do app Tailscale.

## Saiba mais

- Visão geral do Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Visão geral do Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
