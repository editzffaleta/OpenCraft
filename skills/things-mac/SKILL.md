---
name: things-mac
description: Gerencia o Things 3 via CLI `things` no macOS (adicionar/atualizar projetos+todos via esquema de URL; ler/pesquisar/listar do banco de dados local do Things). Use quando o usuário pedir ao OpenCraft para adicionar uma tarefa ao Things, listar inbox/hoje/próximos, pesquisar tarefas ou inspecionar projetos/áreas/tags.
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

# CLI do Things 3

Use `things` para ler seu banco de dados local do Things (inbox/hoje/pesquisa/projetos/áreas/tags) e para adicionar/atualizar todos via o esquema de URL do Things.

Configuração:

- Instalar (recomendado, Apple Silicon): `GOBIN=/opt/homebrew/bin go install github.com/ossianhempel/things3-cli/cmd/things@latest`
- Se a leitura do DB falhar: conceda **Acesso Total ao Disco** ao app chamador (Terminal para execuções manuais; `OpenCraft.app` para execuções do gateway).
- Opcional: defina `THINGSDB` (ou passe `--db`) para apontar para sua pasta `ThingsData-*`.
- Opcional: defina `THINGS_AUTH_TOKEN` para evitar passar `--auth-token` em operações de atualização.

Somente leitura (DB):

- `things inbox --limit 50`
- `things today`
- `things upcoming`
- `things search "consulta"`
- `things projects` / `things areas` / `things tags`

Escrita (esquema de URL):

- Prefira prévia segura: `things --dry-run add "Título"`
- Adicionar: `things add "Título" --notes "..." --when today --deadline 2026-01-02`
- Trazer Things para frente: `things --foreground add "Título"`

Exemplos: adicionar um todo:

- Básico: `things add "Comprar leite"`
- Com notas: `things add "Comprar leite" --notes "2% + bananas"`
- Num projeto/área: `things add "Comprar passagens" --list "Viagem"`
- Num cabeçalho de projeto: `things add "Guardar carregador" --list "Viagem" --heading "Antes"`
- Com tags: `things add "Ligar para dentista" --tags "saude,telefone"`
- Checklist: `things add "Prep para viagem" --checklist-item "Passaporte" --checklist-item "Passagens"`
- Do STDIN (multi-linha => título + notas):
  - `cat <<'EOF' | things add -`
  - `Linha de título`
  - `Linha de notas 1`
  - `Linha de notas 2`
  - `EOF`

Exemplos: modificar um todo (precisa de token de auth):

- Primeiro: obtenha o ID (coluna UUID): `things search "leite" --limit 5`
- Auth: defina `THINGS_AUTH_TOKEN` ou passe `--auth-token <TOKEN>`
- Título: `things update --id <UUID> --auth-token <TOKEN> "Novo título"`
- Substituir notas: `things update --id <UUID> --auth-token <TOKEN> --notes "Novas notas"`
- Adicionar/antepor notas: `things update --id <UUID> --auth-token <TOKEN> --append-notes "..."` / `--prepend-notes "..."`
- Mover listas: `things update --id <UUID> --auth-token <TOKEN> --list "Viagem" --heading "Antes"`
- Substituir/adicionar tags: `things update --id <UUID> --auth-token <TOKEN> --tags "a,b"` / `things update --id <UUID> --auth-token <TOKEN> --add-tags "a,b"`
- Concluir/cancelar: `things update --id <UUID> --auth-token <TOKEN> --completed` / `--canceled`
- Prévia segura: `things --dry-run update --id <UUID> --auth-token <TOKEN> --completed`

Deletar um todo?

- Não suportado pelo `things3-cli` no momento (sem comando de escrita "delete/move-to-trash"; `things trash` é somente leitura).
- Opções: use a UI do Things para deletar/lixar, ou marque como `--completed` / `--canceled` via `things update`.

Notas:

- Apenas macOS.
- `--dry-run` imprime a URL e não abre o Things.
