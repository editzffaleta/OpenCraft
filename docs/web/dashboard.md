---
summary: "Acesso e auth do dashboard do Gateway (Control UI)"
read_when:
  - Mudando autenticação ou modos de exposição do dashboard
title: "Dashboard"
---

# Dashboard (Control UI)

O dashboard do Gateway é a Control UI no browser servida em `/` por padrão
(sobrescrever com `gateway.controlUi.basePath`).

Abertura rápida (Gateway local):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Referências principais:

- [Control UI](/web/control-ui) para uso e capacidades da UI.
- [Tailscale](/gateway/tailscale) para automação de Serve/Funnel.
- [Superfícies Web](/web) para modos de bind e notas de segurança.

A autenticação é aplicada no handshake WebSocket via `connect.params.auth`
(token ou senha). Veja `gateway.auth` em [Configuração do Gateway](/gateway/configuration).

Nota de segurança: a Control UI é uma **superfície de admin** (chat, config, aprovações de exec).
Não a exponha publicamente. A UI mantém tokens de URL do dashboard no sessionStorage
para a sessão do tab atual do browser e URL do gateway selecionado, e os remove da URL após o carregamento.
Prefira localhost, Tailscale Serve ou um túnel SSH.

## Caminho rápido (recomendado)

- Após o onboarding, o CLI abre automaticamente o dashboard e imprime um link limpo (sem token).
- Reabrir a qualquer momento: `opencraft dashboard` (copia o link, abre o browser se possível, mostra dica SSH se headless).
- Se a UI pedir auth, cole o token de `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`) nas configurações da Control UI.

## Noções básicas de token (local vs remoto)

- **Localhost**: abra `http://127.0.0.1:18789/`.
- **Fonte do token**: `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`); `opencraft dashboard` pode passá-lo via fragmento de URL para bootstrap único, e a Control UI o mantém no sessionStorage para a sessão do tab atual do browser e URL do gateway selecionado em vez do localStorage.
- Se `gateway.auth.token` é gerenciado por SecretRef, `opencraft dashboard` imprime/copia/abre uma URL sem token por design. Isso evita expor tokens gerenciados externamente em logs de shell, histórico de clipboard ou argumentos de lançamento do browser.
- Se `gateway.auth.token` está configurado como SecretRef e não está resolvido no seu shell atual, `opencraft dashboard` ainda imprime uma URL sem token mais orientações acionáveis de configuração de auth.
- **Não-localhost**: use Tailscale Serve (sem token para Control UI/WebSocket se `gateway.auth.allowTailscale: true`, assume host de gateway confiável; APIs HTTP ainda precisam de token/senha), bind tailnet com token ou túnel SSH. Veja [Superfícies Web](/web).

## Se você vir "unauthorized" / 1008

- Certifique-se de que o gateway é acessível (local: `opencraft status`; remoto: túnel SSH `ssh -N -L 18789:127.0.0.1:18789 usuario@host` então abra `http://127.0.0.1:18789/`).
- Para `AUTH_TOKEN_MISMATCH`, clientes podem fazer uma tentativa confiável com um token de dispositivo em cache quando o gateway retorna dicas de retry. Se a auth ainda falhar após essa tentativa, resolva a deriva de token manualmente.
- Para etapas de reparo de deriva de token, siga o [Checklist de recuperação de deriva de token](/cli/devices#token-drift-recovery-checklist).
- Recupere ou forneça o token do host do gateway:
  - Config em texto simples: `opencraft config get gateway.auth.token`
  - Config gerenciada por SecretRef: resolva o provedor de segredo externo ou exporte `OPENCLAW_GATEWAY_TOKEN` neste shell, então reexecute `opencraft dashboard`
  - Sem token configurado: `opencraft doctor --generate-gateway-token`
- Nas configurações do dashboard, cole o token no campo de auth e conecte.
