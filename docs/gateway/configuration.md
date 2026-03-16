---
summary: "Visão geral de configuração: tarefas comuns, setup rápido e links para a referência completa"
read_when:
  - Configurando o OpenCraft pela primeira vez
  - Procurando padrões de configuração comuns
  - Navegando para seções específicas de config
title: "Configuration"
---

# Configuração

OpenCraft lê uma config <Tooltip tip="JSON5 suporta comentários e vírgulas finais">**JSON5**</Tooltip> opcional de `~/.opencraft/opencraft.json`.

Se o arquivo estiver ausente, OpenCraft usa padrões seguros. Razões comuns para adicionar uma config:

- Conectar canais e controlar quem pode enviar mensagens para o bot
- Definir modelos, tools, sandboxing ou automação (cron, hooks)
- Ajustar sessões, mídia, rede ou UI

Veja a [referência completa](/gateway/configuration-reference) para cada campo disponível.

<Tip>
**Novo em configuração?** Comece com `opencraft onboard` para setup interativo, ou confira o guia de [Configuration Examples](/gateway/configuration-examples) para configs completas de copiar e colar.
</Tip>

## Config mínima

```json5
// ~/.opencraft/opencraft.json
{
  agents: { defaults: { workspace: "~/.opencraft/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Editando config

<Tabs>
  <Tab title="Wizard interativo">
    ```bash
    opencraft onboard       # wizard de setup completo
    opencraft configure     # wizard de config
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    opencraft config get agents.defaults.workspace
    opencraft config set agents.defaults.heartbeat.every "2h"
    opencraft config unset tools.web.search.apiKey
    ```
  </Tab>
  <Tab title="UI de Controle">
    Abra [http://127.0.0.1:18789](http://127.0.0.1:18789) e use a aba **Config**.
    A UI de Controle renderiza um formulário a partir do schema de config, com um editor **Raw JSON** como escotilha de saída.
  </Tab>
  <Tab title="Edição direta">
    Edite `~/.opencraft/opencraft.json` diretamente. O Gateway observa o arquivo e aplica mudanças automaticamente (veja [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validação estrita

<Warning>
OpenCraft só aceita configurações que correspondem totalmente ao schema. Chaves desconhecidas, tipos malformados ou valores inválidos fazem o Gateway **recusar a iniciar**. A única exceção no nível raiz é `$schema` (string), para que editores possam anexar metadados JSON Schema.
</Warning>

Quando a validação falha:

- O Gateway não inicia
- Apenas comandos de diagnóstico funcionam (`opencraft doctor`, `opencraft logs`, `opencraft health`, `opencraft status`)
- Rode `opencraft doctor` para ver os problemas exatos
- Rode `opencraft doctor --fix` (ou `--yes`) para aplicar reparos

## Tarefas comuns

<AccordionGroup>
  <Accordion title="Configurar um canal (WhatsApp, Telegram, Discord, etc.)">
    Cada canal tem sua própria seção de config em `channels.<provider>`. Veja a página dedicada do canal para os passos de setup:

    - [WhatsApp](/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/channels/telegram) — `channels.telegram`
    - [Discord](/channels/discord) — `channels.discord`
    - [Slack](/channels/slack) — `channels.slack`
    - [Signal](/channels/signal) — `channels.signal`
    - [iMessage](/channels/imessage) — `channels.imessage`
    - [Google Chat](/channels/googlechat) — `channels.googlechat`
    - [Mattermost](/channels/mattermost) — `channels.mattermost`
    - [MS Teams](/channels/msteams) — `channels.msteams`

    Todos os canais compartilham o mesmo padrão de política de DM:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // apenas para allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Escolher e configurar modelos">
    Definir o modelo primário e fallbacks opcionais:

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

    - `agents.defaults.models` define o catálogo de modelos e atua como allowlist para `/model`.
    - Refs de modelo usam o formato `provider/model` (ex. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla o redimensionamento de imagens de transcrição/tool (padrão `1200`); valores menores geralmente reduzem o uso de tokens de visão em execuções com muitos screenshots.
    - Veja [Models CLI](/concepts/models) para mudar modelos no chat e [Model Failover](/concepts/model-failover) para rotação de auth e comportamento de fallback.
    - Para provedores personalizados/self-hosted, veja [Custom providers](/gateway/configuration-reference#custom-providers-and-base-urls) na referência.

  </Accordion>

  <Accordion title="Controlar quem pode enviar mensagens para o bot">
    Acesso a DM é controlado por canal via `dmPolicy`:

    - `"pairing"` (padrão): remetentes desconhecidos recebem um código de pareamento único para aprovar
    - `"allowlist"`: apenas remetentes em `allowFrom` (ou o store de allow pareado)
    - `"open"`: permitir todos os DMs de entrada (requer `allowFrom: ["*"]`)
    - `"disabled"`: ignorar todos os DMs

    Para grupos, use `groupPolicy` + `groupAllowFrom` ou allowlists específicas do canal.

    Veja a [referência completa](/gateway/configuration-reference#dm-and-group-access) para detalhes por canal.

  </Accordion>

  <Accordion title="Configurar gating de menção em grupo">
    Mensagens de grupo padrão **requerem menção**. Configure padrões por agente:

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

    - **Menções de metadados**: menções nativas @- (toque-para-mencionar do WhatsApp, @bot do Telegram, etc.)
    - **Padrões de texto**: padrões regex seguros em `mentionPatterns`
    - Veja a [referência completa](/gateway/configuration-reference#group-chat-mention-gating) para overrides por canal e modo self-chat.

  </Accordion>

  <Accordion title="Configurar sessões e resets">
    Sessões controlam continuidade e isolamento de conversa:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recomendado para multi-usuário
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
    - `threadBindings`: padrões globais para roteamento de sessão vinculada a thread (Discord suporta `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Veja [Session Management](/concepts/session) para escopo, links de identidade e política de envio.
    - Veja a [referência completa](/gateway/configuration-reference#session) para todos os campos.

  </Accordion>

  <Accordion title="Habilitar sandboxing">
    Rodar sessões de agente em containers Docker isolados:

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

    Veja [Sandboxing](/gateway/sandboxing) para o guia completo e a [referência completa](/gateway/configuration-reference#sandbox) para todas as opções.

  </Accordion>

  <Accordion title="Habilitar push relay-backed para builds iOS oficiais">
    Push relay-backed é configurado em `opencraft.json`.

    Defina isso na config do gateway:

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

    O que isso faz:

    - Permite que o gateway envie `push.test`, wakeups e reconnect wakes pelo relay externo.
    - Usa um grant de envio com escopo de registro encaminhado pelo app iOS pareado. O gateway não precisa de um token relay válido para todo o deployment.
    - Vincula cada registro relay-backed à identidade do gateway com a qual o app iOS pareou, para que outro gateway não possa reutilizar o registro armazenado.
    - Mantém builds iOS locais/manuais no APNs direto. Envios relay-backed se aplicam apenas a builds oficiais distribuídas que se registraram pelo relay.
    - Deve corresponder à URL base do relay integrada ao build iOS oficial/TestFlight, para que o tráfego de registro e envio chegue ao mesmo deployment do relay.

    Fluxo ponta a ponta:

    1. Instale um build iOS oficial/TestFlight compilado com a mesma URL base do relay.
    2. Configure `gateway.push.apns.relay.baseUrl` no gateway.
    3. Pareie o app iOS ao gateway e deixe as sessões de node e operador se conectarem.
    4. O app iOS busca a identidade do gateway, registra no relay usando App Attest mais o recibo do app, depois publica o payload `push.apns.register` relay-backed ao gateway pareado.
    5. O gateway armazena o handle e grant do relay, depois os usa para `push.test`, wake nudges e reconnect wakes.

    Notas operacionais:

    - Se você mudar o app iOS para um gateway diferente, reconecte o app para que possa publicar um novo registro relay vinculado a aquele gateway.
    - Se você publicar um novo build iOS que aponta para um deployment de relay diferente, o app atualiza seu registro relay em cache em vez de reutilizar a origem do relay antigo.

    Nota de compatibilidade:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ainda funcionam como overrides temporários de env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` permanece uma escotilha de desenvolvimento apenas para loopback; não persista URLs de relay HTTP na config.

    Veja [iOS App](/platforms/ios#relay-backed-push-for-official-builds) para o fluxo ponta a ponta e [Authentication and trust flow](/platforms/ios#authentication-and-trust-flow) para o modelo de segurança do relay.

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

    - `every`: string de duração (`30m`, `2h`). Defina `0m` para desabilitar.
    - `target`: `last` | `whatsapp` | `telegram` | `discord` | `none`
    - `directPolicy`: `allow` (padrão) ou `block` para alvos heartbeat estilo DM
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

    - `sessionRetention`: remover sessões de run isoladas concluídas de `sessions.json` (padrão `24h`; defina `false` para desabilitar).
    - `runLog`: remover `cron/runs/<jobId>.jsonl` por tamanho e linhas retidas.
    - Veja [Cron jobs](/automation/cron-jobs) para visão geral de recursos e exemplos CLI.

  </Accordion>

  <Accordion title="Configurar webhooks (hooks)">
    Habilitar endpoints webhook HTTP no Gateway:

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
    - Trate todo o conteúdo do payload de hook/webhook como entrada não confiável.
    - Mantenha flags de bypass de conteúdo inseguro desabilitadas (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) a menos que faça debugging com escopo restrito.
    - Para agentes guiados por hook, prefira camadas de modelo fortes e modernas e política de tools estrita (por exemplo apenas mensagens mais sandboxing quando possível).

    Veja a [referência completa](/gateway/configuration-reference#hooks) para todas as opções de mapeamento e integração Gmail.

  </Accordion>

  <Accordion title="Configurar roteamento multi-agente">
    Rodar múltiplos agentes isolados com workspaces e sessões separados:

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

    Veja [Multi-Agent](/concepts/multi-agent) e a [referência completa](/gateway/configuration-reference#multi-agent-routing) para regras de binding e perfis de acesso por agente.

  </Accordion>

  <Accordion title="Dividir config em múltiplos arquivos ($include)">
    Use `$include` para organizar configs grandes:

    ```json5
    // ~/.opencraft/opencraft.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Arquivo único**: substitui o objeto contendo
    - **Array de arquivos**: deep-merged em ordem (último vence)
    - **Chaves irmãs**: merged após includes (sobrescreve valores incluídos)
    - **Includes aninhados**: suportados até 10 níveis de profundidade
    - **Paths relativos**: resolvidos relativos ao arquivo incluindo
    - **Tratamento de erros**: erros claros para arquivos ausentes, erros de parse e includes circulares

  </Accordion>
</AccordionGroup>

## Config hot reload

O Gateway observa `~/.opencraft/opencraft.json` e aplica mudanças automaticamente — sem necessidade de restart manual para a maioria das configurações.

### Modos de reload

| Modo                   | Comportamento                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| **`hybrid`** (padrão) | Aplica mudanças seguras instantaneamente. Reinicia automaticamente para as críticas.          |
| **`hot`**              | Aplica apenas mudanças seguras. Registra um aviso quando um restart é necessário — você gerencia. |
| **`restart`**          | Reinicia o Gateway em qualquer mudança de config, segura ou não.                             |
| **`off`**              | Desabilita observação de arquivo. Mudanças tomam efeito no próximo restart manual.           |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### O que aplica em hot vs. o que precisa de restart

A maioria dos campos aplica em hot sem downtime. No modo `hybrid`, mudanças que requerem restart são tratadas automaticamente.

| Categoria           | Campos                                                               | Restart necessário? |
| ------------------- | -------------------------------------------------------------------- | ------------------- |
| Canais              | `channels.*`, `web` (WhatsApp) — todos os canais built-in e extensão | Não                 |
| Agente e modelos    | `agent`, `agents`, `models`, `routing`                               | Não                 |
| Automação           | `hooks`, `cron`, `agent.heartbeat`                                   | Não                 |
| Sessões e mensagens | `session`, `messages`                                                | Não                 |
| Tools e mídia       | `tools`, `browser`, `skills`, `audio`, `talk`                        | Não                 |
| UI e misc           | `ui`, `logging`, `identity`, `bindings`                              | Não                 |
| Servidor Gateway    | `gateway.*` (porta, bind, auth, tailscale, TLS, HTTP)                | **Sim**             |
| Infraestrutura      | `discovery`, `canvasHost`, `plugins`                                 | **Sim**             |

<Note>
`gateway.reload` e `gateway.remote` são exceções — mudá-los **não** aciona um restart.
</Note>

## Config RPC (atualizações programáticas)

<Note>
RPCs de escrita no plano de controle (`config.apply`, `config.patch`, `update.run`) são limitadas a **3 requisições por 60 segundos** por `deviceId+clientIp`. Quando limitadas, o RPC retorna `UNAVAILABLE` com `retryAfterMs`.
</Note>

<AccordionGroup>
  <Accordion title="config.apply (substituição completa)">
    Valida + escreve a config completa e reinicia o Gateway em um passo.

    <Warning>
    `config.apply` substitui a **config inteira**. Use `config.patch` para atualizações parciais, ou `opencraft config set` para chaves únicas.
    </Warning>

    Params:

    - `raw` (string) — payload JSON5 para toda a config
    - `baseHash` (opcional) — hash de config de `config.get` (obrigatório quando config existe)
    - `sessionKey` (opcional) — chave de sessão para o ping de wakeup pós-restart
    - `note` (opcional) — nota para o sentinela de restart
    - `restartDelayMs` (opcional) — atraso antes do restart (padrão 2000)

    Requisições de restart são coalescidas enquanto uma já está pendente/em-voo, e um cooldown de 30 segundos se aplica entre ciclos de restart.

    ```bash
    opencraft gateway call config.get --params '{}'  # capturar payload.hash
    opencraft gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.opencraft/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (atualização parcial)">
    Mescla uma atualização parcial na config existente (semântica de JSON merge patch):

    - Objetos mesclam recursivamente
    - `null` deleta uma chave
    - Arrays substituem

    Params:

    - `raw` (string) — JSON5 com apenas as chaves a mudar
    - `baseHash` (obrigatório) — hash de config de `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — iguais a `config.apply`

    Comportamento de restart corresponde a `config.apply`: restarts pendentes coalescidos mais um cooldown de 30 segundos entre ciclos de restart.

    ```bash
    opencraft gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente

OpenCraft lê vars de env do processo pai mais:

- `.env` do diretório de trabalho atual (se presente)
- `~/.opencraft/.env` (fallback global)

Nenhum arquivo sobrescreve vars de env existentes. Você também pode definir vars de env inline na config:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importação de env shell (opcional)">
  Se habilitado e as chaves esperadas não estiverem definidas, OpenCraft roda seu shell de login e importa apenas as chaves ausentes:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalente de var de env: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substituição de var de env em valores de config">
  Referencie vars de env em qualquer valor de string de config com `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regras:

- Apenas nomes maiúsculos são correspondidos: `[A-Z_][A-Z0-9_]*`
- Vars ausentes/vazias lançam um erro no tempo de carregamento
- Escape com `$${VAR}` para saída literal
- Funciona dentro de arquivos `$include`
- Substituição inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Refs de segredo (env, file, exec)">
  Para campos que suportam objetos SecretRef, você pode usar:

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
Paths de credencial suportados estão listados em [SecretRef Credential Surface](/reference/secretref-credential-surface).
</Accordion>

Veja [Environment](/help/environment) para precedência completa e fontes.

## Referência completa

Para a referência campo a campo completa, veja **[Configuration Reference](/gateway/configuration-reference)**.

---

_Relacionado: [Configuration Examples](/gateway/configuration-examples) · [Configuration Reference](/gateway/configuration-reference) · [Doctor](/gateway/doctor)_
