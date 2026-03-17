---
summary: "Agent tool surface para OpenCraft (browser, canvas, nodes, message, cron) substituindo legacy `opencraft-*` skills"
read_when:
  - Adicionando ou modificando agent tools
  - Retiring ou mudando `opencraft-*` skills
title: "Tools"
---

# Tools (OpenCraft)

OpenCraft expõe **first-class agent tools** para browser, canvas, nodes e cron.
Estes substituem os antigos `opencraft-*` skills: os tools são typed, sem shelling,
e o agente deve confiar neles diretamente.

## Desabilitando tools

Você pode globalmente permitir/negar tools via `tools.allow` / `tools.deny` em `opencraft.json`
(deny vence). Isto previne tools desallowados de serem enviados a model providers.

```json5
{
  tools: { deny: ["browser"] },
}
```

Notas:

- Matching é case-insensitive.
- Wildcards `*` são suportados (`"*"` significa todos os tools).
- Se `tools.allow` apenas referencia unknown ou unloaded plugin tool names, OpenCraft loga um warning e ignora o allowlist para core tools permanecerem disponíveis.

## Tool profiles (base allowlist)

`tools.profile` define um **base tool allowlist** antes de `tools.allow`/`tools.deny`.
Override per-agent: `agents.list[].tools.profile`.

Profiles:

- `minimal`: `session_status` apenas
- `coding`: `group:fs`, `group:runtime`, `group:sessions`, `group:memory`, `image`
- `messaging`: `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`
- `full`: sem restrição (mesmo que unset)

Exemplo (messaging-only por padrão, permitir Slack + Discord tools também):

```json5
{
  tools: {
    profile: "messaging",
    allow: ["slack", "discord"],
  },
}
```

Exemplo (coding profile, mas negar exec/process em todos):

```json5
{
  tools: {
    profile: "coding",
    deny: ["group:runtime"],
  },
}
```

Exemplo (global coding profile, messaging-only support agent):

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

## Provider-specific tool policy

Use `tools.byProvider` para **ainda mais restringir** tools para providers específicos
(ou um único `provider/model`) sem mudar seus defaults globais.
Override per-agent: `agents.list[].tools.byProvider`.

Isto é aplicado **depois** do base tool profile e **antes** de allow/deny lists,
então pode apenas estreitar o tool set.
Provider keys aceitam either `provider` (ex. `google-antigravity`) ou
`provider/model` (ex. `openai/gpt-5.2`).

Exemplo (manter global coding profile, mas minimal tools para Google Antigravity):

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

Exemplo (provider/model-specific allowlist para um endpoint flaky):

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

Exemplo (agent-specific override para um provider único):

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

## Tool groups (shorthands)

Tool policies (global, agent, sandbox) suportam entradas `group:*` que expandem para múltiplos tools.
Use estes em `tools.allow` / `tools.deny`.

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
- `group:opencraft`: todos os built-in OpenCraft tools (exclui provider plugins)

Exemplo (permitir apenas file tools + browser):

```json5
{
  tools: {
    allow: ["group:fs", "browser"],
  },
}
```

## Plugins + tools

Plugins podem registrar **tools adicionais** (e CLI commands) além do core set.
Veja [Plugins](/tools/plugin) para install + config, e [Skills](/tools/skills) para como
tool usage guidance é injetado em prompts. Alguns plugins vêm com seus próprios skills
ao lado dos tools (por exemplo, o voice-call plugin).

Plugin tools opcionais:

- [Lobster](/tools/lobster): typed workflow runtime com resumable approvals (requer Lobster CLI no host gateway).
- [LLM Task](/tools/llm-task): JSON-only LLM step para structured workflow output (optional schema validation).
- [Diffs](/tools/diffs): read-only diff viewer e PNG ou PDF file renderer para before/after text ou unified patches.

## Inventário de tools

### `apply_patch`

Aplique structured patches através um ou mais arquivos. Use para multi-hunk edits.
Experimental: habilite via `tools.exec.applyPatch.enabled` (OpenAI models apenas).
`tools.exec.applyPatch.workspaceOnly` padrão é `true` (workspace-contained). Defina para `false` apenas se você intencionalmente quer `apply_patch` write/delete fora do diretório workspace.

### `exec`

Execute comandos shell no workspace.

Parâmetros principais:

- `command` (required)
- `yieldMs` (auto-background após timeout, padrão 10000)
- `background` (immediate background)
- `timeout` (segundos; mata o processo se excedido, padrão 1800)
- `elevated` (bool; execute no host se elevated mode está habilitado/permitido; apenas muda comportamento quando o agente é sandboxed)
- `host` (`sandbox | gateway | node`)
- `security` (`deny | allowlist | full`)
- `ask` (`off | on-miss | always`)
- `node` (node id/name para `host=node`)
- Precisa de real TTY? Defina `pty: true`.

Notas:

- Retorna `status: "running"` com um `sessionId` quando backgrounded.
- Use `process` para poll/log/write/kill/clear background sessions.
- Se `process` é disallowed, `exec` executa synchronously e ignora `yieldMs`/`background`.
- `elevated` é gated por `tools.elevated` mais qualquer override `agents.list[].tools.elevated` (ambos devem permitir) e é um alias para `host=gateway` + `security=full`.
- `elevated` apenas muda comportamento quando o agente é sandboxed (de outra forma é um no-op).
- `host=node` pode alvejar um macOS companion app ou um headless node host (`opencraft node run`).
- gateway/node approvals e allowlists: [Exec approvals](/tools/exec-approvals).

### `process`

Gerencie background exec sessions.

Ações principais:

- `list`, `poll`, `log`, `write`, `kill`, `clear`, `remove`

Notas:

- `poll` retorna novo output e exit status quando completo.
- `log` suporta line-based `offset`/`limit` (omita `offset` para pegar os últimos N lines).
- `process` é scoped per agente; sessões de outros agentes não são visíveis.

### `loop-detection` (tool-call loop guardrails)

OpenCraft rastreia recent tool-call history e bloqueia ou avisa quando detecta repetitive no-progress loops.
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

- `genericRepeat`: repeated mesmo tool + mesmo params call pattern.
- `knownPollNoProgress`: repeating poll-like tools com identical outputs.
- `pingPong`: alternating `A/B/A/B` no-progress patterns.
- Override per-agent: `agents.list[].tools.loopDetection`.

### `web_search`

Busque a web usando Brave, Firecrawl, Gemini, Grok, Kimi ou Perplexity.

Parâmetros principais:

- `query` (required)
- `count` (1–10; padrão de `tools.web.search.maxResults`)

Notas:

- Requer API key para o chosen provider (recomendado: `opencraft configure --section web`).
- Habilite via `tools.web.search.enabled`.
- Responses são cached (padrão 15 min).
- Veja [Web tools](/tools/web) para setup.

### `web_fetch`

Busque e extraia conteúdo legível de uma URL (HTML → markdown/text).

Parâmetros principais:

- `url` (required)
- `extractMode` (`markdown` | `text`)
- `maxChars` (truncate long pages)

Notas:

- Habilite via `tools.web.fetch.enabled`.
- `maxChars` é clamped por `tools.web.fetch.maxCharsCap` (padrão 50000).
- Responses são cached (padrão 15 min).
- Para sites JS-heavy, prefira o browser tool.
- Veja [Web tools](/tools/web) para setup.
- Veja [Firecrawl](/tools/firecrawl) para o anti-bot fallback opcional.

### `browser`

Controle o dedicated OpenCraft-managed browser.

Ações principais:

- `status`, `start`, `stop`, `tabs`, `open`, `focus`, `close`
- `snapshot` (aria/ai)
- `screenshot` (retorna image block + `MEDIA:<path>`)
- `act` (UI actions: click/type/press/hover/drag/select/fill/resize/wait/evaluate)
- `navigate`, `console`, `pdf`, `upload`, `dialog`

Gerenciamento de profile:

- `profiles` — list todos os browser profiles com status
- `create-profile` — criar novo profile com auto-allocated port (ou `cdpUrl`)
- `delete-profile` — parar browser, deletar user data, remover da config (local apenas)
- `reset-profile` — matar orphan process no port do profile (local apenas)

Parâmetros comuns:

- `profile` (opcional; padrão `browser.defaultProfile`)
- `target` (`sandbox` | `host` | `node`)
- `node` (opcional; pega um node id/name específico)
  Notas:
- Requer `browser.enabled=true` (padrão é `true`; defina `false` para desabilitar).
- Todas ações aceitam parâmetro opcional `profile` para suporte multi-instância.
- Omita `profile` para o safe default: isolated OpenCraft-managed browser (`opencraft`).
- Use `profile="user"` para o real local host browser quando existing logins/cookies importam e o usuário está presente para click/approve qualquer attach prompt.
- `profile="user"` é host-only; não o combine com sandbox/node targets.
- Quando `profile` é omitido, usa `browser.defaultProfile` (padrão para `opencraft`).
- Profile names: lowercase alphanumeric + hyphens apenas (max 64 chars).
- Port range: 18800-18899 (~100 profiles max).
- Remote profiles são attach-only (sem start/stop/reset).
- Se um browser-capable node está conectado, o tool pode auto-route para ele (a menos que você pin `target`).
- `snapshot` padrão para `ai` quando Playwright está instalado; use `aria` para a accessibility tree.
- `snapshot` também suporta role-snapshot options (`interactive`, `compact`, `depth`, `selector`) que retornam refs como `e12`.
- `act` requer `ref` de `snapshot` (numeric `12` de AI snapshots, ou `e12` de role snapshots); use `evaluate` para rare CSS selector needs.
- Evite `act` → `wait` por padrão; use-o apenas em casos excepcionais (sem reliable UI state para wait on).
- `upload` pode opcionalmente passar um `ref` para auto-click depois de arming.
- `upload` também suporta `inputRef` (aria ref) ou `element` (CSS selector) para definir `<input type="file">` diretamente.

### `canvas`

Conduza o node Canvas (present, eval, snapshot, A2UI).

Ações principais:

- `present`, `hide`, `navigate`, `eval`
- `snapshot` (retorna image block + `MEDIA:<path>`)
- `a2ui_push`, `a2ui_reset`

Notas:

- Usa gateway `node.invoke` sob o capô.
- Se nenhum `node` é fornecido, o tool pega um padrão (single connected node ou local mac node).
- A2UI é v0.8 apenas (sem `createSurface`); o CLI rejeita v0.9 JSONL com line errors.
- Quick smoke: `opencraft nodes canvas a2ui push --node <id> --text "Hello from A2UI"`.

### `nodes`

Descubra e alveije paired nodes; envie notificações; capture camera/screen.

Ações principais:

- `status`, `describe`
- `pending`, `approve`, `reject` (pairing)
- `notify` (macOS `system.notify`)
- `run` (macOS `system.run`)
- `camera_list`, `camera_snap`, `camera_clip`, `screen_record`
- `location_get`, `notifications_list`, `notifications_action`
- `device_status`, `device_info`, `device_permissions`, `device_health`

Notas:

- Camera/screen commands requerem o node app estar foregrounded.
- Imagens retornam image blocks + `MEDIA:<path>`.
- Vídeos retornam `FILE:<path>` (mp4).
- Location retorna uma JSON payload (lat/lon/accuracy/timestamp).
- `run` params: `command` argv array; opcional `cwd`, `env` (`KEY=VAL`), `commandTimeoutMs`, `invokeTimeoutMs`, `needsScreenRecording`.

Exemplo (`run`):

```json
{
  "action": "run",
  "node": "office-mac",
  "command": ["echo", "Hello"],
  "env": ["FOO=bar"],
  "commandTimeoutMs": 12000,
  "invokeTimeoutMs": 45000,
  "needsScreenRecording": false
}
```

### `image`

Analise uma imagem com o configured image model.

Parâmetros principais:

- `image` (required path ou URL)
- `prompt` (opcional; padrão "Describe the image.")
- `model` (opcional override)
- `maxBytesMb` (optional size cap)

Notas:

- Apenas disponível quando `agents.defaults.imageModel` está configurado (primary ou fallbacks), ou quando um implicit image model pode ser inferido de seu default model + configured auth (best-effort pairing).
- Usa o image model diretamente (independente do chat model principal).

### `pdf`

Analise um ou mais documentos PDF.

Para comportamento completo, limites, config e exemplos, veja [PDF tool](/tools/pdf).

### `message`

Envie mensagens e channel actions através Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/iMessage/MS Teams.

Ações principais:

- `send` (text + optional media; MS Teams também suporta `card` para Adaptive Cards)
- `poll` (WhatsApp/Discord/MS Teams polls)
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

- `send` roteia WhatsApp via o Gateway; outros canais vão diretos.
- `poll` usa o Gateway para WhatsApp e MS Teams; Discord polls vão diretos.
- Quando uma message tool call está vinculada a uma active chat session, sends são constrangidos ao target daquela session para evitar cross-context leaks.

### `cron`

Gerencie Gateway cron jobs e wakeups.

Ações principais:

- `status`, `list`
- `add`, `update`, `remove`, `run`, `runs`
- `wake` (enqueue system event + optional immediate heartbeat)

Notas:

- `add` espera um full cron job object (mesmo schema que `cron.add` RPC).
- `update` usa `{ jobId, patch }` (`id` aceito para compatibilidade).

### `gateway`

Reinicie ou aplique updates ao running Gateway process (in-place).

Ações principais:

- `restart` (autoriza + envia `SIGUSR1` para in-process restart; `opencraft gateway` restart in-place)
- `config.schema.lookup` (inspecione um config path por vez sem carregar o schema completo no prompt context)
- `config.get`
- `config.apply` (validate + write config + restart + wake)
- `config.patch` (merge partial update + restart + wake)
- `update.run` (run update + restart + wake)

Notas:

- `config.schema.lookup` espera um config path alvo como `gateway.auth` ou `agents.list.*.heartbeat`.
- Paths podem incluir slash-delimited plugin ids quando endereçando `plugins.entries.<id>`, por exemplo `plugins.entries.pack/one.config`.
- Use `delayMs` (padrão 2000) para evitar interromper uma reply in-flight.
- `config.schema` permanece disponível para internal Control UI flows e não é exposto através do agent `gateway` tool.
- `restart` está habilitado por padrão; defina `commands.restart: false` para desabilitar.

### `sessions_list` / `sessions_history` / `sessions_send` / `sessions_spawn` / `session_status`

List sessões, inspecione transcript history ou envie para outra sessão.

Parâmetros principais:

- `sessions_list`: `kinds?`, `limit?`, `activeMinutes?`, `messageLimit?` (0 = none)
- `sessions_history`: `sessionKey` (ou `sessionId`), `limit?`, `includeTools?`
- `sessions_send`: `sessionKey` (ou `sessionId`), `message`, `timeoutSeconds?` (0 = fire-and-forget)
- `sessions_spawn`: `task`, `label?`, `runtime?`, `agentId?`, `model?`, `thinking?`, `cwd?`, `runTimeoutSeconds?`, `thread?`, `mode?`, `cleanup?`, `sandbox?`, `streamTo?`, `attachments?`, `attachAs?`
- `session_status`: `sessionKey?` (padrão current; aceita `sessionId`), `model?` (`default` clears override)

Notas:

- `main` é a canonical direct-chat key; global/unknown estão ocultos.
- `messageLimit > 0` busca últimas N mensagens por sessão (tool messages filtradas).
- Session targeting é controlado por `tools.sessions.visibility` (padrão `tree`: current session + spawned subagent sessions). Se você executa um agente compartilhado para múltiplos usuários, considere defininir `tools.sessions.visibility: "self"` para prevenir cross-session browsing.
- `sessions_send` espera final completion quando `timeoutSeconds > 0`.
- Delivery/announce acontece depois de completion e é best-effort; `status: "ok"` confirma o agent run terminou, não que announce foi delivered.
- `sessions_spawn` suporta `runtime: "subagent" | "acp"` (`subagent` padrão). Para comportamento de runtime ACP, veja [ACP Agents](/tools/acp-agents).
- Para ACP runtime, `streamTo: "parent"` roteia initial-run progress summaries de volta para a requester session como system events ao invés de direct child delivery.
- `sessions_spawn` inicia um sub-agent run e posta um announce reply de volta para o requester chat.
  - Suporta one-shot mode (`mode: "run"`) e persistent thread-bound mode (`mode: "session"` com `thread: true`).
  - Se `thread: true` e `mode` está omitido, mode padrão para `session`.
  - `mode: "session"` requer `thread: true`.
  - Se `runTimeoutSeconds` está omitido, OpenCraft usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; de outra forma timeout padrão para `0` (sem timeout).
  - Discord thread-bound flows dependem de `session.threadBindings.*` e `channels.discord.threadBindings.*`.
  - Reply format inclui `Status`, `Result` e compact stats.
  - `Result` é o assistant completion text; se faltando, o latest `toolResult` é usado como fallback.
- Manual completion-mode spawns enviam diretos primeiro, com queue fallback e retry em failures transiêntes (`status: "ok"` significa run terminou, não que announce foi delivered).
- `sessions_spawn` suporta inline file attachments para subagent runtime apenas (ACP rejeita). Cada attachment tem `name`, `content` e opcional `encoding` (`utf8` ou `base64`) e `mimeType`. Arquivos são materializados no child workspace em `.opencraft/attachments/<uuid>/` com um arquivo `.manifest.json` metadata. O tool retorna um receipt com `count`, `totalBytes`, per file `sha256` e `relDir`. Attachment content é automaticamente redacted de transcript persistence.
  - Configure limits via `tools.sessions_spawn.attachments` (`enabled`, `maxTotalBytes`, `maxFiles`, `maxFileBytes`, `retainOnSessionKeep`).
  - `attachAs.mountPath` é um reserved hint para future mount implementations.
- `sessions_spawn` é non-blocking e retorna `status: "accepted"` imediatamente.
- ACP `streamTo: "parent"` responses podem incluir `streamLogPath` (session-scoped `*.acp-stream.jsonl`) para tailing progress history.
- `sessions_send` executa um reply-back ping-pong (reply `REPLY_SKIP` para parar; max turns via `session.agentToAgent.maxPingPongTurns`, 0–5).
- Depois do ping-pong, o target agent executa um **announce step**; reply `ANNOUNCE_SKIP` para suprimir o announcement.
- Sandbox clamp: quando a current session está sandboxed e `agents.defaults.sandbox.sessionToolsVisibility: "spawned"`, OpenCraft clamps `tools.sessions.visibility` para `tree`.

### `agents_list`

List agent ids que a current session pode alvejar com `sessions_spawn`.

Notas:

- Resultado é restrito a per-agent allowlists (`agents.list[].subagents.allowAgents`).
- Quando `["*"]` está configurado, o tool inclui todos agentes configurados e marca `allowAny: true`.

## Parâmetros (comuns)

Gateway-backed tools (`canvas`, `nodes`, `cron`):

- `gatewayUrl` (padrão `ws://127.0.0.1:18789`)
- `gatewayToken` (se auth habilitado)
- `timeoutMs`

Nota: quando `gatewayUrl` é definido, inclua `gatewayToken` explicitamente. Tools não herdam config ou env credentials para overrides, e missing explicit credentials é um erro.

Browser tool:

- `profile` (opcional; padrão `browser.defaultProfile`)
- `target` (`sandbox` | `host` | `node`)
- `node` (opcional; pin um node id/name específico)
- Guias de troubleshooting:
  - Linux startup/CDP issues: [Browser troubleshooting (Linux)](/tools/browser-linux-troubleshooting)
  - WSL2 Gateway + Windows remote Chrome CDP: [WSL2 + Windows + remote Chrome CDP troubleshooting](/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

## Recommended agent flows

Browser automation:

1. `browser` → `status` / `start`
2. `snapshot` (ai ou aria)
3. `act` (click/type/press)
4. `screenshot` se você precisa visual confirmation

Canvas render:

1. `canvas` → `present`
2. `a2ui_push` (opcional)
3. `snapshot`

Node targeting:

1. `nodes` → `status`
2. `describe` no chosen node
3. `notify` / `run` / `camera_snap` / `screen_record`

## Safety

- Evite direto `system.run`; use `nodes` → `run` apenas com explicit user consent.
- Respeite user consent para camera/screen capture.
- Use `status/describe` para garantir permissões antes de invocar media commands.

## Como tools são apresentados ao agente

Tools são expostos em dois parallel channels:

1. **System prompt text**: uma human-readable list + guidance.
2. **Tool schema**: as definições estruturadas de função enviadas à model API.

Isto significa o agente vê ambos "quais tools existem" e "como chamá-los." Se um tool não aparece no system prompt ou o schema, o modelo não pode chamá-lo.
