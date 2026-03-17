---
summary: "Comando Doctor: verificações de saúde, migrações de config e etapas de reparo"
read_when:
  - Adicionando ou modificando migrações do doctor
  - Introduzindo mudanças de config que quebram compatibilidade
title: "Doctor"
---

# Doctor

`opencraft doctor` é a ferramenta de reparo + migração do OpenCraft. Ele corrige config/estado obsoletos, verifica saúde e fornece etapas de reparo acionáveis.

## Início rápido

```bash
opencraft doctor
```

### Headless / automação

```bash
opencraft doctor --yes
```

Aceitar padrões sem solicitar (incluindo etapas de restart/serviço/sandbox quando aplicável).

```bash
opencraft doctor --repair
```

Aplicar reparos recomendados sem solicitar (reparos + restarts quando seguro).

```bash
opencraft doctor --repair --force
```

Aplicar reparos agressivos também (sobrescreve configs de supervisor customizadas).

```bash
opencraft doctor --non-interactive
```

Executar sem prompts e aplicar apenas migrações seguras (normalização de config + movimentações de estado em disco). Pula ações de restart/serviço/sandbox que requerem confirmação humana.
Migrações de estado legado executam automaticamente quando detectadas.

```bash
opencraft doctor --deep
```

Escanear serviços do sistema em busca de instalações extras de gateway (launchd/systemd/schtasks).

Se você quiser revisar mudanças antes de escrever, abra o arquivo de config primeiro:

```bash
cat ~/.editzffaleta/OpenCraft.json
```

## O que ele faz (resumo)

- Atualização pré-voo opcional para instalações git (apenas interativo).
- Verificação de frescor do protocolo UI (reconstrói Control UI quando o schema de protocolo é mais novo).
- Verificação de saúde + prompt de restart.
- Resumo de status de Skills (elegíveis/faltando/bloqueados).
- Normalização de config para valores legados.
- Verificações de migração de browser para configs legadas de extensão Chrome e prontidão Chrome MCP.
- Avisos de override de provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Migração de estado legado em disco (sessões/diretório de agente/auth WhatsApp).
- Migração de cron store legado (`jobId`, `schedule.cron`, campos de delivery/payload de nível superior, payload `provider`, jobs de fallback webhook simples `notify: true`).
- Verificações de integridade de estado e permissões (sessões, transcrições, diretório de estado).
- Verificações de permissão de arquivo de config (chmod 600) ao executar localmente.
- Saúde de auth de modelo: verifica expiração de OAuth, pode atualizar tokens expirando e reporta estados de cooldown/desabilitado de auth-profile.
- Detecção de diretório de workspace extra (`~/opencraft`).
- Reparo de imagem sandbox quando sandboxing está habilitado.
- Migração de serviço legado e detecção de gateway extra.
- Verificações de runtime do Gateway (serviço instalado mas não executando; label launchd em cache).
- Avisos de status de canal (sondados do gateway em execução).
- Auditoria de config de supervisor (launchd/systemd/schtasks) com reparo opcional.
- Verificações de boas práticas de runtime do Gateway (Node vs Bun, caminhos de version-manager).
- Diagnósticos de colisão de porta do Gateway (padrão `18789`).
- Avisos de segurança para políticas de DM abertas.
- Verificações de auth do Gateway para modo de token local (oferece geração de token quando nenhuma fonte de token existe; não sobrescreve configs de token SecretRef).
- Verificação de linger do systemd no Linux.
- Verificações de instalação via source (mismatch de workspace pnpm, assets UI faltando, binário tsx faltando).
- Escreve config atualizado + metadados do wizard.

## Comportamento detalhado e justificativa

### 0) Atualização opcional (instalações git)

Se for um checkout git e o doctor está executando interativamente, ele oferece atualizar (fetch/rebase/build) antes de executar o doctor.

### 1) Normalização de config

Se a config contém formas de valores legados (por exemplo `messages.ackReaction` sem override específico de canal), o doctor os normaliza para o schema atual.

### 2) Migrações de chaves de config legadas

Quando a config contém chaves descontinuadas, outros comandos recusam executar e pedem que você execute `opencraft doctor`.

O Doctor irá:

- Explicar quais chaves legadas foram encontradas.
- Mostrar a migração que aplicou.
- Reescrever `~/.editzffaleta/OpenCraft.json` com o schema atualizado.

O Gateway também auto-executa migrações do doctor na inicialização quando detecta um formato de config legado, para que configs obsoletas sejam reparadas sem intervenção manual.

Migrações atuais:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` de nível superior
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Para canais com `accounts` nomeadas mas sem `accounts.default`, mover valores de canal de conta única de nível superior com escopo de conta para `channels.<channel>.accounts.default` quando presentes
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- remover `browser.relayBindHost` (configuração legada de relay de extensão)

Avisos do doctor também incluem orientação de account-default para canais multi-conta:

- Se duas ou mais entradas `channels.<channel>.accounts` estão configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
- Se `channels.<channel>.defaultAccount` está definido para um ID de conta desconhecido, o doctor avisa e lista IDs de conta configurados.

### 2b) Overrides de provider OpenCode

Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go` manualmente, isso sobrescreve o catálogo built-in do OpenCode de `@mariozechner/pi-ai`. Isso pode forçar modelos no API errado ou zerar custos. O doctor avisa para que você possa remover o override e restaurar o roteamento de API por modelo + custos.

### 2c) Migração de browser e prontidão Chrome MCP

Se sua config de browser ainda aponta para o caminho removido da extensão Chrome, o doctor normaliza para o modelo atual de attach Chrome MCP host-local:

- `browser.profiles.*.driver: "extension"` se torna `"existing-session"`
- `browser.relayBindHost` é removido

O doctor também audita o caminho Chrome MCP host-local quando você usa `defaultProfile: "user"` ou um perfil configurado `existing-session`:

- verifica se o Google Chrome está instalado no mesmo host para perfis de auto-conexão padrão
- verifica a versão detectada do Chrome e avisa quando está abaixo do Chrome 144
- lembra você de habilitar remote debugging na página de inspeção do browser (por exemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

O doctor não pode habilitar a configuração do lado do Chrome para você. Chrome MCP host-local ainda requer:

- um browser baseado em Chromium 144+ no host do gateway/node
- o browser executando localmente
- remote debugging habilitado naquele browser
- aprovar o primeiro prompt de consentimento de attach no browser

Esta verificação **não** se aplica a Docker, sandbox, remote-browser ou outros fluxos headless. Esses continuam usando CDP bruto.

### 3) Migrações de estado legado (layout em disco)

O doctor pode migrar layouts em disco mais antigos para a estrutura atual:

- Store de sessões + transcrições:
  - de `~/.opencraft/sessions/` para `~/.opencraft/agents/<agentId>/sessions/`
- Diretório de agente:
  - de `~/.opencraft/agent/` para `~/.opencraft/agents/<agentId>/agent/`
- Estado de auth WhatsApp (Baileys):
  - de `~/.opencraft/credentials/*.json` legado (exceto `oauth.json`)
  - para `~/.opencraft/credentials/whatsapp/<accountId>/...` (id de conta padrão: `default`)

Essas migrações são best-effort e idempotentes; o doctor emitirá avisos quando deixar quaisquer pastas legadas como backups. O Gateway/CLI também auto-migra as sessões legadas + diretório de agente na inicialização para que histórico/auth/modelos cheguem ao caminho por agente sem uma execução manual do doctor. Auth do WhatsApp é intencionalmente migrada apenas via `opencraft doctor`.

### 3b) Migrações de cron store legado

O doctor também verifica o cron job store (`~/.opencraft/cron/jobs.json` por padrão, ou `cron.store` quando sobrescrito) para formas de job antigas que o scheduler ainda aceita por compatibilidade.

Limpezas de cron atuais incluem:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
- campos de delivery de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliases de delivery `provider` do payload → `delivery.channel` explícito
- jobs de fallback webhook legados simples `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

O doctor só auto-migra jobs `notify: true` quando pode fazê-lo sem mudar comportamento. Se um job combina fallback de notify legado com um modo de delivery não-webhook existente, o doctor avisa e deixa esse job para revisão manual.

### 4) Verificações de integridade de estado (persistência de sessão, roteamento e segurança)

O diretório de estado é o tronco cerebral operacional. Se ele desaparecer, você perde sessões, credenciais, logs e config (a menos que tenha backups em outro lugar).

O doctor verifica:

- **Diretório de estado faltando**: avisa sobre perda catastrófica de estado, solicita recriar o diretório e lembra que não pode recuperar dados faltando.
- **Permissões do diretório de estado**: verifica escrita; oferece reparar permissões (e emite uma dica de `chown` quando mismatch de proprietário/grupo é detectado).
- **Diretório de estado macOS sincronizado com nuvem**: avisa quando o estado resolve sob iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...` porque caminhos com backup de sincronização podem causar I/O mais lento e corridas de lock/sync.
- **Diretório de estado Linux em SD ou eMMC**: avisa quando o estado resolve para uma fonte de montagem `mmcblk*`, porque I/O aleatório com backup de SD ou eMMC pode ser mais lento e desgastar mais rápido sob escritas de sessão e credencial.
- **Diretórios de sessão faltando**: `sessions/` e o diretório do session store são necessários para persistir histórico e evitar crashes `ENOENT`.
- **Mismatch de transcrição**: avisa quando entradas de sessão recentes têm arquivos de transcrição faltando.
- **"JSONL de 1 linha" da sessão principal**: sinaliza quando a transcrição principal tem apenas uma linha (histórico não está acumulando).
- **Múltiplos diretórios de estado**: avisa quando múltiplas pastas `~/.opencraft` existem em diretórios home ou quando `OPENCRAFT_STATE_DIR` aponta para outro lugar (histórico pode se dividir entre instalações).
- **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra de executá-lo no host remoto (o estado está lá).
- **Permissões de arquivo de config**: avisa se `~/.editzffaleta/OpenCraft.json` é legível por grupo/mundo e oferece restringir para `600`.

### 5) Saúde de auth de modelo (expiração OAuth)

O doctor inspeciona perfis OAuth no auth store, avisa quando tokens estão expirando/expirados e pode atualizá-los quando seguro. Se o perfil Anthropic Claude Code está obsoleto, ele sugere executar `claude setup-token` (ou colar um setup-token). Prompts de refresh aparecem apenas quando executando interativamente (TTY); `--non-interactive` pula tentativas de refresh.

O doctor também reporta perfis de auth que estão temporariamente inutilizáveis devido a:

- cooldowns curtos (rate limits/timeouts/falhas de auth)
- desabilitações mais longas (falhas de billing/crédito)

### 6) Validação de modelo de hooks

Se `hooks.gmail.model` está definido, o doctor valida a referência de modelo contra o catálogo e allowlist e avisa quando não vai resolver ou é bloqueado.

### 7) Reparo de imagem sandbox

Quando sandboxing está habilitado, o doctor verifica imagens Docker e oferece construir ou trocar para nomes legados se a imagem atual está faltando.

### 8) Migrações de serviço do Gateway e dicas de limpeza

O doctor detecta serviços legados do gateway (launchd/systemd/schtasks) e oferece removê-los e instalar o serviço OpenCraft usando a porta atual do gateway. Ele também pode escanear serviços extras semelhantes a gateway e imprimir dicas de limpeza. Serviços de gateway OpenCraft nomeados por perfil são considerados de primeira classe e não são sinalizados como "extras."

### 9) Avisos de segurança

O doctor emite avisos quando um provider está aberto a DMs sem uma allowlist, ou quando uma política está configurada de forma perigosa.

### 10) linger do systemd (Linux)

Se executando como serviço de usuário systemd, o doctor garante que lingering está habilitado para que o gateway permaneça ativo após logout.

### 11) Status de Skills

O doctor imprime um resumo rápido de skills elegíveis/faltando/bloqueados para o workspace atual.

### 12) Verificações de auth do Gateway (token local)

O doctor verifica a prontidão de auth de token local do gateway.

- Se o modo de token precisa de um token e nenhuma fonte de token existe, o doctor oferece gerar um.
- Se `gateway.auth.token` é gerenciado por SecretRef mas indisponível, o doctor avisa e não o sobrescreve com texto puro.
- `opencraft doctor --generate-gateway-token` força geração apenas quando nenhum token SecretRef está configurado.

### 12b) Reparos SecretRef-aware somente leitura

Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento fail-fast de runtime.

- `opencraft doctor --fix` agora usa o mesmo modelo de resumo SecretRef somente leitura que comandos da família status para reparos de config direcionados.
- Exemplo: reparo de `allowFrom` / `groupAllowFrom` do Telegram com `@username` tenta usar credenciais de bot configuradas quando disponíveis.
- Se o token do bot Telegram está configurado via SecretRef mas indisponível no caminho de comando atual, o doctor reporta que a credencial está configurada-mas-indisponível e pula auto-resolução em vez de crashar ou reportar incorretamente o token como faltando.

### 13) Verificação de saúde do Gateway + restart

O doctor executa uma verificação de saúde e oferece reiniciar o gateway quando ele parece não saudável.

### 14) Avisos de status de canal

Se o gateway está saudável, o doctor executa uma sonda de status de canal e reporta avisos com correções sugeridas.

### 15) Auditoria de config de supervisor + reparo

O doctor verifica a config de supervisor instalada (launchd/systemd/schtasks) para padrões faltando ou desatualizados (ex. dependências de network-online do systemd e delay de restart). Quando encontra um mismatch, ele recomenda uma atualização e pode reescrever o arquivo de serviço/tarefa para os padrões atuais.

Notas:

- `opencraft doctor` solicita antes de reescrever config de supervisor.
- `opencraft doctor --yes` aceita os prompts de reparo padrão.
- `opencraft doctor --repair` aplica correções recomendadas sem prompts.
- `opencraft doctor --repair --force` sobrescreve configs de supervisor customizadas.
- Se auth de token requer um token e `gateway.auth.token` é gerenciado por SecretRef, o fluxo de install/reparo do serviço do doctor valida o SecretRef mas não persiste valores de token em texto puro resolvidos nos metadados de ambiente do serviço supervisor.
- Se auth de token requer um token e o SecretRef de token configurado não está resolvido, o doctor bloqueia o caminho de install/reparo com orientação acionável.
- Se tanto `gateway.auth.token` quanto `gateway.auth.password` estão configurados e `gateway.auth.mode` não está definido, o doctor bloqueia install/reparo até que o modo seja definido explicitamente.
- Para units de usuário-systemd Linux, verificações de drift de token do doctor agora incluem tanto fontes `Environment=` quanto `EnvironmentFile=` ao comparar metadados de auth do serviço.
- Você sempre pode forçar uma reescrita completa via `opencraft gateway install --force`.

### 16) Diagnósticos de runtime + porta do Gateway

O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o serviço está instalado mas na verdade não está executando. Ele também verifica colisões de porta na porta do gateway (padrão `18789`) e reporta causas prováveis (gateway já executando, SSH tunnel).

### 17) Boas práticas de runtime do Gateway

O doctor avisa quando o serviço do gateway executa em Bun ou um caminho Node de version-manager (`nvm`, `fnm`, `volta`, `asdf`, etc.). Canais WhatsApp + Telegram requerem Node, e caminhos de version-manager podem quebrar após upgrades porque o serviço não carrega seu shell init. O doctor oferece migrar para uma instalação Node do sistema quando disponível (Homebrew/apt/choco).

### 18) Escrita de config + metadados do wizard

O doctor persiste quaisquer mudanças de config e carimba metadados do wizard para registrar a execução do doctor.

### 19) Dicas de workspace (backup + sistema de memória)

O doctor sugere um sistema de memória do workspace quando faltando e imprime uma dica de backup se o workspace ainda não está sob git.

Veja [/concepts/agent-workspace](/concepts/agent-workspace) para um guia completo de estrutura de workspace e backup git (recomendado GitHub ou GitLab privado).
