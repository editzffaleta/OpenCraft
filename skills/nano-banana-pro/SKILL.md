---
name: nano-banana-pro
description: Gere ou edite imagens via Gemini 3 Pro Image (Nano Banana Pro).
homepage: https://ai.google.dev/
metadata:
  {
    "opencraft":
      {
        "emoji": "🍌",
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"] },
        "primaryEnv": "GEMINI_API_KEY",
        "install":
          [
            {
              "id": "uv-brew",
              "kind": "brew",
              "formula": "uv",
              "bins": ["uv"],
              "label": "Instalar uv (brew)",
            },
          ],
      },
  }
---

# Nano Banana Pro (Gemini 3 Pro Image)

Use o script incluído para gerar ou editar imagens.

Gerar

```bash
uv run {baseDir}/scripts/generate_image.py --prompt "sua descrição de imagem" --filename "saida.png" --resolution 1K
```

Editar (imagem única)

```bash
uv run {baseDir}/scripts/generate_image.py --prompt "instruções de edição" --filename "saida.png" -i "/caminho/entrada.png" --resolution 2K
```

Composição multi-imagem (até 14 imagens)

```bash
uv run {baseDir}/scripts/generate_image.py --prompt "combine estas em uma cena" --filename "saida.png" -i img1.png -i img2.png -i img3.png
```

Chave de API

- Variável de ambiente `GEMINI_API_KEY`
- Ou defina `skills."nano-banana-pro".apiKey` / `skills."nano-banana-pro".env.GEMINI_API_KEY` em `~/.opencraft/opencraft.json`

Proporção específica (opcional)

```bash
uv run {baseDir}/scripts/generate_image.py --prompt "foto retrato" --filename "saida.png" --aspect-ratio 9:16
```

Notas

- Resoluções: `1K` (padrão), `2K`, `4K`.
- Proporções: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`. Sem `--aspect-ratio` / `-a`, o modelo escolhe livremente — use esta flag para avatares, fotos de perfil ou geração em lote consistente.
- Use timestamps nos nomes de arquivo: `yyyy-mm-dd-hh-mm-ss-nome.png`.
- O script imprime uma linha `MEDIA:` para o OpenCraft anexar automaticamente em provedores de chat suportados.
- Não releia a imagem de volta; reporte apenas o caminho salvo.
