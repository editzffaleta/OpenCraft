---
name: node-connect
description: Diagnostica falhas de conexão e pareamento de nós OpenCraft para apps Android, iOS e macOS. Use quando QR/código de configuração/conexão manual falha, Wi-Fi local funciona mas VPS/tailnet não, ou erros mencionam pairing required, unauthorized, bootstrap token invalid or expired, gateway.bind, gateway.remote.url, Tailscale, ou plugins.entries.device-pair.config.publicUrl.
---

# Node Connect

Objetivo: encontrar a rota real do nó -> gateway, verificar se o OpenCraft está anunciando essa rota e então corrigir pareamento/autenticação.

## Topologia primeiro

Decida em qual caso você está antes de propor correções:

- mesma máquina / emulador / túnel USB
- mesma LAN / Wi-Fi local
- mesmo tailnet do Tailscale
- URL pública / proxy reverso

Não misture.

- Problema de Wi-Fi local: não mude para Tailscale a menos que acesso remoto seja realmente necessário.
- Problema de VPS / gateway remoto: não continue depurando IPs `localhost` ou LAN.

## Se ambíguo, pergunte primeiro

Se a configuração não estiver clara ou o relato de falha for vago, faça perguntas curtas de esclarecimento antes de diagnosticar.

Pergunte por:

- qual rota é pretendida: mesma máquina, mesma LAN, tailnet Tailscale ou URL pública
- se usaram QR/código de configuração ou host/porta manual
- o texto/status/erro exato do app, citado exatamente se possível
- se `opencraft devices list` mostra uma solicitação de pareamento pendente

Não adivinhe a partir de `can't connect`.

## Verificações canônicas

Prefira `opencraft qr --json`. Usa o mesmo payload de código de configuração que o Android escaneia.

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

Se esta instância do OpenCraft aponta para um gateway remoto, também execute:

```bash
opencraft qr --remote --json
```

Se o Tailscale faz parte da história:

```bash
tailscale status --json
```

## Leia o resultado, não as suposições

Sucesso de `opencraft qr --json` significa:

- `gatewayUrl`: este é o endpoint real que o app deve usar.
- `urlSource`: indica qual caminho de configuração ganhou.

Fontes boas comuns:

- `gateway.bind=lan`: apenas Wi-Fi / LAN
- `gateway.bind=tailnet`: acesso direto ao tailnet
- `gateway.tailscale.mode=serve` ou `gateway.tailscale.mode=funnel`: rota Tailscale
- `plugins.entries.device-pair.config.publicUrl`: rota pública/proxy reverso explícita
- `gateway.remote.url`: rota de gateway remoto

## Mapa de causa raiz

Se `opencraft qr --json` diz `Gateway is only bound to loopback`:

- nó remoto não consegue se conectar ainda
- corrija a rota e gere um novo código de configuração
- `gateway.bind=auto` não é suficiente se a rota QR efetiva ainda for loopback
- mesma LAN: use `gateway.bind=lan`
- mesmo tailnet: prefira `gateway.tailscale.mode=serve` ou use `gateway.bind=tailnet`
- internet pública: defina um `plugins.entries.device-pair.config.publicUrl` real ou `gateway.remote.url`

Se `gateway.bind=tailnet set, but no tailnet IP was found`:

- o host do gateway não está realmente no Tailscale

Se `qr --remote requires gateway.remote.url`:

- configuração de modo remoto está incompleta

Se o app diz `pairing required`:

- rota de rede e autenticação funcionaram
- aprove o dispositivo pendente

```bash
opencraft devices list
opencraft devices approve --latest
```

Se o app diz `bootstrap token invalid or expired`:

- código de configuração antigo
- gere um novo e reescaneie
- faça isso após qualquer correção de URL/autenticação também

Se o app diz `unauthorized`:

- token/senha errados, ou expectativa Tailscale errada
- para Tailscale Serve, `gateway.auth.allowTailscale` deve corresponder ao fluxo pretendido
- caso contrário use token/senha explícitos

## Heurísticas rápidas

- Configuração Wi-Fi local + gateway anuncia `127.0.0.1`, `localhost`, ou configuração apenas loopback: errado.
- Configuração remota + configuração/manual usa IP LAN privado: errado.
- Configuração tailnet + gateway anuncia IP LAN em vez de MagicDNS / rota tailnet: errado.
- URL pública definida mas QR ainda anuncia outra coisa: inspecione `urlSource`; a configuração não é o que você pensa.
- `opencraft devices list` mostra solicitações pendentes: pare de mudar a configuração de rede e aprove primeiro.

## Estilo de correção

Responda com um diagnóstico concreto e uma rota.

Se não houver sinal suficiente ainda, peça configuração + texto exato do app em vez de adivinhar.

Bom:

- `O gateway ainda está apenas em loopback, então um nó em outra rede nunca conseguirá alcançá-lo. Habilite o Tailscale Serve, reinicie o gateway, execute opencraft qr novamente, reescaneie e então aprove o pareamento de dispositivo pendente.`

Ruim:

- `Talvez LAN, talvez Tailscale, talvez encaminhamento de porta, talvez URL pública.`
