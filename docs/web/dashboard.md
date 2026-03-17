---
summary: "Acesso e autenticação do dashboard do Gateway (Control UI)"
read_when:
  - Alterando autenticação ou modos de exposição do dashboard
title: "Dashboard"
---

# Dashboard (Control UI)

O dashboard do Gateway é a Control UI no navegador servida em `/` por padrão
(sobrescreva com `gateway.controlUi.basePath`).

Abertura rápida (Gateway local):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Referências principais:

- [Control UI](/web/control-ui) para uso e capacidades da interface.
- [Tailscale](/gateway/tailscale) para automação Serve/Funnel.
- [Superfícies web](/web) para modos de bind e notas de segurança.

A autenticação é aplicada no handshake WebSocket via `connect.params.auth`
(Token ou senha). Veja `gateway.auth` em [Configuração do Gateway](/gateway/configuration).

Nota de segurança: a Control UI é uma **superfície administrativa** (chat, config, aprovações de exec).
Não a exponha publicamente. A interface mantém Tokens de URL do dashboard no sessionStorage
para a sessão atual da aba do navegador e URL do Gateway selecionada, e os remove da URL após o carregamento.
Prefira localhost, Tailscale Serve ou um túnel SSH.

## Caminho rápido (recomendado)

- Após o onboarding, o CLI abre automaticamente o dashboard e imprime um link limpo (sem Token).
- Reabra a qualquer momento: `opencraft dashboard` (copia o link, abre o navegador se possível, mostra dica de SSH se headless).
- Se a interface solicitar autenticação, cole o Token de `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`) nas configurações da Control UI.

## Noções básicas de Token (local vs remoto)

- **Localhost**: abra `http://127.0.0.1:18789/`.
- **Origem do Token**: `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`); `opencraft dashboard` pode passá-lo via fragmento de URL para bootstrap único, e a Control UI o mantém no sessionStorage para a sessão atual da aba do navegador e URL do Gateway selecionada em vez do localStorage.
- Se `gateway.auth.token` é gerenciado por SecretRef, `opencraft dashboard` imprime/copia/abre uma URL sem Token por design. Isso evita expor Tokens gerenciados externamente em logs de shell, histórico da área de transferência ou argumentos de lançamento do navegador.
- Se `gateway.auth.token` está configurado como SecretRef e está sem resolução no seu shell atual, `opencraft dashboard` ainda imprime uma URL sem Token mais orientação acionável de configuração de autenticação.
- **Não localhost**: use Tailscale Serve (sem Token para Control UI/WebSocket se `gateway.auth.allowTailscale: true`, assume host do Gateway confiável; APIs HTTP ainda precisam de Token/senha), bind tailnet com Token, ou túnel SSH. Veja [Superfícies web](/web).

## Se você vir "unauthorized" / 1008

- Certifique-se de que o Gateway está acessível (local: `opencraft status`; remoto: túnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` depois abra `http://127.0.0.1:18789/`).
- Para `AUTH_TOKEN_MISMATCH`, clientes podem fazer uma retentativa confiável com um Token de dispositivo em cache quando o Gateway retorna dicas de retentativa. Se a autenticação ainda falhar após essa retentativa, resolva a divergência de Token manualmente.
- Para etapas de reparo de divergência de Token, siga a [Lista de verificação de recuperação de divergência de Token](/cli/devices#token-drift-recovery-checklist).
- Recupere ou forneça o Token do host do Gateway:
  - Config em texto plano: `opencraft config get gateway.auth.token`
  - Config gerenciado por SecretRef: resolva o provedor de segredos externo ou exporte `OPENCLAW_GATEWAY_TOKEN` neste shell, depois execute novamente `opencraft dashboard`
  - Nenhum Token configurado: `opencraft doctor --generate-gateway-token`
- Nas configurações do dashboard, cole o Token no campo de autenticação, depois conecte.
