---
name: summarize
description: Resume ou extrai texto/transcrições de URLs, podcasts e arquivos locais (ótimo fallback para "transcreva esse YouTube/vídeo").
homepage: https://summarize.sh
metadata:
  {
    "opencraft":
      {
        "emoji": "🧾",
        "requires": { "bins": ["summarize"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "steipete/tap/summarize",
              "bins": ["summarize"],
              "label": "Instalar summarize (brew)",
            },
          ],
      },
  }
---

# Summarize

CLI rápida para resumir URLs, arquivos locais e links do YouTube.

## Quando usar (frases de gatilho)

Use esta habilidade imediatamente quando o usuário pedir qualquer um destes:

- "use o summarize.sh"
- "do que se trata esse link/vídeo?"
- "resuma essa URL/artigo"
- "transcreva esse YouTube/vídeo" (extração de transcrição best-effort; sem necessidade de `yt-dlp`)

## Início rápido

```bash
summarize "https://exemplo.com" --model google/gemini-3-flash-preview
summarize "/caminho/para/arquivo.pdf" --model google/gemini-3-flash-preview
summarize "https://youtu.be/dQw4w9WgXcQ" --youtube auto
```

## YouTube: resumo vs transcrição

Transcrição best-effort (apenas URLs):

```bash
summarize "https://youtu.be/dQw4w9WgXcQ" --youtube auto --extract-only
```

Se o usuário pediu uma transcrição mas ela é muito grande, retorne primeiro um resumo conciso, depois pergunte qual seção/intervalo de tempo expandir.

## Modelo + chaves

Defina a chave de API para o provedor escolhido:

- OpenAI: `OPENAI_API_KEY`
- Anthropic: `ANTHROPIC_API_KEY`
- xAI: `XAI_API_KEY`
- Google: `GEMINI_API_KEY` (aliases: `GOOGLE_GENERATIVE_AI_API_KEY`, `GOOGLE_API_KEY`)

O modelo padrão é `google/gemini-3-flash-preview` se nenhum estiver configurado.

## Flags úteis

- `--length short|medium|long|xl|xxl|<chars>`
- `--max-output-tokens <count>`
- `--extract-only` (apenas URLs)
- `--json` (legível por máquina)
- `--firecrawl auto|off|always` (extração fallback)
- `--youtube auto` (fallback Apify se `APIFY_API_TOKEN` estiver definido)

## Configuração

Arquivo de configuração opcional: `~/.summarize/config.json`

```json
{ "model": "openai/gpt-5.2" }
```

Serviços opcionais:

- `FIRECRAWL_API_KEY` para sites bloqueados
- `APIFY_API_TOKEN` para fallback do YouTube
