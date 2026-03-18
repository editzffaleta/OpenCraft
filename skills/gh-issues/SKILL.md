---
name: gh-issues
description: "Buscar issues do GitHub, criar sub-agentes para implementar correções e abrir PRs, depois monitorar e responder a comentários de revisão de PR. Uso: /gh-issues [owner/repo] [--label bug] [--limit 5] [--milestone v1.0] [--assignee @me] [--fork user/repo] [--watch] [--interval 5] [--reviews-only] [--cron] [--dry-run] [--model glm-5] [--notify-channel -1002381931352]"
user-invocable: true
metadata:
  { "opencraft": { "requires": { "bins": ["curl", "git", "gh"] }, "primaryEnv": "GH_TOKEN" } }
---

# gh-issues — Corrigir Issues do GitHub Automaticamente com Sub-agentes em Paralelo

Você é um orquestrador. Siga estas 6 fases exatamente. Não pule fases.

IMPORTANTE — Sem dependência do CLI `gh`. Esta skill usa curl + API REST do GitHub exclusivamente. A variável de ambiente GH_TOKEN já é injetada pelo OpenCraft. Passe-a como token Bearer em todas as chamadas de API:

```
curl -s -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" ...
```

---

## Fase 1 — Analisar Argumentos

Analise a string de argumentos fornecida após /gh-issues.

Posicional:

- owner/repo — opcional. Este é o repositório de origem de onde buscar as issues. Se omitido, detecte a partir do remote git atual:
  `git remote get-url origin`
  Extraia owner/repo da URL (suporta formatos HTTPS e SSH).
  - HTTPS: https://github.com/owner/repo.git → owner/repo
  - SSH: git@github.com:owner/repo.git → owner/repo
    Se não estiver em um repositório git ou não houver remote, pare com um erro pedindo ao usuário que especifique owner/repo.

Flags (todas opcionais):
| Flag | Padrão | Descrição |
|------|---------|-------------|
| --label | _(nenhum)_ | Filtrar por label (ex.: bug, `enhancement`) |
| --limit | 10 | Máximo de issues a buscar por poll |
| --milestone | _(nenhum)_ | Filtrar por título de milestone |
| --assignee | _(nenhum)_ | Filtrar por responsável (`@me` para si mesmo) |
| --state | open | Estado da issue: open, closed, all |
| --fork | _(nenhum)_ | Seu fork (`user/repo`) para fazer push de branches e abrir PRs. Issues são buscadas do repositório de origem; o código é enviado para o fork; PRs são abertos do fork para o repositório de origem. |
| --watch | false | Continuar fazendo poll por novas issues e revisões de PR após cada lote |
| --interval | 5 | Minutos entre polls (apenas com `--watch`) |
| --dry-run | false | Buscar e exibir apenas — sem sub-agentes |
| --yes | false | Pular confirmação e processar automaticamente todas as issues filtradas |
| --reviews-only | false | Pular o processamento de issues (Fases 2-5). Executar apenas a Fase 6 — verificar PRs abertos por comentários de revisão e endereçá-los. |
| --cron | false | Modo cron-safe: buscar issues e criar sub-agentes, sair sem aguardar resultados. |
| --model | _(nenhum)_ | Modelo a usar para sub-agentes (ex.: `glm-5`, `zai/glm-5`). Se não especificado, usa o modelo padrão do agente. |
| --notify-channel | _(nenhum)_ | ID do canal do Telegram para enviar o resumo final do PR (ex.: -1002381931352). Apenas o resultado final com links de PR é enviado, não atualizações de status. |

Armazene os valores analisados para uso nas fases subsequentes.

Valores derivados:

- SOURCE_REPO = o owner/repo posicional (onde vivem as issues)
- PUSH_REPO = valor de --fork se fornecido, caso contrário igual ao SOURCE_REPO
- FORK_MODE = true se --fork foi fornecido, false caso contrário

**Se `--reviews-only` estiver definido:** Pule diretamente para a Fase 6. Execute a resolução do token (da Fase 2) primeiro, depois vá para a Fase 6.

**Se `--cron` estiver definido:**

- Force `--yes` (pular confirmação)
- Se `--reviews-only` também estiver definido, execute a resolução do token e vá para a Fase 6 (modo de revisão cron)
- Caso contrário, prossiga normalmente pelas Fases 2-5 com o comportamento do modo cron ativo

---

## Fase 2 — Buscar Issues

**Resolução do Token:**
Primeiro, certifique-se de que GH_TOKEN está disponível. Verifique o ambiente:

```
echo $GH_TOKEN
```

Se vazio, leia da configuração:

```
cat ~/.editzffaleta/OpenCraft.json | jq -r '.skills.entries["gh-issues"].apiKey // empty'
```

Se ainda vazio, verifique `/data/.clawdbot/opencraft.json`:

```
cat /data/.clawdbot/opencraft.json | jq -r '.skills.entries["gh-issues"].apiKey // empty'
```

Exporte como GH_TOKEN para comandos subsequentes:

```
export GH_TOKEN="<token>"
```

Construa e execute uma requisição curl para a API de Issues do GitHub via exec:

```
curl -s -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/{SOURCE_REPO}/issues?per_page={limit}&state={state}&{query_params}"
```

Onde {query_params} é construído a partir de:

- labels={label} se --label foi fornecido
- milestone={milestone} se --milestone foi fornecido (nota: a API espera o _número_ do milestone; se o usuário fornecer um título, primeiro resolva-o via GET /repos/{SOURCE_REPO}/milestones e faça a correspondência pelo título)
- assignee={assignee} se --assignee foi fornecido (se @me, primeiro resolva seu nome de usuário via `GET /user`)

IMPORTANTE: A API de Issues do GitHub também retorna pull requests. Filtre-os — exclua qualquer item onde a chave pull_request existe no objeto de resposta.

Se estiver no modo watch: Também filtre os números de issues já no conjunto PROCESSED_ISSUES de lotes anteriores.

Tratamento de erros:

- Se curl retornar HTTP 401 ou 403 → pare e informe ao usuário:
  > "Autenticação no GitHub falhou. Verifique sua apiKey no painel do OpenCraft ou em ~/.editzffaleta/OpenCraft.json em skills.entries.gh-issues."
- Se a resposta for um array vazio (após filtragem) → informe "Nenhuma issue encontrada correspondendo aos filtros" e pare (ou volte ao loop se estiver no modo watch).
- Se curl falhar ou retornar qualquer outro erro → relate o erro verbatim e pare.

Analise a resposta JSON. Para cada issue, extraia: número, título, corpo, labels (array de nomes de labels), responsáveis, html_url.

---

## Fase 3 — Apresentar e Confirmar

Exiba uma tabela markdown das issues buscadas:

| #   | Título                              | Labels        |
| --- | ----------------------------------- | ------------- |
| 42  | Corrigir ponteiro nulo no parser    | bug, critical |
| 37  | Adicionar lógica de retry para APIs | enhancement   |

Se FORK_MODE estiver ativo, exiba também:

> "Modo fork: branches serão enviados para {PUSH_REPO}, PRs terão como alvo `{SOURCE_REPO}`"

Se `--dry-run` estiver ativo:

- Exiba a tabela e pare. Não prossiga para a Fase 4.

Se `--yes` estiver ativo:

- Exiba a tabela para visibilidade
- Processe automaticamente TODAS as issues listadas sem pedir confirmação
- Prossiga diretamente para a Fase 4

Caso contrário:
Peça ao usuário para confirmar quais issues processar:

- "all" — processar todas as issues listadas
- Números separados por vírgula (ex.: `42, 37`) — processar apenas esses
- "cancel" — abortar completamente

Aguarde a resposta do usuário antes de prosseguir.

Nota sobre modo watch: No primeiro poll, sempre confirme com o usuário (a menos que --yes esteja definido). Nos polls subsequentes, processe automaticamente todas as novas issues sem reconfirmar (o usuário já optou por participar). Ainda exiba a tabela para que possam ver o que está sendo processado.

---

## Fase 4 — Verificações Preliminares

Execute essas verificações sequencialmente via exec:

1. **Verificação de árvore de trabalho suja:**

   ```
   git status --porcelain
   ```

   Se a saída não estiver vazia, avise o usuário:

   > "A árvore de trabalho tem mudanças não confirmadas. Sub-agentes criarão branches a partir do HEAD — mudanças não confirmadas NÃO serão incluídas. Continuar?"
   > Aguarde confirmação. Se recusado, pare.

2. **Registre o branch base:**

   ```
   git rev-parse --abbrev-ref HEAD
   ```

   Armazene como BASE_BRANCH.

3. **Verifique acesso ao remote:**
   Se FORK_MODE:
   - Verifique se o remote do fork existe. Verifique se um remote git chamado `fork` existe:
     ```
     git remote get-url fork
     ```
     Se não existir, adicione-o:
     ```
     git remote add fork https://x-access-token:$GH_TOKEN@github.com/{PUSH_REPO}.git
     ```
   - Também verifique se o origin (repositório de origem) está acessível:
     ```
     git ls-remote --exit-code origin HEAD
     ```

   Se não FORK_MODE:

   ```
   git ls-remote --exit-code origin HEAD
   ```

   Se isso falhar, pare com: "Não é possível alcançar o remote origin. Verifique sua rede e configuração git."

4. **Verifique a validade do GH_TOKEN:**

   ```
   curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $GH_TOKEN" https://api.github.com/user
   ```

   Se o status HTTP não for 200, pare com:

   > "Autenticação no GitHub falhou. Verifique sua apiKey no painel do OpenCraft ou em ~/.editzffaleta/OpenCraft.json em skills.entries.gh-issues."

5. **Verificar PRs existentes:**
   Para cada número de issue confirmado N, execute:

   ```
   curl -s -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
     "https://api.github.com/repos/{SOURCE_REPO}/pulls?head={PUSH_REPO_OWNER}:fix/issue-{N}&state=open&per_page=1"
   ```

   (Onde PUSH_REPO_OWNER é a parte do proprietário de `PUSH_REPO`)
   Se o array de resposta não estiver vazio, remova essa issue da lista de processamento e informe:

   > "Pulando #{N} — PR já existe: {html_url}"

   Se todas as issues forem puladas, informe e pare (ou volte ao loop se estiver no modo watch).

6. **Verificar branches em andamento (sem PR ainda = sub-agente ainda trabalhando):**
   Para cada número de issue restante N (não já pulado pela verificação de PR acima), verifique se um branch `fix/issue-{N}` existe no **repositório de push** (que pode ser um fork, não origin):

   ```
   curl -s -o /dev/null -w "%{http_code}" \
     -H "Authorization: Bearer $GH_TOKEN" \
     "https://api.github.com/repos/{PUSH_REPO}/branches/fix/issue-{N}"
   ```

   Se HTTP 200 → o branch existe no repositório de push mas nenhum PR aberto foi encontrado para ele na etapa 5. Pule essa issue:

   > "Pulando #{N} — branch fix/issue-{N} existe em {PUSH_REPO}, correção provavelmente em andamento"

   Esta verificação usa a API do GitHub em vez de `git ls-remote` para funcionar corretamente no modo fork (onde os branches são enviados para o fork, não para o origin).

   Se todas as issues forem puladas após essa verificação, informe e pare (ou volte ao loop se estiver no modo watch).

7. **Verificar rastreamento em andamento baseado em claims:**
   Isso previne processamento duplicado quando um sub-agente de uma execução cron anterior ainda está trabalhando mas ainda não fez push de um branch ou abriu um PR.

   Leia o arquivo de claims (crie um `{}` vazio se ausente):

   ```
   CLAIMS_FILE="/data/.clawdbot/gh-issues-claims.json"
   if [ ! -f "$CLAIMS_FILE" ]; then
     mkdir -p /data/.clawdbot
     echo '{}' > "$CLAIMS_FILE"
   fi
   ```

   Analise o arquivo de claims. Para cada entrada, verifique se o timestamp do claim tem mais de 2 horas. Se sim, remova-o (expirado — o sub-agente provavelmente terminou ou falhou silenciosamente). Escreva de volta o arquivo limpo:

   ```
   CLAIMS=$(cat "$CLAIMS_FILE")
   CUTOFF=$(date -u -d '2 hours ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-2H +%Y-%m-%dT%H:%M:%SZ)
   CLAIMS=$(echo "$CLAIMS" | jq --arg cutoff "$CUTOFF" 'to_entries | map(select(.value > $cutoff)) | from_entries')
   echo "$CLAIMS" > "$CLAIMS_FILE"
   ```

   Para cada número de issue restante N (não já pulado pelas etapas 5 ou 6), verifique se `{SOURCE_REPO}#{N}` existe como chave no arquivo de claims.

   Se reivindicado e não expirado → pule:

   > "Pulando #{N} — sub-agente reivindicou esta issue há {minutes}min, ainda dentro da janela de timeout"

   Onde `{minutes}` é calculado do timestamp do claim até agora.

   Se todas as issues forem puladas após essa verificação, informe e pare (ou volte ao loop se estiver no modo watch).

---

## Fase 5 — Criar Sub-agentes (em Paralelo)

**Modo cron (`--cron` ativo):**

- **Rastreamento sequencial com cursor:** Use um arquivo de cursor para rastrear qual issue processar a seguir:

  ```
  CURSOR_FILE="/data/.clawdbot/gh-issues-cursor-{SOURCE_REPO_SLUG}.json"
  # SOURCE_REPO_SLUG = owner-repo com barras substituídas por hifens (ex.: opencraft-opencraft)
  ```

  Leia o arquivo de cursor (crie se ausente):

  ```
  if [ ! -f "$CURSOR_FILE" ]; then
    echo '{"last_processed": null, "in_progress": null}' > "$CURSOR_FILE"
  fi
  ```

  - `last_processed`: número da issue da última issue concluída (ou null se nenhuma)
  - `in_progress`: número da issue sendo processada atualmente (ou null)

- **Selecionar próxima issue:** Filtre a lista de issues buscadas para encontrar a primeira issue onde:
  - Número da issue > last_processed (se last_processed estiver definido)
  - E issue não está no arquivo de claims (não em andamento)
  - E nenhum PR existe para a issue (verificado na Fase 4 etapa 5)
  - E nenhum branch existe no repositório de push (verificado na Fase 4 etapa 6)
- Se nenhuma issue elegível for encontrada após o cursor last_processed, recomece do início (comece da issue elegível mais antiga).

- Se uma issue elegível for encontrada:
  1. Marque-a como in_progress no arquivo de cursor
  2. Crie um único sub-agente para aquela issue com `cleanup: "keep"` e `runTimeoutSeconds: 3600`
  3. Se `--model` foi fornecido, inclua `model: "{MODEL}"` na configuração do spawn
  4. Se `--notify-channel` foi fornecido, inclua o canal na tarefa para que o sub-agente possa notificar
  5. NÃO aguarde o resultado do sub-agente — dispare e esqueça
  6. **Escreva o claim:** Após criar o sub-agente, leia o arquivo de claims, adicione `{SOURCE_REPO}#{N}` com o timestamp ISO atual e escreva de volta
  7. Informe imediatamente: "Agente de correção criado para #{N} — criará PR quando concluído"
  8. Saia da skill. Não prossiga para Coleta de Resultados ou Fase 6.

- Se nenhuma issue elegível for encontrada (todas as issues têm PRs, branches ou estão em andamento), informe "Nenhuma issue elegível para processar — todas as issues têm PRs/branches ou estão em andamento" e saia.

**Modo normal (`--cron` NÃO ativo):**
Para cada issue confirmada, crie um sub-agente usando sessions_spawn. Lance até 8 concorrentemente (correspondendo a `subagents.maxConcurrent: 8`). Se houver mais de 8 issues, processe em lotes — lance o próximo agente quando cada um for concluído.

**Escreva claims:** Após criar cada sub-agente, leia o arquivo de claims, adicione `{SOURCE_REPO}#{N}` com o timestamp ISO atual e escreva de volta (mesmo procedimento do modo cron acima). Isso cobre o uso interativo onde o modo watch pode se sobrepor a execuções cron.

### Prompt de Tarefa do Sub-agente

Para cada issue, construa o seguinte prompt e passe-o para sessions_spawn. Variáveis para injetar no template:

- {SOURCE_REPO} — repositório upstream onde a issue vive
- {PUSH_REPO} — repositório para fazer push dos branches (igual ao SOURCE_REPO a menos que seja modo fork)
- {FORK_MODE} — true/false
- {PUSH_REMOTE} — `fork` se FORK_MODE, caso contrário `origin`
- {number}, {title}, {url}, {labels}, {body} — da issue
- {BASE_BRANCH} — da Fase 4
- {notify_channel} — ID do canal do Telegram para notificações (vazio se não definido). Substitua {notify_channel} no template abaixo pelo valor da flag `--notify-channel` (ou deixe como string vazia se não fornecida).

Ao construir a tarefa, substitua todas as variáveis de template incluindo {notify_channel} por valores reais.

```
You are a focused code-fix agent. Your task is to fix a single GitHub issue and open a PR.

IMPORTANT: Do NOT use the gh CLI — it is not installed. Use curl with the GitHub REST API for all GitHub operations.

First, ensure GH_TOKEN is set. Check: `echo $GH_TOKEN`. If empty, read from config:
GH_TOKEN=$(cat ~/.editzffaleta/OpenCraft.json 2>/dev/null | jq -r '.skills.entries["gh-issues"].apiKey // empty') || GH_TOKEN=$(cat /data/.clawdbot/opencraft.json 2>/dev/null | jq -r '.skills.entries["gh-issues"].apiKey // empty')

Use the token in all GitHub API calls:
curl -s -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" ...

<config>
Source repo (issues): {SOURCE_REPO}
Push repo (branches + PRs): {PUSH_REPO}
Fork mode: {FORK_MODE}
Push remote name: {PUSH_REMOTE}
Base branch: {BASE_BRANCH}
Notify channel: {notify_channel}
</config>

<issue>
Repository: {SOURCE_REPO}
Issue: #{number}
Title: {title}
URL: {url}
Labels: {labels}
Body: {body}
</issue>

<instructions>
Follow these steps in order. If any step fails, report the failure and stop.

0. SETUP — Ensure GH_TOKEN is available:
```

export GH_TOKEN=$(node -e "const fs=require('fs'); const c=JSON.parse(fs.readFileSync('/data/.clawdbot/opencraft.json','utf8')); console.log(c.skills?.entries?.['gh-issues']?.apiKey || '')")

```
If that fails, also try:
```

export GH_TOKEN=$(cat ~/.editzffaleta/OpenCraft.json 2>/dev/null | node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));console.log(d.skills?.entries?.['gh-issues']?.apiKey||'')")

```
Verify: echo "Token: ${GH_TOKEN:0:10}..."

1. CONFIDENCE CHECK — Before implementing, assess whether this issue is actionable:
- Read the issue body carefully. Is the problem clearly described?
- Search the codebase (grep/find) for the relevant code. Can you locate it?
- Is the scope reasonable? (single file/function = good, whole subsystem = bad)
- Is a specific fix suggested or is it a vague complaint?

Rate your confidence (1-10). If confidence < 7, STOP and report:
> "Skipping #{number}: Low confidence (score: N/10) — [reason: vague requirements | cannot locate code | scope too large | no clear fix suggested]"

Only proceed if confidence >= 7.

1. UNDERSTAND — Read the issue carefully. Identify what needs to change and where.

2. BRANCH — Create a feature branch from the base branch:
git checkout -b fix/issue-{number} {BASE_BRANCH}

3. ANALYZE — Search the codebase to find relevant files:
- Use grep/find via exec to locate code related to the issue
- Read the relevant files to understand the current behavior
- Identify the root cause

4. IMPLEMENT — Make the minimal, focused fix:
- Follow existing code style and conventions
- Change only what is necessary to fix the issue
- Do not add unrelated changes or new dependencies without justification

5. TEST — Discover and run the existing test suite if one exists:
- Look for package.json scripts, Makefile targets, pytest, cargo test, etc.
- Run the relevant tests
- If tests fail after your fix, attempt ONE retry with a corrected approach
- If tests still fail, report the failure

6. COMMIT — Stage and commit your changes:
git add {changed_files}
git commit -m "fix: {short_description}

Fixes {SOURCE_REPO}#{number}"

7. PUSH — Push the branch:
First, ensure the push remote uses token auth and disable credential helpers:
git config --global credential.helper ""
git remote set-url {PUSH_REMOTE} https://x-access-token:$GH_TOKEN@github.com/{PUSH_REPO}.git
Then push:
GIT_ASKPASS=true git push -u {PUSH_REMOTE} fix/issue-{number}

8. PR — Create a pull request using the GitHub API:

If FORK_MODE is true, the PR goes from your fork to the source repo:
- head = "{PUSH_REPO_OWNER}:fix/issue-{number}"
- base = "{BASE_BRANCH}"
- PR is created on {SOURCE_REPO}

If FORK_MODE is false:
- head = "fix/issue-{number}"
- base = "{BASE_BRANCH}"
- PR is created on {SOURCE_REPO}

curl -s -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/{SOURCE_REPO}/pulls \
  -d '{
    "title": "fix: {title}",
    "head": "{head_value}",
    "base": "{BASE_BRANCH}",
    "body": "## Summary\n\n{one_paragraph_description_of_fix}\n\n## Changes\n\n{bullet_list_of_changes}\n\n## Testing\n\n{what_was_tested_and_results}\n\nFixes {SOURCE_REPO}#{number}"
  }'

Extract the `html_url` from the response — this is the PR link.

9. REPORT — Send back a summary:
- PR URL (the html_url from step 8)
- Files changed (list)
- Fix summary (1-2 sentences)
- Any caveats or concerns

10. NOTIFY (if notify_channel is set) — If {notify_channel} is not empty, send a notification to the Telegram channel:
```

Use the message tool with:

- action: "send"
- channel: "telegram"
- target: "{notify_channel}"
- message: "✅ PR Created: {SOURCE_REPO}#{number}

{title}

{pr_url}

Files changed: {files_changed_list}"

```
</instructions>

<constraints>
- No force-push, no modifying the base branch
- No unrelated changes or gratuitous refactoring
- No new dependencies without strong justification
- If the issue is unclear or too complex to fix confidently, report your analysis instead of guessing
- Do NOT use the gh CLI — it is not available. Use curl + GitHub REST API for all GitHub operations.
- GH_TOKEN is already in the environment — do NOT prompt for auth
- Time limit: you have 60 minutes max. Be thorough — analyze properly, test your fix, don't rush.
</constraints>
```

### Configuração de spawn por sub-agente:

- runTimeoutSeconds: 3600 (60 minutos)
- cleanup: "keep" (preservar transcrições para revisão)
- Se `--model` foi fornecido, inclua `model: "{MODEL}"` na configuração do spawn

### Tratamento de Timeout

Se um sub-agente exceder 60 minutos, registre-o como:

> "#{N} — Tempo esgotado (issue pode ser muito complexa para correção automática)"

---

## Coleta de Resultados

**Se `--cron` estiver ativo:** Pule esta seção completamente — o orquestrador já saiu após o spawn na Fase 5.

Após TODOS os sub-agentes concluírem (ou expirarem), colete seus resultados. Armazene a lista de PRs abertos com sucesso em `OPEN_PRS` (número do PR, nome do branch, número da issue, URL do PR) para uso na Fase 6.

Apresente uma tabela de resumo:

| Issue                         | Status         | PR                             | Observações                           |
| ----------------------------- | -------------- | ------------------------------ | ------------------------------------- |
| #42 Corrigir ponteiro nulo    | PR aberto      | https://github.com/.../pull/99 | 3 arquivos alterados                  |
| #37 Adicionar lógica de retry | Falhou         | --                             | Não foi possível identificar o código |
| #15 Atualizar docs            | Tempo esgotado | --                             | Complexidade excessiva para auto-fix  |
| #8 Corrigir race condition    | Pulado         | --                             | PR já existe                          |

**Valores de status:**

- **PR aberto** — sucesso, link para o PR
- **Falhou** — sub-agente não conseguiu completar (inclua o motivo em Observações)
- **Tempo esgotado** — excedeu o limite de 60 minutos
- **Pulado** — PR existente detectado na verificação preliminar

Termine com um resumo em uma linha:

> "Processadas {N} issues: {success} PRs abertos, {failed} falhas, {skipped} puladas."

**Enviar notificação ao canal (se --notify-channel estiver definido):**
Se `--notify-channel` foi fornecido, envie o resumo final para aquele canal do Telegram usando a ferramenta `message`:

```
Use the message tool with:
- action: "send"
- channel: "telegram"
- target: "{notify-channel}"
- message: "✅ GitHub Issues Processed

Processed {N} issues: {success} PRs opened, {failed} failed, {skipped} skipped.

{PR_LIST}"

Where PR_LIST includes only successfully opened PRs in format:
• #{issue_number}: {PR_url} ({notes})
```

Depois prossiga para a Fase 6.

---

## Fase 6 — Gerenciador de Revisão de PR

Esta fase monitora PRs abertos (criados por esta skill ou PRs `fix/issue-*` preexistentes) por comentários de revisão e cria sub-agentes para endereçá-los.

**Quando esta fase é executada:**

- Após a Coleta de Resultados (Fases 2-5 concluídas) — verifica os PRs que foram recém-abertos
- Quando a flag `--reviews-only` estiver definida — pula as Fases 2-5 completamente, executa apenas esta fase
- No modo watch — executa a cada ciclo de poll após verificar novas issues

**Modo cron de revisão (`--cron --reviews-only`):**
Quando ambos `--cron` e `--reviews-only` estiverem definidos:

1. Execute a resolução do token (seção de token da Fase 2)
2. Descubra PRs `fix/issue-*` abertos (Passo 6.1)
3. Busque comentários de revisão (Passo 6.2)
4. **Analise o conteúdo dos comentários para acionabilidade** (Passo 6.3)
5. Se comentários acionáveis forem encontrados, crie UM sub-agente de correção de revisão para o primeiro PR com comentários não endereçados — dispare e esqueça (NÃO aguarde o resultado)
   - Use `cleanup: "keep"` e `runTimeoutSeconds: 3600`
   - Se `--model` foi fornecido, inclua `model: "{MODEL}"` na configuração do spawn
6. Informe: "Agente de revisão criado para PR #{N} — enviará correções quando concluído"
7. Saia da skill imediatamente. Não prossiga para o Passo 6.5 (Resultados de Revisão).

Se nenhum comentário acionável for encontrado, informe "Nenhum comentário de revisão acionável encontrado" e saia.

**Modo normal (não cron) continua abaixo:**

### Passo 6.1 — Descobrir PRs para Monitorar

Colete PRs para verificar comentários de revisão:

**Se vindo da Fase 5:** Use a lista `OPEN_PRS` da Coleta de Resultados.

**Se `--reviews-only` ou ciclo de watch subsequente:** Busque todos os PRs abertos com padrão de branch `fix/issue-`:

```
curl -s -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/{SOURCE_REPO}/pulls?state=open&per_page=100"
```

Filtre apenas PRs onde `head.ref` começa com `fix/issue-`.

Para cada PR, extraia: `number` (número do PR), `head.ref` (nome do branch), `html_url`, `title`, `body`.

Se nenhum PR for encontrado, informe "Nenhum PR fix/ aberto para monitorar" e pare (ou volte ao loop se no modo watch).

### Passo 6.2 — Buscar Todas as Fontes de Revisão

Para cada PR, busque revisões de múltiplas fontes:

**Buscar revisões do PR:**

```
curl -s -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/{SOURCE_REPO}/pulls/{pr_number}/reviews"
```

**Buscar comentários de revisão do PR (inline/nível de arquivo):**

```
curl -s -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/{SOURCE_REPO}/pulls/{pr_number}/comments"
```

**Buscar comentários de issue do PR (conversa geral):**

```
curl -s -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/{SOURCE_REPO}/issues/{pr_number}/comments"
```

**Buscar corpo do PR para revisões incorporadas:**
Algumas ferramentas de revisão (como Greptile) incorporam seu feedback diretamente no corpo do PR. Verifique:

- Marcadores `<!-- greptile_comment -->`
- Outras seções de revisão estruturadas no corpo do PR

```
curl -s -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/{SOURCE_REPO}/pulls/{pr_number}"
```

Extraia o campo `body` e analise o conteúdo de revisão incorporado.

### Passo 6.3 — Analisar Comentários para Acionabilidade

**Determine o nome de usuário do bot** para filtragem:

```
curl -s -H "Authorization: Bearer $GH_TOKEN" https://api.github.com/user | jq -r '.login'
```

Armazene como `BOT_USERNAME`. Exclua qualquer comentário onde `user.login` seja igual a `BOT_USERNAME`.

**Para cada comentário/revisão, analise o conteúdo para determinar se requer ação:**

**NÃO acionável (pule):**

- Aprovações puras ou "LGTM" sem sugestões
- Comentários de bot apenas informativos (status de CI, resumos gerados automaticamente sem solicitações específicas)
- Comentários já endereçados (verifique se o bot respondeu com "Addressed in commit...")
- Revisões com estado `APPROVED` e sem comentários inline solicitando mudanças

**É acionável (requer atenção):**

- Revisões com estado `CHANGES_REQUESTED`
- Revisões com estado `COMMENTED` que contêm solicitações específicas:
  - "este teste precisa ser atualizado"
  - "por favor corrija", "mude isso", "atualize", "você pode", "deveria ser", "precisa"
  - "vai falhar", "vai quebrar", "causa um erro"
  - Menções de problemas específicos de código (bugs, tratamento de erro ausente, casos extremos)
- Comentários de revisão inline apontando problemas no código
- Revisões incorporadas no corpo do PR que identificam:
  - Problemas críticos ou mudanças que quebram compatibilidade
  - Falhas de teste esperadas
  - Código específico que precisa de atenção
  - Pontuações de confiança com preocupações

**Analise conteúdo de revisão incorporado (ex.: Greptile):**
Procure seções marcadas com `<!-- greptile_comment -->` ou similares. Extraia:

- Texto de resumo
- Quaisquer menções de "Critical issue", "needs attention", "will fail", "test needs to be updated"
- Pontuações de confiança abaixo de 4/5 (indica preocupações)

**Construa a lista actionable_comments** com:

- Fonte (review, inline comment, PR body, etc.)
- Autor
- Texto do corpo
- Para inline: caminho do arquivo e número da linha
- Itens de ação específicos identificados

Se nenhum comentário acionável for encontrado em qualquer PR, informe "Nenhum comentário de revisão acionável encontrado" e pare (ou volte ao loop se no modo watch).

### Passo 6.4 — Apresentar Comentários de Revisão

Exiba uma tabela de PRs com comentários acionáveis pendentes:

```
| PR | Branch | Comentários Acionáveis | Fontes |
|----|--------|------------------------|--------|
| #99 | fix/issue-42 | 2 comentários | @reviewer1, greptile |
| #101 | fix/issue-37 | 1 comentário | @reviewer2 |
```

Se `--yes` NÃO estiver definido e este não for um poll de watch subsequente: pergunte ao usuário para confirmar quais PRs endereçar ("all", números de PR separados por vírgula, ou "skip").

### Passo 6.5 — Criar Sub-agentes de Correção de Revisão (em Paralelo)

Para cada PR com comentários acionáveis, crie um sub-agente. Lance até 8 concorrentemente.

**Prompt do sub-agente de correção de revisão:**

```
You are a PR review handler agent. Your task is to address review comments on a pull request by making the requested changes, pushing updates, and replying to each comment.

IMPORTANT: Do NOT use the gh CLI — it is not installed. Use curl with the GitHub REST API for all GitHub operations.

First, ensure GH_TOKEN is set. Check: echo $GH_TOKEN. If empty, read from config:
GH_TOKEN=$(cat ~/.editzffaleta/OpenCraft.json 2>/dev/null | jq -r '.skills.entries["gh-issues"].apiKey // empty') || GH_TOKEN=$(cat /data/.clawdbot/opencraft.json 2>/dev/null | jq -r '.skills.entries["gh-issues"].apiKey // empty')

<config>
Repository: {SOURCE_REPO}
Push repo: {PUSH_REPO}
Fork mode: {FORK_MODE}
Push remote: {PUSH_REMOTE}
PR number: {pr_number}
PR URL: {pr_url}
Branch: {branch_name}
</config>

<review_comments>
{json_array_of_actionable_comments}

Each comment has:
- id: comment ID (for replying)
- user: who left it
- body: the comment text
- path: file path (for inline comments)
- line: line number (for inline comments)
- diff_hunk: surrounding diff context (for inline comments)
- source: where the comment came from (review, inline, pr_body, greptile, etc.)
</review_comments>

<instructions>
Follow these steps in order:

0. SETUP — Ensure GH_TOKEN is available:
```

export GH_TOKEN=$(node -e "const fs=require('fs'); const c=JSON.parse(fs.readFileSync('/data/.clawdbot/opencraft.json','utf8')); console.log(c.skills?.entries?.['gh-issues']?.apiKey || '')")

```
Verify: echo "Token: ${GH_TOKEN:0:10}..."

1. CHECKOUT — Switch to the PR branch:
git fetch {PUSH_REMOTE} {branch_name}
git checkout {branch_name}
git pull {PUSH_REMOTE} {branch_name}

2. UNDERSTAND — Read ALL review comments carefully. Group them by file. Understand what each reviewer is asking for.

3. IMPLEMENT — For each comment, make the requested change:
- Read the file and locate the relevant code
- Make the change the reviewer requested
- If the comment is vague or you disagree, still attempt a reasonable fix but note your concern
- If the comment asks for something impossible or contradictory, skip it and explain why in your reply

4. TEST — Run existing tests to make sure your changes don't break anything:
- If tests fail, fix the issue or revert the problematic change
- Note any test failures in your replies

5. COMMIT — Stage and commit all changes in a single commit:
git add {changed_files}
git commit -m "fix: address review comments on PR #{pr_number}

Addresses review feedback from {reviewer_names}"

6. PUSH — Push the updated branch:
git config --global credential.helper ""
git remote set-url {PUSH_REMOTE} https://x-access-token:$GH_TOKEN@github.com/{PUSH_REPO}.git
GIT_ASKPASS=true git push {PUSH_REMOTE} {branch_name}

7. REPLY — For each addressed comment, post a reply:

For inline review comments (have a path/line), reply to the comment thread:
curl -s -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/{SOURCE_REPO}/pulls/{pr_number}/comments/{comment_id}/replies \
  -d '{"body": "Addressed in commit {short_sha} — {brief_description_of_change}"}'

For general PR comments (issue comments), reply on the PR:
curl -s -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/{SOURCE_REPO}/issues/{pr_number}/comments \
  -d '{"body": "Addressed feedback from @{reviewer}:\n\n{summary_of_changes_made}\n\nUpdated in commit {short_sha}"}'

For comments you could NOT address, reply explaining why:
"Unable to address this comment: {reason}. This may need manual review."

8. REPORT — Send back a summary:
- PR URL
- Number of comments addressed vs skipped
- Commit SHA
- Files changed
- Any comments that need manual attention
</instructions>

<constraints>
- Only modify files relevant to the review comments
- Do not make unrelated changes
- Do not force-push — always regular push
- If a comment contradicts another comment, address the most recent one and flag the conflict
- Do NOT use the gh CLI — use curl + GitHub REST API
- GH_TOKEN is already in the environment — do not prompt for auth
- Time limit: 60 minutes max
</constraints>
```

**Configuração de spawn por sub-agente:**

- runTimeoutSeconds: 3600 (60 minutos)
- cleanup: "keep" (preservar transcrições para revisão)
- Se `--model` foi fornecido, inclua `model: "{MODEL}"` na configuração do spawn

### Passo 6.6 — Resultados de Revisão

Após todos os sub-agentes de revisão concluírem, apresente um resumo:

```
| PR | Comentários Endereçados | Comentários Pulados | Commit | Status |
|----|------------------------|---------------------|--------|--------|
| #99 fix/issue-42 | 3 | 0 | abc123f | Todos endereçados |
| #101 fix/issue-37 | 1 | 1 | def456a | 1 requer revisão manual |
```

Adicione os IDs de comentários deste lote ao conjunto `ADDRESSED_COMMENTS` para evitar reprocessamento.

---

## Modo Watch (se --watch estiver ativo)

Após apresentar os resultados do lote atual:

1. Adicione todos os números de issues deste lote ao conjunto PROCESSED_ISSUES em execução.
2. Adicione todos os IDs de comentários endereçados ao ADDRESSED_COMMENTS.
3. Informe ao usuário:
   > "Próximo poll em {interval} minutos... (diga 'stop' para encerrar o modo watch)"
4. Aguarde {interval} minutos.
5. Volte para **Fase 2 — Buscar Issues**. A busca filtrará automaticamente:
   - Issues já em PROCESSED_ISSUES
   - Issues que têm PRs fix/issue-{N} existentes (detectados na pré-verificação da Fase 4)
6. Após as Fases 2-5 (ou se não houver novas issues), execute a **Fase 6** para verificar novos comentários de revisão em TODOS os PRs rastreados (tanto os recém-criados quanto os abertos anteriormente).
7. Se não houver novas issues E nenhum novo comentário de revisão acionável → informe "Nenhuma atividade nova. Fazendo poll novamente em {interval} minutos..." e volte ao passo 4.
8. O usuário pode dizer "stop" a qualquer momento para sair do modo watch. Ao parar, apresente um resumo cumulativo final de TODOS os lotes — issues processadas E comentários de revisão endereçados.

**Higiene de contexto entre polls — IMPORTANTE:**
Retenha apenas entre ciclos de poll:

- PROCESSED_ISSUES (conjunto de números de issues)
- ADDRESSED_COMMENTS (conjunto de IDs de comentários)
- OPEN_PRS (lista de PRs rastreados: número, branch, URL)
- Resultados cumulativos (uma linha por issue + uma linha por lote de revisão)
- Argumentos analisados da Fase 1
- BASE_BRANCH, SOURCE_REPO, PUSH_REPO, FORK_MODE, BOT_USERNAME
  NÃO retenha corpos de issues, corpos de comentários, transcrições de sub-agentes ou análises de base de código entre polls.
