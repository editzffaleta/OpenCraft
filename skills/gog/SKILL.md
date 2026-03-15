---
name: gog
description: CLI do Google Workspace para Gmail, Agenda, Drive, Contatos, Planilhas e Documentos.
homepage: https://gogcli.sh
metadata:
  {
    "opencraft":
      {
        "emoji": "🎮",
        "requires": { "bins": ["gog"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "steipete/tap/gogcli",
              "bins": ["gog"],
              "label": "Instalar gog (brew)",
            },
          ],
      },
  }
---

# gog

Use `gog` para Gmail/Agenda/Drive/Contatos/Planilhas/Documentos. Requer configuração OAuth.

Configuração (uma vez)

- `gog auth credentials /caminho/para/client_secret.json`
- `gog auth add voce@gmail.com --services gmail,calendar,drive,contacts,docs,sheets`
- `gog auth list`

Comandos comuns

- Pesquisar Gmail: `gog gmail search 'newer_than:7d' --max 10`
- Pesquisar mensagens Gmail (por e-mail, ignora threads): `gog gmail messages search "in:inbox from:ryanair.com" --max 20 --account voce@exemplo.com`
- Enviar Gmail (texto simples): `gog gmail send --to a@b.com --subject "Oi" --body "Olá"`
- Enviar Gmail (multi-linha): `gog gmail send --to a@b.com --subject "Oi" --body-file ./mensagem.txt`
- Enviar Gmail (stdin): `gog gmail send --to a@b.com --subject "Oi" --body-file -`
- Enviar Gmail (HTML): `gog gmail send --to a@b.com --subject "Oi" --body-html "<p>Olá</p>"`
- Rascunho Gmail: `gog gmail drafts create --to a@b.com --subject "Oi" --body-file ./mensagem.txt`
- Enviar rascunho Gmail: `gog gmail drafts send <draftId>`
- Responder Gmail: `gog gmail send --to a@b.com --subject "Re: Oi" --body "Resposta" --reply-to-message-id <msgId>`
- Listar eventos da Agenda: `gog calendar events <calendarId> --from <iso> --to <iso>`
- Criar evento na Agenda: `gog calendar create <calendarId> --summary "Título" --from <iso> --to <iso>`
- Criar com cor: `gog calendar create <calendarId> --summary "Título" --from <iso> --to <iso> --event-color 7`
- Atualizar evento: `gog calendar update <calendarId> <eventId> --summary "Novo Título" --event-color 4`
- Ver cores disponíveis: `gog calendar colors`
- Pesquisar Drive: `gog drive search "consulta" --max 10`
- Contatos: `gog contacts list --max 20`
- Obter Planilhas: `gog sheets get <sheetId> "Aba!A1:D10" --json`
- Atualizar Planilhas: `gog sheets update <sheetId> "Aba!A1:B2" --values-json '[["A","B"],["1","2"]]' --input USER_ENTERED`
- Acrescentar Planilhas: `gog sheets append <sheetId> "Aba!A:C" --values-json '[["x","y","z"]]' --insert INSERT_ROWS`
- Limpar Planilhas: `gog sheets clear <sheetId> "Aba!A2:Z"`
- Metadados Planilhas: `gog sheets metadata <sheetId> --json`
- Exportar Documentos: `gog docs export <docId> --format txt --out /tmp/doc.txt`
- Visualizar Documentos: `gog docs cat <docId>`

Cores da Agenda

- Use `gog calendar colors` para ver todas as cores disponíveis (IDs 1-11)
- Adicione cores com a flag `--event-color <id>`
- IDs de cor (saída de `gog calendar colors`):
  - 1: #a4bdfc
  - 2: #7ae7bf
  - 3: #dbadff
  - 4: #ff887c
  - 5: #fbd75b
  - 6: #ffb878
  - 7: #46d6db
  - 8: #e1e1e1
  - 9: #5484ed
  - 10: #51b749
  - 11: #dc2127

Formatação de E-mail

- Prefira texto simples. Use `--body-file` para mensagens com múltiplos parágrafos (ou `--body-file -` para stdin).
- O mesmo padrão `--body-file` funciona para rascunhos e respostas.
- `--body` não interpreta `\n`. Se precisar de quebras de linha inline, use heredoc ou `$'Linha 1\n\nLinha 2'`.
- Use `--body-html` apenas quando precisar de formatação rica.
- Tags HTML: `<p>` para parágrafos, `<br>` para quebras de linha, `<strong>` para negrito, `<em>` para itálico, `<a href="url">` para links, `<ul>`/`<li>` para listas.
- Exemplo (texto simples via stdin):

  ```bash
  gog gmail send --to destinatario@exemplo.com \
    --subject "Acompanhamento da Reunião" \
    --body-file - <<'EOF'
  Olá Nome,

  Obrigado pela reunião de hoje. Próximos passos:
  - Item um
  - Item dois

  Atenciosamente,
  Seu Nome
  EOF
  ```

- Exemplo (lista HTML):
  ```bash
  gog gmail send --to destinatario@exemplo.com \
    --subject "Acompanhamento da Reunião" \
    --body-html "<p>Olá Nome,</p><p>Obrigado pela reunião. Próximos passos:</p><ul><li>Item um</li><li>Item dois</li></ul><p>Atenciosamente,<br>Seu Nome</p>"
  ```

Notas

- Defina `GOG_ACCOUNT=voce@gmail.com` para evitar repetir `--account`.
- Para scripts, prefira `--json` com `--no-input`.
- Valores de planilha podem ser passados via `--values-json` (recomendado) ou como linhas inline.
- Documentos suporta export/cat/copy. Edições in-place requerem um cliente Docs API (não disponível no gog).
- Confirme antes de enviar e-mail ou criar eventos.
- `gog gmail search` retorna uma linha por thread; use `gog gmail messages search` quando precisar de cada e-mail individual separadamente.
