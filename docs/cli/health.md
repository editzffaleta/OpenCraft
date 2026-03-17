---
summary: "Referência CLI para `opencraft health` (endpoint de saúde do gateway via RPC)"
read_when:
  - Você quer verificar rapidamente a saúde do Gateway em execução
title: "health"
---

# `opencraft health`

Busque informações de saúde do Gateway em execução.

```bash
opencraft health
opencraft health --json
opencraft health --verbose
```

Observações:

- `--verbose` executa verificações ao vivo e imprime tempos por conta quando múltiplas contas estão configuradas.
- A saída inclui armazenamentos de sessão por agente quando múltiplos agentes estão configurados.
