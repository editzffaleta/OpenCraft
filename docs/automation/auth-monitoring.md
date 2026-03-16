---
summary: "Monitorar expiração de OAuth para provedores de modelo"
read_when:
  - Configurando monitoramento ou alertas de expiração de auth
  - Automatizando verificações de refresh de OAuth do Claude Code / Codex
title: "Monitoramento de Auth"
---

# Monitoramento de auth

O OpenCraft expõe saúde de expiração de OAuth via `opencraft models status`. Use isso para
automação e alertas; scripts são extras opcionais para fluxos de trabalho com celular.

## Preferido: verificação via CLI (portável)

```bash
opencraft models status --check
```

Códigos de saída:

- `0`: OK
- `1`: credenciais expiradas ou ausentes
- `2`: expirando em breve (dentro de 24h)

Funciona em cron/systemd e não requer scripts extras.

## Scripts opcionais (ops / fluxos com celular)

Esses ficam em `scripts/` e são **opcionais**. Assumem acesso SSH ao host do
gateway e são ajustados para systemd + Termux.

- `scripts/claude-auth-status.sh` agora usa `opencraft models status --json` como
  fonte da verdade (com fallback para leitura direta de arquivos se o CLI não estiver disponível),
  então mantenha o `opencraft` no `PATH` para timers.
- `scripts/auth-monitor.sh`: alvo de timer cron/systemd; envia alertas (ntfy ou celular).
- `scripts/systemd/openclaw-auth-monitor.{service,timer}`: timer de usuário systemd.
- `scripts/claude-auth-status.sh`: verificador de auth Claude Code + OpenCraft (full/json/simple).
- `scripts/mobile-reauth.sh`: fluxo guiado de re-auth via SSH.
- `scripts/termux-quick-auth.sh`: status de widget one-tap + abrir URL de auth.
- `scripts/termux-auth-widget.sh`: fluxo completo de widget guiado.
- `scripts/termux-sync-widget.sh`: sincronizar credenciais do Claude Code → OpenCraft.

Se você não precisa de automação com celular ou timers systemd, pule esses scripts.
