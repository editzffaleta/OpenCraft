---
title: CLI de Sandbox
summary: "Gerenciar containers de sandbox e inspecionar política de sandbox efetiva"
read_when: "Você está gerenciando containers de sandbox ou depurando comportamento de sandbox/tool-policy."
status: active
---

# CLI de Sandbox

Gerenciar containers Docker de sandbox para execução isolada de agente.

## Visão geral

OpenCraft pode rodar agentes em containers Docker isolados por segurança. Os comandos `sandbox` ajudam você a gerenciar esses containers, especialmente após atualizações ou mudanças de configuração.

## Comandos

### `opencraft sandbox explain`

Inspecionar o modo/escopo/acesso ao workspace de sandbox **efetivo**, política de tools de sandbox e gates elevados (com paths de chave de config para correção).

```bash
opencraft sandbox explain
opencraft sandbox explain --session agent:main:main
opencraft sandbox explain --agent work
opencraft sandbox explain --json
```

### `opencraft sandbox list`

Listar todos os containers de sandbox com seu status e configuração.

```bash
opencraft sandbox list
opencraft sandbox list --browser  # Listar apenas containers de browser
opencraft sandbox list --json     # Saída JSON
```

**Saída inclui:**

- Nome e status do container (running/stopped)
- Imagem Docker e se corresponde à config
- Idade (tempo desde a criação)
- Tempo idle (tempo desde o último uso)
- Sessão/agente associado

### `opencraft sandbox recreate`

Remover containers de sandbox para forçar recriação com imagens/config atualizadas.

```bash
opencraft sandbox recreate --all                # Recriar todos os containers
opencraft sandbox recreate --session main       # Sessão específica
opencraft sandbox recreate --agent mybot        # Agente específico
opencraft sandbox recreate --browser            # Apenas containers de browser
opencraft sandbox recreate --all --force        # Pular confirmação
```

**Opções:**

- `--all`: Recriar todos os containers de sandbox
- `--session <key>`: Recriar container para sessão específica
- `--agent <id>`: Recriar containers para agente específico
- `--browser`: Recriar apenas containers de browser
- `--force`: Pular prompt de confirmação

**Importante:** Containers são automaticamente recriados quando o agente for usado na próxima vez.

## Casos de uso

### Após atualizar imagens Docker

```bash
# Baixar nova imagem
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Atualizar config para usar nova imagem
# Editar config: agents.defaults.sandbox.docker.image (ou agents.list[].sandbox.docker.image)

# Recriar containers
opencraft sandbox recreate --all
```

### Após mudar a configuração de sandbox

```bash
# Editar config: agents.defaults.sandbox.* (ou agents.list[].sandbox.*)

# Recriar para aplicar nova config
opencraft sandbox recreate --all
```

### Após mudar setupCommand

```bash
opencraft sandbox recreate --all
# ou apenas um agente:
opencraft sandbox recreate --agent family
```

### Apenas para um agente específico

```bash
# Atualizar apenas os containers de um agente
opencraft sandbox recreate --agent alfred
```

## Por que isso é necessário?

**Problema:** Quando você atualiza imagens Docker de sandbox ou configuração:

- Containers existentes continuam rodando com configurações antigas
- Containers só são removidos após 24h de inatividade
- Agentes usados regularmente mantêm containers antigos rodando indefinidamente

**Solução:** Use `opencraft sandbox recreate` para forçar a remoção de containers antigos. Eles serão recriados automaticamente com as configurações atuais quando forem necessários.

Dica: prefira `opencraft sandbox recreate` ao `docker rm` manual. Ele usa o
naming de container do Gateway e evita incompatibilidades quando chaves de escopo/sessão mudam.

## Configuração

Configurações de sandbox ficam em `~/.opencraft/opencraft.json` em `agents.defaults.sandbox` (overrides por agente vão em `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... mais opções Docker
        },
        "prune": {
          "idleHours": 24, // Auto-remover após 24h idle
          "maxAgeDays": 7, // Auto-remover após 7 dias
        },
      },
    },
  },
}
```

## Veja também

- [Documentação de Sandbox](/gateway/sandboxing)
- [Configuração de Agente](/concepts/agent-workspace)
- [Comando Doctor](/gateway/doctor) - Verificar setup de sandbox
