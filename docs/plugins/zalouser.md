---
summary: "Plugin Zalo Personal: login por QR + mensagens via zca-js nativo (instalação de plugin + config de canal + tool)"
read_when:
  - Você quer suporte ao Zalo Personal (não oficial) no OpenCraft
  - Você está configurando ou desenvolvendo o plugin zalouser
title: "Plugin Zalo Personal"
---

# Zalo Personal (plugin)

Suporte ao Zalo Personal para o OpenCraft via plugin, usando `zca-js` nativo para automatizar uma conta de usuário Zalo normal.

> **Aviso:** A automação não oficial pode levar à suspensão/banimento da conta. Use por sua conta e risco.

## Nomenclatura

O id de canal é `zalouser` para deixar explícito que isso automatiza uma **conta de usuário Zalo pessoal** (não oficial). Mantemos `zalo` reservado para uma possível futura integração com a API oficial do Zalo.

## Onde roda

Este plugin roda **dentro do processo do Gateway**.

Se você usa um Gateway remoto, instale/configure-o na **máquina rodando o Gateway**, depois reinicie o Gateway.

Nenhum binário CLI `zca`/`openzca` externo é necessário.

## Instalar

### Opção A: instalar do npm

```bash
opencraft plugins install @openclaw/zalouser
```

Reinicie o Gateway depois.

### Opção B: instalar de uma pasta local (dev)

```bash
opencraft plugins install ./extensions/zalouser
cd ./extensions/zalouser && pnpm install
```

Reinicie o Gateway depois.

## Config

A config de canal fica em `channels.zalouser` (não em `plugins.entries.*`):

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
opencraft channels login --channel zalouser
opencraft channels logout --channel zalouser
opencraft channels status --probe
opencraft message send --channel zalouser --target <threadId> --message "Olá do OpenCraft"
opencraft directory peers list --channel zalouser --query "nome"
```

## Tool do agente

Nome da tool: `zalouser`

Ações: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Ações de mensagem de canal também suportam `react` para reações a mensagens.
