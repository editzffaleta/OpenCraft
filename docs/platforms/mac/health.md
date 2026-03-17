---
summary: "Como o aplicativo macOS relata estados de integridade do Gateway/Baileys"
read_when:
  - Depurando indicadores de integridade do aplicativo macOS
title: "Verificações de Integridade"
---

# Verificações de Integridade no macOS

Como ver se o canal vinculado está saudável a partir do aplicativo da barra de menus.

## Barra de menus

- O ponto de status agora reflete a integridade do Baileys:
  - Verde: vinculado + socket aberto recentemente.
  - Laranja: conectando/tentando novamente.
  - Vermelho: desconectado ou sondagem falhou.
- A linha secundária mostra "linked · auth 12m" ou exibe o motivo da falha.
- O item de menu "Run Health Check" dispara uma sondagem sob demanda.

## Configurações

- A aba General ganha um card de Integridade mostrando: idade da autenticação vinculada, caminho/contagem do armazenamento de sessão, hora da última verificação, último erro/código de status, e botões para Run Health Check / Reveal Logs.
- Usa um snapshot em cache para que a UI carregue instantaneamente e funcione graciosamente quando offline.
- A **aba Channels** exibe status do canal + controles para WhatsApp/Telegram (QR de login, logout, sondagem, última desconexão/erro).

## Como a sondagem funciona

- O aplicativo executa `opencraft health --json` via `ShellExecutor` a cada ~60s e sob demanda. A sondagem carrega credenciais e relata o status sem enviar mensagens.
- Faz cache do último snapshot bom e do último erro separadamente para evitar oscilação; mostra o timestamp de cada um.

## Em caso de dúvida

- Você ainda pode usar o fluxo da CLI em [Integridade do Gateway](/gateway/health) (`opencraft status`, `opencraft status --deep`, `opencraft health --json`) e acompanhar `/tmp/editzffaleta/OpenCraft-*.log` para `web-heartbeat` / `web-reconnect`.
