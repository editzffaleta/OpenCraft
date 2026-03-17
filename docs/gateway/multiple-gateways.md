---
summary: "Executar múltiplos Gateways OpenCraft em um host (isolamento, portas e perfis)"
read_when:
  - Executando mais de um Gateway na mesma máquina
  - Você precisa de config/estado/portas isolados por Gateway
title: "Multiple Gateways"
---

# Múltiplos Gateways (mesmo host)

A maioria dos setups deve usar um Gateway porque um único Gateway pode lidar com múltiplas conexões de mensagens e agentes. Se você precisa de isolamento mais forte ou redundância (ex. um bot de resgate), execute Gateways separados com perfis/portas isolados.

## Checklist de isolamento (obrigatório)

- `OPENCRAFT_CONFIG_PATH` — arquivo de config por instância
- `OPENCRAFT_STATE_DIR` — sessões, credenciais, caches por instância
- `agents.defaults.workspace` — raiz do workspace por instância
- `gateway.port` (ou `--port`) — único por instância
- Portas derivadas (browser/canvas) não devem se sobrepor

Se estes forem compartilhados, você terá corridas de config e conflitos de porta.

## Recomendado: perfis (`--profile`)

Perfis definem escopo automático de `OPENCRAFT_STATE_DIR` + `OPENCRAFT_CONFIG_PATH` e adicionam sufixo aos nomes de serviço.

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

## Guia do bot de resgate

Execute um segundo Gateway no mesmo host com seu próprio:

- perfil/config
- diretório de estado
- workspace
- porta base (mais portas derivadas)

Isso mantém o bot de resgate isolado do bot principal para que ele possa debugar ou aplicar mudanças de config se o bot primário estiver fora do ar.

Espaçamento de portas: deixe pelo menos 20 portas entre portas base para que as portas derivadas de browser/canvas/CDP nunca colidam.

### Como instalar (bot de resgate)

```bash
# Bot principal (existente ou novo, sem parâmetro --profile)
# Executa na porta 18789 + portas Chrome CDC/Canvas/...
opencraft onboard
opencraft gateway install

# Bot de resgate (perfil isolado + portas)
opencraft --profile rescue onboard
# Notas:
# - o nome do workspace será pós-fixado com -rescue por padrão
# - A porta deve ser pelo menos 18789 + 20 portas,
#   melhor escolher uma porta base completamente diferente, como 19789,
# - o resto do onboarding é o mesmo que o normal

# Para instalar o serviço (se não aconteceu automaticamente durante o setup)
opencraft --profile rescue gateway install
```

## Mapeamento de portas (derivadas)

Porta base = `gateway.port` (ou `OPENCRAFT_GATEWAY_PORT` / `--port`).

- porta do serviço de controle do browser = base + 2 (apenas loopback)
- canvas host é servido no servidor HTTP do Gateway (mesma porta que `gateway.port`)
- Portas CDP de perfil do browser auto-alocam de `browser.controlPort + 9 .. + 108`

Se você sobrescrever qualquer uma dessas na config ou env, deve mantê-las únicas por instância.

## Notas de Browser/CDP (armadilha comum)

- **Não** fixe `browser.cdpUrl` nos mesmos valores em múltiplas instâncias.
- Cada instância precisa de sua própria porta de controle de browser e faixa CDP (derivada de sua porta de gateway).
- Se você precisa de portas CDP explícitas, defina `browser.profiles.<name>.cdpPort` por instância.
- Chrome remoto: use `browser.profiles.<name>.cdpUrl` (por perfil, por instância).

## Exemplo manual com env

```bash
OPENCRAFT_CONFIG_PATH=~/.opencraft/main.json \
OPENCRAFT_STATE_DIR=~/.opencraft-main \
opencraft gateway --port 18789

OPENCRAFT_CONFIG_PATH=~/.opencraft/rescue.json \
OPENCRAFT_STATE_DIR=~/.opencraft-rescue \
opencraft gateway --port 19001
```

## Verificações rápidas

```bash
opencraft --profile main status
opencraft --profile rescue status
opencraft --profile rescue browser status
```
