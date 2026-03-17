---
summary: "Guia do ClawHub: registro público de Skills + fluxos de trabalho via CLI"
read_when:
  - Apresentando ClawHub para novos usuários
  - Instalando, pesquisando ou publicando Skills
  - Explicando flags da CLI e comportamento de sincronização do ClawHub
title: "ClawHub"
---

# ClawHub

ClawHub é o **registro público de Skills para OpenCraft**. É um serviço gratuito: todas as Skills são públicas, abertas e visíveis para todos para compartilhamento e reutilização. Uma Skill é simplesmente uma pasta com um arquivo `SKILL.md` (mais arquivos de texto de suporte). Você pode navegar pelas Skills no aplicativo web ou usar a CLI para pesquisar, instalar, atualizar e publicar Skills.

Site: [clawhub.ai](https://clawhub.ai)

## O que é o ClawHub

- Um registro público para Skills do OpenCraft.
- Um armazenamento versionado de pacotes e metadados de Skills.
- Uma superfície de descoberta para pesquisa, tags e sinais de uso.

## Como funciona

1. Um usuário publica um pacote de Skill (arquivos + metadados).
2. O ClawHub armazena o pacote, analisa metadados e atribui uma versão.
3. O registro indexa a Skill para pesquisa e descoberta.
4. Usuários navegam, baixam e instalam Skills no OpenCraft.

## O que você pode fazer

- Publicar novas Skills e novas versões de Skills existentes.
- Descobrir Skills por nome, tags ou pesquisa.
- Baixar pacotes de Skills e inspecionar seus arquivos.
- Reportar Skills abusivas ou inseguras.
- Se você for moderador, ocultar, desocultar, excluir ou banir.

## Para quem é (amigável para iniciantes)

Se você quer adicionar novas capacidades ao seu agente OpenCraft, o ClawHub é a forma mais fácil de encontrar e instalar Skills. Você não precisa saber como o backend funciona. Você pode:

- Pesquisar Skills em linguagem natural.
- Instalar uma Skill no seu workspace.
- Atualizar Skills depois com um comando.
- Fazer backup das suas próprias Skills publicando-as.

## Início rápido (não técnico)

1. Instale a CLI (veja a próxima seção).
2. Pesquise algo que você precisa:
   - `clawhub search "calendar"`
3. Instale uma Skill:
   - `clawhub install <skill-slug>`
4. Inicie uma nova sessão do OpenCraft para que ele capture a nova Skill.

## Instalar a CLI

Escolha uma opção:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Como se encaixa no OpenCraft

Por padrão, a CLI instala Skills em `./skills` no seu diretório de trabalho atual. Se um workspace OpenCraft estiver configurado, `clawhub` recorre a esse workspace a menos que você substitua com `--workdir` (ou `CLAWHUB_WORKDIR`). O OpenCraft carrega Skills do workspace de `<workspace>/skills` e as captará na **próxima** sessão. Se você já usa `~/.opencraft/skills` ou Skills integradas, Skills do workspace têm precedência.

Para mais detalhes sobre como Skills são carregadas, compartilhadas e controladas, veja
[Skills](/tools/skills).

## Visão geral do sistema de Skills

Uma Skill é um pacote versionado de arquivos que ensina o OpenCraft como realizar uma
tarefa específica. Cada publicação cria uma nova versão, e o registro mantém um
histórico de versões para que usuários possam auditar mudanças.

Uma Skill típica inclui:

- Um arquivo `SKILL.md` com a descrição principal e uso.
- Configurações opcionais, scripts ou arquivos de suporte usados pela Skill.
- Metadados como tags, resumo e requisitos de instalação.

O ClawHub usa metadados para impulsionar a descoberta e expor com segurança as capacidades das Skills.
O registro também rastreia sinais de uso (como estrelas e downloads) para melhorar
ranking e visibilidade.

## O que o serviço oferece (funcionalidades)

- **Navegação pública** de Skills e seu conteúdo `SKILL.md`.
- **Pesquisa** alimentada por embeddings (pesquisa vetorial), não apenas palavras-chave.
- **Versionamento** com semver, changelogs e tags (incluindo `latest`).
- **Downloads** como zip por versão.
- **Estrelas e comentários** para feedback da comunidade.
- **Moderação** com hooks para aprovações e auditorias.
- **API amigável para CLI** para automação e scripts.

## Segurança e moderação

O ClawHub é aberto por padrão. Qualquer pessoa pode enviar Skills, mas uma conta GitHub deve
ter pelo menos uma semana para publicar. Isso ajuda a desacelerar abusos sem bloquear
contribuidores legítimos.

Reportar e moderação:

- Qualquer usuário logado pode reportar uma Skill.
- Motivos de report são obrigatórios e registrados.
- Cada usuário pode ter até 20 reports ativos por vez.
- Skills com mais de 3 reports únicos são auto-ocultadas por padrão.
- Moderadores podem visualizar Skills ocultas, desocultá-las, excluí-las ou banir usuários.
- Abusar da funcionalidade de report pode resultar em banimento da conta.

Interessado em se tornar moderador? Pergunte no Discord do OpenCraft e contate um
moderador ou mantenedor.

## Comandos e parâmetros da CLI

Opções globais (aplicam-se a todos os comandos):

- `--workdir <dir>`: Diretório de trabalho (padrão: diretório atual; recorre ao workspace do OpenCraft).
- `--dir <dir>`: Diretório de Skills, relativo ao workdir (padrão: `skills`).
- `--site <url>`: URL base do site (login via browser).
- `--registry <url>`: URL base da API do registro.
- `--no-input`: Desabilitar prompts (não interativo).
- `-V, --cli-version`: Imprimir versão da CLI.

Autenticação:

- `clawhub login` (fluxo via browser) ou `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Opções:

- `--token <token>`: Colar um Token de API.
- `--label <label>`: Rótulo armazenado para tokens de login via browser (padrão: `CLI token`).
- `--no-browser`: Não abrir um browser (requer `--token`).

Pesquisa:

- `clawhub search "query"`
- `--limit <n>`: Máximo de resultados.

Instalação:

- `clawhub install <slug>`
- `--version <version>`: Instalar uma versão específica.
- `--force`: Sobrescrever se a pasta já existir.

Atualização:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Atualizar para versão específica (apenas slug único).
- `--force`: Sobrescrever quando arquivos locais não correspondem a nenhuma versão publicada.

Listar:

- `clawhub list` (lê `.clawhub/lock.json`)

Publicar:

- `clawhub publish <path>`
- `--slug <slug>`: Slug da Skill.
- `--name <name>`: Nome de exibição.
- `--version <version>`: Versão semver.
- `--changelog <text>`: Texto do changelog (pode ser vazio).
- `--tags <tags>`: Tags separadas por vírgula (padrão: `latest`).

Excluir/restaurar (apenas proprietário/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sincronizar (escanear Skills locais + publicar novas/atualizadas):

- `clawhub sync`
- `--root <dir...>`: Raízes de escaneamento extras.
- `--all`: Enviar tudo sem prompts.
- `--dry-run`: Mostrar o que seria enviado.
- `--bump <type>`: `patch|minor|major` para atualizações (padrão: `patch`).
- `--changelog <text>`: Changelog para atualizações não interativas.
- `--tags <tags>`: Tags separadas por vírgula (padrão: `latest`).
- `--concurrency <n>`: Verificações de registro (padrão: 4).

## Fluxos de trabalho comuns para agentes

### Pesquisar Skills

```bash
clawhub search "postgres backups"
```

### Baixar novas Skills

```bash
clawhub install my-skill-pack
```

### Atualizar Skills instaladas

```bash
clawhub update --all
```

### Fazer backup das suas Skills (publicar ou sincronizar)

Para uma única pasta de Skill:

```bash
clawhub publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Para escanear e fazer backup de muitas Skills de uma vez:

```bash
clawhub sync --all
```

## Detalhes avançados (técnicos)

### Versionamento e tags

- Cada publicação cria uma nova **versão semver** `SkillVersion`.
- Tags (como `latest`) apontam para uma versão; mover tags permite rollback.
- Changelogs são anexados por versão e podem ser vazios ao sincronizar ou publicar atualizações.

### Mudanças locais vs versões do registro

Atualizações comparam o conteúdo local da Skill com versões do registro usando um hash de conteúdo. Se arquivos locais não correspondem a nenhuma versão publicada, a CLI pergunta antes de sobrescrever (ou requer `--force` em execuções não interativas).

### Escaneamento de sincronização e raízes de fallback

`clawhub sync` escaneia seu workdir atual primeiro. Se nenhuma Skill for encontrada, recorre a localizações legadas conhecidas (por exemplo `~/opencraft/skills` e `~/.opencraft/skills`). Isso é projetado para encontrar instalações de Skills mais antigas sem flags extras.

### Armazenamento e lockfile

- Skills instaladas são registradas em `.clawhub/lock.json` no seu workdir.
- Tokens de autenticação são armazenados no arquivo de config da CLI do ClawHub (substitua via `CLAWHUB_CONFIG_PATH`).

### Telemetria (contagem de instalações)

Quando você executa `clawhub sync` estando logado, a CLI envia um snapshot mínimo para computar contagens de instalação. Você pode desabilitar isso completamente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Variáveis de ambiente

- `CLAWHUB_SITE`: Substituir a URL do site.
- `CLAWHUB_REGISTRY`: Substituir a URL da API do registro.
- `CLAWHUB_CONFIG_PATH`: Substituir onde a CLI armazena o Token/config.
- `CLAWHUB_WORKDIR`: Substituir o workdir padrão.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Desabilitar telemetria no `sync`.
