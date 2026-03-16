---
summary: "Visão geral de suporte a plataformas (Gateway + apps companion)"
read_when:
  - Procurando suporte de OS ou caminhos de instalação
  - Decidindo onde rodar o Gateway
title: "Plataformas"
---

# Plataformas

O core do OpenCraft é escrito em TypeScript. **Node é o runtime recomendado**.
Bun não é recomendado para o Gateway (bugs no WhatsApp/Telegram).

Apps companion existem para macOS (app da barra de menu) e nós mobile (iOS/Android). Apps companion
para Windows e Linux estão planejados, mas o Gateway é totalmente suportado hoje.
Apps companion nativos para Windows também estão planejados; o Gateway é recomendado via WSL2.

## Escolha seu OS

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

- Guia de instalação: [Primeiros Passos](/start/getting-started)
- Runbook do Gateway: [Gateway](/gateway)
- Configuração do Gateway: [Configuração](/gateway/configuration)
- Status do serviço: `opencraft gateway status`

## Instalação do serviço Gateway (CLI)

Use um destes (todos suportados):

- Wizard (recomendado): `opencraft onboard --install-daemon`
- Direto: `opencraft gateway install`
- Fluxo de configuração: `opencraft configure` → selecionar **Gateway service**
- Reparar/migrar: `opencraft doctor` (oferece instalar ou corrigir o serviço)

O alvo do serviço depende do OS:

- macOS: LaunchAgent (`ai.openclaw.gateway` ou `ai.openclaw.<profile>`; legado `com.openclaw.*`)
- Linux/WSL2: serviço de usuário systemd (`openclaw-gateway[-<profile>].service`)
