---
summary: "Status de suporte do Bot Zalo, capacidades e configuração"
read_when:
  - Working on Zalo features or webhooks
title: "Zalo"
---

# Zalo (Bot API)

Status: experimental. DMs são suportadas. A seção [Capacidades](#capacidades) abaixo reflete o comportamento atual de Bots do Marketplace.

## Plugin necessário

Zalo é distribuído como um plugin e não está incluso na instalação principal.

- Instalar via CLI: `opencraft plugins install @opencraft/zalo`
- Ou selecione **Zalo** durante a configuração e confirme o prompt de instalação
- Detalhes: [Plugins](/tools/plugin)

## Configuração rápida (iniciante)

1. Instale o plugin Zalo:
   - A partir de um checkout do código-fonte: `opencraft plugins install ./extensions/zalo`
   - Do npm (se publicado): `opencraft plugins install @opencraft/zalo`
   - Ou escolha **Zalo** na configuração e confirme o prompt de instalação
2. Defina o Token:
   - Env: `ZALO_BOT_TOKEN=...`
   - Ou config: `channels.zalo.accounts.default.botToken: "..."`.
3. Reinicie o Gateway (ou finalize a configuração).
4. O acesso de DM é por pareamento por padrão; aprove o código de pareamento no primeiro contato.

Configuração mínima:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## O que é

Zalo é um aplicativo de mensagens focado no Vietnã; sua Bot API permite que o Gateway execute um Bot para conversas 1:1.
É uma boa opção para suporte ou notificações onde você quer roteamento determinístico de volta ao Zalo.

Esta página reflete o comportamento atual do OpenCraft para **Bots do Zalo Bot Creator / Marketplace**.
**Bots de Conta Oficial Zalo (OA)** são uma superfície de produto Zalo diferente e podem se comportar de forma diferente.

- Um canal da Zalo Bot API gerenciado pelo Gateway.
- Roteamento determinístico: respostas retornam ao Zalo; o modelo nunca escolhe canais.
- DMs compartilham a sessão principal do agente.
- A seção [Capacidades](#capacidades) abaixo mostra o suporte atual para Bots do Marketplace.

## Configuração (caminho rápido)

### 1) Criar um bot Token (Zalo Bot Platform)

1. Acesse [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) e faça login.
2. Crie um novo Bot e configure suas definições.
3. Copie o bot Token completo (tipicamente `numeric_id:secret`). Para Bots do Marketplace, o Token de runtime utilizável pode aparecer na mensagem de boas-vindas do Bot após a criação.

### 2) Configurar o Token (env ou config)

Exemplo:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Se você mais tarde migrar para uma superfície de Bot Zalo onde grupos estão disponíveis, você pode adicionar configurações específicas de grupo como `groupPolicy` e `groupAllowFrom` explicitamente. Para o comportamento atual de Bots do Marketplace, veja [Capacidades](#capacidades).

Opção env: `ZALO_BOT_TOKEN=...` (funciona apenas para a conta padrão).

Suporte a múltiplas contas: use `channels.zalo.accounts` com tokens por conta e `name` opcional.

3. Reinicie o Gateway. O Zalo inicia quando um Token é resolvido (env ou config).
4. O acesso de DM é por pareamento por padrão. Aprove o código quando o Bot for contatado pela primeira vez.

## Como funciona (comportamento)

- Mensagens de entrada são normalizadas no envelope de canal compartilhado com placeholders de mídia.
- Respostas sempre roteiam de volta para o mesmo chat Zalo.
- Long Polling por padrão; modo Webhook disponível com `channels.zalo.webhookUrl`.

## Limites

- Texto de saída é dividido em blocos de 2000 caracteres (limite da API Zalo).
- Downloads/uploads de mídia são limitados por `channels.zalo.mediaMaxMb` (padrão 5).
- Streaming é bloqueado por padrão devido ao limite de 2000 caracteres tornar o streaming menos útil.

## Controle de acesso (DMs)

### Acesso de DM

- Padrão: `channels.zalo.dmPolicy = "pairing"`. Remetentes desconhecidos recebem um código de pareamento; mensagens são ignoradas até a aprovação (códigos expiram após 1 hora).
- Aprove via:
  - `opencraft pairing list zalo`
  - `opencraft pairing approve zalo <CODE>`
- Pareamento é a troca de Token padrão. Detalhes: [Pareamento](/channels/pairing)
- `channels.zalo.allowFrom` aceita IDs numéricos de usuário (busca por nome de usuário não disponível).

## Controle de acesso (Grupos)

Para **Bots do Zalo Bot Creator / Marketplace**, o suporte a grupos não estava disponível na prática porque o Bot não podia ser adicionado a um grupo.

Isso significa que as chaves de configuração relacionadas a grupos abaixo existem no esquema, mas não eram utilizáveis para Bots do Marketplace:

- `channels.zalo.groupPolicy` controla o tratamento de entrada de grupos: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` restringe quais IDs de remetente podem acionar o Bot em grupos.
- Se `groupAllowFrom` não estiver definido, o Zalo usa `allowFrom` como fallback para verificações de remetente.
- Nota de runtime: se `channels.zalo` estiver completamente ausente, o runtime ainda usa `groupPolicy="allowlist"` como fallback por segurança.

Os valores de política de grupo (quando acesso a grupos está disponível na sua superfície de Bot) são:

- `groupPolicy: "disabled"` — bloqueia todas as mensagens de grupo.
- `groupPolicy: "open"` — permite qualquer membro do grupo (restrito por menção).
- `groupPolicy: "allowlist"` — padrão fail-closed; apenas remetentes permitidos são aceitos.

Se você está usando uma superfície de produto Bot Zalo diferente e verificou que o comportamento de grupos funciona, documente isso separadamente em vez de assumir que corresponde ao fluxo de Bots do Marketplace.

## Long Polling vs Webhook

- Padrão: Long Polling (não requer URL pública).
- Modo Webhook: defina `channels.zalo.webhookUrl` e `channels.zalo.webhookSecret`.
  - O Webhook secret deve ter 8-256 caracteres.
  - A URL do Webhook deve usar HTTPS.
  - O Zalo envia eventos com o cabeçalho `X-Bot-Api-Secret-Token` para verificação.
  - O HTTP do Gateway trata requisições de Webhook em `channels.zalo.webhookPath` (padrão é o caminho da URL do Webhook).
  - Requisições devem usar `Content-Type: application/json` (ou tipos de mídia `+json`).
  - Eventos duplicados (`event_name + message_id`) são ignorados por uma janela curta de replay.
  - Tráfego em rajada é limitado por taxa por caminho/origem e pode retornar HTTP 429.

**Nota:** getUpdates (polling) e Webhook são mutuamente exclusivos conforme a documentação da API Zalo.

## Tipos de mensagem suportados

Para um resumo rápido de suporte, veja [Capacidades](#capacidades). As notas abaixo adicionam detalhes onde o comportamento precisa de contexto extra.

- **Mensagens de texto**: Suporte completo com divisão em blocos de 2000 caracteres.
- **URLs simples em texto**: Se comportam como entrada de texto normal.
- **Previews de link / cards de link rico**: Veja o status de Bots do Marketplace em [Capacidades](#capacidades); eles não disparavam uma resposta de forma confiável.
- **Mensagens de imagem**: Veja o status de Bots do Marketplace em [Capacidades](#capacidades); o tratamento de imagens de entrada era inconsistente (indicador de digitação sem resposta final).
- **Stickers**: Veja o status de Bots do Marketplace em [Capacidades](#capacidades).
- **Notas de voz / arquivos de áudio / vídeo / anexos genéricos**: Veja o status de Bots do Marketplace em [Capacidades](#capacidades).
- **Tipos não suportados**: Registrados em log (por exemplo, mensagens de usuários protegidos).

## Capacidades

Esta tabela resume o comportamento atual de **Bots do Zalo Bot Creator / Marketplace** no OpenCraft.

| Recurso                      | Status                                             |
| ---------------------------- | -------------------------------------------------- |
| Mensagens diretas            | ✅ Suportado                                       |
| Grupos                       | ❌ Não disponível para Bots do Marketplace         |
| Mídia (imagens de entrada)   | ⚠️ Limitado / verifique no seu ambiente            |
| Mídia (imagens de saída)     | ⚠️ Não retestado para Bots do Marketplace          |
| URLs simples em texto        | ✅ Suportado                                       |
| Previews de link             | ⚠️ Inconsistente para Bots do Marketplace          |
| Reações                      | ❌ Não suportado                                   |
| Stickers                     | ⚠️ Sem resposta do agente para Bots do Marketplace |
| Notas de voz / áudio / vídeo | ⚠️ Sem resposta do agente para Bots do Marketplace |
| Anexos de arquivo            | ⚠️ Sem resposta do agente para Bots do Marketplace |
| Threads                      | ❌ Não suportado                                   |
| Enquetes                     | ❌ Não suportado                                   |
| Comandos nativos             | ❌ Não suportado                                   |
| Streaming                    | ⚠️ Bloqueado (limite de 2000 caracteres)           |

## Alvos de entrega (CLI/Cron)

- Use um ID de chat como alvo.
- Exemplo: `opencraft message send --channel zalo --target 123456789 --message "hi"`.

## Solução de problemas

**Bot não responde:**

- Verifique se o Token é válido: `opencraft channels status --probe`
- Verifique se o remetente está aprovado (pareamento ou allowFrom)
- Verifique os logs do Gateway: `opencraft logs --follow`

**Webhook não recebe eventos:**

- Certifique-se de que a URL do Webhook usa HTTPS
- Verifique se o secret Token tem 8-256 caracteres
- Confirme que o endpoint HTTP do Gateway está acessível no caminho configurado
- Verifique se o getUpdates (polling) não está rodando (eles são mutuamente exclusivos)

## Referência de configuração (Zalo)

Configuração completa: [Configuração](/gateway/configuration)

As chaves de nível superior planas (`channels.zalo.botToken`, `channels.zalo.dmPolicy` e similares) são uma abreviação legada de conta única. Prefira `channels.zalo.accounts.<id>.*` para novas configurações. Ambas as formas ainda estão documentadas aqui porque existem no esquema.

Opções do provedor:

- `channels.zalo.enabled`: habilitar/desabilitar inicialização do canal.
- `channels.zalo.botToken`: bot Token da Zalo Bot Platform.
- `channels.zalo.tokenFile`: ler Token de um caminho de arquivo regular. Symlinks são rejeitados.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.zalo.allowFrom`: allowlist de DM (IDs de usuário). `open` requer `"*"`. O assistente pedirá IDs numéricos.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist). Presente na config; veja [Capacidades](#capacidades) e [Controle de acesso (Grupos)](#controle-de-acesso-grupos) para o comportamento atual de Bots do Marketplace.
- `channels.zalo.groupAllowFrom`: allowlist de remetentes de grupo (IDs de usuário). Usa `allowFrom` como fallback quando não definido.
- `channels.zalo.mediaMaxMb`: limite de mídia de entrada/saída (MB, padrão 5).
- `channels.zalo.webhookUrl`: habilitar modo Webhook (HTTPS obrigatório).
- `channels.zalo.webhookSecret`: Webhook secret (8-256 caracteres).
- `channels.zalo.webhookPath`: caminho do Webhook no servidor HTTP do Gateway.
- `channels.zalo.proxy`: URL de proxy para requisições de API.

Opções de múltiplas contas:

- `channels.zalo.accounts.<id>.botToken`: Token por conta.
- `channels.zalo.accounts.<id>.tokenFile`: arquivo de Token regular por conta. Symlinks são rejeitados.
- `channels.zalo.accounts.<id>.name`: nome de exibição.
- `channels.zalo.accounts.<id>.enabled`: habilitar/desabilitar conta.
- `channels.zalo.accounts.<id>.dmPolicy`: política de DM por conta.
- `channels.zalo.accounts.<id>.allowFrom`: allowlist por conta.
- `channels.zalo.accounts.<id>.groupPolicy`: política de grupo por conta. Presente na config; veja [Capacidades](#capacidades) e [Controle de acesso (Grupos)](#controle-de-acesso-grupos) para o comportamento atual de Bots do Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist de remetentes de grupo por conta.
- `channels.zalo.accounts.<id>.webhookUrl`: URL de Webhook por conta.
- `channels.zalo.accounts.<id>.webhookSecret`: Webhook secret por conta.
- `channels.zalo.accounts.<id>.webhookPath`: caminho do Webhook por conta.
- `channels.zalo.accounts.<id>.proxy`: URL de proxy por conta.
