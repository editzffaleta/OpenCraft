---
summary: "Nodes: emparelhamento, capacidades, permissões e helpers CLI para canvas/câmera/tela/dispositivo/notificações/sistema"
read_when:
  - Emparelhando nodes iOS/Android a um gateway
  - Usando canvas/câmera de node para contexto do agente
  - Adicionando novos comandos de node ou helpers CLI
title: "Nodes"
---

# Nodes

Um **node** é um dispositivo companheiro (macOS/iOS/Android/headless) que se conecta ao **WebSocket** do Gateway (mesma porta dos operadores) com `role: "node"` e expõe uma superfície de comandos (ex: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Detalhes do protocolo: [Protocolo do Gateway](/gateway/protocol).

Transporte legado: [Protocolo Bridge](/gateway/bridge-protocol) (TCP JSONL; deprecated/removido para nodes atuais).

O macOS também pode rodar em **modo node**: o app da barra de menus se conecta ao servidor WS do Gateway e expõe seus comandos locais de canvas/câmera como um node (então `opencraft nodes …` funciona contra este Mac).

Notas:

- Nodes são **periféricos**, não gateways. Eles não rodam o serviço de gateway.
- Mensagens do Telegram/WhatsApp/etc. chegam no **gateway**, não nos nodes.
- Runbook de troubleshooting: [/nodes/troubleshooting](/nodes/troubleshooting)

## Emparelhamento + status

**Nodes WS usam emparelhamento de dispositivo.** Nodes apresentam uma identidade de dispositivo durante o `connect`; o Gateway cria uma solicitação de emparelhamento de dispositivo para `role: node`. Aprove via CLI de dispositivos (ou UI).

CLI rápida:

```bash
opencraft devices list
opencraft devices approve <requestId>
opencraft devices reject <requestId>
opencraft nodes status
opencraft nodes describe --node <idOrNameOrIp>
```

Notas:

- `nodes status` marca um node como **emparelhado** quando seu papel de emparelhamento de dispositivo inclui `node`.
- `node.pair.*` (CLI: `opencraft nodes pending/approve/reject`) é um armazenamento de emparelhamento de node separado, de propriedade do gateway; ele **não** controla o handshake `connect` do WS.

## Host de node remoto (system.run)

Use um **host de node** quando seu Gateway roda em uma máquina e você quer que comandos sejam executados em outra. O modelo ainda fala com o **gateway**; o gateway encaminha chamadas `exec` para o **host de node** quando `host=node` é selecionado.

### O que roda onde

- **Host do Gateway**: recebe mensagens, roda o modelo, roteia chamadas de tool.
- **Host de node**: executa `system.run`/`system.which` na máquina do node.
- **Aprovações**: aplicadas no host de node via `~/.opencraft/exec-approvals.json`.

Nota sobre aprovações:

- Execuções de node com aprovação vinculam contexto exato da requisição.
- Para execuções de arquivo shell/runtime direto, o OpenCraft também faz o melhor esforço para vincular um operando de arquivo local concreto e nega a execução se o arquivo mudar antes da execução.
- Se o OpenCraft não conseguir identificar exatamente um arquivo local concreto para um comando de interpretador/runtime, a execução com aprovação é negada em vez de fingir cobertura total de runtime. Use sandboxing, hosts separados ou uma allowlist confiável explícita/workflow completo para semântica de interpretador mais ampla.

### Iniciar um host de node (foreground)

Na máquina do node:

```bash
opencraft node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto via túnel SSH (bind loopback)

Se o Gateway faz bind no loopback (`gateway.bind=loopback`, padrão em modo local),
hosts de node remotos não conseguem se conectar diretamente. Crie um túnel SSH e aponte o
host de node para a extremidade local do túnel.

Exemplo (host de node -> host do gateway):

```bash
# Terminal A (manter rodando): encaminhar local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: exportar o token do gateway e conectar pelo túnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
opencraft node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notas:

- `opencraft node run` suporta autenticação por token ou senha.
- Vars de ambiente são preferidas: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback de config é `gateway.auth.token` / `gateway.auth.password`.
- Em modo local, o host de node ignora intencionalmente `gateway.remote.token` / `gateway.remote.password`.
- Em modo remoto, `gateway.remote.token` / `gateway.remote.password` são elegíveis conforme regras de precedência remota.
- Se SecretRefs ativos de `gateway.auth.*` local estiverem configurados mas não resolvidos, a autenticação do host de node falha de forma segura.
- Vars de ambiente legadas `CLAWDBOT_GATEWAY_*` são ignoradas intencionalmente pela resolução de autenticação do host de node.

### Iniciar um host de node (serviço)

```bash
opencraft node install --host <gateway-host> --port 18789 --display-name "Build Node"
opencraft node restart
```

### Emparelhar + nomear

No host do gateway:

```bash
opencraft devices list
opencraft devices approve <requestId>
opencraft nodes status
```

Opções de nomeação:

- `--display-name` em `opencraft node run` / `opencraft node install` (persiste em `~/.opencraft/node.json` no node).
- `opencraft nodes rename --node <id|name|ip> --name "Build Node"` (override do gateway).

### Allowlist dos comandos

Aprovações de exec são **por host de node**. Adicione entradas de allowlist do gateway:

```bash
opencraft approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
opencraft approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Aprovações ficam no host de node em `~/.opencraft/exec-approvals.json`.

### Apontar exec para o node

Configure padrões (config do gateway):

```bash
opencraft config set tools.exec.host node
opencraft config set tools.exec.security allowlist
opencraft config set tools.exec.node "<id-or-name>"
```

Ou por sessão:

```
/exec host=node security=allowlist node=<id-or-name>
```

Uma vez configurado, qualquer chamada `exec` com `host=node` roda no host de node (sujeita à
allowlist/aprovações do node).

Relacionados:

- [CLI do host de node](/cli/node)
- [Tool exec](/tools/exec)
- [Aprovações exec](/tools/exec-approvals)

## Invocando comandos

Baixo nível (RPC bruto):

```bash
opencraft nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Helpers de nível mais alto existem para os workflows comuns de "dar ao agente um anexo MEDIA".

## Screenshots (snapshots de canvas)

Se o node está mostrando o Canvas (WebView), `canvas.snapshot` retorna `{ format, base64 }`.

Helper CLI (escreve em arquivo temp e imprime `MEDIA:<path>`):

```bash
opencraft nodes canvas snapshot --node <idOrNameOrIp> --format png
opencraft nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Controles de canvas

```bash
opencraft nodes canvas present --node <idOrNameOrIp> --target https://example.com
opencraft nodes canvas hide --node <idOrNameOrIp>
opencraft nodes canvas navigate https://example.com --node <idOrNameOrIp>
opencraft nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Notas:

- `canvas present` aceita URLs ou caminhos de arquivo local (`--target`), mais `--x/--y/--width/--height` opcionais para posicionamento.
- `canvas eval` aceita JS inline (`--js`) ou um argumento posicional.

### A2UI (Canvas)

```bash
opencraft nodes canvas a2ui push --node <idOrNameOrIp> --text "Olá"
opencraft nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
opencraft nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notas:

- Apenas A2UI v0.8 JSONL é suportado (v0.9/createSurface é rejeitado).

## Fotos + vídeos (câmera do node)

Fotos (`jpg`):

```bash
opencraft nodes camera list --node <idOrNameOrIp>
opencraft nodes camera snap --node <idOrNameOrIp>            # padrão: ambas as posições (2 linhas MEDIA)
opencraft nodes camera snap --node <idOrNameOrIp> --facing front
```

Clipes de vídeo (`mp4`):

```bash
opencraft nodes camera clip --node <idOrNameOrIp> --duration 10s
opencraft nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Notas:

- O node deve estar em **foreground** para `canvas.*` e `camera.*` (chamadas em background retornam `NODE_BACKGROUND_UNAVAILABLE`).
- Duração de clipe é limitada (atualmente `<= 60s`) para evitar payloads base64 muito grandes.
- Android solicitará permissões `CAMERA`/`RECORD_AUDIO` quando possível; permissões negadas falham com `*_PERMISSION_REQUIRED`.

## Gravações de tela (nodes)

Nodes suportados expõem `screen.record` (mp4). Exemplo:

```bash
opencraft nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
opencraft nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notas:

- Disponibilidade de `screen.record` depende da plataforma do node.
- Gravações de tela são limitadas a `<= 60s`.
- `--no-audio` desativa captura de microfone em plataformas suportadas.
- Use `--screen <index>` para selecionar um display quando múltiplas telas estiverem disponíveis.

## Localização (nodes)

Nodes expõem `location.get` quando Localização está habilitada nas configurações.

Helper CLI:

```bash
opencraft nodes location get --node <idOrNameOrIp>
opencraft nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notas:

- Localização está **desativada por padrão**.
- "Sempre" requer permissão do sistema; busca em background é best-effort.
- A resposta inclui lat/lon, precisão (metros) e timestamp.

## SMS (nodes Android)

Nodes Android podem expor `sms.send` quando o usuário concede permissão **SMS** e o dispositivo suporta telefonia.

Invoke de baixo nível:

```bash
opencraft nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+5511999990000","message":"Olá do OpenCraft"}'
```

Notas:

- O prompt de permissão deve ser aceito no dispositivo Android antes que a capacidade seja anunciada.
- Dispositivos apenas Wi-Fi sem telefonia não anunciarão `sms.send`.

## Comandos de dispositivo Android e dados pessoais

Nodes Android podem anunciar famílias de comandos adicionais quando as capacidades correspondentes estão habilitadas.

Famílias disponíveis:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `motion.activity`, `motion.pedometer`

Exemplos de invokes:

```bash
opencraft nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
opencraft nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
opencraft nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Notas:

- Comandos de motion são controlados por capacidade de sensores disponíveis.

## Comandos do sistema (host de node / mac node)

O node macOS expõe `system.run`, `system.notify` e `system.execApprovals.get/set`.
O host de node headless expõe `system.run`, `system.which` e `system.execApprovals.get/set`.

Exemplos:

```bash
opencraft nodes run --node <idOrNameOrIp> -- echo "Olá do mac node"
opencraft nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway pronto"
```

Notas:

- `system.run` retorna stdout/stderr/código de saída no payload.
- `system.notify` respeita o estado de permissão de notificação no app macOS.
- Metadados de `platform` / `deviceFamily` desconhecidos do node usam uma allowlist padrão conservadora que exclui `system.run` e `system.which`. Se você intencionalmente precisa desses comandos para uma plataforma desconhecida, adicione-os explicitamente via `gateway.nodes.allowCommands`.
- `system.run` suporta `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Para wrappers shell (`bash|sh|zsh ... -c/-lc`), valores `--env` com escopo de requisição são reduzidos a uma allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões de allow-always em modo allowlist, wrappers de dispatch conhecidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos de executável interno em vez de caminhos do wrapper. Se desempacotar não for seguro, nenhuma entrada de allowlist é persistida automaticamente.
- Em hosts de node Windows em modo allowlist, execuções de wrapper shell via `cmd.exe /c` requerem aprovação (entrada de allowlist sozinha não auto-permite a forma wrapper).
- `system.notify` suporta `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Hosts de node ignoram overrides de `PATH` e removem chaves de inicialização/shell perigosas (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Se você precisa de entradas extras de PATH, configure o ambiente do serviço do host de node (ou instale ferramentas em locais padrão) em vez de passar `PATH` via `--env`.
- No modo node macOS, `system.run` é controlado por aprovações exec no app macOS (Configurações → Aprovações exec). Ask/allowlist/full se comportam igual ao host de node headless; prompts negados retornam `SYSTEM_RUN_DENIED`.
- No host de node headless, `system.run` é controlado por aprovações exec (`~/.opencraft/exec-approvals.json`).

## Vinculação de exec ao node

Quando múltiplos nodes estão disponíveis, você pode vincular exec a um node específico.
Isso define o node padrão para `exec host=node` (e pode ser sobrescrito por agente).

Padrão global:

```bash
opencraft config set tools.exec.node "node-id-or-name"
```

Override por agente:

```bash
opencraft config get agents.list
opencraft config set agents.list[0].tools.exec.node "node-id-or-name"
```

Remover para permitir qualquer node:

```bash
opencraft config unset tools.exec.node
opencraft config unset agents.list[0].tools.exec.node
```

## Mapa de permissões

Nodes podem incluir um mapa `permissions` em `node.list` / `node.describe`, com chave por nome de permissão (ex: `screenRecording`, `accessibility`) com valores booleanos (`true` = concedida).

## Host de node headless (multiplataforma)

O OpenCraft pode rodar um **host de node headless** (sem UI) que se conecta ao WebSocket
do Gateway e expõe `system.run` / `system.which`. Útil no Linux/Windows
ou para rodar um node mínimo junto a um servidor.

Iniciar:

```bash
opencraft node run --host <gateway-host> --port 18789
```

Notas:

- Emparelhamento ainda é necessário (o Gateway mostrará um prompt de emparelhamento de dispositivo).
- O host de node armazena seu id de node, token, nome de exibição e informações de conexão do gateway em `~/.opencraft/node.json`.
- Aprovações exec são aplicadas localmente via `~/.opencraft/exec-approvals.json`
  (veja [Aprovações exec](/tools/exec-approvals)).
- No macOS, o host de node headless executa `system.run` localmente por padrão. Defina
  `OPENCLAW_NODE_EXEC_HOST=app` para rotear `system.run` pelo host exec do app companheiro; adicione
  `OPENCLAW_NODE_EXEC_FALLBACK=0` para exigir o host do app e falhar de forma segura se não estiver disponível.
- Adicione `--tls` / `--tls-fingerprint` quando o WS do Gateway usar TLS.

## Modo node Mac

- O app da barra de menus macOS se conecta ao servidor WS do Gateway como um node (então `opencraft nodes …` funciona contra este Mac).
- Em modo remoto, o app abre um túnel SSH para a porta do Gateway e se conecta ao `localhost`.
