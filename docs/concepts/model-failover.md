---
summary: "Como o OpenCraft rotaciona perfis de auth e faz fallback entre modelos"
read_when:
  - Diagnosticando rotação de perfil de auth, cooldowns ou comportamento de fallback de modelo
  - Atualizando regras de failover para perfis de auth ou modelos
title: "Failover de Modelo"
---

# Failover de modelo

O OpenCraft lida com falhas em dois estágios:

1. **Rotação de perfil de auth** dentro do provedor atual.
2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

Este documento explica as regras de runtime e os dados que as embasam.

## Armazenamento de auth (chaves + OAuth)

O OpenCraft usa **perfis de auth** tanto para chaves de API quanto para tokens OAuth.

- Segredos ficam em `~/.opencraft/agents/<agentId>/agent/auth-profiles.json` (legado: `~/.opencraft/agent/auth-profiles.json`).
- Config `auth.profiles` / `auth.order` são **apenas metadados + roteamento** (sem segredos).
- Arquivo OAuth legado somente para importação: `~/.opencraft/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso).

Mais detalhes: [/concepts/oauth](/concepts/oauth)

Tipos de credencial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para alguns provedores)

## IDs de perfil

Logins OAuth criam perfis distintos para que múltiplas contas possam coexistir.

- Padrão: `provider:default` quando nenhum email está disponível.
- OAuth com email: `provider:<email>` (por exemplo `google-antigravity:user@gmail.com`).

Perfis ficam em `~/.opencraft/agents/<agentId>/agent/auth-profiles.json` em `profiles`.

## Ordem de rotação

Quando um provedor tem múltiplos perfis, o OpenCraft escolhe uma ordem assim:

1. **Config explícita**: `auth.order[provider]` (se definido).
2. **Perfis configurados**: `auth.profiles` filtrado por provedor.
3. **Perfis armazenados**: entradas em `auth-profiles.json` para o provedor.

Se nenhuma ordem explícita estiver configurada, o OpenCraft usa ordem round-robin:

- **Chave primária:** tipo de perfil (**OAuth antes de chaves de API**).
- **Chave secundária:** `usageStats.lastUsed` (mais antigo primeiro, dentro de cada tipo).
- **Perfis em cooldown/desabilitados** são movidos para o final, ordenados por expiração mais próxima.

### Stickiness de sessão (cache-friendly)

O OpenCraft **fixa o perfil de auth escolhido por sessão** para manter os caches do provedor quentes.
Ele **não** rotaciona a cada requisição. O perfil fixado é reutilizado até:

- a sessão ser resetada (`/new` / `/reset`)
- uma compactação ser concluída (contagem de compactação incrementa)
- o perfil estar em cooldown/desabilitado

Seleção manual via `/model …@<profileId>` define um **override de usuário** para aquela sessão
e não é auto-rotacionado até que uma nova sessão comece.

Perfis auto-fixados (selecionados pelo roteador de sessão) são tratados como **preferência**:
são tentados primeiro, mas o OpenCraft pode rotacionar para outro perfil em rate limits/timeouts.
Perfis fixados pelo usuário permanecem bloqueados naquele perfil; se falhar e os fallbacks de modelo
estiverem configurados, o OpenCraft move para o próximo modelo em vez de trocar de perfil.

### Por que OAuth pode "parecer perdido"

Se você tem tanto um perfil OAuth quanto um perfil de chave de API para o mesmo provedor, o round-robin pode alternar entre eles entre mensagens a não ser que fixado. Para forçar um único perfil:

- Fixe com `auth.order[provider] = ["provider:profileId"]`, ou
- Use um override por sessão via `/model …` com um override de perfil (quando suportado pela sua UI/superfície de chat).

## Cooldowns

Quando um perfil falha devido a erros de auth/rate-limit (ou um timeout que parece
rate limiting), o OpenCraft o marca em cooldown e move para o próximo perfil.
Erros de formato/requisição inválida (por exemplo falhas de validação de tool call ID do Cloud Code Assist)
são tratados como dignos de failover e usam os mesmos cooldowns.
Erros de stop-reason compatíveis com OpenAI como `Unhandled stop reason: error`,
`stop reason: error` e `reason: error` são classificados como sinais de timeout/failover.

Cooldowns usam backoff exponencial:

- 1 minuto
- 5 minutos
- 25 minutos
- 1 hora (limite)

O estado é armazenado em `auth-profiles.json` em `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Desabilitações por cobrança

Falhas de cobrança/crédito (por exemplo "insufficient credits" / "credit balance too low") são tratadas como dignas de failover, mas geralmente não são transitórias. Em vez de um cooldown curto, o OpenCraft marca o perfil como **desabilitado** (com backoff mais longo) e rotaciona para o próximo perfil/provedor.

O estado é armazenado em `auth-profiles.json`:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Padrões:

- O backoff de cobrança começa em **5 horas**, dobra por falha de cobrança e limita em **24 horas**.
- Contadores de backoff são resetados se o perfil não falhou por **24 horas** (configurável).

## Fallback de modelo

Se todos os perfis para um provedor falharem, o OpenCraft move para o próximo modelo em
`agents.defaults.model.fallbacks`. Isso se aplica a falhas de auth, rate limits e
timeouts que esgotaram a rotação de perfil (outros erros não avançam o fallback).

Quando uma execução começa com um override de modelo (hooks ou CLI), os fallbacks ainda terminam em
`agents.defaults.model.primary` após tentar quaisquer fallbacks configurados.

## Config relacionada

Veja [Configuração do Gateway](/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- Roteamento `agents.defaults.imageModel`

Veja [Modelos](/concepts/models) para a visão geral mais ampla de seleção e fallback de modelo.
