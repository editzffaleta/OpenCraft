---
summary: "Logins manuais para automação de browser + postagem no X/Twitter"
read_when:
  - Você precisa fazer login em sites para automação de browser
  - Você quer postar atualizações no X/Twitter
title: "Login no Browser"
---

# Login no browser + postagem no X/Twitter

## Login manual (recomendado)

Quando um site requer login, **faça login manualmente** no perfil de browser do **host** (o browser do opencraft).

**Não** forneça suas credenciais ao modelo. Logins automatizados frequentemente acionam defesas anti-bot e podem bloquear a conta.

De volta à documentação principal do browser: [Browser](/tools/browser).

## Qual perfil do Chrome é usado?

O OpenCraft controla um **perfil dedicado do Chrome** (chamado `openclaw`, com interface laranja). Isso é separado do seu perfil de browser diário.

Para chamadas de tool de browser do agente:

- Escolha padrão: o agente deve usar seu browser `openclaw` isolado.
- Use `profile="user"` apenas quando sessões com login existentes importam e o usuário está no computador para clicar/aprovar qualquer prompt de conexão.
- Use `profile="chrome-relay"` apenas para o fluxo de conexão via extensão Chrome / botão da barra de ferramentas.
- Se você tiver múltiplos perfis de browser de usuário, especifique o perfil explicitamente em vez de adivinhar.

Duas formas fáceis de acessá-lo:

1. **Peça ao agente para abrir o browser** e então faça login você mesmo.
2. **Abra via CLI**:

```bash
opencraft browser start
opencraft browser open https://x.com
```

Se você tiver múltiplos perfis, passe `--browser-profile <nome>` (o padrão é `openclaw`).

## X/Twitter: fluxo recomendado

- **Ler/pesquisar/threads:** use o browser do **host** (login manual).
- **Postar atualizações:** use o browser do **host** (login manual).

## Sandboxing + acesso ao browser do host

Sessões de browser em sandbox são **mais propensas** a acionar detecção de bot. Para X/Twitter (e outros sites restritos), prefira o browser do **host**.

Se o agente estiver em sandbox, a tool de browser usa o sandbox por padrão. Para permitir controle do host:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

Então aponte para o browser do host:

```bash
opencraft browser open https://x.com --browser-profile openclaw --target host
```

Ou desabilite o sandboxing para o agente que posta atualizações.
