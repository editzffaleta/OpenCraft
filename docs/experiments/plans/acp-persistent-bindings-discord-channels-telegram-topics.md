# Vinculações Persistentes ACP para Canais Discord e Tópicos Telegram

Status: Rascunho

## Resumo

Introduzir vinculações ACP persistentes que mapeiam:

- Canais Discord (e threads existentes, quando necessário), e
- Tópicos de fórum Telegram em grupos/supergrupos (`chatId:topic:topicId`)

para sessões ACP de longa duração, com o estado das vinculações armazenado em entradas `bindings[]` de nível superior usando tipos de vinculação explícitos.

Isso torna o uso do ACP em canais de mensagens de alto tráfego previsível e durável, permitindo que os usuários criem canais/tópicos dedicados como `codex`, `claude-1` ou `claude-myrepo`.

## Por que

O comportamento atual do ACP vinculado a threads é otimizado para workflows efêmeros de threads no Discord. O Telegram não tem o mesmo modelo de threads; ele tem tópicos de fórum em grupos/supergrupos. Os usuários querem "workspaces" ACP estáveis e sempre ativos nas superfícies de chat, não apenas sessões temporárias de thread.

## Objetivos

- Suportar vinculação ACP durável para:
  - Canais/threads Discord
  - Tópicos de fórum Telegram (grupos/supergrupos)
- Tornar a configuração a fonte da verdade para vinculações.
- Manter `/acp`, `/new`, `/reset`, `/focus` e o comportamento de entrega consistentes entre Discord e Telegram.
- Preservar os fluxos de vinculação temporária existentes para uso ad-hoc.

## Não-objetivos

- Redesenho completo do runtime/sessão do ACP.
- Remoção dos fluxos de vinculação efêmera existentes.
- Expansão para todos os canais na primeira iteração.
- Implementação de tópicos de mensagens diretas do Telegram (`direct_messages_topic_id`) nesta fase.
- Implementação de variantes de tópicos de chat privado do Telegram nesta fase.

## Direção de UX

### 1) Dois tipos de vinculação

- **Vinculação persistente**: salva na configuração, reconciliada na inicialização, destinada a canais/tópicos de "workspace nomeado".
- **Vinculação temporária**: somente em runtime, expira por política de inatividade/idade máxima.

### 2) Comportamento dos comandos

- `/acp spawn ... --thread here|auto|off` permanece disponível.
- Adicionar controles explícitos de ciclo de vida de vinculação:
  - `/acp bind [session|agent] [--persist]`
  - `/acp unbind [--persist]`
  - `/acp status` inclui se a vinculação é `persistent` ou `temporary`.
- Em conversas vinculadas, `/new` e `/reset` reiniciam a sessão ACP vinculada no lugar e mantêm a vinculação anexada.

### 3) Identidade da conversa

- Usar IDs de conversa canônicos:
  - Discord: ID do canal/thread.
  - Tópico Telegram: `chatId:topic:topicId`.
- Nunca identificar vinculações do Telegram apenas pelo ID do tópico.

## Modelo de configuração (proposto)

Unificar a configuração de roteamento e vinculação ACP persistente em `bindings[]` de nível superior com discriminador `type` explícito:

```jsonc
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.opencraft/workspace-main",
        "runtime": { "type": "embedded" },
      },
      {
        "id": "codex",
        "workspace": "~/.opencraft/workspace-codex",
        "runtime": {
          "type": "acp",
          "acp": {
            "agent": "codex",
            "backend": "acpx",
            "mode": "persistent",
            "cwd": "/workspace/repo-a",
          },
        },
      },
      {
        "id": "claude",
        "workspace": "~/.opencraft/workspace-claude",
        "runtime": {
          "type": "acp",
          "acp": {
            "agent": "claude",
            "backend": "acpx",
            "mode": "persistent",
            "cwd": "/workspace/repo-b",
          },
        },
      },
    ],
  },
  "acp": {
    "enabled": true,
    "backend": "acpx",
    "allowedAgents": ["codex", "claude"],
  },
  "bindings": [
    // Vinculações de rota (comportamento existente)
    {
      "type": "route",
      "agentId": "main",
      "match": { "channel": "discord", "accountId": "default" },
    },
    {
      "type": "route",
      "agentId": "main",
      "match": { "channel": "telegram", "accountId": "default" },
    },
    // Vinculações de conversa ACP persistentes
    {
      "type": "acp",
      "agentId": "codex",
      "match": {
        "channel": "discord",
        "accountId": "default",
        "peer": { "kind": "channel", "id": "222222222222222222" },
      },
      "acp": {
        "label": "codex-main",
        "mode": "persistent",
        "cwd": "/workspace/repo-a",
        "backend": "acpx",
      },
    },
    {
      "type": "acp",
      "agentId": "claude",
      "match": {
        "channel": "discord",
        "accountId": "default",
        "peer": { "kind": "channel", "id": "333333333333333333" },
      },
      "acp": {
        "label": "claude-repo-b",
        "mode": "persistent",
        "cwd": "/workspace/repo-b",
      },
    },
    {
      "type": "acp",
      "agentId": "codex",
      "match": {
        "channel": "telegram",
        "accountId": "default",
        "peer": { "kind": "group", "id": "-1001234567890:topic:42" },
      },
      "acp": {
        "label": "tg-codex-42",
        "mode": "persistent",
      },
    },
  ],
  "channels": {
    "discord": {
      "guilds": {
        "111111111111111111": {
          "channels": {
            "222222222222222222": {
              "enabled": true,
              "requireMention": false,
            },
            "333333333333333333": {
              "enabled": true,
              "requireMention": false,
            },
          },
        },
      },
    },
    "telegram": {
      "groups": {
        "-1001234567890": {
          "topics": {
            "42": {
              "requireMention": false,
            },
          },
        },
      },
    },
  },
}
```

### Exemplo mínimo (sem substituições ACP por vinculação)

```jsonc
{
  "agents": {
    "list": [
      { "id": "main", "default": true, "runtime": { "type": "embedded" } },
      {
        "id": "codex",
        "runtime": {
          "type": "acp",
          "acp": { "agent": "codex", "backend": "acpx", "mode": "persistent" },
        },
      },
      {
        "id": "claude",
        "runtime": {
          "type": "acp",
          "acp": { "agent": "claude", "backend": "acpx", "mode": "persistent" },
        },
      },
    ],
  },
  "acp": { "enabled": true, "backend": "acpx" },
  "bindings": [
    {
      "type": "route",
      "agentId": "main",
      "match": { "channel": "discord", "accountId": "default" },
    },
    {
      "type": "route",
      "agentId": "main",
      "match": { "channel": "telegram", "accountId": "default" },
    },

    {
      "type": "acp",
      "agentId": "codex",
      "match": {
        "channel": "discord",
        "accountId": "default",
        "peer": { "kind": "channel", "id": "222222222222222222" },
      },
    },
    {
      "type": "acp",
      "agentId": "claude",
      "match": {
        "channel": "discord",
        "accountId": "default",
        "peer": { "kind": "channel", "id": "333333333333333333" },
      },
    },
    {
      "type": "acp",
      "agentId": "codex",
      "match": {
        "channel": "telegram",
        "accountId": "default",
        "peer": { "kind": "group", "id": "-1009876543210:topic:5" },
      },
    },
  ],
}
```

Notas:

- `bindings[].type` é explícito:
  - `route`: roteamento normal de agente.
  - `acp`: vinculação de harness ACP persistente para uma conversa correspondente.
- Para `type: "acp"`, `match.peer.id` é a chave canônica de conversa:
  - Canal/thread Discord: ID bruto do canal/thread.
  - Tópico Telegram: `chatId:topic:topicId`.
- `bindings[].acp.backend` é opcional. Ordem de fallback do backend:
  1. `bindings[].acp.backend`
  2. `agents.list[].runtime.acp.backend`
  3. `acp.backend` global
- `mode`, `cwd` e `label` seguem o mesmo padrão de substituição (`substituição da vinculação -> padrão de runtime do agente -> comportamento global/padrão`).
- Manter os `session.threadBindings.*` e `channels.discord.threadBindings.*` existentes para políticas de vinculação temporária.
- Entradas persistentes declaram o estado desejado; o runtime reconcilia para as sessões/vinculações ACP reais.
- Uma vinculação ACP ativa por nó de conversa é o modelo pretendido.
- Compatibilidade retroativa: `type` ausente é interpretado como `route` para entradas legadas.

### Seleção de backend

- A inicialização de sessão ACP já usa a seleção de backend configurada durante o spawn (`acp.backend` atualmente).
- Esta proposta estende a lógica de spawn/reconciliação para preferir substituições de vinculação ACP tipadas:
  - `bindings[].acp.backend` para substituição local por conversa.
  - `agents.list[].runtime.acp.backend` para padrões por agente.
- Se nenhuma substituição existir, mantém o comportamento atual (padrão `acp.backend`).

## Encaixe na arquitetura atual

### Reutilizar componentes existentes

- `SessionBindingService` já suporta referências de conversa agnósticas de canal.
- Os fluxos de spawn/bind do ACP já suportam vinculação por meio das APIs de serviço.
- O Telegram já carrega contexto de tópico/thread via `MessageThreadId` e `chatId`.

### Componentes novos/estendidos

- **Adaptador de vinculação Telegram** (paralelo ao adaptador Discord):
  - registrar adaptador por conta Telegram,
  - resolver/listar/vincular/desvincular/tocar por ID de conversa canônico.
- **Resolvedor/índice de vinculação tipado**:
  - dividir `bindings[]` em visualizações `route` e `acp`,
  - manter `resolveAgentRoute` apenas em vinculações `route`,
  - resolver intenção ACP persistente apenas de vinculações `acp`.
- **Resolução de vinculação de entrada para Telegram**:
  - resolver sessão vinculada antes da finalização do roteamento (o Discord já faz isso).
- **Reconciliador de vinculação persistente**:
  - na inicialização: carregar vinculações `type: "acp"` configuradas no nível superior, garantir que as sessões ACP existam, garantir que as vinculações existam.
  - na mudança de configuração: aplicar deltas com segurança.
- **Modelo de migração**:
  - nenhum fallback de vinculação ACP local por canal é lido,
  - vinculações ACP persistentes são originadas apenas de entradas `bindings[].type="acp"` de nível superior.

## Entrega em fases

### Fase 1: Fundação do esquema de vinculação tipado

- Estender o esquema de configuração para suportar o discriminador `bindings[].type`:
  - `route`,
  - `acp` com objeto de substituição `acp` opcional (`mode`, `backend`, `cwd`, `label`).
- Estender o esquema de agente com descritor de runtime para marcar agentes nativos ACP (`agents.list[].runtime.type`).
- Adicionar divisão de parser/indexer para vinculações de rota vs ACP.

### Fase 2: Resolução de runtime + paridade Discord/Telegram

- Resolver vinculações ACP persistentes a partir de entradas `type: "acp"` de nível superior para:
  - Canais/threads Discord,
  - Tópicos de fórum Telegram (IDs canônicos `chatId:topic:topicId`).
- Implementar adaptador de vinculação Telegram e paridade de substituição de sessão vinculada de entrada com Discord.
- Não incluir variantes de tópico direto/privado do Telegram nesta fase.

### Fase 3: Paridade de comandos e resets

- Alinhar o comportamento de `/acp`, `/new`, `/reset` e `/focus` em conversas Telegram/Discord vinculadas.
- Garantir que a vinculação sobreviva aos fluxos de reset conforme configurado.

### Fase 4: Consolidação

- Diagnósticos aprimorados (`/acp status`, logs de reconciliação na inicialização).
- Tratamento de conflitos e verificações de saúde.

## Guardrails e política

- Respeitar habilitação ACP e restrições de sandbox exatamente como hoje.
- Manter escopo de conta explícito (`accountId`) para evitar vazamento entre contas.
- Falhar de forma fechada em roteamento ambíguo.
- Manter o comportamento de política de menção/acesso explícito por configuração de canal.

## Plano de testes

- Unitários:
  - normalização de ID de conversa (especialmente IDs de tópico Telegram),
  - caminhos de criação/atualização/exclusão do reconciliador,
  - fluxos `/acp bind --persist` e unbind.
- Integração:
  - tópico Telegram de entrada -> resolução de sessão ACP vinculada,
  - canal/thread Discord de entrada -> precedência de vinculação persistente.
- Regressão:
  - vinculações temporárias continuam funcionando,
  - canais/tópicos não vinculados mantêm o comportamento de roteamento atual.

## Questões em aberto

- O `/acp spawn --thread auto` em tópico Telegram deve usar `here` como padrão?
- Vinculações persistentes devem sempre ignorar o controle de menção em conversas vinculadas, ou exigir `requireMention=false` explícito?
- O `/focus` deve ganhar `--persist` como alias para `/acp bind --persist`?

## Lançamento

- Distribuir como opt-in por conversa (entrada `bindings[].type="acp"` presente).
- Começar apenas com Discord + Telegram.
- Adicionar documentação com exemplos para:
  - "um canal/tópico por agente"
  - "múltiplos canais/tópicos para o mesmo agente com `cwd` diferente"
  - "padrões de nomenclatura de equipe (`codex-1`, `claude-repo-x`)".
