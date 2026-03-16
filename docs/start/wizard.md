---
summary: "Assistente de onboarding CLI: configuração guiada para gateway, workspace, canais e skills"
read_when:
  - Executando ou configurando o assistente de onboarding
  - Configurando uma nova máquina
title: "Assistente de Onboarding (CLI)"
sidebarTitle: "Onboarding: CLI"
---

# Assistente de Onboarding (CLI)

O assistente de onboarding é a forma **recomendada** de configurar o OpenCraft no macOS,
Linux ou Windows (via WSL2; fortemente recomendado).
Ele configura um Gateway local ou uma conexão de Gateway remoto, além de canais, skills
e padrões de workspace em um fluxo guiado.

```bash
opencraft onboard
```

<Info>
Chat mais rápido: abra a UI de controle (sem precisar configurar canais). Execute
`opencraft dashboard` e converse no navegador. Docs: [Dashboard](/web/dashboard).
</Info>

Para reconfigurar depois:

```bash
opencraft configure
opencraft agents add <nome>
```

<Note>
`--json` não implica modo não interativo. Para scripts, use `--non-interactive`.
</Note>

<Tip>
O assistente de onboarding inclui uma etapa de busca na web onde você pode escolher um provedor
(Perplexity, Brave, Gemini, Grok ou Kimi) e colar sua chave de API para que o agente
possa usar `web_search`. Você também pode configurar isso depois com
`opencraft configure --section web`. Docs: [Ferramentas web](/tools/web).
</Tip>

## Início Rápido vs Avançado

O assistente começa com **Início Rápido** (padrões) vs **Avançado** (controle total).

<Tabs>
  <Tab title="Início Rápido (padrões)">
    - Gateway local (loopback)
    - Workspace padrão (ou workspace existente)
    - Porta do gateway **18789**
    - Auth do gateway por **Token** (gerado automaticamente, mesmo no loopback)
    - Política de ferramentas padrão para novas configurações locais: `tools.profile: "coding"` (perfil explícito existente é preservado)
    - Padrão de isolamento de DM: o onboarding local grava `session.dmScope: "per-channel-peer"` quando não definido. Detalhes: [Referência CLI de Onboarding](/start/wizard-cli-reference#saídas-e-internos)
    - Exposição Tailscale **Desativada**
    - DMs do Telegram + WhatsApp padrão para **lista de permissão** (será solicitado seu número de telefone)
  </Tab>
  <Tab title="Avançado (controle total)">
    - Expõe cada etapa (modo, workspace, gateway, canais, daemon, skills).
  </Tab>
</Tabs>

## O que o assistente configura

**Modo local (padrão)** guia você pelas seguintes etapas:

1. **Modelo/Auth** — escolha qualquer provedor/fluxo de auth suportado (chave de API, OAuth ou setup-token), incluindo Provedor Personalizado
   (compatível com OpenAI, compatível com Anthropic ou Desconhecido com detecção automática). Escolha um modelo padrão.
   Nota de segurança: se este agente executará ferramentas ou processará conteúdo de webhook/hooks, prefira o modelo mais recente e mais forte disponível e mantenha a política de ferramentas estrita. Versões mais fracas/antigas são mais suscetíveis a injeção de prompt.
   Para execuções não interativas, `--secret-input-mode ref` armazena refs com backup em env nos perfis de auth em vez de valores de chave de API em texto simples.
   No modo `ref` não interativo, a variável de env do provedor deve estar definida; passar flags de chave inline sem essa variável de env falha rapidamente.
   Em execuções interativas, escolher o modo de referência de segredo permite apontar para uma variável de ambiente ou uma ref de provedor configurada (`file` ou `exec`), com validação rápida de preflight antes de salvar.
2. **Workspace** — Local para os arquivos do agente (padrão `~/.opencraft/workspace`). Cria arquivos de bootstrap.
3. **Gateway** — Porta, endereço de bind, modo de auth, exposição Tailscale.
   No modo de token interativo, escolha o armazenamento padrão de token em texto simples ou opte pelo SecretRef.
   Caminho de SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canais** — WhatsApp, Telegram, Discord, Google Chat, Mattermost, Signal, BlueBubbles ou iMessage.
5. **Daemon** — Instala um LaunchAgent (macOS) ou unidade de usuário systemd (Linux/WSL2).
   Se o auth por token requer um token e `gateway.auth.token` é gerenciado por SecretRef, a instalação do daemon o valida mas não persiste o token resolvido nos metadados de ambiente do serviço supervisor.
   Se o auth por token requer um token e o SecretRef de token configurado está não resolvido, a instalação do daemon é bloqueada com orientação acionável.
   Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon é bloqueada até que o modo seja definido explicitamente.
6. **Verificação de saúde** — Inicia o Gateway e verifica se está em execução.
7. **Skills** — Instala skills recomendadas e dependências opcionais.

<Note>
Reexecutar o assistente **não** apaga nada a menos que você escolha explicitamente **Resetar** (ou passe `--reset`).
O CLI `--reset` padrão é config, credenciais e sessões; use `--reset-scope full` para incluir o workspace.
Se a configuração for inválida ou contiver chaves legadas, o assistente pede para executar `opencraft doctor` primeiro.
</Note>

**Modo remoto** configura apenas o cliente local para se conectar a um Gateway em outro lugar.
**Não** instala nem altera nada no host remoto.

## Adicionar outro agente

Use `opencraft agents add <nome>` para criar um agente separado com seu próprio workspace,
sessões e perfis de auth. Executar sem `--workspace` lança o assistente.

O que define:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notas:

- Workspaces padrão seguem `~/.opencraft/workspace-<agentId>`.
- Adicione `bindings` para rotear mensagens de entrada (o assistente pode fazer isso).
- Flags não interativas: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referência completa

Para detalhamentos passo a passo e saídas de configuração, veja
[Referência CLI de Onboarding](/start/wizard-cli-reference).
Para exemplos não interativos, veja [Automação CLI](/start/wizard-cli-automation).
Para a referência técnica mais detalhada, incluindo detalhes de RPC, veja
[Referência do Assistente](/reference/wizard).

## Documentação relacionada

- Referência de comando CLI: [`opencraft onboard`](/cli/onboard)
- Visão geral do onboarding: [Visão Geral do Onboarding](/start/onboarding-overview)
- Onboarding pelo app macOS: [Onboarding](/start/onboarding)
- Ritual de primeira execução do agente: [Bootstrapping do Agente](/start/bootstrapping)
