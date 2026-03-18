# Diretrizes do Repositório

- Repo: https://github.com/editzffaleta/OpenCraft
- Em respostas no chat, referências a arquivos devem ser apenas relativas à raiz do repositório (exemplo: `extensions/bluebubbles/src/channel.ts:80`); nunca caminhos absolutos ou `~/...`.
- Issues/comentários/comentários de PR no GitHub: use strings multilinhas literais ou `-F - <<'EOF'` (ou $'...') para quebras de linha reais; nunca incorpore "\\n".
- Armadilha de comentários no GitHub: nunca use `gh issue/pr comment -b "..."` quando o corpo contiver backticks ou caracteres especiais de shell. Sempre use heredoc com aspas simples (`-F - <<'EOF'`) para evitar substituição de comandos ou corrupção de escapes.
- Armadilha de links no GitHub: não envolva referências a issues/PRs como `#24643` em backticks quando quiser auto-link. Use `#24643` simples (opcionalmente adicione a URL completa).
- Comentários de aterrissagem de PR: sempre torne os SHAs de commit clicáveis com links completos de commit (tanto o SHA pousado quanto o SHA de origem quando presentes).
- Conversas de revisão de PR: se um bot deixar conversas de revisão no seu PR, resolva-as você mesmo após corrigir. Deixe uma conversa sem resolução apenas quando o julgamento de um revisor ou mantenedor ainda for necessário; não deixe a limpeza de conversas de bot para os mantenedores.
- Armadilha de busca no GitHub: não se limite às primeiras 500 issues ou PRs ao querer pesquisar tudo. A menos que você deva olhar os mais recentes, continue até chegar à última página da busca.
- Análise de advisory de segurança: antes de decisões de triagem/severidade, leia `SECURITY.md` para alinhar com o modelo de confiança e os limites de design do OpenCraft.
- Não edite arquivos cobertos por regras de `CODEOWNERS` focadas em segurança, a menos que um proprietário listado tenha pedido explicitamente a mudança ou já esteja revisando com você. Trate esses caminhos como superfícies restritas, não limpeza casual.

## Labels de fechamento automático (issues e PRs)

- Se uma issue/PR corresponder a um dos motivos abaixo, aplique o label e deixe `.github/workflows/auto-response.yml` cuidar do comentário/fechamento/bloqueio.
- Não feche manualmente + comente manualmente por esses motivos.
- Por quê: mantém a redação consistente, preserva o comportamento da automação (`state_reason`, bloqueio) e mantém a triagem/relatórios pesquisáveis por label.
- Labels `r:*` podem ser usados tanto em issues quanto em PRs.

- `r: skill`: feche com orientação para publicar skills no Clawhub.
- `r: support`: feche com redirecionamento para suporte no Discord + FAQ de problemas.
- `r: no-ci-pr`: feche PRs com apenas correções de teste para CI com falha em `main` e publique a explicação padrão.
- `r: too-many-prs`: feche quando o autor excede o limite de PRs ativos.
- `r: testflight`: feche solicitações pedindo acesso/builds pelo TestFlight. O OpenCraft ainda não oferece distribuição via TestFlight, então use a resposta padrão ("Não disponível, compile a partir do código-fonte.") em vez de respostas ad-hoc.
- `r: third-party-extension`: feche com orientação para lançar como plugin de terceiros.
- `r: moltbook`: feche + bloqueie como fora do assunto (não afiliado).
- `r: spam`: feche + bloqueie como spam (`lock_reason: spam`).
- `invalid`: feche itens inválidos (issues são fechadas como `not_planned`; PRs são fechados).
- `dirty`: feche PRs com muitas mudanças não relacionadas/inesperadas (label apenas para PRs).

## Veracidade de PRs e validação de correções de bugs

- Nunca faça merge de um PR de correção de bug baseado apenas no texto da issue, no texto do PR, ou em raciocínio de IA.
- Antes de `/landpr`, execute `/reviewpr` e exija evidências explícitas para afirmações de correção de bug.
- Critério mínimo de merge para PRs de correção de bug:
  1. evidência do sintoma (repro/log/teste com falha),
  2. causa raiz verificada no código com arquivo/linha,
  3. a correção toca o caminho de código implicado,
  4. teste de regressão (falha antes/passa depois) quando viável; se não for viável, inclua prova de verificação manual e o motivo pelo qual nenhum teste foi adicionado.
- Se a afirmação não tiver base ou for provavelmente alucinada/BS: não faça merge. Solicite evidências/mudanças, ou feche com `invalid` quando apropriado.
- Se a issue vinculada parecer incorreta/desatualizada, corrija a triagem primeiro; não faça merge de correções especulativas.

## Estrutura do Projeto e Organização de Módulos

- Código-fonte: `src/` (wiring do CLI em `src/cli`, comandos em `src/commands`, web provider em `src/provider-web.ts`, infra em `src/infra`, pipeline de mídia em `src/media`).
- Testes: colocados junto ao código `*.test.ts`.
- Docs: `docs/` (imagens, fila, configuração Pi). A saída compilada fica em `dist/`.
- Plugins/extensions: ficam em `extensions/*` (pacotes do workspace). Mantenha dependências exclusivas de plugins no `package.json` da extensão; não as adicione ao `package.json` raiz, a menos que o core as use.
- Plugins: a instalação executa `npm install --omit=dev` no diretório do plugin; as dependências de runtime devem estar em `dependencies`. Evite `workspace:*` em `dependencies` (quebra o npm install); coloque `opencraft` em `devDependencies` ou `peerDependencies` (o runtime resolve `opencraft/plugin-sdk` via alias jiti).
- Instaladores servidos em `https://opencraft.ai/*`: ficam no repositório irmão `../opencraft.ai` (`public/install.sh`, `public/install-cli.sh`, `public/install.ps1`).
- Canais de mensagens: sempre considere **todos** os canais internos + de extensão ao refatorar lógica compartilhada (roteamento, allowlists, pareamento, controle de comandos, onboarding, docs).
  - Docs de canais principais: `docs/channels/`
  - Código de canais principais: `src/telegram`, `src/discord`, `src/slack`, `src/signal`, `src/imessage`, `src/web` (WhatsApp web), `src/channels`, `src/routing`
  - Extensions (plugins de canal): `extensions/*` (ex.: `extensions/msteams`, `extensions/matrix`, `extensions/zalo`, `extensions/zalouser`, `extensions/voice-call`)
- Ao adicionar canais/extensions/apps/docs, atualize `.github/labeler.yml` e crie labels GitHub correspondentes (use as cores de labels de canal/extensão existentes).

## Links de Documentação (Mintlify)

- Os docs estão hospedados no Mintlify (docs.opencraft.ai).
- Links internos de docs em `docs/**/*.md`: relativos à raiz, sem `.md`/`.mdx` (exemplo: `[Config](/configuration)`).
- Ao trabalhar com documentação, leia a skill do mintlify.
- Para docs, textos de UI e listas de seleção, ordene serviços/provedores alfabeticamente, a menos que a seção esteja descrevendo explicitamente comportamento de runtime (por exemplo, auto-detecção ou ordem de execução).
- Referências cruzadas de seção: use âncoras em caminhos relativos à raiz (exemplo: `[Hooks](/configuration#hooks)`).
- Títulos e âncoras de doc: evite travessões e apóstrofos em títulos porque eles quebram os links de âncora do Mintlify.
- Quando Peter pedir links, responda com URLs completas `https://docs.opencraft.ai/...` (não relativas à raiz).
- Quando você tocar em docs, termine a resposta com as URLs `https://docs.opencraft.ai/...` referenciadas.
- README (GitHub): mantenha URLs absolutas de docs (`https://docs.opencraft.ai/...`) para que os links funcionem no GitHub.
- O conteúdo dos docs deve ser genérico: sem nomes pessoais de dispositivos/hostnames/caminhos; use placeholders como `user@gateway-host` e "gateway host".

## i18n de Docs (zh-CN)

- `docs/zh-CN/**` é gerado; não edite a menos que o usuário peça explicitamente.
- Pipeline: atualize os docs em inglês → ajuste o glossário (`docs/.i18n/glossary.zh-CN.json`) → execute `scripts/docs-i18n` → aplique correções pontuais apenas se instruído.
- Antes de executar novamente `scripts/docs-i18n`, adicione entradas ao glossário para quaisquer novos termos técnicos, títulos de página ou rótulos de navegação curtos que devem permanecer em inglês ou usar uma tradução fixa (por exemplo, `Doctor` ou `Polls`).
- `pnpm docs:check-i18n-glossary` garante cobertura do glossário para títulos de docs em inglês alterados e rótulos internos curtos de docs antes de reexecuções de tradução.
- Memória de tradução: `docs/.i18n/zh-CN.tm.jsonl` (gerado).
- Veja `docs/.i18n/README.md`.
- O pipeline pode ser lento/ineficiente; se estiver travando, chame @jospalmbier no Discord em vez de contornar o problema.

## Operações de VM no exe.dev (geral)

- Acesso: o caminho estável é `ssh exe.dev` então `ssh vm-name` (assuma que a chave SSH já está configurada).
- SSH instável: use o terminal web do exe.dev ou Shelley (agente web); mantenha uma sessão tmux para operações longas.
- Atualização: `sudo npm i -g opencraft@latest` (instalação global precisa de root em `/usr/lib/node_modules`).
- Config: use `opencraft config set ...`; certifique-se de que `gateway.mode=local` está configurado.
- Discord: armazene apenas o token bruto (sem o prefixo `DISCORD_BOT_TOKEN=`).
- Reinicialização: pare o gateway antigo e execute:
  `pkill -9 -f opencraft-gateway || true; nohup opencraft gateway run --bind loopback --port 18789 --force > /tmp/opencraft-gateway.log 2>&1 &`
- Verificação: `opencraft channels status --probe`, `ss -ltnp | rg 18789`, `tail -n 120 /tmp/opencraft-gateway.log`.

## Comandos de Build, Teste e Desenvolvimento

- Baseline de runtime: Node **22+** (mantenha os caminhos Node + Bun funcionando).
- Instalar deps: `pnpm install`
- Se deps estiverem faltando (por exemplo, `node_modules` ausente, `vitest not found`, ou `command not found`), execute o comando de instalação do gerenciador de pacotes do repositório (prefira o PM definido no lockfile/README), depois reexecute o comando solicitado exato uma vez. Aplique isso a comandos de teste/build/lint/typecheck/dev; se a nova tentativa ainda falhar, reporte o comando e o primeiro erro acionável.
- Hooks de pre-commit: `prek install` (executa as mesmas verificações que o CI)
- Também suportado: `bun install` (mantenha `pnpm-lock.yaml` + patches do Bun sincronizados ao tocar em deps/patches).
- Prefira Bun para execução de TypeScript (scripts, dev, testes): `bun <file.ts>` / `bunx <tool>`.
- Executar CLI em dev: `pnpm opencraft ...` (bun) ou `pnpm dev`.
- Node continua suportado para executar a saída compilada (`dist/*`) e instalações em produção.
- Empacotamento Mac (dev): `scripts/package-mac-app.sh` usa a arquitetura atual por padrão.
- Verificação de tipos/build: `pnpm build`
- Verificações TypeScript: `pnpm tsgo`
- Lint/format: `pnpm check`
- Verificação de formatação: `pnpm format` (oxfmt --check)
- Correção de formatação: `pnpm format:fix` (oxfmt --write)
- Testes: `pnpm test` (vitest); cobertura: `pnpm test:coverage`

## Estilo de Código e Convenções de Nomenclatura

- Linguagem: TypeScript (ESM). Prefira tipagem estrita; evite `any`.
- Formatação/linting via Oxlint e Oxfmt; execute `pnpm check` antes de commits.
- Nunca adicione `@ts-nocheck` e não desative `no-explicit-any`; corrija as causas raiz e atualize a configuração do Oxlint/Oxfmt apenas quando necessário.
- Guardrail de importação dinâmica: não misture `await import("x")` e `import ... from "x"` estático para o mesmo módulo em caminhos de código de produção. Se você precisar de carregamento lazy, crie um limite dedicado `*.runtime.ts` (que re-exporta de `x`) e importe dinamicamente apenas esse limite a partir de chamadores lazy.
- Verificação de importação dinâmica: após refatorações que tocam em carregamento lazy/limites de módulo, execute `pnpm build` e verifique avisos de `[INEFFECTIVE_DYNAMIC_IMPORT]` antes de enviar.
- Nunca compartilhe comportamento de classe via mutação de prototype (`applyPrototypeMixins`, `Object.defineProperty` em `.prototype`, ou exportando `Class.prototype` para mesclagens). Use herança/composição explícita (`A extends B extends C`) ou composição de helpers para que o TypeScript possa verificar tipos.
- Se esse padrão for necessário, pare e obtenha aprovação explícita antes de enviar; o comportamento padrão é dividir/refatorar em uma hierarquia de classes explícita e manter membros fortemente tipados.
- Em testes, prefira stubs por instância em vez de mutação de prototype (`SomeClass.prototype.method = ...`), a menos que um teste documente explicitamente por que o patch no nível do prototype é necessário.
- Adicione comentários breves no código para lógica complicada ou não óbvia.
- Mantenha os arquivos concisos; extraia helpers em vez de cópias "V2". Use padrões existentes para opções de CLI e injeção de dependências via `createDefaultDeps`.
- Busque manter arquivos com menos de ~700 LOC; é uma diretriz (não uma guardrail rígida). Divida/refatore quando melhorar a clareza ou testabilidade.
- Nomenclatura: use **OpenCraft** para títulos de produto/app/docs; use `opencraft` para comando CLI, pacote/binário, caminhos e chaves de configuração.
- Inglês escrito: use ortografia e gramática americanas em código, comentários, docs e strings de UI (ex.: "color" não "colour", "behavior" não "behaviour", "analyze" não "analyse").

## Canais de Release (Nomenclatura)

- stable: apenas releases com tag (ex.: `vYYYY.M.D`), dist-tag npm `latest`.
- beta: tags de pré-release `vYYYY.M.D-beta.N`, dist-tag npm `beta` (pode ser enviado sem o app macOS).
- nomenclatura beta: prefira `-beta.N`; não crie novos betas `-1/-2`. Os legados `vYYYY.M.D-<patch>` e `vYYYY.M.D.beta.N` continuam reconhecidos.
- dev: head em movimento em `main` (sem tag; git checkout main).

## Diretrizes de Teste

- Framework: Vitest com thresholds de cobertura V8 (70% de linhas/branches/funções/statements).
- Nomenclatura: combine os nomes de fonte com `*.test.ts`; e2e em `*.e2e.test.ts`.
- Execute `pnpm test` (ou `pnpm test:coverage`) antes de enviar quando você tocar em lógica.
- Para depuração local/direcionada, continue usando o wrapper: `pnpm test -- <path-or-filter> [vitest args...]` (por exemplo, `pnpm test -- src/commands/onboard-search.test.ts -t "shows registered plugin providers"`); não use `pnpm vitest run ...` diretamente porque ignora a configuração/perfil/roteamento de pool do wrapper.
- Não defina trabalhadores de teste acima de 16; já foi tentado.
- Se as execuções locais do Vitest causarem pressão de memória (comum em hosts não-Mac-Studio), use `OPENCRAFT_TEST_PROFILE=low OPENCRAFT_TEST_SERIAL_GATEWAY=1 pnpm test` para execuções de land/gate.
- Testes ao vivo (chaves reais): `CLAWDBOT_LIVE_TEST=1 pnpm test:live` (somente OpenCraft) ou `LIVE=1 pnpm test:live` (inclui testes ao vivo de provider). Docker: `pnpm test:docker:live-models`, `pnpm test:docker:live-gateway`. Docker E2E de Onboarding: `pnpm test:docker:onboard`.
- Kit completo + o que é coberto: `docs/testing.md`.
- Changelog: apenas mudanças voltadas ao usuário; sem notas internas/meta (alinhamento de versão, lembretes de appcast, processo de release).
- Posicionamento no changelog: no bloco de versão ativo, acrescente novas entradas ao fim da seção alvo (`### Changes` ou `### Fixes`); não insira novas entradas no topo de uma seção.
- Atribuição no changelog: use no máximo uma menção de contribuidor por linha; prefira `Thanks @author` e não adicione também `by @author` na mesma entrada.
- Adições/correções de testes puras geralmente **não** precisam de entrada no changelog, a menos que alterem o comportamento voltado ao usuário ou o usuário peça uma.
- Mobile: antes de usar um simulador, verifique se há dispositivos reais conectados (iOS + Android) e prefira-os quando disponíveis.

## Diretrizes de Commit e Pull Request

**Fluxo completo de PR para mantenedores (opcional):** Se você quiser o fluxo de trabalho completo de mantenedor do repositório (ordem de triagem, barra de qualidade, regras de rebase, convenções de commit/changelog, política de co-contribuidores, e o pipeline `review-pr` > `prepare-pr` > `merge-pr`), veja `.agents/skills/PR_WORKFLOW.md`. Mantenedores podem usar outros fluxos; quando um mantenedor especificar um fluxo, siga-o. Se nenhum fluxo for especificado, use o PR_WORKFLOW por padrão.

- `/landpr` fica nos prompts globais do Codex (`~/.codex/prompts/landpr.md`); ao pousar ou fazer merge de qualquer PR, sempre siga o processo `/landpr`.
- Crie commits com `scripts/committer "<msg>" <file...>`; evite `git add`/`git commit` manuais para que o staging fique delimitado.
- Siga mensagens de commit concisas e orientadas a ações (ex.: `CLI: add verbose flag to send`).
- Agrupe mudanças relacionadas; evite juntar refatorações não relacionadas.
- Template de envio de PR (canônico): `.github/pull_request_template.md`
- Templates de envio de issue (canônico): `.github/ISSUE_TEMPLATE/`

## Comandos Abreviados

- `sync`: se a árvore de trabalho estiver suja, faça commit de todas as mudanças (escolha uma mensagem Conventional Commit sensata), depois `git pull --rebase`; se houver conflitos de rebase que não possam ser resolvidos, pare; caso contrário, `git push`.

## Notas sobre Git

- Se `git branch -d/-D <branch>` for bloqueado por política, delete a referência local diretamente: `git update-ref -d refs/heads/<branch>`.
- Segurança ao fechar/reabrir PRs em massa: se uma ação de fechamento afetar mais de 5 PRs, primeiro peça confirmação explícita do usuário com a contagem exata de PRs e o escopo/consulta alvo.

## Busca no GitHub (`gh`)

- Prefira busca por palavra-chave direcionada antes de propor novo trabalho ou duplicar correções.
- Use `--repo editzffaleta/OpenCraft` + `--match title,body` primeiro; adicione `--match comments` ao fazer triagem de threads de acompanhamento.
- PRs: `gh search prs --repo editzffaleta/OpenCraft --match title,body --limit 50 -- "auto-update"`
- Issues: `gh search issues --repo editzffaleta/OpenCraft --match title,body --limit 50 -- "auto-update"`
- Exemplo de saída estruturada:
  `gh search issues --repo editzffaleta/OpenCraft --match title,body --limit 50 --json number,title,state,url,updatedAt -- "auto update" --jq '.[] | "\(.number) | \(.state) | \(.title) | \(.url)"'`

## Dicas de Segurança e Configuração

- O web provider armazena credenciais em `~/.opencraft/credentials/`; execute `opencraft login` novamente se sair.
- As sessões Pi ficam em `~/.opencraft/sessions/` por padrão; o diretório base não é configurável.
- Variáveis de ambiente: veja `~/.profile`.
- Nunca faça commit ou publique números de telefone reais, vídeos ou valores de configuração ao vivo. Use placeholders obviamente falsos em docs, testes e exemplos.
- Fluxo de release: use os [docs privados de release para mantenedores](https://github.com/opencraft/maintainers/blob/main/release/README.md) para o runbook real; use `docs/reference/RELEASING.md` para a política pública de release.

## Patch/Publicação de GHSA (Advisory do Repositório)

- Antes de revisar advisories de segurança, leia `SECURITY.md`.
- Buscar: `gh api /repos/editzffaleta/OpenCraft/security-advisories/<GHSA>`
- Versão mais recente do npm: `npm view opencraft version --userconfig "$(mktemp)"`
- PRs de forks privados devem ser fechados:
  `fork=$(gh api /repos/editzffaleta/OpenCraft/security-advisories/<GHSA> | jq -r .private_fork.full_name)`
  `gh pr list -R "$fork" --state open` (deve estar vazio)
- Armadilha de newline na descrição: escreva Markdown via heredoc em `/tmp/ghsa.desc.md` (sem strings `"\\n"`)
- Construa o JSON de patch via jq: `jq -n --rawfile desc /tmp/ghsa.desc.md '{summary,severity,description:$desc,vulnerabilities:[...]}' > /tmp/ghsa.patch.json`
- Armadilha da API GHSA: não é possível definir `severity` e `cvss_vector_string` no mesmo PATCH; faça chamadas separadas.
- Patch + publicação: `gh api -X PATCH /repos/editzffaleta/OpenCraft/security-advisories/<GHSA> --input /tmp/ghsa.patch.json` (publicar = incluir `"state":"published"`; sem endpoint `/publish`)
- Se a publicação falhar (HTTP 422): falta `severity`/`description`/`vulnerabilities[]`, ou o fork privado tem PRs abertos
- Verificação: rebusque; certifique-se de que `state=published`, `published_at` definido; `jq -r .description | rg '\\\\n'` não retorna nada

## Solução de Problemas

- Problemas de rebrand/migração ou avisos legados de config/serviço: execute `opencraft doctor` (veja `docs/gateway/doctor.md`).

## Notas Específicas do Agente

- Vocabulário: "makeup" = "mac app".
- Retestes macOS no Parallels: use o snapshot com nome mais próximo de `macOS 26.3.1 fresh` quando o usuário pedir uma reexecução limpa/nova do macOS; evite snapshots mais antigos do Tahoe, a menos que seja explicitamente solicitado.
- Smoke beta no Parallels: use `--target-package-spec opencraft@<beta-version>` para o artefato beta, e fixe o lado estável com `--install-version <stable-version>` e `--latest-version <stable-version>` para execuções de upgrade. Os dist-tags do npm podem mudar durante a execução.
- Smoke beta no Parallels, nuance Windows: o estável antigo `2026.3.12` ainda imprime o banner de onboarding do Windows em Unicode, então mojibake durante o log de precheck estável é esperado. Julgue o pacote beta pela lane pós-upgrade.
- Playbook de smoke macOS no Parallels:
  - `prlctl exec` é adequado para comandos de repositório determinísticos, mas pode não representar bem o comportamento interativo do shell (`PATH`, `HOME`, `curl | bash`, resolução de shebang). Para paridade de instalador ou repros sensíveis ao shell, prefira o Terminal do convidado ou `prlctl enter`.
  - Realidade atual do snapshot Tahoe limpo: `brew` existe, `node` pode não estar no `PATH` em exec de convidado não-interativo. Use `/opt/homebrew/bin/node` absoluto para execuções de repo/CLI quando necessário.
  - Ponto de entrada de automação preferido: `pnpm test:parallels:macos`. Ele restaura o snapshot com nome mais próximo de `macOS 26.3.1 fresh`, serve o tarball atual de `main` do host, depois executa as lanes de instalação limpa e lançamento-mais-recente-para-main.
  - O smoke de roundtrip do Discord é opcional. Passe `--discord-token-env <VAR> --discord-guild-id <guild> --discord-channel-id <channel>`; o harness configurará o Discord no convidado, postará uma mensagem do convidado, verificará a visibilidade do lado do host via API REST do Discord, postará uma nova mensagem do host de volta no canal, depois verificará se `opencraft message read` a vê no convidado.
  - Mantenha o token do Discord apenas em uma variável de ambiente do host. Para o bot Mac Studio do Peter, busque-o em uma variável de ambiente temporária de `~/.editzffaleta/OpenCraft.json` via SSH em vez de codificá-lo em arquivos do repositório/histórico do shell.
  - Para smoke do Discord neste snapshot: use `opencraft message send/read` via o wrapper instalado, não `node openclaw.mjs message ...`; os subcomandos `message` lazy não resolvem da mesma forma pelo entrypoint direto do módulo.
  - Para allowlists de guild do Discord: defina `channels.discord.guilds` como um objeto JSON. Não use caminhos pontilhados `config set channels.discord.guilds.<snowflake>...`; snowflakes numéricos são tratados como índices de array.
  - Evite `prlctl enter` / expect para a fase de configuração do Discord; linhas longas ficam truncadas. Use `prlctl exec --current-user /bin/sh -lc ...` com comandos curtos ou arquivos temporários.
  - A verificação do gateway em execuções de smoke deve usar `opencraft gateway status --deep --require-rpc`, não apenas `--deep`, para que falhas de probe resultem em exit code não-zero.
  - Os diagnósticos de pré-upgrade do lançamento mais recente ainda precisam de fallback de compatibilidade: o estável `2026.3.12` não conhece `--require-rpc`, então os dumps de status de precheck devem usar `gateway status --deep` simples até que o convidado seja atualizado.
  - Saída do harness: passe `--json` para resumo legível por máquina; logs por fase ficam em `/tmp/opencraft-parallels-smoke.*`.
  - Execuções paralelas de todos os SOs devem compartilhar o build `dist` do host via `/tmp/opencraft-parallels-build.lock` em vez de reconstruir três vezes.
  - Resultado esperado atual no estável mais recente pré-upgrade: `precheck=latest-ref-fail` é normal em `2026.3.12`; trate como sinal de baseline, não regressão, a menos que a lane `main` pós-upgrade também falhe.
  - Instalação de tgz servida do host limpo: restaure o snapshot limpo, instale o tgz como root do convidado com `HOME=/var/root`, depois execute o onboarding como usuário de desktop via `prlctl exec --current-user`.
  - Para `opencraft onboard --non-interactive --secret-input-mode ref --install-daemon`, espere que refs de perfil de auth respaldadas por env (por exemplo, `OPENAI_API_KEY`) sejam copiadas para o env do serviço no momento da instalação; esse caminho foi corrigido e deve continuar verde.
  - Não execute turnos de agente local + gateway em paralelo no mesmo workspace/sessão limpo; eles podem colidir no bloqueio de sessão. Execute sequencialmente.
  - O smoke de tarball instalado como root no Tahoe ainda pode registrar bloqueios de plugin para `extensions/*` com permissão de escrita para todos sob `/opt/homebrew/lib/node_modules/opencraft`; trate isso como separado da saúde do onboarding/gateway, a menos que a tarefa seja carregamento de plugin.
- Playbook de smoke Windows no Parallels:
  - Ponto de entrada de automação preferido: `pnpm test:parallels:windows`. Ele restaura o snapshot com nome mais próximo de `pre-opencraft-native-e2e-2026-03-12`, serve o tarball atual de `main` do host, depois executa as lanes de instalação limpa e lançamento-mais-recente-para-main.
  - A verificação do gateway em execuções de smoke deve usar `opencraft gateway status --deep --require-rpc`, não apenas `--deep`, para que falhas de probe resultem em exit code não-zero.
  - Os diagnósticos de pré-upgrade do lançamento mais recente ainda precisam de fallback de compatibilidade: o estável `2026.3.12` não conhece `--require-rpc`, então os dumps de status de precheck devem usar `gateway status --deep` simples até que o convidado seja atualizado.
  - Sempre use `prlctl exec --current-user` para execuções no convidado Windows; `prlctl exec` simples fica em `NT AUTHORITY\SYSTEM` e não corresponde ao caminho de instalação real do usuário de desktop.
  - Prefira `npm.cmd` / `opencraft.cmd` explícitos. `npm` / `opencraft` simples no PowerShell podem acionar o shim `.ps1` e falhar sob política de execução restritiva.
  - Use PowerShell apenas como transporte (`powershell.exe -NoProfile -ExecutionPolicy Bypass`) e chame os shims `.cmd` explicitamente de dentro dele.
  - Saída do harness: passe `--json` para resumo legível por máquina; logs por fase ficam em `/tmp/opencraft-parallels-windows.*`.
  - Resultado esperado atual no estável mais recente pré-upgrade: `precheck=latest-ref-fail` é normal em `2026.3.12`; trate como sinal de baseline, não regressão, a menos que a lane `main` pós-upgrade também falhe.
  - Mantenha o texto de onboarding/status do Windows limpo em ASCII nos logs. Pontuação especial em banners aparece como mojibake pelo caminho atual de captura do PowerShell do convidado.
- Playbook de smoke Linux no Parallels:
  - Ponto de entrada de automação preferido: `pnpm test:parallels:linux`. Ele restaura o snapshot com nome mais próximo de `fresh` em `Ubuntu 24.04.3 ARM64`, serve o tarball atual de `main` do host, depois executa as lanes de instalação limpa e lançamento-mais-recente-para-main.
  - Use `prlctl exec` simples neste snapshot. `--current-user` não é o transporte correto aqui.
  - Realidade do snapshot limpo: `curl` está ausente e `apt-get update` pode falhar em desvio de relógio. Faça bootstrap com `apt-get -o Acquire::Check-Date=false update` e instale `curl ca-certificates` antes de testar caminhos de instalador.
  - O smoke de tgz `main` limpo no Linux ainda precisa do instalador do lançamento mais recente primeiro, porque este snapshot não tem Node/npm antes do bootstrap. O harness faz o bootstrap estável primeiro, depois sobrepõe o `main` atual.
  - Este snapshot não tem uma sessão `systemd --user` utilizável. Trate a instalação de daemon gerenciado como não suportada aqui; use `--skip-health`, depois verifique com `opencraft gateway run --bind loopback --port 18789 --force` diretamente.
  - Refs de auth respaldadas por env ainda funcionam, mas qualquer lançamento direto de shell (`opencraft gateway run`, `opencraft agent --local`, `gateway status --deep` do Linux contra essa execução direta) deve herdar as variáveis de env referenciadas no mesmo shell.
  - `prlctl exec` encerra processos filhos Linux destacados neste snapshot, então um `opencraft gateway run` em segundo plano lançado pela automação não é um caminho de smoke confiável. O harness verifica instalador + `agent --local`; faça verificações diretas do gateway apenas de um shell interativo do convidado quando necessário.
  - Quando você executar verificações de gateway Linux manualmente de um shell interativo do convidado, use `opencraft gateway status --deep --require-rpc` para que uma falha de RPC seja um erro definitivo.
  - Prefira comandos argv diretos do convidado para etapas de fetch/install (`curl`, `npm install -g`, `opencraft ...`) em vez de quoting aninhado `bash -lc`; o quoting do convidado Linux pelo Parallels era a parte instável.
  - Saída do harness: passe `--json` para resumo legível por máquina; logs por fase ficam em `/tmp/opencraft-parallels-linux.*`.
  - Resultado esperado atual no smoke Linux: instalação limpa + upgrade deve passar no instalador e `agent --local`; o gateway permanece `skipped-no-detached-linux-gateway` neste snapshot e não deve ser tratado como regressão por si só.
- Nunca edite `node_modules` (instalações globais/Homebrew/npm/git também). As atualizações sobrescrevem. Notas de skill vão em `tools.md` ou `AGENTS.md`.
- Ao adicionar um novo `AGENTS.md` em qualquer lugar do repositório, adicione também um symlink `CLAUDE.md` apontando para ele (exemplo: `ln -s AGENTS.md CLAUDE.md`).
- Signal: "update fly" => `fly ssh console -a flawd-bot -C "bash -lc 'cd /data/clawd/opencraft && git pull --rebase origin main'"` depois `fly machines restart e825232f34d058 -a flawd-bot`.
- Ao trabalhar em uma Issue ou PR do GitHub, imprima a URL completa ao final da tarefa.
- Ao responder perguntas, responda apenas com respostas de alta confiança: verifique no código; não adivinhe.
- Nunca atualize a dependência Carbon.
- Qualquer dependência com `pnpm.patchedDependencies` deve usar uma versão exata (sem `^`/`~`).
- Patchear dependências (patches pnpm, overrides ou mudanças vendorizadas) requer aprovação explícita; não faça isso por padrão.
- Progresso no CLI: use `src/cli/progress.ts` (`osc-progress` + spinner `@clack/prompts`); não crie spinners/barras manualmente.
- Saída de status: mantenha tabelas + wrapping seguro para ANSI (`src/terminal/table.ts`); `status --all` = somente leitura/pasteable, `status --deep` = probes.
- O gateway atualmente roda apenas como app da barra de menu; não há um LaunchAgent/label de helper separado instalado. Reinicie pelo app Mac OpenCraft ou `scripts/restart-mac.sh`; para verificar/matar use `launchctl print gui/$UID | grep opencraft` em vez de assumir um label fixo. **Ao depurar no macOS, inicie/pare o gateway pelo app, não por sessões ad-hoc de tmux; elimine qualquer túnel temporário antes de passar o trabalho.**
- Logs macOS: use `./scripts/clawlog.sh` para consultar logs unificados do subsistema OpenCraft; suporta filtros de follow/tail/categoria e espera sudo sem senha para `/usr/bin/log`.
- Se guardrails compartilhados estiverem disponíveis localmente, revise-os; caso contrário, siga as orientações deste repositório.
- Gerenciamento de estado SwiftUI (iOS/macOS): prefira o framework `Observation` (`@Observable`, `@Bindable`) em vez de `ObservableObject`/`@StateObject`; não introduza novo `ObservableObject` a menos que seja necessário por compatibilidade, e migre usos existentes ao tocar em código relacionado.
- Provedores de conexão: ao adicionar uma nova conexão, atualize todas as superfícies de UI e docs (app macOS, web UI, mobile se aplicável, docs de onboarding/visão geral) e adicione formulários de status + configuração correspondentes para que as listas de provedores e configurações fiquem em sincronia.
- Locais de versão: `package.json` (CLI), `apps/android/app/build.gradle.kts` (versionName/versionCode), `apps/ios/Sources/Info.plist` + `apps/ios/Tests/Info.plist` (CFBundleShortVersionString/CFBundleVersion), `apps/macos/Sources/OpenCraft/Resources/Info.plist` (CFBundleShortVersionString/CFBundleVersion), `docs/install/updating.md` (versão npm fixada), e projetos Xcode/Info.plists do Peekaboo (MARKETING_VERSION/CURRENT_PROJECT_VERSION).
- "Bump version everywhere" significa todos os locais de versão acima **exceto** `appcast.xml` (toque no appcast apenas ao cortar um novo release Sparkle para macOS).
- **Reiniciar apps:** "reiniciar apps iOS/Android" significa recompilar (recompilar/instalar) e relançar, não apenas matar/lançar.
- **Verificações de dispositivo:** antes de testar, verifique dispositivos reais conectados (iOS/Android) antes de recorrer a simuladores/emuladores.
- Busca de Team ID do iOS: `security find-identity -p codesigning -v` → use Apple Development (…) TEAMID. Fallback: `defaults read com.apple.dt.Xcode IDEProvisioningTeamIdentifiers`.
- Hash do bundle A2UI: `src/canvas-host/a2ui/.bundle.hash` é gerado automaticamente; ignore mudanças inesperadas, e regenere apenas via `pnpm canvas:a2ui:bundle` (ou `scripts/bundle-a2ui.sh`) quando necessário. Faça commit do hash como um commit separado.
- Credenciais de assinatura/notarização de release são gerenciadas fora do repositório; os mantenedores mantêm essa configuração nos [docs privados de release para mantenedores](https://github.com/opencraft/maintainers/tree/main/release).
- **Segurança multi-agente:** **não** crie/aplique/descarte entradas de `git stash`, a menos que seja explicitamente solicitado (isso inclui `git pull --rebase --autostash`). Assuma que outros agentes podem estar trabalhando; mantenha WIP não relacionado intocado e evite mudanças de estado transversais.
- **Segurança multi-agente:** quando o usuário disser "push", você pode fazer `git pull --rebase` para integrar as mudanças mais recentes (nunca descarte o trabalho de outros agentes). Quando o usuário disser "commit", limite ao suas mudanças apenas. Quando o usuário disser "commit all", faça commit de tudo em grupos ordenados.
- **Segurança multi-agente:** **não** crie/remova/modifique checkouts de `git worktree` (ou edite `.worktrees/*`) a menos que seja explicitamente solicitado.
- **Segurança multi-agente:** **não** mude de branch / faça checkout de um branch diferente a menos que seja explicitamente solicitado.
- **Segurança multi-agente:** rodar múltiplos agentes é OK desde que cada agente tenha sua própria sessão.
- **Segurança multi-agente:** quando você vir arquivos não reconhecidos, continue; foque nas suas mudanças e faça commit apenas delas.
- Agitação de lint/format:
  - Se os diffs staged+unstaged forem apenas de formatação, resolva automaticamente sem perguntar.
  - Se commit/push já foi solicitado, auto-stage e inclua acompanhamentos somente de formatação no mesmo commit (ou um commit de acompanhamento pequeno se necessário), sem confirmação extra.
  - Pergunte apenas quando as mudanças forem semânticas (lógica/dados/comportamento).
- Costura lobster: use a paleta CLI compartilhada em `src/terminal/palette.ts` (sem cores codificadas diretamente); aplique a paleta a prompts de onboarding/config e outras saídas de TTY UI conforme necessário.
- **Segurança multi-agente:** foque os relatórios nas suas edições; evite disclaimers de guardrail a menos que esteja realmente bloqueado; quando múltiplos agentes tocam no mesmo arquivo, continue se for seguro; termine com uma breve nota "outros arquivos presentes" apenas se relevante.
- Investigações de bug: leia o código-fonte das dependências npm relevantes e todo o código local relacionado antes de concluir; busque causa raiz com alta confiança.
- Estilo de código: adicione comentários breves para lógica complicada; mantenha arquivos abaixo de ~500 LOC quando viável (divida/refatore conforme necessário).
- Guardrails de schema de tool (google-antigravity): evite `Type.Union` em schemas de input de tool; sem `anyOf`/`oneOf`/`allOf`. Use `stringEnum`/`optionalStringEnum` (Type.Unsafe enum) para listas de strings, e `Type.Optional(...)` em vez de `... | null`. Mantenha o schema de tool de nível superior como `type: "object"` com `properties`.
- Guardrails de schema de tool: evite nomes de propriedade `format` brutos em schemas de tool; alguns validadores tratam `format` como palavra reservada e rejeitam o schema.
- Quando solicitado a abrir um arquivo de "sessão", abra os logs de sessão Pi em `~/.opencraft/agents/<agentId>/sessions/*.jsonl` (use o valor `agent=<id>` na linha Runtime do system prompt; o mais recente, a menos que um ID específico seja fornecido), não o `sessions.json` padrão. Se os logs forem necessários de outra máquina, acesse via Tailscale SSH e leia o mesmo caminho lá.
- Não reconstrua o app macOS via SSH; as reconstruções devem ser executadas diretamente no Mac.
- Nunca envie respostas streaming/parciais para superfícies de mensagens externas (WhatsApp, Telegram); apenas respostas finais devem ser entregues lá. Eventos de streaming/tool ainda podem ir para UIs internas/canal de controle.
- Dicas de encaminhamento de wake por voz:
  - O template de comando deve permanecer `opencraft-mac agent --message "${text}" --thinking low`; `VoiceWakeForwarder` já faz escape de shell em `${text}`. Não adicione aspas extras.
  - O PATH do launchd é mínimo; certifique-se de que o PATH do agente de lançamento do app inclua caminhos padrão do sistema mais o seu pnpm bin (tipicamente `$HOME/Library/pnpm`) para que os binários `pnpm`/`opencraft` resolvam quando invocados via `opencraft-mac`.
- Para mensagens manuais de `opencraft message send` que incluam `!`, use o padrão heredoc anotado abaixo para evitar o escape da ferramenta Bash.
- Guardrails de release: não altere números de versão sem o consentimento explícito do operador; sempre peça permissão antes de executar qualquer etapa de npm publish/release.
- Guardrail de release beta: ao usar uma tag Git beta (por exemplo, `vYYYY.M.D-beta.N`), publique npm com um sufixo de versão beta correspondente (por exemplo, `YYYY.M.D-beta.N`) em vez de uma versão simples em `--tag beta`; caso contrário, o nome da versão simples fica consumido/bloqueado.

## Auth de Release

- A publicação do `opencraft` principal usa publicação confiável do GitHub; não use `NPM_TOKEN` ou o fluxo OTP de plugin para releases principais.
- Publicações separadas de plugins `@opencraft/*` usam um fluxo de auth diferente exclusivo para mantenedores.
- Escopo de plugins: publique apenas plugins `@opencraft/*` que já estão no npm. Plugins apenas em disco não entram.
- Mantenedores: nomes de itens privados do 1Password, regras de tmux, helpers de publicação de plugin, e configuração local de assinatura/notarização mac ficam nos [docs privados de release para mantenedores](https://github.com/opencraft/maintainers/blob/main/release/README.md).

## Notas de Release do Changelog

- Ao cortar um release mac com pré-release GitHub beta:
  - Faça tag `vYYYY.M.D-beta.N` a partir do commit de release (exemplo: `v2026.2.15-beta.1`).
  - Crie pré-release com título `opencraft YYYY.M.D-beta.N`.
  - Use as notas de release da seção de versão do `CHANGELOG.md` (`Changes` + `Fixes`, sem duplicar o título).
  - Anexe pelo menos `OpenCraft-YYYY.M.D.zip` e `OpenCraft-YYYY.M.D.dSYM.zip`; inclua `.dmg` se disponível.

- Mantenha as entradas das versões mais recentes no `CHANGELOG.md` ordenadas por impacto:
  - `### Changes` primeiro.
  - `### Fixes` deduplicadas e classificadas com correções voltadas ao usuário primeiro.
- Antes de fazer tag/publicar, execute:
  - `node --import tsx scripts/release-check.ts`
  - `pnpm release:check`
  - `pnpm test:install:smoke` ou `OPENCRAFT_INSTALL_SMOKE_SKIP_NONROOT=1 pnpm test:install:smoke` para o caminho de smoke não-root.
