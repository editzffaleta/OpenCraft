---
summary: "Passos de verificação de saúde para conectividade de canais"
read_when:
  - Diagnosticando saúde do canal WhatsApp
title: "Verificações de Saúde"
---

# Verificações de Saúde (CLI)

Guia rápido para verificar conectividade de canais sem precisar adivinhar.

## Verificações rápidas

- `opencraft status` — resumo local: acessibilidade/modo do gateway, hint de atualização, idade de auth do canal vinculado, sessões + atividade recente.
- `opencraft status --all` — diagnóstico local completo (somente leitura, colorido, seguro para colar ao depurar).
- `opencraft status --deep` — também verifica o Gateway em execução (probes por canal quando suportado).
- `opencraft health --json` — pede ao Gateway em execução um snapshot completo de saúde (somente WS; sem socket Baileys direto).
- Envie `/status` como mensagem standalone no WhatsApp/WebChat para obter uma resposta de status sem invocar o agente.
- Logs: monitore `/tmp/openclaw/openclaw-*.log` e filtre por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnósticos profundos

- Credenciais em disco: `ls -l ~/.opencraft/credentials/whatsapp/<accountId>/creds.json` (mtime deve ser recente).
- Session store: `ls -l ~/.opencraft/agents/<agentId>/sessions/sessions.json` (path pode ser substituído na config). Contagem e destinatários recentes aparecem via `status`.
- Fluxo de reconexão: `opencraft channels logout && opencraft channels login --verbose` quando aparecerem códigos de status 409–515 ou `loggedOut` nos logs. (Nota: o fluxo de login QR reinicia automaticamente uma vez para status 515 após o pareamento.)

## Quando algo falha

- `logged out` ou status 409–515 → reconecte com `opencraft channels logout` e depois `opencraft channels login`.
- Gateway inacessível → inicie-o: `opencraft gateway --port 18789` (use `--force` se a porta estiver ocupada).
- Sem mensagens recebidas → confirme que o telefone vinculado está online e que o remetente é permitido (`channels.whatsapp.allowFrom`); para chats em grupo, certifique-se de que as regras de allowlist + menção correspondem (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando "health" dedicado

`opencraft health --json` pede ao Gateway em execução seu snapshot de saúde (sem sockets de canal diretos do CLI). Ele reporta credenciais/idade de auth vinculados quando disponíveis, resumos de probe por canal, resumo do session-store e duração do probe. Sai com código não-zero se o Gateway estiver inacessível ou o probe falhar/expirar. Use `--timeout <ms>` para substituir o padrão de 10s.
