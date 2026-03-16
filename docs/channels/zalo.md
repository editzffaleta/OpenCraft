---
summary: "Status de suporte, capacidades e configuração do bot Zalo"
read_when:
  - Trabalhando em funcionalidades ou webhooks do Zalo
title: "Zalo"
---

# Zalo (Bot API)

Status: experimental. DMs são suportados; o tratamento de grupos está disponível com controles explícitos de política de grupo.

## Plugin necessário

O Zalo é distribuído como plugin e não está incluído na instalação principal.

- Instale via CLI: `opencraft plugins install @openclaw/zalo`
- Ou selecione **Zalo** durante o onboarding e confirme o prompt de instalação
- Detalhes: [Plugins](/tools/plugin)

## Configuração rápida (iniciantes)

1. Instale o plugin Zalo:
   - A partir de um checkout de fonte: `opencraft plugins install ./extensions/zalo`
   - Via npm (se publicado): `opencraft plugins install @openclaw/zalo`
   - Ou escolha **Zalo** no onboarding e confirme o prompt de instalação
2. Defina o token:
   - Env: `ZALO_BOT_TOKEN=...`
   - Ou config: `channels.zalo.botToken: "..."`.
3. Reinicie o gateway (ou conclua o onboarding).
4. O acesso por DM é pareamento por padrão; aprove o código de pareamento no primeiro contato.

Config mínima:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      botToken: "12345689:abc-xyz",
      dmPolicy: "pairing",
    },
  },
}
```

## O que é

O Zalo é um aplicativo de mensagens focado no Vietnã; sua Bot API permite que o Gateway execute um bot para conversas 1:1.
É uma boa opção para suporte ou notificações onde você quer roteamento determinístico de volta ao Zalo.

- Um canal Zalo Bot API de propriedade do Gateway.
- Roteamento determinístico: respostas voltam ao Zalo; o modelo nunca escolhe canais.
- DMs compartilham a sessão principal do agente.
- Grupos são suportados com controles de política (`groupPolicy` + `groupAllowFrom`) e têm comportamento fail-closed por padrão (allowlist).

## Configuração (caminho rápido)

### 1) Criar um token de bot (Zalo Bot Platform)

1. Acesse [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) e faça login.
2. Crie um novo bot e configure suas definições.
3. Copie o token do bot (formato: `12345689:abc-xyz`).

### 2) Configurar o token (env ou config)

Exemplo:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      botToken: "12345689:abc-xyz",
      dmPolicy: "pairing",
    },
  },
}
```

Opção de env: `ZALO_BOT_TOKEN=...` (funciona apenas para a conta padrão).

Suporte a múltiplas contas: use `channels.zalo.accounts` com tokens por conta e `name` opcional.

3. Reinicie o gateway. O Zalo inicia quando um token é resolvido (env ou config).
4. O acesso por DM é pareamento por padrão. Aprove o código quando o bot for contatado pela primeira vez.

## Como funciona (comportamento)

- Mensagens de entrada são normalizadas no envelope de canal compartilhado com placeholders de mídia.
- Respostas sempre roteiam de volta para o mesmo chat Zalo.
- Long-polling por padrão; modo webhook disponível com `channels.zalo.webhookUrl`.

## Limites

- Texto de saída é dividido em chunks de 2000 caracteres (limite da API Zalo).
- Downloads/uploads de mídia são limitados por `channels.zalo.mediaMaxMb` (padrão 5).
- Streaming é bloqueado por padrão devido ao limite de 2000 caracteres tornar o streaming menos útil.

## Controle de acesso (DMs)

### Acesso por DM

- Padrão: `channels.zalo.dmPolicy = "pairing"`. Remetentes desconhecidos recebem um código de pareamento; as mensagens são ignoradas até aprovação (os códigos expiram após 1 hora).
- Aprove via:
  - `opencraft pairing list zalo`
  - `opencraft pairing approve zalo <CÓDIGO>`
- O pareamento é a troca de token padrão. Detalhes: [Pareamento](/channels/pairing)
- `channels.zalo.allowFrom` aceita IDs de usuário numéricos (nenhum lookup de username disponível).

## Controle de acesso (Grupos)

- `channels.zalo.groupPolicy` controla o tratamento de entrada de grupos: `open | allowlist | disabled`.
- O comportamento padrão é fail-closed: `allowlist`.
- `channels.zalo.groupAllowFrom` restringe quais IDs de remetente podem acionar o bot em grupos.
- Se `groupAllowFrom` não estiver definido, o Zalo usa `allowFrom` como fallback para verificações de remetente.
- `groupPolicy: "disabled"` bloqueia todas as mensagens de grupo.
- `groupPolicy: "open"` permite qualquer membro do grupo (com controle por menção).
- Nota de runtime: se `channels.zalo` estiver completamente ausente, o runtime ainda usa `groupPolicy="allowlist"` como fallback por segurança.

## Long-polling vs webhook

- Padrão: long-polling (nenhuma URL pública necessária).
- Modo webhook: defina `channels.zalo.webhookUrl` e `channels.zalo.webhookSecret`.
  - O segredo do webhook deve ter 8-256 caracteres.
  - A URL do webhook deve usar HTTPS.
  - O Zalo envia eventos com o header `X-Bot-Api-Secret-Token` para verificação.
  - O HTTP do Gateway trata requisições de webhook em `channels.zalo.webhookPath` (padrão é o caminho da URL do webhook).
  - As requisições devem usar `Content-Type: application/json` (ou tipos de mídia `+json`).
  - Eventos duplicados (`event_name + message_id`) são ignorados por uma janela curta de replay.
  - Tráfego em burst é limitado por taxa por caminho/fonte e pode retornar HTTP 429.

**Nota:** getUpdates (polling) e webhook são mutuamente exclusivos conforme os docs da API Zalo.

## Tipos de mensagem suportados

- **Mensagens de texto**: Suporte completo com chunking de 2000 caracteres.
- **Mensagens de imagem**: Baixar e processar imagens de entrada; enviar imagens via `sendPhoto`.
- **Stickers**: Registrados mas não totalmente processados (sem resposta do agente).
- **Tipos não suportados**: Registrados (ex.: mensagens de usuários protegidos).

## Capacidades

| Funcionalidade    | Status                                                            |
| ----------------- | ----------------------------------------------------------------- |
| Mensagens diretas | ✅ Suportado                                                      |
| Grupos            | ⚠️ Suportado com controles de política (allowlist por padrão)    |
| Mídia (imagens)   | ✅ Suportado                                                      |
| Reações           | ❌ Não suportado                                                  |
| Threads           | ❌ Não suportado                                                  |
| Enquetes          | ❌ Não suportado                                                  |
| Comandos nativos  | ❌ Não suportado                                                  |
| Streaming         | ⚠️ Bloqueado (limite de 2000 caracteres)                         |

## Alvos de entrega (CLI/cron)

- Use um chat id como alvo.
- Exemplo: `opencraft message send --channel zalo --target 123456789 --message "oi"`.

## Solução de problemas

**Bot não responde:**

- Verifique se o token é válido: `opencraft channels status --probe`
- Verifique se o remetente está aprovado (pareamento ou allowFrom)
- Verifique os logs do gateway: `opencraft logs --follow`

**Webhook não recebe eventos:**

- Certifique-se de que a URL do webhook usa HTTPS
- Verifique se o token secreto tem 8-256 caracteres
- Confirme que o endpoint HTTP do gateway é acessível no caminho configurado
- Verifique se o polling getUpdates não está em execução (são mutuamente exclusivos)

## Referência de configuração (Zalo)

Configuração completa: [Configuração](/gateway/configuration)

Opções do provedor:

- `channels.zalo.enabled`: habilitar/desabilitar inicialização do canal.
- `channels.zalo.botToken`: token do bot da Zalo Bot Platform.
- `channels.zalo.tokenFile`: ler token de um caminho de arquivo regular. Symlinks são rejeitados.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.zalo.allowFrom`: allowlist de DM (IDs de usuário). `open` requer `"*"`. O assistente solicitará IDs numéricos.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist).
- `channels.zalo.groupAllowFrom`: allowlist de remetente de grupo (IDs de usuário). Usa `allowFrom` como fallback quando não definido.
- `channels.zalo.mediaMaxMb`: limite de mídia de entrada/saída (MB, padrão 5).
- `channels.zalo.webhookUrl`: habilitar modo webhook (HTTPS obrigatório).
- `channels.zalo.webhookSecret`: segredo do webhook (8-256 caracteres).
- `channels.zalo.webhookPath`: caminho do webhook no servidor HTTP do gateway.
- `channels.zalo.proxy`: URL de proxy para requisições de API.

Opções multi-conta:

- `channels.zalo.accounts.<id>.botToken`: token por conta.
- `channels.zalo.accounts.<id>.tokenFile`: arquivo de token regular por conta. Symlinks são rejeitados.
- `channels.zalo.accounts.<id>.name`: nome de exibição.
- `channels.zalo.accounts.<id>.enabled`: habilitar/desabilitar conta.
- `channels.zalo.accounts.<id>.dmPolicy`: política de DM por conta.
- `channels.zalo.accounts.<id>.allowFrom`: allowlist por conta.
- `channels.zalo.accounts.<id>.groupPolicy`: política de grupo por conta.
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist de remetente de grupo por conta.
- `channels.zalo.accounts.<id>.webhookUrl`: URL de webhook por conta.
- `channels.zalo.accounts.<id>.webhookSecret`: segredo de webhook por conta.
- `channels.zalo.accounts.<id>.webhookPath`: caminho de webhook por conta.
- `channels.zalo.accounts.<id>.proxy`: URL de proxy por conta.
