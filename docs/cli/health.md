---
summary: "Referência do CLI para `opencraft health` (endpoint de saúde do gateway via RPC)"
read_when:
  - Você quer verificar rapidamente a saúde do Gateway em execução
title: "health"
---

# `opencraft health`

Buscar saúde do Gateway em execução.

```bash
opencraft health
opencraft health --json
opencraft health --verbose
```

Notas:

- `--verbose` roda probes ao vivo e imprime timings por conta quando múltiplas contas estão configuradas.
- A saída inclui stores de sessão por agente quando múltiplos agentes estão configurados.
