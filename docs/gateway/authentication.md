---
summary: "Autenticação de modelo: OAuth, chaves de API e setup-token"
read_when:
  - Depurando auth de modelo ou expiração de OAuth
  - Documentando autenticação ou armazenamento de credenciais
title: "Authentication"
---

# Autenticação

OpenCraft suporta OAuth e chaves de API para provedores de modelo. Para hosts gateway always-on,
chaves de API são geralmente a opção mais previsível. Fluxos de assinatura/OAuth
também são suportados quando correspondem ao modelo da sua conta de provedor.

Veja [/concepts/oauth](/concepts/oauth) para o fluxo OAuth completo e layout
de armazenamento.
Para auth baseada em SecretRef (`env`/`file`/`exec` providers), veja [Secrets Management](/gateway/secrets).
Para regras de elegibilidade/código-de-razão de credencial usadas por `models status --probe`, veja
[Auth Credential Semantics](/auth-credential-semantics).

## Setup recomendado (chave de API, qualquer provedor)

Se você estiver rodando um gateway de longa duração, comece com uma chave de API para seu provedor escolhido.
Para Anthropic especificamente, auth por chave de API é o caminho seguro e é recomendado
em vez de auth por setup-token de assinatura.

1. Crie uma chave de API no console do seu provedor.
2. Coloque-a no **host do gateway** (a máquina rodando `opencraft gateway`).

```bash
export <PROVIDER>_API_KEY="..."
opencraft models status
```

3. Se o Gateway rodar sob systemd/launchd, prefira colocar a chave em
   `~/.opencraft/.env` para que o daemon possa lê-la:

```bash
cat >> ~/.opencraft/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Depois reinicie o daemon (ou reinicie seu processo do Gateway) e verifique novamente:

```bash
opencraft models status
opencraft doctor
```

Se preferir não gerenciar vars de env por conta própria, o wizard de onboarding pode armazenar
chaves de API para uso no daemon: `opencraft onboard`.

Veja [Help](/help) para detalhes sobre herança de env (`env.shellEnv`,
`~/.opencraft/.env`, systemd/launchd).

## Anthropic: setup-token (auth de assinatura)

Se você estiver usando uma assinatura Claude, o fluxo de setup-token é suportado. Rode
no **host do gateway**:

```bash
claude setup-token
```

Depois cole no OpenCraft:

```bash
opencraft models auth setup-token --provider anthropic
```

Se o token foi criado em outra máquina, cole manualmente:

```bash
opencraft models auth paste-token --provider anthropic
```

Se você ver um erro Anthropic como:

```
This credential is only authorized for use with Claude Code and cannot be used for other API requests.
```

…use uma chave de API Anthropic.

<Warning>
O suporte a setup-token Anthropic é apenas compatibilidade técnica. A Anthropic bloqueou
algum uso de assinatura fora do Claude Code no passado. Use apenas se você decidir
que o risco de política é aceitável, e verifique os termos atuais da Anthropic você mesmo.
</Warning>

Entrada manual de token (qualquer provedor; escreve `auth-profiles.json` + atualiza config):

```bash
opencraft models auth paste-token --provider anthropic
opencraft models auth paste-token --provider openrouter
```

Refs de perfil de auth também são suportados para credenciais estáticas:

- Credenciais `api_key` podem usar `keyRef: { source, provider, id }`
- Credenciais `token` podem usar `tokenRef: { source, provider, id }`

Verificação amigável a automação (sair `1` quando expirado/ausente, `2` quando expirando):

```bash
opencraft models status --check
```

Scripts de ops opcionais (systemd/Termux) são documentados aqui:
[/automation/auth-monitoring](/automation/auth-monitoring)

> `claude setup-token` requer um TTY interativo.

## Verificando status de auth de modelo

```bash
opencraft models status
opencraft doctor
```

## Comportamento de rotação de chave de API (gateway)

Alguns provedores suportam tentar novamente uma requisição com chaves alternativas quando uma chamada de API
atinge um rate limit do provedor.

- Ordem de prioridade:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override único)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Provedores Google também incluem `GOOGLE_API_KEY` como fallback adicional.
- A mesma lista de chaves é deduplicada antes do uso.
- OpenCraft tenta novamente com a próxima chave apenas para erros de rate limit (por exemplo
  `429`, `rate_limit`, `quota`, `resource exhausted`).
- Erros que não são rate limit não são tentados novamente com chaves alternativas.
- Se todas as chaves falharem, o erro final da última tentativa é retornado.

## Controlando qual credencial é usada

### Por sessão (comando chat)

Use `/model <alias-or-id>@<profileId>` para fixar uma credencial de provedor específica para a sessão atual (ids de perfil de exemplo: `anthropic:default`, `anthropic:work`).

Use `/model` (ou `/model list`) para um picker compacto; use `/model status` para a visão completa (candidatos + próximo perfil de auth, mais detalhes do endpoint do provedor quando configurado).

### Por agente (override CLI)

Definir uma ordem de perfil de auth explícita para um agente (armazenado no `auth-profiles.json` daquele agente):

```bash
opencraft models auth order get --provider anthropic
opencraft models auth order set --provider anthropic anthropic:default
opencraft models auth order clear --provider anthropic
```

Use `--agent <id>` para visar um agente específico; omita para usar o agente padrão configurado.

## Resolução de problemas

### "No credentials found"

Se o perfil de token Anthropic estiver ausente, rode `claude setup-token` no
**host do gateway**, depois verifique novamente:

```bash
opencraft models status
```

### Token expirando/expirado

Rode `opencraft models status` para confirmar qual perfil está expirando. Se o perfil
estiver ausente, rode `claude setup-token` novamente e cole o token novamente.

## Requisitos

- Conta de assinatura Anthropic (para `claude setup-token`)
- Claude Code CLI instalado (comando `claude` disponível)
