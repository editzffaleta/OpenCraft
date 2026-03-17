---
summary: "Capacidades do OpenCraft em canais, roteamento, mídia e UX."
read_when:
  - Você quer uma lista completa do que o OpenCraft suporta
title: "Features"
---

## Destaques

<Columns>
  <Card title="Canais" icon="message-square">
    WhatsApp, Telegram, Discord e iMessage com um único Gateway.
  </Card>
  <Card title="Plugins" icon="plug">
    Adicione Mattermost e mais com extensões.
  </Card>
  <Card title="Roteamento" icon="route">
    Roteamento multi-agente com sessões isoladas.
  </Card>
  <Card title="Mídia" icon="image">
    Imagens, áudio e documentos de entrada e saída.
  </Card>
  <Card title="Apps e UI" icon="monitor">
    Web Control UI e app companheiro para macOS.
  </Card>
  <Card title="Nodes móveis" icon="smartphone">
    Nodes iOS e Android com pareamento, voz/chat e comandos avançados de dispositivo.
  </Card>
</Columns>

## Lista completa

- Integração com WhatsApp via WhatsApp Web (Baileys)
- Suporte a Bot Telegram (grammY)
- Suporte a Bot Discord (channels.discord.js)
- Suporte a Bot Mattermost (Plugin)
- Integração com iMessage via CLI local imsg (macOS)
- Bridge de agente para Pi em modo RPC com streaming de ferramentas
- Streaming e chunking para respostas longas
- Roteamento multi-agente para sessões isoladas por workspace ou remetente
- Autenticação por assinatura para Anthropic e OpenAI via OAuth
- Sessões: chats diretos são consolidados em `main` compartilhado; grupos são isolados
- Suporte a chat em grupo com ativação baseada em menção
- Suporte a mídia para imagens, áudio e documentos
- Hook opcional de transcrição de nota de voz
- WebChat e app de barra de menu macOS
- Node iOS com pareamento, Canvas, câmera, gravação de tela, localização e recursos de voz
- Node Android com pareamento, aba Connect, sessões de chat, aba de voz, Canvas/câmera, além de comandos de dispositivo, notificações, contatos/calendário, movimento, fotos e SMS

<Note>
Os caminhos legados de Claude, Codex, Gemini e Opencode foram removidos. Pi é o único
caminho de agente de código.
</Note>
