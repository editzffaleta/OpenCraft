---
name: things-mac
description: Gerenciar o Things 3 via CLI `things` no macOS (adicionar/atualizar projetos+tarefas via URL scheme; ler/pesquisar/listar do banco de dados local do Things). Use quando um usuário pedir ao OpenCraft para adicionar uma tarefa ao Things, listar inbox/hoje/próximos, pesquisar tarefas ou inspecionar projetos/áreas/tags.
homepage: https://github.com/ossianhempel/things3-cli
metadata:
  {
    "opencraft":
      {
        "emoji": "✅",
        "os": ["darwin"],
        "requires": { "bins": ["things"] },
        "install":
          [
            {
              "id": "go",
              "kind": "go",
              "module": "github.com/ossianhempel/things3-cli/cmd/things@latest",
              "bins": ["things"],
              "label": "Instalar things3-cli (go)",
            },
          ],
      },
  }
---

# Things 3 CLI

Use `things` para ler seu banco de dados local do Things (inbox/hoje/pesquisa/projetos/áreas/tags) e para adicionar/atualizar tarefas via URL scheme do Things.

Configuração

- Instalar (recomendado, Apple Silicon): `GOBIN=/opt/homebrew/bin go install github.com/ossianhempel/things3-cli/cmd/things@latest`
- Se leituras do banco de dados falharem: conceda **Acesso Total ao Disco** ao app que faz a chamada (Terminal para execuções manuais; `OpenCraft.app` para execuções pelo gateway).
- Opcional: defina `THINGSDB` (ou passe `--db`) para apontar para sua pasta `ThingsData-*`.
- Opcional: defina `THINGS_AUTH_TOKEN` para evitar passar `--auth-token` em operações de atualização.

Somente leitura (banco de dados)

- `things inbox --limit 50`
- `things today`
- `things upcoming`
- `things search "query"`
- `things projects` / `things areas` / `things tags`

Escrita (URL scheme)

- Prefira pré-visualização segura: `things --dry-run add "Title"`
- Adicionar: `things add "Title" --notes "..." --when today --deadline 2026-01-02`
- Trazer Things para frente: `things --foreground add "Title"`

Exemplos: adicionar uma tarefa

- Básico: `things add "Buy milk"`
- Com notas: `things add "Buy milk" --notes "2% + bananas"`
- Em um projeto/área: `things add "Book flights" --list "Travel"`
- Em um cabeçalho de projeto: `things add "Pack charger" --list "Travel" --heading "Before"`
- Com tags: `things add "Call dentist" --tags "health,phone"`
- Lista de verificação: `things add "Trip prep" --checklist-item "Passport" --checklist-item "Tickets"`
- Do STDIN (múltiplas linhas => título + notas):
  - `cat <<'EOF' | things add -`
  - `Title line`
  - `Notes line 1`
  - `Notes line 2`
  - `EOF`

Exemplos: modificar uma tarefa (requer token de autenticação)

- Primeiro: obtenha o ID (coluna UUID): `things search "milk" --limit 5`
- Autenticação: defina `THINGS_AUTH_TOKEN` ou passe `--auth-token <TOKEN>`
- Título: `things update --id <UUID> --auth-token <TOKEN> "New title"`
- Substituir notas: `things update --id <UUID> --auth-token <TOKEN> --notes "New notes"`
- Acrescentar/antepor notas: `things update --id <UUID> --auth-token <TOKEN> --append-notes "..."` / `--prepend-notes "..."`
- Mover listas: `things update --id <UUID> --auth-token <TOKEN> --list "Travel" --heading "Before"`
- Substituir/adicionar tags: `things update --id <UUID> --auth-token <TOKEN> --tags "a,b"` / `things update --id <UUID> --auth-token <TOKEN> --add-tags "a,b"`
- Concluir/cancelar (tipo soft-delete): `things update --id <UUID> --auth-token <TOKEN> --completed` / `--canceled`
- Pré-visualização segura: `things --dry-run update --id <UUID> --auth-token <TOKEN> --completed`

Excluir uma tarefa?

- Não suportado pelo `things3-cli` no momento (sem comando de escrita "delete/move-to-trash"; `things trash` é apenas leitura).
- Opções: use a UI do Things para excluir/mover para lixeira, ou marque como `--completed` / `--canceled` via `things update`.

Observações

- Apenas macOS.
- `--dry-run` imprime a URL e não abre o Things.
