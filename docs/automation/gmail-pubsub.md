---
summary: "Gmail Pub/Sub push conectado aos webhooks do OpenCraft via gogcli"
read_when:
  - Conectando triggers do inbox do Gmail ao OpenCraft
  - Configurando Pub/Sub push para wake do agente
title: "Gmail PubSub"
---

# Gmail Pub/Sub -> OpenCraft

Objetivo: Gmail watch -> Pub/Sub push -> `gog gmail watch serve` -> webhook do OpenCraft.

## Pré-requisitos

- `gcloud` instalado e logado ([guia de instalação](https://docs.cloud.google.com/sdk/docs/install-sdk)).
- `gog` (gogcli) instalado e autorizado para a conta Gmail ([gogcli.sh](https://gogcli.sh/)).
- Hooks do OpenCraft habilitados (veja [Webhooks](/automation/webhook)).
- `tailscale` logado ([tailscale.com](https://tailscale.com/)). Configuração suportada usa Tailscale Funnel para o endpoint HTTPS público.
  Outros serviços de túnel podem funcionar, mas são DIY/não suportados e requerem conexão manual.
  Por enquanto, Tailscale é o que suportamos.

Exemplo de config de hook (habilitar mapeamento preset do Gmail):

```json5
{
  hooks: {
    enabled: true,
    token: "OPENCLAW_HOOK_TOKEN",
    path: "/hooks",
    presets: ["gmail"],
  },
}
```

Para entregar o resumo do Gmail para uma superfície de chat, sobrescreva o preset com um mapeamento
que define `deliver` + `channel`/`to` opcionais:

```json5
{
  hooks: {
    enabled: true,
    token: "OPENCLAW_HOOK_TOKEN",
    presets: ["gmail"],
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "Novo email de {{messages[0].from}}\nAssunto: {{messages[0].subject}}\n{{messages[0].snippet}}\n{{messages[0].body}}",
        model: "openai/gpt-5.2-mini",
        deliver: true,
        channel: "last",
        // to: "+15551234567"
      },
    ],
  },
}
```

Se quiser um canal fixo, defina `channel` + `to`. Caso contrário `channel: "last"`
usa a última rota de entrega (faz fallback para WhatsApp).

Para forçar um modelo mais barato para execuções do Gmail, defina `model` no mapeamento
(`provider/model` ou alias). Se você aplica `agents.defaults.models`, inclua-o lá.

Para definir um modelo padrão e nível de thinking especificamente para hooks do Gmail, adicione
`hooks.gmail.model` / `hooks.gmail.thinking` na sua config:

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

Notas:

- `model`/`thinking` por hook no mapeamento ainda sobrescreve esses padrões.
- Ordem de fallback: `hooks.gmail.model` → `agents.defaults.model.fallbacks` → primário (auth/rate-limit/timeouts).
- Se `agents.defaults.models` estiver definido, o modelo do Gmail deve estar na allowlist.
- Conteúdo do hook do Gmail é envolvido com limites de segurança de conteúdo externo por padrão.
  Para desabilitar (perigoso), defina `hooks.gmail.allowUnsafeExternalContent: true`.

Para personalizar o tratamento de payload ainda mais, adicione `hooks.mappings` ou um módulo de transform JS/TS
em `~/.opencraft/hooks/transforms` (veja [Webhooks](/automation/webhook)).

## Wizard (recomendado)

Use o helper do OpenCraft para conectar tudo (instala deps no macOS via brew):

```bash
opencraft webhooks gmail setup \
  --account openclaw@gmail.com
```

Padrões:

- Usa Tailscale Funnel para o endpoint de push público.
- Escreve config `hooks.gmail` para `opencraft webhooks gmail run`.
- Habilita o preset de hook do Gmail (`hooks.presets: ["gmail"]`).

Nota sobre path: quando `tailscale.mode` está habilitado, o OpenCraft automaticamente define
`hooks.gmail.serve.path` como `/` e mantém o path público em
`hooks.gmail.tailscale.path` (padrão `/gmail-pubsub`) porque o Tailscale
remove o prefixo de path definido antes de fazer proxy.
Se você precisa que o backend receba o path prefixado, defina
`hooks.gmail.tailscale.target` (ou `--tailscale-target`) para uma URL completa como
`http://127.0.0.1:8788/gmail-pubsub` e faça o match com `hooks.gmail.serve.path`.

Quer um endpoint personalizado? Use `--push-endpoint <url>` ou `--tailscale off`.

Nota de plataforma: no macOS o wizard instala `gcloud`, `gogcli` e `tailscale`
via Homebrew; no Linux instale-os manualmente primeiro.

Auto-start do Gateway (recomendado):

- Quando `hooks.enabled=true` e `hooks.gmail.account` está definido, o Gateway inicia
  `gog gmail watch serve` na inicialização e renova o watch automaticamente.
- Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para não participar (útil se você rodar o daemon você mesmo).
- Não rode o daemon manual ao mesmo tempo, ou você verá
  `listen tcp 127.0.0.1:8788: bind: address already in use`.

Daemon manual (inicia `gog gmail watch serve` + auto-renovação):

```bash
opencraft webhooks gmail run
```

## Configuração única

1. Selecione o projeto GCP **que possui o cliente OAuth** usado pelo `gog`.

```bash
gcloud auth login
gcloud config set project <project-id>
```

Nota: Gmail watch requer que o tópico Pub/Sub esteja no mesmo projeto que o cliente OAuth.

2. Habilitar APIs:

```bash
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

3. Criar um tópico:

```bash
gcloud pubsub topics create gog-gmail-watch
```

4. Permitir que o Gmail push publique:

```bash
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

## Iniciar o watch

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

Salve o `history_id` da saída (para debugging).

## Executar o handler de push

Exemplo local (auth com token compartilhado):

```bash
gog gmail watch serve \
  --account openclaw@gmail.com \
  --bind 127.0.0.1 \
  --port 8788 \
  --path /gmail-pubsub \
  --token <shared> \
  --hook-url http://127.0.0.1:18789/hooks/gmail \
  --hook-token OPENCLAW_HOOK_TOKEN \
  --include-body \
  --max-bytes 20000
```

Notas:

- `--token` protege o endpoint de push (`x-gog-token` ou `?token=`).
- `--hook-url` aponta para o `/hooks/gmail` do OpenCraft (mapeado; execução isolada + resumo para o principal).
- `--include-body` e `--max-bytes` controlam o snippet do body enviado ao OpenCraft.

Recomendado: `opencraft webhooks gmail run` encapsula o mesmo fluxo e renova o watch automaticamente.

## Expor o handler (avançado, não suportado)

Se você precisar de um túnel não-Tailscale, conecte manualmente e use a URL pública na push
subscription (não suportado, sem guardrails):

```bash
cloudflared tunnel --url http://127.0.0.1:8788 --no-autoupdate
```

Use a URL gerada como endpoint de push:

```bash
gcloud pubsub subscriptions create gog-gmail-watch-push \
  --topic gog-gmail-watch \
  --push-endpoint "https://<public-url>/gmail-pubsub?token=<shared>"
```

Produção: use um endpoint HTTPS estável e configure Pub/Sub OIDC JWT, depois execute:

```bash
gog gmail watch serve --verify-oidc --oidc-email <svc@...>
```

## Testar

Envie uma mensagem para o inbox monitorado:

```bash
gog gmail send \
  --account openclaw@gmail.com \
  --to openclaw@gmail.com \
  --subject "watch test" \
  --body "ping"
```

Verifique o estado do watch e histórico:

```bash
gog gmail watch status --account openclaw@gmail.com
gog gmail history --account openclaw@gmail.com --since <historyId>
```

## Resolução de Problemas

- `Invalid topicName`: incompatibilidade de projeto (tópico não está no projeto do cliente OAuth).
- `User not authorized`: `roles/pubsub.publisher` ausente no tópico.
- Mensagens vazias: push do Gmail fornece apenas `historyId`; busque via `gog gmail history`.

## Limpeza

```bash
gog gmail watch stop --account openclaw@gmail.com
gcloud pubsub subscriptions delete gog-gmail-watch-push
gcloud pubsub topics delete gog-gmail-watch
```
