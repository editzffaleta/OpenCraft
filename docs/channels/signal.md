---
summary: "Suporte ao Signal via signal-cli (JSON-RPC + SSE), caminhos de configuração e modelo de número"
read_when:
  - Configurando suporte ao Signal
  - Depurando envio/recebimento do Signal
title: "Signal"
---

# Signal (signal-cli)

Status: integração com CLI externo. O Gateway se comunica com o `signal-cli` via HTTP JSON-RPC + SSE.

## Pré-requisitos

- OpenCraft instalado no seu servidor (fluxo Linux abaixo testado no Ubuntu 24).
- `signal-cli` disponível no host onde o Gateway roda.
- Um número de telefone que possa receber um SMS de verificação (para o caminho de registro por SMS).
- Acesso ao navegador para captcha do Signal (`signalcaptchas.org`) durante o registro.

## Configuração rápida (iniciante)

1. Use um **número Signal separado** para o Bot (recomendado).
2. Instale o `signal-cli` (Java necessário se usar o build JVM).
3. Escolha um caminho de configuração:
   - **Caminho A (link QR):** `signal-cli link -n "OpenCraft"` e escaneie com o Signal.
   - **Caminho B (registro SMS):** registre um número dedicado com captcha + verificação por SMS.
4. Configure o OpenCraft e reinicie o Gateway.
5. Envie uma primeira DM e aprove o pareamento (`opencraft pairing approve signal <CODE>`).

Configuração mínima:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Referência de campos:

| Campo       | Descrição                                                     |
| ----------- | ------------------------------------------------------------- |
| `account`   | Número de telefone do Bot no formato E.164 (`+15551234567`)   |
| `cliPath`   | Caminho para `signal-cli` (`signal-cli` se no `PATH`)         |
| `dmPolicy`  | Política de acesso a DM (`pairing` recomendado)               |
| `allowFrom` | Números de telefone ou valores `uuid:<id>` permitidos para DM |

## O que é

- Canal Signal via `signal-cli` (não libsignal embutido).
- Roteamento determinístico: respostas sempre voltam para o Signal.
- DMs compartilham a sessão principal do agente; grupos são isolados (`agent:<agentId>:signal:group:<groupId>`).

## Gravações de configuração

Por padrão, o Signal pode gravar atualizações de configuração acionadas por `/config set|unset` (requer `commands.config: true`).

Desabilitar com:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## O modelo de número (importante)

- O Gateway se conecta a um **dispositivo Signal** (a conta do `signal-cli`).
- Se você rodar o Bot na **sua conta Signal pessoal**, ele ignorará suas próprias mensagens (proteção contra loop).
- Para "eu envio mensagem para o Bot e ele responde", use um **número de Bot separado**.

## Caminho de configuração A: vincular conta Signal existente (QR)

1. Instale o `signal-cli` (build JVM ou nativo).
2. Vincule uma conta de Bot:
   - `signal-cli link -n "OpenCraft"` depois escaneie o QR no Signal.
3. Configure o Signal e inicie o Gateway.

Exemplo:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Suporte a múltiplas contas: use `channels.signal.accounts` com configuração por conta e `name` opcional. Veja [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts) para o padrão compartilhado.

## Caminho de configuração B: registrar número dedicado do Bot (SMS, Linux)

Use isso quando você quer um número dedicado para o Bot em vez de vincular uma conta existente do app Signal.

1. Obtenha um número que possa receber SMS (ou verificação por voz para linhas fixas).
   - Use um número dedicado para o Bot para evitar conflitos de conta/sessão.
2. Instale o `signal-cli` no host do Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Se usar o build JVM (`signal-cli-${VERSION}.tar.gz`), instale JRE 25+ primeiro.
Mantenha o `signal-cli` atualizado; upstream observa que versões antigas podem quebrar conforme as APIs do servidor Signal mudam.

3. Registre e verifique o número:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Se captcha for necessário:

1. Abra `https://signalcaptchas.org/registration/generate.html`.
2. Complete o captcha, copie o link alvo `signalcaptcha://...` de "Open Signal".
3. Execute do mesmo IP externo da sessão do navegador quando possível.
4. Execute o registro novamente imediatamente (Tokens de captcha expiram rapidamente):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configure o OpenCraft, reinicie o Gateway, verifique o canal:

```bash
# Se você roda o Gateway como serviço systemd de usuário:
systemctl --user restart opencraft-gateway

# Depois verifique:
opencraft doctor
opencraft channels status --probe
```

5. Pareie seu remetente de DM:
   - Envie qualquer mensagem para o número do Bot.
   - Aprove o código no servidor: `opencraft pairing approve signal <PAIRING_CODE>`.
   - Salve o número do Bot como contato no seu telefone para evitar "Contato desconhecido".

Importante: registrar uma conta de número de telefone com `signal-cli` pode desautenticar a sessão principal do app Signal para aquele número. Prefira um número dedicado para o Bot, ou use o modo de link QR se precisar manter a configuração existente do app do telefone.

Referências upstream:

- README do `signal-cli`: `https://github.com/AsamK/signal-cli`
- Fluxo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Fluxo de vinculação: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo daemon externo (httpUrl)

Se você quer gerenciar o `signal-cli` por conta própria (inicializações frias lentas da JVM, inicialização de container ou CPUs compartilhadas), execute o daemon separadamente e aponte o OpenCraft para ele:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Isso pula o auto-spawn e a espera de inicialização dentro do OpenCraft. Para inicializações lentas ao auto-spawnar, defina `channels.signal.startupTimeoutMs`.

## Controle de acesso (DMs + grupos)

DMs:

- Padrão: `channels.signal.dmPolicy = "pairing"`.
- Remetentes desconhecidos recebem um código de pareamento; mensagens são ignoradas até serem aprovadas (códigos expiram após 1 hora).
- Aprovar via:
  - `opencraft pairing list signal`
  - `opencraft pairing approve signal <CODE>`
- O pareamento é a troca padrão de Token para DMs do Signal. Detalhes: [Pairing](/channels/pairing)
- Remetentes apenas UUID (de `sourceUuid`) são armazenados como `uuid:<id>` em `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla quem pode acionar em grupos quando `allowlist` está definido.
- `channels.signal.groups["<group-id>" | "*"]` pode sobrescrever comportamento de grupo com `requireMention`, `tools` e `toolsBySender`.
- Use `channels.signal.accounts.<id>.groups` para sobrescritas por conta em configurações de múltiplas contas.
- Nota de tempo de execução: se `channels.signal` estiver completamente ausente, o tempo de execução retorna para `groupPolicy="allowlist"` para verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

## Como funciona (comportamento)

- `signal-cli` roda como daemon; o Gateway lê eventos via SSE.
- Mensagens de entrada são normalizadas no envelope de canal compartilhado.
- Respostas sempre são roteadas de volta para o mesmo número ou grupo.

## Mídia + limites

- Texto de saída é dividido em blocos de `channels.signal.textChunkLimit` (padrão 4000).
- Divisão opcional por nova linha: defina `channels.signal.chunkMode="newline"` para dividir em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- Anexos suportados (base64 obtido do `signal-cli`).
- Limite padrão de mídia: `channels.signal.mediaMaxMb` (padrão 8).
- Use `channels.signal.ignoreAttachments` para pular o download de mídia.
- Contexto de histórico de grupo usa `channels.signal.historyLimit` (ou `channels.signal.accounts.*.historyLimit`), retornando para `messages.groupChat.historyLimit`. Defina `0` para desabilitar (padrão 50).

## Digitação + confirmações de leitura

- **Indicadores de digitação**: o OpenCraft envia sinais de digitação via `signal-cli sendTyping` e os atualiza enquanto uma resposta está em execução.
- **Confirmações de leitura**: quando `channels.signal.sendReadReceipts` é true, o OpenCraft encaminha confirmações de leitura para DMs permitidas.
- O signal-cli não expõe confirmações de leitura para grupos.

## Reações (ferramenta de mensagem)

- Use `message action=react` com `channel=signal`.
- Alvos: E.164 do remetente ou UUID (use `uuid:<id>` da saída de pareamento; UUID simples também funciona).
- `messageId` é o timestamp do Signal para a mensagem à qual você está reagindo.
- Reações em grupo requerem `targetAuthor` ou `targetAuthorUuid`.

Exemplos:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuração:

- `channels.signal.actions.reactions`: habilitar/desabilitar ações de reação (padrão true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` desabilita reações do agente (ferramenta de mensagem `react` vai retornar erro).
  - `minimal`/`extensive` habilita reações do agente e define o nível de orientação.
- Sobrescritas por conta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Alvos de entrega (CLI/Cron)

- DMs: `signal:+15551234567` (ou E.164 simples).
- DMs UUID: `uuid:<id>` (ou UUID simples).
- Grupos: `signal:group:<groupId>`.
- Usernames: `username:<name>` (se suportado pela sua conta Signal).

## Solução de problemas

Execute esta sequência primeiro:

```bash
opencraft status
opencraft gateway status
opencraft logs --follow
opencraft doctor
opencraft channels status --probe
```

Em seguida, confirme o estado de pareamento de DM se necessário:

```bash
opencraft pairing list signal
```

Falhas comuns:

- Daemon acessível mas sem respostas: verifique configurações de conta/daemon (`httpUrl`, `account`) e modo de recebimento.
- DMs ignoradas: remetente está pendente de aprovação de pareamento.
- Mensagens de grupo ignoradas: controle de remetente/menção de grupo bloqueia a entrega.
- Erros de validação de configuração após edições: execute `opencraft doctor --fix`.
- Signal ausente do diagnóstico: confirme `channels.signal.enabled: true`.

Verificações extras:

```bash
opencraft pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/editzffaleta/OpenCraft-$(date +%Y-%m-%d).log" | tail -20
```

Para fluxo de triagem: [/channels/troubleshooting](/channels/troubleshooting).

## Notas de segurança

- O `signal-cli` armazena chaves de conta localmente (tipicamente `~/.local/share/signal-cli/data/`).
- Faça backup do estado da conta Signal antes de migração ou reconstrução do servidor.
- Mantenha `channels.signal.dmPolicy: "pairing"` a menos que você queira explicitamente acesso mais amplo a DMs.
- A verificação por SMS só é necessária para fluxos de registro ou recuperação, mas perder o controle do número/conta pode complicar o re-registro.

## Referência de configuração (Signal)

Configuração completa: [Configuration](/gateway/configuration)

Opções do provedor:

- `channels.signal.enabled`: habilitar/desabilitar inicialização do canal.
- `channels.signal.account`: E.164 para a conta do Bot.
- `channels.signal.cliPath`: caminho para `signal-cli`.
- `channels.signal.httpUrl`: URL completa do daemon (sobrescreve host/porta).
- `channels.signal.httpHost`, `channels.signal.httpPort`: ligação do daemon (padrão 127.0.0.1:8080).
- `channels.signal.autoStart`: auto-spawn do daemon (padrão true se `httpUrl` não definido).
- `channels.signal.startupTimeoutMs`: timeout de espera de inicialização em ms (limite 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: pular downloads de anexos.
- `channels.signal.ignoreStories`: ignorar stories do daemon.
- `channels.signal.sendReadReceipts`: encaminhar confirmações de leitura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.signal.allowFrom`: allowlist de DM (E.164 ou `uuid:<id>`). `open` requer `"*"`. O Signal não tem usernames; use IDs de telefone/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist).
- `channels.signal.groupAllowFrom`: allowlist de remetentes de grupo.
- `channels.signal.groups`: sobrescritas por grupo indexadas por ID de grupo do Signal (ou `"*"`). Campos suportados: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versão por conta de `channels.signal.groups` para configurações de múltiplas contas.
- `channels.signal.historyLimit`: máximo de mensagens de grupo para incluir como contexto (0 desabilita).
- `channels.signal.dmHistoryLimit`: limite de histórico de DM em turnos do usuário. Sobrescritas por usuário: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamanho do bloco de saída (caracteres).
- `channels.signal.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- `channels.signal.mediaMaxMb`: limite de mídia de entrada/saída (MB).

Opções globais relacionadas:

- `agents.list[].groupChat.mentionPatterns` (o Signal não suporta menções nativas).
- `messages.groupChat.mentionPatterns` (fallback global).
- `messages.responsePrefix`.
