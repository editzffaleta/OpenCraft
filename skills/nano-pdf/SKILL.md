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
nano-pdf edit apresentacao.pdf 1 "Altere o título para 'Resultados do 3º Trimestre' e corrija o erro de digitação no subtítulo"
```

Notas:

- Os números de página podem ser baseados em 0 ou 1 dependendo da versão/config da ferramenta; se o resultado parecer errado por um, tente novamente com o outro.
- Sempre verifique o PDF de saída antes de enviá-lo.
