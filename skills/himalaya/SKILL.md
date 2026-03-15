---
name: himalaya
description: "CLI para gerenciar e-mails via IMAP/SMTP. Use `himalaya` para listar, ler, escrever, responder, encaminhar, pesquisar e organizar e-mails pelo terminal. Suporta múltiplas contas e composição com MML (MIME Meta Language)."
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

- `references/configuration.md` (configuração do arquivo de config + autenticação IMAP/SMTP)
- `references/message-composition.md` (sintaxe MML para composição de e-mails)

## Pré-requisitos

1. CLI do Himalaya instalado (`himalaya --version` para verificar)
2. Arquivo de configuração em `~/.config/himalaya/config.toml`
3. Credenciais IMAP/SMTP configuradas (senha armazenada com segurança)

## Configuração

Execute o assistente interativo para configurar uma conta:

```bash
himalaya account configure
```

Ou crie `~/.config/himalaya/config.toml` manualmente:

```toml
[accounts.pessoal]
email = "voce@exemplo.com"
display-name = "Seu Nome"
default = true

backend.type = "imap"
backend.host = "imap.exemplo.com"
backend.port = 993
backend.encryption.type = "tls"
backend.login = "voce@exemplo.com"
backend.auth.type = "password"
backend.auth.cmd = "pass show email/imap"  # ou use keyring

message.send.backend.type = "smtp"
message.send.backend.host = "smtp.exemplo.com"
message.send.backend.port = 587
message.send.backend.encryption.type = "start-tls"
message.send.backend.login = "voce@exemplo.com"
message.send.backend.auth.type = "password"
message.send.backend.auth.cmd = "pass show email/smtp"
```

## Operações Comuns

### Listar Pastas

```bash
himalaya folder list
```

### Listar E-mails

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

### Pesquisar E-mails

```bash
himalaya envelope list from joao@exemplo.com subject reuniao
```

### Ler um E-mail

Ler e-mail por ID (exibe texto simples):

```bash
himalaya message read 42
```

Exportar MIME bruto:

```bash
himalaya message export 42 --full
```

### Responder a um E-mail

Resposta interativa (abre $EDITOR):

```bash
himalaya message reply 42
```

Responder a todos:

```bash
himalaya message reply 42 --all
```

### Encaminhar um E-mail

```bash
himalaya message forward 42
```

### Escrever um Novo E-mail

Composição interativa (abre $EDITOR):

```bash
himalaya message write
```

Enviar diretamente usando template:

```bash
cat << 'EOF' | himalaya template send
From: voce@exemplo.com
To: destinatario@exemplo.com
Subject: Mensagem de Teste

Olá do Himalaya!
EOF
```

Ou com flag de cabeçalhos:

```bash
himalaya message write -H "To:destinatario@exemplo.com" -H "Subject:Teste" "Corpo da mensagem aqui"
```

### Mover/Copiar E-mails

Mover para pasta:

```bash
himalaya message move 42 "Archive"
```

Copiar para pasta:

```bash
himalaya message copy 42 "Important"
```

### Excluir um E-mail

```bash
himalaya message delete 42
```

### Gerenciar Flags

Adicionar flag:

```bash
himalaya flag add 42 --flag seen
```

Remover flag:

```bash
himalaya flag remove 42 --flag seen
```

## Múltiplas Contas

Listar contas:

```bash
himalaya account list
```

Usar uma conta específica:

```bash
himalaya --account trabalho envelope list
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

## Formatos de Saída

A maioria dos comandos suporta `--output` para saída estruturada:

```bash
himalaya envelope list --output json
himalaya envelope list --output plain
```

## Depuração

Habilitar log de debug:

```bash
RUST_LOG=debug himalaya envelope list
```

Trace completo com backtrace:

```bash
RUST_LOG=trace RUST_BACKTRACE=1 himalaya envelope list
```

## Dicas

- Use `himalaya --help` ou `himalaya <comando> --help` para uso detalhado.
- IDs de mensagem são relativos à pasta atual; relist após trocar de pasta.
- Para compor e-mails ricos com anexos, use sintaxe MML (veja `references/message-composition.md`).
- Armazene senhas com segurança usando `pass`, keyring do sistema ou um comando que retorna a senha.
