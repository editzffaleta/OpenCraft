---
summary: "Referência CLI para `opencraft completion` (gerar/instalar scripts de completação de shell)"
read_when:
  - Você quer completações de shell para zsh/bash/fish/PowerShell
  - Você precisa armazenar scripts de completação no estado do OpenCraft
title: "completion"
---

# `opencraft completion`

Gere scripts de completação de shell e opcionalmente instale-os no seu perfil de shell.

## Uso

```bash
opencraft completion
opencraft completion --shell zsh
opencraft completion --install
opencraft completion --shell fish --install
opencraft completion --write-state
opencraft completion --shell bash --write-state
```

## Opções

- `-s, --shell <shell>`: shell alvo (`zsh`, `bash`, `powershell`, `fish`; padrão: `zsh`)
- `-i, --install`: instalar completação adicionando uma linha de source ao seu perfil de shell
- `--write-state`: gravar script(s) de completação em `$OPENCRAFT_STATE_DIR/completions` sem imprimir no stdout
- `-y, --yes`: pular confirmações de instalação

## Observações

- `--install` grava um pequeno bloco "OpenCraft Completion" no seu perfil de shell e aponta para o script em cache.
- Sem `--install` ou `--write-state`, o comando imprime o script no stdout.
- A geração de completação carrega árvores de comandos antecipadamente para que subcomandos aninhados sejam incluídos.
