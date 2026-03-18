---
name: himalaya
description: "CLI para gerenciar e-mails via IMAP/SMTP. Use `himalaya` para listar, ler, escrever, responder, encaminhar, pesquisar e organizar e-mails pelo terminal. Suporta múltiplas contas e composição de mensagens com MML (MIME Meta Language)."
homepage: https://github.com/pimalaya/himalaya
metadata:
  {
    "opencraft":
      {
        "emoji": "📧",
        "requires": { "bins": ["himalaya"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "himalaya",
              "bins": ["himalaya"],
              "label": "Instalar Himalaya (brew)",
            },
          ],
      },
  }
---

# Himalaya Email CLI

O Himalaya é um cliente de e-mail CLI que permite gerenciar e-mails pelo terminal usando backends IMAP, SMTP, Notmuch ou Sendmail.

## Referências

- `references/configuration.md` (configuração do arquivo de configuração + autenticação IMAP/SMTP)
- `references/message-composition.md` (sintaxe MML para composição de e-mails)

## Pré-requisitos

1. CLI do Himalaya instalado (`himalaya --version` para verificar)
2. Um arquivo de configuração em `~/.config/himalaya/config.toml`
3. Credenciais IMAP/SMTP configuradas (senha armazenada com segurança)

## Configuração inicial

Execute o assistente interativo para configurar uma conta:

```bash
himalaya account configure
```

Ou crie `~/.config/himalaya/config.toml` manualmente:

```toml
[accounts.personal]
email = "you@example.com"
display-name = "Your Name"
default = true

backend.type = "imap"
backend.host = "imap.example.com"
backend.port = 993
backend.encryption.type = "tls"
backend.login = "you@example.com"
backend.auth.type = "password"
backend.auth.cmd = "pass show email/imap"  # or use keyring

message.send.backend.type = "smtp"
message.send.backend.host = "smtp.example.com"
message.send.backend.port = 587
message.send.backend.encryption.type = "start-tls"
message.send.backend.login = "you@example.com"
message.send.backend.auth.type = "password"
message.send.backend.auth.cmd = "pass show email/smtp"
```

## Operações comuns

### Listar pastas

```bash
himalaya folder list
```

### Listar e-mails

Listar e-mails na INBOX (padrão):

```bash
himalaya envelope list
```

Listar e-mails em uma pasta específica:

```bash
himalaya envelope list --folder "Sent"
```

Listar com paginação:

```bash
himalaya envelope list --page 1 --page-size 20
```

### Pesquisar e-mails

```bash
himalaya envelope list from john@example.com subject meeting
```

### Ler um e-mail

Ler e-mail pelo ID (exibe texto simples):

```bash
himalaya message read 42
```

Exportar MIME bruto:

```bash
himalaya message export 42 --full
```

### Responder a um e-mail

Resposta interativa (abre o $EDITOR):

```bash
himalaya message reply 42
```

Responder para todos:

```bash
himalaya message reply 42 --all
```

### Encaminhar um e-mail

```bash
himalaya message forward 42
```

### Escrever um novo e-mail

Composição interativa (abre o $EDITOR):

```bash
himalaya message write
```

Enviar diretamente usando template:

```bash
cat << 'EOF' | himalaya template send
From: you@example.com
To: recipient@example.com
Subject: Test Message

Hello from Himalaya!
EOF
```

Ou com flag de cabeçalhos:

```bash
himalaya message write -H "To:recipient@example.com" -H "Subject:Test" "Message body here"
```

### Mover/Copiar e-mails

Mover para pasta:

```bash
himalaya message move 42 "Archive"
```

Copiar para pasta:

```bash
himalaya message copy 42 "Important"
```

### Excluir um e-mail

```bash
himalaya message delete 42
```

### Gerenciar flags

Adicionar flag:

```bash
himalaya flag add 42 --flag seen
```

Remover flag:

```bash
himalaya flag remove 42 --flag seen
```

## Múltiplas contas

Listar contas:

```bash
himalaya account list
```

Usar uma conta específica:

```bash
himalaya --account work envelope list
```

## Anexos

Salvar anexos de uma mensagem:

```bash
himalaya attachment download 42
```

Salvar em diretório específico:

```bash
himalaya attachment download 42 --dir ~/Downloads
```

## Formatos de saída

A maioria dos comandos suporta `--output` para saída estruturada:

```bash
himalaya envelope list --output json
himalaya envelope list --output plain
```

## Depuração

Ativar log de depuração:

```bash
RUST_LOG=debug himalaya envelope list
```

Rastreamento completo com backtrace:

```bash
RUST_LOG=trace RUST_BACKTRACE=1 himalaya envelope list
```

## Dicas

- Use `himalaya --help` ou `himalaya <command> --help` para uso detalhado.
- Os IDs de mensagens são relativos à pasta atual; refaça a listagem após mudar de pasta.
- Para compor e-mails ricos com anexos, use a sintaxe MML (veja `references/message-composition.md`).
- Armazene senhas com segurança usando `pass`, keyring do sistema ou um comando que exiba a senha.
