---
summary: "App Android (nó): runbook de conexão + superfície de comandos Connect/Chat/Voice/Canvas"
read_when:
  - Pareando ou reconectando o nó Android
  - Depurando descoberta de gateway Android ou auth
  - Verificando paridade de histórico de chat entre clientes
title: "App Android"
---

# App Android (Nó)

> **Nota:** O app Android ainda não foi lançado publicamente. O código-fonte está disponível no [repositório OpenCraft](https://github.com/openclaw/openclaw) em `apps/android`. Você pode compilá-lo usando Java 17 e o Android SDK (`./gradlew :app:assembleDebug`). Veja [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) para instruções de build.

## Snapshot de suporte

- Papel: app nó companion (Android não hospeda o Gateway).
- Gateway necessário: sim (rode no macOS, Linux ou Windows via WSL2).
- Instalação: [Primeiros Passos](/start/getting-started) + [Pareamento](/channels/pairing).
- Gateway: [Runbook](/gateway) + [Configuração](/gateway/configuration).
  - Protocolos: [Protocolo do Gateway](/gateway/protocol) (nós + plano de controle).

## Controle do sistema

Controle do sistema (launchd/systemd) fica no host do Gateway. Veja [Gateway](/gateway).

## Runbook de Conexão

App nó Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

O Android conecta diretamente ao WebSocket do Gateway (padrão `ws://<host>:18789`) e usa pareamento de dispositivo (`role: node`).

### Pré-requisitos

- Você pode rodar o Gateway na máquina "mestre".
- Dispositivo/emulador Android pode alcançar o WebSocket do gateway:
  - Mesma LAN com mDNS/NSD, **ou**
  - Mesmo tailnet Tailscale usando Wide-Area Bonjour / unicast DNS-SD (veja abaixo), **ou**
  - Host/porta do gateway manual (fallback)
- Você pode rodar o CLI (`opencraft`) na máquina do gateway (ou via SSH).

### 1) Iniciar o Gateway

```bash
opencraft gateway --port 18789 --verbose
```

Confirme nos logs que você vê algo como:

- `listening on ws://0.0.0.0:18789`

Para setups somente tailnet (recomendado para Vienna ⇄ London), vincule o gateway ao IP do tailnet:

- Defina `gateway.bind: "tailnet"` em `~/.opencraft/opencraft.json` no host do gateway.
- Reinicie o Gateway / app menubar do macOS.

### 2) Verificar descoberta (opcional)

Na máquina do gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Mais notas de debug: [Bonjour](/gateway/bonjour).

#### Descoberta Tailnet (Vienna ⇄ London) via unicast DNS-SD

A descoberta Android NSD/mDNS não cruza redes. Se seu nó Android e o gateway estão em redes diferentes mas conectados via Tailscale, use Wide-Area Bonjour / unicast DNS-SD em vez disso:

1. Configure uma zona DNS-SD (exemplo `openclaw.internal.`) no host do gateway e publique registros `_openclaw-gw._tcp`.
2. Configure Tailscale split DNS para seu domínio escolhido apontando para esse servidor DNS.

Detalhes e exemplo de config CoreDNS: [Bonjour](/gateway/bonjour).

### 3) Conectar pelo Android

No app Android:

- O app mantém sua conexão com o gateway ativa via **serviço em primeiro plano** (notificação persistente).
- Abra a aba **Connect**.
- Use o modo **Código de Configuração** ou **Manual**.
- Se a descoberta estiver bloqueada, use host/porta manual (e TLS/token/senha quando necessário) em **Controles avançados**.

Após o primeiro pareamento bem-sucedido, o Android reconecta automaticamente ao iniciar:

- Endpoint manual (se habilitado), caso contrário
- O último gateway descoberto (melhor esforço).

### 4) Aprovar pareamento (CLI)

Na máquina do gateway:

```bash
opencraft devices list
opencraft devices approve <requestId>
opencraft devices reject <requestId>
```

Detalhes de pareamento: [Pareamento](/channels/pairing).

### 5) Verificar se o nó está conectado

- Via status de nós:

  ```bash
  opencraft nodes status
  ```

- Via Gateway:

  ```bash
  opencraft gateway call node.list --params "{}"
  ```

### 6) Chat + histórico

A aba Chat do Android suporta seleção de sessão (padrão `main`, mais outras sessões existentes):

- Histórico: `chat.history`
- Enviar: `chat.send`
- Atualizações push (melhor esforço): `chat.subscribe` → `event:"chat"`

### 7) Canvas + câmera

#### Host Canvas do Gateway (recomendado para conteúdo web)

Se você quer que o nó mostre HTML/CSS/JS real que o agente pode editar no disco, aponte o nó para o host canvas do Gateway.

Nota: os nós carregam canvas do servidor HTTP do Gateway (mesma porta que `gateway.port`, padrão `18789`).

1. Crie `~/.opencraft/workspace/canvas/index.html` no host do gateway.

2. Navegue o nó para ele (LAN):

```bash
opencraft nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): se ambos os dispositivos estão no Tailscale, use um nome MagicDNS ou IP tailnet em vez de `.local`, ex: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Este servidor injeta um cliente de recarga automática em HTML e recarrega nas mudanças de arquivo.
O host A2UI fica em `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Comandos canvas (somente primeiro plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (use `{"url":""}` ou `{"url":"/"}` para retornar ao scaffold padrão). `canvas.snapshot` retorna `{ format, base64 }` (padrão `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias legado `canvas.a2ui.pushJSONL`)

Comandos câmera (somente primeiro plano; controlado por permissão):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Veja [Nó de câmera](/nodes/camera) para parâmetros e helpers CLI.

### 8) Voz + superfície de comandos Android expandida

- Voz: o Android usa um fluxo único de ligar/desligar microfone na aba Voice com captura de transcrição e reprodução TTS (ElevenLabs quando configurado, fallback TTS do sistema). A voz para quando o app sai do primeiro plano.
- Toggles de voice wake/talk-mode foram removidos do UX/runtime Android.
- Famílias de comandos Android adicionais (disponibilidade depende do dispositivo + permissões):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions`
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `motion.activity`, `motion.pedometer`
