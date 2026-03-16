---
summary: "Comando doctor: verificações de saúde, migrações de config e passos de reparo"
read_when:
  - Adicionando ou modificando migrações do doctor
  - Introduzindo mudanças quebrando de config
title: "Doctor"
---

# Doctor

`opencraft doctor` é a ferramenta de reparo + migração para o OpenCraft. Ele corrige
config/estado obsoletos, verifica saúde e fornece passos de reparo acionáveis.

## Início rápido

```bash
opencraft doctor
```

### Headless / automação

```bash
opencraft doctor --yes
```

Aceitar padrões sem solicitar (incluindo passos de reparo de restart/serviço/sandbox quando aplicável).

```bash
opencraft doctor --repair
```

Aplicar reparos recomendados sem solicitar (reparos + restarts onde seguro).

```bash
opencraft doctor --repair --force
```

Aplicar também reparos agressivos (sobrescreve configs personalizadas de supervisor).

```bash
opencraft doctor --non-interactive
```

Rodar sem prompts e aplicar apenas migrações seguras (normalização de config + movimentos de estado em disco). Pula ações de restart/serviço/sandbox que requerem confirmação humana.
Migrações de estado legado rodam automaticamente quando detectadas.

```bash
opencraft doctor --deep
```

Escanear serviços de sistema para installs extras do gateway (launchd/systemd/schtasks).

Se você quiser revisar mudanças antes de escrever, abra o arquivo de config primeiro:

```bash
cat ~/.opencraft/opencraft.json
```

## O que faz (resumo)

- Atualização opcional de preflight para installs git (apenas interativo).
- Verificação de atualização do protocolo de UI (reconstrói a UI de Controle quando o schema de protocolo é mais novo).
- Verificação de saúde + prompt de restart.
- Resumo de status de skills (elegíveis/ausentes/bloqueadas).
- Normalização de config para valores legados.
- Avisos de override de provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Migração legada de estado em disco (sessões/diretório de agente/auth WhatsApp).
- Migração legada do store de cron (`jobId`, `schedule.cron`, campos de entrega/payload de nível superior, `provider` de payload, jobs de fallback webhook simples `notify: true`).
- Verificações de integridade de estado e permissões (sessões, transcrições, diretório de estado).
- Verificações de permissão do arquivo de config (chmod 600) quando rodando localmente.
- Saúde de auth de modelo: verifica expiração de OAuth, pode atualizar tokens expirando e reporta estados de cooldown/desabilitados de perfil de auth.
- Detecção de diretório de workspace extra (`~/openclaw`).
- Reparo de imagem de sandbox quando sandboxing está habilitado.
- Migração de serviço legado e hints de limpeza de gateway extra.
- Verificações de runtime do Gateway (serviço instalado mas não rodando; label launchd em cache).
- Avisos de status de canal (probe do gateway em execução).
- Auditoria de config de supervisor (launchd/systemd/schtasks) com reparo opcional.
- Verificações de melhores práticas de runtime do Gateway (Node vs Bun, paths de version-manager).
- Diagnósticos de colisão de porta do Gateway (padrão `18789`).
- Avisos de segurança para políticas de DM abertas.
- Verificações de auth do Gateway para modo de token local (oferece geração de token quando não há fonte de token; não sobrescreve configs SecretRef de token).
- Verificação de linger systemd no Linux.
- Verificações de install de fonte (incompatibilidade de workspace pnpm, ativos de UI ausentes, binário tsx ausente).
- Escreve config atualizada + metadados do wizard.

## Comportamento detalhado e justificativa

### 0) Atualização opcional (installs git)

Se for um checkout git e o doctor estiver rodando interativamente, oferece
atualizar (fetch/rebase/build) antes de rodar o doctor.

### 1) Normalização de config

Se a config contiver shapes de valor legados (por exemplo `messages.ackReaction`
sem um override específico de canal), o doctor os normaliza para o schema atual.

### 2) Migrações de chave de config legada

Quando a config contém chaves depreciadas, outros comandos recusam rodar e pedem
que você rode `opencraft doctor`.

O Doctor irá:

- Explicar quais chaves legadas foram encontradas.
- Mostrar a migração aplicada.
- Reescrever `~/.opencraft/opencraft.json` com o schema atualizado.

O Gateway também auto-roda migrações do doctor na inicialização quando detecta um
formato de config legado, para que configs obsoletas sejam reparadas sem intervenção manual.

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
- Para canais com `accounts` nomeados mas sem `accounts.default`, mover valores de canal de conta única com escopo de conta no nível superior para `channels.<channel>.accounts.default` quando presente
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

Avisos do Doctor também incluem orientação de default de conta para canais multi-conta:

- Se duas ou mais entradas de `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
- Se `channels.<channel>.defaultAccount` estiver definido para um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

### 2b) Overrides de provedor OpenCode

Se você adicionou `models.providers.opencode`, `opencode-zen`, ou `opencode-go`
manualmente, isso sobrescreve o catálogo OpenCode built-in de `@mariozechner/pi-ai`.
Isso pode forçar modelos para a API errada ou zerar custos. O Doctor avisa para que você
possa remover o override e restaurar roteamento de API por modelo + custos.

### 3) Migrações de estado legado (layout em disco)

O Doctor pode migrar layouts em disco mais antigos para a estrutura atual:

- Store de sessões + transcrições:
  - de `~/.opencraft/sessions/` para `~/.opencraft/agents/<agentId>/sessions/`
- Diretório de agente:
  - de `~/.opencraft/agent/` para `~/.opencraft/agents/<agentId>/agent/`
- Estado de auth WhatsApp (Baileys):
  - de `~/.opencraft/credentials/*.json` legados (exceto `oauth.json`)
  - para `~/.opencraft/credentials/whatsapp/<accountId>/...` (id de conta padrão: `default`)

Essas migrações são best-effort e idempotentes; o doctor emitirá avisos quando
deixar qualquer pasta legada como backup. O Gateway/CLI também auto-migra
as sessões legadas + diretório de agente na inicialização para que histórico/auth/modelos fiquem no
path por agente sem uma execução manual do doctor. Auth WhatsApp é intencionalmente migrada
apenas via `opencraft doctor`.

### 3b) Migrações legadas do store de cron

O Doctor também verifica o store de cron job (`~/.opencraft/cron/jobs.json` por padrão,
ou `cron.store` quando sobrescrito) para shapes de job antigos que o agendador ainda
aceita por compatibilidade.

Limpezas atuais de cron incluem:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
- campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliases de entrega `provider` do payload → `delivery.channel` explícito
- jobs de fallback webhook legados simples `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

O Doctor só auto-migra jobs `notify: true` quando pode fazê-lo sem
mudar o comportamento. Se um job combina fallback notify legado com um
modo de entrega não-webhook existente, o doctor avisa e deixa aquele job para revisão manual.

### 4) Verificações de integridade de estado (persistência de sessão, roteamento e segurança)

O diretório de estado é o brainstem operacional. Se desaparecer, você perde
sessões, credenciais, logs e config (a menos que tenha backups em outro lugar).

O Doctor verifica:

- **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar
  o diretório e lembra que não pode recuperar dados ausentes.
- **Permissões do diretório de estado**: verifica capacidade de escrita; oferece reparar permissões
  (e emite um hint `chown` quando incompatibilidade de proprietário/grupo é detectada).
- **Diretório de estado sincronizado em nuvem no macOS**: avisa quando o estado resolve sob iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...` porque paths com backup de sync podem causar I/O mais lento
  e corridas de lock/sync.
- **Diretório de estado SD ou eMMC no Linux**: avisa quando o estado resolve para uma
  fonte de montagem `mmcblk*`, porque I/O aleatório com backup de SD ou eMMC pode ser mais lento e desgastar
  mais rápido sob escritas de sessão e credencial.
- **Diretórios de sessão ausentes**: `sessions/` e o diretório do store de sessão são
  necessários para persistir histórico e evitar crashes `ENOENT`.
- **Incompatibilidade de transcrição**: avisa quando entradas de sessão recentes têm arquivos
  de transcrição ausentes.
- **Sessão principal "JSONL de 1 linha"**: sinaliza quando a transcrição principal tem apenas uma
  linha (histórico não está acumulando).
- **Múltiplos diretórios de estado**: avisa quando múltiplas pastas `~/.opencraft` existem entre
  diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (histórico pode
  dividir entre installs).
- **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra de rodar
  no host remoto (o estado fica lá).
- **Permissões do arquivo de config**: avisa se `~/.opencraft/opencraft.json` for
  legível por grupo/mundo e oferece apertar para `600`.

### 5) Saúde de auth de modelo (expiração de OAuth)

O Doctor inspeciona perfis OAuth no store de auth, avisa quando tokens estão
expirando/expirados e pode atualizá-los quando seguro. Se o perfil Claude Code
Anthropic estiver obsoleto, sugere rodar `claude setup-token` (ou colar um setup-token).
Prompts de atualização só aparecem quando rodando interativamente (TTY); `--non-interactive`
pula tentativas de atualização.

O Doctor também reporta perfis de auth que estão temporariamente inutilizáveis devido a:

- cooldowns curtos (rate limits/timeouts/falhas de auth)
- desabilitações mais longas (falhas de cobrança/crédito)

### 6) Validação de modelo de hooks

Se `hooks.gmail.model` estiver definido, o doctor valida a referência de modelo contra o
catálogo e allowlist e avisa quando não resolverá ou está na blocklist.

### 7) Reparo de imagem de sandbox

Quando sandboxing está habilitado, o doctor verifica imagens Docker e oferece construir ou
mudar para nomes legados se a imagem atual estiver ausente.

### 8) Migrações de serviço do Gateway e hints de limpeza

O Doctor detecta serviços de gateway legados (launchd/systemd/schtasks) e
oferece removê-los e instalar o serviço OpenCraft usando a porta do gateway atual. Também pode escanear
serviços semelhantes ao gateway extras e imprimir hints de limpeza.
Serviços de gateway OpenCraft com nome de perfil são considerados de primeira classe e não são
sinalizados como "extras".

### 9) Avisos de segurança

O Doctor emite avisos quando um provedor está aberto para DMs sem allowlist, ou
quando uma política está configurada de forma perigosa.

### 10) Linger systemd (Linux)

Se rodando como serviço systemd de usuário, o doctor garante que lingering está habilitado para que o
gateway permaneça ativo após logout.

### 11) Status de skills

O Doctor imprime um resumo rápido de skills elegíveis/ausentes/bloqueadas para o workspace atual.

### 12) Verificações de auth do Gateway (token local)

O Doctor verifica a prontidão de auth por token do gateway local.

- Se o modo token precisa de um token e não há fonte de token, o doctor oferece gerar um.
- Se `gateway.auth.token` é gerenciado por SecretRef mas não está disponível, o doctor avisa e não sobrescreve com texto simples.
- `opencraft doctor --generate-gateway-token` força geração apenas quando nenhum SecretRef de token está configurado.

### 12b) Reparos com ciência de SecretRef somente leitura

Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento de fail-fast de runtime.

- `opencraft doctor --fix` agora usa o mesmo modelo de resumo SecretRef somente leitura que comandos da família status para reparos de config direcionados.
- Exemplo: o reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar credenciais de bot configuradas quando disponíveis.
- Se o token do bot Telegram estiver configurado via SecretRef mas não disponível no path de comando atual, o doctor reporta que a credencial está configurada-mas-indisponível e pula a auto-resolução em vez de travar ou reportar incorretamente o token como ausente.

### 13) Verificação de saúde do Gateway + restart

O Doctor roda uma verificação de saúde e oferece reiniciar o gateway quando parece
não saudável.

### 14) Avisos de status de canal

Se o gateway estiver saudável, o doctor roda uma probe de status de canal e reporta
avisos com correções sugeridas.

### 15) Auditoria de config de supervisor + reparo

O Doctor verifica a config do supervisor instalado (launchd/systemd/schtasks) para
padrões ausentes ou desatualizados (ex., dependências de network-online systemd e
atraso de restart). Quando encontra incompatibilidade, recomenda uma atualização e pode
reescrever o arquivo de serviço/tarefa para os padrões atuais.

Notas:

- `opencraft doctor` solicita antes de reescrever config de supervisor.
- `opencraft doctor --yes` aceita os prompts de reparo padrão.
- `opencraft doctor --repair` aplica correções recomendadas sem prompts.
- `opencraft doctor --repair --force` sobrescreve configs personalizadas de supervisor.
- Se auth por token requer um token e `gateway.auth.token` é gerenciado por SecretRef, o reparo/install de serviço do doctor valida o SecretRef mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço supervisor.
- Se auth por token requer um token e o SecretRef de token configurado não está resolvido, o doctor bloqueia o path de install/reparo com orientação acionável.
- Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia install/reparo até que o modo seja definido explicitamente.
- Para units systemd de usuário Linux, verificações de deriva de token do doctor agora incluem fontes de `Environment=` e `EnvironmentFile=` ao comparar metadados de auth do serviço.
- Você pode sempre forçar uma reescrita completa via `opencraft gateway install --force`.

### 16) Diagnósticos de runtime + porta do Gateway

O Doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o
serviço está instalado mas não está realmente rodando. Também verifica colisões de porta
na porta do gateway (padrão `18789`) e reporta causas prováveis (gateway já
rodando, túnel SSH).

### 17) Melhores práticas de runtime do Gateway

O Doctor avisa quando o serviço do gateway roda em Bun ou um path de Node gerenciado por version
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Canais WhatsApp + Telegram requerem Node,
e paths de version-manager podem quebrar após upgrades porque o serviço não
carrega seu init de shell. O Doctor oferece migrar para um install de Node do sistema quando
disponível (Homebrew/apt/choco).

### 18) Escrita de config + metadados do wizard

O Doctor persiste quaisquer mudanças de config e carimba metadados do wizard para registrar a
execução do doctor.

### 19) Dicas de workspace (backup + sistema de memória)

O Doctor sugere um sistema de memória de workspace quando ausente e imprime uma dica de backup
se o workspace não estiver já sob git.

Veja [/concepts/agent-workspace](/concepts/agent-workspace) para um guia completo de
estrutura de workspace e backup git (GitHub privado ou GitLab recomendados).
