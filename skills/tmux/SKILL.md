---
name: tmux
description: Controle remoto de sessões tmux para CLIs interativos enviando teclas e raspando saída de painéis.
metadata:
  { "opencraft": { "emoji": "🧵", "os": ["darwin", "linux"], "requires": { "bins": ["tmux"] } } }
---

# Controle de Sessão tmux

Controle sessões tmux enviando teclas e lendo a saída. Essencial para gerenciar sessões do Claude Code.

## Quando Usar

✅ **USE esta skill quando:**

- Monitorando sessões Claude/Codex no tmux
- Enviando input para aplicativos de terminal interativos
- Raspando saída de processos de longa duração no tmux
- Navegando painéis/janelas tmux programaticamente
- Verificando trabalho em background em sessões existentes

## Quando NÃO Usar

❌ **NÃO use esta skill quando:**

- Executando comandos shell pontuais → use ferramenta `exec` diretamente
- Iniciando novos processos em background → use `exec` com `background:true`
- Scripts não interativos → use ferramenta `exec`
- O processo não está no tmux
- Você precisa criar uma nova sessão tmux → use `exec` com `tmux new-session`

## Sessões de Exemplo

| Sessão                  | Propósito                      |
| ----------------------- | ------------------------------ |
| `shared`                | Sessão interativa principal    |
| `worker-2` - `worker-8` | Sessões de trabalho paralelas  |

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

# Todo o scrollback
tmux capture-pane -t shared -p -S -

# Painel específico na janela
tmux capture-pane -t shared:0.0 -p
```

### Enviar Teclas

```bash
# Enviar texto (não pressiona Enter)
tmux send-keys -t shared "olá"

# Enviar texto + Enter
tmux send-keys -t shared "s" Enter

# Enviar teclas especiais
tmux send-keys -t shared Enter
tmux send-keys -t shared Escape
tmux send-keys -t shared C-c          # Ctrl+C
tmux send-keys -t shared C-d          # Ctrl+D (EOF)
tmux send-keys -t shared C-z          # Ctrl+Z (suspender)
```

### Navegação de Janela/Painel

```bash
# Selecionar janela
tmux select-window -t shared:0

# Selecionar painel
tmux select-pane -t shared:0.1

# Listar janelas
tmux list-windows -t shared
```

### Gerenciamento de Sessão

```bash
# Criar nova sessão
tmux new-session -d -s novasessao

# Encerrar sessão
tmux kill-session -t nomedassessao

# Renomear sessão
tmux rename-session -t antiga nova
```

## Enviando Input com Segurança

Para TUIs interativos (Claude Code, Codex, etc.), divida texto e Enter em envios separados para evitar casos extremos de cola/multilinha:

```bash
tmux send-keys -t shared -l -- "Por favor aplique o patch em src/foo.ts"
sleep 0.1
tmux send-keys -t shared Enter
```

## Padrões de Sessão Claude Code

### Verificar se a Sessão Precisa de Input

```bash
# Procurar prompts
tmux capture-pane -t worker-3 -p | tail -10 | grep -E "❯|Yes.*No|proceed|permission"
```

### Aprovar Prompt do Claude Code

```bash
# Enviar 's' e Enter
tmux send-keys -t worker-3 's' Enter

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

### Enviar Tarefa para Sessão

```bash
tmux send-keys -t worker-4 "Corrija o bug em auth.js" Enter
```

## Notas

- Use `capture-pane -p` para imprimir no stdout (essencial para scripts)
- `-S -` captura todo o histórico de scrollback
- Formato de alvo: `session:window.pane` (ex: `shared:0.0`)
- Sessões persistem entre desconexões SSH
