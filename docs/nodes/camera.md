---
summary: "Captura de câmera (nodes iOS/Android + app macOS) para uso do agente: fotos (jpg) e clipes de vídeo curtos (mp4)"
read_when:
  - Adicionando ou modificando captura de câmera em nodes iOS/Android ou macOS
  - Estendendo fluxos de trabalho de arquivos temporários MEDIA acessíveis pelo agente
title: "Captura de Câmera"
---

# Captura de câmera (agente)

O OpenCraft suporta **captura de câmera** para fluxos de trabalho do agente:

- **Node iOS** (pareado via Gateway): capturar uma **foto** (`jpg`) ou **clipe de vídeo curto** (`mp4`, com áudio opcional) via `node.invoke`.
- **Node Android** (pareado via Gateway): capturar uma **foto** (`jpg`) ou **clipe de vídeo curto** (`mp4`, com áudio opcional) via `node.invoke`.
- **App macOS** (node via Gateway): capturar uma **foto** (`jpg`) ou **clipe de vídeo curto** (`mp4`, com áudio opcional) via `node.invoke`.

Todo acesso à câmera é controlado por **configurações gerenciadas pelo usuário**.

## Node iOS

### Configuração do usuário (ligado por padrão)

- Aba Configurações iOS → **Câmera** → **Permitir Câmera** (`camera.enabled`)
  - Padrão: **ligado** (chave ausente é tratada como habilitado).
  - Quando desligado: comandos `camera.*` retornam `CAMERA_DISABLED`.

### Comandos (via Gateway `node.invoke`)

- `camera.list`
  - Payload de resposta:
    - `devices`: array de `{ id, name, position, deviceType }`

- `camera.snap`
  - Parâmetros:
    - `facing`: `front|back` (padrão: `front`)
    - `maxWidth`: number (opcional; padrão `1600` no node iOS)
    - `quality`: `0..1` (opcional; padrão `0.9`)
    - `format`: atualmente `jpg`
    - `delayMs`: number (opcional; padrão `0`)
    - `deviceId`: string (opcional; de `camera.list`)
  - Payload de resposta:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Proteção de payload: fotos são recomprimidas para manter o payload base64 abaixo de 5 MB.

- `camera.clip`
  - Parâmetros:
    - `facing`: `front|back` (padrão: `front`)
    - `durationMs`: number (padrão `3000`, limitado a máximo de `60000`)
    - `includeAudio`: boolean (padrão `true`)
    - `format`: atualmente `mp4`
    - `deviceId`: string (opcional; de `camera.list`)
  - Payload de resposta:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Requisito de primeiro plano

Como `canvas.*`, o node iOS permite comandos `camera.*` apenas em **primeiro plano**. Invocações em background retornam `NODE_BACKGROUND_UNAVAILABLE`.

### Helper CLI (arquivos temporários + MEDIA)

A forma mais fácil de obter anexos é via o helper CLI, que escreve mídia decodificada em um arquivo temporário e imprime `MEDIA:<path>`.

Exemplos:

```bash
opencraft nodes camera snap --node <id>               # padrão: ambas frontal + traseira (2 linhas MEDIA)
opencraft nodes camera snap --node <id> --facing front
opencraft nodes camera clip --node <id> --duration 3000
opencraft nodes camera clip --node <id> --no-audio
```

Notas:

- `nodes camera snap` padrão são **ambas** as orientações para dar ao agente as duas visões.
- Arquivos de saída são temporários (no diretório temp do SO) a menos que você construa seu próprio wrapper.

## Node Android

### Configuração do usuário Android (ligado por padrão)

- Tela de Configurações Android → **Câmera** → **Permitir Câmera** (`camera.enabled`)
  - Padrão: **ligado** (chave ausente é tratada como habilitado).
  - Quando desligado: comandos `camera.*` retornam `CAMERA_DISABLED`.

### Permissões

- Android requer permissões de runtime:
  - `CAMERA` para tanto `camera.snap` quanto `camera.clip`.
  - `RECORD_AUDIO` para `camera.clip` quando `includeAudio=true`.

Se permissões estiverem faltando, o app solicitará quando possível; se negado, requisições `camera.*` falham com erro
`*_PERMISSION_REQUIRED`.

### Requisito de primeiro plano Android

Como `canvas.*`, o node Android permite comandos `camera.*` apenas em **primeiro plano**. Invocações em background retornam `NODE_BACKGROUND_UNAVAILABLE`.

### Comandos Android (via Gateway `node.invoke`)

- `camera.list`
  - Payload de resposta:
    - `devices`: array de `{ id, name, position, deviceType }`

### Proteção de payload

Fotos são recomprimidas para manter o payload base64 abaixo de 5 MB.

## App macOS

### Configuração do usuário (desligado por padrão)

O app companion macOS expõe uma checkbox:

- **Configurações → Geral → Permitir Câmera** (`opencraft.cameraEnabled`)
  - Padrão: **desligado**
  - Quando desligado: requisições de câmera retornam "Câmera desabilitada pelo usuário".

### Helper CLI (node invoke)

Use o CLI principal `opencraft` para invocar comandos de câmera no node macOS.

Exemplos:

```bash
opencraft nodes camera list --node <id>            # listar ids de câmera
opencraft nodes camera snap --node <id>            # imprime MEDIA:<path>
opencraft nodes camera snap --node <id> --max-width 1280
opencraft nodes camera snap --node <id> --delay-ms 2000
opencraft nodes camera snap --node <id> --device-id <id>
opencraft nodes camera clip --node <id> --duration 10s          # imprime MEDIA:<path>
opencraft nodes camera clip --node <id> --duration-ms 3000      # imprime MEDIA:<path> (flag legada)
opencraft nodes camera clip --node <id> --device-id <id>
opencraft nodes camera clip --node <id> --no-audio
```

Notas:

- `opencraft nodes camera snap` usa `maxWidth=1600` por padrão, a menos que sobrescrito.
- No macOS, `camera.snap` aguarda `delayMs` (padrão 2000ms) após aquecimento/estabilização de exposição antes de capturar.
- Payloads de foto são recomprimidos para manter base64 abaixo de 5 MB.

## Segurança + limites práticos

- Acesso à câmera e microfone acionam os prompts de permissão usuais do SO (e requerem strings de uso no Info.plist).
- Clipes de vídeo são limitados (atualmente `<= 60s`) para evitar payloads de node superdimensionados (overhead de base64 + limites de mensagem).

## Vídeo de tela macOS (nível de SO)

Para vídeo de _tela_ (não câmera), use o companion macOS:

```bash
opencraft nodes screen record --node <id> --duration 10s --fps 15   # imprime MEDIA:<path>
```

Notas:

- Requer permissão de **Gravação de Tela** do macOS (TCC).
