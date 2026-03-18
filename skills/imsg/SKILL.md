---
name: imsg
description: CLI de iMessage/SMS para listar conversas, histórico e enviar mensagens via Messages.app.
homepage: https://imsg.to
metadata:
  {
    "opencraft":
      {
        "emoji": "📨",
        "os": ["darwin"],
        "requires": { "bins": ["imsg"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "steipete/tap/imsg",
              "bins": ["imsg"],
              "label": "Instalar imsg (brew)",
            },
          ],
      },
  }
---

# imsg

Use `imsg` para ler e enviar iMessage/SMS via macOS Messages.app.

## Quando Usar

✅ **USE esta skill quando:**

- O usuário pedir explicitamente para enviar iMessage ou SMS
- Ler histórico de conversa do iMessage
- Verificar conversas recentes no Messages.app
- Enviar para números de telefone ou Apple IDs

## Quando NÃO Usar

❌ **NÃO use esta skill quando:**

- Mensagens do Telegram → use a ferramenta `message` com `channel:telegram`
- Mensagens do Signal → use o canal Signal se configurado
- Mensagens do WhatsApp → use o canal WhatsApp se configurado
- Mensagens do Discord → use a ferramenta `message` com `channel:discord`
- Mensagens do Slack → use a skill `slack`
- Gerenciamento de chat em grupo (adicionar/remover membros) → não suportado
- Mensagens em massa → sempre confirme com o usuário primeiro
- Responder na conversa atual → apenas responda normalmente (o OpenCraft roteia automaticamente)

## Requisitos

- macOS com Messages.app conectado
- Acesso Total ao Disco para o terminal
- Permissão de Automação para o Messages.app (para envio)

## Comandos Comuns

### Listar Conversas

```bash
imsg chats --limit 10 --json
```

### Ver Histórico

```bash
# Por ID de conversa
imsg history --chat-id 1 --limit 20 --json

# Com informações de anexos
imsg history --chat-id 1 --limit 20 --attachments --json
```

### Monitorar Novas Mensagens

```bash
imsg watch --chat-id 1 --attachments
```

### Enviar Mensagens

```bash
# Apenas texto
imsg send --to "+14155551212" --text "Hello!"

# Com anexo
imsg send --to "+14155551212" --text "Check this out" --file /path/to/image.jpg

# Especificar serviço
imsg send --to "+14155551212" --text "Hi" --service imessage
imsg send --to "+14155551212" --text "Hi" --service sms
```

## Opções de Serviço

- `--service imessage` — Forçar iMessage (requer que o destinatário tenha iMessage)
- `--service sms` — Forçar SMS (balão verde)
- `--service auto` — Deixar o Messages.app decidir (padrão)

## Regras de Segurança

1. **Sempre confirme o destinatário e o conteúdo da mensagem** antes de enviar
2. **Nunca envie para números desconhecidos** sem aprovação explícita do usuário
3. **Tenha cuidado com anexos** — confirme que o caminho do arquivo existe
4. **Limite a frequência** — não faça spam

## Exemplo de Fluxo

Usuário: "Manda mensagem para a mamãe dizendo que vou me atrasar"

```bash
# 1. Encontrar a conversa da mamãe
imsg chats --limit 20 --json | jq '.[] | select(.displayName | contains("Mom"))'

# 2. Confirmar com o usuário
# "Encontrei Mamãe em +1555123456. Enviar 'Vou me atrasar' via iMessage?"

# 3. Enviar após confirmação
imsg send --to "+1555123456" --text "I'll be late"
```
