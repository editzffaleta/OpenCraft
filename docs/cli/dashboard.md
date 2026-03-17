---
summary: "Referência CLI para `opencraft dashboard` (abrir a Interface de Controle)"
read_when:
  - Você quer abrir a Interface de Controle com seu token atual
  - Você quer imprimir a URL sem abrir um navegador
title: "dashboard"
---

# `opencraft dashboard`

Abra a Interface de Controle usando sua autenticação atual.

```bash
opencraft dashboard
opencraft dashboard --no-open
```

Observações:

- `dashboard` resolve SecretRefs configurados de `gateway.auth.token` quando possível.
- Para tokens gerenciados por SecretRef (resolvidos ou não), `dashboard` imprime/copia/abre uma URL sem token para evitar expor segredos externos na saída do terminal, histórico da área de transferência ou argumentos de abertura do navegador.
- Se `gateway.auth.token` é gerenciado por SecretRef mas não está resolvido neste caminho de comando, o comando imprime uma URL sem token e orientação explícita de correção em vez de incorporar um placeholder de token inválido.
