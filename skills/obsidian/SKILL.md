---
name: obsidian
description: Trabalhe com vaults do Obsidian (notas Markdown simples) e automatize via obsidian-cli.
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

Vault do Obsidian = uma pasta normal no disco.

Estrutura do vault (típica):

- Notas: `*.md` (Markdown em texto simples; edite com qualquer editor)
- Configuração: `.obsidian/` (configurações de workspace e plugins; geralmente não toque via scripts)
- Canvases: `*.canvas` (JSON)
- Anexos: a pasta que você escolheu nas configurações do Obsidian (imagens/PDFs/etc.)

## Encontrar o(s) vault(s) ativo(s)

O Obsidian desktop rastreia vaults aqui (fonte da verdade):

- `~/Library/Application Support/obsidian/obsidian.json`

O `obsidian-cli` resolve vaults desse arquivo; o nome do vault é tipicamente o **nome da pasta** (sufixo do caminho).

Forma rápida de saber "qual vault está ativo / onde estão as notas?":

- Se você já definiu um padrão: `obsidian-cli print-default --path-only`
- Caso contrário, leia `~/Library/Application Support/obsidian/obsidian.json` e use a entrada do vault com `"open": true`.

Notas:

- Múltiplos vaults são comuns (iCloud vs `~/Documents`, trabalho/pessoal, etc.). Não adivinhe; leia a configuração.
- Evite escrever caminhos de vault fixos nos scripts; prefira ler a configuração ou usar `print-default`.

## Início rápido do obsidian-cli

Escolha um vault padrão (uma vez):

- `obsidian-cli set-default "<nome-da-pasta-do-vault>"`
- `obsidian-cli print-default` / `obsidian-cli print-default --path-only`

Pesquisar:

- `obsidian-cli search "consulta"` (nomes de notas)
- `obsidian-cli search-content "consulta"` (dentro das notas; mostra trechos + linhas)

Criar:

- `obsidian-cli create "Pasta/Nova nota" --content "..." --open`
- Requer o handler de URI do Obsidian (`obsidian://…`) funcionando (Obsidian instalado).
- Evite criar notas em pastas "ocultas" com ponto (ex: `.algo/...`) via URI; o Obsidian pode recusar.

Mover/renomear (refatoração segura):

- `obsidian-cli move "caminho/antigo/nota" "caminho/novo/nota"`
- Atualiza `[[wikilinks]]` e links Markdown comuns em todo o vault (esta é a grande vantagem vs `mv`).

Deletar:

- `obsidian-cli delete "caminho/nota"`

Prefira edições diretas quando apropriado: abra o arquivo `.md` e altere-o; o Obsidian vai capturar a mudança.
