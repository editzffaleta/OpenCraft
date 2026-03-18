---
name: nano-pdf
description: Edite PDFs com instruções em linguagem natural usando o CLI nano-pdf.
homepage: https://pypi.org/project/nano-pdf/
metadata:
  {
    "opencraft":
      {
        "emoji": "📄",
        "requires": { "bins": ["nano-pdf"] },
        "install":
          [
            {
              "id": "uv",
              "kind": "uv",
              "package": "nano-pdf",
              "bins": ["nano-pdf"],
              "label": "Instalar nano-pdf (uv)",
            },
          ],
      },
  }
---

# nano-pdf

Use `nano-pdf` para aplicar edições em uma página específica de um PDF usando uma instrução em linguagem natural.

## Início rápido

```bash
nano-pdf edit deck.pdf 1 "Change the title to 'Q3 Results' and fix the typo in the subtitle"
```

Observações:

- Os números de página são baseados em 0 ou em 1 dependendo da versão/configuração da ferramenta; se o resultado parecer deslocado por um, tente novamente com o outro.
- Sempre verifique o PDF de saída antes de enviá-lo.
