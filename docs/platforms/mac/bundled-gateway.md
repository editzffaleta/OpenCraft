---
summary: "Tempo de execução do Gateway no macOS (serviço launchd externo)"
read_when:
  - Empacotando o OpenCraft.app
  - Depurando o serviço launchd do Gateway no macOS
  - Instalando a CLI do Gateway para macOS
title: "Gateway no macOS"
---

# Gateway no macOS (launchd externo)

O OpenCraft.app não inclui mais Node/Bun ou o tempo de execução do Gateway. O aplicativo macOS
espera uma instalação **externa** da CLI `opencraft`, não gera o Gateway como um
processo filho, e gerencia um serviço launchd por usuário para manter o Gateway
em execução (ou se conecta a um Gateway local existente se um já estiver em execução).

## Instale a CLI (obrigatório para modo local)

Node 24 é o tempo de execução padrão no Mac. Node 22 LTS, atualmente `22.16+`, ainda funciona para compatibilidade. Depois instale `opencraft` globalmente:

```bash
npm install -g opencraft@<versão>
```

O botão **Install CLI** do aplicativo macOS executa o mesmo fluxo via npm/pnpm (bun não é recomendado para o tempo de execução do Gateway).

## Launchd (Gateway como LaunchAgent)

Rótulo:

- `ai.opencraft.gateway` (ou `ai.opencraft.<profile>`; o legado `com.opencraft.*` pode permanecer)

Localização do plist (por usuário):

- `~/Library/LaunchAgents/ai.opencraft.gateway.plist`
  (ou `~/Library/LaunchAgents/ai.opencraft.<profile>.plist`)

Gerenciador:

- O aplicativo macOS possui a instalação/atualização do LaunchAgent no modo Local.
- A CLI também pode instalá-lo: `opencraft gateway install`.

Comportamento:

- "OpenCraft Active" ativa/desativa o LaunchAgent.
- Fechar o aplicativo **não** para o Gateway (o launchd o mantém ativo).
- Se um Gateway já estiver em execução na porta configurada, o aplicativo se conecta a
  ele em vez de iniciar um novo.

Logging:

- stdout/err do launchd: `/tmp/editzffaleta/OpenCraft-gateway.log`

## Compatibilidade de versão

O aplicativo macOS verifica a versão do Gateway contra sua própria versão. Se forem
incompatíveis, atualize a CLI global para corresponder à versão do aplicativo.

## Verificação rápida

```bash
opencraft --version

OPENCRAFT_SKIP_CHANNELS=1 \
OPENCRAFT_SKIP_CANVAS_HOST=1 \
opencraft gateway --port 18999 --bind loopback
```

Depois:

```bash
opencraft gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```
