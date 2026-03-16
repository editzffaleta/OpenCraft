---
summary: "Configuração avançada e fluxos de desenvolvimento para o OpenCraft"
read_when:
  - Configurando uma nova máquina
  - Você quer o "mais recente e melhor" sem quebrar sua configuração pessoal
title: "Configuração"
---

# Configuração

<Note>
Se você está configurando pela primeira vez, comece em [Primeiros Passos](/start/getting-started).
Para detalhes do assistente, veja [Assistente de Onboarding](/start/wizard).
</Note>

Última atualização: 2026-01-01

## TL;DR

- **Personalização fica fora do repositório:** `~/.opencraft/workspace` (workspace) + `~/.opencraft/opencraft.json` (config).
- **Fluxo estável:** instale o app macOS; deixe-o executar o Gateway embutido.
- **Fluxo bleeding edge:** execute o Gateway você mesmo via `pnpm gateway:watch`, depois deixe o app macOS se conectar no modo Local.

## Pré-requisitos (a partir do código-fonte)

- Node `>=22`
- `pnpm`
- Docker (opcional; apenas para configuração em container/e2e — veja [Docker](/install/docker))

## Estratégia de personalização (para que atualizações não causem problemas)

Se você quer "100% personalizado para mim" _e_ atualizações fáceis, mantenha sua customização em:

- **Config:** `~/.opencraft/opencraft.json` (JSON/JSON5)
- **Workspace:** `~/.opencraft/workspace` (skills, prompts, memórias; transforme em um repositório git privado)

Bootstrap uma vez:

```bash
opencraft setup
```

De dentro deste repositório, use a entrada CLI local:

```bash
opencraft setup
```

Se você ainda não tem uma instalação global, execute via `pnpm opencraft setup`.

## Executar o Gateway a partir deste repositório

Após `pnpm build`, você pode executar o CLI empacotado diretamente:

```bash
node opencraft.mjs gateway --port 18789 --verbose
```

## Fluxo estável (app macOS primeiro)

1. Instale e abra o **OpenCraft.app** (barra de menu).
2. Complete o checklist de onboarding/permissões (prompts TCC).
3. Certifique-se de que o Gateway está em modo **Local** e em execução (o app gerencia isso).
4. Vincule canais (exemplo: WhatsApp):

```bash
opencraft channels login
```

5. Verificação de sanidade:

```bash
opencraft health
```

Se o onboarding não estiver disponível na sua build:

- Execute `opencraft setup`, depois `opencraft channels login`, depois inicie o Gateway manualmente (`opencraft gateway`).

## Fluxo bleeding edge (Gateway em terminal)

Objetivo: trabalhar no Gateway TypeScript, ter hot reload, manter a UI do app macOS conectada.

### 0) (Opcional) Execute o app macOS a partir do código-fonte também

Se você também quer o app macOS no bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Iniciar o Gateway de desenvolvimento

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` executa o gateway em modo watch e recarrega nas mudanças de TypeScript.

### 2) Apontar o app macOS para o Gateway em execução

No **OpenCraft.app**:

- Modo de Conexão: **Local**
  O app se conectará ao gateway em execução na porta configurada.

### 3) Verificar

- O status do Gateway no app deve exibir **"Using existing gateway …"**
- Ou via CLI:

```bash
opencraft health
```

### Armadilhas comuns

- **Porta errada:** o WS do Gateway padrão é `ws://127.0.0.1:18789`; mantenha app + CLI na mesma porta.
- **Onde o estado fica:**
  - Credenciais: `~/.opencraft/credentials/`
  - Sessões: `~/.opencraft/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Mapa de armazenamento de credenciais

Use isto ao depurar auth ou decidir o que fazer backup:

- **WhatsApp**: `~/.opencraft/credentials/whatsapp/<accountId>/creds.json`
- **Token do bot Telegram**: config/env ou `channels.telegram.tokenFile` (apenas arquivo regular; symlinks rejeitados)
- **Token do bot Discord**: config/env ou SecretRef (provedores env/file/exec)
- **Tokens Slack**: config/env (`channels.slack.*`)
- **Listas de permissão de pareamento**:
  - `~/.opencraft/credentials/<channel>-allowFrom.json` (conta padrão)
  - `~/.opencraft/credentials/<channel>-<accountId>-allowFrom.json` (contas não padrão)
- **Perfis de auth do modelo**: `~/.opencraft/agents/<agentId>/agent/auth-profiles.json`
- **Payload de segredos em arquivo (opcional)**: `~/.opencraft/secrets.json`
- **Importação OAuth legada**: `~/.opencraft/credentials/oauth.json`
  Mais detalhes: [Segurança](/gateway/security#credential-storage-map).

## Atualização (sem quebrar sua configuração)

- Mantenha `~/.opencraft/workspace` e `~/.opencraft/` como "seu conteúdo"; não coloque prompts/configurações pessoais no repositório `opencraft`.
- Atualizar o código-fonte: `git pull` + `pnpm install` (quando o lockfile mudar) + continue usando `pnpm gateway:watch`.

## Linux (serviço systemd de usuário)

Instalações Linux usam um serviço systemd de **usuário**. Por padrão, o systemd para
serviços de usuário no logout/idle, o que mata o Gateway. O onboarding tenta habilitar
lingering para você (pode pedir sudo). Se ainda estiver desativado, execute:

```bash
sudo loginctl enable-linger $USER
```

Para servidores sempre ativos ou multiusuário, considere um serviço do **sistema** em vez de
um serviço de usuário (sem necessidade de lingering). Veja o [Runbook do Gateway](/gateway) para as notas do systemd.

## Documentação relacionada

- [Runbook do Gateway](/gateway) (flags, supervisão, portas)
- [Configuração do gateway](/gateway/configuration) (schema de config + exemplos)
- [Discord](/channels/discord) e [Telegram](/channels/telegram) (tags de resposta + configurações replyToMode)
- [Configuração do assistente OpenCraft](/start/openclaw)
- [App macOS](/platforms/macos) (ciclo de vida do gateway)
