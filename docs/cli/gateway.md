---
summary: "CLI do Gateway OpenCraft (`opencraft gateway`) — rodar, consultar e descobrir gateways"
read_when:
  - Rodando o Gateway pelo CLI (dev ou servidores)
  - Depurando auth, modos de bind e conectividade do Gateway
  - Descobrindo gateways via Bonjour (LAN + tailnet)
title: "gateway"
---

# CLI do Gateway

O Gateway é o servidor WebSocket do OpenCraft (canais, nodes, sessões, hooks).

Subcomandos desta página ficam em `opencraft gateway …`.

Docs relacionados:

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## Rodar o Gateway

Rodar um processo de Gateway local:

```bash
opencraft gateway
```

Alias em foreground:

```bash
opencraft gateway run
```

Notas:

- Por padrão, o Gateway se recusa a iniciar a menos que `gateway.mode=local` esteja definido em `~/.opencraft/opencraft.json`. Use `--allow-unconfigured` para execuções ad-hoc/dev.
- Binding além de loopback sem auth é bloqueado (guardrail de segurança).
- `SIGUSR1` aciona um restart in-process quando autorizado (`commands.restart` está habilitado por padrão; defina `commands.restart: false` para bloquear restart manual, enquanto gateway tool/config apply/update permanecem permitidos).
- Handlers `SIGINT`/`SIGTERM` param o processo do gateway, mas não restauram estado de terminal personalizado. Se você envolver o CLI com uma TUI ou input de modo raw, restaure o terminal antes de sair.

### Opções

- `--port <port>`: porta WebSocket (padrão vem de config/env; geralmente `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: modo de bind do listener.
- `--auth <token|password>`: override do modo de auth.
- `--token <token>`: override de token (também define `OPENCLAW_GATEWAY_TOKEN` para o processo).
- `--password <password>`: override de senha. Aviso: senhas inline podem ser expostas em listagens de processos locais.
- `--password-file <path>`: ler a senha do gateway de um arquivo.
- `--tailscale <off|serve|funnel>`: expor o Gateway via Tailscale.
- `--tailscale-reset-on-exit`: resetar config de serve/funnel do Tailscale no shutdown.
- `--allow-unconfigured`: permitir início do gateway sem `gateway.mode=local` na config.
- `--dev`: criar uma config dev + workspace se ausente (pula BOOTSTRAP.md).
- `--reset`: resetar config dev + credenciais + sessões + workspace (requer `--dev`).
- `--force`: matar qualquer listener existente na porta selecionada antes de iniciar.
- `--verbose`: logs detalhados.
- `--claude-cli-logs`: exibir apenas logs do claude-cli no console (e habilitar seu stdout/stderr).
- `--ws-log <auto|full|compact>`: estilo de log de websocket (padrão `auto`).
- `--compact`: alias para `--ws-log compact`.
- `--raw-stream`: registrar eventos raw do stream de modelo em jsonl.
- `--raw-stream-path <path>`: path do jsonl de stream raw.

## Consultar um Gateway em execução

Todos os comandos de consulta usam RPC WebSocket.

Modos de saída:

- Padrão: legível por humanos (colorido em TTY).
- `--json`: JSON legível por máquina (sem styling/spinner).
- `--no-color` (ou `NO_COLOR=1`): desabilitar ANSI mantendo layout humano.

Opções compartilhadas (onde suportado):

- `--url <url>`: URL WebSocket do Gateway.
- `--token <token>`: token do Gateway.
- `--password <password>`: senha do Gateway.
- `--timeout <ms>`: timeout/budget (varia por comando).
- `--expect-final`: aguardar uma resposta "final" (chamadas de agente).

Nota: ao definir `--url`, o CLI não retorna para credenciais de config ou ambiente.
Passe `--token` ou `--password` explicitamente. Credenciais explícitas ausentes são um erro.

### `gateway health`

```bash
opencraft gateway health --url ws://127.0.0.1:18789
```

### `gateway status`

`gateway status` mostra o serviço do Gateway (launchd/systemd/schtasks) mais uma probe RPC opcional.

```bash
opencraft gateway status
opencraft gateway status --json
opencraft gateway status --require-rpc
```

Opções:

- `--url <url>`: sobrescrever a URL da probe.
- `--token <token>`: auth por token para a probe.
- `--password <password>`: auth por senha para a probe.
- `--timeout <ms>`: timeout da probe (padrão `10000`).
- `--no-probe`: pular a probe RPC (visão apenas de serviço).
- `--deep`: escanear serviços de nível de sistema também.
- `--require-rpc`: sair com não-zero quando a probe RPC falha. Não pode ser combinado com `--no-probe`.

Notas:

- `gateway status` resolve SecretRefs de auth configurados para auth de probe quando possível.
- Se um SecretRef de auth obrigatório não estiver resolvido neste path de comando, a auth de probe pode falhar; passe `--token`/`--password` explicitamente ou resolva a fonte do segredo primeiro.
- Use `--require-rpc` em scripts e automação quando um serviço ouvindo não é suficiente e você precisa que o RPC do Gateway em si esteja saudável.
- Em instalações systemd Linux, verificações de deriva de auth de serviço leem valores de `Environment=` e `EnvironmentFile=` da unit (incluindo `%h`, paths entre aspas, múltiplos arquivos e arquivos opcionais `-`).

### `gateway probe`

`gateway probe` é o comando "depurar tudo". Ele sempre faz probe:

- do seu gateway remoto configurado (se definido), e
- do localhost (loopback) **mesmo que o remoto esteja configurado**.

Se múltiplos gateways estiverem acessíveis, ele imprime todos eles. Múltiplos gateways são suportados quando você usa perfis/portas isolados (por exemplo, um bot de rescue), mas a maioria das instalações ainda roda um único gateway.

```bash
opencraft gateway probe
opencraft gateway probe --json
```

Interpretação:

- `Reachable: yes` significa que ao menos um alvo aceitou uma conexão WebSocket.
- `RPC: ok` significa que chamadas RPC de detalhe (`health`/`status`/`system-presence`/`config.get`) também tiveram sucesso.
- `RPC: limited - missing scope: operator.read` significa que a conexão teve sucesso mas o RPC de detalhe tem escopo limitado. Isso é reportado como reachability **degradada**, não falha total.
- O código de saída é não-zero apenas quando nenhum alvo testado está acessível.

Notas JSON (`--json`):

- Nível superior:
  - `ok`: ao menos um alvo está acessível.
  - `degraded`: ao menos um alvo teve RPC de detalhe com escopo limitado.
- Por alvo (`targets[].connect`):
  - `ok`: acessibilidade após conexão + classificação degradada.
  - `rpcOk`: sucesso total do RPC de detalhe.
  - `scopeLimited`: RPC de detalhe falhou por falta de escopo de operador.

#### Remoto via SSH (paridade com app Mac)

O modo "Remote over SSH" do app macOS usa um port-forward local para que o gateway remoto (que pode estar vinculado apenas ao loopback) se torne acessível em `ws://127.0.0.1:<port>`.

Equivalente CLI:

```bash
opencraft gateway probe --ssh user@gateway-host
```

Opções:

- `--ssh <target>`: `user@host` ou `user@host:port` (porta padrão: `22`).
- `--ssh-identity <path>`: arquivo de identidade.
- `--ssh-auto`: escolher o primeiro host de gateway descoberto como alvo SSH (apenas LAN/WAB).

Config (opcional, usada como padrão):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Helper de RPC de baixo nível.

```bash
opencraft gateway call status
opencraft gateway call logs.tail --params '{"sinceMs": 60000}'
```

## Gerenciar o serviço do Gateway

```bash
opencraft gateway install
opencraft gateway start
opencraft gateway stop
opencraft gateway restart
opencraft gateway uninstall
```

Notas:

- `gateway install` suporta `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Quando auth por token requer um token e `gateway.auth.token` é gerenciado por SecretRef, `gateway install` valida que o SecretRef é resolvível mas não persiste o token resolvido nos metadados de ambiente do serviço.
- Se auth por token requer um token e o SecretRef de token configurado não está resolvido, a instalação falha fechada em vez de persistir texto simples de fallback.
- Para auth por senha em `gateway run`, prefira `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, ou um `gateway.auth.password` com SecretRef em vez de `--password` inline.
- Em modo de auth inferido, `OPENCLAW_GATEWAY_PASSWORD`/`CLAWDBOT_GATEWAY_PASSWORD` apenas de shell não relaxa os requisitos de token de instalação; use config durável (`gateway.auth.password` ou config `env`) ao instalar um serviço gerenciado.
- Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação é bloqueada até que o modo seja definido explicitamente.
- Comandos de ciclo de vida aceitam `--json` para scripts.

## Descobrir gateways (Bonjour)

`gateway discover` escaneia por beacons do Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): escolha um domínio (exemplo: `openclaw.internal.`) e configure split DNS + um servidor DNS; veja [/gateway/bonjour](/gateway/bonjour)

Apenas gateways com descoberta Bonjour habilitada (padrão) anunciam o beacon.

Registros de descoberta Wide-Area incluem (TXT):

- `role` (hint de papel do gateway)
- `transport` (hint de transporte, ex. `gateway`)
- `gatewayPort` (porta WebSocket, geralmente `18789`)
- `sshPort` (porta SSH; padrão `22` se não presente)
- `tailnetDns` (hostname MagicDNS, quando disponível)
- `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + fingerprint do cert)
- `cliPath` (hint opcional para instalações remotas)

### `gateway discover`

```bash
opencraft gateway discover
```

Opções:

- `--timeout <ms>`: timeout por comando (browse/resolve); padrão `2000`.
- `--json`: saída legível por máquina (também desabilita styling/spinner).

Exemplos:

```bash
opencraft gateway discover --timeout 4000
opencraft gateway discover --json | jq '.beacons[].wsUrl'
```
