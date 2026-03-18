---
name: obsidian
description: Trabalhe com cofres do Obsidian (notas em Markdown simples) e automatize via obsidian-cli.
homepage: https://help.obsidian.md
metadata:
  {
    "opencraft":
      {
        "emoji": "💎",
        "requires": { "bins": ["obsidian-cli"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "yakitrak/yakitrak/obsidian-cli",
              "bins": ["obsidian-cli"],
              "label": "Instalar obsidian-cli (brew)",
            },
          ],
      },
  }
---

# Obsidian

Cofre do Obsidian = uma pasta normal no disco.

Estrutura do cofre (típica)

- Notas: `*.md` (Markdown em texto simples; edite com qualquer editor)
- Configuração: `.obsidian/` (configurações de workspace + plugin; geralmente não altere via scripts)
- Telas: `*.canvas` (JSON)
- Anexos: a pasta que você escolheu nas configurações do Obsidian (imagens/PDFs/etc.)

## Encontrar o(s) cofre(s) ativo(s)

O Obsidian desktop rastreia os cofres aqui (fonte confiável):

- `~/Library/Application Support/obsidian/obsidian.json`

O `obsidian-cli` resolve os cofres a partir desse arquivo; o nome do cofre é tipicamente o **nome da pasta** (sufixo do caminho).

Forma rápida de descobrir "qual cofre está ativo / onde estão as notas?"

- Se você já definiu um padrão: `obsidian-cli print-default --path-only`
- Caso contrário, leia `~/Library/Application Support/obsidian/obsidian.json` e use a entrada do cofre com `"open": true`.

Observações

- Múltiplos cofres são comuns (iCloud vs `~/Documents`, trabalho/pessoal, etc.). Não adivinhe; leia a configuração.
- Evite escrever caminhos de cofre fixos em scripts; prefira ler a configuração ou usar `print-default`.

## Início rápido com obsidian-cli

Defina um cofre padrão (uma vez):

- `obsidian-cli set-default "<vault-folder-name>"`
- `obsidian-cli print-default` / `obsidian-cli print-default --path-only`

Busca

- `obsidian-cli search "query"` (nomes de notas)
- `obsidian-cli search-content "query"` (dentro das notas; mostra trechos + linhas)

Criar

- `obsidian-cli create "Folder/New note" --content "..." --open`
- Requer que o manipulador URI do Obsidian (`obsidian://…`) esteja funcionando (Obsidian instalado).
- Evite criar notas em pastas "ocultas" com ponto (ex.: `.something/...`) via URI; o Obsidian pode recusar.

Mover/renomear (refatoração segura)

- `obsidian-cli move "old/path/note" "new/path/note"`
- Atualiza `[[wikilinks]]` e links Markdown comuns em todo o cofre (esta é a principal vantagem em relação ao `mv`).

Excluir

- `obsidian-cli delete "path/note"`

Prefira edições diretas quando apropriado: abra o arquivo `.md` e altere-o; o Obsidian vai capturar as mudanças.
