---
summary: "Referência CLI para `opencraft tui` (interface de terminal conectada ao Gateway)"
read_when:
  - Você quer uma interface de terminal para o Gateway (compatível com acesso remoto)
  - Você quer passar url/Token/sessão a partir de scripts
title: "tui"
---

# `opencraft tui`

Abrir a interface de terminal conectada ao Gateway.

Relacionado:

- Guia TUI: [TUI](/web/tui)

Notas:

- `tui` resolve SecretRefs de autenticação do Gateway configurados para autenticação por Token/senha quando possível (provedores `env`/`file`/`exec`).
- Quando iniciado de dentro de um diretório de workspace de agente configurado, o TUI seleciona automaticamente aquele agente para o padrão de chave de sessão (a menos que `--session` seja explicitamente `agent:<id>:...`).

## Exemplos

```bash
opencraft tui
opencraft tui --url ws://127.0.0.1:18789 --token <token>
opencraft tui --session main --deliver
# quando executado dentro de um workspace de agente, infere aquele agente automaticamente
opencraft tui --session bugfix
```
