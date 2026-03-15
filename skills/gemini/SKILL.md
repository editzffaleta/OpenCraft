---
name: gemini
description: CLI do Gemini para perguntas rápidas, resumos e geração de conteúdo.
homepage: https://ai.google.dev/
metadata:
  {
    "opencraft":
      {
        "emoji": "✨",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Instalar Gemini CLI (brew)",
            },
          ],
      },
  }
---

# Gemini CLI

Use o Gemini em modo de execução única com um prompt posicional (evite o modo interativo).

Início rápido

- `gemini "Responda esta pergunta..."`
- `gemini --model <nome> "Prompt..."`
- `gemini --output-format json "Retorne JSON"`

Extensões

- Listar: `gemini --list-extensions`
- Gerenciar: `gemini extensions <comando>`

Notas

- Se autenticação for necessária, execute `gemini` uma vez interativamente e siga o fluxo de login.
- Evite `--yolo` por segurança.
