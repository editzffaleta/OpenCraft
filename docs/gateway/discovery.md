---
summary: "Descoberta de node e transportes (Bonjour, Tailscale, SSH) para encontrar o gateway"
read_when:
  - Implementando ou alterando descoberta/publicação Bonjour
  - Ajustando modos de conexão remota (direto vs SSH)
  - Projetando descoberta de node + pairing para nodes remotos
title: "Discovery and Transports"
---

# Descoberta e transportes

OpenCraft tem dois problemas distintos que parecem similares na superfície:

1. **Controle remoto do operador**: o app de barra de menu macOS controlando um gateway executando em outro lugar.
2. **Pairing de node**: iOS/Android (e futuros nodes) encontrando um gateway e pareando com segurança.

O objetivo de design é manter toda a descoberta/publicação de rede no **Node Gateway** (`opencraft gateway`) e manter clientes (app mac, iOS) como consumidores.

## Termos

- **Gateway**: um processo de gateway único de longa duração que é dono do estado (sessões, pairing, registro de nodes) e executa canais. A maioria dos setups usa um por host; setups multi-gateway isolados são possíveis.
- **Gateway WS (control plane)**: o endpoint WebSocket em `127.0.0.1:18789` por padrão; pode ser vinculado a LAN/tailnet via `gateway.bind`.
- **Transporte WS direto**: um endpoint Gateway WS voltado para LAN/tailnet (sem SSH).
- **Transporte SSH (fallback)**: controle remoto encaminhando `127.0.0.1:18789` via SSH.
- **TCP bridge legado (descontinuado/removido)**: transporte de node antigo (veja [Bridge protocol](/gateway/bridge-protocol)); não mais anunciado para descoberta.

Detalhes de protocolo:

- [Protocolo Gateway](/gateway/protocol)
- [Protocolo Bridge (legado)](/gateway/bridge-protocol)

## Por que mantemos "direto" e SSH

- **WS Direto** é a melhor UX na mesma rede e dentro de um tailnet:
  - auto-descoberta na LAN via Bonjour
  - tokens de pairing + ACLs são do gateway
  - sem acesso shell necessário; a superfície do protocolo pode permanecer restrita e auditável
- **SSH** permanece como fallback universal:
  - funciona em qualquer lugar que você tenha acesso SSH (mesmo entre redes não relacionadas)
  - sobrevive a problemas de multicast/mDNS
  - não requer novas portas de entrada além de SSH

## Inputs de descoberta (como clientes aprendem onde está o gateway)

### 1) Bonjour / mDNS (apenas LAN)

Bonjour é best-effort e não cruza redes. É usado apenas para conveniência de "mesma LAN".

Direção alvo:

- O **gateway** anuncia seu endpoint WS via Bonjour.
- Clientes navegam e mostram uma lista "escolha um gateway", depois armazenam o endpoint escolhido.

Solução de problemas e detalhes de beacon: [Bonjour](/gateway/bonjour).

#### Detalhes do beacon de serviço

- Tipos de serviço:
  - `_opencraft-gw._tcp` (beacon de transporte do gateway)
- Chaves TXT (não-secretas):
  - `role=gateway`
  - `lanHost=<hostname>.local`
  - `sshPort=22` (ou o que for anunciado)
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (apenas quando TLS está habilitado)
  - `gatewayTlsSha256=<sha256>` (apenas quando TLS está habilitado e fingerprint está disponível)
  - `canvasPort=<port>` (porta do canvas host; atualmente a mesma que `gatewayPort` quando o canvas host está habilitado)
  - `cliPath=<path>` (opcional; caminho absoluto para um entrypoint ou binário executável `opencraft`)
  - `tailnetDns=<magicdns>` (dica opcional; auto-detectada quando Tailscale está disponível)

Notas de segurança:

- Registros TXT Bonjour/mDNS são **não autenticados**. Clientes devem tratar valores TXT apenas como dicas de UX.
- Roteamento (host/porta) deve preferir o **endpoint de serviço resolvido** (SRV + A/AAAA) sobre `lanHost`, `tailnetDns` ou `gatewayPort` fornecidos no TXT.
- Pinning de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado sobrescreva um pin previamente armazenado.
- Nodes iOS/Android devem tratar conexões diretas baseadas em descoberta como **apenas-TLS** e exigir uma confirmação explícita de "confiar neste fingerprint" antes de armazenar um pin pela primeira vez (verificação fora-de-banda).

Desabilitar/sobrescrever:

- `OPENCRAFT_DISABLE_BONJOUR=1` desabilita a publicação.
- `gateway.bind` em `~/.editzffaleta/OpenCraft.json` controla o modo de bind do Gateway.
- `OPENCRAFT_SSH_PORT` sobrescreve a porta SSH anunciada no TXT (padrão 22).
- `OPENCRAFT_TAILNET_DNS` publica uma dica `tailnetDns` (MagicDNS).
- `OPENCRAFT_CLI_PATH` sobrescreve o caminho do CLI anunciado.

### 2) Tailnet (cross-network)

Para setups estilo Londres/Viena, Bonjour não ajuda. O alvo "direto" recomendado é:

- Nome MagicDNS do Tailscale (preferido) ou um IP estável de tailnet.

Se o gateway detectar que está executando sob Tailscale, ele publica `tailnetDns` como dica opcional para clientes (incluindo beacons de área ampla).

### 3) Manual / alvo SSH

Quando não há rota direta (ou direto está desabilitado), clientes sempre podem conectar via SSH encaminhando a porta loopback do gateway.

Veja [Remote access](/gateway/remote).

## Seleção de transporte (política do cliente)

Comportamento recomendado do cliente:

1. Se um endpoint direto pareado está configurado e acessível, use-o.
2. Caso contrário, se Bonjour encontrar um gateway na LAN, ofereça uma escolha "Usar este gateway" com um toque e salve como endpoint direto.
3. Caso contrário, se DNS/IP de tailnet está configurado, tente direto.
4. Caso contrário, use SSH como fallback.

## Pairing + auth (transporte direto)

O gateway é a fonte de verdade para admissão de node/cliente.

- Requisições de pairing são criadas/aprovadas/rejeitadas no gateway (veja [Gateway pairing](/gateway/pairing)).
- O gateway aplica:
  - auth (token / keypair)
  - escopos/ACLs (o gateway não é um proxy bruto para todo método)
  - rate limits

## Responsabilidades por componente

- **Gateway**: anuncia beacons de descoberta, é dono das decisões de pairing e hospeda o endpoint WS.
- **App macOS**: ajuda a escolher um gateway, mostra prompts de pairing e usa SSH apenas como fallback.
- **Nodes iOS/Android**: navegam Bonjour como conveniência e conectam ao Gateway WS pareado.
