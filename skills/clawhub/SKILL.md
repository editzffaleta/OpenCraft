---
name: clawhub
description: Use o CLI ClawHub para pesquisar, instalar, atualizar e publicar skills de agente do clawhub.com. Use quando precisar buscar novas skills dinamicamente, sincronizar skills instaladas para a versão mais recente ou específica, ou publicar pastas de skill novas/atualizadas com o CLI clawhub instalado via npm.
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
clawhub search "backups postgres"
```

Instalar

```bash
clawhub install minha-skill
clawhub install minha-skill --version 1.2.3
```

Atualizar (correspondência por hash + upgrade)

```bash
clawhub update minha-skill
clawhub update minha-skill --version 1.2.3
clawhub update --all
clawhub update minha-skill --force
clawhub update --all --no-input --force
```

Listar

```bash
clawhub list
```

Publicar

```bash
clawhub publish ./minha-skill --slug minha-skill --name "Minha Skill" --version 1.2.0 --changelog "Correções + docs"
```

Notas

- Registry padrão: https://clawhub.com (sobrescreva com CLAWHUB_REGISTRY ou --registry)
- Workdir padrão: cwd (volta ao workspace OpenCraft); dir de instalação: ./skills (sobrescreva com --workdir / --dir / CLAWHUB_WORKDIR)
- O comando update faz hash dos arquivos locais, resolve a versão correspondente e faz upgrade para a mais recente a menos que --version esteja definido
