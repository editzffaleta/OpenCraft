---
name: clawhub
description: Use o CLI do ClawHub para pesquisar, instalar, atualizar e publicar skills de agentes do clawhub.com. Use quando precisar buscar novas skills dinamicamente, sincronizar skills instaladas para a versão mais recente ou uma versão específica, ou publicar pastas de skills novas/atualizadas com o CLI clawhub instalado via npm.
metadata:
  {
    "opencraft":
      {
        "requires": { "bins": ["clawhub"] },
        "install":
          [
            {
              "id": "node",
              "kind": "node",
              "package": "clawhub",
              "bins": ["clawhub"],
              "label": "Instalar ClawHub CLI (npm)",
            },
          ],
      },
  }
---

# ClawHub CLI

Instalar

```bash
npm i -g clawhub
```

Autenticação (publicar)

```bash
clawhub login
clawhub whoami
```

Pesquisar

```bash
clawhub search "postgres backups"
```

Instalar

```bash
clawhub install my-skill
clawhub install my-skill --version 1.2.3
```

Atualizar (correspondência por hash + atualização)

```bash
clawhub update my-skill
clawhub update my-skill --version 1.2.3
clawhub update --all
clawhub update my-skill --force
clawhub update --all --no-input --force
```

Listar

```bash
clawhub list
```

Publicar

```bash
clawhub publish ./my-skill --slug my-skill --name "My Skill" --version 1.2.0 --changelog "Fixes + docs"
```

Observações

- Registro padrão: https://clawhub.com (substitua com CLAWHUB_REGISTRY ou --registry)
- Diretório de trabalho padrão: cwd (usa o workspace do OpenCraft como fallback); diretório de instalação: ./skills (substitua com --workdir / --dir / CLAWHUB_WORKDIR)
- O comando de atualização calcula hashes dos arquivos locais, resolve a versão correspondente e atualiza para a mais recente, a menos que --version esteja definido
