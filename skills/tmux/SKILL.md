---
name: tmux
description: Controle remoto de sessões tmux para CLIs interativas, enviando teclas e capturando a saída dos painéis.
metadata:
  { "opencraft": { "emoji": "🧵", "os": ["darwin", "linux"], "requires": { "bins": ["tmux"] } } }
---

# Controle de Sessões tmux

Controle sessões tmux enviando teclas e lendo a saída. Essencial para gerenciar sessões do Claude Code.

## Quando Usar

✅ **USE esta skill quando:**

- Monitorar sessões do Claude/Codex no tmux
- Enviar entrada para aplicações de terminal interativas
- Capturar saída de processos de longa duração no tmux
- Navegar por painéis/janelas do tmux programaticamente
- Verificar trabalho em segundo plano em sessões existentes

## Quando NÃO Usar

❌ **NÃO use esta skill quando:**

- Executar comandos shell pontuais → use a ferramenta `exec` diretamente
- Iniciar novos processos em segundo plano → use `exec` com `background:true`
- Scripts não interativos → use a ferramenta `exec`
- O processo não está no tmux
- Você precisa criar uma nova sessão tmux → use `exec` com `tmux new-session`

## Sessões de Exemplo

| Sessão                  | Finalidade                      |
| ----------------------- | ------------------------------- |
| `shared`                | Sessão interativa principal     |
| `worker-2` - `worker-8` | Sessões de workers em paralelo  |

## Comandos Comuns

### Listar Sessões

```bash
tmux list-sessions
tmux ls
```

### Capturar Saída

```bash
# Últimas 20 linhas do painel
tmux capture-pane -t shared -p | tail -20

# Scrollback completo
tmux capture-pane -t shared -p -S -

# Painel específico na janela
tmux capture-pane -t shared:0.0 -p
```

### Enviar Teclas

```bash
# Enviar texto (não pressiona Enter)
tmux send-keys -t shared "hello"

# Enviar texto + Enter
tmux send-keys -t shared "y" Enter

# Enviar teclas especiais
tmux send-keys -t shared Enter
tmux send-keys -t shared Escape
tmux send-keys -t shared C-c          # Ctrl+C
tmux send-keys -t shared C-d          # Ctrl+D (EOF)
tmux send-keys -t shared C-z          # Ctrl+Z (suspender)
```

### Navegação de Janelas/Painéis

```bash
# Selecionar janela
tmux select-window -t shared:0

# Selecionar painel
tmux select-pane -t shared:0.1

# Listar janelas
tmux list-windows -t shared
```

### Gerenciamento de Sessões

```bash
# Criar nova sessão
tmux new-session -d -s newsession

# Encerrar sessão
tmux kill-session -t sessionname

# Renomear sessão
tmux rename-session -t old new
```

## Enviando Entrada com Segurança

Para TUIs interativas (Claude Code, Codex, etc.), divida o texto e o Enter em envios separados para evitar problemas de colagem/multilinha:

```bash
tmux send-keys -t shared -l -- "Please apply the patch in src/foo.ts"
sleep 0.1
tmux send-keys -t shared Enter
```

## Padrões de Sessão do Claude Code

### Verificar se a Sessão Precisa de Entrada

```bash
# Procurar prompts
tmux capture-pane -t worker-3 -p | tail -10 | grep -E "❯|Yes.*No|proceed|permission"
```

### Aprovar Prompt do Claude Code

```bash
# Enviar 'y' e Enter
tmux send-keys -t worker-3 'y' Enter

# Ou selecionar opção numerada
tmux send-keys -t worker-3 '2' Enter
```

### Verificar Status de Todas as Sessões

```bash
for s in shared worker-2 worker-3 worker-4 worker-5 worker-6 worker-7 worker-8; do
  echo "=== $s ==="
  tmux capture-pane -t $s -p 2>/dev/null | tail -5
done
```

### Enviar Tarefa para uma Sessão

```bash
tmux send-keys -t worker-4 "Fix the bug in auth.js" Enter
```

## Observações

- Use `capture-pane -p` para imprimir na saída padrão (essencial para scripts)
- `-S -` captura todo o histórico de scrollback
- Formato de alvo: `session:window.pane` (ex.: `shared:0.0`)
- Sessões persistem após desconexões SSH
