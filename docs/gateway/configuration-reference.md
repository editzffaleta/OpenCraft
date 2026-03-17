---
title: "Referência de Configuração"
description: "Referência campo a campo completa para ~/.opencraft/opencraft.json"
summary: "Referência completa para cada chave de configuração do OpenCraft, padrões e configurações de canal"
read_when:
  - Você precisa de semântica exata de configuração em nível de campo ou padrões
  - Você está validando blocos de configuração de canal, modelo, gateway ou ferramentas
---

# Referência de Configuração

Todos os campos disponíveis em `~/.opencraft/opencraft.json`. Para uma visão geral orientada a tarefas, veja [Configuração](/gateway/configuration).

O formato de configuração é **JSON5** (comentários + vírgulas finais permitidas). Todos os campos são opcionais — o OpenCraft usa valores padrão seguros quando omitidos.

---

## Canais

Cada canal inicia automaticamente quando sua seção de configuração existe (exceto se `enabled: false`).

### Acesso a DMs e grupos

Todos os canais suportam políticas de DM e de grupo:

| Política de DM     | Comportamento                                                                       |
| ------------------ | ----------------------------------------------------------------------------------- |
| `pairing` (padrão) | Remetentes desconhecidos recebem um código de pareamento único; o dono deve aprovar |
| `allowlist`        | Apenas remetentes em `allowFrom` (ou na lista de pareamento aprovados)              |
| `open`             | Permite todos os DMs de entrada (requer `allowFrom: ["*"]`)                         |
| `disabled`         | Ignora todos os DMs de entrada                                                      |

| Política de grupo    | Comportamento                                                              |
| -------------------- | -------------------------------------------------------------------------- |
| `allowlist` (padrão) | Apenas grupos que correspondem à lista de permissões configurada           |
| `open`               | Ignora listas de permissão de grupo (filtragem por menção ainda se aplica) |
| `disabled`           | Bloqueia todas as mensagens de grupo/sala                                  |

<Note>
`channels.defaults.groupPolicy` define o padrão quando o `groupPolicy` de um provedor não está configurado.
Códigos de pareamento expiram após 1 hora. Solicitações de pareamento de DM pendentes são limitadas a **3 por canal**.
Se um bloco de provedor estiver completamente ausente (`channels.<provider>` ausente), a política de grupo em runtime volta para `allowlist` (fail-closed) com um aviso na inicialização.
</Note>

### Substituições de modelo por canal

Use `channels.modelByChannel` para fixar IDs de canal específicos em um modelo. Os valores aceitam `provider/model` ou aliases de modelo configurados. O mapeamento de canal se aplica quando uma sessão ainda não tem uma substituição de modelo (por exemplo, definida via `/model`).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Padrões de canal e heartbeat

Use `channels.defaults` para comportamento compartilhado de política de grupo e heartbeat entre provedores:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: política de grupo de fallback quando o `groupPolicy` em nível de provedor não está configurado.
- `channels.defaults.heartbeat.showOk`: incluir status de canais saudáveis na saída do heartbeat.
- `channels.defaults.heartbeat.showAlerts`: incluir status degradados/com erro na saída do heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderizar saída de heartbeat em estilo de indicador compacto.

### WhatsApp

O WhatsApp funciona pelo canal web do gateway (Baileys Web). Inicia automaticamente quando uma sessão vinculada existe.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="WhatsApp com múltiplas contas">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.opencraft/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- Comandos de saída usam a conta `default` por padrão se presente; caso contrário, o primeiro id de conta configurado (ordenado).
- O `channels.whatsapp.defaultAccount` opcional substitui essa seleção de conta padrão de fallback quando corresponde a um id de conta configurado.
- O diretório de auth Baileys de conta única legado é migrado pelo `opencraft doctor` para `whatsapp/default`.
- Substituições por conta: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token do bot: `channels.telegram.botToken` ou `channels.telegram.tokenFile` (apenas arquivo regular; symlinks rejeitados), com `TELEGRAM_BOT_TOKEN` como fallback para a conta padrão.
- O `channels.telegram.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um id de conta configurado.
- Em configurações de múltiplas contas (2+ ids de conta), defina um padrão explícito (`channels.telegram.defaultAccount` ou `channels.telegram.accounts.default`) para evitar roteamento de fallback; o `opencraft doctor` avisa quando está faltando ou inválido.
- `configWrites: false` bloqueia escritas de configuração iniciadas pelo Telegram (migrações de ID de supergrupo, `/config set|unset`).
- Entradas `bindings[]` de nível superior com `type: "acp"` configuram vinculações ACP persistentes para tópicos de fórum (use o canônico `chatId:topic:topicId` em `match.peer.id`). A semântica dos campos é compartilhada em [Agentes ACP](/tools/acp-agents#channel-specific-settings).
- Pré-visualizações de stream do Telegram usam `sendMessage` + `editMessageText` (funciona em chats diretos e de grupo).
- Política de retry: veja [Política de retry](/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["opencraft-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-opencraft",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token: `channels.discord.token`, com `DISCORD_BOT_TOKEN` como fallback para a conta padrão.
- Chamadas de saída diretas que fornecem um `token` Discord explícito usam esse token para a chamada; as configurações de retry/política de conta ainda vêm da conta selecionada no snapshot de runtime ativo.
- O `channels.discord.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um id de conta configurado.
- Use `user:<id>` (DM) ou `channel:<id>` (canal de guilda) para destinos de entrega; IDs numéricos simples são rejeitados.
- Slugs de guilda são minúsculos com espaços substituídos por `-`; chaves de canal usam o nome em slug (sem `#`). Prefira IDs de guilda.
- Mensagens de autoria do bot são ignoradas por padrão. `allowBots: true` as habilita; use `allowBots: "mentions"` para aceitar apenas mensagens de bot que mencionam o bot (próprias mensagens ainda filtradas).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e substituições de canal) descarta mensagens que mencionam outro usuário ou role mas não o bot (excluindo @everyone/@here).
- `maxLinesPerMessage` (padrão 17) divide mensagens altas mesmo quando abaixo de 2000 caracteres.
- `channels.discord.threadBindings` controla o roteamento vinculado a threads do Discord:
  - `enabled`: substituição Discord para recursos de sessão vinculados a thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, e entrega/roteamento vinculados)
  - `idleHours`: substituição Discord para desvincular automaticamente por inatividade em horas (`0` desabilita)
  - `maxAgeHours`: substituição Discord para idade máxima rígida em horas (`0` desabilita)
  - `spawnSubagentSessions`: switch opt-in para criação/vinculação automática de thread `sessions_spawn({ thread: true })`
- Entradas `bindings[]` de nível superior com `type: "acp"` configuram vinculações ACP persistentes para canais e threads (use o id do canal/thread em `match.peer.id`). A semântica dos campos é compartilhada em [Agentes ACP](/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` define a cor de destaque para contêineres de componentes v2 do Discord.
- `channels.discord.voice` habilita conversas em canais de voz do Discord e substituições opcionais de auto-join + TTS.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` passam para as opções DAVE do `@discordjs/voice` (`true` e `24` por padrão).
- O OpenCraft também tenta recuperação de recepção de voz saindo/reentrando em uma sessão de voz após falhas repetidas de descriptografia.
- `channels.discord.streaming` é a chave de modo de stream canônica. Os valores legados `streamMode` e `streaming` booleano são migrados automaticamente.
- `channels.discord.autoPresence` mapeia a disponibilidade de runtime para a presença do bot (saudável => online, degradado => idle, exausto => dnd) e permite substituições opcionais de texto de status.
- `channels.discord.dangerouslyAllowNameMatching` reativa a correspondência mutável de nome/tag (modo de compatibilidade break-glass).

**Modos de notificação de reação:** `off` (nenhuma), `own` (mensagens do bot, padrão), `all` (todas as mensagens), `allowlist` (de `guilds.<id>.users` em todas as mensagens).

### Google Chat (Bate-papo do Google)

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- JSON de conta de serviço: inline (`serviceAccount`) ou baseado em arquivo (`serviceAccountFile`).
- SecretRef de conta de serviço também é suportado (`serviceAccountRef`).
- Fallbacks de env: `GOOGLE_CHAT_SERVICE_ACCOUNT` ou `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Use `spaces/<spaceId>` ou `users/<userId>` para destinos de entrega.
- `channels.googlechat.dangerouslyAllowNameMatching` reativa a correspondência mutável de principal de e-mail (modo de compatibilidade break-glass).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "opencraft",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: "partial", // off | partial | block | progress (preview mode)
      nativeStreaming: true, // use Slack native streaming API when streaming=partial
      mediaMaxMb: 20,
    },
  },
}
```

- **Modo socket** requer `botToken` e `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` para fallback de env da conta padrão).
- **Modo HTTP** requer `botToken` mais `signingSecret` (na raiz ou por conta).
- `configWrites: false` bloqueia escritas de configuração iniciadas pelo Slack.
- O `channels.slack.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um id de conta configurado.
- `channels.slack.streaming` é a chave de modo de stream canônica. Os valores legados `streamMode` e `streaming` booleano são migrados automaticamente.
- Use `user:<id>` (DM) ou `channel:<id>` para destinos de entrega.

**Modos de notificação de reação:** `off`, `own` (padrão), `all`, `allowlist` (de `reactionAllowlist`).

**Isolamento de sessão por thread:** `thread.historyScope` é por thread (padrão) ou compartilhado pelo canal. `thread.inheritParent` copia o transcript do canal pai para novas threads.

- `typingReaction` adiciona uma reação temporária à mensagem Slack de entrada enquanto uma resposta está sendo processada, depois a remove ao concluir. Use um shortcode de emoji do Slack como `"hourglass_flowing_sand"`.

| Grupo de ação | Padrão  | Notas                        |
| ------------- | ------- | ---------------------------- |
| reactions     | ativado | Reagir + listar reações      |
| messages      | ativado | Ler/enviar/editar/deletar    |
| pins          | ativado | Fixar/desafixar/listar       |
| memberInfo    | ativado | Informações de membro        |
| emojiList     | ativado | Lista de emoji personalizado |

### Mattermost

O Mattermost vem como plugin: `opencraft plugins install @openclaw/mattermost`.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Modos de chat: `oncall` (responder em @-menção, padrão), `onmessage` (toda mensagem), `onchar` (mensagens que começam com prefixo gatilho).

Quando comandos nativos do Mattermost estão habilitados:

- `commands.callbackPath` deve ser um caminho (por exemplo `/api/channels/mattermost/command`), não uma URL completa.
- `commands.callbackUrl` deve resolver para o endpoint do gateway do OpenCraft e ser alcançável pelo servidor Mattermost.
- Para hosts de callback privados/tailnet/internos, o Mattermost pode requerer
  `ServiceSettings.AllowedUntrustedInternalConnections` para incluir o host/domínio do callback.
  Use valores de host/domínio, não URLs completas.
- `channels.mattermost.configWrites`: permitir ou negar escritas de configuração iniciadas pelo Mattermost.
- `channels.mattermost.requireMention`: requer `@menção` antes de responder em canais.
- O `channels.mattermost.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um id de conta configurado.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Modos de notificação de reação:** `off`, `own` (padrão), `all`, `allowlist` (de `reactionAllowlist`).

- `channels.signal.account`: fixa a inicialização do canal em uma identidade de conta Signal específica.
- `channels.signal.configWrites`: permitir ou negar escritas de configuração iniciadas pelo Signal.
- O `channels.signal.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um id de conta configurado.

### BlueBubbles

O BlueBubbles é o caminho recomendado para iMessage (respaldado por plugin, configurado em `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- Caminhos de chave principais aqui: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- O `channels.bluebubbles.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um id de conta configurado.
- A configuração completa do canal BlueBubbles está documentada em [BlueBubbles](/channels/bluebubbles).

### iMessage

O OpenCraft inicia `imsg rpc` (JSON-RPC sobre stdio). Sem daemon ou porta necessários.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- O `channels.imessage.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um id de conta configurado.

- Requer Acesso Total ao Disco para o banco de dados Messages.
- Prefira alvos `chat_id:<id>`. Use `imsg chats --limit 20` para listar chats.
- `cliPath` pode apontar para um wrapper SSH; defina `remoteHost` (`host` ou `user@host`) para busca de anexos via SCP.
- `attachmentRoots` e `remoteAttachmentRoots` restringem caminhos de anexos de entrada (padrão: `/Users/*/Library/Messages/Attachments`).
- SCP usa verificação estrita de chave de host, então certifique-se de que a chave do host relay já existe em `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permitir ou negar escritas de configuração iniciadas pelo iMessage.

<Accordion title="Exemplo de wrapper SSH para iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Microsoft Teams

O Microsoft Teams é respaldado por extensão e configurado em `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- Caminhos de chave principais aqui: `channels.msteams`, `channels.msteams.configWrites`.
- A configuração completa do Teams (credenciais, webhook, política de DM/grupo, substituições por equipe/por canal) está documentada em [Microsoft Teams](/channels/msteams).

### IRC

O IRC é respaldado por extensão e configurado em `channels.irc`.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Caminhos de chave principais aqui: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- O `channels.irc.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um id de conta configurado.
- A configuração completa do canal IRC (host/porta/TLS/canais/listas de permissão/filtragem de menção) está documentada em [IRC](/channels/irc).

### Múltiplas contas (todos os canais)

Execute múltiplas contas por canal (cada uma com seu próprio `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` é usado quando `accountId` é omitido (CLI + roteamento).
- Tokens de env se aplicam apenas à conta **default**.
- Configurações de canal base se aplicam a todas as contas, exceto se substituídas por conta.
- Use `bindings[].match.accountId` para rotear cada conta para um agente diferente.
- Se você adicionar uma conta não padrão via `opencraft channels add` (ou onboarding de canal) ainda em uma configuração de canal de nível superior de conta única, o OpenCraft move os valores de conta única de nível superior com escopo de conta para `channels.<channel>.accounts.default` primeiro, para que a conta original continue funcionando.
- Vinculações apenas de canal existentes (sem `accountId`) continuam correspondendo à conta padrão; vinculações com escopo de conta permanecem opcionais.
- `opencraft doctor --fix` também repara formas mistas movendo valores de conta única de nível superior com escopo de conta para `accounts.default` quando contas nomeadas existem mas `default` está faltando.

### Outros canais de extensão

Muitos canais de extensão são configurados como `channels.<id>` e documentados em suas páginas de canal dedicadas (por exemplo Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat e Twitch).
Veja o índice completo de canais: [Canais](/channels).

### Filtragem de menção em chat de grupo

Mensagens de grupo exigem **menção** por padrão (menção de metadados ou padrões regex seguros). Aplica-se a chats de grupo do WhatsApp, Telegram, Discord, Google Chat e iMessage.

**Tipos de menção:**

- **Menções de metadados**: @-menções nativas da plataforma. Ignoradas no modo de self-chat do WhatsApp.
- **Padrões de texto**: Padrões regex seguros em `agents.list[].groupChat.mentionPatterns`. Padrões inválidos e repetição aninhada insegura são ignorados.
- A filtragem de menção é aplicada apenas quando a detecção é possível (menções nativas ou pelo menos um padrão).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@opencraft", "opencraft"] } }],
  },
}
```

`messages.groupChat.historyLimit` define o padrão global. Canais podem substituir com `channels.<channel>.historyLimit` (ou por conta). Defina `0` para desabilitar.

#### Limites de histórico de DM

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Resolução: substituição por DM → padrão do provedor → sem limite (todos retidos).

Suportados: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modo de self-chat

Inclua seu próprio número em `allowFrom` para habilitar o modo de self-chat (ignora @-menções nativas, responde apenas a padrões de texto):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@opencraft"] },
      },
    ],
  },
}
```

### Comandos (tratamento de comandos de chat)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    debug: false, // allow /debug
    restart: false, // allow /restart + gateway restart tool
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Detalhes de comandos">

- Comandos de texto devem ser mensagens **independentes** com `/` inicial.
- `native: "auto"` ativa comandos nativos para Discord/Telegram, deixa Slack desligado.
- Substitua por canal: `channels.discord.commands.native` (bool ou `"auto"`). `false` limpa comandos previamente registrados.
- `channels.telegram.customCommands` adiciona entradas extras ao menu do bot Telegram.
- `bash: true` habilita `! <cmd>` para shell do host. Requer `tools.elevated.enabled` e remetente em `tools.elevated.allowFrom.<channel>`.
- `config: true` habilita `/config` (lê/escreve `opencraft.json`). Para clientes gateway `chat.send`, escritas persistentes `/config set|unset` também requerem `operator.admin`; `/config show` somente leitura permanece disponível para clientes operadores com escopo de escrita normal.
- `channels.<provider>.configWrites` controla mutações de configuração por canal (padrão: true).
- Para canais de múltiplas contas, `channels.<provider>.accounts.<id>.configWrites` também controla escritas que visam essa conta (por exemplo `/allowlist --config --account <id>` ou `/config set channels.<provider>.accounts.<id>...`).
- `allowFrom` é por provedor. Quando definido, é a **única** fonte de autorização (listas de permissão/pareamento de canal e `useAccessGroups` são ignorados).
- `useAccessGroups: false` permite que comandos ignorem políticas de grupo de acesso quando `allowFrom` não está definido.

</Accordion>

---

## Padrões de agente

### `agents.defaults.workspace`

Padrão: `~/.opencraft/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.opencraft/workspace" } },
}
```

### `agents.defaults.repoRoot`

Raiz de repositório opcional exibida na linha Runtime do prompt do sistema. Se não definido, o OpenCraft detecta automaticamente subindo a partir do workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/opencraft" } },
}
```

### `agents.defaults.skipBootstrap`

Desabilita a criação automática de arquivos de bootstrap do workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por arquivo de bootstrap do workspace antes de truncar. Padrão: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Máximo de caracteres totais injetados em todos os arquivos de bootstrap do workspace. Padrão: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controla o texto de aviso visível ao agente quando o contexto de bootstrap é truncado.
Padrão: `"once"`.

- `"off"`: nunca injeta texto de aviso no prompt do sistema.
- `"once"`: injeta aviso uma vez por assinatura de truncamento única (recomendado).
- `"always"`: injeta aviso em toda execução quando há truncamento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Tamanho máximo em pixels para o lado mais longo de imagens em blocos de imagem de transcript/ferramenta antes das chamadas ao provedor.
Padrão: `1200`.

Valores menores geralmente reduzem o uso de tokens de visão e o tamanho do payload da requisição para execuções com muitas capturas de tela.
Valores maiores preservam mais detalhes visuais.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuso horário para contexto do prompt do sistema (não timestamps de mensagem). Usa o fuso do host como fallback.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato de hora no prompt do sistema. Padrão: `auto` (preferência do SO).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.5": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.5"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Forma de string define apenas o modelo primário.
  - Forma de objeto define primário mais modelos de failover ordenados.
- `imageModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pelo caminho da ferramenta `image` como sua configuração de modelo de visão.
  - Também usado como roteamento de fallback quando o modelo selecionado/padrão não pode aceitar entrada de imagem.
- `pdfModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela ferramenta `pdf` para roteamento de modelo.
  - Se omitido, a ferramenta PDF usa `imageModel` como fallback, depois os padrões do provedor.
- `pdfMaxBytesMb`: limite de tamanho de PDF padrão para a ferramenta `pdf` quando `maxBytesMb` não é passado no momento da chamada.
- `pdfMaxPages`: máximo de páginas padrão consideradas pelo modo de fallback de extração na ferramenta `pdf`.
- `model.primary`: formato `provider/model` (ex. `anthropic/claude-opus-4-6`). Se você omitir o provedor, o OpenCraft assume `anthropic` (obsoleto).
- `models`: o catálogo de modelos configurado e lista de permissão para `/model`. Cada entrada pode incluir `alias` (atalho) e `params` (específico do provedor, por exemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- Precedência de mesclagem de `params` (config): `agents.defaults.models["provider/model"].params` é a base, então `agents.list[].params` (id de agente correspondente) substitui por chave.
- Escritores de config que mutam esses campos (por exemplo `/models set`, `/models set-image`, e comandos de adicionar/remover fallback) salvam a forma canônica de objeto e preservam listas de fallback existentes quando possível.
- `maxConcurrent`: máximo de execuções de agente paralelas entre sessões (cada sessão ainda serializada). Padrão: 1.

**Atalhos de alias integrados** (só se aplicam quando o modelo está em `agents.defaults.models`):

| Alias               | Model                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5-mini`                    |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Seus aliases configurados sempre prevalecem sobre os padrões.

Os modelos Z.AI GLM-4.x habilitam o modo de thinking automaticamente, exceto se você definir `--thinking off` ou configurar `agents.defaults.models["zai/<model>"].params.thinking` você mesmo.
Os modelos Z.AI habilitam `tool_stream` por padrão para streaming de chamadas de ferramentas. Defina `agents.defaults.models["zai/<model>"].params.tool_stream` como `false` para desabilitar.
Os modelos Anthropic Claude 4.6 usam thinking `adaptive` por padrão quando nenhum nível de thinking explícito está definido.

### `agents.defaults.cliBackends`

Backends CLI opcionais para execuções de fallback somente texto (sem chamadas de ferramentas). Útil como backup quando provedores de API falham.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Backends CLI são texto-primeiro; ferramentas sempre desabilitadas.
- Sessões suportadas quando `sessionArg` está definido.
- Pass-through de imagem suportado quando `imageArg` aceita caminhos de arquivo.

### `agents.defaults.heartbeat`

Execuções periódicas de heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.2-mini",
        includeReasoning: false,
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: string de duração (ms/s/m/h). Padrão: `30m`.
- `suppressToolErrorWarnings`: quando true, suprime payloads de aviso de erro de ferramenta durante execuções de heartbeat.
- `directPolicy`: política de entrega direta/DM. `allow` (padrão) permite entrega a destino direto. `block` suprime entrega a destino direto e emite `reason=dm-blocked`.
- `lightContext`: quando true, execuções de heartbeat usam contexto de bootstrap leve e mantêm apenas `HEARTBEAT.md` dos arquivos de bootstrap do workspace.
- `isolatedSession`: quando true, cada heartbeat executa em uma sessão nova sem histórico de conversa anterior. Mesmo padrão de isolamento que cron `sessionTarget: "isolated"`. Reduz o custo de tokens por heartbeat de ~100K para ~2-5K tokens.
- Por agente: defina `agents.list[].heartbeat`. Quando qualquer agente define `heartbeat`, **apenas esses agentes** executam heartbeats.
- Heartbeats executam turnos completos de agente — intervalos menores consomem mais tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-5", // optional compaction-only model override
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` ou `safeguard` (sumarização em partes para históricos longos). Veja [Compactação](/concepts/compaction).
- `identifierPolicy`: `strict` (padrão), `off`, ou `custom`. `strict` antepõe orientações integradas de retenção de identificadores opacos durante a sumarização de compactação.
- `identifierInstructions`: texto de preservação de identificadores personalizado opcional usado quando `identifierPolicy=custom`.
- `postCompactionSections`: nomes de seção H2/H3 do AGENTS.md opcionais para reinjetar após compactação. Padrão: `["Session Startup", "Red Lines"]`; defina `[]` para desabilitar a reinjeção. Quando não definido ou explicitamente definido para esse par padrão, os cabeçalhos mais antigos `Every Session`/`Safety` também são aceitos como fallback legado.
- `model`: substituição opcional `provider/model-id` apenas para sumarização de compactação. Use quando a sessão principal deve manter um modelo mas os resumos de compactação devem executar em outro; quando não definido, a compactação usa o modelo primário da sessão.
- `memoryFlush`: turno agente silencioso antes da auto-compactação para armazenar memórias duráveis. Ignorado quando o workspace é somente leitura.

### `agents.defaults.contextPruning`

Poda **resultados antigos de ferramentas** do contexto em memória antes de enviar ao LLM. **Não** modifica o histórico de sessão em disco.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Comportamento do modo cache-ttl">

- `mode: "cache-ttl"` habilita passagens de poda.
- `ttl` controla com que frequência a poda pode executar novamente (após o último toque no cache).
- A poda faz soft-trim em resultados de ferramentas superdimensionados primeiro, depois hard-clear em resultados de ferramentas mais antigos se necessário.

**Soft-trim** mantém início + fim e insere `...` no meio.

**Hard-clear** substitui todo o resultado da ferramenta pelo placeholder.

Notas:

- Blocos de imagem nunca são cortados/limpos.
- Proporções são baseadas em caracteres (aproximadas), não em contagens exatas de tokens.
- Se existirem menos de `keepLastAssistants` mensagens de assistente, a poda é ignorada.

</Accordion>

Veja [Poda de Sessão](/concepts/session-pruning) para detalhes de comportamento.

### Streaming em bloco

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Canais não-Telegram requerem `*.blockStreaming: true` explícito para habilitar respostas em bloco.
- Substituições de canal: `channels.<channel>.blockStreamingCoalesce` (e variantes por conta). Signal/Slack/Discord/Google Chat padrão `minChars: 1500`.
- `humanDelay`: pausa aleatória entre respostas em bloco. `natural` = 800–2500ms. Substituição por agente: `agents.list[].humanDelay`.

Veja [Streaming](/concepts/streaming) para detalhes de comportamento + chunking.

### Indicadores de digitação

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Padrões: `instant` para chats diretos/menções, `message` para chats de grupo sem menção.
- Substituições por sessão: `session.typingMode`, `session.typingIntervalSeconds`.

Veja [Indicadores de Digitação](/concepts/typing-indicators).

### `agents.defaults.sandbox`

**Sandboxing Docker** opcional para o agente embutido. Veja [Sandboxing](/gateway/sandboxing) para o guia completo.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.opencraft/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser", // rede Docker interna; não alterar
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Detalhes do sandbox">

**Acesso ao workspace:**

- `none`: workspace de sandbox por escopo em `~/.opencraft/sandboxes`
- `ro`: workspace de sandbox em `/workspace`, workspace do agente montado somente leitura em `/agent`
- `rw`: workspace do agente montado leitura/escrita em `/workspace`

**Escopo:**

- `session`: contêiner + workspace por sessão
- `agent`: um contêiner + workspace por agente (padrão)
- `shared`: contêiner e workspace compartilhados (sem isolamento entre sessões)

**`setupCommand`** executa uma vez após a criação do contêiner (via `sh -lc`). Requer saída de rede, root gravável, usuário root.

**Contêineres padrão com `network: "none"`** — defina como `"bridge"` (ou uma rede bridge personalizada) se o agente precisar de acesso de saída.
`"host"` é bloqueado. `"container:<id>"` é bloqueado por padrão, exceto se você definir explicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Anexos de entrada** são colocados em `media/inbound/*` no workspace ativo.

**`docker.binds`** monta diretórios host adicionais; vinculações globais e por agente são mescladas.

**Browser em sandbox** (`sandbox.browser.enabled`): Chromium + CDP em um contêiner. URL do noVNC injetada no prompt do sistema. Não requer `browser.enabled` em `opencraft.json`.
O acesso de observador noVNC usa autenticação VNC por padrão e o OpenCraft emite uma URL de token de curta duração (em vez de expor a senha na URL compartilhada).

- `allowHostControl: false` (padrão) bloqueia sessões em sandbox de visar o browser do host.
- `network` padrão é `openclaw-sandbox-browser` (rede bridge dedicada). Defina como `bridge` apenas quando você explicitamente quiser conectividade bridge global.
- `cdpSourceRange` restringe opcionalmente a entrada CDP na borda do contêiner a um intervalo CIDR (por exemplo `172.21.0.1/32`).
- `sandbox.browser.binds` monta diretórios host adicionais apenas no contêiner do browser em sandbox. Quando definido (incluindo `[]`), substitui `docker.binds` para o contêiner do browser.
- Os padrões de inicialização são definidos em `scripts/sandbox-browser-entrypoint.sh` e ajustados para hosts de contêiner:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derivado de OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (default enabled)
  - `--disable-3d-apis`, `--disable-software-rasterizer` e `--disable-gpu` estão
    habilitados por padrão e podem ser desabilitados com
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se o uso de WebGL/3D exigir.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` reabilita extensões se seu fluxo de trabalho
    depender delas.
  - `--renderer-process-limit=2` pode ser alterado com
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; defina `0` para usar o
    limite de processo padrão do Chromium.
  - mais `--no-sandbox` e `--disable-setuid-sandbox` quando `noSandbox` está habilitado.
  - Os padrões são a linha de base da imagem do contêiner; use uma imagem de browser personalizada com um
    entrypoint personalizado para alterar os padrões do contêiner.

</Accordion>

Construir imagens:

```bash
scripts/sandbox-setup.sh           # imagem principal do sandbox
scripts/sandbox-browser-setup.sh   # imagem de browser opcional
```

### `agents.list` (substituições por agente)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.opencraft/workspace",
        agentDir: "~/.opencraft/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@opencraft"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/opencraft",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: id estável do agente (obrigatório).
- `default`: quando múltiplos estão definidos, o primeiro prevalece (aviso registrado). Se nenhum definido, a primeira entrada da lista é o padrão.
- `model`: forma de string substitui apenas `primary`; forma de objeto `{ primary, fallbacks }` substitui ambos (`[]` desabilita fallbacks globais). Jobs cron que apenas substituem `primary` ainda herdam fallbacks padrão, exceto se você definir `fallbacks: []`.
- `params`: parâmetros de stream por agente mesclados sobre a entrada de modelo selecionada em `agents.defaults.models`. Use para substituições específicas do agente como `cacheRetention`, `temperature` ou `maxTokens` sem duplicar todo o catálogo de modelos.
- `runtime`: descritor de runtime opcional por agente. Use `type: "acp"` com padrões de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando o agente deve padrão para sessões ACP harness.
- `identity.avatar`: caminho relativo ao workspace, URL `http(s)`, ou URI `data:`.
- `identity` deriva padrões: `ackReaction` de `emoji`, `mentionPatterns` de `name`/`emoji`.
- `subagents.allowAgents`: lista de permissão de ids de agente para `sessions_spawn` (`["*"]` = qualquer; padrão: apenas o mesmo agente).
- Proteção de herança de sandbox: se a sessão solicitante está em sandbox, `sessions_spawn` rejeita alvos que executariam sem sandbox.

---

## Roteamento multi-agente

Execute múltiplos agentes isolados dentro de um Gateway. Veja [Multi-Agente](/concepts/multi-agent).

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

### Campos de correspondência de vinculação

- `type` (opcional): `route` para roteamento normal (tipo ausente padrão para route), `acp` para vinculações de conversa ACP persistentes.
- `match.channel` (obrigatório)
- `match.accountId` (opcional; `*` = qualquer conta; omitido = conta padrão)
- `match.peer` (opcional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcional; específico do canal)
- `acp` (opcional; apenas para `type: "acp"`): `{ mode, label, cwd, backend }`

**Ordem de correspondência determinística:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exato, sem peer/guild/team)
5. `match.accountId: "*"` (para todo o canal)
6. Agente padrão

Dentro de cada nível, a primeira entrada `bindings` correspondente prevalece.

Para entradas `type: "acp"`, o OpenCraft resolve por identidade exata da conversa (`match.channel` + conta + `match.peer.id`) e não usa a ordem de nível de vinculação de rota acima.

### Perfis de acesso por agente

<Accordion title="Acesso total (sem sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.opencraft/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Ferramentas somente leitura + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.opencraft/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Sem acesso ao sistema de arquivos (apenas mensagens)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.opencraft/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Veja [Sandbox e Ferramentas Multi-Agente](/tools/multi-agent-sandbox-tools) para detalhes de precedência.

---

## Sessão

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.opencraft/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Detalhes dos campos de sessão">

- **`dmScope`**: como os DMs são agrupados.
  - `main`: todos os DMs compartilham a sessão principal.
  - `per-peer`: isola por id de remetente entre canais.
  - `per-channel-peer`: isola por canal + remetente (recomendado para caixas de entrada multi-usuário).
  - `per-account-channel-peer`: isola por conta + canal + remetente (recomendado para multi-conta).
- **`identityLinks`**: mapeia ids canônicos para peers com prefixo de provedor para compartilhamento de sessão entre canais.
- **`reset`**: política de reset primária. `daily` reseta no `atHour` local; `idle` reseta após `idleMinutes`. Quando ambos configurados, o que expirar primeiro prevalece.
- **`resetByType`**: substituições por tipo (`direct`, `group`, `thread`). O legado `dm` é aceito como alias para `direct`.
- **`parentForkMaxTokens`**: máximo de `totalTokens` da sessão pai permitido ao criar uma sessão de thread bifurcada (padrão `100000`).
  - Se `totalTokens` do pai estiver acima deste valor, o OpenCraft inicia uma sessão de thread nova em vez de herdar o histórico de transcript do pai.
  - Defina `0` para desabilitar esta proteção e sempre permitir bifurcação do pai.
- **`mainKey`**: campo legado. O runtime agora sempre usa `"main"` para o bucket principal de chat direto.
- **`sendPolicy`**: corresponde por `channel`, `chatType` (`direct|group|channel`, com alias legado `dm`), `keyPrefix`, ou `rawKeyPrefix`. Primeiro deny prevalece.
- **`maintenance`**: controles de limpeza + retenção do armazenamento de sessões.
  - `mode`: `warn` emite apenas avisos; `enforce` aplica limpeza.
  - `pruneAfter`: corte de idade para entradas obsoletas (padrão `30d`).
  - `maxEntries`: número máximo de entradas em `sessions.json` (padrão `500`).
  - `rotateBytes`: rotaciona `sessions.json` quando excede este tamanho (padrão `10mb`).
  - `resetArchiveRetention`: retenção para arquivos de transcript `*.reset.<timestamp>`. Padrão para `pruneAfter`; defina `false` para desabilitar.
  - `maxDiskBytes`: orçamento opcional de disco do diretório de sessões. No modo `warn` registra avisos; no modo `enforce` remove os artefatos/sessões mais antigos primeiro.
  - `highWaterBytes`: alvo opcional após limpeza do orçamento. Padrão para `80%` de `maxDiskBytes`.
- **`threadBindings`**: padrões globais para recursos de sessão vinculados a thread.
  - `enabled`: switch de padrão mestre (provedores podem substituir; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: padrão de desvincular automaticamente por inatividade em horas (`0` desabilita; provedores podem substituir)
  - `maxAgeHours`: padrão de idade máxima rígida em horas (`0` desabilita; provedores podem substituir)

</Accordion>

---

## Mensagens

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefixo de resposta

Substituições por canal/conta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolução (mais específico prevalece): conta → canal → global. `""` desabilita e para a cascata. `"auto"` deriva `[{identity.name}]`.

**Variáveis de template:**

| Variável          | Descrição                    | Exemplo                     |
| ----------------- | ---------------------------- | --------------------------- |
| `{model}`         | Nome curto do modelo         | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo       | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome do provedor             | `anthropic`                 |
| `{thinkingLevel}` | Nível de thinking atual      | `high`, `low`, `off`        |
| `{identity.name}` | Nome da identidade do agente | (igual a `"auto"`)          |

Variáveis são insensíveis a maiúsculas. `{think}` é um alias para `{thinkingLevel}`.

### Reação de ack

- Padrão para o `identity.emoji` do agente ativo, caso contrário `"👀"`. Defina `""` para desabilitar.
- Substituições por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordem de resolução: conta → canal → `messages.ackReaction` → fallback de identidade.
- Escopo: `group-mentions` (padrão), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: remove o ack após resposta (apenas Slack/Discord/Telegram/Google Chat).

### Debounce de entrada

Agrupa mensagens de texto rápidas do mesmo remetente em um único turno de agente. Mídia/anexos são enviados imediatamente. Comandos de controle ignoram o debounce.

### TTS (texto para fala)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.opencraft/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` controla o TTS automático. `/tts off|always|inbound|tagged` substitui por sessão.
- `summaryModel` substitui `agents.defaults.model.primary` para auto-resumo.
- `modelOverrides` está habilitado por padrão; `modelOverrides.allowProvider` padrão é `false` (opt-in).
- Chaves de API usam como fallback `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- `openai.baseUrl` substitui o endpoint de TTS da OpenAI. Ordem de resolução: config, depois `OPENAI_TTS_BASE_URL`, depois `https://api.openai.com/v1`.
- Quando `openai.baseUrl` aponta para um endpoint não-OpenAI, o OpenCraft o trata como um servidor TTS compatível com OpenAI e relaxa a validação de modelo/voz.

---

## Talk (Modo de Fala)

Padrões para o modo Talk (macOS/iOS/Android).

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    voiceAliases: {
      Clawd: "EXAVITQu4vr4xnSDxMaL",
      Roger: "CwhRBWXzGAHq8TQ4Fs17",
    },
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- IDs de voz usam como fallback `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`.
- `apiKey` e `providers.*.apiKey` aceitam strings em texto simples ou objetos SecretRef.
- O fallback `ELEVENLABS_API_KEY` se aplica apenas quando nenhuma chave de API do Talk está configurada.
- `voiceAliases` permite que diretivas Talk usem nomes amigáveis.
- `silenceTimeoutMs` controla quanto tempo o modo Talk espera após o silêncio do usuário antes de enviar o transcript. Não definido mantém a janela de pausa padrão da plataforma (`700 ms on macOS and Android, 900 ms on iOS`).

---

## Ferramentas

### Perfis de ferramentas

`tools.profile` define uma lista de permissão base antes de `tools.allow`/`tools.deny`:

O onboarding local padrão novos configs locais para `tools.profile: "coding"` quando não definido (perfis explícitos existentes são preservados).

| Perfil      | Inclui                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------- |
| `minimal`   | Apenas `session_status`                                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:sessions`, `group:memory`, `image`                    |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status` |
| `full`      | Sem restrição (igual a não definido)                                                      |

### Grupos de ferramentas

| Grupo              | Ferramentas                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process` (`bash` é aceito como alias para `exec`)                               |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                   |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                            |
| `group:web`        | `web_search`, `web_fetch`                                                                |
| `group:ui`         | `browser`, `canvas`                                                                      |
| `group:automation` | `cron`, `gateway`                                                                        |
| `group:messaging`  | `message`                                                                                |
| `group:nodes`      | `nodes`                                                                                  |
| `group:openclaw`   | Todas as ferramentas integradas (exclui plugins de provedor)                             |

### `tools.allow` / `tools.deny`

Política global de permissão/negação de ferramentas (deny prevalece). Insensível a maiúsculas, suporta curingas `*`. Aplicado mesmo quando o sandbox Docker está desligado.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Restringe ainda mais ferramentas para provedores ou modelos específicos. Ordem: perfil base → perfil do provedor → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Controla o acesso exec elevado (host):

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Substituição por agente (`agents.list[].tools.elevated`) pode apenas restringir ainda mais.
- `/elevated on|off|ask|full` armazena estado por sessão; diretivas inline se aplicam a uma única mensagem.
- `exec` elevado executa no host, ignorando o sandboxing.

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.2"],
      },
    },
  },
}
```

### `tools.loopDetection`

As verificações de segurança de loop de ferramentas estão **desabilitadas por padrão**. Defina `enabled: true` para ativar a detecção.
As configurações podem ser definidas globalmente em `tools.loopDetection` e substituídas por agente em `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: máximo de histórico de chamadas de ferramentas retido para análise de loop.
- `warningThreshold`: limite de padrão sem progresso repetitivo para avisos.
- `criticalThreshold`: limite repetitivo mais alto para bloquear loops críticos.
- `globalCircuitBreakerThreshold`: limite de parada rígida para qualquer execução sem progresso.
- `detectors.genericRepeat`: avisa em chamadas repetidas de mesma ferramenta/mesmos args.
- `detectors.knownPollNoProgress`: avisa/bloqueia em ferramentas de poll conhecidas (`process.poll`, `command_status`, etc.).
- `detectors.pingPong`: avisa/bloqueia em padrões de pares alternados sem progresso.
- Se `warningThreshold >= criticalThreshold` ou `criticalThreshold >= globalCircuitBreakerThreshold`, a validação falha.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Configura o entendimento de mídia de entrada (imagem/áudio/vídeo):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Campos de entrada de modelo de mídia">

**Entrada de provedor** (`type: "provider"` ou omitido):

- `provider`: id do provedor de API (`openai`, `anthropic`, `google`/`gemini`, `groq`, etc.)
- `model`: substituição de id do modelo
- `profile` / `preferredProfile`: seleção de perfil do `auth-profiles.json`

**Entrada CLI** (`type: "cli"`):

- `command`: executável a executar
- `args`: args com template (suporta `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, etc.)

**Campos comuns:**

- `capabilities`: lista opcional (`image`, `audio`, `video`). Padrões: `openai`/`anthropic`/`minimax` → imagem, `google` → imagem+áudio+vídeo, `groq` → áudio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: substituições por entrada.
- Falhas usam a próxima entrada como fallback.

A autenticação do provedor segue a ordem padrão: `auth-profiles.json` → vars de env → `models.providers.*.apiKey`.

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Controla quais sessões podem ser visadas pelas ferramentas de sessão (`sessions_list`, `sessions_history`, `sessions_send`).

Padrão: `tree` (sessão atual + sessões criadas por ela, como subagentes).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Notas:

- `self`: apenas a chave de sessão atual.
- `tree`: sessão atual + sessões criadas pela sessão atual (subagentes).
- `agent`: qualquer sessão pertencente ao id do agente atual (pode incluir outros usuários se você executar sessões por remetente sob o mesmo id de agente).
- `all`: qualquer sessão. O direcionamento entre agentes ainda requer `tools.agentToAgent`.
- Trava de sandbox: quando a sessão atual está em sandbox e `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, a visibilidade é forçada para `tree` mesmo se `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Controla o suporte a anexos inline para `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

Notas:

- Anexos são suportados apenas para `runtime: "subagent"`. O runtime ACP os rejeita.
- Arquivos são materializados no workspace filho em `.openclaw/attachments/<uuid>/` com um `.manifest.json`.
- O conteúdo do anexo é automaticamente redigido da persistência do transcript.
- Entradas Base64 são validadas com verificações estritas de alfabeto/preenchimento e uma proteção de tamanho pré-decodificação.
- Permissões de arquivo são `0700` para diretórios e `0600` para arquivos.
- A limpeza segue a política `cleanup`: `delete` sempre remove anexos; `keep` os retém apenas quando `retainOnSessionKeep: true`.

### `tools.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        model: "minimax/MiniMax-M2.5",
        maxConcurrent: 1,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: modelo padrão para subagentes criados. Se omitido, subagentes herdam o modelo do chamador.
- `runTimeoutSeconds`: timeout padrão (segundos) para `sessions_spawn` quando a chamada de ferramenta omite `runTimeoutSeconds`. `0` significa sem timeout.
- Política de ferramenta por subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provedores customizados e URLs base

O OpenCraft usa o catálogo de modelos do pi-coding-agent. Adicione provedores customizados via `models.providers` na config ou em `~/.opencraft/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
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
}
```

- Use `authHeader: true` + `headers` para necessidades de autenticação personalizada.
- Substitua a raiz de config do agente com `OPENCLAW_AGENT_DIR` (ou `PI_CODING_AGENT_DIR`).
- Precedência de mesclagem para ids de provedor correspondentes:
  - Valores `baseUrl` do `models.json` do agente não vazios prevalecem.
  - Valores `apiKey` do agente não vazios prevalecem apenas quando esse provedor não é gerenciado por SecretRef no contexto de config/auth-profile atual.
  - Valores `apiKey` de provedor gerenciados por SecretRef são atualizados a partir de marcadores de fonte (`ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de arquivo/exec) em vez de persistir segredos resolvidos.
  - Valores de header de provedor gerenciados por SecretRef são atualizados a partir de marcadores de fonte (`secretref-env:ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de arquivo/exec).
  - `apiKey`/`baseUrl` do agente vazios ou ausentes usam `models.providers` na config como fallback.
  - `contextWindow`/`maxTokens` de modelos correspondentes usam o valor maior entre config explícita e valores implícitos do catálogo.
  - Use `models.mode: "replace"` quando você quer que a config reescreva completamente o `models.json`.
  - Persistência de marcadores é autoritativa pela fonte: marcadores são escritos a partir do snapshot de config da fonte ativa (pré-resolução), não a partir de valores de segredo de runtime resolvidos.

### Detalhes dos campos de provedor

- `models.mode`: comportamento do catálogo de provedores (`merge` ou `replace`).
- `models.providers`: mapa de provedores customizados com chave por id de provedor.
- `models.providers.*.api`: adaptador de requisição (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, etc).
- `models.providers.*.apiKey`: credencial do provedor (prefira substituição SecretRef/env).
- `models.providers.*.auth`: estratégia de autenticação (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: para Ollama + `openai-completions`, injeta `options.num_ctx` nas requisições (padrão: `true`).
- `models.providers.*.authHeader`: força o transporte de credencial no header `Authorization` quando necessário.
- `models.providers.*.baseUrl`: URL base da API upstream.
- `models.providers.*.headers`: headers estáticos extras para roteamento de proxy/tenant.
- `models.providers.*.models`: entradas explícitas do catálogo de modelos do provedor.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: dica de compatibilidade opcional. Para `api: "openai-completions"` com um `baseUrl` não nativo não vazio (host não `api.openai.com`), o OpenCraft força isso para `false` em runtime. `baseUrl` vazio/omitido mantém o comportamento padrão da OpenAI.
- `models.bedrockDiscovery`: raiz de configurações de auto-descoberta do Bedrock.
- `models.bedrockDiscovery.enabled`: ligar/desligar o polling de descoberta.
- `models.bedrockDiscovery.region`: região AWS para descoberta.
- `models.bedrockDiscovery.providerFilter`: filtro opcional de id de provedor para descoberta direcionada.
- `models.bedrockDiscovery.refreshInterval`: intervalo de polling para atualização de descoberta.
- `models.bedrockDiscovery.defaultContextWindow`: janela de contexto de fallback para modelos descobertos.
- `models.bedrockDiscovery.defaultMaxTokens`: máximo de tokens de saída de fallback para modelos descobertos.

### Exemplos de provedores

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Use `cerebras/zai-glm-4.7` para Cerebras; `zai/glm-4.7` para Z.AI direto.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

Set `OPENCODE_API_KEY` (or `OPENCODE_ZEN_API_KEY`). Use `opencode/...` refs for the Zen catalog or `opencode-go/...` refs for the Go catalog. Shortcut: `opencraft onboard --auth-choice opencode-zen` ou `opencraft onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

Defina `ZAI_API_KEY`. `z.ai/*` e `z-ai/*` são aliases aceitos. Atalho: `opencraft onboard --auth-choice zai-api-key`.

- Endpoint geral: `https://api.z.ai/api/paas/v4`
- Endpoint de código (padrão): `https://api.z.ai/api/coding/paas/v4`
- Para o endpoint geral, defina um provedor customizado com a substituição de URL base.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Para o endpoint China: `baseUrl: "https://api.moonshot.cn/v1"` ou `opencraft onboard --auth-choice moonshot-api-key-cn`.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: { "kimi-coding/k2p5": { alias: "Kimi K2.5" } },
    },
  },
}
```

Compatível com Anthropic, provedor integrado. Atalho: `opencraft onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (Anthropic-compatible)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

A URL base deve omitir `/v1` (o cliente Anthropic o acrescenta). Atalho: `opencraft onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.5 (direct)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.5" },
      models: {
        "minimax/MiniMax-M2.5": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Defina `MINIMAX_API_KEY`. Atalho: `opencraft onboard --auth-choice minimax-api`.

</Accordion>

<Accordion title="Modelos locais (LM Studio)">

Veja [Modelos Locais](/gateway/local-models). Resumo: execute MiniMax M2.5 via LM Studio Responses API em hardware sério; mantenha os modelos hospedados mesclados para fallback.

</Accordion>

---

## Skills (Habilidades)

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn
    },
    entries: {
      "nano-banana-pro": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: lista de permissão opcional apenas para skills incluídas (skills gerenciadas/workspace não afetadas).
- `entries.<skillKey>.enabled: false` desabilita uma skill mesmo que incluída/instalada.
- `entries.<skillKey>.apiKey`: conveniência para skills que declaram uma var de env primária (string em texto simples ou objeto SecretRef).

---

## Plugins (Extensões)

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Carregados de `~/.opencraft/extensions`, `<workspace>/.openclaw/extensions`, mais `plugins.load.paths`.
- **Alterações de configuração requerem reinício do gateway.**
- `allow`: lista de permissão opcional (apenas plugins listados carregam). `deny` prevalece.
- `plugins.entries.<id>.apiKey`: campo de conveniência de chave de API no nível do plugin (quando suportado pelo plugin).
- `plugins.entries.<id>.env`: mapa de variável de env com escopo do plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, o core bloqueia `before_prompt_build` e ignora campos que mutam o prompt do legado `before_agent_start`, preservando `modelOverride` e `providerOverride` legados.
- `plugins.entries.<id>.config`: objeto de configuração definido pelo plugin (validado pelo schema do plugin).
- `plugins.slots.memory`: escolhe o id do plugin de memória ativo, ou `"none"` para desabilitar plugins de memória.
- `plugins.slots.contextEngine`: escolhe o id do plugin de motor de contexto ativo; padrão `"legacy"` exceto se você instalar e selecionar outro motor.
- `plugins.installs`: metadados de instalação gerenciados pela CLI usados por `opencraft plugins update`.
  - Inclui `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Trate `plugins.installs.*` como estado gerenciado; prefira comandos CLI a edições manuais.

Veja [Plugins](/tools/plugin).

---

## Browser (Navegador)

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      opencraft: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // relayBindHost: "0.0.0.0", // only when the extension relay must be reachable across namespaces (for example WSL2)
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` desabilita `act:evaluate` e `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` padrão `true` quando não definido (modelo de rede confiável).
- Defina `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` para navegação estrita apenas pública.
- No modo estrito, endpoints de perfil CDP remoto (`profiles.*.cdpUrl`) estão sujeitos ao mesmo bloqueio de rede privada durante verificações de alcançabilidade/descoberta.
- `ssrfPolicy.allowPrivateNetwork` permanece suportado como alias legado.
- No modo estrito, use `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` para exceções explícitas.
- Perfis remotos são somente attach (start/stop/reset desabilitados).
- Ordem de auto-detecção: browser padrão se baseado em Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Serviço de controle: apenas loopback (porta derivada de `gateway.port`, padrão `18791`).
- `extraArgs` acrescenta flags de inicialização extras ao startup local do Chromium (por exemplo
  `--disable-gpu`, dimensionamento de janela ou flags de debug).
- `relayBindHost` altera onde o relay da extensão Chrome escuta. Deixe não definido para acesso apenas loopback; defina um endereço bind não-loopback explícito como `0.0.0.0` apenas quando o relay precisar cruzar um limite de namespace (por exemplo WSL2) e a rede do host já for confiável.

---

## UI (Interface)

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenCraft",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: cor de destaque para o chrome da UI nativa do app (tonalidade da bolha do Modo Talk, etc.).
- `assistant`: substituição de identidade da UI de controle. Usa a identidade do agente ativo como fallback.

---

## Gateway (Servidor)

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // ou OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Detalhes dos campos do gateway">

- `mode`: `local` (executa gateway) ou `remote` (conecta ao gateway remoto). O gateway recusa iniciar exceto se `local`.
- `port`: porta única multiplexada para WS + HTTP. Precedência: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (padrão), `lan` (`0.0.0.0`), `tailnet` (apenas IP Tailscale), ou `custom`.
- **Aliases de bind legados**: use valores de modo de bind em `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), não aliases de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota Docker**: o bind `loopback` padrão escuta em `127.0.0.1` dentro do contêiner. Com rede bridge Docker (`-p 18789:18789`), o tráfego chega no `eth0`, então o gateway fica inacessível. Use `--network host`, ou defina `bind: "lan"` (ou `bind: "custom"` com `customBindHost: "0.0.0.0"`) para escutar em todas as interfaces.
- **Auth**: obrigatória por padrão. Binds não-loopback requerem token/senha compartilhado. O wizard de onboarding gera um token por padrão.
- Se ambos `gateway.auth.token` e `gateway.auth.password` estiverem configurados (incluindo SecretRefs), defina `gateway.auth.mode` explicitamente como `token` ou `password`. Fluxos de inicialização e instalação/reparo de serviço falham quando ambos estão configurados e o modo não está definido.
- `gateway.auth.mode: "none"`: modo sem autenticação explícito. Use apenas para configurações locais de loopback confiáveis; isso intencionalmente não é oferecido pelos prompts de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega auth para um proxy reverso com reconhecimento de identidade e confia nos headers de identidade de `gateway.trustedProxies` (veja [Auth de Proxy Confiável](/gateway/trusted-proxy-auth)).
- `gateway.auth.allowTailscale`: quando `true`, os headers de identidade do Tailscale Serve podem satisfazer a auth da UI de Controle/WebSocket (verificado via `tailscale whois`); os endpoints da API HTTP ainda requerem auth de token/senha. Este fluxo sem token assume que o host do gateway é confiável. Padrão `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de auth com falha. Aplicado por IP do cliente e por escopo de auth (shared-secret e device-token são rastreados independentemente). Tentativas bloqueadas retornam `429` + `Retry-After`.
  - `gateway.auth.rateLimit.exemptLoopback` padrão `true`; defina `false` quando você intencionalmente quiser que o tráfego localhost também seja limitado (para configurações de teste ou deployments de proxy estrito).
- As tentativas de auth WS de origem browser são sempre limitadas com isenção de loopback desabilitada (defesa em profundidade contra força bruta de localhost baseada em browser).
- `tailscale.mode`: `serve` (apenas tailnet, bind loopback) ou `funnel` (público, requer auth).
- `controlUi.allowedOrigins`: lista de permissão explícita de origem do browser para conexões WebSocket do Gateway. Obrigatório quando clientes browser são esperados de origens não-loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo perigoso que habilita fallback de origem por header Host para deployments que intencionalmente dependem da política de origem de header Host.
- `remote.transport`: `ssh` (padrão) ou `direct` (ws/wss). Para `direct`, `remote.url` deve ser `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override break-glass do lado do cliente que permite `ws://` em texto simples para IPs de rede privada confiável; o padrão continua apenas loopback para texto simples.
- `gateway.remote.token` / `.password` são campos de credencial do cliente remoto. Eles não configuram a auth do gateway por si mesmos.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base para o relay APNs externo usado por builds iOS oficiais/TestFlight após publicarem registros respaldados por relay no gateway. Esta URL deve corresponder à URL do relay compilada no build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout de envio do gateway para o relay em milissegundos. Padrão `10000`.
- Registros respaldados por relay são delegados a uma identidade de gateway específica. O app iOS pareado busca `gateway.identity.get`, inclui essa identidade no registro do relay, e encaminha uma concessão de envio com escopo de registro para o gateway. Outro gateway não pode reutilizar esse registro armazenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrides temporários de env para a config do relay acima.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch apenas para desenvolvimento para URLs de relay HTTP loopback. URLs de relay de produção devem ficar em HTTPS.
- Caminhos de chamada do gateway local podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` não está definido.
- Se `gateway.auth.token` / `gateway.auth.password` está explicitamente configurado via SecretRef e não resolvido, a resolução falha fechada (sem mascaramento de fallback remoto).
- `trustedProxies`: IPs de proxy reverso que terminam TLS. Liste apenas proxies que você controla.
- `allowRealIpFallback`: quando `true`, o gateway aceita `X-Real-IP` se `X-Forwarded-For` estiver ausente. Padrão `false` para comportamento fail-closed.
- `gateway.tools.deny`: nomes de ferramentas extras bloqueados para HTTP `POST /tools/invoke` (estende a lista de deny padrão).
- `gateway.tools.allow`: remove nomes de ferramentas da lista de deny HTTP padrão.

</Accordion>

### Endpoints compatíveis com OpenAI

- Chat Completions: desabilitado por padrão. Habilite com `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Hardening de entrada de URL do Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
- Header de hardening de resposta opcional:
  - `gateway.http.securityHeaders.strictTransportSecurity` (defina apenas para origens HTTPS que você controla; veja [Auth de Proxy Confiável](/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento de múltiplas instâncias

Execute múltiplos gateways em um host com portas e diretórios de estado únicos:

```bash
OPENCLAW_CONFIG_PATH=~/.opencraft/a.json \
OPENCLAW_STATE_DIR=~/.opencraft-a \
opencraft gateway --port 19001
```

Flags de conveniência: `--dev` (usa `~/.opencraft-dev` + porta `19001`), `--profile <name>` (usa `~/.opencraft-<name>`).

Veja [Múltiplos Gateways](/gateway/multiple-gateways).

---

## Hooks (Ganchos)

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.opencraft/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.2-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` ou `x-openclaw-token: <token>`.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` do payload da requisição é aceito apenas quando `hooks.allowRequestSessionKey=true` (padrão: `false`).
- `POST /hooks/<name>` → resolvido via `hooks.mappings`

<Accordion title="Detalhes de mapeamento">

- `match.path` corresponde ao sub-caminho após `/hooks` (ex. `/hooks/gmail` → `gmail`).
- `match.source` corresponde a um campo de payload para caminhos genéricos.
- Templates como `{{messages[0].subject}}` leem do payload.
- `transform` pode apontar para um módulo JS/TS que retorna uma ação de hook.
  - `transform.module` deve ser um caminho relativo e fica dentro de `hooks.transformsDir` (caminhos absolutos e traversal são rejeitados).
- `agentId` roteia para um agente específico; IDs desconhecidos usam o padrão como fallback.
- `allowedAgentIds`: restringe o roteamento explícito (`*` ou omitido = permitir todos, `[]` = negar todos).
- `defaultSessionKey`: chave de sessão fixa opcional para execuções de agente de hook sem `sessionKey` explícito.
- `allowRequestSessionKey`: permite que chamadores de `/hooks/agent` definam `sessionKey` (padrão: `false`).
- `allowedSessionKeyPrefixes`: lista de permissão de prefixo opcional para valores `sessionKey` explícitos (requisição + mapeamento), ex. `["hook:"]`.
- `deliver: true` envia a resposta final para um canal; `channel` padrão `last`.
- `model` substitui o LLM para esta execução de hook (deve ser permitido se o catálogo de modelos estiver definido).

</Accordion>

### Integração com Gmail

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- O Gateway inicia automaticamente `gog gmail watch serve` na inicialização quando configurado. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desabilitar.
- Não execute um `gog gmail watch serve` separado junto ao Gateway.

---

## Host do Canvas

```json5
{
  canvasHost: {
    root: "~/.opencraft/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Serve HTML/CSS/JS editável pelo agente e A2UI via HTTP sob a porta do Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Apenas local: mantenha `gateway.bind: "loopback"` (padrão).
- Binds não-loopback: rotas canvas requerem auth do Gateway (token/senha/trusted-proxy), igual a outras superfícies HTTP do Gateway.
- Node WebViews tipicamente não enviam headers de auth; após um nó ser pareado e conectado, o Gateway anuncia URLs de capacidade com escopo de nó para acesso canvas/A2UI.
- URLs de capacidade são vinculadas à sessão WS do nó ativo e expiram rapidamente. Fallback baseado em IP não é usado.
- Injeta cliente de live-reload no HTML servido.
- Cria automaticamente `index.html` inicial quando vazio.
- Também serve A2UI em `/__openclaw__/a2ui/`.
- Alterações requerem reinício do gateway.
- Desabilite o live reload para diretórios grandes ou erros `EMFILE`.

---

## Descoberta

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (padrão): omite `cliPath` + `sshPort` dos registros TXT.
- `full`: inclui `cliPath` + `sshPort`.
- Hostname padrão `openclaw`. Substitua com `OPENCLAW_MDNS_HOSTNAME`.

### Área ampla (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Escreve uma zona DNS-SD unicast em `~/.opencraft/dns/`. Para descoberta entre redes, combine com um servidor DNS (CoreDNS recomendado) + Tailscale split DNS.

Configuração: `opencraft dns setup --apply`.

---

## Ambiente

### `env` (vars de env inline)

```json5
{
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
}
```

- Vars de env inline são aplicadas apenas se o env do processo não tiver a chave.
- Arquivos `.env`: `.env` do CWD + `~/.opencraft/.env` (nenhum substitui vars existentes).
- `shellEnv`: importa chaves esperadas ausentes do seu perfil de shell de login.
- Veja [Ambiente](/help/environment) para precedência completa.

### Substituição de var de env

Referencie vars de env em qualquer string de config com `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Apenas nomes em maiúsculas são correspondidos: `[A-Z_][A-Z0-9_]*`.
- Vars ausentes/vazias lançam um erro ao carregar a config.
- Escape com `$${VAR}` para um `${VAR}` literal.
- Funciona com `$include`.

---

## Segredos

Refs de segredo são aditivos: valores em texto simples ainda funcionam.

### `SecretRef`

Use uma forma de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validação:

- Padrão de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Padrão de id `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- Id `source: "file"`: ponteiro JSON absoluto (por exemplo `"/providers/openai/apiKey"`)
- Padrão de id `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- Ids `source: "exec"` não devem conter segmentos de caminho delimitados por barra `.` ou `..` (por exemplo `a/../b` é rejeitado)

### Superfície de credencial suportada

- Matriz canônica: [Superfície de Credencial SecretRef](/reference/secretref-credential-surface)
- `secrets apply` visa caminhos de credencial suportados do `opencraft.json`.
- Refs do `auth-profiles.json` estão incluídos na resolução de runtime e cobertura de auditoria.

### Config de provedores de segredo

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.opencraft/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Notas:

- O provedor `file` suporta `mode: "json"` e `mode: "singleValue"` (`id` deve ser `"value"` no modo singleValue).
- O provedor `exec` requer um caminho `command` absoluto e usa payloads de protocolo no stdin/stdout.
- Por padrão, caminhos de comando symlink são rejeitados. Defina `allowSymlinkCommand: true` para permitir caminhos symlink enquanto valida o caminho alvo resolvido.
- Se `trustedDirs` estiver configurado, a verificação de dir confiável se aplica ao caminho alvo resolvido.
- O ambiente filho `exec` é mínimo por padrão; passe as variáveis necessárias explicitamente com `passEnv`.
- Refs de segredo são resolvidas no momento da ativação em um snapshot em memória, então caminhos de requisição leem apenas o snapshot.
- A filtragem de superfície ativa se aplica durante a ativação: refs não resolvidas em superfícies habilitadas falham na inicialização/recarga, enquanto superfícies inativas são ignoradas com diagnósticos.

---

## Armazenamento de autenticação

```json5
{
  auth: {
    profiles: {
      "anthropic:me@example.com": { provider: "anthropic", mode: "oauth", email: "me@example.com" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
    },
    order: {
      anthropic: ["anthropic:me@example.com", "anthropic:work"],
    },
  },
}
```

- Perfis por agente são armazenados em `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` suporta refs em nível de valor (`keyRef` para `api_key`, `tokenRef` para `token`).
- Credenciais de runtime estáticas vêm de snapshots resolvidos em memória; entradas legadas de `auth.json` estático são removidas quando descobertas.
- Importações OAuth legadas de `~/.opencraft/credentials/oauth.json`.
- Veja [OAuth](/concepts/oauth).
- Comportamento de runtime de segredos e ferramentas `audit/configure/apply`: [Gerenciamento de Segredos](/gateway/secrets).

---

## Logging (Registro de logs)

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Arquivo de log padrão: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Defina `logging.file` para um caminho estável.
- `consoleLevel` sobe para `debug` com `--verbose`.

---

## CLI (Interface de Linha de Comando)

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` controla o estilo do slogan do banner:
  - `"random"` (padrão): slogans engraçados/sazonais rotativos.
  - `"default"`: slogan neutro fixo (`All your chats, one OpenCraft.`).
  - `"off"`: sem texto de slogan (título/versão do banner ainda exibidos).
- Para ocultar todo o banner (não apenas slogans), defina o env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard (Assistente)

Metadados escritos pelos wizards CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identidade

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
      },
    ],
  },
}
```

Escrito pelo assistente de onboarding do macOS. Deriva padrões:

- `messages.ackReaction` de `identity.emoji` (fallback para 👀)
- `mentionPatterns` de `identity.name`/`identity.emoji`
- `avatar` aceita: caminho relativo ao workspace, URL `http(s)`, ou URI `data:`

---

## Bridge (legado, removido)

As builds atuais não incluem mais o bridge TCP. Os nós se conectam via WebSocket do Gateway. As chaves `bridge.*` não fazem mais parte do schema de configuração (a validação falha até serem removidas; `opencraft doctor --fix` pode remover chaves desconhecidas).

<Accordion title="Legacy bridge config (historical reference)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: how long to keep completed isolated cron run sessions before pruning from `sessions.json`. Also controls cleanup of archived deleted cron transcripts. Default: `24h`; set `false` to disable.
- `runLog.maxBytes`: max size per run log file (`cron/runs/<jobId>.jsonl`) before pruning. Default: `2_000_000` bytes.
- `runLog.keepLines`: newest lines retained when run-log pruning is triggered. Default: `2000`.
- `webhookToken`: bearer token used for cron webhook POST delivery (`delivery.mode = "webhook"`), if omitted no auth header is sent.
- `webhook`: deprecated legacy fallback webhook URL (http/https) used only for stored jobs that still have `notify: true`.

See [Cron Jobs](/automation/cron-jobs).

---

## Media model template variables

Template placeholders expanded in `tools.media.models[].args`:

| Variable           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Full inbound message body                         |
| `{{RawBody}}`      | Raw body (no history/sender wrappers)             |
| `{{BodyStripped}}` | Body with group mentions stripped                 |
| `{{From}}`         | Sender identifier                                 |
| `{{To}}`           | Destination identifier                            |
| `{{MessageSid}}`   | Channel message id                                |
| `{{SessionId}}`    | Current session UUID                              |
| `{{IsNewSession}}` | `"true"` when new session created                 |
| `{{MediaUrl}}`     | Inbound media pseudo-URL                          |
| `{{MediaPath}}`    | Local media path                                  |
| `{{MediaType}}`    | Media type (image/audio/document/…)               |
| `{{Transcript}}`   | Audio transcript                                  |
| `{{Prompt}}`       | Resolved media prompt for CLI entries             |
| `{{MaxChars}}`     | Resolved max output chars for CLI entries         |
| `{{ChatType}}`     | `"direct"` or `"group"`                           |
| `{{GroupSubject}}` | Group subject (best effort)                       |
| `{{GroupMembers}}` | Group members preview (best effort)               |
| `{{SenderName}}`   | Sender display name (best effort)                 |
| `{{SenderE164}}`   | Sender phone number (best effort)                 |
| `{{Provider}}`     | Provider hint (whatsapp, telegram, discord, etc.) |

---

## Config includes (`$include`)

Split config into multiple files:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Merge behavior:**

- Single file: replaces the containing object.
- Array of files: deep-merged in order (later overrides earlier).
- Sibling keys: merged after includes (override included values).
- Nested includes: up to 10 levels deep.
- Paths: resolved relative to the including file, but must stay inside the top-level config directory (`dirname` of `openclaw.json`). Absolute/`../` forms are allowed only when they still resolve inside that boundary.
- Errors: clear messages for missing files, parse errors, and circular includes.

---

_Related: [Configuration](/gateway/configuration) · [Configuration Examples](/gateway/configuration-examples) · [Doctor](/gateway/doctor)_
