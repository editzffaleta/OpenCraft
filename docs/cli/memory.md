---
summary: "Referência do CLI para `opencraft memory` (status/index/search)"
read_when:
  - Você quer indexar ou pesquisar memória semântica
  - Você está depurando disponibilidade ou indexação de memória
title: "memory"
---

# `opencraft memory`

Gerenciar indexação e busca de memória semântica.
Fornecido pelo plugin de memória ativo (padrão: `memory-core`; defina `plugins.slots.memory = "none"` para desabilitar).

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

- `--agent <id>`: escopo para um único agente. Sem ele, esses comandos rodam para cada agente configurado; se nenhuma lista de agentes estiver configurada, fazem fallback para o agente padrão.
- `--verbose`: emitir logs detalhados durante probes e indexação.

`memory status`:

- `--deep`: fazer probe de disponibilidade de vetor + embedding.
- `--index`: rodar uma reindexação se o store estiver sujo (implica `--deep`).
- `--json`: imprimir saída JSON.

`memory index`:

- `--force`: forçar uma reindexação completa.

`memory search`:

- Entrada de query: passe `[query]` posicional ou `--query <text>`.
- Se ambos forem fornecidos, `--query` vence.
- Se nenhum for fornecido, o comando sai com um erro.
- `--agent <id>`: escopo para um único agente (padrão: o agente padrão).
- `--max-results <n>`: limitar o número de resultados retornados.
- `--min-score <n>`: filtrar correspondências de baixa pontuação.
- `--json`: imprimir resultados JSON.

Notas:

- `memory index --verbose` imprime detalhes por fase (provedor, modelo, fontes, atividade de batch).
- `memory status` inclui quaisquer paths extras configurados via `memorySearch.extraPaths`.
- Se campos de chave de API remota de memória efetivamente ativos estiverem configurados como SecretRefs, o comando resolve esses valores do snapshot ativo do gateway. Se o gateway não estiver disponível, o comando falha rapidamente.
- Nota de skew de versão do Gateway: este path de comando requer um gateway que suporte `secrets.resolve`; gateways mais antigos retornam um erro de método desconhecido.
