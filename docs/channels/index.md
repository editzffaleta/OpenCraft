---
summary: "Plataformas de mensagens às quais o OpenCraft pode se conectar"
read_when:
  - Você quer escolher um canal de chat para o OpenCraft
  - Você precisa de uma visão geral rápida das plataformas de mensagens suportadas
title: "Canais de Chat"
---

# Canais de Chat

O OpenCraft pode conversar com você em qualquer app de chat que você já usa. Cada canal se conecta via Gateway.
Texto é suportado em todos; mídia e reações variam por canal.

## Canais suportados

- [BlueBubbles](/channels/bluebubbles) — **Recomendado para iMessage**; usa a API REST do servidor macOS BlueBubbles com suporte completo de recursos (editar, desfazer envio, efeitos, reações, gerenciamento de grupos — editar atualmente com problemas no macOS 26 Tahoe).
- [Discord](/channels/discord) — Discord Bot API + Gateway; suporta servidores, canais e DMs.
- [Feishu](/channels/feishu) — Bot Feishu/Lark via WebSocket (plugin, instalado separadamente).
- [Google Chat](/channels/googlechat) — App Google Chat API via webhook HTTP.
- [iMessage (legado)](/channels/imessage) — Integração macOS legada via CLI imsg (descontinuado, use BlueBubbles para novas configurações).
- [IRC](/channels/irc) — Servidores IRC clássicos; canais + DMs com controles de pareamento/lista de permissão.
- [LINE](/channels/line) — Bot da LINE Messaging API (plugin, instalado separadamente).
- [Matrix](/channels/matrix) — Protocolo Matrix (plugin, instalado separadamente).
- [Mattermost](/channels/mattermost) — Bot API + WebSocket; canais, grupos, DMs (plugin, instalado separadamente).
- [Microsoft Teams](/channels/msteams) — Bot Framework; suporte corporativo (plugin, instalado separadamente).
- [Nextcloud Talk](/channels/nextcloud-talk) — Chat auto-hospedado via Nextcloud Talk (plugin, instalado separadamente).
- [Nostr](/channels/nostr) — DMs descentralizados via NIP-04 (plugin, instalado separadamente).
- [Signal](/channels/signal) — signal-cli; focado em privacidade.
- [Synology Chat](/channels/synology-chat) — Chat Synology NAS via webhooks de entrada+saída (plugin, instalado separadamente).
- [Slack](/channels/slack) — Bolt SDK; apps de workspace.
- [Telegram](/channels/telegram) — Bot API via grammY; suporta grupos.
- [Tlon](/channels/tlon) — Messenger baseado em Urbit (plugin, instalado separadamente).
- [Twitch](/channels/twitch) — Chat do Twitch via conexão IRC (plugin, instalado separadamente).
- [WebChat](/web/webchat) — UI de WebChat do Gateway via WebSocket.
- [WhatsApp](/channels/whatsapp) — Mais popular; usa Baileys e requer pareamento por QR.
- [Zalo](/channels/zalo) — Zalo Bot API; mensageiro popular no Vietnã (plugin, instalado separadamente).
- [Zalo Pessoal](/channels/zalouser) — Conta pessoal Zalo via login por QR (plugin, instalado separadamente).

## Notas

- Canais podem rodar simultaneamente; configure múltiplos e o OpenCraft roteará por chat.
- A configuração mais rápida geralmente é o **Telegram** (token de bot simples). O WhatsApp requer pareamento por QR e armazena mais estado em disco.
- O comportamento em grupos varia por canal; veja [Grupos](/channels/groups).
- O pareamento de DMs e listas de permissão são aplicados por segurança; veja [Segurança](/gateway/security).
- Solução de problemas: [Solução de problemas de canal](/channels/troubleshooting).
- Provedores de modelos são documentados separadamente; veja [Provedores de Modelos](/providers/models).
