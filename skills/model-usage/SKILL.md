---
name: model-usage
description: Use o uso de custo local do CLI CodexBar para resumir o uso por modelo para Codex ou Claude, incluindo o modelo atual (mais recente) ou um detalhamento completo por modelo. Ative quando solicitado dados de uso/custo por modelo do codexbar, ou quando precisar de um resumo scriptável por modelo a partir do JSON de custo do codexbar.
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

# Uso de modelos

## Visão geral

Obtenha o custo de uso por modelo a partir dos logs de custo locais do CodexBar. Suporta resumos do "modelo atual" (entrada diária mais recente) ou "todos os modelos" para Codex ou Claude.

TODO: adicionar orientações de suporte ao CLI Linux assim que o caminho de instalação do CodexBar CLI for documentado para Linux.

## Início rápido

1. Obtenha o JSON de custo via CLI do CodexBar ou passe um arquivo JSON.
2. Use o script incluído para resumir por modelo.

```bash
python {baseDir}/scripts/model_usage.py --provider codex --mode current
python {baseDir}/scripts/model_usage.py --provider codex --mode all
python {baseDir}/scripts/model_usage.py --provider claude --mode all --format json --pretty
```

## Lógica do modelo atual

- Usa a entrada diária mais recente com `modelBreakdowns`.
- Seleciona o modelo com o maior custo nessa entrada.
- Usa como alternativa a última entrada em `modelsUsed` quando os detalhamentos estão ausentes.
- Substitua com `--model <name>` quando precisar de um modelo específico.

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
- Os valores são apenas de custo por modelo; os tokens não são divididos por modelo na saída do CodexBar.

## Referências

- Leia `references/codexbar-cli.md` para flags do CLI e campos do JSON de custo.
