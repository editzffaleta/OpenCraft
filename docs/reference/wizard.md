---
summary: "Referência completa do wizard de onboarding CLI: cada passo, flag e campo de configuração"
read_when:
  - Consultando um passo ou flag específico do wizard
  - Automatizando o onboarding com modo não-interativo
  - Depurando o comportamento do wizard
title: "Referência do Wizard de Onboarding"
sidebarTitle: "Referência do Wizard"
---

# Referência do Wizard de Onboarding

Esta é a referência completa para o wizard CLI `opencraft onboard`.
Para uma visão geral de alto nível, veja [Wizard de Onboarding](/start/wizard).

## Detalhes do fluxo (modo local)

<Steps>
  <Step title="Detecção de config existente">
    - Se `~/.opencraft/opencraft.json` existir, escolha **Manter / Modificar / Redefinir**.
    - Executar o wizard novamente **não** apaga nada, a menos que você escolha explicitamente **Redefinir**
      (ou passe `--reset`).
    - `--reset` via CLI usa como padrão `config+creds+sessions`; use `--reset-scope full`
      para também remover o workspace.
    - Se o config for inválido ou contiver chaves legadas, o wizard para e pede
      que você execute `opencraft doctor` antes de continuar.
    - O reset usa `trash` (nunca `rm`) e oferece escopos:
      - Somente Config
      - Config + credenciais + sessões
      - Reset completo (também remove workspace)
  </Step>
  <Step title="Modelo/Auth">
    - **Chave de API Anthropic**: usa `ANTHROPIC_API_KEY` se presente ou solicita uma chave, depois a salva para uso do daemon.
    - **OAuth Anthropic (Claude Code CLI)**: no macOS o wizard verifica o item Keychain "Claude Code-credentials" (escolha "Permitir Sempre" para que inícios do launchd não bloqueiem); no Linux/Windows reutiliza `~/.claude/.credentials.json` se presente.
    - **Token Anthropic (colar setup-token)**: execute `claude setup-token` em qualquer máquina, depois cole o token (você pode nomeá-lo; em branco = padrão).
    - **Assinatura OpenAI Code (Codex) (Codex CLI)**: se `~/.codex/auth.json` existir, o wizard pode reutilizá-lo.
    - **Assinatura OpenAI Code (Codex) (OAuth)**: fluxo no navegador; cole o `code#state`.
      - Define `agents.defaults.model` como `openai-codex/gpt-5.2` quando o modelo não estiver definido ou for `openai/*`.
    - **Chave de API OpenAI**: usa `OPENAI_API_KEY` se presente ou solicita uma chave, depois a armazena em perfis de auth.
    - **Chave de API xAI (Grok)**: solicita `XAI_API_KEY` e configura xAI como provedor de modelo.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`, obtenha em https://opencode.ai/auth) e permite escolher o catálogo Zen ou Go.
    - **Ollama**: solicita a URL base do Ollama, oferece modo **Cloud + Local** ou **Local**, descobre modelos disponíveis, e faz auto-pull do modelo local selecionado quando necessário.
    - Mais detalhes: [Ollama](/providers/ollama)
    - **Chave de API**: armazena a chave para você.
    - **Vercel AI Gateway (proxy multi-modelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Vercel AI Gateway](/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita Account ID, Gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
    - **MiniMax M2.5**: config é escrito automaticamente.
    - Mais detalhes: [MiniMax](/providers/minimax)
    - **Synthetic (compatível com Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Mais detalhes: [Synthetic](/providers/synthetic)
    - **Moonshot (Kimi K2)**: config é escrito automaticamente.
    - **Kimi Coding**: config é escrito automaticamente.
    - Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
    - **Pular**: sem auth configurado ainda.
    - Escolha um modelo padrão das opções detectadas (ou insira provedor/modelo manualmente). Para melhor qualidade e menor risco de injeção de prompt, escolha o modelo mais poderoso da última geração disponível no seu stack de provedor.
    - O wizard executa uma verificação de modelo e avisa se o modelo configurado for desconhecido ou estiver sem auth.
    - O modo de armazenamento de chave de API usa como padrão valores de perfil de auth em texto simples. Use `--secret-input-mode ref` para armazenar refs respaldadas por env em vez disso (por exemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Credenciais OAuth ficam em `~/.opencraft/credentials/oauth.json`; perfis de auth ficam em `~/.opencraft/agents/<agentId>/agent/auth-profiles.json` (chaves de API + OAuth).
    - Mais detalhes: [/concepts/oauth](/concepts/oauth)
    <Note>
    Dica para headless/servidor: complete o OAuth em uma máquina com navegador, depois copie
    `~/.opencraft/credentials/oauth.json` (ou `$OPENCLAW_STATE_DIR/credentials/oauth.json`) para o
    host do gateway.
    </Note>
  </Step>
  <Step title="Workspace">
    - Padrão `~/.opencraft/workspace` (configurável).
    - Semeia os arquivos de workspace necessários para o ritual de bootstrap do agente.
    - Layout completo do workspace + guia de backup: [Workspace do Agente](/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Porta, bind, modo de auth, exposição tailscale.
    - Recomendação de auth: mantenha **Token** mesmo para loopback para que clientes WS locais precisem se autenticar.
    - No modo token, o onboarding interativo oferece:
      - **Gerar/armazenar token em texto simples** (padrão)
      - **Usar SecretRef** (opt-in)
      - O Quickstart reutiliza SecretRefs `gateway.auth.token` existentes entre provedores `env`, `file` e `exec` para probe de onboarding/bootstrap do dashboard.
      - Se esse SecretRef estiver configurado mas não puder ser resolvido, o onboarding falha cedo com uma mensagem de correção clara em vez de degradar silenciosamente o auth do runtime.
    - No modo senha, o onboarding interativo também suporta armazenamento em texto simples ou SecretRef.
    - Caminho de SecretRef de token não-interativo: `--gateway-token-ref-env <ENV_VAR>`.
      - Requer uma variável de ambiente não-vazia no ambiente do processo de onboarding.
      - Não pode ser combinado com `--gateway-token`.
    - Desabilite o auth apenas se você confia completamente em todos os processos locais.
    - Binds não-loopback ainda requerem auth.
  </Step>
  <Step title="Canais">
    - [WhatsApp](/channels/whatsapp): login QR opcional.
    - [Telegram](/channels/telegram): token de bot.
    - [Discord](/channels/discord): token de bot.
    - [Google Chat](/channels/googlechat): JSON de conta de serviço + audiência de webhook.
    - [Mattermost](/channels/mattermost) (plugin): token de bot + URL base.
    - [Signal](/channels/signal): instalação opcional do `signal-cli` + configuração de conta.
    - [BlueBubbles](/channels/bluebubbles): **recomendado para iMessage**; URL do servidor + senha + webhook.
    - [iMessage](/channels/imessage): caminho legado do CLI `imsg` + acesso ao BD.
    - Segurança de DM: o padrão é pareamento. O primeiro DM envia um código; aprove via `opencraft pairing approve <canal> <código>` ou use allowlists.
  </Step>
  <Step title="Pesquisa web">
    - Escolha um provedor: Perplexity, Brave, Gemini, Grok, ou Kimi (ou pule).
    - Cole sua chave de API (o QuickStart detecta automaticamente chaves de variáveis de ambiente ou config existente).
    - Pule com `--skip-search`.
    - Configure depois: `opencraft configure --section web`.
  </Step>
  <Step title="Instalação do daemon">
    - macOS: LaunchAgent
      - Requer uma sessão de usuário com login; para headless, use um LaunchDaemon personalizado (não incluído).
    - Linux (e Windows via WSL2): unit systemd de usuário
      - O wizard tenta habilitar lingering via `loginctl enable-linger <usuário>` para que o Gateway continue ativo após logout.
      - Pode solicitar sudo (escreve `/var/lib/systemd/linger`); tenta sem sudo primeiro.
    - **Seleção de runtime:** Node (recomendado; necessário para WhatsApp/Telegram). Bun **não é recomendado**.
    - Se o auth por token requer um token e `gateway.auth.token` é gerenciado por SecretRef, a instalação do daemon o valida, mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço supervisor.
    - Se o auth por token requer um token e o SecretRef de token configurado não for resolvido, a instalação do daemon é bloqueada com orientação acionável.
    - Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon é bloqueada até que o modo seja definido explicitamente.
  </Step>
  <Step title="Verificação de saúde">
    - Inicia o Gateway (se necessário) e executa `opencraft health`.
    - Dica: `opencraft status --deep` adiciona probes de saúde do gateway à saída de status (requer um gateway acessível).
  </Step>
  <Step title="Skills (recomendado)">
    - Lê as skills disponíveis e verifica os requisitos.
    - Permite escolher um gerenciador de node: **npm / pnpm** (bun não recomendado).
    - Instala dependências opcionais (algumas usam Homebrew no macOS).
  </Step>
  <Step title="Concluir">
    - Resumo + próximos passos, incluindo apps iOS/Android/macOS para recursos extras.
  </Step>
</Steps>

<Note>
Se nenhuma GUI for detectada, o wizard exibe instruções de port-forward SSH para a Control UI em vez de abrir um navegador.
Se os assets da Control UI estiverem ausentes, o wizard tenta compilá-los; o fallback é `pnpm ui:build` (instala deps de UI automaticamente).
</Note>

## Modo não-interativo

Use `--non-interactive` para automatizar ou criar scripts do onboarding:

```bash
opencraft onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Adicione `--json` para um resumo legível por máquina.

SecretRef de token do gateway no modo não-interativo:

```bash
export OPENCLAW_GATEWAY_TOKEN="seu-token"
opencraft onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` e `--gateway-token-ref-env` são mutuamente exclusivos.

<Note>
`--json` **não** implica modo não-interativo. Use `--non-interactive` (e `--workspace`) para scripts.
</Note>

Exemplos de comandos específicos de provedor ficam em [Automação CLI](/start/wizard-cli-automation#provider-specific-examples).
Use esta página de referência para semântica de flags e ordem dos passos.

### Adicionar agente (não-interativo)

```bash
opencraft agents add work \
  --workspace ~/.opencraft/workspace-work \
  --model openai/gpt-5.2 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC do wizard do Gateway

O Gateway expõe o fluxo do wizard via RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Os clientes (app macOS, Control UI) podem renderizar passos sem reimplementar a lógica de onboarding.

## Configuração do Signal (signal-cli)

O wizard pode instalar `signal-cli` a partir de releases do GitHub:

- Baixa o asset de release apropriado.
- Armazena em `~/.opencraft/tools/signal-cli/<versão>/`.
- Escreve `channels.signal.cliPath` no seu config.

Notas:

- Builds JVM requerem **Java 21**.
- Builds nativos são usados quando disponíveis.
- Windows usa WSL2; a instalação do signal-cli segue o fluxo Linux dentro do WSL.

## O que o wizard escreve

Campos típicos em `~/.opencraft/opencraft.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se MiniMax for escolhido)
- `tools.profile` (o onboarding local usa como padrão `"coding"` quando não definido; valores explícitos existentes são preservados)
- `gateway.*` (modo, bind, auth, tailscale)
- `session.dmScope` (detalhes de comportamento: [Referência de Onboarding CLI](/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.signal.*`, `channels.imessage.*`
- Allowlists de canal (Slack/Discord/Matrix/Microsoft Teams) quando você opta durante os prompts (nomes são resolvidos para IDs quando possível).
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`opencraft agents add` escreve `agents.list[]` e `bindings` opcionais.

As credenciais do WhatsApp ficam em `~/.opencraft/credentials/whatsapp/<accountId>/`.
As sessões são armazenadas em `~/.opencraft/agents/<agentId>/sessions/`.

Alguns canais são entregues como plugins. Quando você escolhe um durante o onboarding, o wizard
vai solicitar a instalação (npm ou um caminho local) antes que possa ser configurado.

## Docs relacionados

- Visão geral do wizard: [Wizard de Onboarding](/start/wizard)
- Onboarding do app macOS: [Onboarding](/start/onboarding)
- Referência de config: [Configuração do Gateway](/gateway/configuration)
- Provedores: [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord), [Google Chat](/channels/googlechat), [Signal](/channels/signal), [BlueBubbles](/channels/bluebubbles) (iMessage), [iMessage](/channels/imessage) (legado)
- Skills: [Skills](/tools/skills), [Config de Skills](/tools/skills-config)
