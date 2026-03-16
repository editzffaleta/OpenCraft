---
summary: "Guia do ClawHub: registro público de skills + fluxos de trabalho CLI"
read_when:
  - Apresentando o ClawHub a novos usuários
  - Instalando, buscando ou publicando skills
  - Explicando flags do CLI ClawHub e comportamento de sincronização
title: "ClawHub"
---

# ClawHub

ClawHub é o **registro público de skills para o OpenCraft**. É um serviço gratuito: todas as skills são públicas, abertas e visíveis a todos para compartilhamento e reutilização. Uma skill é apenas uma pasta com um arquivo `SKILL.md` (mais arquivos de texto de suporte). Você pode navegar pelas skills no app web ou usar o CLI para buscar, instalar, atualizar e publicar skills.

Site: [clawhub.ai](https://clawhub.ai)

## O que é o ClawHub

- Um registro público de skills para o OpenCraft.
- Um armazém versionado de bundles de skill e metadados.
- Uma superfície de descoberta para busca, tags e sinais de uso.

## Como funciona

1. Um usuário publica um bundle de skill (arquivos + metadados).
2. O ClawHub armazena o bundle, analisa os metadados e atribui uma versão.
3. O registro indexa a skill para busca e descoberta.
4. Usuários navegam, baixam e instalam skills no OpenCraft.

## O que você pode fazer

- Publicar novas skills e novas versões de skills existentes.
- Descobrir skills por nome, tags ou busca.
- Baixar bundles de skill e inspecionar seus arquivos.
- Reportar skills que são abusivas ou inseguras.
- Se você é moderador: ocultar, exibir, deletar ou banir.

## Para quem é (amigável para iniciantes)

Se você quer adicionar novas capacidades ao seu agente OpenCraft, o ClawHub é a maneira mais fácil de encontrar e instalar skills. Você não precisa saber como o backend funciona. Você pode:

- Buscar skills em linguagem simples.
- Instalar uma skill no seu workspace.
- Atualizar skills mais tarde com um comando.
- Fazer backup das suas próprias skills publicando-as.

## Início rápido (não técnico)

1. Instale o CLI (veja a próxima seção).
2. Busque algo que você precisa:
   - `clawhub search "calendário"`
3. Instale uma skill:
   - `clawhub install <skill-slug>`
4. Inicie uma nova sessão do OpenCraft para que ele pegue a nova skill.

## Instalar o CLI

Escolha um:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Como se encaixa no OpenCraft

Por padrão, o CLI instala skills em `./skills` no seu diretório de trabalho atual. Se um workspace do OpenCraft estiver configurado, o `clawhub` volta para aquele workspace a menos que você sobrescreva `--workdir` (ou `CLAWHUB_WORKDIR`). O OpenCraft carrega skills do workspace em `<workspace>/skills` e as pegará na **próxima** sessão. Se você já usa `~/.opencraft/skills` ou skills embutidas, as skills do workspace têm precedência.

Para mais detalhes sobre como as skills são carregadas, compartilhadas e controladas, veja
[Skills](/tools/skills).

## Visão geral do sistema de skills

Uma skill é um bundle versionado de arquivos que ensina o OpenCraft como realizar uma
tarefa específica. Cada publicação cria uma nova versão, e o registro mantém um
histórico de versões para que os usuários possam auditar mudanças.

Uma skill típica inclui:

- Um arquivo `SKILL.md` com a descrição principal e uso.
- Configs, scripts ou arquivos de suporte opcionais usados pela skill.
- Metadados como tags, resumo e requisitos de instalação.

O ClawHub usa metadados para impulsionar a descoberta e expor com segurança as capacidades das skills.
O registro também rastreia sinais de uso (como estrelas e downloads) para melhorar
a classificação e visibilidade.

## O que o serviço fornece (funcionalidades)

- **Navegação pública** de skills e seu conteúdo `SKILL.md`.
- **Busca** alimentada por embeddings (busca vetorial), não apenas palavras-chave.
- **Versionamento** com semver, changelogs e tags (incluindo `latest`).
- **Downloads** como zip por versão.
- **Estrelas e comentários** para feedback da comunidade.
- **Hooks de moderação** para aprovações e auditorias.
- **API amigável ao CLI** para automação e scripting.

## Segurança e moderação

O ClawHub é aberto por padrão. Qualquer pessoa pode fazer upload de skills, mas uma conta GitHub deve
ter pelo menos uma semana de existência para publicar. Isso ajuda a desacelerar abusos sem bloquear
contribuidores legítimos.

Relatório e moderação:

- Qualquer usuário logado pode reportar uma skill.
- Motivos de reporte são obrigatórios e registrados.
- Cada usuário pode ter até 20 relatórios ativos por vez.
- Skills com mais de 3 reportes únicos são automaticamente ocultadas por padrão.
- Moderadores podem ver skills ocultas, exibi-las, deletá-las ou banir usuários.
- Abusar do recurso de reporte pode resultar em banimento de conta.

Interessado em se tornar um moderador? Pergunte no Discord do OpenCraft e entre em contato com um
moderador ou mantenedor.

## Comandos e parâmetros do CLI

Opções globais (aplicam-se a todos os comandos):

- `--workdir <dir>`: Diretório de trabalho (padrão: dir atual; volta para workspace do OpenCraft).
- `--dir <dir>`: Diretório de skills, relativo ao workdir (padrão: `skills`).
- `--site <url>`: URL base do site (login pelo browser).
- `--registry <url>`: URL base da API do registro.
- `--no-input`: Desabilitar prompts (não interativo).
- `-V, --cli-version`: Imprimir versão do CLI.

Autenticação:

- `clawhub login` (fluxo pelo browser) ou `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Opções:

- `--token <token>`: Colar um token de API.
- `--label <label>`: Label armazenada para tokens de login pelo browser (padrão: `CLI token`).
- `--no-browser`: Não abrir um browser (requer `--token`).

Busca:

- `clawhub search "query"`
- `--limit <n>`: Máximo de resultados.

Instalar:

- `clawhub install <slug>`
- `--version <versão>`: Instalar uma versão específica.
- `--force`: Sobrescrever se a pasta já existir.

Atualizar:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <versão>`: Atualizar para uma versão específica (apenas slug único).
- `--force`: Sobrescrever quando arquivos locais não correspondem a nenhuma versão publicada.

Listar:

- `clawhub list` (lê `.clawhub/lock.json`)

Publicar:

- `clawhub publish <caminho>`
- `--slug <slug>`: Slug da skill.
- `--name <nome>`: Nome de exibição.
- `--version <versão>`: Versão semver.
- `--changelog <texto>`: Texto do changelog (pode ser vazio).
- `--tags <tags>`: Tags separadas por vírgula (padrão: `latest`).

Deletar/restaurar (somente owner/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sync (escanear skills locais + publicar novas/atualizadas):

- `clawhub sync`
- `--root <dir...>`: Raízes extras de escaneamento.
- `--all`: Enviar tudo sem prompts.
- `--dry-run`: Mostrar o que seria enviado.
- `--bump <tipo>`: `patch|minor|major` para atualizações (padrão: `patch`).
- `--changelog <texto>`: Changelog para atualizações não interativas.
- `--tags <tags>`: Tags separadas por vírgula (padrão: `latest`).
- `--concurrency <n>`: Verificações do registro (padrão: 4).

## Fluxos comuns para agentes

### Buscar skills

```bash
clawhub search "backup postgres"
```

### Baixar novas skills

```bash
clawhub install meu-skill-pack
```

### Atualizar skills instaladas

```bash
clawhub update --all
```

### Fazer backup das suas skills (publicar ou sincronizar)

Para uma pasta de skill única:

```bash
clawhub publish ./minha-skill --slug minha-skill --name "Minha Skill" --version 1.0.0 --tags latest
```

Para escanear e fazer backup de muitas skills de uma vez:

```bash
clawhub sync --all
```

## Detalhes avançados (técnicos)

### Versionamento e tags

- Cada publicação cria uma nova `SkillVersion` **semver**.
- Tags (como `latest`) apontam para uma versão; mover tags permite reverter.
- Changelogs são anexados por versão e podem ser vazios ao sincronizar ou publicar atualizações.

### Mudanças locais vs versões do registro

Atualizações comparam o conteúdo local da skill com versões do registro usando um hash de conteúdo. Se os arquivos locais não correspondem a nenhuma versão publicada, o CLI pergunta antes de sobrescrever (ou requer `--force` em execuções não interativas).

### Escaneamento de sync e raízes de fallback

`clawhub sync` escaneia seu workdir atual primeiro. Se nenhuma skill for encontrada, volta para locais legados conhecidos (por exemplo `~/openclaw/skills` e `~/.opencraft/skills`). Isso é projetado para encontrar instalações de skill mais antigas sem flags extras.

### Armazenamento e lockfile

- Skills instaladas são registradas em `.clawhub/lock.json` no seu workdir.
- Tokens de autenticação são armazenados no arquivo de config do CLI ClawHub (sobrescreva via `CLAWHUB_CONFIG_PATH`).

### Telemetria (contagem de instalações)

Quando você roda `clawhub sync` enquanto logado, o CLI envia um snapshot mínimo para calcular contagens de instalação. Você pode desabilitar isso completamente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Variáveis de ambiente

- `CLAWHUB_SITE`: Sobrescrever a URL do site.
- `CLAWHUB_REGISTRY`: Sobrescrever a URL da API do registro.
- `CLAWHUB_CONFIG_PATH`: Sobrescrever onde o CLI armazena o token/config.
- `CLAWHUB_WORKDIR`: Sobrescrever o workdir padrão.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Desabilitar telemetria no `sync`.
