---
summary: "Autenticação de modelos: OAuth, API keys e setup-token"
read_when:
  - Debugando autenticação de modelo ou expiração de OAuth
  - Documentando autenticação ou armazenamento de credenciais
title: "Authentication"
---

# Authentication

OpenCraft suporta OAuth e API keys para provedores de modelos. Para hosts de gateway sempre ativos, API keys são geralmente a opção mais previsível. Fluxos de assinatura/OAuth também são suportados quando correspondem ao modelo de conta do seu provedor.

Veja [/concepts/oauth](/concepts/oauth) para o fluxo completo de OAuth e layout de armazenamento.
Para autenticação baseada em SecretRef (provedores `env`/`file`/`exec`), veja [Secrets Management](/gateway/secrets).
Para regras de elegibilidade/código de razão de credenciais usadas por `models status --probe`, veja
[Auth Credential Semantics](/auth-credential-semantics).

## Setup recomendado (API key, qualquer provedor)

Se você está executando um gateway de longa duração, comece com uma API key para o provedor escolhido.
Para Anthropic especificamente, autenticação por API key é o caminho seguro e é recomendada
em vez de autenticação por setup-token de assinatura.

1. Crie uma API key no console do seu provedor.
2. Coloque-a no **host do gateway** (a máquina executando `opencraft gateway`).

```bash
export <PROVIDER>_API_KEY="..."
opencraft models status
```

3. Se o Gateway roda sob systemd/launchd, prefira colocar a chave em
   `~/.opencraft/.env` para que o daemon possa lê-la:

```bash
cat >> ~/.opencraft/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Então reinicie o daemon (ou reinicie seu processo Gateway) e verifique novamente:

```bash
opencraft models status
opencraft doctor
```

Se você preferir não gerenciar variáveis de ambiente manualmente, o onboarding pode armazenar
API keys para uso do daemon: `opencraft onboard`.

Veja [Help](/help) para detalhes sobre herança de env (`env.shellEnv`,
`~/.opencraft/.env`, systemd/launchd).

## Anthropic: setup-token (autenticação por assinatura)

Se você está usando uma assinatura Claude, o fluxo de setup-token é suportado. Execute
no **host do gateway**:

```bash
claude setup-token
```

Então cole no OpenCraft:

```bash
opencraft models auth setup-token --provider anthropic
```

Se o token foi criado em outra máquina, cole-o manualmente:

```bash
opencraft models auth paste-token --provider anthropic
```

Se você vir um erro da Anthropic como:

```
This credential is only authorized for use with Claude Code and cannot be used for other API requests.
```

...use uma API key da Anthropic em vez disso.

<Warning>
O suporte a setup-token da Anthropic é apenas compatibilidade técnica. A Anthropic bloqueou
algum uso de assinatura fora do Claude Code no passado. Use-o apenas se você decidir
que o risco de política é aceitável, e verifique os termos atuais da Anthropic por conta própria.
</Warning>

Entrada manual de token (qualquer provedor; grava `auth-profiles.json` + atualiza config):

```bash
opencraft models auth paste-token --provider anthropic
opencraft models auth paste-token --provider openrouter
```

Refs de perfil de autenticação também são suportadas para credenciais estáticas:

- Credenciais `api_key` podem usar `keyRef: { source, provider, id }`
- Credenciais `token` podem usar `tokenRef: { source, provider, id }`

Verificação amigável para automação (exit `1` quando expirado/ausente, `2` quando expirando):

```bash
opencraft models status --check
```

Scripts de operação opcionais (systemd/Termux) estão documentados aqui:
[/automation/auth-monitoring](/automation/auth-monitoring)

> `claude setup-token` requer um TTY interativo.

## Verificando status de autenticação do modelo

```bash
opencraft models status
opencraft doctor
```

## Comportamento de rotação de API key (gateway)

Alguns provedores suportam tentar novamente uma requisição com chaves alternativas quando uma chamada de API
atinge um limite de taxa do provedor.

- Ordem de prioridade:
  - `OPENCRAFT_LIVE_<PROVIDER>_KEY` (override único)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Provedores Google também incluem `GOOGLE_API_KEY` como fallback adicional.
- A mesma lista de chaves é deduplicada antes do uso.
- OpenCraft tenta novamente com a próxima chave apenas para erros de limite de taxa (por exemplo
  `429`, `rate_limit`, `quota`, `resource exhausted`).
- Erros que não são de limite de taxa não são tentados novamente com chaves alternativas.
- Se todas as chaves falharem, o erro final da última tentativa é retornado.

## Controlando qual credencial é usada

### Por sessão (comando de chat)

Use `/model <alias-ou-id>@<profileId>` para fixar uma credencial de provedor específica para a sessão atual (exemplos de ids de perfil: `anthropic:default`, `anthropic:work`).

Use `/model` (ou `/model list`) para um seletor compacto; use `/model status` para a visão completa (candidatos + próximo perfil de autenticação, mais detalhes do endpoint do provedor quando configurado).

### Por agente (override via CLI)

Defina uma ordem de override explícita de perfil de autenticação para um agente (armazenado no `auth-profiles.json` daquele agente):

```bash
opencraft models auth order get --provider anthropic
opencraft models auth order set --provider anthropic anthropic:default
opencraft models auth order clear --provider anthropic
```

Use `--agent <id>` para direcionar um agente específico; omita para usar o agente padrão configurado.

## Solução de problemas

### "No credentials found"

Se o perfil de token da Anthropic estiver ausente, execute `claude setup-token` no
**host do gateway**, então verifique novamente:

```bash
opencraft models status
```

### Token expirando/expirado

Execute `opencraft models status` para confirmar qual perfil está expirando. Se o perfil
estiver ausente, execute novamente `claude setup-token` e cole o token novamente.

## Requisitos

- Conta de assinatura Anthropic (para `claude setup-token`)
- Claude Code CLI instalado (comando `claude` disponível)
