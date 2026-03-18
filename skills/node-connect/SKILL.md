---
name: node-connect
description: Diagnostique falhas de conexão e emparelhamento de nós OpenCraft para apps Android, iOS e macOS. Use quando QR/código de configuração/conexão manual falhar, Wi-Fi local funcionar mas VPS/tailnet não, ou erros mencionar emparelhamento necessário, não autorizado, token de bootstrap inválido ou expirado, gateway.bind, gateway.remote.url, Tailscale, ou plugins.entries.device-pair.config.publicUrl.
---

# Node Connect

Objetivo: encontrar a rota real do nó -> gateway, verificar se o OpenCraft está anunciando essa rota e corrigir o emparelhamento/autenticação.

## Topologia primeiro

Decida em qual caso você está antes de propor correções:

- mesma máquina / emulador / túnel USB
- mesma LAN / Wi-Fi local
- mesmo tailnet do Tailscale
- URL pública / proxy reverso

Não misture-os.

- Problema de Wi-Fi local: não mude para o Tailscale a menos que o acesso remoto seja realmente necessário.
- Problema de VPS / gateway remoto: não continue depurando IPs `localhost` ou de LAN.

## Se ambíguo, pergunte primeiro

Se a configuração não estiver clara ou o relatório de falha for vago, faça perguntas curtas de esclarecimento antes de diagnosticar.

Pergunte:

- qual rota pretendem usar: mesma máquina, mesma LAN, tailnet do Tailscale ou URL pública
- se usaram QR/código de configuração ou host/porta manual
- o texto/status/erro exato do app, citado exatamente se possível
- se `opencraft devices list` mostra uma solicitação de emparelhamento pendente

Não adivinhe a partir de "não consigo conectar".

## Verificações canônicas

Prefira `opencraft qr --json`. Ele usa o mesmo payload de código de configuração que o Android escaneia.

```bash
opencraft config get gateway.mode
opencraft config get gateway.bind
opencraft config get gateway.tailscale.mode
opencraft config get gateway.remote.url
opencraft config get gateway.auth.mode
opencraft config get gateway.auth.allowTailscale
opencraft config get plugins.entries.device-pair.config.publicUrl
opencraft qr --json
opencraft devices list
opencraft nodes status
```

Se esta instância do OpenCraft estiver apontada para um gateway remoto, execute também:

```bash
opencraft qr --remote --json
```

Se o Tailscale faz parte da situação:

```bash
tailscale status --json
```

## Leia o resultado, não suposições

Sucesso do `opencraft qr --json` significa:

- `gatewayUrl`: este é o endpoint real que o app deve usar.
- `urlSource`: isso indica qual caminho de configuração venceu.

Fontes comuns corretas:

- `gateway.bind=lan`: somente Wi-Fi / LAN local
- `gateway.bind=tailnet`: acesso direto via tailnet
- `gateway.tailscale.mode=serve` ou `gateway.tailscale.mode=funnel`: rota Tailscale
- `plugins.entries.device-pair.config.publicUrl`: rota pública/proxy reverso explícita
- `gateway.remote.url`: rota de gateway remoto

## Mapa de causa raiz

Se `opencraft qr --json` diz `Gateway is only bound to loopback`:

- o nó remoto ainda não consegue conectar
- corrija a rota e gere um novo código de configuração
- `gateway.bind=auto` não é suficiente se a rota QR efetiva ainda for loopback
- mesma LAN: use `gateway.bind=lan`
- mesmo tailnet: prefira `gateway.tailscale.mode=serve` ou use `gateway.bind=tailnet`
- internet pública: defina um `plugins.entries.device-pair.config.publicUrl` ou `gateway.remote.url` real

Se `gateway.bind=tailnet set, but no tailnet IP was found`:

- o host do gateway não está realmente no Tailscale

Se `qr --remote requires gateway.remote.url`:

- a configuração do modo remoto está incompleta

Se o app diz `pairing required`:

- a rota de rede e autenticação funcionaram
- aprove o dispositivo pendente

```bash
opencraft devices list
opencraft devices approve --latest
```

Se o app diz `bootstrap token invalid or expired`:

- código de configuração antigo
- gere um novo e refaça o escaneamento
- faça isso após qualquer correção de URL/autenticação também

Se o app diz `unauthorized`:

- token/senha errado, ou expectativa incorreta do Tailscale
- para o Tailscale Serve, `gateway.auth.allowTailscale` deve corresponder ao fluxo pretendido
- caso contrário, use token/senha explícito

## Heurísticas rápidas

- Configuração na mesma Wi-Fi + gateway anuncia `127.0.0.1`, `localhost` ou configuração somente loopback: errado.
- Configuração remota + configuração/manual usa IP LAN privado: errado.
- Configuração tailnet + gateway anuncia IP LAN em vez de MagicDNS / rota tailnet: errado.
- URL pública definida mas QR ainda anuncia outra coisa: inspecione `urlSource`; a configuração não é o que você pensa.
- `opencraft devices list` mostra solicitações pendentes: pare de alterar a configuração de rede e aprove primeiro.

## Estilo de correção

Responda com um diagnóstico concreto e uma rota.

Se não houver sinal suficiente ainda, peça a configuração + texto exato do app em vez de adivinhar.

Correto:

- `O gateway ainda está vinculado apenas ao loopback, então um nó em outra rede nunca conseguirá alcançá-lo. Ative o Tailscale Serve, reinicie o gateway, execute opencraft qr novamente, refaça o escaneamento e aprove o emparelhamento de dispositivo pendente.`

Errado:

- `Talvez LAN, talvez Tailscale, talvez encaminhamento de porta, talvez URL pública.`
