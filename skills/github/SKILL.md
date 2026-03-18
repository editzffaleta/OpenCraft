---
name: github
description: "Operações do GitHub via CLI `gh`: issues, PRs, execuções de CI, revisão de código, consultas à API. Use quando: (1) verificar status de PR ou CI, (2) criar/comentar em issues, (3) listar/filtrar PRs ou issues, (4) visualizar logs de execução. NÃO use para: interações complexas com a UI web que exigem fluxos manuais no navegador (use ferramentas de navegador quando disponíveis), operações em massa em muitos repositórios (use script com gh api), ou quando gh auth não estiver configurado."
metadata:
  {
    "opencraft":
      {
        "emoji": "🐙",
        "requires": { "bins": ["gh"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gh",
              "bins": ["gh"],
              "label": "Instalar GitHub CLI (brew)",
            },
            {
              "id": "apt",
              "kind": "apt",
              "package": "gh",
              "bins": ["gh"],
              "label": "Instalar GitHub CLI (apt)",
            },
          ],
      },
  }
---

# Skill GitHub

Use o CLI `gh` para interagir com repositórios, issues, PRs e CI do GitHub.

## Quando Usar

✅ **USE esta skill quando:**

- Verificar status de PR, revisões ou prontidão para merge
- Visualizar status e logs de execuções de CI/workflow
- Criar, fechar ou comentar em issues
- Criar ou fazer merge de pull requests
- Consultar a API do GitHub para dados do repositório
- Listar repositórios, releases ou colaboradores

## Quando NÃO Usar

❌ **NÃO use esta skill quando:**

- Operações git locais (commit, push, pull, branch) → use `git` diretamente
- Repositórios que não são do GitHub (GitLab, Bitbucket, auto-hospedados) → CLIs diferentes
- Clonar repositórios → use `git clone`
- Revisar alterações de código reais → use a skill `coding-agent`
- Diffs complexos de múltiplos arquivos → use `coding-agent` ou leia os arquivos diretamente

## Configuração

```bash
# Autenticar (uma vez)
gh auth login

# Verificar
gh auth status
```

## Comandos Comuns

### Pull Requests

```bash
# Listar PRs
gh pr list --repo owner/repo

# Verificar status de CI
gh pr checks 55 --repo owner/repo

# Ver detalhes do PR
gh pr view 55 --repo owner/repo

# Criar PR
gh pr create --title "feat: add feature" --body "Description"

# Fazer merge do PR
gh pr merge 55 --squash --repo owner/repo
```

### Issues

```bash
# Listar issues
gh issue list --repo owner/repo --state open

# Criar issue
gh issue create --title "Bug: something broken" --body "Details..."

# Fechar issue
gh issue close 42 --repo owner/repo
```

### Execuções de CI/Workflow

```bash
# Listar execuções recentes
gh run list --repo owner/repo --limit 10

# Ver execução específica
gh run view <run-id> --repo owner/repo

# Ver apenas logs de etapas com falha
gh run view <run-id> --repo owner/repo --log-failed

# Re-executar jobs com falha
gh run rerun <run-id> --failed --repo owner/repo
```

### Consultas à API

```bash
# Obter PR com campos específicos
gh api repos/owner/repo/pulls/55 --jq '.title, .state, .user.login'

# Listar todos os labels
gh api repos/owner/repo/labels --jq '.[].name'

# Obter estatísticas do repositório
gh api repos/owner/repo --jq '{stars: .stargazers_count, forks: .forks_count}'
```

## Saída JSON

A maioria dos comandos suporta `--json` para saída estruturada com filtragem `--jq`:

```bash
gh issue list --repo owner/repo --json number,title --jq '.[] | "\(.number): \(.title)"'
gh pr list --json number,title,state,mergeable --jq '.[] | select(.mergeable == "MERGEABLE")'
```

## Templates

### Resumo de Revisão de PR

```bash
# Obter visão geral do PR para revisão
PR=55 REPO=owner/repo
echo "## PR #$PR Summary"
gh pr view $PR --repo $REPO --json title,body,author,additions,deletions,changedFiles \
  --jq '"**\(.title)** by @\(.author.login)\n\n\(.body)\n\n📊 +\(.additions) -\(.deletions) across \(.changedFiles) files"'
gh pr checks $PR --repo $REPO
```

### Triagem de Issues

```bash
# Visualização rápida de triagem de issues
gh issue list --repo owner/repo --state open --json number,title,labels,createdAt \
  --jq '.[] | "[\(.number)] \(.title) - \([.labels[].name] | join(", ")) (\(.createdAt[:10]))"'
```

## Observações

- Sempre especifique `--repo owner/repo` quando não estiver em um diretório git
- Use URLs diretamente: `gh pr view https://github.com/owner/repo/pull/55`
- Limites de taxa se aplicam; use `gh api --cache 1h` para consultas repetidas
