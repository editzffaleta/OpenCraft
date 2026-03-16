---
summary: "Referência do CLI para `opencraft tui` (UI de terminal conectada ao Gateway)"
read_when:
  - Você quer uma UI de terminal para o Gateway (amigável a remote)
  - Você quer passar url/token/sessão de scripts
title: "tui"
---

# `opencraft tui`

Abrir a UI de terminal conectada ao Gateway.

Relacionado:

- Guia TUI: [TUI](/web/tui)

Notas:

- `tui` resolve SecretRefs de auth do gateway configurados para auth por token/senha quando possível (provedores `env`/`file`/`exec`).
- Quando lançado de dentro de um diretório de workspace de agente configurado, TUI auto-seleciona aquele agente para o padrão de chave de sessão (a menos que `--session` seja explicitamente `agent:<id>:...`).

## Exemplos

```bash
opencraft tui
opencraft tui --url ws://127.0.0.1:18789 --token <token>
opencraft tui --session main --deliver
# quando rodado dentro de um workspace de agente, infere aquele agente automaticamente
opencraft tui --session bugfix
```
