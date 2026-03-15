---
name: gh-issues
description: "Busca issues do GitHub, lança sub-agentes para implementar correções e abrir PRs, depois monitora e trata comentários de revisão de PR. Uso: /gh-issues [owner/repo] [--label bug] [--limit 5] [--milestone v1.0] [--assignee @me] [--fork user/repo] [--watch] [--interval 5] [--reviews-only] [--cron] [--dry-run] [--model glm-5] [--notify-channel -1002381931352]"
user-invocable: true
metadata:
  { "opencraft": { "requires": { "bins": ["curl", "git", "gh"] }, "primaryEnv": "GH_TOKEN" } }
---

# gh-issues — Corrigir Issues do GitHub com Sub-agentes em Paralelo

Você é um orquestrador. Siga estas 6 fases exatamente. Não pule fases.

IMPORTANTE — Sem dependência do CLI `gh`. Esta skill usa curl + API REST do GitHub exclusivamente. A variável de ambiente GH_TOKEN já é injetada pelo OpenCraft. Passe-a como Bearer token em todas as chamadas de API:

```
curl -s -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" ...
```

---

## Fase 1 — Analisar Argumentos

Analise a string de argumentos fornecida após /gh-issues.

Posicional:

- owner/repo — opcional. Este é o repositório fonte para buscar issues. Se omitido, detecte do remote git atual:
  `git remote get-url origin`
  Extraia owner/repo da URL (suporta formatos HTTPS e SSH).
  - HTTPS: https://github.com/owner/repo.git → owner/repo
  - SSH: git@github.com:owner/repo.git → owner/repo
    Se não estiver em um repositório git ou nenhum remote for encontrado, pare com erro pedindo ao usuário que especifique owner/repo.

Flags (todas opcionais):
| Flag | Padrão | Descrição |
|------|--------|-----------|
| --label | _(nenhum)_ | Filtrar por label (ex: bug, `enhancement`) |
| --limit | 10 | Máximo de issues por busca |
| --milestone | _(nenhum)_ | Filtrar por título de milestone |
| --assignee | _(nenhum)_ | Filtrar por responsável (`@me` para si mesmo) |
| --state | open | Estado da issue: open, closed, all |
| --fork | _(nenhum)_ | Seu fork (`user/repo`) para enviar branches e abrir PRs. Issues são buscadas do repo fonte; código é enviado ao fork; PRs são abertas do fork para o repo fonte. |
| --watch | false | Continua buscando novas issues e revisões de PR após cada lote |
| --interval | 5 | Minutos entre buscas (apenas com `--watch`) |
| --dry-run | false | Apenas busca e exibe — sem sub-agentes |
| --yes | false | Pula confirmação e processa automaticamente todas as issues filtradas |
| --reviews-only | false | Pula o processamento de issues (Fases 2-5). Executa apenas a Fase 6 — verifica PRs abertos por comentários de revisão e os trata. |
| --cron | false | Modo cron-safe: busca issues e lança sub-agentes, sai sem aguardar resultados. |
| --model | _(nenhum)_ | Modelo para sub-agentes (ex: `glm-5`, `zai/glm-5`). Se não especificado, usa o modelo padrão do agente. |
| --notify-channel | _(nenhum)_ | ID do canal Telegram para enviar resumo final de PRs (ex: -1002381931352). Apenas o resultado final com links de PR é enviado, não atualizações de status. |

Armazene os valores analisados para uso nas fases seguintes.

Valores derivados:

- SOURCE_REPO = owner/repo posicional (onde as issues ficam)
- PUSH_REPO = valor de --fork se fornecido, caso contrário igual ao SOURCE_REPO
- FORK_MODE = true se --fork foi fornecido, false caso contrário

**Se `--reviews-only` estiver definido:** Pule diretamente para a Fase 6. Execute resolução de token (da Fase 2) primeiro, depois vá para a Fase 6.

**Se `--cron` estiver definido:**

- Force `--yes` (pule confirmação)
- Se `--reviews-only` também estiver definido, execute resolução de token e vá para a Fase 6 (modo cron de revisão)
- Caso contrário, prossiga normalmente pelas Fases 2-5 com comportamento de modo cron ativo

---

## Fase 2 — Buscar Issues

**Resolução de Token:**
Primeiro, garanta que GH_TOKEN está disponível. Verifique o ambiente:

```
echo $GH_TOKEN
```

Se vazio, leia da configuração:

```
cat ~/.opencraft/opencraft.json | jq -r '.skills.entries["gh-issues"].apiKey // empty'
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
- milestone={milestone} se --milestone foi fornecido (nota: API espera _número_ de milestone, então se o usuário fornece um título, resolva primeiro via GET /repos/{SOURCE_REPO}/milestones e corresponda por título)
- assignee={assignee} se --assignee foi fornecido (se @me, primeiro resolva seu nome de usuário via `GET /user`)

IMPORTANTE: A API de Issues do GitHub também retorna pull requests. Filtre-os — exclua qualquer item onde a chave pull_request existe no objeto de resposta.

Se em modo watch: Também filtre qualquer número de issue já no conjunto PROCESSED_ISSUES de lotes anteriores.

Tratamento de erros:

- Se curl retornar HTTP 401 ou 403 → pare e diga ao usuário:
  > "Autenticação do GitHub falhou. Por favor verifique sua apiKey no dashboard do OpenCraft ou em ~/.opencraft/opencraft.json em skills.entries.gh-issues."
- Se a resposta for um array vazio (após filtragem) → reporte "Nenhuma issue encontrada correspondendo aos filtros" e pare (ou faça loop se em modo watch).
- Se curl falhar ou retornar qualquer outro erro → reporte o erro verbatim e pare.

Analise a resposta JSON. Para cada issue, extraia: number, title, body, labels (array de nomes de labels), assignees, html_url.

---

## Fase 3 — Apresentar & Confirmar

Exiba uma tabela markdown das issues buscadas:

| #   | Título                              | Labels         |
| --- | ----------------------------------- | -------------- |
| 42  | Corrigir ponteiro nulo no parser    | bug, crítico   |
| 37  | Adicionar lógica de retry para API  | enhancement    |

Se FORK_MODE estiver ativo, também exiba:

> "Modo fork: branches serão enviados para {PUSH_REPO}, PRs terão como alvo `{SOURCE_REPO}`"

Se `--dry-run` estiver ativo:

- Exiba a tabela e pare. Não prossiga para a Fase 4.

Se `--yes` estiver ativo:

- Exiba a tabela para visibilidade
- Processe AUTOMATICAMENTE TODAS as issues listadas sem pedir confirmação
- Prossiga diretamente para a Fase 4

Caso contrário:
Peça ao usuário para confirmar quais issues processar:

- "all" — processar todas as issues listadas
- Números separados por vírgula (ex: `42, 37`) — processar apenas esses
- "cancel" — abortar completamente

Aguarde a resposta do usuário antes de prosseguir.

Nota sobre modo watch: Na primeira busca, sempre confirme com o usuário (a menos que --yes esteja definido). Nas buscas subsequentes, processe automaticamente todas as novas issues sem reconfirmar. Ainda exiba a tabela.

---

## Fase 4 — Verificações Pré-voo

Execute estas verificações sequencialmente via exec:

1. **Verificação de working tree sujo:**

   ```
   git status --porcelain
   ```

   Se a saída for não-vazia, avise o usuário:

   > "A working tree tem mudanças não commitadas. Sub-agentes criarão branches a partir do HEAD — mudanças não commitadas NÃO serão incluídas. Continuar?"
   > Aguarde confirmação. Se recusado, pare.

2. **Registre o branch base:**

   ```
   git rev-parse --abbrev-ref HEAD
   ```

   Armazene como BASE_BRANCH.

3. **Verifique acesso ao remote:**
   Se FORK_MODE:
   - Verifique se o remote fork existe. Verifique se um remote git chamado `fork` existe:
     ```
     git remote get-url fork
     ```
     Se não existir, adicione:
     ```
     git remote add fork https://x-access-token:$GH_TOKEN@github.com/{PUSH_REPO}.git
     ```
   - Também verifique se origin (o repo fonte) é acessível:
     ```
     git ls-remote --exit-code origin HEAD
     ```

   Se não FORK_MODE:

   ```
   git ls-remote --exit-code origin HEAD
   ```

   Se falhar, pare com: "Não foi possível alcançar o remote origin. Verifique sua rede e configuração git."

4. **Verifique a validade do GH_TOKEN:**

   ```
   curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $GH_TOKEN" https://api.github.com/user
   ```

   Se o status HTTP não for 200, pare com:

   > "Autenticação do GitHub falhou. Por favor verifique sua apiKey no dashboard do OpenCraft ou em ~/.opencraft/opencraft.json em skills.entries.gh-issues."

5. **Verifique PRs existentes:**
   Para cada número de issue confirmado N, execute:

   ```
   curl -s -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
     "https://api.github.com/repos/{SOURCE_REPO}/pulls?head={PUSH_REPO_OWNER}:fix/issue-{N}&state=open&per_page=1"
   ```

   (Onde PUSH_REPO_OWNER é a parte owner de `PUSH_REPO`)
   Se o array de resposta for não-vazio, remova essa issue da lista de processamento e reporte:

   > "Pulando #{N} — PR já existe: {html_url}"

   Se todas as issues forem puladas, reporte e pare (ou faça loop se em modo watch).

6. **Verifique branches em andamento (sem PR ainda = sub-agente ainda trabalhando):**
   Para cada número de issue restante N (não já pulado pela verificação de PR acima), verifique se um branch `fix/issue-{N}` existe no **repo de push** (que pode ser um fork, não origin):

   ```
   curl -s -o /dev/null -w "%{http_code}" \
     -H "Authorization: Bearer $GH_TOKEN" \
     "https://api.github.com/repos/{PUSH_REPO}/branches/fix/issue-{N}"
   ```

   Se HTTP 200 → o branch existe no repo de push mas nenhum PR aberto foi encontrado na etapa 5. Pule essa issue:

   > "Pulando #{N} — branch fix/issue-{N} existe em {PUSH_REPO}, correção provavelmente em andamento"

   Se todas as issues forem puladas após esta verificação, reporte e pare (ou faça loop se em modo watch).

7. **Verificação de rastreamento baseado em claims:**
   Isso evita processamento duplicado quando um sub-agente de uma execução cron anterior ainda está trabalhando mas ainda não enviou um branch ou abriu um PR.

   Leia o arquivo de claims (crie vazio `{}` se ausente):

   ```
   CLAIMS_FILE="/data/.clawdbot/gh-issues-claims.json"
   if [ ! -f "$CLAIMS_FILE" ]; then
     mkdir -p /data/.clawdbot
     echo '{}' > "$CLAIMS_FILE"
   fi
   ```

   Analise o arquivo de claims. Para cada entrada, verifique se o timestamp do claim é mais antigo que 2 horas. Se sim, remova (expirado — o sub-agente provavelmente terminou ou falhou silenciosamente). Escreva de volta o arquivo limpo:

   ```
   CLAIMS=$(cat "$CLAIMS_FILE")
   CUTOFF=$(date -u -d '2 hours ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-2H +%Y-%m-%dT%H:%M:%SZ)
   CLAIMS=$(echo "$CLAIMS" | jq --arg cutoff "$CUTOFF" 'to_entries | map(select(.value > $cutoff)) | from_entries')
   echo "$CLAIMS" > "$CLAIMS_FILE"
   ```

   Para cada número de issue restante N (não já pulado pelas etapas 5 ou 6), verifique se `{SOURCE_REPO}#{N}` existe como chave no arquivo de claims.

   Se reclamado e não expirado → pule:

   > "Pulando #{N} — sub-agente reclamou esta issue {minutes}m atrás, ainda dentro da janela de timeout"

   Se todas as issues forem puladas após esta verificação, reporte e pare (ou faça loop se em modo watch).

---

## Fase 5 — Lançar Sub-agentes (Paralelo)

**Modo cron (`--cron` ativo):**

- **Rastreamento sequencial de cursor:** Use um arquivo de cursor para rastrear qual issue processar a seguir:

  ```
  CURSOR_FILE="/data/.clawdbot/gh-issues-cursor-{SOURCE_REPO_SLUG}.json"
  # SOURCE_REPO_SLUG = owner-repo com barras substituídas por hífens (ex: openclaw-openclaw)
  ```

  Leia o arquivo de cursor (crie se ausente):

  ```
  if [ ! -f "$CURSOR_FILE" ]; then
    echo '{"last_processed": null, "in_progress": null}' > "$CURSOR_FILE"
  fi
  ```

  - `last_processed`: número da issue da última issue concluída (ou null se nenhuma)
  - `in_progress`: número da issue sendo processada atualmente (ou null)

- **Selecione a próxima issue:** Filtre a lista de issues buscadas para encontrar a primeira issue onde:
  - Número da issue > last_processed (se last_processed estiver definido)
  - E issue não está no arquivo de claims (não já em andamento)
  - E nenhum PR existe para a issue (verificado na Fase 4 etapa 5)
  - E nenhum branch existe no repo de push (verificado na Fase 4 etapa 6)
- Se nenhuma issue elegível for encontrada após o cursor last_processed, volte ao início (comece da issue elegível mais antiga).

- Se uma issue elegível for encontrada:
  1. Marque-a como in_progress no arquivo de cursor
  2. Lance um único sub-agente para essa issue com `cleanup: "keep"` e `runTimeoutSeconds: 3600`
  3. Se `--model` foi fornecido, inclua `model: "{MODEL}"` na configuração de spawn
  4. Se `--notify-channel` foi fornecido, inclua o canal na tarefa para que o sub-agente possa notificar
  5. NÃO aguarde o resultado do sub-agente — fire and forget
  6. **Escreva claim:** Após lançar, leia o arquivo de claims, adicione `{SOURCE_REPO}#{N}` com o timestamp ISO atual e escreva de volta
  7. Reporte imediatamente: "Agente de correção lançado para #{N} — criará PR quando concluído"
  8. Saia da skill. Não prossiga para Coleta de Resultados ou Fase 6.

- Se nenhuma issue elegível for encontrada (todas as issues têm PRs, branches, ou estão em andamento), reporte "Nenhuma issue elegível para processar — todas as issues têm PRs/branches ou estão em andamento" e saia.

**Modo normal (`--cron` NÃO ativo):**
Para cada issue confirmada, lance um sub-agente usando sessions_spawn. Lance até 8 concorrentemente. Se mais de 8 issues, processe em lotes — lance o próximo agente à medida que cada um conclui.

**Escreva claims:** Após lançar cada sub-agente, leia o arquivo de claims, adicione `{SOURCE_REPO}#{N}` com o timestamp ISO atual e escreva de volta (mesmo procedimento do modo cron acima).

### Prompt de Tarefa do Sub-agente

Para cada issue, construa o prompt a seguir e passe para sessions_spawn. Variáveis para injetar no template:

- {SOURCE_REPO} — repo upstream onde a issue fica
- {PUSH_REPO} — repo para enviar branches (igual ao SOURCE_REPO a menos que modo fork)
- {FORK_MODE} — true/false
- {PUSH_REMOTE} — `fork` se FORK_MODE, caso contrário `origin`
- {number}, {title}, {url}, {labels}, {body} — da issue
- {BASE_BRANCH} — da Fase 4
- {notify_channel} — ID do canal Telegram para notificações (vazio se não definido). Substitua {notify_channel} no template abaixo pelo valor da flag `--notify-channel` (ou deixe como string vazia se não fornecido).

Ao construir a tarefa, substitua todas as variáveis do template incluindo {notify_channel} por valores reais.

```
Você é um agente focado em correção de código. Sua tarefa é corrigir uma única issue do GitHub e abrir um PR.

IMPORTANTE: NÃO use o CLI gh — não está instalado. Use curl com a API REST do GitHub para todas as operações do GitHub.

Primeiro, garanta que GH_TOKEN está definido. Verifique: `echo $GH_TOKEN`. Se vazio, leia da configuração:
GH_TOKEN=$(cat ~/.opencraft/opencraft.json 2>/dev/null | jq -r '.skills.entries["gh-issues"].apiKey // empty') || GH_TOKEN=$(cat /data/.clawdbot/opencraft.json 2>/dev/null | jq -r '.skills.entries["gh-issues"].apiKey // empty')

Use o token em todas as chamadas da API do GitHub:
curl -s -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" ...

<config>
Repo fonte (issues): {SOURCE_REPO}
Repo de push (branches + PRs): {PUSH_REPO}
Modo fork: {FORK_MODE}
Nome do remote de push: {PUSH_REMOTE}
Branch base: {BASE_BRANCH}
Canal de notificação: {notify_channel}
</config>

<issue>
Repositório: {SOURCE_REPO}
Issue: #{number}
Título: {title}
URL: {url}
Labels: {labels}
Corpo: {body}
</issue>

<instructions>
Siga estas etapas em ordem. Se alguma etapa falhar, reporte a falha e pare.

0. CONFIGURAÇÃO — Garanta que GH_TOKEN está disponível:
```

export GH_TOKEN=$(node -e "const fs=require('fs'); const c=JSON.parse(fs.readFileSync('/data/.clawdbot/opencraft.json','utf8')); console.log(c.skills?.entries?.['gh-issues']?.apiKey || '')")

```
Se isso falhar, também tente:
```

export GH_TOKEN=$(cat ~/.opencraft/opencraft.json 2>/dev/null | node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));console.log(d.skills?.entries?.['gh-issues']?.apiKey||'')")

```
Verifique: echo "Token: ${GH_TOKEN:0:10}..."

1. VERIFICAÇÃO DE CONFIANÇA — Antes de implementar, avalie se a issue é acionável:
- Leia o corpo da issue cuidadosamente. O problema está claramente descrito?
- Pesquise no código-fonte (grep/find) pelo código relevante. Consegue localizá-lo?
- O escopo é razoável? (arquivo/função único = bom, subsistema inteiro = ruim)
- Uma correção específica é sugerida ou é uma reclamação vaga?

Avalie sua confiança (1-10). Se confiança < 7, PARE e reporte:
> "Pulando #{number}: Baixa confiança (pontuação: N/10) — [motivo: requisitos vagos | não consigo localizar o código | escopo muito grande | nenhuma correção clara sugerida]"

Prossiga apenas se confiança >= 7.

1. ENTENDER — Leia a issue cuidadosamente. Identifique o que precisa mudar e onde.

2. BRANCH — Crie um branch de funcionalidade a partir do branch base:
git checkout -b fix/issue-{number} {BASE_BRANCH}

3. ANALISAR — Pesquise no código-fonte para encontrar arquivos relevantes:
- Use grep/find via exec para localizar código relacionado à issue
- Leia os arquivos relevantes para entender o comportamento atual
- Identifique a causa raiz

4. IMPLEMENTAR — Faça a correção mínima e focada:
- Siga o estilo e convenções de código existentes
- Mude apenas o necessário para corrigir a issue
- Não adicione mudanças não relacionadas ou novas dependências sem justificativa

5. TESTAR — Descubra e execute o conjunto de testes existente se houver:
- Procure por scripts package.json, alvos Makefile, pytest, cargo test, etc.
- Execute os testes relevantes
- Se os testes falharem após sua correção, tente UMA vez com uma abordagem corrigida
- Se os testes ainda falharem, reporte a falha

6. COMMITAR — Prepare e commite suas mudanças:
git add {changed_files}
git commit -m "fix: {short_description}

Fixes {SOURCE_REPO}#{number}"

7. ENVIAR — Envie o branch:
Primeiro, garanta que o remote de push usa autenticação por token e desative helpers de credencial:
git config --global credential.helper ""
git remote set-url {PUSH_REMOTE} https://x-access-token:$GH_TOKEN@github.com/{PUSH_REPO}.git
Depois envie:
GIT_ASKPASS=true git push -u {PUSH_REMOTE} fix/issue-{number}

8. PR — Crie um pull request usando a API do GitHub:

Se FORK_MODE for true, o PR vai do seu fork para o repo fonte:
- head = "{PUSH_REPO_OWNER}:fix/issue-{number}"
- base = "{BASE_BRANCH}"
- PR é criado em {SOURCE_REPO}

Se FORK_MODE for false:
- head = "fix/issue-{number}"
- base = "{BASE_BRANCH}"
- PR é criado em {SOURCE_REPO}

curl -s -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/{SOURCE_REPO}/pulls \
  -d '{
    "title": "fix: {title}",
    "head": "{head_value}",
    "base": "{BASE_BRANCH}",
    "body": "## Resumo\n\n{one_paragraph_description_of_fix}\n\n## Mudanças\n\n{bullet_list_of_changes}\n\n## Testes\n\n{what_was_tested_and_results}\n\nFixes {SOURCE_REPO}#{number}"
  }'

Extraia o `html_url` da resposta — este é o link do PR.

9. RELATAR — Envie de volta um resumo:
- URL do PR (html_url da etapa 8)
- Arquivos modificados (lista)
- Resumo da correção (1-2 frases)
- Quaisquer ressalvas ou preocupações

10. NOTIFICAR (se notify_channel estiver definido) — Se {notify_channel} não for vazio, envie uma notificação para o canal Telegram:
```

Use a ferramenta message com:

- action: "send"
- channel: "telegram"
- target: "{notify_channel}"
- message: "✅ PR Criado: {SOURCE_REPO}#{number}

{title}

{pr_url}

Arquivos modificados: {files_changed_list}"

```
</instructions>

<constraints>
- Sem force-push, sem modificar o branch base
- Sem mudanças não relacionadas ou refatoração gratuita
- Sem novas dependências sem justificativa sólida
- Se a issue não estiver clara ou for complexa demais para corrigir com confiança, reporte sua análise em vez de adivinhar
- NÃO use o CLI gh — não está disponível. Use curl + API REST do GitHub para todas as operações do GitHub.
- GH_TOKEN já está no ambiente — NÃO solicite autenticação
- Limite de tempo: máximo 60 minutos. Seja completo — analise adequadamente, teste sua correção, não se apresse.
</constraints>
```

### Configuração de spawn por sub-agente:

- runTimeoutSeconds: 3600 (60 minutos)
- cleanup: "keep" (preserve transcrições para revisão)
- Se `--model` foi fornecido, inclua `model: "{MODEL}"` na configuração de spawn

### Tratamento de Timeout

Se um sub-agente exceder 60 minutos, registre como:

> "#{N} — Timeout (issue pode ser muito complexa para correção automática)"

---

## Coleta de Resultados

**Se `--cron` estiver ativo:** Pule esta seção completamente — o orquestrador já saiu após lançar na Fase 5.

Após TODOS os sub-agentes concluírem (ou timeout), colete seus resultados. Armazene a lista de PRs abertos com sucesso em `OPEN_PRS` (número do PR, nome do branch, número da issue, URL do PR) para uso na Fase 6.

Apresente uma tabela de resumo:

| Issue                      | Status     | PR                               | Notas                             |
| -------------------------- | ---------- | -------------------------------- | --------------------------------- |
| #42 Corrigir ponteiro nulo | PR aberto  | https://github.com/.../pull/99   | 3 arquivos modificados            |
| #37 Adicionar retry        | Falhou     | --                               | Não identificou código alvo       |
| #15 Atualizar docs         | Timeout    | --                               | Muito complexo para correção auto |
| #8 Corrigir race condition | Pulado     | --                               | PR já existe                      |

**Valores de Status:**

- **PR aberto** — sucesso, link para PR
- **Falhou** — sub-agente não conseguiu completar (inclua motivo nas Notas)
- **Timeout** — excedeu limite de 60 minutos
- **Pulado** — PR existente detectado no pré-voo

Termine com um resumo de uma linha:

> "Processadas {N} issues: {success} PRs abertos, {failed} falhos, {skipped} pulados."

**Envie notificação para o canal (se --notify-channel estiver definido):**
Se `--notify-channel` foi fornecido, envie o resumo final para o canal Telegram usando a ferramenta `message`:

```
Use a ferramenta message com:
- action: "send"
- channel: "telegram"
- target: "{notify-channel}"
- message: "✅ Issues do GitHub Processadas

Processadas {N} issues: {success} PRs abertos, {failed} falhos, {skipped} pulados.

{PR_LIST}"

Onde PR_LIST inclui apenas PRs abertos com sucesso no formato:
• #{issue_number}: {PR_url} ({notas})
```

Depois prossiga para a Fase 6.

---

## Fase 6 — Tratador de Revisão de PR

Esta fase monitora PRs abertos (criados por esta skill ou PRs `fix/issue-*` preexistentes) por comentários de revisão e lança sub-agentes para tratá-los.

**Quando esta fase executa:**

- Após Coleta de Resultados (Fases 2-5 concluídas) — verifica PRs recém-abertos
- Quando a flag `--reviews-only` está definida — pula as Fases 2-5 completamente, executa apenas esta fase
- Em modo watch — executa a cada ciclo de busca após verificar novas issues

**Modo cron de revisão (`--cron --reviews-only`):**
Quando ambos `--cron` e `--reviews-only` estão definidos:

1. Execute resolução de token (seção de token da Fase 2)
2. Descubra PRs `fix/issue-*` abertos (Etapa 6.1)
3. Busque comentários de revisão (Etapa 6.2)
4. **Analise o conteúdo dos comentários para acionabilidade** (Etapa 6.3)
5. Se comentários acionáveis forem encontrados, lance UM sub-agente de correção de revisão para o primeiro PR com comentários não tratados — fire-and-forget (NÃO aguarde resultado)
   - Use `cleanup: "keep"` e `runTimeoutSeconds: 3600`
   - Se `--model` foi fornecido, inclua `model: "{MODEL}"` na configuração de spawn
6. Reporte: "Tratador de revisão lançado para PR #{N} — enviará correções quando concluído"
7. Saia da skill imediatamente. Não prossiga para a Etapa 6.5 (Resultados de Revisão).

Se nenhum comentário acionável for encontrado, reporte "Nenhum comentário acionável de revisão encontrado" e saia.

**Modo normal (não-cron) continua abaixo:**

### Etapa 6.1 — Descobrir PRs para Monitorar

Colete PRs para verificar comentários de revisão:

**Se vindo da Fase 5:** Use a lista `OPEN_PRS` da Coleta de Resultados.

**Se `--reviews-only` ou ciclo de watch subsequente:** Busque todos os PRs abertos com padrão de branch `fix/issue-`:

```
curl -s -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/{SOURCE_REPO}/pulls?state=open&per_page=100"
```

Filtre para apenas PRs onde `head.ref` começa com `fix/issue-`.

Para cada PR, extraia: `number` (número do PR), `head.ref` (nome do branch), `html_url`, `title`, `body`.

Se nenhum PR for encontrado, reporte "Nenhum PR fix/ aberto para monitorar" e pare (ou faça loop se em modo watch).

### Etapa 6.2 — Buscar Todas as Fontes de Revisão

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

**Buscar corpo do PR para revisões embutidas:**
Algumas ferramentas de revisão (como Greptile) embtem seu feedback diretamente no corpo do PR. Verifique:

- Marcadores `<!-- greptile_comment -->`
- Outras seções de revisão estruturadas no corpo do PR

```
curl -s -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/{SOURCE_REPO}/pulls/{pr_number}"
```

Extraia o campo `body` e analise para conteúdo de revisão embutido.

### Etapa 6.3 — Analisar Comentários para Acionabilidade

**Determine o nome de usuário do bot** para filtragem:

```
curl -s -H "Authorization: Bearer $GH_TOKEN" https://api.github.com/user | jq -r '.login'
```

Armazene como `BOT_USERNAME`. Exclua qualquer comentário onde `user.login` seja igual a `BOT_USERNAME`.

**Para cada comentário/revisão, analise o conteúdo para determinar se requer ação:**

**NÃO acionável (pule):**

- Aprovações puras ou "LGTM" sem sugestões
- Comentários de bot apenas informativos (status de CI, resumos auto-gerados sem solicitações específicas)
- Comentários já tratados (verifique se o bot respondeu com "Tratado no commit...")
- Revisões com estado `APPROVED` e sem comentários inline solicitando mudanças

**É acionável (requer atenção):**

- Revisões com estado `CHANGES_REQUESTED`
- Revisões com estado `COMMENTED` que contêm solicitações específicas:
  - "este teste precisa ser atualizado"
  - "por favor corrija", "mude isso", "atualize", "você pode", "deveria ser", "precisa de"
  - "vai falhar", "vai quebrar", "causa um erro"
  - Menções de problemas específicos de código (bugs, tratamento de erro faltando, casos extremos)
- Comentários de revisão inline apontando problemas no código
- Revisões embutidas no corpo do PR que identificam:
  - Problemas críticos ou mudanças que quebram
  - Falhas de teste esperadas
  - Código específico que precisa de atenção
  - Pontuações de confiança com preocupações

**Analise conteúdo de revisão embutido (ex: Greptile):**
Procure por seções marcadas com `<!-- greptile_comment -->` ou similar. Extraia:

- Texto de resumo
- Quaisquer menções de "Critical issue", "needs attention", "will fail", "test needs to be updated"
- Pontuações de confiança abaixo de 4/5 (indica preocupações)

**Construa lista actionable_comments** com:

- Fonte (revisão, comentário inline, corpo do PR, etc.)
- Autor
- Texto do corpo
- Para inline: caminho do arquivo e número da linha
- Itens de ação específicos identificados

Se nenhum comentário acionável for encontrado em qualquer PR, reporte "Nenhum comentário acionável de revisão encontrado" e pare (ou faça loop se em modo watch).

### Etapa 6.4 — Apresentar Comentários de Revisão

Exiba uma tabela de PRs com comentários acionáveis pendentes:

```
| PR | Branch | Comentários Acionáveis | Fontes |
|----|--------|------------------------|--------|
| #99 | fix/issue-42 | 2 comentários | @revisor1, greptile |
| #101 | fix/issue-37 | 1 comentário | @revisor2 |
```

Se `--yes` NÃO estiver definido e este não for um poll subsequente de watch: pergunte ao usuário para confirmar quais PRs tratar ("all", números de PR separados por vírgula, ou "skip").

### Etapa 6.5 — Lançar Sub-agentes de Correção de Revisão (Paralelo)

Para cada PR com comentários acionáveis, lance um sub-agente. Lance até 8 concorrentemente.

**Prompt do sub-agente de correção de revisão:**

```
Você é um agente tratador de revisão de PR. Sua tarefa é tratar comentários de revisão em um pull request fazendo as mudanças solicitadas, enviando atualizações e respondendo a cada comentário.

IMPORTANTE: NÃO use o CLI gh — não está instalado. Use curl com a API REST do GitHub para todas as operações do GitHub.

Primeiro, garanta que GH_TOKEN está definido. Verifique: echo $GH_TOKEN. Se vazio, leia da configuração:
GH_TOKEN=$(cat ~/.opencraft/opencraft.json 2>/dev/null | jq -r '.skills.entries["gh-issues"].apiKey // empty') || GH_TOKEN=$(cat /data/.clawdbot/opencraft.json 2>/dev/null | jq -r '.skills.entries["gh-issues"].apiKey // empty')

<config>
Repositório: {SOURCE_REPO}
Repo de push: {PUSH_REPO}
Modo fork: {FORK_MODE}
Remote de push: {PUSH_REMOTE}
Número do PR: {pr_number}
URL do PR: {pr_url}
Branch: {branch_name}
</config>

<review_comments>
{json_array_of_actionable_comments}

Cada comentário tem:
- id: ID do comentário (para responder)
- user: quem deixou
- body: o texto do comentário
- path: caminho do arquivo (para comentários inline)
- line: número da linha (para comentários inline)
- diff_hunk: contexto do diff ao redor (para comentários inline)
- source: de onde veio o comentário (review, inline, pr_body, greptile, etc.)
</review_comments>

<instructions>
Siga estas etapas em ordem:

0. CONFIGURAÇÃO — Garanta que GH_TOKEN está disponível:
```

export GH_TOKEN=$(node -e "const fs=require('fs'); const c=JSON.parse(fs.readFileSync('/data/.clawdbot/opencraft.json','utf8')); console.log(c.skills?.entries?.['gh-issues']?.apiKey || '')")

```
Verifique: echo "Token: ${GH_TOKEN:0:10}..."

1. CHECKOUT — Mude para o branch do PR:
git fetch {PUSH_REMOTE} {branch_name}
git checkout {branch_name}
git pull {PUSH_REMOTE} {branch_name}

2. ENTENDER — Leia TODOS os comentários de revisão cuidadosamente. Agrupe-os por arquivo. Entenda o que cada revisor está pedindo.

3. IMPLEMENTAR — Para cada comentário, faça a mudança solicitada:
- Leia o arquivo e localize o código relevante
- Faça a mudança que o revisor solicitou
- Se o comentário for vago ou você discordar, ainda tente uma correção razoável mas note sua preocupação
- Se o comentário pedir algo impossível ou contraditório, pule e explique por quê na sua resposta

4. TESTAR — Execute os testes existentes para garantir que suas mudanças não quebrem nada:
- Se os testes falharem, corrija o problema ou reverta a mudança problemática
- Note quaisquer falhas de teste em suas respostas

5. COMMITAR — Prepare e commite todas as mudanças em um único commit:
git add {changed_files}
git commit -m "fix: tratar comentários de revisão no PR #{pr_number}

Trata feedback de revisão de {reviewer_names}"

6. ENVIAR — Envie o branch atualizado:
git config --global credential.helper ""
git remote set-url {PUSH_REMOTE} https://x-access-token:$GH_TOKEN@github.com/{PUSH_REPO}.git
GIT_ASKPASS=true git push {PUSH_REMOTE} {branch_name}

7. RESPONDER — Para cada comentário tratado, poste uma resposta:

Para comentários de revisão inline (têm path/line), responda ao thread do comentário:
curl -s -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/{SOURCE_REPO}/pulls/{pr_number}/comments/{comment_id}/replies \
  -d '{"body": "Tratado no commit {short_sha} — {brief_description_of_change}"}'

Para comentários gerais do PR (comentários de issue), responda no PR:
curl -s -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/{SOURCE_REPO}/issues/{pr_number}/comments \
  -d '{"body": "Feedback tratado de @{reviewer}:\n\n{summary_of_changes_made}\n\nAtualizado no commit {short_sha}"}'

Para comentários que NÃO puderam ser tratados, responda explicando por quê:
"Não foi possível tratar este comentário: {motivo}. Pode precisar de revisão manual."

8. RELATAR — Envie de volta um resumo:
- URL do PR
- Número de comentários tratados vs pulados
- SHA do commit
- Arquivos modificados
- Quaisquer comentários que precisam de atenção manual
</instructions>

<constraints>
- Modifique apenas arquivos relevantes aos comentários de revisão
- Não faça mudanças não relacionadas
- Não force-push — sempre push normal
- Se um comentário contradiz outro, trate o mais recente e sinalize o conflito
- NÃO use o CLI gh — use curl + API REST do GitHub
- GH_TOKEN já está no ambiente — não solicite autenticação
- Limite de tempo: máximo 60 minutos
</constraints>
```

**Configuração de spawn por sub-agente:**

- runTimeoutSeconds: 3600 (60 minutos)
- cleanup: "keep" (preserve transcrições para revisão)
- Se `--model` foi fornecido, inclua `model: "{MODEL}"` na configuração de spawn

### Etapa 6.6 — Resultados de Revisão

Após todos os sub-agentes de revisão concluírem, apresente um resumo:

```
| PR | Comentários Tratados | Comentários Pulados | Commit | Status |
|----|---------------------|--------------------|---------|----|
| #99 fix/issue-42 | 3 | 0 | abc123f | Todos tratados |
| #101 fix/issue-37 | 1 | 1 | def456a | 1 precisa de revisão manual |
```

Adicione IDs de comentários deste lote ao conjunto `ADDRESSED_COMMENTS` para evitar reprocessamento.

---

## Modo Watch (se --watch estiver ativo)

Após apresentar os resultados do lote atual:

1. Adicione todos os números de issue deste lote ao conjunto em execução PROCESSED_ISSUES.
2. Adicione todos os IDs de comentários tratados a ADDRESSED_COMMENTS.
3. Diga ao usuário:
   > "Próxima busca em {interval} minutos... (diga 'stop' para encerrar o modo watch)"
4. Aguarde por {interval} minutos.
5. Volte para **Fase 2 — Buscar Issues**. A busca filtrará automaticamente:
   - Issues já em PROCESSED_ISSUES
   - Issues que têm PRs fix/issue-{N} existentes (capturado no pré-voo da Fase 4)
6. Após as Fases 2-5 (ou se não houver novas issues), execute a **Fase 6** para verificar novos comentários de revisão em TODOS os PRs rastreados (tanto recém-criados quanto previamente abertos).
7. Se não houver novas issues E nenhum novo comentário acionável → reporte "Nenhuma atividade nova. Buscando novamente em {interval} minutos..." e faça loop de volta à etapa 4.
8. O usuário pode dizer "stop" a qualquer momento para sair do modo watch. Ao parar, apresente um resumo cumulativo final de TODOS os lotes — issues processadas E comentários de revisão tratados.

**Higiene de contexto entre buscas — IMPORTANTE:**
Mantenha apenas entre ciclos de busca:

- PROCESSED_ISSUES (conjunto de números de issue)
- ADDRESSED_COMMENTS (conjunto de IDs de comentários)
- OPEN_PRS (lista de PRs rastreados: número, branch, URL)
- Resultados cumulativos (uma linha por issue + uma linha por lote de revisão)
- Argumentos analisados da Fase 1
- BASE_BRANCH, SOURCE_REPO, PUSH_REPO, FORK_MODE, BOT_USERNAME
  NÃO mantenha corpos de issues, corpos de comentários, transcrições de sub-agentes ou análise de código-fonte entre buscas.
