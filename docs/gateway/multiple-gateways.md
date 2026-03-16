---
summary: "Rode múltiplos Gateways OpenCraft em um host (isolamento, portas e perfis)"
read_when:
  - Rodando mais de um Gateway na mesma máquina
  - Você precisa de config/state/portas isoladas por Gateway
title: "Múltiplos Gateways"
---

# Múltiplos Gateways (mesmo host)

A maioria dos setups deve usar um Gateway porque um único Gateway pode gerenciar múltiplas conexões de mensagens e agentes. Se você precisar de maior isolamento ou redundância (ex. um bot de resgate), rode Gateways separados com perfis/portas isolados.

## Checklist de isolamento (obrigatório)

- `OPENCLAW_CONFIG_PATH` — arquivo de config por instância
- `OPENCLAW_STATE_DIR` — sessões, credenciais e caches por instância
- `agents.defaults.workspace` — raiz de workspace por instância
- `gateway.port` (ou `--port`) — único por instância
- Portas derivadas (browser/canvas) não devem sobrepor

Se esses forem compartilhados, você terá conflitos de config e conflitos de porta.

## Recomendado: perfis (`--profile`)

Perfis auto-escopam `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` e adicionam sufixo aos nomes de serviço.

```bash
# principal
opencraft --profile main setup
opencraft --profile main gateway --port 18789

# resgate
opencraft --profile rescue setup
opencraft --profile rescue gateway --port 19001
```

Serviços por perfil:

```bash
opencraft --profile main gateway install
opencraft --profile rescue gateway install
```

## Guia de bot de resgate

Rode um segundo Gateway no mesmo host com seu próprio:

- perfil/config
- diretório de state
- workspace
- porta base (mais portas derivadas)

Isso mantém o bot de resgate isolado do bot principal para que ele possa depurar ou aplicar mudanças de config se o bot primário estiver fora.

Espaçamento de portas: deixe pelo menos 20 portas entre portas base para que as portas derivadas de browser/canvas/CDP nunca colidam.

### Como instalar (bot de resgate)

```bash
# Bot principal (existente ou novo, sem parâmetro --profile)
# Roda na porta 18789 + Portas Chrome CDC/Canvas/...
opencraft onboard
opencraft gateway install

# Bot de resgate (perfil + portas isolados)
opencraft --profile rescue onboard
# Notas:
# - o nome do workspace será pós-fixado com -rescue por padrão
# - A porta deve ser pelo menos 18789 + 20 Portas,
#   melhor escolher uma porta base completamente diferente, como 19789,
# - o resto do onboarding é igual ao normal

# Para instalar o serviço (se não aconteceu automaticamente durante o onboarding)
opencraft --profile rescue gateway install
```

## Mapeamento de portas (derivadas)

Porta base = `gateway.port` (ou `OPENCLAW_GATEWAY_PORT` / `--port`).

- porta do serviço de controle de browser = base + 2 (somente loopback)
- host canvas é servido no servidor HTTP do Gateway (mesma porta que `gateway.port`)
- Portas CDP de perfil de browser são alocadas automaticamente de `browser.controlPort + 9 .. + 108`

Se você sobrescrever qualquer uma delas em config ou env, deve mantê-las únicas por instância.

## Notas de browser/CDP (footgun comum)

- **Não** fixe `browser.cdpUrl` nos mesmos valores em múltiplas instâncias.
- Cada instância precisa de sua própria porta de controle de browser e intervalo CDP (derivados da sua porta de gateway).
- Se você precisar de portas CDP explícitas, defina `browser.profiles.<name>.cdpPort` por instância.
- Chrome remoto: use `browser.profiles.<name>.cdpUrl` (por perfil, por instância).

## Exemplo de env manual

```bash
OPENCLAW_CONFIG_PATH=~/.opencraft/main.json \
OPENCLAW_STATE_DIR=~/.opencraft-main \
opencraft gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.opencraft/rescue.json \
OPENCLAW_STATE_DIR=~/.opencraft-rescue \
opencraft gateway --port 19001
```

## Verificações rápidas

```bash
opencraft --profile main status
opencraft --profile rescue status
opencraft --profile rescue browser status
```
