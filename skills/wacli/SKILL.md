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

Use `wacli` apenas quando o usuário pedir explicitamente para enviar mensagem para alguém no WhatsApp ou quando pedir para sincronizar/pesquisar histórico do WhatsApp.
NÃO use `wacli` para chats normais do usuário; o OpenCraft roteia conversas WhatsApp automaticamente.
Se o usuário estiver conversando com você no WhatsApp, não use esta ferramenta a menos que peçam para contatar um terceiro.

Segurança

- Exija destinatário explícito + texto da mensagem.
- Confirme destinatário + mensagem antes de enviar.
- Se algo for ambíguo, faça uma pergunta de esclarecimento.

Autenticação + sincronização

- `wacli auth` (login QR + sincronização inicial)
- `wacli sync --follow` (sincronização contínua)
- `wacli doctor`

Encontrar chats + mensagens

- `wacli chats list --limit 20 --query "nome ou número"`
- `wacli messages search "consulta" --limit 20 --chat <jid>`
- `wacli messages search "fatura" --after 2025-01-01 --before 2025-12-31`

Recarregar histórico

- `wacli history backfill --chat <jid> --requests 2 --count 50`

Enviar

- Texto: `wacli send text --to "+5511999999999" --message "Olá! Você está livre às 15h?"`
- Grupo: `wacli send text --to "1234567890-123456789@g.us" --message "Atrasando 5 min."`
- Arquivo: `wacli send file --to "+5511999999999" --file /caminho/pauta.pdf --caption "Pauta"`

Notas

- Diretório de armazenamento: `~/.wacli` (sobrescreva com `--store`).
- Use `--json` para saída legível por máquina ao analisar.
- O recarregamento requer seu telefone online; resultados são melhores esforços.
- O CLI WhatsApp não é necessário para chats rotineiros do usuário; é para enviar mensagens a outras pessoas.
- JIDs: chats diretos parecem `<número>@s.whatsapp.net`; grupos parecem `<id>@g.us` (use `wacli chats list` para encontrar).
