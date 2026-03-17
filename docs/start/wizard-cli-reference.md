---
summary: "Referência completa para o fluxo de configuração via CLI, setup de autenticação/modelo, saídas e internos"
read_when:
  - Você precisa de detalhes sobre o comportamento do opencraft onboard
  - Você está depurando resultados do onboarding ou integrando clientes de onboarding
title: "Referência do Setup via CLI"
sidebarTitle: "Referência CLI"
---

# Referência do Setup via CLI

Esta página é a referência completa para `opencraft onboard`.
Para o guia resumido, veja [Onboarding (CLI)](/start/wizard).

## O que o wizard faz

O modo local (padrão) guia você por:

- Setup de modelo e autenticação (assinatura OpenAI Code OAuth, API key Anthropic ou setup Token, além de opções MiniMax, GLM, Ollama, Moonshot e AI Gateway)
- Localização do workspace e arquivos de bootstrap
- Configurações do Gateway (porta, bind, autenticação, tailscale)
- Canais e provedores (Telegram, WhatsApp, Discord, Google Chat, Plugin Mattermost, Signal)
- Instalação do daemon (LaunchAgent ou unidade systemd de usuário)
- Verificação de saúde
- Setup de Skills

O modo remoto configura esta máquina para se conectar a um Gateway em outro lugar.
Ele não instala nem modifica nada no host remoto.

## Detalhes do fluxo local

<Steps>
  <Step title="Detecção de config existente">
    - Se `~/.editzffaleta/OpenCraft.json` existir, escolha Manter, Modificar ou Resetar.
    - Re-executar o wizard não apaga nada a menos que você escolha explicitamente Resetar (ou passe `--reset`).
    - O CLI `--reset` padrão é `config+creds+sessions`; use `--reset-scope full` para também remover o workspace.
    - Se o config é inválido ou contém chaves legadas, o wizard para e pede que você execute `opencraft doctor` antes de continuar.
    - Reset usa `trash` e oferece escopos:
      - Apenas config
      - Config + credenciais + sessões
      - Reset completo (também remove workspace)
  </Step>
  <Step title="Modelo e autenticação">
    - A matriz completa de opções está em [Opções de autenticação e modelo](#opções-de-autenticação-e-modelo).
  </Step>
  <Step title="Workspace">
    - Padrão `~/.opencraft/workspace` (configurável).
    - Popula arquivos de workspace necessários para o ritual de bootstrap na primeira execução.
    - Layout do workspace: [Workspace do agente](/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Solicita porta, bind, modo de autenticação e exposição tailscale.
    - Recomendado: mantenha autenticação por Token habilitada mesmo para loopback para que clientes WS locais precisem se autenticar.
    - No modo Token, o setup interativo oferece:
      - **Gerar/armazenar Token em texto plano** (padrão)
      - **Usar SecretRef** (opt-in)
    - No modo senha, o setup interativo também suporta armazenamento em texto plano ou SecretRef.
    - Caminho SecretRef de Token não-interativo: `--gateway-token-ref-env <ENV_VAR>`.
      - Requer uma variável de ambiente não vazia no ambiente do processo de onboarding.
      - Não pode ser combinado com `--gateway-token`.
    - Desabilite autenticação apenas se você confia totalmente em todos os processos locais.
    - Binds não-loopback ainda requerem autenticação.
  </Step>
  <Step title="Canais">
    - [WhatsApp](/channels/whatsapp): login QR opcional
    - [Telegram](/channels/telegram): Bot Token
    - [Discord](/channels/discord): Bot Token
    - [Google Chat](/channels/googlechat): JSON de conta de serviço + audiência de Webhook
    - [Mattermost](/channels/mattermost) Plugin: Bot Token + URL base
    - [Signal](/channels/signal): instalação opcional de `signal-cli` + config de conta
    - [BlueBubbles](/channels/bluebubbles): recomendado para iMessage; URL do servidor + senha + Webhook
    - [iMessage](/channels/imessage): caminho legado do CLI `imsg` + acesso ao banco de dados
    - Segurança de DM: o padrão é pareamento. O primeiro DM envia um código; aprove via
      `opencraft pairing approve <channel> <code>` ou use allowlists.
  </Step>
  <Step title="Instalação do daemon">
    - macOS: LaunchAgent
      - Requer sessão de usuário logado; para headless, use um LaunchDaemon personalizado (não incluído).
    - Linux e Windows via WSL2: unidade systemd de usuário
      - O wizard tenta `loginctl enable-linger <user>` para que o Gateway continue rodando após logout.
      - Pode solicitar sudo (escreve em `/var/lib/systemd/linger`); tenta sem sudo primeiro.
    - Seleção de runtime: Node (recomendado; necessário para WhatsApp e Telegram). Bun não é recomendado.
  </Step>
  <Step title="Verificação de saúde">
    - Inicia o Gateway (se necessário) e executa `opencraft health`.
    - `opencraft status --deep` adiciona sondas de saúde do Gateway à saída de status.
  </Step>
  <Step title="Skills">
    - Lê Skills disponíveis e verifica requisitos.
    - Permite escolher gerenciador de nó: npm ou pnpm (bun não é recomendado).
    - Instala dependências opcionais (algumas usam Homebrew no macOS).
  </Step>
  <Step title="Finalização">
    - Resumo e próximos passos, incluindo opções de app iOS, Android e macOS.
  </Step>
</Steps>

<Note>
Se nenhuma interface gráfica for detectada, o wizard imprime instruções de port-forward SSH para a Control UI em vez de abrir um navegador.
Se os assets da Control UI estiverem ausentes, o wizard tenta compilá-los; o fallback é `pnpm ui:build` (instala dependências da UI automaticamente).
</Note>

## Detalhes do modo remoto

O modo remoto configura esta máquina para se conectar a um Gateway em outro lugar.

<Info>
O modo remoto não instala nem modifica nada no host remoto.
</Info>

O que você define:

- URL do Gateway remoto (`ws://...`)
- Token se autenticação do Gateway remoto é necessária (recomendado)

<Note>
- Se o Gateway está apenas em loopback, use túnel SSH ou uma tailnet.
- Dicas de descoberta:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opções de autenticação e modelo

<AccordionGroup>
  <Accordion title="API key Anthropic">
    Usa `ANTHROPIC_API_KEY` se presente ou solicita uma chave, depois salva para uso do daemon.
  </Accordion>
  <Accordion title="OAuth Anthropic (CLI Claude Code)">
    - macOS: verifica item do Keychain "Claude Code-credentials"
    - Linux e Windows: reutiliza `~/.claude/.credentials.json` se presente

    No macOS, escolha "Permitir Sempre" para que inicializações pelo launchd não bloqueiem.

  </Accordion>
  <Accordion title="Token Anthropic (colar setup-token)">
    Execute `claude setup-token` em qualquer máquina, depois cole o Token.
    Você pode nomeá-lo; deixe em branco para o padrão.
  </Accordion>
  <Accordion title="Assinatura OpenAI Code (reutilização do CLI Codex)">
    Se `~/.codex/auth.json` existir, o wizard pode reutilizá-lo.
  </Accordion>
  <Accordion title="Assinatura OpenAI Code (OAuth)">
    Fluxo no navegador; cole `code#state`.

    Define `agents.defaults.model` para `openai-codex/gpt-5.4` quando o modelo não está definido ou é `openai/*`.

  </Accordion>
  <Accordion title="API key OpenAI">
    Usa `OPENAI_API_KEY` se presente ou solicita uma chave, depois armazena a credencial nos perfis de autenticação.

    Define `agents.defaults.model` para `openai/gpt-5.1-codex` quando o modelo não está definido, é `openai/*` ou `openai-codex/*`.

  </Accordion>
  <Accordion title="API key xAI (Grok)">
    Solicita `XAI_API_KEY` e configura xAI como provedor de modelo.
  </Accordion>
  <Accordion title="OpenCode">
    Solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`) e permite escolher o catálogo Zen ou Go.
    URL de setup: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (genérica)">
    Armazena a chave para você.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Solicita `AI_GATEWAY_API_KEY`.
    Mais detalhes: [Vercel AI Gateway](/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Solicita ID da conta, ID do Gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Mais detalhes: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax M2.5">
    O config é escrito automaticamente.
    Mais detalhes: [MiniMax](/providers/minimax).
  </Accordion>
  <Accordion title="Synthetic (compatível com Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Mais detalhes: [Synthetic](/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (modelos abertos na nuvem e locais)">
    Solicita URL base (padrão `http://127.0.0.1:11434`), depois oferece modo Nuvem + Local ou Local.
    Descobre modelos disponíveis e sugere padrões.
    Mais detalhes: [Ollama](/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot e Kimi Coding">
    Configs do Moonshot (Kimi K2) e Kimi Coding são escritos automaticamente.
    Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot).
  </Accordion>
  <Accordion title="Provedor personalizado">
    Funciona com endpoints compatíveis com OpenAI e Anthropic.

    O onboarding interativo suporta as mesmas opções de armazenamento de API key que outros fluxos de API key de provedor:
    - **Colar API key agora** (texto plano)
    - **Usar referência de segredo** (ref de env ou ref de provedor configurado, com validação prévia)

    Flags não-interativas:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; fallback para `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|anthropic>` (opcional; padrão `openai`)

  </Accordion>
  <Accordion title="Pular">
    Deixa a autenticação sem configurar.
  </Accordion>
</AccordionGroup>

Comportamento de modelo:

- Escolha o modelo padrão das opções detectadas, ou insira provedor e modelo manualmente.
- O wizard executa uma verificação de modelo e alerta se o modelo configurado é desconhecido ou sem autenticação.

Caminhos de credenciais e perfis:

- Credenciais OAuth: `~/.opencraft/credentials/oauth.json`
- Perfis de autenticação (API keys + OAuth): `~/.opencraft/agents/<agentId>/agent/auth-profiles.json`

Modo de armazenamento de credenciais:

- O comportamento padrão de onboarding persiste API keys como valores em texto plano nos perfis de autenticação.
- `--secret-input-mode ref` habilita modo de referência em vez de armazenamento de chave em texto plano.
  No setup interativo, você pode escolher:
  - ref de variável de ambiente (por exemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - ref de provedor configurado (`file` ou `exec`) com alias de provedor + id
- O modo de referência interativo executa uma validação prévia rápida antes de salvar.
  - Refs de env: valida nome da variável + valor não vazio no ambiente de onboarding atual.
  - Refs de provedor: valida config do provedor e resolve o id solicitado.
  - Se a validação prévia falhar, o onboarding mostra o erro e permite tentar novamente.
- No modo não-interativo, `--secret-input-mode ref` é apenas baseado em env.
  - Defina a variável de ambiente do provedor no ambiente do processo de onboarding.
  - Flags de chave inline (por exemplo `--openai-api-key`) requerem que aquela variável de ambiente esteja definida; caso contrário, o onboarding falha imediatamente.
  - Para provedores personalizados, modo `ref` não-interativo armazena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Nesse caso de provedor personalizado, `--custom-api-key` requer que `CUSTOM_API_KEY` esteja definida; caso contrário, o onboarding falha imediatamente.
- Credenciais de autenticação do Gateway suportam escolhas de texto plano e SecretRef no setup interativo:
  - Modo Token: **Gerar/armazenar Token em texto plano** (padrão) ou **Usar SecretRef**.
  - Modo senha: texto plano ou SecretRef.
- Caminho SecretRef de Token não-interativo: `--gateway-token-ref-env <ENV_VAR>`.
- Configurações existentes em texto plano continuam funcionando sem alterações.

<Note>
Dica para headless e servidor: complete o OAuth em uma máquina com navegador, depois copie
`~/.opencraft/credentials/oauth.json` (ou `$OPENCRAFT_STATE_DIR/credentials/oauth.json`)
para o host do Gateway.
</Note>

## Saídas e internos

Campos típicos em `~/.editzffaleta/OpenCraft.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se Minimax escolhido)
- `tools.profile` (onboarding local padrão é `"coding"` quando não definido; valores explícitos existentes são preservados)
- `gateway.*` (modo, bind, autenticação, tailscale)
- `session.dmScope` (onboarding local define como `per-channel-peer` quando não definido; valores explícitos existentes são preservados)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.signal.*`, `channels.imessage.*`
- Allowlists de canal (Slack, Discord, Matrix, Microsoft Teams) quando você opta durante os prompts (nomes são resolvidos para IDs quando possível)
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`opencraft agents add` escreve `agents.list[]` e `bindings` opcionais.

Credenciais do WhatsApp ficam em `~/.opencraft/credentials/whatsapp/<accountId>/`.
Sessões são armazenadas em `~/.opencraft/agents/<agentId>/sessions/`.

<Note>
Alguns canais são entregues como Plugins. Quando selecionados durante o setup, o wizard
solicita a instalação do Plugin (npm ou caminho local) antes da configuração do canal.
</Note>

Gateway wizard RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clientes (app macOS e Control UI) podem renderizar etapas sem reimplementar a lógica de onboarding.

Comportamento do setup do Signal:

- Baixa o asset de release apropriado
- Armazena em `~/.opencraft/tools/signal-cli/<version>/`
- Escreve `channels.signal.cliPath` no config
- Builds JVM requerem Java 21
- Builds nativos são usados quando disponíveis
- Windows usa WSL2 e segue o fluxo do signal-cli Linux dentro do WSL

## Documentação relacionada

- Hub de onboarding: [Onboarding (CLI)](/start/wizard)
- Automação e scripts: [Automação CLI](/start/wizard-cli-automation)
- Referência de comando: [`opencraft onboard`](/cli/onboard)
