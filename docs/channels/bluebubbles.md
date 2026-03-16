---
summary: "iMessage via servidor macOS BlueBubbles (envio/recebimento REST, digitação, reações, pareamento, ações avançadas)."
read_when:
  - Configurando o canal BlueBubbles
  - Depurando pareamento de webhook
  - Configurando iMessage no macOS
title: "BlueBubbles"
---

# BlueBubbles (macOS REST)

Status: plugin integrado que se comunica com o servidor macOS BlueBubbles via HTTP. **Recomendado para integração com iMessage** devido à API mais rica e configuração mais simples comparado ao canal imsg legado.

## Visão geral

- Executa no macOS via app helper BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/testado: macOS Sequoia (15). macOS Tahoe (26) funciona; edição está quebrada no Tahoe e atualizações de ícone de grupo podem reportar sucesso mas não sincronizar.
- O OpenCraft se comunica via REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Mensagens de entrada chegam via webhooks; respostas, indicadores de digitação, confirmações de leitura e tapbacks são chamadas REST.
- Anexos e stickers são ingeridos como mídia de entrada (e expostos ao agente quando possível).
- Pareamento/allowlist funciona da mesma forma que outros canais (`/channels/pairing` etc) com `channels.bluebubbles.allowFrom` + códigos de pareamento.
- Reações são expostas como eventos do sistema assim como Slack/Telegram para que os agentes possam "mencioná-las" antes de responder.
- Recursos avançados: edição, cancelamento de envio, encadeamento de respostas, efeitos de mensagem, gerenciamento de grupo.

## Início rápido

1. Instale o servidor BlueBubbles no seu Mac (siga as instruções em [bluebubbles.app/install](https://bluebubbles.app/install)).
2. Na configuração do BlueBubbles, habilite a API web e defina uma senha.
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

4. Aponte os webhooks do BlueBubbles para o seu gateway (exemplo: `https://seu-gateway-host:3000/bluebubbles-webhook?password=<senha>`).
5. Inicie o gateway; ele registrará o handler de webhook e iniciará o pareamento.

Nota de segurança:

- Sempre defina uma senha para o webhook.
- A autenticação do webhook é sempre obrigatória. O OpenCraft rejeita requisições de webhook do BlueBubbles a menos que incluam uma senha/guid que corresponda a `channels.bluebubbles.password` (por exemplo `?password=<senha>` ou `x-password`), independentemente da topologia loopback/proxy.
- A autenticação por senha é verificada antes de ler/parsear o corpo completo do webhook.

## Mantendo o Messages.app ativo (VMs / setups headless)

Algumas configurações de VM macOS / sempre-ativas podem fazer o Messages.app entrar em modo "idle" (os eventos de entrada param até que o app seja aberto/trazido ao primeiro plano). Uma solução simples é **verificar o Messages a cada 5 minutos** usando um AppleScript + LaunchAgent.

### 1) Salve o AppleScript

Salve como:

- `~/Scripts/poke-messages.scpt`

Exemplo de script (não-interativo; não rouba o foco):

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

- Executa **a cada 300 segundos** e **no login**.
- A primeira execução pode acionar prompts de **Automação** do macOS (`osascript` → Messages). Aprove-os na mesma sessão de usuário que executa o LaunchAgent.

Carregue:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

O BlueBubbles está disponível no assistente de configuração interativo:

```
opencraft onboard
```

O assistente solicita:

- **URL do servidor** (obrigatório): endereço do servidor BlueBubbles (ex.: `http://192.168.1.100:1234`)
- **Senha** (obrigatória): senha da API nas configurações do Servidor BlueBubbles
- **Caminho do webhook** (opcional): padrão é `/bluebubbles-webhook`
- **Política de DM**: pairing, allowlist, open ou disabled
- **Lista de permissão**: números de telefone, emails ou alvos de chat

Você também pode adicionar o BlueBubbles via CLI:

```
opencraft channels add bluebubbles --http-url http://192.168.1.100:1234 --password <senha>
```

## Controle de acesso (DMs + grupos)

DMs:

- Padrão: `channels.bluebubbles.dmPolicy = "pairing"`.
- Remetentes desconhecidos recebem um código de pareamento; mensagens são ignoradas até aprovação (códigos expiram após 1 hora).
- Aprovar via:
  - `opencraft pairing list bluebubbles`
  - `opencraft pairing approve bluebubbles <CÓDIGO>`
- O pareamento é a troca de token padrão. Detalhes: [Pareamento](/channels/pairing)

Grupos:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (padrão: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` controla quem pode acionar em grupos quando `allowlist` está definido.

### Controle por menção (grupos)

O BlueBubbles suporta controle por menção para chats em grupo, seguindo o comportamento do iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`) para detectar menções.
- Quando `requireMention` está habilitado para um grupo, o agente só responde quando mencionado.
- Comandos de controle de remetentes autorizados ignoram o controle por menção.

Configuração por grupo:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+5511999999999"],
      groups: {
        "*": { requireMention: true }, // padrão para todos os grupos
        "iMessage;-;chat123": { requireMention: false }, // substituição para grupo específico
      },
    },
  },
}
```

### Controle de comandos

- Comandos de controle (ex.: `/config`, `/model`) requerem autorização.
- Usa `allowFrom` e `groupAllowFrom` para determinar autorização de comandos.
- Remetentes autorizados podem executar comandos de controle mesmo sem mencionar em grupos.

## Digitação + confirmações de leitura

- **Indicadores de digitação**: enviados automaticamente antes e durante a geração de resposta.
- **Confirmações de leitura**: controladas por `channels.bluebubbles.sendReadReceipts` (padrão: `true`).
- **Indicadores de digitação**: o OpenCraft envia eventos de início de digitação; o BlueBubbles limpa a digitação automaticamente ao enviar ou por timeout (parada manual via DELETE é pouco confiável).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // desabilitar confirmações de leitura
    },
  },
}
```

## Ações avançadas

O BlueBubbles suporta ações avançadas de mensagem quando habilitadas na config:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (padrão: true)
        edit: true, // editar mensagens enviadas (macOS 13+, quebrado no macOS 26 Tahoe)
        unsend: true, // cancelar envio de mensagens (macOS 13+)
        reply: true, // encadeamento de respostas por GUID da mensagem
        sendWithEffect: true, // efeitos de mensagem (slam, loud, etc.)
        renameGroup: true, // renomear chats em grupo
        setGroupIcon: true, // definir ícone/foto do chat em grupo (instável no macOS 26 Tahoe)
        addParticipant: true, // adicionar participantes a grupos
        removeParticipant: true, // remover participantes de grupos
        leaveGroup: true, // sair de chats em grupo
        sendAttachment: true, // enviar anexos/mídia
      },
    },
  },
}
```

Ações disponíveis:

- **react**: Adicionar/remover reações tapback (`messageId`, `emoji`, `remove`)
- **edit**: Editar uma mensagem enviada (`messageId`, `text`)
- **unsend**: Cancelar o envio de uma mensagem (`messageId`)
- **reply**: Responder a uma mensagem específica (`messageId`, `text`, `to`)
- **sendWithEffect**: Enviar com efeito iMessage (`text`, `to`, `effectId`)
- **renameGroup**: Renomear um chat em grupo (`chatGuid`, `displayName`)
- **setGroupIcon**: Definir ícone/foto de um chat em grupo (`chatGuid`, `media`) — instável no macOS 26 Tahoe (a API pode retornar sucesso mas o ícone não sincroniza).
- **addParticipant**: Adicionar alguém a um grupo (`chatGuid`, `address`)
- **removeParticipant**: Remover alguém de um grupo (`chatGuid`, `address`)
- **leaveGroup**: Sair de um chat em grupo (`chatGuid`)
- **sendAttachment**: Enviar mídia/arquivos (`to`, `buffer`, `filename`, `asVoice`)
  - Mensagens de voz: defina `asVoice: true` com áudio **MP3** ou **CAF** para enviar como mensagem de voz iMessage. O BlueBubbles converte MP3 → CAF ao enviar mensagens de voz.

### IDs de mensagem (curto vs completo)

O OpenCraft pode expor IDs de mensagem _curtos_ (ex.: `1`, `2`) para economizar tokens.

- `MessageSid` / `ReplyToId` podem ser IDs curtos.
- `MessageSidFull` / `ReplyToIdFull` contêm os IDs completos do provedor.
- IDs curtos ficam em memória; podem expirar ao reiniciar ou por evicção de cache.
- As ações aceitam `messageId` curto ou completo, mas IDs curtos retornarão erro se não estiverem mais disponíveis.

Use IDs completos para automações duráveis e armazenamento:

- Templates: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` em payloads de entrada

Veja [Configuração](/gateway/configuration) para variáveis de template.

## Streaming em blocos

Controle se as respostas são enviadas como uma única mensagem ou em blocos via streaming:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // habilitar streaming em blocos (desabilitado por padrão)
    },
  },
}
```

## Mídia + limites

- Anexos de entrada são baixados e armazenados no cache de mídia.
- Limite de mídia via `channels.bluebubbles.mediaMaxMb` para mídia de entrada e saída (padrão: 8 MB).
- Texto de saída é dividido em `channels.bluebubbles.textChunkLimit` (padrão: 4000 caracteres).

## Referência de configuração

Configuração completa: [Configuração](/gateway/configuration)

Opções do provedor:

- `channels.bluebubbles.enabled`: Habilitar/desabilitar o canal.
- `channels.bluebubbles.serverUrl`: URL base da REST API do BlueBubbles.
- `channels.bluebubbles.password`: Senha da API.
- `channels.bluebubbles.webhookPath`: Caminho do endpoint de webhook (padrão: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: `pairing`).
- `channels.bluebubbles.allowFrom`: Lista de permissão de DM (handles, emails, números E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (padrão: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: Lista de permissão de remetentes em grupo.
- `channels.bluebubbles.groups`: Config por grupo (`requireMention`, etc.).
- `channels.bluebubbles.sendReadReceipts`: Enviar confirmações de leitura (padrão: `true`).
- `channels.bluebubbles.blockStreaming`: Habilitar streaming em blocos (padrão: `false`; necessário para respostas em streaming).
- `channels.bluebubbles.textChunkLimit`: Tamanho do bloco de saída em caracteres (padrão: 4000).
- `channels.bluebubbles.chunkMode`: `length` (padrão) divide apenas quando excede `textChunkLimit`; `newline` divide em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- `channels.bluebubbles.mediaMaxMb`: Limite de mídia de entrada/saída em MB (padrão: 8).
- `channels.bluebubbles.mediaLocalRoots`: Lista de permissão explícita de diretórios locais absolutos permitidos para caminhos de mídia local de saída. Envios de caminho local são negados por padrão a menos que esteja configurado. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: Máximo de mensagens de grupo para contexto (0 desabilita).
- `channels.bluebubbles.dmHistoryLimit`: Limite de histórico de DM.
- `channels.bluebubbles.actions`: Habilitar/desabilitar ações específicas.
- `channels.bluebubbles.accounts`: Configuração de múltiplas contas.

Opções globais relacionadas:

- `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Endereçamento / alvos de entrega

Prefira `chat_guid` para roteamento estável:

- `chat_guid:iMessage;-;+5511999999999` (preferido para grupos)
- `chat_id:123`
- `chat_identifier:...`
- Handles diretos: `+5511999999999`, `usuario@example.com`
  - Se um handle direto não tiver um chat DM existente, o OpenCraft criará um via `POST /api/v1/chat/new`. Isso requer que a API Privada do BlueBubbles esteja habilitada.

## Segurança

- Requisições de webhook são autenticadas comparando os parâmetros de query `guid`/`password` ou headers com `channels.bluebubbles.password`. Requisições de `localhost` também são aceitas.
- Mantenha a senha da API e o endpoint de webhook em segredo (trate-os como credenciais).
- A confiança em localhost significa que um proxy reverso no mesmo host pode ignorar a senha acidentalmente. Se você fizer proxy do gateway, exija autenticação no proxy e configure `gateway.trustedProxies`. Veja [Segurança do gateway](/gateway/security#reverse-proxy-configuration).
- Habilite HTTPS + regras de firewall no servidor BlueBubbles se expô-lo fora da sua rede local.

## Solução de problemas

- Se eventos de digitação/leitura pararem de funcionar, verifique os logs de webhook do BlueBubbles e confirme que o caminho do gateway corresponde a `channels.bluebubbles.webhookPath`.
- Códigos de pareamento expiram após uma hora; use `opencraft pairing list bluebubbles` e `opencraft pairing approve bluebubbles <código>`.
- Reações requerem a API privada do BlueBubbles (`POST /api/v1/message/react`); verifique se a versão do servidor a expõe.
- Edição/cancelamento de envio requerem macOS 13+ e uma versão compatível do servidor BlueBubbles. No macOS 26 (Tahoe), a edição está atualmente quebrada devido a mudanças na API privada.
- Atualizações de ícone de grupo podem ser instáveis no macOS 26 (Tahoe): a API pode retornar sucesso mas o novo ícone não sincroniza.
- O OpenCraft oculta automaticamente ações com problemas conhecidos com base na versão do macOS do servidor BlueBubbles. Se a edição ainda aparecer no macOS 26 (Tahoe), desabilite manualmente com `channels.bluebubbles.actions.edit=false`.
- Para informações de status/saúde: `opencraft status --all` ou `opencraft status --deep`.

Para referência geral do fluxo de canais, veja [Canais](/channels) e o guia de [Plugins](/tools/plugin).
