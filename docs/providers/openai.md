---
summary: "Usar OpenAI via chaves de API ou assinatura Codex no OpenCraft"
read_when:
  - Você quer usar modelos OpenAI no OpenCraft
  - Você quer autenticação por assinatura Codex em vez de chaves de API
title: "OpenAI"
---

# OpenAI

A OpenAI fornece APIs de desenvolvedor para modelos GPT. O Codex suporta **login ChatGPT** para acesso por assinatura ou **chave de API** para acesso por uso. O Codex cloud requer login ChatGPT. A OpenAI suporta explicitamente o uso OAuth de assinatura em ferramentas/workflows externos como o OpenCraft.

## Opção A: chave de API OpenAI (OpenAI Platform)

**Ideal para:** acesso direto à API e cobrança por uso.
Obtenha sua chave de API no painel OpenAI.

### Configuração CLI

```bash
opencraft onboard --auth-choice openai-api-key
# ou não-interativo
opencraft onboard --openai-api-key "$OPENAI_API_KEY"
```

### Trecho de config

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

A documentação atual de modelos de API da OpenAI lista `gpt-5.4` e `gpt-5.4-pro` para uso direto da OpenAI API. O OpenCraft encaminha ambos pelo caminho de Respostas `openai/*`. O OpenCraft suprime intencionalmente a linha obsoleta `openai/gpt-5.3-codex-spark`, pois chamadas diretas à OpenAI API a rejeitam em tráfego real.

O OpenCraft **não** expõe `openai/gpt-5.3-codex-spark` no caminho direto da OpenAI API. `pi-ai` ainda inclui uma linha embutida para esse modelo, mas requisições reais à OpenAI API atualmente a rejeitam. Spark é tratado como Codex-only no OpenCraft.

## Opção B: assinatura OpenAI Code (Codex)

**Ideal para:** usar acesso por assinatura ChatGPT/Codex em vez de uma chave de API.
O Codex cloud requer login ChatGPT, enquanto o Codex CLI suporta login ChatGPT ou chave de API.

### Configuração CLI (OAuth Codex)

```bash
# Rodar OAuth Codex no wizard
opencraft onboard --auth-choice openai-codex

# Ou rodar OAuth diretamente
opencraft models auth login --provider openai-codex
```

### Trecho de config (assinatura Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

A documentação atual do Codex da OpenAI lista `gpt-5.4` como o modelo Codex atual. O OpenCraft mapeia isso para `openai-codex/gpt-5.4` para uso OAuth ChatGPT/Codex.

Se sua conta Codex tem direito ao Codex Spark, o OpenCraft também suporta:

- `openai-codex/gpt-5.3-codex-spark`

O OpenCraft trata o Codex Spark como Codex-only. Não expõe um caminho direto de chave de API `openai/gpt-5.3-codex-spark`.

O OpenCraft também preserva `openai-codex/gpt-5.3-codex-spark` quando `pi-ai` o descobre. Trate-o como dependente de direitos e experimental: o Codex Spark é separado do GPT-5.4 `/fast`, e a disponibilidade depende da conta Codex / ChatGPT logada.

### Padrão de transporte

O OpenCraft usa `pi-ai` para streaming de modelo. Para ambos `openai/*` e
`openai-codex/*`, o transporte padrão é `"auto"` (WebSocket primeiro, depois fallback SSE).

Você pode definir `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: forçar SSE
- `"websocket"`: forçar WebSocket
- `"auto"`: tentar WebSocket, depois voltar para SSE

Para `openai/*` (API Responses), o OpenCraft também habilita warm-up WebSocket por
padrão (`openaiWsWarmup: true`) quando transporte WebSocket é usado.

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### Warm-up WebSocket OpenAI

A documentação OpenAI descreve warm-up como opcional. O OpenCraft o habilita por padrão para
`openai/*` para reduzir a latência do primeiro turno ao usar transporte WebSocket.

### Desabilitar warm-up

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Habilitar warm-up explicitamente

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### Processamento prioritário OpenAI

A API da OpenAI expõe processamento prioritário via `service_tier=priority`. No
OpenCraft, defina `agents.defaults.models["openai/<model>"].params.serviceTier` para
passar esse campo nas requisições `openai/*` Responses diretas.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Valores suportados são `auto`, `default`, `flex` e `priority`.

### Modo fast OpenAI

O OpenCraft expõe um toggle de modo fast compartilhado para sessões `openai/*` e
`openai-codex/*`:

- Chat/UI: `/fast status|on|off`
- Config: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Quando o modo fast está habilitado, o OpenCraft aplica um perfil OpenAI de baixa latência:

- `reasoning.effort = "low"` quando o payload não especifica reasoning
- `text.verbosity = "low"` quando o payload não especifica verbosity
- `service_tier = "priority"` para chamadas `openai/*` Responses diretas em `api.openai.com`

Exemplo:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

Overrides de sessão vencem sobre a config. Limpar o override de sessão na UI de Sessões retorna a sessão para o padrão configurado.

### Compactação server-side OpenAI Responses

Para modelos OpenAI Responses diretos (`openai/*` usando `api: "openai-responses"` com
`baseUrl` em `api.openai.com`), o OpenCraft agora auto-habilita hints de payload de compactação server-side OpenAI:

- Força `store: true` (a menos que compat de modelo defina `supportsStore: false`)
- Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`

Por padrão, `compact_threshold` é `70%` do `contextWindow` do modelo (ou `80000`
quando indisponível).

### Habilitar compactação server-side explicitamente

Use isso quando você quer forçar a injeção de `context_management` em modelos Responses compatíveis (por exemplo Azure OpenAI Responses):

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Habilitar com threshold personalizado

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### Desabilitar compactação server-side

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` controla apenas a injeção de `context_management`.
Modelos OpenAI Responses diretos ainda forçam `store: true` a menos que compat defina
`supportsStore: false`.

## Notas

- Refs de modelo sempre usam `provider/model` (veja [/concepts/models](/concepts/models)).
- Detalhes de autenticação + regras de reutilização estão em [/concepts/oauth](/concepts/oauth).
