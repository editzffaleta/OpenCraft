---
summary: "Como o OpenCraft rotaciona perfis de autenticacao e faz fallback entre modelos"
read_when:
  - Diagnosticando rotacao de perfis de autenticacao, cooldowns ou comportamento de fallback de modelos
  - Atualizando regras de failover para perfis de autenticacao ou modelos
title: "Model Failover"
---

# Failover de modelos

O OpenCraft lida com falhas em dois estagios:

1. **Rotacao de perfil de autenticacao** dentro do provedor atual.
2. **Fallback de modelo** para o proximo modelo em `agents.defaults.model.fallbacks`.

Este documento explica as regras de execucao e os dados que as sustentam.

## Armazenamento de autenticacao (chaves + OAuth)

O OpenCraft usa **perfis de autenticacao** tanto para chaves de API quanto para Token OAuth.

- Os segredos ficam em `~/.opencraft/agents/<agentId>/agent/auth-profiles.json` (legado: `~/.opencraft/agent/auth-profiles.json`).
- As configuracoes `auth.profiles` / `auth.order` sao **apenas metadados + roteamento** (sem segredos).
- Arquivo legado somente para importacao OAuth: `~/.opencraft/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso).

Mais detalhes: [/concepts/oauth](/concepts/oauth)

Tipos de credenciais:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para alguns provedores)

## IDs de perfil

Logins OAuth criam perfis distintos para que multiplas contas possam coexistir.

- Padrao: `provider:default` quando nenhum email esta disponivel.
- OAuth com email: `provider:<email>` (por exemplo `google-antigravity:user@gmail.com`).

Os perfis ficam em `~/.opencraft/agents/<agentId>/agent/auth-profiles.json` sob `profiles`.

## Ordem de rotacao

Quando um provedor tem multiplos perfis, o OpenCraft escolhe uma ordem assim:

1. **Configuracao explicita**: `auth.order[provider]` (se definido).
2. **Perfis configurados**: `auth.profiles` filtrados por provedor.
3. **Perfis armazenados**: entradas em `auth-profiles.json` para o provedor.

Se nenhuma ordem explicita estiver configurada, o OpenCraft usa uma ordem round-robin:

- **Chave primaria:** tipo de perfil (**OAuth antes de chaves de API**).
- **Chave secundaria:** `usageStats.lastUsed` (mais antigo primeiro, dentro de cada tipo).
- **Perfis em cooldown/desabilitados** sao movidos para o final, ordenados pelo vencimento mais proximo.

### Aderencia de sessao (amigavel ao cache)

O OpenCraft **fixa o perfil de autenticacao escolhido por sessao** para manter os caches do provedor aquecidos.
Ele **nao** rotaciona a cada requisicao. O perfil fixado e reutilizado ate que:

- a sessao seja redefinida (`/new` / `/reset`)
- uma compactacao seja concluida (contador de compactacao incrementa)
- o perfil esteja em cooldown/desabilitado

Selecao manual via `/model …@<profileId>` define uma **substituicao do usuario** para aquela sessao
e nao e auto-rotacionada ate que uma nova sessao comece.

Perfis fixados automaticamente (selecionados pelo roteador de sessao) sao tratados como uma **preferencia**:
eles sao tentados primeiro, mas o OpenCraft pode rotacionar para outro perfil em limites de taxa/timeouts.
Perfis fixados pelo usuario permanecem travados naquele perfil; se falhar e fallbacks de modelo
estiverem configurados, o OpenCraft move para o proximo modelo em vez de trocar perfis.

### Por que o OAuth pode "parecer perdido"

Se voce tem tanto um perfil OAuth quanto um perfil de chave de API para o mesmo provedor, o round-robin pode alternar entre eles nas mensagens, a menos que esteja fixado. Para forcar um unico perfil:

- Fixe com `auth.order[provider] = ["provider:profileId"]`, ou
- Use uma substituicao por sessao via `/model …` com uma substituicao de perfil (quando suportado pela sua interface/superficie de chat).

## Cooldowns

Quando um perfil falha devido a erros de autenticacao/limite de taxa (ou um timeout que se parece
com limitacao de taxa), o OpenCraft o marca em cooldown e move para o proximo perfil.
Erros de formato/requisicao invalida (por exemplo, falhas de validacao de ID de chamada de ferramenta
do Cloud Code Assist) sao tratados como dignos de failover e usam os mesmos cooldowns.
Erros de stop-reason compativeis com OpenAI como `Unhandled stop reason: error`,
`stop reason: error` e `reason: error` sao classificados como sinais de timeout/failover.

Cooldowns usam backoff exponencial:

- 1 minuto
- 5 minutos
- 25 minutos
- 1 hora (limite)

O estado e armazenado em `auth-profiles.json` sob `usageStats`:

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

## Desabilitacoes por cobranca

Falhas de cobranca/credito (por exemplo "creditos insuficientes" / "saldo de credito muito baixo") sao tratadas como dignos de failover, mas geralmente nao sao transitorias. Em vez de um cooldown curto, o OpenCraft marca o perfil como **desabilitado** (com um backoff mais longo) e rotaciona para o proximo perfil/provedor.

O estado e armazenado em `auth-profiles.json`:

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

Padroes:

- O backoff de cobranca comeca em **5 horas**, dobra por falha de cobranca e tem limite de **24 horas**.
- Os contadores de backoff sao resetados se o perfil nao falhou por **24 horas** (configuravel).

## Fallback de modelo

Se todos os perfis de um provedor falharem, o OpenCraft move para o proximo modelo em
`agents.defaults.model.fallbacks`. Isso se aplica a falhas de autenticacao, limites de taxa e
timeouts que esgotaram a rotacao de perfis (outros erros nao avancam o fallback).

Quando uma execucao comeca com uma substituicao de modelo (hooks ou CLI), os fallbacks ainda terminam em
`agents.defaults.model.primary` apos tentar quaisquer fallbacks configurados.

## Configuracao relacionada

Veja [Configuracao do Gateway](/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- Roteamento de `agents.defaults.imageModel`

Veja [Models](/concepts/models) para a visao geral mais ampla de selecao e fallback de modelos.
