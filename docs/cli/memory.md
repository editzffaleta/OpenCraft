---
summary: "Referência CLI para `opencraft memory` (status/index/search)"
read_when:
  - Você quer indexar ou pesquisar memória semântica
  - Você está depurando disponibilidade ou indexação de memória
title: "memory"
---

# `opencraft memory`

Gerenciar indexação e pesquisa de memória semântica.
Fornecido pelo Plugin de memória ativo (padrão: `memory-core`; defina `plugins.slots.memory = "none"` para desativar).

Relacionado:

- Conceito de memória: [Memory](/concepts/memory)
- Plugins: [Plugins](/tools/plugin)

## Exemplos

```bash
opencraft memory status
opencraft memory status --deep
opencraft memory index --force
opencraft memory search "meeting notes"
opencraft memory search --query "deployment" --max-results 20
opencraft memory status --json
opencraft memory status --deep --index
opencraft memory status --deep --index --verbose
opencraft memory status --agent main
opencraft memory index --agent main --verbose
```

## Opções

`memory status` e `memory index`:

- `--agent <id>`: escopo para um único agente. Sem isso, esses comandos executam para cada agente configurado; se nenhuma lista de agentes estiver configurada, eles usam o agente padrão.
- `--verbose`: emitir logs detalhados durante sondagens e indexação.

`memory status`:

- `--deep`: sondar disponibilidade de vetor + embedding.
- `--index`: executar reindexação se o armazenamento estiver sujo (implica `--deep`).
- `--json`: imprimir saída JSON.

`memory index`:

- `--force`: forçar reindexação completa.

`memory search`:

- Entrada de consulta: passe posicional `[query]` ou `--query <text>`.
- Se ambos forem fornecidos, `--query` prevalece.
- Se nenhum for fornecido, o comando encerra com erro.
- `--agent <id>`: escopo para um único agente (padrão: o agente padrão).
- `--max-results <n>`: limitar o número de resultados retornados.
- `--min-score <n>`: filtrar correspondências de baixa pontuação.
- `--json`: imprimir resultados JSON.

Notas:

- `memory index --verbose` imprime detalhes por fase (provedor, modelo, fontes, atividade em lote).
- `memory status` inclui quaisquer caminhos extras configurados via `memorySearch.extraPaths`.
- Se os campos de chave de API remota de memória ativa efetivamente configurados estiverem como SecretRefs, o comando resolve esses valores do snapshot do Gateway ativo. Se o Gateway estiver indisponível, o comando falha imediatamente.
- Nota sobre diferença de versão do Gateway: este caminho de comando requer um Gateway que suporte `secrets.resolve`; Gateways mais antigos retornam erro de método desconhecido.
