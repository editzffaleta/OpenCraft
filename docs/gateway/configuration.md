---
summary: "Visão geral de configuração: tarefas comuns, setup rápido e links para a referência completa"
read_when:
  - Configurando OpenCraft pela primeira vez
  - Procurando por padrões de configuração comuns
  - Navegando para seções específicas de config
title: "Configuration"
---

# Configuration

OpenCraft lê uma config opcional <Tooltip tip="JSON5 suporta comentários e trailing commas">**JSON5**</Tooltip> de `~/.editzffaleta/OpenCraft.json`.

Se o arquivo estiver faltando, OpenCraft usa defaults seguros. Razões comuns para adicionar uma config:

- Conectar canais e controlar quem pode enviar mensagens ao bot
- Definir modelos, tools, sandboxing ou automação (cron, hooks)
- Ajustar sessões, mídia, networking ou UI

Veja a [referência completa](/gateway/configuration-reference) para cada field disponível.

<Tip>
**Novo em configuração?** Comece com `opencraft onboard` para setup interativo, ou confira o guia [Configuration Examples](/gateway/configuration-examples) para configs completas pronto para copiar e colar.
</Tip>

## Config mínima

```json5
// ~/.editzffaleta/OpenCraft.json
{
  agents: { defaults: { workspace: "~/.opencraft/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Editando config

<Tabs>
  <Tab title="Interactive wizard">
    ```bash
    opencraft onboard       # full onboarding flow
    opencraft configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    opencraft config get agents.defaults.workspace
    opencraft config set agents.defaults.heartbeat.every "2h"
    opencraft config unset tools.web.search.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Abra [http://127.0.0.1:18789](http://127.0.0.1:18789) e use a aba **Config**.
    Control UI renderiza um form a partir do config schema, com um editor **Raw JSON** como escape hatch.
  </Tab>
  <Tab title="Direct edit">
    Edite `~/.editzffaleta/OpenCraft.json` diretamente. O Gateway observa o arquivo e aplica mudanças automaticamente (veja [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validação estrita

<Warning>
OpenCraft apenas aceita configurações que correspondem totalmente ao schema. Chaves desconhecidas, tipos malformados ou valores inválidos fazem o Gateway **recusar de iniciar**. A única exceção no nível raiz é `$schema` (string), então editores podem anexar metadados de JSON Schema.
</Warning>

Quando validação falha:

- O Gateway não faz boot
- Apenas comandos diagnósticos funcionam (`opencraft doctor`, `opencraft logs`, `opencraft health`, `opencraft status`)
- Execute `opencraft doctor` para ver problemas exatos
- Execute `opencraft doctor --fix` (ou `--yes`) para aplicar reparos

## Tarefas comuns

<AccordionGroup>
  <Accordion title="Configurar um canal (WhatsApp, Telegram, Discord, etc.)">
    Cada canal tem sua própria seção de config sob `channels.<provider>`. Veja a página de canal dedicada para passos de setup:

    - [WhatsApp](/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/channels/telegram) — `channels.telegram`
    - [Discord](/channels/discord) — `channels.discord`
    - [Slack](/channels/slack) — `channels.slack`
    - [Signal](/channels/signal) — `channels.signal`
    - [iMessage](/channels/imessage) — `channels.imessage`
    - [Google Chat](/channels/googlechat) — `channels.googlechat`
    - [Mattermost](/channels/mattermost) — `channels.mattermost`
    - [MS Teams](/channels/msteams) — `channels.msteams`

    Todos os canais compartilham o mesmo padrão de DM policy:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Escolher e configurar modelos">
    Defina o modelo primário e fallbacks opcionais:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-5",
            fallbacks: ["openai/gpt-5.2"],
          },
          models: {
            "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
            "openai/gpt-5.2": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` define o catálogo de modelos e age como allowlist para `/model`.
    - Refs de modelo usam formato `provider/model` (ex. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla downscaling de imagem de transcript/tool (padrão `1200`); valores menores geralmente reduzem uso de vision-token em execuções pesadas em screenshots.
    - Veja [Models CLI](/concepts/models) para trocar modelos no chat e [Model Failover](/concepts/model-failover) para comportamento de rotação de auth e fallback.
    - Para providers customizados/self-hosted, veja [Custom providers](/gateway/configuration-reference#custom-providers-and-base-urls) na referência.

  </Accordion>

  <Accordion title="Controlar quem pode enviar mensagens ao bot">
    Acesso de DM é controlado por canal via `dmPolicy`:

    - `"pairing"` (padrão): remetentes desconhecidos recebem um código de pairing único para aprovar
    - `"allowlist"`: apenas remetentes em `allowFrom` (ou o allow store pareado)
    - `"open"`: permitir todos os DMs inbound (requer `allowFrom: ["*"]`)
    - `"disabled"`: ignorar todos os DMs

    Para grupos, use `groupPolicy` + `groupAllowFrom` ou allowlists específicos de canal.

    Veja a [referência completa](/gateway/configuration-reference#dm-and-group-access) para detalhes específicos por canal.

  </Accordion>

  <Accordion title="Configurar group chat mention gating">
    Mensagens de grupo usam **padrão requer mention**. Configure padrões por agente:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@opencraft", "opencraft"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Metadata mentions**: native @-mentions (WhatsApp tap-to-mention, Telegram @bot, etc.)
    - **Text patterns**: padrões regex seguros em `mentionPatterns`
    - Veja [referência completa](/gateway/configuration-reference#group-chat-mention-gating) para overrides por canal e modo de self-chat.

  </Accordion>

  <Accordion title="Ajustar monitoramento de saúde de canal do gateway">
    Controle com que agressividade o gateway reinicia canais que parecem obsoletos:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Defina `gateway.channelHealthCheckMinutes: 0` para desabilitar health-monitor restarts globalmente.
    - `channelStaleEventThresholdMinutes` deve ser maior ou igual ao intervalo de check.
    - Use `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` para desabilitar auto-restarts para um canal ou conta sem desabilitar o monitor global.
    - Veja [Health Checks](/gateway/health) para debugging operacional e a [referência completa](/gateway/configuration-reference#gateway) para todos os fields.

  </Accordion>

  <Accordion title="Configurar sessões e resets">
    Sessões controlam continuidade e isolamento de conversa:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (compartilhado) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: padrões globais para roteamento de sessão bound a thread (Discord suporta `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Veja [Session Management](/concepts/session) para scoping, identity links e send policy.
    - Veja [referência completa](/gateway/configuration-reference#session) para todos os fields.

  </Accordion>

  <Accordion title="Habilitar sandboxing">
    Execute sessões de agente em containers Docker isolados:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Construa a imagem primeiro: `scripts/sandbox-setup.sh`

    Veja [Sandboxing](/gateway/sandboxing) para o guia completo e [referência completa](/gateway/configuration-reference#sandbox) para todas as opções.

  </Accordion>

  <Accordion title="Habilitar push backed por relay para builds oficiais de iOS">
    Push backed por relay está configurado em `opencraft.json`.

    Defina isto em gateway config:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Opcional. Padrão: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Equivalente CLI:

    ```bash
    opencraft config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    O que isto faz:

    - Permite o gateway enviar `push.test`, wake nudges e reconnect wakes através do relay externo.
    - Usa um send grant scoped a registration encaminhado pelo app iOS pareado. O gateway não precisa de um token de relay scoped a deployment.
    - Vincula cada registro backed por relay à identidade do gateway que o app iOS se pareou, então outro gateway não pode reusar o registro armazenado.
    - Mantém iOS builds locais/manuais em APNs diretos. Sends backed por relay se aplicam apenas a builds distribuídos oficiais que se registraram através do relay.
    - Deve corresponder ao relay base URL baked no build iOS oficial/TestFlight, então traffic de registration e send chegam à mesma deploy de relay.

    Fluxo end-to-end:

    1. Instale um build iOS oficial/TestFlight que foi compilado com o mesmo relay base URL.
    2. Configure `gateway.push.apns.relay.baseUrl` no gateway.
    3. Pareie o app iOS ao gateway e deixe ambas sessões node e operator se conectarem.
    4. O app iOS busca a identidade do gateway, se registra com o relay usando App Attest mais o app receipt, e depois publica o payload `push.apns.register` backed por relay ao gateway pareado.
    5. O gateway armazena o relay handle e send grant, depois os usa para `push.test`, wake nudges e reconnect wakes.

    Notas operacionais:

    - Se você trocar o app iOS para um gateway diferente, reconecte o app para que ele possa publicar um novo registro backed por relay vinculado àquele gateway.
    - Se você enviar um novo build iOS que aponta para uma deploy de relay diferente, o app atualiza seu relay registration cacheado ao invés de reusar a origem de relay antiga.

    Nota de compatibilidade:

    - `OPENCRAFT_APNS_RELAY_BASE_URL` e `OPENCRAFT_APNS_RELAY_TIMEOUT_MS` ainda funcionam como env overrides temporários.
    - `OPENCRAFT_APNS_RELAY_ALLOW_HTTP=true` permanece um escape hatch de desenvolvimento loopback-only; não persista URLs de relay HTTP em config.

    Veja [iOS App](/platforms/ios#relay-backed-push-for-official-builds) para o fluxo end-to-end e [Authentication and trust flow](/platforms/ios#authentication-and-trust-flow) para o modelo de segurança do relay.

  </Accordion>

  <Accordion title="Configurar heartbeat (check-ins periódicos)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: duration string (`30m`, `2h`). Defina `0m` para desabilitar.
    - `target`: `last` | `whatsapp` | `telegram` | `discord` | `none`
    - `directPolicy`: `allow` (padrão) or `block` para heartbeat targets estilo DM
    - Veja [Heartbeat](/gateway/heartbeat) para o guia completo.

  </Accordion>

  <Accordion title="Configurar cron jobs">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: prune sessões de execução isoladas completadas de `sessions.json` (padrão `24h`; defina `false` para desabilitar).
    - `runLog`: prune `cron/runs/<jobId>.jsonl` por tamanho e linhas retidas.
    - Veja [Cron jobs](/automation/cron-jobs) para visão geral de feature e exemplos CLI.

  </Accordion>

  <Accordion title="Configurar webhooks (hooks)">
    Habilite endpoints webhook HTTP no Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Nota de segurança:
    - Trate todo conteúdo de payload de hook/webhook como untrusted input.
    - Mantenha flags de bypass de unsafe-content desabilitados (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) a menos que fazendo debugging narrowly scoped.
    - Para agentes driven por hook, prefira model tiers modernas fortes e strict tool policy (por exemplo apenas messaging mais sandboxing onde possível).

    Veja [referência completa](/gateway/configuration-reference#hooks) para todas as opções de mapping e integração Gmail.

  </Accordion>

  <Accordion title="Configurar roteamento multi-agent">
    Execute múltiplos agentes isolados com workspaces e sessões separadas:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.opencraft/workspace-home" },
          { id: "work", workspace: "~/.opencraft/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Veja [Multi-Agent](/concepts/multi-agent) e [referência completa](/gateway/configuration-reference#multi-agent-routing) para regras de binding e access profiles per-agent.

  </Accordion>

  <Accordion title="Dividir config em múltiplos arquivos ($include)">
    Use `$include` para organizar configs grandes:

    ```json5
    // ~/.editzffaleta/OpenCraft.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Single file**: substitui o objeto contido
    - **Array de arquivos**: deep-merged em ordem (later wins)
    - **Sibling keys**: merged depois de includes (override valores incluídos)
    - **Nested includes**: suportado até 10 níveis de profundidade
    - **Relative paths**: resolvidos relativos ao arquivo incluindo
    - **Error handling**: erros claros para arquivos faltando, parse errors e circular includes

  </Accordion>
</AccordionGroup>

## Config hot reload

O Gateway observa `~/.editzffaleta/OpenCraft.json` e aplica mudanças automaticamente — sem necessidade de restart manual para a maioria das configurações.

### Modos de reload

| Mode                   | Comportamento                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (padrão) | Hot-aplica mudanças seguras instantaneamente. Reinicia automaticamente para mudanças críticas.           |
| **`hot`**              | Hot-aplica apenas mudanças seguras. Log a warning quando um restart é necessário — você cuida. |
| **`restart`**          | Reinicia o Gateway em qualquer mudança de config, segura ou não.                                 |
| **`off`**              | Desabilita file watching. Mudanças entram em efeito no próximo restart manual.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### O que hot-aplica versus o que precisa reiniciar

A maioria dos fields hot-aplica sem downtime. Em modo `hybrid`, mudanças que requerem restart são tratadas automaticamente.

| Category            | Fields                                                               | Restart needed? |
| ------------------- | -------------------------------------------------------------------- | --------------- |
| Channels            | `channels.*`, `web` (WhatsApp) — todos canais built-in e extension | No              |
| Agent & models      | `agent`, `agents`, `models`, `routing`                               | No              |
| Automation          | `hooks`, `cron`, `agent.heartbeat`                                   | No              |
| Sessions & messages | `session`, `messages`                                                | No              |
| Tools & media       | `tools`, `browser`, `skills`, `audio`, `talk`                        | No              |
| UI & misc           | `ui`, `logging`, `identity`, `bindings`                              | No              |
| Gateway server      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Yes**         |
| Infrastructure      | `discovery`, `canvasHost`, `plugins`                                 | **Yes**         |

<Note>
`gateway.reload` e `gateway.remote` são exceções — mudar eles faz **não** triggerar um restart.
</Note>

## Config RPC (atualizações programáticas)

<Note>
Control-plane write RPCs (`config.apply`, `config.patch`, `update.run`) são rate-limited a **3 requests por 60 segundos** por `deviceId+clientIp`. Quando limitado, o RPC retorna `UNAVAILABLE` com `retryAfterMs`.
</Note>

<AccordionGroup>
  <Accordion title="config.apply (full replace)">
    Valida + escreve a config completa e reinicia o Gateway em um passo.

    <Warning>
    `config.apply` substitui a **config completa**. Use `config.patch` para atualizações parciais, ou `opencraft config set` para chaves únicas.
    </Warning>

    Params:

    - `raw` (string) — JSON5 payload para a config completa
    - `baseHash` (opcional) — config hash de `config.get` (requerido quando config existe)
    - `sessionKey` (opcional) — session key para o ping de wake-up pós-restart
    - `note` (opcional) — nota para o restart sentinel
    - `restartDelayMs` (opcional) — delay antes de restart (padrão 2000)

    Restart requests são coalesced enquanto um já está pending/in-flight, e um cooldown de 30-segundo se aplica entre ciclos de restart.

    ```bash
    opencraft gateway call config.get --params '{}'  # capture payload.hash
    opencraft gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.opencraft/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (partial update)">
    Mescla uma atualização parcial na config existente (JSON merge patch semantics):

    - Objetos merge recursivamente
    - `null` deleta uma chave
    - Arrays substituem

    Params:

    - `raw` (string) — JSON5 com apenas as chaves para mudar
    - `baseHash` (required) — config hash de `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — mesmo que `config.apply`

    Comportamento de restart corresponde `config.apply`: coalesced pending restarts mais um cooldown de 30-segundo entre ciclos de restart.

    ```bash
    opencraft gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente

OpenCraft lê env vars do processo pai mais:

- `.env` do diretório de trabalho atual (se presente)
- `~/.opencraft/.env` (global fallback)

Nenhum arquivo overrida env vars existentes. Você pode também definir inline env vars em config:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env import (opcional)">
  Se habilitado e chaves esperadas não estão definidas, OpenCraft executa seu login shell e importa apenas as chaves faltando:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalente env var: `OPENCRAFT_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env var substitution em valores de config">
  Reference env vars em qualquer valor string de config com `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regras:

- Apenas nomes uppercase matched: `[A-Z_][A-Z0-9_]*`
- Vars missing/empty jogam um erro em load time
- Escape com `$${VAR}` para output literal
- Funciona dentro de arquivos `$include`
- Inline substitution: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
  Para fields que suportam objetos SecretRef, você pode usar:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "nano-banana-pro": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/nano-banana-pro/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Detalhes de SecretRef (incluindo `secrets.providers` para `env`/`file`/`exec`) estão em [Secrets Management](/gateway/secrets).
Credenciais suportadas paths estão listadas em [SecretRef Credential Surface](/reference/secretref-credential-surface).
</Accordion>

Veja [Environment](/help/environment) para precedência completa e sources.

## Referência completa

Para a referência field-by-field completa, veja **[Configuration Reference](/gateway/configuration-reference)**.

---

_Relacionado: [Configuration Examples](/gateway/configuration-examples) · [Configuration Reference](/gateway/configuration-reference) · [Doctor](/gateway/doctor)_
