---
name: mcporter
description: Use o CLI mcporter para listar, configurar, autenticar e chamar servidores/ferramentas MCP diretamente (HTTP ou stdio), incluindo servidores ad-hoc, edições de configuração e geração de CLI/tipos.
homepage: http://mcporter.dev
metadata:
  {
    "opencraft":
      {
        "emoji": "📦",
        "requires": { "bins": ["mcporter"] },
        "install":
          [
            {
              "id": "node",
              "kind": "node",
              "package": "mcporter",
              "bins": ["mcporter"],
              "label": "Instalar mcporter (node)",
            },
          ],
      },
  }
---

# mcporter

Use `mcporter` para trabalhar com servidores MCP diretamente.

Início rápido

- `mcporter list`
- `mcporter list <server> --schema`
- `mcporter call <server.tool> key=value`

Chamar ferramentas

- Seletor: `mcporter call linear.list_issues team=ENG limit:5`
- Sintaxe de função: `mcporter call "linear.create_issue(title: \"Bug\")"`
- URL completa: `mcporter call https://api.exemplo.com/mcp.fetch url:https://exemplo.com`
- Stdio: `mcporter call --stdio "bun run ./server.ts" scrape url=https://exemplo.com`
- Payload JSON: `mcporter call <server.tool> --args '{"limit":5}'`

Autenticação + configuração

- OAuth: `mcporter auth <server | url> [--reset]`
- Config: `mcporter config list|get|add|remove|import|login|logout`

Daemon

- `mcporter daemon start|status|stop|restart`

Geração de código

- CLI: `mcporter generate-cli --server <nome>` ou `--command <url>`
- Inspecionar: `mcporter inspect-cli <caminho> [--json]`
- TS: `mcporter emit-ts <server> --mode client|types`

Notas

- Padrão de config: `./config/mcporter.json` (sobrescreva com `--config`).
- Prefira `--output json` para resultados legíveis por máquina.
