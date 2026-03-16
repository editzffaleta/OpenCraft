---
summary: "Visão geral do pareamento: aprovar quem pode enviar DMs + quais nós podem se juntar"
read_when:
  - Configurando controle de acesso a DMs
  - Pareando um novo nó iOS/Android
  - Revisando a postura de segurança do OpenCraft
title: "Pareamento"
---

# Pareamento

"Pareamento" é a etapa de **aprovação explícita do proprietário** no OpenCraft.
É usado em dois lugares:

1. **Pareamento de DM** (quem tem permissão para falar com o bot)
2. **Pareamento de nó** (quais dispositivos/nós têm permissão para ingressar na rede do gateway)

Contexto de segurança: [Segurança](/gateway/security)

## 1) Pareamento de DM (acesso ao chat de entrada)

Quando um canal é configurado com política de DM `pairing`, remetentes desconhecidos recebem um código curto e sua mensagem **não é processada** até que você aprove.

As políticas de DM padrão estão documentadas em: [Segurança](/gateway/security)

Códigos de pareamento:

- 8 caracteres, maiúsculas, sem caracteres ambíguos (`0O1I`).
- **Expiram após 1 hora**. O bot envia a mensagem de pareamento apenas quando uma nova solicitação é criada (aproximadamente uma vez por hora por remetente).
- As solicitações de pareamento de DM pendentes são limitadas a **3 por canal** por padrão; solicitações adicionais são ignoradas até que uma expire ou seja aprovada.

### Aprovar um remetente

```bash
opencraft pairing list telegram
opencraft pairing approve telegram <CÓDIGO>
```

Canais suportados: `telegram`, `whatsapp`, `signal`, `imessage`, `discord`, `slack`, `feishu`.

### Onde o estado fica armazenado

Armazenado em `~/.opencraft/credentials/`:

- Solicitações pendentes: `<canal>-pairing.json`
- Store de lista de permissão aprovada:
  - Conta padrão: `<canal>-allowFrom.json`
  - Conta não padrão: `<canal>-<accountId>-allowFrom.json`

Comportamento de escopo de conta:

- Contas não padrão leem/escrevem apenas seu arquivo de lista de permissão com escopo.
- A conta padrão usa o arquivo de lista de permissão sem escopo do canal.

Trate estes como sensíveis (eles controlam o acesso ao seu assistente).

## 2) Pareamento de dispositivo/nó (nós iOS/Android/macOS/headless)

Nós se conectam ao Gateway como **dispositivos** com `role: node`. O Gateway
cria uma solicitação de pareamento de dispositivo que deve ser aprovada.

### Parear via Telegram (recomendado para iOS)

Se você usa o plugin `device-pair`, pode fazer o primeiro pareamento de dispositivo inteiramente pelo Telegram:

1. No Telegram, envie mensagem para seu bot: `/pair`
2. O bot responde com duas mensagens: uma mensagem de instrução e uma mensagem separada com o **código de configuração** (fácil de copiar/colar no Telegram).
3. No seu celular, abra o app iOS do OpenCraft → Configurações → Gateway.
4. Cole o código de configuração e conecte.
5. De volta no Telegram: `/pair approve`

O código de configuração é um payload JSON codificado em base64 que contém:

- `url`: a URL WebSocket do Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken`: um token de bootstrap de dispositivo único de curta duração usado para o handshake inicial de pareamento

Trate o código de configuração como uma senha enquanto estiver válido.

### Aprovar um dispositivo/nó

```bash
opencraft devices list
opencraft devices approve <requestId>
opencraft devices reject <requestId>
```

### Armazenamento do estado de pareamento de nó

Armazenado em `~/.opencraft/devices/`:

- `pending.json` (de curta duração; solicitações pendentes expiram)
- `paired.json` (dispositivos pareados + tokens)

### Notas

- A API legada `node.pair.*` (CLI: `opencraft nodes pending/approve`) é um
  store de pareamento separado de propriedade do gateway. Nós WS ainda requerem pareamento de dispositivo.

## Documentação relacionada

- Modelo de segurança + injeção de prompt: [Segurança](/gateway/security)
- Atualização com segurança (execute doctor): [Atualização](/install/updating)
- Configurações de canal:
  - Telegram: [Telegram](/channels/telegram)
  - WhatsApp: [WhatsApp](/channels/whatsapp)
  - Signal: [Signal](/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/channels/bluebubbles)
  - iMessage (legado): [iMessage](/channels/imessage)
  - Discord: [Discord](/channels/discord)
  - Slack: [Slack](/channels/slack)
