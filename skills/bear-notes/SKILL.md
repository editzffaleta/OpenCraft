---
name: bear-notes
description: Criar, pesquisar e gerenciar notas do Bear via CLI grizzly.
homepage: https://bear.app
metadata:
  {
    "opencraft":
      {
        "emoji": "🐻",
        "os": ["darwin"],
        "requires": { "bins": ["grizzly"] },
        "install":
          [
            {
              "id": "go",
              "kind": "go",
              "module": "github.com/tylerwince/grizzly/cmd/grizzly@latest",
              "bins": ["grizzly"],
              "label": "Instalar grizzly (go)",
            },
          ],
      },
  }
---

# Notas do Bear

Use `grizzly` para criar, ler e gerenciar notas no Bear no macOS.

Requisitos:

- App Bear instalado e em execução
- Para algumas operações (add-text, tags, open-note --selected), um token do app Bear (armazenado em `~/.config/grizzly/token`)

## Obtendo um Token do Bear

Para operações que exigem token (add-text, tags, open-note --selected), você precisa de um token de autenticação:

1. Abra Bear → Ajuda → Token da API → Copiar Token
2. Salve-o: `echo "SEU_TOKEN" > ~/.config/grizzly/token`

## Comandos Comuns

Criar uma nota:

```bash
echo "Conteúdo da nota aqui" | grizzly create --title "Minha Nota" --tag trabalho
grizzly create --title "Nota Rápida" --tag inbox < /dev/null
```

Abrir/ler uma nota por ID:

```bash
grizzly open-note --id "NOTE_ID" --enable-callback --json
```

Adicionar texto a uma nota:

```bash
echo "Conteúdo adicional" | grizzly add-text --id "NOTE_ID" --mode append --token-file ~/.config/grizzly/token
```

Listar todas as tags:

```bash
grizzly tags --enable-callback --json --token-file ~/.config/grizzly/token
```

Pesquisar notas (via open-tag):

```bash
grizzly open-tag --name "trabalho" --enable-callback --json
```

## Opções

Flags comuns:

- `--dry-run` — Prévia da URL sem executar
- `--print-url` — Mostrar o x-callback-url
- `--enable-callback` — Aguardar a resposta do Bear (necessário para leitura de dados)
- `--json` — Saída como JSON (ao usar callbacks)
- `--token-file PATH` — Caminho para o arquivo de token da API do Bear

## Configuração

O Grizzly lê a configuração (em ordem de prioridade):

1. Flags CLI
2. Variáveis de ambiente (`GRIZZLY_TOKEN_FILE`, `GRIZZLY_CALLBACK_URL`, `GRIZZLY_TIMEOUT`)
3. `.grizzly.toml` no diretório atual
4. `~/.config/grizzly/config.toml`

Exemplo de `~/.config/grizzly/config.toml`:

```toml
token_file = "~/.config/grizzly/token"
callback_url = "http://127.0.0.1:42123/success"
timeout = "5s"
```

## Notas

- O Bear deve estar em execução para os comandos funcionarem
- IDs de nota são os identificadores internos do Bear (visíveis nas informações da nota ou via callbacks)
- Use `--enable-callback` quando precisar ler dados de volta do Bear
- Algumas operações requerem um token válido (add-text, tags, open-note --selected)
