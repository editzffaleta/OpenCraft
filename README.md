# 🦞 OpenCraft — Assistente de IA Pessoal

<p align="center">
    <picture>
        <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/opencraft/opencraft/main/docs/assets/opencraft-logo-text-dark.svg">
        <img src="https://raw.githubusercontent.com/opencraft/opencraft/main/docs/assets/opencraft-logo-text.svg" alt="OpenCraft" width="500">
    </picture>
</p>

<p align="center">
  <strong>ESFOLIE! ESFOLIE!</strong>
</p>

<p align="center">
  <a href="https://github.com/openclaw/openclaw/actions/workflows/ci.yml?branch=main"><img src="https://img.shields.io/github/actions/workflow/status/openclaw/openclaw/ci.yml?branch=main&style=for-the-badge" alt="Status CI"></a>
  <a href="https://github.com/openclaw/openclaw/releases"><img src="https://img.shields.io/github/v/release/openclaw/openclaw?include_prereleases&style=for-the-badge" alt="Versão GitHub"></a>
  <a href="https://discord.gg/clawd"><img src="https://img.shields.io/discord/1456350064065904867?label=Discord&logo=discord&logoColor=white&color=5865F2&style=for-the-badge" alt="Discord"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="Licença MIT"></a>
</p>

**OpenCraft** é um _assistente de IA pessoal_ que você executa nos seus próprios dispositivos.
Ele responde nos canais que você já usa (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, BlueBubbles, IRC, Microsoft Teams, Matrix, Feishu, LINE, Mattermost, Nextcloud Talk, Nostr, Synology Chat, Tlon, Twitch, Zalo, Zalo Personal, WebChat). Ele pode falar e ouvir em macOS/iOS/Android, e pode renderizar um Canvas ao vivo que você controla. O Gateway é apenas o plano de controle — o produto é o assistente.

Se você quer um assistente pessoal de usuário único que parece local, rápido e sempre disponível, é este.

[Site](https://opencraft.ai) · [Docs](https://docs.opencraft.ai) · [Visão](VISION.md) · [DeepWiki](https://deepwiki.com/opencraft/opencraft) · [Primeiros Passos](https://docs.opencraft.ai/start/getting-started) · [Atualização](https://docs.opencraft.ai/install/updating) · [Showcase](https://docs.opencraft.ai/start/showcase) · [FAQ](https://docs.opencraft.ai/help/faq) · [Onboarding](https://docs.opencraft.ai/start/wizard) · [Nix](https://github.com/opencraft/nix-opencraft) · [Docker](https://docs.opencraft.ai/install/docker) · [Discord](https://discord.gg/clawd)

Configuração preferida: execute `opencraft onboard` no seu terminal.
O OpenCraft Onboard guia você passo a passo na configuração do gateway, workspace, canais e skills. É o caminho de configuração CLI recomendado e funciona em **macOS, Linux e Windows (via WSL2; fortemente recomendado)**.
Funciona com npm, pnpm ou bun.
Nova instalação? Comece aqui: [Primeiros passos](https://docs.opencraft.ai/start/getting-started)

## Patrocinadores

| OpenAI                                                            | Vercel                                                            | Blacksmith                                                                   | Convex                                                                |
| ----------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [![OpenAI](docs/assets/sponsors/openai.svg)](https://openai.com/) | [![Vercel](docs/assets/sponsors/vercel.svg)](https://vercel.com/) | [![Blacksmith](docs/assets/sponsors/blacksmith.svg)](https://blacksmith.sh/) | [![Convex](docs/assets/sponsors/convex.svg)](https://www.convex.dev/) |

**Assinaturas (OAuth):**

- **[OpenAI](https://openai.com/)** (ChatGPT/Codex)

Nota sobre modelos: embora muitos provedores/modelos sejam suportados, para a melhor experiência e menor risco de injeção de prompt, use o modelo mais forte da última geração disponível para você. Veja [Onboarding](https://docs.opencraft.ai/start/onboarding).

## Modelos (seleção + autenticação)

- Configuração de modelos + CLI: [Modelos](https://docs.opencraft.ai/concepts/models)
- Rotação de perfil de auth (OAuth vs chaves de API) + fallbacks: [Failover de modelo](https://docs.opencraft.ai/concepts/model-failover)

## Instalação (recomendada)

Runtime: **Node ≥22**.

```bash
npm install -g opencraft@latest
# ou: pnpm add -g opencraft@latest

opencraft onboard --install-daemon
```

O OpenCraft Onboard instala o daemon do Gateway (serviço de usuário launchd/systemd) para que ele fique em execução.

## Início Rápido (TL;DR)

Runtime: **Node ≥22**.

Guia completo para iniciantes (auth, pareamento, canais): [Primeiros passos](https://docs.opencraft.ai/start/getting-started)

```bash
opencraft onboard --install-daemon

opencraft gateway --port 18789 --verbose

# Enviar uma mensagem
opencraft message send --to +5511999999999 --message "Olá do OpenCraft"

# Falar com o assistente (opcionalmente entregar de volta a qualquer canal conectado: WhatsApp/Telegram/Slack/Discord/Google Chat/Signal/iMessage/BlueBubbles/IRC/Microsoft Teams/Matrix/Feishu/LINE/Mattermost/Nextcloud Talk/Nostr/Synology Chat/Tlon/Twitch/Zalo/Zalo Personal/WebChat)
opencraft agent --message "Checklist de ship" --thinking high
```

Atualizando? [Guia de atualização](https://docs.opencraft.ai/install/updating) (e execute `opencraft doctor`).

## Canais de Desenvolvimento

- **stable**: releases com tag (`vAAAA.M.D` ou `vAAAA.M.D-<patch>`), dist-tag npm `latest`.
- **beta**: tags de pré-release (`vAAAA.M.D-beta.N`), dist-tag npm `beta` (app macOS pode estar ausente).
- **dev**: head em movimento de `main`, dist-tag npm `dev` (quando publicado).

Mudar de canal (git + npm): `opencraft update --channel stable|beta|dev`.
Detalhes: [Canais de desenvolvimento](https://docs.opencraft.ai/install/development-channels).

## A Partir do Código-Fonte (desenvolvimento)

Prefira `pnpm` para builds a partir do código-fonte. Bun é opcional para executar TypeScript diretamente.

```bash
git clone https://github.com/openclaw/openclaw.git
cd opencraft

pnpm install
pnpm ui:build # instala deps da UI automaticamente na primeira execução
pnpm build

pnpm opencraft onboard --install-daemon

# Loop de dev (reload automático em mudanças de código/config)
pnpm gateway:watch
```

Nota: `pnpm opencraft ...` executa TypeScript diretamente (via `tsx`). `pnpm build` produz `dist/` para execução via Node / o binário empacotado `opencraft`.

## Padrões de Segurança (acesso por DM)

O OpenCraft conecta a superfícies de mensagens reais. Trate DMs recebidos como **input não confiável**.

Guia completo de segurança: [Segurança](https://docs.opencraft.ai/gateway/security)

Comportamento padrão no Telegram/WhatsApp/Signal/iMessage/Microsoft Teams/Discord/Google Chat/Slack:

- **Pareamento por DM** (`dmPolicy="pairing"` / `channels.discord.dmPolicy="pairing"` / `channels.slack.dmPolicy="pairing"`; legado: `channels.discord.dm.policy`, `channels.slack.dm.policy`): remetentes desconhecidos recebem um código de pareamento curto e o bot não processa a mensagem deles.
- Aprovar com: `opencraft pairing approve <channel> <code>` (então o remetente é adicionado a uma lista de permissão local).
- DMs públicos recebidos exigem opt-in explícito: defina `dmPolicy="open"` e inclua `"*"` na lista de permissão do canal (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; legado: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`).

Execute `opencraft doctor` para detectar políticas de DM arriscadas ou mal configuradas.

## Destaques

- **[Gateway local-first](https://docs.opencraft.ai/gateway)** — plano de controle único para sessões, canais, tools e eventos.
- **[Inbox multicanal](https://docs.opencraft.ai/channels)** — WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, BlueBubbles (iMessage), iMessage (legado), IRC, Microsoft Teams, Matrix, Feishu, LINE, Mattermost, Nextcloud Talk, Nostr, Synology Chat, Tlon, Twitch, Zalo, Zalo Personal, WebChat, macOS, iOS/Android.
- **[Roteamento multi-agente](https://docs.opencraft.ai/gateway/configuration)** — roteia canais/contas/peers recebidos para agentes isolados (workspaces + sessões por agente).
- **[Voice Wake](https://docs.opencraft.ai/nodes/voicewake) + [Modo Talk](https://docs.opencraft.ai/nodes/talk)** — palavras de ativação no macOS/iOS e voz contínua no Android (ElevenLabs + fallback TTS do sistema).
- **[Canvas ao Vivo](https://docs.opencraft.ai/platforms/mac/canvas)** — workspace visual controlado pelo agente com [A2UI](https://docs.opencraft.ai/platforms/mac/canvas#canvas-a2ui).
- **[Tools de primeira classe](https://docs.opencraft.ai/tools)** — browser, canvas, nodes, cron, sessões e ações Discord/Slack.
- **[Apps complementares](https://docs.opencraft.ai/platforms/macos)** — app de barra de menu macOS + [nodes](https://docs.opencraft.ai/nodes) iOS/Android.
- **[Onboarding](https://docs.opencraft.ai/start/wizard) + [skills](https://docs.opencraft.ai/tools/skills)** — setup guiado pelo onboarding com skills empacotadas/gerenciadas/workspace.

## Histórico de Stars

[![Star History Chart](https://api.star-history.com/svg?repos=opencraft/opencraft&type=date&legend=top-left)](https://www.star-history.com/#opencraft/opencraft&type=date&legend=top-left)

## Tudo que Construímos até Agora

### Plataforma principal

- [Plano de controle WS do Gateway](https://docs.opencraft.ai/gateway) com sessões, presença, config, cron, webhooks, [Control UI](https://docs.opencraft.ai/web) e [host Canvas](https://docs.opencraft.ai/platforms/mac/canvas#canvas-a2ui).
- [Superfície CLI](https://docs.opencraft.ai/tools/agent-send): gateway, agent, send, [onboarding](https://docs.opencraft.ai/start/wizard) e [doctor](https://docs.opencraft.ai/gateway/doctor).
- [Runtime do agente Pi](https://docs.opencraft.ai/concepts/agent) em modo RPC com streaming de tool e streaming de bloco.
- [Modelo de sessão](https://docs.opencraft.ai/concepts/session): `main` para chats diretos, isolamento de grupo, modos de ativação, modos de fila, reply-back. Regras de grupo: [Grupos](https://docs.opencraft.ai/channels/groups).
- [Pipeline de mídia](https://docs.opencraft.ai/nodes/images): imagens/áudio/vídeo, hooks de transcrição, limites de tamanho, ciclo de vida de arquivos temporários. Detalhes de áudio: [Áudio](https://docs.opencraft.ai/nodes/audio).

### Canais

- [Canais](https://docs.opencraft.ai/channels): [WhatsApp](https://docs.opencraft.ai/channels/whatsapp) (Baileys), [Telegram](https://docs.opencraft.ai/channels/telegram) (grammY), [Slack](https://docs.opencraft.ai/channels/slack) (Bolt), [Discord](https://docs.opencraft.ai/channels/discord) (discord.js), [Google Chat](https://docs.opencraft.ai/channels/googlechat) (Chat API), [Signal](https://docs.opencraft.ai/channels/signal) (signal-cli), [BlueBubbles](https://docs.opencraft.ai/channels/bluebubbles) (iMessage, recomendado), [iMessage](https://docs.opencraft.ai/channels/imessage) (imsg legado), [IRC](https://docs.opencraft.ai/channels/irc), [Microsoft Teams](https://docs.opencraft.ai/channels/msteams), [Matrix](https://docs.opencraft.ai/channels/matrix), [Feishu](https://docs.opencraft.ai/channels/feishu), [LINE](https://docs.opencraft.ai/channels/line), [Mattermost](https://docs.opencraft.ai/channels/mattermost), [Nextcloud Talk](https://docs.opencraft.ai/channels/nextcloud-talk), [Nostr](https://docs.opencraft.ai/channels/nostr), [Synology Chat](https://docs.opencraft.ai/channels/synology-chat), [Tlon](https://docs.opencraft.ai/channels/tlon), [Twitch](https://docs.opencraft.ai/channels/twitch), [Zalo](https://docs.opencraft.ai/channels/zalo), [Zalo Personal](https://docs.opencraft.ai/channels/zalouser), [WebChat](https://docs.opencraft.ai/web/webchat).
- [Roteamento de grupo](https://docs.opencraft.ai/channels/group-messages): gating por menção, tags de reply, chunking e roteamento por canal. Regras de canal: [Canais](https://docs.opencraft.ai/channels).

### Apps + nodes

- [App macOS](https://docs.opencraft.ai/platforms/macos): plano de controle na barra de menu, [Voice Wake](https://docs.opencraft.ai/nodes/voicewake)/PTT, overlay do [Modo Talk](https://docs.opencraft.ai/nodes/talk), [WebChat](https://docs.opencraft.ai/web/webchat), ferramentas de debug, controle de [gateway remoto](https://docs.opencraft.ai/gateway/remote).
- [Node iOS](https://docs.opencraft.ai/platforms/ios): [Canvas](https://docs.opencraft.ai/platforms/mac/canvas), [Voice Wake](https://docs.opencraft.ai/nodes/voicewake), [Modo Talk](https://docs.opencraft.ai/nodes/talk), câmera, gravação de tela, Bonjour + pareamento de dispositivo.
- [Node Android](https://docs.opencraft.ai/platforms/android): aba Connect (código de setup/manual), sessões de chat, aba de voz, [Canvas](https://docs.opencraft.ai/platforms/mac/canvas), câmera/gravação de tela e comandos de dispositivo Android (notificações/localização/SMS/fotos/contatos/calendário/movimento/atualização de app).
- [Modo node macOS](https://docs.opencraft.ai/nodes): system.run/notify + exposição canvas/camera.

### Tools + automação

- [Controle de browser](https://docs.opencraft.ai/tools/browser): Chrome/Chromium dedicado ao opencraft, snapshots, ações, uploads, perfis.
- [Canvas](https://docs.opencraft.ai/platforms/mac/canvas): push/reset [A2UI](https://docs.opencraft.ai/platforms/mac/canvas#canvas-a2ui), eval, snapshot.
- [Nodes](https://docs.opencraft.ai/nodes): snap/clip de câmera, gravação de tela, [location.get](https://docs.opencraft.ai/nodes/location-command), notificações.
- [Cron + wakeups](https://docs.opencraft.ai/automation/cron-jobs); [webhooks](https://docs.opencraft.ai/automation/webhook); [Gmail Pub/Sub](https://docs.opencraft.ai/automation/gmail-pubsub).
- [Plataforma de skills](https://docs.opencraft.ai/tools/skills): skills empacotadas, gerenciadas e workspace com gating de instalação + UI.

### Runtime + segurança

- [Roteamento de canal](https://docs.opencraft.ai/channels/channel-routing), [política de retry](https://docs.opencraft.ai/concepts/retry) e [streaming/chunking](https://docs.opencraft.ai/concepts/streaming).
- [Presença](https://docs.opencraft.ai/concepts/presence), [indicadores de digitação](https://docs.opencraft.ai/concepts/typing-indicators) e [rastreamento de uso](https://docs.opencraft.ai/concepts/usage-tracking).
- [Modelos](https://docs.opencraft.ai/concepts/models), [failover de modelo](https://docs.opencraft.ai/concepts/model-failover) e [pruning de sessão](https://docs.opencraft.ai/concepts/session-pruning).
- [Segurança](https://docs.opencraft.ai/gateway/security) e [solução de problemas](https://docs.opencraft.ai/channels/troubleshooting).

### Ops + empacotamento

- [Control UI](https://docs.opencraft.ai/web) + [WebChat](https://docs.opencraft.ai/web/webchat) servidos diretamente do Gateway.
- [Tailscale Serve/Funnel](https://docs.opencraft.ai/gateway/tailscale) ou [túneis SSH](https://docs.opencraft.ai/gateway/remote) com auth por token/senha.
- [Modo Nix](https://docs.opencraft.ai/install/nix) para config declarativa; instalações baseadas em [Docker](https://docs.opencraft.ai/install/docker).
- Migrações via [Doctor](https://docs.opencraft.ai/gateway/doctor), [logging](https://docs.opencraft.ai/logging).

## Como Funciona (resumo)

```
WhatsApp / Telegram / Slack / Discord / Google Chat / Signal / iMessage / BlueBubbles / IRC / Microsoft Teams / Matrix / Feishu / LINE / Mattermost / Nextcloud Talk / Nostr / Synology Chat / Tlon / Twitch / Zalo / Zalo Personal / WebChat
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

## Subsistemas Principais

- **[Rede WebSocket do Gateway](https://docs.opencraft.ai/concepts/architecture)** — plano de controle WS único para clientes, tools e eventos (mais ops: [runbook do Gateway](https://docs.opencraft.ai/gateway)).
- **[Exposição Tailscale](https://docs.opencraft.ai/gateway/tailscale)** — Serve/Funnel para o dashboard do Gateway + WS (acesso remoto: [Remoto](https://docs.opencraft.ai/gateway/remote)).
- **[Controle de browser](https://docs.opencraft.ai/tools/browser)** — Chrome/Chromium gerenciado pelo opencraft com controle CDP.
- **[Canvas + A2UI](https://docs.opencraft.ai/platforms/mac/canvas)** — workspace visual controlado pelo agente (host A2UI: [Canvas/A2UI](https://docs.opencraft.ai/platforms/mac/canvas#canvas-a2ui)).
- **[Voice Wake](https://docs.opencraft.ai/nodes/voicewake) + [Modo Talk](https://docs.opencraft.ai/nodes/talk)** — palavras de ativação em macOS/iOS mais voz contínua no Android.
- **[Nodes](https://docs.opencraft.ai/nodes)** — Canvas, snap/clip de câmera, gravação de tela, `location.get`, notificações, mais `system.run`/`system.notify` exclusivos do macOS.

## Acesso via Tailscale (dashboard do Gateway)

O OpenCraft pode configurar automaticamente o Tailscale **Serve** (somente tailnet) ou **Funnel** (público) enquanto o Gateway permanece vinculado ao loopback. Configure `gateway.tailscale.mode`:

- `off`: sem automação Tailscale (padrão).
- `serve`: HTTPS somente tailnet via `tailscale serve` (usa cabeçalhos de identidade Tailscale por padrão).
- `funnel`: HTTPS público via `tailscale funnel` (requer auth por senha compartilhada).

Notas:

- `gateway.bind` deve permanecer `loopback` quando Serve/Funnel está habilitado (o OpenCraft impõe isso).
- Serve pode ser forçado a exigir senha definindo `gateway.auth.mode: "password"` ou `gateway.auth.allowTailscale: false`.
- Funnel se recusa a iniciar a menos que `gateway.auth.mode: "password"` esteja definido.
- Opcional: `gateway.tailscale.resetOnExit` para desfazer Serve/Funnel no desligamento.

Detalhes: [Guia Tailscale](https://docs.opencraft.ai/gateway/tailscale) · [Superfícies web](https://docs.opencraft.ai/web)

## Gateway Remoto (Linux é ótimo)

É perfeitamente válido executar o Gateway em uma pequena instância Linux. Clientes (app macOS, CLI, WebChat) podem conectar via **Tailscale Serve/Funnel** ou **túneis SSH**, e você ainda pode parear nodes de dispositivo (macOS/iOS/Android) para executar ações locais de dispositivo quando necessário.

- **Host do Gateway** executa a tool exec e conexões de canal por padrão.
- **Nodes de dispositivo** executam ações locais do dispositivo (`system.run`, câmera, gravação de tela, notificações) via `node.invoke`.
  Em resumo: exec roda onde o Gateway está; ações de dispositivo rodam onde o dispositivo está.

Detalhes: [Acesso remoto](https://docs.opencraft.ai/gateway/remote) · [Nodes](https://docs.opencraft.ai/nodes) · [Segurança](https://docs.opencraft.ai/gateway/security)

## Permissões macOS via Protocolo Gateway

O app macOS pode rodar em **modo node** e anuncia suas capacidades + mapa de permissões pelo WebSocket do Gateway (`node.list` / `node.describe`). Clientes podem então executar ações locais via `node.invoke`:

- `system.run` executa um comando local e retorna stdout/stderr/código de saída; defina `needsScreenRecording: true` para exigir permissão de gravação de tela (caso contrário você receberá `PERMISSION_MISSING`).
- `system.notify` posta uma notificação de usuário e falha se notificações estiverem negadas.
- `canvas.*`, `camera.*`, `screen.record` e `location.get` também são roteados via `node.invoke` e seguem o status de permissão TCC.

Bash elevado (permissões do host) é separado do TCC do macOS:

- Use `/elevated on|off` para alternar acesso elevado por sessão quando habilitado + na lista de permissão.
- O Gateway persiste o toggle por sessão via `sessions.patch` (método WS) junto com `thinkingLevel`, `verboseLevel`, `model`, `sendPolicy` e `groupActivation`.

Detalhes: [Nodes](https://docs.opencraft.ai/nodes) · [App macOS](https://docs.opencraft.ai/platforms/macos) · [Protocolo do Gateway](https://docs.opencraft.ai/concepts/architecture)

## Agente para Agente (tools sessions\_\*)

- Use estas para coordenar trabalho entre sessões sem pular entre superfícies de chat.
- `sessions_list` — descobre sessões ativas (agentes) e seus metadados.
- `sessions_history` — busca logs de transcrição de uma sessão.
- `sessions_send` — envia mensagem para outra sessão; ping-pong de reply opcional + etapa de announce (`REPLY_SKIP`, `ANNOUNCE_SKIP`).

Detalhes: [Tools de sessão](https://docs.opencraft.ai/concepts/session-tool)

## Registro de Skills (ClawHub)

ClawHub é um registro mínimo de skills. Com ClawHub habilitado, o agente pode buscar skills automaticamente e puxar novas conforme necessário.

[ClawHub](https://clawhub.com)

## Comandos de Chat

Envie estes no WhatsApp/Telegram/Slack/Google Chat/Microsoft Teams/WebChat (comandos de grupo são apenas para proprietário):

- `/status` — status compacto da sessão (modelo + tokens, custo quando disponível)
- `/new` ou `/reset` — reinicia a sessão
- `/compact` — compacta o contexto da sessão (resumo)
- `/think <level>` — off|minimal|low|medium|high|xhigh (apenas modelos GPT-5.2 + Codex)
- `/verbose on|off`
- `/usage off|tokens|full` — rodapé de uso por resposta
- `/restart` — reinicia o gateway (apenas proprietário em grupos)
- `/activation mention|always` — toggle de ativação de grupo (apenas grupos)

## Apps (opcional)

O Gateway sozinho oferece uma ótima experiência. Todos os apps são opcionais e adicionam funcionalidades extras.

Se você planeja compilar/executar apps complementares, siga os runbooks de plataforma abaixo.

### macOS (OpenCraft.app) (opcional)

- Controle da barra de menu para o Gateway e saúde.
- Voice Wake + overlay push-to-talk.
- WebChat + ferramentas de debug.
- Controle de gateway remoto via SSH.

Nota: builds assinados são necessários para que as permissões do macOS persistam entre rebuilds (veja `docs/mac/permissions.md`).

### Node iOS (opcional)

- Pareia como node pelo WebSocket do Gateway (pareamento de dispositivo).
- Encaminhamento de trigger de voz + superfície Canvas.
- Controlado via `opencraft nodes …`.

Runbook: [iOS connect](https://docs.opencraft.ai/platforms/ios).

### Node Android (opcional)

- Pareia como node WS via pareamento de dispositivo (`opencraft devices ...`).
- Expõe abas Connect/Chat/Voz mais Canvas, Câmera, Captura de tela e famílias de comandos de dispositivo Android.
- Runbook: [Android connect](https://docs.opencraft.ai/platforms/android).

## Workspace de Agente + Skills

- Raiz do workspace: `~/.opencraft/workspace` (configurável via `agents.defaults.workspace`).
- Arquivos de prompt injetados: `AGENTS.md`, `SOUL.md`, `TOOLS.md`.
- Skills: `~/.opencraft/workspace/skills/<skill>/SKILL.md`.

## Configuração

Arquivo mínimo `~/.opencraft/opencraft.json` (modelo + padrões):

```json5
{
  agent: {
    model: "anthropic/claude-opus-4-6",
  },
}
```

[Referência completa de configuração (todas as chaves + exemplos).](https://docs.opencraft.ai/gateway/configuration)

## Modelo de Segurança (importante)

- **Padrão:** tools rodam no host para a sessão **main**, então o agente tem acesso total quando é apenas você.
- **Segurança de grupo/canal:** defina `agents.defaults.sandbox.mode: "non-main"` para rodar **sessões não-main** (grupos/canais) dentro de sandboxes Docker por sessão; bash então roda no Docker para essas sessões.
- **Padrões de sandbox:** lista de permissão `bash`, `process`, `read`, `write`, `edit`, `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`; lista de bloqueio `browser`, `canvas`, `nodes`, `cron`, `discord`, `gateway`.

Detalhes: [Guia de segurança](https://docs.opencraft.ai/gateway/security) · [Docker + sandboxing](https://docs.opencraft.ai/install/docker) · [Config de sandbox](https://docs.opencraft.ai/gateway/configuration)

### [WhatsApp](https://docs.opencraft.ai/channels/whatsapp)

- Vincule o dispositivo: `pnpm opencraft channels login` (armazena credenciais em `~/.opencraft/credentials`).
- Liste quem pode falar com o assistente via `channels.whatsapp.allowFrom`.
- Se `channels.whatsapp.groups` está definido, torna-se uma lista de permissão de grupo; inclua `"*"` para permitir todos.

### [Telegram](https://docs.opencraft.ai/channels/telegram)

- Defina `TELEGRAM_BOT_TOKEN` ou `channels.telegram.botToken` (env vence).
- Opcional: defina `channels.telegram.groups` (com `channels.telegram.groups."*".requireMention`); quando definido, é uma lista de permissão de grupo (inclua `"*"` para permitir todos). Também `channels.telegram.allowFrom` ou `channels.telegram.webhookUrl` + `channels.telegram.webhookSecret` conforme necessário.

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

- Defina `DISCORD_BOT_TOKEN` ou `channels.discord.token`.
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

- Requer `signal-cli` e uma seção de config `channels.signal`.

### [BlueBubbles (iMessage)](https://docs.opencraft.ai/channels/bluebubbles)

- Integração iMessage **recomendada**.
- Configure `channels.bluebubbles.serverUrl` + `channels.bluebubbles.password` e um webhook (`channels.bluebubbles.webhookPath`).
- O servidor BlueBubbles roda no macOS; o Gateway pode rodar no macOS ou em outro lugar.

### [iMessage (legado)](https://docs.opencraft.ai/channels/imessage)

- Integração legada apenas para macOS via `imsg` (Mensagens deve estar conectado).
- Se `channels.imessage.groups` está definido, torna-se uma lista de permissão de grupo; inclua `"*"` para permitir todos.

### [Microsoft Teams](https://docs.opencraft.ai/channels/msteams)

- Configure um app Teams + Bot Framework, então adicione uma seção de config `msteams`.
- Liste quem pode falar via `msteams.allowFrom`; acesso de grupo via `msteams.groupAllowFrom` ou `msteams.groupPolicy: "open"`.

### [WebChat](https://docs.opencraft.ai/web/webchat)

- Usa o WebSocket do Gateway; sem porta/config separada do WebChat.

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

Use estes quando você já passou pelo fluxo de onboarding e quer a referência mais profunda.

- [Comece pelo índice de docs para navegação e "o que está onde."](https://docs.opencraft.ai)
- [Leia a visão geral de arquitetura para o modelo de gateway + protocolo.](https://docs.opencraft.ai/concepts/architecture)
- [Use a referência completa de configuração quando precisar de cada chave e exemplo.](https://docs.opencraft.ai/gateway/configuration)
- [Execute o Gateway seguindo o runbook operacional.](https://docs.opencraft.ai/gateway)
- [Aprenda como a Control UI/superfícies web funcionam e como expô-las com segurança.](https://docs.opencraft.ai/web)
- [Entenda o acesso remoto via túneis SSH ou tailnets.](https://docs.opencraft.ai/gateway/remote)
- [Siga o OpenCraft Onboard para uma configuração guiada.](https://docs.opencraft.ai/start/wizard)
- [Conecte gatilhos externos via superfície de webhook.](https://docs.opencraft.ai/automation/webhook)
- [Configure gatilhos Gmail Pub/Sub.](https://docs.opencraft.ai/automation/gmail-pubsub)
- [Aprenda os detalhes do app companion na barra de menu do macOS.](https://docs.opencraft.ai/platforms/mac/menu-bar)
- [Guias de plataforma: Windows (WSL2)](https://docs.opencraft.ai/platforms/windows), [Linux](https://docs.opencraft.ai/platforms/linux), [macOS](https://docs.opencraft.ai/platforms/macos), [iOS](https://docs.opencraft.ai/platforms/ios), [Android](https://docs.opencraft.ai/platforms/android)
- [Depure falhas comuns com o guia de solução de problemas.](https://docs.opencraft.ai/channels/troubleshooting)
- [Revise as orientações de segurança antes de expor qualquer coisa.](https://docs.opencraft.ai/gateway/security)

## Docs Avançados (descoberta + controle)

- [Descoberta + transportes](https://docs.opencraft.ai/gateway/discovery)
- [Bonjour/mDNS](https://docs.opencraft.ai/gateway/bonjour)
- [Pareamento de gateway](https://docs.opencraft.ai/gateway/pairing)
- [README de gateway remoto](https://docs.opencraft.ai/gateway/remote-gateway-readme)
- [Control UI](https://docs.opencraft.ai/web/control-ui)
- [Dashboard](https://docs.opencraft.ai/web/dashboard)

## Operações & Solução de Problemas

- [Verificações de saúde](https://docs.opencraft.ai/gateway/health)
- [Bloqueio do gateway](https://docs.opencraft.ai/gateway/gateway-lock)
- [Processo em background](https://docs.opencraft.ai/gateway/background-process)
- [Solução de problemas do browser (Linux)](https://docs.opencraft.ai/tools/browser-linux-troubleshooting)
- [Logging](https://docs.opencraft.ai/logging)

## Mergulhos Profundos

- [Loop do agente](https://docs.opencraft.ai/concepts/agent-loop)
- [Presença](https://docs.opencraft.ai/concepts/presence)
- [Schemas TypeBox](https://docs.opencraft.ai/concepts/typebox)
- [Adaptadores RPC](https://docs.opencraft.ai/reference/rpc)
- [Fila](https://docs.opencraft.ai/concepts/queue)

## Workspace & Skills

- [Config de skills](https://docs.opencraft.ai/tools/skills-config)
- [AGENTS padrão](https://docs.opencraft.ai/reference/AGENTS.default)
- [Templates: AGENTS](https://docs.opencraft.ai/reference/templates/AGENTS)
- [Templates: BOOTSTRAP](https://docs.opencraft.ai/reference/templates/BOOTSTRAP)
- [Templates: IDENTITY](https://docs.opencraft.ai/reference/templates/IDENTITY)
- [Templates: SOUL](https://docs.opencraft.ai/reference/templates/SOUL)
- [Templates: TOOLS](https://docs.opencraft.ai/reference/templates/TOOLS)
- [Templates: USER](https://docs.opencraft.ai/reference/templates/USER)

## Internos de Plataforma

- [Setup dev macOS](https://docs.opencraft.ai/platforms/mac/dev-setup)
- [Barra de menu macOS](https://docs.opencraft.ai/platforms/mac/menu-bar)
- [Voice wake macOS](https://docs.opencraft.ai/platforms/mac/voicewake)
- [Node iOS](https://docs.opencraft.ai/platforms/ios)
- [Node Android](https://docs.opencraft.ai/platforms/android)
- [Windows (WSL2)](https://docs.opencraft.ai/platforms/windows)
- [App Linux](https://docs.opencraft.ai/platforms/linux)

## Hooks de Email (Gmail)

- [docs.opencraft.ai/gmail-pubsub](https://docs.opencraft.ai/automation/gmail-pubsub)

## Molty

O OpenCraft foi construído para **Molty**, um assistente de IA lagosta espacial. 🦞
por Peter Steinberger e a comunidade.

- [opencraft.ai](https://opencraft.ai)
- [soul.md](https://soul.md)
- [steipete.me](https://steipete.me)
- [@opencraft](https://x.com/opencraft)

## Comunidade

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes, mantenedores e como enviar PRs.
PRs com IA/vibe-code são bem-vindos! 🤖

Agradecimento especial a [Mario Zechner](https://mariozechner.at/) pelo seu apoio e por
[pi-mono](https://github.com/badlogic/pi-mono).
Agradecimento especial a Adam Doppelt pelo lobster.bot.

Obrigado a todos os clawtributors:

<a href="https://github.com/openclaw/openclaw/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=openclaw/openclaw" />
</a>
