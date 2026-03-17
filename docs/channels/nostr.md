---
summary: "Canal de DM Nostr via mensagens criptografadas NIP-04"
read_when:
  - Você quer que o OpenCraft receba DMs via Nostr
  - Você está configurando mensagens descentralizadas
title: "Nostr"
---

# Nostr

**Status:** Plugin opcional (desabilitado por padrão).

Nostr é um protocolo descentralizado para redes sociais. Este canal permite que o OpenCraft receba e responda a mensagens diretas (DMs) criptografadas via NIP-04.

## Instalação (sob demanda)

### Onboarding (recomendado)

- O onboarding (`opencraft onboard`) e `opencraft channels add` listam Plugins de canais opcionais.
- Selecionar Nostr solicita a instalação do Plugin sob demanda.

Padrões de instalação:

- **Canal dev + checkout git disponível:** usa o caminho local do Plugin.
- **Estável/Beta:** baixa do npm.

Você sempre pode sobrescrever a escolha no prompt.

### Instalação manual

```bash
opencraft plugins install @opencraft/nostr
```

Use um checkout local (fluxos de trabalho dev):

```bash
opencraft plugins install --link <path-to-opencraft>/extensions/nostr
```

Reinicie o Gateway após instalar ou habilitar Plugins.

### Configuração não interativa

```bash
opencraft channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
opencraft channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Use `--use-env` para manter `NOSTR_PRIVATE_KEY` no ambiente em vez de armazenar a chave na configuração.

## Configuração rápida

1. Gere um par de chaves Nostr (se necessário):

```bash
# Usando nak
nak key generate
```

2. Adicione à configuração:

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}"
    }
  }
}
```

3. Exporte a chave:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Reinicie o Gateway.

## Referência de configuração

| Chave        | Tipo     | Padrão                                      | Descrição                                      |
| ------------ | -------- | ------------------------------------------- | ---------------------------------------------- |
| `privateKey` | string   | obrigatório                                 | Chave privada no formato `nsec` ou hexadecimal |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URLs de relay (WebSocket)                      |
| `dmPolicy`   | string   | `pairing`                                   | Política de acesso a DM                        |
| `allowFrom`  | string[] | `[]`                                        | Pubkeys de remetentes permitidos               |
| `enabled`    | boolean  | `true`                                      | Habilitar/desabilitar canal                    |
| `name`       | string   | -                                           | Nome de exibição                               |
| `profile`    | object   | -                                           | Metadados de perfil NIP-01                     |

## Metadados de perfil

Os dados de perfil são publicados como um evento NIP-01 `kind:0`. Você pode gerenciá-los pela UI de Controle (Channels -> Nostr -> Profile) ou defini-los diretamente na configuração.

Exemplo:

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "profile": {
        "name": "opencraft",
        "displayName": "OpenCraft",
        "about": "Personal assistant DM bot",
        "picture": "https://example.com/avatar.png",
        "banner": "https://example.com/banner.png",
        "website": "https://example.com",
        "nip05": "opencraft@example.com",
        "lud16": "opencraft@example.com"
      }
    }
  }
}
```

Notas:

- URLs de perfil devem usar `https://`.
- Importar de relays mescla campos e preserva sobrescritas locais.

## Controle de acesso

### Políticas de DM

- **pairing** (padrão): remetentes desconhecidos recebem um código de pareamento.
- **allowlist**: apenas pubkeys em `allowFrom` podem enviar DM.
- **open**: DMs de entrada públicas (requer `allowFrom: ["*"]`).
- **disabled**: ignorar DMs de entrada.

### Exemplo de allowlist

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "dmPolicy": "allowlist",
      "allowFrom": ["npub1abc...", "npub1xyz..."]
    }
  }
}
```

## Formatos de chave

Formatos aceitos:

- **Chave privada:** `nsec...` ou hex de 64 caracteres
- **Pubkeys (`allowFrom`):** `npub...` ou hex

## Relays

Padrões: `relay.damus.io` e `nos.lol`.

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "relays": ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"]
    }
  }
}
```

Dicas:

- Use 2-3 relays para redundância.
- Evite muitos relays (latência, duplicação).
- Relays pagos podem melhorar a confiabilidade.
- Relays locais são adequados para testes (`ws://localhost:7777`).

## Suporte ao protocolo

| NIP    | Status    | Descrição                                      |
| ------ | --------- | ---------------------------------------------- |
| NIP-01 | Suportado | Formato básico de evento + metadados de perfil |
| NIP-04 | Suportado | DMs criptografadas (`kind:4`)                  |
| NIP-17 | Planejado | DMs com gift-wrap                              |
| NIP-44 | Planejado | Criptografia versionada                        |

## Testes

### Relay local

```bash
# Iniciar strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "relays": ["ws://localhost:7777"]
    }
  }
}
```

### Teste manual

1. Anote a pubkey do Bot (npub) nos logs.
2. Abra um cliente Nostr (Damus, Amethyst, etc.).
3. Envie DM para a pubkey do Bot.
4. Verifique a resposta.

## Solução de problemas

### Não recebendo mensagens

- Verifique se a chave privada é válida.
- Certifique-se de que as URLs dos relays são acessíveis e usam `wss://` (ou `ws://` para local).
- Confirme que `enabled` não é `false`.
- Verifique os logs do Gateway para erros de conexão com relays.

### Não enviando respostas

- Verifique se o relay aceita escritas.
- Verifique a conectividade de saída.
- Observe limites de taxa do relay.

### Respostas duplicadas

- Esperado ao usar múltiplos relays.
- Mensagens são deduplicadas por ID de evento; apenas a primeira entrega aciona uma resposta.

## Segurança

- Nunca faça commit de chaves privadas.
- Use variáveis de ambiente para chaves.
- Considere `allowlist` para bots em produção.

## Limitações (MVP)

- Apenas mensagens diretas (sem chats de grupo).
- Sem anexos de mídia.
- Apenas NIP-04 (NIP-17 gift-wrap planejado).
