---
summary: "CLI reference for `opencraft config` (get/set/unset/file/validate)"
read_when:
  - You want to read or edit config non-interactively
title: "config"
---

# `opencraft config`

Config helpers: get/set/unset/validate values by path and print the active
config file. Run without a subcommand to open
the configure wizard (same as `opencraft configure`).

## Examples

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

Paths use dot or bracket notation:

```bash
opencraft config get agents.defaults.workspace
opencraft config get agents.list[0].id
```

Use the agent list index to target a specific agent:

```bash
opencraft config get agents.list
opencraft config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Values

Values are parsed as JSON5 when possible; otherwise they are treated as strings.
Use `--strict-json` to require JSON5 parsing. `--json` remains supported as a legacy alias.

```bash
opencraft config set agents.defaults.heartbeat.every "0m"
opencraft config set gateway.port 19001 --strict-json
opencraft config set channels.whatsapp.groups '["*"]' --strict-json
```

## Subcommands

- `config file`: Print the active config file path (resolved from `OPENCRAFT_CONFIG_PATH` or default location).

Restart the gateway after edits.

## Validate

Validate the current config against the active schema without starting the
gateway.

```bash
opencraft config validate
opencraft config validate --json
```
