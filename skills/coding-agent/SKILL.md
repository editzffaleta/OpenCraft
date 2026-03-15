---
name: coding-agent
description: 'Delega tarefas de codificação para Codex, Claude Code ou agentes Pi via processo em background. Use quando: (1) construir/criar novas funcionalidades ou apps, (2) revisar PRs (execute em dir temporário), (3) refatorar bases de código grandes, (4) codificação iterativa que precisa de exploração de arquivos. NÃO para: correções simples de uma linha (apenas edite), leitura de código (use ferramenta read), solicitações ACP thread-bound no chat (ex: execute Codex ou Claude Code em thread Discord; use sessions_spawn com runtime:"acp"), ou qualquer trabalho no workspace ~/opencraft (nunca execute agentes aqui). Claude Code: use --print --permission-mode bypassPermissions (sem PTY). Codex/Pi/OpenCode: pty:true obrigatório.'
metadata:
  {
    "opencraft": { "emoji": "🧩", "requires": { "anyBins": ["claude", "codex", "opencode", "pi"] } },
  }
---

# Agente de Codificação (bash-first)

Use **bash** (com modo background opcional) para todo trabalho de agente de codificação. Simples e eficaz.

## ⚠️ Modo PTY: Codex/Pi/OpenCode sim, Claude Code não

Para **Codex, Pi e OpenCode**, PTY ainda é necessário (apps de terminal interativos):

```bash
# ✅ Correto para Codex/Pi/OpenCode
bash pty:true command:"codex exec 'Seu prompt'"
```

Para **Claude Code** (CLI `claude`), use `--print --permission-mode bypassPermissions` em vez disso.
`--dangerously-skip-permissions` com PTY pode sair após a caixa de diálogo de confirmação.
O modo `--print` mantém acesso total às ferramentas e evita confirmação interativa:

```bash
# ✅ Correto para Claude Code (sem PTY necessário)
cd /caminho/para/projeto && claude --permission-mode bypassPermissions --print 'Sua tarefa'

# Para execução em background: use background:true na ferramenta exec

# ❌ Errado para Claude Code
bash pty:true command:"claude --dangerously-skip-permissions 'tarefa'"
```

### Parâmetros da Ferramenta Bash

| Parâmetro    | Tipo    | Descrição                                                                       |
| ------------ | ------- | ------------------------------------------------------------------------------- |
| `command`    | string  | O comando shell a executar                                                      |
| `pty`        | boolean | **Use para agentes de codificação!** Aloca um pseudo-terminal para CLIs interativos |
| `workdir`    | string  | Diretório de trabalho (agente vê apenas o contexto desta pasta)                |
| `background` | boolean | Executa em background, retorna sessionId para monitoramento                    |
| `timeout`    | number  | Timeout em segundos (mata o processo ao expirar)                               |
| `elevated`   | boolean | Executa no host em vez do sandbox (se permitido)                               |

### Ações da Ferramenta Process (para sessões em background)

| Ação        | Descrição                                              |
| ----------- | ------------------------------------------------------ |
| `list`      | Listar todas as sessões em execução/recentes           |
| `poll`      | Verificar se a sessão ainda está em execução           |
| `log`       | Obter saída da sessão (com offset/limit opcional)      |
| `write`     | Enviar dados brutos para stdin                         |
| `submit`    | Enviar dados + newline (como digitar e pressionar Enter)|
| `send-keys` | Enviar tokens de tecla ou bytes hex                    |
| `paste`     | Colar texto (com modo entre colchetes opcional)        |
| `kill`      | Encerrar a sessão                                      |

---

## Início Rápido: Tarefas Únicas

Para prompts/chats rápidos, crie um repo git temporário e execute:

```bash
# Chat rápido (Codex precisa de um repo git!)
SCRATCH=$(mktemp -d) && cd $SCRATCH && git init && codex exec "Seu prompt aqui"

# Ou em um projeto real - com PTY!
bash pty:true workdir:~/Projetos/meuprojeto command:"codex exec 'Adicione tratamento de erros nas chamadas de API'"
```

**Por que git init?** O Codex se recusa a executar fora de um diretório git confiável. Criar um repo temporário resolve isso para trabalho scratch.

---

## O Padrão: workdir + background + pty

Para tarefas mais longas, use o modo background com PTY:

```bash
# Iniciar agente no diretório alvo (com PTY!)
bash pty:true workdir:~/projeto background:true command:"codex exec --full-auto 'Construa um jogo da cobra'"
# Retorna sessionId para rastreamento

# Monitorar progresso
process action:log sessionId:XXX

# Verificar se terminou
process action:poll sessionId:XXX

# Enviar entrada (se o agente fizer uma pergunta)
process action:write sessionId:XXX data:"s"

# Submeter com Enter (como digitar "sim" e pressionar Enter)
process action:submit sessionId:XXX data:"sim"

# Matar se necessário
process action:kill sessionId:XXX
```

**Por que workdir importa:** O agente acorda em um diretório focado, não vagueia lendo arquivos não relacionados.

---

## CLI Codex

**Modelo:** `gpt-5.2-codex` é o padrão (definido em ~/.codex/config.toml)

### Flags

| Flag            | Efeito                                              |
| --------------- | --------------------------------------------------- |
| `exec "prompt"` | Execução única, sai quando termina                  |
| `--full-auto`   | Sandboxed mas auto-aprova no workspace              |
| `--yolo`        | SEM sandbox, SEM aprovações (mais rápido, mais arriscado) |

### Construindo/Criando

```bash
# Rápido único (auto-aprova) - lembre-se do PTY!
bash pty:true workdir:~/projeto command:"codex exec --full-auto 'Construa um toggle de modo escuro'"

# Background para trabalho mais longo
bash pty:true workdir:~/projeto background:true command:"codex --yolo 'Refatore o módulo de auth'"
```

### Revisando PRs

**⚠️ CRÍTICO: Nunca revise PRs na pasta do próprio projeto do OpenCraft!**
Clone para pasta temporária ou use git worktree.

```bash
# Clonar para temporário para revisão segura
REVIEW_DIR=$(mktemp -d)
git clone https://github.com/usuario/repo.git $REVIEW_DIR
cd $REVIEW_DIR && gh pr checkout 130
bash pty:true workdir:$REVIEW_DIR command:"codex review --base origin/main"
# Limpar depois: trash $REVIEW_DIR

# Ou use git worktree (mantém main intacto)
git worktree add /tmp/pr-130-revisao branch-pr-130
bash pty:true workdir:/tmp/pr-130-revisao command:"codex review --base main"
```

### Revisões em Lote de PR (exército paralelo!)

```bash
# Buscar todas as refs de PR primeiro
git fetch origin '+refs/pull/*/head:refs/remotes/origin/pr/*'

# Implantar o exército - um Codex por PR (todos com PTY!)
bash pty:true workdir:~/projeto background:true command:"codex exec 'Revisar PR #86. git diff origin/main...origin/pr/86'"
bash pty:true workdir:~/projeto background:true command:"codex exec 'Revisar PR #87. git diff origin/main...origin/pr/87'"

# Monitorar todos
process action:list

# Publicar resultados no GitHub
gh pr comment <PR#> --body "<conteúdo da revisão>"
```

---

## Claude Code

```bash
# Primeiro plano
bash workdir:~/projeto command:"claude --permission-mode bypassPermissions --print 'Sua tarefa'"

# Background
bash workdir:~/projeto background:true command:"claude --permission-mode bypassPermissions --print 'Sua tarefa'"
```

---

## OpenCode

```bash
bash pty:true workdir:~/projeto command:"opencode run 'Sua tarefa'"
```

---

## Agente Pi de Codificação

```bash
# Instalar: npm install -g @mariozechner/pi-coding-agent
bash pty:true workdir:~/projeto command:"pi 'Sua tarefa'"

# Modo não-interativo (PTY ainda recomendado)
bash pty:true command:"pi -p 'Resumir src/'"

# Provedor/modelo diferente
bash pty:true command:"pi --provider openai --model gpt-4o-mini -p 'Sua tarefa'"
```

---

## Correção Paralela de Issues com git worktrees

Para corrigir múltiplas issues em paralelo, use git worktrees:

```bash
# 1. Criar worktrees para cada issue
git worktree add -b fix/issue-78 /tmp/issue-78 main
git worktree add -b fix/issue-99 /tmp/issue-99 main

# 2. Lançar Codex em cada (background + PTY!)
bash pty:true workdir:/tmp/issue-78 background:true command:"pnpm install && codex --yolo 'Corrigir issue #78: <descrição>. Commitar e fazer push.'"
bash pty:true workdir:/tmp/issue-99 background:true command:"pnpm install && codex --yolo 'Corrigir issue #99 do resumo aprovado do ticket. Implementar apenas as edições no escopo e commitar após revisão.'"

# 3. Monitorar progresso
process action:list
process action:log sessionId:XXX

# 4. Criar PRs após as correções
cd /tmp/issue-78 && git push -u origin fix/issue-78
gh pr create --repo usuario/repo --head fix/issue-78 --title "fix: ..." --body "..."

# 5. Limpeza
git worktree remove /tmp/issue-78
git worktree remove /tmp/issue-99
```

---

## ⚠️ Regras

1. **Use o modo de execução certo por agente**:
   - Codex/Pi/OpenCode: `pty:true`
   - Claude Code: `--print --permission-mode bypassPermissions` (sem PTY necessário)
2. **Respeite a escolha de ferramenta** — se o usuário pedir Codex, use Codex.
   - Modo orquestrador: NÃO corrija patches você mesmo.
   - Se um agente falhar/travar, relance-o ou pergunte ao usuário a direção, mas não assuma silenciosamente.
3. **Seja paciente** — não mate sessões porque estão "lentas"
4. **Monitore com process:log** — verifique o progresso sem interferir
5. **--full-auto para construção** — auto-aprova mudanças
6. **vanilla para revisão** — sem flags especiais necessárias
7. **Paralelo é OK** — execute muitos processos Codex de uma vez para trabalho em lote
8. **NUNCA inicie Codex em ~/.opencraft/** — ele vai ler seus docs e ter ideias estranhas!
9. **NUNCA faça checkout de branches em ~/Projetos/opencraft/** — essa é a instância LIVE do OpenCraft!

---

## Atualizações de Progresso (Crítico)

Quando você executa agentes de codificação em background, mantenha o usuário informado.

- Envie 1 mensagem curta quando começar (o que está rodando + onde).
- Atualize novamente apenas quando algo mudar:
  - um marco é concluído (build finalizado, testes passaram)
  - o agente faz uma pergunta / precisa de entrada
  - você encontra um erro ou precisa da ação do usuário
  - o agente termina (inclua o que mudou + onde)
- Se você matar uma sessão, diga imediatamente que matou e por quê.

Isso evita que o usuário veja apenas "Agente falhou antes da resposta" sem saber o que aconteceu.

---

## Auto-Notificar ao Concluir

Para tarefas longas em background, acrescente um gatilho de wake ao seu prompt para que o OpenCraft seja notificado imediatamente quando o agente terminar:

```
... sua tarefa aqui.

Quando completamente terminado, execute este comando para me notificar:
opencraft system event --text "Concluído: [breve resumo do que foi construído]" --mode now
```

**Exemplo:**

```bash
bash pty:true workdir:~/projeto background:true command:"codex --yolo exec 'Construa uma API REST para todos.

Quando completamente terminado, execute: opencraft system event --text \"Concluído: API REST de todos construída com endpoints CRUD\" --mode now'"
```

Isso dispara um evento de wake imediato — o assistente é notificado em segundos, não em 10 minutos.
