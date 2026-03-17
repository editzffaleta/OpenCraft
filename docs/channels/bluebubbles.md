---
summary: "iMessage via servidor BlueBubbles no macOS (envio/recebimento REST, digitacao, reacoes, pareamento, acoes avancadas)."
read_when:
  - Setting up BlueBubbles channel
  - Troubleshooting webhook pairing
  - Configuring iMessage on macOS
title: "BlueBubbles"
---

# BlueBubbles (macOS REST)

Status: Plugin integrado que se comunica com o servidor BlueBubbles no macOS via HTTP. **Recomendado para integracao com iMessage** devido a sua API mais rica e configuracao mais facil em comparacao com o canal legado imsg.

## Visao geral

- Roda no macOS via o app auxiliar BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/testado: macOS Sequoia (15). macOS Tahoe (26) funciona; a edicao esta atualmente quebrada no Tahoe, e atualizacoes de icone de grupo podem reportar sucesso mas nao sincronizar.
- O OpenCraft se comunica com ele atraves da API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Mensagens recebidas chegam via Webhooks; respostas enviadas, indicadores de digitacao, confirmacoes de leitura e tapbacks sao chamadas REST.
- Anexos e stickers sao ingeridos como midia de entrada (e exibidos ao agente quando possivel).
- Pareamento/lista de permitidos funciona da mesma forma que outros canais (`/channels/pairing` etc) com `channels.bluebubbles.allowFrom` + codigos de pareamento.
- Reacoes sao exibidas como eventos de sistema, assim como no Slack/Telegram, para que os agentes possam "menciona-las" antes de responder.
- Recursos avancados: edicao, cancelar envio, threading de respostas, efeitos de mensagem, gerenciamento de grupos.

## Inicio rapido

1. Instale o servidor BlueBubbles no seu Mac (siga as instrucoes em [bluebubbles.app/install](https://bluebubbles.app/install)).
2. Na configuracao do BlueBubbles, habilite a API web e defina uma senha.
3. Execute `opencraft onboard` e selecione BlueBubbles, ou configure manualmente:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. Aponte os Webhooks do BlueBubbles para o seu Gateway (exemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Inicie o Gateway; ele registrara o handler do Webhook e iniciara o pareamento.

Nota de seguranca:

- Sempre defina uma senha para o Webhook.
- A autenticacao do Webhook e sempre obrigatoria. O OpenCraft rejeita requisicoes de Webhook do BlueBubbles a menos que incluam uma senha/guid que corresponda a `channels.bluebubbles.password` (por exemplo `?password=<password>` ou `x-password`), independentemente da topologia de loopback/proxy.
- A autenticacao por senha e verificada antes de ler/analisar o corpo completo do Webhook.

## Mantendo o Messages.app ativo (configuracoes VM / headless)

Algumas configuracoes de VM macOS / sempre ligadas podem fazer com que o Messages.app fique "ocioso" (eventos recebidos param ate que o app seja aberto/colocado em primeiro plano). Uma solucao simples e **estimular o Messages a cada 5 minutos** usando um AppleScript + LaunchAgent.

### 1) Salve o AppleScript

Salve como:

- `~/Scripts/poke-messages.scpt`

Exemplo de script (nao interativo; nao rouba o foco):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) Instale um LaunchAgent

Salve como:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

Notas:

- Isso executa **a cada 300 segundos** e **no login**.
- A primeira execucao pode acionar prompts de **Automacao** do macOS (`osascript` -> Messages). Aprove-os na mesma sessao de usuario que executa o LaunchAgent.

Carregue-o:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles esta disponivel no onboarding interativo:

```
opencraft onboard
```

O assistente solicita:

- **URL do servidor** (obrigatorio): Endereco do servidor BlueBubbles (ex.: `http://192.168.1.100:1234`)
- **Senha** (obrigatoria): Senha da API nas configuracoes do Servidor BlueBubbles
- **Caminho do Webhook** (opcional): Padrao `/bluebubbles-webhook`
- **Politica de DM**: pareamento, lista de permitidos, aberto ou desabilitado
- **Lista de permitidos**: Numeros de telefone, emails ou alvos de chat

Voce tambem pode adicionar BlueBubbles via CLI:

```
opencraft channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Controle de acesso (DMs + grupos)

DMs:

- Padrao: `channels.bluebubbles.dmPolicy = "pairing"`.
- Remetentes desconhecidos recebem um codigo de pareamento; mensagens sao ignoradas ate serem aprovadas (codigos expiram apos 1 hora).
- Aprove via:
  - `opencraft pairing list bluebubbles`
  - `opencraft pairing approve bluebubbles <CODE>`
- O pareamento e a troca padrao de Token. Detalhes: [Pareamento](/channels/pairing)

Grupos:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (padrao: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` controla quem pode acionar em grupos quando `allowlist` esta definido.

### Controle por mencao (grupos)

BlueBubbles suporta controle por mencao para chats em grupo, correspondendo ao comportamento do iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`) para detectar mencoes.
- Quando `requireMention` esta habilitado para um grupo, o agente so responde quando mencionado.
- Comandos de controle de remetentes autorizados ignoram o controle por mencao.

Configuracao por grupo:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // padrao para todos os grupos
        "iMessage;-;chat123": { requireMention: false }, // substituicao para grupo especifico
      },
    },
  },
}
```

### Controle de comandos

- Comandos de controle (ex.: `/config`, `/model`) requerem autorizacao.
- Usa `allowFrom` e `groupAllowFrom` para determinar a autorizacao de comandos.
- Remetentes autorizados podem executar comandos de controle mesmo sem mencionar em grupos.

## Digitacao + confirmacoes de leitura

- **Indicadores de digitacao**: Enviados automaticamente antes e durante a geracao de resposta.
- **Confirmacoes de leitura**: Controladas por `channels.bluebubbles.sendReadReceipts` (padrao: `true`).
- **Indicadores de digitacao**: O OpenCraft envia eventos de inicio de digitacao; o BlueBubbles limpa a digitacao automaticamente ao enviar ou por timeout (parada manual via DELETE nao e confiavel).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // desabilitar confirmacoes de leitura
    },
  },
}
```

## Acoes avancadas

BlueBubbles suporta acoes avancadas de mensagem quando habilitadas na configuracao:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (padrao: true)
        edit: true, // editar mensagens enviadas (macOS 13+, quebrado no macOS 26 Tahoe)
        unsend: true, // cancelar envio de mensagens (macOS 13+)
        reply: true, // threading de respostas por GUID da mensagem
        sendWithEffect: true, // efeitos de mensagem (slam, loud, etc.)
        renameGroup: true, // renomear chats em grupo
        setGroupIcon: true, // definir icone/foto do chat em grupo (instavel no macOS 26 Tahoe)
        addParticipant: true, // adicionar participantes a grupos
        removeParticipant: true, // remover participantes de grupos
        leaveGroup: true, // sair de chats em grupo
        sendAttachment: true, // enviar anexos/midia
      },
    },
  },
}
```

Acoes disponiveis:

- **react**: Adicionar/remover reacoes tapback (`messageId`, `emoji`, `remove`)
- **edit**: Editar uma mensagem enviada (`messageId`, `text`)
- **unsend**: Cancelar envio de uma mensagem (`messageId`)
- **reply**: Responder a uma mensagem especifica (`messageId`, `text`, `to`)
- **sendWithEffect**: Enviar com efeito do iMessage (`text`, `to`, `effectId`)
- **renameGroup**: Renomear um chat em grupo (`chatGuid`, `displayName`)
- **setGroupIcon**: Definir o icone/foto de um chat em grupo (`chatGuid`, `media`) -- instavel no macOS 26 Tahoe (a API pode retornar sucesso mas o icone nao sincroniza).
- **addParticipant**: Adicionar alguem a um grupo (`chatGuid`, `address`)
- **removeParticipant**: Remover alguem de um grupo (`chatGuid`, `address`)
- **leaveGroup**: Sair de um chat em grupo (`chatGuid`)
- **sendAttachment**: Enviar midia/arquivos (`to`, `buffer`, `filename`, `asVoice`)
  - Mensagens de voz: defina `asVoice: true` com audio **MP3** ou **CAF** para enviar como mensagem de voz do iMessage. O BlueBubbles converte MP3 -> CAF ao enviar mensagens de voz.

### IDs de mensagem (curto vs completo)

O OpenCraft pode exibir IDs de mensagem _curtos_ (ex.: `1`, `2`) para economizar Tokens.

- `MessageSid` / `ReplyToId` podem ser IDs curtos.
- `MessageSidFull` / `ReplyToIdFull` contem os IDs completos do provedor.
- IDs curtos ficam em memoria; podem expirar ao reiniciar ou por evicao de cache.
- Acoes aceitam `messageId` curto ou completo, mas IDs curtos resultarao em erro se nao estiverem mais disponiveis.

Use IDs completos para automacoes duraveis e armazenamento:

- Templates: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` nos payloads de entrada

Veja [Configuracao](/gateway/configuration) para variaveis de template.

## Streaming em blocos

Controle se as respostas sao enviadas como uma unica mensagem ou transmitidas em blocos:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // habilitar streaming em blocos (desabilitado por padrao)
    },
  },
}
```

## Midia + limites

- Anexos de entrada sao baixados e armazenados no cache de midia.
- Limite de midia via `channels.bluebubbles.mediaMaxMb` para midia de entrada e saida (padrao: 8 MB).
- Texto de saida e dividido em `channels.bluebubbles.textChunkLimit` (padrao: 4000 caracteres).

## Referencia de configuracao

Configuracao completa: [Configuracao](/gateway/configuration)

Opcoes do provedor:

- `channels.bluebubbles.enabled`: Habilitar/desabilitar o canal.
- `channels.bluebubbles.serverUrl`: URL base da API REST do BlueBubbles.
- `channels.bluebubbles.password`: Senha da API.
- `channels.bluebubbles.webhookPath`: Caminho do endpoint do Webhook (padrao: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (padrao: `pairing`).
- `channels.bluebubbles.allowFrom`: Lista de permitidos para DM (handles, emails, numeros E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (padrao: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: Lista de permitidos para remetentes em grupo.
- `channels.bluebubbles.groups`: Configuracao por grupo (`requireMention`, etc.).
- `channels.bluebubbles.sendReadReceipts`: Enviar confirmacoes de leitura (padrao: `true`).
- `channels.bluebubbles.blockStreaming`: Habilitar streaming em blocos (padrao: `false`; necessario para respostas em streaming).
- `channels.bluebubbles.textChunkLimit`: Tamanho do bloco de saida em caracteres (padrao: 4000).
- `channels.bluebubbles.chunkMode`: `length` (padrao) divide somente ao exceder `textChunkLimit`; `newline` divide em linhas em branco (limites de paragrafo) antes da divisao por tamanho.
- `channels.bluebubbles.mediaMaxMb`: Limite de midia de entrada/saida em MB (padrao: 8).
- `channels.bluebubbles.mediaLocalRoots`: Lista explicita de diretorios locais absolutos permitidos para caminhos de midia local de saida. Envios por caminho local sao negados por padrao a menos que isso esteja configurado. Substituicao por conta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: Maximo de mensagens de grupo para contexto (0 desabilita).
- `channels.bluebubbles.dmHistoryLimit`: Limite de historico de DM.
- `channels.bluebubbles.actions`: Habilitar/desabilitar acoes especificas.
- `channels.bluebubbles.accounts`: Configuracao de multiplas contas.

Opcoes globais relacionadas:

- `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Enderecamento / alvos de entrega

Prefira `chat_guid` para roteamento estavel:

- `chat_guid:iMessage;-;+15555550123` (preferido para grupos)
- `chat_id:123`
- `chat_identifier:...`
- Handles diretos: `+15555550123`, `user@example.com`
  - Se um handle direto nao tiver um chat de DM existente, o OpenCraft criara um via `POST /api/v1/chat/new`. Isso requer que a API Privada do BlueBubbles esteja habilitada.

## Seguranca

- Requisicoes de Webhook sao autenticadas comparando os parametros de consulta `guid`/`password` ou headers com `channels.bluebubbles.password`. Requisicoes de `localhost` tambem sao aceitas.
- Mantenha a senha da API e o endpoint do Webhook em segredo (trate-os como credenciais).
- A confianca em localhost significa que um proxy reverso no mesmo host pode inadvertidamente ignorar a senha. Se voce usar proxy no Gateway, exija autenticacao no proxy e configure `gateway.trustedProxies`. Veja [Seguranca do Gateway](/gateway/security#reverse-proxy-configuration).
- Habilite HTTPS + regras de firewall no servidor BlueBubbles se expor fora da sua LAN.

## Solucao de problemas

- Se os eventos de digitacao/leitura pararem de funcionar, verifique os logs do Webhook do BlueBubbles e confirme que o caminho do Gateway corresponde a `channels.bluebubbles.webhookPath`.
- Codigos de pareamento expiram apos uma hora; use `opencraft pairing list bluebubbles` e `opencraft pairing approve bluebubbles <code>`.
- Reacoes requerem a API privada do BlueBubbles (`POST /api/v1/message/react`); certifique-se de que a versao do servidor a expoe.
- Edicao/cancelar envio requerem macOS 13+ e uma versao compativel do servidor BlueBubbles. No macOS 26 (Tahoe), a edicao esta atualmente quebrada devido a mudancas na API privada.
- Atualizacoes de icone de grupo podem ser instaveis no macOS 26 (Tahoe): a API pode retornar sucesso mas o novo icone nao sincroniza.
- O OpenCraft oculta automaticamente acoes reconhecidamente quebradas com base na versao do macOS do servidor BlueBubbles. Se a edicao ainda aparecer no macOS 26 (Tahoe), desabilite-a manualmente com `channels.bluebubbles.actions.edit=false`.
- Para informacoes de status/saude: `opencraft status --all` ou `opencraft status --deep`.

Para referencia geral de fluxo de trabalho de canais, veja [Canais](/channels) e o guia de [Plugins](/tools/plugin).
