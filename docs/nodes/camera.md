---
summary: "Captura de câmera (nodes iOS/Android + app macOS) para uso do agente: fotos (jpg) e clipes de vídeo curtos (mp4)"
read_when:
  - Adicionando ou modificando captura de câmera em nodes iOS/Android ou macOS
  - Estendendo workflows de arquivo temporário MEDIA acessíveis pelo agente
title: "Captura de Câmera"
---

# Captura de câmera (agente)

O OpenCraft suporta **captura de câmera** para workflows de agente:

- **Node iOS** (emparelhado via Gateway): capture uma **foto** (`jpg`) ou **clipe de vídeo curto** (`mp4`, com áudio opcional) via `node.invoke`.
- **Node Android** (emparelhado via Gateway): capture uma **foto** (`jpg`) ou **clipe de vídeo curto** (`mp4`, com áudio opcional) via `node.invoke`.
- **App macOS** (node via Gateway): capture uma **foto** (`jpg`) ou **clipe de vídeo curto** (`mp4`, com áudio opcional) via `node.invoke`.

Todo acesso à câmera é controlado por **configurações controladas pelo usuário**.

## Node iOS

### Configuração do usuário (padrão ativado)

- Aba de Configurações iOS → **Câmera** → **Permitir Câmera** (`camera.enabled`)
  - Padrão: **ativado** (chave ausente é tratada como habilitada).
  - Quando desativado: comandos `camera.*` retornam `CAMERA_DISABLED`.

### Comandos (via `node.invoke` do Gateway)

- `camera.list`
  - Payload de resposta:
    - `devices`: array de `{ id, name, position, deviceType }`

- `camera.snap`
  - Params:
    - `facing`: `front|back` (padrão: `front`)
    - `maxWidth`: número (opcional; padrão `1600` no node iOS)
    - `quality`: `0..1` (opcional; padrão `0.9`)
    - `format`: atualmente `jpg`
    - `delayMs`: número (opcional; padrão `0`)
    - `deviceId`: string (opcional; de `camera.list`)
  - Payload de resposta:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Guarda de payload: fotos são recomprimidas para manter o payload base64 abaixo de 5 MB.

- `camera.clip`
  - Params:
    - `facing`: `front|back` (padrão: `front`)
    - `durationMs`: número (padrão `3000`, limitado a máx de `60000`)
    - `includeAudio`: boolean (padrão `true`)
    - `format`: atualmente `mp4`
    - `deviceId`: string (opcional; de `camera.list`)
  - Payload de resposta:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Requisito de foreground

Assim como `canvas.*`, o node iOS permite comandos `camera.*` apenas em **foreground**. Invocações em background retornam `NODE_BACKGROUND_UNAVAILABLE`.

### Helper CLI (arquivos temp + MEDIA)

A forma mais fácil de obter anexos é via helper CLI, que escreve a mídia decodificada em um arquivo temp e imprime `MEDIA:<path>`.

Exemplos:

```bash
opencraft nodes camera snap --node <id>               # padrão: front + back (2 linhas MEDIA)
opencraft nodes camera snap --node <id> --facing front
opencraft nodes camera clip --node <id> --duration 3000
opencraft nodes camera clip --node <id> --no-audio
```

Notas:

- `nodes camera snap` padrão é **ambas** as posições para dar ao agente as duas visões.
- Arquivos de saída são temporários (no diretório temp do SO) a menos que você crie seu próprio wrapper.

## Node Android

### Configuração do usuário Android (padrão ativado)

- Painel de Configurações Android → **Câmera** → **Permitir Câmera** (`camera.enabled`)
  - Padrão: **ativado** (chave ausente é tratada como habilitada).
  - Quando desativado: comandos `camera.*` retornam `CAMERA_DISABLED`.

### Permissões

- Android requer permissões em runtime:
  - `CAMERA` para ambos `camera.snap` e `camera.clip`.
  - `RECORD_AUDIO` para `camera.clip` quando `includeAudio=true`.

Se as permissões estiverem faltando, o app solicitará quando possível; se negadas, requisições `camera.*` falham com
erro `*_PERMISSION_REQUIRED`.

### Requisito de foreground Android

Assim como `canvas.*`, o node Android permite comandos `camera.*` apenas em **foreground**. Invocações em background retornam `NODE_BACKGROUND_UNAVAILABLE`.

### Comandos Android (via `node.invoke` do Gateway)

- `camera.list`
  - Payload de resposta:
    - `devices`: array de `{ id, name, position, deviceType }`

### Guarda de payload

Fotos são recomprimidas para manter o payload base64 abaixo de 5 MB.

## App macOS

### Configuração do usuário (padrão desativado)

O app companheiro macOS expõe uma caixa de seleção:

- **Configurações → Geral → Permitir Câmera** (`openclaw.cameraEnabled`)
  - Padrão: **desativado**
  - Quando desativado: requisições de câmera retornam "Câmera desativada pelo usuário".

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

- `opencraft nodes camera snap` padrão é `maxWidth=1600` a menos que sobrescrito.
- No macOS, `camera.snap` aguarda `delayMs` (padrão 2000ms) após aquecimento/estabilização de exposição antes de capturar.
- Payloads de foto são recomprimidos para manter base64 abaixo de 5 MB.

## Segurança + limites práticos

- Acesso à câmera e microfone dispara os prompts de permissão usuais do SO (e requer strings de uso em Info.plist).
- Clipes de vídeo são limitados (atualmente `<= 60s`) para evitar payloads de node muito grandes (overhead base64 + limites de mensagem).

## Vídeo de tela macOS (nível do SO)

Para vídeo de _tela_ (não câmera), use o companheiro macOS:

```bash
opencraft nodes screen record --node <id> --duration 10s --fps 15   # imprime MEDIA:<path>
```

Notas:

- Requer permissão de **Gravação de Tela** macOS (TCC).
