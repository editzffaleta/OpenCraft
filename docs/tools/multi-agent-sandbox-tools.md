---
summary: "Sandbox e restrições de tools por agente, precedência e exemplos"
title: Sandbox & Tools Multi-Agente
read_when: "Você quer sandboxing por agente ou políticas de allow/deny de tools por agente em um gateway multi-agente."
status: active
---

# Configuração de Sandbox & Tools Multi-Agente

## Visão geral

Cada agente em uma configuração multi-agente pode agora ter seu próprio:

- **Configuração de sandbox** (`agents.list[].sandbox` sobrescreve `agents.defaults.sandbox`)
- **Restrições de tools** (`tools.allow` / `tools.deny`, mais `agents.list[].tools`)

Isso permite rodar múltiplos agentes com diferentes perfis de segurança:

- Assistente pessoal com acesso completo
- Agentes de família/trabalho com tools restritas
- Agentes públicos em sandboxes

`setupCommand` pertence a `sandbox.docker` (global ou por agente) e roda uma vez
quando o container é criado.

A autenticação é por agente: cada agente lê do seu próprio armazém de autenticação `agentDir` em:

```
~/.opencraft/agents/<agentId>/agent/auth-profiles.json
```

Credenciais **não** são compartilhadas entre agentes. Nunca reutilize `agentDir` entre agentes.
Se você quer compartilhar credenciais, copie `auth-profiles.json` para o `agentDir` do outro agente.

Para como o sandboxing se comporta em runtime, veja [Sandboxing](/gateway/sandboxing).
Para depurar "por que isso está bloqueado?", veja [Sandbox vs Política de Tool vs Elevado](/gateway/sandbox-vs-tool-policy-vs-elevated) e `opencraft sandbox explain`.

---

## Exemplos de configuração

### Exemplo 1: Agente pessoal + Agente de família restrito

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Assistente Pessoal",
        "workspace": "~/.opencraft/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Bot da Família",
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

- Agente `main`: Roda no host, acesso completo às tools
- Agente `family`: Roda no Docker (um container por agente), apenas tool `read`

---

### Exemplo 2: Agente de trabalho com sandbox compartilhado

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

### Exemplo 2b: Perfil coding global + agente somente mensagens

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

- agentes padrão recebem tools de coding
- agente `support` é somente mensagens (+ tool Slack)

---

### Exemplo 3: Modos de sandbox diferentes por agente

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Padrão global
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.opencraft/workspace",
        "sandbox": {
          "mode": "off" // Override: main nunca em sandbox
        }
      },
      {
        "id": "public",
        "workspace": "~/.opencraft/workspace-public",
        "sandbox": {
          "mode": "all", // Override: public sempre em sandbox
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

## Precedência de configuração

Quando tanto config global (`agents.defaults.*`) quanto por agente (`agents.list[].*`) existem:

### Config de sandbox

Configurações por agente sobrescrevem globais:

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

- `agents.list[].sandbox.{docker,browser,prune}.*` sobrescreve `agents.defaults.sandbox.{docker,browser,prune}.*` para aquele agente (ignorado quando o escopo do sandbox resolve para `"shared"`).

### Restrições de tools

A ordem de filtragem é:

1. **Perfil de tool** (`tools.profile` ou `agents.list[].tools.profile`)
2. **Perfil de tool do provedor** (`tools.byProvider[provedor].profile` ou `agents.list[].tools.byProvider[provedor].profile`)
3. **Política de tool global** (`tools.allow` / `tools.deny`)
4. **Política de tool do provedor** (`tools.byProvider[provedor].allow/deny`)
5. **Política de tool por agente** (`agents.list[].tools.allow/deny`)
6. **Política de provedor por agente** (`agents.list[].tools.byProvider[provedor].allow/deny`)
7. **Política de tool de sandbox** (`tools.sandbox.tools` ou `agents.list[].tools.sandbox.tools`)
8. **Política de tool de subagente** (`tools.subagents.tools`, se aplicável)

Cada nível pode restringir ainda mais as tools, mas não pode retomar tools negadas de níveis anteriores.
Se `agents.list[].tools.sandbox.tools` estiver definido, substitui `tools.sandbox.tools` para aquele agente.
Se `agents.list[].tools.profile` estiver definido, sobrescreve `tools.profile` para aquele agente.
Chaves de tool de provedor aceitam `provedor` (ex.: `google-antigravity`) ou `provedor/modelo` (ex.: `openai/gpt-5.2`).

### Grupos de tools (atalhos)

Políticas de tools (global, por agente, sandbox) suportam entradas `group:*` que expandem para múltiplas tools concretas:

- `group:runtime`: `exec`, `bash`, `process`
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: todas as tools OpenCraft embutidas (exclui plugins de provedor)

### Modo elevado

`tools.elevated` é a baseline global (allowlist baseada em remetente). `agents.list[].tools.elevated` pode restringir ainda mais o modo elevado para agentes específicos (ambos devem permitir).

Padrões de mitigação:

- Negar `exec` para agentes não confiáveis (`agents.list[].tools.deny: ["exec"]`)
- Evitar remetentes na allowlist que roteiam para agentes restritos
- Desabilitar elevated globalmente (`tools.elevated.enabled: false`) se você quer apenas execução em sandbox
- Desabilitar elevated por agente (`agents.list[].tools.elevated.enabled: false`) para perfis sensíveis

---

## Migração de agente único

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

**Depois (multi-agente com diferentes perfis):**

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

Configs legadas `agent.*` são migradas pelo `opencraft doctor`; prefira `agents.defaults` + `agents.list` daqui para frente.

---

## Exemplos de restrições de tools

### Agente somente leitura

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agente de execução segura (sem modificações de arquivo)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Agente somente comunicação

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

## Armadilha comum: "non-main"

`agents.defaults.sandbox.mode: "non-main"` é baseado em `session.mainKey` (padrão `"main"`),
não no id do agente. Sessões de grupo/canal sempre recebem suas próprias chaves, então são
tratadas como non-main e serão em sandbox. Se você quer que um agente nunca
seja em sandbox, defina `agents.list[].sandbox.mode: "off"`.

---

## Testes

Após configurar sandbox multi-agente e tools:

1. **Verificar resolução de agente:**

   ```exec
   opencraft agents list --bindings
   ```

2. **Verificar containers de sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Testar restrições de tools:**
   - Enviar uma mensagem que requer tools restritas
   - Verificar que o agente não pode usar tools negadas

4. **Monitorar logs:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.opencraft}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Solução de problemas

### Agente não em sandbox apesar de `mode: "all"`

- Verifique se há um `agents.defaults.sandbox.mode` global que sobrescreve
- Config por agente tem precedência, então defina `agents.list[].sandbox.mode: "all"`

### Tools ainda disponíveis apesar da lista de negação

- Verifique a ordem de filtragem de tools: global → agente → sandbox → subagente
- Cada nível só pode restringir ainda mais, não conceder de volta
- Verifique nos logs: `[tools] filtering tools for agent:${agentId}`

### Container não isolado por agente

- Defina `scope: "agent"` na config de sandbox por agente
- Padrão é `"session"` que cria um container por sessão

---

## Veja também

- [Roteamento Multi-Agente](/concepts/multi-agent)
- [Configuração de Sandbox](/gateway/configuration#agentsdefaults-sandbox)
- [Gerenciamento de Sessão](/concepts/session)
