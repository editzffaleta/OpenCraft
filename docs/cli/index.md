---
summary: "Referência CLI do OpenCraft para comandos `opencraft`, subcomandos e opções"
read_when:
  - Adicionando ou modificando comandos ou opções da CLI
  - Documentando novas superfícies de comando
title: "Referência CLI"
---

# Referência CLI

Esta página descreve o comportamento atual da CLI. Se os comandos mudarem, atualize esta documentação.

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

- `--dev`: isolar estado sob `~/.opencraft-dev` e deslocar portas padrão.
- `--profile <nome>`: isolar estado sob `~/.opencraft-<nome>`.
- `--no-color`: desabilitar cores ANSI.
- `--update`: atalho para `opencraft update` (apenas instalações por fonte).
- `-V`, `--version`, `-v`: imprimir versão e sair.

## Estilo de saída

- Cores ANSI e indicadores de progresso só são renderizados em sessões TTY.
- Hyperlinks OSC-8 são renderizados como links clicáveis em terminais suportados; caso contrário, recorremos a URLs em texto plano.
- `--json` (e `--plain` quando suportado) desabilita estilo para saída limpa.
- `--no-color` desabilita estilo ANSI; `NO_COLOR=1` também é respeitado.
- Comandos de longa duração mostram um indicador de progresso (OSC 9;4 quando suportado).

## Paleta de cores

O OpenCraft usa uma paleta lobster para saída da CLI.

- `accent` (#FF5A2D): títulos, rótulos, destaques primários.
- `accentBright` (#FF7A3D): nomes de comandos, ênfase.
- `accentDim` (#D14A22): texto de destaque secundário.
- `info` (#FF8A5B): valores informativos.
- `success` (#2FBF71): estados de sucesso.
- `warn` (#FFB020): avisos, fallbacks, atenção.
- `error` (#E23D2D): erros, falhas.
- `muted` (#8B7F77): conteúdo de menor importância, metadados.

Fonte de verdade da paleta: `src/terminal/palette.ts` (conhecido como "lobster seam").

## Árvore de comandos

```
opencraft [--dev] [--profile <nome>] <comando>
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

Nota: plugins podem adicionar comandos adicionais de nível superior (por exemplo `opencraft voicecall`).

## Segurança

- `opencraft security audit` — auditar config + estado local em busca de problemas comuns de segurança.
- `opencraft security audit --deep` — verificação ao vivo do Gateway com melhor esforço.
- `opencraft security audit --fix` — apertar padrões seguros e chmod de estado/config.

## Segredos

- `opencraft secrets reload` — re-resolver refs e trocar atomicamente o snapshot em tempo de execução.
- `opencraft secrets audit` — varrer em busca de resíduos em texto plano, refs não resolvidos e desvio de precedência.
- `opencraft secrets configure` — auxiliar interativo para configuração de provedor + mapeamento SecretRef + preflight/apply.
- `opencraft secrets apply --from <plan.json>` — aplicar um plano gerado anteriormente (`--dry-run` suportado).

## Plugins

Gerencie extensões e sua config:

- `opencraft plugins list` — descobrir plugins (use `--json` para saída de máquina).
- `opencraft plugins info <id>` — mostrar detalhes de um plugin.
- `opencraft plugins install <caminho|.tgz|npm-spec|plugin@marketplace>` — instalar um plugin (ou adicionar um caminho de plugin a `plugins.load.paths`).
- `opencraft plugins marketplace list <marketplace>` — listar entradas do marketplace antes de instalar.
- `opencraft plugins enable <id>` / `disable <id>` — alternar `plugins.entries.<id>.enabled`.
- `opencraft plugins doctor` — reportar erros de carregamento de plugin.

A maioria das mudanças de plugin requer reiniciar o gateway. Veja [/plugin](/tools/plugin).

## Memória

Busca vetorial sobre `MEMORY.md` + `memory/*.md`:

- `opencraft memory status` — mostrar estatísticas do índice.
- `opencraft memory index` — reindexar arquivos de memória.
- `opencraft memory search "<consulta>"` (ou `--query "<consulta>"`) — busca semântica na memória.

## Comandos slash do chat

Mensagens de chat suportam comandos `/...` (texto e nativo). Veja [/tools/slash-commands](/tools/slash-commands).

Destaques:

- `/status` para diagnósticos rápidos.
- `/config` para mudanças de config persistidas.
- `/debug` para substituições de config apenas em tempo de execução (memória, não disco; requer `commands.debug: true`).

## Configuração + onboarding

### `setup`

Inicializar config + workspace.

Opções:

- `--workspace <dir>`: caminho do workspace do agente (padrão `~/.opencraft/workspace`).
- `--wizard`: executar onboarding.
- `--non-interactive`: executar onboarding sem prompts.
- `--mode <local|remote>`: modo de onboarding.
- `--remote-url <url>`: URL do Gateway remoto.
- `--remote-token <token>`: Token do Gateway remoto.

O onboarding é executado automaticamente quando quaisquer flags de onboarding estão presentes (`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

### `onboard`

Onboarding interativo para gateway, workspace e skills.

Opções:

- `--workspace <dir>`
- `--reset` (resetar config + credenciais + sessões antes do onboarding)
- `--reset-scope <config|config+creds+sessions|full>` (padrão `config+creds+sessions`; use `full` para também remover workspace)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (manual é um alias para advanced)
- `--auth-choice <setup-token|token|chutes|openai-codex|openai-api-key|openrouter-api-key|ollama|ai-gateway-api-key|moonshot-api-key|moonshot-api-key-cn|kimi-code-api-key|synthetic-api-key|venice-api-key|gemini-api-key|zai-api-key|mistral-api-key|apiKey|minimax-api|minimax-api-lightning|opencode-zen|opencode-go|custom-api-key|skip>`
- `--token-provider <id>` (não interativo; usado com `--auth-choice token`)
- `--token <token>` (não interativo; usado com `--auth-choice token`)
- `--token-profile-id <id>` (não interativo; padrão: `<provedor>:manual`)
- `--token-expires-in <duração>` (não interativo; ex.: `365d`, `12h`)
- `--secret-input-mode <plaintext|ref>` (padrão `plaintext`; use `ref` para armazenar refs de env padrão do provedor em vez de chaves em texto plano)
- `--anthropic-api-key <chave>`
- `--openai-api-key <chave>`
- `--mistral-api-key <chave>`
- `--openrouter-api-key <chave>`
- `--ai-gateway-api-key <chave>`
- `--moonshot-api-key <chave>`
- `--kimi-code-api-key <chave>`
- `--gemini-api-key <chave>`
- `--zai-api-key <chave>`
- `--minimax-api-key <chave>`
- `--opencode-zen-api-key <chave>`
- `--opencode-go-api-key <chave>`
- `--custom-base-url <url>` (não interativo; usado com `--auth-choice custom-api-key` ou `--auth-choice ollama`)
- `--custom-model-id <id>` (não interativo; usado com `--auth-choice custom-api-key` ou `--auth-choice ollama`)
- `--custom-api-key <chave>` (não interativo; opcional; usado com `--auth-choice custom-api-key`; recorre a `CUSTOM_API_KEY` quando omitido)
- `--custom-provider-id <id>` (não interativo; id de provedor personalizado opcional)
- `--custom-compatibility <openai|anthropic>` (não interativo; opcional; padrão `openai`)
- `--gateway-port <porta>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <nome>` (não interativo; armazena `gateway.auth.token` como SecretRef de env; requer que a variável de ambiente esteja definida; não pode ser combinado com `--gateway-token`)
- `--gateway-password <senha>`
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

Assistente de configuração interativo (modelos, canais, skills, gateway).

### `config`

Auxiliares de config não interativos (get/set/unset/file/validate). Executar `opencraft config` sem
subcomando abre o assistente.

Subcomandos:

- `config get <caminho>`: imprimir um valor de config (caminho com ponto/colchetes).
- `config set <caminho> <valor>`: definir um valor (JSON5 ou string bruta).
- `config unset <caminho>`: remover um valor.
- `config file`: imprimir o caminho do arquivo de config ativo.
- `config validate`: validar a config atual contra o esquema sem iniciar o gateway.
- `config validate --json`: emitir saída JSON legível por máquina.

### `doctor`

Verificações de saúde + correções rápidas (config + gateway + serviços legados).

Opções:

- `--no-workspace-suggestions`: desabilitar dicas de memória do workspace.
- `--yes`: aceitar padrões sem perguntar (headless).
- `--non-interactive`: pular prompts; aplicar apenas migrações seguras.
- `--deep`: varrer serviços do sistema em busca de instalações extras de gateway.

## Auxiliares de canal

### `channels`

Gerencie contas de canais de chat (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/MS Teams).

Subcomandos:

- `channels list`: mostrar canais configurados e perfis de autenticação.
- `channels status`: verificar acessibilidade do gateway e saúde do canal (`--probe` executa verificações extras; use `opencraft health` ou `opencraft status --deep` para verificações de saúde do gateway).
- Dica: `channels status` imprime avisos com correções sugeridas quando consegue detectar configurações incorretas comuns (e então aponta para `opencraft doctor`).
- `channels logs`: mostrar logs recentes do canal a partir do arquivo de log do gateway.
- `channels add`: configuração estilo assistente quando nenhuma flag é passada; flags mudam para modo não interativo.
  - Ao adicionar uma conta não padrão a um canal ainda usando config de nível superior de conta única, o OpenCraft move valores com escopo de conta para `channels.<canal>.accounts.default` antes de gravar a nova conta.
  - `channels add` não interativo não cria/atualiza vinculações automaticamente; vinculações apenas de canal continuam correspondendo à conta padrão.
- `channels remove`: desabilitar por padrão; passe `--delete` para remover entradas de config sem prompts.
- `channels login`: login interativo de canal (apenas WhatsApp Web).
- `channels logout`: deslogar de uma sessão de canal (se suportado).

Opções comuns:

- `--channel <nome>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: id da conta do canal (padrão `default`)
- `--name <rótulo>`: nome de exibição para a conta

Opções de `channels login`:

- `--channel <canal>` (padrão `whatsapp`; suporta `whatsapp`/`web`)
- `--account <id>`
- `--verbose`

Opções de `channels logout`:

- `--channel <canal>` (padrão `whatsapp`)
- `--account <id>`

Opções de `channels list`:

- `--no-usage`: pular snapshots de uso/cota de provedor de modelo (apenas OAuth/API).
- `--json`: saída JSON (inclui uso a menos que `--no-usage` esteja definido).

Opções de `channels logs`:

- `--channel <nome|all>` (padrão `all`)
- `--lines <n>` (padrão `200`)
- `--json`

Mais detalhes: [/concepts/oauth](/concepts/oauth)

Exemplos:

```bash
opencraft channels add --channel telegram --account alerts --name "Bot de Alertas" --token $TELEGRAM_BOT_TOKEN
opencraft channels add --channel discord --account work --name "Bot de Trabalho" --token $DISCORD_BOT_TOKEN
opencraft channels remove --channel discord --account work --delete
opencraft channels status --probe
opencraft status --deep
```

### `skills`

Liste e inspecione skills disponíveis mais informações de prontidão.

Subcomandos:

- `skills list`: listar skills (padrão quando sem subcomando).
- `skills info <nome>`: mostrar detalhes de uma skill.
- `skills check`: resumo de prontas vs requisitos faltantes.

Opções:

- `--eligible`: mostrar apenas skills prontas.
- `--json`: saída JSON (sem estilo).
- `-v`, `--verbose`: incluir detalhes de requisitos faltantes.

Dica: use `npx clawhub` para pesquisar, instalar e sincronizar skills.

### `pairing`

Aprove solicitações de pareamento de DM entre canais.

Subcomandos:

- `pairing list [canal] [--channel <canal>] [--account <id>] [--json]`
- `pairing approve <canal> <código> [--account <id>] [--notify]`
- `pairing approve --channel <canal> [--account <id>] <código> [--notify]`

### `devices`

Gerencie entradas de pareamento de dispositivos do gateway e tokens de dispositivo por função.

Subcomandos:

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

### `webhooks gmail`

Configuração + executor de hook Gmail Pub/Sub. Veja [/automation/gmail-pubsub](/automation/gmail-pubsub).

Subcomandos:

- `webhooks gmail setup` (requer `--account <email>`; suporta `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json`)
- `webhooks gmail run` (substituições em tempo de execução para as mesmas flags)

### `dns setup`

Auxiliar de DNS para descoberta wide-area (CoreDNS + Tailscale). Veja [/gateway/discovery](/gateway/discovery).

Opções:

- `--apply`: instalar/atualizar config CoreDNS (requer sudo; apenas macOS).

## Mensagens + agente

### `message`

Envio unificado de mensagens + ações de canal.

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

Execute um turno de agente via Gateway (ou `--local` embutido).

Obrigatório:

- `--message <texto>`

Opções:

- `--to <destino>` (para chave de sessão e entrega opcional)
- `--session-id <id>`
- `--thinking <off|minimal|low|medium|high|xhigh>` (apenas modelos GPT-5.2 + Codex)
- `--verbose <on|full|off>`
- `--channel <whatsapp|telegram|discord|slack|mattermost|signal|imessage|msteams>`
- `--local`
- `--deliver`
- `--json`
- `--timeout <segundos>`

### `agents`

Gerencie agentes isolados (workspaces + autenticação + roteamento).

#### `agents list`

Liste agentes configurados.

Opções:

- `--json`
- `--bindings`

#### `agents add [nome]`

Adicione um novo agente isolado. Executa o assistente guiado a menos que flags (ou `--non-interactive`) sejam passadas; `--workspace` é obrigatório no modo não interativo.

Opções:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <canal[:accountId]>` (repetível)
- `--non-interactive`
- `--json`

Especificações de vinculação usam `canal[:accountId]`. Quando `accountId` é omitido, o OpenCraft pode resolver o escopo da conta via padrões do canal/hooks de plugin; caso contrário, é uma vinculação de canal sem escopo de conta explícito.

#### `agents bindings`

Liste vinculações de roteamento.

Opções:

- `--agent <id>`
- `--json`

#### `agents bind`

Adicione vinculações de roteamento para um agente.

Opções:

- `--agent <id>`
- `--bind <canal[:accountId]>` (repetível)
- `--json`

#### `agents unbind`

Remova vinculações de roteamento para um agente.

Opções:

- `--agent <id>`
- `--bind <canal[:accountId]>` (repetível)
- `--all`
- `--json`

#### `agents delete <id>`

Delete um agente e limpe seu workspace + estado.

Opções:

- `--force`
- `--json`

### `acp`

Execute a ponte ACP que conecta IDEs ao Gateway.

Veja [`acp`](/cli/acp) para opções completas e exemplos.

### `status`

Mostre saúde da sessão vinculada e destinatários recentes.

Opções:

- `--json`
- `--all` (diagnóstico completo; somente leitura, colável)
- `--deep` (verificar canais)
- `--usage` (mostrar uso/cota de provedor de modelo)
- `--timeout <ms>`
- `--verbose`
- `--debug` (alias para `--verbose`)

Observações:

- A visão geral inclui status do serviço Gateway + host node quando disponível.

### Rastreamento de uso

O OpenCraft pode exibir uso/cota de provedor quando credenciais OAuth/API estão disponíveis.

Superfícies:

- `/status` (adiciona uma linha curta de uso de provedor quando disponível)
- `opencraft status --usage` (imprime detalhamento completo por provedor)
- Barra de menu macOS (seção Uso em Contexto)

Observações:

- Os dados vêm diretamente dos endpoints de uso dos provedores (sem estimativas).
- Provedores: Anthropic, GitHub Copilot, OpenAI Codex OAuth, mais Gemini CLI via plugin `google` integrado e Antigravity quando configurado.
- Se nenhuma credencial correspondente existe, o uso é ocultado.
- Detalhes: veja [Rastreamento de uso](/concepts/usage-tracking).

### `health`

Busque informações de saúde do Gateway em execução.

Opções:

- `--json`
- `--timeout <ms>`
- `--verbose`

### `sessions`

Liste sessões de conversa armazenadas.

Opções:

- `--json`
- `--verbose`
- `--store <caminho>`
- `--active <minutos>`

## Resetar / Desinstalar

### `reset`

Resete config/estado local (mantém a CLI instalada).

Opções:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

Observações:

- `--non-interactive` requer `--scope` e `--yes`.

### `uninstall`

Desinstale o serviço do gateway + dados locais (a CLI permanece).

Opções:

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

Observações:

- `--non-interactive` requer `--yes` e escopos explícitos (ou `--all`).

## Gateway

### `gateway`

Execute o Gateway WebSocket.

Opções:

- `--port <porta>`
- `--bind <loopback|tailnet|lan|auto|custom>`
- `--token <token>`
- `--auth <token|password>`
- `--password <senha>`
- `--password-file <caminho>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--allow-unconfigured`
- `--dev`
- `--reset` (resetar config + credenciais + sessões + workspace de dev)
- `--force` (encerrar listener existente na porta)
- `--verbose`
- `--claude-cli-logs`
- `--ws-log <auto|full|compact>`
- `--compact` (alias para `--ws-log compact`)
- `--raw-stream`
- `--raw-stream-path <caminho>`

### Serviço do `gateway`

Gerencie o serviço do Gateway (launchd/systemd/schtasks).

Subcomandos:

- `gateway status` (verifica o RPC do Gateway por padrão)
- `gateway install` (instalação de serviço)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

Observações:

- `gateway status` verifica o RPC do Gateway por padrão usando a porta/config resolvida do serviço (substitua com `--url/--token/--password`).
- `gateway status` suporta `--no-probe`, `--deep`, `--require-rpc` e `--json` para scripts.
- `gateway status` também exibe serviços de gateway legados ou extras quando consegue detectá-los (`--deep` adiciona varreduras em nível de sistema). Serviços OpenCraft com nome de perfil são tratados como de primeira classe e não são sinalizados como "extras".
- `gateway status` imprime qual caminho de config a CLI usa versus qual config o serviço provavelmente usa (env do serviço), mais a URL alvo de verificação resolvida.
- Se SecretRefs de autenticação do gateway não estão resolvidos no caminho de comando atual, `gateway status --json` reporta `rpc.authWarning` apenas quando a verificação de conectividade/autenticação falha (avisos são suprimidos quando a verificação é bem-sucedida).
- Em instalações Linux systemd, verificações de desvio de token de status incluem tanto fontes `Environment=` quanto `EnvironmentFile=` da unidade.
- `gateway install|uninstall|start|stop|restart` suportam `--json` para scripts (saída padrão permanece amigável para humanos).
- `gateway install` usa runtime Node por padrão; bun **não é recomendado** (bugs no WhatsApp/Telegram).
- Opções de `gateway install`: `--port`, `--runtime`, `--token`, `--force`, `--json`.

### `logs`

Acompanhe logs de arquivo do Gateway via RPC.

Observações:

- Sessões TTY renderizam uma visualização colorida e estruturada; não-TTY recorre a texto plano.
- `--json` emite JSON delimitado por linha (um evento de log por linha).

Exemplos:

```bash
opencraft logs --follow
opencraft logs --limit 200
opencraft logs --plain
opencraft logs --json
opencraft logs --no-color
```

### `gateway <subcomando>`

Auxiliares CLI do Gateway (use `--url`, `--token`, `--password`, `--timeout`, `--expect-final` para subcomandos RPC).
Quando você passa `--url`, a CLI não aplica automaticamente credenciais de config ou ambiente.
Inclua `--token` ou `--password` explicitamente. Credenciais explícitas ausentes é um erro.

Subcomandos:

- `gateway call <método> [--params <json>]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

RPCs comuns:

- `config.apply` (validar + gravar config + reiniciar + despertar)
- `config.patch` (mesclar uma atualização parcial + reiniciar + despertar)
- `update.run` (executar atualização + reiniciar + despertar)

Dica: ao chamar `config.set`/`config.apply`/`config.patch` diretamente, passe `baseHash` de
`config.get` se uma config já existe.

## Modelos

Veja [/concepts/models](/concepts/models) para comportamento de fallback e estratégia de varredura.

Configuração de setup-token da Anthropic (suportado):

```bash
claude setup-token
opencraft models auth setup-token --provider anthropic
opencraft models status
```

Nota de política: esta é compatibilidade técnica. A Anthropic bloqueou alguns
usos de assinatura fora do Claude Code no passado; verifique os termos atuais da Anthropic
antes de depender do setup-token em produção.

### `models` (raiz)

`opencraft models` é um alias para `models status`.

Opções raiz:

- `--status-json` (alias para `models status --json`)
- `--status-plain` (alias para `models status --plain`)

### `models list`

Opções:

- `--all`
- `--local`
- `--provider <nome>`
- `--json`
- `--plain`

### `models status`

Opções:

- `--json`
- `--plain`
- `--check` (saída 1=expirado/ausente, 2=expirando)
- `--probe` (verificação ao vivo de perfis de autenticação configurados)
- `--probe-provider <nome>`
- `--probe-profile <id>` (repetir ou separado por vírgula)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`

Sempre inclui a visão geral de autenticação e status de expiração OAuth para perfis no armazenamento de autenticação.
`--probe` executa requisições ao vivo (pode consumir tokens e acionar limites de taxa).

### `models set <modelo>`

Definir `agents.defaults.model.primary`.

### `models set-image <modelo>`

Definir `agents.defaults.imageModel.primary`.

### `models aliases list|add|remove`

Opções:

- `list`: `--json`, `--plain`
- `add <alias> <modelo>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

Opções:

- `list`: `--json`, `--plain`
- `add <modelo>`
- `remove <modelo>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

Opções:

- `list`: `--json`, `--plain`
- `add <modelo>`
- `remove <modelo>`
- `clear`

### `models scan`

Opções:

- `--min-params <b>`
- `--max-age-days <dias>`
- `--provider <nome>`
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

- `add`: auxiliar de autenticação interativo
- `setup-token`: `--provider <nome>` (padrão `anthropic`), `--yes`
- `paste-token`: `--provider <nome>`, `--profile-id <id>`, `--expires-in <duração>`

### `models auth order get|set|clear`

Opções:

- `get`: `--provider <nome>`, `--agent <id>`, `--json`
- `set`: `--provider <nome>`, `--agent <id>`, `<profileIds...>`
- `clear`: `--provider <nome>`, `--agent <id>`

## Sistema

### `system event`

Enfileire um evento de sistema e opcionalmente acione um heartbeat (Gateway RPC).

Obrigatório:

- `--text <texto>`

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

Liste entradas de presença do sistema (Gateway RPC).

Opções:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

Gerencie tarefas agendadas (Gateway RPC). Veja [/automation/cron-jobs](/automation/cron-jobs).

Subcomandos:

- `cron status [--json]`
- `cron list [--all] [--json]` (saída em tabela por padrão; use `--json` para bruto)
- `cron add` (alias: `create`; requer `--name` e exatamente um de `--at` | `--every` | `--cron`, e exatamente um payload de `--system-event` | `--message`)
- `cron edit <id>` (atualizar campos)
- `cron rm <id>` (aliases: `remove`, `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--force]`

Todos os comandos `cron` aceitam `--url`, `--token`, `--timeout`, `--expect-final`.

## Host node

`node` executa um **host node headless** ou gerencia-o como serviço em segundo plano. Veja
[`opencraft node`](/cli/node).

Subcomandos:

- `node run --host <host-gateway> --port 18789`
- `node status`
- `node install [--host <host-gateway>] [--port <porta>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <nome>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

Observações de autenticação:

- `node` resolve autenticação do gateway a partir de env/config (sem flags `--token`/`--password`): `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, depois `gateway.auth.*`. No modo local, o host node intencionalmente ignora `gateway.remote.*`; em `gateway.mode=remote`, `gateway.remote.*` participa conforme regras de precedência remota.
- Variáveis de env legadas `CLAWDBOT_GATEWAY_*` são intencionalmente ignoradas para resolução de autenticação do host node.

## Nodes

`nodes` comunica-se com o Gateway e direciona nodes pareados. Veja [/nodes](/nodes).

Opções comuns:

- `--url`, `--token`, `--timeout`, `--json`

Subcomandos:

- `nodes status [--connected] [--last-connected <duração>]`
- `nodes describe --node <id|nome|ip>`
- `nodes list [--connected] [--last-connected <duração>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|nome|ip> --name <displayName>`
- `nodes invoke --node <id|nome|ip> --command <comando> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <chave>]`
- `nodes run --node <id|nome|ip> [--cwd <caminho>] [--env KEY=VAL] [--command-timeout <ms>] [--needs-screen-recording] [--invoke-timeout <ms>] <comando...>` (mac node ou host node headless)
- `nodes notify --node <id|nome|ip> [--title <texto>] [--body <texto>] [--sound <nome>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (apenas mac)

Câmera:

- `nodes camera list --node <id|nome|ip>`
- `nodes camera snap --node <id|nome|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|nome|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + tela:

- `nodes canvas snapshot --node <id|nome|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|nome|ip> [--target <urlOuCaminho>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|nome|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|nome|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|nome|ip> [--js <código>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|nome|ip> (--jsonl <caminho> | --text <texto>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|nome|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|nome|ip> [--screen <índice>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <caminho>] [--invoke-timeout <ms>]`

Localização:

- `nodes location get --node <id|nome|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## Navegador

CLI de controle de navegador (Chrome/Brave/Edge/Chromium dedicado). Veja [`opencraft browser`](/cli/browser) e a [Ferramenta de navegador](/tools/browser).

Opções comuns:

- `--url`, `--token`, `--timeout`, `--json`
- `--browser-profile <nome>`

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
- `browser create-profile --name <nome> [--color <hex>] [--cdp-url <url>]`
- `browser delete-profile --name <nome>`

Inspecionar:

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <seletor>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <caminho>]`

Ações:

- `browser navigate <url> [--target-id <id>]`
- `browser resize <largura> <altura> [--target-id <id>]`
- `browser click <ref> [--double] [--button <left|right|middle>] [--modifiers <csv>] [--target-id <id>]`
- `browser type <ref> <texto> [--submit] [--slowly] [--target-id <id>]`
- `browser press <tecla> [--target-id <id>]`
- `browser hover <ref> [--target-id <id>]`
- `browser drag <startRef> <endRef> [--target-id <id>]`
- `browser select <ref> <valores...> [--target-id <id>]`
- `browser upload <caminhos...> [--ref <ref>] [--input-ref <ref>] [--element <seletor>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser fill [--fields <json>] [--fields-file <caminho>] [--target-id <id>]`
- `browser dialog --accept|--dismiss [--prompt <texto>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser wait [--time <ms>] [--text <valor>] [--text-gone <valor>] [--target-id <id>]`
- `browser evaluate --fn <código> [--ref <ref>] [--target-id <id>]`
- `browser console [--level <error|warn|info>] [--target-id <id>]`
- `browser pdf [--target-id <id>]`

## Pesquisa de documentação

### `docs [consulta...]`

Pesquise o índice de documentação ativo.

## TUI

### `tui`

Abra a interface de terminal conectada ao Gateway.

Opções:

- `--url <url>`
- `--token <token>`
- `--password <senha>`
- `--session <chave>`
- `--deliver`
- `--thinking <nível>`
- `--message <texto>`
- `--timeout-ms <ms>` (padrão de `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`
