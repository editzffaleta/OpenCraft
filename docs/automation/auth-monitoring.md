---
summary: "Monitorar expiração de OAuth para provedores de modelo"
read_when:
  - Configurando monitoramento de expiração de autenticação ou alertas
  - Automatizando verificações de atualização de OAuth do Claude Code / Codex
title: "Auth Monitoring"
---

# Monitoramento de autenticação

O OpenCraft expõe a saúde de expiração OAuth via `opencraft models status`. Use isso para
automação e alertas; os scripts são extras opcionais para fluxos de trabalho no celular.

## Preferido: verificação via CLI (portável)

```bash
opencraft models status --check
```

Códigos de saída:

- `0`: OK
- `1`: credenciais expiradas ou ausentes
- `2`: expirando em breve (dentro de 24h)

Isso funciona em Cron/systemd e não requer scripts extras.

## Scripts opcionais (ops / fluxos de trabalho no celular)

Estes ficam em `scripts/` e são **opcionais**. Eles assumem acesso SSH ao
host do Gateway e são ajustados para systemd + Termux.

- `scripts/claude-auth-status.sh` agora usa `opencraft models status --json` como
  fonte da verdade (recorrendo a leituras diretas de arquivo se o CLI não estiver disponível),
  então mantenha `opencraft` no `PATH` para timers.
- `scripts/auth-monitor.sh`: alvo de timer Cron/systemd; envia alertas (ntfy ou celular).
- `scripts/systemd/opencraft-auth-monitor.{service,timer}`: timer de usuário systemd.
- `scripts/claude-auth-status.sh`: verificador de autenticação do Claude Code + OpenCraft (completo/json/simples).
- `scripts/mobile-reauth.sh`: fluxo guiado de re‑autenticação via SSH.
- `scripts/termux-quick-auth.sh`: widget de status com um toque + abrir URL de autenticação.
- `scripts/termux-auth-widget.sh`: fluxo completo de widget guiado.
- `scripts/termux-sync-widget.sh`: sincronizar credenciais do Claude Code → OpenCraft.

Se você não precisa de automação no celular ou timers systemd, pule esses scripts.
