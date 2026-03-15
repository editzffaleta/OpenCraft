---
name: blogwatcher
description: Monitore blogs e feeds RSS/Atom para atualizações usando o CLI blogwatcher.
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

- Adicionar um blog: `blogwatcher add "Meu Blog" https://exemplo.com`
- Listar blogs: `blogwatcher blogs`
- Verificar atualizações: `blogwatcher scan`
- Listar artigos: `blogwatcher articles`
- Marcar artigo como lido: `blogwatcher read 1`
- Marcar todos como lidos: `blogwatcher read-all`
- Remover um blog: `blogwatcher remove "Meu Blog"`

Exemplo de saída

```
$ blogwatcher blogs
Blogs monitorados (1):

  xkcd
    URL: https://xkcd.com
```

```
$ blogwatcher scan
Verificando 1 blog(s)...

  xkcd
    Fonte: RSS | Encontrados: 4 | Novos: 4

4 novo(s) artigo(s) encontrado(s) no total!
```

Notas

- Use `blogwatcher <comando> --help` para descobrir flags e opções.
