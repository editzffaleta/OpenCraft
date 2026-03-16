---
summary: "Semântica de reações compartilhada entre canais"
read_when:
  - Trabalhando com reações em qualquer canal
title: "Reações"
---

# Ferramenta de reações

Semântica de reações compartilhada entre canais:

- `emoji` é obrigatório ao adicionar uma reação.
- `emoji=""` remove a(s) reação(ões) do bot quando suportado.
- `remove: true` remove o emoji especificado quando suportado (requer `emoji`).

Notas por canal:

- **Discord/Slack**: `emoji` vazio remove todas as reações do bot na mensagem; `remove: true` remove apenas aquele emoji.
- **Google Chat**: `emoji` vazio remove as reações do app na mensagem; `remove: true` remove apenas aquele emoji.
- **Telegram**: `emoji` vazio remove as reações do bot; `remove: true` também remove reações, mas ainda requer um `emoji` não vazio para validação da tool.
- **WhatsApp**: `emoji` vazio remove a reação do bot; `remove: true` mapeia para emoji vazio (ainda requer `emoji`).
- **Zalo Pessoal (`zalouser`)**: requer `emoji` não vazio; `remove: true` remove aquela reação de emoji específica.
- **Signal**: notificações de reação de entrada emitem eventos de sistema quando `channels.signal.reactionNotifications` está habilitado.
