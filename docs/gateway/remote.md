---
summary: "Acesso remoto usando túneis SSH (Gateway WS) e tailnets"
read_when:
  - Rodando ou resolvendo problemas de configurações de gateway remoto
title: "Acesso Remoto"
---

# Acesso remoto (SSH, túneis e tailnets)

Este repositório suporta "remoto via SSH" mantendo um único Gateway (o master) rodando em um host dedicado (desktop/servidor) e conectando clientes a ele.

- Para **operadores (você / o app macOS)**: tunelamento SSH é o fallback universal.
- Para **nodes (iOS/Android e dispositivos futuros)**: conecte ao **WebSocket** do Gateway (LAN/tailnet ou túnel SSH conforme necessário).

## A ideia principal

- O WebSocket do Gateway faz bind em **loopback** na sua porta configurada (padrão 18789).
- Para uso remoto, você encaminha essa porta loopback via SSH (ou usa um tailnet/VPN e precisa de menos tunelamento).

## Configurações comuns de VPN/tailnet (onde o agente vive)

Pense no **host do Gateway** como "onde o agente vive". Ele possui sessões, perfis de auth, canais e state.
Seu laptop/desktop (e nodes) conectam a esse host.

### 1) Gateway sempre ativo na sua tailnet (VPS ou servidor doméstico)

Rode o Gateway em um host persistente e acesse-o via **Tailscale** ou SSH.

- **Melhor UX:** mantenha `gateway.bind: "loopback"` e use **Tailscale Serve** para a Control UI.
- **Fallback:** mantenha loopback + túnel SSH de qualquer máquina que precise de acesso.
- **Exemplos:** [exe.dev](/install/exe-dev) (VM fácil) ou [Hetzner](/install/hetzner) (VPS de produção).

Ideal quando seu laptop dorme com frequência mas você quer o agente sempre ativo.

### 2) Desktop doméstico roda o Gateway, laptop é controle remoto

O laptop **não** roda o agente. Ele conecta remotamente:

- Use o modo **Remote over SSH** do app macOS (Configurações → Geral → "OpenCraft runs").
- O app abre e gerencia o túnel, então WebChat + verificações de saúde "simplesmente funcionam".

Runbook: [acesso remoto macOS](/platforms/mac/remote).

### 3) Laptop roda o Gateway, acesso remoto de outras máquinas

Mantenha o Gateway local mas exponha-o com segurança:

- Túnel SSH ao laptop de outras máquinas, ou
- Tailscale Serve da Control UI mantendo o Gateway somente em loopback.

Guia: [Tailscale](/gateway/tailscale) e [Visão geral web](/web).

## Fluxo de comandos (o que roda onde)

Um serviço de gateway possui state + canais. Nodes são periféricos.

Exemplo de fluxo (Telegram → node):

- Mensagem do Telegram chega ao **Gateway**.
- Gateway roda o **agente** e decide se deve chamar uma tool de node.
- Gateway chama o **node** via WebSocket do Gateway (`node.*` RPC).
- Node retorna o resultado; Gateway responde de volta ao Telegram.

Notas:

- **Nodes não rodam o serviço gateway.** Apenas um gateway deve rodar por host a não ser que você intencionalmente rode perfis isolados (veja [Múltiplos gateways](/gateway/multiple-gateways)).
- O "modo node" do app macOS é apenas um cliente node via WebSocket do Gateway.

## Túnel SSH (CLI + tools)

Crie um túnel local ao Gateway WS remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Com o túnel ativo:

- `opencraft health` e `opencraft status --deep` agora alcançam o gateway remoto via `ws://127.0.0.1:18789`.
- `opencraft gateway {status,health,send,agent,call}` também pode direcionar para a URL encaminhada via `--url` quando necessário.

Nota: substitua `18789` pela sua `gateway.port` configurada (ou `--port`/`OPENCLAW_GATEWAY_PORT`).
Nota: quando você passa `--url`, o CLI não usa config ou credenciais de ambiente como fallback.
Inclua `--token` ou `--password` explicitamente. Credenciais explícitas ausentes é um erro.

## Padrões remotos do CLI

Você pode persistir um alvo remoto para que os comandos CLI o usem por padrão:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "seu-token",
    },
  },
}
```

Quando o gateway é somente loopback, mantenha a URL em `ws://127.0.0.1:18789` e abra o túnel SSH primeiro.

## Precedência de credenciais

A resolução de credenciais do Gateway segue um contrato compartilhado único entre caminhos de call/probe/status e monitoramento de aprovação de exec do Discord. O host de node usa o mesmo contrato base com uma exceção em modo local (ele intencionalmente ignora `gateway.remote.*`):

- Credenciais explícitas (`--token`, `--password`, ou tool `gatewayToken`) sempre ganham em caminhos de call que aceitam auth explícita.
- Segurança de substituição de URL:
  - Substituições de URL do CLI (`--url`) nunca reutilizam credenciais implícitas de config/env.
  - Substituições de URL de env (`OPENCLAW_GATEWAY_URL`) podem usar apenas credenciais de env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Padrões de modo local:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback remoto se aplica apenas quando o input de token de auth local não está definido)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback remoto se aplica apenas quando o input de senha de auth local não está definido)
- Padrões de modo remoto:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Exceção de modo local do host de node: `gateway.remote.token` / `gateway.remote.password` são ignorados.
- Verificações de token de probe/status remoto são estritas por padrão: usam apenas `gateway.remote.token` (sem fallback de token local) quando direcionando para o modo remoto.
- Variáveis de env `CLAWDBOT_GATEWAY_*` legadas são usadas apenas por caminhos de call de compatibilidade; resolução de probe/status/auth usa apenas `OPENCLAW_GATEWAY_*`.

## Chat UI via SSH

O WebChat não usa mais uma porta HTTP separada. A UI de chat SwiftUI conecta diretamente ao WebSocket do Gateway.

- Encaminhe `18789` via SSH (veja acima), depois conecte clientes a `ws://127.0.0.1:18789`.
- No macOS, prefira o modo "Remote over SSH" do app, que gerencia o túnel automaticamente.

## App macOS "Remote over SSH"

O app de barra de menus macOS pode conduzir a mesma configuração de ponta a ponta (verificações de status remoto, WebChat e encaminhamento de Voice Wake).

Runbook: [acesso remoto macOS](/platforms/mac/remote).

## Regras de segurança (remoto/VPN)

Versão curta: **mantenha o Gateway somente em loopback** a não ser que você tenha certeza de que precisa de um bind.

- **Loopback + SSH/Tailscale Serve** é o padrão mais seguro (sem exposição pública).
- `ws://` plaintext é somente loopback por padrão. Para redes privadas confiáveis,
  defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` no processo cliente como break-glass.
- **Binds não-loopback** (`lan`/`tailnet`/`custom`, ou `auto` quando loopback está indisponível) devem usar tokens/senhas de auth.
- `gateway.remote.token` / `.password` são fontes de credencial do cliente. Eles **não** configuram auth do servidor por si mesmos.
- Caminhos de call locais podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` não está definido.
- Se `gateway.auth.token` / `gateway.auth.password` está explicitamente configurado via SecretRef e não resolvido, a resolução falha fechada (sem mascaramento de fallback remoto).
- `gateway.remote.tlsFingerprint` fixa o certificado TLS remoto ao usar `wss://`.
- **Tailscale Serve** pode autenticar tráfego Control UI/WebSocket via headers de identidade
  quando `gateway.auth.allowTailscale: true`; endpoints HTTP API ainda
  exigem auth de token/senha. Este fluxo sem token assume que o host do gateway é
  confiável. Defina como `false` se quiser tokens/senhas em tudo.
- Trate o controle de browser como acesso de operador: somente tailnet + pareamento deliberado de node.

Aprofundamento: [Segurança](/gateway/security).
