---
summary: "Perguntas frequentemente feitas sobre configuração, configuração e uso de OpenCraft"
read_when:
  - Answering common setup, install, onboarding, or runtime support questions
  - Triaging user-reported issues before deeper debugging
title: "FAQ"
---

# FAQ

Respostas rápidas mais troubleshooting profundo para setups do mundo real (dev local, VPS, multi-agent, OAuth/API keys, model failover). Para diagnósticos de runtime, veja [Troubleshooting](/gateway/troubleshooting). Para a referência de config completa, veja [Configuration](/gateway/configuration).

## Tabela de conteúdos

- [Início rápido e setup de primeira execução]
  - [Estou preso - qual é a forma mais rápida de sair do aperto?](#im-stuck-whats-the-fastest-way-to-get-unstuck)
  - [Qual é a forma recomendada de instalar e configurar OpenCraft?](#whats-the-recommended-way-to-install-and-set-up-opencraft)
  - [Como abro o dashboard após onboarding?](#how-do-i-open-the-dashboard-after-onboarding)
  - [Como autentico o dashboard (token) em localhost vs remoto?](#how-do-i-authenticate-the-dashboard-token-on-localhost-vs-remote)
  - [Qual runtime eu preciso?](#what-runtime-do-i-need)
  - [Roda em Raspberry Pi?](#does-it-run-on-raspberry-pi)
  - [Tem alguma dica para instalações Raspberry Pi?](#any-tips-for-raspberry-pi-installs)
  - [Está preso em "wake up my friend" / onboarding não vai sair do ovo. E agora?](#it-is-stuck-on-wake-up-my-friend-onboarding-will-not-hatch-what-now)
  - [Posso migrar meu setup para uma nova máquina (Mac mini) sem refazer onboarding?](#can-i-migrate-my-setup-to-a-new-machine-mac-mini-without-redoing-onboarding)
  - [Onde vejo o que é novo na última versão?](#where-do-i-see-what-is-new-in-the-latest-version)
  - [Não consigo acessar docs.opencraft.ai (erro SSL). E agora?](#i-cant-access-docsopencraftai-ssl-error-what-now)
  - [Qual é a diferença entre stable e beta?](#whats-the-difference-between-stable-and-beta)
  - [Como instalo a versão beta, e qual é a diferença entre beta e dev?](#how-do-i-install-the-beta-version-and-whats-the-difference-between-beta-and-dev)
  - [Como experimento os últimos bits?](#how-do-i-try-the-latest-bits)
  - [Quanto tempo leva install e onboarding normalmente?](#how-long-does-install-and-onboarding-usually-take)
  - [Installer preso? Como consigo mais feedback?](#installer-stuck-how-do-i-get-more-feedback)
  - [Windows install diz git not found ou opencraft not recognized](#windows-install-says-git-not-found-or-opencraft-not-recognized)
  - [Windows exec output mostra texto chinês garbled - o que devo fazer](#windows-exec-output-shows-garbled-chinese-text-what-should-i-do)
  - [A documentação não respondeu minha pergunta - como consigo uma resposta melhor?](#the-docs-didnt-answer-my-question-how-do-i-get-a-better-answer)
  - [Como instalo OpenCraft em Linux?](#how-do-i-install-opencraft-on-linux)
  - [Como instalo OpenCraft em VPS?](#how-do-i-install-opencraft-on-a-vps)
  - [Onde estão os guias de install cloud/VPS?](#where-are-the-cloudvps-install-guides)
  - [Posso pedir ao OpenCraft para atualizar a si mesmo?](#can-i-ask-opencraft-to-update-itself)
  - [O que onboarding realmente faz?](#what-does-onboarding-actually-do)
  - [Preciso de uma subscrição Claude ou OpenAI para rodar isto?](#do-i-need-a-claude-or-openai-subscription-to-run-this)
  - [Posso usar subscrição Claude Max sem uma API key](#can-i-use-claude-max-subscription-without-an-api-key)
  - [Como Anthropic "setup-token" auth funciona?](#how-does-anthropic-setuptoken-auth-work)
  - [Onde encontro um Anthropic setup-token?](#where-do-i-find-an-anthropic-setuptoken)
  - [Vocês suportam Claude subscription auth (Claude Pro ou Max)?](#do-you-support-claude-subscription-auth-claude-pro-or-max)
  - [Por que estou vendo `HTTP 429: rate_limit_error` de Anthropic?](#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)
  - [AWS Bedrock é suportado?](#is-aws-bedrock-supported)
  - [Como Codex auth funciona?](#how-does-codex-auth-work)
  - [Vocês suportam OpenAI subscription auth (Codex OAuth)?](#do-you-support-openai-subscription-auth-codex-oauth)
  - [Como configuro Gemini CLI OAuth](#how-do-i-set-up-gemini-cli-oauth)
  - [Um modelo local é OK para chats casual?](#is-a-local-model-ok-for-casual-chats)
  - [Como mantenho tráfego de modelo hosted em uma região específica?](#how-do-i-keep-hosted-model-traffic-in-a-specific-region)
  - [Tenho que comprar um Mac Mini para instalar isto?](#do-i-have-to-buy-a-mac-mini-to-install-this)
  - [Preciso de um Mac mini para suporte iMessage?](#do-i-need-a-mac-mini-for-imessage-support)
  - [Se compro um Mac mini para rodar OpenCraft, posso conectá-lo ao meu MacBook Pro?](#if-i-buy-a-mac-mini-to-run-opencraft-can-i-connect-it-to-my-macbook-pro)
  - [Posso usar Bun?](#can-i-use-bun)
  - [Telegram: o que vai em `allowFrom`?](#telegram-what-goes-in-allowfrom)
  - [Múltiplas pessoas podem usar um número WhatsApp com diferentes instâncias OpenCraft?](#can-multiple-people-use-one-whatsapp-number-with-different-opencraft-instances)
  - [Posso rodar um agente "fast chat" e um agente "Opus for coding"?](#can-i-run-a-fast-chat-agent-and-an-opus-for-coding-agent)
  - [Homebrew funciona em Linux?](#does-homebrew-work-on-linux)
  - [Qual é a diferença entre a instalação hackable (git) e npm install?](#whats-the-difference-between-the-hackable-git-install-and-npm-install)
  - [Posso mudar entre npm e git installs depois?](#can-i-switch-between-npm-and-git-installs-later)
  - [Devo rodar o Gateway no meu laptop ou um VPS?](#should-i-run-the-gateway-on-my-laptop-or-a-vps)
  - [Quão importante é rodar OpenCraft em uma máquina dedicada?](#how-important-is-it-to-run-opencraft-on-a-dedicated-machine)
  - [Quais são os requisitos VPS mínimos e SO recomendado?](#what-are-the-minimum-vps-requirements-and-recommended-os)
  - [Posso rodar OpenCraft em VM e quais são os requisitos](#can-i-run-opencraft-in-a-vm-and-what-are-the-requirements)
- [O que é OpenCraft?](#what-is-opencraft)
  - [O que é OpenCraft em um parágrafo?](#what-is-opencraft-in-one-paragraph)
  - [Qual é a proposta de valor?](#whats-the-value-proposition)
  - [Acabei de configurar - o que devo fazer primeiro](#i-just-set-it-up-what-should-i-do-first)
  - [Quais são os cinco principais casos de uso do dia a dia para OpenCraft](#what-are-the-top-five-everyday-use-cases-for-opencraft)
  - [OpenCraft pode ajudar com lead gen outreach ads e blogs para SaaS](#can-opencraft-help-with-lead-gen-outreach-ads-and-blogs-for-a-saas)
  - [Quais são as vantagens vs Claude Code para web development?](#what-are-the-advantages-vs-claude-code-for-web-development)
- [Skills e automação](#skills-and-automation)
  - [Como customizo skills sem manter o repo dirty?](#how-do-i-customize-skills-without-keeping-the-repo-dirty)
  - [Posso carregar skills de uma pasta customizada?](#can-i-load-skills-from-a-custom-folder)
  - [Como posso usar modelos diferentes para tarefas diferentes?](#how-can-i-use-different-models-for-different-tasks)
  - [O bot congela enquanto faz trabalho pesado. Como descarrego isso?](#the-bot-freezes-while-doing-heavy-work-how-do-i-offload-that)
  - [Cron ou reminders não acionam. O que devo verificar?](#cron-or-reminders-do-not-fire-what-should-i-check)
  - [Como instalo skills em Linux?](#how-do-i-install-skills-on-linux)
  - [OpenCraft pode executar tarefas em um cronograma ou continuamente em background?](#can-opencraft-run-tasks-on-a-schedule-or-continuously-in-the-background)
  - [Posso executar skills Apple macOS-only de Linux?](#can-i-run-apple-macos-only-skills-from-linux)
  - [Têm uma integração Notion ou HeyGen?](#do-you-have-a-notion-or-heygen-integration)
  - [Como uso meu Chrome já signed-in existente com OpenCraft?](#how-do-i-use-my-existing-signed-in-chrome-with-opencraft)
- [Sandboxing e memória](#sandboxing-and-memory)
  - [Tem um doc de sandboxing dedicado?](#is-there-a-dedicated-sandboxing-doc)
  - [Como faço bind de uma pasta de host para o sandbox?](#how-do-i-bind-a-host-folder-into-the-sandbox)
  - [Como memória funciona?](#how-does-memory-work)
  - [Memory continua esquecendo coisas. Como faço ficar?](#memory-keeps-forgetting-things-how-do-i-make-it-stick)
  - [Memória persiste para sempre? Quais são os limites?](#does-memory-persist-forever-what-are-the-limits)
  - [Semantic memory search requer uma OpenAI API key?](#does-semantic-memory-search-require-an-openai-api-key)
- [Onde coisas vivem em disco](#where-things-live-on-disk)
  - [Todos os dados usados com OpenCraft são salvos localmente?](#is-all-data-used-with-opencraft-saved-locally)
  - [Onde OpenCraft armazena seus dados?](#where-does-opencraft-store-its-data)
  - [Onde AGENTS.md / SOUL.md / USER.md / MEMORY.md devem viver?](#where-should-agentsmd-soulmd-usermd-memorymd-live)
  - [Qual é a estratégia de backup recomendada?](#whats-the-recommended-backup-strategy)
  - [Como desinstalo completamente OpenCraft?](#how-do-i-completely-uninstall-opencraft)
  - [Agents podem trabalhar fora do workspace?](#can-agents-work-outside-the-workspace)
  - [Estou em remote mode - onde está o session store?](#im-in-remote-mode-where-is-the-session-store)
- [Noções básicas de config](#config-basics)
  - [Qual é o formato da config? Onde está?](#what-format-is-the-config-where-is-it)
  - [Defini `gateway.bind: "lan"` (ou `"tailnet"`) e agora nada escuta / a UI diz unauthorized](#i-set-gatewaybind-lan-or-tailnet-and-now-nothing-listens-the-ui-says-unauthorized)
  - [Por que preciso de token em localhost agora?](#why-do-i-need-a-token-on-localhost-now)
  - [Tenho que reiniciar após mudar config?](#do-i-have-to-restart-after-changing-config)
  - [Como desabilito taglines engraçados de CLI?](#how-do-i-disable-funny-cli-taglines)
  - [Como habilito web search (e web fetch)?](#how-do-i-enable-web-search-and-web-fetch)
  - [config.apply limpou meu config. Como recupero e evito isto?](#configapply-wiped-my-config-how-do-i-recover-and-avoid-this)
  - [Como rodo um central Gateway com specialized workers em devices?](#how-do-i-run-a-central-gateway-with-specialized-workers-across-devices)
  - [O browser OpenCraft pode rodar headless?](#can-the-opencraft-browser-run-headless)
  - [Como uso Brave para controle de browser?](#how-do-i-use-brave-for-browser-control)
- [Gateways remotos e nodes](#remote-gateways-and-nodes)
  - [Como commands se propagam entre Telegram, o gateway, e nodes?](#how-do-commands-propagate-between-telegram-the-gateway-and-nodes)
  - [Como meu agent pode acessar meu computador se o Gateway é hosted remotamente?](#how-can-my-agent-access-my-computer-if-the-gateway-is-hosted-remotely)
  - [Tailscale está conectado mas não consigo respostas. E agora?](#tailscale-is-connected-but-i-get-no-replies-what-now)
  - [Duas instâncias OpenCraft podem conversar uma com a outra (local + VPS)?](#can-two-opencraft-instances-talk-to-each-other-local-vps)
  - [Preciso VPSes separadas para múltiplos agents](#do-i-need-separate-vpses-for-multiple-agents)
  - [Tem um benefício usar um node no meu laptop pessoal em vez de SSH de VPS?](#is-there-a-benefit-to-using-a-node-on-my-personal-laptop-instead-of-ssh-from-a-vps)
  - [Nodes rodam um serviço gateway?](#do-nodes-run-a-gateway-service)
  - [Tem um jeito API / RPC de aplicar config?](#is-there-an-api-rpc-way-to-apply-config)
  - [Qual é uma config minimal "sane" para first install?](#whats-a-minimal-sane-config-for-a-first-install)
  - [Como configuro Tailscale em VPS e conecto de Mac?](#how-do-i-set-up-tailscale-on-a-vps-and-connect-from-my-mac)
  - [Como conecto um Mac node a um remote Gateway (Tailscale Serve)?](#how-do-i-connect-a-mac-node-to-a-remote-gateway-tailscale-serve)
  - [Devo instalar em um segundo laptop ou apenas adicionar um node?](#should-i-install-on-a-second-laptop-or-just-add-a-node)
- [Env vars e .env loading](#env-vars-and-env-loading)
  - [Como OpenCraft carrega variáveis de ambiente?](#how-does-opencraft-load-environment-variables)
  - ["Iniciei o Gateway via o serviço e minhas env vars desapareceram." E agora?](#i-started-the-gateway-via-the-service-and-my-env-vars-disappeared-what-now)
  - [Defini `COPILOT_GITHUB_TOKEN`, mas models status mostra "Shell env: off." Por quê?](#i-set-copilotgithubtoken-but-models-status-shows-shell-env-off-why)
- [Sessions e múltiplos chats](#sessions-and-multiple-chats)
  - [Como inicio uma conversa fresca?](#how-do-i-start-a-fresh-conversation)
  - [Sessions resetam automaticamente se nunca envio `/new`?](#do-sessions-reset-automatically-if-i-never-send-new)
  - [Tem um jeito fazer um time de instâncias OpenCraft um CEO e muitos agents](#is-there-a-way-to-make-a-team-of-opencraft-instances-one-ceo-and-many-agents)
  - [Por que context foi truncado mid-task? Como previno?](#why-did-context-get-truncated-midtask-how-do-i-prevent-it)
  - [Como resetar completamente OpenCraft mas manter instalado?](#how-do-i-completely-reset-opencraft-but-keep-it-installed)
  - [Estou recebendo erros "context too large" - como resetar ou compact?](#im-getting-context-too-large-errors-how-do-i-reset-or-compact)
  - [Por que estou vendo "LLM request rejected: messages.content.tool_use.input field required"?](#why-am-i-seeing-llm-request-rejected-messagescontenttool_useinput-field-required)
  - [Por que estou recebendo heartbeat messages a cada 30 minutos?](#why-am-i-getting-heartbeat-messages-every-30-minutes)
  - [Preciso adicionar uma "bot account" para um grupo WhatsApp?](#do-i-need-to-add-a-bot-account-to-a-whatsapp-group)
  - [Como consigo o JID de um grupo WhatsApp?](#how-do-i-get-the-jid-of-a-whatsapp-group)
  - [Por que OpenCraft não responde em um grupo?](#why-doesnt-opencraft-reply-in-a-group)
  - [Grupos/threads compartilham context com DMs?](#do-groupsthreads-share-context-with-dms)
  - [Quantos workspaces e agents posso criar?](#how-many-workspaces-and-agents-can-i-create)
  - [Posso rodar múltiplos bots ou chats ao mesmo tempo (Slack), e como deveria setup?](#can-i-run-multiple-bots-or-chats-at-the-same-time-slack-and-how-should-i-set-that-up)
- [Models: padrões, seleção, aliases, switching](#models-defaults-selection-aliases-switching)
  - [O que é o "default model"?](#what-is-the-default-model)
  - [Qual model você recomenda?](#what-model-do-you-recommend)
  - [Como mudo models sem limpar minha config?](#how-do-i-switch-models-without-wiping-my-config)
  - [Posso usar self-hosted models (llama.cpp, vLLM, Ollama)?](#can-i-use-selfhosted-models-llamacpp-vllm-ollama)
  - [O que OpenCraft, Flawd, e Krill usam para models?](#what-do-opencraft-flawd-and-krill-use-for-models)
  - [Como mudo models on the fly (sem reiniciar)?](#how-do-i-switch-models-on-the-fly-without-restarting)
  - [Posso usar GPT 5.2 para tarefas diárias e Codex 5.3 para coding](#can-i-use-gpt-52-for-daily-tasks-and-codex-53-for-coding)
  - [Por que vejo "Model … is not allowed" e depois sem resposta?](#why-do-i-see-model-is-not-allowed-and-then-no-reply)
  - [Por que vejo "Unknown model: minimax/MiniMax-M2.5"?](#why-do-i-see-unknown-model-minimaxminimaxm25)
  - [Posso usar MiniMax como meu default e OpenAI para tarefas complexas?](#can-i-use-minimax-as-my-default-and-openai-for-complex-tasks)
  - [Are opus / sonnet / gpt atalhos built-in?](#are-opus-sonnet-gpt-builtin-shortcuts)
  - [Como defino/sobrescrevo model shortcuts (aliases)?](#how-do-i-defineoverride-model-shortcuts-aliases)
  - [Como adiciono models de outros providers como OpenRouter ou Z.AI?](#how-do-i-add-models-from-other-providers-like-openrouter-or-zai)
- [Model failover e "All models failed"](#model-failover-and-all-models-failed)
  - [Como failover funciona?](#how-does-failover-work)
  - [O que esse erro significa?](#what-does-this-error-mean)
  - [Fix checklist para `No credentials found for profile "anthropic:default"`](#fix-checklist-for-no-credentials-found-for-profile-anthropicdefault)
  - [Por que também tentou Google Gemini e falhou?](#why-did-it-also-try-google-gemini-and-fail)
- [Auth profiles: o que são e como gerenciar](#auth-profiles-what-they-are-and-how-to-manage-them)
  - [O que é um auth profile?](#what-is-an-auth-profile)
  - [Quais são IDs de profile típicos?](#what-are-typical-profile-ids)
  - [Posso controlar qual auth profile é tentado primeiro?](#can-i-control-which-auth-profile-is-tried-first)
  - [OAuth vs API key: qual é a diferença?](#oauth-vs-api-key-whats-the-difference)
- [Gateway: ports, "already running", e remote mode](#gateway-ports-already-running-and-remote-mode)
  - [Qual porta o Gateway usa?](#what-port-does-the-gateway-use)
  - [Por que `opencraft gateway status` diz `Runtime: running` mas `RPC probe: failed`?](#why-does-opencraft-gateway-status-say-runtime-running-but-rpc-probe-failed)
  - [Por que `opencraft gateway status` mostra `Config (cli)` e `Config (service)` diferentes?](#why-does-opencraft-gateway-status-show-config-cli-and-config-service-different)
  - [O que significa "another gateway instance is already listening"?](#what-does-another-gateway-instance-is-already-listening-mean)
  - [Como rodo OpenCraft em remote mode (client conecta a Gateway em outro lugar)?](#how-do-i-run-opencraft-in-remote-mode-client-connects-to-a-gateway-elsewhere)
  - [O Control UI diz "unauthorized" (ou continua reconectando). E agora?](#the-control-ui-says-unauthorized-or-keeps-reconnecting-what-now)
  - [Defini `gateway.bind: "tailnet"` mas não consegue bind / nada escuta](#i-set-gatewaybind-tailnet-but-it-cant-bind-nothing-listens)
  - [Posso rodar múltiplos Gateways no mesmo host?](#can-i-run-multiple-gateways-on-the-same-host)
  - [O que "invalid handshake" / code 1008 significa?](#what-does-invalid-handshake-code-1008-mean)
- [Logging e debugging](#logging-and-debugging)
  - [Onde estão logs?](#where-are-logs)
  - [Como inicio/parar/reiniciar o serviço Gateway?](#how-do-i-startstoprestart-the-gateway-service)
  - [Fechei meu terminal em Windows - como reinicio OpenCraft?](#i-closed-my-terminal-on-windows-how-do-i-restart-opencraft)
  - [O Gateway está up mas respostas nunca chegam. O que devo verificar?](#the-gateway-is-up-but-replies-never-arrive-what-should-i-check)
  - ["Disconnected from gateway: no reason" - e agora?](#disconnected-from-gateway-no-reason-what-now)
  - [Telegram setMyCommands falha. O que devo verificar?](#telegram-setmycommands-fails-what-should-i-check)
  - [TUI mostra sem output. O que devo verificar?](#tui-shows-no-output-what-should-i-check)
  - [Como paro completamente depois inicio o Gateway?](#how-do-i-completely-stop-then-start-the-gateway)
  - [ELI5: `opencraft gateway restart` vs `opencraft gateway`](#eli5-opencraft-gateway-restart-vs-opencraft-gateway)
  - [Qual é a forma mais rápida de conseguir mais detalhes quando algo falha?](#whats-the-fastest-way-to-get-more-details-when-something-fails)
- [Mídia e attachments](#media-and-attachments)
  - [Minha skill gerou uma imagem/PDF, mas nada foi enviado](#my-skill-generated-an-imagepdf-but-nothing-was-sent)
- [Segurança e access control](#security-and-access-control)
  - [É seguro expor OpenCraft para DMs inbound?](#is-it-safe-to-expose-opencraft-to-inbound-dms)
  - [Prompt injection é apenas uma preocupação para bots públicos?](#is-prompt-injection-only-a-concern-for-public-bots)
  - [Meu bot deveria ter seu próprio email GitHub account ou número de telefone](#should-my-bot-have-its-own-email-github-account-or-phone-number)
  - [Posso dar a ele autonomia sobre minhas mensagens de texto e é seguro](#can-i-give-it-autonomy-over-my-text-messages-and-is-that-safe)
  - [Posso usar modelos mais baratos para personal assistant tasks?](#can-i-use-cheaper-models-for-personal-assistant-tasks)
  - [Executei `/start` em Telegram mas não recebi um pairing code](#i-ran-start-in-telegram-but-didnt-get-a-pairing-code)
  - [WhatsApp: ele vai mensagear meus contatos? Como pairing funciona?](#whatsapp-will-it-message-my-contacts-how-does-pairing-work)
- [Comandos de chat, aborting tasks, e "não vai parar"](#chat-commands-aborting-tasks-and-it-wont-stop)
  - [Como paro internal system messages de aparecer em chat](#how-do-i-stop-internal-system-messages-from-showing-in-chat)
  - [Como paro/cancelo uma tarefa rodando?](#how-do-i-stopcancel-a-running-task)
  - [Como envio uma mensagem Discord de Telegram? ("Cross-context messaging denied")](#how-do-i-send-a-discord-message-from-telegram-crosscontext-messaging-denied)
  - [Por que parece que o bot "ignora" rapid-fire messages?](#why-does-it-feel-like-the-bot-ignores-rapidfire-messages)

## Primeiro 60 segundos se algo está quebrado

1. **Status rápido (primeira verificação)**

   ```bash
   opencraft status
   ```

   Sumário local rápido: SO + atualização, reachabilidade de gateway/serviço, agents/sessions, provider config + runtime issues (quando gateway é alcançável).

2. **Relatório pastável (seguro de compartilhar)**

   ```bash
   opencraft status --all
   ```

   Diagnóstico read-only com tail de log (tokens redacted).

3. **Daemon + port state**

   ```bash
   opencraft gateway status
   ```

   Mostra runtime de supervisor vs reachabilidade RPC, a URL alvo do probe, e qual config o serviço provavelmente usou.

4. **Deep probes**

   ```bash
   opencraft status --deep
   ```

   Executa gateway health checks + provider probes (requer gateway alcançável). Veja [Health](/gateway/health).

5. **Tail do log latest**

   ```bash
   opencraft logs --follow
   ```

   Se RPC está down, caia de volta para:

   ```bash
   tail -f "$(ls -t /tmp/editzffaleta/OpenCraft-*.log | head -1)"
   ```

   File logs são separadas de service logs; veja [Logging](/logging) e [Troubleshooting](/gateway/troubleshooting).

6. **Execute o doctor (repairs)**

   ```bash
   opencraft doctor
   ```

   Repara/migra config/state + executa health checks. Veja [Doctor](/gateway/doctor).

7. **Gateway snapshot**

   ```bash
   opencraft health --json
   opencraft health --verbose   # shows the target URL + config path on errors
   ```

   Pergunta ao gateway rodando por um snapshot completo (WS-only). Veja [Health](/gateway/health).

## Início rápido e setup de primeira execução

### Estou preso - qual é a forma mais rápida de sair do aperto

Use um agent AI local que pode **ver sua máquina**. Isto é muito mais efetivo que perguntar em Discord, porque a maioria dos "Estou preso" cases são **configuração local ou problemas de ambiente** que helpers remotos não conseguem inspecionar.

- **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
- **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

Essas ferramentas podem ler o repo, executar comandos, inspecionar logs, e ajudar a consertar sua máquina setup (PATH, serviços, permissões, arquivos de auth). Dê a eles o **full source checkout** via a instalação hackable (git):

```bash
curl -fsSL https://opencraft.ai/install.sh | bash -s -- --install-method git
```

Isto instala OpenCraft **de um checkout git**, então o agent pode ler o código + docs e raciocinar sobre a versão exata que você está rodando. Você sempre pode mudar de volta para stable depois re-executando o instalador sem `--install-method git`.

Dica: peça ao agent para **planejar e supervisionar** o fix (passo-a-passo), depois execute apenas os comandos necessários. Isto mantém mudanças pequenas e mais fácil de auditar.

Se você descobre um bug real ou fix, por favor file uma GitHub issue ou envie um PR:
[https://github.com/editzffaleta/OpenCraft/issues](https://github.com/editzffaleta/OpenCraft/issues)
[https://github.com/editzffaleta/OpenCraft/pulls](https://github.com/editzffaleta/OpenCraft/pulls)

Comece com estes comandos (compartilhe saídas quando pedindo ajuda):

```bash
opencraft status
opencraft models status
opencraft doctor
```

O que fazem:

- `opencraft status`: snapshot rápido de saúde de gateway/agent + config básica.
- `opencraft models status`: verifica auth de provider + disponibilidade de model.
- `opencraft doctor`: valida e repara problemas comuns de config/state.

Outros checks CLI úteis: `opencraft status --all`, `opencraft logs --follow`,
`opencraft gateway status`, `opencraft health --verbose`.

Quick debug loop: [Primeiro 60 segundos se algo está quebrado](#first-60-seconds-if-somethings-broken).
Docs de install: [Install](/install), [Installer flags](/install/installer), [Updating](/install/updating).

### Qual é a forma recomendada de instalar e configurar OpenCraft

O repo recomenda rodar do source e usar onboarding:

```bash
curl -fsSL https://opencraft.ai/install.sh | bash
opencraft onboard --install-daemon
```

O wizard também pode construir UI assets automaticamente. Após onboarding, você tipicamente roda o Gateway na porta **18789**.

Do source (contributors/dev):

```bash
git clone https://github.com/editzffaleta/OpenCraft.git
cd opencraft
pnpm install
pnpm build
pnpm ui:build # auto-installs UI deps on first run
opencraft onboard
```

Se você não tem uma instalação global ainda, rode via `pnpm opencraft onboard`.

### Como abro o dashboard após onboarding

O wizard abre seu navegador com uma URL de dashboard limpa (não-tokenizada) bem após onboarding e também imprime o link no sumário. Mantenha essa aba aberta; se não lançou, copie/cole a URL impressa na mesma máquina.

### Como autentico o dashboard (token) em localhost vs remoto

**Localhost (mesma máquina):**

- Abra `http://127.0.0.1:18789/`.
- Se pedir auth, cole o token de `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`) para settings do Control UI.
- Recupere do gateway host: `opencraft config get gateway.auth.token` (ou gere um: `opencraft doctor --generate-gateway-token`).

**Não em localhost:**

- **Tailscale Serve** (recomendado): mantenha bind loopback, execute `opencraft gateway --tailscale serve`, abra `https://<magicdns>/`. Se `gateway.auth.allowTailscale` é `true`, identity headers satisfazem Control UI/WebSocket auth (sem token, assume gateway host confiável); HTTP APIs ainda requerem token/password.
- **Tailnet bind**: execute `opencraft gateway --bind tailnet --token "<token>"`, abra `http://<tailscale-ip>:18789/`, cole token em settings de dashboard.
- **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` depois abra `http://127.0.0.1:18789/` e cole o token em settings do Control UI.

Veja [Dashboard](/web/dashboard) e [Web surfaces](/web) para bind modes e detalhes de auth.

### Qual runtime eu preciso

Node **>= 22** é requerido. `pnpm` é recomendado. Bun é **não recomendado** para o Gateway.

### Roda em Raspberry Pi

Sim. O Gateway é lightweight - docs listam **512MB-1GB RAM**, **1 core**, e aproximadamente **500MB** disco como suficiente para uso pessoal, e nota que um **Raspberry Pi 4 pode rodá-lo**.

Se você quer headroom extra (logs, mídia, outros serviços), **2GB é recomendado**, mas não é um mínimo duro.

Dica: um Pi/VPS pequeno pode hospedar o Gateway, e você pode parear **nodes** em seu laptop/phone para local screen/camera/canvas ou execução de comando. Veja [Nodes](/nodes).

### Tem alguma dica para instalações Raspberry Pi

Versão curta: funciona, mas espere rough edges.

- Use um SO **64-bit** e mantenha Node >= 22.
- Prefira a **instalação hackable (git)** para que você possa ver logs e atualizar rápido.
- Comece sem channels/skills, depois adicione um por um.
- Se você bater em problemas binários estranhos, é geralmente um **problema de compatibilidade ARM**.

Docs: [Linux](/platforms/linux), [Install](/install).

### Está preso em "wake up my friend" / onboarding não vai sair do ovo. E agora

Essa tela depende do Gateway ser alcançável e autenticado. O TUI também envia "Wake up, my friend!" automaticamente na primeira eclosão. Se você vê essa linha com **sem resposta** e tokens em 0, o agent nunca rodou.

1. Reinicie o Gateway:

```bash
opencraft gateway restart
```

2. Verifique status + auth:

```bash
opencraft status
opencraft models status
opencraft logs --follow
```

3. Se ainda pendurar, execute:

```bash
opencraft doctor
```

Se o Gateway é remoto, garanta que a tunnel/Tailscale connection está up e que a UI está apontada para o Gateway correto. Veja [Remote access](/gateway/remote).

### Posso migrar meu setup para uma nova máquina (Mac mini) sem refazer onboarding

Sim. Copie o **diretório state** e **workspace**, depois execute Doctor uma vez. Isto mantém seu bot "exatamente igual" (memory, session history, auth, e channel state) contanto que você copie **ambas** localizações:

1. Instale OpenCraft na máquina nova.
2. Copie `$OPENCRAFT_STATE_DIR` (padrão: `~/.opencraft`) da máquina velha.
3. Copie seu workspace (padrão: `~/.opencraft/workspace`).
4. Execute `opencraft doctor` e reinicie o serviço Gateway.

Isto preserva config, auth profiles, credenciais WhatsApp, sessions, e memory. Se você está em remote mode, lembre que o gateway host é o dono do session store e workspace.

**Importante:** se você apenas commit/push seu workspace para GitHub, você está fazendo backup de **memory + bootstrap files**, mas **não** session history ou auth. Aqueles vivem sob `~/.opencraft/` (por exemplo `~/.opencraft/agents/<agentId>/sessions/`).

Related: [Migrating](/install/migrating), [Onde coisas vivem em disco](/help/faq#where-does-opencraft-store-its-data), [Agent workspace](/concepts/agent-workspace), [Doctor](/gateway/doctor), [Remote mode](/gateway/remote).

### Onde vejo o que é novo na última versão

Verifique o changelog de GitHub:
[https://github.com/editzffaleta/OpenCraft/blob/main/CHANGELOG.md](https://github.com/editzffaleta/OpenCraft/blob/main/CHANGELOG.md)

Entradas mais novas estão no topo. Se a seção top é marcada **Unreleased**, a próxima seção dated é a versão shipped latest. Entradas são agrupadas por **Highlights**, **Changes**, e **Fixes** (mais seções docs/other quando necessário).

### Não consigo acessar docs.opencraft.ai (erro SSL). E agora

Algumas conexões Comcast/Xfinity incorretamente bloqueiam `docs.opencraft.ai` via Xfinity Advanced Security. Desabilite ou allowlist `docs.opencraft.ai`, depois retry. Mais detalhe: [Troubleshooting](/help/troubleshooting#docsopencraftai-shows-an-ssl-error-comcastxfinity).
Por favor ajude-nos a desbloquear relatando aqui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

Se você ainda não consegue alcançar o site, os docs são espelhados no GitHub:
[https://github.com/editzffaleta/OpenCraft/tree/main/docs](https://github.com/editzffaleta/OpenCraft/tree/main/docs)

### Qual é a diferença entre stable e beta

**Stable** e **beta** são **npm dist-tags**, não linhas de código separadas:

- `latest` = stable
- `beta` = early build para testing

Nós enviamos builds para **beta**, testamos, e uma vez que um build é sólido nós **promovemos essa mesma versão para `latest`**. É por isso que beta e stable podem apontar para a **mesma versão**.

Veja o que mudou:
[https://github.com/editzffaleta/OpenCraft/blob/main/CHANGELOG.md](https://github.com/editzffaleta/OpenCraft/blob/main/CHANGELOG.md)

### Como instalo a versão beta, e qual é a diferença entre beta e dev

**Beta** é a npm dist-tag `beta` (pode corresponder `latest`).
**Dev** é o moving head de `main` (git); quando publicado, usa a npm dist-tag `dev`.

One-liners (macOS/Linux):

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install.sh | bash -s -- --beta
```

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install.sh | bash -s -- --install-method git
```

Windows installer (PowerShell):
[https://opencraft.ai/install.ps1](https://opencraft.ai/install.ps1)

Mais detalhe: [Development channels](/install/development-channels) e [Installer flags](/install/installer).

### Quanto tempo leva install e onboarding normalmente

Guia rough:

- **Install:** 2-5 minutos
- **Onboarding:** 5-15 minutos dependendo de quantos channels/modelos você configura

Se pendurar, use [Installer preso](/help/faq#installer-stuck-how-do-i-get-more-feedback) e o fast debug loop em [Estou preso](/help/faq#im-stuck--whats-the-fastest-way-to-get-unstuck).

### Como experimento os últimos bits

Duas opções:

1. **Dev channel (git checkout):**

```bash
opencraft update --channel dev
```

Isto muda para o branch `main` e atualiza do source.

2. **Instalação hackable (do site do instalador):**

```bash
curl -fsSL https://opencraft.ai/install.sh | bash -s -- --install-method git
```

Isto dá a você um repo local que você pode editar, depois atualizar via git.

Se você prefere um clone limpo manualmente, use:

```bash
git clone https://github.com/editzffaleta/OpenCraft.git
cd opencraft
pnpm install
pnpm build
```

Docs: [Update](/cli/update), [Development channels](/install/development-channels), [Install](/install).

### Installer preso? Como consigo mais feedback

Re-execute o instalador com **verbose output**:

```bash
curl -fsSL https://opencraft.ai/install.sh | bash -s -- --verbose
```

Beta install com verbose:

```bash
curl -fsSL https://opencraft.ai/install.sh | bash -s -- --beta --verbose
```

Para uma instalação hackable (git):

```bash
curl -fsSL https://opencraft.ai/install.sh | bash -s -- --install-method git --verbose
```

Windows (PowerShell) equivalente:

```powershell
# install.ps1 não tem flag -Verbose dedicada ainda.
Set-PSDebug -Trace 1
& ([scriptblock]::Create((iwr -useb https://opencraft.ai/install.ps1))) -NoOnboard
Set-PSDebug -Trace 0
```

Mais opções: [Installer flags](/install/installer).

### Windows install diz git not found ou opencraft not recognized

Dois problemas comuns de Windows:

**1) erro npm spawn git / git not found**

- Instale **Git for Windows** e tenha certeza que `git` está em seu PATH.
- Feche e reabra PowerShell, depois re-execute o instalador.

**2) opencraft is not recognized após install**

- Sua pasta npm global bin não está em PATH.
- Verifique o path:

  ```powershell
  npm config get prefix
  ```

- Adicione aquele diretório ao seu user PATH (sem sufixo `\bin` necessário em Windows; em muitos sistemas é `%AppData%\npm`).
- Feche e reabra PowerShell após atualizar PATH.

Se você quer o mais smoothest Windows setup, use **WSL2** em vez de Windows nativo.
Docs: [Windows](/platforms/windows).

### Windows exec output mostra texto chinês garbled - o que devo fazer

Isto é geralmente um mismatch de console code page em shells Windows nativos.

Sintomas:

- `system.run`/`exec` output renderiza chinês como mojibake
- O mesmo comando parece fino em outro terminal profile

Quick workaround em PowerShell:

```powershell
chcp 65001
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
```

Depois reinicie o Gateway e retry seu comando:

```powershell
opencraft gateway restart
```

Se você ainda reproduz isto em latest OpenCraft, track/report em:

- [Issue #30640](https://github.com/editzffaleta/OpenCraft/issues/30640)

### A documentação não respondeu minha pergunta - como consigo uma resposta melhor

Use a **instalação hackable (git)** para que você tenha o full source e docs localmente, depois pergunte seu bot (ou Claude/Codex) _de aquele folder_ para que possa ler o repo e responder precisamente.

```bash
curl -fsSL https://opencraft.ai/install.sh | bash -s -- --install-method git
```

Mais detalhe: [Install](/install) e [Installer flags](/install/installer).

### Como instalo OpenCraft em Linux

Resposta curta: siga o guia Linux, depois execute onboarding.

- Caminho rápido Linux + serviço install: [Linux](/platforms/linux).
- Walkthrough completo: [Getting Started](/start/getting-started).
- Installer + atualizações: [Install & updates](/install/updating).

### Como instalo OpenCraft em VPS

Qualquer VPS Linux funciona. Instale no servidor, depois use SSH/Tailscale para alcançar o Gateway.

Guias: [exe.dev](/install/exe-dev), [Hetzner](/install/hetzner), [Fly.io](/install/fly).
Acesso remoto: [Gateway remote](/gateway/remote).

### Onde estão os guias de install cloud/VPS

Nós mantemos um **hosting hub** com os providers comuns. Escolha um e siga o guia:

- [VPS hosting](/vps) (todos os providers em um lugar)
- [Fly.io](/install/fly)
- [Hetzner](/install/hetzner)
- [exe.dev](/install/exe-dev)

Como funciona na cloud: o **Gateway roda no servidor**, e você acessa de seu laptop/phone via Control UI (ou Tailscale/SSH). Seu state + workspace vivem no servidor, então trate o host como a source of truth e faça backup.

Você pode parear **nodes** (Mac/iOS/Android/headless) para aquele cloud Gateway para acessar screen/camera/canvas local ou rodar comandos em seu laptop enquanto mantém o Gateway na cloud.

Hub: [Platforms](/platforms). Acesso remoto: [Gateway remote](/gateway/remote).
Nodes: [Nodes](/nodes), [Nodes CLI](/cli/nodes).

### Posso pedir ao OpenCraft para atualizar a si mesmo

Resposta curta: **possível, não recomendado**. O fluxo de atualização pode reiniciar o Gateway (que droppa a sessão ativa), pode precisar um checkout git limpo, e pode promover para confirmação. Mais seguro: execute atualizações de um shell como o operador.

Use o CLI:

```bash
opencraft update
opencraft update status
opencraft update --channel stable|beta|dev
opencraft update --tag <dist-tag|version>
opencraft update --no-restart
```

Se você deve automatizar de um agent:

```bash
opencraft update --yes --no-restart
opencraft gateway restart
```

Docs: [Update](/cli/update), [Updating](/install/updating).

### O que onboarding realmente faz

`opencraft onboard` é o caminho de setup recomendado. Em **modo local** ele caminha através:

- **Model/auth setup** (flows OAuth/setup-token de provider e API keys suportadas, mais opções de modelo local como LM Studio)
- **Workspace** localização + bootstrap files
- **Gateway settings** (bind/port/auth/tailscale)
- **Providers** (WhatsApp, Telegram, Discord, Mattermost (plugin), Signal, iMessage)
- **Daemon install** (LaunchAgent em macOS; systemd user unit em Linux/WSL2)
- **Health checks** e **skills** seleção

Também avisa se seu modelo configurado é desconhecido ou missing auth.

### Preciso de uma subscrição Claude ou OpenAI para rodar isto

Não. Você pode rodar OpenCraft com **API keys** (Anthropic/OpenAI/others) ou com **modelos local-only** para que seus dados fiquem em seu device. Subscrições (Claude Pro/Max ou OpenAI Codex) são formas opcionais de autenticar aqueles providers.

Se você escolhe Anthropic subscription auth, decida por você mesmo se usá-la: Anthropic bloqueou algumas subscriptions usage fora do Claude Code no passado.
OpenAI Codex OAuth é explicitamente suportado para ferramentas externas como OpenCraft.

Docs: [Anthropic](/providers/anthropic), [OpenAI](/providers/openai), [Local models](/gateway/local-models), [Models](/concepts/models).

### Posso usar subscrição Claude Max sem uma API key

Sim. Você pode autenticar com um **setup-token** em vez de um API key. Este é o caminho de subscription.

Subscrições Claude Pro/Max **não incluem um API key**, então este é o caminho técnico para contas de subscription. Mas esta é sua decisão: Anthropic bloqueou algumas subscription usage fora do Claude Code no passado.
Se você quer o caminho mais claro e seguro para produção, use um Anthropic API key.

### Como Anthropic "setup-token" auth funciona

`claude setup-token` gera uma **string token** via o Claude Code CLI (não está disponível no console web). Você pode executá-lo em **qualquer máquina**. Escolha **Anthropic token (paste setup-token)** em onboarding ou cole com `opencraft models auth paste-token --provider anthropic`. O token é armazenado como um auth profile para o provider **anthropic** e usado como um API key (sem auto-refresh). Mais detalhe: [OAuth](/concepts/oauth).

### Onde encontro um Anthropic setuptoken

Não está **não** no Anthropic Console. O setup-token é gerado pelo **Claude Code CLI** em **qualquer máquina**:

```bash
claude setup-token
```

Copie o token que imprime, depois escolha **Anthropic token (paste setup-token)** em onboarding. Se você quer executá-lo no gateway host, use `opencraft models auth setup-token --provider anthropic`. Se você rodou `claude setup-token` em outro lugar, cole no gateway host com `opencraft models auth paste-token --provider anthropic`. Veja [Anthropic](/providers/anthropic).

### Vocês suportam Claude subscription auth (Claude Pro ou Max)

Sim - via **setup-token**. OpenCraft não reutiliza mais tokens OAuth do Claude Code CLI; use um setup-token ou um Anthropic API key. Gere o token em qualquer lugar e cole no gateway host. Veja [Anthropic](/providers/anthropic) e [OAuth](/concepts/oauth).

Importante: isto é compatibilidade técnica, não uma garantia de política. Anthropic bloqueou alguns subscription usage fora do Claude Code no passado.
Você precisa decidir se usá-lo e verificar os termos atuais de Anthropic.
Para produção ou workloads multi-usuário, Anthropic API key auth é a escolha mais segura e recomendada.

### Por que estou vendo `HTTP 429: rate_limit_error` de Anthropic

Isto significa sua **quota/rate limit Anthropic** está esgotada para a janela atual. Se você usa uma **subscrição Claude** (setup-token), aguarde a janela resetar ou atualize seu plano. Se você usa um **Anthropic API key**, verifique o Anthropic Console para uso/billing e aumente limites conforme necessário.

Se a mensagem é especificamente:
`Extra usage is required for long context requests`, o pedido está tentando usar beta de contexto longo 1M de Anthropic (`context1m: true`). Isto apenas funciona quando sua credencial é elegível para long-context billing (API key billing ou subscription com Extra Usage habilitado).

Dica: defina um **fallback model** para que OpenCraft possa continuar respondendo enquanto um provider é rate-limited.
Veja [Models](/cli/models), [OAuth](/concepts/oauth), e [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

### AWS Bedrock é suportado

Sim - via provider **Amazon Bedrock (Converse)** de pi-ai com **config manual**. Você deve fornecer credenciais/região AWS no gateway host e adicionar uma entrada de provider Bedrock em sua models config. Veja [Amazon Bedrock](/providers/bedrock) e [Model providers](/providers/models). Se você prefere um fluxo de key gerenciado, um proxy OpenAI-compatível em frente do Bedrock ainda é uma opção válida.

### Como Codex auth funciona

OpenCraft suporta **OpenAI Code (Codex)** via OAuth (sign-in ChatGPT). Onboarding pode rodar o fluxo OAuth e defina o default model para `openai-codex/gpt-5.4` quando apropriado. Veja [Model providers](/concepts/model-providers) e [Onboarding (CLI)](/start/wizard).

### Vocês suportam OpenAI subscription auth (Codex OAuth)

Sim. OpenCraft completamente suporta **OpenAI Code (Codex) subscription OAuth**.
OpenAI explicitamente permite subscription OAuth usage em ferramentas/fluxos externos como OpenCraft. Onboarding pode rodar o fluxo OAuth para você.

Veja [OAuth](/concepts/oauth), [Model providers](/concepts/model-providers), e [Onboarding (CLI)](/start/wizard).

### Como configuro Gemini CLI OAuth

Gemini CLI usa um **plugin auth flow**, não um client id ou secret em `opencraft.json`.

Passos:

1. Habilite o plugin: `opencraft plugins enable google`
2. Login: `opencraft models auth login --provider google-gemini-cli --set-default`

Isto armazena tokens OAuth em auth profiles no gateway host. Detalhes: [Model providers](/concepts/model-providers).

### Um modelo local é OK para chats casual

Normalmente não. OpenCraft precisa de large context + segurança forte; cartões pequenos truncam e vazam. Se você deve, execute o **maior** build de MiniMax M2.5 que você pode localmente (LM Studio) e veja [/gateway/local-models](/gateway/local-models). Modelos menores/quantizados aumentam risk de prompt-injection - veja [Security](/gateway/security).

### Como mantenho tráfego de modelo hosted em uma região específica

Escolha endpoints pinned por região. OpenRouter expõe opções hosted em US para MiniMax, Kimi, e GLM; escolha a variante hosted em US para manter dados in-region. Você ainda pode listar Anthropic/OpenAI lado a lado usando `models.mode: "merge"` para que fallbacks permaneçam disponíveis enquanto respeitam o provider regioned que você seleciona.

### Tenho que comprar um Mac Mini para instalar isto

Não. OpenCraft roda em macOS ou Linux (Windows via WSL2). Um Mac mini é opcional - algumas pessoas compram um como um host always-on, mas um VPS pequeno, home server, ou caixa Raspberry Pi-class também funciona.

Você apenas precisa um Mac **para ferramentas macOS-only**. Para iMessage, use [BlueBubbles](/channels/bluebubbles) (recomendado) - o servidor BlueBubbles roda em qualquer Mac, e o Gateway pode rodar em Linux ou em outro lugar. Se você quer outras ferramentas macOS-only, rode o Gateway em um Mac ou pareie um node macOS.

Docs: [BlueBubbles](/channels/bluebubbles), [Nodes](/nodes), [Mac remote mode](/platforms/mac/remote).

### Preciso de um Mac mini para suporte iMessage

Você precisa de **algum device macOS** signed em Messages. **Não** tem que ser um Mac mini - qualquer Mac funciona. **Use [BlueBubbles](/channels/bluebubbles)** (recomendado) para iMessage - o servidor BlueBubbles roda em macOS, enquanto o Gateway pode rodar em Linux ou em outro lugar.

Setups comuns:

- Rode o Gateway em Linux/VPS, e rode o servidor BlueBubbles em qualquer Mac signed em Messages.
- Rode tudo no Mac se você quer o setup single-machine mais simples.

Docs: [BlueBubbles](/channels/bluebubbles), [Nodes](/nodes), [Mac remote mode](/platforms/mac/remote).

### Se compro um Mac mini para rodar OpenCraft, posso conectá-lo ao meu MacBook Pro

Sim. O **Mac mini pode rodar o Gateway**, e seu MacBook Pro pode conectar como um **node** (companion device). Nodes não rodam o Gateway - eles fornecem capacidades extras como screen/camera/canvas e `system.run` naquele device.

Padrão comum:

- Gateway no Mac mini (always-on).
- MacBook Pro roda o app macOS ou um host node e pareeia o Gateway.
- Use `opencraft nodes status` / `opencraft nodes list` para vê-lo.

Docs: [Nodes](/nodes), [Nodes CLI](/cli/nodes).

### Posso usar Bun

Bun é **não recomendado**. Nós vemos bugs de runtime, especialmente com WhatsApp e Telegram.
Use **Node** para gateways estáveis.

Se você ainda quer experimentar com Bun, faça em um gateway não-produção sem WhatsApp/Telegram.

### Telegram: o que vai em `allowFrom`

`channels.telegram.allowFrom` é **o Telegram user ID do human sender** (numérico). Não é o bot username.

Onboarding aceita input `@username` e resolve para um ID numérico, mas OpenCraft authorization usa apenas IDs numéricos.

Mais seguro (sem bot de terceiro):

- DM seu bot, depois execute `opencraft logs --follow` e leia `from.id`.

Official Bot API:

- DM seu bot, depois chame `https://api.telegram.org/bot<bot_token>/getUpdates` e leia `message.from.id`.

De terceiro (menos privado):

- DM `@userinfobot` ou `@getidsbot`.

Veja [/channels/telegram](/channels/telegram#access-control-dms--groups).

### Múltiplas pessoas podem usar um número WhatsApp com diferentes instâncias OpenCraft

Sim, via **multi-agent routing**. Binde cada sender's WhatsApp **DM** (peer `kind: "direct"`, sender E.164 como `+15551234567`) para um `agentId` diferente, para que cada pessoa tenha seu próprio workspace e session store. Respostas ainda vêm da **mesma conta WhatsApp**, e acesso DM control (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) é global por conta WhatsApp. Veja [Multi-Agent Routing](/concepts/multi-agent) e [WhatsApp](/channels/whatsapp).

### Posso rodar um agente "fast chat" e um agente "Opus for coding"

Sim. Use multi-agent routing: dê a cada agent seu próprio default model, depois binde rotas de inbound (conta de provider ou peers específicos) para cada agent. Config de exemplo vive em [Multi-Agent Routing](/concepts/multi-agent). Veja também [Models](/concepts/models) e [Configuration](/gateway/configuration).

### Homebrew funciona em Linux

Sim. Homebrew suporta Linux (Linuxbrew). Setup rápido:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
brew install <formula>
```

Se você roda OpenCraft via systemd, garanta que o serviço PATH inclui `/home/linuxbrew/.linuxbrew/bin` (ou seu prefixo brew) para que `brew`-installed tools resolvam em non-login shells.
Builds recentes também prepend common user bin dirs em systemd services Linux (por exemplo `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) e honram `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, e `FNM_DIR` quando definido.

### Qual é a diferença entre a instalação hackable (git) e npm install

- **Instalação hackable (git):** full source checkout, edível, melhor para contributors.
  Você executa builds localmente e pode patchear code/docs.
- **npm install:** instalação de CLI global, sem repo, melhor para "apenas rodar."
  Atualizações vêm de npm dist-tags.

Docs: [Getting started](/start/getting-started), [Updating](/install/updating).

### Posso mudar entre npm e git installs depois

Sim. Instale o outro sabor, depois execute Doctor para que o serviço gateway aponte para o novo entrypoint.
Isto **não deleta seus dados** - apenas muda a instalação de código OpenCraft. Seu state (`~/.opencraft`) e workspace (`~/.opencraft/workspace`) ficam intocados.

De npm → git:

```bash
git clone https://github.com/editzffaleta/OpenCraft.git
cd opencraft
pnpm install
pnpm build
opencraft doctor
opencraft gateway restart
```

De git → npm:

```bash
npm install -g opencraft@latest
opencraft doctor
opencraft gateway restart
```

Doctor detecta um mismatch de entrypoint de serviço gateway e oferece reescrever a config de serviço para corresponder à instalação atual (use `--repair` em automação).

Dicas de backup: veja [Estratégia de backup](/help/faq#whats-the-recommended-backup-strategy).

### Devo rodar o Gateway no meu laptop ou um VPS

Resposta curta: **se você quer confiabilidade 24/7, use um VPS**. Se você quer o menor atrito e está OK com sleep/restarts, rode localmente.

**Laptop (Gateway local)**

- **Pros:** sem custo de servidor, acesso direto a arquivos locais, janela de browser live.
- **Cons:** sleep/network drops = desconexões, SO updates/reboots interrompem, deve ficar acordado.

**VPS / cloud**

- **Pros:** always-on, rede estável, sem problemas de sleep de laptop, mais fácil manter rodando.
- **Cons:** frequentemente headless (use screenshots), acesso de arquivo remoto apenas, você deve SSH para atualizações.

**Nota específica de OpenCraft:** WhatsApp/Telegram/Slack/Mattermost (plugin)/Discord todos funcionam bem de um VPS. O tradeoff real é **headless browser** vs uma janela visível. Veja [Browser](/tools/browser).

**Padrão recomendado:** VPS se você teve gateway disconnects antes. Local é ótimo quando você está ativamente usando o Mac e quer acesso local de arquivo ou automação UI com um browser visível.

### Quão importante é rodar OpenCraft em uma máquina dedicada

Não é requerido, mas **recomendado para confiabilidade e isolamento**.

- **Host dedicado (VPS/Mac mini/Pi):** always-on, menos interrupções de sleep/reboot, permissões mais limpas, mais fácil manter rodando.
- **Laptop/desktop compartilhado:** totalmente fine para testing e uso ativo, mas espere pausas quando a máquina dorme ou atualiza.

Se você quer o melhor de ambos mundos, mantenha o Gateway em um host dedicado e pareie seu laptop como um **node** para ferramentas locais de screen/camera/exec. Veja [Nodes](/nodes).
Para orientação de segurança, leia [Security](/gateway/security).

### Quais são os requisitos VPS mínimos e SO recomendado

OpenCraft é lightweight. Para um Gateway básico + um canal de chat:

- **Mínimo absoluto:** 1 vCPU, 1GB RAM, ~500MB disco.
- **Recomendado:** 1-2 vCPU, 2GB RAM ou mais para headroom (logs, mídia, múltiplos channels). Node tools e browser automation podem ser resource hungry.

SO: use **Ubuntu LTS** (ou qualquer Debian/Ubuntu moderno). O caminho de install Linux é melhor testado lá.

Docs: [Linux](/platforms/linux), [VPS hosting](/vps).

### Posso rodar OpenCraft em VM e quais são os requisitos

Sim. Trate uma VM o mesmo que um VPS: precisa estar always on, alcançável, e ter RAM suficiente para o Gateway e quaisquer channels que você habilita.

Orientação baseline:

- **Mínimo absoluto:** 1 vCPU, 1GB RAM.
- **Recomendado:** 2GB RAM ou mais se você roda múltiplos channels, browser automation, ou ferramentas de mídia.
- **SO:** Ubuntu LTS ou outro Debian/Ubuntu moderno.

Se você está em Windows, **WSL2 é o setup de estilo VM mais fácil** e tem a melhor compatibilidade de tooling. Veja [Windows](/platforms/windows), [VPS hosting](/vps).
Se você está rodando macOS em VM, veja [macOS VM](/install/macos-vm).

## O que é OpenCraft?

### O que é OpenCraft em um parágrafo

OpenCraft é um assistente AI pessoal que você roda em seus próprios devices. Ele responde nas superfícies de mensagem que você já usa (WhatsApp, Telegram, Slack, Mattermost (plugin), Discord, Google Chat, Signal, iMessage, WebChat) e também pode fazer voice + um Canvas live em plataformas suportadas. O **Gateway** é o plano de controle always-on; o assistante é o produto.

### Qual é a proposta de valor

OpenCraft não é "apenas um wrapper Claude." É um **plano de controle local-first** que te deixa rodar um assistente capaz em **seu próprio hardware**, alcançável das apps de chat que você já usa, com sessions com estado, memória, e ferramentas - sem entregar controle de seus fluxos de trabalho para um SaaS hosted.

Destaques:

- **Seus devices, seus dados:** rode o Gateway onde você quer (Mac, Linux, VPS) e mantenha o workspace + session history local.
- **Canais reais, não sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc, mais voice mobile e Canvas em plataformas suportadas.
- **Agnóstico de modelo:** use Anthropic, OpenAI, MiniMax, OpenRouter, etc., com roteamento por agent e failover.
- **Opção local-only:** rode modelos locais para que **todos os dados possam ficar em seu device** se você quiser.
