---
summary: "Referência do CLI para `opencraft dashboard` (abrir a UI de Controle)"
read_when:
  - Você quer abrir a UI de Controle com seu token atual
  - Você quer imprimir a URL sem abrir um browser
title: "dashboard"
---

# `opencraft dashboard`

Abrir a UI de Controle usando sua auth atual.

```bash
opencraft dashboard
opencraft dashboard --no-open
```

Notas:

- `dashboard` resolve SecretRefs de `gateway.auth.token` configurados quando possível.
- Para tokens gerenciados por SecretRef (resolvidos ou não resolvidos), `dashboard` imprime/copia/abre uma URL sem token para evitar expor segredos externos em saída de terminal, histórico de área de transferência ou argumentos de lançamento de browser.
- Se `gateway.auth.token` é gerenciado por SecretRef mas não resolvido neste path de comando, o comando imprime uma URL sem token e orientação explícita de remediação em vez de incorporar um placeholder de token inválido.
