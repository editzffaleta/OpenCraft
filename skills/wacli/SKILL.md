---
name: wacli
description: Envie mensagens WhatsApp para outras pessoas ou pesquise/sincronize histórico do WhatsApp via CLI wacli (não para chats normais do usuário).
homepage: https://wacli.sh
metadata:
  {
    "opencraft":
      {
        "emoji": "📱",
        "requires": { "bins": ["wacli"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "steipete/tap/wacli",
              "bins": ["wacli"],
              "label": "Instalar wacli (brew)",
            },
            {
              "id": "go",
              "kind": "go",
              "module": "github.com/steipete/wacli/cmd/wacli@latest",
              "bins": ["wacli"],
              "label": "Instalar wacli (go)",
            },
          ],
      },
  }
---

# wacli

Use `wacli` somente quando o usuário pedir explicitamente para enviar uma mensagem para outra pessoa no WhatsApp ou quando pedir para sincronizar/pesquisar o histórico do WhatsApp.
NÃO use `wacli` para chats normais do usuário; o OpenCraft roteia conversas do WhatsApp automaticamente.
Se o usuário estiver conversando com você no WhatsApp, você não deve usar esta ferramenta a menos que ele peça para contatar um terceiro.

Segurança

- Exija destinatário explícito + texto da mensagem.
- Confirme destinatário + mensagem antes de enviar.
- Se algo for ambíguo, faça uma pergunta de esclarecimento.

Auth + sincronização

- `wacli auth` (login por QR + sincronização inicial)
- `wacli sync --follow` (sincronização contínua)
- `wacli doctor`

Encontrar chats + mensagens

- `wacli chats list --limit 20 --query "name or number"`
- `wacli messages search "query" --limit 20 --chat <jid>`
- `wacli messages search "invoice" --after 2025-01-01 --before 2025-12-31`

Preenchimento de histórico

- `wacli history backfill --chat <jid> --requests 2 --count 50`

Enviar

- Texto: `wacli send text --to "+14155551212" --message "Hello! Are you free at 3pm?"`
- Grupo: `wacli send text --to "1234567890-123456789@g.us" --message "Running 5 min late."`
- Arquivo: `wacli send file --to "+14155551212" --file /path/agenda.pdf --caption "Agenda"`

Observações

- Diretório de armazenamento: `~/.wacli` (substitua com `--store`).
- Use `--json` para saída legível por máquina ao fazer parsing.
- O preenchimento de histórico requer que seu telefone esteja online; os resultados são no melhor esforço possível.
- O CLI do WhatsApp não é necessário para chats rotineiros do usuário; é para enviar mensagens para outras pessoas.
- JIDs: chats diretos têm formato `<number>@s.whatsapp.net`; grupos têm formato `<id>@g.us` (use `wacli chats list` para encontrar).
