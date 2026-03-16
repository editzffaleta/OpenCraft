---
summary: "Perguntas frequentes sobre configuração, instalação e uso do OpenCraft"
read_when:
  - Respondendo dúvidas comuns de configuração, instalação, integração ou suporte em tempo de execução
  - Triagem de problemas relatados por usuários antes de depuração mais profunda
title: "FAQ"
---

# FAQ

Respostas rápidas e solução de problemas aprofundada para configurações do mundo real (dev local, VPS, multi-agent, OAuth/chaves de API, failover de modelos). Para diagnósticos em tempo de execução, veja [Solução de problemas](/gateway/troubleshooting). Para a referência completa de configuração, veja [Configuração](/gateway/configuration).

## Sumário

- [Início rápido e configuração inicial]
  - [Estou travado, qual é a maneira mais rápida de me desbloquear?](#estou-travado-qual-e-a-maneira-mais-rapida-de-me-desbloquear)
  - [Qual é a forma recomendada de instalar e configurar o OpenCraft?](#qual-e-a-forma-recomendada-de-instalar-e-configurar-o-opencraft)
  - [Como abro o painel após a integração?](#como-abro-o-painel-apos-a-integracao)
  - [Como autentico o painel (token) em localhost vs remoto?](#como-autentico-o-painel-token-em-localhost-vs-remoto)
  - [Qual runtime é necessário?](#qual-runtime-e-necessario)
  - [Funciona no Raspberry Pi?](#funciona-no-raspberry-pi)
  - [Alguma dica para instalações no Raspberry Pi?](#alguma-dica-para-instalacoes-no-raspberry-pi)
  - [Está travado em "wake up my friend" / a integração não inicia. O que fazer?](#esta-travado-em-wake-up-my-friend-a-integracao-nao-inicia-o-que-fazer)
  - [Posso migrar minha configuração para uma nova máquina (Mac mini) sem refazer a integração?](#posso-migrar-minha-configuracao-para-uma-nova-maquina-mac-mini-sem-refazer-a-integracao)
  - [Onde vejo as novidades da versão mais recente?](#onde-vejo-as-novidades-da-versao-mais-recente)
  - [Não consigo acessar docs.opencraft.ai (erro de SSL). O que fazer?](#nao-consigo-acessar-docsopencroftai-erro-de-ssl-o-que-fazer)
  - [Qual é a diferença entre stable e beta?](#qual-e-a-diferenca-entre-stable-e-beta)
  - [Como instalo a versão beta e qual é a diferença entre beta e dev?](#como-instalo-a-versao-beta-e-qual-e-a-diferenca-entre-beta-e-dev)
  - [Como experimento os bits mais recentes?](#como-experimento-os-bits-mais-recentes)
  - [Quanto tempo costuma levar a instalação e a integração?](#quanto-tempo-costuma-levar-a-instalacao-e-a-integracao)
  - [Instalador travado? Como obter mais detalhes?](#instalador-travado-como-obter-mais-detalhes)
  - [A instalação no Windows diz que o git não foi encontrado ou que o opencraft não foi reconhecido](#a-instalacao-no-windows-diz-que-o-git-nao-foi-encontrado-ou-que-o-opencraft-nao-foi-reconhecido)
  - [A saída de execução no Windows mostra texto chinês ilegível, o que devo fazer?](#a-saida-de-execucao-no-windows-mostra-texto-chines-ilegivel-o-que-devo-fazer)
  - [A documentação não respondeu minha dúvida — como obter uma resposta melhor?](#a-documentacao-nao-respondeu-minha-duvida-como-obter-uma-resposta-melhor)
  - [Como instalo o OpenCraft no Linux?](#como-instalo-o-opencraft-no-linux)
  - [Como instalo o OpenCraft em um VPS?](#como-instalo-o-opencraft-em-um-vps)
  - [Onde ficam os guias de instalação em nuvem/VPS?](#onde-ficam-os-guias-de-instalacao-em-nuvemvps)
  - [Posso pedir ao OpenCraft para se atualizar?](#posso-pedir-ao-opencraft-para-se-atualizar)
  - [O que o assistente de integração faz exatamente?](#o-que-o-assistente-de-integracao-faz-exatamente)
  - [Preciso de uma assinatura do Claude ou da OpenAI para usar?](#preciso-de-uma-assinatura-do-claude-ou-da-openai-para-usar)
  - [Posso usar a assinatura Claude Max sem uma chave de API?](#posso-usar-a-assinatura-claude-max-sem-uma-chave-de-api)
  - [Como funciona a autenticação "setup-token" da Anthropic?](#como-funciona-a-autenticacao-setup-token-da-anthropic)
  - [Onde encontro um setup-token da Anthropic?](#onde-encontro-um-setup-token-da-anthropic)
  - [Vocês oferecem suporte à autenticação por assinatura do Claude (Claude Pro ou Max)?](#voces-oferecem-suporte-a-autenticacao-por-assinatura-do-claude-claude-pro-ou-max)
  - [Por que estou vendo `HTTP 429: rate_limit_error` da Anthropic?](#por-que-estou-vendo-http-429-rate_limit_error-da-anthropic)
  - [O AWS Bedrock é suportado?](#o-aws-bedrock-e-suportado)
  - [Como funciona a autenticação do Codex?](#como-funciona-a-autenticacao-do-codex)
  - [Vocês oferecem suporte à autenticação por assinatura da OpenAI (Codex OAuth)?](#voces-oferecem-suporte-a-autenticacao-por-assinatura-da-openai-codex-oauth)
  - [Como configuro o OAuth do Gemini CLI?](#como-configuro-o-oauth-do-gemini-cli)
  - [Um modelo local é adequado para conversas casuais?](#um-modelo-local-e-adequado-para-conversas-casuais)
  - [Como mantenho o tráfego de modelos hospedados em uma região específica?](#como-mantenho-o-trafego-de-modelos-hospedados-em-uma-regiao-especifica)
  - [Preciso comprar um Mac Mini para instalar?](#preciso-comprar-um-mac-mini-para-instalar)
  - [Preciso de um Mac mini para suporte ao iMessage?](#preciso-de-um-mac-mini-para-suporte-ao-imessage)
  - [Se comprar um Mac mini para rodar o OpenCraft, posso conectá-lo ao meu MacBook Pro?](#se-comprar-um-mac-mini-para-rodar-o-opencraft-posso-conecta-lo-ao-meu-macbook-pro)
  - [Posso usar o Bun?](#posso-usar-o-bun)
  - [Telegram: o que vai em `allowFrom`?](#telegram-o-que-vai-em-allowfrom)
  - [Várias pessoas podem usar um número do WhatsApp com instâncias diferentes do OpenCraft?](#varias-pessoas-podem-usar-um-numero-do-whatsapp-com-instancias-diferentes-do-opencraft)
  - [Posso ter um agente de "chat rápido" e um agente "Opus para programação"?](#posso-ter-um-agente-de-chat-rapido-e-um-agente-opus-para-programacao)
  - [O Homebrew funciona no Linux?](#o-homebrew-funciona-no-linux)
  - [Qual é a diferença entre a instalação hackable (git) e a instalação via npm?](#qual-e-a-diferenca-entre-a-instalacao-hackable-git-e-a-instalacao-via-npm)
  - [Posso alternar entre instalações npm e git depois?](#posso-alternar-entre-instalacoes-npm-e-git-depois)
  - [Devo rodar o Gateway no meu laptop ou em um VPS?](#devo-rodar-o-gateway-no-meu-laptop-ou-em-um-vps)
  - [Quão importante é rodar o OpenCraft em uma máquina dedicada?](#quao-importante-e-rodar-o-opencraft-em-uma-maquina-dedicada)
  - [Quais são os requisitos mínimos de VPS e o sistema operacional recomendado?](#quais-sao-os-requisitos-minimos-de-vps-e-o-sistema-operacional-recomendado)
  - [Posso rodar o OpenCraft em uma VM e quais são os requisitos?](#posso-rodar-o-opencraft-em-uma-vm-e-quais-sao-os-requisitos)
- [O que é o OpenCraft?](#o-que-e-o-opencraft)
  - [O que é o OpenCraft, em um parágrafo?](#o-que-e-o-opencraft-em-um-paragrafo)
  - [Qual é a proposta de valor?](#qual-e-a-proposta-de-valor)
  - [Acabei de configurar, o que devo fazer primeiro?](#acabei-de-configurar-o-que-devo-fazer-primeiro)
  - [Quais são os cinco principais casos de uso do cotidiano do OpenCraft?](#quais-sao-os-cinco-principais-casos-de-uso-do-cotidiano-do-opencraft)
  - [O OpenCraft pode ajudar com geração de leads, anúncios e blogs para um SaaS?](#o-opencraft-pode-ajudar-com-geracao-de-leads-anuncios-e-blogs-para-um-saas)
  - [Quais são as vantagens em relação ao Claude Code para desenvolvimento web?](#quais-sao-as-vantagens-em-relacao-ao-claude-code-para-desenvolvimento-web)
- [Skills e automação](#skills-e-automacao)
  - [Como personalizo skills sem deixar o repositório sujo?](#como-personalizo-skills-sem-deixar-o-repositorio-sujo)
  - [Posso carregar skills de uma pasta personalizada?](#posso-carregar-skills-de-uma-pasta-personalizada)
  - [Como posso usar modelos diferentes para tarefas diferentes?](#como-posso-usar-modelos-diferentes-para-tarefas-diferentes)
  - [O bot trava durante trabalhos pesados. Como delego isso?](#o-bot-trava-durante-trabalhos-pesados-como-delego-isso)
  - [Cron ou lembretes não disparam. O que devo verificar?](#cron-ou-lembretes-nao-disparam-o-que-devo-verificar)
  - [Como instalo skills no Linux?](#como-instalo-skills-no-linux)
  - [O OpenCraft pode executar tarefas em um agendamento ou continuamente em segundo plano?](#o-opencraft-pode-executar-tarefas-em-um-agendamento-ou-continuamente-em-segundo-plano)
  - [Posso executar skills exclusivas do macOS a partir do Linux?](#posso-executar-skills-exclusivas-do-macos-a-partir-do-linux)
  - [Vocês têm integração com Notion ou HeyGen?](#voces-tem-integracao-com-notion-ou-heygen)
  - [Como instalo a extensão do Chrome para controle do navegador?](#como-instalo-a-extensao-do-chrome-para-controle-do-navegador)
- [Sandboxing e memória](#sandboxing-e-memoria)
  - [Existe um documento dedicado ao sandboxing?](#existe-um-documento-dedicado-ao-sandboxing)
  - [Como vinculo uma pasta do host ao sandbox?](#como-vinculo-uma-pasta-do-host-ao-sandbox)
  - [Como funciona a memória?](#como-funciona-a-memoria)
  - [A memória continua esquecendo as coisas. Como faço para fixá-las?](#a-memoria-continua-esquecendo-as-coisas-como-faco-para-fixa-las)
  - [A memória persiste para sempre? Quais são os limites?](#a-memoria-persiste-para-sempre-quais-sao-os-limites)
  - [A busca semântica de memória requer uma chave de API da OpenAI?](#a-busca-semantica-de-memoria-requer-uma-chave-de-api-da-openai)
- [Onde as coisas ficam no disco](#onde-as-coisas-ficam-no-disco)
  - [Todos os dados usados com o OpenCraft são salvos localmente?](#todos-os-dados-usados-com-o-opencraft-sao-salvos-localmente)
  - [Onde o OpenCraft armazena seus dados?](#onde-o-opencraft-armazena-seus-dados)
  - [Onde devem ficar AGENTS.md / SOUL.md / USER.md / MEMORY.md?](#onde-devem-ficar-agentsmd-soulmd-usermd-memorymd)
  - [Qual é a estratégia de backup recomendada?](#qual-e-a-estrategia-de-backup-recomendada)
  - [Como desinstalo o OpenCraft completamente?](#como-desinstalo-o-opencraft-completamente)
  - [Os agentes podem trabalhar fora do workspace?](#os-agentes-podem-trabalhar-fora-do-workspace)
  - [Estou no modo remoto — onde fica o armazenamento de sessões?](#estou-no-modo-remoto-onde-fica-o-armazenamento-de-sessoes)
- [Noções básicas de configuração](#nocoes-basicas-de-configuracao)
  - [Qual é o formato do arquivo de configuração? Onde ele fica?](#qual-e-o-formato-do-arquivo-de-configuracao-onde-ele-fica)
  - [Defini `gateway.bind: "lan"` (ou `"tailnet"`) e agora nada escuta / a interface diz "não autorizado"](#defini-gatewaybind-lan-ou-tailnet-e-agora-nada-escuta-a-interface-diz-nao-autorizado)
  - [Por que agora preciso de um token no localhost?](#por-que-agora-preciso-de-um-token-no-localhost)
  - [Preciso reiniciar após alterar a configuração?](#preciso-reiniciar-apos-alterar-a-configuracao)
  - [Como desativo os slogans engraçados da CLI?](#como-desativo-os-slogans-engracados-da-cli)
  - [Como ativo a busca web (e o fetch web)?](#como-ativo-a-busca-web-e-o-fetch-web)
  - [config.apply apagou minha configuração. Como recupero e evito isso?](#configapply-apagou-minha-configuracao-como-recupero-e-evito-isso)
  - [Como rodo um Gateway central com workers especializados em vários dispositivos?](#como-rodo-um-gateway-central-com-workers-especializados-em-varios-dispositivos)
  - [O navegador do OpenCraft pode rodar headless?](#o-navegador-do-opencraft-pode-rodar-headless)
  - [Como uso o Brave para controle do navegador?](#como-uso-o-brave-para-controle-do-navegador)
- [Gateways e nós remotos](#gateways-e-nos-remotos)
  - [Como os comandos se propagam entre o Telegram, o gateway e os nós?](#como-os-comandos-se-propagam-entre-o-telegram-o-gateway-e-os-nos)
  - [Como meu agente pode acessar meu computador se o Gateway está hospedado remotamente?](#como-meu-agente-pode-acessar-meu-computador-se-o-gateway-esta-hospedado-remotamente)
  - [O Tailscale está conectado mas não recebo respostas. O que fazer?](#o-tailscale-esta-conectado-mas-nao-recebo-respostas-o-que-fazer)
  - [Duas instâncias do OpenCraft podem se comunicar (local + VPS)?](#duas-instancias-do-opencraft-podem-se-comunicar-local-vps)
  - [Preciso de VPSes separados para múltiplos agentes?](#preciso-de-vpses-separados-para-multiplos-agentes)
  - [Há algum benefício em usar um nó no meu laptop pessoal em vez de SSH a partir de um VPS?](#ha-algum-beneficio-em-usar-um-no-no-meu-laptop-pessoal-em-vez-de-ssh-a-partir-de-um-vps)
  - [Os nós executam um serviço de gateway?](#os-nos-executam-um-servico-de-gateway)
  - [Existe uma forma via API / RPC de aplicar configuração?](#existe-uma-forma-via-api-rpc-de-aplicar-configuracao)
  - [Qual é uma configuração mínima "sensata" para a primeira instalação?](#qual-e-uma-configuracao-minima-sensata-para-a-primeira-instalacao)
  - [Como configuro o Tailscale em um VPS e me conecto a partir do meu Mac?](#como-configuro-o-tailscale-em-um-vps-e-me-conecto-a-partir-do-meu-mac)
  - [Como conecto um nó Mac a um Gateway remoto (Tailscale Serve)?](#como-conecto-um-no-mac-a-um-gateway-remoto-tailscale-serve)
  - [Devo instalar em um segundo laptop ou apenas adicionar um nó?](#devo-instalar-em-um-segundo-laptop-ou-apenas-adicionar-um-no)
- [Variáveis de ambiente e carregamento de .env](#variaveis-de-ambiente-e-carregamento-de-env)
  - [Como o OpenCraft carrega variáveis de ambiente?](#como-o-opencraft-carrega-variaveis-de-ambiente)
  - ["Iniciei o Gateway pelo serviço e minhas variáveis de ambiente desapareceram." O que fazer?](#iniciei-o-gateway-pelo-servico-e-minhas-variaveis-de-ambiente-desapareceram-o-que-fazer)
  - [Defini `COPILOT_GITHUB_TOKEN`, mas o status de modelos mostra "Shell env: off." Por quê?](#defini-copilot_github_token-mas-o-status-de-modelos-mostra-shell-env-off-por-que)
- [Sessões e múltiplos chats](#sessoes-e-multiplos-chats)
  - [Como inicio uma conversa nova?](#como-inicio-uma-conversa-nova)
  - [As sessões reiniciam automaticamente se eu nunca enviar `/new`?](#as-sessoes-reiniciam-automaticamente-se-eu-nunca-enviar-new)
  - [Existe uma maneira de criar uma equipe de instâncias do OpenCraft — um CEO e muitos agentes?](#existe-uma-maneira-de-criar-uma-equipe-de-instancias-do-opencraft-um-ceo-e-muitos-agentes)
  - [Por que o contexto foi truncado no meio de uma tarefa? Como evito isso?](#por-que-o-contexto-foi-truncado-no-meio-de-uma-tarefa-como-evito-isso)
  - [Como reinicio completamente o OpenCraft sem desinstalá-lo?](#como-reinicio-completamente-o-opencraft-sem-desinstala-lo)
  - [Estou recebendo erros de "contexto muito grande" — como reinicio ou compacto?](#estou-recebendo-erros-de-contexto-muito-grande-como-reinicio-ou-compacto)
  - [Por que vejo "LLM request rejected: messages.content.tool_use.input field required"?](#por-que-vejo-llm-request-rejected-messagescontenttool_useinput-field-required)
  - [Por que estou recebendo mensagens de heartbeat a cada 30 minutos?](#por-que-estou-recebendo-mensagens-de-heartbeat-a-cada-30-minutos)
  - [Preciso adicionar uma "conta de bot" a um grupo do WhatsApp?](#preciso-adicionar-uma-conta-de-bot-a-um-grupo-do-whatsapp)
  - [Como obtenho o JID de um grupo do WhatsApp?](#como-obtenho-o-jid-de-um-grupo-do-whatsapp)
  - [Por que o OpenCraft não responde em um grupo?](#por-que-o-opencraft-nao-responde-em-um-grupo)
  - [Grupos/threads compartilham contexto com DMs?](#gruposthreads-compartilham-contexto-com-dms)
  - [Quantos workspaces e agentes posso criar?](#quantos-workspaces-e-agentes-posso-criar)
  - [Posso rodar vários bots ou chats ao mesmo tempo (Slack) e como devo configurar isso?](#posso-rodar-varios-bots-ou-chats-ao-mesmo-tempo-slack-e-como-devo-configurar-isso)
- [Modelos: padrões, seleção, aliases, troca](#modelos-padroes-selecao-aliases-troca)
  - [O que é o "modelo padrão"?](#o-que-e-o-modelo-padrao)
  - [Qual modelo você recomenda?](#qual-modelo-voce-recomenda)
  - [Como troco de modelos sem apagar minha configuração?](#como-troco-de-modelos-sem-apagar-minha-configuracao)
  - [Posso usar modelos auto-hospedados (llama.cpp, vLLM, Ollama)?](#posso-usar-modelos-auto-hospedados-llamacpp-vllm-ollama)
  - [O que OpenCraft, Flawd e Krill usam para modelos?](#o-que-opencraft-flawd-e-krill-usam-para-modelos)
  - [Como troco de modelos na hora (sem reiniciar)?](#como-troco-de-modelos-na-hora-sem-reiniciar)
  - [Posso usar GPT 5.2 para tarefas diárias e Codex 5.3 para programação?](#posso-usar-gpt-52-para-tarefas-diarias-e-codex-53-para-programacao)
  - [Por que vejo "Model … is not allowed" e depois nenhuma resposta?](#por-que-vejo-model-is-not-allowed-e-depois-nenhuma-resposta)
  - [Por que vejo "Unknown model: minimax/MiniMax-M2.5"?](#por-que-vejo-unknown-model-minimaxminimaxm25)
  - [Posso usar o MiniMax como padrão e a OpenAI para tarefas complexas?](#posso-usar-o-minimax-como-padrao-e-a-openai-para-tarefas-complexas)
  - [opus / sonnet / gpt são atalhos embutidos?](#opus-sonnet-gpt-sao-atalhos-embutidos)
  - [Como defino/sobrescrevo atalhos de modelos (aliases)?](#como-definosobrescrevo-atalhos-de-modelos-aliases)
  - [Como adiciono modelos de outros provedores como OpenRouter ou Z.AI?](#como-adiciono-modelos-de-outros-provedores-como-openrouter-ou-zai)
- [Failover de modelos e "All models failed"](#failover-de-modelos-e-all-models-failed)
  - [Como funciona o failover?](#como-funciona-o-failover)
  - [O que esse erro significa?](#o-que-esse-erro-significa)
  - [Lista de verificação para `No credentials found for profile "anthropic:default"`](#lista-de-verificacao-para-no-credentials-found-for-profile-anthropicdefault)
  - [Por que também tentou o Google Gemini e falhou?](#por-que-tambem-tentou-o-google-gemini-e-falhou)
- [Perfis de autenticação: o que são e como gerenciá-los](#perfis-de-autenticacao-o-que-sao-e-como-gerencia-los)
  - [O que é um perfil de autenticação?](#o-que-e-um-perfil-de-autenticacao)
  - [Quais são os IDs de perfil típicos?](#quais-sao-os-ids-de-perfil-tipicos)
  - [Posso controlar qual perfil de autenticação é tentado primeiro?](#posso-controlar-qual-perfil-de-autenticacao-e-tentado-primeiro)
  - [OAuth vs chave de API: qual é a diferença?](#oauth-vs-chave-de-api-qual-e-a-diferenca)
- [Gateway: portas, "já em execução" e modo remoto](#gateway-portas-ja-em-execucao-e-modo-remoto)
  - [Qual porta o Gateway usa?](#qual-porta-o-gateway-usa)
  - [Por que `opencraft gateway status` diz `Runtime: running` mas `RPC probe: failed`?](#por-que-opencraft-gateway-status-diz-runtime-running-mas-rpc-probe-failed)
  - [Por que `opencraft gateway status` mostra `Config (cli)` e `Config (service)` diferentes?](#por-que-opencraft-gateway-status-mostra-config-cli-e-config-service-diferentes)
  - [O que significa "another gateway instance is already listening"?](#o-que-significa-another-gateway-instance-is-already-listening)
  - [Como rodo o OpenCraft em modo remoto (cliente se conecta a um Gateway em outro lugar)?](#como-rodo-o-opencraft-em-modo-remoto-cliente-se-conecta-a-um-gateway-em-outro-lugar)
  - [A interface de controle diz "não autorizado" (ou fica reconectando). O que fazer?](#a-interface-de-controle-diz-nao-autorizado-ou-fica-reconectando-o-que-fazer)
  - [Defini `gateway.bind: "tailnet"` mas ele não consegue fazer bind / nada escuta](#defini-gatewaybind-tailnet-mas-ele-nao-consegue-fazer-bind-nada-escuta)
  - [Posso rodar múltiplos Gateways no mesmo host?](#posso-rodar-multiplos-gateways-no-mesmo-host)
  - [O que significa "invalid handshake" / código 1008?](#o-que-significa-invalid-handshake-codigo-1008)
- [Logs e depuração](#logs-e-depuracao)
  - [Onde ficam os logs?](#onde-ficam-os-logs)
  - [Como inicio/paro/reinicio o serviço do Gateway?](#como-inicioparorestart-o-servico-do-gateway)
  - [Fechei meu terminal no Windows — como reinicio o OpenCraft?](#fechei-meu-terminal-no-windows-como-reinicio-o-opencraft)
  - [O Gateway está ativo mas as respostas nunca chegam. O que devo verificar?](#o-gateway-esta-ativo-mas-as-respostas-nunca-chegam-o-que-devo-verificar)
  - ["Disconnected from gateway: no reason" — o que fazer?](#disconnected-from-gateway-no-reason-o-que-fazer)
  - [setMyCommands do Telegram falha. O que devo verificar?](#setmycommands-do-telegram-falha-o-que-devo-verificar)
  - [O TUI não mostra saída. O que devo verificar?](#o-tui-nao-mostra-saida-o-que-devo-verificar)
  - [Como paro completamente e depois inicio o Gateway?](#como-paro-completamente-e-depois-inicio-o-gateway)
  - [ELI5: `opencraft gateway restart` vs `opencraft gateway`](#eli5-opencraft-gateway-restart-vs-opencraft-gateway)
  - [Qual é a forma mais rápida de obter mais detalhes quando algo falha?](#qual-e-a-forma-mais-rapida-de-obter-mais-detalhes-quando-algo-falha)
- [Mídia e anexos](#midia-e-anexos)
  - [Minha skill gerou uma imagem/PDF, mas nada foi enviado](#minha-skill-gerou-uma-imagempdf-mas-nada-foi-enviado)
- [Segurança e controle de acesso](#seguranca-e-controle-de-acesso)
  - [É seguro expor o OpenCraft a DMs recebidas?](#e-seguro-expor-o-opencraft-a-dms-recebidas)
  - [Injeção de prompt é uma preocupação apenas para bots públicos?](#injecao-de-prompt-e-uma-preocupacao-apenas-para-bots-publicos)
  - [Meu bot deve ter sua própria conta de e-mail, GitHub ou número de telefone?](#meu-bot-deve-ter-sua-propria-conta-de-e-mail-github-ou-numero-de-telefone)
  - [Posso dar autonomia sobre minhas mensagens de texto e isso é seguro?](#posso-dar-autonomia-sobre-minhas-mensagens-de-texto-e-isso-e-seguro)
  - [Posso usar modelos mais baratos para tarefas de assistente pessoal?](#posso-usar-modelos-mais-baratos-para-tarefas-de-assistente-pessoal)
  - [Executei `/start` no Telegram mas não recebi um código de pareamento](#executei-start-no-telegram-mas-nao-recebi-um-codigo-de-pareamento)
  - [WhatsApp: ele vai enviar mensagens para meus contatos? Como funciona o pareamento?](#whatsapp-ele-vai-enviar-mensagens-para-meus-contatos-como-funciona-o-pareamento)
- [Comandos de chat, interrupção de tarefas e "não para"](#comandos-de-chat-interrupcao-de-tarefas-e-nao-para)
  - [Como impedo que mensagens internas do sistema apareçam no chat?](#como-impedo-que-mensagens-internas-do-sistema-aparecam-no-chat)
  - [Como paro/cancelo uma tarefa em execução?](#como-parocancelo-uma-tarefa-em-execucao)
  - [Como envio uma mensagem do Discord pelo Telegram? ("Cross-context messaging denied")](#como-envio-uma-mensagem-do-discord-pelo-telegram-cross-context-messaging-denied)
  - [Por que parece que o bot "ignora" mensagens enviadas rapidamente?](#por-que-parece-que-o-bot-ignora-mensagens-enviadas-rapidamente)

## Primeiros 60 segundos quando algo está quebrado

1. **Status rápido (primeira verificação)**

   ```bash
   opencraft status
   ```

   Resumo local rápido: SO + atualização, alcançabilidade do gateway/serviço, agentes/sessões, configuração de provedores + problemas em tempo de execução (quando o gateway está acessível).

2. **Relatório que pode ser compartilhado**

   ```bash
   opencraft status --all
   ```

   Diagnóstico somente leitura com cauda do log (tokens omitidos).

3. **Estado do daemon + porta**

   ```bash
   opencraft gateway status
   ```

   Mostra o runtime do supervisor vs alcançabilidade via RPC, a URL de destino da sonda e qual configuração o serviço provavelmente usou.

4. **Sondas profundas**

   ```bash
   opencraft status --deep
   ```

   Executa verificações de saúde do gateway + sondas de provedores (requer um gateway acessível). Veja [Health](/gateway/health).

5. **Acompanhar o log mais recente**

   ```bash
   opencraft logs --follow
   ```

   Se o RPC estiver inativo, use como fallback:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Logs de arquivo são separados dos logs do serviço; veja [Logging](/logging) e [Solução de problemas](/gateway/troubleshooting).

6. **Executar o doctor (reparos)**

   ```bash
   opencraft doctor
   ```

   Repara/migra configuração/estado + executa verificações de saúde. Veja [Doctor](/gateway/doctor).

7. **Snapshot do Gateway**

   ```bash
   opencraft health --json
   opencraft health --verbose   # mostra a URL de destino + caminho de configuração em caso de erros
   ```

   Solicita ao gateway em execução um snapshot completo (somente WS). Veja [Health](/gateway/health).

## Início rápido e configuração inicial

### Estou travado, qual é a maneira mais rápida de me desbloquear

Use um agente de IA local que possa **ver sua máquina**. Isso é muito mais eficaz do que
perguntar no Discord, porque a maioria dos casos de "estou travado" são **problemas locais de
configuração ou ambiente** que colaboradores remotos não conseguem inspecionar.

- **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
- **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

Essas ferramentas podem ler o repositório, executar comandos, inspecionar logs e ajudar a
corrigir problemas do nível da máquina (PATH, serviços, permissões, arquivos de autenticação).
Forneça a elas o **checkout completo do código-fonte** via instalação hackable (git):

```bash
curl -fsSL https://opencraft.ai/install.sh | bash -s -- --install-method git
```

Isso instala o OpenCraft **a partir de um checkout git**, para que o agente possa ler o código
e os docs e raciocinar sobre a versão exata que você está executando. Você sempre pode voltar
para o stable depois, re-executando o instalador sem `--install-method git`.

Dica: peça ao agente para **planejar e supervisionar** a correção (passo a passo), e só então
executar os comandos necessários. Isso mantém as mudanças pequenas e mais fáceis de auditar.

Se você descobrir um bug real ou uma correção, por favor abra uma issue no GitHub ou envie um PR:
[https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
[https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

Comece com estes comandos (compartilhe as saídas ao pedir ajuda):

```bash
opencraft status
opencraft models status
opencraft doctor
```

O que cada um faz:

- `opencraft status`: snapshot rápido da saúde do gateway/agente + configuração básica.
- `opencraft models status`: verifica a autenticação do provedor + disponibilidade de modelos.
- `opencraft doctor`: valida e repara problemas comuns de configuração/estado.

Outras verificações úteis via CLI: `opencraft status --all`, `opencraft logs --follow`,
`opencraft gateway status`, `opencraft health --verbose`.

Loop de depuração rápida: [Primeiros 60 segundos quando algo está quebrado](#primeiros-60-segundos-quando-algo-esta-quebrado).
Documentação de instalação: [Install](/install), [Flags do instalador](/install/installer), [Atualizando](/install/updating).

### Qual é a forma recomendada de instalar e configurar o OpenCraft

O repositório recomenda executar a partir do código-fonte e usar o assistente de integração:

```bash
curl -fsSL https://opencraft.ai/install.sh | bash
opencraft onboard --install-daemon
```

O assistente também pode compilar os assets da interface automaticamente. Após a integração, o
Gateway geralmente roda na porta **18789**.

A partir do código-fonte (contribuidores/dev):

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build # instala as dependências da interface na primeira execução
opencraft onboard
```

Se você ainda não tem uma instalação global, execute via `pnpm opencraft onboard`.

### Como abro o painel após a integração

O assistente abre seu navegador com uma URL de painel limpa (sem token) logo após a integração
e também imprime o link no resumo. Mantenha essa aba aberta; se o navegador não abriu
automaticamente, copie e cole a URL impressa na mesma máquina.

### Como autentico o painel (token) em localhost vs remoto

**Localhost (mesma máquina):**

- Abra `http://127.0.0.1:18789/`.
- Se pedir autenticação, cole o token de `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`) nas configurações da interface de controle.
- Recupere-o no host do gateway: `opencraft config get gateway.auth.token` (ou gere um: `opencraft doctor --generate-gateway-token`).

**Fora do localhost:**

- **Tailscale Serve** (recomendado): mantenha o bind em loopback, execute `opencraft gateway --tailscale serve`, abra `https://<magicdns>/`. Se `gateway.auth.allowTailscale` for `true`, os cabeçalhos de identidade satisfazem a autenticação da interface de controle/WebSocket (sem token, assume host de gateway confiável); as APIs HTTP ainda exigem token/senha.
- **Bind na tailnet**: execute `opencraft gateway --bind tailnet --token "<token>"`, abra `http://<tailscale-ip>:18789/`, cole o token nas configurações do painel.
- **Túnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` e depois abra `http://127.0.0.1:18789/` e cole o token nas configurações da interface de controle.

Veja [Dashboard](/web/dashboard) e [Superfícies web](/web) para modos de bind e detalhes de autenticação.

### Qual runtime é necessário

Node **>= 22** é obrigatório. `pnpm` é recomendado. Bun **não é recomendado** para o Gateway.

### Funciona no Raspberry Pi

Sim. O Gateway é leve — a documentação lista **512MB-1GB de RAM**, **1 núcleo** e cerca de
**500MB** de disco como suficientes para uso pessoal, e menciona que um **Raspberry Pi 4 consegue
executá-lo**.

Se quiser mais folga (logs, mídia, outros serviços), **2GB é recomendado**, mas não é um mínimo
obrigatório.

Dica: um Pi/VPS pequeno pode hospedar o Gateway, e você pode parear **nós** no laptop/telefone
para acesso local à tela/câmera/canvas ou execução de comandos. Veja [Nodes](/nodes).

### Alguma dica para instalações no Raspberry Pi

Versão curta: funciona, mas espere algumas asperezas.

- Use um SO de **64 bits** e mantenha o Node >= 22.
- Prefira a **instalação hackable (git)** para poder ver os logs e atualizar rapidamente.
- Comece sem channels/skills e adicione-os um por um.
- Se encontrar problemas estranhos com binários, geralmente é um problema de **compatibilidade ARM**.

Documentação: [Linux](/platforms/linux), [Install](/install).

### Está travado em "wake up my friend" a integração não inicia O que fazer

Essa tela depende de o Gateway estar acessível e autenticado. O TUI também envia
"Wake up, my friend!" automaticamente no primeiro início. Se você vir essa linha **sem resposta**
e os tokens permanecerem em 0, o agente nunca executou.

1. Reinicie o Gateway:

```bash
opencraft gateway restart
```

2. Verifique o status e a autenticação:

```bash
opencraft status
opencraft models status
opencraft logs --follow
```

3. Se ainda travar, execute:

```bash
opencraft doctor
```

Se o Gateway for remoto, certifique-se de que o túnel/Tailscale está ativo e que a interface
aponta para o Gateway correto. Veja [Acesso remoto](/gateway/remote).

### Posso migrar minha configuração para uma nova máquina Mac mini sem refazer a integração

Sim. Copie o **diretório de estado** e o **workspace**, depois execute o Doctor uma vez. Isso
mantém seu bot "exatamente igual" (memória, histórico de sessões, autenticação e estado dos
channels) contanto que você copie **ambos** os locais:

1. Instale o OpenCraft na nova máquina.
2. Copie `$OPENCLAW_STATE_DIR` (padrão: `~/.opencraft`) da máquina antiga.
3. Copie seu workspace (padrão: `~/.opencraft/workspace`).
4. Execute `opencraft doctor` e reinicie o serviço do Gateway.

Isso preserva configuração, perfis de autenticação, credenciais do WhatsApp, sessões e memória.
Se você estiver no modo remoto, lembre-se de que o host do gateway é dono do armazenamento de
sessões e do workspace.

**Importante:** se você apenas faz commit/push do workspace para o GitHub, está fazendo backup
de **memória + arquivos de bootstrap**, mas **não** do histórico de sessões ou de autenticação.
Esses ficam em `~/.opencraft/` (por exemplo `~/.opencraft/agents/<agentId>/sessions/`).

Relacionado: [Migrating](/install/migrating), [Onde as coisas ficam no disco](/help/faq#onde-o-opencraft-armazena-seus-dados),
[Workspace do agente](/concepts/agent-workspace), [Doctor](/gateway/doctor),
[Modo remoto](/gateway/remote).

### Onde vejo as novidades da versão mais recente

Confira o changelog no GitHub:
[https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

As entradas mais novas ficam no topo. Se a seção do topo estiver marcada como **Unreleased**, a
próxima seção com data é a versão mais recente publicada. As entradas são agrupadas em
**Highlights**, **Changes** e **Fixes** (mais seções de docs/outros quando necessário).

### Não consigo acessar docs.opencraft.ai erro de SSL O que fazer

Algumas conexões Comcast/Xfinity bloqueiam incorretamente `docs.opencraft.ai` através do
Xfinity Advanced Security. Desative-o ou coloque `docs.opencraft.ai` na lista de permissões e
tente novamente. Mais detalhes: [Solução de problemas](/help/troubleshooting#docsopenclawai-shows-an-ssl-error-comcastxfinity).
Ajude-nos a desbloquear reportando aqui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

Se ainda não conseguir acessar o site, os docs têm um espelho no GitHub:
[https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

### Qual é a diferença entre stable e beta

**Stable** e **beta** são **dist-tags do npm**, não linhas de código separadas:

- `latest` = stable
- `beta` = build antecipado para testes

Publicamos builds na **beta**, testamos e, quando um build está sólido, **promovemos
essa mesma versão para `latest`**. É por isso que beta e stable podem apontar para a
**mesma versão**.

Veja o que mudou:
[https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

### Como instalo a versão beta e qual é a diferença entre beta e dev

**Beta** é o dist-tag `beta` do npm (pode coincidir com `latest`).
**Dev** é o head móvel de `main` (git); quando publicado, usa o dist-tag `dev` do npm.

Comandos de uma linha (macOS/Linux):

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install.sh | bash -s -- --beta
```

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://opencraft.ai/install.sh | bash -s -- --install-method git
```

Instalador para Windows (PowerShell):
[https://opencraft.ai/install.ps1](https://opencraft.ai/install.ps1)

Mais detalhes: [Canais de desenvolvimento](/install/development-channels) e [Flags do instalador](/install/installer).

### Quanto tempo costuma levar a instalação e a integração

Guia aproximado:

- **Instalação:** 2-5 minutos
- **Integração:** 5-15 minutos dependendo de quantos channels/modelos você configurar

Se travar, use [Instalador travado](/help/faq#instalador-travado-como-obter-mais-detalhes)
e o loop de depuração rápida em [Estou travado](/help/faq#estou-travado-qual-e-a-maneira-mais-rapida-de-me-desbloquear).

### Como experimento os bits mais recentes

Duas opções:

1. **Canal dev (checkout git):**

```bash
opencraft update --channel dev
```

Isso muda para o branch `main` e atualiza a partir do código-fonte.

2. **Instalação hackable (a partir do site do instalador):**

```bash
curl -fsSL https://opencraft.ai/install.sh | bash -s -- --install-method git
```

Isso fornece um repositório local que você pode editar e atualizar via git.

Se preferir um clone limpo manualmente, use:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
```

Documentação: [Update](/cli/update), [Canais de desenvolvimento](/install/development-channels),
[Install](/install).

### Instalador travado Como obter mais detalhes

Execute novamente o instalador com **saída detalhada**:

```bash
curl -fsSL https://opencraft.ai/install.sh | bash -s -- --verbose
```

Instalação beta com verbose:

```bash
curl -fsSL https://opencraft.ai/install.sh | bash -s -- --beta --verbose
```

Para uma instalação hackable (git):

```bash
curl -fsSL https://opencraft.ai/install.sh | bash -s -- --install-method git --verbose
```

Equivalente no Windows (PowerShell):

```powershell
# install.ps1 ainda não tem uma flag -Verbose dedicada.
Set-PSDebug -Trace 1
& ([scriptblock]::Create((iwr -useb https://opencraft.ai/install.ps1))) -NoOnboard
Set-PSDebug -Trace 0
```

Mais opções: [Flags do instalador](/install/installer).

### A instalação no Windows diz que o git não foi encontrado ou que o opencraft não foi reconhecido

Dois problemas comuns no Windows:

**1) npm error spawn git / git not found**

- Instale o **Git for Windows** e certifique-se de que `git` está no PATH.
- Feche e reabra o PowerShell, depois execute o instalador novamente.

**2) opencraft não reconhecido após a instalação**

- Sua pasta global de bin do npm não está no PATH.
- Verifique o caminho:

  ```powershell
  npm config get prefix
  ```

- Adicione esse diretório ao PATH do usuário (sem sufixo `\bin` no Windows; na maioria dos sistemas é `%AppData%\npm`).
- Feche e reabra o PowerShell após atualizar o PATH.

Se quiser a configuração mais tranquila no Windows, use o **WSL2** em vez do Windows nativo.
Documentação: [Windows](/platforms/windows).

### A saída de execução no Windows mostra texto chinês ilegível o que devo fazer

Isso geralmente é uma incompatibilidade de code page do console nos shells nativos do Windows.

Sintomas:

- A saída de `system.run`/`exec` exibe caracteres chineses como caracteres estranhos (mojibake)
- O mesmo comando parece correto em outro perfil de terminal

Solução rápida no PowerShell:

```powershell
chcp 65001
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
```

Depois reinicie o Gateway e tente novamente o seu comando:

```powershell
opencraft gateway restart
```

Se ainda reproduzir isso na versão mais recente do OpenCraft, acompanhe/reporte em:

- [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

### A documentação não respondeu minha dúvida como obter uma resposta melhor

Use a **instalação hackable (git)** para ter o código-fonte e a documentação completos
localmente, depois pergunte ao seu bot (ou ao Claude/Codex) _a partir dessa pasta_ para que
ele possa ler o repositório e responder com precisão.

```bash
curl -fsSL https://opencraft.ai/install.sh | bash -s -- --install-method git
```

Mais detalhes: [Install](/install) e [Flags do instalador](/install/installer).

### Como instalo o OpenCraft no Linux

Resposta curta: siga o guia do Linux e depois execute o assistente de integração.

- Caminho rápido para Linux + instalação de serviço: [Linux](/platforms/linux).
- Guia completo: [Primeiros Passos](/start/getting-started).
- Instalador + atualizações: [Instalação e atualizações](/install/updating).

### Como instalo o OpenCraft em um VPS

Qualquer VPS Linux funciona. Instale no servidor e depois use SSH/Tailscale para acessar o Gateway.

Guias: [exe.dev](/install/exe-dev), [Hetzner](/install/hetzner), [Fly.io](/install/fly).
Acesso remoto: [Gateway remoto](/gateway/remote).

### Onde ficam os guias de instalação em nuvemVPS

Mantemos um **hub de hospedagem** com os provedores mais comuns. Escolha um e siga o guia:

- [Hospedagem VPS](/vps) (todos os provedores em um só lugar)
- [Fly.io](/install/fly)
- [Hetzner](/install/hetzner)
- [exe.dev](/install/exe-dev)

Como funciona na nuvem: o **Gateway roda no servidor** e você o acessa pelo laptop/telefone
via interface de controle (ou Tailscale/SSH). Seu estado + workspace ficam no servidor, portanto
trate o host como a fonte da verdade e faça backup dele.

Você pode parear **nós** (Mac/iOS/Android/headless) com esse Gateway na nuvem para acessar a
tela local/câmera/canvas ou executar comandos no laptop enquanto mantém o Gateway na nuvem.

Hub: [Platforms](/platforms). Acesso remoto: [Gateway remoto](/gateway/remote).
Nodes: [Nodes](/nodes), [Nodes CLI](/cli/nodes).

### Posso pedir ao OpenCraft para se atualizar

Resposta curta: **possível, não recomendado**. O fluxo de atualização pode reiniciar o
Gateway (o que encerra a sessão ativa), pode precisar de um checkout git limpo e pode solicitar
confirmação. É mais seguro executar atualizações a partir de um shell como operador.

Use a CLI:

```bash
opencraft update
opencraft update status
opencraft update --channel stable|beta|dev
opencraft update --tag <dist-tag|version>
opencraft update --no-restart
```

Se precisar automatizar a partir de um agente:

```bash
opencraft update --yes --no-restart
opencraft gateway restart
```

Documentação: [Update](/cli/update), [Atualizando](/install/updating).

### O que o assistente de integração faz exatamente

`opencraft onboard` é o caminho de configuração recomendado. No **modo local** ele guia você por:

- **Configuração de modelo/autenticação** (fluxos OAuth/setup-token de provedores e chaves de API suportadas, além de opções de modelos locais como LM Studio)
- **Workspace** — localização + arquivos de bootstrap
- **Configurações do Gateway** (bind/porta/autenticação/tailscale)
- **Provedores** (WhatsApp, Telegram, Discord, Mattermost (plugin), Signal, iMessage)
- **Instalação do daemon** (LaunchAgent no macOS; unit de usuário systemd no Linux/WSL2)
- **Verificações de saúde** e seleção de **skills**

Também avisa se o modelo configurado for desconhecido ou não tiver autenticação.

### Preciso de uma assinatura do Claude ou da OpenAI para usar

Não. Você pode rodar o OpenCraft com **chaves de API** (Anthropic/OpenAI/outros) ou com
**modelos locais** para que seus dados fiquem no dispositivo. Assinaturas (Claude Pro/Max ou
OpenAI Codex) são formas opcionais de autenticar nesses provedores.

Se escolher a autenticação por assinatura da Anthropic, decida por conta própria se vale usá-la:
a Anthropic já bloqueou algum uso de assinaturas fora do Claude Code no passado.
O OAuth do OpenAI Codex é explicitamente suportado para ferramentas externas como o OpenCraft.

Documentação: [Anthropic](/providers/anthropic), [OpenAI](/providers/openai),
[Modelos locais](/gateway/local-models), [Models](/concepts/models).

### Posso usar a assinatura Claude Max sem uma chave de API

Sim. Você pode autenticar com um **setup-token**
em vez de uma chave de API. Este é o caminho para assinaturas.

As assinaturas Claude Pro/Max **não incluem uma chave de API**, portanto esse é o
caminho técnico para contas de assinatura. Mas a decisão é sua: a Anthropic já bloqueou
algum uso de assinaturas fora do Claude Code no passado.
Se quiser o caminho mais claro e seguro para produção, use uma chave de API da Anthropic.

### Como funciona a autenticação setup-token da Anthropic

`claude setup-token` gera uma **string de token** via CLI do Claude Code (não está disponível no
console web). Você pode executá-lo em **qualquer máquina**. Escolha **Anthropic token (paste
setup-token)** no assistente ou cole-o com `opencraft models auth paste-token --provider anthropic`.
O token é armazenado como um perfil de autenticação para o provedor **anthropic** e usado como
uma chave de API (sem atualização automática). Mais detalhes: [OAuth](/concepts/oauth).

### Onde encontro um setup-token da Anthropic

Ele **não** fica no Console da Anthropic. O setup-token é gerado pelo **CLI do Claude Code** em
**qualquer máquina**:

```bash
claude setup-token
```

Copie o token que ele imprime e escolha **Anthropic token (paste setup-token)** no assistente.
Se quiser executar no host do gateway, use `opencraft models auth setup-token --provider anthropic`.
Se executou `claude setup-token` em outro lugar, cole-o no host do gateway com
`opencraft models auth paste-token --provider anthropic`. Veja [Anthropic](/providers/anthropic).

### Vocês oferecem suporte à autenticação por assinatura do Claude Claude Pro ou Max

Sim — via **setup-token**. O OpenCraft não reutiliza mais os tokens OAuth da CLI do Claude Code;
use um setup-token ou uma chave de API da Anthropic. Gere o token em qualquer lugar e cole-o no
host do gateway. Veja [Anthropic](/providers/anthropic) e [OAuth](/concepts/oauth).

Importante: isso é compatibilidade técnica, não uma garantia de política. A Anthropic já bloqueou
algum uso de assinaturas fora do Claude Code no passado.
Você precisa decidir se vai usar e verificar os termos atuais da Anthropic.
Para cargas de trabalho de produção ou multiusuário, a autenticação por chave de API da Anthropic
é a escolha mais segura e recomendada.

### Por que estou vendo HTTP 429 ratelimiterror da Anthropic

Isso significa que a sua **cota/limite de taxa da Anthropic** foi esgotada para a janela atual.
Se você usa uma **assinatura do Claude** (setup-token), aguarde a janela reiniciar ou faça um
upgrade do plano. Se você usa uma **chave de API da Anthropic**, verifique o Console da Anthropic
para uso/cobrança e aumente os limites conforme necessário.

Se a mensagem for especificamente:
`Extra usage is required for long context requests`, a requisição está tentando usar o beta de
contexto de 1M da Anthropic (`context1m: true`). Isso só funciona quando a sua credencial é
elegível para cobrança de contexto longo (chave de API com cobrança ou assinatura com Extra Usage
ativado).

Dica: defina um **modelo de fallback** para que o OpenCraft possa continuar respondendo enquanto
um provedor está com limite de taxa.
Veja [Models](/cli/models), [OAuth](/concepts/oauth) e
[/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

### O AWS Bedrock é suportado

Sim — via provedor **Amazon Bedrock (Converse)** do pi-ai com **configuração manual**. Você deve
fornecer credenciais/região da AWS no host do gateway e adicionar uma entrada de provedor Bedrock
na sua configuração de modelos. Veja [Amazon Bedrock](/providers/bedrock) e
[Provedores de modelos](/providers/models). Se preferir um fluxo gerenciado de chaves, um proxy
compatível com OpenAI na frente do Bedrock ainda é uma opção válida.

### Como funciona a autenticação do Codex

O OpenCraft suporta **OpenAI Code (Codex)** via OAuth (login com ChatGPT). O assistente pode
executar o fluxo OAuth e definirá o modelo padrão como `openai-codex/gpt-5.4` quando apropriado.
Veja [Provedores de modelos](/concepts/model-providers) e [Wizard](/start/wizard).

### Vocês oferecem suporte à autenticação por assinatura da OpenAI Codex OAuth

Sim. O OpenCraft oferece suporte total ao **OAuth de assinatura OpenAI Code (Codex)**.
A OpenAI permite explicitamente o uso de OAuth de assinatura em ferramentas/fluxos de trabalho
externos como o OpenCraft. O assistente de integração pode executar o fluxo OAuth para você.

Veja [OAuth](/concepts/oauth), [Provedores de modelos](/concepts/model-providers) e [Wizard](/start/wizard).

### Como configuro o OAuth do Gemini CLI

O Gemini CLI usa um **fluxo de autenticação de plugin**, não um client id ou secret em `opencraft.json`.

Etapas:

1. Ative o plugin: `opencraft plugins enable google-gemini-cli-auth`
2. Faça login: `opencraft models auth login --provider google-gemini-cli --set-default`

Isso armazena tokens OAuth em perfis de autenticação no host do gateway. Detalhes: [Provedores de modelos](/concepts/model-providers).

### Um modelo local é adequado para conversas casuais

Geralmente não. O OpenCraft precisa de contexto grande + alta qualidade de segurança; modelos
pequenos truncam e vazam. Se precisar, execute o maior build do MiniMax M2.5 que conseguir
localmente (LM Studio) e veja [/gateway/local-models](/gateway/local-models). Modelos menores/quantizados
aumentam o risco de injeção de prompt — veja [Segurança](/gateway/security).

### Como mantenho o tráfego de modelos hospedados em uma região específica

Escolha endpoints com região fixada. O OpenRouter expõe opções hospedadas nos EUA para MiniMax,
Kimi e GLM; escolha a variante hospedada nos EUA para manter os dados na região. Você ainda pode
listar Anthropic/OpenAI junto com esses usando `models.mode: "merge"` para que os fallbacks
permaneçam disponíveis enquanto respeita o provedor regionalizado selecionado.

### Preciso comprar um Mac Mini para instalar

Não. O OpenCraft roda em macOS ou Linux (Windows via WSL2). Um Mac mini é opcional — algumas
pessoas compram um como host sempre ativo, mas um VPS pequeno, servidor doméstico ou Raspberry Pi
também funcionam.

Você só precisa de um Mac para **ferramentas exclusivas do macOS**. Para iMessage, use
[BlueBubbles](/channels/bluebubbles) (recomendado) — o servidor BlueBubbles roda em qualquer Mac
e o Gateway pode rodar no Linux ou em outro lugar. Se quiser outras ferramentas exclusivas do
macOS, rode o Gateway em um Mac ou pareie um nó macOS.

Documentação: [BlueBubbles](/channels/bluebubbles), [Nodes](/nodes), [Modo remoto Mac](/platforms/mac/remote).

### Preciso de um Mac mini para suporte ao iMessage

Você precisa de **algum dispositivo macOS** com o Messages ativo. Não precisa ser um Mac mini —
qualquer Mac serve. **Use [BlueBubbles](/channels/bluebubbles)** (recomendado) para iMessage —
o servidor BlueBubbles roda no macOS, enquanto o Gateway pode rodar no Linux ou em outro lugar.

Configurações comuns:

- Rode o Gateway no Linux/VPS e o servidor BlueBubbles em qualquer Mac com o Messages ativo.
- Rode tudo no Mac se quiser a configuração mais simples em uma única máquina.

Documentação: [BlueBubbles](/channels/bluebubbles), [Nodes](/nodes),
[Modo remoto Mac](/platforms/mac/remote).

### Se comprar um Mac mini para rodar o OpenCraft posso conectá-lo ao meu MacBook Pro

Sim. O **Mac mini pode rodar o Gateway** e seu MacBook Pro pode se conectar como **nó**
(dispositivo companheiro). Os nós não rodam o Gateway — eles fornecem capacidades extras
como tela/câmera/canvas e `system.run` naquele dispositivo.

Padrão comum:

- Gateway no Mac mini (sempre ativo).
- MacBook Pro roda o app macOS ou um host de nó e se pareia com o Gateway.
- Use `opencraft nodes status` / `opencraft nodes list` para verificar.

Documentação: [Nodes](/nodes), [Nodes CLI](/cli/nodes).

### Posso usar o Bun

Bun **não é recomendado**. Observamos bugs de runtime, especialmente com WhatsApp e Telegram.
Use **Node** para gateways estáveis.

Se ainda quiser experimentar o Bun, faça-o em um gateway que não seja de produção e sem
WhatsApp/Telegram.

### Telegram o que vai em allowFrom

`channels.telegram.allowFrom` é **o ID Telegram numérico do remetente humano**. Não é o
nome de usuário do bot.

O assistente de integração aceita entrada no formato `@username` e o resolve para um ID
numérico, mas a autorização do OpenCraft usa somente IDs numéricos.

Mais seguro (sem bot de terceiros):

- Envie uma DM ao seu bot e execute `opencraft logs --follow` para ler `from.id`.

API oficial do Bot:

- Envie uma DM ao seu bot e chame `https://api.telegram.org/bot<bot_token>/getUpdates` para ler `message.from.id`.

Terceiros (menos privado):

- Envie DM para `@userinfobot` ou `@getidsbot`.

Veja [/channels/telegram](/channels/telegram#access-control-dms--groups).

### Várias pessoas podem usar um número do WhatsApp com instâncias diferentes do OpenCraft

Sim, via **roteamento multi-agent**. Vincule o **DM WhatsApp** de cada remetente (peer
`kind: "direct"`, remetente em E.164 como `+5511999999999`) a um `agentId` diferente, para que
cada pessoa tenha seu próprio workspace e armazenamento de sessões. As respostas ainda vêm
da **mesma conta WhatsApp**, e o controle de acesso a DMs (`channels.whatsapp.dmPolicy` /
`channels.whatsapp.allowFrom`) é global por conta WhatsApp. Veja
[Roteamento Multi-Agent](/concepts/multi-agent) e [WhatsApp](/channels/whatsapp).

### Posso ter um agente de chat rápido e um agente Opus para programação

Sim. Use roteamento multi-agent: dê a cada agente seu próprio modelo padrão e depois vincule
as rotas de entrada (conta do provedor ou peers específicos) a cada agente. Um exemplo de
configuração está em [Roteamento Multi-Agent](/concepts/multi-agent). Veja também
[Models](/concepts/models) e [Configuration](/gateway/configuration).

### O Homebrew funciona no Linux

Sim. O Homebrew suporta Linux (Linuxbrew). Configuração rápida:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
brew install <formula>
```

Se você roda o OpenCraft via systemd, certifique-se de que o PATH do serviço inclua
`/home/linuxbrew/.linuxbrew/bin` (ou seu prefixo brew) para que as ferramentas instaladas pelo
`brew` sejam encontradas em shells não-login.
Builds recentes também adicionam diretórios comuns de bin de usuário no início do PATH em
serviços systemd no Linux (por exemplo `~/.local/bin`, `~/.npm-global/bin`,
`~/.local/share/pnpm`, `~/.bun/bin`) e respeitam `PNPM_HOME`, `NPM_CONFIG_PREFIX`,
`BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando definidos.

### Qual é a diferença entre a instalação hackable git e a instalação via npm

- **Instalação hackable (git):** checkout completo do código-fonte, editável, melhor para contribuidores.
  Você executa builds localmente e pode modificar o código/docs.
- **Instalação npm:** CLI global instalado, sem repositório, melhor para "apenas executar".
  As atualizações vêm dos dist-tags do npm.

Documentação: [Primeiros passos](/start/getting-started), [Atualizando](/install/updating).

### Posso alternar entre instalações npm e git depois

Sim. Instale a outra versão e depois execute o Doctor para que o serviço do gateway aponte para o
novo ponto de entrada.
Isso **não apaga seus dados** — apenas muda a instalação do código do OpenCraft. Seu estado
(`~/.opencraft`) e workspace (`~/.opencraft/workspace`) permanecem intactos.

De npm → git:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
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

O Doctor detecta uma incompatibilidade no ponto de entrada do serviço do gateway e oferece
reescrever a configuração do serviço para corresponder à instalação atual (use `--repair` na
automação).

Dicas de backup: veja [Estratégia de backup](/help/faq#qual-e-a-estrategia-de-backup-recomendada).

### Devo rodar o Gateway no meu laptop ou em um VPS

Resposta curta: **se quiser confiabilidade 24/7, use um VPS**. Se quiser o menor atrito e não
se importar com suspensões/reinicializações, rode localmente.

**Laptop (Gateway local)**

- **Prós:** sem custo de servidor, acesso direto a arquivos locais, janela do navegador ao vivo.
- **Contras:** suspensão/queda de rede = desconexões, atualizações/reinicializações de SO
  interrompem, precisa ficar acordado.

**VPS / nuvem**

- **Prós:** sempre ativo, rede estável, sem problemas de suspensão do laptop, mais fácil de
  manter em execução.
- **Contras:** geralmente roda headless (use capturas de tela), acesso a arquivos apenas remoto,
  você deve acessar via SSH para atualizações.

**Nota específica do OpenCraft:** WhatsApp/Telegram/Slack/Mattermost (plugin)/Discord funcionam
bem a partir de um VPS. A única troca real é **navegador headless** vs uma janela visível.
Veja [Browser](/tools/browser).

**Padrão recomendado:** VPS se você teve desconexões do gateway antes. Local é ótimo quando você
está usando o Mac ativamente e quer acesso a arquivos locais ou automação de interface com um
navegador visível.

### Quão importante é rodar o OpenCraft em uma máquina dedicada

Não é obrigatório, mas **recomendado para confiabilidade e isolamento**.

- **Host dedicado (VPS/Mac mini/Pi):** sempre ativo, menos interrupções por suspensão/reinicialização,
  permissões mais limpas, mais fácil de manter em execução.
- **Laptop/desktop compartilhado:** totalmente válido para testes e uso ativo, mas espere pausas
  quando a máquina suspender ou atualizar.

Se quiser o melhor dos dois mundos, mantenha o Gateway em um host dedicado e pareie seu laptop
como **nó** para ferramentas locais de tela/câmera/exec. Veja [Nodes](/nodes).
Para orientação de segurança, leia [Security](/gateway/security).

### Quais são os requisitos mínimos de VPS e o sistema operacional recomendado

O OpenCraft é leve. Para um Gateway básico + um canal de chat:

- **Mínimo absoluto:** 1 vCPU, 1GB de RAM, ~500MB de disco.
- **Recomendado:** 1-2 vCPU, 2GB de RAM ou mais para folga (logs, mídia, múltiplos canais). As
  ferramentas de nós e automação de navegador podem ser bastante exigentes em recursos.

SO: use **Ubuntu LTS** (ou qualquer Debian/Ubuntu moderno). O caminho de instalação no Linux é
mais testado ali.

Documentação: [Linux](/platforms/linux), [Hospedagem VPS](/vps).

### Posso rodar o OpenCraft em uma VM e quais são os requisitos

Sim. Trate uma VM da mesma forma que um VPS: ela precisa estar sempre ativa, acessível e ter RAM
suficiente para o Gateway e quaisquer canais que você ativar.

Orientação básica:

- **Mínimo absoluto:** 1 vCPU, 1GB de RAM.
- **Recomendado:** 2GB de RAM ou mais se você rodar múltiplos canais, automação de navegador ou
  ferramentas de mídia.
- **SO:** Ubuntu LTS ou outro Debian/Ubuntu moderno.

Se estiver no Windows, o **WSL2 é a configuração mais fácil no estilo VM** e tem a melhor
compatibilidade de ferramentas. Veja [Windows](/platforms/windows), [Hospedagem VPS](/vps).
Se estiver rodando macOS em uma VM, veja [macOS VM](/install/macos-vm).

## O que é o OpenCraft?

### O que é o OpenCraft em um parágrafo

O OpenCraft é um assistente de IA pessoal que você roda nos seus próprios dispositivos. Ele
responde nas superfícies de mensagens que você já usa (WhatsApp, Telegram, Slack, Mattermost
(plugin), Discord, Google Chat, Signal, iMessage, WebChat) e também pode fazer voz + um Canvas
ao vivo nas plataformas compatíveis. O **Gateway** é o plano de controle sempre ativo; o
assistente é o produto.

### Qual é a proposta de valor

O OpenCraft não é "apenas um wrapper do Claude." É um **plano de controle local-first** que
permite rodar um assistente capaz no **seu próprio hardware**, acessível a partir dos aplicativos
de chat que você já usa, com sessões com estado, memória e ferramentas — sem entregar o controle
dos seus fluxos de trabalho para um SaaS hospedado.

Destaques:

- **Seus dispositivos, seus dados:** rode o Gateway onde quiser (Mac, Linux, VPS) e mantenha o
  workspace + histórico de sessões localmente.
- **Canais reais, não uma sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
  além de voz mobile e Canvas nas plataformas suportadas.
- **Agnóstico de modelo:** use Anthropic, OpenAI, MiniMax, OpenRouter, etc., com roteamento
  por agente e failover.
- **Opção totalmente local:** rode modelos locais para que **todos os dados possam ficar no seu
  dispositivo** se você quiser.
- **Roteamento multi-agent:** agentes separados por canal, conta ou tarefa, cada um com seu próprio
  workspace e histórico de sessões.
  espaço de trabalho e os padrões.
- **Código aberto e personalizável:** inspecione, estenda e hospede sem depender de fornecedores.

Docs: [Gateway](/gateway), [Canais](/channels), [Multiagente](/concepts/multi-agent),
[Memória](/concepts/memory).

### Acabei de configurar, o que devo fazer primeiro

Bons projetos iniciais:

- Criar um site (WordPress, Shopify ou um site estático simples).
- Prototipar um aplicativo móvel (esboço, telas, plano de API).
- Organizar arquivos e pastas (limpeza, nomenclatura, etiquetagem).
- Conectar o Gmail e automatizar resumos ou acompanhamentos.

Ele lida bem com tarefas grandes, mas funciona melhor quando você as divide em fases e
usa subagentes para trabalho paralelo.

### Quais são os cinco casos de uso cotidianos mais comuns do OpenCraft

Os ganhos do dia a dia geralmente incluem:

- **Briefings pessoais:** resumos de caixa de entrada, calendário e notícias de seu interesse.
- **Pesquisa e rascunhos:** pesquisas rápidas, resumos e primeiros rascunhos de e-mails ou documentos.
- **Lembretes e acompanhamentos:** notificações e listas de verificação acionadas por cron ou heartbeat.
- **Automação de navegador:** preenchimento de formulários, coleta de dados e repetição de tarefas na web.
- **Coordenação entre dispositivos:** envie uma tarefa pelo celular, deixe o Gateway executá-la em um servidor e receba o resultado no chat.

### O OpenCraft pode ajudar com geração de leads, anúncios e blogs para um SaaS

Sim, para **pesquisa, qualificação e criação de rascunhos**. Ele consegue escanear sites, criar listas selecionadas,
resumir prospects e escrever rascunhos de outreach ou copy para anúncios.

Para **execução de outreach ou campanhas de anúncios**, mantenha um humano no processo. Evite spam, siga as leis locais e as
políticas das plataformas, e revise tudo antes de enviar. O padrão mais seguro é deixar o
OpenCraft redigir e você aprovar.

Docs: [Segurança](/gateway/security).

### Quais são as vantagens em relação ao Claude Code para desenvolvimento web

O OpenCraft é um **assistente pessoal** e camada de coordenação, não um substituto de IDE. Use
Claude Code ou Codex para o ciclo de codificação direta mais rápido dentro de um repositório. Use o OpenCraft quando quiser
memória durável, acesso entre dispositivos e orquestração de ferramentas.

Vantagens:

- **Memória + espaço de trabalho persistentes** entre sessões
- **Acesso multiplataforma** (WhatsApp, Telegram, TUI, WebChat)
- **Orquestração de ferramentas** (navegador, arquivos, agendamento, hooks)
- **Gateway sempre ativo** (execute em um VPS, acesse de qualquer lugar)
- **Nós** para navegador/tela/câmera/exec local

Showcase: [https://opencraft.ai/showcase](https://opencraft.ai/showcase)

## Habilidades e automação

### Como personalizar habilidades sem deixar o repositório sujo

Use substituições gerenciadas em vez de editar a cópia do repositório. Coloque suas alterações em `~/.opencraft/skills/<name>/SKILL.md` (ou adicione uma pasta via `skills.load.extraDirs` em `~/.opencraft/opencraft.json`). A precedência é `<workspace>/skills` > `~/.opencraft/skills` > bundled, então as substituições gerenciadas têm prioridade sem tocar no git. Apenas edições que valem a pena contribuir de volta ao upstream devem ficar no repositório e ser enviadas como PRs.

### Posso carregar habilidades de uma pasta personalizada

Sim. Adicione diretórios extras via `skills.load.extraDirs` em `~/.opencraft/opencraft.json` (precedência mais baixa). A precedência padrão permanece: `<workspace>/skills` → `~/.opencraft/skills` → bundled → `skills.load.extraDirs`. O `clawhub` instala em `./skills` por padrão, o que o OpenCraft trata como `<workspace>/skills`.

### Como posso usar modelos diferentes para tarefas diferentes

Hoje os padrões suportados são:

- **Tarefas cron**: tarefas isoladas podem definir uma substituição de `model` por tarefa.
- **Subagentes**: roteie tarefas para agentes separados com modelos padrão diferentes.
- **Troca sob demanda**: use `/model` para alternar o modelo da sessão atual a qualquer momento.

Veja [Tarefas cron](/automation/cron-jobs), [Roteamento multiagente](/concepts/multi-agent) e [Comandos slash](/tools/slash-commands).

### O bot trava durante trabalhos pesados. Como faço para descarregar isso

Use **subagentes** para tarefas longas ou paralelas. Os subagentes rodam em sua própria sessão,
retornam um resumo e mantêm seu chat principal responsivo.

Peça ao bot para "iniciar um subagente para esta tarefa" ou use `/subagents`.
Use `/status` no chat para ver o que o Gateway está fazendo agora (e se está ocupado).

Dica sobre tokens: tarefas longas e subagentes consomem tokens. Se o custo for uma preocupação, configure um
modelo mais barato para subagentes via `agents.defaults.subagents.model`.

Docs: [Subagentes](/tools/subagents).

### Como funcionam as sessões de subagente vinculadas a thread no Discord

Use vinculações de thread. Você pode vincular uma thread do Discord a um subagente ou destino de sessão para que as mensagens de acompanhamento nessa thread permaneçam nessa sessão vinculada.

Fluxo básico:

- Inicie com `sessions_spawn` usando `thread: true` (e opcionalmente `mode: "session"` para acompanhamento persistente).
- Ou vincule manualmente com `/focus <target>`.
- Use `/agents` para inspecionar o estado de vinculação.
- Use `/session idle <duration|off>` e `/session max-age <duration|off>` para controlar o desfoco automático.
- Use `/unfocus` para desvincular a thread.

Configuração necessária:

- Padrões globais: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- Substituições do Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
- Vinculação automática ao iniciar: defina `channels.discord.threadBindings.spawnSubagentSessions: true`.

Docs: [Subagentes](/tools/subagents), [Discord](/channels/discord), [Referência de configuração](/gateway/configuration-reference), [Comandos slash](/tools/slash-commands).

### Cron ou lembretes não disparam. O que devo verificar

O cron roda dentro do processo do Gateway. Se o Gateway não estiver em execução contínua,
as tarefas agendadas não serão executadas.

Lista de verificação:

- Confirme que o cron está habilitado (`cron.enabled`) e que `OPENCLAW_SKIP_CRON` não está definido.
- Verifique se o Gateway está rodando 24/7 (sem suspensão/reinicializações).
- Verifique as configurações de fuso horário para a tarefa (`--tz` vs fuso horário do host).

Depuração:

```bash
opencraft cron run <jobId> --force
opencraft cron runs --id <jobId> --limit 50
```

Docs: [Tarefas cron](/automation/cron-jobs), [Cron vs Heartbeat](/automation/cron-vs-heartbeat).

### Como instalo habilidades no Linux

Use o **ClawHub** (CLI) ou coloque habilidades no seu espaço de trabalho. A interface de Habilidades do macOS não está disponível no Linux.
Navegue pelas habilidades em [https://clawhub.com](https://clawhub.com).

Instale o CLI do ClawHub (escolha um gerenciador de pacotes):

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

### O OpenCraft pode executar tarefas em um agendamento ou continuamente em segundo plano

Sim. Use o agendador do Gateway:

- **Tarefas cron** para tarefas agendadas ou recorrentes (persistem entre reinicializações).
- **Heartbeat** para verificações periódicas da "sessão principal".
- **Tarefas isoladas** para agentes autônomos que postam resumos ou entregam para chats.

Docs: [Tarefas cron](/automation/cron-jobs), [Cron vs Heartbeat](/automation/cron-vs-heartbeat),
[Heartbeat](/gateway/heartbeat).

### Posso executar habilidades exclusivas do macOS da Apple a partir do Linux?

Não diretamente. As habilidades do macOS são restritas por `metadata.openclaw.os` mais os binários necessários, e as habilidades só aparecem no prompt do sistema quando são elegíveis no **host do Gateway**. No Linux, habilidades exclusivas do `darwin` (como `apple-notes`, `apple-reminders`, `things-mac`) não serão carregadas a menos que você substitua a restrição.

Você tem três padrões suportados:

**Opção A - execute o Gateway em um Mac (mais simples).**
Execute o Gateway onde os binários do macOS existem, depois conecte do Linux em [modo remoto](#how-do-i-run-openclaw-in-remote-mode-client-connects-to-a-gateway-elsewhere) ou via Tailscale. As habilidades carregam normalmente porque o host do Gateway é macOS.

**Opção B - use um nó macOS (sem SSH).**
Execute o Gateway no Linux, emparelhe um nó macOS (app da barra de menus) e defina **Comandos de Execução do Nó** como "Sempre Perguntar" ou "Sempre Permitir" no Mac. O OpenCraft pode tratar habilidades exclusivas do macOS como elegíveis quando os binários necessários existem no nó. O agente executa essas habilidades via a ferramenta `nodes`. Se você escolher "Sempre Perguntar", aprovar "Sempre Permitir" no prompt adiciona esse comando à lista de permissões.

**Opção C - proxiar binários do macOS via SSH (avançado).**
Mantenha o Gateway no Linux, mas faça os binários CLI necessários resolverem para wrappers SSH que rodam em um Mac. Em seguida, substitua a habilidade para permitir o Linux para que ela permaneça elegível.

1. Crie um wrapper SSH para o binário (exemplo: `memo` para o Apple Notes):

   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
   ```

2. Coloque o wrapper no `PATH` no host Linux (por exemplo `~/bin/memo`).
3. Substitua os metadados da habilidade (espaço de trabalho ou `~/.opencraft/skills`) para permitir o Linux:

   ```markdown
   ---
   name: apple-notes
   description: Manage Apple Notes via the memo CLI on macOS.
   metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
   ---
   ```

4. Inicie uma nova sessão para que o snapshot de habilidades seja atualizado.

### Vocês têm integração com Notion ou HeyGen

Não integrado por padrão hoje.

Opções:

- **Habilidade / plugin personalizado:** melhor para acesso confiável à API (Notion/HeyGen têm APIs).
- **Automação de navegador:** funciona sem código, mas é mais lento e frágil.

Se você quiser manter contexto por cliente (fluxos de trabalho de agência), um padrão simples é:

- Uma página do Notion por cliente (contexto + preferências + trabalho ativo).
- Peça ao agente para buscar essa página no início de uma sessão.

Se você quiser uma integração nativa, abra uma solicitação de recurso ou crie uma habilidade
direcionada a essas APIs.

Instale habilidades:

```bash
clawhub install <skill-slug>
clawhub update --all
```

O ClawHub instala em `./skills` no seu diretório atual (ou usa como fallback o espaço de trabalho do OpenCraft configurado); o OpenCraft trata isso como `<workspace>/skills` na próxima sessão. Para habilidades compartilhadas entre agentes, coloque-as em `~/.opencraft/skills/<name>/SKILL.md`. Algumas habilidades esperam binários instalados via Homebrew; no Linux isso significa Linuxbrew (veja a entrada do FAQ do Homebrew Linux acima). Veja [Habilidades](/tools/skills) e [ClawHub](/tools/clawhub).

### Como instalo a extensão do Chrome para controle de navegador

Use o instalador embutido, depois carregue a extensão desempacotada no Chrome:

```bash
opencraft browser extension install
opencraft browser extension path
```

Em seguida, Chrome → `chrome://extensions` → habilite "Modo de desenvolvedor" → "Carregar sem compactação" → selecione essa pasta.

Guia completo (incluindo Gateway remoto + notas de segurança): [Extensão do Chrome](/tools/chrome-extension)

Se o Gateway roda na mesma máquina que o Chrome (configuração padrão), geralmente você **não** precisa de nada extra.
Se o Gateway roda em outro lugar, execute um host de nó na máquina do navegador para que o Gateway possa proxiar ações do navegador.
Você ainda precisa clicar no botão da extensão na aba que quer controlar (ela não se conecta automaticamente).

## Sandboxing e memória

### Existe um documento dedicado ao sandboxing

Sim. Veja [Sandboxing](/gateway/sandboxing). Para configuração específica do Docker (gateway completo no Docker ou imagens sandbox), veja [Docker](/install/docker).

### O Docker parece limitado. Como habilito os recursos completos

A imagem padrão é focada em segurança e roda como o usuário `node`, portanto não
inclui pacotes de sistema, Homebrew ou navegadores integrados. Para uma configuração mais completa:

- Persista `/home/node` com `OPENCLAW_HOME_VOLUME` para que os caches sobrevivam.
- Adicione dependências de sistema à imagem com `OPENCLAW_DOCKER_APT_PACKAGES`.
- Instale navegadores Playwright via CLI integrado:
  `node /app/node_modules/playwright-core/cli.js install chromium`
- Defina `PLAYWRIGHT_BROWSERS_PATH` e garanta que o caminho seja persistido.

Docs: [Docker](/install/docker), [Navegador](/tools/browser).

**Posso manter DMs pessoais mas tornar grupos públicos com sandbox em um único agente**

Sim - se seu tráfego privado são **DMs** e seu tráfego público são **grupos**.

Use `agents.defaults.sandbox.mode: "non-main"` para que sessões de grupo/canal (chaves não principais) rodem no Docker, enquanto a sessão principal de DM permanece no host. Em seguida, restrinja quais ferramentas estão disponíveis em sessões com sandbox via `tools.sandbox.tools`.

Passo a passo de configuração + exemplo: [Grupos: DMs pessoais + grupos públicos](/channels/groups#pattern-personal-dms-public-groups-single-agent)

Referência de configuração principal: [Configuração do Gateway](/gateway/configuration#agentsdefaultssandbox)

### Como vinculo uma pasta do host ao sandbox

Defina `agents.defaults.sandbox.docker.binds` para `["host:path:mode"]` (ex.: `"/home/user/src:/src:ro"`). Vinculações globais e por agente são mescladas; vinculações por agente são ignoradas quando `scope: "shared"`. Use `:ro` para qualquer coisa sensível e lembre-se de que vinculações ignoram as paredes do sistema de arquivos do sandbox. Veja [Sandboxing](/gateway/sandboxing#custom-bind-mounts) e [Sandbox vs Política de Ferramentas vs Elevado](/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) para exemplos e notas de segurança.

### Como funciona a memória

A memória do OpenCraft são apenas arquivos Markdown no espaço de trabalho do agente:

- Notas diárias em `memory/YYYY-MM-DD.md`
- Notas de longo prazo selecionadas em `MEMORY.md` (apenas sessões principais/privadas)

O OpenCraft também executa uma **descarga de memória silenciosa pré-compactação** para lembrar ao modelo
de escrever notas duráveis antes da compactação automática. Isso só roda quando o espaço de trabalho
é gravável (sandboxes somente leitura o ignoram). Veja [Memória](/concepts/memory).

### A memória continua esquecendo coisas. Como faço para que persista

Peça ao bot para **escrever o fato na memória**. Notas de longo prazo pertencem ao `MEMORY.md`,
contexto de curto prazo vai para `memory/YYYY-MM-DD.md`.

Esta ainda é uma área em que estamos melhorando. Ajuda lembrar o modelo de armazenar memórias;
ele saberá o que fazer. Se continuar esquecendo, verifique se o Gateway está usando o mesmo
espaço de trabalho em toda execução.

Docs: [Memória](/concepts/memory), [Espaço de trabalho do agente](/concepts/agent-workspace).

### A pesquisa de memória semântica requer uma chave de API do OpenAI

Somente se você usar **embeddings do OpenAI**. O OAuth do Codex cobre chat/completions e
**não** concede acesso a embeddings, portanto **fazer login com Codex (OAuth ou o
login do Codex CLI)** não ajuda para pesquisa de memória semântica. Os embeddings do OpenAI
ainda precisam de uma chave de API real (`OPENAI_API_KEY` ou `models.providers.openai.apiKey`).

Se você não definir um provedor explicitamente, o OpenCraft seleciona automaticamente um provedor quando consegue
resolver uma chave de API (perfis de autenticação, `models.providers.*.apiKey` ou variáveis de ambiente).
Ele prefere OpenAI se uma chave OpenAI for resolvida; caso contrário, Gemini se uma chave Gemini for
resolvida, depois Voyage, depois Mistral. Se nenhuma chave remota estiver disponível, a pesquisa de
memória fica desabilitada até você configurá-la. Se você tiver um caminho de modelo local
configurado e presente, o OpenCraft
prefere `local`. O Ollama é suportado quando você define explicitamente
`memorySearch.provider = "ollama"`.

Se preferir permanecer local, defina `memorySearch.provider = "local"` (e opcionalmente
`memorySearch.fallback = "none"`). Se você quiser embeddings do Gemini, defina
`memorySearch.provider = "gemini"` e forneça `GEMINI_API_KEY` (ou
`memorySearch.remote.apiKey`). Suportamos modelos de embedding **OpenAI, Gemini, Voyage, Mistral, Ollama ou local** -
veja [Memória](/concepts/memory) para os detalhes de configuração.

### A memória persiste para sempre? Quais são os limites

Os arquivos de memória ficam no disco e persistem até você excluí-los. O limite é o seu
armazenamento, não o modelo. O **contexto da sessão** ainda é limitado pela janela de contexto do modelo,
então conversas longas podem compactar ou truncar. É por isso que existe a pesquisa de
memória - ela traz apenas as partes relevantes de volta ao contexto.

Docs: [Memória](/concepts/memory), [Contexto](/concepts/context).

## Onde as coisas ficam no disco

### Todos os dados usados com o OpenCraft são salvos localmente

Não - **o estado do OpenCraft é local**, mas **serviços externos ainda veem o que você envia para eles**.

- **Local por padrão:** sessões, arquivos de memória, configuração e espaço de trabalho ficam no host do Gateway
  (`~/.opencraft` + seu diretório de espaço de trabalho).
- **Remoto por necessidade:** mensagens que você envia para provedores de modelos (Anthropic/OpenAI/etc.) vão para
  suas APIs, e plataformas de chat (WhatsApp/Telegram/Slack/etc.) armazenam dados de mensagens em seus
  servidores.
- **Você controla o footprint:** usar modelos locais mantém os prompts na sua máquina, mas o tráfego do canal
  ainda passa pelos servidores do canal.

Relacionado: [Espaço de trabalho do agente](/concepts/agent-workspace), [Memória](/concepts/memory).

### Onde o OpenCraft armazena seus dados

Tudo fica em `$OPENCLAW_STATE_DIR` (padrão: `~/.opencraft`):

| Caminho                                                         | Finalidade                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------ |
| `$OPENCLAW_STATE_DIR/opencraft.json`                            | Configuração principal (JSON5)                                     |
| `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Importação legada de OAuth (copiada para perfis de autenticação no primeiro uso) |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Perfis de autenticação (OAuth, chaves de API e `keyRef`/`tokenRef` opcionais) |
| `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload secreto opcional com backup em arquivo para provedores `file` SecretRef |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Arquivo de compatibilidade legado (entradas estáticas `api_key` removidas) |
| `$OPENCLAW_STATE_DIR/credentials/`                              | Estado do provedor (ex.: `whatsapp/<accountId>/creds.json`)        |
| `$OPENCLAW_STATE_DIR/agents/`                                   | Estado por agente (agentDir + sessões)                             |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Histórico de conversas e estado (por agente)                       |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadados de sessão (por agente)                                   |

Caminho legado de agente único: `~/.opencraft/agent/*` (migrado por `opencraft doctor`).

Seu **espaço de trabalho** (AGENTS.md, arquivos de memória, habilidades, etc.) é separado e configurado via `agents.defaults.workspace` (padrão: `~/.opencraft/workspace`).

### Onde devem ficar AGENTSmd SOULmd USERmd MEMORYmd

Esses arquivos ficam no **espaço de trabalho do agente**, não em `~/.opencraft`.

- **Espaço de trabalho (por agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
  `MEMORY.md` (ou fallback legado `memory.md` quando `MEMORY.md` estiver ausente),
  `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opcional.
- **Diretório de estado (`~/.opencraft`)**: configuração, credenciais, perfis de autenticação, sessões, logs,
  e habilidades compartilhadas (`~/.opencraft/skills`).

O espaço de trabalho padrão é `~/.opencraft/workspace`, configurável via:

```json5
{
  agents: { defaults: { workspace: "~/.opencraft/workspace" } },
}
```

Se o bot "esquecer" após uma reinicialização, confirme que o Gateway está usando o mesmo
espaço de trabalho em toda inicialização (e lembre-se: o modo remoto usa o espaço de trabalho do **host do gateway**,
não do seu laptop local).

Dica: se você quiser um comportamento ou preferência durável, peça ao bot para **escrevê-lo no
AGENTS.md ou MEMORY.md** em vez de depender do histórico do chat.

Veja [Espaço de trabalho do agente](/concepts/agent-workspace) e [Memória](/concepts/memory).

### Qual é a estratégia de backup recomendada

Coloque seu **espaço de trabalho do agente** em um repositório git **privado** e faça backup em algum lugar
privado (por exemplo, GitHub privado). Isso captura a memória + arquivos AGENTS/SOUL/USER
e permite que você restaure a "mente" do assistente posteriormente.

**Não** faça commit de nada em `~/.opencraft` (credenciais, sessões, tokens ou payloads de segredos criptografados).
Se você precisar de uma restauração completa, faça backup do espaço de trabalho e do diretório de estado
separadamente (veja a pergunta sobre migração acima).

Docs: [Espaço de trabalho do agente](/concepts/agent-workspace).

### Como desinstalo completamente o OpenCraft

Veja o guia dedicado: [Desinstalar](/install/uninstall).

### Os agentes podem trabalhar fora do espaço de trabalho

Sim. O espaço de trabalho é o **diretório de trabalho padrão** e âncora de memória, não um sandbox rígido.
Caminhos relativos resolvem dentro do espaço de trabalho, mas caminhos absolutos podem acessar outros
locais do host a menos que o sandboxing esteja habilitado. Se precisar de isolamento, use
[`agents.defaults.sandbox`](/gateway/sandboxing) ou configurações de sandbox por agente. Se você
quiser que um repositório seja o diretório de trabalho padrão, aponte o `workspace` desse agente para
a raiz do repositório. O repositório do OpenCraft é apenas código-fonte; mantenha o
espaço de trabalho separado a menos que você intencionalmente queira que o agente trabalhe dentro dele.

Exemplo (repositório como diretório de trabalho padrão):

```json5
{
  agents: {
    defaults: {
      workspace: "~/Projects/my-repo",
    },
  },
}
```

### Estou em modo remoto, onde fica o armazenamento de sessão

O estado da sessão é de propriedade do **host do gateway**. Se você estiver em modo remoto, o armazenamento de sessão que importa está na máquina remota, não no seu laptop local. Veja [Gerenciamento de sessão](/concepts/session).

## Conceitos básicos de configuração

### Qual é o formato da configuração? Onde ela fica

O OpenCraft lê uma configuração **JSON5** opcional de `$OPENCLAW_CONFIG_PATH` (padrão: `~/.opencraft/opencraft.json`):

```
$OPENCLAW_CONFIG_PATH
```

Se o arquivo estiver ausente, ele usa padrões razoavelmente seguros (incluindo um espaço de trabalho padrão de `~/.opencraft/workspace`).

### Configurei gateway.bind como lan ou tailnet e agora nada escuta; a interface diz não autorizado

Vinculações não-loopback **exigem autenticação**. Configure `gateway.auth.mode` + `gateway.auth.token` (ou use `OPENCLAW_GATEWAY_TOKEN`).

```json5
{
  gateway: {
    bind: "lan",
    auth: {
      mode: "token",
      token: "replace-me",
    },
  },
}
```

Notas:

- `gateway.remote.token` / `.password` **não** habilitam a autenticação do gateway local por si sós.
- Caminhos de chamada local podem usar `gateway.remote.*` como fallback somente quando `gateway.auth.*` não estiver definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não resolvido, a resolução falha de forma fechada (sem fallback remoto mascarando).
- A interface de controle autentica via `connect.params.auth.token` (armazenado nas configurações do app/UI). Evite colocar tokens em URLs.

### Por que preciso de um token no localhost agora

O OpenCraft aplica autenticação por token por padrão, incluindo loopback. Se nenhum token estiver configurado, a inicialização do gateway gera um automaticamente e o salva em `gateway.auth.token`, então **clientes WS locais devem se autenticar**. Isso impede que outros processos locais chamem o Gateway.

Se você **realmente** quiser loopback aberto, defina `gateway.auth.mode: "none"` explicitamente na sua configuração. O Doctor pode gerar um token para você a qualquer momento: `opencraft doctor --generate-gateway-token`.

### Preciso reiniciar após alterar a configuração

O Gateway monitora a configuração e suporta recarregamento a quente:

- `gateway.reload.mode: "hybrid"` (padrão): aplica a quente mudanças seguras, reinicia para as críticas
- `hot`, `restart`, `off` também são suportados

### Como desabilito as taglines engraçadas do CLI

Defina `cli.banner.taglineMode` na configuração:

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `off`: oculta o texto da tagline mas mantém a linha de título/versão do banner.
- `default`: usa `All your chats, one OpenCraft.` sempre.
- `random`: taglines engraçadas/sazonais rotativas (comportamento padrão).
- Se você não quiser nenhum banner, defina a variável de ambiente `OPENCLAW_HIDE_BANNER=1`.

### Como habilito a pesquisa web e a busca web

`web_fetch` funciona sem uma chave de API. `web_search` requer uma chave para o
provedor selecionado (Brave, Gemini, Grok, Kimi ou Perplexity).
**Recomendado:** execute `opencraft configure --section web` e escolha um provedor.
Alternativas via variável de ambiente:

- Brave: `BRAVE_API_KEY`
- Gemini: `GEMINI_API_KEY`
- Grok: `XAI_API_KEY`
- Kimi: `KIMI_API_KEY` ou `MOONSHOT_API_KEY`
- Perplexity: `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "brave",
        apiKey: "BRAVE_API_KEY_HERE",
        maxResults: 5,
      },
      fetch: {
        enabled: true,
      },
    },
  },
}
```

Notas:

- Se você usar listas de permissão, adicione `web_search`/`web_fetch` ou `group:web`.
- `web_fetch` está habilitado por padrão (a menos que explicitamente desabilitado).
- Daemons leem variáveis de ambiente de `~/.opencraft/.env` (ou do ambiente de serviço).

Docs: [Ferramentas web](/tools/web).

### Como executo um Gateway central com trabalhadores especializados em vários dispositivos

O padrão comum é **um Gateway** (ex.: Raspberry Pi) mais **nós** e **agentes**:

- **Gateway (central):** possui canais (Signal/WhatsApp), roteamento e sessões.
- **Nós (dispositivos):** Macs/iOS/Android se conectam como periféricos e expõem ferramentas locais (`system.run`, `canvas`, `camera`).
- **Agentes (trabalhadores):** cérebros/espaços de trabalho separados para funções especiais (ex.: "operações Hetzner", "dados pessoais").
- **Subagentes:** inicie trabalho em segundo plano a partir de um agente principal quando quiser paralelismo.
- **TUI:** conecte-se ao Gateway e alterne agentes/sessões.

Docs: [Nós](/nodes), [Acesso remoto](/gateway/remote), [Roteamento multiagente](/concepts/multi-agent), [Subagentes](/tools/subagents), [TUI](/web/tui).

### O navegador do OpenCraft pode rodar headless

Sim. É uma opção de configuração:

```json5
{
  browser: { headless: true },
  agents: {
    defaults: {
      sandbox: { browser: { headless: true } },
    },
  },
}
```

O padrão é `false` (com interface gráfica). O modo headless tem mais chances de acionar verificações anti-bot em alguns sites. Veja [Navegador](/tools/browser).

O modo headless usa o **mesmo motor Chromium** e funciona para a maioria das automações (formulários, cliques, scraping, logins). As principais diferenças:

- Sem janela de navegador visível (use capturas de tela se precisar de visuais).
- Alguns sites são mais rigorosos com automação em modo headless (CAPTCHAs, anti-bot).
  Por exemplo, o X/Twitter frequentemente bloqueia sessões headless.

### Como uso o Brave para controle do navegador

Defina `browser.executablePath` para o binário do Brave (ou qualquer navegador baseado em Chromium) e reinicie o Gateway.
Veja os exemplos completos de configuração em [Navegador](/tools/browser#use-brave-or-another-chromium-based-browser).

## Gateways remotos e nós

### Como os comandos se propagam entre o Telegram, o gateway e os nós

As mensagens do Telegram são tratadas pelo **gateway**. O gateway executa o agente e
só então chama os nós pelo **WebSocket do Gateway** quando uma ferramenta de nó é necessária:

Telegram → Gateway → Agente → `node.*` → Nó → Gateway → Telegram

Os nós não veem o tráfego de entrada do provedor; eles só recebem chamadas RPC de nó.

### Como meu agente pode acessar meu computador se o Gateway estiver hospedado remotamente

Resposta curta: **emparelhe seu computador como um nó**. O Gateway roda em outro lugar, mas pode
chamar ferramentas `node.*` (tela, câmera, sistema) na sua máquina local pelo WebSocket do Gateway.

Configuração típica:

1. Execute o Gateway no host sempre ativo (VPS/servidor doméstico).
2. Coloque o host do Gateway e seu computador na mesma tailnet.
3. Certifique-se de que o WS do Gateway seja acessível (vinculação tailnet ou túnel SSH).
4. Abra o app macOS localmente e conecte em modo **Remoto via SSH** (ou tailnet direta)
   para que ele possa se registrar como nó.
5. Aprove o nó no gateway:

   ```bash
   opencraft devices list
   opencraft devices approve <requestId>
   ```

Nenhuma ponte TCP separada é necessária; os nós se conectam pelo WebSocket do Gateway.

Lembrete de segurança: emparelhar um nó macOS permite `system.run` nessa máquina. Somente
emparelhe dispositivos em que você confia e revise [Segurança](/gateway/security).

Docs: [Nós](/nodes), [Protocolo do Gateway](/gateway/protocol), [Modo remoto macOS](/platforms/mac/remote), [Segurança](/gateway/security).

### O Tailscale está conectado, mas não recebo respostas. O que fazer agora

Verifique o básico:

- Gateway está em execução: `opencraft gateway status`
- Saúde do Gateway: `opencraft status`
- Saúde do canal: `opencraft channels status`

Em seguida, verifique autenticação e roteamento:

- Se você usar o Tailscale Serve, certifique-se de que `gateway.auth.allowTailscale` esteja configurado corretamente.
- Se você se conectar via túnel SSH, confirme que o túnel local está ativo e aponta para a porta correta.
- Confirme que suas listas de permissão (DM ou grupo) incluem sua conta.

Docs: [Tailscale](/gateway/tailscale), [Acesso remoto](/gateway/remote), [Canais](/channels).

### Duas instâncias do OpenCraft podem se comunicar entre si (local e VPS)

Sim. Não há uma "ponte bot a bot" integrada, mas você pode configurá-la de algumas
maneiras confiáveis:

**Mais simples:** use um canal de chat normal ao qual os dois bots possam acessar (Telegram/Slack/WhatsApp).
Faça o Bot A enviar uma mensagem para o Bot B, e deixe o Bot B responder normalmente.

**Ponte CLI (genérica):** execute um script que chame o outro Gateway com
`opencraft agent --message ... --deliver`, direcionando para um chat onde o outro bot
escuta. Se um bot estiver em um VPS remoto, aponte seu CLI para esse Gateway remoto
via SSH/Tailscale (veja [Acesso remoto](/gateway/remote)).

Exemplo de padrão (execute a partir de uma máquina que possa alcançar o Gateway de destino):

```bash
opencraft agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
```

Dica: adicione uma proteção para que os dois bots não entrem em loop infinito (somente menção, listas de permissão de canal
ou uma regra de "não responder a mensagens de bot").

Docs: [Acesso remoto](/gateway/remote), [CLI do agente](/cli/agent), [Envio de agente](/tools/agent-send).

### Preciso de VPSes separados para múltiplos agentes

Não. Um Gateway pode hospedar múltiplos agentes, cada um com seu próprio espaço de trabalho, padrões de modelo
e roteamento. Essa é a configuração normal e é muito mais barata e simples do que rodar
um VPS por agente.

Use VPSes separados apenas quando precisar de isolamento rígido (limites de segurança) ou configurações muito
diferentes que você não quer compartilhar. Caso contrário, mantenha um Gateway e
use múltiplos agentes ou subagentes.

### Há algum benefício em usar um nó no meu laptop pessoal em vez de SSH a partir de um VPS

Sim - os nós são a forma de primeira classe de acessar seu laptop a partir de um Gateway remoto, e eles
desbloqueiam mais do que acesso ao shell. O Gateway roda no macOS/Linux (Windows via WSL2) e é
leve (um pequeno VPS ou box no nível do Raspberry Pi é suficiente; 4 GB de RAM é bastante), então uma configuração comum
é um host sempre ativo mais seu laptop como nó.

- **Sem SSH de entrada necessário.** Os nós se conectam ao WebSocket do Gateway e usam emparelhamento de dispositivo.
- **Controles de execução mais seguros.** `system.run` é controlado por listas de permissão/aprovações de nó nesse laptop.
- **Mais ferramentas de dispositivo.** Os nós expõem `canvas`, `camera` e `screen` além de `system.run`.
- **Automação de navegador local.** Mantenha o Gateway em um VPS, mas execute o Chrome localmente e retransmita o controle
  com a extensão do Chrome + um host de nó no laptop.

SSH é bom para acesso ad-hoc ao shell, mas os nós são mais simples para fluxos de trabalho de agente contínuos e
automação de dispositivos.

Docs: [Nós](/nodes), [CLI de nós](/cli/nodes), [Extensão do Chrome](/tools/chrome-extension).

### Devo instalar em um segundo laptop ou apenas adicionar um nó

Se você só precisa de **ferramentas locais** (tela/câmera/exec) no segundo laptop, adicione-o como um
**nó**. Isso mantém um único Gateway e evita configuração duplicada. As ferramentas de nó local são
atualmente apenas para macOS, mas planejamos estendê-las a outros sistemas operacionais.

Instale um segundo Gateway apenas quando precisar de **isolamento rígido** ou dois bots completamente separados.

Docs: [Nós](/nodes), [CLI de nós](/cli/nodes), [Múltiplos gateways](/gateway/multiple-gateways).

### Os nós executam um serviço de gateway

Não. Apenas **um gateway** deve rodar por host, a menos que você intencionalmente execute perfis isolados (veja [Múltiplos gateways](/gateway/multiple-gateways)). Os nós são periféricos que se conectam
ao gateway (nós iOS/Android ou macOS em "modo nó" no app da barra de menus). Para hosts de nó headless
e controle CLI, veja [CLI do host de nó](/cli/node).

Uma reinicialização completa é necessária para alterações de `gateway`, `discovery` e `canvasHost`.

### Existe uma forma de API/RPC para aplicar configuração

Sim. `config.apply` valida + escreve a configuração completa e reinicia o Gateway como parte da operação.

### config.apply apagou minha configuração. Como recupero e evito isso

`config.apply` substitui a **configuração inteira**. Se você enviar um objeto parcial, tudo
o mais é removido.

Recuperação:

- Restaure a partir do backup (git ou um `~/.opencraft/opencraft.json` copiado).
- Se você não tiver backup, execute novamente `opencraft doctor` e reconfigure canais/modelos.
- Se isso foi inesperado, registre um bug e inclua sua última configuração conhecida ou qualquer backup.
- Um agente de codificação local frequentemente consegue reconstruir uma configuração funcional a partir de logs ou histórico.

Evite isso:

- Use `opencraft config set` para pequenas alterações.
- Use `opencraft configure` para edições interativas.

Docs: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/gateway/doctor).

### Qual é uma configuração mínima razoável para uma primeira instalação

```json5
{
  agents: { defaults: { workspace: "~/.opencraft/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Isso define seu espaço de trabalho e restringe quem pode acionar o bot.

### Como configuro o Tailscale em um VPS e me conecto do meu Mac

Etapas mínimas:

1. **Instale e faça login no VPS**

   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```

2. **Instale e faça login no seu Mac**
   - Use o app do Tailscale e faça login na mesma tailnet.
3. **Habilite MagicDNS (recomendado)**
   - No console de administração do Tailscale, habilite o MagicDNS para que o VPS tenha um nome estável.
4. **Use o hostname da tailnet**
   - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
   - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

Se você quiser a interface de controle sem SSH, use o Tailscale Serve no VPS:

```bash
opencraft gateway --tailscale serve
```

Isso mantém o gateway vinculado ao loopback e expõe HTTPS via Tailscale. Veja [Tailscale](/gateway/tailscale).

### Como conecto um nó Mac a um Gateway remoto com Tailscale Serve

O Serve expõe a **Interface de Controle do Gateway + WS**. Os nós se conectam pelo mesmo endpoint WS do Gateway.

Configuração recomendada:

1. **Certifique-se de que o VPS e o Mac estejam na mesma tailnet**.
2. **Use o app macOS em modo Remoto** (o alvo SSH pode ser o hostname da tailnet).
   O app criará um túnel para a porta do Gateway e se conectará como nó.
3. **Aprove o nó** no gateway:

   ```bash
   opencraft devices list
   opencraft devices approve <requestId>
   ```

Docs: [Protocolo do Gateway](/gateway/protocol), [Descoberta](/gateway/discovery), [Modo remoto macOS](/platforms/mac/remote).

## Variáveis de ambiente e carregamento de .env

### Como o OpenCraft carrega variáveis de ambiente

O OpenCraft lê as variáveis de ambiente do processo pai (shell, launchd/systemd, CI, etc.) e adicionalmente carrega:

- `.env` do diretório de trabalho atual
- um `.env` de fallback global de `~/.opencraft/.env` (também chamado de `$OPENCLAW_STATE_DIR/.env`)

Nenhum arquivo `.env` substitui variáveis de ambiente existentes.

Você também pode definir variáveis de ambiente inline na configuração (aplicadas somente se ausentes do ambiente do processo):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

Veja [/environment](/help/environment) para precedência completa e fontes.

### Iniciei o Gateway via serviço e minhas variáveis de ambiente desapareceram. O que fazer agora

Duas correções comuns:

1. Coloque as chaves ausentes em `~/.opencraft/.env` para que sejam capturadas mesmo quando o serviço não herdar o ambiente do seu shell.
2. Habilite a importação do shell (conveniência opt-in):

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Isso executa seu shell de login e importa apenas as chaves esperadas ausentes (nunca substitui). Equivalentes de variáveis de ambiente:
`OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

### Defini COPILOTGITHUBTOKEN mas o status de modelos mostra "Shell env off". Por quê

`opencraft models status` informa se a **importação do ambiente shell** está habilitada. "Shell env: off"
**não** significa que suas variáveis de ambiente estão ausentes - significa apenas que o OpenCraft não vai carregar
seu shell de login automaticamente.

Se o Gateway roda como serviço (launchd/systemd), ele não vai herdar o seu ambiente
de shell. Corrija fazendo uma destas ações:

1. Coloque o token em `~/.opencraft/.env`:

   ```
   COPILOT_GITHUB_TOKEN=...
   ```

2. Ou habilite a importação do shell (`env.shellEnv.enabled: true`).
3. Ou adicione-o ao bloco `env` da sua configuração (aplica somente se ausente).

Em seguida, reinicie o gateway e verifique novamente:

```bash
opencraft models status
```

Os tokens do Copilot são lidos de `COPILOT_GITHUB_TOKEN` (também `GH_TOKEN` / `GITHUB_TOKEN`).
Veja [/concepts/model-providers](/concepts/model-providers) e [/environment](/help/environment).

## Sessões e múltiplos chats

### Como inicio uma conversa nova

Envie `/new` ou `/reset` como mensagem independente. Veja [Gerenciamento de sessão](/concepts/session).

### As sessões reiniciam automaticamente se eu nunca enviar /new

Sim. As sessões expiram após `session.idleMinutes` (padrão **60**). A **próxima**
mensagem inicia um novo ID de sessão para essa chave de chat. Isso não exclui
transcrições - apenas inicia uma nova sessão.

```json5
{
  session: {
    idleMinutes: 240,
  },
}
```

### Existe uma maneira de criar uma equipe de instâncias do OpenCraft, um CEO e muitos agentes

Sim, via **roteamento multiagente** e **subagentes**. Você pode criar um agente coordenador
e vários agentes trabalhadores com seus próprios espaços de trabalho e modelos.

Dito isso, isso é melhor visto como um **experimento divertido**. É pesado em tokens e muitas vezes
menos eficiente do que usar um bot com sessões separadas. O modelo típico que imaginamos
é um bot com o qual você conversa, com sessões diferentes para trabalho paralelo. Esse
bot também pode iniciar subagentes quando necessário.

Docs: [Roteamento multiagente](/concepts/multi-agent), [Subagentes](/tools/subagents), [CLI de agentes](/cli/agents).

### Por que o contexto foi truncado no meio de uma tarefa? Como evito isso

O contexto da sessão é limitado pela janela do modelo. Chats longos, saídas grandes de ferramentas ou muitos
arquivos podem acionar compactação ou truncamento.

O que ajuda:

- Peça ao bot para resumir o estado atual e escrever em um arquivo.
- Use `/compact` antes de tarefas longas e `/new` ao trocar de tópico.
- Mantenha o contexto importante no espaço de trabalho e peça ao bot para relê-lo.
- Use subagentes para trabalho longo ou paralelo para que o chat principal fique menor.
- Escolha um modelo com janela de contexto maior se isso acontecer com frequência.

### Como faço para redefinir completamente o OpenCraft, mas mantê-lo instalado

Use o comando de redefinição:

```bash
opencraft reset
```

Redefinição completa não interativa:

```bash
opencraft reset --scope full --yes --non-interactive
```

Em seguida, execute novamente o onboarding:

```bash
opencraft onboard --install-daemon
```

Notas:

- O assistente de onboarding também oferece **Redefinir** se detectar uma configuração existente. Veja [Assistente](/start/wizard).
- Se você usou perfis (`--profile` / `OPENCLAW_PROFILE`), redefina cada diretório de estado (os padrões são `~/.opencraft-<profile>`).
- Redefinição de desenvolvimento: `opencraft gateway --dev --reset` (apenas para desenvolvimento; apaga configuração de desenvolvimento + credenciais + sessões + espaço de trabalho).

### Estou recebendo erros de "contexto muito grande". Como redefino ou compacto

Use um destes:

- **Compactar** (mantém a conversa mas resume os turnos mais antigos):

  ```
  /compact
  ```

  ou `/compact <instruções>` para orientar o resumo.

- **Redefinir** (novo ID de sessão para a mesma chave de chat):

  ```
  /new
  /reset
  ```

Se continuar acontecendo:

- Habilite ou ajuste a **poda de sessão** (`agents.defaults.contextPruning`) para cortar saídas antigas de ferramentas.
- Use um modelo com janela de contexto maior.

Docs: [Compactação](/concepts/compaction), [Poda de sessão](/concepts/session-pruning), [Gerenciamento de sessão](/concepts/session).

### Por que estou vendo "LLM request rejected: messages.content.tool_use.input field required"?

Este é um erro de validação do provedor: o modelo emitiu um bloco `tool_use` sem o
`input` necessário. Geralmente significa que o histórico da sessão está obsoleto ou corrompido (muitas vezes após threads longas
ou uma mudança de ferramenta/schema).

Correção: inicie uma sessão nova com `/new` (mensagem independente).

### Por que estou recebendo mensagens de heartbeat a cada 30 minutos

Os heartbeats rodam a cada **30m** por padrão. Ajuste ou desabilite-os:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "2h", // ou "0m" para desabilitar
      },
    },
  },
}
```

Se `HEARTBEAT.md` existir mas for efetivamente vazio (apenas linhas em branco e
cabeçalhos markdown como `# Heading`), o OpenCraft pula a execução do heartbeat para economizar chamadas de API.
Se o arquivo estiver ausente, o heartbeat ainda roda e o modelo decide o que fazer.

Substituições por agente usam `agents.list[].heartbeat`. Docs: [Heartbeat](/gateway/heartbeat).

### Preciso adicionar uma conta de bot a um grupo do WhatsApp

Não. O OpenCraft roda na **sua própria conta**, então se você está no grupo, o OpenCraft pode vê-lo.
Por padrão, as respostas em grupo são bloqueadas até que você permita remetentes (`groupPolicy: "allowlist"`).

Se você quiser que apenas **você** possa acionar respostas em grupo:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

### Como obtenho o JID de um grupo do WhatsApp

Opção 1 (mais rápido): monitore os logs e envie uma mensagem de teste no grupo:

```bash
opencraft logs --follow --json
```

Procure por `chatId` (ou `from`) terminando em `@g.us`, como:
`1234567890-1234567890@g.us`.
Opção 2 (se já configurado/na lista de permissões): liste os grupos da configuração:

```bash
opencraft directory groups list --channel whatsapp
```

Documentação: [WhatsApp](/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

### Por que o OpenCraft não responde em um grupo

Duas causas comuns:

- O controle por menção está ativado (padrão). Você deve @mencionar o bot (ou corresponder a `mentionPatterns`).
- Você configurou `channels.whatsapp.groups` sem `"*"` e o grupo não está na lista de permissões.

Consulte [Grupos](/channels/groups) e [Mensagens de grupo](/channels/group-messages).

### Grupos/tópicos compartilham contexto com DMs

Chats diretos colapsam para a sessão principal por padrão. Grupos/canais têm suas próprias chaves de sessão, e tópicos do Telegram / threads do Discord são sessões separadas. Consulte [Grupos](/channels/groups) e [Mensagens de grupo](/channels/group-messages).

### Quantos workspaces e agentes posso criar

Sem limites rígidos. Dezenas (até centenas) são aceitáveis, mas fique atento a:

- **Crescimento em disco:** sessões + transcrições ficam em `~/.opencraft/agents/<agentId>/sessions/`.
- **Custo de tokens:** mais agentes significa mais uso simultâneo de modelos.
- **Sobrecarga operacional:** perfis de autenticação por agente, workspaces e roteamento de canais.

Dicas:

- Mantenha um workspace **ativo** por agente (`agents.defaults.workspace`).
- Limpe sessões antigas (exclua entradas JSONL ou do store) se o disco crescer.
- Use `opencraft doctor` para identificar workspaces perdidos e incompatibilidades de perfil.

### Posso executar vários bots ou chats ao mesmo tempo no Slack e como devo configurar isso

Sim. Use o **Roteamento Multi-Agente** para executar múltiplos agentes isolados e rotear mensagens recebidas por canal/conta/peer. O Slack é suportado como canal e pode ser vinculado a agentes específicos.

O acesso via navegador é poderoso, mas não equivale a "fazer qualquer coisa que um humano pode" — anti-bots, CAPTCHAs e MFA ainda podem bloquear a automação. Para controle de navegador mais confiável, use o relay da extensão do Chrome na máquina que executa o navegador (e mantenha o Gateway em qualquer lugar).

Configuração de boas práticas:

- Host Gateway sempre ligado (VPS/Mac mini).
- Um agente por função (bindings).
- Canal(is) do Slack vinculados a esses agentes.
- Navegador local via relay de extensão (ou um nó) quando necessário.

Documentação: [Roteamento Multi-Agente](/concepts/multi-agent), [Slack](/channels/slack),
[Navegador](/tools/browser), [Extensão do Chrome](/tools/chrome-extension), [Nós](/nodes).

## Modelos: padrões, seleção, aliases, troca

### Qual é o modelo padrão

O modelo padrão do OpenCraft é o que você definir como:

```
agents.defaults.model.primary
```

Os modelos são referenciados como `provider/model` (exemplo: `anthropic/claude-opus-4-6`). Se você omitir o provedor, o OpenCraft atualmente assume `anthropic` como fallback temporário de depreciação — mas você ainda deve definir `provider/model` **explicitamente**.

### Qual modelo você recomenda

**Padrão recomendado:** use o modelo mais forte da geração mais recente disponível na sua stack de provedores.
**Para agentes com ferramentas habilitadas ou entrada não confiável:** priorize a capacidade do modelo em detrimento do custo.
**Para chat rotineiro/de baixo risco:** use modelos de fallback mais baratos e roteie por função do agente.

O MiniMax M2.5 tem sua própria documentação: [MiniMax](/providers/minimax) e
[Modelos locais](/gateway/local-models).

Regra geral: use o **melhor modelo que você puder pagar** para trabalhos de alto risco, e um modelo mais barato para chat rotineiro ou resumos. Você pode rotear modelos por agente e usar sub-agentes para paralelizar tarefas longas (cada sub-agente consome tokens). Consulte [Modelos](/concepts/models) e [Sub-agentes](/tools/subagents).

Aviso importante: modelos mais fracos/excessivamente quantizados são mais vulneráveis a injeção de prompt e comportamento inseguro. Consulte [Segurança](/gateway/security).

Mais contexto: [Modelos](/concepts/models).

### Posso usar modelos auto-hospedados llamacpp vLLM Ollama

Sim. O Ollama é o caminho mais fácil para modelos locais.

Configuração mais rápida:

1. Instale o Ollama em `https://ollama.com/download`
2. Baixe um modelo local como `ollama pull glm-4.7-flash`
3. Se quiser o Ollama Cloud também, execute `ollama signin`
4. Execute `opencraft onboard` e escolha `Ollama`
5. Selecione `Local` ou `Cloud + Local`

Observações:

- `Cloud + Local` fornece modelos Ollama Cloud mais seus modelos Ollama locais
- modelos de nuvem como `kimi-k2.5:cloud` não precisam de download local
- para troca manual, use `opencraft models list` e `opencraft models set ollama/<model>`

Nota de segurança: modelos menores ou altamente quantizados são mais vulneráveis a injeção de prompt. Recomendamos fortemente **modelos grandes** para qualquer bot que possa usar ferramentas. Se ainda quiser usar modelos pequenos, ative o sandboxing e listas de permissões estritas de ferramentas.

Documentação: [Ollama](/providers/ollama), [Modelos locais](/gateway/local-models),
[Provedores de modelos](/concepts/model-providers), [Segurança](/gateway/security),
[Sandboxing](/gateway/sandboxing).

### Como troco de modelo sem apagar minha configuração

Use os **comandos de modelo** ou edite apenas os campos de **model**. Evite substituições completas da configuração.

Opções seguras:

- `/model` no chat (rápido, por sessão)
- `opencraft models set ...` (atualiza apenas a configuração do modelo)
- `opencraft configure --section model` (interativo)
- edite `agents.defaults.model` em `~/.opencraft/opencraft.json`

Evite `config.apply` com um objeto parcial a menos que pretenda substituir toda a configuração. Se você sobrescreveu a configuração, restaure de um backup ou execute novamente `opencraft doctor` para reparar.

Documentação: [Modelos](/concepts/models), [Configurar](/cli/configure), [Config](/cli/config), [Doctor](/gateway/doctor).

### O que o OpenCraft, Flawd e Krill usam como modelos

- Essas implantações podem diferir e mudar ao longo do tempo; não há uma recomendação fixa de provedor.
- Verifique a configuração de tempo de execução atual em cada gateway com `opencraft models status`.
- Para agentes sensíveis à segurança/com ferramentas habilitadas, use o modelo mais forte da geração mais recente disponível.

### Como troco de modelo em tempo real sem reiniciar

Use o comando `/model` como mensagem independente:

```
/model sonnet
/model haiku
/model opus
/model gpt
/model gpt-mini
/model gemini
/model gemini-flash
```

Você pode listar os modelos disponíveis com `/model`, `/model list` ou `/model status`.

`/model` (e `/model list`) exibe um seletor compacto e numerado. Selecione pelo número:

```
/model 3
```

Você também pode forçar um perfil de autenticação específico para o provedor (por sessão):

```
/model opus@anthropic:default
/model opus@anthropic:work
```

Dica: `/model status` mostra qual agente está ativo, qual arquivo `auth-profiles.json` está sendo usado e qual perfil de autenticação será tentado em seguida. Também exibe o endpoint do provedor configurado (`baseUrl`) e o modo de API (`api`) quando disponíveis.

**Como faço para desafixar um perfil que defini com profile**

Execute `/model` novamente **sem** o sufixo `@profile`:

```
/model anthropic/claude-opus-4-6
```

Se quiser retornar ao padrão, selecione-o em `/model` (ou envie `/model <provider/model padrão>`). Use `/model status` para confirmar qual perfil de autenticação está ativo.

### Posso usar o GPT 5.2 para tarefas diárias e o Codex 5.3 para programação

Sim. Defina um como padrão e troque conforme necessário:

- **Troca rápida (por sessão):** `/model gpt-5.2` para tarefas diárias, `/model openai-codex/gpt-5.4` para programação com Codex OAuth.
- **Padrão + troca:** defina `agents.defaults.model.primary` como `openai/gpt-5.2`, depois troque para `openai-codex/gpt-5.4` ao programar (ou vice-versa).
- **Sub-agentes:** roteie tarefas de programação para sub-agentes com um modelo padrão diferente.

Consulte [Modelos](/concepts/models) e [Comandos slash](/tools/slash-commands).

### Por que vejo "Model is not allowed" e depois nenhuma resposta

Se `agents.defaults.models` estiver definido, ele se torna a **lista de permissões** para `/model` e quaisquer substituições de sessão. Escolher um modelo que não esteja nessa lista retorna:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Esse erro é retornado **em vez de** uma resposta normal. Correção: adicione o modelo a `agents.defaults.models`, remova a lista de permissões ou escolha um modelo em `/model list`.

### Por que vejo "Unknown model minimaxMiniMaxM25"

Isso significa que o **provedor não está configurado** (nenhuma configuração de provedor MiniMax ou perfil de autenticação foi encontrado), então o modelo não pode ser resolvido. Uma correção para essa detecção está na versão **2026.1.12** (não lançada no momento da escrita).

Lista de verificação de correção:

1. Atualize para **2026.1.12** (ou execute a partir do código-fonte `main`) e reinicie o gateway.
2. Certifique-se de que o MiniMax está configurado (wizard ou JSON), ou que uma chave de API MiniMax existe em env/perfis de autenticação para que o provedor possa ser injetado.
3. Use o ID exato do modelo (diferencia maiúsculas de minúsculas): `minimax/MiniMax-M2.5` ou `minimax/MiniMax-M2.5-highspeed`.
4. Execute:

   ```bash
   opencraft models list
   ```

   e escolha da lista (ou `/model list` no chat).

Consulte [MiniMax](/providers/minimax) e [Modelos](/concepts/models).

### Posso usar o MiniMax como padrão e o OpenAI para tarefas complexas

Sim. Use o **MiniMax como padrão** e troque de modelo **por sessão** quando necessário. Fallbacks são para **erros**, não para "tarefas difíceis" — use `/model` ou um agente separado.

**Opção A: trocar por sessão**

```json5
{
  env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.5" },
      models: {
        "minimax/MiniMax-M2.5": { alias: "minimax" },
        "openai/gpt-5.2": { alias: "gpt" },
      },
    },
  },
}
```

Então:

```
/model gpt
```

**Opção B: agentes separados**

- Agente A padrão: MiniMax
- Agente B padrão: OpenAI
- Roteie por agente ou use `/agent` para trocar

Documentação: [Modelos](/concepts/models), [Roteamento Multi-Agente](/concepts/multi-agent), [MiniMax](/providers/minimax), [OpenAI](/providers/openai).

### opus, sonnet e gpt são atalhos embutidos

Sim. O OpenCraft inclui alguns atalhos padrão (aplicados apenas quando o modelo existe em `agents.defaults.models`):

- `opus` → `anthropic/claude-opus-4-6`
- `sonnet` → `anthropic/claude-sonnet-4-6`
- `gpt` → `openai/gpt-5.4`
- `gpt-mini` → `openai/gpt-5-mini`
- `gemini` → `google/gemini-3.1-pro-preview`
- `gemini-flash` → `google/gemini-3-flash-preview`
- `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

Se você definir seu próprio alias com o mesmo nome, seu valor tem precedência.

### Como defino/substituo atalhos e aliases de modelos

Os aliases vêm de `agents.defaults.models.<modelId>.alias`. Exemplo:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "anthropic/claude-sonnet-4-5": { alias: "sonnet" },
        "anthropic/claude-haiku-4-5": { alias: "haiku" },
      },
    },
  },
}
```

Então `/model sonnet` (ou `/<alias>` quando suportado) resolve para esse ID de modelo.

### Como adiciono modelos de outros provedores como OpenRouter ou ZAI

OpenRouter (pay-per-token; muitos modelos):

```json5
{
  agents: {
    defaults: {
      model: { primary: "openrouter/anthropic/claude-sonnet-4-5" },
      models: { "openrouter/anthropic/claude-sonnet-4-5": {} },
    },
  },
  env: { OPENROUTER_API_KEY: "sk-or-..." },
}
```

Z.AI (modelos GLM):

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-5" },
      models: { "zai/glm-5": {} },
    },
  },
  env: { ZAI_API_KEY: "..." },
}
```

Se você referenciar um provider/model mas a chave do provedor necessária estiver ausente, você receberá um erro de autenticação em tempo de execução (ex.: `No API key found for provider "zai"`).

**Nenhuma chave de API encontrada para o provedor após adicionar um novo agente**

Isso geralmente significa que o **novo agente** tem um armazenamento de autenticação vazio. A autenticação é por agente e armazenada em:

```
~/.opencraft/agents/<agentId>/agent/auth-profiles.json
```

Opções de correção:

- Execute `opencraft agents add <id>` e configure a autenticação durante o wizard.
- Ou copie `auth-profiles.json` do `agentDir` do agente principal para o `agentDir` do novo agente.

**Não** reutilize `agentDir` entre agentes; isso causa colisões de autenticação/sessão.

## Failover de modelos e "All models failed"

### Como funciona o failover

O failover acontece em dois estágios:

1. **Rotação de perfil de autenticação** dentro do mesmo provedor.
2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

Períodos de resfriamento (cooldowns) se aplicam a perfis com falha (backoff exponencial), então o OpenCraft pode continuar respondendo mesmo quando um provedor está com limite de taxa ou temporariamente com falha.

### O que significa este erro

```
No credentials found for profile "anthropic:default"
```

Significa que o sistema tentou usar o ID de perfil de autenticação `anthropic:default`, mas não encontrou credenciais para ele no armazenamento de autenticação esperado.

### Lista de verificação para "No credentials found for profile anthropic:default"

- **Confirme onde ficam os perfis de autenticação** (caminhos novos vs. legados)
  - Atual: `~/.opencraft/agents/<agentId>/agent/auth-profiles.json`
  - Legado: `~/.opencraft/agent/*` (migrado por `opencraft doctor`)
- **Confirme que sua variável de ambiente está carregada pelo Gateway**
  - Se você definiu `ANTHROPIC_API_KEY` no seu shell mas executa o Gateway via systemd/launchd, ele pode não herdá-la. Coloque-a em `~/.opencraft/.env` ou ative `env.shellEnv`.
- **Certifique-se de que está editando o agente correto**
  - Configurações multi-agente podem ter múltiplos arquivos `auth-profiles.json`.
- **Verifique o status do modelo/autenticação**
  - Use `opencraft models status` para ver os modelos configurados e se os provedores estão autenticados.

**Lista de verificação para "No credentials found for profile anthropic"**

Isso significa que a execução está fixada a um perfil de autenticação Anthropic, mas o Gateway não consegue encontrá-lo no seu armazenamento de autenticação.

- **Use um setup-token**
  - Execute `claude setup-token`, depois cole-o com `opencraft models auth setup-token --provider anthropic`.
  - Se o token foi criado em outra máquina, use `opencraft models auth paste-token --provider anthropic`.
- **Se quiser usar uma chave de API em vez disso**
  - Coloque `ANTHROPIC_API_KEY` em `~/.opencraft/.env` no **host do gateway**.
  - Limpe qualquer ordem fixada que force um perfil ausente:

    ```bash
    opencraft models auth order clear --provider anthropic
    ```

- **Confirme que está executando os comandos no host do gateway**
  - No modo remoto, os perfis de autenticação ficam na máquina do gateway, não no seu laptop.

### Por que ele também tentou o Google Gemini e falhou

Se a configuração do seu modelo inclui o Google Gemini como fallback (ou você trocou para um atalho Gemini), o OpenCraft vai tentá-lo durante o fallback de modelo. Se você não configurou credenciais do Google, verá `No API key found for provider "google"`.

Correção: forneça autenticação do Google ou remova/evite modelos do Google em `agents.defaults.model.fallbacks` / aliases para que o fallback não seja roteado para lá.

**Mensagem "LLM request rejected: thinking signature required" no google antigravity**

Causa: o histórico da sessão contém **blocos de thinking sem assinaturas** (geralmente de um stream abortado/parcial). O Google Antigravity requer assinaturas para blocos de thinking.

Correção: o OpenCraft agora remove blocos de thinking sem assinatura para o Google Antigravity Claude. Se ainda aparecer, inicie uma **nova sessão** ou defina `/thinking off` para esse agente.

## Perfis de autenticação: o que são e como gerenciá-los

Relacionado: [/concepts/oauth](/concepts/oauth) (fluxos OAuth, armazenamento de tokens, padrões multi-conta)

### O que é um perfil de autenticação

Um perfil de autenticação é um registro de credencial nomeado (OAuth ou chave de API) vinculado a um provedor. Os perfis ficam em:

```
~/.opencraft/agents/<agentId>/agent/auth-profiles.json
```

### Quais são os IDs de perfil típicos

O OpenCraft usa IDs prefixados pelo provedor como:

- `anthropic:default` (comum quando não há identidade de e-mail)
- `anthropic:<email>` para identidades OAuth
- IDs personalizados que você escolhe (ex.: `anthropic:work`)

### Posso controlar qual perfil de autenticação é tentado primeiro

Sim. A configuração suporta metadados opcionais para perfis e uma ordenação por provedor (`auth.order.<provider>`). Isso **não** armazena segredos; mapeia IDs para provedor/modo e define a ordem de rotação.

O OpenCraft pode temporariamente ignorar um perfil se ele estiver em um **cooldown** curto (limites de taxa/timeouts/falhas de autenticação) ou em um estado **desabilitado** mais longo (faturamento/créditos insuficientes). Para inspecionar isso, execute `opencraft models status --json` e verifique `auth.unusableProfiles`. Ajuste: `auth.cooldowns.billingBackoffHours*`.

Você também pode definir uma substituição de ordem **por agente** (armazenada no `auth-profiles.json` desse agente) via CLI:

```bash
# Usa o agente padrão configurado por padrão (omita --agent)
opencraft models auth order get --provider anthropic

# Trava a rotação em um único perfil (tenta apenas este)
opencraft models auth order set --provider anthropic anthropic:default

# Ou define uma ordem explícita (fallback dentro do provedor)
opencraft models auth order set --provider anthropic anthropic:work anthropic:default

# Limpa a substituição (volta para config auth.order / round-robin)
opencraft models auth order clear --provider anthropic
```

Para direcionar a um agente específico:

```bash
opencraft models auth order set --provider anthropic --agent main anthropic:default
```

### OAuth vs chave de API: qual a diferença

O OpenCraft suporta ambos:

- **OAuth** frequentemente aproveita o acesso por assinatura (quando aplicável).
- **Chaves de API** usam faturamento pay-per-token.

O wizard suporta explicitamente o setup-token da Anthropic e o OAuth do OpenAI Codex, e pode armazenar chaves de API para você.

## Gateway: portas, "já em execução" e modo remoto

### Qual porta o Gateway usa

`gateway.port` controla a porta única multiplexada para WebSocket + HTTP (UI de controle, hooks, etc.).

Precedência:

```
--port > OPENCLAW_GATEWAY_PORT > gateway.port > padrão 18789
```

### Por que "opencraft gateway status" diz "Runtime running" mas "RPC probe failed"

Porque "running" é a visão do **supervisor** (launchd/systemd/schtasks). A sonda RPC é o CLI realmente conectando ao WebSocket do gateway e chamando `status`.

Use `opencraft gateway status` e confie nessas linhas:

- `Probe target:` (a URL que a sonda realmente usou)
- `Listening:` (o que está realmente vinculado na porta)
- `Last gateway error:` (causa raiz comum quando o processo está ativo mas a porta não está ouvindo)

### Por que "opencraft gateway status" mostra "Config cli" e "Config service" diferentes

Você está editando um arquivo de configuração enquanto o serviço está executando outro (geralmente uma incompatibilidade de `--profile` / `OPENCLAW_STATE_DIR`).

Correção:

```bash
opencraft gateway install --force
```

Execute isso a partir do mesmo `--profile` / ambiente que você quer que o serviço use.

### O que significa "another gateway instance is already listening"

O OpenCraft impõe um bloqueio de tempo de execução vinculando o listener WebSocket imediatamente na inicialização (padrão `ws://127.0.0.1:18789`). Se o bind falhar com `EADDRINUSE`, ele lança `GatewayLockError` indicando que outra instância já está ouvindo.

Correção: pare a outra instância, libere a porta ou execute com `opencraft gateway --port <porta>`.

### Como executo o OpenCraft em modo remoto (cliente conecta a um Gateway em outro lugar)

Defina `gateway.mode: "remote"` e aponte para uma URL WebSocket remota, opcionalmente com um token/senha:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://gateway.tailnet:18789",
      token: "seu-token",
      password: "sua-senha",
    },
  },
}
```

Observações:

- `opencraft gateway` só inicia quando `gateway.mode` é `local` (ou você passa a flag de substituição).
- O aplicativo macOS monitora o arquivo de configuração e troca de modo ao vivo quando esses valores mudam.

### A UI de Controle diz "unauthorized" ou fica reconectando. O que fazer

Seu gateway está sendo executado com autenticação habilitada (`gateway.auth.*`), mas a UI não está enviando o token/senha correspondente.

Fatos (do código):

- A UI de Controle mantém o token em `sessionStorage` para a sessão atual da aba do navegador e a URL do gateway selecionada, de modo que atualizações na mesma aba continuam funcionando sem restaurar persistência de token de longa duração no localStorage.
- Em `AUTH_TOKEN_MISMATCH`, clientes confiáveis podem tentar uma nova tentativa limitada com um token de dispositivo em cache quando o gateway retorna dicas de repetição (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).

Correção:

- Mais rápido: `opencraft dashboard` (exibe + copia a URL do dashboard, tenta abrir; mostra dica SSH se sem interface gráfica).
- Se você ainda não tem um token: `opencraft doctor --generate-gateway-token`.
- Se for remoto, crie um túnel primeiro: `ssh -N -L 18789:127.0.0.1:18789 user@host`, depois abra `http://127.0.0.1:18789/`.
- Defina `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`) no host do gateway.
- Nas configurações da UI de Controle, cole o mesmo token.
- Se a incompatibilidade persistir após a nova tentativa, rotacione/re-aprove o token do dispositivo pareado:
  - `opencraft devices list`
  - `opencraft devices rotate --device <id> --role operator`
- Ainda travado? Execute `opencraft status --all` e siga [Solução de problemas](/gateway/troubleshooting). Consulte [Dashboard](/web/dashboard) para detalhes de autenticação.

### Defini gateway.bind tailnet mas não consegue vincular, nada ouve

O bind `tailnet` seleciona um IP do Tailscale das suas interfaces de rede (100.64.0.0/10). Se a máquina não estiver no Tailscale (ou a interface estiver inativa), não há nada para vincular.

Correção:

- Inicie o Tailscale nesse host (para que ele tenha um endereço 100.x), ou
- Troque para `gateway.bind: "loopback"` / `"lan"`.

Nota: `tailnet` é explícito. `auto` prefere loopback; use `gateway.bind: "tailnet"` quando quiser um bind exclusivo para tailnet.

### Posso executar múltiplos Gateways no mesmo host

Geralmente não — um Gateway pode executar múltiplos canais de mensagens e agentes. Use múltiplos Gateways apenas quando precisar de redundância (ex.: bot de resgate) ou isolamento rígido.

Sim, mas você deve isolar:

- `OPENCLAW_CONFIG_PATH` (configuração por instância)
- `OPENCLAW_STATE_DIR` (estado por instância)
- `agents.defaults.workspace` (isolamento de workspace)
- `gateway.port` (portas únicas)

Configuração rápida (recomendada):

- Use `opencraft --profile <nome> …` por instância (cria automaticamente `~/.opencraft-<nome>`).
- Defina um `gateway.port` único em cada configuração de perfil (ou passe `--port` para execuções manuais).
- Instale um serviço por perfil: `opencraft --profile <nome> gateway install`.

Perfis também sufixam nomes de serviços (`ai.openclaw.<profile>`; legado `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenCraft Gateway (<profile>)`).
Guia completo: [Múltiplos gateways](/gateway/multiple-gateways).

### O que significa "invalid handshake code 1008"

O Gateway é um **servidor WebSocket**, e espera que a primeira mensagem seja um frame `connect`. Se receber qualquer outra coisa, fecha a conexão com o **código 1008** (violação de política).

Causas comuns:

- Você abriu a URL **HTTP** em um navegador (`http://...`) em vez de um cliente WS.
- Você usou a porta ou o caminho errado.
- Um proxy ou túnel removeu cabeçalhos de autenticação ou enviou uma requisição que não é do Gateway.

Correções rápidas:

1. Use a URL WS: `ws://<host>:18789` (ou `wss://...` se HTTPS).
2. Não abra a porta WS em uma aba normal do navegador.
3. Se a autenticação estiver ativada, inclua o token/senha no frame `connect`.

Se você estiver usando o CLI ou TUI, a URL deve ser algo como:

```
opencraft tui --url ws://<host>:18789 --token <token>
```

Detalhes do protocolo: [Protocolo do Gateway](/gateway/protocol).

## Logs e depuração

### Onde ficam os logs

Logs de arquivo (estruturados):

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Você pode definir um caminho estável via `logging.file`. O nível de log do arquivo é controlado por `logging.level`. A verbosidade do console é controlada por `--verbose` e `logging.consoleLevel`.

Monitoramento de log mais rápido:

```bash
opencraft logs --follow
```

Logs de serviço/supervisor (quando o gateway é executado via launchd/systemd):

- macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` e `gateway.err.log` (padrão: `~/.opencraft/logs/...`; perfis usam `~/.opencraft-<profile>/logs/...`)
- Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
- Windows: `schtasks /Query /TN "OpenCraft Gateway (<profile>)" /V /FO LIST`

Consulte [Solução de problemas](/gateway/troubleshooting#log-locations) para mais informações.

### Como inicio/paro/reinicio o serviço do Gateway

Use os helpers do gateway:

```bash
opencraft gateway status
opencraft gateway restart
```

Se você executar o gateway manualmente, `opencraft gateway --force` pode recuperar a porta. Consulte [Gateway](/gateway).

### Fechei meu terminal no Windows. Como reinicio o OpenCraft

Existem **dois modos de instalação no Windows**:

**1) WSL2 (recomendado):** o Gateway roda dentro do Linux.

Abra o PowerShell, entre no WSL, então reinicie:

```powershell
wsl
opencraft gateway status
opencraft gateway restart
```

Se você nunca instalou o serviço, inicie-o em primeiro plano:

```bash
opencraft gateway run
```

**2) Windows nativo (não recomendado):** o Gateway roda diretamente no Windows.

Abra o PowerShell e execute:

```powershell
opencraft gateway status
opencraft gateway restart
```

Se você o executar manualmente (sem serviço), use:

```powershell
opencraft gateway run
```

Documentação: [Windows (WSL2)](/platforms/windows), [Runbook do serviço Gateway](/gateway).

### O Gateway está ativo mas as respostas nunca chegam. O que verificar

Comece com uma varredura rápida de saúde:

```bash
opencraft status
opencraft models status
opencraft channels status
opencraft logs --follow
```

Causas comuns:

- Autenticação de modelo não carregada no **host do gateway** (verifique `models status`).
- Emparelhamento/lista de permissões do canal bloqueando respostas (verifique a configuração do canal + logs).
- WebChat/Dashboard aberto sem o token correto.

Se você estiver remoto, confirme que o túnel/conexão Tailscale está ativo e que o WebSocket do Gateway está acessível.

Documentação: [Canais](/channels), [Solução de problemas](/gateway/troubleshooting), [Acesso remoto](/gateway/remote).

### "Disconnected from gateway: no reason". O que fazer agora

Isso geralmente significa que a UI perdeu a conexão WebSocket. Verifique:

1. O Gateway está em execução? `opencraft gateway status`
2. O Gateway está saudável? `opencraft status`
3. A UI tem o token correto? `opencraft dashboard`
4. Se remoto, o link do túnel/Tailscale está ativo?

Então monitore os logs:

```bash
opencraft logs --follow
```

Documentação: [Dashboard](/web/dashboard), [Acesso remoto](/gateway/remote), [Solução de problemas](/gateway/troubleshooting).

### "Telegram setMyCommands fails". O que verificar

Comece com logs e status do canal:

```bash
opencraft channels status
opencraft channels logs --channel telegram
```

Depois combine com o erro:

- `BOT_COMMANDS_TOO_MUCH`: o menu do Telegram tem muitas entradas. O OpenCraft já reduz ao limite do Telegram e tenta novamente com menos comandos, mas algumas entradas do menu ainda precisam ser removidas. Reduza os comandos de plugin/skill/personalizados, ou desative `channels.telegram.commands.native` se você não precisar do menu.
- `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` ou erros de rede similares: se você estiver em um VPS ou atrás de um proxy, confirme que o HTTPS de saída está permitido e que o DNS funciona para `api.telegram.org`.

Se o Gateway for remoto, certifique-se de estar verificando os logs no host do Gateway.

Documentação: [Telegram](/channels/telegram), [Solução de problemas de canal](/channels/troubleshooting).

### "TUI shows no output". O que verificar

Primeiro, confirme que o Gateway está acessível e que o agente pode executar:

```bash
opencraft status
opencraft models status
opencraft logs --follow
```

Na TUI, use `/status` para ver o estado atual. Se você espera respostas em um canal de chat, certifique-se de que a entrega está habilitada (`/deliver on`).

Documentação: [TUI](/web/tui), [Comandos slash](/tools/slash-commands).

### Como paro e inicio o Gateway completamente

Se você instalou o serviço:

```bash
opencraft gateway stop
opencraft gateway start
```

Isso para/inicia o **serviço supervisionado** (launchd no macOS, systemd no Linux). Use isso quando o Gateway estiver sendo executado em segundo plano como um daemon.

Se você estiver executando em primeiro plano, pare com Ctrl-C, então:

```bash
opencraft gateway run
```

Documentação: [Runbook do serviço Gateway](/gateway).

### ELI5: "opencraft gateway restart" vs "opencraft gateway"

- `opencraft gateway restart`: reinicia o **serviço em segundo plano** (launchd/systemd).
- `opencraft gateway`: executa o gateway **em primeiro plano** para esta sessão do terminal.

Se você instalou o serviço, use os comandos do gateway. Use `opencraft gateway` quando quiser uma execução pontual em primeiro plano.

### Qual é a forma mais rápida de obter mais detalhes quando algo falha

Inicie o Gateway com `--verbose` para obter mais detalhes no console. Então inspecione o arquivo de log para erros de autenticação de canal, roteamento de modelo e RPC.

## Mídia e anexos

### Minha skill gerou uma imagem/PDF mas nada foi enviado

Anexos de saída do agente devem incluir uma linha `MEDIA:<caminho-ou-url>` (em sua própria linha). Consulte [Configuração do assistente OpenCraft](/start/openclaw) e [Agent send](/tools/agent-send).

Envio via CLI:

```bash
opencraft message send --target +15555550123 --message "Aqui está" --media /caminho/para/arquivo.png
```

Também verifique:

- O canal de destino suporta mídia de saída e não está bloqueado por listas de permissões.
- O arquivo está dentro dos limites de tamanho do provedor (imagens são redimensionadas para no máximo 2048px).

Consulte [Imagens](/nodes/images).

## Segurança e controle de acesso

### É seguro expor o OpenCraft a DMs recebidas

Trate DMs recebidas como entrada não confiável. Os padrões são projetados para reduzir riscos:

- O comportamento padrão em canais com capacidade de DM é **emparelhamento**:
  - Remetentes desconhecidos recebem um código de emparelhamento; o bot não processa suas mensagens.
  - Aprove com: `opencraft pairing approve --channel <canal> [--account <id>] <código>`
  - Solicitações pendentes são limitadas a **3 por canal**; verifique `opencraft pairing list --channel <canal> [--account <id>]` se um código não chegou.
- Abrir DMs publicamente requer opt-in explícito (`dmPolicy: "open"` e lista de permissões `"*"`).

Execute `opencraft doctor` para identificar políticas de DM arriscadas.

### A injeção de prompt é uma preocupação apenas para bots públicos

Não. A injeção de prompt diz respeito a **conteúdo não confiável**, não apenas a quem pode enviar DM para o bot. Se o seu assistente lê conteúdo externo (busca na web/fetch, páginas do navegador, e-mails, documentos, anexos, logs colados), esse conteúdo pode incluir instruções que tentam sequestrar o modelo. Isso pode acontecer mesmo que **você seja o único remetente**.

O maior risco é quando as ferramentas estão habilitadas: o modelo pode ser enganado para exfiltrar contexto ou chamar ferramentas em seu nome. Reduza o raio de impacto:

- usando um agente "leitor" somente-leitura ou sem ferramentas para resumir conteúdo não confiável
- mantendo `web_search` / `web_fetch` / `browser` desativados para agentes com ferramentas habilitadas
- sandboxing e listas de permissões estritas de ferramentas

Detalhes: [Segurança](/gateway/security).

### Meu bot deve ter seu próprio e-mail, conta do GitHub ou número de telefone

Sim, para a maioria das configurações. Isolar o bot com contas e números de telefone separados reduz o raio de impacto se algo der errado. Isso também facilita a rotação de credenciais ou revogação de acesso sem afetar suas contas pessoais.

Comece pequeno. Conceda acesso apenas às ferramentas e contas de que você realmente precisa, e expanda depois se necessário.

Documentação: [Segurança](/gateway/security), [Emparelhamento](/channels/pairing).

### Posso dar autonomia sobre minhas mensagens de texto e isso é seguro

**Não** recomendamos autonomia total sobre suas mensagens pessoais. O padrão mais seguro é:

- Manter DMs em **modo de emparelhamento** ou em uma lista de permissões restrita.
- Usar um **número ou conta separados** se quiser que ele envie mensagens em seu nome.
- Deixá-lo rascunhar, depois **aprovar antes de enviar**.

Se quiser experimentar, faça em uma conta dedicada e mantenha isolado. Consulte [Segurança](/gateway/security).

### Posso usar modelos mais baratos para tarefas de assistente pessoal

Sim, **se** o agente for apenas para chat e a entrada for confiável. Modelos menores são mais suscetíveis ao sequestro de instruções, portanto evite-os para agentes com ferramentas habilitadas ou ao ler conteúdo não confiável. Se precisar usar um modelo menor, restrinja as ferramentas e execute dentro de um sandbox. Consulte [Segurança](/gateway/security).

### Enviei /start no Telegram mas não recebi um código de emparelhamento

Códigos de emparelhamento são enviados **apenas** quando um remetente desconhecido envia mensagem ao bot e `dmPolicy: "pairing"` está habilitado. `/start` por si só não gera um código.

Verifique solicitações pendentes:

```bash
opencraft pairing list telegram
```

Se quiser acesso imediato, coloque seu ID de remetente na lista de permissões ou defina `dmPolicy: "open"` para essa conta.

### WhatsApp vai enviar mensagens para meus contatos? Como funciona o emparelhamento

Não. A política padrão de DM do WhatsApp é **emparelhamento**. Remetentes desconhecidos recebem apenas um código de emparelhamento e suas mensagens **não são processadas**. O OpenCraft só responde a chats que recebe ou a envios explícitos que você aciona.

Aprove o emparelhamento com:

```bash
opencraft pairing approve whatsapp <código>
```

Liste solicitações pendentes:

```bash
opencraft pairing list whatsapp
```

Prompt do número de telefone no wizard: é usado para definir sua **lista de permissões/proprietário** para que seus próprios DMs sejam permitidos. Não é usado para envio automático. Se você executar em seu número pessoal do WhatsApp, use esse número e ative `channels.whatsapp.selfChatMode`.

## Comandos de chat, abortar tarefas e "não para"

### Como paro mensagens internas do sistema de aparecerem no chat

A maioria das mensagens internas ou de ferramentas só aparece quando **verbose** ou **reasoning** está habilitado para essa sessão.

Correção no chat onde você está vendo isso:

```
/verbose off
/reasoning off
```

Se ainda estiver barulhento, verifique as configurações da sessão na UI de Controle e defina verbose como **inherit**. Também confirme que você não está usando um perfil de bot com `verboseDefault` definido como `on` na configuração.

Documentação: [Pensamento e verbose](/tools/thinking), [Segurança](/gateway/security#reasoning--verbose-output-in-groups).

### Como paro/cancelo uma tarefa em execução

Envie qualquer um destes **como uma mensagem independente** (sem barra):

```
stop
stop action
stop current action
stop run
stop current run
stop agent
stop the agent
stop openclaw
openclaw stop
stop don't do anything
stop do not do anything
stop doing anything
please stop
stop please
abort
esc
wait
exit
interrupt
```

Estes são gatilhos de abortar (não são comandos slash).

Para processos em segundo plano (da ferramenta exec), você pode pedir ao agente para executar:

```
process action:kill sessionId:XXX
```

Visão geral dos comandos slash: consulte [Comandos slash](/tools/slash-commands).

A maioria dos comandos deve ser enviada como uma mensagem **independente** que começa com `/`, mas alguns atalhos (como `/status`) também funcionam inline para remetentes na lista de permissões.

### Como envio uma mensagem do Discord pelo Telegram? "Cross-context messaging denied"

O OpenCraft bloqueia mensagens **entre provedores** por padrão. Se uma chamada de ferramenta estiver vinculada ao Telegram, ela não enviará para o Discord a menos que você permita explicitamente.

Habilite mensagens entre provedores para o agente:

```json5
{
  agents: {
    defaults: {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    },
  },
}
```

Reinicie o gateway após editar a configuração. Se quiser isso apenas para um único agente, defina em `agents.list[].tools.message` em vez disso.

### Por que parece que o bot ignora mensagens enviadas rapidamente em sequência

O modo de fila controla como novas mensagens interagem com uma execução em andamento. Use `/queue` para mudar de modo:

- `steer` - novas mensagens redirecionam a tarefa atual
- `followup` - executa mensagens uma de cada vez
- `collect` - agrupa mensagens e responde uma vez (padrão)
- `steer-backlog` - direciona agora, depois processa o backlog
- `interrupt` - aborta a execução atual e começa do zero

Você pode adicionar opções como `debounce:2s cap:25 drop:summarize` para modos de followup.

## Respondendo à pergunta exata da captura de tela/log de chat

**P: "Qual é o modelo padrão para a Anthropic com uma chave de API?"**

**R:** No OpenCraft, credenciais e seleção de modelo são separadas. Definir `ANTHROPIC_API_KEY` (ou armazenar uma chave de API Anthropic nos perfis de autenticação) habilita a autenticação, mas o modelo padrão real é o que você configurou em `agents.defaults.model.primary` (por exemplo, `anthropic/claude-sonnet-4-5` ou `anthropic/claude-opus-4-6`). Se você ver `No credentials found for profile "anthropic:default"`, significa que o Gateway não conseguiu encontrar credenciais da Anthropic no `auth-profiles.json` esperado para o agente em execução.

---

Ainda travado? Pergunte no [Discord](https://discord.com/invite/clawd) ou abra uma [discussão no GitHub](https://github.com/openclaw/openclaw/discussions).
