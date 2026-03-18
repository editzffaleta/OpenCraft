---
name: apple-notes
description: Gerencie o Apple Notes via CLI `memo` no macOS (criar, visualizar, editar, excluir, pesquisar, mover e exportar notas). Use quando o usuário pedir ao OpenCraft para adicionar uma nota, listar notas, pesquisar notas ou gerenciar pastas de notas.
homepage: https://github.com/antoniorodr/memo
metadata:
  {
    "opencraft":
      {
        "emoji": "📝",
        "os": ["darwin"],
        "requires": { "bins": ["memo"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "antoniorodr/memo/memo",
              "bins": ["memo"],
              "label": "Instalar memo via Homebrew",
            },
          ],
      },
  }
---

# CLI do Apple Notes

Use `memo notes` para gerenciar o Apple Notes diretamente do terminal. Crie, visualize, edite, exclua, pesquise, mova notas entre pastas e exporte para HTML/Markdown.

Configuração

- Instalar (Homebrew): `brew tap antoniorodr/memo && brew install antoniorodr/memo/memo`
- Manual (pip): `pip install .` (após clonar o repositório)
- Apenas macOS; se solicitado, conceda acesso de Automação ao Notes.app.

Visualizar Notas

- Listar todas as notas: `memo notes`
- Filtrar por pasta: `memo notes -f "Folder Name"`
- Pesquisar notas (fuzzy): `memo notes -s "query"`

Criar Notas

- Adicionar uma nova nota: `memo notes -a`
  - Abre um editor interativo para compor a nota.
- Adicionar rapidamente com título: `memo notes -a "Note Title"`

Editar Notas

- Editar nota existente: `memo notes -e`
  - Seleção interativa da nota a ser editada.

Excluir Notas

- Excluir uma nota: `memo notes -d`
  - Seleção interativa da nota a ser excluída.

Mover Notas

- Mover nota para pasta: `memo notes -m`
  - Seleção interativa da nota e da pasta de destino.

Exportar Notas

- Exportar para HTML/Markdown: `memo notes -ex`
  - Exporta a nota selecionada; usa Mistune para processamento de markdown.

Limitações

- Não é possível editar notas que contenham imagens ou anexos.
- Prompts interativos podem exigir acesso ao terminal.

Observações

- Apenas macOS.
- Requer que o Apple Notes.app esteja acessível.
- Para automação, conceda permissões em Configurações do Sistema > Privacidade e Segurança > Automação.
