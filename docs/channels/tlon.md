---
summary: "Status de suporte, capacidades e configuração do Tlon/Urbit"
read_when:
  - Trabalhando em funcionalidades do canal Tlon/Urbit
title: "Tlon"
---

# Tlon (plugin)

Tlon é um mensageiro descentralizado construído sobre Urbit. O OpenCraft se conecta ao seu ship Urbit e pode
responder a DMs e mensagens em chats de grupo. Respostas em grupo requerem uma menção @ por padrão e podem
ser ainda mais restritas via allowlists.

Status: suportado via plugin. DMs, menções em grupo, respostas em thread, formatação de rich text e
uploads de imagens são suportados. Reações e enquetes ainda não são suportados.

## Plugin necessário

O Tlon é distribuído como plugin e não está incluído na instalação principal.

Instale via CLI (registro npm):

```bash
opencraft plugins install @openclaw/tlon
```

Checkout local (quando executando a partir de um repositório git):

```bash
opencraft plugins install ./extensions/tlon
```

Detalhes: [Plugins](/tools/plugin)

## Configuração

1. Instale o plugin Tlon.
2. Obtenha a URL do seu ship e o código de login.
3. Configure `channels.tlon`.
4. Reinicie o gateway.
5. Envie um DM ao bot ou mencione-o em um canal de grupo.

Config mínima (conta única):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recomendado: seu ship, sempre permitido
    },
  },
}
```

## Ships privados/LAN

Por padrão, o OpenCraft bloqueia hostnames e faixas de IP privados/internos para proteção contra SSRF.
Se o seu ship estiver em uma rede privada (localhost, IP de LAN ou hostname interno),
você deve optar explicitamente:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Isso se aplica a URLs como:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Habilite isso apenas se confiar na sua rede local. Esta configuração desabilita as proteções SSRF
para requisições à URL do seu ship.

## Canais de grupo

A autodescoberta está habilitada por padrão. Você também pode fixar canais manualmente:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Desabilitar autodescoberta:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Controle de acesso

Allowlist de DM (vazia = nenhum DM permitido, use `ownerShip` para fluxo de aprovação):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Autorização de grupo (restrito por padrão):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## Sistema de proprietário e aprovação

Defina um ship proprietário para receber solicitações de aprovação quando usuários não autorizados tentarem interagir:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

O ship proprietário é **automaticamente autorizado em todos os lugares** — convites de DM são aceitos automaticamente e
mensagens de canal são sempre permitidas. Você não precisa adicionar o proprietário a `dmAllowlist` ou
`defaultAuthorizedShips`.

Quando definido, o proprietário recebe notificações de DM para:

- Solicitações de DM de ships não incluídos na allowlist
- Menções em canais sem autorização
- Solicitações de convite de grupo

## Configurações de aceitação automática

Aceitar automaticamente convites de DM (para ships na dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Aceitar automaticamente convites de grupo:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Alvos de entrega (CLI/cron)

Use estes com `opencraft message send` ou entrega via cron:

- DM: `~sampel-palnet` ou `dm/~sampel-palnet`
- Grupo: `chat/~host-ship/channel` ou `group:~host-ship/channel`

## Skill incluída

O plugin Tlon inclui uma skill embutida ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
que fornece acesso via CLI às operações do Tlon:

- **Contatos**: obter/atualizar perfis, listar contatos
- **Canais**: listar, criar, postar mensagens, buscar histórico
- **Grupos**: listar, criar, gerenciar membros
- **DMs**: enviar mensagens, reagir a mensagens
- **Reações**: adicionar/remover reações emoji em posts e DMs
- **Configurações**: gerenciar permissões do plugin via comandos slash

A skill fica disponível automaticamente quando o plugin é instalado.

## Capacidades

| Funcionalidade    | Status                                           |
| ----------------- | ------------------------------------------------ |
| Mensagens diretas | ✅ Suportado                                     |
| Grupos/canais     | ✅ Suportado (com controle por menção por padrão)|
| Threads           | ✅ Suportado (respostas automáticas na thread)   |
| Rich text         | ✅ Markdown convertido para formato Tlon         |
| Imagens           | ✅ Enviadas para armazenamento Tlon              |
| Reações           | ✅ Via [skill incluída](#skill-incluída)         |
| Enquetes          | ❌ Ainda não suportado                           |
| Comandos nativos  | ✅ Suportado (somente proprietário por padrão)   |

## Solução de problemas

Execute esta sequência primeiro:

```bash
opencraft status
opencraft gateway status
opencraft logs --follow
opencraft doctor
```

Falhas comuns:

- **DMs ignorados**: remetente não está em `dmAllowlist` e nenhum `ownerShip` configurado para o fluxo de aprovação.
- **Mensagens de grupo ignoradas**: canal não descoberto ou remetente não autorizado.
- **Erros de conexão**: verifique se a URL do ship é acessível; habilite `allowPrivateNetwork` para ships locais.
- **Erros de autenticação**: verifique se o código de login está atualizado (os códigos rotacionam).

## Referência de configuração

Configuração completa: [Configuração](/gateway/configuration)

Opções do provedor:

- `channels.tlon.enabled`: habilitar/desabilitar inicialização do canal.
- `channels.tlon.ship`: nome do ship Urbit do bot (ex.: `~sampel-palnet`).
- `channels.tlon.url`: URL do ship (ex.: `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: código de login do ship.
- `channels.tlon.allowPrivateNetwork`: permitir URLs localhost/LAN (bypass SSRF).
- `channels.tlon.ownerShip`: ship proprietário para o sistema de aprovação (sempre autorizado).
- `channels.tlon.dmAllowlist`: ships permitidos para DM (vazio = nenhum).
- `channels.tlon.autoAcceptDmInvites`: aceitar automaticamente DMs de ships na allowlist.
- `channels.tlon.autoAcceptGroupInvites`: aceitar automaticamente todos os convites de grupo.
- `channels.tlon.autoDiscoverChannels`: autodescobrir canais de grupo (padrão: true).
- `channels.tlon.groupChannels`: nests de canal fixados manualmente.
- `channels.tlon.defaultAuthorizedShips`: ships autorizados para todos os canais.
- `channels.tlon.authorization.channelRules`: regras de autenticação por canal.
- `channels.tlon.showModelSignature`: acrescentar nome do modelo às mensagens.

## Notas

- Respostas em grupo requerem uma menção (ex.: `~your-bot-ship`) para responder.
- Respostas em thread: se a mensagem de entrada estiver em uma thread, o OpenCraft responde na thread.
- Rich text: formatação Markdown (negrito, itálico, código, cabeçalhos, listas) é convertida para o formato nativo do Tlon.
- Imagens: URLs são enviadas para o armazenamento do Tlon e incorporadas como blocos de imagem.
