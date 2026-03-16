---
summary: "Runtime do Gateway no macOS (serviço launchd externo)"
read_when:
  - Empacotando o OpenCraft.app
  - Depurando o serviço launchd do gateway no macOS
  - Instalando o CLI do gateway para macOS
title: "Gateway no macOS"
---

# Gateway no macOS (launchd externo)

O OpenCraft.app não mais inclui Node/Bun ou o runtime do Gateway. O app macOS
espera uma instalação **externa** do CLI `opencraft`, não inicializa o Gateway como
processo filho, e gerencia um serviço launchd por usuário para manter o Gateway
em execução (ou se conecta a um Gateway local existente se já estiver rodando).

## Instalar o CLI (necessário para o modo local)

Node 24 é o runtime padrão no Mac. Node 22 LTS, atualmente `22.16+`, ainda funciona para compatibilidade. Em seguida, instale o `opencraft` globalmente:

```bash
npm install -g opencraft@<versão>
```

O botão **Install CLI** do app macOS executa o mesmo fluxo via npm/pnpm (bun não é recomendado para o runtime do Gateway).

## Launchd (Gateway como LaunchAgent)

Label:

- `ai.openclaw.gateway` (ou `ai.openclaw.<profile>`; `com.openclaw.*` legado pode permanecer)

Localização do plist (por usuário):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (ou `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gerenciador:

- O app macOS é responsável pela instalação/atualização do LaunchAgent no modo Local.
- O CLI também pode instalá-lo: `opencraft gateway install`.

Comportamento:

- "OpenCraft Ativo" habilita/desabilita o LaunchAgent.
- Fechar o app **não** para o gateway (launchd o mantém ativo).
- Se um Gateway já estiver rodando na porta configurada, o app se conecta a
  ele em vez de iniciar um novo.

Logging:

- stdout/err do launchd: `/tmp/openclaw/openclaw-gateway.log`

## Compatibilidade de versões

O app macOS verifica a versão do gateway em relação à sua própria versão. Se forem
incompatíveis, atualize o CLI global para corresponder à versão do app.

## Smoke check

```bash
opencraft --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
opencraft gateway --port 18999 --bind loopback
```

Depois:

```bash
opencraft gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```
