---
summary: "Logins manuais para automação de browser + postagem no X/Twitter"
read_when:
  - Você precisa fazer login em sites para automação de browser
  - Você quer postar atualizações no X/Twitter
title: "Login no Browser"
---

# Login no browser + postagem no X/Twitter

## Login manual (recomendado)

Quando um site requer login, **faça login manualmente** no perfil de browser do **host** (o browser opencraft).

**Não** forneça suas credenciais ao modelo. Logins automatizados frequentemente disparam defesas anti-bot e podem bloquear a conta.

Voltar para a documentação principal do browser: [Browser](/tools/browser).

## Qual perfil do Chrome é usado?

O OpenCraft controla um **perfil dedicado do Chrome** (chamado `opencraft`, com UI em tom laranja). Isso é separado do seu perfil de browser do dia a dia.

Para chamadas de ferramenta de browser do agente:

- Escolha padrão: o agente deve usar seu browser `opencraft` isolado.
- Use `profile="user"` apenas quando sessões logadas existentes importam e o usuário está no computador para clicar/aprovar qualquer prompt de conexão.
- Se você tiver múltiplos perfis de browser de usuário, especifique o perfil explicitamente em vez de adivinhar.

Duas formas fáceis de acessá-lo:

1. **Peça ao agente para abrir o browser** e depois faça login você mesmo.
2. **Abra via CLI**:

```bash
opencraft browser start
opencraft browser open https://x.com
```

Se você tiver múltiplos perfis, passe `--browser-profile <name>` (o padrão é `opencraft`).

## X/Twitter: fluxo recomendado

- **Ler/pesquisar/threads:** use o browser do **host** (login manual).
- **Postar atualizações:** use o browser do **host** (login manual).

## Sandbox + acesso ao browser do host

Sessões de browser em sandbox são **mais propensas** a disparar detecção de bot. Para X/Twitter (e outros sites rigorosos), prefira o browser do **host**.

Se o agente estiver em sandbox, a ferramenta de browser usa o sandbox por padrão. Para permitir controle do host:

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

Depois aponte para o browser do host:

```bash
opencraft browser open https://x.com --browser-profile opencraft --target host
```

Ou desabilite o sandbox para o agente que posta atualizações.
