---
summary: "Referência do CLI para `opencraft plugins` (list, install, uninstall, enable/disable, doctor)"
read_when:
  - Você quer instalar ou gerenciar plugins do Gateway in-process
  - Você quer depurar falhas de carregamento de plugin
title: "plugins"
---

# `opencraft plugins`

Gerenciar plugins/extensões do Gateway (carregados in-process).

Relacionado:

- Sistema de plugins: [Plugins](/tools/plugin)
- Manifest + schema de plugin: [Plugin manifest](/plugins/manifest)
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
```

Plugins bundled são fornecidos com OpenCraft mas iniciam desabilitados. Use `plugins enable` para
ativá-los.

Todos os plugins devem incluir um arquivo `openclaw.plugin.json` com um JSON Schema inline
(`configSchema`, mesmo que vazio). Manifests/schemas ausentes/inválidos impedem
o plugin de carregar e falham na validação de config.

### Instalar

```bash
opencraft plugins install <path-or-spec>
opencraft plugins install <npm-spec> --pin
```

Nota de segurança: trate instalações de plugin como execução de código. Prefira versões fixadas.

Specs npm são **apenas de registry** (nome do pacote + **versão exata** opcional ou
**dist-tag**). Specs Git/URL/file e ranges semver são rejeitados. Instalações de dependências
rodam com `--ignore-scripts` por segurança.

Specs bare e `@latest` ficam na faixa estável. Se o npm resolver qualquer um desses
para um prerelease, OpenCraft para e pede que você opte explicitamente com uma
tag de prerelease como `@beta`/`@rc` ou uma versão de prerelease exata como
`@1.2.3-beta.4`.

Se um spec de instalação bare corresponder a um id de plugin bundled (por exemplo `diffs`), OpenCraft
instala o plugin bundled diretamente. Para instalar um pacote npm com o mesmo
nome, use um spec com escopo explícito (por exemplo `@scope/diffs`).

Arquivos suportados: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Use `--link` para evitar copiar um diretório local (adiciona a `plugins.load.paths`):

```bash
opencraft plugins install -l ./my-plugin
```

Use `--pin` em instalações npm para salvar o spec exato resolvido (`name@version`) em
`plugins.installs` enquanto mantém o comportamento padrão não fixado.

### Desinstalar

```bash
opencraft plugins uninstall <id>
opencraft plugins uninstall <id> --dry-run
opencraft plugins uninstall <id> --keep-files
```

`uninstall` remove registros de plugin de `plugins.entries`, `plugins.installs`,
a allowlist de plugins, e entradas vinculadas de `plugins.load.paths` quando aplicável.
Para plugins de memória ativos, o slot de memória é redefinido para `memory-core`.

Por padrão, uninstall também remove o diretório de instalação do plugin sob o
extensions root do diretório de estado ativo (`$OPENCLAW_STATE_DIR/extensions/<id>`). Use
`--keep-files` para manter arquivos no disco.

`--keep-config` é suportado como alias depreciado para `--keep-files`.

### Atualizar

```bash
opencraft plugins update <id>
opencraft plugins update --all
opencraft plugins update <id> --dry-run
```

Atualizações só se aplicam a plugins instalados do npm (rastreados em `plugins.installs`).

Quando um hash de integridade armazenado existe e o hash do artefato buscado muda,
OpenCraft imprime um aviso e pede confirmação antes de prosseguir. Use
`--yes` global para ignorar prompts em execuções CI/não interativas.
