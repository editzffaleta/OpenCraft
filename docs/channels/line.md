---
summary: "Configuração, config e uso do plugin LINE Messaging API"
read_when:
  - Você quer conectar o OpenCraft ao LINE
  - Você precisa de configuração de webhook + credenciais LINE
  - Você quer opções de mensagem específicas do LINE
title: LINE
---

# LINE (plugin)

O LINE se conecta ao OpenCraft via LINE Messaging API. O plugin funciona como um receptor de webhook no gateway e usa seu token de acesso ao canal + segredo do canal para autenticação.

Status: suportado via plugin. Mensagens diretas, chats em grupo, mídia, localizações, mensagens Flex, mensagens de template e respostas rápidas são suportados. Reações e threads não são suportados.

## Plugin necessário

Instale o plugin LINE:

```bash
opencraft plugins install @openclaw/line
```

Checkout local (quando executando a partir de um repositório git):

```bash
opencraft plugins install ./extensions/line
```

## Configuração

1. Crie uma conta no LINE Developers e abra o Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crie (ou selecione) um Provedor e adicione um canal de **Messaging API**.
3. Copie o **Token de acesso ao canal** e o **Segredo do canal** nas configurações do canal.
4. Habilite **Usar webhook** nas configurações da Messaging API.
5. Defina a URL do webhook para o endpoint do seu gateway (HTTPS obrigatório):

```
https://gateway-host/line/webhook
```

O gateway responde à verificação de webhook do LINE (GET) e a eventos de entrada (POST).
Se você precisar de um caminho personalizado, defina `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` e atualize a URL de acordo.

Nota de segurança:

- A verificação de assinatura do LINE depende do corpo (HMAC sobre o corpo bruto), então o OpenCraft aplica limites estritos de corpo pré-auth e timeout antes da verificação.

## Configurar

Config mínima:

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

Variáveis de ambiente (somente conta padrão):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Arquivos de token/segredo:

```json5
{
  channels: {
    line: {
      tokenFile: "/caminho/para/line-token.txt",
      secretFile: "/caminho/para/line-secret.txt",
    },
  },
}
```

`tokenFile` e `secretFile` devem apontar para arquivos regulares. Symlinks são rejeitados.

Múltiplas contas:

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

Mensagens diretas têm pareamento por padrão. Remetentes desconhecidos recebem um código de pareamento e suas mensagens são ignoradas até aprovação.

```bash
opencraft pairing list line
opencraft pairing approve line <CÓDIGO>
```

Listas de permissão e políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuário LINE na allowlist para DMs
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuário LINE na allowlist para grupos
- Substituições por grupo: `channels.line.groups.<groupId>.allowFrom`
- Nota de runtime: se `channels.line` estiver completamente ausente, o runtime recorre a `groupPolicy="allowlist"` para verificações de grupo (mesmo se `channels.defaults.groupPolicy` estiver definido).

IDs do LINE são case-sensitive. IDs válidos parecem com:

- Usuário: `U` + 32 caracteres hex
- Grupo: `C` + 32 caracteres hex
- Sala: `R` + 32 caracteres hex

## Comportamento de mensagens

- Texto é fragmentado a 5000 caracteres.
- Formatação Markdown é removida; blocos de código e tabelas são convertidos em cards Flex quando possível.
- Respostas em streaming são armazenadas em buffer; o LINE recebe blocos completos com uma animação de carregamento enquanto o agente trabalha.
- Downloads de mídia são limitados por `channels.line.mediaMaxMb` (padrão 10).

## Dados do canal (mensagens ricas)

Use `channelData.line` para enviar respostas rápidas, localizações, cards Flex ou mensagens de template.

```json5
{
  text: "Aqui está",
  channelData: {
    line: {
      quickReplies: ["Status", "Ajuda"],
      location: {
        title: "Escritório",
        address: "Rua Principal, 123",
        latitude: -23.550520,
        longitude: -46.633308,
      },
      flexMessage: {
        altText: "Card de status",
        contents: {
          /* payload Flex */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Prosseguir?",
        confirmLabel: "Sim",
        confirmData: "yes",
        cancelLabel: "Não",
        cancelData: "no",
      },
    },
  },
}
```

O plugin LINE também inclui um comando `/card` para presets de mensagem Flex:

```
/card info "Bem-vindo" "Obrigado por entrar!"
```

## Solução de problemas

- **Falha na verificação do webhook:** certifique-se de que a URL do webhook é HTTPS e que o `channelSecret` corresponde ao console do LINE.
- **Sem eventos de entrada:** confirme que o caminho do webhook corresponde a `channels.line.webhookPath` e que o gateway está acessível pelo LINE.
- **Erros de download de mídia:** aumente `channels.line.mediaMaxMb` se a mídia exceder o limite padrão.
