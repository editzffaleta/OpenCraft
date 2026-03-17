---
summary: "Etapas de verificação de saúde para conectividade de canais"
read_when:
  - Diagnosticando saúde do canal WhatsApp
title: "Health Checks"
---

# Health Checks (CLI)

Guia rápido para verificar a conectividade dos canais sem adivinhação.

## Verificações rápidas

- `opencraft status` — resumo local: alcançabilidade/modo do gateway, dica de atualização, idade da auth de canais vinculados, sessões + atividade recente.
- `opencraft status --all` — diagnóstico local completo (somente leitura, colorido, seguro para colar ao debugar).
- `opencraft status --deep` — também sonda o Gateway em execução (sondas por canal quando suportado).
- `opencraft health --json` — solicita ao Gateway em execução um snapshot completo de saúde (apenas WS; sem socket Baileys direto).
- Envie `/status` como mensagem standalone no WhatsApp/WebChat para obter uma resposta de status sem invocar o agente.
- Logs: faça tail em `/tmp/editzffaleta/OpenCraft-*.log` e filtre por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnósticos aprofundados

- Credenciais em disco: `ls -l ~/.opencraft/credentials/whatsapp/<accountId>/creds.json` (mtime deve ser recente).
- Store de sessão: `ls -l ~/.opencraft/agents/<agentId>/sessions/sessions.json` (o caminho pode ser sobrescrito na config). Contagem e destinatários recentes são exibidos via `status`.
- Fluxo de revinculação: `opencraft channels logout && opencraft channels login --verbose` quando códigos de status 409–515 ou `loggedOut` aparecem nos logs. (Nota: o fluxo de login por QR reinicia automaticamente uma vez para status 515 após o pairing.)

## Config do health monitor

- `gateway.channelHealthCheckMinutes`: frequência com que o gateway verifica a saúde dos canais. Padrão: `5`. Defina `0` para desabilitar health-monitor restarts globalmente.
- `gateway.channelStaleEventThresholdMinutes`: quanto tempo um canal conectado pode ficar ocioso antes que o health monitor o trate como obsoleto e o reinicie. Padrão: `30`. Mantenha isso maior ou igual a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite de uma hora rolante para health-monitor restarts por canal/conta. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: desabilitar health-monitor restarts para um canal específico mantendo o monitoramento global habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override multi-conta que prevalece sobre a configuração de nível de canal.
- Esses overrides por canal se aplicam aos monitores de canais built-in que os expõem hoje: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Quando algo falha

- `logged out` ou status 409–515 → revincule com `opencraft channels logout` e depois `opencraft channels login`.
- Gateway inacessível → inicie-o: `opencraft gateway --port 18789` (use `--force` se a porta estiver ocupada).
- Sem mensagens inbound → confirme que o telefone vinculado está online e o remetente é permitido (`channels.whatsapp.allowFrom`); para chats de grupo, garanta que regras de allowlist + mention correspondam (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando "health" dedicado

`opencraft health --json` solicita ao Gateway em execução seu snapshot de saúde (sem sockets de canal diretos do CLI). Ele reporta credenciais vinculadas/idade da auth quando disponível, resumos de sondas por canal, resumo do session-store e duração da sonda. Sai com código diferente de zero se o Gateway estiver inacessível ou a sonda falhar/expirar. Use `--timeout <ms>` para sobrescrever o padrão de 10s.
