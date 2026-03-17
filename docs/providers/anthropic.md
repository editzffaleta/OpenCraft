---
summary: "Use Anthropic Claude via chaves de API ou setup-token no OpenCraft"
read_when:
  - Você quer usar modelos da Anthropic no OpenCraft
  - Você quer setup-token em vez de chaves de API
title: "Anthropic"
---

# Anthropic (Claude)

A Anthropic desenvolve a família de modelos **Claude** e oferece acesso via API.
No OpenCraft, você pode autenticar com uma chave de API ou um **setup-token**.

## Opção A: Chave de API da Anthropic

**Ideal para:** acesso padrão à API e cobrança baseada em uso.
Crie sua chave de API no Console da Anthropic.

### Configuração via CLI

```bash
opencraft onboard
# escolha: Anthropic API key

# ou modo não interativo
opencraft onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Trecho de configuração

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Padrões de thinking (Claude 4.6)

- Os modelos Anthropic Claude 4.6 usam thinking `adaptive` por padrão no OpenCraft quando nenhum nível explícito de thinking é definido.
- Você pode sobrescrever por mensagem (`/think:<level>`) ou nos parâmetros do modelo:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Documentação relacionada da Anthropic:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Modo rápido (Anthropic API)

O toggle compartilhado `/fast` do OpenCraft também suporta tráfego direto com chave de API da Anthropic.

- `/fast on` mapeia para `service_tier: "auto"`
- `/fast off` mapeia para `service_tier: "standard_only"`
- Padrão na configuração:

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

- Isto é **apenas para chave de API**. Autenticação via setup-token / OAuth da Anthropic não respeita a injeção de tier do modo rápido do OpenCraft.
- O OpenCraft só injeta tiers de serviço da Anthropic para requisições diretas a `api.anthropic.com`. Se você rotear `anthropic/*` através de um proxy ou gateway, `/fast` deixa `service_tier` inalterado.
- A Anthropic reporta o tier efetivo na resposta em `usage.service_tier`. Em contas sem capacidade de Priority Tier, `service_tier: "auto"` ainda pode resolver para `standard`.

## Cache de prompt (Anthropic API)

O OpenCraft suporta o recurso de cache de prompt da Anthropic. Isto é **apenas para API**; autenticação por assinatura não respeita as configurações de cache.

### Configuração

Use o parâmetro `cacheRetention` na configuração do seu modelo:

| Valor   | Duração do Cache | Descrição                                      |
| ------- | ---------------- | ---------------------------------------------- |
| `none`  | Sem cache        | Desabilitar cache de prompt                    |
| `short` | 5 minutos        | Padrão para autenticação via chave de API      |
| `long`  | 1 hora           | Cache estendido (requer flag beta)             |

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

Ao usar autenticação via chave de API da Anthropic, o OpenCraft aplica automaticamente `cacheRetention: "short"` (cache de 5 minutos) para todos os modelos da Anthropic. Você pode sobrescrever isso definindo explicitamente `cacheRetention` na sua configuração.

### Sobrescritas de cacheRetention por agente

Use parâmetros a nível de modelo como linha de base, depois sobrescreva agentes específicos via `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // linha de base para a maioria dos agentes
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // sobrescrita apenas para este agente
    ],
  },
}
```

Ordem de mesclagem da configuração para parâmetros relacionados a cache:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (`id` correspondente, sobrescreve por chave)

Isso permite que um agente mantenha um cache de longa duração enquanto outro agente no mesmo modelo desabilita o cache para evitar custos de gravação em tráfego intermitente/de baixa reutilização.

### Notas sobre Bedrock Claude

- Modelos Anthropic Claude no Bedrock (`amazon-bedrock/*anthropic.claude*`) aceitam passagem de `cacheRetention` quando configurado.
- Modelos Bedrock não-Anthropic são forçados para `cacheRetention: "none"` em tempo de execução.
- Os padrões inteligentes de chave de API da Anthropic também definem `cacheRetention: "short"` para referências de modelo Claude-no-Bedrock quando nenhum valor explícito é definido.

### Parâmetro legado

O parâmetro mais antigo `cacheControlTtl` ainda é suportado para compatibilidade retroativa:

- `"5m"` mapeia para `short`
- `"1h"` mapeia para `long`

Recomendamos migrar para o novo parâmetro `cacheRetention`.

O OpenCraft inclui a flag beta `extended-cache-ttl-2025-04-11` para requisições à API da Anthropic;
mantenha-a se você sobrescrever headers do provider (veja [/gateway/configuration](/gateway/configuration)).

## Janela de contexto de 1M (Anthropic beta)

A janela de contexto de 1M da Anthropic é restrita por beta. No OpenCraft, habilite-a por modelo
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

O OpenCraft mapeia isso para `anthropic-beta: context-1m-2025-08-07` nas requisições à Anthropic.

Isso só é ativado quando `params.context1m` é explicitamente definido como `true` para aquele modelo.

Requisito: a Anthropic deve permitir o uso de contexto longo naquela credencial
(tipicamente cobrança por chave de API, ou uma conta de assinatura com Extra Usage
habilitado). Caso contrário, a Anthropic retorna:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Nota: a Anthropic atualmente rejeita requisições beta `context-1m-*` ao usar
tokens OAuth/assinatura (`sk-ant-oat-*`). O OpenCraft automaticamente pula o
header beta context1m para autenticação OAuth e mantém os betas OAuth necessários.

## Opção B: Setup-token do Claude

**Ideal para:** usar sua assinatura do Claude.

### Onde obter um setup-token

Setup-tokens são criados pelo **Claude Code CLI**, não pelo Console da Anthropic. Você pode executar isso em **qualquer máquina**:

```bash
claude setup-token
```

Cole o token no OpenCraft (assistente: **Anthropic token (paste setup-token)**), ou execute no host do gateway:

```bash
opencraft models auth setup-token --provider anthropic
```

Se você gerou o token em uma máquina diferente, cole-o:

```bash
opencraft models auth paste-token --provider anthropic
```

### Configuração via CLI (setup-token)

```bash
# Cole um setup-token durante a configuração
opencraft onboard --auth-choice setup-token
```

### Trecho de configuração (setup-token)

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Notas

- Gere o setup-token com `claude setup-token` e cole-o, ou execute `opencraft models auth setup-token` no host do gateway.
- Se você vir "OAuth token refresh failed ..." em uma assinatura Claude, reautentique com um setup-token. Veja [/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription](/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription).
- Detalhes de autenticação e regras de reutilização estão em [/concepts/oauth](/concepts/oauth).

## Solução de problemas

**Erros 401 / token subitamente inválido**

- A autenticação por assinatura Claude pode expirar ou ser revogada. Execute novamente `claude setup-token`
  e cole no **host do gateway**.
- Se o login do Claude CLI está em uma máquina diferente, use
  `opencraft models auth paste-token --provider anthropic` no host do gateway.

**No API key found for provider "anthropic"**

- A autenticação é **por agente**. Novos agentes não herdam as chaves do agente principal.
- Execute novamente o onboarding para aquele agente, ou cole um setup-token / chave de API no
  host do gateway, depois verifique com `opencraft models status`.

**No credentials found for profile `anthropic:default`**

- Execute `opencraft models status` para ver qual perfil de autenticação está ativo.
- Execute novamente o onboarding, ou cole um setup-token / chave de API para aquele perfil.

**No available auth profile (all in cooldown/unavailable)**

- Verifique `opencraft models status --json` para `auth.unusableProfiles`.
- Adicione outro perfil Anthropic ou aguarde o cooldown.

Mais: [/gateway/troubleshooting](/gateway/troubleshooting) e [/help/faq](/help/faq).
