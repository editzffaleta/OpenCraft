---
summary: "Aplicativo complementar macOS do OpenCraft (barra de menus + broker do Gateway)"
read_when:
  - Implementando recursos do aplicativo macOS
  - Alterando o ciclo de vida do Gateway ou bridge de nó no macOS
title: "Aplicativo macOS"
---

# Complemento macOS do OpenCraft (barra de menus + broker do Gateway)

O aplicativo macOS é o **complemento da barra de menus** para OpenCraft. Ele possui permissões,
gerencia/se anexa ao Gateway localmente (launchd ou manual), e expõe recursos do macOS para o agente como um nó.

## O que ele faz

- Mostra notificações nativas e status na barra de menus.
- Possui prompts de TCC (Notificações, Acessibilidade, Gravação de Tela, Microfone,
  Reconhecimento de Fala, Automação/AppleScript).
- Executa ou se conecta ao Gateway (local ou remoto).
- Expõe ferramentas exclusivas do macOS (Canvas, Câmera, Gravação de Tela, `system.run`).
- Inicia o serviço de host do nó local em modo **remoto** (launchd) e o interrompe em modo **local**.
- Hospeda opcionalmente **PeekabooBridge** para automação de UI.
- Instala o CLI global (`opencraft`) via npm/pnpm sob demanda (bun não é recomendado para o tempo de execução do Gateway).

## Modo local versus remoto

- **Local** (padrão): o aplicativo se anexa a um Gateway local em execução, se presente;
  caso contrário, ele ativa o serviço launchd via `opencraft gateway install`.
- **Remoto**: o aplicativo se conecta a um Gateway via SSH/Tailscale e nunca inicia
  um processo local.
  O aplicativo inicia o **serviço de host do nó** local para que o Gateway remoto possa acessar este Mac.
  O aplicativo não gera o Gateway como um processo filho.

## Controle de Launchd

O aplicativo gerencia um LaunchAgent por usuário rotulado como `ai.opencraft.gateway`
(ou `ai.opencraft.<profile>` ao usar `--profile`/`OPENCRAFT_PROFILE`; `com.opencraft.*` legado ainda descarrega).

```bash
launchctl kickstart -k gui/$UID/ai.opencraft.gateway
launchctl bootout gui/$UID/ai.opencraft.gateway
```

Substitua o rótulo por `ai.opencraft.<profile>` ao executar um perfil nomeado.

Se o LaunchAgent não estiver instalado, ative-o no aplicativo ou execute
`opencraft gateway install`.

## Recursos de nó (mac)

O aplicativo macOS se apresenta como um nó. Comandos comuns:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Câmera: `camera.snap`, `camera.clip`
- Tela: `screen.record`
- Sistema: `system.run`, `system.notify`

O nó relata um mapa de `permissions` para que os agentes possam decidir o que é permitido.

Serviço de nó + IPC de aplicativo:

- Quando o serviço de host do nó headless está em execução (modo remoto), ele se conecta ao WS do Gateway como um nó.
- `system.run` é executado no aplicativo macOS (contexto de UI/TCC) através de um socket Unix local; prompts + saída permanecem no aplicativo.

Diagrama (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Aprovações de execução (system.run)

`system.run` é controlado por **Aprovações de Execução** no aplicativo macOS (Configurações → Aprovações de Execução).
Segurança + perguntar + lista de permissões são armazenadas localmente no Mac em:

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

- As entradas de `allowlist` são padrões glob para caminhos binários resolvidos.
- Texto de comando shell bruto que contém controle de shell ou sintaxe de expansão (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é tratado como falta de lista de permissões e requer aprovação explícita (ou lista de permissões do binário do shell).
- Escolher "Sempre Permitir" no prompt adiciona esse comando à lista de permissões.
- As substituições de ambiente `system.run` são filtradas (remove `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) e depois mescladas com o ambiente do aplicativo.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), as substituições de ambiente com escopo de solicitação são reduzidas a uma pequena lista explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões sempre permitidas no modo de lista de permissões, wrappers de dispatch conhecidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos executáveis internos em vez de caminhos de wrapper. Se o desempacotamento não for seguro, nenhuma entrada de lista de permissões é persistida automaticamente.

## Links profundos

O aplicativo registra o esquema de URL `opencraft://` para ações locais.

### `opencraft://agent`

Dispara uma solicitação de `agent` do Gateway.

```bash
open 'opencraft://agent?message=Hello%20from%20deep%20link'
```

Parâmetros de consulta:

- `message` (obrigatório)
- `sessionKey` (opcional)
- `thinking` (opcional)
- `deliver` / `to` / `channel` (opcional)
- `timeoutSeconds` (opcional)
- `key` (chave de modo autônomo opcional)

Segurança:

- Sem `key`, o aplicativo solicita confirmação.
- Sem `key`, o aplicativo impõe um limite de mensagem curta para o prompt de confirmação e ignora `deliver` / `to` / `channel`.
- Com uma `key` válida, a execução é autônoma (destinada a automações pessoais).

## Fluxo de integração (típico)

1. Instale e inicie **OpenCraft.app**.
2. Conclua a lista de verificação de permissões (prompts de TCC).
3. Certifique-se de que o modo **Local** está ativo e o Gateway está em execução.
4. Instale a CLI se desejar acesso ao terminal.

## Posicionamento do diretório de estado (macOS)

Evite colocar seu diretório de estado do OpenCraft em iCloud ou outras pastas sincronizadas na nuvem.
Caminhos com suporte de sincronização podem adicionar latência e ocasionalmente causar travamento de arquivo/corridas de sincronização para
sessões e credenciais.

Prefira um caminho de estado local não sincronizado, como:

```bash
OPENCRAFT_STATE_DIR=~/.opencraft
```

Se `opencraft doctor` detectar estado em:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

ele avisará e recomendará voltar para um caminho local.

## Fluxo de construção e desenvolvimento (nativo)

- `cd apps/macos && swift build`
- `swift run OpenCraft` (ou Xcode)
- Empacotar aplicativo: `scripts/package-mac-app.sh`

## Depuração de conectividade do Gateway (macOS CLI)

Use a CLI de depuração para exercitar o mesmo handshake WebSocket do Gateway e a lógica de descoberta
que o aplicativo macOS usa, sem iniciar o aplicativo.

```bash
cd apps/macos
swift run opencraft-mac connect --json
swift run opencraft-mac discover --timeout 3000 --json
```

Opções de conexão:

- `--url <ws://host:port>`: substituir configuração
- `--mode <local|remote>`: resolver da configuração (padrão: configuração ou local)
- `--probe`: forçar uma sonda de integridade atualizada
- `--timeout <ms>`: timeout de solicitação (padrão: `15000`)
- `--json`: saída estruturada para comparação

Opções de descoberta:

- `--include-local`: incluir gateways que seriam filtrados como "local"
- `--timeout <ms>`: janela de descoberta geral (padrão: `2000`)
- `--json`: saída estruturada para comparação

Dica: compare com `opencraft gateway discover --json` para ver se o
pipeline de descoberta do aplicativo macOS (NWBrowser + fallback de DNS-SD de tailnet) difere do
CLI do Node baseado em `dns-sd`.

## Encanamento de conexão remota (túneis SSH)

Quando o aplicativo macOS é executado em modo **Remoto**, ele abre um túnel SSH para que componentes locais de UI
possam se comunicar com um Gateway remoto como se estivesse em localhost.

### Túnel de controle (porta WebSocket do Gateway)

- **Propósito:** verificações de integridade, status, Web Chat, configuração e outras chamadas do plano de controle.
- **Porta local:** a porta do Gateway (padrão `18789`), sempre estável.
- **Porta remota:** a mesma porta do Gateway no host remoto.
- **Comportamento:** sem porta local aleatória; o aplicativo reutiliza um túnel existente e saudável
  ou o reinicia se necessário.
- **Forma SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` com BatchMode +
  opções ExitOnForwardFailure + keepalive.
- **Relatório de IP:** o túnel SSH usa loopback, portanto o Gateway verá o IP do nó como `127.0.0.1`. Use **Direct (ws/wss)** transport se quiser que o IP real do cliente apareça (consulte [macOS remote access](/platforms/mac/remote)).

Para etapas de configuração, consulte [macOS remote access](/platforms/mac/remote). Para detalhes de protocolo,
consulte [Gateway protocol](/gateway/protocol).

## Documentação relacionada

- [Runbook do Gateway](/gateway)
- [Gateway (macOS)](/platforms/mac/bundled-gateway)
- [Permissões macOS](/platforms/mac/permissions)
- [Canvas](/platforms/mac/canvas)
