---
summary: "Visão geral do suporte a plataformas (Gateway + aplicativos complementares)"
read_when:
  - Procurando por suporte a sistema operacional ou caminhos de instalação
  - Decidindo onde executar o Gateway
title: "Plataformas"
---

# Plataformas

O núcleo do OpenCraft é escrito em TypeScript. **Node é o tempo de execução recomendado**.
Bun não é recomendado para o Gateway (bugs do WhatsApp/Telegram).

Existem aplicativos complementares para macOS (aplicativo da barra de menus) e nós móveis (iOS/Android). Aplicativos complementares para Windows e Linux estão planejados, mas o Gateway é totalmente suportado hoje.
Aplicativos nativos complementares para Windows também estão planejados; o Gateway é recomendado via WSL2.

## Escolha seu SO

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- Android: [Android](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS e hospedagem

- Hub VPS: [Hospedagem VPS](/vps)
- Fly.io: [Fly.io](/install/fly)
- Hetzner (Docker): [Hetzner](/install/hetzner)
- GCP (Compute Engine): [GCP](/install/gcp)
- exe.dev (VM + proxy HTTPS): [exe.dev](/install/exe-dev)

## Links comuns

- Guia de instalação: [Guia de Introdução](/start/getting-started)
- Runbook do Gateway: [Gateway](/gateway)
- Configuração do Gateway: [Configuração](/gateway/configuration)
- Status do serviço: `opencraft gateway status`

## Instalação do serviço Gateway (CLI)

Use um destes (todos suportados):

- Assistente (recomendado): `opencraft onboard --install-daemon`
- Direto: `opencraft gateway install`
- Fluxo de configuração: `opencraft configure` → selecione **Gateway service**
- Reparo/migração: `opencraft doctor` (oferece instalar ou corrigir o serviço)

O destino do serviço depende do sistema operacional:

- macOS: LaunchAgent (`ai.opencraft.gateway` ou `ai.opencraft.<profile>`; `com.opencraft.*` legado)
- Linux/WSL2: serviço do usuário systemd (`opencraft-gateway[-<profile>].service`)
