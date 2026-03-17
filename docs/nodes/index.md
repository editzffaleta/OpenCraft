---
summary: "Nós: emparelhamento, capacidades, permissões e auxiliares de CLI para canvas/câmera/tela/dispositivo/notificações/sistema"
read_when:
  - Emparelhando nós iOS/Android a um Gateway
  - Usando canvas/câmera do nó para contexto do agente
  - Adicionando novos comandos de nó ou auxiliares de CLI
title: "Nós"
---

# Nós

Um **nó** é um dispositivo complementar (macOS/iOS/Android/headless) que se conecta ao WebSocket do Gateway **WebSocket** (mesma porta que operadores) com `role: "node"` e expõe uma superfície de comando (p. ex. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Detalhes de protocolo: [Protocolo do Gateway](/gateway/protocol).

Transporte legado: [Protocolo de Bridge](/gateway/bridge-protocol) (TCP JSONL; descontinuado/removido para nós atuais).

macOS também pode ser executado em **modo de nó**: o aplicativo da barra de menus se conecta ao servidor WS do Gateway e expõe seus comandos locais de Canvas/câmera como um nó (então `opencraft nodes …` funciona contra este Mac).

Notas:

- Nós são **periféricos**, não Gateways. Eles não executam o serviço Gateway.
- Mensagens de Telegram/WhatsApp/etc. chegam ao **Gateway**, não em nós.
- Runbook de solução de problemas: [/nodes/troubleshooting](/nodes/troubleshooting)

## Emparelhamento + status

**Nós WS usam emparelhamento de dispositivo.** Nós apresentam uma identidade de dispositivo durante `connect`; o Gateway
cria uma solicitação de emparelhamento de dispositivo para `role: node`. Aprove via CLI de dispositivos (ou UI).

CLI rápido:

```bash
opencraft devices list
opencraft devices approve <requestId>
opencraft devices reject <requestId>
opencraft nodes status
opencraft nodes describe --node <idOrNameOrIp>
```

Notas:

- `nodes status` marca um nó como **emparelhado** quando seu papel de emparelhamento de dispositivo inclui `node`.
- `node.pair.*` (CLI: `opencraft nodes pending/approve/reject`) é um armazenamento de emparelhamento de nó separado de propriedade do Gateway; ele **não** bloqueia o handshake de `connect` WS.

## Host de nó remoto (system.run)

Use um **host de nó** quando seu Gateway for executado em uma máquina e você quiser que comandos
sejam executados em outra. O modelo ainda fala com o **Gateway**; o Gateway
encaminha chamadas `exec` para o **host de nó** quando `host=node` é selecionado.

### O que é executado onde

- **Host do Gateway**: recebe mensagens, executa o modelo, roteia chamadas de ferramentas.
- **Host do nó**: executa `system.run`/`system.which` na máquina do nó.
- **Aprovações**: aplicadas no host do nó via `~/.opencraft/exec-approvals.json`.

Nota de aprovação:

- Execuções de nó com suporte de aprovação vinculam contexto de solicitação exato.
- Para execuções de arquivo de runtime/shell diretas, OpenCraft também vincula melhor esforço um operando de arquivo local concreto
  e nega a execução se esse arquivo mudar antes da execução.
- Se OpenCraft não conseguir identificar exatamente um arquivo local concreto para um comando de intérprete/tempo de execução,
  a execução com suporte de aprovação é negada em vez de fingir cobertura de tempo de execução completo. Use sandbox,
  hosts separados ou uma lista de permissões confiável/fluxo de trabalho explícito para semântica de intérprete mais ampla.

### Inicie um host de nó (primeiro plano)

Na máquina do nó:

```bash
opencraft node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto via túnel SSH (ligação de loopback)

Se o Gateway se ligar a loopback (`gateway.bind=loopback`, padrão em modo local),
hosts de nó remotos não podem se conectar diretamente. Crie um túnel SSH e aponte o
host de nó para a extremidade local do túnel.

Exemplo (host de nó -> host de Gateway):

```bash
# Terminal A (manter em execução): encaminhar 18790 local -> 127.0.0.1:18789 do Gateway
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: exporte o token do Gateway e conecte através do túnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
opencraft node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notas:

- `opencraft node run` suporta autenticação de token ou senha.
- Variáveis de env são preferidas: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback de configuração é `gateway.auth.token` / `gateway.auth.password`.
- Em modo local, host de nó intencionalmente ignora `gateway.remote.token` / `gateway.remote.password`.
- Em modo remoto, `gateway.remote.token` / `gateway.remote.password` são elegíveis por regras de precedência remota.
- Se o `gateway.auth.*` SecretRefs locais ativo estiverem configurados, mas não resolvidos, a autenticação de host de nó falha fechada.
- As variáveis env `CLAWDBOT_GATEWAY_*` legadas são intencionalmente ignoradas pela resolução de autenticação do host de nó.

### Inicie um host de nó (serviço)

```bash
opencraft node install --host <gateway-host> --port 18789 --display-name "Build Node"
opencraft node restart
```

### Emparelhar + nomear

No host do Gateway:

```bash
opencraft devices list
opencraft devices approve <requestId>
opencraft nodes status
```

Opções de nomeação:

- `--display-name` em `opencraft node run` / `opencraft node install` (persiste em `~/.opencraft/node.json` no nó).
- `opencraft nodes rename --node <id|name|ip> --name "Build Node"` (substituição de Gateway).

### Lista de permissões dos comandos

As aprovações de exec são **por host de nó**. Adicione entradas de lista de permissões do Gateway:

```bash
opencraft approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
opencraft approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

As aprovações vivem no host do nó em `~/.opencraft/exec-approvals.json`.

### Aponte exec para o nó

Configure padrões (configuração do Gateway):

```bash
opencraft config set tools.exec.host node
opencraft config set tools.exec.security allowlist
opencraft config set tools.exec.node "<id-or-name>"
```

Ou por sessão:

```
/exec host=node security=allowlist node=<id-or-name>
```

Uma vez definido, qualquer chamada `exec` com `host=node` é executada no host do nó (sujeita a
lista de permissões/aprovações do nó).

Relacionado:

- [CLI do host de nó](/cli/node)
- [Ferramenta Exec](/tools/exec)
- [Aprovações Exec](/tools/exec-approvals)

## Invocando comandos

Nível baixo (RPC bruto):

```bash
opencraft nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Auxiliares de nível mais alto existem para os fluxos de trabalho "dar ao agente um anexo de MÍDIA" comuns.

## Screenshots (snapshots de Canvas)

Se o nó está mostrando a Canvas (WebView), `canvas.snapshot` retorna `{ format, base64 }`.

Auxiliar de CLI (escreve em um arquivo temporário e imprime `MEDIA:<path>`):

```bash
opencraft nodes canvas snapshot --node <idOrNameOrIp> --format png
opencraft nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Controles de Canvas

```bash
opencraft nodes canvas present --node <idOrNameOrIp> --target https://example.com
opencraft nodes canvas hide --node <idOrNameOrIp>
opencraft nodes canvas navigate https://example.com --node <idOrNameOrIp>
opencraft nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Notas:

- `canvas present` aceita URLs ou caminhos de arquivo locais (`--target`), mais `--x/--y/--width/--height` opcionais para posicionamento.
- `canvas eval` aceita JS inline (`--js`) ou um argumento posicional.

### A2UI (Canvas)

```bash
opencraft nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
opencraft nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
opencraft nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notas:

- Apenas JSONL A2UI v0.8 é suportado (v0.9/createSurface é rejeitado).

## Fotos + vídeos (câmera do nó)

Fotos (`jpg`):

```bash
opencraft nodes camera list --node <idOrNameOrIp>
opencraft nodes camera snap --node <idOrNameOrIp>            # padrão: ambas as câmeras (2 linhas de MÍDIA)
opencraft nodes camera snap --node <idOrNameOrIp> --facing front
```

Clipes de vídeo (`mp4`):

```bash
opencraft nodes camera clip --node <idOrNameOrIp> --duration 10s
opencraft nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Notas:

- O nó deve estar **em primeiro plano** para `canvas.*` e `camera.*` (chamadas de segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`).
- A duração do clipe é limitada (atualmente `<= 60s`) para evitar cargas base64 de tamanho excessivo.
- Android solicitará permissões `CAMERA`/`RECORD_AUDIO` quando possível; permissões negadas falham com `*_PERMISSION_REQUIRED`.

## Gravações de tela (nós)

Nós suportados expõem `screen.record` (mp4). Exemplo:

```bash
opencraft nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
opencraft nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notas:

- A disponibilidade de `screen.record` depende da plataforma do nó.
- Gravações de tela são limitadas a `<= 60s`.
- `--no-audio` desativa a captura de microfone em plataformas suportadas.
- Use `--screen <index>` para selecionar uma exibição quando várias telas estiverem disponíveis.

## Localização (nós)

Nós expõem `location.get` quando Localização está ativada nas configurações.

Auxiliar de CLI:

```bash
opencraft nodes location get --node <idOrNameOrIp>
opencraft nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notas:

- Localização está **desativada por padrão**.
- "Sempre" requer permissão do sistema; busca de segundo plano é melhor esforço.
- A resposta inclui lat/lon, precisão (metros) e timestamp.

## SMS (nós Android)

Nós Android podem expor `sms.send` quando o usuário concede permissão de **SMS** e o dispositivo suporta telefonia.

Invocação de nível baixo:

```bash
opencraft nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenCraft"}'
```

Notas:

- O prompt de permissão deve ser aceito no dispositivo Android antes da capacidade ser anunciada.
- Dispositivos somente Wi-Fi sem telefonia não anunciarão `sms.send`.

## Comandos de dispositivo e dados pessoais do Android

Nós Android podem anunciar famílias de comando adicionais quando as capacidades correspondentes estão ativadas.

Famílias disponíveis:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `motion.activity`, `motion.pedometer`

Exemplos de invocações:

```bash
opencraft nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
opencraft nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
opencraft nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Notas:

- Comandos de movimento são fechados por capacidade por sensores disponíveis.

## Comandos de sistema (host de nó / nó Mac)

O nó macOS expõe `system.run`, `system.notify` e `system.execApprovals.get/set`.
O host de nó headless expõe `system.run`, `system.which` e `system.execApprovals.get/set`.

Exemplos:

```bash
opencraft nodes run --node <idOrNameOrIp> -- echo "Hello from mac node"
opencraft nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
```

Notas:

- `system.run` retorna stdout/stderr/código de saída na carga.
- `system.notify` respeita o estado de permissão de notificação no aplicativo macOS.
- Metadados de nó `platform` / `deviceFamily` não reconhecidos usam uma lista de permissões padrão conservadora que exclui `system.run` e `system.which`. Se você precisar intencionalmente desses comandos para uma plataforma desconhecida, adicione-os explicitamente via `gateway.nodes.allowCommands`.
- `system.run` suporta `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), os valores `--env` com escopo de solicitação são reduzidos a uma lista explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões sempre permitidas no modo de lista de permissões, wrappers de dispatch conhecidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos executáveis internos em vez de caminhos de wrapper. Se o desempacotamento não for seguro, nenhuma entrada de lista de permissões é persistida automaticamente.
- Em hosts de nó do Windows no modo de lista de permissões, execuções de wrapper de shell via `cmd.exe /c` requerem aprovação (entrada de lista de permissões sozinha não permite automaticamente o formulário de wrapper).
- `system.notify` suporta `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Hosts de nó ignoram substituições `PATH` e removem chaves de startup/shell perigosas (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Se você precisar de entradas PATH extras, configure o ambiente de serviço do host de nó (ou instale ferramentas em locais padrão) em vez de passar `PATH` via `--env`.
- No modo de nó macOS, `system.run` é fechado por aprovações de exec no aplicativo macOS (Configurações → Aprovações de Execução).
  Ask/allowlist/full se comportam da mesma forma que o host de nó headless; prompts negados retornam `SYSTEM_RUN_DENIED`.
- No host de nó headless, `system.run` é fechado por aprovações de exec (`~/.opencraft/exec-approvals.json`).

## Ligação de nó Exec

Quando vários nós estão disponíveis, você pode vincular exec a um nó específico.
Isso define o nó padrão para `exec host=node` (e pode ser substituído por agente).

Padrão global:

```bash
opencraft config set tools.exec.node "node-id-or-name"
```

Substituição por agente:

```bash
opencraft config get agents.list
opencraft config set agents.list[0].tools.exec.node "node-id-or-name"
```

Desdefina para permitir qualquer nó:

```bash
opencraft config unset tools.exec.node
opencraft config unset agents.list[0].tools.exec.node
```

## Mapa de permissões

Nós podem incluir um mapa de `permissions` em `node.list` / `node.describe`, chaveado por nome de permissão (p. ex. `screenRecording`, `accessibility`) com valores booleanos (`true` = concedido).

## Host de nó headless (multiplataforma)

OpenCraft pode executar um **host de nó headless** (sem UI) que se conecta ao WebSocket do Gateway
e expõe `system.run` / `system.which`. Isso é útil em Linux/Windows
ou para executar um nó mínimo ao lado de um servidor.

Inicie-o:

```bash
opencraft node run --host <gateway-host> --port 18789
```

Notas:

- O emparelhamento ainda é obrigatório (o Gateway mostrará um prompt de emparelhamento de dispositivo).
- O host do nó armazena seu ID de nó, token, nome de exibição e informações de conexão do Gateway em `~/.opencraft/node.json`.
- As aprovações de exec são aplicadas localmente via `~/.opencraft/exec-approvals.json`
  (veja [Aprovações Exec](/tools/exec-approvals)).
- No macOS, o host de nó headless executa `system.run` localmente por padrão. Conjunto
  `OPENCRAFT_NODE_EXEC_HOST=app` para rotear `system.run` através do host de exec do aplicativo complementar; adicionar
  `OPENCRAFT_NODE_EXEC_FALLBACK=0` para exigir o host do aplicativo e falhar fechado se não estiver disponível.
- Adicione `--tls` / `--tls-fingerprint` quando o WS do Gateway usar TLS.

## Modo de nó Mac

- O aplicativo da barra de menus macOS se conecta ao servidor WS do Gateway como um nó (então `opencraft nodes …` funciona contra este Mac).
- Em modo remoto, o aplicativo abre um túnel SSH para a porta do Gateway e se conecta a `localhost`.
