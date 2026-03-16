---
summary: "Referência do CLI para `opencraft completion` (gerar/instalar scripts de completion de shell)"
read_when:
  - Você quer completions de shell para zsh/bash/fish/PowerShell
  - Você precisa fazer cache de scripts de completion no estado do OpenCraft
title: "completion"
---

# `opencraft completion`

Gerar scripts de completion de shell e opcionalmente instalá-los no seu perfil de shell.

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

- `-s, --shell <shell>`: alvo de shell (`zsh`, `bash`, `powershell`, `fish`; padrão: `zsh`)
- `-i, --install`: instalar completion adicionando uma linha de source ao seu perfil de shell
- `--write-state`: escrever script(s) de completion em `$OPENCLAW_STATE_DIR/completions` sem imprimir no stdout
- `-y, --yes`: pular prompts de confirmação de instalação

## Notas

- `--install` escreve um pequeno bloco "OpenCraft Completion" no seu perfil de shell e aponta para o script em cache.
- Sem `--install` ou `--write-state`, o comando imprime o script no stdout.
- Geração de completion carrega ansiosamente árvores de comando para que subcomandos aninhados sejam incluídos.
