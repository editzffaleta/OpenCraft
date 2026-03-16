---
summary: "Como o app macOS reporta estados de saúde do gateway/Baileys"
read_when:
  - Depurando indicadores de saúde do app mac
title: "Verificações de Saúde"
---

# Verificações de Saúde no macOS

Como ver se o canal vinculado está saudável a partir do app de barra de menu.

## Barra de menu

- O ponto de status agora reflete a saúde do Baileys:
  - Verde: vinculado + socket aberto recentemente.
  - Laranja: conectando/tentando novamente.
  - Vermelho: desconectado ou probe falhou.
- A linha secundária lê "linked · auth 12m" ou mostra o motivo da falha.
- O item de menu "Run Health Check" dispara um probe sob demanda.

## Configurações

- A aba Geral ganha um card de Saúde mostrando: idade do auth vinculado, caminho/contagem do session-store, horário da última verificação, último erro/código de status, e botões para Run Health Check / Reveal Logs.
- Usa um snapshot em cache para que a UI carregue instantaneamente e faça fallback graciosamente quando offline.
- **Aba Canais** expõe status de canal + controles para WhatsApp/Telegram (login QR, logout, probe, último disconnect/erro).

## Como o probe funciona

- O app executa `opencraft health --json` via `ShellExecutor` a cada ~60s e sob demanda. O probe carrega as credenciais e reporta o status sem enviar mensagens.
- Armazena em cache o último snapshot bom e o último erro separadamente para evitar flickering; mostra o timestamp de cada um.

## Em caso de dúvida

- Você ainda pode usar o fluxo CLI em [Saúde do Gateway](/gateway/health) (`opencraft status`, `opencraft status --deep`, `opencraft health --json`) e acompanhar `/tmp/openclaw/openclaw-*.log` por `web-heartbeat` / `web-reconnect`.
