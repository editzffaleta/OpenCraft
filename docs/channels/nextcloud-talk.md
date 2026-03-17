---
summary: "Status de suporte, capacidades e configuração do Nextcloud Talk"
read_when:
  - Trabalhando em funcionalidades do canal Nextcloud Talk
title: "Nextcloud Talk"
---

# Nextcloud Talk (plugin)

Status: suportado via Plugin (Webhook Bot). Mensagens diretas, salas, reações e mensagens markdown são suportadas.

## Plugin necessário

O Nextcloud Talk é distribuído como Plugin e não está incluído na instalação principal.

Instalar via CLI (registro npm):

```bash
opencraft plugins install @opencraft/nextcloud-talk
```

Checkout local (ao executar a partir de um repositório git):

```bash
opencraft plugins install ./extensions/nextcloud-talk
```

Se você escolher Nextcloud Talk durante a configuração e um checkout git for detectado,
o OpenCraft oferecerá o caminho de instalação local automaticamente.

Detalhes: [Plugins](/tools/plugin)

## Configuração rápida (iniciante)

1. Instale o Plugin Nextcloud Talk.
2. No seu servidor Nextcloud, crie um Bot:

   ```bash
   ./occ talk:bot:install "OpenCraft" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Habilite o Bot nas configurações da sala alvo.
4. Configure o OpenCraft:
   - Config: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Ou env: `NEXTCLOUD_TALK_BOT_SECRET` (apenas conta padrão)
5. Reinicie o Gateway (ou finalize a configuração).

Configuração mínima:

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

- Bots não podem iniciar DMs. O usuário deve enviar mensagem para o Bot primeiro.
- A URL do Webhook deve ser acessível pelo Gateway; defina `webhookPublicUrl` se estiver atrás de um proxy.
- Uploads de mídia não são suportados pela API do Bot; mídia é enviada como URLs.
- O payload do Webhook não distingue DMs de salas; defina `apiUser` + `apiPassword` para habilitar buscas de tipo de sala (caso contrário, DMs são tratadas como salas).

## Controle de acesso (DMs)

- Padrão: `channels.nextcloud-talk.dmPolicy = "pairing"`. Remetentes desconhecidos recebem um código de pareamento.
- Aprovar via:
  - `opencraft pairing list nextcloud-talk`
  - `opencraft pairing approve nextcloud-talk <CODE>`
- DMs públicas: `channels.nextcloud-talk.dmPolicy="open"` mais `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` corresponde apenas a IDs de usuário do Nextcloud; nomes de exibição são ignorados.

## Salas (grupos)

- Padrão: `channels.nextcloud-talk.groupPolicy = "allowlist"` (com exigência de menção).
- Adicione salas à allowlist com `channels.nextcloud-talk.rooms`:

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

| Funcionalidade    | Status        |
| ----------------- | ------------- |
| Mensagens diretas | Suportado     |
| Salas             | Suportado     |
| Threads           | Não suportado |
| Mídia             | Apenas URL    |
| Reações           | Suportado     |
| Comandos nativos  | Não suportado |

## Referência de configuração (Nextcloud Talk)

Configuração completa: [Configuration](/gateway/configuration)

Opções do provedor:

- `channels.nextcloud-talk.enabled`: habilitar/desabilitar inicialização do canal.
- `channels.nextcloud-talk.baseUrl`: URL da instância Nextcloud.
- `channels.nextcloud-talk.botSecret`: segredo compartilhado do Bot.
- `channels.nextcloud-talk.botSecretFile`: caminho do arquivo de segredo. Symlinks são rejeitados.
- `channels.nextcloud-talk.apiUser`: usuário API para buscas de sala (detecção de DM).
- `channels.nextcloud-talk.apiPassword`: senha API/app para buscas de sala.
- `channels.nextcloud-talk.apiPasswordFile`: caminho do arquivo de senha API.
- `channels.nextcloud-talk.webhookPort`: porta do listener de Webhook (padrão: 8788).
- `channels.nextcloud-talk.webhookHost`: host do Webhook (padrão: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: caminho do Webhook (padrão: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL do Webhook acessível externamente.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: allowlist de DM (IDs de usuário). `open` requer `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: allowlist de grupo (IDs de usuário).
- `channels.nextcloud-talk.rooms`: configurações por sala e allowlist.
- `channels.nextcloud-talk.historyLimit`: limite de histórico de grupo (0 desabilita).
- `channels.nextcloud-talk.dmHistoryLimit`: limite de histórico de DM (0 desabilita).
- `channels.nextcloud-talk.dms`: sobrescritas por DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: tamanho do bloco de texto de saída (caracteres).
- `channels.nextcloud-talk.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- `channels.nextcloud-talk.blockStreaming`: desabilitar streaming de blocos para este canal.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ajuste de coalescência de streaming de blocos.
- `channels.nextcloud-talk.mediaMaxMb`: limite de mídia de entrada (MB).
