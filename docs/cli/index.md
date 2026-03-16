---
summary: "Referência do CLI do OpenCraft para comandos `opencraft`, subcomandos e opções"
read_when:
  - Adicionando ou modificando comandos ou opções do CLI
  - Documentando novas superfícies de comando
title: "Referência do CLI"
---

# Referência do CLI

Esta página descreve o comportamento atual do CLI. Se os comandos mudarem, atualize este doc.

## Páginas de comandos

- [`setup`](/cli/setup)
- [`onboard`](/cli/onboard)
- [`configure`](/cli/configure)
- [`config`](/cli/config)
- [`completion`](/cli/completion)
- [`doctor`](/cli/doctor)
- [`dashboard`](/cli/dashboard)
- [`backup`](/cli/backup)
- [`reset`](/cli/reset)
- [`uninstall`](/cli/uninstall)
- [`update`](/cli/update)
- [`message`](/cli/message)
- [`agent`](/cli/agent)
- [`agents`](/cli/agents)
- [`acp`](/cli/acp)
- [`status`](/cli/status)
- [`health`](/cli/health)
- [`sessions`](/cli/sessions)
- [`gateway`](/cli/gateway)
- [`logs`](/cli/logs)
- [`system`](/cli/system)
- [`models`](/cli/models)
- [`memory`](/cli/memory)
- [`directory`](/cli/directory)
- [`nodes`](/cli/nodes)
- [`devices`](/cli/devices)
- [`node`](/cli/node)
- [`approvals`](/cli/approvals)
- [`sandbox`](/cli/sandbox)
- [`tui`](/cli/tui)
- [`browser`](/cli/browser)
- [`cron`](/cli/cron)
- [`dns`](/cli/dns)
- [`docs`](/cli/docs)
- [`hooks`](/cli/hooks)
- [`webhooks`](/cli/webhooks)
- [`pairing`](/cli/pairing)
- [`qr`](/cli/qr)
- [`plugins`](/cli/plugins) (comandos de plugin)
- [`channels`](/cli/channels)
- [`security`](/cli/security)
- [`secrets`](/cli/secrets)
- [`skills`](/cli/skills)
- [`daemon`](/cli/daemon) (alias legado para comandos de serviço do gateway)
- [`clawbot`](/cli/clawbot) (namespace de alias legado)
- [`voicecall`](/cli/voicecall) (plugin; se instalado)

## Flags globais

- `--dev`: isolar estado em `~/.opencraft-dev` e deslocar portas padrão.
- `--profile <name>`: isolar estado em `~/.opencraft-<name>`.
- `--no-color`: desabilitar cores ANSI.
- `--update`: atalho para `opencraft update` (apenas instalações de fonte).
- `-V`, `--version`, `-v`: imprimir versão e sair.

## Estilo de saída

- Cores ANSI e indicadores de progresso apenas renderizam em sessões TTY.
- Hiperlinks OSC-8 renderizam como links clicáveis em terminais suportados; caso contrário fazemos fallback para URLs simples.
- `--json` (e `--plain` onde suportado) desabilita estilo para saída limpa.
- `--no-color` desabilita estilo ANSI; `NO_COLOR=1` também é respeitado.
- Comandos de longa duração mostram um indicador de progresso (OSC 9;4 quando suportado).

## Paleta de cores

O OpenCraft usa uma paleta lobster para saída do CLI.

- `accent` (#FF5A2D): títulos, rótulos, destaques primários.
- `accentBright` (#FF7A3D): nomes de comando, ênfase.
- `accentDim` (#D14A22): texto de destaque secundário.
- `info` (#FF8A5B): valores informativos.
- `success` (#2FBF71): estados de sucesso.
- `warn` (#FFB020): avisos, fallbacks, atenção.
- `error` (#E23D2D): erros, falhas.
- `muted` (#8B7F77): de-ênfase, metadados.

Fonte de verdade da paleta: `src/terminal/palette.ts` (aka "lobster seam").

## Árvore de comandos

```
opencraft [--dev] [--profile <name>] <command>
  setup
  onboard
  configure
  config
    get
    set
    unset
  completion
  doctor
  dashboard
  backup
    create
    verify
  security
    audit
  secrets
    reload
    migrate
  reset
  uninstall
  update
  channels
    list
    status
    logs
    add
    remove
    login
    logout
  directory
  skills
    list
    info
    check
  plugins
    list
    info
    install
    enable
    disable
    doctor
  memory
    status
    index
    search
  message
  agent
  agents
    list
    add
    delete
  acp
  status
  health
  sessions
  gateway
    call
    health
    status
    probe
    discover
    install
    uninstall
    start
    stop
    restart
    run
  daemon
    status
    install
    uninstall
    start
    stop
    restart
  logs
  system
    event
    heartbeat last|enable|disable
    presence
  models
    list
    status
    set
    set-image
    aliases list|add|remove
    fallbacks list|add|remove|clear
    image-fallbacks list|add|remove|clear
    scan
    auth add|setup-token|paste-token
    auth order get|set|clear
  sandbox
    list
    recreate
    explain
  cron
    status
    list
    add
    edit
    rm
    enable
    disable
    runs
    run
  nodes
  devices
  node
    run
    status
    install
    uninstall
    start
    stop
    restart
  approvals
    get
    set
    allowlist add|remove
  browser
    status
    start
    stop
    reset-profile
    tabs
    open
    focus
    close
    profiles
    create-profile
    delete-profile
    screenshot
    snapshot
    navigate
    resize
    click
    type
    press
    hover
    drag
    select
    upload
    fill
    dialog
    wait
    evaluate
    console
    pdf
  hooks
    list
    info
    check
    enable
    disable
    install
    update
  webhooks
    gmail setup|run
  pairing
    list
    approve
  qr
  clawbot
    qr
  docs
  dns
    setup
  tui
```

Nota: plugins podem adicionar comandos de nível superior adicionais (por exemplo `opencraft voicecall`).

## Segurança

- `opencraft security audit` — auditar config + estado local por armadilhas de segurança comuns.
- `opencraft security audit --deep` — probe ao vivo do Gateway com melhor esforço.
- `opencraft security audit --fix` — reforçar padrões seguros e chmod estado/config.

## Secrets

- `opencraft secrets reload` — re-resolver refs e atomicamente trocar o snapshot de runtime.
- `opencraft secrets audit` — escanear por resíduos em texto simples, refs não resolvidas e deriva de precedência.
- `opencraft secrets configure` — helper interativo para configuração de provedor + mapeamento SecretRef + preflight/apply.
- `opencraft secrets apply --from <plan.json>` — aplicar um plano gerado anteriormente (`--dry-run` suportado).

## Plugins

Gerenciar extensões e sua configuração:

- `opencraft plugins list` — descobrir plugins (use `--json` para saída de máquina).
- `opencraft plugins info <id>` — mostrar detalhes de um plugin.
- `opencraft plugins install <path|.tgz|npm-spec>` — instalar um plugin (ou adicionar um path de plugin a `plugins.load.paths`).
- `opencraft plugins enable <id>` / `disable <id>` — alternar `plugins.entries.<id>.enabled`.
- `opencraft plugins doctor` — reportar erros de carregamento de plugin.

A maioria das mudanças de plugin requer uma reinicialização do gateway. Veja [/plugin](/tools/plugin).

## Memory

Busca vetorial em `MEMORY.md` + `memory/*.md`:

- `opencraft memory status` — mostrar estatísticas do índice.
- `opencraft memory index` — reindexar arquivos de memória.
- `opencraft memory search "<query>"` (ou `--query "<query>"`) — busca semântica em memória.

## Comandos slash de chat

Mensagens de chat suportam comandos `/...` (texto e nativos). Veja [/tools/slash-commands](/tools/slash-commands).

Destaques:

- `/status` para diagnósticos rápidos.
- `/config` para mudanças de config persistidas.
- `/debug` para overrides de config apenas em runtime (memória, não disco; requer `commands.debug: true`).

## Setup + onboarding

### `setup`

Inicializar config + workspace.

Opções:

- `--workspace <dir>`: path do workspace do agente (padrão `~/.opencraft/workspace`).
- `--wizard`: rodar o wizard de onboarding.
- `--non-interactive`: rodar wizard sem prompts.
- `--mode <local|remote>`: modo do wizard.
- `--remote-url <url>`: URL do Gateway remoto.
- `--remote-token <token>`: token do Gateway remoto.

Wizard roda automaticamente quando quaisquer flags do wizard estão presentes (`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

### `onboard`

Wizard interativo para configurar gateway, workspace e skills.

Opções:

- `--workspace <dir>`
- `--reset` (resetar config + credenciais + sessões antes do wizard)
- `--reset-scope <config|config+creds+sessions|full>` (padrão `config+creds+sessions`; use `full` para também remover workspace)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (manual é um alias para advanced)
- `--auth-choice <setup-token|token|chutes|openai-codex|openai-api-key|openrouter-api-key|ollama|ai-gateway-api-key|moonshot-api-key|moonshot-api-key-cn|kimi-code-api-key|synthetic-api-key|venice-api-key|gemini-api-key|zai-api-key|mistral-api-key|apiKey|minimax-api|minimax-api-lightning|opencode-zen|opencode-go|custom-api-key|skip>`
- `--token-provider <id>` (não interativo; usado com `--auth-choice token`)
- `--token <token>` (não interativo; usado com `--auth-choice token`)
- `--token-profile-id <id>` (não interativo; padrão: `<provider>:manual`)
- `--token-expires-in <duration>` (não interativo; ex.: `365d`, `12h`)
- `--secret-input-mode <plaintext|ref>` (padrão `plaintext`; use `ref` para armazenar refs de env padrão do provedor em vez de chaves em texto simples)
- `--anthropic-api-key <key>`
- `--openai-api-key <key>`
- `--mistral-api-key <key>`
- `--openrouter-api-key <key>`
- `--ai-gateway-api-key <key>`
- `--moonshot-api-key <key>`
- `--kimi-code-api-key <key>`
- `--gemini-api-key <key>`
- `--zai-api-key <key>`
- `--minimax-api-key <key>`
- `--opencode-zen-api-key <key>`
- `--opencode-go-api-key <key>`
- `--custom-base-url <url>` (não interativo; usado com `--auth-choice custom-api-key` ou `--auth-choice ollama`)
- `--custom-model-id <id>` (não interativo; usado com `--auth-choice custom-api-key` ou `--auth-choice ollama`)
- `--custom-api-key <key>` (não interativo; opcional; usado com `--auth-choice custom-api-key`; faz fallback para `CUSTOM_API_KEY` quando omitido)
- `--custom-provider-id <id>` (não interativo; id de provedor customizado opcional)
- `--custom-compatibility <openai|anthropic>` (não interativo; opcional; padrão `openai`)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>` (não interativo; armazenar `gateway.auth.token` como um SecretRef de env; requer que essa variável de env esteja definida; não pode ser combinado com `--gateway-token`)
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon` (alias: `--skip-daemon`)
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-health`
- `--skip-ui`
- `--node-manager <npm|pnpm|bun>` (pnpm recomendado; bun não recomendado para runtime do Gateway)
- `--json`

### `configure`

Wizard de configuração interativo (modelos, canais, skills, gateway).

### `config`

Helpers de config não interativos (get/set/unset/file/validate). Rodar `opencraft config` sem
subcomando inicia o wizard.

Subcomandos:

- `config get <path>`: imprimir um valor de config (path de ponto/colchete).
- `config set <path> <value>`: definir um valor (JSON5 ou string bruta).
- `config unset <path>`: remover um valor.
- `config file`: imprimir o path do arquivo de config ativo.
- `config validate`: validar a config atual contra o schema sem iniciar o gateway.
- `config validate --json`: emitir saída JSON legível por máquina.

### `doctor`

Verificações de saúde + correções rápidas (config + gateway + serviços legados).

Opções:

- `--no-workspace-suggestions`: desabilitar hints de memória de workspace.
- `--yes`: aceitar padrões sem prompt (headless).
- `--non-interactive`: pular prompts; aplicar apenas migrações seguras.
- `--deep`: escanear serviços do sistema por instalações extras de gateway.

## Helpers de canal

### `channels`

Gerenciar contas de canal de chat (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/MS Teams).

Subcomandos:

- `channels list`: mostrar canais configurados e perfis de auth.
- `channels status`: verificar acessibilidade do gateway e saúde do canal (`--probe` roda verificações extras; use `opencraft health` ou `opencraft status --deep` para probes de saúde do gateway).
- Dica: `channels status` imprime avisos com correções sugeridas quando pode detectar configurações incorretas comuns (depois aponta para `opencraft doctor`).
- `channels logs`: mostrar logs de canal recentes do arquivo de log do gateway.
- `channels add`: configuração estilo wizard quando nenhuma flag é passada; flags mudam para modo não interativo.
  - Ao adicionar uma conta não padrão a um canal ainda usando config de conta única de nível superior, o OpenCraft move valores com escopo de conta para `channels.<channel>.accounts.default` antes de escrever a nova conta.
  - `channels add` não interativo não cria/atualiza bindings automaticamente; bindings de canal continuam correspondendo à conta padrão.
- `channels remove`: desabilitar por padrão; passe `--delete` para remover entradas de config sem prompts.
- `channels login`: login interativo de canal (apenas WhatsApp Web).
- `channels logout`: sair de uma sessão de canal (se suportado).

Opções comuns:

- `--channel <name>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: id de conta do canal (padrão `default`)
- `--name <label>`: nome de exibição para a conta

Opções de `channels login`:

- `--channel <channel>` (padrão `whatsapp`; suporta `whatsapp`/`web`)
- `--account <id>`
- `--verbose`

Opções de `channels logout`:

- `--channel <channel>` (padrão `whatsapp`)
- `--account <id>`

Opções de `channels list`:

- `--no-usage`: pular snapshots de uso/cota do provedor de modelo (apenas com OAuth/API).
- `--json`: saída JSON (inclui uso a menos que `--no-usage` esteja definido).

Opções de `channels logs`:

- `--channel <name|all>` (padrão `all`)
- `--lines <n>` (padrão `200`)
- `--json`

Mais detalhes: [/concepts/oauth](/concepts/oauth)

Exemplos:

```bash
opencraft channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
opencraft channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
opencraft channels remove --channel discord --account work --delete
opencraft channels status --probe
opencraft status --deep
```

### `skills`

Listar e inspecionar skills disponíveis mais informações de prontidão.

Subcomandos:

- `skills list`: listar skills (padrão quando nenhum subcomando).
- `skills info <name>`: mostrar detalhes de uma skill.
- `skills check`: resumo de prontos vs requisitos ausentes.

Opções:

- `--eligible`: mostrar apenas skills prontas.
- `--json`: saída JSON (sem estilo).
- `-v`, `--verbose`: incluir detalhe de requisitos ausentes.

Dica: use `npx clawhub` para buscar, instalar e sincronizar skills.

### `pairing`

Aprovar requisições de pareamento DM entre canais.

Subcomandos:

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

### `devices`

Gerenciar entradas de pareamento de dispositivo do gateway e tokens de dispositivo por função.

Subcomandos:

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

### `webhooks gmail`

Setup + runner de hook Pub/Sub do Gmail. Veja [/automation/gmail-pubsub](/automation/gmail-pubsub).

Subcomandos:

- `webhooks gmail setup` (requer `--account <email>`; suporta `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json`)
- `webhooks gmail run` (overrides de runtime para as mesmas flags)

### `dns setup`

Helper DNS de descoberta de área ampla (CoreDNS + Tailscale). Veja [/gateway/discovery](/gateway/discovery).

Opções:

- `--apply`: instalar/atualizar config CoreDNS (requer sudo; apenas macOS).

## Mensagens + agente

### `message`

Mensagens de saída unificadas + ações de canal.

Veja: [/cli/message](/cli/message)

Subcomandos:

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

Exemplos:

- `opencraft message send --target +15555550123 --message "Oi"`
- `opencraft message poll --channel discord --target channel:123 --poll-question "Lanche?" --poll-option Pizza --poll-option Sushi`

### `agent`

Rodar um turno do agente via Gateway (ou `--local` embutido).

Obrigatório:

- `--message <text>`

Opções:

- `--to <dest>` (para session key e entrega opcional)
- `--session-id <id>`
- `--thinking <off|minimal|low|medium|high|xhigh>` (apenas modelos GPT-5.2 + Codex)
- `--verbose <on|full|off>`
- `--channel <whatsapp|telegram|discord|slack|mattermost|signal|imessage|msteams>`
- `--local`
- `--deliver`
- `--json`
- `--timeout <seconds>`

### `agents`

Gerenciar agentes isolados (workspaces + auth + roteamento).

#### `agents list`

Listar agentes configurados.

Opções:

- `--json`
- `--bindings`

#### `agents add [name]`

Adicionar um novo agente isolado. Roda o wizard guiado a menos que flags (ou `--non-interactive`) sejam passadas; `--workspace` é obrigatório no modo não interativo.

Opções:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (repetível)
- `--non-interactive`
- `--json`

Specs de binding usam `channel[:accountId]`. Quando `accountId` é omitido, o OpenCraft pode resolver escopo de conta via padrões de canal/hooks de plugin; caso contrário é um binding de canal sem escopo explícito de conta.

#### `agents bindings`

Listar bindings de roteamento.

Opções:

- `--agent <id>`
- `--json`

#### `agents bind`

Adicionar bindings de roteamento para um agente.

Opções:

- `--agent <id>`
- `--bind <channel[:accountId]>` (repetível)
- `--json`

#### `agents unbind`

Remover bindings de roteamento para um agente.

Opções:

- `--agent <id>`
- `--bind <channel[:accountId]>` (repetível)
- `--all`
- `--json`

#### `agents delete <id>`

Deletar um agente e podar seu workspace + estado.

Opções:

- `--force`
- `--json`

### `acp`

Rodar a bridge ACP que conecta IDEs ao Gateway.

Veja [`acp`](/cli/acp) para opções completas e exemplos.

### `status`

Mostrar saúde da sessão vinculada e destinatários recentes.

Opções:

- `--json`
- `--all` (diagnóstico completo; somente leitura, colável)
- `--deep` (probe de canais)
- `--usage` (mostrar uso/cota do provedor de modelo)
- `--timeout <ms>`
- `--verbose`
- `--debug` (alias para `--verbose`)

Notas:

- Visão geral inclui status do serviço do host Gateway + node quando disponível.

### Rastreamento de uso

O OpenCraft pode mostrar uso/cota do provedor quando credenciais OAuth/API estão disponíveis.

Superfícies:

- `/status` (adiciona uma linha curta de uso do provedor quando disponível)
- `opencraft status --usage` (imprime detalhamento completo do provedor)
- Barra de menu macOS (seção de Uso em Contexto)

Notas:

- Dados vêm diretamente dos endpoints de uso do provedor (sem estimativas).
- Provedores: Anthropic, GitHub Copilot, OpenAI Codex OAuth, mais Gemini CLI/Antigravity quando esses plugins de provedor estão habilitados.
- Se não existirem credenciais correspondentes, o uso é ocultado.
- Detalhes: veja [Rastreamento de uso](/concepts/usage-tracking).

### `health`

Buscar saúde do Gateway em execução.

Opções:

- `--json`
- `--timeout <ms>`
- `--verbose`

### `sessions`

Listar sessões de conversa armazenadas.

Opções:

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`

## Reset / Desinstalação

### `reset`

Resetar config/estado local (mantém o CLI instalado).

Opções:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

Notas:

- `--non-interactive` requer `--scope` e `--yes`.

### `uninstall`

Desinstalar o serviço gateway + dados locais (CLI permanece).

Opções:

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

Notas:

- `--non-interactive` requer `--yes` e escopos explícitos (ou `--all`).

## Gateway

### `gateway`

Rodar o Gateway WebSocket.

Opções:

- `--port <port>`
- `--bind <loopback|tailnet|lan|auto|custom>`
- `--token <token>`
- `--auth <token|password>`
- `--password <password>`
- `--password-file <path>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--allow-unconfigured`
- `--dev`
- `--reset` (resetar config + credenciais + sessões + workspace de dev)
- `--force` (matar listener existente na porta)
- `--verbose`
- `--claude-cli-logs`
- `--ws-log <auto|full|compact>`
- `--compact` (alias para `--ws-log compact`)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

Gerenciar o serviço do Gateway (launchd/systemd/schtasks).

Subcomandos:

- `gateway status` (faz probe no RPC do Gateway por padrão)
- `gateway install` (instalação de serviço)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

Notas:

- `gateway status` faz probe no RPC do Gateway por padrão usando a porta/config resolvida do serviço (sobrescreva com `--url/--token/--password`).
- `gateway status` suporta `--no-probe`, `--deep`, `--require-rpc` e `--json` para scripting.
- `gateway status` também mostra serviços de gateway legados ou extras quando pode detectá-los (`--deep` adiciona escaneamentos no nível do sistema). Serviços OpenCraft com nome de perfil são tratados como de primeira classe e não são sinalizados como "extras".
- `gateway status` imprime qual path de config o CLI usa vs qual config o serviço provavelmente usa (env do serviço), mais a URL alvo do probe resolvida.
- Em instalações systemd Linux, verificações de deriva de token de status incluem fontes de unidade `Environment=` e `EnvironmentFile=`.
- `gateway install|uninstall|start|stop|restart` suportam `--json` para scripting (saída padrão permanece amigável para humanos).
- `gateway install` padrão para runtime Node; bun **não é recomendado** (bugs WhatsApp/Telegram).
- Opções de `gateway install`: `--port`, `--runtime`, `--token`, `--force`, `--json`.

### `logs`

Cauda de logs de arquivo do Gateway via RPC.

Notas:

- Sessões TTY renderizam uma visão colorizada e estruturada; não-TTY faz fallback para texto simples.
- `--json` emite JSON delimitado por linha (um evento de log por linha).

Exemplos:

```bash
opencraft logs --follow
opencraft logs --limit 200
opencraft logs --plain
opencraft logs --json
opencraft logs --no-color
```

### `gateway <subcommand>`

Helpers CLI do Gateway (use `--url`, `--token`, `--password`, `--timeout`, `--expect-final` para subcomandos RPC).
Quando você passa `--url`, o CLI não aplica automaticamente config ou credenciais de ambiente.
Inclua `--token` ou `--password` explicitamente. Credenciais explícitas ausentes é um erro.

Subcomandos:

- `gateway call <method> [--params <json>]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

RPCs comuns:

- `config.apply` (validar + escrever config + reiniciar + acordar)
- `config.patch` (mesclar uma atualização parcial + reiniciar + acordar)
- `update.run` (rodar update + reiniciar + acordar)

Dica: ao chamar `config.set`/`config.apply`/`config.patch` diretamente, passe `baseHash` de
`config.get` se uma config já existir.

## Modelos

Veja [/concepts/models](/concepts/models) para comportamento de fallback e estratégia de escaneamento.

Setup de token do Anthropic (suportado):

```bash
claude setup-token
opencraft models auth setup-token --provider anthropic
opencraft models status
```

Nota de política: isso é compatibilidade técnica. A Anthropic bloqueou alguns
usos de assinatura fora do Claude Code no passado; verifique os termos atuais da Anthropic
antes de depender de setup-token em produção.

### `models` (raiz)

`opencraft models` é um alias para `models status`.

Opções raiz:

- `--status-json` (alias para `models status --json`)
- `--status-plain` (alias para `models status --plain`)

### `models list`

Opções:

- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

### `models status`

Opções:

- `--json`
- `--plain`
- `--check` (sair 1=expirado/ausente, 2=expirando)
- `--probe` (probe ao vivo de perfis de auth configurados)
- `--probe-provider <name>`
- `--probe-profile <id>` (repetir ou separado por vírgula)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`

Sempre inclui a visão geral de auth e status de expiração OAuth para perfis no store de auth.
`--probe` roda requisições ao vivo (pode consumir tokens e acionar rate limits).

### `models set <model>`

Definir `agents.defaults.model.primary`.

### `models set-image <model>`

Definir `agents.defaults.imageModel.primary`.

### `models aliases list|add|remove`

Opções:

- `list`: `--json`, `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

Opções:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

Opções:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

Opções:

- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`
- `--concurrency <n>`
- `--no-probe`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

### `models auth add|setup-token|paste-token`

Opções:

- `add`: helper de auth interativo
- `setup-token`: `--provider <name>` (padrão `anthropic`), `--yes`
- `paste-token`: `--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

### `models auth order get|set|clear`

Opções:

- `get`: `--provider <name>`, `--agent <id>`, `--json`
- `set`: `--provider <name>`, `--agent <id>`, `<profileIds...>`
- `clear`: `--provider <name>`, `--agent <id>`

## System

### `system event`

Enfileirar um system event e opcionalmente acionar um heartbeat (Gateway RPC).

Obrigatório:

- `--text <text>`

Opções:

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

Controles de heartbeat (Gateway RPC).

Opções:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

Listar entradas de presença do sistema (Gateway RPC).

Opções:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

Gerenciar jobs agendados (Gateway RPC). Veja [/automation/cron-jobs](/automation/cron-jobs).

Subcomandos:

- `cron status [--json]`
- `cron list [--all] [--json]` (saída em tabela por padrão; use `--json` para bruto)
- `cron add` (alias: `create`; requer `--name` e exatamente um de `--at` | `--every` | `--cron`, e exatamente um payload de `--system-event` | `--message`)
- `cron edit <id>` (patch de campos)
- `cron rm <id>` (aliases: `remove`, `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--force]`

Todos os comandos `cron` aceitam `--url`, `--token`, `--timeout`, `--expect-final`.

## Host de node

`node` roda um **host de node headless** ou o gerencia como serviço em background. Veja
[`opencraft node`](/cli/node).

Subcomandos:

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

Notas de auth:

- `node` resolve auth do gateway de env/config (sem flags `--token`/`--password`): `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, depois `gateway.auth.*`. No modo local, o host de node intencionalmente ignora `gateway.remote.*`; em `gateway.mode=remote`, `gateway.remote.*` participa por regras de precedência remota.
- Variáveis de env `CLAWDBOT_GATEWAY_*` legadas são intencionalmente ignoradas para resolução de auth do host de node.

## Nodes

`nodes` conversa com o Gateway e direciona nodes pareados. Veja [/nodes](/nodes).

Opções comuns:

- `--url`, `--token`, `--timeout`, `--json`

Subcomandos:

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes run --node <id|name|ip> [--cwd <path>] [--env KEY=VAL] [--command-timeout <ms>] [--needs-screen-recording] [--invoke-timeout <ms>] <command...>` (app mac ou host de node headless)
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (apenas mac)

Câmera:

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + tela:

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

Localização:

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## Browser

CLI de controle de browser (Chrome/Brave/Edge/Chromium dedicado). Veja [`opencraft browser`](/cli/browser) e a [ferramenta Browser](/tools/browser).

Opções comuns:

- `--url`, `--token`, `--timeout`, `--json`
- `--browser-profile <name>`

Gerenciar:

- `browser status`
- `browser start`
- `browser stop`
- `browser reset-profile`
- `browser tabs`
- `browser open <url>`
- `browser focus <targetId>`
- `browser close [targetId]`
- `browser profiles`
- `browser create-profile --name <name> [--color <hex>] [--cdp-url <url>]`
- `browser delete-profile --name <name>`

Inspecionar:

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

Ações:

- `browser navigate <url> [--target-id <id>]`
- `browser resize <width> <height> [--target-id <id>]`
- `browser click <ref> [--double] [--button <left|right|middle>] [--modifiers <csv>] [--target-id <id>]`
- `browser type <ref> <text> [--submit] [--slowly] [--target-id <id>]`
- `browser press <key> [--target-id <id>]`
- `browser hover <ref> [--target-id <id>]`
- `browser drag <startRef> <endRef> [--target-id <id>]`
- `browser select <ref> <values...> [--target-id <id>]`
- `browser upload <paths...> [--ref <ref>] [--input-ref <ref>] [--element <selector>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser fill [--fields <json>] [--fields-file <path>] [--target-id <id>]`
- `browser dialog --accept|--dismiss [--prompt <text>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser wait [--time <ms>] [--text <value>] [--text-gone <value>] [--target-id <id>]`
- `browser evaluate --fn <code> [--ref <ref>] [--target-id <id>]`
- `browser console [--level <error|warn|info>] [--target-id <id>]`
- `browser pdf [--target-id <id>]`

## Busca de docs

### `docs [query...]`

Buscar o índice de docs ao vivo.

## TUI

### `tui`

Abrir a UI de terminal conectada ao Gateway.

Opções:

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>` (padrão para `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`
