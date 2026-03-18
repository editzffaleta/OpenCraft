---
name: blogwatcher
description: Monitore blogs e feeds RSS/Atom em busca de atualizações usando o CLI blogwatcher.
homepage: https://github.com/Hyaxia/blogwatcher
metadata:
  {
    "opencraft":
      {
        "emoji": "📰",
        "requires": { "bins": ["blogwatcher"] },
        "install":
          [
            {
              "id": "go",
              "kind": "go",
              "module": "github.com/Hyaxia/blogwatcher/cmd/blogwatcher@latest",
              "bins": ["blogwatcher"],
              "label": "Instalar blogwatcher (go)",
            },
          ],
      },
  }
---

# blogwatcher

Acompanhe atualizações de blogs e feeds RSS/Atom com o CLI `blogwatcher`.

Instalação

- Go: `go install github.com/Hyaxia/blogwatcher/cmd/blogwatcher@latest`

Início rápido

- `blogwatcher --help`

Comandos comuns

- Adicionar um blog: `blogwatcher add "Meu Blog" https://example.com`
- Listar blogs: `blogwatcher blogs`
- Verificar atualizações: `blogwatcher scan`
- Listar artigos: `blogwatcher articles`
- Marcar um artigo como lido: `blogwatcher read 1`
- Marcar todos os artigos como lidos: `blogwatcher read-all`
- Remover um blog: `blogwatcher remove "Meu Blog"`

Exemplo de saída

```
$ blogwatcher blogs
Tracked blogs (1):

  xkcd
    URL: https://xkcd.com
```

```
$ blogwatcher scan
Scanning 1 blog(s)...

  xkcd
    Source: RSS | Found: 4 | New: 4

Found 4 new article(s) total!
```

Observações

- Use `blogwatcher <command> --help` para descobrir flags e opções.
