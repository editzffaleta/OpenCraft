---
name: gog
description: CLI do Google Workspace para Gmail, Calendar, Drive, Contacts, Sheets e Docs.
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

Use `gog` para Gmail/Calendar/Drive/Contacts/Sheets/Docs. Requer configuração OAuth.

Configuração (uma vez)

- `gog auth credentials /path/to/client_secret.json`
- `gog auth add you@gmail.com --services gmail,calendar,drive,contacts,docs,sheets`
- `gog auth list`

Comandos comuns

- Pesquisar Gmail: `gog gmail search 'newer_than:7d' --max 10`
- Pesquisar mensagens Gmail (por e-mail, ignora threads): `gog gmail messages search "in:inbox from:ryanair.com" --max 20 --account you@example.com`
- Enviar Gmail (texto simples): `gog gmail send --to a@b.com --subject "Hi" --body "Hello"`
- Enviar Gmail (múltiplas linhas): `gog gmail send --to a@b.com --subject "Hi" --body-file ./message.txt`
- Enviar Gmail (stdin): `gog gmail send --to a@b.com --subject "Hi" --body-file -`
- Enviar Gmail (HTML): `gog gmail send --to a@b.com --subject "Hi" --body-html "<p>Hello</p>"`
- Rascunho Gmail: `gog gmail drafts create --to a@b.com --subject "Hi" --body-file ./message.txt`
- Enviar rascunho Gmail: `gog gmail drafts send <draftId>`
- Responder Gmail: `gog gmail send --to a@b.com --subject "Re: Hi" --body "Reply" --reply-to-message-id <msgId>`
- Listar eventos do Calendar: `gog calendar events <calendarId> --from <iso> --to <iso>`
- Criar evento no Calendar: `gog calendar create <calendarId> --summary "Title" --from <iso> --to <iso>`
- Criar evento com cor: `gog calendar create <calendarId> --summary "Title" --from <iso> --to <iso> --event-color 7`
- Atualizar evento no Calendar: `gog calendar update <calendarId> <eventId> --summary "New Title" --event-color 4`
- Exibir cores do Calendar: `gog calendar colors`
- Pesquisar Drive: `gog drive search "query" --max 10`
- Contacts: `gog contacts list --max 20`
- Obter Sheets: `gog sheets get <sheetId> "Tab!A1:D10" --json`
- Atualizar Sheets: `gog sheets update <sheetId> "Tab!A1:B2" --values-json '[["A","B"],["1","2"]]' --input USER_ENTERED`
- Acrescentar ao Sheets: `gog sheets append <sheetId> "Tab!A:C" --values-json '[["x","y","z"]]' --insert INSERT_ROWS`
- Limpar Sheets: `gog sheets clear <sheetId> "Tab!A2:Z"`
- Metadados do Sheets: `gog sheets metadata <sheetId> --json`
- Exportar Docs: `gog docs export <docId> --format txt --out /tmp/doc.txt`
- Exibir Docs: `gog docs cat <docId>`

Cores do Calendar

- Use `gog calendar colors` para ver todas as cores de evento disponíveis (IDs 1-11)
- Adicione cores a eventos com a flag `--event-color <id>`
- IDs de cores de evento (da saída de `gog calendar colors`):
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
- `--body` não faz unescape de `\n`. Se precisar de quebras de linha inline, use um heredoc ou `$'Linha 1\n\nLinha 2'`.
- Use `--body-html` apenas quando precisar de formatação rica.
- Tags HTML: `<p>` para parágrafos, `<br>` para quebras de linha, `<strong>` para negrito, `<em>` para itálico, `<a href="url">` para links, `<ul>`/`<li>` para listas.
- Exemplo (texto simples via stdin):

  ```bash
  gog gmail send --to recipient@example.com \
    --subject "Meeting Follow-up" \
    --body-file - <<'EOF'
  Hi Name,

  Thanks for meeting today. Next steps:
  - Item one
  - Item two

  Best regards,
  Your Name
  EOF
  ```

- Exemplo (lista HTML):
  ```bash
  gog gmail send --to recipient@example.com \
    --subject "Meeting Follow-up" \
    --body-html "<p>Hi Name,</p><p>Thanks for meeting today. Here are the next steps:</p><ul><li>Item one</li><li>Item two</li></ul><p>Best regards,<br>Your Name</p>"
  ```

Observações

- Defina `GOG_ACCOUNT=you@gmail.com` para evitar repetir `--account`.
- Para scripts, prefira `--json` junto com `--no-input`.
- Valores do Sheets podem ser passados via `--values-json` (recomendado) ou como linhas inline.
- Docs suporta export/cat/copy. Edições no local requerem um cliente da API Docs (não disponível no gog).
- Confirme antes de enviar e-mails ou criar eventos.
- `gog gmail search` retorna uma linha por thread; use `gog gmail messages search` quando precisar que cada e-mail seja retornado individualmente.
