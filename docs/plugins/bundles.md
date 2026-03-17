---
summary: "Guia do formato de bundles unificado para bundles Codex, Claude e Cursor no OpenCraft"
read_when:
  - Você quer instalar ou depurar um bundle compatível com Codex, Claude ou Cursor
  - Você precisa entender como o OpenCraft mapeia o conteúdo de bundles para recursos nativos
  - Você está documentando compatibilidade de bundles ou limites de suporte atuais
title: "Bundles de Plugins"
---

# Bundles de plugins

O OpenCraft suporta uma classe compartilhada de pacote de plugin externo: **plugins de bundle**.

Hoje, isso significa três ecossistemas relacionados:

- Bundles Codex
- Bundles Claude
- Bundles Cursor

O OpenCraft mostra todos eles como `Format: bundle` em `opencraft plugins list`.
A saída detalhada e `opencraft plugins info <id>` também mostram o subtipo
(`codex`, `claude` ou `cursor`).

Relacionados:

- Visão geral do sistema de plugins: [Plugins](/tools/plugin)
- Fluxos de instalação/listagem do CLI: [plugins](/cli/plugins)
- Esquema do manifesto nativo: [Manifesto de plugins](/plugins/manifest)

## O que é um bundle

Um bundle é um **pacote de conteúdo/metadados**, não um plugin nativo do OpenCraft executado em processo.

Hoje, o OpenCraft **não** executa código de runtime de bundles em processo. Em vez disso,
ele detecta arquivos de bundle conhecidos, lê os metadados e mapeia o conteúdo suportado
para superfícies nativas do OpenCraft, como habilidades, pacotes de hooks, configuração MCP
e configurações Pi embutidas.

Essa é a principal fronteira de confiança:

- plugin nativo OpenCraft: módulo de runtime executado em processo
- bundle: pacote de metadados/conteúdo, com mapeamento seletivo de recursos

## Modelo de bundle compartilhado

Bundles Codex, Claude e Cursor são similares o suficiente para o OpenCraft tratá-los
como um modelo normalizado.

Ideia compartilhada:

- um arquivo de manifesto pequeno, ou um layout de diretório padrão
- uma ou mais raízes de conteúdo como `skills/` ou `commands/`
- metadados opcionais de ferramenta/runtime como MCP, hooks, agentes ou LSP
- instalação como diretório ou arquivo, depois ativação na lista de plugins normal

Comportamento comum do OpenCraft:

- detectar o subtipo do bundle
- normalizá-lo em um registro de bundle interno
- mapear as partes suportadas para recursos nativos do OpenCraft
- reportar partes não suportadas como capacidades detectadas-mas-não-conectadas

Na prática, a maioria dos usuários não precisa pensar primeiro no formato específico do fornecedor.
A pergunta mais útil é: quais superfícies de bundle o OpenCraft mapeia hoje?

## Ordem de detecção

O OpenCraft prefere layouts nativos de plugin/pacote OpenCraft antes do tratamento de bundles.

Efeito prático:

- `opencraft.plugin.json` tem prioridade sobre a detecção de bundles
- instalações de pacotes com `package.json` + `opencraft.extensions` válidos usam o
  caminho de instalação nativo
- se um diretório contém metadados nativos e de bundle, o OpenCraft trata como nativo primeiro

Isso evita instalar parcialmente um pacote de formato duplo como bundle e depois
carregá-lo como plugin nativo.

## O que funciona hoje

O OpenCraft normaliza metadados de bundles em um registro de bundle interno e depois
mapeia superfícies suportadas para comportamento nativo existente.

### Suportado agora

#### Conteúdo de habilidades

- raízes de habilidades do bundle carregam como raízes de habilidades normais do OpenCraft
- raízes `commands` do Claude são tratadas como raízes de habilidades adicionais
- raízes `.cursor/commands` do Cursor são tratadas como raízes de habilidades adicionais

Isso significa que arquivos de comando markdown do Claude funcionam através do
carregador normal de habilidades do OpenCraft. Comandos markdown do Cursor funcionam
pelo mesmo caminho.

#### Pacotes de hooks

- raízes de hooks de bundles funcionam **apenas** quando usam o layout normal de
  hook-pack do OpenCraft. Hoje isso é principalmente o caso compatível com Codex:
  - `HOOK.md`
  - `handler.ts` ou `handler.js`

#### MCP para backends CLI

- bundles habilitados podem contribuir com configuração de servidor MCP
- o mapeamento de runtime atual é usado pelo backend `claude-cli`
- o OpenCraft mescla a configuração MCP do bundle no arquivo `--mcp-config` do backend

#### Configurações Pi embutidas

- `settings.json` do Claude é importado como configurações Pi embutidas padrão quando
  o bundle está habilitado
- o OpenCraft sanitiza chaves de substituição de shell antes de aplicá-las

Chaves sanitizadas:

- `shellPath`
- `shellCommandPrefix`

### Detectado, mas não executado

Essas superfícies são detectadas, mostradas nas capacidades do bundle e podem aparecer
na saída de diagnóstico/info, mas o OpenCraft ainda não as executa:

- `agents` do Claude
- automação `hooks.json` do Claude
- `lspServers` do Claude
- `outputStyles` do Claude
- `.cursor/agents` do Cursor
- `.cursor/hooks.json` do Cursor
- `.cursor/rules` do Cursor
- `mcpServers` do Cursor fora dos caminhos de runtime mapeados
- metadados inline/app do Codex além do relatório de capacidades

## Relatório de capacidades

`opencraft plugins info <id>` mostra as capacidades do bundle a partir do registro
de bundle normalizado.

Capacidades suportadas são carregadas silenciosamente. Capacidades não suportadas
produzem um aviso como:

```text
bundle capability detected but not wired into OpenCraft yet: agents
```

Exceções atuais:

- `commands` do Claude é considerado suportado porque mapeia para habilidades
- `settings` do Claude é considerado suportado porque mapeia para configurações Pi embutidas
- `commands` do Cursor é considerado suportado porque mapeia para habilidades
- MCP de bundle é considerado suportado onde o OpenCraft realmente o importa
- `hooks` do Codex é considerado suportado apenas para layouts de hook-pack do OpenCraft

## Diferenças de formato

Os formatos são próximos, mas não idênticos. Estas são as diferenças práticas
que importam no OpenCraft.

### Codex

Marcadores típicos:

- `.codex-plugin/plugin.json`
- `skills/` opcional
- `hooks/` opcional
- `.mcp.json` opcional
- `.app.json` opcional

Bundles Codex se encaixam melhor no OpenCraft quando usam raízes de habilidades
e diretórios de hook-pack no estilo OpenCraft.

### Claude

O OpenCraft suporta tanto:

- bundles Claude baseados em manifesto: `.claude-plugin/plugin.json`
- bundles Claude sem manifesto que usam o layout padrão do Claude

Marcadores do layout padrão do Claude que o OpenCraft reconhece:

- `skills/`
- `commands/`
- `agents/`
- `hooks/hooks.json`
- `.mcp.json`
- `.lsp.json`
- `settings.json`

Notas específicas do Claude:

- `commands/` é tratado como conteúdo de habilidades
- `settings.json` é importado para configurações Pi embutidas
- `hooks/hooks.json` é detectado, mas não executado como automação Claude

### Cursor

Marcadores típicos:

- `.cursor-plugin/plugin.json`
- `skills/` opcional
- `.cursor/commands/` opcional
- `.cursor/agents/` opcional
- `.cursor/rules/` opcional
- `.cursor/hooks.json` opcional
- `.mcp.json` opcional

Notas específicas do Cursor:

- `.cursor/commands/` é tratado como conteúdo de habilidades
- `.cursor/rules/`, `.cursor/agents/` e `.cursor/hooks.json` são somente detectados hoje

## Caminhos personalizados do Claude

Manifestos de bundle Claude podem declarar caminhos de componentes personalizados.
O OpenCraft trata esses caminhos como **aditivos**, não substituindo os padrões.

Chaves de caminho personalizadas reconhecidas atualmente:

- `skills`
- `commands`
- `agents`
- `hooks`
- `mcpServers`
- `lspServers`
- `outputStyles`

Exemplos:

- `commands/` padrão mais manifesto `commands: "extra-commands"` =>
  o OpenCraft escaneia ambos
- `skills/` padrão mais manifesto `skills: ["team-skills"]` =>
  o OpenCraft escaneia ambos

## Modelo de segurança

O suporte a bundles é intencionalmente mais restrito que o suporte a plugins nativos.

Comportamento atual:

- a descoberta de bundles lê arquivos dentro da raiz do plugin com verificações de limite
- caminhos de habilidades e hook-pack devem ficar dentro da raiz do plugin
- arquivos de configurações do bundle são lidos com as mesmas verificações de limite
- o OpenCraft não executa código de runtime arbitrário de bundles em processo

Isso torna o suporte a bundles mais seguro por padrão que módulos de plugins nativos,
mas você ainda deve tratar bundles de terceiros como conteúdo confiável para os
recursos que eles expõem.

## Exemplos de instalação

```bash
opencraft plugins install ./meu-bundle-codex
opencraft plugins install ./meu-bundle-claude
opencraft plugins install ./meu-bundle-cursor
opencraft plugins install ./meu-bundle.tgz
opencraft plugins marketplace list <nome-marketplace>
opencraft plugins install <nome-plugin>@<nome-marketplace>
opencraft plugins info meu-bundle
```

Se o diretório for um plugin/pacote nativo do OpenCraft, o caminho de instalação
nativo ainda terá prioridade.

Para nomes de marketplace do Claude, o OpenCraft lê o registro local de marketplaces
conhecidos em `~/.claude/plugins/known_marketplaces.json`. Entradas de marketplace
podem resolver para diretórios/arquivos compatíveis com bundles ou para fontes de
plugins nativos; após a resolução, as regras normais de instalação ainda se aplicam.

## Solução de problemas

### Bundle detectado, mas capacidades não executam

Verifique `opencraft plugins info <id>`.

Se a capacidade estiver listada mas o OpenCraft disser que ainda não está conectada,
esse é um limite real do produto, não uma instalação quebrada.

### Arquivos de comando Claude não aparecem

Certifique-se de que o bundle está habilitado e os arquivos markdown estão dentro
de uma raiz `commands` ou `skills` detectada.

### Configurações Claude não se aplicam

O suporte atual está limitado a configurações Pi embutidas do `settings.json`.
O OpenCraft não trata configurações de bundle como patches de configuração brutos.

### Hooks Claude não executam

`hooks/hooks.json` é apenas detectado hoje.

Se você precisar de hooks de bundle executáveis hoje, use o layout normal de
hook-pack do OpenCraft através de uma raiz de hook Codex suportada ou envie
um plugin nativo do OpenCraft.
