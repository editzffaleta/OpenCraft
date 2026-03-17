---
summary: "Descoberta Bonjour/mDNS + debugging (beacons do Gateway, clientes e modos de falha comuns)"
read_when:
  - Debugando problemas de descoberta Bonjour no macOS/iOS
  - Alterando tipos de serviço mDNS, registros TXT ou UX de descoberta
title: "Bonjour Discovery"
---

# Descoberta Bonjour / mDNS

OpenCraft usa Bonjour (mDNS / DNS-SD) como uma **conveniência apenas de LAN** para descobrir um Gateway ativo (endpoint WebSocket). É best-effort e **não** substitui conectividade via SSH ou Tailnet.

## Bonjour de área ampla (Unicast DNS-SD) via Tailscale

Se o node e o gateway estão em redes diferentes, mDNS multicast não cruzará a fronteira. Você pode manter a mesma UX de descoberta mudando para **unicast DNS-SD** ("Bonjour de Área Ampla") via Tailscale.

Etapas de alto nível:

1. Execute um servidor DNS no host do gateway (acessível via Tailnet).
2. Publique registros DNS-SD para `_opencraft-gw._tcp` em uma zona dedicada (exemplo: `opencraft.internal.`).
3. Configure **split DNS** do Tailscale para que seu domínio escolhido resolva via aquele servidor DNS para clientes (incluindo iOS).

OpenCraft suporta qualquer domínio de descoberta; `opencraft.internal.` é apenas um exemplo.
Nodes iOS/Android navegam tanto `local.` quanto seu domínio de área ampla configurado.

### Config do Gateway (recomendado)

```json5
{
  gateway: { bind: "tailnet" }, // apenas tailnet (recomendado)
  discovery: { wideArea: { enabled: true } }, // habilita publicação DNS-SD de área ampla
}
```

### Setup único do servidor DNS (host do gateway)

```bash
opencraft dns setup --apply
```

Isso instala o CoreDNS e o configura para:

- escutar na porta 53 apenas nas interfaces Tailscale do gateway
- servir seu domínio escolhido (exemplo: `opencraft.internal.`) a partir de `~/.opencraft/dns/<domain>.db`

Valide de uma máquina conectada ao tailnet:

```bash
dns-sd -B _opencraft-gw._tcp opencraft.internal.
dig @<TAILNET_IPV4> -p 53 _opencraft-gw._tcp.opencraft.internal PTR +short
```

### Configurações DNS do Tailscale

No console admin do Tailscale:

- Adicione um nameserver apontando para o IP do tailnet do gateway (UDP/TCP 53).
- Adicione split DNS para que seu domínio de descoberta use esse nameserver.

Quando os clientes aceitarem o DNS do tailnet, nodes iOS podem navegar `_opencraft-gw._tcp` no seu domínio de descoberta sem multicast.

### Segurança do listener do Gateway (recomendado)

A porta WS do Gateway (padrão `18789`) faz bind para loopback por padrão. Para acesso LAN/tailnet, faça bind explicitamente e mantenha a auth habilitada.

Para setups apenas-tailnet:

- Defina `gateway.bind: "tailnet"` em `~/.editzffaleta/OpenCraft.json`.
- Reinicie o Gateway (ou reinicie o app de menubar do macOS).

## O que anuncia

Apenas o Gateway anuncia `_opencraft-gw._tcp`.

## Tipos de serviço

- `_opencraft-gw._tcp` — beacon de transporte do gateway (usado por nodes macOS/iOS/Android).

## Chaves TXT (dicas não-secretas)

O Gateway anuncia pequenas dicas não-secretas para tornar os fluxos de UI convenientes:

- `role=gateway`
- `displayName=<nome amigável>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (apenas quando TLS está habilitado)
- `gatewayTlsSha256=<sha256>` (apenas quando TLS está habilitado e fingerprint está disponível)
- `canvasPort=<port>` (apenas quando o canvas host está habilitado; atualmente o mesmo que `gatewayPort`)
- `sshPort=<port>` (padrão 22 quando não sobrescrito)
- `transport=gateway`
- `cliPath=<path>` (opcional; caminho absoluto para um entrypoint executável `opencraft`)
- `tailnetDns=<magicdns>` (dica opcional quando Tailnet está disponível)

Notas de segurança:

- Registros TXT do Bonjour/mDNS são **não autenticados**. Clientes não devem tratar TXT como roteamento autoritativo.
- Clientes devem rotear usando o endpoint de serviço resolvido (SRV + A/AAAA). Trate `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` apenas como dicas.
- O pinning de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado sobrescreva um pin previamente armazenado.
- Nodes iOS/Android devem tratar conexões diretas baseadas em descoberta como **apenas-TLS** e exigir confirmação explícita do usuário antes de confiar em um fingerprint pela primeira vez.

## Debugging no macOS

Ferramentas built-in úteis:

- Navegar instâncias:

  ```bash
  dns-sd -B _opencraft-gw._tcp local.
  ```

- Resolver uma instância (substitua `<instance>`):

  ```bash
  dns-sd -L "<instance>" _opencraft-gw._tcp local.
  ```

Se a navegação funciona mas a resolução falha, você geralmente está enfrentando uma política de LAN ou um problema de resolver mDNS.

## Debugging nos logs do Gateway

O Gateway escreve um arquivo de log rotativo (impresso na inicialização como
`gateway log file: ...`). Procure por linhas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Debugging no node iOS

O node iOS usa `NWBrowser` para descobrir `_opencraft-gw._tcp`.

Para capturar logs:

- Configurações → Gateway → Avançado → **Discovery Debug Logs**
- Configurações → Gateway → Avançado → **Discovery Logs** → reproduza → **Copiar**

O log inclui transições de estado do navegador e mudanças no conjunto de resultados.

## Modos de falha comuns

- **Bonjour não cruza redes**: use Tailnet ou SSH.
- **Multicast bloqueado**: algumas redes Wi-Fi desabilitam mDNS.
- **Sleep / churn de interface**: macOS pode temporariamente perder resultados mDNS; tente novamente.
- **Navegação funciona mas resolução falha**: mantenha nomes de máquinas simples (evite emojis ou pontuação), depois reinicie o Gateway. O nome da instância de serviço é derivado do nome do host, então nomes excessivamente complexos podem confundir alguns resolvers.

## Nomes de instância escapados (`\032`)

Bonjour/DNS-SD frequentemente escapa bytes em nomes de instância de serviço como sequências decimais `\DDD` (ex. espaços se tornam `\032`).

- Isso é normal no nível do protocolo.
- UIs devem decodificar para exibição (iOS usa `BonjourEscapes.decode`).

## Desabilitando / configuração

- `OPENCRAFT_DISABLE_BONJOUR=1` desabilita a publicação (legado: `OPENCRAFT_DISABLE_BONJOUR`).
- `gateway.bind` em `~/.editzffaleta/OpenCraft.json` controla o modo de bind do Gateway.
- `OPENCRAFT_SSH_PORT` sobrescreve a porta SSH anunciada no TXT (legado: `OPENCRAFT_SSH_PORT`).
- `OPENCRAFT_TAILNET_DNS` publica uma dica MagicDNS no TXT (legado: `OPENCRAFT_TAILNET_DNS`).
- `OPENCRAFT_CLI_PATH` sobrescreve o caminho do CLI anunciado (legado: `OPENCRAFT_CLI_PATH`).

## Documentação relacionada

- Política de descoberta e seleção de transporte: [Discovery](/gateway/discovery)
- Pairing de node + aprovações: [Gateway pairing](/gateway/pairing)
