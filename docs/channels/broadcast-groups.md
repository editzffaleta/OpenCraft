---
summary: "Transmitir uma mensagem do WhatsApp para multiplos agentes"
read_when:
  - Configuring broadcast groups
  - Debugging multi-agent replies in WhatsApp
status: experimental
title: "Broadcast Groups"
---

# Broadcast Groups

**Status:** Experimental
**Versao:** Adicionado em 2026.1.9

## Visao geral

Broadcast Groups permitem que multiplos agentes processem e respondam a mesma mensagem simultaneamente. Isso permite que voce crie equipes de agentes especializados que trabalham juntos em um unico grupo ou DM do WhatsApp -- tudo usando um unico numero de telefone.

Escopo atual: **Somente WhatsApp** (canal web).

Broadcast groups sao avaliados apos as listas de permitidos do canal e as regras de ativacao de grupo. Em grupos do WhatsApp, isso significa que os broadcasts acontecem quando o OpenCraft normalmente responderia (por exemplo: ao ser mencionado, dependendo das suas configuracoes de grupo).

## Casos de uso

### 1. Equipes de agentes especializados

Implante multiplos agentes com responsabilidades atomicas e focadas:

```
Grupo: "Equipe de Desenvolvimento"
Agentes:
  - CodeReviewer (revisa trechos de codigo)
  - DocumentationBot (gera documentacao)
  - SecurityAuditor (verifica vulnerabilidades)
  - TestGenerator (sugere casos de teste)
```

Cada agente processa a mesma mensagem e fornece sua perspectiva especializada.

### 2. Suporte multilinguagem

```
Grupo: "Suporte Internacional"
Agentes:
  - Agent_EN (responde em ingles)
  - Agent_DE (responde em alemao)
  - Agent_ES (responde em espanhol)
```

### 3. Fluxos de garantia de qualidade

```
Grupo: "Suporte ao Cliente"
Agentes:
  - SupportAgent (fornece resposta)
  - QAAgent (avalia qualidade, so responde se encontrar problemas)
```

### 4. Automacao de tarefas

```
Grupo: "Gerenciamento de Projetos"
Agentes:
  - TaskTracker (atualiza banco de dados de tarefas)
  - TimeLogger (registra tempo gasto)
  - ReportGenerator (cria resumos)
```

## Configuracao

### Configuracao basica

Adicione uma secao `broadcast` de nivel superior (ao lado de `bindings`). As chaves sao IDs de peer do WhatsApp:

- chats em grupo: JID do grupo (ex.: `120363403215116621@g.us`)
- DMs: numero de telefone E.164 (ex.: `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Resultado:** Quando o OpenCraft responder neste chat, ele executara todos os tres agentes.

### Estrategia de processamento

Controle como os agentes processam mensagens:

#### Paralelo (padrao)

Todos os agentes processam simultaneamente:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Sequencial

Os agentes processam em ordem (cada um espera o anterior terminar):

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### Exemplo completo

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## Como funciona

### Fluxo de mensagens

1. **Mensagem recebida** chega em um grupo do WhatsApp
2. **Verificacao de broadcast**: O sistema verifica se o ID do peer esta em `broadcast`
3. **Se estiver na lista de broadcast**:
   - Todos os agentes listados processam a mensagem
   - Cada agente tem sua propria chave de sessao e contexto isolado
   - Os agentes processam em paralelo (padrao) ou sequencialmente
4. **Se nao estiver na lista de broadcast**:
   - O roteamento normal se aplica (primeiro binding correspondente)

Nota: broadcast groups nao ignoram listas de permitidos do canal ou regras de ativacao de grupo (mencoes/comandos/etc). Eles apenas mudam _quais agentes executam_ quando uma mensagem e elegivel para processamento.

### Isolamento de sessao

Cada agente em um broadcast group mantem completamente separados:

- **Chaves de sessao** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Historico de conversa** (o agente nao ve as mensagens de outros agentes)
- **Workspace** (sandboxes separados se configurados)
- **Acesso a ferramentas** (listas de permitidos/bloqueados diferentes)
- **Memoria/contexto** (IDENTITY.md, SOUL.md, etc. separados)
- **Buffer de contexto de grupo** (mensagens recentes do grupo usadas para contexto) e compartilhado por peer, entao todos os agentes de broadcast veem o mesmo contexto quando acionados

Isso permite que cada agente tenha:

- Personalidades diferentes
- Acesso a ferramentas diferente (ex.: somente leitura vs. leitura-escrita)
- Modelos diferentes (ex.: opus vs. sonnet)
- Skills diferentes instaladas

### Exemplo: Sessoes isoladas

No grupo `120363403215116621@g.us` com agentes `["alfred", "baerbel"]`:

**Contexto do Alfred:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [mensagem do usuario, respostas anteriores do alfred]
Workspace: /Users/pascal/opencraft-alfred/
Tools: read, write, exec
```

**Contexto da Barbel:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [mensagem do usuario, respostas anteriores da baerbel]
Workspace: /Users/pascal/opencraft-baerbel/
Tools: read only
```

## Melhores praticas

### 1. Mantenha os agentes focados

Projete cada agente com uma unica responsabilidade clara:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

Bom: Cada agente tem uma funcao
Ruim: Um unico agente generico "dev-helper"

### 2. Use nomes descritivos

Deixe claro o que cada agente faz:

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. Configure acessos a ferramentas diferentes

De aos agentes apenas as ferramentas que precisam:

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] }
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] }
    }
  }
}
```

### 4. Monitore o desempenho

Com muitos agentes, considere:

- Usar `"strategy": "parallel"` (padrao) para velocidade
- Limitar broadcast groups a 5-10 agentes
- Usar modelos mais rapidos para agentes mais simples

### 5. Trate falhas graciosamente

Os agentes falham independentemente. O erro de um agente nao bloqueia os outros:

```
Mensagem -> [Agente A OK, Agente B erro, Agente C OK]
Resultado: Agente A e C respondem, Agente B registra erro
```

## Compatibilidade

### Provedores

Broadcast groups atualmente funcionam com:

- WhatsApp (implementado)
- Telegram (planejado)
- Discord (planejado)
- Slack (planejado)

### Roteamento

Broadcast groups funcionam junto com o roteamento existente:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: Apenas o alfred responde (roteamento normal)
- `GROUP_B`: agent1 E agent2 respondem (broadcast)

**Precedencia:** `broadcast` tem prioridade sobre `bindings`.

## Solucao de problemas

### Agentes nao respondem

**Verifique:**

1. Os IDs dos agentes existem em `agents.list`
2. O formato do ID do peer esta correto (ex.: `120363403215116621@g.us`)
3. Os agentes nao estao em listas de bloqueio

**Depuracao:**

```bash
tail -f ~/.opencraft/logs/gateway.log | grep broadcast
```

### Apenas um agente responde

**Causa:** O ID do peer pode estar em `bindings` mas nao em `broadcast`.

**Solucao:** Adicione a configuracao de broadcast ou remova dos bindings.

### Problemas de desempenho

**Se estiver lento com muitos agentes:**

- Reduza o numero de agentes por grupo
- Use modelos mais leves (sonnet em vez de opus)
- Verifique o tempo de inicializacao do sandbox

## Exemplos

### Exemplo 1: Equipe de revisao de codigo

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**Usuario envia:** Trecho de codigo
**Respostas:**

- code-formatter: "Indentacao corrigida e type hints adicionados"
- security-scanner: "Vulnerabilidade de SQL injection na linha 12"
- test-coverage: "Cobertura esta em 45%, faltam testes para casos de erro"
- docs-checker: "Falta docstring para a funcao `process_data`"

### Exemplo 2: Suporte multilinguagem

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## Referencia da API

### Esquema de configuracao

```typescript
interface OpenCraftConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Campos

- `strategy` (opcional): Como processar os agentes
  - `"parallel"` (padrao): Todos os agentes processam simultaneamente
  - `"sequential"`: Os agentes processam na ordem do array
- `[peerId]`: JID de grupo do WhatsApp, numero E.164 ou outro ID de peer
  - Valor: Array de IDs de agentes que devem processar as mensagens

## Limitacoes

1. **Maximo de agentes:** Sem limite rigido, mas 10+ agentes podem ser lentos
2. **Contexto compartilhado:** Agentes nao veem as respostas uns dos outros (por design)
3. **Ordenacao de mensagens:** Respostas paralelas podem chegar em qualquer ordem
4. **Limites de taxa:** Todos os agentes contam para os limites de taxa do WhatsApp

## Melhorias futuras

Recursos planejados:

- [ ] Modo de contexto compartilhado (agentes veem as respostas uns dos outros)
- [ ] Coordenacao de agentes (agentes podem sinalizar uns aos outros)
- [ ] Selecao dinamica de agentes (escolher agentes com base no conteudo da mensagem)
- [ ] Prioridades de agentes (alguns agentes respondem antes de outros)

## Veja tambem

- [Configuracao multi-agente](/tools/multi-agent-sandbox-tools)
- [Configuracao de roteamento](/channels/channel-routing)
- [Gerenciamento de sessao](/concepts/session)
