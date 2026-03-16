---
summary: "Referência do CLI para `opencraft logs` (tail de logs do gateway via RPC)"
read_when:
  - Você precisa fazer tail de logs do Gateway remotamente (sem SSH)
  - Você quer linhas de log JSON para tooling
title: "logs"
---

# `opencraft logs`

Fazer tail de logs de arquivo do Gateway via RPC (funciona em modo remoto).

Relacionado:

- Visão geral de logging: [Logging](/logging)

## Exemplos

```bash
opencraft logs
opencraft logs --follow
opencraft logs --json
opencraft logs --limit 500
opencraft logs --local-time
opencraft logs --follow --local-time
```

Use `--local-time` para renderizar timestamps no seu fuso horário local.
