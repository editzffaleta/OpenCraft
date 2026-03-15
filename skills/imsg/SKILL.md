---
name: imsg
description: CLI de iMessage/SMS para listar chats, histórico e enviar mensagens via Messages.app.
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

Use `imsg` para ler e enviar iMessage/SMS via Messages.app do macOS.

## Quando Usar

✅ **USE esta skill quando:**

- Usuário pede explicitamente para enviar iMessage ou SMS
- Lendo histórico de conversa iMessage
- Verificando chats recentes no Messages.app
- Enviando para números de telefone ou Apple IDs

## Quando NÃO Usar

❌ **NÃO use esta skill quando:**

- Mensagens do Telegram → use ferramenta `message` com `channel:telegram`
- Mensagens do Signal → use canal Signal se configurado
- Mensagens do WhatsApp → use canal WhatsApp se configurado
- Mensagens do Discord → use ferramenta `message` com `channel:discord`
- Mensagens do Slack → use skill `slack`
- Gerenciamento de chat em grupo (adicionar/remover membros) → não suportado
- Envio em massa → sempre confirme com o usuário primeiro
- Responder na conversa atual → apenas responda normalmente (OpenCraft roteia automaticamente)

## Requisitos

- macOS com Messages.app conectado
- Acesso Total ao Disco para o terminal
- Permissão de Automação para Messages.app (para envio)

## Comandos Comuns

### Listar Chats

```bash
imsg chats --limit 10 --json
```

### Ver Histórico

```bash
# Por ID de chat
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
imsg send --to "+5511999999999" --text "Olá!"

# Com anexo
imsg send --to "+5511999999999" --text "Veja isso" --file /caminho/para/imagem.jpg

# Especificar serviço
imsg send --to "+5511999999999" --text "Oi" --service imessage
imsg send --to "+5511999999999" --text "Oi" --service sms
```

## Opções de Serviço

- `--service imessage` — Forçar iMessage (requer que destinatário tenha iMessage)
- `--service sms` — Forçar SMS (bolha verde)
- `--service auto` — Deixar Messages.app decidir (padrão)

## Regras de Segurança

1. **Sempre confirme destinatário e conteúdo** antes de enviar
2. **Nunca envie para números desconhecidos** sem aprovação explícita do usuário
3. **Cuidado com anexos** — confirme que o caminho do arquivo existe
4. **Limite a frequência** — não envie spam

## Fluxo de Exemplo

Usuário: "Manda mensagem pra minha mãe que vou me atrasar"

```bash
# 1. Encontrar chat da mãe
imsg chats --limit 20 --json | jq '.[] | select(.displayName | contains("Mãe"))'

# 2. Confirmar com usuário
# "Encontrei Mãe no +5511999123456. Enviar 'Vou me atrasar' via iMessage?"

# 3. Enviar após confirmação
imsg send --to "+5511999123456" --text "Vou me atrasar"
```
