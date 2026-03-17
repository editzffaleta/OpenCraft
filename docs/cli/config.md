---
summary: "Referência CLI para `opencraft config` (get/set/unset/file/validate)"
read_when:
  - Você quer ler ou editar config de forma não interativa
title: "config"
---

# `opencraft config`

Auxiliares de config: get/set/unset/validate valores por caminho e imprimir o
arquivo de config ativo. Execute sem um subcomando para abrir
o assistente de configuração (mesmo que `opencraft configure`).

## Exemplos

```bash
opencraft config file
opencraft config get browser.executablePath
opencraft config set browser.executablePath "/usr/bin/google-chrome"
opencraft config set agents.defaults.heartbeat.every "2h"
opencraft config set agents.list[0].tools.exec.node "node-id-or-name"
opencraft config unset tools.web.search.apiKey
opencraft config validate
opencraft config validate --json
```

## Caminhos

Caminhos usam notação de ponto ou colchetes:

```bash
opencraft config get agents.defaults.workspace
opencraft config get agents.list[0].id
```

Use o índice da lista de agentes para direcionar um agente específico:

```bash
opencraft config get agents.list
opencraft config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Valores

Valores são interpretados como JSON5 quando possível; caso contrário, são tratados como strings.
Use `--strict-json` para exigir interpretação JSON5. `--json` continua suportado como alias legado.

```bash
opencraft config set agents.defaults.heartbeat.every "0m"
opencraft config set gateway.port 19001 --strict-json
opencraft config set channels.whatsapp.groups '["*"]' --strict-json
```

## Subcomandos

- `config file`: Imprime o caminho do arquivo de config ativo (resolvido de `OPENCRAFT_CONFIG_PATH` ou localização padrão).

Reinicie o gateway após edições.

## Validar

Valide a config atual contra o esquema ativo sem iniciar o
gateway.

```bash
opencraft config validate
opencraft config validate --json
```
