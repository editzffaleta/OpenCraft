---
summary: "Referência do CLI para `opencraft config` (get/set/unset/file/validate)"
read_when:
  - Você quer ler ou editar config de forma não interativa
title: "config"
---

# `opencraft config`

Helpers de config: get/set/unset/validate valores por path e imprimir o arquivo
de config ativo. Rodar sem um subcomando abre
o wizard de configuração (mesmo que `opencraft configure`).

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

## Paths

Paths usam notação de ponto ou colchete:

```bash
opencraft config get agents.defaults.workspace
opencraft config get agents.list[0].id
```

Use o índice da lista de agentes para visar um agente específico:

```bash
opencraft config get agents.list
opencraft config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Valores

Valores são analisados como JSON5 quando possível; caso contrário são tratados como strings.
Use `--strict-json` para exigir análise JSON5. `--json` permanece suportado como alias legado.

```bash
opencraft config set agents.defaults.heartbeat.every "0m"
opencraft config set gateway.port 19001 --strict-json
opencraft config set channels.whatsapp.groups '["*"]' --strict-json
```

## Subcomandos

- `config file`: Imprimir o path do arquivo de config ativo (resolvido de `OPENCLAW_CONFIG_PATH` ou localização padrão).

Reiniciar o gateway após edições.

## Validar

Validar a config atual contra o schema ativo sem iniciar o
gateway.

```bash
opencraft config validate
opencraft config validate --json
```
