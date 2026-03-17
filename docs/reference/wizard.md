---
summary: "Referência completa para o onboarding via CLI: cada etapa, flag e campo de configuração"
read_when:
  - Procurando uma etapa ou flag específica do onboarding
  - Automatizando o onboarding com modo não interativo
  - Depurando o comportamento do onboarding
title: "Referência do Onboarding"
sidebarTitle: "Referência do Onboarding"
---

# Referência do Onboarding

Esta é a referência completa para o `opencraft onboard`.
Para uma visão geral de alto nível, consulte [Onboarding (CLI)](/start/wizard).

## Detalhes do fluxo (modo local)

<Steps>
  <Step title="Detecção de configuração existente">
    - Se `~/.editzffaleta/OpenCraft.json` existir, escolha **Manter / Modificar / Redefinir**.
    - Executar o onboarding novamente **não** apaga nada a menos que você escolha explicitamente **Redefinir**
      (ou passe `--reset`).
    - O `--reset` do CLI padrão é `config+creds+sessions`; use `--reset-scope full`
      para também remover o workspace.
    - Se a configuração for inválida ou contiver chaves legadas, o wizard para e pede
      que você execute `opencraft doctor` antes de continuar.
    - O reset usa `trash` (nunca `rm`) e oferece escopos:
      - Apenas configuração
      - Configuração + credenciais + sessões
      - Reset completo (também remove o workspace)
  </Step>
  <Step title="Modelo/Autenticação">
    - **Chave de API Anthropic**: usa `ANTHROPIC_API_KEY` se presente ou solicita uma chave, depois a salva para uso do daemon.
    - **OAuth Anthropic (Claude Code CLI)**: no macOS, o onboarding verifica o item do Keychain "Claude Code-credentials" (escolha "Permitir Sempre" para que inicializações do launchd não bloqueiem); no Linux/Windows, reutiliza `~/.claude/.credentials.json` se presente.
    - **Token Anthropic (colar setup-token)**: execute `claude setup-token` em qualquer máquina, depois cole o Token (você pode nomeá-lo; em branco = padrão).
    - **Assinatura OpenAI Code (Codex) (Codex CLI)**: se `~/.codex/auth.json` existir, o onboarding pode reutilizá-lo.
    - **Assinatura OpenAI Code (Codex) (OAuth)**: fluxo pelo navegador; cole o `code#state`.
      - Define `agents.defaults.model` para `openai-codex/gpt-5.2` quando o modelo não está definido ou é `openai/*`.
    - **Chave de API OpenAI**: usa `OPENAI_API_KEY` se presente ou solicita uma chave, depois a armazena nos perfis de autenticação.
    - **Chave de API xAI (Grok)**: solicita `XAI_API_KEY` e configura o xAI como provedor de modelo.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`, obtenha em https://opencode.ai/auth) e permite escolher o catálogo Zen ou Go.
    - **Ollama**: solicita a URL base do Ollama, oferece modo **Cloud + Local** ou **Local**, descobre modelos disponíveis e baixa automaticamente o modelo local selecionado quando necessário.
    - Mais detalhes: [Ollama](/providers/ollama)
    - **Chave de API**: armazena a chave para você.
    - **Vercel AI Gateway (proxy multi-modelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Vercel AI Gateway](/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita Account ID, Gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
    - **MiniMax M2.5**: configuração é gravada automaticamente.
    - Mais detalhes: [MiniMax](/providers/minimax)
    - **Synthetic (compatível com Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Mais detalhes: [Synthetic](/providers/synthetic)
    - **Moonshot (Kimi K2)**: configuração é gravada automaticamente.
    - **Kimi Coding**: configuração é gravada automaticamente.
    - Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
    - **Pular**: nenhuma autenticação configurada ainda.
    - Escolha um modelo padrão entre as opções detectadas (ou insira provedor/modelo manualmente). Para melhor qualidade e menor risco de injeção de prompt, escolha o modelo mais forte de última geração disponível na sua pilha de provedores.
    - O onboarding executa uma verificação de modelo e avisa se o modelo configurado for desconhecido ou sem autenticação.
    - O modo de armazenamento de chave de API padrão é valores de perfil de autenticação em texto simples. Use `--secret-input-mode ref` para armazenar referências baseadas em variáveis de ambiente (por exemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Credenciais OAuth ficam em `~/.opencraft/credentials/oauth.json`; perfis de autenticação ficam em `~/.opencraft/agents/<agentId>/agent/auth-profiles.json` (chaves de API + OAuth).
    - Mais detalhes: [/concepts/oauth](/concepts/oauth)
    <Note>
    Dica para servidores headless: complete o OAuth em uma máquina com navegador, depois copie
    `~/.opencraft/credentials/oauth.json` (ou `$OPENCRAFT_STATE_DIR/credentials/oauth.json`) para o
    host do Gateway.
    </Note>
  </Step>
  <Step title="Workspace">
    - Padrão `~/.opencraft/workspace` (configurável).
    - Semeia os arquivos de workspace necessários para o ritual de bootstrap do agente.
    - Layout completo do workspace + guia de backup: [Workspace do agente](/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Porta, bind, modo de autenticação, exposição via Tailscale.
    - Recomendação de autenticação: mantenha **Token** mesmo para loopback para que clientes WebSocket locais precisem se autenticar.
    - No modo Token, a configuração interativa oferece:
      - **Gerar/armazenar Token em texto simples** (padrão)
      - **Usar SecretRef** (opt-in)
      - O quickstart reutiliza SecretRefs existentes de `gateway.auth.token` entre provedores `env`, `file` e `exec` para bootstrap de probe/dashboard do onboarding.
      - Se o SecretRef estiver configurado mas não puder ser resolvido, o onboarding falha cedo com uma mensagem clara de correção em vez de degradar silenciosamente a autenticação em tempo de execução.
    - No modo senha, a configuração interativa também suporta armazenamento em texto simples ou SecretRef.
    - Caminho SecretRef de Token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
      - Requer uma variável de ambiente não vazia no ambiente do processo de onboarding.
      - Não pode ser combinado com `--gateway-token`.
    - Desabilite a autenticação apenas se você confia totalmente em todos os processos locais.
    - Binds não-loopback ainda requerem autenticação.
  </Step>
  <Step title="Canais">
    - [WhatsApp](/channels/whatsapp): login por QR opcional.
    - [Telegram](/channels/telegram): Bot Token.
    - [Discord](/channels/discord): Bot Token.
    - [Google Chat](/channels/googlechat): JSON de conta de serviço + audiência do Webhook.
    - [Mattermost](/channels/mattermost) (Plugin): Bot Token + URL base.
    - [Signal](/channels/signal): instalação opcional do `signal-cli` + configuração de conta.
    - [BlueBubbles](/channels/bluebubbles): **recomendado para iMessage**; URL do servidor + senha + Webhook.
    - [iMessage](/channels/imessage): caminho legado do CLI `imsg` + acesso ao banco de dados.
    - Segurança de DM: o padrão é pareamento. A primeira DM envia um código; aprove via `opencraft pairing approve <channel> <code>` ou use listas de permissão.
  </Step>
  <Step title="Busca na web">
    - Escolha um provedor: Perplexity, Brave, Gemini, Grok ou Kimi (ou pule).
    - Cole sua chave de API (QuickStart detecta automaticamente chaves de variáveis de ambiente ou configuração existente).
    - Pule com `--skip-search`.
    - Configure depois: `opencraft configure --section web`.
  </Step>
  <Step title="Instalação do daemon">
    - macOS: LaunchAgent
      - Requer uma sessão de usuário logado; para headless, use um LaunchDaemon personalizado (não incluído).
    - Linux (e Windows via WSL2): unidade systemd de usuário
      - O onboarding tenta habilitar o lingering via `loginctl enable-linger <user>` para que o Gateway continue ativo após o logout.
      - Pode solicitar sudo (grava em `/var/lib/systemd/linger`); tenta sem sudo primeiro.
    - **Seleção de runtime:** Node (recomendado; necessário para WhatsApp/Telegram). Bun **não é recomendado**.
    - Se a autenticação por Token requer um Token e `gateway.auth.token` é gerenciado por SecretRef, a instalação do daemon o valida mas não persiste valores de Token em texto simples resolvidos nos metadados do ambiente do serviço supervisor.
    - Se a autenticação por Token requer um Token e o SecretRef de Token configurado não foi resolvido, a instalação do daemon é bloqueada com orientação prática.
    - Se tanto `gateway.auth.token` quanto `gateway.auth.password` estão configurados e `gateway.auth.mode` não está definido, a instalação do daemon é bloqueada até que o modo seja definido explicitamente.
  </Step>
  <Step title="Verificação de saúde">
    - Inicia o Gateway (se necessário) e executa `opencraft health`.
    - Dica: `opencraft status --deep` adiciona probes de saúde do Gateway à saída de status (requer um Gateway acessível).
  </Step>
  <Step title="Skills (recomendado)">
    - Lê as Skills disponíveis e verifica requisitos.
    - Permite escolher um gerenciador de pacotes: **npm / pnpm** (bun não é recomendado).
    - Instala dependências opcionais (algumas usam Homebrew no macOS).
  </Step>
  <Step title="Finalizar">
    - Resumo + próximos passos, incluindo apps iOS/Android/macOS para recursos extras.
  </Step>
</Steps>

<Note>
Se nenhuma interface gráfica for detectada, o onboarding imprime instruções de port-forward SSH para a Control UI em vez de abrir um navegador.
Se os assets da Control UI estiverem ausentes, o onboarding tenta compilá-los; fallback é `pnpm ui:build` (instala dependências da UI automaticamente).
</Note>

## Modo não interativo

Use `--non-interactive` para automatizar ou scriptizar o onboarding:

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

SecretRef de Token do Gateway em modo não interativo:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
opencraft onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` e `--gateway-token-ref-env` são mutuamente exclusivos.

<Note>
`--json` **não** implica modo não interativo. Use `--non-interactive` (e `--workspace`) para scripts.
</Note>

Exemplos de comandos específicos por provedor estão em [Automação CLI](/start/wizard-cli-automation#provider-specific-examples).
Use esta página de referência para semântica das flags e ordem das etapas.

### Adicionar agente (não interativo)

```bash
opencraft agents add work \
  --workspace ~/.opencraft/workspace-work \
  --model openai/gpt-5.2 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC do wizard do Gateway

O Gateway expõe o fluxo de onboarding via RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Clientes (app macOS, Control UI) podem renderizar etapas sem reimplementar a lógica de onboarding.

## Configuração do Signal (signal-cli)

O onboarding pode instalar o `signal-cli` a partir de releases do GitHub:

- Baixa o asset de release apropriado.
- Armazena-o em `~/.opencraft/tools/signal-cli/<version>/`.
- Grava `channels.signal.cliPath` na sua configuração.

Notas:

- Builds JVM requerem **Java 21**.
- Builds nativos são usados quando disponíveis.
- Windows usa WSL2; a instalação do signal-cli segue o fluxo Linux dentro do WSL.

## O que o wizard grava

Campos típicos em `~/.editzffaleta/OpenCraft.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se MiniMax for escolhido)
- `tools.profile` (o onboarding local padrão é `"coding"` quando não definido; valores explícitos existentes são preservados)
- `gateway.*` (modo, bind, autenticação, Tailscale)
- `session.dmScope` (detalhes de comportamento: [Referência de Configuração CLI](/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.signal.*`, `channels.imessage.*`
- Listas de permissão de canais (Slack/Discord/Matrix/Microsoft Teams) quando você opta durante os prompts (nomes são resolvidos para IDs quando possível).
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`opencraft agents add` grava `agents.list[]` e `bindings` opcionais.

Credenciais do WhatsApp ficam em `~/.opencraft/credentials/whatsapp/<accountId>/`.
Sessões são armazenadas em `~/.opencraft/agents/<agentId>/sessions/`.

Alguns canais são entregues como Plugins. Quando você escolhe um durante a configuração, o onboarding
solicitará a instalação (npm ou caminho local) antes que possa ser configurado.

## Documentação relacionada

- Visão geral do onboarding: [Onboarding (CLI)](/start/wizard)
- Onboarding do app macOS: [Onboarding](/start/onboarding)
- Referência de configuração: [Configuração do Gateway](/gateway/configuration)
- Provedores: [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord), [Google Chat](/channels/googlechat), [Signal](/channels/signal), [BlueBubbles](/channels/bluebubbles) (iMessage), [iMessage](/channels/imessage) (legado)
- Skills: [Skills](/tools/skills), [Configuração de Skills](/tools/skills-config)
