---
summary: "Acesso remoto usando SSH tunnels (Gateway WS) e tailnets"
read_when:
  - Executando ou solucionando problemas de setups de gateway remoto
title: "Remote Access"
---

# Acesso remoto (SSH, tunnels e tailnets)

Este repo suporta "remoto via SSH" mantendo um único Gateway (o master) executando em um host dedicado (desktop/servidor) e conectando clientes a ele.

- Para **operadores (você / o app macOS)**: SSH tunneling é o fallback universal.
- Para **nodes (iOS/Android e dispositivos futuros)**: conecte ao **WebSocket** do Gateway (LAN/tailnet ou SSH tunnel conforme necessário).

## A ideia central

- O WebSocket do Gateway faz bind em **loopback** na porta configurada (padrão 18789).
- Para uso remoto, você encaminha essa porta loopback via SSH (ou usa uma tailnet/VPN e faz menos tunneling).

## Setups comuns de VPN/tailnet (onde o agente reside)

Pense no **host do Gateway** como "onde o agente reside." Ele é dono das sessões, perfis de autenticação, canais e estado.
Seu laptop/desktop (e nodes) conectam a esse host.

### 1) Gateway sempre ativo na sua tailnet (VPS ou servidor doméstico)

Execute o Gateway em um host persistente e acesse via **Tailscale** ou SSH.

- **Melhor UX:** mantenha `gateway.bind: "loopback"` e use **Tailscale Serve** para a Control UI.
- **Fallback:** mantenha loopback + SSH tunnel de qualquer máquina que precise de acesso.
- **Exemplos:** [exe.dev](/install/exe-dev) (VM fácil) ou [Hetzner](/install/hetzner) (VPS de produção).

Isso é ideal quando seu laptop dorme frequentemente mas você quer o agente sempre ativo.

### 2) Desktop doméstico executa o Gateway, laptop é controle remoto

O laptop **não** executa o agente. Ele conecta remotamente:

- Use o modo **Remoto via SSH** do app macOS (Configurações → Geral → "OpenCraft executa").
- O app abre e gerencia o tunnel, então WebChat + verificações de saúde "simplesmente funcionam."

Runbook: [Acesso remoto macOS](/platforms/mac/remote).

### 3) Laptop executa o Gateway, acesso remoto de outras máquinas

Mantenha o Gateway local mas exponha-o com segurança:

- SSH tunnel para o laptop de outras máquinas, ou
- Tailscale Serve a Control UI e mantenha o Gateway somente em loopback.

Guia: [Tailscale](/gateway/tailscale) e [Visão geral Web](/web).

## Fluxo de comandos (o que executa onde)

Um serviço gateway é dono do estado + canais. Nodes são periféricos.

Exemplo de fluxo (Telegram → node):

- Mensagem do Telegram chega no **Gateway**.
- Gateway executa o **agente** e decide se chama uma ferramenta do node.
- Gateway chama o **node** via WebSocket do Gateway (RPC `node.*`).
- Node retorna o resultado; Gateway responde de volta ao Telegram.

Notas:

- **Nodes não executam o serviço gateway.** Apenas um gateway deve executar por host a menos que você intencionalmente execute perfis isolados (veja [Múltiplos gateways](/gateway/multiple-gateways)).
- O "modo node" do app macOS é apenas um cliente node via WebSocket do Gateway.

## SSH tunnel (CLI + ferramentas)

Crie um tunnel local para o WebSocket do Gateway remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Com o tunnel ativo:

- `opencraft health` e `opencraft status --deep` agora alcançam o gateway remoto via `ws://127.0.0.1:18789`.
- `opencraft gateway {status,health,send,agent,call}` também podem direcionar a URL encaminhada via `--url` quando necessário.

Nota: substitua `18789` pela sua `gateway.port` configurada (ou `--port`/`OPENCRAFT_GATEWAY_PORT`).
Nota: quando você passa `--url`, o CLI não faz fallback para credenciais de config ou ambiente.
Inclua `--token` ou `--password` explicitamente. Credenciais explícitas ausentes é um erro.

## Padrões remotos do CLI

Você pode persistir um alvo remoto para que comandos CLI o usem por padrão:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Quando o gateway é somente loopback, mantenha a URL em `ws://127.0.0.1:18789` e abra o SSH tunnel primeiro.

## Precedência de credenciais

A resolução de credenciais do Gateway segue um contrato compartilhado entre caminhos de call/probe/status e monitoramento de exec-approval do Discord. Node-host usa o mesmo contrato base com uma exceção de modo local (ele intencionalmente ignora `gateway.remote.*`):

- Credenciais explícitas (`--token`, `--password`, ou `gatewayToken` da ferramenta) sempre vencem em caminhos de call que aceitam auth explícito.
- Segurança de override de URL:
  - Overrides de URL do CLI (`--url`) nunca reutilizam credenciais implícitas de config/env.
  - Overrides de URL do env (`OPENCRAFT_GATEWAY_URL`) podem usar apenas credenciais do env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Padrões do modo local:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback remoto se aplica apenas quando a entrada de auth token local não está definida)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback remoto se aplica apenas quando a entrada de auth password local não está definida)
- Padrões do modo remoto:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Exceção do node-host em modo local: `gateway.remote.token` / `gateway.remote.password` são ignorados.
- Verificações de probe/status com token remoto são estritas por padrão: usam apenas `gateway.remote.token` (sem fallback de token local) ao direcionar o modo remoto.
- Variáveis de env legadas `CLAWDBOT_GATEWAY_*` são usadas apenas por caminhos de call de compatibilidade; resolução de probe/status/auth usa apenas `OPENCRAFT_GATEWAY_*`.

## Chat UI via SSH

O WebChat não usa mais uma porta HTTP separada. A chat UI do SwiftUI conecta diretamente ao WebSocket do Gateway.

- Encaminhe `18789` via SSH (veja acima), depois conecte clientes a `ws://127.0.0.1:18789`.
- No macOS, prefira o modo "Remoto via SSH" do app, que gerencia o tunnel automaticamente.

## App macOS "Remoto via SSH"

O app de barra de menu do macOS pode conduzir o mesmo setup de ponta a ponta (verificações de status remoto, WebChat e encaminhamento de Voice Wake).

Runbook: [Acesso remoto macOS](/platforms/mac/remote).

## Regras de segurança (remoto/VPN)

Versão curta: **mantenha o Gateway somente em loopback** a menos que tenha certeza de que precisa de um bind.

- **Loopback + SSH/Tailscale Serve** é o padrão mais seguro (sem exposição pública).
- `ws://` em texto puro é somente loopback por padrão. Para redes privadas confiáveis,
  defina `OPENCRAFT_ALLOW_INSECURE_PRIVATE_WS=1` no processo cliente como break-glass.
- **Binds não-loopback** (`lan`/`tailnet`/`custom`, ou `auto` quando loopback não está disponível) devem usar tokens/passwords de autenticação.
- `gateway.remote.token` / `.password` são fontes de credenciais do cliente. Eles **não** configuram a autenticação do servidor por si só.
- Caminhos de call locais podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` não está definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não resolvido, a resolução falha de forma fechada (sem fallback remoto mascarando).
- `gateway.remote.tlsFingerprint` fixa o certificado TLS remoto ao usar `wss://`.
- **Tailscale Serve** pode autenticar tráfego da Control UI/WebSocket via headers de identidade
  quando `gateway.auth.allowTailscale: true`; endpoints da API HTTP ainda
  requerem autenticação por token/password. Esse fluxo sem token assume que o host do gateway é
  confiável. Defina como `false` se quiser tokens/passwords em todo lugar.
- Trate o controle via navegador como acesso de operador: somente tailnet + pareamento deliberado de nodes.

Mais detalhes: [Segurança](/gateway/security).
