---
summary: "Usar Anthropic Claude via chaves de API ou setup-token no OpenCraft"
read_when:
  - Você quer usar modelos Anthropic no OpenCraft
  - Você quer setup-token em vez de chaves de API
title: "Anthropic"
---

# Anthropic (Claude)

A Anthropic cria a família de modelos **Claude** e fornece acesso via API.
No OpenCraft você pode autenticar com uma chave de API ou um **setup-token**.

## Opção A: chave de API Anthropic

**Ideal para:** acesso padrão à API e cobrança por uso.
Crie sua chave de API no Console Anthropic.

### Configuração CLI

```bash
opencraft onboard
# escolher: chave de API Anthropic

# ou não-interativo
opencraft onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Trecho de config

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Padrões de thinking (Claude 4.6)

- Modelos Anthropic Claude 4.6 padrão para thinking `adaptive` no OpenCraft quando nenhum nível de thinking explícito está definido.
- Você pode sobrescrever por mensagem (`/think:<level>`) ou nos params do modelo:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Docs Anthropic relacionados:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Modo fast (API Anthropic)

O toggle `/fast` compartilhado do OpenCraft também suporta tráfego direto de chave de API Anthropic.

- `/fast on` mapeia para `service_tier: "auto"`
- `/fast off` mapeia para `service_tier: "standard_only"`
- Padrão de config:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-5": {
          params: { fastMode: true },
        },
      },
    },
  },
}
```

Limites importantes:

- Isso é **somente chave de API**. Setup-token / auth OAuth Anthropic não honra a injeção de tier de modo fast do OpenCraft.
- O OpenCraft só injeta tiers de serviço Anthropic para requisições diretas em `api.anthropic.com`. Se você rotear `anthropic/*` através de um proxy ou gateway, `/fast` deixa `service_tier` intocado.
- A Anthropic reporta o tier efetivo na resposta em `usage.service_tier`. Em contas sem capacidade Priority Tier, `service_tier: "auto"` pode ainda resolver para `standard`.

## Cache de prompt (API Anthropic)

O OpenCraft suporta o recurso de cache de prompt da Anthropic. Isso é **somente API**; auth por assinatura não honra configurações de cache.

### Configuração

Use o parâmetro `cacheRetention` na config do seu modelo:

| Valor   | Duração do Cache | Descrição                             |
| ------- | ---------------- | ------------------------------------- |
| `none`  | Sem cache        | Desabilitar cache de prompt           |
| `short` | 5 minutos        | Padrão para auth por Chave de API     |
| `long`  | 1 hora           | Cache estendido (requer flag beta)    |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### Padrões

Ao usar autenticação por Chave de API Anthropic, o OpenCraft aplica automaticamente `cacheRetention: "short"` (cache de 5 minutos) para todos os modelos Anthropic. Você pode sobrescrever isso definindo explicitamente `cacheRetention` na sua config.

### Overrides de cacheRetention por agente

Use params no nível do modelo como baseline, depois sobrescreva agentes específicos via `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // baseline para a maioria dos agentes
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // override apenas para este agente
    ],
  },
}
```

Ordem de mesclagem de config para params relacionados a cache:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (correspondendo `id`, sobrescreve por chave)

Isso permite que um agente mantenha cache de longa duração enquanto outro agente no mesmo modelo desabilita o cache para evitar custos de escrita em tráfego intermitente/baixo reuso.

### Notas sobre Claude no Bedrock

- Modelos Claude Anthropic no Bedrock (`amazon-bedrock/*anthropic.claude*`) aceitam passagem de `cacheRetention` quando configurado.
- Modelos Bedrock não-Anthropic são forçados para `cacheRetention: "none"` em runtime.
- Padrões inteligentes de chave de API Anthropic também semeiam `cacheRetention: "short"` para refs de modelo Claude-on-Bedrock quando nenhum valor explícito está definido.

### Parâmetro legado

O parâmetro mais antigo `cacheControlTtl` ainda é suportado para compatibilidade retroativa:

- `"5m"` mapeia para `short`
- `"1h"` mapeia para `long`

Recomendamos migrar para o novo parâmetro `cacheRetention`.

O OpenCraft inclui a flag beta `extended-cache-ttl-2025-04-11` para requisições de API Anthropic; mantenha-a se você sobrescrever headers do provedor (veja [/gateway/configuration](/gateway/configuration)).

## Janela de contexto 1M (beta Anthropic)

A janela de contexto 1M da Anthropic é beta-controlada. No OpenCraft, habilite por modelo
com `params.context1m: true` para modelos Opus/Sonnet suportados.

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { context1m: true },
        },
      },
    },
  },
}
```

O OpenCraft mapeia isso para `anthropic-beta: context-1m-2025-08-07` nas
requisições Anthropic.

Isso só ativa quando `params.context1m` está explicitamente definido como `true` para
aquele modelo.

Requisito: a Anthropic deve permitir uso de longo contexto nessa credencial
(tipicamente cobrança por chave de API, ou uma conta de assinatura com Extra Usage
habilitado). Caso contrário a Anthropic retorna:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Nota: a Anthropic atualmente rejeita requisições beta `context-1m-*` ao usar
tokens OAuth/assinatura (`sk-ant-oat-*`). O OpenCraft pula automaticamente o header beta
context1m para auth OAuth e mantém os betas OAuth obrigatórios.

## Opção B: Claude setup-token

**Ideal para:** usar sua assinatura Claude.

### Onde obter um setup-token

Setup-tokens são criados pelo **Claude Code CLI**, não pelo Console Anthropic. Você pode rodar isso em **qualquer máquina**:

```bash
claude setup-token
```

Cole o token no OpenCraft (wizard: **Token Anthropic (colar setup-token)**), ou rode no host do gateway:

```bash
opencraft models auth setup-token --provider anthropic
```

Se você gerou o token em uma máquina diferente, cole-o:

```bash
opencraft models auth paste-token --provider anthropic
```

### Configuração CLI (setup-token)

```bash
# Colar um setup-token durante o onboarding
opencraft onboard --auth-choice setup-token
```

### Trecho de config (setup-token)

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Notas

- Gere o setup-token com `claude setup-token` e cole-o, ou rode `opencraft models auth setup-token` no host do gateway.
- Se você ver "OAuth token refresh failed …" em uma assinatura Claude, re-autentique com um setup-token. Veja [/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription](/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription).
- Detalhes de autenticação + regras de reutilização estão em [/concepts/oauth](/concepts/oauth).

## Troubleshooting

**Erros 401 / token subitamente inválido**

- Auth por assinatura Claude pode expirar ou ser revogada. Re-rode `claude setup-token`
  e cole no **host do gateway**.
- Se o login do Claude CLI está em uma máquina diferente, use
  `opencraft models auth paste-token --provider anthropic` no host do gateway.

**Nenhuma chave de API encontrada para o provedor "anthropic"**

- Auth é **por agente**. Novos agentes não herdam as chaves do agente principal.
- Re-rode o onboarding para aquele agente, ou cole um setup-token / chave de API no
  host do gateway, depois verifique com `opencraft models status`.

**Nenhuma credencial encontrada para o perfil `anthropic:default`**

- Execute `opencraft models status` para ver qual perfil de auth está ativo.
- Re-rode o onboarding, ou cole um setup-token / chave de API para aquele perfil.

**Nenhum perfil de auth disponível (todos em cooldown/indisponível)**

- Verifique `opencraft models status --json` para `auth.unusableProfiles`.
- Adicione outro perfil Anthropic ou aguarde o cooldown.

Mais: [/gateway/troubleshooting](/gateway/troubleshooting) e [/help/faq](/help/faq).
