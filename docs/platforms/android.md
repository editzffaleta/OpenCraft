---
summary: "Aplicativo Android (nó): runbook de conexão + superfície de comando Connect/Chat/Voice/Canvas"
read_when:
  - Emparelhando ou reconectando o nó Android
  - Depurando descoberta do Gateway Android ou autenticação
  - Verificando paridade de histórico de chat entre clientes
title: "Aplicativo Android"
---

# Aplicativo Android (Nó)

> **Nota:** O aplicativo Android ainda não foi lançado publicamente. O código-fonte está disponível no [repositório do OpenCraft](https://github.com/editzffaleta/OpenCraft) em `apps/android`. Você pode construir você mesmo usando Java 17 e Android SDK (`./gradlew :app:assembleDebug`). Veja [apps/android/README.md](https://github.com/editzffaleta/OpenCraft/blob/main/apps/android/README.md) para instruções de compilação.

## Snapshot de suporte

- Função: aplicativo de nó complementar (Android não hospeda o Gateway).
- Gateway obrigatório: sim (execute em macOS, Linux ou Windows via WSL2).
- Instalar: [Guia de Introdução](/start/getting-started) + [Emparelhamento](/channels/pairing).
- Gateway: [Runbook](/gateway) + [Configuração](/gateway/configuration).
  - Protocolos: [Protocolo do Gateway](/gateway/protocol) (nós + plano de controle).

## Controle de sistema

O controle do sistema (launchd/systemd) fica no host do Gateway. Consulte [Gateway](/gateway).

## Runbook de conexão

Aplicativo de nó Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se conecta diretamente ao WebSocket do Gateway (padrão `ws://<host>:18789`) e usa emparelhamento de dispositivo (`role: node`).

### Pré-requisitos

- Você pode executar o Gateway na máquina "master".
- Dispositivo Android/emulador pode alcançar o WebSocket do Gateway:
  - Mesmo LAN com mDNS/NSD, **ou**
  - Mesmo tailnet do Tailscale usando Bonjour de Longo Alcance / DNS-SD unicast (veja abaixo), **ou**
  - Host/porta manual do Gateway (fallback)
- Você pode executar a CLI (`opencraft`) na máquina do Gateway (ou via SSH).

### 1) Inicie o Gateway

```bash
opencraft gateway --port 18789 --verbose
```

Confirme nos logs que você vê algo como:

- `listening on ws://0.0.0.0:18789`

Para configurações exclusivas de tailnet (recomendado para Viena ⇄ Londres), vincule o Gateway ao IP da tailnet:

- Defina `gateway.bind: "tailnet"` em `~/.editzffaleta/OpenCraft.json` no host do Gateway.
- Reinicie o Gateway / aplicativo da barra de menus macOS.

### 2) Verifique a descoberta (opcional)

Na máquina do Gateway:

```bash
dns-sd -B _opencraft-gw._tcp local.
```

Mais notas de depuração: [Bonjour](/gateway/bonjour).

#### Descoberta do Tailnet (Viena ⇄ Londres) via DNS-SD unicast

A descoberta NSD/mDNS do Android não cruzará redes. Se seu nó Android e o Gateway estiverem em redes diferentes, mas conectados via Tailscale, use Bonjour de Longo Alcance / DNS-SD unicast:

1. Configure uma zona DNS-SD (exemplo `opencraft.internal.`) no host do Gateway e publique registros `_opencraft-gw._tcp`.
2. Configure DNS de divisão do Tailscale para seu domínio escolhido apontando para esse servidor DNS.

Detalhes e exemplo de configuração do CoreDNS: [Bonjour](/gateway/bonjour).

### 3) Conectar do Android

No aplicativo Android:

- O aplicativo mantém sua conexão do Gateway viva via **serviço em primeiro plano** (notificação persistente).
- Abra a aba **Conectar**.
- Use modo **Setup Code** ou **Manual**.
- Se a descoberta for bloqueada, use host/porta manual (e TLS/token/senha quando necessário) em **Controles Avançados**.

Após o primeiro emparelhamento bem-sucedido, Android reconecta automaticamente ao iniciar:

- Endpoint manual (se ativado), caso contrário
- O último Gateway descoberto (melhor esforço).

### 4) Aprovar emparelhamento (CLI)

Na máquina do Gateway:

```bash
opencraft devices list
opencraft devices approve <requestId>
opencraft devices reject <requestId>
```

Detalhes de emparelhamento: [Emparelhamento](/channels/pairing).

### 5) Verifique se o nó está conectado

- Via status dos nós:

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

#### Host de Canvas do Gateway (recomendado para conteúdo web)

Se você quiser que o nó mostre HTML/CSS/JS real que o agente possa editar no disco, aponte o nó para o host de Canvas do Gateway.

Nota: os nós carregam Canvas do servidor HTTP do Gateway (mesma porta que `gateway.port`, padrão `18789`).

1. Crie `~/.opencraft/workspace/canvas/index.html` no host do Gateway.

2. Navegue o nó para ele (LAN):

```bash
opencraft nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__opencraft__/canvas/"}'
```

Tailnet (opcional): se ambos os dispositivos estiverem no Tailscale, use um nome MagicDNS ou IP da tailnet em vez de `.local`, p. ex. `http://<gateway-magicdns>:18789/__opencraft__/canvas/`.

Este servidor injeta um cliente de recarga dinâmica em HTML e recarrega em alterações de arquivo.
O host A2UI fica em `http://<gateway-host>:18789/__opencraft__/a2ui/`.

Comandos Canvas (somente em primeiro plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (use `{"url":""}` ou `{"url":"/"}` para retornar ao scaffold padrão). `canvas.snapshot` retorna `{ format, base64 }` (padrão `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias legado `canvas.a2ui.pushJSONL`)

Comandos de câmera (somente em primeiro plano; com gate de permissão):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Consulte [Camera node](/nodes/camera) para parâmetros e auxiliares de CLI.

### 8) Voz + superfície de comando Android expandida

- Voz: Android usa um único fluxo ativo/inativo de mic na aba Voz com captura de transcrição e reprodução de TTS (ElevenLabs quando configurado, fallback de TTS do sistema). Voice para quando o aplicativo sai do primeiro plano.
- Os toggles Voice Wake/Talk-Mode foram removidos atualmente da UX/tempo de execução do Android.
- Famílias de comando Android adicionais (a disponibilidade depende do dispositivo + permissões):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions`
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `motion.activity`, `motion.pedometer`
