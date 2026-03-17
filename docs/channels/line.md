---
summary: "Configuracao, setup e uso do Plugin LINE Messaging API"
read_when:
  - You want to connect OpenCraft to LINE
  - You need LINE webhook + credential setup
  - You want LINE-specific message options
title: LINE
---

# LINE (Plugin)

LINE se conecta ao OpenCraft via a LINE Messaging API. O Plugin funciona como um receptor
de Webhook no Gateway e usa seu Token de acesso do canal + segredo do canal para
autenticacao.

Status: suportado via Plugin. Mensagens diretas, chats em grupo, midia, localizacoes, mensagens
Flex, mensagens de template e respostas rapidas sao suportados. Reacoes e threads
nao sao suportados.

## Plugin necessario

Instale o Plugin LINE:

```bash
opencraft plugins install @opencraft/line
```

Checkout local (quando executando a partir de um repositorio git):

```bash
opencraft plugins install ./extensions/line
```

## Configuracao

1. Crie uma conta LINE Developers e abra o Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crie (ou escolha) um Provider e adicione um canal **Messaging API**.
3. Copie o **Channel access token** e o **Channel secret** das configuracoes do canal.
4. Habilite **Use webhook** nas configuracoes da Messaging API.
5. Defina a URL do Webhook para o endpoint do seu Gateway (HTTPS necessario):

```
https://gateway-host/line/webhook
```

O Gateway responde a verificacao de Webhook do LINE (GET) e eventos de entrada (POST).
Se voce precisar de um caminho personalizado, defina `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` e atualize a URL de acordo.

Nota de seguranca:

- A verificacao de assinatura do LINE depende do corpo (HMAC sobre o corpo bruto), entao o OpenCraft aplica limites rigorosos de corpo pre-autenticacao e timeout antes da verificacao.

## Configurar

Configuracao minima:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Variaveis de ambiente (somente conta padrao):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Arquivos de Token/segredo:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` e `secretFile` devem apontar para arquivos regulares. Symlinks sao rejeitados.

Multiplas contas:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Controle de acesso

Mensagens diretas usam pareamento por padrao. Remetentes desconhecidos recebem um codigo de pareamento e suas
mensagens sao ignoradas ate serem aprovadas.

```bash
opencraft pairing list line
opencraft pairing approve line <CODE>
```

Listas de permitidos e politicas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuario LINE permitidos para DMs
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuario LINE permitidos para grupos
- Substituicoes por grupo: `channels.line.groups.<groupId>.allowFrom`
- Nota de runtime: se `channels.line` estiver completamente ausente, o runtime cai para `groupPolicy="allowlist"` para verificacoes de grupo (mesmo se `channels.defaults.groupPolicy` estiver definido).

IDs do LINE sao case-sensitive. IDs validos se parecem com:

- Usuario: `U` + 32 caracteres hexadecimais
- Grupo: `C` + 32 caracteres hexadecimais
- Sala: `R` + 32 caracteres hexadecimais

## Comportamento de mensagens

- Texto e dividido em blocos de 5000 caracteres.
- Formatacao Markdown e removida; blocos de codigo e tabelas sao convertidos em cards
  Flex quando possivel.
- Respostas em streaming sao armazenadas em buffer; o LINE recebe blocos completos com uma
  animacao de carregamento enquanto o agente trabalha.
- Downloads de midia sao limitados por `channels.line.mediaMaxMb` (padrao 10).

## Dados do canal (mensagens ricas)

Use `channelData.line` para enviar respostas rapidas, localizacoes, cards Flex ou mensagens
de template.

```json5
{
  text: "Aqui esta",
  channelData: {
    line: {
      quickReplies: ["Status", "Ajuda"],
      location: {
        title: "Escritorio",
        address: "Rua Principal 123",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Card de status",
        contents: {
          /* Payload Flex */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Continuar?",
        confirmLabel: "Sim",
        confirmData: "yes",
        cancelLabel: "Nao",
        cancelData: "no",
      },
    },
  },
}
```

O Plugin LINE tambem fornece um comando `/card` para presets de mensagem Flex:

```
/card info "Bem-vindo" "Obrigado por participar!"
```

## Solucao de problemas

- **Verificacao de Webhook falha:** certifique-se de que a URL do Webhook e HTTPS e o
  `channelSecret` corresponde ao console do LINE.
- **Sem eventos de entrada:** confirme que o caminho do Webhook corresponde a `channels.line.webhookPath`
  e que o Gateway e acessivel a partir do LINE.
- **Erros de download de midia:** aumente `channels.line.mediaMaxMb` se a midia exceder o
  limite padrao.
