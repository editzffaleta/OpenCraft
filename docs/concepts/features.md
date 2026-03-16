---
summary: "Capacidades do OpenCraft em canais, roteamento, mídia e UX."
read_when:
  - Você quer uma lista completa do que o OpenCraft suporta
title: "Funcionalidades"
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
    UI de Controle web e app companheiro macOS.
  </Card>
  <Card title="Nós móveis" icon="smartphone">
    Nós iOS e Android com pareamento, voz/chat e comandos ricos de dispositivo.
  </Card>
</Columns>

## Lista completa

- Integração WhatsApp via WhatsApp Web (Baileys)
- Suporte a bot Telegram (grammY)
- Suporte a bot Discord (channels.discord.js)
- Suporte a bot Mattermost (plugin)
- Integração iMessage via CLI imsg local (macOS)
- Bridge de agente para Pi em modo RPC com streaming de ferramentas
- Streaming e chunking para respostas longas
- Roteamento multi-agente para sessões isoladas por workspace ou remetente
- Auth de assinatura para Anthropic e OpenAI via OAuth
- Sessões: chats diretos colapsam em `main` compartilhado; grupos são isolados
- Suporte a chat em grupo com ativação baseada em menção
- Suporte a mídia para imagens, áudio e documentos
- Hook opcional de transcrição de nota de voz
- WebChat e app de barra de menus macOS
- Nó iOS com pareamento, Canvas, câmera, gravação de tela, localização e recursos de voz
- Nó Android com pareamento, aba Conectar, sessões de chat, aba de voz, Canvas/câmera, mais comandos de dispositivo, notificações, contatos/calendário, movimento, fotos e SMS

<Note>
Caminhos legados Claude, Codex, Gemini e Opencode foram removidos. Pi é o único
caminho de agente de código.
</Note>
