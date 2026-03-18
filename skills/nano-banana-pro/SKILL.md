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
uv run {baseDir}/scripts/generate_image.py --prompt "your image description" --filename "output.png" --resolution 1K
```

Editar (imagem única)

```bash
uv run {baseDir}/scripts/generate_image.py --prompt "edit instructions" --filename "output.png" -i "/path/in.png" --resolution 2K
```

Composição com múltiplas imagens (até 14 imagens)

```bash
uv run {baseDir}/scripts/generate_image.py --prompt "combine these into one scene" --filename "output.png" -i img1.png -i img2.png -i img3.png
```

Chave de API

- Variável de ambiente `GEMINI_API_KEY`
- Ou defina `skills."nano-banana-pro".apiKey` / `skills."nano-banana-pro".env.GEMINI_API_KEY` em `~/.editzffaleta/OpenCraft.json`

Proporção de aspecto específica (opcional)

```bash
uv run {baseDir}/scripts/generate_image.py --prompt "portrait photo" --filename "output.png" --aspect-ratio 9:16
```

Observações

- Resoluções: `1K` (padrão), `2K`, `4K`.
- Proporções de aspecto: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`. Sem `--aspect-ratio` / `-a`, o modelo escolhe livremente - use essa flag para avatares, fotos de perfil ou geração em lote consistente.
- Use timestamps nos nomes de arquivo: `yyyy-mm-dd-hh-mm-ss-name.png`.
- O script imprime uma linha `MEDIA:` para o OpenCraft anexar automaticamente nos provedores de chat suportados.
- Não releia a imagem; informe apenas o caminho salvo.
