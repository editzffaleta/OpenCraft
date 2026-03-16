---
summary: "Referência do CLI para `opencraft hooks` (hooks de agente)"
read_when:
  - Você quer gerenciar hooks de agente
  - Você quer instalar ou atualizar hooks
title: "hooks"
---

# `opencraft hooks`

Gerenciar hooks de agente (automações orientadas a eventos para comandos como `/new`, `/reset` e inicialização do gateway).

Relacionado:

- Hooks: [Hooks](/automation/hooks)
- Hooks de plugin: [Plugins](/tools/plugin#plugin-hooks)

## Listar Todos os Hooks

```bash
opencraft hooks list
```

Listar todos os hooks descobertos de diretórios workspace, managed e bundled.

**Opções:**

- `--eligible`: Mostrar apenas hooks elegíveis (requisitos atendidos)
- `--json`: Saída como JSON
- `-v, --verbose`: Mostrar informações detalhadas incluindo requisitos ausentes

**Exemplo de saída:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new command is issued
```

**Exemplo (verbose):**

```bash
opencraft hooks list --verbose
```

Mostra requisitos ausentes para hooks não elegíveis.

**Exemplo (JSON):**

```bash
opencraft hooks list --json
```

Retorna JSON estruturado para uso programático.

## Obter Informações de um Hook

```bash
opencraft hooks info <name>
```

Mostrar informações detalhadas sobre um hook específico.

**Argumentos:**

- `<name>`: Nome do hook (ex. `session-memory`)

**Opções:**

- `--json`: Saída como JSON

**Exemplo:**

```bash
opencraft hooks info session-memory
```

**Saída:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new

Requirements:
  Config: ✓ workspace.dir
```

## Verificar Elegibilidade dos Hooks

```bash
opencraft hooks check
```

Mostrar resumo do status de elegibilidade dos hooks (quantos estão prontos vs. não prontos).

**Opções:**

- `--json`: Saída como JSON

**Exemplo de saída:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Habilitar um Hook

```bash
opencraft hooks enable <name>
```

Habilitar um hook específico adicionando-o à sua config (`~/.opencraft/config.json`).

**Nota:** Hooks gerenciados por plugins mostram `plugin:<id>` em `opencraft hooks list` e
não podem ser habilitados/desabilitados aqui. Habilite/desabilite o plugin.

**Argumentos:**

- `<name>`: Nome do hook (ex. `session-memory`)

**Exemplo:**

```bash
opencraft hooks enable session-memory
```

**Saída:**

```
✓ Enabled hook: 💾 session-memory
```

**O que faz:**

- Verifica se o hook existe e é elegível
- Atualiza `hooks.internal.entries.<name>.enabled = true` na sua config
- Salva a config no disco

**Após habilitar:**

- Reinicie o gateway para que os hooks recarreguem (reiniciar o app da barra de menus no macOS, ou reiniciar seu processo do gateway em dev).

## Desabilitar um Hook

```bash
opencraft hooks disable <name>
```

Desabilitar um hook específico atualizando sua config.

**Argumentos:**

- `<name>`: Nome do hook (ex. `command-logger`)

**Exemplo:**

```bash
opencraft hooks disable command-logger
```

**Saída:**

```
⏸ Disabled hook: 📝 command-logger
```

**Após desabilitar:**

- Reinicie o gateway para que os hooks recarreguem

## Instalar Hooks

```bash
opencraft hooks install <path-or-spec>
opencraft hooks install <npm-spec> --pin
```

Instalar um pack de hooks de uma pasta/arquivo local ou npm.

Specs npm são **apenas de registry** (nome do pacote + **versão exata** opcional ou
**dist-tag**). Specs Git/URL/file e ranges semver são rejeitados. Instalações de dependências
rodam com `--ignore-scripts` por segurança.

Specs bare e `@latest` ficam na faixa estável. Se o npm resolver qualquer um desses
para um prerelease, OpenCraft para e pede que você opte explicitamente com uma
tag de prerelease como `@beta`/`@rc` ou uma versão de prerelease exata.

**O que faz:**

- Copia o pack de hooks em `~/.opencraft/hooks/<id>`
- Habilita os hooks instalados em `hooks.internal.entries.*`
- Registra a instalação em `hooks.internal.installs`

**Opções:**

- `-l, --link`: Vincular um diretório local em vez de copiar (adiciona a `hooks.internal.load.extraDirs`)
- `--pin`: Registrar instalações npm como `name@version` exato resolvido em `hooks.internal.installs`

**Arquivos suportados:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Exemplos:**

```bash
# Diretório local
opencraft hooks install ./my-hook-pack

# Arquivo local
opencraft hooks install ./my-hook-pack.zip

# Pacote NPM
opencraft hooks install @openclaw/my-hook-pack

# Vincular um diretório local sem copiar
opencraft hooks install -l ./my-hook-pack
```

## Atualizar Hooks

```bash
opencraft hooks update <id>
opencraft hooks update --all
```

Atualizar packs de hooks instalados (apenas instalações npm).

**Opções:**

- `--all`: Atualizar todos os packs de hooks rastreados
- `--dry-run`: Mostrar o que mudaria sem escrever

Quando um hash de integridade armazenado existe e o hash do artefato buscado muda,
OpenCraft imprime um aviso e pede confirmação antes de prosseguir. Use
`--yes` global para ignorar prompts em execuções CI/não interativas.

## Hooks Bundled

### session-memory

Salva contexto de sessão na memória quando você emite `/new`.

**Habilitar:**

```bash
opencraft hooks enable session-memory
```

**Saída:** `~/.opencraft/workspace/memory/YYYY-MM-DD-slug.md`

**Veja:** [documentação de session-memory](/automation/hooks#session-memory)

### bootstrap-extra-files

Injeta arquivos de bootstrap adicionais (por exemplo `AGENTS.md` / `TOOLS.md` locais de monorepo) durante `agent:bootstrap`.

**Habilitar:**

```bash
opencraft hooks enable bootstrap-extra-files
```

**Veja:** [documentação de bootstrap-extra-files](/automation/hooks#bootstrap-extra-files)

### command-logger

Registra todos os eventos de comando em um arquivo de auditoria centralizado.

**Habilitar:**

```bash
opencraft hooks enable command-logger
```

**Saída:** `~/.opencraft/logs/commands.log`

**Ver logs:**

```bash
# Comandos recentes
tail -n 20 ~/.opencraft/logs/commands.log

# Pretty-print
cat ~/.opencraft/logs/commands.log | jq .

# Filtrar por ação
grep '"action":"new"' ~/.opencraft/logs/commands.log | jq .
```

**Veja:** [documentação de command-logger](/automation/hooks#command-logger)

### boot-md

Roda `BOOT.md` quando o gateway inicia (após os canais iniciarem).

**Eventos**: `gateway:startup`

**Habilitar**:

```bash
opencraft hooks enable boot-md
```

**Veja:** [documentação de boot-md](/automation/hooks#boot-md)
