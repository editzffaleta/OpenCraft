---
summary: "Transmitir uma mensagem do WhatsApp para múltiplos agentes"
read_when:
  - Configurando grupos de transmissão
  - Depurando respostas de múltiplos agentes no WhatsApp
status: experimental
title: "Grupos de Transmissão"
---

# Grupos de Transmissão

**Status:** Experimental
**Versão:** Adicionado em 2026.1.9

## Visão geral

Grupos de Transmissão permitem que múltiplos agentes processem e respondam à mesma mensagem simultaneamente. Isso permite criar equipes de agentes especializados que trabalham juntos em um único grupo ou DM do WhatsApp — tudo usando um número de telefone.

Escopo atual: **apenas WhatsApp** (canal web).

Grupos de transmissão são avaliados após as listas de permissão do canal e as regras de ativação de grupo. Em grupos do WhatsApp, isso significa que as transmissões acontecem quando o OpenCraft normalmente responderia (por exemplo: na menção, dependendo das configurações do grupo).

## Casos de Uso

### 1. Equipes de Agentes Especializados

Implante múltiplos agentes com responsabilidades atômicas e focadas:

```
Grupo: "Equipe de Desenvolvimento"
Agentes:
  - CodeReviewer (revisa trechos de código)
  - DocumentationBot (gera docs)
  - SecurityAuditor (verifica vulnerabilidades)
  - TestGenerator (sugere casos de teste)
```

Cada agente processa a mesma mensagem e fornece sua perspectiva especializada.

### 2. Suporte Multilíngue

```
Grupo: "Suporte Internacional"
Agentes:
  - Agent_EN (responde em inglês)
  - Agent_DE (responde em alemão)
  - Agent_ES (responde em espanhol)
```

### 3. Fluxos de Controle de Qualidade

```
Grupo: "Suporte ao Cliente"
Agentes:
  - SupportAgent (fornece resposta)
  - QAAgent (revisa qualidade, só responde se encontrar problemas)
```

### 4. Automação de Tarefas

```
Grupo: "Gerenciamento de Projetos"
Agentes:
  - TaskTracker (atualiza banco de dados de tarefas)
  - TimeLogger (registra tempo gasto)
  - ReportGenerator (cria resumos)
```

## Configuração

### Configuração Básica

Adicione uma seção `broadcast` no nível superior (ao lado de `bindings`). As chaves são IDs de peer do WhatsApp:

- chats em grupo: JID do grupo (ex.: `120363403215116621@g.us`)
- DMs: número de telefone E.164 (ex.: `+5511999999999`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Resultado:** Quando o OpenCraft responderia neste chat, ele executará todos os três agentes.

### Estratégia de Processamento

Controle como os agentes processam as mensagens:

#### Paralelo (Padrão)

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

Os agentes processam em ordem (um espera o anterior terminar):

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### Exemplo Completo

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/caminho/para/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/caminho/para/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/caminho/para/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+5511999999999": ["assistant", "logger"]
  }
}
```

## Como Funciona

### Fluxo de Mensagens

1. **Mensagem de entrada** chega em um grupo do WhatsApp
2. **Verificação de transmissão**: o sistema verifica se o ID do peer está em `broadcast`
3. **Se estiver na lista de transmissão**:
   - Todos os agentes listados processam a mensagem
   - Cada agente tem sua própria chave de sessão e contexto isolado
   - Os agentes processam em paralelo (padrão) ou sequencialmente
4. **Se não estiver na lista de transmissão**:
   - O roteamento normal é aplicado (primeiro binding correspondente)

Nota: grupos de transmissão não ignoram listas de permissão do canal ou regras de ativação de grupo (menções/comandos/etc). Eles apenas mudam _quais agentes executam_ quando uma mensagem é elegível para processamento.

### Isolamento de Sessão

Cada agente em um grupo de transmissão mantém separados completamente:

- **Chaves de sessão** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Histórico de conversa** (o agente não vê as mensagens dos outros agentes)
- **Workspace** (sandboxes separados se configurados)
- **Acesso a ferramentas** (listas de permissão/negação diferentes)
- **Memória/contexto** (IDENTITY.md, SOUL.md, etc. separados)
- **Buffer de contexto de grupo** (mensagens recentes do grupo usadas como contexto) é compartilhado por peer, então todos os agentes de transmissão veem o mesmo contexto quando acionados

Isso permite que cada agente tenha:

- Personalidades diferentes
- Acesso a ferramentas diferente (ex.: somente leitura vs leitura-escrita)
- Modelos diferentes (ex.: opus vs sonnet)
- Skills diferentes instaladas

### Exemplo: Sessões Isoladas

No grupo `120363403215116621@g.us` com agentes `["alfred", "baerbel"]`:

**Contexto do Alfred:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/pascal/opencraft-alfred/
Tools: read, write, exec
```

**Contexto do Bärbel:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/pascal/opencraft-baerbel/
Tools: read only
```

## Boas Práticas

### 1. Mantenha os Agentes Focados

Projete cada agente com uma responsabilidade única e clara:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **Bom:** Cada agente tem uma tarefa
❌ **Ruim:** Um agente genérico "dev-helper"

### 2. Use Nomes Descritivos

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

### 3. Configure Acesso Diferente a Ferramentas

Dê aos agentes apenas as ferramentas de que precisam:

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // Somente leitura
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // Leitura-escrita
    }
  }
}
```

### 4. Monitore o Desempenho

Com muitos agentes, considere:

- Usar `"strategy": "parallel"` (padrão) para velocidade
- Limitar grupos de transmissão a 5-10 agentes
- Usar modelos mais rápidos para agentes mais simples

### 5. Trate Falhas Graciosamente

Os agentes falham de forma independente. O erro de um agente não bloqueia os outros:

```
Mensagem → [Agente A ✓, Agente B ✗ erro, Agente C ✓]
Resultado: Agente A e C respondem, Agente B registra erro
```

## Compatibilidade

### Provedores

Grupos de transmissão funcionam atualmente com:

- ✅ WhatsApp (implementado)
- 🚧 Telegram (planejado)
- 🚧 Discord (planejado)
- 🚧 Slack (planejado)

### Roteamento

Grupos de transmissão funcionam junto com o roteamento existente:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GRUPO_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GRUPO_B": ["agent1", "agent2"]
  }
}
```

- `GRUPO_A`: Apenas alfred responde (roteamento normal)
- `GRUPO_B`: agent1 E agent2 respondem (transmissão)

**Precedência:** `broadcast` tem prioridade sobre `bindings`.

## Solução de Problemas

### Agentes Não Respondem

**Verifique:**

1. IDs de agente existem em `agents.list`
2. Formato do ID do peer está correto (ex.: `120363403215116621@g.us`)
3. Agentes não estão em listas de negação

**Debug:**

```bash
tail -f ~/.opencraft/logs/gateway.log | grep broadcast
```

### Apenas Um Agente Respondendo

**Causa:** O ID do peer pode estar em `bindings` mas não em `broadcast`.

**Solução:** Adicione à config de broadcast ou remova dos bindings.

### Problemas de Desempenho

**Se lento com muitos agentes:**

- Reduza o número de agentes por grupo
- Use modelos mais leves (sonnet em vez de opus)
- Verifique o tempo de inicialização do sandbox

## Exemplos

### Exemplo 1: Equipe de Revisão de Código

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

**Usuário envia:** Trecho de código
**Respostas:**

- code-formatter: "Indentação corrigida e type hints adicionados"
- security-scanner: "⚠️ Vulnerabilidade de injeção SQL na linha 12"
- test-coverage: "Cobertura é 45%, testes ausentes para casos de erro"
- docs-checker: "Docstring ausente para a função `process_data`"

### Exemplo 2: Suporte Multilíngue

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+5511999999999": ["detect-language", "translator-en", "translator-de"]
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

## Referência da API

### Schema de Config

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Campos

- `strategy` (opcional): Como processar os agentes
  - `"parallel"` (padrão): Todos os agentes processam simultaneamente
  - `"sequential"`: Agentes processam na ordem do array
- `[peerId]`: JID de grupo do WhatsApp, número E.164 ou outro ID de peer
  - Valor: Array de IDs de agentes que devem processar mensagens

## Limitações

1. **Máximo de agentes:** Sem limite fixo, mas 10+ agentes podem ser lentos
2. **Contexto compartilhado:** Os agentes não veem as respostas uns dos outros (por design)
3. **Ordenação de mensagens:** Respostas paralelas podem chegar em qualquer ordem
4. **Limites de taxa:** Todos os agentes contam para os limites de taxa do WhatsApp

## Melhorias Futuras

Recursos planejados:

- [ ] Modo de contexto compartilhado (agentes veem as respostas uns dos outros)
- [ ] Coordenação de agentes (agentes podem sinalizar uns para os outros)
- [ ] Seleção dinâmica de agentes (escolher agentes com base no conteúdo da mensagem)
- [ ] Prioridades de agentes (alguns agentes respondem antes de outros)

## Veja Também

- [Configuração Multi-Agente](/tools/multi-agent-sandbox-tools)
- [Configuração de Roteamento](/channels/channel-routing)
- [Gerenciamento de Sessão](/concepts/session)
