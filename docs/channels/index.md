---
summary: "Plataformas de mensagens que o OpenCraft pode conectar"
read_when:
  - Você quer escolher um canal de chat para o OpenCraft
  - Você precisa de uma visão geral rápida das plataformas de mensagens suportadas
title: "Canais de Chat"
---

# Canais de Chat

O OpenCraft pode conversar com você em qualquer aplicativo de chat que você já usa. Cada canal se conecta via Gateway.
Texto é suportado em todos os lugares; mídia e reações variam por canal.

## Canais suportados

- [BlueBubbles](/channels/bluebubbles) — **Recomendado para iMessage**; usa a API REST do servidor macOS BlueBubbles com suporte completo de recursos (editar, desfazer, efeitos, reações, gerenciamento de grupos — editar atualmente quebrado no macOS 26 Tahoe).
- [Discord](/channels/discord) — Discord Bot API + Gateway; suporta servidores, canais e DMs.
- [Feishu](/channels/feishu) — Bot Feishu/Lark via WebSocket (plugin, instalado separadamente).
- [Google Chat](/channels/googlechat) — Aplicativo Google Chat API via webhook HTTP.
- [iMessage (legado)](/channels/imessage) — Integração macOS legada via CLI imsg (descontinuado, use BlueBubbles para novas configurações).
- [IRC](/channels/irc) — Servidores IRC clássicos; canais + DMs com controles de pareamento/lista de permissões.
- [LINE](/channels/line) — Bot LINE Messaging API (plugin, instalado separadamente).
- [Matrix](/channels/matrix) — Protocolo Matrix (plugin, instalado separadamente).
- [Mattermost](/channels/mattermost) — Bot API + WebSocket; canais, grupos, DMs (plugin, instalado separadamente).
- [Microsoft Teams](/channels/msteams) — Bot Framework; suporte empresarial (plugin, instalado separadamente).
- [Nextcloud Talk](/channels/nextcloud-talk) — Chat auto-hospedado via Nextcloud Talk (plugin, instalado separadamente).
- [Nostr](/channels/nostr) — DMs descentralizados via NIP-04 (plugin, instalado separadamente).
- [Signal](/channels/signal) — signal-cli; focado em privacidade.
- [Synology Chat](/channels/synology-chat) — Synology NAS Chat via webhooks saintes+entradas (plugin, instalado separadamente).
- [Slack](/channels/slack) — Bolt SDK; aplicativos de espaço de trabalho.
- [Telegram](/channels/telegram) — Bot API via grammY; suporta grupos.
- [Tlon](/channels/tlon) — Mensageiro baseado em Urbit (plugin, instalado separadamente).
- [Twitch](/channels/twitch) — Chat Twitch via conexão IRC (plugin, instalado separadamente).
- [WebChat](/web/webchat) — Gateway WebChat UI sobre WebSocket.
- [WhatsApp](/channels/whatsapp) — O mais popular; usa Baileys e requer pareamento QR.
- [Zalo](/channels/zalo) — Zalo Bot API; mensageiro popular do Vietnã (plugin, instalado separadamente).
- [Zalo Personal](/channels/zalouser) — Conta pessoal Zalo via login QR (plugin, instalado separadamente).

## Notas

- Os canais podem ser executados simultaneamente; configure vários e o OpenCraft será roteado por chat.
- A configuração mais rápida geralmente é **Telegram** (token de bot simples). WhatsApp requer pareamento QR e
  armazena mais estado em disco.
- O comportamento do grupo varia por canal; veja [Grupos](/channels/groups).
- Pareamento DM e listas de permissões são aplicados por segurança; veja [Segurança](/gateway/security).
- Solução de problemas: [Solução de problemas do canal](/channels/troubleshooting).
- Provedores de modelos são documentados separadamente; veja [Provedores de Modelos](/providers/models).
