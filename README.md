# 🦞 OpenCraft — Assistente de IA Pessoal

<p align="center">
    <picture>
        <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/editzffaleta/OpenCraft/main/docs/assets/opencraft-logo-text-dark.svg">
        <img src="https://raw.githubusercontent.com/editzffaleta/OpenCraft/main/docs/assets/opencraft-logo-text.svg" alt="OpenCraft" width="500">
    </picture>
</p>

<p align="center">
  <strong>EXFOLIATE! EXFOLIATE!</strong>
</p>

<p align="center">
  <a href="https://github.com/editzffaleta/OpenCraft/actions/workflows/ci.yml?branch=main"><img src="https://img.shields.io/github/actions/workflow/status/editzffaleta/OpenCraft/ci.yml?branch=main&style=for-the-badge" alt="CI status"></a>
  <a href="https://github.com/editzffaleta/OpenCraft/releases"><img src="https://img.shields.io/github/v/release/editzffaleta/OpenCraft?include_prereleases&style=for-the-badge" alt="GitHub release"></a>
  <a href="https://discord.gg/clawd"><img src="https://img.shields.io/discord/1456350064065904867?label=Discord&logo=discord&logoColor=white&color=5865F2&style=for-the-badge" alt="Discord"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

**OpenCraft** é um _assistente de IA pessoal_ que você executa em seus próprios dispositivos.
Ele responde você nos canais que você já usa (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, BlueBubbles, IRC, Microsoft Teams, Matrix, Feishu, LINE, Mattermost, Nextcloud Talk, Nostr, Synology Chat, Tlon, Twitch, Zalo, Zalo Personal, WebChat). Ele pode falar e ouvir em macOS/iOS/Android, e pode renderizar um Canvas ao vivo que você controla. O Gateway é apenas o plano de controle — o produto é o assistente.

Se você quer um assistente pessoal de usuário único que se sinta local, rápido e sempre disponível, este é.

[Website](https://opencraft.ai) · [Docs](https://docs.opencraft.ai) · [Visão](VISION.md) · [DeepWiki](https://deepwiki.com/editzffaleta/OpenCraft) · [Getting Started](https://docs.opencraft.ai/start/getting-started) · [Updating](https://docs.opencraft.ai/install/updating) · [Showcase](https://docs.opencraft.ai/start/showcase) · [FAQ](https://docs.opencraft.ai/help/faq) · [Onboarding](https://docs.opencraft.ai/start/wizard) · [Nix](https://github.com/opencraft/nix-opencraft) · [Docker](https://docs.opencraft.ai/install/docker) · [Discord](https://discord.gg/clawd)

Configuração preferida: execute `opencraft onboard` no seu terminal.
OpenCraft Onboard o guia passo a passo pela configuração do Gateway, workspace, canais e skills. É o caminho de setup CLI recomendado e funciona em **macOS, Linux e Windows (via WSL2; fortemente recomendado)**.
Funciona com npm, pnpm ou bun.
Novo usuário? Comece aqui: [Getting started](https://docs.opencraft.ai/start/getting-started)

## Patrocinadores

| OpenAI                                                            | Vercel                                                            | Blacksmith                                                                   | Convex                                                                |
| ----------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [![OpenAI](docs/assets/sponsors/openai.svg)](https://openai.com/) | [![Vercel](docs/assets/sponsors/vercel.svg)](https://vercel.com/) | [![Blacksmith](docs/assets/sponsors/blacksmith.svg)](https://blacksmith.sh/) | [![Convex](docs/assets/sponsors/convex.svg)](https://www.convex.dev/) |

**Assinaturas (OAuth):**

- **[OpenAI](https://openai.com/)** (ChatGPT/Codex)

Nota do modelo: embora muitos provedores/modelos sejam suportados, para a melhor experiência e menor risco de injeção de prompt, use o modelo mais forte da geração mais recente disponível para você. Veja [Onboarding](https://docs.opencraft.ai/start/onboarding).

## Modelos (seleção + autenticação)

- Configuração de modelos + CLI: [Models](https://docs.opencraft.ai/concepts/models)
- Rotação de perfil de autenticação (OAuth vs chaves de API) + fallbacks: [Model failover](https://docs.opencraft.ai/concepts/model-failover)

## Instalar (recomendado)

Runtime: **Node ≥22**.

```bash
npm install -g opencraft@latest
# ou: pnpm add -g opencraft@latest

opencraft onboard --install-daemon
```

OpenCraft Onboard instala o daemon do Gateway (launchd/systemd user service) para que ele continue executando.

## Quick start (TL;DR)

Runtime: **Node ≥22**.

Guia completo para iniciantes (autenticação, emparelhamento, canais): [Getting started](https://docs.opencraft.ai/start/getting-started)

```bash
opencraft onboard --install-daemon

opencraft gateway --port 18789 --verbose

# Enviar uma mensagem
opencraft message send --to +1234567890 --message "Hello from OpenCraft"

# Conversar com o assistente (opcionalmente entregar de volta para qualquer canal conectado: WhatsApp/Telegram/Slack/Discord/Google Chat/Signal/iMessage/BlueBubbles/IRC/Microsoft Teams/Matrix/Feishu/LINE/Mattermost/Nextcloud Talk/Nostr/Synology Chat/Tlon/Twitch/Zalo/Zalo Personal/WebChat)
opencraft agent --message "Ship checklist" --thinking high
```

Atualizando? [Updating guide](https://docs.opencraft.ai/install/updating) (e execute `opencraft doctor`).

## Canais de desenvolvimento

- **stable**: lançamentos marcados (`vYYYY.M.D` ou `vYYYY.M.D-<patch>`), npm dist-tag `latest`.
- **beta**: tags de pré-lançamento (`vYYYY.M.D-beta.N`), npm dist-tag `beta` (app macOS pode estar faltando).
- **dev**: moving head de `main`, npm dist-tag `dev` (quando publicado).

Alternar canais (git + npm): `opencraft update --channel stable|beta|dev`.
Detalhes: [Development channels](https://docs.opencraft.ai/install/development-channels).

## Do código-fonte (desenvolvimento)

Prefira `pnpm` para builds do código-fonte. Bun é opcional para executar TypeScript diretamente.

```bash
git clone https://github.com/editzffaleta/OpenCraft.git
cd opencraft

pnpm install
pnpm ui:build # auto-installs UI deps on first run
pnpm build

pnpm opencraft onboard --install-daemon

# Dev loop (auto-reload on source/config changes)
pnpm gateway:watch
```

Nota: `pnpm opencraft ...` executa TypeScript diretamente (via `tsx`). `pnpm build` produz `dist/` para executar via Node / o binário empacotado `opencraft`.

## Padrões de segurança (acesso a DM)

OpenCraft se conecta a superfícies de mensagens reais. Trate DMs de entrada como **entrada não confiável**.

Guia completo de segurança: [Security](https://docs.opencraft.ai/gateway/security)

Comportamento padrão em Telegram/WhatsApp/Signal/iMessage/Microsoft Teams/Discord/Google Chat/Slack:

- **Emparelhamento de DM** (`dmPolicy="pairing"` / `channels.discord.dmPolicy="pairing"` / `channels.slack.dmPolicy="pairing"`; legado: `channels.discord.dm.policy`, `channels.slack.dm.policy`): remetentes desconhecidos recebem um código de emparelhamento curto e o bot não processa sua mensagem.
- Aprovar com: `opencraft pairing approve <channel> <code>` (então o remetente é adicionado ao armazenamento de lista de permissões local).
- DMs inbound públicas requerem uma aprovação explícita: defina `dmPolicy="open"` e inclua `"*"` na lista de permissões do canal (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; legado: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`).

Execute `opencraft doctor` para identificar políticas de DM arriscadas/malconfiguradas.

## Destaques

- **[Local-first Gateway](https://docs.opencraft.ai/gateway)** — plano de controle único para sessões, canais, ferramentas e eventos.
- **[Caixa de entrada multi-canal](https://docs.opencraft.ai/channels)** — WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, BlueBubbles (iMessage), iMessage (legado), IRC, Microsoft Teams, Matrix, Feishu, LINE, Mattermost, Nextcloud Talk, Nostr, Synology Chat, Tlon, Twitch, Zalo, Zalo Personal, WebChat, macOS, iOS/Android.
- **[Roteamento multi-agent](https://docs.opencraft.ai/gateway/configuration)** — rotear canais de entrada/contas/pares para agentes isolados (workspaces + sessões por agente).
- **[Voice Wake](https://docs.opencraft.ai/nodes/voicewake) + [Talk Mode](https://docs.opencraft.ai/nodes/talk)** — palavras-chave de despertar em macOS/iOS e voz contínua em Android (ElevenLabs + fallback de TTS do sistema).
- **[Canvas ao vivo](https://docs.opencraft.ai/platforms/mac/canvas)** — espaço de trabalho visual orientado por agente com [A2UI](https://docs.opencraft.ai/platforms/mac/canvas#canvas-a2ui).
- **[Ferramentas de primeira classe](https://docs.opencraft.ai/tools)** — browser, canvas, nodes, cron, sessões e ações Discord/Slack.
- **[Apps complementares](https://docs.opencraft.ai/platforms/macos)** — app macOS menu bar + [nodes](https://docs.opencraft.ai/nodes) iOS/Android.
- **[Onboarding](https://docs.opencraft.ai/start/wizard) + [skills](https://docs.opencraft.ai/tools/skills)** — setup orientado por onboarding com skills agrupadas/gerenciadas/workspace.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=editzffaleta/OpenCraft&type=date&legend=top-left)](https://www.star-history.com/#editzffaleta/OpenCraft&type=date&legend=top-left)

## Tudo que construímos até agora

### Plataforma principal

- [Gateway WS control plane](https://docs.opencraft.ai/gateway) com sessões, presença, configuração, cron, webhooks, [Control UI](https://docs.opencraft.ai/web), e [Canvas host](https://docs.opencraft.ai/platforms/mac/canvas#canvas-a2ui).
- [Superfície CLI](https://docs.opencraft.ai/tools/agent-send): gateway, agent, send, [onboarding](https://docs.opencraft.ai/start/wizard), e [doctor](https://docs.opencraft.ai/gateway/doctor).
- [Runtime do agent Pi](https://docs.opencraft.ai/concepts/agent) em modo RPC com tool streaming e block streaming.
- [Session model](https://docs.opencraft.ai/concepts/session): `main` para chats diretos, isolamento de grupo, modos de ativação, modos de fila, reply-back. Regras de grupo: [Groups](https://docs.opencraft.ai/channels/groups).
- [Pipeline de mídia](https://docs.opencraft.ai/nodes/images): imagens/áudio/vídeo, hooks de transcrição, limites de tamanho, ciclo de vida de arquivo temporário. Detalhes de áudio: [Audio](https://docs.opencraft.ai/nodes/audio).

### Canais

- [Canais](https://docs.opencraft.ai/channels): [WhatsApp](https://docs.opencraft.ai/channels/whatsapp) (Baileys), [Telegram](https://docs.opencraft.ai/channels/telegram) (grammY), [Slack](https://docs.opencraft.ai/channels/slack) (Bolt), [Discord](https://docs.opencraft.ai/channels/discord) (discord.js), [Google Chat](https://docs.opencraft.ai/channels/googlechat) (Chat API), [Signal](https://docs.opencraft.ai/channels/signal) (signal-cli), [BlueBubbles](https://docs.opencraft.ai/channels/bluebubbles) (iMessage, recomendado), [iMessage](https://docs.opencraft.ai/channels/imessage) (legado imsg), [IRC](https://docs.opencraft.ai/channels/irc), [Microsoft Teams](https://docs.opencraft.ai/channels/msteams), [Matrix](https://docs.opencraft.ai/channels/matrix), [Feishu](https://docs.opencraft.ai/channels/feishu), [LINE](https://docs.opencraft.ai/channels/line), [Mattermost](https://docs.opencraft.ai/channels/mattermost), [Nextcloud Talk](https://docs.opencraft.ai/channels/nextcloud-talk), [Nostr](https://docs.opencraft.ai/channels/nostr), [Synology Chat](https://docs.opencraft.ai/channels/synology-chat), [Tlon](https://docs.opencraft.ai/channels/tlon), [Twitch](https://docs.opencraft.ai/channels/twitch), [Zalo](https://docs.opencraft.ai/channels/zalo), [Zalo Personal](https://docs.opencraft.ai/channels/zalouser), [WebChat](https://docs.opencraft.ai/web/webchat).
- [Roteamento de grupo](https://docs.opencraft.ai/channels/group-messages): menção gating, reply tags, chunking e roteamento por canal. Regras de canal: [Channels](https://docs.opencraft.ai/channels).

### Apps + nodes

- [App macOS](https://docs.opencraft.ai/platforms/macos): controle menu bar do plano de controle, [Voice Wake](https://docs.opencraft.ai/nodes/voicewake)/PTT, overlay de [Talk Mode](https://docs.opencraft.ai/nodes/talk), [WebChat](https://docs.opencraft.ai/web/webchat), ferramentas de debug, controle [remote gateway](https://docs.opencraft.ai/gateway/remote).
- [Node iOS](https://docs.opencraft.ai/platforms/ios): [Canvas](https://docs.opencraft.ai/platforms/mac/canvas), [Voice Wake](https://docs.opencraft.ai/nodes/voicewake), [Talk Mode](https://docs.opencraft.ai/nodes/talk), câmera, gravação de tela, Bonjour + emparelhamento de dispositivo.
- [Node Android](https://docs.opencraft.ai/platforms/android): aba de Conexão (código de setup/manual), sessões de chat, aba de voz, [Canvas](https://docs.opencraft.ai/platforms/mac/canvas), gravação de câmera/tela e comandos de dispositivo Android (notificações/localização/SMS/fotos/contatos/calendário/movimento/atualização de app).
- [Modo node macOS](https://docs.opencraft.ai/nodes): system.run/notify + exposição canvas/câmera.

### Ferramentas + automação

- [Controle de browser](https://docs.opencraft.ai/tools/browser): Chrome/Chromium dedicado opencraft, snapshots, ações, uploads, perfis.
- [Canvas](https://docs.opencraft.ai/platforms/mac/canvas): push/reset [A2UI](https://docs.opencraft.ai/platforms/mac/canvas#canvas-a2ui), eval, snapshot.
- [Nodes](https://docs.opencraft.ai/nodes): snap de câmera/clip, gravação de tela, [location.get](https://docs.opencraft.ai/nodes/location-command), notificações.
- [Cron + wakeups](https://docs.opencraft.ai/automation/cron-jobs); [webhooks](https://docs.opencraft.ai/automation/webhook); [Gmail Pub/Sub](https://docs.opencraft.ai/automation/gmail-pubsub).
- [Plataforma de skills](https://docs.opencraft.ai/tools/skills): skills agrupadas, gerenciadas e workspace com gating de instalação + UI.

### Runtime + segurança

- [Roteamento de canal](https://docs.opencraft.ai/channels/channel-routing), [política de retry](https://docs.opencraft.ai/concepts/retry) e [streaming/chunking](https://docs.opencraft.ai/concepts/streaming).
- [Presença](https://docs.opencraft.ai/concepts/presence), [indicadores de digitação](https://docs.opencraft.ai/concepts/typing-indicators) e [rastreamento de uso](https://docs.opencraft.ai/concepts/usage-tracking).
- [Modelos](https://docs.opencraft.ai/concepts/models), [model failover](https://docs.opencraft.ai/concepts/model-failover) e [session pruning](https://docs.opencraft.ai/concepts/session-pruning).
- [Segurança](https://docs.opencraft.ai/gateway/security) e [troubleshooting](https://docs.opencraft.ai/channels/troubleshooting).

### Ops + empacotamento

- [Control UI](https://docs.opencraft.ai/web) + [WebChat](https://docs.opencraft.ai/web/webchat) servidos diretamente do Gateway.
- [Tailscale Serve/Funnel](https://docs.opencraft.ai/gateway/tailscale) ou [SSH tunnels](https://docs.opencraft.ai/gateway/remote) com autenticação token/senha.
- [Modo Nix](https://docs.opencraft.ai/install/nix) para configuração declarativa; installs baseadas em [Docker](https://docs.opencraft.ai/install/docker).
- [Doctor](https://docs.opencraft.ai/gateway/doctor) migrações, [logging](https://docs.opencraft.ai/logging).

## Como funciona (resumo)

```
WhatsApp / Telegram / Slack / Discord / Google Chat / Signal / iMessage / BlueBubbles / IRC / Microsoft Teams / Matrix / Feishu / LINE / Mattermost / Nextcloud Talk / Nostr / Synology Chat / Tlon / Twitch / Zalo / Zalo Personal / WebChat
               │
               ▼
┌───────────────────────────────┐
│            Gateway            │
│       (control plane)         │
│     ws://127.0.0.1:18789      │
└──────────────┬────────────────┘
               │
               ├─ Pi agent (RPC)
               ├─ CLI (opencraft …)
               ├─ WebChat UI
               ├─ macOS app
               └─ iOS / Android nodes
```

## Subsistemas principais

- **[Gateway WebSocket network](https://docs.opencraft.ai/concepts/architecture)** — plano de controle WS único para clientes, ferramentas e eventos (mais ops: [Gateway runbook](https://docs.opencraft.ai/gateway)).
- **[Exposição Tailscale](https://docs.opencraft.ai/gateway/tailscale)** — Serve/Funnel para o dashboard do Gateway + WS (acesso remoto: [Remote](https://docs.opencraft.ai/gateway/remote)).
- **[Controle de browser](https://docs.opencraft.ai/tools/browser)** — Chrome/Chromium gerenciado opencraft com controle CDP.
- **[Canvas + A2UI](https://docs.opencraft.ai/platforms/mac/canvas)** — espaço de trabalho visual orientado por agente (host A2UI: [Canvas/A2UI](https://docs.opencraft.ai/platforms/mac/canvas#canvas-a2ui)).
- **[Voice Wake](https://docs.opencraft.ai/nodes/voicewake) + [Talk Mode](https://docs.opencraft.ai/nodes/talk)** — palavras-chave de despertar em macOS/iOS mais voz contínua em Android.
- **[Nodes](https://docs.opencraft.ai/nodes)** — Canvas, snap de câmera/clip, gravação de tela, `location.get`, notificações, mais macOS-only `system.run`/`system.notify`.

## Acesso Tailscale (Dashboard do Gateway)

OpenCraft pode auto-configurar Tailscale **Serve** (tailnet-only) ou **Funnel** (público) enquanto o Gateway permanece vinculado ao loopback. Configure `gateway.tailscale.mode`:

- `off`: sem automação Tailscale (padrão).
- `serve`: HTTPS tailnet-only via `tailscale serve` (usa headers de identidade Tailscale por padrão).
- `funnel`: HTTPS público via `tailscale funnel` (requer autenticação de senha compartilhada).

Notas:

- `gateway.bind` deve permanecer `loopback` quando Serve/Funnel está habilitado (OpenCraft aplica isso).
- Serve pode ser forçado a exigir uma senha configurando `gateway.auth.mode: "password"` ou `gateway.auth.allowTailscale: false`.
- Funnel se recusa a iniciar a menos que `gateway.auth.mode: "password"` esteja definido.
- Opcional: `gateway.tailscale.resetOnExit` para desfazer Serve/Funnel no desligamento.

Detalhes: [Tailscale guide](https://docs.opencraft.ai/gateway/tailscale) · [Web surfaces](https://docs.opencraft.ai/web)

## Remote Gateway (Linux é ótimo)

É perfeitamente adequado executar o Gateway em uma pequena instância Linux. Clientes (app macOS, CLI, WebChat) podem se conectar via **Tailscale Serve/Funnel** ou **SSH tunnels**, e você ainda pode emparelhar nodes de dispositivo (macOS/iOS/Android) para executar ações locais do dispositivo quando necessário.

- **Host do Gateway** executa a ferramenta exec e conexões de canal por padrão.
- **Nodes de dispositivo** executam ações locais do dispositivo (`system.run`, câmera, gravação de tela, notificações) via `node.invoke`.
  Em resumo: exec executa onde o Gateway vive; ações de dispositivo executam onde o dispositivo vive.

Detalhes: [Remote access](https://docs.opencraft.ai/gateway/remote) · [Nodes](https://docs.opencraft.ai/nodes) · [Security](https://docs.opencraft.ai/gateway/security)

## Permissões macOS via protocolo do Gateway

O app macOS pode ser executado em **node mode** e anuncia suas capacidades + mapa de permissão sobre o Gateway WebSocket (`node.list` / `node.describe`). Clientes podem então executar ações locais via `node.invoke`:

- `system.run` executa um comando local e retorna stdout/stderr/exit code; defina `needsScreenRecording: true` para exigir permissão de gravação de tela (caso contrário você receberá `PERMISSION_MISSING`).
- `system.notify` publica uma notificação do usuário e falha se notificações forem negadas.
- `canvas.*`, `camera.*`, `screen.record` e `location.get` também são roteados via `node.invoke` e seguem o status de permissão TCC.

Bash elevado (permissões do host) é separado de TCC macOS:

- Use `/elevated on|off` para alternar acesso elevado por sessão quando habilitado + permitido.
- Gateway persiste a alternância por sessão via `sessions.patch` (método WS) ao lado de `thinkingLevel`, `verboseLevel`, `model`, `sendPolicy` e `groupActivation`.

Detalhes: [Nodes](https://docs.opencraft.ai/nodes) · [macOS app](https://docs.opencraft.ai/platforms/macos) · [Gateway protocol](https://docs.opencraft.ai/concepts/architecture)

## Agent para Agent (ferramentas sessions_\*)

- Use estas para coordenar trabalho em sessões sem pular entre superfícies de chat.
- `sessions_list` — descobrir sessões ativas (agentes) e seus metadados.
- `sessions_history` — buscar registros de transcrição para uma sessão.
- `sessions_send` — mensagem para outra sessão; opcional reply-back ping-pong + announce step (`REPLY_SKIP`, `ANNOUNCE_SKIP`).

Detalhes: [Session tools](https://docs.opencraft.ai/concepts/session-tool)

## Registro de skills (ClawHub)

ClawHub é um registro de skills mínimo. Com ClawHub habilitado, o agente pode procurar por skills automaticamente e puxar novos conforme necessário.

[ClawHub](https://clawhub.com)

## Comandos de chat

Envie estes em WhatsApp/Telegram/Slack/Google Chat/Microsoft Teams/WebChat (comandos de grupo são somente para proprietários):

- `/status` — status de sessão compacto (modelo + tokens, custo quando disponível)
- `/new` ou `/reset` — resetar a sessão
- `/compact` — compactar contexto de sessão (resumo)
- `/think <level>` — off|minimal|low|medium|high|xhigh (apenas modelos GPT-5.2 + Codex)
- `/verbose on|off`
- `/usage off|tokens|full` — rodapé de uso por resposta
- `/restart` — reiniciar o Gateway (somente proprietário em grupos)
- `/activation mention|always` — alternância de ativação de grupo (somente grupos)

## Apps (opcional)

O Gateway sozinho oferece uma excelente experiência. Todos os apps são opcionais e adicionam recursos extras.

Se você planeja construir/executar apps complementares, siga os runbooks da plataforma abaixo.

### macOS (OpenCraft.app) (opcional)

- Controle menu bar para o Gateway e saúde.
- Overlay Voice Wake + push-to-talk.
- WebChat + ferramentas de debug.
- Controle remote gateway sobre SSH.

Nota: compilações assinadas necessárias para permissões macOS ficarem por reconstruções (veja `docs/mac/permissions.md`).

### Node iOS (opcional)

- Emparelha como um node sobre o Gateway WebSocket (device pairing).
- Voice trigger forwarding + Canvas surface.
- Controlado via `opencraft nodes …`.

Runbook: [iOS connect](https://docs.opencraft.ai/platforms/ios).

### Node Android (opcional)

- Emparelha como um node WS via device pairing (`opencraft devices ...`).
- Expõe abas de Conexão/Chat/Voz mais Canvas, Câmera, Captura de tela e famílias de comandos de dispositivo Android.
- Runbook: [Android connect](https://docs.opencraft.ai/platforms/android).

## Agent workspace + skills

- Raiz do workspace: `~/.opencraft/workspace` (configurável via `agents.defaults.workspace`).
- Arquivos de prompt injetados: `AGENTS.md`, `SOUL.md`, `TOOLS.md`.
- Skills: `~/.opencraft/workspace/skills/<skill>/SKILL.md`.

## Configuração

Mínimo `~/.editzffaleta/OpenCraft.json` (modelo + padrões):

```json5
{
  agent: {
    model: "anthropic/claude-opus-4-6",
  },
}
```

[Referência completa de configuração (todas as chaves + exemplos).](https://docs.opencraft.ai/gateway/configuration)

## Modelo de segurança (importante)

- **Padrão:** ferramentas executam no host para a sessão **main**, então o agente tem acesso total quando é apenas você.
- **Segurança de grupo/canal:** defina `agents.defaults.sandbox.mode: "non-main"` para executar sessões **não-main** (grupos/canais) dentro de sandboxes Docker por sessão; bash então executa em Docker para essas sessões.
- **Padrões de sandbox:** permitir `bash`, `process`, `read`, `write`, `edit`, `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`; negar `browser`, `canvas`, `nodes`, `cron`, `discord`, `gateway`.

Detalhes: [Security guide](https://docs.opencraft.ai/gateway/security) · [Docker + sandboxing](https://docs.opencraft.ai/install/docker) · [Sandbox config](https://docs.opencraft.ai/gateway/configuration)

### [WhatsApp](https://docs.opencraft.ai/channels/whatsapp)

- Vincule o dispositivo: `pnpm opencraft channels login` (armazena credenciais em `~/.opencraft/credentials`).
- Permitir quem pode falar com o assistente via `channels.whatsapp.allowFrom`.
- Se `channels.whatsapp.groups` estiver definido, ele se torna uma lista de permissões de grupo; inclua `"*"` para permitir todos.

### [Telegram](https://docs.opencraft.ai/channels/telegram)

- Defina `TELEGRAM_BOT_TOKEN` ou `channels.telegram.botToken` (env vence).
- Opcional: defina `channels.telegram.groups` (com `channels.telegram.groups."*".requireMention`); quando definido, é uma lista de permissões de grupo (inclua `"*"` para permitir todos). Também `channels.telegram.allowFrom` ou `channels.telegram.webhookUrl` + `channels.telegram.webhookSecret` conforme necessário.

```json5
{
  channels: {
    telegram: {
      botToken: "123456:ABCDEF",
    },
  },
}
```

### [Slack](https://docs.opencraft.ai/channels/slack)

- Defina `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` (ou `channels.slack.botToken` + `channels.slack.appToken`).

### [Discord](https://docs.opencraft.ai/channels/discord)

- Defina `DISCORD_BOT_TOKEN` ou `channels.discord.token` (env vence).
- Opcional: defina `commands.native`, `commands.text` ou `commands.useAccessGroups`, mais `channels.discord.allowFrom`, `channels.discord.guilds` ou `channels.discord.mediaMaxMb` conforme necessário.

```json5
{
  channels: {
    discord: {
      token: "1234abcd",
    },
  },
}
```

### [Signal](https://docs.opencraft.ai/channels/signal)

- Requer `signal-cli` e uma seção de configuração `channels.signal`.

### [BlueBubbles (iMessage)](https://docs.opencraft.ai/channels/bluebubbles)

- Integração de **iMessage recomendada**.
- Configure `channels.bluebubbles.serverUrl` + `channels.bluebubbles.password` e um webhook (`channels.bluebubbles.webhookPath`).
- O servidor BlueBubbles roda em macOS; o Gateway pode rodar em macOS ou em outro lugar.

### [iMessage (legado)](https://docs.opencraft.ai/channels/imessage)

- Integração legada apenas macOS via `imsg` (Mensagens devem ser assinadas).
- Se `channels.imessage.groups` estiver definido, ele se torna uma lista de permissões de grupo; inclua `"*"` para permitir todos.

### [Microsoft Teams](https://docs.opencraft.ai/channels/msteams)

- Configure um app Teams + Bot Framework, então adicione uma seção de configuração `msteams`.
- Permitir quem pode falar via `msteams.allowFrom`; acesso de grupo via `msteams.groupAllowFrom` ou `msteams.groupPolicy: "open"`.

### [WebChat](https://docs.opencraft.ai/web/webchat)

- Usa o Gateway WebSocket; sem porta/config separado de WebChat.

Controle de browser (opcional):

```json5
{
  browser: {
    enabled: true,
    color: "#FF4500",
  },
}
```

## Docs

Use estes quando você tiver passado do fluxo de onboarding e quiser a referência mais profunda.

- [Comece com o índice de docs para navegação e "o que fica aonde."](https://docs.opencraft.ai)
- [Leia a visão geral da arquitetura para o modelo de protocolo + Gateway.](https://docs.opencraft.ai/concepts/architecture)
- [Use a referência completa de configuração quando precisar de cada chave e exemplo.](https://docs.opencraft.ai/gateway/configuration)
- [Execute o Gateway conforme o livro com o runbook operacional.](https://docs.opencraft.ai/gateway)
- [Aprenda como as superfícies de Controle UI/Web funcionam e como expô-las com segurança.](https://docs.opencraft.ai/web)
- [Entenda acesso remoto sobre SSH tunnels ou tailnets.](https://docs.opencraft.ai/gateway/remote)
- [Siga o OpenCraft Onboard para um setup guiado.](https://docs.opencraft.ai/start/wizard)
- [Conecte gatilhos externos via a superfície webhook.](https://docs.opencraft.ai/automation/webhook)
- [Configure gatilhos Gmail Pub/Sub.](https://docs.opencraft.ai/automation/gmail-pubsub)
- [Aprenda os detalhes do acompanhante menu bar macOS.](https://docs.opencraft.ai/platforms/mac/menu-bar)
- [Guias de plataforma: Windows (WSL2)](https://docs.opencraft.ai/platforms/windows), [Linux](https://docs.opencraft.ai/platforms/linux), [macOS](https://docs.opencraft.ai/platforms/macos), [iOS](https://docs.opencraft.ai/platforms/ios), [Android](https://docs.opencraft.ai/platforms/android)
- [Debug falhas comuns com o guia de troubleshooting.](https://docs.opencraft.ai/channels/troubleshooting)
- [Revise orientação de segurança antes de expor qualquer coisa.](https://docs.opencraft.ai/gateway/security)

## Docs avançados (descoberta + controle)

- [Discovery + transports](https://docs.opencraft.ai/gateway/discovery)
- [Bonjour/mDNS](https://docs.opencraft.ai/gateway/bonjour)
- [Gateway pairing](https://docs.opencraft.ai/gateway/pairing)
- [Remote gateway README](https://docs.opencraft.ai/gateway/remote-gateway-readme)
- [Control UI](https://docs.opencraft.ai/web/control-ui)
- [Dashboard](https://docs.opencraft.ai/web/dashboard)

## Operações & troubleshooting

- [Health checks](https://docs.opencraft.ai/gateway/health)
- [Gateway lock](https://docs.opencraft.ai/gateway/gateway-lock)
- [Background process](https://docs.opencraft.ai/gateway/background-process)
- [Browser troubleshooting (Linux)](https://docs.opencraft.ai/tools/browser-linux-troubleshooting)
- [Logging](https://docs.opencraft.ai/logging)

## Deep dives

- [Agent loop](https://docs.opencraft.ai/concepts/agent-loop)
- [Presence](https://docs.opencraft.ai/concepts/presence)
- [TypeBox schemas](https://docs.opencraft.ai/concepts/typebox)
- [RPC adapters](https://docs.opencraft.ai/reference/rpc)
- [Queue](https://docs.opencraft.ai/concepts/queue)

## Workspace & skills

- [Skills config](https://docs.opencraft.ai/tools/skills-config)
- [Default AGENTS](https://docs.opencraft.ai/reference/AGENTS.default)
- [Templates: AGENTS](https://docs.opencraft.ai/reference/templates/AGENTS)
- [Templates: BOOTSTRAP](https://docs.opencraft.ai/reference/templates/BOOTSTRAP)
- [Templates: IDENTITY](https://docs.opencraft.ai/reference/templates/IDENTITY)
- [Templates: SOUL](https://docs.opencraft.ai/reference/templates/SOUL)
- [Templates: TOOLS](https://docs.opencraft.ai/reference/templates/TOOLS)
- [Templates: USER](https://docs.opencraft.ai/reference/templates/USER)

## Internals da plataforma

- [macOS dev setup](https://docs.opencraft.ai/platforms/mac/dev-setup)
- [macOS menu bar](https://docs.opencraft.ai/platforms/mac/menu-bar)
- [macOS voice wake](https://docs.opencraft.ai/platforms/mac/voicewake)
- [iOS node](https://docs.opencraft.ai/platforms/ios)
- [Android node](https://docs.opencraft.ai/platforms/android)
- [Windows (WSL2)](https://docs.opencraft.ai/platforms/windows)
- [Linux app](https://docs.opencraft.ai/platforms/linux)

## Hooks de email (Gmail)

- [docs.opencraft.ai/gmail-pubsub](https://docs.opencraft.ai/automation/gmail-pubsub)

## Molty

OpenCraft foi construído para **Molty**, um assistente de IA lagosta espacial. 🦞
por Peter Steinberger e a comunidade.

- [opencraft.ai](https://opencraft.ai)
- [soul.md](https://soul.md)
- [steipete.me](https://steipete.me)
- [@opencraft](https://x.com/opencraft)

## Comunidade

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes, mantenedores e como enviar PRs.
PRs com IA/vibe-coded bem-vindos! 🤖
