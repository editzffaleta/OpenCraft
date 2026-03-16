---
summary: "App companion OpenCraft macOS (barra de menu + broker de gateway)"
read_when:
  - Implementando recursos do app macOS
  - Alterando ciclo de vida do gateway ou bridging de nó no macOS
title: "App macOS"
---

# App Companion OpenCraft macOS (barra de menu + broker de gateway)

O app macOS é o **companion de barra de menu** do OpenCraft. Gerencia permissões,
gerencia/conecta ao Gateway localmente (launchd ou manual), e expõe capacidades macOS
ao agente como um nó.

## O que ele faz

- Exibe notificações nativas e status na barra de menu.
- Gerencia prompts TCC (Notificações, Acessibilidade, Gravação de Tela, Microfone,
  Reconhecimento de Fala, Automação/AppleScript).
- Roda ou conecta ao Gateway (local ou remoto).
- Expõe tools exclusivas do macOS (Canvas, Câmera, Gravação de Tela, `system.run`).
- Inicia o serviço de host do nó local no modo **remoto** (launchd), e o para no modo **local**.
- Opcionalmente hospeda o **PeekabooBridge** para automação de UI.
- Instala o CLI global (`opencraft`) via npm/pnpm sob demanda (bun não é recomendado para o runtime do Gateway).

## Modo local vs remoto

- **Local** (padrão): o app conecta a um Gateway local em execução, se presente;
  caso contrário, habilita o serviço launchd via `opencraft gateway install`.
- **Remoto**: o app conecta a um Gateway via SSH/Tailscale e nunca inicia
  um processo local.
  O app inicia o **serviço de host do nó** local para que o Gateway remoto possa alcançar este Mac.
  O app não inicia o Gateway como processo filho.

## Controle do Launchd

O app gerencia um LaunchAgent por usuário com o rótulo `ai.openclaw.gateway`
(ou `ai.openclaw.<profile>` ao usar `--profile`/`OPENCLAW_PROFILE`; o legado `com.openclaw.*` ainda é descarregado).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Substitua o rótulo por `ai.openclaw.<profile>` ao rodar um perfil nomeado.

Se o LaunchAgent não estiver instalado, habilite-o no app ou execute
`opencraft gateway install`.

## Capacidades do nó (mac)

O app macOS se apresenta como um nó. Comandos comuns:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Câmera: `camera.snap`, `camera.clip`
- Tela: `screen.record`
- Sistema: `system.run`, `system.notify`

O nó reporta um mapa `permissions` para que os agentes possam decidir o que é permitido.

Serviço de nó + IPC do app:

- Quando o serviço de host do nó headless está rodando (modo remoto), conecta ao Gateway WS como nó.
- `system.run` executa no app macOS (contexto UI/TCC) via socket Unix local; prompts + saída ficam no app.

Diagrama (SCI):

```
Gateway -> Serviço de Nó (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             App Mac (UI + TCC + system.run)
```

## Aprovações de exec (system.run)

`system.run` é controlado pelas **aprovações de exec** no app macOS (Configurações → Exec approvals).
Segurança + perguntar + allowlist são armazenados localmente no Mac em:

```
~/.opencraft/exec-approvals.json
```

Exemplo:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Notas:

- Entradas `allowlist` são padrões glob para caminhos de binários resolvidos.
- Texto de comando shell bruto que contém sintaxe de controle ou expansão de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é tratado como miss na allowlist e requer aprovação explícita (ou allowlist do binário shell).
- Escolher "Sempre Permitir" no prompt adiciona esse comando à allowlist.
- Sobrescritas de ambiente em `system.run` são filtradas (remove `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) e mescladas com o ambiente do app.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), sobrescritas de ambiente com escopo de requisição são reduzidas a uma lista explícita pequena (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões de allow-always em modo allowlist, wrappers de despacho conhecidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos de executável interno em vez de caminhos de wrapper. Se o desempacotamento não for seguro, nenhuma entrada de allowlist é persistida automaticamente.

## Deep links

O app registra o esquema de URL `openclaw://` para ações locais.

### `openclaw://agent`

Dispara uma requisição `agent` para o Gateway.

```bash
open 'openclaw://agent?message=Hello%20from%20deep%20link'
```

Parâmetros de query:

- `message` (obrigatório)
- `sessionKey` (opcional)
- `thinking` (opcional)
- `deliver` / `to` / `channel` (opcional)
- `timeoutSeconds` (opcional)
- `key` (chave opcional de modo não supervisionado)

Segurança:

- Sem `key`, o app solicita confirmação.
- Sem `key`, o app enforça um limite curto de mensagem para o prompt de confirmação e ignora `deliver` / `to` / `channel`.
- Com uma `key` válida, a execução é não supervisionada (destinada a automações pessoais).

## Fluxo de onboarding (típico)

1. Instale e lance o **OpenCraft.app**.
2. Complete a lista de verificação de permissões (prompts TCC).
3. Certifique-se de que o modo **Local** está ativo e o Gateway está rodando.
4. Instale o CLI se quiser acesso pelo terminal.

## Localização do diretório de estado (macOS)

Evite colocar seu diretório de estado do OpenCraft no iCloud ou outras pastas sincronizadas na nuvem.
Caminhos com backup em nuvem podem adicionar latência e ocasionalmente causar disputas de file-lock/sync para
sessões e credenciais.

Prefira um caminho de estado local não sincronizado como:

```bash
OPENCLAW_STATE_DIR=~/.opencraft
```

Se `opencraft doctor` detectar estado em:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

ele avisará e recomendará mover de volta para um caminho local.

## Fluxo de build e dev (nativo)

- `cd apps/macos && swift build`
- `swift run OpenCraft` (ou Xcode)
- Empacotar app: `scripts/package-mac-app.sh`

## Depurar conectividade do gateway (CLI macOS)

Use o CLI de depuração para exercitar a mesma lógica de handshake WebSocket e descoberta do Gateway
que o app macOS usa, sem lançar o app.

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

Opções de conexão:

- `--url <ws://host:porta>`: sobrescrever config
- `--mode <local|remote>`: resolver da config (padrão: config ou local)
- `--probe`: forçar um probe de saúde novo
- `--timeout <ms>`: timeout da requisição (padrão: `15000`)
- `--json`: saída estruturada para comparação

Opções de descoberta:

- `--include-local`: incluir gateways que seriam filtrados como "local"
- `--timeout <ms>`: janela de descoberta geral (padrão: `2000`)
- `--json`: saída estruturada para comparação

Dica: compare com `opencraft gateway discover --json` para verificar se o pipeline de
descoberta do app macOS (NWBrowser + fallback tailnet DNS-SD) difere do discovery baseado em `dns-sd` do Node CLI.

## Encanamento de conexão remota (túneis SSH)

Quando o app macOS roda no modo **Remoto**, abre um túnel SSH para que componentes locais de UI
possam falar com um Gateway remoto como se estivesse no localhost.

### Túnel de controle (porta WebSocket do Gateway)

- **Finalidade:** verificações de saúde, status, Web Chat, config e outras chamadas do plano de controle.
- **Porta local:** a porta do Gateway (padrão `18789`), sempre estável.
- **Porta remota:** a mesma porta do Gateway no host remoto.
- **Comportamento:** sem porta local aleatória; o app reutiliza um túnel saudável existente
  ou o reinicia se necessário.
- **Forma SSH:** `ssh -N -L <local>:127.0.0.1:<remoto>` com BatchMode +
  ExitOnForwardFailure + opções de keepalive.
- **Reporte de IP:** o túnel SSH usa loopback, então o gateway verá o IP do nó
  como `127.0.0.1`. Use o transporte **Direto (ws/wss)** se quiser que o IP real do cliente
  apareça (veja [acesso remoto macOS](/platforms/mac/remote)).

Para passos de configuração, veja [acesso remoto macOS](/platforms/mac/remote). Para detalhes do
protocolo, veja [Protocolo do Gateway](/gateway/protocol).

## Docs relacionados

- [Runbook do Gateway](/gateway)
- [Gateway (macOS)](/platforms/mac/bundled-gateway)
- [Permissões macOS](/platforms/mac/permissions)
- [Canvas](/platforms/mac/canvas)
