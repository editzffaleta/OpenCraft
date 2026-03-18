---
name: bear-notes
description: Crie, pesquise e gerencie notas do Bear via CLI grizzly.
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

# Bear Notes

Use `grizzly` para criar, ler e gerenciar notas no Bear no macOS.

Requisitos

- Aplicativo Bear instalado e em execução
- Para algumas operações (add-text, tags, open-note --selected), é necessário um token do Bear (armazenado em `~/.config/grizzly/token`)

## Obtendo um token do Bear

Para operações que exigem um token (add-text, tags, open-note --selected), você precisa de um token de autenticação:

1. Abra o Bear → Ajuda → Token da API → Copiar Token
2. Salve-o: `echo "SEU_TOKEN" > ~/.config/grizzly/token`

## Comandos comuns

Criar uma nota

```bash
echo "Conteúdo da nota aqui" | grizzly create --title "Minha Nota" --tag work
grizzly create --title "Nota Rápida" --tag inbox < /dev/null
```

Abrir/ler uma nota pelo ID

```bash
grizzly open-note --id "NOTE_ID" --enable-callback --json
```

Acrescentar texto a uma nota

```bash
echo "Conteúdo adicional" | grizzly add-text --id "NOTE_ID" --mode append --token-file ~/.config/grizzly/token
```

Listar todas as tags

```bash
grizzly tags --enable-callback --json --token-file ~/.config/grizzly/token
```

Pesquisar notas (via open-tag)

```bash
grizzly open-tag --name "work" --enable-callback --json
```

## Opções

Flags comuns:

- `--dry-run` — Visualiza a URL sem executar
- `--print-url` — Exibe a x-callback-url
- `--enable-callback` — Aguarda a resposta do Bear (necessário para leitura de dados)
- `--json` — Saída em JSON (ao usar callbacks)
- `--token-file PATH` — Caminho para o arquivo de token da API do Bear

## Configuração

O Grizzly lê a configuração (em ordem de prioridade):

1. Flags do CLI
2. Variáveis de ambiente (`GRIZZLY_TOKEN_FILE`, `GRIZZLY_CALLBACK_URL`, `GRIZZLY_TIMEOUT`)
3. `.grizzly.toml` no diretório atual
4. `~/.config/grizzly/config.toml`

Exemplo de `~/.config/grizzly/config.toml`:

```toml
token_file = "~/.config/grizzly/token"
callback_url = "http://127.0.0.1:42123/success"
timeout = "5s"
```

## Observações

- O Bear deve estar em execução para que os comandos funcionem
- Os IDs de notas são identificadores internos do Bear (visíveis nas informações da nota ou via callbacks)
- Use `--enable-callback` quando precisar ler dados de volta do Bear
- Algumas operações exigem um token válido (add-text, tags, open-note --selected)
