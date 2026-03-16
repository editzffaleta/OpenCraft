---
summary: "Referência completa para o fluxo de onboarding CLI, configuração de auth/modelo, saídas e internos"
read_when:
  - Você precisa do comportamento detalhado do opencraft onboard
  - Você está depurando resultados de onboarding ou integrando clientes de onboarding
title: "Referência CLI de Onboarding"
sidebarTitle: "Referência CLI"
---

# Referência CLI de Onboarding

Esta página é a referência completa do `opencraft onboard`.
Para o guia rápido, veja [Assistente de Onboarding (CLI)](/start/wizard).

## O que o assistente faz

O modo local (padrão) guia você através de:

- Configuração de modelo e auth (OAuth de assinatura OpenAI Code, chave de API Anthropic ou token de configuração, além de opções MiniMax, GLM, Ollama, Moonshot e AI Gateway)
- Local do workspace e arquivos de bootstrap
- Configurações do Gateway (porta, bind, auth, tailscale)
- Canais e provedores (Telegram, WhatsApp, Discord, Google Chat, plugin Mattermost, Signal)
- Instalação de daemon (LaunchAgent ou unidade de usuário systemd)
- Verificação de saúde
- Configuração de skills

O modo remoto configura esta máquina para se conectar a um gateway em outro lugar.
Não instala nem modifica nada no host remoto.

## Detalhes do fluxo local

<Steps>
  <Step title="Detecção de configuração existente">
    - Se `~/.opencraft/opencraft.json` existe, escolha Manter, Modificar ou Resetar.
    - Reexecutar o assistente não apaga nada a menos que você escolha explicitamente Resetar (ou passe `--reset`).
    - O CLI `--reset` padrão é `config+creds+sessions`; use `--reset-scope full` para também remover o workspace.
    - Se a configuração for inválida ou contiver chaves legadas, o assistente para e pede para executar `opencraft doctor` antes de continuar.
    - O reset usa `trash` e oferece escopos:
      - Apenas config
      - Config + credenciais + sessões
      - Reset completo (também remove o workspace)
  </Step>
  <Step title="Modelo e auth">
    - A matriz completa de opções está em [Opções de auth e modelo](#opções-de-auth-e-modelo).
  </Step>
  <Step title="Workspace">
    - Padrão `~/.opencraft/workspace` (configurável).
    - Cria arquivos de workspace necessários para o ritual de bootstrap da primeira execução.
    - Layout do workspace: [Workspace do agente](/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Solicita porta, bind, modo de auth e exposição tailscale.
    - Recomendado: mantenha o auth por token habilitado mesmo para loopback, para que clientes WS locais precisem se autenticar.
    - No modo token, o onboarding interativo oferece:
      - **Gerar/armazenar token em texto simples** (padrão)
      - **Usar SecretRef** (opt-in)
    - No modo senha, o onboarding interativo também suporta armazenamento em texto simples ou SecretRef.
    - Caminho de SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
      - Requer uma variável de ambiente não vazia no ambiente do processo de onboarding.
      - Não pode ser combinado com `--gateway-token`.
    - Desabilite o auth apenas se você confiar completamente em todos os processos locais.
    - Binds não-loopback ainda requerem auth.
  </Step>
  <Step title="Canais">
    - [WhatsApp](/channels/whatsapp): login QR opcional
    - [Telegram](/channels/telegram): token do bot
    - [Discord](/channels/discord): token do bot
    - [Google Chat](/channels/googlechat): JSON de conta de serviço + público de webhook
    - Plugin [Mattermost](/channels/mattermost): token do bot + URL base
    - [Signal](/channels/signal): instalação opcional do `signal-cli` + configuração de conta
    - [BlueBubbles](/channels/bluebubbles): recomendado para iMessage; URL do servidor + senha + webhook
    - [iMessage](/channels/imessage): caminho CLI `imsg` legado + acesso ao banco de dados
    - Segurança de DM: o padrão é pareamento. O primeiro DM envia um código; aprove via
      `opencraft pairing approve <canal> <código>` ou use listas de permissão.
  </Step>
  <Step title="Instalação de daemon">
    - macOS: LaunchAgent
      - Requer sessão de usuário logado; para headless, use um LaunchDaemon personalizado (não fornecido).
    - Linux e Windows via WSL2: unidade de usuário systemd
      - O assistente tenta `loginctl enable-linger <user>` para que o gateway continue após o logout.
      - Pode solicitar sudo (grava em `/var/lib/systemd/linger`); tenta sem sudo primeiro.
    - Seleção de runtime: Node (recomendado; necessário para WhatsApp e Telegram). Bun não é recomendado.
  </Step>
  <Step title="Verificação de saúde">
    - Inicia o gateway (se necessário) e executa `opencraft health`.
    - `opencraft status --deep` adiciona probes de saúde do gateway à saída de status.
  </Step>
  <Step title="Skills">
    - Lê as skills disponíveis e verifica os requisitos.
    - Permite escolher o gerenciador de nós: npm ou pnpm (bun não recomendado).
    - Instala dependências opcionais (algumas usam Homebrew no macOS).
  </Step>
  <Step title="Finalização">
    - Resumo e próximos passos, incluindo opções de app iOS, Android e macOS.
  </Step>
</Steps>

<Note>
Se nenhuma GUI for detectada, o assistente imprime instruções de port-forward SSH para a UI de controle em vez de abrir um navegador.
Se os assets da UI de controle estiverem ausentes, o assistente tenta compilá-los; fallback é `pnpm ui:build` (instala deps de UI automaticamente).
</Note>

## Detalhes do modo remoto

O modo remoto configura esta máquina para se conectar a um gateway em outro lugar.

<Info>
O modo remoto não instala nem modifica nada no host remoto.
</Info>

O que você define:

- URL do gateway remoto (`ws://...`)
- Token se o auth do gateway remoto for necessário (recomendado)

<Note>
- Se o gateway for apenas loopback, use tunelamento SSH ou uma tailnet.
- Dicas de descoberta:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opções de auth e modelo

<AccordionGroup>
  <Accordion title="Chave de API Anthropic">
    Usa `ANTHROPIC_API_KEY` se presente ou solicita uma chave, depois a salva para uso do daemon.
  </Accordion>
  <Accordion title="OAuth Anthropic (Claude Code CLI)">
    - macOS: verifica item do Keychain "Claude Code-credentials"
    - Linux e Windows: reutiliza `~/.claude/.credentials.json` se presente

    No macOS, escolha "Permitir sempre" para que inícios do launchd não bloqueiem.

  </Accordion>
  <Accordion title="Token Anthropic (cole o setup-token)">
    Execute `claude setup-token` em qualquer máquina, depois cole o token.
    Você pode nomeá-lo; vazio usa o padrão.
  </Accordion>
  <Accordion title="Assinatura OpenAI Code (reutilização do Codex CLI)">
    Se `~/.codex/auth.json` existe, o assistente pode reutilizá-lo.
  </Accordion>
  <Accordion title="Assinatura OpenAI Code (OAuth)">
    Fluxo no navegador; cole `code#state`.

    Define `agents.defaults.model` para `openai-codex/gpt-5.4` quando o modelo não está definido ou é `openai/*`.

  </Accordion>
  <Accordion title="Chave de API OpenAI">
    Usa `OPENAI_API_KEY` se presente ou solicita uma chave, depois armazena a credencial nos perfis de auth.

    Define `agents.defaults.model` para `openai/gpt-5.1-codex` quando o modelo não está definido, é `openai/*` ou `openai-codex/*`.

  </Accordion>
  <Accordion title="Chave de API xAI (Grok)">
    Solicita `XAI_API_KEY` e configura xAI como provedor de modelo.
  </Accordion>
  <Accordion title="OpenCode">
    Solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`) e permite escolher o catálogo Zen ou Go.
    URL de configuração: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Chave de API (genérica)">
    Armazena a chave para você.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Solicita `AI_GATEWAY_API_KEY`.
    Mais detalhes: [Vercel AI Gateway](/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Solicita ID de conta, ID do gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Mais detalhes: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax M2.5">
    A configuração é gravada automaticamente.
    Mais detalhes: [MiniMax](/providers/minimax).
  </Accordion>
  <Accordion title="Synthetic (compatível com Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Mais detalhes: [Synthetic](/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (modelos abertos na nuvem e locais)">
    Solicita URL base (padrão `http://127.0.0.1:11434`), depois oferece modo Cloud + Local ou apenas Local.
    Descobre modelos disponíveis e sugere padrões.
    Mais detalhes: [Ollama](/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot e Kimi Coding">
    As configurações Moonshot (Kimi K2) e Kimi Coding são gravadas automaticamente.
    Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot).
  </Accordion>
  <Accordion title="Provedor personalizado">
    Funciona com endpoints compatíveis com OpenAI e Anthropic.

    O onboarding interativo suporta as mesmas opções de armazenamento de chave de API que outros fluxos de chave de API de provedor:
    - **Cole a chave de API agora** (texto simples)
    - **Usar referência de segredo** (ref de env ou ref de provedor configurada, com validação de preflight)

    Flags não interativas:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; fallback para `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|anthropic>` (opcional; padrão `openai`)

  </Accordion>
  <Accordion title="Pular">
    Deixa o auth sem configuração.
  </Accordion>
</AccordionGroup>

Comportamento do modelo:

- Escolha o modelo padrão entre as opções detectadas, ou insira provedor e modelo manualmente.
- O assistente executa uma verificação de modelo e avisa se o modelo configurado for desconhecido ou sem auth.

Caminhos de credenciais e perfis:

- Credenciais OAuth: `~/.opencraft/credentials/oauth.json`
- Perfis de auth (chaves de API + OAuth): `~/.opencraft/agents/<agentId>/agent/auth-profiles.json`

Modo de armazenamento de credenciais:

- O comportamento padrão de onboarding persiste chaves de API como valores em texto simples nos perfis de auth.
- `--secret-input-mode ref` habilita o modo de referência em vez do armazenamento de chave em texto simples.
  No onboarding interativo, você pode escolher:
  - ref de variável de ambiente (por exemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - ref de provedor configurada (`file` ou `exec`) com alias de provedor + id
- O modo de referência interativo executa uma validação rápida de preflight antes de salvar.
  - Refs de env: valida nome da variável + valor não vazio no ambiente de onboarding atual.
  - Refs de provedor: valida a configuração do provedor e resolve o id solicitado.
  - Se o preflight falhar, o onboarding mostra o erro e permite tentar novamente.
- No modo não interativo, `--secret-input-mode ref` usa apenas backup em env.
  - Defina a variável de ambiente do provedor no ambiente do processo de onboarding.
  - Flags de chave inline (por exemplo `--openai-api-key`) requerem que a variável de env esteja definida; caso contrário, o onboarding falha rapidamente.
  - Para provedores personalizados, o modo `ref` não interativo armazena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Nesse caso de provedor personalizado, `--custom-api-key` requer que `CUSTOM_API_KEY` esteja definido; caso contrário, o onboarding falha rapidamente.
- As credenciais de auth do gateway suportam escolhas em texto simples e SecretRef no onboarding interativo:
  - Modo token: **Gerar/armazenar token em texto simples** (padrão) ou **Usar SecretRef**.
  - Modo senha: texto simples ou SecretRef.
- Caminho de SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
- Configurações existentes em texto simples continuam funcionando sem alterações.

<Note>
Dica para headless e servidor: complete o OAuth em uma máquina com navegador, depois copie
`~/.opencraft/credentials/oauth.json` (ou `$OPENCLAW_STATE_DIR/credentials/oauth.json`)
para o host do gateway.
</Note>

## Saídas e internos

Campos típicos em `~/.opencraft/opencraft.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se Minimax escolhido)
- `tools.profile` (o onboarding local padreia para `"coding"` quando não definido; valores explícitos existentes são preservados)
- `gateway.*` (modo, bind, auth, tailscale)
- `session.dmScope` (o onboarding local padreia para `per-channel-peer` quando não definido; valores explícitos existentes são preservados)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.signal.*`, `channels.imessage.*`
- Listas de permissão de canais (Slack, Discord, Matrix, Microsoft Teams) quando você opta durante os prompts (nomes resolvem para IDs quando possível)
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`opencraft agents add` grava `agents.list[]` e `bindings` opcionais.

As credenciais do WhatsApp ficam em `~/.opencraft/credentials/whatsapp/<accountId>/`.
As sessões são armazenadas em `~/.opencraft/agents/<agentId>/sessions/`.

<Note>
Alguns canais são entregues como plugins. Quando selecionados durante o onboarding, o assistente
solicita instalar o plugin (npm ou caminho local) antes da configuração do canal.
</Note>

RPC do assistente de gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clientes (app macOS e UI de controle) podem renderizar etapas sem reimplementar a lógica de onboarding.

Comportamento de configuração do Signal:

- Baixa o asset de release apropriado
- Armazena em `~/.opencraft/tools/signal-cli/<version>/`
- Grava `channels.signal.cliPath` na configuração
- Builds JVM requerem Java 21
- Builds nativos são usados quando disponíveis
- Windows usa WSL2 e segue o fluxo do signal-cli para Linux dentro do WSL

## Documentação relacionada

- Hub de onboarding: [Assistente de Onboarding (CLI)](/start/wizard)
- Automação e scripts: [Automação CLI](/start/wizard-cli-automation)
- Referência de comando: [`opencraft onboard`](/cli/onboard)
