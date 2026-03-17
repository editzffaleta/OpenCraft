---
summary: "Configuração avançada e fluxos de trabalho de desenvolvimento para o OpenCraft"
read_when:
  - Configurando uma nova máquina
  - Você quer o "mais recente e melhor" sem quebrar sua configuração pessoal
title: "Configuração"
---

# Configuração

<Note>
Se você está configurando pela primeira vez, comece com [Começando](/start/getting-started).
Para detalhes de onboarding, veja [Onboarding (CLI)](/start/wizard).
</Note>

Última atualização: 2026-01-01

## Resumo

- **Personalização fica fora do repositório:** `~/.opencraft/workspace` (espaço de trabalho) + `~/.editzffaleta/OpenCraft.json` (configuração).
- **Fluxo estável:** instale o app macOS; deixe ele executar o Gateway embutido.
- **Fluxo bleeding edge:** execute o Gateway você mesmo via `pnpm gateway:watch`, depois deixe o app macOS conectar no modo Local.

## Pré-requisitos (do código-fonte)

- Node `>=22`
- `pnpm`
- Docker (opcional; apenas para configuração containerizada/e2e — veja [Docker](/install/docker))

## Estratégia de personalização (para que atualizações não causem problemas)

Se você quer "100% personalizado para mim" _e_ atualizações fáceis, mantenha sua personalização em:

- **Configuração:** `~/.editzffaleta/OpenCraft.json` (JSON/JSON5-ish)
- **Espaço de trabalho:** `~/.opencraft/workspace` (skills, prompts, memórias; faça um repositório git privado)

Configure uma vez:

```bash
opencraft setup
```

De dentro deste repositório, use a entrada CLI local:

```bash
opencraft setup
```

Se você ainda não tem uma instalação global, execute via `pnpm opencraft setup`.

## Execute o Gateway deste repositório

Após `pnpm build`, você pode executar o CLI empacotado diretamente:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Fluxo estável (app macOS primeiro)

1. Instale + abra **OpenCraft.app** (barra de menu).
2. Complete o checklist de onboarding/permissões (prompts TCC).
3. Garanta que o Gateway está em **Local** e executando (o app gerencia).
4. Vincule superfícies (exemplo: WhatsApp):

```bash
opencraft channels login
```

5. Verificação de sanidade:

```bash
opencraft health
```

Se o onboarding não estiver disponível na sua build:

- Execute `opencraft setup`, depois `opencraft channels login`, depois inicie o Gateway manualmente (`opencraft gateway`).

## Fluxo bleeding edge (Gateway no terminal)

Objetivo: trabalhar no Gateway TypeScript, ter hot reload, manter a UI do app macOS conectada.

### 0) (Opcional) Execute o app macOS do código-fonte também

Se você também quer o app macOS no bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Inicie o Gateway de desenvolvimento

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` executa o gateway em modo watch e recarrega em mudanças relevantes de código-fonte,
configuração e metadados de plugins embutidos.

### 2) Aponte o app macOS para seu Gateway em execução

No **OpenCraft.app**:

- Modo de Conexão: **Local**
  O app se conectará ao gateway em execução na porta configurada.

### 3) Verifique

- O status do Gateway no app deve ler **"Usando gateway existente …"**
- Ou via CLI:

```bash
opencraft health
```

### Armadilhas comuns

- **Porta errada:** Gateway WS padrão é `ws://127.0.0.1:18789`; mantenha app + CLI na mesma porta.
- **Onde o estado fica:**
  - Credenciais: `~/.opencraft/credentials/`
  - Sessões: `~/.opencraft/agents/<agentId>/sessions/`
  - Logs: `/tmp/opencraft/`

## Mapa de armazenamento de credenciais

Use isso ao depurar autenticação ou decidir o que fazer backup:

- **WhatsApp**: `~/.opencraft/credentials/whatsapp/<accountId>/creds.json`
- **Token do bot Telegram**: configuração/env ou `channels.telegram.tokenFile` (apenas arquivo regular; symlinks rejeitados)
- **Token do bot Discord**: configuração/env ou SecretRef (provedores env/file/exec)
- **Tokens do Slack**: configuração/env (`channels.slack.*`)
- **Allowlists de pareamento**:
  - `~/.opencraft/credentials/<channel>-allowFrom.json` (conta padrão)
  - `~/.opencraft/credentials/<channel>-<accountId>-allowFrom.json` (contas não-padrão)
- **Perfis de autenticação de modelo**: `~/.opencraft/agents/<agentId>/agent/auth-profiles.json`
- **Payload de segredos baseado em arquivo (opcional)**: `~/.opencraft/secrets.json`
- **Importação legada de OAuth**: `~/.opencraft/credentials/oauth.json`
  Mais detalhes: [Segurança](/gateway/security#credential-storage-map).

## Atualizando (sem bagunçar sua configuração)

- Mantenha `~/.opencraft/workspace` e `~/.opencraft/` como "suas coisas"; não coloque prompts/configurações pessoais no repositório `opencraft`.
- Atualizando código-fonte: `git pull` + `pnpm install` (quando o lockfile mudar) + continue usando `pnpm gateway:watch`.

## Linux (serviço de usuário systemd)

Instalações Linux usam um serviço **de usuário** systemd. Por padrão, systemd para
serviços de usuário no logout/idle, o que mata o Gateway. O onboarding tenta habilitar
lingering para você (pode solicitar sudo). Se ainda estiver desligado, execute:

```bash
sudo loginctl enable-linger $USER
```

Para servidores sempre ligados ou multi-usuário, considere um serviço **do sistema** em vez de um
serviço de usuário (sem necessidade de lingering). Veja [Runbook do Gateway](/gateway) para notas sobre systemd.

## Documentos relacionados

- [Runbook do Gateway](/gateway) (flags, supervisão, portas)
- [Configuração do Gateway](/gateway/configuration) (esquema de configuração + exemplos)
- [Discord](/channels/discord) e [Telegram](/channels/telegram) (tags de resposta + configurações de replyToMode)
- [Configuração do assistente OpenCraft](/start/opencraft)
- [App macOS](/platforms/macos) (ciclo de vida do gateway)
