---
summary: "Status de suporte, capacidades e configuração do Tlon/Urbit"
read_when:
  - Working on Tlon/Urbit channel features
title: "Tlon"
---

# Tlon (plugin)

Tlon é um mensageiro descentralizado construído sobre Urbit. O OpenCraft se conecta ao seu ship Urbit e pode
responder a DMs e mensagens de chat em grupo. Respostas em grupo exigem uma @ menção por padrão e podem
ser ainda mais restritas via allowlists.

Status: suportado via plugin. DMs, menções em grupo, respostas em threads, formatação de texto rico e
upload de imagens são suportados. Reações e enquetes ainda não são suportadas.

## Plugin necessário

Tlon é distribuído como um plugin e não está incluso na instalação principal.

Instalar via CLI (registro npm):

```bash
opencraft plugins install @opencraft/tlon
```

Checkout local (ao executar a partir de um repositório git):

```bash
opencraft plugins install ./extensions/tlon
```

Detalhes: [Plugins](/tools/plugin)

## Configuração

1. Instale o plugin Tlon.
2. Obtenha a URL do seu ship e o código de login.
3. Configure `channels.tlon`.
4. Reinicie o Gateway.
5. Envie uma DM para o Bot ou mencione-o em um canal de grupo.

Configuração mínima (conta única):

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

Por padrão, o OpenCraft bloqueia hostnames privados/internos e faixas de IP para proteção contra SSRF.
Se o seu ship está rodando em uma rede privada (localhost, IP de LAN ou hostname interno),
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

⚠️ Habilite isso apenas se você confia na sua rede local. Essa configuração desabilita as proteções SSRF
para requisições à URL do seu ship.

## Canais de grupo

A descoberta automática está habilitada por padrão. Você também pode fixar canais manualmente:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Desabilitar descoberta automática:

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

Allowlist de DM (vazio = nenhuma DM permitida, use `ownerShip` para fluxo de aprovação):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Autorização de grupo (restrita por padrão):

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

## Proprietário e sistema de aprovação

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
mensagens em canais são sempre permitidas. Você não precisa adicionar o proprietário ao `dmAllowlist` ou
`defaultAuthorizedShips`.

Quando definido, o proprietário recebe notificações via DM para:

- Solicitações de DM de ships que não estão na allowlist
- Menções em canais sem autorização
- Solicitações de convite para grupos

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

## Alvos de entrega (CLI/Cron)

Use estes com `opencraft message send` ou entrega via Cron:

- DM: `~sampel-palnet` ou `dm/~sampel-palnet`
- Grupo: `chat/~host-ship/channel` ou `group:~host-ship/channel`

## Skill inclusa

O plugin Tlon inclui uma Skill embutida ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
que fornece acesso via CLI a operações do Tlon:

- **Contatos**: obter/atualizar perfis, listar contatos
- **Canais**: listar, criar, postar mensagens, buscar histórico
- **Grupos**: listar, criar, gerenciar membros
- **DMs**: enviar mensagens, reagir a mensagens
- **Reações**: adicionar/remover reações com emoji a posts e DMs
- **Configurações**: gerenciar permissões do plugin via comandos slash

A Skill fica automaticamente disponível quando o plugin é instalado.

## Capacidades

| Recurso           | Status                                         |
| ----------------- | ---------------------------------------------- |
| Mensagens diretas | ✅ Suportado                                   |
| Grupos/canais     | ✅ Suportado (restrito por menção por padrão)  |
| Threads           | ✅ Suportado (respostas automáticas na thread) |
| Texto rico        | ✅ Markdown convertido para formato Tlon       |
| Imagens           | ✅ Enviadas para o armazenamento do Tlon       |
| Reações           | ✅ Via [Skill inclusa](#skill-inclusa)         |
| Enquetes          | ❌ Ainda não suportado                         |
| Comandos nativos  | ✅ Suportado (apenas proprietário por padrão)  |

## Solução de problemas

Execute esta sequência primeiro:

```bash
opencraft status
opencraft gateway status
opencraft logs --follow
opencraft doctor
```

Falhas comuns:

- **DMs ignoradas**: remetente não está na `dmAllowlist` e nenhum `ownerShip` configurado para fluxo de aprovação.
- **Mensagens de grupo ignoradas**: canal não descoberto ou remetente não autorizado.
- **Erros de conexão**: verifique se a URL do ship está acessível; habilite `allowPrivateNetwork` para ships locais.
- **Erros de autenticação**: verifique se o código de login está atual (os códigos rotacionam).

## Referência de configuração

Configuração completa: [Configuração](/gateway/configuration)

Opções do provedor:

- `channels.tlon.enabled`: habilitar/desabilitar inicialização do canal.
- `channels.tlon.ship`: nome do ship Urbit do Bot (ex: `~sampel-palnet`).
- `channels.tlon.url`: URL do ship (ex: `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: código de login do ship.
- `channels.tlon.allowPrivateNetwork`: permitir URLs localhost/LAN (bypass de SSRF).
- `channels.tlon.ownerShip`: ship proprietário para sistema de aprovação (sempre autorizado).
- `channels.tlon.dmAllowlist`: ships permitidos para DM (vazio = nenhum).
- `channels.tlon.autoAcceptDmInvites`: aceitar automaticamente DMs de ships na allowlist.
- `channels.tlon.autoAcceptGroupInvites`: aceitar automaticamente todos os convites de grupo.
- `channels.tlon.autoDiscoverChannels`: descobrir automaticamente canais de grupo (padrão: true).
- `channels.tlon.groupChannels`: canais fixados manualmente.
- `channels.tlon.defaultAuthorizedShips`: ships autorizados para todos os canais.
- `channels.tlon.authorization.channelRules`: regras de autenticação por canal.
- `channels.tlon.showModelSignature`: anexar nome do modelo às mensagens.

## Observações

- Respostas em grupo exigem uma menção (ex: `~your-bot-ship`) para responder.
- Respostas em threads: se a mensagem recebida está em uma thread, o OpenCraft responde na thread.
- Texto rico: formatação Markdown (negrito, itálico, código, cabeçalhos, listas) é convertida para o formato nativo do Tlon.
- Imagens: URLs são enviadas para o armazenamento do Tlon e incorporadas como blocos de imagem.
