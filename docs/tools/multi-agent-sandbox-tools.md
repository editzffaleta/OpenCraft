---
summary: "Restrições de sandbox + ferramentas por agente, precedência e exemplos"
title: Sandbox e Ferramentas Multi-Agente
read_when: "Você quer sandbox por agente ou políticas de permissão/negação de ferramentas por agente em um Gateway multi-agente."
status: active
---

# Configuração de Sandbox e Ferramentas Multi-Agente

## Visão geral

Cada agente em uma configuração multi-agente pode ter seu próprio:

- **Configuração de sandbox** (`agents.list[].sandbox` substitui `agents.defaults.sandbox`)
- **Restrições de ferramentas** (`tools.allow` / `tools.deny`, mais `agents.list[].tools`)

Isso permite executar múltiplos agentes com diferentes perfis de segurança:

- Assistente pessoal com acesso total
- Agentes família/trabalho com ferramentas restritas
- Agentes voltados ao público em sandboxes

`setupCommand` pertence a `sandbox.docker` (global ou por agente) e executa uma vez
quando o container é criado.

Autenticação é por agente: cada agente lê do seu próprio armazenamento de autenticação `agentDir` em:

```
~/.opencraft/agents/<agentId>/agent/auth-profiles.json
```

Credenciais **não** são compartilhadas entre agentes. Nunca reutilize `agentDir` entre agentes.
Se quiser compartilhar credenciais, copie `auth-profiles.json` para o `agentDir` do outro agente.

Para como o sandbox se comporta em runtime, veja [Sandbox](/gateway/sandboxing).
Para depurar "por que isso está bloqueado?", veja [Sandbox vs Política de Ferramenta vs Elevado](/gateway/sandbox-vs-tool-policy-vs-elevated) e `opencraft sandbox explain`.

---

## Exemplos de Configuração

### Exemplo 1: Agente Pessoal + Família Restrito

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.opencraft/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.opencraft/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**Resultado:**

- Agente `main`: Roda no host, acesso total a ferramentas
- Agente `family`: Roda em Docker (um container por agente), apenas ferramenta `read`

---

### Exemplo 2: Agente de Trabalho com Sandbox Compartilhado

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.opencraft/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.opencraft/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### Exemplo 2b: Perfil global de codificação + agente somente mensagens

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**Resultado:**

- agentes padrão recebem ferramentas de codificação
- agente `support` é somente mensagens (+ ferramenta Slack)

---

### Exemplo 3: Diferentes Modos de Sandbox por Agente

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main",
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.opencraft/workspace",
        "sandbox": {
          "mode": "off"
        }
      },
      {
        "id": "public",
        "workspace": "~/.opencraft/workspace-public",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## Precedência de Configuração

Quando tanto config global (`agents.defaults.*`) quanto específica do agente (`agents.list[].*`) existem:

### Config de Sandbox

Configurações específicas do agente substituem as globais:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Notas:**

- `agents.list[].sandbox.{docker,browser,prune}.*` substitui `agents.defaults.sandbox.{docker,browser,prune}.*` para aquele agente (ignorado quando escopo do sandbox resolve para `"shared"`).

### Restrições de Ferramentas

A ordem de filtragem é:

1. **Perfil de ferramenta** (`tools.profile` ou `agents.list[].tools.profile`)
2. **Perfil de ferramenta do provedor** (`tools.byProvider[provider].profile` ou `agents.list[].tools.byProvider[provider].profile`)
3. **Política global de ferramenta** (`tools.allow` / `tools.deny`)
4. **Política de ferramenta do provedor** (`tools.byProvider[provider].allow/deny`)
5. **Política de ferramenta específica do agente** (`agents.list[].tools.allow/deny`)
6. **Política do agente por provedor** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Política de ferramenta do sandbox** (`tools.sandbox.tools` ou `agents.list[].tools.sandbox.tools`)
8. **Política de ferramenta de subagent** (`tools.subagents.tools`, se aplicável)

Cada nível pode restringir ferramentas ainda mais, mas não pode conceder de volta ferramentas negadas em níveis anteriores.
Se `agents.list[].tools.sandbox.tools` for definido, substitui `tools.sandbox.tools` para aquele agente.
Se `agents.list[].tools.profile` for definido, substitui `tools.profile` para aquele agente.
Chaves de ferramenta do provedor aceitam `provider` (ex. `google-antigravity`) ou `provider/model` (ex. `openai/gpt-5.2`).

### Grupos de ferramentas (atalhos)

Políticas de ferramenta (global, agente, sandbox) suportam entradas `group:*` que expandem para múltiplas ferramentas concretas:

- `group:runtime`: `exec`, `bash`, `process`
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:opencraft`: todas as ferramentas integradas do OpenCraft (exclui Plugins de provedor)

### Modo Elevado

`tools.elevated` é a linha de base global (allowlist baseada em remetente). `agents.list[].tools.elevated` pode restringir ainda mais o elevado para agentes específicos (ambos devem permitir).

Padrões de mitigação:

- Negar `exec` para agentes não confiáveis (`agents.list[].tools.deny: ["exec"]`)
- Evitar colocar na allowlist remetentes que são roteados para agentes restritos
- Desabilitar elevado globalmente (`tools.elevated.enabled: false`) se você quiser apenas execução em sandbox
- Desabilitar elevado por agente (`agents.list[].tools.elevated.enabled: false`) para perfis sensíveis

---

## Migração de Agente Único

**Antes (agente único):**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.opencraft/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**Depois (multi-agente com perfis diferentes):**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.opencraft/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

Configs legadas `agent.*` são migradas pelo `opencraft doctor`; prefira `agents.defaults` + `agents.list` daqui em diante.

---

## Exemplos de Restrição de Ferramentas

### Agente Somente Leitura

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agente de Execução Segura (sem modificação de arquivos)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Agente Somente Comunicação

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

---

## Armadilha Comum: "non-main"

`agents.defaults.sandbox.mode: "non-main"` é baseado em `session.mainKey` (padrão `"main"`),
não no id do agente. Sessões de grupo/canal sempre recebem suas próprias chaves, então são
tratadas como non-main e serão colocadas em sandbox. Se você quiser que um agente nunca
use sandbox, defina `agents.list[].sandbox.mode: "off"`.

---

## Testando

Após configurar sandbox e ferramentas multi-agente:

1. **Verifique a resolução de agente:**

   ```exec
   opencraft agents list --bindings
   ```

2. **Verifique containers de sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Teste restrições de ferramentas:**
   - Envie uma mensagem requerendo ferramentas restritas
   - Verifique se o agente não pode usar ferramentas negadas

4. **Monitore logs:**

   ```exec
   tail -f "${OPENCRAFT_STATE_DIR:-$HOME/.opencraft}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Solução de Problemas

### Agente não em sandbox apesar de `mode: "all"`

- Verifique se há um `agents.defaults.sandbox.mode` global que o substitui
- Config específica do agente tem precedência, então defina `agents.list[].sandbox.mode: "all"`

### Ferramentas ainda disponíveis apesar da lista de negação

- Verifique a ordem de filtragem de ferramentas: global -> agente -> sandbox -> subagent
- Cada nível só pode restringir mais, não conceder de volta
- Verifique nos logs: `[tools] filtering tools for agent:${agentId}`

### Container não isolado por agente

- Defina `scope: "agent"` na config de sandbox específica do agente
- Padrão é `"session"` que cria um container por sessão

---

## Veja Também

- [Roteamento Multi-Agente](/concepts/multi-agent)
- [Configuração de Sandbox](/gateway/configuration#agentsdefaults-sandbox)
- [Gerenciamento de Sessão](/concepts/session)
