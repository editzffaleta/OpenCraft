---
name: model-usage
description: Usa o CLI local CodexBar para resumir o uso por modelo para Codex ou Claude, incluindo o modelo atual (mais recente) ou um resumo completo por modelo. Acione quando for solicitado dados de uso/custo por modelo do codexbar, ou quando precisar de um resumo por modelo legível por script a partir do JSON de custo do codexbar.
metadata:
  {
    "opencraft":
      {
        "emoji": "📊",
        "os": ["darwin"],
        "requires": { "bins": ["codexbar"] },
        "install":
          [
            {
              "id": "brew-cask",
              "kind": "brew",
              "formula": "steipete/tap/codexbar",
              "bins": ["codexbar"],
              "label": "Instalar CodexBar (brew cask)",
            },
          ],
      },
  }
---

# Uso de Modelos

## Visão Geral

Obtém custo de uso por modelo a partir dos logs de custo locais do CodexBar. Suporta "modelo atual" (entrada diária mais recente) ou resumos "todos os modelos" para Codex ou Claude.

TODO: adicionar orientação de suporte para CLI Linux quando o caminho de instalação do CodexBar CLI for documentado para Linux.

## Início rápido

1. Busque o JSON de custo via CLI do CodexBar ou passe um arquivo JSON.
2. Use o script incluso para resumir por modelo.

```bash
python {baseDir}/scripts/model_usage.py --provider codex --mode current
python {baseDir}/scripts/model_usage.py --provider codex --mode all
python {baseDir}/scripts/model_usage.py --provider claude --mode all --format json --pretty
```

## Lógica do modelo atual

- Usa a linha diária mais recente com `modelBreakdowns`.
- Escolhe o modelo com o maior custo nessa linha.
- Usa como fallback a última entrada em `modelsUsed` quando os breakdowns estão ausentes.
- Substitua com `--model <nome>` quando precisar de um modelo específico.

## Entradas

- Padrão: executa `codexbar cost --format json --provider <codex|claude>`.
- Arquivo ou stdin:

```bash
codexbar cost --provider codex --format json > /tmp/cost.json
python {baseDir}/scripts/model_usage.py --input /tmp/cost.json --mode all
cat /tmp/cost.json | python {baseDir}/scripts/model_usage.py --input - --mode current
```

## Saída

- Texto (padrão) ou JSON (`--format json --pretty`).
- Os valores são apenas custo por modelo; tokens não são divididos por modelo na saída do CodexBar.

## Referências

- Leia `references/codexbar-cli.md` para flags CLI e campos do JSON de custo.
