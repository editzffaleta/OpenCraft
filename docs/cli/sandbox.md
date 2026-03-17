---
title: Sandbox CLI
summary: "Gerenciar runtimes de sandbox e inspecionar política efetiva de sandbox"
read_when: "Você está gerenciando runtimes de sandbox ou depurando comportamento de sandbox/política de ferramentas."
status: active
---

# Sandbox CLI

Gerenciar runtimes de sandbox para execução isolada de agentes.

## Visão geral

O OpenCraft pode executar agentes em runtimes de sandbox isolados para segurança. Os comandos `sandbox` ajudam você a inspecionar e recriar esses runtimes após atualizações ou mudanças de configuração.

Hoje isso geralmente significa:

- Contêineres Docker de sandbox
- Runtimes de sandbox SSH quando `agents.defaults.sandbox.backend = "ssh"`
- Runtimes de sandbox OpenShell quando `agents.defaults.sandbox.backend = "openshell"`

Para `ssh` e OpenShell `remote`, a recriação importa mais do que com Docker:

- o workspace remoto é canônico após a semeadura inicial
- `opencraft sandbox recreate` exclui esse workspace remoto canônico para o escopo selecionado
- o próximo uso o semeia novamente a partir do workspace local atual

## Comandos

### `opencraft sandbox explain`

Inspecionar o modo/escopo/acesso ao workspace de sandbox **efetivo**, política de ferramentas de sandbox e portas elevadas (com caminhos de chave de config para correção).

```bash
opencraft sandbox explain
opencraft sandbox explain --session agent:main:main
opencraft sandbox explain --agent work
opencraft sandbox explain --json
```

### `opencraft sandbox list`

Listar todos os runtimes de sandbox com seus status e configuração.

```bash
opencraft sandbox list
opencraft sandbox list --browser  # Listar apenas contêineres de navegador
opencraft sandbox list --json     # Saída JSON
```

**A saída inclui:**

- Nome e status do runtime
- Backend (`docker`, `openshell`, etc.)
- Label de config e se corresponde ao config atual
- Idade (tempo desde a criação)
- Tempo ocioso (tempo desde o último uso)
- Sessão/agente associado

### `opencraft sandbox recreate`

Remover runtimes de sandbox para forçar recriação com config atualizado.

```bash
opencraft sandbox recreate --all                # Recriar todos os contêineres
opencraft sandbox recreate --session main       # Sessão específica
opencraft sandbox recreate --agent mybot        # Agente específico
opencraft sandbox recreate --browser            # Apenas contêineres de navegador
opencraft sandbox recreate --all --force        # Pular confirmação
```

**Opções:**

- `--all`: Recriar todos os contêineres de sandbox
- `--session <key>`: Recriar contêiner para sessão específica
- `--agent <id>`: Recriar contêineres para agente específico
- `--browser`: Apenas recriar contêineres de navegador
- `--force`: Pular prompt de confirmação

**Importante:** Runtimes são automaticamente recriados quando o agente é usado novamente.

## Casos de uso

### Após atualizar uma imagem Docker

```bash
# Baixar nova imagem
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Atualizar config para usar nova imagem
# Editar config: agents.defaults.sandbox.docker.image (ou agents.list[].sandbox.docker.image)

# Recriar contêineres
opencraft sandbox recreate --all
```

### Após alterar configuração de sandbox

```bash
# Editar config: agents.defaults.sandbox.* (ou agents.list[].sandbox.*)

# Recriar para aplicar novo config
opencraft sandbox recreate --all
```

### Após alterar alvo SSH ou material de autenticação SSH

```bash
# Editar config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

opencraft sandbox recreate --all
```

Para o backend `ssh` principal, a recriação exclui a raiz do workspace remoto por escopo
no alvo SSH. A próxima execução o semeia novamente a partir do workspace local.

### Após alterar fonte, política ou modo do OpenShell

```bash
# Editar config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

opencraft sandbox recreate --all
```

Para o modo `remote` do OpenShell, a recriação exclui o workspace remoto canônico
para aquele escopo. A próxima execução o semeia novamente a partir do workspace local.

### Após alterar setupCommand

```bash
opencraft sandbox recreate --all
# ou apenas um agente:
opencraft sandbox recreate --agent family
```

### Para um agente específico apenas

```bash
# Atualizar apenas os contêineres de um agente
opencraft sandbox recreate --agent alfred
```

## Por que isso é necessário?

**Problema:** Quando você atualiza a configuração de sandbox:

- Runtimes existentes continuam executando com configurações antigas
- Runtimes só são removidos após 24h de inatividade
- Agentes usados regularmente mantêm runtimes antigos vivos indefinidamente

**Solução:** Use `opencraft sandbox recreate` para forçar a remoção de runtimes antigos. Eles serão recriados automaticamente com as configurações atuais quando necessário.

Dica: prefira `opencraft sandbox recreate` em vez de limpeza manual específica do backend.
Ele usa o registro de runtime do Gateway e evita incompatibilidades quando chaves de escopo/sessão mudam.

## Configuração

As configurações de sandbox ficam em `~/.editzffaleta/OpenCraft.json` sob `agents.defaults.sandbox` (sobrescritas por agente vão em `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... mais opções Docker
        },
        "prune": {
          "idleHours": 24, // Remoção automática após 24h ociosas
          "maxAgeDays": 7, // Remoção automática após 7 dias
        },
      },
    },
  },
}
```

## Veja também

- [Documentação de Sandbox](/gateway/sandboxing)
- [Configuração de Agente](/concepts/agent-workspace)
- [Comando Doctor](/gateway/doctor) - Verificar configuração de sandbox
