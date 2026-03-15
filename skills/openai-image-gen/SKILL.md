---
name: openai-image-gen
description: Gera imagens em lote via API de Imagens da OpenAI. Amostrador de prompts aleatórios + galeria `index.html`.
homepage: https://platform.openai.com/docs/api-reference/images
metadata:
  {
    "opencraft":
      {
        "emoji": "🎨",
        "requires": { "bins": ["python3"], "env": ["OPENAI_API_KEY"] },
        "primaryEnv": "OPENAI_API_KEY",
        "install":
          [
            {
              "id": "python-brew",
              "kind": "brew",
              "formula": "python",
              "bins": ["python3"],
              "label": "Instalar Python (brew)",
            },
          ],
      },
  }
---

# OpenAI Image Gen

Gere um conjunto de prompts "aleatórios mas estruturados" e renderize-os via API de Imagens da OpenAI.

## Executar

Nota: A geração de imagens pode demorar mais que os timeouts comuns de execução (por exemplo, 30 segundos).
Ao invocar esta skill via ferramenta exec do OpenCraft, defina um timeout maior para evitar cancelamentos prematuros/retentativas (ex: exec timeout=300).

```bash
python3 {baseDir}/scripts/gen.py
open ~/Projects/tmp/openai-image-gen-*/index.html  # se ~/Projects/tmp existir; senão ./tmp/...
```

Flags úteis:

```bash
# Modelos de imagem GPT com várias opções
python3 {baseDir}/scripts/gen.py --count 16 --model gpt-image-1
python3 {baseDir}/scripts/gen.py --prompt "foto de estúdio ultra-detalhada de um lagostim astronauta" --count 4
python3 {baseDir}/scripts/gen.py --size 1536x1024 --quality high --out-dir ./out/images
python3 {baseDir}/scripts/gen.py --model gpt-image-1.5 --background transparent --output-format webp

# DALL-E 3 (nota: count é automaticamente limitado a 1)
python3 {baseDir}/scripts/gen.py --model dall-e-3 --quality hd --size 1792x1024 --style vivid
python3 {baseDir}/scripts/gen.py --model dall-e-3 --style natural --prompt "paisagem serena de montanha"

# DALL-E 2
python3 {baseDir}/scripts/gen.py --model dall-e-2 --size 512x512 --count 4
```

## Parâmetros por Modelo

Modelos diferentes suportam valores de parâmetros diferentes. O script seleciona automaticamente os padrões adequados com base no modelo.

### Tamanho

- **Modelos de imagem GPT** (`gpt-image-1`, `gpt-image-1-mini`, `gpt-image-1.5`): `1024x1024`, `1536x1024` (paisagem), `1024x1536` (retrato), ou `auto`
  - Padrão: `1024x1024`
- **dall-e-3**: `1024x1024`, `1792x1024`, ou `1024x1792`
  - Padrão: `1024x1024`
- **dall-e-2**: `256x256`, `512x512`, ou `1024x1024`
  - Padrão: `1024x1024`

### Qualidade

- **Modelos de imagem GPT**: `auto`, `high`, `medium`, ou `low`
  - Padrão: `high`
- **dall-e-3**: `hd` ou `standard`
  - Padrão: `standard`
- **dall-e-2**: apenas `standard`
  - Padrão: `standard`

### Outras Diferenças Notáveis

- **dall-e-3** suporta apenas geração de 1 imagem por vez (`n=1`). O script limita automaticamente o count a 1 ao usar este modelo.
- **Modelos de imagem GPT** suportam parâmetros adicionais:
  - `--background`: `transparent`, `opaque`, ou `auto` (padrão)
  - `--output-format`: `png` (padrão), `jpeg`, ou `webp`
  - Nota: `stream` e `moderation` estão disponíveis via API mas ainda não implementados neste script
- **dall-e-3** tem um parâmetro `--style`: `vivid` (hiper-real, dramático) ou `natural` (mais natural)

## Saída

- Imagens `*.png`, `*.jpeg`, ou `*.webp` (formato de saída depende do modelo + `--output-format`)
- `prompts.json` (mapeamento prompt → arquivo)
- `index.html` (galeria de miniaturas)
