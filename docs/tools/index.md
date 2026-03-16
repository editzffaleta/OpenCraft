---
summary: "Superfície de tools do agente para o OpenCraft (browser, canvas, nodes, message, cron) substituindo skills legadas `openclaw-*`"
read_when:
  - Adicionando ou modificando tools do agente
  - Aposentando ou alterando skills `openclaw-*`
title: "Tools"
---

# Tools (OpenCraft)

O OpenCraft expõe **tools de agente de primeira classe** para browser, canvas, nodes e cron.
Elas substituem as antigas skills `openclaw-*`: as tools são tipadas, sem shell,
e o agente deve depender delas diretamente.

## Desabilitando tools

Você pode permitir/negar tools globalmente via `tools.allow` / `tools.deny` em `opencraft.json`
(deny vence). Isso impede que tools não permitidas sejam enviadas aos provedores de modelo.

```json5
{
  tools: { deny: ["browser"] },
}
```

Notas:

- Correspondência é insensível a maiúsculas/minúsculas.
- Wildcards `*` são suportados (`"*"` significa todas as tools).
- Se `tools.allow` referencia apenas nomes de tools de plugin desconhecidos ou não carregados, o OpenCraft loga um aviso e ignora a allowlist para que as tools principais permaneçam disponíveis.

## Perfis de tool (allowlist base)

`tools.profile` define uma **allowlist base de tools** antes de `tools.allow`/`tools.deny`.
Override por agente: `agents.list[].tools.profile`.

Perfis:

- `minimal`: apenas `session_status`
- `coding`: `group:fs`, `group:runtime`, `group:sessions`, `group:memory`, `image`
- `messaging`: `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`
- `full`: sem restrição (igual a não definido)

Exemplo (apenas mensagens por padrão, permitir tools Slack + Discord também):

```json5
{
  tools: {
    profile: "messaging",
    allow: ["slack", "discord"],
  },
}
```

Exemplo (perfil coding, mas negar exec/process em todo lugar):

```json5
{
  tools: {
    profile: "coding",
    deny: ["group:runtime"],
  },
}
```

Exemplo (perfil coding global, agente de suporte apenas mensagens):

```json5
{
  tools: { profile: "coding" },
  agents: {
    list: [
      {
        id: "support",
        tools: { profile: "messaging", allow: ["slack"] },
      },
    ],
  },
}
```

## Política de tools por provedor

Use `tools.byProvider` para **restringir ainda mais** tools para provedores específicos
(ou um único `provedor/modelo`) sem alterar seus padrões globais.
Override por agente: `agents.list[].tools.byProvider`.

Isso é aplicado **depois** do perfil base de tools e **antes** das listas allow/deny,
portanto só pode estreitar o conjunto de tools.
Chaves de provedor aceitam `provider` (ex: `google-antigravity`) ou
`provider/model` (ex: `openai/gpt-5.2`).

Exemplo (manter perfil coding global, mas tools mínimas para Google Antigravity):

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```

Exemplo (allowlist específica por provedor/modelo para um endpoint instável):

```json5
{
  tools: {
    allow: ["group:fs", "group:runtime", "sessions_list"],
    byProvider: {
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

Exemplo (override por agente para um único provedor):

```json5
{
  agents: {
    list: [
      {
        id: "support",
        tools: {
          byProvider: {
            "google-antigravity": { allow: ["message", "sessions_list"] },
          },
        },
      },
    ],
  },
}
```

## Grupos de tools (atalhos)

Políticas de tools (global, por agente, sandbox) suportam entradas `group:*` que expandem para múltiplas tools.
Use-os em `tools.allow` / `tools.deny`.

Grupos disponíveis:

- `group:runtime`: `exec`, `bash`, `process`
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: todas as tools OpenCraft embutidas (exclui plugins de provedor)

Exemplo (permitir apenas tools de arquivo + browser):

```json5
{
  tools: {
    allow: ["group:fs", "browser"],
  },
}
```

## Plugins + tools

Plugins podem registrar **tools adicionais** (e comandos CLI) além do conjunto principal.
Veja [Plugins](/tools/plugin) para instalação + config, e [Skills](/tools/skills) para como
orientações de uso de tools são injetadas nos prompts. Alguns plugins incluem suas próprias skills
junto com tools (por exemplo, o plugin voice-call).

Tools de plugin opcionais:

- [Lobster](/tools/lobster): runtime de workflow tipado com aprovações retomáveis (requer o CLI do Lobster no host do gateway).
- [LLM Task](/tools/llm-task): etapa LLM somente JSON para saída de workflow estruturada (validação de schema opcional).
- [Diffs](/tools/diffs): visualizador de diff somente leitura e renderizador de arquivo PNG ou PDF para texto antes/depois ou patches unificados.

## Inventário de tools

### `apply_patch`

Aplicar patches estruturados em um ou mais arquivos. Use para edições multi-hunk.
Experimental: habilite via `tools.exec.applyPatch.enabled` (somente modelos OpenAI).
`tools.exec.applyPatch.workspaceOnly` padrão é `true` (contido no workspace). Defina como `false` apenas se você intencionalmente quer que `apply_patch` escreva/delete fora do diretório workspace.

### `exec`

Rodar comandos shell no workspace.

Parâmetros principais:

- `command` (obrigatório)
- `yieldMs` (auto-background após timeout, padrão 10000)
- `background` (background imediato)
- `timeout` (segundos; mata o processo se excedido, padrão 1800)
- `elevated` (bool; rodar no host se modo elevado está habilitado/permitido; só muda comportamento quando o agente está em sandbox)
- `host` (`sandbox | gateway | node`)
- `security` (`deny | allowlist | full`)
- `ask` (`off | on-miss | always`)
- `node` (id/nome do node para `host=node`)
- Precisa de um TTY real? Defina `pty: true`.

Notas:

- Retorna `status: "running"` com um `sessionId` quando em background.
- Use `process` para poll/log/write/kill/clear de sessões em background.
- Se `process` não é permitido, `exec` roda sincronamente e ignora `yieldMs`/`background`.
- `elevated` é controlado por `tools.elevated` mais qualquer override de `agents.list[].tools.elevated` (ambos devem permitir) e é um alias para `host=gateway` + `security=full`.
- `elevated` só muda comportamento quando o agente está em sandbox (caso contrário é no-op).
- `host=node` pode apontar para um app companheiro macOS ou um host de node headless (`opencraft node run`).
- Aprovações e allowlists gateway/node: [Aprovações exec](/tools/exec-approvals).

### `process`

Gerenciar sessões exec em background.

Ações principais:

- `list`, `poll`, `log`, `write`, `kill`, `clear`, `remove`

Notas:

- `poll` retorna nova saída e status de saída quando completo.
- `log` suporta `offset`/`limit` baseado em linha (omitir `offset` pega os últimos N linhas).
- `process` tem escopo por agente; sessões de outros agentes não são visíveis.

### `loop-detection` (guardrails de loop de chamadas de tool)

O OpenCraft rastreia o histórico recente de chamadas de tool e bloqueia ou avisa quando detecta loops repetitivos sem progresso.
Habilite com `tools.loopDetection.enabled: true` (padrão é `false`).

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      historySize: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `genericRepeat`: padrão de chamada repetida com mesma tool + mesmos parâmetros.
- `knownPollNoProgress`: repetição de tools do tipo poll com saídas idênticas.
- `pingPong`: padrões `A/B/A/B` alternados sem progresso.
- Override por agente: `agents.list[].tools.loopDetection`.

### `web_search`

Buscar na web usando Perplexity, Brave, Gemini, Grok ou Kimi.

Parâmetros principais:

- `query` (obrigatório)
- `count` (1–10; padrão de `tools.web.search.maxResults`)

Notas:

- Requer uma chave API para o provedor escolhido (recomendado: `opencraft configure --section web`).
- Habilite via `tools.web.search.enabled`.
- Respostas são cacheadas (padrão 15 min).
- Veja [Web tools](/tools/web) para configuração.

### `web_fetch`

Buscar e extrair conteúdo legível de uma URL (HTML → markdown/texto).

Parâmetros principais:

- `url` (obrigatório)
- `extractMode` (`markdown` | `text`)
- `maxChars` (truncar páginas longas)

Notas:

- Habilite via `tools.web.fetch.enabled`.
- `maxChars` é limitado por `tools.web.fetch.maxCharsCap` (padrão 50000).
- Respostas são cacheadas (padrão 15 min).
- Para sites pesados em JS, prefira a tool browser.
- Veja [Web tools](/tools/web) para configuração.
- Veja [Firecrawl](/tools/firecrawl) para o fallback anti-bot opcional.

### `browser`

Controlar o browser gerenciado pelo OpenCraft dedicado.

Ações principais:

- `status`, `start`, `stop`, `tabs`, `open`, `focus`, `close`
- `snapshot` (aria/ai)
- `screenshot` (retorna bloco de imagem + `MEDIA:<path>`)
- `act` (ações UI: click/type/press/hover/drag/select/fill/resize/wait/evaluate)
- `navigate`, `console`, `pdf`, `upload`, `dialog`

Gerenciamento de perfis:

- `profiles` — listar todos os perfis de browser com status
- `create-profile` — criar novo perfil com porta auto-alocada (ou `cdpUrl`)
- `delete-profile` — parar browser, deletar dados do usuário, remover da config (somente local)
- `reset-profile` — matar processo órfão na porta do perfil (somente local)

Parâmetros comuns:

- `profile` (opcional; padrão `browser.defaultProfile`)
- `target` (`sandbox` | `host` | `node`)
- `node` (opcional; pina um id/nome de node específico)

Notas:

- Requer `browser.enabled=true` (padrão é `true`; defina `false` para desabilitar).
- Todas as ações aceitam parâmetro `profile` opcional para suporte a múltiplas instâncias.
- Omita `profile` para o padrão seguro: browser isolado gerenciado pelo OpenCraft (`opencraft`).
- Use `profile="user"` para o browser do host local real quando logins/cookies existentes importam e o usuário está presente para clicar/aprovar qualquer prompt de anexação.
- Use `profile="chrome-relay"` apenas para o fluxo de anexação de extensão Chrome / botão da barra de ferramentas.
- `profile="user"` e `profile="chrome-relay"` são apenas para host; não os combine com alvos sandbox/node.
- Quando `profile` é omitido, usa `browser.defaultProfile` (padrão `opencraft`).
- Nomes de perfil: apenas alfanumérico minúsculo + hífens (máx 64 chars).
- Faixa de porta: 18800-18899 (~100 perfis máx).
- Perfis remotos são somente para anexação (sem start/stop/reset).
- Se um node com capacidade de browser estiver conectado, a tool pode roteá-lo automaticamente (a menos que você pine `target`).
- `snapshot` padrão é `ai` quando Playwright está instalado; use `aria` para a árvore de acessibilidade.
- `snapshot` também suporta opções de role-snapshot (`interactive`, `compact`, `depth`, `selector`) que retornam refs como `e12`.
- `act` requer `ref` de `snapshot` (numérico `12` de snapshots AI, ou `e12` de snapshots de role); use `evaluate` para necessidades raras de seletor CSS.
- Evite `act` → `wait` por padrão; use apenas em casos excepcionais (sem estado de UI confiável para aguardar).
- `upload` pode opcionalmente passar um `ref` para auto-clicar após armar.
- `upload` também suporta `inputRef` (ref aria) ou `element` (seletor CSS) para definir `<input type="file">` diretamente.

### `canvas`

Controlar o Canvas do node (present, eval, snapshot, A2UI).

Ações principais:

- `present`, `hide`, `navigate`, `eval`
- `snapshot` (retorna bloco de imagem + `MEDIA:<path>`)
- `a2ui_push`, `a2ui_reset`

Notas:

- Usa `node.invoke` do gateway por baixo.
- Se nenhum `node` é fornecido, a tool escolhe um padrão (único node conectado ou node mac local).
- A2UI é somente v0.8 (sem `createSurface`); o CLI rejeita JSONL v0.9 com erros de linha.
- Smoke rápido: `opencraft nodes canvas a2ui push --node <id> --text "Olá do A2UI"`.

### `nodes`

Descobrir e apontar nodes emparelhados; enviar notificações; capturar câmera/tela.

Ações principais:

- `status`, `describe`
- `pending`, `approve`, `reject` (emparelhamento)
- `notify` (macOS `system.notify`)
- `run` (macOS `system.run`)
- `camera_list`, `camera_snap`, `camera_clip`, `screen_record`
- `location_get`, `notifications_list`, `notifications_action`
- `device_status`, `device_info`, `device_permissions`, `device_health`

Notas:

- Comandos de câmera/tela requerem que o app do node esteja em foreground.
- Imagens retornam blocos de imagem + `MEDIA:<path>`.
- Vídeos retornam `FILE:<path>` (mp4).
- Localização retorna um payload JSON (lat/lon/precisão/timestamp).
- Parâmetros de `run`: array argv `command`; `cwd`, `env` (`KEY=VAL`), `commandTimeoutMs`, `invokeTimeoutMs`, `needsScreenRecording` opcionais.

Exemplo (`run`):

```json
{
  "action": "run",
  "node": "mac-escritorio",
  "command": ["echo", "Olá"],
  "env": ["FOO=bar"],
  "commandTimeoutMs": 12000,
  "invokeTimeoutMs": 45000,
  "needsScreenRecording": false
}
```

### `image`

Analisar uma imagem com o modelo de imagem configurado.

Parâmetros principais:

- `image` (caminho ou URL obrigatório)
- `prompt` (opcional; padrão "Descreva a imagem.")
- `model` (override opcional)
- `maxBytesMb` (limite de tamanho opcional)

Notas:

- Disponível apenas quando `agents.defaults.imageModel` está configurado (primário ou fallbacks), ou quando um modelo de imagem implícito pode ser inferido do seu modelo padrão + autenticação configurada (pareamento best-effort).
- Usa o modelo de imagem diretamente (independente do modelo de chat principal).

### `pdf`

Analisar um ou mais documentos PDF.

Para comportamento completo, limites, config e exemplos, veja [PDF tool](/tools/pdf).

### `message`

Enviar mensagens e ações de canal no Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/iMessage/MS Teams.

Ações principais:

- `send` (texto + mídia opcional; MS Teams também suporta `card` para Adaptive Cards)
- `poll` (enquetes WhatsApp/Discord/MS Teams)
- `react` / `reactions` / `read` / `edit` / `delete`
- `pin` / `unpin` / `list-pins`
- `permissions`
- `thread-create` / `thread-list` / `thread-reply`
- `search`
- `sticker`
- `member-info` / `role-info`
- `emoji-list` / `emoji-upload` / `sticker-upload`
- `role-add` / `role-remove`
- `channel-info` / `channel-list`
- `voice-status`
- `event-list` / `event-create`
- `timeout` / `kick` / `ban`

Notas:

- `send` roteia WhatsApp via Gateway; outros canais vão direto.
- `poll` usa o Gateway para WhatsApp e MS Teams; enquetes do Discord vão direto.
- Quando uma chamada de tool de mensagem está vinculada a uma sessão de chat ativa, os envios são restritos ao alvo dessa sessão para evitar vazamentos entre contextos.

### `cron`

Gerenciar jobs cron e wakeups do Gateway.

Ações principais:

- `status`, `list`
- `add`, `update`, `remove`, `run`, `runs`
- `wake` (enfileirar evento de sistema + heartbeat imediato opcional)

Notas:

- `add` espera um objeto completo de job cron (mesmo schema que RPC `cron.add`).
- `update` usa `{ jobId, patch }` (`id` aceito para compatibilidade).

### `gateway`

Reiniciar ou aplicar atualizações ao processo Gateway em execução (in-place).

Ações principais:

- `restart` (autoriza + envia `SIGUSR1` para reinício in-process; reinício in-place de `opencraft gateway`)
- `config.schema.lookup` (inspecionar um caminho de config por vez sem carregar o schema completo no contexto do prompt)
- `config.get`
- `config.apply` (validar + escrever config + reiniciar + wake)
- `config.patch` (mesclar atualização parcial + reiniciar + wake)
- `update.run` (rodar atualização + reiniciar + wake)

Notas:

- `config.schema.lookup` espera um caminho de config direcionado como `gateway.auth` ou `agents.list.*.heartbeat`.
- Caminhos podem incluir ids de plugin delimitados por barra quando endereçando `plugins.entries.<id>`, por exemplo `plugins.entries.pack/one.config`.
- Use `delayMs` (padrão 2000) para evitar interromper uma resposta em andamento.
- `config.schema` permanece disponível para fluxos internos de Control UI e não é exposto pela tool `gateway` do agente.
- `restart` está habilitado por padrão; defina `commands.restart: false` para desabilitar.

### `sessions_list` / `sessions_history` / `sessions_send` / `sessions_spawn` / `session_status`

Listar sessões, inspecionar histórico de transcript ou enviar para outra sessão.

Parâmetros principais:

- `sessions_list`: `kinds?`, `limit?`, `activeMinutes?`, `messageLimit?` (0 = nenhum)
- `sessions_history`: `sessionKey` (ou `sessionId`), `limit?`, `includeTools?`
- `sessions_send`: `sessionKey` (ou `sessionId`), `message`, `timeoutSeconds?` (0 = fire-and-forget)
- `sessions_spawn`: `task`, `label?`, `runtime?`, `agentId?`, `model?`, `thinking?`, `cwd?`, `runTimeoutSeconds?`, `thread?`, `mode?`, `cleanup?`, `sandbox?`, `streamTo?`, `attachments?`, `attachAs?`
- `session_status`: `sessionKey?` (padrão atual; aceita `sessionId`), `model?` (`default` limpa override)

Notas:

- `main` é a chave de chat direto canônica; globais/desconhecidas são ocultas.
- `messageLimit > 0` busca as últimas N mensagens por sessão (mensagens de tool filtradas).
- Visibilidade de sessão é controlada por `tools.sessions.visibility` (padrão `tree`: sessão atual + sessões subagentes criadas). Se você roda um agente compartilhado para múltiplos usuários, considere definir `tools.sessions.visibility: "self"` para impedir navegação entre sessões.
- `sessions_send` aguarda conclusão final quando `timeoutSeconds > 0`.
- Entrega/anúncio acontece após conclusão e é best-effort; `status: "ok"` confirma que a execução do agente terminou, não que o anúncio foi entregue.
- `sessions_spawn` suporta `runtime: "subagent" | "acp"` (`subagent` padrão). Para comportamento de runtime ACP, veja [ACP Agents](/tools/acp-agents).
- Para runtime ACP, `streamTo: "parent"` roteia resumos de progresso da execução inicial de volta à sessão solicitante como eventos de sistema em vez de entrega direta ao filho.
- `sessions_spawn` inicia uma execução de sub-agente e posta um anúncio de resposta de volta ao chat solicitante.
  - Suporta modo one-shot (`mode: "run"`) e modo persistente vinculado a thread (`mode: "session"` com `thread: true`).
  - Se `thread: true` e `mode` for omitido, o modo padrão é `session`.
  - `mode: "session"` requer `thread: true`.
  - Se `runTimeoutSeconds` for omitido, o OpenCraft usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário o timeout padrão é `0` (sem timeout).
  - Fluxos vinculados a thread do Discord dependem de `session.threadBindings.*` e `channels.discord.threadBindings.*`.
  - Formato de resposta inclui `Status`, `Result` e estatísticas compactas.
  - `Result` é o texto de conclusão do assistente; se ausente, o último `toolResult` é usado como fallback.
- Spawns de modo de conclusão manual enviam diretamente primeiro, com fallback de fila e retry em falhas transitórias (`status: "ok"` significa execução concluída, não que anúncio foi entregue).
- `sessions_spawn` suporta anexos de arquivo inline apenas para runtime subagent (ACP os rejeita). Cada anexo tem `name`, `content` e `encoding` opcional (`utf8` ou `base64`) e `mimeType`. Arquivos são materializados no workspace filho em `.openclaw/attachments/<uuid>/` com um arquivo de metadados `.manifest.json`. A tool retorna um recibo com `count`, `totalBytes`, `sha256` por arquivo e `relDir`. Conteúdo de anexo é automaticamente redigido da persistência de transcript.
  - Configure limites via `tools.sessions_spawn.attachments` (`enabled`, `maxTotalBytes`, `maxFiles`, `maxFileBytes`, `retainOnSessionKeep`).
  - `attachAs.mountPath` é uma dica reservada para implementações futuras de mount.
- `sessions_spawn` é não-bloqueante e retorna `status: "accepted"` imediatamente.
- Respostas ACP `streamTo: "parent"` podem incluir `streamLogPath` (por sessão `*.acp-stream.jsonl`) para seguir o histórico de progresso.
- `sessions_send` roda um ping-pong de reply-back (responda `REPLY_SKIP` para parar; máx de turnos via `session.agentToAgent.maxPingPongTurns`, 0–5).
- Após o ping-pong, o agente alvo roda uma **etapa de anúncio**; responda `ANNOUNCE_SKIP` para suprimir o anúncio.
- Clamp de sandbox: quando a sessão atual está em sandbox e `agents.defaults.sandbox.sessionToolsVisibility: "spawned"`, o OpenCraft clamp `tools.sessions.visibility` para `tree`.

### `agents_list`

Listar ids de agente que a sessão atual pode apontar com `sessions_spawn`.

Notas:

- Resultado é restrito a allowlists por agente (`agents.list[].subagents.allowAgents`).
- Quando `["*"]` está configurado, a tool inclui todos os agentes configurados e marca `allowAny: true`.

## Parâmetros (comuns)

Tools com suporte ao gateway (`canvas`, `nodes`, `cron`):

- `gatewayUrl` (padrão `ws://127.0.0.1:18789`)
- `gatewayToken` (se autenticação habilitada)
- `timeoutMs`

Nota: quando `gatewayUrl` está definido, inclua `gatewayToken` explicitamente. Tools não herdam
credenciais de config ou ambiente para overrides, e credenciais explícitas ausentes são um erro.

Tool browser:

- `profile` (opcional; padrão `browser.defaultProfile`)
- `target` (`sandbox` | `host` | `node`)
- `node` (opcional; pinar um id/nome de node específico)
- Guias de troubleshooting:
  - Problemas de startup/CDP no Linux: [Troubleshooting do browser (Linux)](/tools/browser-linux-troubleshooting)
  - WSL2 Gateway + Chrome CDP remoto Windows: [Troubleshooting WSL2 + Windows + Chrome CDP remoto](/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

## Fluxos de agente recomendados

Automação de browser:

1. `browser` → `status` / `start`
2. `snapshot` (ai ou aria)
3. `act` (click/type/press)
4. `screenshot` se precisar de confirmação visual

Renderização de canvas:

1. `canvas` → `present`
2. `a2ui_push` (opcional)
3. `snapshot`

Apontar node:

1. `nodes` → `status`
2. `describe` no node escolhido
3. `notify` / `run` / `camera_snap` / `screen_record`

## Segurança

- Evite `system.run` direto; use `nodes` → `run` apenas com consentimento explícito do usuário.
- Respeite o consentimento do usuário para captura de câmera/tela.
- Use `status/describe` para garantir permissões antes de invocar comandos de mídia.

## Como as tools são apresentadas ao agente

As tools são expostas em dois canais paralelos:

1. **Texto do prompt do sistema**: uma lista legível por humanos + orientação.
2. **Schema de tool**: as definições de função estruturadas enviadas à API do modelo.

Isso significa que o agente vê tanto "quais tools existem" quanto "como chamá-las." Se uma tool
não aparecer no prompt do sistema ou no schema, o modelo não pode chamá-la.
