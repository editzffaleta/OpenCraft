---
summary: "Como o Gateway, nodes e canvas host se conectam."
read_when:
  - Você quer uma visão concisa do modelo de networking do Gateway
title: "Network model"
---

A maioria das operações flui através do Gateway (`opencraft gateway`), um processo único de longa duração que é dono das conexões de canais e do control plane WebSocket.

## Regras fundamentais

- Um Gateway por host é recomendado. É o único processo permitido a ser dono da sessão WhatsApp Web. Para bots de resgate ou isolamento estrito, execute múltiplos gateways com perfis e portas isolados. Veja [Multiple gateways](/gateway/multiple-gateways).
- Loopback primeiro: o Gateway WS tem como padrão `ws://127.0.0.1:18789`. O wizard gera um token de gateway por padrão, mesmo para loopback. Para acesso via tailnet, execute `opencraft gateway --bind tailnet --token ...` porque tokens são obrigatórios para binds não-loopback.
- Nodes se conectam ao Gateway WS via LAN, tailnet ou SSH conforme necessário. O TCP bridge legado está descontinuado.
- O canvas host é servido pelo servidor HTTP do Gateway na **mesma porta** que o Gateway (padrão `18789`):
  - `/__opencraft__/canvas/`
  - `/__opencraft__/a2ui/`
    Quando `gateway.auth` está configurado e o Gateway faz bind além de loopback, essas rotas são protegidas pela auth do Gateway. Clientes node usam URLs de capability com escopo de node vinculadas à sessão WS ativa. Veja [Gateway configuration](/gateway/configuration) (`canvasHost`, `gateway`).
- Uso remoto é tipicamente SSH tunnel ou tailnet VPN. Veja [Remote access](/gateway/remote) e [Discovery](/gateway/discovery).
