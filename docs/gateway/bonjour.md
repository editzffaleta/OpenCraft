---
summary: "Descoberta Bonjour/mDNS + depuração (beacons do Gateway, clientes e modos de falha comuns)"
read_when:
  - Depurando problemas de descoberta Bonjour no macOS/iOS
  - Mudando tipos de serviço mDNS, registros TXT ou UX de descoberta
title: "Bonjour Discovery"
---

# Descoberta Bonjour / mDNS

OpenCraft usa Bonjour (mDNS / DNS-SD) como uma **conveniência apenas de LAN** para descobrir
um Gateway ativo (endpoint WebSocket). É best-effort e **não** substitui SSH ou
conectividade baseada em Tailnet.

## Bonjour wide-area (Unicast DNS-SD) via Tailscale

Se o node e o gateway estiverem em redes diferentes, mDNS multicast não cruzará a
fronteira. Você pode manter a mesma UX de descoberta mudando para **unicast DNS-SD**
("Wide-Area Bonjour") via Tailscale.

Passos de alto nível:

1. Rodar um servidor DNS no host do gateway (acessível via Tailnet).
2. Publicar registros DNS-SD para `_openclaw-gw._tcp` sob uma zona dedicada
   (exemplo: `openclaw.internal.`).
3. Configurar **split DNS** do Tailscale para que seu domínio escolhido resolva via aquele
   servidor DNS para clientes (incluindo iOS).

OpenCraft suporta qualquer domínio de descoberta; `openclaw.internal.` é apenas um exemplo.
Nodes iOS/Android navegam em `local.` e em seu domínio wide-area configurado.

### Config do Gateway (recomendado)

```json5
{
  gateway: { bind: "tailnet" }, // apenas tailnet (recomendado)
  discovery: { wideArea: { enabled: true } }, // habilita publicação DNS-SD wide-area
}
```

### Setup único do servidor DNS (host do gateway)

```bash
opencraft dns setup --apply
```

Isso instala o CoreDNS e o configura para:

- ouvir na porta 53 apenas nas interfaces Tailscale do gateway
- servir seu domínio escolhido (exemplo: `openclaw.internal.`) de `~/.opencraft/dns/<domain>.db`

Validar de uma máquina conectada ao tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configurações DNS do Tailscale

No console de admin do Tailscale:

- Adicionar um nameserver apontando para o IP tailnet do gateway (UDP/TCP 53).
- Adicionar split DNS para que seu domínio de descoberta use aquele nameserver.

Uma vez que os clientes aceitem o DNS tailnet, nodes iOS podem navegar
`_openclaw-gw._tcp` no seu domínio de descoberta sem multicast.

### Segurança do listener do Gateway (recomendado)

A porta WS do Gateway (padrão `18789`) faz bind no loopback por padrão. Para acesso
LAN/tailnet, faça bind explicitamente e mantenha auth habilitada.

Para setups apenas tailnet:

- Defina `gateway.bind: "tailnet"` em `~/.opencraft/opencraft.json`.
- Reinicie o Gateway (ou reinicie o app macOS da barra de menus).

## O que anuncia

Apenas o Gateway anuncia `_openclaw-gw._tcp`.

## Tipos de serviço

- `_openclaw-gw._tcp` — beacon de transporte do gateway (usado por nodes macOS/iOS/Android).

## Chaves TXT (hints não secretos)

O Gateway anuncia hints não secretos pequenos para tornar fluxos de UI convenientes:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (apenas quando TLS está habilitado)
- `gatewayTlsSha256=<sha256>` (apenas quando TLS está habilitado e o fingerprint está disponível)
- `canvasPort=<port>` (apenas quando o host canvas está habilitado; atualmente o mesmo que `gatewayPort`)
- `sshPort=<port>` (padrão 22 quando não sobrescrito)
- `transport=gateway`
- `cliPath=<path>` (opcional; path absoluto para um entrypoint `opencraft` executável)
- `tailnetDns=<magicdns>` (hint opcional quando Tailnet está disponível)

Notas de segurança:

- Registros TXT Bonjour/mDNS são **não autenticados**. Clientes não devem tratar TXT como roteamento autoritativo.
- Clientes devem rotear usando o endpoint de serviço resolvido (SRV + A/AAAA). Trate `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` apenas como hints.
- Pinning TLS nunca deve permitir que um `gatewayTlsSha256` anunciado sobrescreva um pin armazenado anteriormente.
- Nodes iOS/Android devem tratar conexões diretas baseadas em descoberta como **apenas TLS** e requerem confirmação explícita do usuário antes de confiar em um fingerprint pela primeira vez.

## Depuração no macOS

Ferramentas integradas úteis:

- Navegar instâncias:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolver uma instância (substitua `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Se a navegação funcionar mas a resolução falhar, geralmente você está atingindo uma política de LAN ou
problema de resolver mDNS.

## Depuração nos logs do Gateway

O Gateway escreve um arquivo de log rolling (impresso na inicialização como
`gateway log file: ...`). Procure linhas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Depuração no node iOS

O node iOS usa `NWBrowser` para descobrir `_openclaw-gw._tcp`.

Para capturar logs:

- Configurações → Gateway → Avançado → **Discovery Debug Logs**
- Configurações → Gateway → Avançado → **Discovery Logs** → reproduzir → **Copiar**

O log inclui transições de estado do browser e mudanças no conjunto de resultados.

## Modos de falha comuns

- **Bonjour não cruza redes**: use Tailnet ou SSH.
- **Multicast bloqueado**: algumas redes Wi-Fi desabilitam mDNS.
- **Sleep / churning de interface**: macOS pode temporariamente soltar resultados mDNS; tente novamente.
- **Navegação funciona mas resolução falha**: mantenha nomes de máquina simples (evite emojis ou
  pontuação), depois reinicie o Gateway. O nome da instância de serviço deriva do
  nome do host, então nomes excessivamente complexos podem confundir alguns resolvers.

## Nomes de instância escapados (`\032`)

Bonjour/DNS-SD frequentemente escapa bytes em nomes de instância de serviço como sequências decimais `\DDD`
(por exemplo espaços se tornam `\032`).

- Isso é normal no nível do protocolo.
- UIs devem decodificar para exibição (iOS usa `BonjourEscapes.decode`).

## Desabilitando / configuração

- `OPENCLAW_DISABLE_BONJOUR=1` desabilita o anúncio (legado: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` em `~/.opencraft/opencraft.json` controla o modo de bind do Gateway.
- `OPENCLAW_SSH_PORT` sobrescreve a porta SSH anunciada no TXT (legado: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publica um hint MagicDNS no TXT (legado: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` sobrescreve o path do CLI anunciado (legado: `OPENCLAW_CLI_PATH`).

## Docs relacionados

- Política de descoberta e seleção de transporte: [Discovery](/gateway/discovery)
- Pareamento de node + aprovações: [Gateway pairing](/gateway/pairing)
