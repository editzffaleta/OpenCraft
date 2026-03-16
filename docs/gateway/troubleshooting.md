---
summary: "Runbook de diagnóstico profundo para gateway, canais, automação, nodes e browser"
read_when:
  - O hub de resolução de problemas te direcionou aqui para diagnóstico mais profundo
  - Você precisa de seções de runbook estáveis baseadas em sintomas com comandos exatos
title: "Resolução de Problemas"
---

# Resolução de problemas do Gateway

Esta página é o runbook profundo.
Comece em [/help/troubleshooting](/help/troubleshooting) se quiser o fluxo rápido de triagem primeiro.

## Escada de comandos

Execute estes primeiro, nesta ordem:

```bash
opencraft status
opencraft gateway status
opencraft logs --follow
opencraft doctor
opencraft channels status --probe
```

Sinais esperados de saúde:

- `opencraft gateway status` mostra `Runtime: running` e `RPC probe: ok`.
- `opencraft doctor` não reporta problemas de config/serviço bloqueantes.
- `opencraft channels status --probe` mostra canais conectados/prontos.

## Anthropic 429 - uso extra necessário para contexto longo

Use quando logs/erros incluem:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
opencraft logs --follow
opencraft models status
opencraft config get agents.defaults.models
```

Procure por:

- Modelo Anthropic Opus/Sonnet selecionado tem `params.context1m: true`.
- Credencial Anthropic atual não é elegível para uso de contexto longo.
- Requisições falham apenas em sessões/runs de modelo longos que precisam do caminho beta 1M.

Opções de correção:

1. Desabilite `context1m` para esse modelo para voltar à janela de contexto normal.
2. Use uma chave API Anthropic com cobrança, ou habilite Anthropic Extra Usage na conta de assinatura.
3. Configure modelos de fallback para que runs continuem quando requisições de contexto longo Anthropic são rejeitadas.

Relacionado:

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Sem respostas

Se os canais estão ativos mas nada responde, verifique roteamento e política antes de reconectar qualquer coisa.

```bash
opencraft status
opencraft channels status --probe
opencraft pairing list --channel <channel> [--account <id>]
opencraft config get channels
opencraft logs --follow
```

Procure por:

- Pareamento pendente para remetentes de DM.
- Portão de menção em grupo (`requireMention`, `mentionPatterns`).
- Incompatibilidades de allowlist de canal/grupo.

Assinaturas comuns:

- `drop guild message (mention required` → mensagem de grupo ignorada até menção.
- `pairing request` → remetente precisa de aprovação.
- `blocked` / `allowlist` → remetente/canal foi filtrado por política.

Relacionado:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/pairing](/channels/pairing)
- [/channels/groups](/channels/groups)

## Conectividade da control UI do dashboard

Quando o dashboard/control UI não conecta, valide URL, modo de auth e suposições de contexto seguro.

```bash
opencraft gateway status
opencraft status
opencraft logs --follow
opencraft doctor
opencraft gateway status --json
```

Procure por:

- URL de probe e URL do dashboard corretos.
- Incompatibilidade de modo de auth/token entre cliente e gateway.
- Uso de HTTP onde identidade de dispositivo é obrigatória.

Assinaturas comuns:

- `device identity required` → contexto não-seguro ou auth de dispositivo ausente.
- `device nonce required` / `device nonce mismatch` → cliente não está completando o
  fluxo de auth de dispositivo baseado em challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → cliente assinou o payload errado
  (ou timestamp obsoleto) para o handshake atual.
- `AUTH_TOKEN_MISMATCH` com `canRetryWithDeviceToken=true` → cliente pode fazer uma nova tentativa confiável com token de dispositivo em cache.
- `unauthorized` repetido após essa nova tentativa → deriva de token compartilhado/token de dispositivo; atualize a config de token e re-aprove/rotacione o token de dispositivo se necessário.
- `gateway connect failed:` → alvo de host/porta/url errado.

### Mapa rápido de códigos de detalhe de auth

Use `error.details.code` da resposta `connect` com falha para escolher a próxima ação:

| Código de detalhe            | Significado                                                  | Ação recomendada                                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Cliente não enviou um token compartilhado obrigatório.       | Cole/defina o token no cliente e tente novamente. Para caminhos de dashboard: `opencraft config get gateway.auth.token` depois cole nas configurações da Control UI.       |
| `AUTH_TOKEN_MISMATCH`        | Token compartilhado não correspondeu ao token de auth do gateway. | Se `canRetryWithDeviceToken=true`, permita uma nova tentativa confiável. Se ainda falhar, execute o [checklist de recuperação de deriva de token](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token por dispositivo em cache está obsoleto ou revogado.    | Rotacione/re-aprove o token de dispositivo usando o [CLI de devices](/cli/devices), depois reconecte.                                                                    |
| `PAIRING_REQUIRED`           | Identidade de dispositivo é conhecida mas não aprovada para este role. | Aprove a requisição pendente: `opencraft devices list` depois `opencraft devices approve <requestId>`.                                                               |

Verificação de migração de auth de dispositivo v2:

```bash
opencraft --version
opencraft doctor
opencraft gateway status
```

Se os logs mostrarem erros de nonce/assinatura, atualize o cliente conectado e verifique se ele:

1. aguarda `connect.challenge`
2. assina o payload vinculado ao challenge
3. envia `connect.params.device.nonce` com o mesmo nonce do challenge

Relacionado:

- [/web/control-ui](/web/control-ui)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/remote](/gateway/remote)
- [/cli/devices](/cli/devices)

## Serviço de gateway não está rodando

Use quando o serviço está instalado mas o processo não permanece ativo.

```bash
opencraft gateway status
opencraft status
opencraft logs --follow
opencraft doctor
opencraft gateway status --deep
```

Procure por:

- `Runtime: stopped` com hints de saída.
- Incompatibilidade de config de serviço (`Config (cli)` vs `Config (service)`).
- Conflitos de porta/listener.

Assinaturas comuns:

- `Gateway start blocked: set gateway.mode=local` → modo de gateway local não está habilitado. Correção: defina `gateway.mode="local"` na sua config (ou rode `opencraft configure`). Se você está rodando o OpenCraft via Podman usando o usuário dedicado `openclaw`, a config fica em `~openclaw/.opencraft/opencraft.json`.
- `refusing to bind gateway ... without auth` → bind não-loopback sem token/senha.
- `another gateway instance is already listening` / `EADDRINUSE` → conflito de porta.

Relacionado:

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## Mensagens de canal conectado não fluindo

Se o estado do canal está conectado mas o fluxo de mensagens está morto, foque em política, permissões e regras de entrega específicas do canal.

```bash
opencraft channels status --probe
opencraft pairing list --channel <channel> [--account <id>]
opencraft status --deep
opencraft logs --follow
opencraft config get channels
```

Procure por:

- Política de DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist de grupo e requisitos de menção.
- Permissões/escopos ausentes na API do canal.

Assinaturas comuns:

- `mention required` → mensagem ignorada pela política de menção de grupo.
- `pairing` / rastros de aprovação pendente → remetente não está aprovado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de auth/permissões do canal.

Relacionado:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/whatsapp](/channels/whatsapp)
- [/channels/telegram](/channels/telegram)
- [/channels/discord](/channels/discord)

## Entrega de cron e heartbeat

Se cron ou heartbeat não rodou ou não entregou, verifique o estado do agendador primeiro, depois o alvo de entrega.

```bash
opencraft cron status
opencraft cron list
opencraft cron runs --id <jobId> --limit 20
opencraft system heartbeat last
opencraft logs --follow
```

Procure por:

- Cron habilitado e próximo wake presente.
- Status do histórico de run do job (`ok`, `skipped`, `error`).
- Razões de pulo do heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`).

Assinaturas comuns:

- `cron: scheduler disabled; jobs will not run automatically` → cron desabilitado.
- `cron: timer tick failed` → tick do agendador falhou; verifique erros de arquivo/log/runtime.
- `heartbeat skipped` com `reason=quiet-hours` → fora da janela de horas ativas.
- `heartbeat: unknown accountId` → id de conta inválido para alvo de entrega de heartbeat.
- `heartbeat skipped` com `reason=dm-blocked` → alvo de heartbeat resolveu para um destino estilo DM enquanto `agents.defaults.heartbeat.directPolicy` (ou override por agente) está definido como `block`.

Relacionado:

- [/automation/troubleshooting](/automation/troubleshooting)
- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## Tool de node pareado falha

Se um node está pareado mas tools falham, isole estado de foreground, permissão e aprovação.

```bash
opencraft nodes status
opencraft nodes describe --node <idOrNameOrIp>
opencraft approvals get --node <idOrNameOrIp>
opencraft logs --follow
opencraft status
```

Procure por:

- Node online com capacidades esperadas.
- Concessões de permissão do OS para câmera/microfone/localização/tela.
- Estado de aprovações de exec e allowlist.

Assinaturas comuns:

- `NODE_BACKGROUND_UNAVAILABLE` → app do node deve estar em foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permissão do OS ausente.
- `SYSTEM_RUN_DENIED: approval required` → aprovação de exec pendente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado pela allowlist.

Relacionado:

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## Tool de browser falha

Use quando ações da tool de browser falham mesmo que o próprio gateway esteja saudável.

```bash
opencraft browser status
opencraft browser start --browser-profile openclaw
opencraft browser profiles
opencraft logs --follow
opencraft doctor
```

Procure por:

- Path de executável de browser válido.
- Acessibilidade do perfil CDP.
- Anexo da aba de relay de extensão (se um perfil de relay de extensão estiver configurado).

Assinaturas comuns:

- `Failed to start Chrome CDP on port` → processo de browser falhou ao iniciar.
- `browser.executablePath not found` → path configurado é inválido.
- `Chrome extension relay is running, but no tab is connected` → relay de extensão não anexado.
- `Browser attachOnly is enabled ... not reachable` → perfil somente-attach não tem alvo acessível.

Relacionado:

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/chrome-extension](/tools/chrome-extension)
- [/tools/browser](/tools/browser)

## Se você atualizou e algo quebrou de repente

A maioria das quebras pós-atualização é deriva de config ou padrões mais rígidos agora sendo aplicados.

### 1) Comportamento de substituição de auth e URL mudou

```bash
opencraft gateway status
opencraft config get gateway.mode
opencraft config get gateway.remote.url
opencraft config get gateway.auth.mode
```

O que verificar:

- Se `gateway.mode=remote`, chamadas do CLI podem estar direcionando para remoto enquanto seu serviço local está bem.
- Chamadas explícitas `--url` não usam credenciais armazenadas como fallback.

Assinaturas comuns:

- `gateway connect failed:` → alvo de URL errado.
- `unauthorized` → endpoint acessível mas auth errada.

### 2) Proteções de bind e auth são mais rígidas

```bash
opencraft config get gateway.bind
opencraft config get gateway.auth.token
opencraft gateway status
opencraft logs --follow
```

O que verificar:

- Binds não-loopback (`lan`, `tailnet`, `custom`) precisam de auth configurada.
- Chaves antigas como `gateway.token` não substituem `gateway.auth.token`.

Assinaturas comuns:

- `refusing to bind gateway ... without auth` → incompatibilidade de bind+auth.
- `RPC probe: failed` enquanto o runtime está rodando → gateway vivo mas inacessível com auth/url atual.

### 3) Estado de pareamento e identidade de dispositivo mudou

```bash
opencraft devices list
opencraft pairing list --channel <channel> [--account <id>]
opencraft logs --follow
opencraft doctor
```

O que verificar:

- Aprovações de dispositivo pendentes para dashboard/nodes.
- Aprovações de pareamento de DM pendentes após mudanças de política ou identidade.

Assinaturas comuns:

- `device identity required` → auth de dispositivo não satisfeita.
- `pairing required` → remetente/dispositivo deve ser aprovado.

Se a config do serviço e o runtime ainda discordarem após verificações, reinstale os metadados do serviço do mesmo perfil/diretório de state:

```bash
opencraft gateway install --force
opencraft gateway restart
```

Relacionado:

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
