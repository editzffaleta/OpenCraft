# 🛠️ OpenCraft — Seu Assistente Pessoal de IA

<p align="center">
  <strong>Seu assistente pessoal de IA. Qualquer sistema. Qualquer plataforma. Do seu jeito.</strong>
</p>

<p align="center">
  <a href="https://github.com/editzffaleta/OpenCraft/actions/workflows/ci.yml?branch=main"><img src="https://img.shields.io/github/actions/workflow/status/editzffaleta/OpenCraft/ci.yml?branch=main&style=for-the-badge" alt="Status do CI"></a>
  <a href="https://github.com/editzffaleta/OpenCraft/releases"><img src="https://img.shields.io/github/v/release/editzffaleta/OpenCraft?include_prereleases&style=for-the-badge" alt="Versão"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="Licença MIT"></a>
</p>

**OpenCraft** é um _assistente pessoal de IA_ que você executa nos seus próprios dispositivos.
Ele responde nos canais que você já usa (WhatsApp, Telegram, Discord, Slack, Google Chat, Signal, iMessage, BlueBubbles, IRC, Microsoft Teams, Matrix, Feishu, LINE, Mattermost, Nextcloud Talk, Nostr, Synology Chat, Tlon, Twitch, Zalo, Zalo Personal, WebChat). Pode falar e ouvir no macOS/iOS/Android, e renderizar um Canvas ao vivo que você controla. O Gateway é apenas o plano de controle — o produto é o assistente.

Se você quer um assistente pessoal, de usuário único, que pareça local, rápido e sempre disponível — é este aqui.

[Visão](VISION.md) · [Contribuindo](CONTRIBUTING.md) · [Segurança](SECURITY.md) · [Começando](#-começando) · [Instalação](#instalação-recomendada) · [Canais](#canais) · [Por que OpenCraft?](#-por-que-opencraft)

---

## 🇧🇷 Por que OpenCraft?

O OpenCraft é uma versão 100% brasileira do projeto OpenClaw, adaptada para a comunidade de língua portuguesa. Aqui você encontra:

- **Interface em português** — painel de controle, mensagens e configurações em pt-BR por padrão.
- **WhatsApp em destaque** — o canal mais usado no Brasil é suportado de forma nativa e está no topo da lista.
- **Comunidade local** — documentação, issues e discussões em português.
- **Mesma base técnica robusta** — todos os recursos do projeto original, com identidade brasileira.
- **Privacidade real** — roda nos seus próprios dispositivos. Seus dados não saem da sua máquina.

---

## 🚀 Começando

Runtime necessário: **Node ≥ 22**.

Guia completo para iniciantes (auth, pareamento, canais): [Primeiros passos](https://docs.openclaw.ai/start/getting-started)

```bash
npm install -g opencraft@latest
# ou: pnpm add -g opencraft@latest

opencraft onboard --install-daemon
```

O wizard instala o daemon do Gateway (launchd/systemd user service) para manter o serviço rodando.

### Início rápido (TL;DR)

```bash
opencraft onboard --install-daemon

opencraft gateway --port 18789 --verbose

# Enviar uma mensagem
opencraft message send --to +5511999999999 --message "Olá do OpenCraft"

# Conversar com o assistente
opencraft agent --message "Resumo do dia" --thinking high
```

Atualizando? [Guia de atualização](https://docs.openclaw.ai/install/updating) (e execute `opencraft doctor`).

---

## Instalação recomendada

Runtime: **Node ≥ 22**.

```bash
npm install -g opencraft@latest
# ou: pnpm add -g opencraft@latest

opencraft onboard --install-daemon
```

O wizard guia você passo a passo pela configuração do gateway, workspace, canais e habilidades. Funciona no **macOS, Linux e Windows (via WSL2; fortemente recomendado)**.
Compatível com npm, pnpm ou bun.

---

## Canais

O OpenCraft suporta os principais canais de mensagem. **WhatsApp** é o canal prioritário para usuários brasileiros:

- 🟢 **[WhatsApp](https://docs.openclaw.ai/channels/whatsapp)** (Baileys) — _mais usado no Brasil_
- **[Telegram](https://docs.openclaw.ai/channels/telegram)** (grammY)
- **[Discord](https://docs.openclaw.ai/channels/discord)** (discord.js)
- **[Slack](https://docs.openclaw.ai/channels/slack)** (Bolt)
- **[Google Chat](https://docs.openclaw.ai/channels/googlechat)** (Chat API)
- **[Signal](https://docs.openclaw.ai/channels/signal)** (signal-cli)
- **[BlueBubbles](https://docs.openclaw.ai/channels/bluebubbles)** (iMessage, recomendado)
- **[iMessage](https://docs.openclaw.ai/channels/imessage)** (legado)
- **[IRC](https://docs.openclaw.ai/channels/irc)**
- **[Microsoft Teams](https://docs.openclaw.ai/channels/msteams)**
- **[Matrix](https://docs.openclaw.ai/channels/matrix)**
- **[Feishu](https://docs.openclaw.ai/channels/feishu)** · **[LINE](https://docs.openclaw.ai/channels/line)** · **[Mattermost](https://docs.openclaw.ai/channels/mattermost)**
- **[Nextcloud Talk](https://docs.openclaw.ai/channels/nextcloud-talk)** · **[Nostr](https://docs.openclaw.ai/channels/nostr)** · **[Synology Chat](https://docs.openclaw.ai/channels/synology-chat)**
- **[Tlon](https://docs.openclaw.ai/channels/tlon)** · **[Twitch](https://docs.openclaw.ai/channels/twitch)** · **[Zalo](https://docs.openclaw.ai/channels/zalo)** · **[WebChat](https://docs.openclaw.ai/web/webchat)**

---

## Destaques

- **[Gateway local](https://docs.openclaw.ai/gateway)** — plano de controle único para sessões, canais, ferramentas e eventos.
- **[Inbox multi-canal](#canais)** — todos os canais acima num único assistente.
- **[Roteamento multi-agente](https://docs.openclaw.ai/gateway/configuration)** — roteie canais/contas para agentes isolados (workspaces + sessões por agente).
- **[Voice Wake](https://docs.openclaw.ai/nodes/voicewake) + [Talk Mode](https://docs.openclaw.ai/nodes/talk)** — palavras de ativação no macOS/iOS e voz contínua no Android.
- **[Canvas ao vivo](https://docs.openclaw.ai/platforms/mac/canvas)** — workspace visual controlado pelo agente com [A2UI](https://docs.openclaw.ai/platforms/mac/canvas#canvas-a2ui).
- **[Ferramentas nativas](https://docs.openclaw.ai/tools)** — browser, canvas, nodes, cron, sessões e ações Discord/Slack.
- **[Apps companheiros](https://docs.openclaw.ai/platforms/macos)** — app de barra de menu macOS + nodes [iOS/Android](https://docs.openclaw.ai/nodes).
- **[Onboarding](https://docs.openclaw.ai/start/wizard) + [habilidades](https://docs.openclaw.ai/tools/skills)** — setup guiado por wizard com habilidades bundled/gerenciadas/workspace.

---

## Canais de desenvolvimento

- **stable**: releases com tag (`vAAAA.M.D`), npm dist-tag `latest`.
- **beta**: pré-releases (`vAAAA.M.D-beta.N`), npm dist-tag `beta` (app macOS pode estar ausente).
- **dev**: head do `main`, npm dist-tag `dev` (quando publicado).

Trocar de canal: `opencraft update --channel stable|beta|dev`.

---

## A partir do código-fonte (desenvolvimento)

Prefira `pnpm` para builds a partir do código. Bun é opcional para executar TypeScript diretamente.

```bash
git clone https://github.com/editzffaleta/OpenCraft.git
cd OpenCraft

pnpm install
pnpm ui:build  # instala deps da UI na primeira execução
pnpm build

pnpm opencraft onboard --install-daemon

# Loop de desenvolvimento (auto-reload em mudanças TypeScript)
pnpm gateway:watch
```

`pnpm opencraft ...` executa TypeScript diretamente (via `tsx`). `pnpm build` gera `dist/` para execução via Node / binário `opencraft`.

---

## Segurança padrão (acesso por DM)

O OpenCraft se conecta a superfícies de mensagem reais. Trate DMs recebidos como **entrada não confiável**.

Guia completo de segurança: [Segurança](https://docs.openclaw.ai/gateway/security)

Comportamento padrão no Telegram/WhatsApp/Signal/iMessage/Microsoft Teams/Discord/Google Chat/Slack:

- **Pareamento por DM** (`dmPolicy="pairing"`): remetentes desconhecidos recebem um código de pareamento curto e o bot não processa a mensagem.
- Aprovar com: `opencraft pairing approve <canal> <código>` (o remetente é adicionado a uma allowlist local).
- DMs públicos requerem opt-in explícito: defina `dmPolicy="open"` e inclua `"*"` na allowlist do canal (`allowFrom`).

Execute `opencraft doctor` para identificar políticas de DM arriscadas ou mal configuradas.

---

## Como funciona (resumo)

```
WhatsApp / Telegram / Discord / Slack / Google Chat / Signal / iMessage / BlueBubbles / IRC / Microsoft Teams / ...
               │
               ▼
┌───────────────────────────────┐
│            Gateway            │
│       (plano de controle)     │
│     ws://127.0.0.1:18789      │
└──────────────┬────────────────┘
               │
               ├─ Agente Pi (RPC)
               ├─ CLI (opencraft …)
               ├─ WebChat UI
               ├─ App macOS
               └─ Nodes iOS / Android
```

---

## Principais subsistemas

- **[Rede WebSocket do Gateway](https://docs.openclaw.ai/concepts/architecture)** — plano de controle WS único para clientes, ferramentas e eventos.
- **[Exposição via Tailscale](https://docs.openclaw.ai/gateway/tailscale)** — Serve/Funnel para o dashboard do Gateway + WS.
- **[Controle de browser](https://docs.openclaw.ai/tools/browser)** — Chrome/Chromium gerenciado pelo OpenCraft com controle CDP.
- **[Canvas + A2UI](https://docs.openclaw.ai/platforms/mac/canvas)** — workspace visual controlado pelo agente.
- **[Voice Wake](https://docs.openclaw.ai/nodes/voicewake) + [Talk Mode](https://docs.openclaw.ai/nodes/talk)** — palavras de ativação no macOS/iOS + voz contínua no Android.
- **[Nodes](https://docs.openclaw.ai/nodes)** — Canvas, câmera, gravação de tela, `location.get`, notificações.

---

## Acesso via Tailscale (dashboard do Gateway)

O OpenCraft pode configurar automaticamente o Tailscale **Serve** (apenas tailnet) ou **Funnel** (público) enquanto o Gateway fica vinculado ao loopback. Configure `gateway.tailscale.mode`:

- `off`: sem automação Tailscale (padrão).
- `serve`: HTTPS apenas na tailnet via `tailscale serve`.
- `funnel`: HTTPS público via `tailscale funnel` (requer autenticação por senha).

---

## Gateway remoto (Linux funciona muito bem)

É perfeitamente possível executar o Gateway numa instância Linux pequena. Clientes (app macOS, CLI, WebChat) podem se conectar via **Tailscale Serve/Funnel** ou **túneis SSH**, e você ainda pode parear nodes de dispositivo (macOS/iOS/Android) para executar ações locais quando necessário.

- **Host do Gateway** executa a ferramenta exec e as conexões de canal por padrão.
- **Nodes de dispositivo** executam ações locais (`system.run`, câmera, gravação de tela, notificações) via `node.invoke`.

---

## Tudo que foi construído até agora

### Plataforma central

- [Plano de controle WS do Gateway](https://docs.openclaw.ai/gateway) com sessões, presença, config, cron, webhooks, [Control UI](https://docs.openclaw.ai/web) e [Canvas host](https://docs.openclaw.ai/platforms/mac/canvas#canvas-a2ui).
- [Superfície CLI](https://docs.openclaw.ai/tools/agent-send): gateway, agent, send, [wizard](https://docs.openclaw.ai/start/wizard) e [doctor](https://docs.openclaw.ai/gateway/doctor).
- [Runtime do agente Pi](https://docs.openclaw.ai/concepts/agent) em modo RPC com streaming de ferramentas e blocos.
- [Modelo de sessão](https://docs.openclaw.ai/concepts/session): `main` para chats diretos, isolamento de grupos, modos de ativação, modos de fila, reply-back.
- [Pipeline de mídia](https://docs.openclaw.ai/nodes/images): imagens/áudio/vídeo, hooks de transcrição, limites de tamanho, ciclo de vida de arquivos temporários.

### Apps + nodes

- [App macOS](https://docs.openclaw.ai/platforms/macos): barra de menu, [Voice Wake](https://docs.openclaw.ai/nodes/voicewake)/PTT, overlay [Talk Mode](https://docs.openclaw.ai/nodes/talk), [WebChat](https://docs.openclaw.ai/web/webchat), ferramentas de debug, controle de [gateway remoto](https://docs.openclaw.ai/gateway/remote).
- [Node iOS](https://docs.openclaw.ai/platforms/ios): [Canvas](https://docs.openclaw.ai/platforms/mac/canvas), [Voice Wake](https://docs.openclaw.ai/nodes/voicewake), [Talk Mode](https://docs.openclaw.ai/nodes/talk), câmera, gravação de tela, Bonjour + pareamento de dispositivos.
- [Node Android](https://docs.openclaw.ai/platforms/android): aba de conexão, sessões de chat, aba de voz, [Canvas](https://docs.openclaw.ai/platforms/mac/canvas), câmera/gravação de tela e comandos Android (notificações/localização/SMS/fotos/contatos/calendário/movimento/atualização de apps).

### Ferramentas + automação

- [Controle de browser](https://docs.openclaw.ai/tools/browser): Chrome/Chromium dedicado, snapshots, ações, uploads, perfis.
- [Canvas](https://docs.openclaw.ai/platforms/mac/canvas): push/reset [A2UI](https://docs.openclaw.ai/platforms/mac/canvas#canvas-a2ui), eval, snapshot.
- [Nodes](https://docs.openclaw.ai/nodes): snap/clip de câmera, gravação de tela, [location.get](https://docs.openclaw.ai/nodes/location-command), notificações.
- [Cron + wakeups](https://docs.openclaw.ai/automation/cron-jobs); [webhooks](https://docs.openclaw.ai/automation/webhook); [Gmail Pub/Sub](https://docs.openclaw.ai/automation/gmail-pubsub).
- [Plataforma de habilidades](https://docs.openclaw.ai/tools/skills): habilidades bundled, gerenciadas e de workspace com gating de instalação + UI.

### Runtime + segurança

- [Roteamento de canais](https://docs.openclaw.ai/channels/channel-routing), [política de retry](https://docs.openclaw.ai/concepts/retry) e [streaming/chunking](https://docs.openclaw.ai/concepts/streaming).
- [Presença](https://docs.openclaw.ai/concepts/presence), [indicadores de digitação](https://docs.openclaw.ai/concepts/typing-indicators) e [rastreamento de uso](https://docs.openclaw.ai/concepts/usage-tracking).
- [Modelos](https://docs.openclaw.ai/concepts/models), [failover de modelo](https://docs.openclaw.ai/concepts/model-failover) e [pruning de sessão](https://docs.openclaw.ai/concepts/session-pruning).
- [Segurança](https://docs.openclaw.ai/gateway/security) e [solução de problemas](https://docs.openclaw.ai/channels/troubleshooting).

### Ops + empacotamento

- [Control UI](https://docs.openclaw.ai/web) + [WebChat](https://docs.openclaw.ai/web/webchat) servidos diretamente pelo Gateway.
- [Tailscale Serve/Funnel](https://docs.openclaw.ai/gateway/tailscale) ou [túneis SSH](https://docs.openclaw.ai/gateway/remote) com autenticação por token/senha.
- [Modo Nix](https://docs.openclaw.ai/install/nix) para config declarativa; installs baseados em [Docker](https://docs.openclaw.ai/install/docker).
- Migrações via [Doctor](https://docs.openclaw.ai/gateway/doctor), [logging](https://docs.openclaw.ai/logging).

---

## Modelos (seleção + autenticação)

- Configuração de modelos + CLI: [Modelos](https://docs.openclaw.ai/concepts/models)
- Rotação de perfil de auth (OAuth vs chaves de API) + fallbacks: [Failover de modelo](https://docs.openclaw.ai/concepts/model-failover)

Nota: embora muitos provedores/modelos sejam suportados, para a melhor experiência e menor risco de prompt-injection, use o modelo de última geração mais forte disponível para você.

---

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para saber como contribuir.

## Segurança

Veja [SECURITY.md](SECURITY.md) para reportar vulnerabilidades e entender o modelo de confiança.

## Licença

[MIT](LICENSE)
