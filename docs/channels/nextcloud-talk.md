---
summary: "Status de suporte, capacidades e configuração do Nextcloud Talk"
read_when:
  - Trabalhando em funcionalidades do canal Nextcloud Talk
title: "Nextcloud Talk"
---

# Nextcloud Talk (plugin)

Status: suportado via plugin (bot webhook). Mensagens diretas, salas, reações e mensagens markdown são suportados.

## Plugin necessário

O Nextcloud Talk é distribuído como plugin e não está incluído na instalação principal.

Instale via CLI (registro npm):

```bash
opencraft plugins install @openclaw/nextcloud-talk
```

Checkout local (quando executando a partir de um repositório git):

```bash
opencraft plugins install ./extensions/nextcloud-talk
```

Se você escolher o Nextcloud Talk durante a configuração/onboarding e um checkout git for detectado,
o OpenCraft oferecerá o caminho de instalação local automaticamente.

Detalhes: [Plugins](/tools/plugin)

## Configuração rápida (iniciantes)

1. Instale o plugin do Nextcloud Talk.
2. No seu servidor Nextcloud, crie um bot:

   ```bash
   ./occ talk:bot:install "OpenCraft" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Habilite o bot nas configurações da sala de destino.
4. Configure o OpenCraft:
   - Config: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Ou env: `NEXTCLOUD_TALK_BOT_SECRET` (somente conta padrão)
5. Reinicie o gateway (ou conclua o onboarding).

Config mínima:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Notas

- Bots não podem iniciar DMs. O usuário deve enviar mensagem ao bot primeiro.
- A URL do webhook deve ser acessível pelo Gateway; defina `webhookPublicUrl` se estiver atrás de um proxy.
- Uploads de mídia não são suportados pela API do bot; a mídia é enviada como URLs.
- O payload do webhook não distingue DMs de salas; defina `apiUser` + `apiPassword` para habilitar lookups de tipo de sala (caso contrário, DMs são tratados como salas).

## Controle de acesso (DMs)

- Padrão: `channels.nextcloud-talk.dmPolicy = "pairing"`. Remetentes desconhecidos recebem um código de pareamento.
- Aprove via:
  - `opencraft pairing list nextcloud-talk`
  - `opencraft pairing approve nextcloud-talk <CÓDIGO>`
- DMs públicos: `channels.nextcloud-talk.dmPolicy="open"` mais `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` corresponde apenas a IDs de usuário do Nextcloud; nomes de exibição são ignorados.

## Salas (grupos)

- Padrão: `channels.nextcloud-talk.groupPolicy = "allowlist"` (com controle por menção).
- Coloque salas na allowlist com `channels.nextcloud-talk.rooms`:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Para não permitir nenhuma sala, mantenha a allowlist vazia ou defina `channels.nextcloud-talk.groupPolicy="disabled"`.

## Capacidades

| Funcionalidade    | Status           |
| ----------------- | ---------------- |
| Mensagens diretas | Suportado        |
| Salas             | Suportado        |
| Threads           | Não suportado    |
| Mídia             | Somente URL      |
| Reações           | Suportado        |
| Comandos nativos  | Não suportado    |

## Referência de configuração (Nextcloud Talk)

Configuração completa: [Configuração](/gateway/configuration)

Opções do provedor:

- `channels.nextcloud-talk.enabled`: habilitar/desabilitar inicialização do canal.
- `channels.nextcloud-talk.baseUrl`: URL da instância Nextcloud.
- `channels.nextcloud-talk.botSecret`: segredo compartilhado do bot.
- `channels.nextcloud-talk.botSecretFile`: caminho para arquivo de segredo (arquivo regular). Symlinks são rejeitados.
- `channels.nextcloud-talk.apiUser`: usuário de API para lookups de sala (detecção de DM).
- `channels.nextcloud-talk.apiPassword`: senha de API/app para lookups de sala.
- `channels.nextcloud-talk.apiPasswordFile`: caminho para arquivo de senha de API.
- `channels.nextcloud-talk.webhookPort`: porta do receptor de webhook (padrão: 8788).
- `channels.nextcloud-talk.webhookHost`: host do webhook (padrão: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: caminho do webhook (padrão: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL do webhook acessível externamente.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: allowlist de DM (IDs de usuário). `open` requer `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: allowlist de grupo (IDs de usuário).
- `channels.nextcloud-talk.rooms`: configurações e allowlist por sala.
- `channels.nextcloud-talk.historyLimit`: limite de histórico de grupo (0 desabilita).
- `channels.nextcloud-talk.dmHistoryLimit`: limite de histórico de DM (0 desabilita).
- `channels.nextcloud-talk.dms`: substituições por DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: tamanho do chunk de texto de saída (caracteres).
- `channels.nextcloud-talk.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes do chunking por comprimento.
- `channels.nextcloud-talk.blockStreaming`: desabilitar streaming em bloco para este canal.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ajuste de coalescência de streaming em bloco.
- `channels.nextcloud-talk.mediaMaxMb`: limite de mídia de entrada (MB).
