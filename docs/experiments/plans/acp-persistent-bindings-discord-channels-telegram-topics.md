# Vinculações Persistentes ACP para Canais Discord e Tópicos Telegram

Status: Rascunho

## Resumo

Introduzir vinculações ACP persistentes que mapeiam:

- canais Discord (e threads existentes, quando necessário), e
- tópicos de fórum Telegram em grupos/supergrupos (`chatId:topic:topicId`)

para sessões ACP de longa duração, com estado de vinculação armazenado em entradas `bindings[]` de nível superior usando tipos de vinculação explícitos.

Isso torna o uso do ACP em canais de mensagens com alto tráfego previsível e durável, para que os usuários possam criar canais/tópicos dedicados como `codex`, `claude-1` ou `claude-meurepositorio`.

## Por Que

O comportamento atual de ACP vinculado a threads é otimizado para fluxos de trabalho efêmeros com threads no Discord. O Telegram não tem o mesmo modelo de thread; ele tem tópicos de fórum em grupos/supergrupos. Os usuários querem "espaços de trabalho" ACP estáveis e sempre ativos em superfícies de chat, não apenas sessões de thread temporárias.

## Objetivos

- Suportar vinculação ACP durável para:
  - canais/threads Discord
  - tópicos de fórum Telegram (grupos/supergrupos)
- Tornar a configuração de vinculação a fonte da verdade.
- Manter `/acp`, `/new`, `/reset`, `/focus` e comportamento de entrega consistentes entre Discord e Telegram.
- Preservar fluxos de vinculação temporária existentes para uso ad-hoc.

## Não-Objetivos

- Redesenho completo do runtime/internos de sessão ACP.
- Remoção dos fluxos de vinculação efêmera existentes.
- Expansão para todos os canais na primeira iteração.
- Implementar tópicos de mensagens diretas do Telegram (`direct_messages_topic_id`) nesta fase.
- Implementar variantes de tópicos de chat privado do Telegram nesta fase.

## Direção de UX

### 1) Dois tipos de vinculação

- **Vinculação persistente**: salva na configuração, reconciliada na inicialização, destinada a canais/tópicos de "espaço de trabalho nomeado".
- **Vinculação temporária**: somente em runtime, expira por política de ociosidade/idade máxima.

### 2) Comportamento dos comandos

- `/acp spawn ... --thread here|auto|off` permanece disponível.
- Adicionar controles explícitos de ciclo de vida de vinculação:
  - `/acp bind [session|agent] [--persist]`
  - `/acp unbind [--persist]`
  - `/acp status` inclui se a vinculação é `persistent` (persistente) ou `temporary` (temporária).
- Em conversas vinculadas, `/new` e `/reset` reiniciam a sessão ACP vinculada no lugar e mantêm a vinculação anexada.

### 3) Identidade da conversa

- Usar IDs de conversa canônicos:
  - Discord: ID do canal/thread.
  - Tópico Telegram: `chatId:topic:topicId`.
- Nunca usar chave de vinculação Telegram apenas pelo ID do tópico isolado.

## Modelo de Configuração (Proposto)

Unificar configuração de roteamento e vinculação ACP persistente em `bindings[]` de nível superior com discriminador `type` explícito:

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

### Exemplo Mínimo (Sem Substituições ACP por Vinculação)

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
  - `acp`: vinculação persistente de harness ACP para uma conversa correspondente.
- Para `type: "acp"`, `match.peer.id` é a chave canônica de conversa:
  - Canal/thread Discord: ID bruto do canal/thread.
  - Tópico Telegram: `chatId:topic:topicId`.
- `bindings[].acp.backend` é opcional. Ordem de fallback do backend:
  1. `bindings[].acp.backend`
  2. `agents.list[].runtime.acp.backend`
  3. `acp.backend` global
- `mode`, `cwd` e `label` seguem o mesmo padrão de substituição (`substituição de vinculação -> padrão do runtime do agente -> comportamento global/padrão`).
- Manter `session.threadBindings.*` e `channels.discord.threadBindings.*` existentes para políticas de vinculação temporária.
- Entradas persistentes declaram o estado desejado; o runtime reconcilia com as sessões/vinculações ACP reais.
- Um vinculação ACP ativa por nó de conversa é o modelo pretendido.
- Compatibilidade retroativa: `type` ausente é interpretado como `route` para entradas legadas.

### Seleção de Backend

- A inicialização de sessão ACP já usa seleção de backend configurada durante o spawn (`acp.backend` hoje).
- Esta proposta estende a lógica de spawn/reconciliação para preferir substituições de vinculação ACP tipadas:
  - `bindings[].acp.backend` para substituição local de conversa.
  - `agents.list[].runtime.acp.backend` para padrões por agente.
- Se não houver substituição, manter o comportamento atual (padrão `acp.backend`).

## Adequação à Arquitetura do Sistema Atual

### Reutilizar componentes existentes

- `SessionBindingService` já suporta referências de conversa agnósticas ao canal.
- Fluxos de spawn/bind ACP já suportam vinculação por APIs de serviço.
- O Telegram já carrega contexto de tópico/thread via `MessageThreadId` e `chatId`.

### Componentes novos/estendidos

- **Adaptador de vinculação Telegram** (paralelo ao adaptador Discord):
  - registrar adaptador por conta Telegram,
  - resolver/listar/vincular/desvincular/atualizar por ID canônico de conversa.
- **Resolvedor/índice de vinculação tipada**:
  - dividir `bindings[]` em visões `route` e `acp`,
  - manter `resolveAgentRoute` apenas em vinculações `route`,
  - resolver intenção ACP persistente apenas de vinculações `acp`.
- **Resolução de vinculação de entrada para Telegram**:
  - resolver sessão vinculada antes da finalização da rota (o Discord já faz isso).
- **Reconciliador de vinculação persistente**:
  - na inicialização: carregar vinculações `type: "acp"` configuradas de nível superior, garantir que sessões ACP existam, garantir que vinculações existam.
  - na mudança de configuração: aplicar deltas com segurança.
- **Modelo de transição**:
  - nenhum fallback de vinculação ACP local do canal é lido,
  - vinculações ACP persistentes são originadas apenas de entradas `bindings[].type="acp"` de nível superior.

## Entrega em Fases

### Fase 1: Fundação do esquema de vinculação tipada

- Estender esquema de configuração para suportar discriminador `bindings[].type`:
  - `route`,
  - `acp` com objeto de substituição `acp` opcional (`mode`, `backend`, `cwd`, `label`).
- Estender esquema de agente com descritor de runtime para marcar agentes nativos ACP (`agents.list[].runtime.type`).
- Adicionar divisão parser/indexador para vinculações de rota vs ACP.

### Fase 2: Resolução em runtime + paridade Discord/Telegram

- Resolver vinculações ACP persistentes de entradas `type: "acp"` de nível superior para:
  - canais/threads Discord,
  - tópicos de fórum Telegram (IDs canônicos `chatId:topic:topicId`).
- Implementar adaptador de vinculação Telegram e paridade de substituição de sessão vinculada de entrada com Discord.
- Não incluir variantes de tópico direto/privado do Telegram nesta fase.

### Fase 3: Paridade de comandos e resets

- Alinhar comportamento de `/acp`, `/new`, `/reset` e `/focus` em conversas vinculadas Telegram/Discord.
- Garantir que a vinculação sobreviva a fluxos de reset conforme configurado.

### Fase 4: Consolidação

- Melhores diagnósticos (`/acp status`, logs de reconciliação na inicialização).
- Tratamento de conflitos e verificações de saúde.

## Proteções e Políticas

- Respeitar habilitação de ACP e restrições de sandbox exatamente como hoje.
- Manter escopo explícito de conta (`accountId`) para evitar vazamento entre contas.
- Falhar de forma fechada em roteamento ambíguo.
- Manter comportamento de política de menção/acesso explícito por configuração de canal.

## Plano de Testes

- Unitário:
  - normalização de ID de conversa (especialmente IDs de tópico Telegram),
  - caminhos de criação/atualização/exclusão do reconciliador,
  - fluxos de `/acp bind --persist` e unbind.
- Integração:
  - resolução de tópico Telegram de entrada -> sessão ACP vinculada,
  - precedência de vinculação persistente de canal/thread Discord de entrada.
- Regressão:
  - vinculações temporárias continuam funcionando,
  - canais/tópicos não vinculados mantêm comportamento de roteamento atual.

## Questões em Aberto

- `/acp spawn --thread auto` em tópico Telegram deve usar `here` por padrão?
- Vinculações persistentes devem sempre ignorar controle de menção em conversas vinculadas, ou exigir `requireMention=false` explícito?
- `/focus` deve ganhar `--persist` como alias para `/acp bind --persist`?

## Implantação

- Lançar como opt-in por conversa (entrada `bindings[].type="acp"` presente).
- Começar apenas com Discord + Telegram.
- Adicionar documentação com exemplos para:
  - "um canal/tópico por agente"
  - "múltiplos canais/tópicos para o mesmo agente com `cwd` diferentes"
  - "padrões de nomenclatura de equipe (`codex-1`, `claude-repo-x`)".
