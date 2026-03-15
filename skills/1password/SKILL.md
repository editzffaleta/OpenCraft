---
name: 1password
description: Configure e use o CLI do 1Password (op). Use quando instalar o CLI, habilitar a integração com o app desktop, fazer login (conta única ou múltipla), ou ler/injetar/executar segredos via op.
homepage: https://developer.1password.com/docs/cli/get-started/
metadata:
  {
    "opencraft":
      {
        "emoji": "🔐",
        "requires": { "bins": ["op"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "1password-cli",
              "bins": ["op"],
              "label": "Instalar 1Password CLI (brew)",
            },
          ],
      },
  }
---

# CLI do 1Password

Siga os passos oficiais de início do CLI. Não adivinhe comandos de instalação.

## Referências

- `references/get-started.md` (instalação + integração com app + fluxo de login)
- `references/cli-examples.md` (exemplos reais de `op`)

## Fluxo de Trabalho

1. Verifique o SO + shell.
2. Confirme o CLI presente: `op --version`.
3. Confirme que a integração com o app desktop está habilitada (conforme get-started) e o app está desbloqueado.
4. OBRIGATÓRIO: crie uma sessão tmux nova para todos os comandos `op` (sem chamadas diretas a `op` fora do tmux).
5. Faça login / autorize dentro do tmux: `op signin` (espere o prompt do app).
6. Verifique acesso dentro do tmux: `op whoami` (deve ter sucesso antes de qualquer leitura de segredo).
7. Se múltiplas contas: use `--account` ou `OP_ACCOUNT`.

## Sessão tmux OBRIGATÓRIA (T-Max)

A ferramenta shell usa um TTY novo por comando. Para evitar re-prompts e falhas, sempre execute `op` dentro de uma sessão tmux dedicada com socket/nome de sessão novos.

Exemplo (veja skill `tmux` para convenções de socket, não reutilize nomes antigos de sessão):

```bash
SOCKET_DIR="${OPENCRAFT_TMUX_SOCKET_DIR:-${CLAWDBOT_TMUX_SOCKET_DIR:-${TMPDIR:-/tmp}/opencraft-tmux-sockets}}"
mkdir -p "$SOCKET_DIR"
SOCKET="$SOCKET_DIR/opencraft-op.sock"
SESSION="op-auth-$(date +%Y%m%d-%H%M%S)"

tmux -S "$SOCKET" new -d -s "$SESSION" -n shell
tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 -- "op signin --account my.1password.com" Enter
tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 -- "op whoami" Enter
tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 -- "op vault list" Enter
tmux -S "$SOCKET" capture-pane -p -J -t "$SESSION":0.0 -S -200
tmux -S "$SOCKET" kill-session -t "$SESSION"
```

## Proteções

- Nunca cole segredos em logs, chat ou código.
- Prefira `op run` / `op inject` a escrever segredos em disco.
- Se login sem integração com app for necessário, use `op account add`.
- Se um comando retornar "account is not signed in", execute novamente `op signin` dentro do tmux e autorize no app.
- Não execute `op` fora do tmux; pare e pergunte se o tmux não estiver disponível.
