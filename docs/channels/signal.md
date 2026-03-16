---
summary: "Suporte ao Signal via signal-cli (JSON-RPC + SSE), caminhos de configuração e modelo de número"
read_when:
  - Configurando suporte ao Signal
  - Depurando envio/recebimento do Signal
title: "Signal"
---

# Signal (signal-cli)

Status: integração externa via CLI. O Gateway se comunica com `signal-cli` via HTTP JSON-RPC + SSE.

## Pré-requisitos

- OpenCraft instalado no seu servidor (fluxo Linux testado no Ubuntu 24).
- `signal-cli` disponível no host onde o gateway executa.
- Um número de telefone que pode receber um SMS de verificação (para o caminho de registro por SMS).
- Acesso ao navegador para o captcha do Signal (`signalcaptchas.org`) durante o registro.

## Configuração rápida (iniciante)

1. Use um **número Signal separado** para o bot (recomendado).
2. Instale o `signal-cli` (Java necessário se usar a build JVM).
3. Escolha um caminho de configuração:
   - **Caminho A (vinculação por QR):** `signal-cli link -n "OpenCraft"` e escaneie com o Signal.
   - **Caminho B (registro por SMS):** registre um número dedicado com captcha + verificação por SMS.
4. Configure o OpenCraft e reinicie o gateway.
5. Envie o primeiro DM e aprove o pareamento (`opencraft pairing approve signal <CÓDIGO>`).

Config mínima:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+5511999999999",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+5511888888888"],
    },
  },
}
```

Referência de campos:

| Campo       | Descrição                                                |
| ----------- | -------------------------------------------------------- |
| `account`   | Número de telefone do bot no formato E.164 (`+5511999999999`) |
| `cliPath`   | Caminho para `signal-cli` (`signal-cli` se estiver no `PATH`) |
| `dmPolicy`  | Política de acesso a DM (`pairing` recomendado)          |
| `allowFrom` | Números de telefone ou valores `uuid:<id>` permitidos para DM |

## O que é

- Canal Signal via `signal-cli` (não libsignal embarcado).
- Roteamento determinístico: respostas sempre voltam para o Signal.
- DMs compartilham a sessão principal do agente; grupos são isolados (`agent:<agentId>:signal:group:<groupId>`).

## Escritas de config

Por padrão, o Signal tem permissão para escrever atualizações de config acionadas por `/config set|unset` (requer `commands.config: true`).

Desabilitar com:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## O modelo de número (importante)

- O gateway conecta a um **dispositivo Signal** (a conta `signal-cli`).
- Se você executar o bot na **sua conta Signal pessoal**, ele ignorará suas próprias mensagens (proteção contra loop).
- Para "eu envio mensagem para o bot e ele responde," use um **número de bot separado**.

## Caminho A: vincular conta Signal existente (QR)

1. Instale o `signal-cli` (build JVM ou nativa).
2. Vincule uma conta de bot:
   - `signal-cli link -n "OpenCraft"` e escaneie o QR no Signal.
3. Configure o Signal e inicie o gateway.

Exemplo:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+5511999999999",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+5511888888888"],
    },
  },
}
```

Suporte a múltiplas contas: use `channels.signal.accounts` com config por conta e `name` opcional. Veja [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts) para o padrão compartilhado.

## Caminho B: registrar número de bot dedicado (SMS, Linux)

Use quando quiser um número de bot dedicado em vez de vincular uma conta existente do app Signal.

1. Obtenha um número que pode receber SMS (ou verificação por voz para linhas fixas).
   - Use um número de bot dedicado para evitar conflitos de conta/sessão.
2. Instale o `signal-cli` no host do gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Se você usar a build JVM (`signal-cli-${VERSION}.tar.gz`), instale o JRE 25+ primeiro.
Mantenha o `signal-cli` atualizado; as notas upstream indicam que versões antigas podem quebrar conforme as APIs do servidor Signal mudam.

3. Registre e verifique o número:

```bash
signal-cli -a +<NUMERO_DO_BOT> register
```

Se o captcha for necessário:

1. Abra `https://signalcaptchas.org/registration/generate.html`.
2. Complete o captcha, copie o alvo do link `signalcaptcha://...` de "Open Signal".
3. Execute a partir do mesmo IP externo que a sessão do navegador quando possível.
4. Execute o registro novamente imediatamente (tokens de captcha expiram rapidamente):

```bash
signal-cli -a +<NUMERO_DO_BOT> register --captcha '<URL_SIGNALCAPTCHA>'
signal-cli -a +<NUMERO_DO_BOT> verify <CODIGO_DE_VERIFICACAO>
```

4. Configure o OpenCraft, reinicie o gateway, verifique o canal:

```bash
# Se você executar o gateway como serviço systemd do usuário:
systemctl --user restart opencraft-gateway

# Depois verifique:
opencraft doctor
opencraft channels status --probe
```

5. Pare o remetente de DM:
   - Envie qualquer mensagem para o número do bot.
   - Aprove o código no servidor: `opencraft pairing approve signal <CÓDIGO_DE_PAREAMENTO>`.
   - Salve o número do bot como contato no seu telefone para evitar "Contato desconhecido".

Importante: registrar uma conta de número de telefone com `signal-cli` pode desautenticar a sessão do app Signal principal para aquele número. Prefira um número de bot dedicado, ou use o modo de vinculação por QR se precisar manter a configuração do app do telefone existente.

Referências upstream:

- README do `signal-cli`: `https://github.com/AsamK/signal-cli`
- Fluxo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Fluxo de vinculação: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo daemon externo (httpUrl)

Se quiser gerenciar o `signal-cli` você mesmo (inicializações lentas da JVM, init de container ou CPUs compartilhadas), execute o daemon separadamente e aponte o OpenCraft para ele:

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

Isso pula o auto-spawn e a espera de inicialização dentro do OpenCraft. Para inicializações lentas com auto-spawn, defina `channels.signal.startupTimeoutMs`.

## Controle de acesso (DMs + grupos)

DMs:

- Padrão: `channels.signal.dmPolicy = "pairing"`.
- Remetentes desconhecidos recebem um código de pareamento; mensagens são ignoradas até aprovação (códigos expiram após 1 hora).
- Aprovar via:
  - `opencraft pairing list signal`
  - `opencraft pairing approve signal <CÓDIGO>`
- O pareamento é a troca de token padrão para DMs do Signal. Detalhes: [Pareamento](/channels/pairing)
- Remetentes apenas por UUID (de `sourceUuid`) são armazenados como `uuid:<id>` em `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla quem pode acionar em grupos quando `allowlist` está definido.
- `channels.signal.groups["<group-id>" | "*"]` pode substituir o comportamento do grupo com `requireMention`, `tools` e `toolsBySender`.
- Use `channels.signal.accounts.<id>.groups` para substituições por conta em configurações com múltiplas contas.
- Nota de runtime: se `channels.signal` estiver completamente ausente, o runtime recorre a `groupPolicy="allowlist"` para verificações de grupo (mesmo se `channels.defaults.groupPolicy` estiver definido).

## Como funciona (comportamento)

- `signal-cli` executa como daemon; o gateway lê eventos via SSE.
- Mensagens de entrada são normalizadas no envelope de canal compartilhado.
- Respostas sempre roteiam de volta para o mesmo número ou grupo.

## Mídia + limites

- Texto de saída é dividido em blocos de `channels.signal.textChunkLimit` (padrão 4000).
- Divisão opcional por nova linha: defina `channels.signal.chunkMode="newline"` para dividir em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- Anexos suportados (base64 obtido do `signal-cli`).
- Cap de mídia padrão: `channels.signal.mediaMaxMb` (padrão 8).
- Use `channels.signal.ignoreAttachments` para pular o download de mídia.
- O contexto de histórico de grupo usa `channels.signal.historyLimit` (ou `channels.signal.accounts.*.historyLimit`), com fallback para `messages.groupChat.historyLimit`. Defina `0` para desabilitar (padrão 50).

## Indicadores de digitação + confirmações de leitura

- **Indicadores de digitação**: o OpenCraft envia sinais de digitação via `signal-cli sendTyping` e os atualiza enquanto uma resposta está sendo gerada.
- **Confirmações de leitura**: quando `channels.signal.sendReadReceipts` é verdadeiro, o OpenCraft encaminha confirmações de leitura para DMs permitidos.
- O signal-cli não expõe confirmações de leitura para grupos.

## Reações (ferramenta de mensagem)

- Use `message action=react` com `channel=signal`.
- Alvos: E.164 do remetente ou UUID (use `uuid:<id>` da saída de pareamento; UUID bare também funciona).
- `messageId` é o timestamp do Signal para a mensagem à qual você está reagindo.
- Reações em grupo requerem `targetAuthor` ou `targetAuthorUuid`.

Exemplos:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+5511999999999 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Config:

- `channels.signal.actions.reactions`: habilitar/desabilitar ações de reação (padrão true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` desabilita reações do agente (a ferramenta de mensagem `react` retornará erro).
  - `minimal`/`extensive` habilita reações do agente e define o nível de orientação.
- Substituições por conta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Alvos de entrega (CLI/cron)

- DMs: `signal:+5511999999999` (ou E.164 simples).
- DMs por UUID: `uuid:<id>` (ou UUID bare).
- Grupos: `signal:group:<groupId>`.
- Usernames: `username:<nome>` (se suportado pela sua conta Signal).

## Solução de problemas

Execute esta sequência primeiro:

```bash
opencraft status
opencraft gateway status
opencraft logs --follow
opencraft doctor
opencraft channels status --probe
```

Depois confirme o estado de pareamento de DM se necessário:

```bash
opencraft pairing list signal
```

Falhas comuns:

- Daemon acessível mas sem respostas: verifique as configurações de conta/daemon (`httpUrl`, `account`) e modo de recebimento.
- DMs ignorados: remetente está aguardando aprovação de pareamento.
- Mensagens de grupo ignoradas: controle de remetente/menção do grupo bloqueia a entrega.
- Erros de validação de config após edições: execute `opencraft doctor --fix`.
- Signal ausente dos diagnósticos: confirme `channels.signal.enabled: true`.

Verificações extras:

```bash
opencraft pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/opencraft/opencraft-$(date +%Y-%m-%d).log" | tail -20
```

Para o fluxo de triagem: [/channels/troubleshooting](/channels/troubleshooting).

## Notas de segurança

- `signal-cli` armazena chaves de conta localmente (tipicamente `~/.local/share/signal-cli/data/`).
- Faça backup do estado da conta Signal antes de migração ou reconstrução do servidor.
- Mantenha `channels.signal.dmPolicy: "pairing"` a menos que queira explicitamente acesso de DM mais amplo.
- A verificação por SMS só é necessária para fluxos de registro ou recuperação, mas perder o controle do número/conta pode complicar o novo registro.

## Referência de configuração (Signal)

Configuração completa: [Configuração](/gateway/configuration)

Opções do provedor:

- `channels.signal.enabled`: habilitar/desabilitar inicialização do canal.
- `channels.signal.account`: E.164 para a conta do bot.
- `channels.signal.cliPath`: caminho para `signal-cli`.
- `channels.signal.httpUrl`: URL completa do daemon (substitui host/porta).
- `channels.signal.httpHost`, `channels.signal.httpPort`: bind do daemon (padrão 127.0.0.1:8080).
- `channels.signal.autoStart`: auto-iniciar daemon (padrão true se `httpUrl` não estiver definido).
- `channels.signal.startupTimeoutMs`: timeout de espera de inicialização em ms (cap 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: pular downloads de anexos.
- `channels.signal.ignoreStories`: ignorar stories do daemon.
- `channels.signal.sendReadReceipts`: encaminhar confirmações de leitura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.signal.allowFrom`: lista de permissão de DM (E.164 ou `uuid:<id>`). `open` requer `"*"`. O Signal não tem usernames; use ids de telefone/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist).
- `channels.signal.groupAllowFrom`: lista de permissão de remetentes em grupo.
- `channels.signal.groups`: substituições por grupo com chave por id de grupo Signal (ou `"*"`). Campos suportados: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versão por conta de `channels.signal.groups` para configurações com múltiplas contas.
- `channels.signal.historyLimit`: máximo de mensagens de grupo para incluir como contexto (0 desabilita).
- `channels.signal.dmHistoryLimit`: limite de histórico de DM em turnos do usuário. Substituições por usuário: `channels.signal.dms["<telefone_ou_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamanho do bloco de saída (caracteres).
- `channels.signal.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- `channels.signal.mediaMaxMb`: cap de mídia de entrada/saída (MB).

Opções globais relacionadas:

- `agents.list[].groupChat.mentionPatterns` (o Signal não suporta menções nativas).
- `messages.groupChat.mentionPatterns` (fallback global).
- `messages.responsePrefix`.
