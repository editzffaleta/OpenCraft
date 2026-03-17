---
summary: "CLI do Gateway OpenCraft (`opencraft gateway`) — executar, consultar e descobrir gateways"
read_when:
  - Executando o Gateway pela CLI (dev ou servidores)
  - Depurando autenticação, modos de bind e conectividade do Gateway
  - Descobrindo gateways via Bonjour (LAN + tailnet)
title: "gateway"
---

# CLI do Gateway

O Gateway é o servidor WebSocket do OpenCraft (canais, nodes, sessões, hooks).

Os subcomandos nesta página estão sob `opencraft gateway …`.

Documentação relacionada:

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## Executar o Gateway

Execute um processo local do Gateway:

```bash
opencraft gateway
```

Alias em primeiro plano:

```bash
opencraft gateway run
```

Observações:

- Por padrão, o Gateway recusa iniciar a menos que `gateway.mode=local` esteja definido em `~/.editzffaleta/OpenCraft.json`. Use `--allow-unconfigured` para execuções ad-hoc/dev.
- Vincular além do loopback sem autenticação é bloqueado (proteção de segurança).
- `SIGUSR1` aciona uma reinicialização em processo quando autorizado (`commands.restart` está habilitado por padrão; defina `commands.restart: false` para bloquear reinicialização manual, enquanto ferramentas de gateway/config apply/update continuam permitidos).
- Handlers de `SIGINT`/`SIGTERM` param o processo do gateway, mas não restauram nenhum estado personalizado do terminal. Se você envolve a CLI com uma TUI ou entrada raw-mode, restaure o terminal antes de sair.

### Opções

- `--port <porta>`: porta WebSocket (padrão vem da config/env; geralmente `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: modo de bind do listener.
- `--auth <token|password>`: substituição do modo de autenticação.
- `--token <token>`: substituição de token (também define `OPENCLAW_GATEWAY_TOKEN` para o processo).
- `--password <senha>`: substituição de senha. Aviso: senhas inline podem ser expostas em listagens de processos locais.
- `--password-file <caminho>`: ler a senha do gateway de um arquivo.
- `--tailscale <off|serve|funnel>`: expor o Gateway via Tailscale.
- `--tailscale-reset-on-exit`: resetar config de serve/funnel do Tailscale ao encerrar.
- `--allow-unconfigured`: permitir início do gateway sem `gateway.mode=local` na config.
- `--dev`: criar config + workspace de dev se ausente (pula BOOTSTRAP.md).
- `--reset`: resetar config + credenciais + sessões + workspace de dev (requer `--dev`).
- `--force`: encerrar qualquer listener existente na porta selecionada antes de iniciar.
- `--verbose`: logs detalhados.
- `--claude-cli-logs`: mostrar apenas logs do claude-cli no console (e habilitar seu stdout/stderr).
- `--ws-log <auto|full|compact>`: estilo de log websocket (padrão `auto`).
- `--compact`: alias para `--ws-log compact`.
- `--raw-stream`: registrar eventos brutos de stream de modelo em jsonl.
- `--raw-stream-path <caminho>`: caminho do jsonl de stream bruto.

## Consultar um Gateway em execução

Todos os comandos de consulta usam WebSocket RPC.

Modos de saída:

- Padrão: legível por humanos (colorido em TTY).
- `--json`: JSON legível por máquina (sem estilo/spinner).
- `--no-color` (ou `NO_COLOR=1`): desabilitar ANSI mantendo layout humano.

Opções compartilhadas (quando suportado):

- `--url <url>`: URL WebSocket do Gateway.
- `--token <token>`: Token do Gateway.
- `--password <senha>`: Senha do Gateway.
- `--timeout <ms>`: timeout/orçamento (varia por comando).
- `--expect-final`: aguardar uma resposta "final" (chamadas de agente).

Nota: quando você define `--url`, a CLI não recorre a credenciais de config ou ambiente.
Passe `--token` ou `--password` explicitamente. Credenciais explícitas ausentes é um erro.

### `gateway health`

```bash
opencraft gateway health --url ws://127.0.0.1:18789
```

### `gateway status`

`gateway status` mostra o serviço do Gateway (launchd/systemd/schtasks) mais uma verificação RPC opcional.

```bash
opencraft gateway status
opencraft gateway status --json
opencraft gateway status --require-rpc
```

Opções:

- `--url <url>`: substituir a URL de verificação.
- `--token <token>`: autenticação por token para a verificação.
- `--password <senha>`: autenticação por senha para a verificação.
- `--timeout <ms>`: timeout da verificação (padrão `10000`).
- `--no-probe`: pular a verificação RPC (visualização apenas do serviço).
- `--deep`: varrer serviços de nível do sistema também.
- `--require-rpc`: sair com código não-zero quando a verificação RPC falha. Não pode ser combinado com `--no-probe`.

Observações:

- `gateway status` resolve SecretRefs de autenticação configurados para autenticação de verificação quando possível.
- Se um SecretRef de autenticação necessário não está resolvido neste caminho de comando, `gateway status --json` reporta `rpc.authWarning` quando a verificação de conectividade/autenticação falha; passe `--token`/`--password` explicitamente ou resolva a fonte do segredo primeiro.
- Se a verificação é bem-sucedida, avisos de ref de autenticação não resolvidos são suprimidos para evitar falsos positivos.
- Use `--require-rpc` em scripts e automação quando um serviço escutando não é suficiente e você precisa que o RPC do Gateway esteja saudável.
- Em instalações Linux systemd, verificações de desvio de token de status leem tanto valores `Environment=` quanto `EnvironmentFile=` da unidade (incluindo `%h`, caminhos entre aspas, múltiplos arquivos e arquivos opcionais com `-`).

### `gateway probe`

`gateway probe` é o comando "depurar tudo". Ele sempre verifica:

- seu gateway remoto configurado (se definido), e
- localhost (loopback) **mesmo se remoto estiver configurado**.

Se múltiplos gateways estão acessíveis, ele imprime todos. Múltiplos gateways são suportados quando você usa perfis/portas isolados (ex.: um bot de resgate), mas a maioria das instalações ainda executa um único gateway.

```bash
opencraft gateway probe
opencraft gateway probe --json
```

Interpretação:

- `Reachable: yes` significa que pelo menos um alvo aceitou uma conexão WebSocket.
- `RPC: ok` significa que chamadas RPC detalhadas (`health`/`status`/`system-presence`/`config.get`) também tiveram sucesso.
- `RPC: limited - missing scope: operator.read` significa que a conexão teve sucesso mas o RPC detalhado tem escopo limitado. Isso é reportado como acessibilidade **degradada**, não falha total.
- O código de saída é não-zero apenas quando nenhum alvo verificado está acessível.

Observações sobre JSON (`--json`):

- Nível superior:
  - `ok`: pelo menos um alvo está acessível.
  - `degraded`: pelo menos um alvo teve RPC detalhado com escopo limitado.
- Por alvo (`targets[].connect`):
  - `ok`: acessibilidade após conexão + classificação degradada.
  - `rpcOk`: sucesso total do RPC detalhado.
  - `scopeLimited`: RPC detalhado falhou devido a escopo de operador ausente.

#### Remoto via SSH (paridade com app Mac)

O modo "Remoto via SSH" do app macOS usa um port-forward local para que o gateway remoto (que pode estar vinculado apenas ao loopback) se torne acessível em `ws://127.0.0.1:<porta>`.

Equivalente na CLI:

```bash
opencraft gateway probe --ssh user@gateway-host
```

Opções:

- `--ssh <alvo>`: `usuario@host` ou `usuario@host:porta` (porta padrão `22`).
- `--ssh-identity <caminho>`: arquivo de identidade.
- `--ssh-auto`: escolher o primeiro host gateway descoberto como alvo SSH (apenas LAN/WAB).

Config (opcional, usado como padrões):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Auxiliar RPC de baixo nível.

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

Observações:

- `gateway install` suporta `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Quando autenticação por token requer um token e `gateway.auth.token` é gerenciado por SecretRef, `gateway install` valida que o SecretRef é resolvível mas não persiste o token resolvido nos metadados de ambiente do serviço.
- Se autenticação por token requer um token e o SecretRef de token configurado não está resolvido, a instalação falha de forma fechada em vez de persistir texto plano de fallback.
- Para autenticação por senha em `gateway run`, prefira `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, ou um `gateway.auth.password` com SecretRef em vez de `--password` inline.
- No modo de autenticação inferido, `OPENCLAW_GATEWAY_PASSWORD`/`CLAWDBOT_GATEWAY_PASSWORD` apenas em shell não relaxa os requisitos de token de instalação; use config durável (`gateway.auth.password` ou config `env`) ao instalar um serviço gerenciado.
- Se tanto `gateway.auth.token` quanto `gateway.auth.password` estão configurados e `gateway.auth.mode` não está definido, a instalação é bloqueada até que o modo seja definido explicitamente.
- Comandos de ciclo de vida aceitam `--json` para scripts.

## Descobrir gateways (Bonjour)

`gateway discover` varre em busca de beacons do Gateway (`_opencraft-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): escolha um domínio (exemplo: `opencraft.internal.`) e configure split DNS + um servidor DNS; veja [/gateway/bonjour](/gateway/bonjour)

Apenas gateways com descoberta Bonjour habilitada (padrão) anunciam o beacon.

Registros de descoberta Wide-Area incluem (TXT):

- `role` (dica de papel do gateway)
- `transport` (dica de transporte, ex.: `gateway`)
- `gatewayPort` (porta WebSocket, geralmente `18789`)
- `sshPort` (porta SSH; padrão `22` se não presente)
- `tailnetDns` (hostname MagicDNS, quando disponível)
- `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + fingerprint do certificado)
- `cliPath` (dica opcional para instalações remotas)

### `gateway discover`

```bash
opencraft gateway discover
```

Opções:

- `--timeout <ms>`: timeout por comando (browse/resolve); padrão `2000`.
- `--json`: saída legível por máquina (também desabilita estilo/spinner).

Exemplos:

```bash
opencraft gateway discover --timeout 4000
opencraft gateway discover --json | jq '.beacons[].wsUrl'
```
