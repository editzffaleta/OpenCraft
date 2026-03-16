---
summary: "Descoberta de node e transportes (Bonjour, Tailscale, SSH) para encontrar o gateway"
read_when:
  - Implementando ou mudando descoberta/advertising Bonjour
  - Ajustando modos de conexão remota (direto vs SSH)
  - Projetando descoberta de node + pareamento para nodes remotos
title: "Discovery and Transports"
---

# Descoberta e transportes

OpenCraft tem dois problemas distintos que parecem similares na superfície:

1. **Controle remoto do operador**: o app da barra de menus macOS controlando um gateway rodando em outro lugar.
2. **Pareamento de node**: iOS/Android (e futuros nodes) encontrando um gateway e pareando com segurança.

O objetivo do design é manter toda a descoberta/advertising de rede no **Node Gateway** (`opencraft gateway`) e manter clientes (app mac, iOS) como consumidores.

## Termos

- **Gateway**: um único processo gateway de longa duração que possui estado (sessões, pareamento, registro de node) e roda canais. A maioria dos setups usa um por host; setups multi-gateway isolados são possíveis.
- **Gateway WS (plano de controle)**: o endpoint WebSocket em `127.0.0.1:18789` por padrão; pode ser vinculado a LAN/tailnet via `gateway.bind`.
- **Transporte WS direto**: um endpoint Gateway WS voltado para LAN/tailnet (sem SSH).
- **Transporte SSH (fallback)**: controle remoto encaminhando `127.0.0.1:18789` via SSH.
- **Bridge TCP legado (depreciado/removido)**: transporte de node mais antigo (veja [Bridge protocol](/gateway/bridge-protocol)); não mais anunciado para descoberta.

Detalhes do protocolo:

- [Protocolo do Gateway](/gateway/protocol)
- [Protocolo Bridge (legado)](/gateway/bridge-protocol)

## Por que mantemos "direto" e SSH

- **WS direto** é a melhor UX na mesma rede e dentro de um tailnet:
  - auto-descoberta na LAN via Bonjour
  - tokens de pareamento + ACLs de propriedade do gateway
  - sem acesso shell necessário; superfície do protocolo pode permanecer restrita e auditável
- **SSH** permanece o fallback universal:
  - funciona em qualquer lugar onde você tem acesso SSH (mesmo entre redes não relacionadas)
  - sobrevive a problemas de multicast/mDNS
  - não requer novas portas de entrada além do SSH

## Entradas de descoberta (como clientes aprendem onde está o gateway)

### 1) Bonjour / mDNS (apenas LAN)

Bonjour é best-effort e não cruza redes. É usado apenas para conveniência de "mesma LAN".

Direção de alvo:

- O **gateway** anuncia seu endpoint WS via Bonjour.
- Clientes navegam e mostram uma lista "escolha um gateway", depois armazenam o endpoint escolhido.

Resolução de problemas e detalhes do beacon: [Bonjour](/gateway/bonjour).

#### Detalhes do beacon de serviço

- Tipos de serviço:
  - `_openclaw-gw._tcp` (beacon de transporte do gateway)
- Chaves TXT (não secretas):
  - `role=gateway`
  - `lanHost=<hostname>.local`
  - `sshPort=22` (ou o que for anunciado)
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (apenas quando TLS está habilitado)
  - `gatewayTlsSha256=<sha256>` (apenas quando TLS está habilitado e o fingerprint está disponível)
  - `canvasPort=<port>` (porta do host canvas; atualmente o mesmo que `gatewayPort` quando o host canvas está habilitado)
  - `cliPath=<path>` (opcional; path absoluto para um entrypoint ou binário `opencraft` executável)
  - `tailnetDns=<magicdns>` (hint opcional; auto-detectado quando Tailscale está disponível)

Notas de segurança:

- Registros TXT Bonjour/mDNS são **não autenticados**. Clientes devem tratar valores TXT apenas como hints de UX.
- Roteamento (host/porta) deve preferir o **endpoint de serviço resolvido** (SRV + A/AAAA) em vez de `lanHost`, `tailnetDns` ou `gatewayPort` fornecidos via TXT.
- Pinning TLS nunca deve permitir que um `gatewayTlsSha256` anunciado sobrescreva um pin armazenado anteriormente.
- Nodes iOS/Android devem tratar conexões diretas baseadas em descoberta como **apenas TLS** e requerem uma confirmação explícita de "confiar neste fingerprint" antes de armazenar um pin pela primeira vez (verificação fora de banda).

Desabilitar/sobrescrever:

- `OPENCLAW_DISABLE_BONJOUR=1` desabilita o advertising.
- `gateway.bind` em `~/.opencraft/opencraft.json` controla o modo de bind do Gateway.
- `OPENCLAW_SSH_PORT` sobrescreve a porta SSH anunciada no TXT (padrão 22).
- `OPENCLAW_TAILNET_DNS` publica um hint `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` sobrescreve o path do CLI anunciado.

### 2) Tailnet (entre redes)

Para setups de estilo Londres/Viena, Bonjour não vai ajudar. O alvo "direto" recomendado é:

- Nome MagicDNS do Tailscale (preferido) ou um IP tailnet estável.

Se o gateway pode detectar que está rodando sob Tailscale, ele publica `tailnetDns` como um hint opcional para clientes (incluindo beacons wide-area).

### 3) Alvo manual / SSH

Quando não há rota direta (ou direta está desabilitada), clientes sempre podem conectar via SSH encaminhando a porta do gateway de loopback.

Veja [Remote access](/gateway/remote).

## Seleção de transporte (política do cliente)

Comportamento recomendado do cliente:

1. Se um endpoint direto pareado estiver configurado e acessível, use-o.
2. Caso contrário, se Bonjour encontrar um gateway na LAN, ofereça uma escolha "Usar este gateway" com um toque e salve-o como endpoint direto.
3. Caso contrário, se um DNS/IP tailnet estiver configurado, tente direto.
4. Caso contrário, faça fallback para SSH.

## Pareamento + auth (transporte direto)

O gateway é a fonte de verdade para admissão de node/cliente.

- Solicitações de pareamento são criadas/aprovadas/rejeitadas no gateway (veja [Gateway pairing](/gateway/pairing)).
- O gateway aplica:
  - auth (token / keypair)
  - escopos/ACLs (o gateway não é um proxy raw para todos os métodos)
  - rate limits

## Responsabilidades por componente

- **Gateway**: anuncia beacons de descoberta, possui decisões de pareamento e hospeda o endpoint WS.
- **App macOS**: ajuda você a escolher um gateway, mostra prompts de pareamento e usa SSH apenas como fallback.
- **Nodes iOS/Android**: navegam Bonjour como conveniência e conectam ao Gateway WS pareado.
