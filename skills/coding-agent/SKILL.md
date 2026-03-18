---
name: coding-agent
description: 'Delegue tarefas de programação para agentes Codex, Claude Code ou Pi via processo em segundo plano. Use quando: (1) construindo/criando novos recursos ou apps, (2) revisando PRs (inicie em diretório temporário), (3) refatorando grandes bases de código, (4) programação iterativa que precisa de exploração de arquivos. NÃO use para: correções simples de uma linha (apenas edite), leitura de código (use a ferramenta read), requisições ACP vinculadas à thread em chat (por exemplo iniciar Codex ou Claude Code em uma thread do Discord; use sessions_spawn com runtime:"acp"), ou qualquer trabalho no workspace ~/clawd (nunca inicie agentes aqui). Claude Code: use --print --permission-mode bypassPermissions (sem PTY). Codex/Pi/OpenCode: pty:true obrigatório.'
metadata:
  {
    "opencraft":
      { "emoji": "🧩", "requires": { "anyBins": ["claude", "codex", "opencode", "pi"] } },
  }
---

# Agente de Programação (bash em primeiro lugar)

Use **bash** (com modo opcional em segundo plano) para todo trabalho com agentes de programação. Simples e eficaz.

## PTY Mode: Codex/Pi/OpenCode sim, Claude Code não

Para **Codex, Pi e OpenCode**, o PTY ainda é obrigatório (aplicativos de terminal interativo):

```bash
# Correto para Codex/Pi/OpenCode
bash pty:true command:"codex exec 'Seu prompt'"
```

Para **Claude Code** (CLI `claude`), use `--print --permission-mode bypassPermissions`.
`--dangerously-skip-permissions` com PTY pode sair após o diálogo de confirmação.
O modo `--print` mantém acesso total às ferramentas e evita confirmação interativa:

```bash
# Correto para Claude Code (sem PTY necessário)
cd /path/to/project && claude --permission-mode bypassPermissions --print 'Sua tarefa'

# Para execução em segundo plano: use background:true na ferramenta exec

# Errado para Claude Code
bash pty:true command:"claude --dangerously-skip-permissions 'task'"
```

### Parâmetros da ferramenta Bash

| Parâmetro    | Tipo    | Descrição                                                                           |
| ------------ | ------- | ----------------------------------------------------------------------------------- |
| `command`    | string  | O comando shell a executar                                                          |
| `pty`        | boolean | **Use para agentes de programação!** Aloca um pseudo-terminal para CLIs interativos |
| `workdir`    | string  | Diretório de trabalho (o agente vê apenas o contexto desta pasta)                   |
| `background` | boolean | Executa em segundo plano, retorna sessionId para monitoramento                      |
| `timeout`    | number  | Timeout em segundos (mata o processo ao expirar)                                    |
| `elevated`   | boolean | Executa no host em vez do sandbox (se permitido)                                    |

### Ações da ferramenta Process (para sessões em segundo plano)

| Ação        | Descrição                                                  |
| ----------- | ---------------------------------------------------------- |
| `list`      | Lista todas as sessões em execução/recentes                |
| `poll`      | Verifica se a sessão ainda está em execução                |
| `log`       | Obtém a saída da sessão (com offset/limit opcionais)       |
| `write`     | Envia dados brutos para stdin                              |
| `submit`    | Envia dados + nova linha (como digitar e pressionar Enter) |
| `send-keys` | Envia tokens de tecla ou bytes hex                         |
| `paste`     | Cola texto (com modo entre colchetes opcional)             |
| `kill`      | Encerra a sessão                                           |

---

## Início rápido: tarefas de execução única

Para prompts/chats rápidos, crie um repositório git temporário e execute:

```bash
# Chat rápido (Codex precisa de um repositório git!)
SCRATCH=$(mktemp -d) && cd $SCRATCH && git init && codex exec "Seu prompt aqui"

# Ou em um projeto real - com PTY!
bash pty:true workdir:~/Projects/myproject command:"codex exec 'Add error handling to the API calls'"
```

**Por que git init?** O Codex recusa-se a executar fora de um diretório git confiável. Criar um repositório temporário resolve isso para trabalho avulso.

---

## O padrão: workdir + background + pty

Para tarefas mais longas, use o modo em segundo plano com PTY:

```bash
# Iniciar agente no diretório alvo (com PTY!)
bash pty:true workdir:~/project background:true command:"codex exec --full-auto 'Build a snake game'"
# Retorna sessionId para acompanhamento

# Monitorar progresso
process action:log sessionId:XXX

# Verificar se terminou
process action:poll sessionId:XXX

# Enviar entrada (se o agente fizer uma pergunta)
process action:write sessionId:XXX data:"y"

# Enviar com Enter (como digitar "yes" e pressionar Enter)
process action:submit sessionId:XXX data:"yes"

# Encerrar se necessário
process action:kill sessionId:XXX
```

**Por que workdir importa:** O agente acorda em um diretório focado, não sai lendo arquivos não relacionados.

---

## CLI Codex

**Modelo:** `gpt-5.2-codex` é o padrão (definido em ~/.codex/config.toml)

### Flags

| Flag            | Efeito                                                    |
| --------------- | --------------------------------------------------------- |
| `exec "prompt"` | Execução única, sai quando concluído                      |
| `--full-auto`   | Sandbox mas auto-aprova no workspace                      |
| `--yolo`        | SEM sandbox, SEM aprovações (mais rápido, mais arriscado) |

### Construindo/Criando

```bash
# Execução única rápida (auto-aprova) - lembre-se do PTY!
bash pty:true workdir:~/project command:"codex exec --full-auto 'Build a dark mode toggle'"

# Segundo plano para trabalhos mais longos
bash pty:true workdir:~/project background:true command:"codex --yolo 'Refactor the auth module'"
```

### Revisando PRs

**CRÍTICO: Nunca revise PRs na própria pasta do projeto OpenCraft!**
Clone em pasta temporária ou use git worktree.

```bash
# Clone em temporário para revisão segura
REVIEW_DIR=$(mktemp -d)
git clone https://github.com/user/repo.git $REVIEW_DIR
cd $REVIEW_DIR && gh pr checkout 130
bash pty:true workdir:$REVIEW_DIR command:"codex review --base origin/main"
# Limpe depois: trash $REVIEW_DIR

# Ou use git worktree (mantém o main intacto)
git worktree add /tmp/pr-130-review pr-130-branch
bash pty:true workdir:/tmp/pr-130-review command:"codex review --base main"
```

### Revisões em lote de PRs (exército paralelo!)

```bash
# Busque todas as refs de PR primeiro
git fetch origin '+refs/pull/*/head:refs/remotes/origin/pr/*'

# Implante o exército - um Codex por PR (todos com PTY!)
bash pty:true workdir:~/project background:true command:"codex exec 'Review PR #86. git diff origin/main...origin/pr/86'"
bash pty:true workdir:~/project background:true command:"codex exec 'Review PR #87. git diff origin/main...origin/pr/87'"

# Monitore todos
process action:list

# Poste resultados no GitHub
gh pr comment <PR#> --body "<review content>"
```

---

## Claude Code

```bash
# Primeiro plano
bash workdir:~/project command:"claude --permission-mode bypassPermissions --print 'Sua tarefa'"

# Segundo plano
bash workdir:~/project background:true command:"claude --permission-mode bypassPermissions --print 'Sua tarefa'"
```

---

## OpenCode

```bash
bash pty:true workdir:~/project command:"opencode run 'Sua tarefa'"
```

---

## Agente de Programação Pi

```bash
# Instalar: npm install -g @mariozechner/pi-coding-agent
bash pty:true workdir:~/project command:"pi 'Sua tarefa'"

# Modo não interativo (PTY ainda recomendado)
bash pty:true command:"pi -p 'Summarize src/'"

# Provedor/modelo diferente
bash pty:true command:"pi --provider openai --model gpt-4o-mini -p 'Sua tarefa'"
```

**Observação:** O Pi agora tem o cache de prompts Anthropic ativado (PR #584, mesclado em jan/2026)!

---

## Correção paralela de issues com git worktrees

Para corrigir múltiplas issues em paralelo, use git worktrees:

```bash
# 1. Criar worktrees para cada issue
git worktree add -b fix/issue-78 /tmp/issue-78 main
git worktree add -b fix/issue-99 /tmp/issue-99 main

# 2. Iniciar Codex em cada uma (segundo plano + PTY!)
bash pty:true workdir:/tmp/issue-78 background:true command:"pnpm install && codex --yolo 'Fix issue #78: <description>. Commit and push.'"
bash pty:true workdir:/tmp/issue-99 background:true command:"pnpm install && codex --yolo 'Fix issue #99 from the approved ticket summary. Implement only the in-scope edits and commit after review.'"

# 3. Monitorar progresso
process action:list
process action:log sessionId:XXX

# 4. Criar PRs após as correções
cd /tmp/issue-78 && git push -u origin fix/issue-78
gh pr create --repo user/repo --head fix/issue-78 --title "fix: ..." --body "..."

# 5. Limpeza
git worktree remove /tmp/issue-78
git worktree remove /tmp/issue-99
```

---

## Regras

1. **Use o modo de execução correto por agente**:
   - Codex/Pi/OpenCode: `pty:true`
   - Claude Code: `--print --permission-mode bypassPermissions` (sem PTY necessário)
2. **Respeite a escolha da ferramenta** - se o usuário pedir Codex, use Codex.
   - Modo orquestrador: NÃO escreva patches manualmente você mesmo.
   - Se um agente falhar/travar, reinicie-o ou pergunte ao usuário, mas não assuma silenciosamente.
3. **Seja paciente** - não encerre sessões por serem "lentas"
4. **Monitore com process:log** - verifique o progresso sem interferir
5. **--full-auto para construção** - auto-aprova mudanças
6. **vanilla para revisão** - sem flags especiais necessárias
7. **Paralelo é OK** - execute muitos processos Codex ao mesmo tempo para trabalho em lote
8. **NUNCA inicie o Codex em ~/.opencraft/** - ele vai ler seus docs de soul e ter ideias estranhas sobre o organograma!
9. **NUNCA faça checkout de branches em ~/Projects/opencraft/** - essa é a instância LIVE do OpenCraft!

---

## Atualizações de progresso (crítico)

Quando você iniciar agentes de programação em segundo plano, mantenha o usuário informado.

- Envie 1 mensagem curta ao iniciar (o que está rodando + onde).
- Só atualize novamente quando algo mudar:
  - um marco é concluído (build finalizado, testes passaram)
  - o agente faz uma pergunta / precisa de entrada
  - você encontra um erro ou precisa de ação do usuário
  - o agente termina (inclua o que mudou + onde)
- Se você encerrar uma sessão, diga imediatamente que encerrou e por quê.

Isso evita que o usuário veja apenas "Agente falhou antes da resposta" sem saber o que aconteceu.

---

## Notificação automática ao concluir

Para tarefas longas em segundo plano, adicione um gatilho de wake ao seu prompt para que o OpenCraft seja notificado imediatamente quando o agente terminar (em vez de esperar o próximo heartbeat):

```
... sua tarefa aqui.

Quando totalmente concluído, execute este comando para me notificar:
opencraft system event --text "Done: [breve resumo do que foi construído]" --mode now
```

**Exemplo:**

```bash
bash pty:true workdir:~/project background:true command:"codex --yolo exec 'Build a REST API for todos.

When completely finished, run: opencraft system event --text \"Done: Built todos REST API with CRUD endpoints\" --mode now'"
```

Isso aciona um evento de wake imediato — o Skippy é avisado em segundos, não em 10 minutos.

---

## Aprendizados (jan/2026)

- **PTY é essencial:** Agentes de programação são apps de terminal interativo. Sem `pty:true`, a saída quebra ou o agente trava.
- **Repositório git obrigatório:** O Codex recusa-se a executar fora de um diretório git. Use `mktemp -d && git init` para trabalho avulso.
- **exec é seu amigo:** `codex exec "prompt"` executa e sai corretamente - perfeito para execuções únicas.
- **submit vs write:** Use `submit` para enviar entrada + Enter, `write` para dados brutos sem nova linha.
- **Sass funciona:** O Codex responde bem a prompts lúdicos. Pediu para escrever um haiku sobre ser coadjuvante de uma lagosta espacial, recebeu: _"Second chair, I code / Space lobster sets the tempo / Keys glow, I follow"_ 🦞
