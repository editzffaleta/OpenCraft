---
summary: "Onboarding de CLI: configuração guiada para gateway, espaço de trabalho, canais e skills"
read_when:
  - Running or configuring CLI onboarding
  - Setting up a new machine
title: "Onboarding (CLI)"
sidebarTitle: "Onboarding: CLI"
---

# Onboarding (CLI)

O onboarding de CLI é a forma **recomendada** de configurar o OpenCraft no macOS,
Linux ou Windows (via WSL2; fortemente recomendado).
Configura um Gateway local ou uma conexão remota do Gateway, além de canais, skills
e padrões de espaço de trabalho em um fluxo guiado.

```bash
opencraft onboard
```

<Info>
Chat de primeira vez mais rápido: abra a Control UI (sem configuração de canal necessária). Execute
`opencraft dashboard` e converse no navegador. Docs: [Dashboard](/web/dashboard).
</Info>

Para reconfigurar depois:

```bash
opencraft configure
opencraft agents add <name>
```

<Note>
`--json` não implica modo não interativo. Para scripts, use `--non-interactive`.
</Note>

<Tip>
O onboarding de CLI inclui uma etapa de busca da web onde você pode escolher um provedor
(Perplexity, Brave, Gemini, Grok ou Kimi) e colar sua chave de API para que o agente
possa usar `web_search`. Você também pode configurar isso depois com
`opencraft configure --section web`. Docs: [Web tools](/tools/web).
</Tip>

## QuickStart vs Avançado

O onboarding começa com **QuickStart** (padrões) vs **Avançado** (controle total).

<Tabs>
  <Tab title="QuickStart (padrões)">
    - Gateway local (loopback)
    - Espaço de trabalho padrão (ou espaço de trabalho existente)
    - Porta do Gateway **18789**
    - Autenticação do Gateway **Token** (gerado automaticamente, até mesmo no loopback)
    - Política de ferramentas padrão para novas configurações locais: `tools.profile: "coding"` (perfil explícito existente é preservado)
    - Isolamento de DM padrão: onboarding local escreve `session.dmScope: "per-channel-peer"` quando não definido. Detalhes: [Referência de Configuração CLI](/start/wizard-cli-reference#outputs-and-internals)
    - Exposição ao Tailscale **Desligada**
    - DMs do Telegram + WhatsApp padrão para **allowlist** (você será solicitado com seu número de telefone)
  </Tab>
  <Tab title="Avançado (controle total)">
    - Expõe cada passo (modo, espaço de trabalho, gateway, canais, daemon, skills).
  </Tab>
</Tabs>

## O que o onboarding configura

**Modo local (padrão)** percorre estes passos:

1. **Modelo/Autenticação** — escolha qualquer provedor/fluxo de autenticação suportado (chave de API, OAuth ou token de configuração), incluindo Provedor Personalizado
   (compatível com OpenAI, compatível com Anthropic ou detecção automática desconhecida). Escolha um modelo padrão.
   Nota de segurança: se este agente executará ferramentas ou processará conteúdo webhook/hooks, prefira o modelo de geração mais recente mais poderoso disponível e mantenha a política de ferramentas rigorosa. Níveis mais fracos/antigos são mais fáceis de prompt-inject.
   Para execuções não interativas, `--secret-input-mode ref` armazena refs apoiados por env em perfis de autenticação em vez de valores de chave de API em texto simples.
   No modo `ref` não interativo, a variável de ambiente do provedor deve ser definida; passar flags de chave inline sem essa variável de ambiente falha rapidamente.
   Nas execuções interativas, escolher modo de referência secreta permite apontar para uma variável de ambiente ou uma ref de provedor configurado (`file` ou `exec`), com validação rápida de pré-vôo antes de salvar.
2. **Espaço de trabalho** — Local para arquivos de agente (padrão `~/.opencraft/workspace`). Seeds arquivos de bootstrap.
3. **Gateway** — Porta, endereço de ligação, modo de autenticação, exposição do Tailscale.
   No modo token interativo, escolha armazenamento de token padrão em texto simples ou opte por SecretRef.
   Caminho de SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canais** — WhatsApp, Telegram, Discord, Google Chat, Mattermost, Signal, BlueBubbles ou iMessage.
5. **Daemon** — Instala um LaunchAgent (macOS) ou unidade de usuário systemd (Linux/WSL2).
   Se a autenticação de token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação do daemon valida, mas não persiste o token resolvido nos metadados do ambiente do serviço supervisor.
   Se a autenticação de token exigir um token e o SecretRef de token configurado não for resolvido, a instalação do daemon será bloqueada com orientação acionável.
   Se ambos `gateway.auth.token` e `gateway.auth.password` forem configurados e `gateway.auth.mode` não for definido, a instalação do daemon será bloqueada até que o modo seja definido explicitamente.
6. **Verificação de saúde** — Inicia o Gateway e verifica se está em execução.
7. **Skills** — Instala skills recomendadas e dependências opcionais.

<Note>
Re-executar o onboarding **não** limpa nada a menos que você escolha explicitamente **Reset** (ou passe `--reset`).
CLI `--reset` padrão para configuração, credenciais e sessões; use `--reset-scope full` para incluir espaço de trabalho.
Se a configuração for inválida ou contiver chaves legadas, o onboarding pede que você execute `opencraft doctor` primeiro.
</Note>

**Modo remoto** apenas configura o cliente local para se conectar a um Gateway em outro lugar.
**Não** instala ou altera nada no host remoto.

## Adicione outro agente

Use `opencraft agents add <name>` para criar um agente separado com seu próprio espaço de trabalho,
sessões e perfis de autenticação. Executar sem `--workspace` inicia o onboarding.

O que define:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notas:

- Os espaços de trabalho padrão seguem `~/.opencraft/workspace-<agentId>`.
- Adicione `bindings` para rotear mensagens de entrada (o onboarding pode fazer isso).
- Flags não interativas: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referência completa

Para análises detalhadas passo a passo e saídas de configuração, veja
[Referência de Configuração CLI](/start/wizard-cli-reference).
Para exemplos não interativos, veja [Automação CLI](/start/wizard-cli-automation).
Para a referência técnica mais profunda, incluindo detalhes RPC, veja
[Referência de Onboarding](/reference/wizard).

## Documentos relacionados

- Referência de comando CLI: [`opencraft onboard`](/cli/onboard)
- Visão geral do onboarding: [Visão geral do Onboarding](/start/onboarding-overview)
- Onboarding do app macOS: [Onboarding](/start/onboarding)
- Ritual de primeira execução do agente: [Bootstrapping de Agente](/start/bootstrapping)
