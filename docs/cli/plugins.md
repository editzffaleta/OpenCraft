---
summary: "Referência CLI para `opencraft plugins` (list, install, marketplace, uninstall, enable/disable, doctor)"
read_when:
  - Você quer instalar ou gerenciar Plugins do Gateway ou bundles compatíveis
  - Você quer depurar falhas de carregamento de Plugin
title: "plugins"
---

# `opencraft plugins`

Gerenciar Plugins/extensões do Gateway e bundles compatíveis.

Relacionado:

- Sistema de Plugins: [Plugins](/tools/plugin)
- Compatibilidade de bundles: [Plugin bundles](/plugins/bundles)
- Manifesto e esquema de Plugin: [Plugin manifest](/plugins/manifest)
- Hardening de segurança: [Security](/gateway/security)

## Comandos

```bash
opencraft plugins list
opencraft plugins info <id>
opencraft plugins enable <id>
opencraft plugins disable <id>
opencraft plugins uninstall <id>
opencraft plugins doctor
opencraft plugins update <id>
opencraft plugins update --all
opencraft plugins marketplace list <marketplace>
```

Plugins inclusos vêm com o OpenCraft mas iniciam desativados. Use `plugins enable` para
ativá-los.

Plugins nativos do OpenCraft devem incluir `opencraft.plugin.json` com um JSON
Schema inline (`configSchema`, mesmo que vazio). Bundles compatíveis usam seus próprios manifestos
de bundle.

`plugins list` mostra `Format: opencraft` ou `Format: bundle`. Saída detalhada de list/info
também mostra o subtipo do bundle (`codex`, `claude`, ou `cursor`) mais capacidades
detectadas do bundle.

### Instalação

```bash
opencraft plugins install <path-or-spec>
opencraft plugins install <npm-spec> --pin
opencraft plugins install <plugin>@<marketplace>
opencraft plugins install <plugin> --marketplace <marketplace>
```

Nota de segurança: trate instalações de Plugin como execução de código. Prefira versões fixadas.

Especificações npm são **apenas de registro** (nome do pacote + **versão exata** opcional ou
**dist-tag**). Especificações Git/URL/arquivo e intervalos de semver são rejeitados. Instalações de
dependências executam com `--ignore-scripts` por segurança.

Especificações sem prefixo e `@latest` ficam no canal estável. Se o npm resolver qualquer
um deles para um prerelease, o OpenCraft para e pede que você opte explicitamente com uma
tag de prerelease como `@beta`/`@rc` ou uma versão exata de prerelease como
`@1.2.3-beta.4`.

Se uma especificação de instalação sem prefixo corresponder a um id de Plugin incluso (por exemplo `diffs`), o OpenCraft
instala o Plugin incluso diretamente. Para instalar um pacote npm com o mesmo
nome, use uma especificação com escopo explícito (por exemplo `@scope/diffs`).

Arquivos suportados: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Instalações de marketplace Claude também são suportadas.

Use o atalho `plugin@marketplace` quando o nome do marketplace existir no cache de
registro local do Claude em `~/.claude/plugins/known_marketplaces.json`:

```bash
opencraft plugins marketplace list <marketplace-name>
opencraft plugins install <plugin-name>@<marketplace-name>
```

Use `--marketplace` quando quiser passar a fonte do marketplace explicitamente:

```bash
opencraft plugins install <plugin-name> --marketplace <marketplace-name>
opencraft plugins install <plugin-name> --marketplace <owner/repo>
opencraft plugins install <plugin-name> --marketplace ./my-marketplace
```

Fontes de marketplace podem ser:

- um nome de marketplace conhecido do Claude em `~/.claude/plugins/known_marketplaces.json`
- um caminho local de raiz de marketplace ou caminho `marketplace.json`
- um atalho de repositório GitHub como `owner/repo`
- uma URL git

Para caminhos locais e arquivos, o OpenCraft detecta automaticamente:

- Plugins nativos do OpenCraft (`opencraft.plugin.json`)
- Bundles compatíveis com Codex (`.codex-plugin/plugin.json`)
- Bundles compatíveis com Claude (`.claude-plugin/plugin.json` ou o layout
  padrão de componentes Claude)
- Bundles compatíveis com Cursor (`.cursor-plugin/plugin.json`)

Bundles compatíveis são instalados na raiz normal de extensões e participam do
mesmo fluxo de list/info/enable/disable. Hoje, Skills de bundle, Skills de
comando Claude, padrões de `settings.json` do Claude, Skills de comando Cursor e diretórios de hook
Codex compatíveis são suportados; outras capacidades detectadas do bundle são mostradas em
diagnósticos/info mas ainda não estão conectadas à execução em runtime.

Use `--link` para evitar copiar um diretório local (adiciona a `plugins.load.paths`):

```bash
opencraft plugins install -l ./my-plugin
```

Use `--pin` em instalações npm para salvar a especificação exata resolvida (`name@version`) em
`plugins.installs` mantendo o comportamento padrão não fixado.

### Desinstalação

```bash
opencraft plugins uninstall <id>
opencraft plugins uninstall <id> --dry-run
opencraft plugins uninstall <id> --keep-files
```

`uninstall` remove registros de Plugin de `plugins.entries`, `plugins.installs`,
a lista de permissão de Plugins e entradas `plugins.load.paths` vinculadas quando aplicável.
Para Plugins de memória ativos, o slot de memória é resetado para `memory-core`.

Por padrão, a desinstalação também remove o diretório de instalação do Plugin sob a raiz de
extensões do diretório de estado ativo (`$OPENCRAFT_STATE_DIR/extensions/<id>`). Use
`--keep-files` para manter os arquivos em disco.

`--keep-config` é suportado como alias depreciado para `--keep-files`.

### Atualização

```bash
opencraft plugins update <id>
opencraft plugins update --all
opencraft plugins update <id> --dry-run
```

Atualizações se aplicam a instalações rastreadas em `plugins.installs`, atualmente instalações npm e
de marketplace.

Quando um hash de integridade armazenado existe e o hash do artefato obtido muda,
o OpenCraft imprime um aviso e pede confirmação antes de prosseguir. Use
`--yes` global para ignorar prompts em execuções CI/não interativas.
