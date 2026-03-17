---
summary: "Visão geral do pareamento: aprovar quem pode enviar DM para você + quais nós podem se juntar"
read_when:
  - Configurando controle de acesso a DMs
  - Pareando um novo nó iOS/Android
  - Revisando postura de segurança do OpenCraft
title: "Pairing"
---

# Pareamento

"Pareamento" é o passo de **aprovação explícita do proprietário** do OpenCraft.
Ele é usado em dois lugares:

1. **Pareamento de DM** (quem tem permissão para conversar com o Bot)
2. **Pareamento de nó** (quais dispositivos/nós podem se juntar à rede do Gateway)

Contexto de segurança: [Security](/gateway/security)

## 1) Pareamento de DM (acesso de chat de entrada)

Quando um canal é configurado com política de DM `pairing`, remetentes desconhecidos recebem um código curto e sua mensagem **não é processada** até que você aprove.

Políticas padrão de DM são documentadas em: [Security](/gateway/security)

Códigos de pareamento:

- 8 caracteres, maiúsculos, sem caracteres ambíguos (`0O1I`).
- **Expiram após 1 hora**. O Bot só envia a mensagem de pareamento quando uma nova solicitação é criada (aproximadamente uma vez por hora por remetente).
- Solicitações de pareamento de DM pendentes são limitadas a **3 por canal** por padrão; solicitações adicionais são ignoradas até que uma expire ou seja aprovada.

### Aprovar um remetente

```bash
opencraft pairing list telegram
opencraft pairing approve telegram <CODE>
```

Canais suportados: `telegram`, `whatsapp`, `signal`, `imessage`, `discord`, `slack`, `feishu`.

### Onde o estado é armazenado

Armazenado em `~/.opencraft/credentials/`:

- Solicitações pendentes: `<channel>-pairing.json`
- Armazenamento de allowlist aprovada:
  - Conta padrão: `<channel>-allowFrom.json`
  - Conta não padrão: `<channel>-<accountId>-allowFrom.json`

Comportamento de escopo de conta:

- Contas não padrão leem/escrevem apenas seu arquivo de allowlist com escopo.
- A conta padrão usa o arquivo de allowlist sem escopo do canal.

Trate estes como sensíveis (eles controlam o acesso ao seu assistente).

## 2) Pareamento de dispositivo de nó (nós iOS/Android/macOS/headless)

Nós se conectam ao Gateway como **dispositivos** com `role: node`. O Gateway
cria uma solicitação de pareamento de dispositivo que deve ser aprovada.

### Parear via Telegram (recomendado para iOS)

Se você usa o Plugin `device-pair`, pode fazer o pareamento inicial do dispositivo inteiramente pelo Telegram:

1. No Telegram, envie mensagem para o seu Bot: `/pair`
2. O Bot responde com duas mensagens: uma mensagem de instrução e uma mensagem separada com o **código de configuração** (fácil de copiar/colar no Telegram).
3. No seu telefone, abra o app OpenCraft iOS e depois Configurações e depois Gateway.
4. Cole o código de configuração e conecte.
5. De volta no Telegram: `/pair approve`

O código de configuração é um payload JSON codificado em base64 que contém:

- `url`: a URL WebSocket do Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken`: um Token de bootstrap de curta duração para um único dispositivo, usado para o handshake inicial de pareamento

Trate o código de configuração como uma senha enquanto ele for válido.

### Aprovar um dispositivo de nó

```bash
opencraft devices list
opencraft devices approve <requestId>
opencraft devices reject <requestId>
```

### Armazenamento de estado de pareamento de nó

Armazenado em `~/.opencraft/devices/`:

- `pending.json` (curta duração; solicitações pendentes expiram)
- `paired.json` (dispositivos pareados + Tokens)

### Notas

- A API legada `node.pair.*` (CLI: `opencraft nodes pending/approve`) é um
  armazenamento de pareamento separado pertencente ao Gateway. Nós WS ainda requerem pareamento de dispositivo.

## Documentação relacionada

- Modelo de segurança + injeção de prompt: [Security](/gateway/security)
- Atualizando com segurança (executar doctor): [Updating](/install/updating)
- Configurações de canal:
  - Telegram: [Telegram](/channels/telegram)
  - WhatsApp: [WhatsApp](/channels/whatsapp)
  - Signal: [Signal](/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/channels/bluebubbles)
  - iMessage (legado): [iMessage](/channels/imessage)
  - Discord: [Discord](/channels/discord)
  - Slack: [Slack](/channels/slack)
