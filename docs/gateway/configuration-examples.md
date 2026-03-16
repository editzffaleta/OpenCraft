---
summary: "Exemplos de configuração precisos para setups comuns do OpenCraft"
read_when:
  - Aprendendo como configurar o OpenCraft
  - Procurando exemplos de configuração
  - Configurando o OpenCraft pela primeira vez
title: "Exemplos de Configuração"
---

# Exemplos de Configuração

Os exemplos abaixo estão alinhados com o schema de config atual. Para a referência exaustiva e notas por campo, veja [Configuração](/gateway/configuration).

## Início rápido

### Mínimo absoluto

```json5
{
  agent: { workspace: "~/.opencraft/workspace" },
  channels: { whatsapp: { allowFrom: ["+5511999990123"] } },
}
```

Salve em `~/.opencraft/opencraft.json` e você pode enviar mensagens diretas ao bot por esse número.

### Início recomendado

```json5
{
  identity: {
    name: "Clawd",
    theme: "assistente prestativo",
    emoji: "🦞",
  },
  agent: {
    workspace: "~/.opencraft/workspace",
    model: { primary: "anthropic/claude-sonnet-4-5" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+5511999990123"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Exemplo expandido (principais opções)

> JSON5 permite comentários e vírgulas no final. JSON regular também funciona.

```json5
{
  // Ambiente + shell
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },

  // Metadados de perfil de auth (segredos ficam em auth-profiles.json)
  auth: {
    profiles: {
      "anthropic:eu@exemplo.com": {
        provider: "anthropic",
        mode: "oauth",
        email: "eu@exemplo.com",
      },
      "anthropic:trabalho": { provider: "anthropic", mode: "api_key" },
      "openai:default": { provider: "openai", mode: "api_key" },
      "openai-codex:default": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:eu@exemplo.com", "anthropic:trabalho"],
      openai: ["openai:default"],
      "openai-codex": ["openai-codex:default"],
    },
  },

  // Identidade
  identity: {
    name: "Samantha",
    theme: "preguiça prestativa",
    emoji: "🦥",
  },

  // Logging
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
  },

  // Formatação de mensagem
  messages: {
    messagePrefix: "[opencraft]",
    responsePrefix: ">",
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
  },

  // Roteamento + fila
  routing: {
    groupChat: {
      mentionPatterns: ["@opencraft", "opencraft"],
      historyLimit: 50,
    },
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
        discord: "collect",
        slack: "collect",
        signal: "collect",
        imessage: "collect",
        webchat: "collect",
      },
    },
  },

  // Tooling
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          // Fallback CLI opcional (binário Whisper):
          // { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] }
        ],
        timeoutSeconds: 120,
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },

  // Comportamento de sessão
  session: {
    scope: "per-sender",
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 60,
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.opencraft/agents/default/sessions/sessions.json",
    maintenance: {
      mode: "warn",
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duração ou false
      maxDiskBytes: "500mb", // opcional
      highWaterBytes: "400mb", // opcional (padrão 80% de maxDiskBytes)
    },
    typingIntervalSeconds: 5,
    sendPolicy: {
      default: "allow",
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
    },
  },

  // Canais
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+5511999990123"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+5511999990123"],
      groups: { "*": { requireMention: true } },
    },

    telegram: {
      enabled: true,
      botToken: "SEU_TOKEN_DE_BOT_TELEGRAM",
      allowFrom: ["123456789"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["123456789"],
      groups: { "*": { requireMention: true } },
    },

    discord: {
      enabled: true,
      token: "SEU_TOKEN_DE_BOT_DISCORD",
      dm: { enabled: true, allowFrom: ["123456789012345678"] },
      guilds: {
        "123456789012345678": {
          slug: "amigos-do-opencraft",
          requireMention: false,
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },

    slack: {
      enabled: true,
      botToken: "xoxb-SUBSTITUA_AQUI",
      appToken: "xapp-SUBSTITUA_AQUI",
      channels: {
        "#general": { allow: true, requireMention: true },
      },
      dm: { enabled: true, allowFrom: ["U123"] },
      slashCommand: {
        enabled: true,
        name: "opencraft",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
    },
  },

  // Runtime do agente
  agents: {
    defaults: {
      workspace: "~/.opencraft/workspace",
      userTimezone: "America/Sao_Paulo",
      model: {
        primary: "anthropic/claude-sonnet-4-5",
        fallbacks: ["anthropic/claude-opus-4-6", "openai/gpt-5.2"],
      },
      imageModel: {
        primary: "openrouter/anthropic/claude-sonnet-4-5",
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "anthropic/claude-sonnet-4-5": { alias: "sonnet" },
        "openai/gpt-5.2": { alias: "gpt" },
      },
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      blockStreamingDefault: "off",
      blockStreamingBreak: "text_end",
      blockStreamingChunk: {
        minChars: 800,
        maxChars: 1200,
        breakPreference: "paragraph",
      },
      blockStreamingCoalesce: {
        idleMs: 1000,
      },
      humanDelay: {
        mode: "natural",
      },
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      typingIntervalSeconds: 5,
      maxConcurrent: 3,
      heartbeat: {
        every: "30m",
        model: "anthropic/claude-sonnet-4-5",
        target: "last",
        directPolicy: "allow", // allow (padrão) | block
        to: "+5511999990123",
        prompt: "HEARTBEAT",
        ackMaxChars: 300,
      },
      memorySearch: {
        provider: "gemini",
        model: "gemini-embedding-001",
        remote: {
          apiKey: "${GEMINI_API_KEY}",
        },
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
      sandbox: {
        mode: "non-main",
        perSession: true,
        workspaceRoot: "~/.opencraft/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
        },
        browser: {
          enabled: false,
        },
      },
    },
  },

  tools: {
    allow: ["exec", "process", "read", "write", "edit", "apply_patch"],
    deny: ["browser", "canvas"],
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
    },
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+5511999990123"],
        telegram: ["123456789"],
        discord: ["123456789012345678"],
        slack: ["U123"],
        signal: ["+5511999990123"],
        imessage: ["usuario@example.com"],
        webchat: ["session:demo"],
      },
    },
  },

  // Provedores de modelo customizados
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-responses",
        authHeader: true,
        headers: { "X-Proxy-Region": "us-west" },
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            api: "openai-responses",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },

  // Jobs de cron
  cron: {
    enabled: true,
    store: "~/.opencraft/cron/cron.json",
    maxConcurrentRuns: 2,
    sessionRetention: "24h",
    runLog: {
      maxBytes: "2mb",
      keepLines: 2000,
    },
  },

  // Webhooks
  hooks: {
    enabled: true,
    path: "/hooks",
    token: "segredo-compartilhado",
    presets: ["gmail"],
    transformsDir: "~/.opencraft/hooks/transforms",
    mappings: [
      {
        id: "gmail-hook",
        match: { path: "gmail" },
        action: "agent",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}",
        textTemplate: "{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        to: "+5511999990123",
        thinking: "low",
        timeoutSeconds: 300,
        transform: {
          module: "gmail.js",
          export: "transformGmail",
        },
      },
    ],
    gmail: {
      account: "openclaw@gmail.com",
      label: "INBOX",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
    },
  },

  // Gateway + networking
  gateway: {
    mode: "local",
    port: 18789,
    bind: "loopback",
    controlUi: { enabled: true, basePath: "/opencraft" },
    auth: {
      mode: "token",
      token: "gateway-token",
      allowTailscale: true,
    },
    tailscale: { mode: "serve", resetOnExit: false },
    remote: { url: "ws://gateway.tailnet:18789", token: "remote-token" },
    reload: { mode: "hybrid", debounceMs: 300 },
  },

  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
    },
    entries: {
      "nano-banana-pro": {
        enabled: true,
        apiKey: "GEMINI_KEY_HERE",
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
    },
  },
}
```

## Padrões comuns

### Setup multi-plataforma

```json5
{
  agent: { workspace: "~/.opencraft/workspace" },
  channels: {
    whatsapp: { allowFrom: ["+5511999990123"] },
    telegram: {
      enabled: true,
      botToken: "SEU_TOKEN",
      allowFrom: ["123456789"],
    },
    discord: {
      enabled: true,
      token: "SEU_TOKEN",
      dm: { allowFrom: ["123456789012345678"] },
    },
  },
}
```

### Modo DM seguro (inbox compartilhado / DMs multi-usuário)

Se mais de uma pessoa pode enviar DM ao seu bot (múltiplas entradas em `allowFrom`, aprovações de pareamento para múltiplas pessoas, ou `dmPolicy: "open"`), habilite o **modo DM seguro** para que DMs de remetentes diferentes não compartilhem um contexto por padrão:

```json5
{
  // Modo DM seguro (recomendado para agentes de DM multi-usuário ou sensíveis)
  session: { dmScope: "per-channel-peer" },

  channels: {
    // Exemplo: inbox multi-usuário WhatsApp
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+5511999990123", "+5511999990124"],
    },

    // Exemplo: inbox multi-usuário Discord
    discord: {
      enabled: true,
      token: "SEU_TOKEN_DE_BOT_DISCORD",
      dm: { enabled: true, allowFrom: ["123456789012345678", "987654321098765432"] },
    },
  },
}
```

Para Discord/Slack/Google Chat/MS Teams/Mattermost/IRC, a autorização de remetente é por ID por padrão.
Habilite correspondência mutável por nome/email/nick com o `dangerouslyAllowNameMatching: true` de cada canal apenas se você aceitar explicitamente esse risco.

### OAuth com failover para chave API

```json5
{
  auth: {
    profiles: {
      "anthropic:assinatura": {
        provider: "anthropic",
        mode: "oauth",
        email: "eu@exemplo.com",
      },
      "anthropic:api": {
        provider: "anthropic",
        mode: "api_key",
      },
    },
    order: {
      anthropic: ["anthropic:assinatura", "anthropic:api"],
    },
  },
  agent: {
    workspace: "~/.opencraft/workspace",
    model: {
      primary: "anthropic/claude-sonnet-4-5",
      fallbacks: ["anthropic/claude-opus-4-6"],
    },
  },
}
```

### Setup-token Anthropic + chave API, fallback MiniMax

<Warning>
O uso de setup-token Anthropic fora do Claude Code foi restringido para alguns
usuários no passado. Trate isso como risco de escolha do usuário e verifique os termos
atuais da Anthropic antes de depender de auth de assinatura.
</Warning>

```json5
{
  auth: {
    profiles: {
      "anthropic:assinatura": {
        provider: "anthropic",
        mode: "oauth",
        email: "usuario@exemplo.com",
      },
      "anthropic:api": {
        provider: "anthropic",
        mode: "api_key",
      },
    },
    order: {
      anthropic: ["anthropic:assinatura", "anthropic:api"],
    },
  },
  models: {
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        api: "anthropic-messages",
        apiKey: "${MINIMAX_API_KEY}",
      },
    },
  },
  agent: {
    workspace: "~/.opencraft/workspace",
    model: {
      primary: "anthropic/claude-opus-4-6",
      fallbacks: ["minimax/MiniMax-M2.5"],
    },
  },
}
```

### Bot de trabalho (acesso restrito)

```json5
{
  identity: {
    name: "WorkBot",
    theme: "assistente profissional",
  },
  agent: {
    workspace: "~/work-opencraft",
    elevated: { enabled: false },
  },
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      channels: {
        "#engenharia": { allow: true, requireMention: true },
        "#general": { allow: true, requireMention: true },
      },
    },
  },
}
```

### Somente modelos locais

```json5
{
  agent: {
    workspace: "~/.opencraft/workspace",
    model: { primary: "lmstudio/minimax-m2.5-gs32" },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Dicas

- Se você definir `dmPolicy: "open"`, a lista `allowFrom` correspondente deve incluir `"*"`.
- IDs de provedor diferem (números de telefone, IDs de usuário, IDs de canal). Use a documentação do provedor para confirmar o formato.
- Seções opcionais para adicionar depois: `web`, `browser`, `ui`, `discovery`, `canvasHost`, `talk`, `signal`, `imessage`.
- Veja [Provedores](/providers) e [Resolução de Problemas](/gateway/troubleshooting) para notas de configuração mais profundas.
