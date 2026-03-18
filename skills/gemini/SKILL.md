---
name: gemini
description: CLI do Gemini para perguntas e respostas, resumos e geração em modo único.
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
- `gemini --model <name> "Prompt..."`
- `gemini --output-format json "Return JSON"`

Extensões

- Listar: `gemini --list-extensions`
- Gerenciar: `gemini extensions <command>`

Observações

- Se a autenticação for necessária, execute `gemini` uma vez de forma interativa e siga o fluxo de login.
- Evite `--yolo` por segurança.
