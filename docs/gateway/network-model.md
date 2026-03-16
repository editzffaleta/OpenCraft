---
summary: "Como o Gateway, nodes e o host canvas se conectam."
read_when:
  - Você quer uma visão concisa do modelo de rede do Gateway
title: "Modelo de rede"
---

A maioria das operações flui pelo Gateway (`opencraft gateway`), um único processo de longa duração
que possui as conexões de canal e o plano de controle WebSocket.

## Regras principais

- Um Gateway por host é recomendado. É o único processo autorizado a possuir a sessão do WhatsApp Web. Para bots de resgate ou isolamento rigoroso, rode múltiplos gateways com perfis e portas isolados. Veja [Múltiplos gateways](/gateway/multiple-gateways).
- Loopback primeiro: o Gateway WS padrão é `ws://127.0.0.1:18789`. O wizard gera um token de gateway por padrão, mesmo para loopback. Para acesso tailnet, rode `opencraft gateway --bind tailnet --token ...` pois tokens são obrigatórios para binds não-loopback.
- Nodes conectam ao Gateway WS via LAN, tailnet ou SSH conforme necessário. A bridge TCP legada está depreciada.
- O host canvas é servido pelo servidor HTTP do Gateway na **mesma porta** que o Gateway (padrão `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Quando `gateway.auth` está configurado e o Gateway faz bind além do loopback, essas rotas são protegidas por auth do Gateway. Clientes node usam URLs de capacidade escopadas ao node vinculadas à sua sessão WS ativa. Veja [Configuração do Gateway](/gateway/configuration) (`canvasHost`, `gateway`).
- Uso remoto é tipicamente túnel SSH ou VPN tailnet. Veja [Acesso remoto](/gateway/remote) e [Descoberta](/gateway/discovery).
