# Sincronizando com o Upstream OpenClaw

O OpenCraft é um fork do [editzffaleta/OpenCraft](https://github.com/editzffaleta/OpenCraft) com:

- Toda a interface e documentação traduzida para **português do Brasil**
- Branding renomeado de **OpenClaw → OpenCraft** em código, configs e docs

Por isso, um `git merge upstream/main` simples **não funciona** — quebraria as
renomeações feitas na brasileirização. O processo correto é cherry-pick seletivo.

---

## Fluxo de Sync

```
upstream (editzffaleta/OpenCraft)
        │
        │  git cherry-pick <hash> --no-commit
        ▼
scripts/sync-upstream.sh aplica sed: openclaw→opencraft
        │
        ▼
feat/brasileiracao (este repo)
```

---

## Usando o script

### Pré-requisitos

```bash
# Certifique-se de que a árvore está limpa
git status

# O script adiciona o remote "upstream" automaticamente na primeira execução
```

### Ver commits disponíveis do upstream

```bash
./scripts/sync-upstream.sh          # últimos 20 commits
./scripts/sync-upstream.sh -n 50    # últimos 50 commits
```

### Aplicar um commit específico

```bash
./scripts/sync-upstream.sh -h <hash>
```

O script irá:

1. Mostrar o `--stat` e diff do commit
2. Pedir confirmação (`y/n/q`)
3. Aplicar com `git cherry-pick <hash> --no-commit`
4. Rodar as regras de renaming openclaw→opencraft nos arquivos alterados
5. Mostrar a mensagem original e pedir confirmação final do commit

### Modo interativo em lote

```bash
./scripts/sync-upstream.sh
# → lista commits
# → pergunta se quer percorrer interativamente
# → para cada commit: [a]plicar / [p]ular / [d]etalhes / [q]sair
```

---

## Regras de renaming aplicadas automaticamente

| Padrão alterado                        | Resultado                   |
| -------------------------------------- | --------------------------- |
| `"opencraft": { ... }` em package.json | `"opencraft": { ... }`      |
| `opencraft.plugin.json`                | `opencraft.plugin.json`     |
| `opencraft-bundled`                    | `opencraft-bundled`         |
| `OPENCRAFT_NODE_BOOKWORM_*`            | `OPENCRAFT_NODE_BOOKWORM_*` |
| `OPENCRAFT_TEST_FAST`                  | `OPENCRAFT_TEST_FAST`       |
| `OPENCRAFT_STATE_DIR`                  | `OPENCRAFT_STATE_DIR`       |
| `OPENCRAFT_BIN`                        | `OPENCRAFT_BIN`             |
| `opencraft-pnpm-store`                 | `opencraft-pnpm-store`      |
| `editzffaleta/OpenCraft` (URL)         | `editzffaleta/OpenCraft`    |
| `"OpenCraft"` (string)                 | `"OpenCraft"`               |

### O que **NÃO** é renomeado (exceções permanentes)

Estes itens são Swift identifiers, bundle IDs ou nomes de pacotes externos —
alterá-los quebraria compilação ou dependências:

| Exceção                                                 | Motivo                     |
| ------------------------------------------------------- | -------------------------- |
| `OpenClaw.xcodeproj`, `OpenClawKit`, `OpenClawProtocol` | Swift/Xcode identifiers    |
| `ai.openclaw.*`, `com.openclaw.*`                       | Bundle IDs do app          |
| `@openclaw/` npm packages externos                      | Pacotes publicados no npm  |
| `openclaw-sandbox*`                                     | Nomes de container Docker  |
| `/__openclaw__/` URL paths                              | Rotas internas do runtime  |
| `/tmp/openclaw/`                                        | Caminhos de log hardcoded  |
| `openclaw.mjs`                                          | Binário de compatibilidade |

---

## Verificação automática (GitHub Actions)

O workflow `.github/workflows/sync-upstream.yml` roda todo dia às 8h UTC e:

1. Compara `main` com `upstream/main`
2. Se houver commits novos, abre/atualiza uma Issue com label `sync-upstream`
3. A Issue mostra quantos commits estão disponíveis

Para aplicar as atualizações notificadas, use o script acima.

---

## Resolução de conflitos

Se um cherry-pick gerar conflito:

```bash
# O script avisa e para. Resolva manualmente:
git status                    # veja os arquivos em conflito
# edite os arquivos conflitantes
git add <arquivo>
./scripts/sync-upstream.sh -h <hash>  # ou continue manualmente:
git cherry-pick --continue
```

Para cancelar um cherry-pick com conflito:

```bash
git cherry-pick --abort
```

---

## Commits que devem ser ignorados

Alguns commits do upstream podem ser intencionalmente ignorados neste fork:

- Commits que reintroduzem o branding "OpenCraft" em lugares já traduzidos
- Commits que alteram apenas arquivos Swift/Xcode (não presentes neste fork)
- Commits de i18n para outros idiomas que não pt-BR

Use `[p]ular` no modo interativo para ignorar estes commits.
