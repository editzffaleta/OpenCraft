---
summary: "Status de suporte ao bot Telegram, capacidades e configuração"
read_when:
  - Trabalhando em recursos do Telegram ou webhooks
title: "Telegram"
---

# Telegram (Bot API)

Status: pronto para produção para DMs + grupos de bot via grammY. Long polling é o modo padrão; modo webhook é opcional.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/channels/pairing">
    A política de DM padrão do Telegram é pareamento.
  </Card>
  <Card title="Solução de problemas de canal" icon="wrench" href="/channels/troubleshooting">
    Diagnósticos e playbooks de reparo entre canais.
  </Card>
  <Card title="Configuração do Gateway" icon="settings" href="/gateway/configuration">
    Padrões e exemplos completos de configuração de canal.
  </Card>
</CardGroup>

## Configuração rápida

<Steps>
  <Step title="Criar o token do bot no BotFather">
    Abra o Telegram e converse com **@BotFather** (confirme que o handle é exatamente `@BotFather`).

    Execute `/newbot`, siga as instruções e salve o token.

  </Step>

  <Step title="Configurar token e política de DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Fallback de env: `TELEGRAM_BOT_TOKEN=...` (apenas conta padrão).
    O Telegram **não** usa `opencraft channels login telegram`; configure o token em config/env e inicie o gateway.

  </Step>

  <Step title="Iniciar gateway e aprovar primeiro DM">

```bash
opencraft gateway
opencraft pairing list telegram
opencraft pairing approve telegram <CÓDIGO>
```

    Códigos de pareamento expiram após 1 hora.

  </Step>

  <Step title="Adicionar o bot a um grupo">
    Adicione o bot ao seu grupo e depois defina `channels.telegram.groups` e `groupPolicy` para corresponder ao seu modelo de acesso.
  </Step>
</Steps>

<Note>
A ordem de resolução do token é ciente de contas. Na prática, os valores de config vencem sobre o fallback de env, e `TELEGRAM_BOT_TOKEN` só se aplica à conta padrão.
</Note>

## Configurações no lado do Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidade e visibilidade de grupo">
    Os bots do Telegram são padronizados para **Modo de Privacidade**, que limita quais mensagens de grupo eles recebem.

    Se o bot deve ver todas as mensagens do grupo, ou:

    - desabilite o modo de privacidade via `/setprivacy`, ou
    - torne o bot um administrador do grupo.

    Ao alternar o modo de privacidade, remova + readicione o bot em cada grupo para que o Telegram aplique a mudança.

  </Accordion>

  <Accordion title="Permissões de grupo">
    O status de administrador é controlado nas configurações do grupo do Telegram.

    Bots administradores recebem todas as mensagens do grupo, o que é útil para comportamento de grupo always-on.

  </Accordion>

  <Accordion title="Opções úteis do BotFather">

    - `/setjoingroups` para permitir/negar adições a grupos
    - `/setprivacy` para comportamento de visibilidade de grupo

  </Accordion>
</AccordionGroup>

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de DM">
    `channels.telegram.dmPolicy` controla o acesso a mensagens diretas:

    - `pairing` (padrão)
    - `allowlist` (requer pelo menos um ID de remetente em `allowFrom`)
    - `open` (requer que `allowFrom` inclua `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` aceita IDs numéricos de usuário do Telegram. Prefixos `telegram:` / `tg:` são aceitos e normalizados.
    `dmPolicy: "allowlist"` com `allowFrom` vazio bloqueia todos os DMs e é rejeitado pela validação de config.
    O wizard de onboarding aceita entrada `@username` e resolve para IDs numéricos.
    Se você atualizou e sua config contém entradas `@username` na lista de permissão, execute `opencraft doctor --fix` para resolvê-las (melhor esforço; requer um token de bot Telegram).
    Se você dependia anteriormente de arquivos de lista de permissão do pairing-store, `opencraft doctor --fix` pode recuperar entradas em `channels.telegram.allowFrom` em fluxos de lista de permissão (por exemplo quando `dmPolicy: "allowlist"` ainda não tem IDs explícitos).

    Para bots de um único proprietário, prefira `dmPolicy: "allowlist"` com `allowFrom` numérico explícito para manter a política de acesso durável na config (em vez de depender de aprovações de pareamento anteriores).

    ### Encontrando seu ID de usuário Telegram

    Mais seguro (sem bot de terceiros):

    1. Envie DM para seu bot.
    2. Execute `opencraft logs --follow`.
    3. Leia `from.id`.

    Método oficial da Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Método de terceiros (menos privado): `@userinfobot` ou `@getidsbot`.

  </Tab>

  <Tab title="Política de grupo e listas de permissão">
    Dois controles se aplicam juntos:

    1. **Quais grupos são permitidos** (`channels.telegram.groups`)
       - sem config `groups`:
         - com `groupPolicy: "open"`: qualquer grupo pode passar nas verificações de ID de grupo
         - com `groupPolicy: "allowlist"` (padrão): grupos são bloqueados até você adicionar entradas `groups` (ou `"*"`)
       - `groups` configurado: atua como lista de permissão (IDs explícitos ou `"*"`)

    2. **Quais remetentes são permitidos em grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (padrão)
       - `disabled`

    `groupAllowFrom` é usado para filtragem de remetentes em grupo. Se não definido, o Telegram recorre a `allowFrom`.
    As entradas de `groupAllowFrom` devem ser IDs numéricos de usuário do Telegram (prefixos `telegram:` / `tg:` são normalizados).
    Não coloque IDs de chat de grupo ou supergrupo do Telegram em `groupAllowFrom`. IDs de chat negativos pertencem a `channels.telegram.groups`.
    Entradas não numéricas são ignoradas para autorização de remetente.
    Limite de segurança (`2026.2.25+`): a autenticação de remetente em grupo **não** herda aprovações do pairing-store de DM.
    O pareamento fica apenas para DM. Para grupos, defina `groupAllowFrom` ou por grupo/tópico `allowFrom`.
    Nota de runtime: se `channels.telegram` estiver completamente ausente, o runtime padrão para fail-closed `groupPolicy="allowlist"`, a menos que `channels.defaults.groupPolicy` esteja explicitamente definido.

    Exemplo: permitir qualquer membro em um grupo específico:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Exemplo: permitir apenas usuários específicos dentro de um grupo específico:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Erro comum: `groupAllowFrom` não é uma lista de permissão de grupos do Telegram.

      - Coloque IDs de chat de grupo ou supergrupo negativos do Telegram como `-1001234567890` em `channels.telegram.groups`.
      - Coloque IDs de usuário do Telegram como `8734062810` em `groupAllowFrom` quando quiser limitar quais pessoas dentro de um grupo permitido podem acionar o bot.
      - Use `groupAllowFrom: ["*"]` apenas quando quiser que qualquer membro de um grupo permitido possa falar com o bot.
    </Warning>

  </Tab>

  <Tab title="Comportamento de menção">
    Respostas em grupo requerem menção por padrão.

    A menção pode vir de:

    - menção nativa `@botusername`, ou
    - padrões de menção em:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Comandos de alternância em nível de sessão:

    - `/activation always`
    - `/activation mention`

    Esses atualizam apenas o estado da sessão. Use config para persistência.

    Exemplo de config persistente:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Obtendo o ID do chat do grupo:

    - encaminhe uma mensagem do grupo para `@userinfobot` / `@getidsbot`
    - ou leia `chat.id` de `opencraft logs --follow`
    - ou inspecione `getUpdates` da Bot API

  </Tab>
</Tabs>

## Comportamento em runtime

- O Telegram é de propriedade do processo do gateway.
- O roteamento é determinístico: o inbound do Telegram responde de volta ao Telegram (o modelo não escolhe canais).
- As mensagens de entrada são normalizadas no envelope de canal compartilhado com metadados de resposta e placeholders de mídia.
- Sessões de grupo são isoladas por ID de grupo. Tópicos de fórum adicionam `:topic:<threadId>` para manter os tópicos isolados.
- Mensagens de DM podem carregar `message_thread_id`; o OpenCraft as roteia com chaves de sessão cientes de thread e preserva o ID de thread para respostas.
- Long polling usa o runner do grammY com sequenciamento por chat/por thread. A concorrência geral do sink do runner usa `agents.defaults.maxConcurrent`.
- A Bot API do Telegram não tem suporte a confirmação de leitura (`sendReadReceipts` não se aplica).

## Referência de recursos

<AccordionGroup>
  <Accordion title="Prévia de streaming ao vivo (edições de mensagem)">
    O OpenCraft pode transmitir respostas parciais em tempo real:

    - chats diretos: mensagem de prévia + `editMessageText`
    - grupos/tópicos: mensagem de prévia + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` é `off | partial | block | progress` (padrão: `partial`)
    - `progress` mapeia para `partial` no Telegram (compat com nomenclatura entre canais)
    - valores legados `channels.telegram.streamMode` e booleanos `streaming` são mapeados automaticamente

    Para respostas apenas de texto:

    - DM: o OpenCraft mantém a mesma mensagem de prévia e realiza uma edição final no lugar (sem segunda mensagem)
    - grupo/tópico: o OpenCraft mantém a mesma mensagem de prévia e realiza uma edição final no lugar (sem segunda mensagem)

    Para respostas complexas (por exemplo payloads de mídia), o OpenCraft recorre à entrega final normal e então limpa a mensagem de prévia.

    O streaming de prévia é separado do streaming de bloco. Quando o streaming de bloco é explicitamente habilitado para o Telegram, o OpenCraft pula o stream de prévia para evitar streaming duplo.

    Se o transporte de rascunho nativo estiver indisponível/rejeitado, o OpenCraft retorna automaticamente para `sendMessage` + `editMessageText`.

    Stream de raciocínio exclusivo do Telegram:

    - `/reasoning stream` envia o raciocínio para a prévia ao vivo enquanto gera
    - a resposta final é enviada sem o texto de raciocínio

  </Accordion>

  <Accordion title="Formatação e fallback HTML">
    O texto de saída usa o `parse_mode: "HTML"` do Telegram.

    - Texto estilo Markdown é renderizado para HTML seguro do Telegram.
    - HTML bruto do modelo é escapado para reduzir falhas de análise do Telegram.
    - Se o Telegram rejeitar o HTML analisado, o OpenCraft tenta novamente como texto simples.

    As prévias de links são habilitadas por padrão e podem ser desabilitadas com `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandos nativos e comandos personalizados">
    O registro do menu de comandos do Telegram é tratado na inicialização com `setMyCommands`.

    Padrões de comandos nativos:

    - `commands.native: "auto"` habilita comandos nativos para o Telegram

    Adicionar entradas de menu de comando personalizadas:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Backup Git" },
        { command: "generate", description: "Criar uma imagem" },
      ],
    },
  },
}
```

    Regras:

    - nomes são normalizados (remover `/` inicial, minúsculas)
    - padrão válido: `a-z`, `0-9`, `_`, comprimento `1..32`
    - comandos personalizados não podem substituir comandos nativos
    - conflitos/duplicatas são ignorados e registrados em log

    Notas:

    - comandos personalizados são apenas entradas de menu; eles não implementam comportamento automaticamente
    - comandos de plugin/skill ainda podem funcionar quando digitados mesmo que não apareçam no menu do Telegram

    Se os comandos nativos forem desabilitados, os embutidos são removidos. Comandos personalizados/de plugin ainda podem se registrar se configurados.

    Falhas comuns de configuração:

    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu do Telegram ainda transbordou após o corte; reduza comandos de plugin/skill/personalizados ou desabilite `channels.telegram.commands.native`.
    - `setMyCommands failed` com erros de rede/fetch geralmente significa que DNS/HTTPS de saída para `api.telegram.org` está bloqueado.

    ### Comandos de pareamento de dispositivo (plugin `device-pair`)

    Quando o plugin `device-pair` está instalado:

    1. `/pair` gera código de configuração
    2. cole o código no app iOS
    3. `/pair approve` aprova a solicitação pendente mais recente

    Mais detalhes: [Pareamento](/channels/pairing#par-via-telegram-recomendado-para-ios).

  </Accordion>

  <Accordion title="Botões inline">
    Configure o escopo do teclado inline:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Substituição por conta:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Escopos:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (padrão)

    O legado `capabilities: ["inlineButtons"]` mapeia para `inlineButtons: "all"`.

    Exemplo de ação de mensagem:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Escolha uma opção:",
  buttons: [
    [
      { text: "Sim", callback_data: "yes" },
      { text: "Não", callback_data: "no" },
    ],
    [{ text: "Cancelar", callback_data: "cancel" }],
  ],
}
```

    Cliques de callback são passados ao agente como texto:
    `callback_data: <valor>`

  </Accordion>

  <Accordion title="Ações de mensagem do Telegram para agentes e automação">
    As ações de ferramentas do Telegram incluem:

    - `sendMessage` (`to`, `content`, opcional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opcional `iconColor`, `iconCustomEmojiId`)

    As ações de mensagem de canal expõem aliases ergonômicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de acesso:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (padrão: desabilitado)

    Nota: `edit` e `topic-create` são habilitados por padrão atualmente e não têm controles separados `channels.telegram.actions.*`.
    Envios de runtime usam o snapshot de config/segredos ativo (inicialização/recarga), portanto os caminhos de ação não realizam re-resolução de SecretRef ad-hoc por envio.

    Semântica de remoção de reação: [/tools/reactions](/tools/reactions)

  </Accordion>

  <Accordion title="Tags de threading de resposta">
    O Telegram suporta tags explícitas de threading de resposta na saída gerada:

    - `[[reply_to_current]]` responde à mensagem que acionou
    - `[[reply_to:<id>]]` responde a um ID de mensagem Telegram específico

    `channels.telegram.replyToMode` controla o tratamento:

    - `off` (padrão)
    - `first`
    - `all`

    Nota: `off` desabilita o threading implícito de resposta. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.

  </Accordion>

  <Accordion title="Tópicos de fórum e comportamento de thread">
    Supergrupos de fórum:

    - chaves de sessão de tópico adicionam `:topic:<threadId>`
    - respostas e digitação visam o thread do tópico
    - caminho de config do tópico:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial do tópico geral (`threadId=1`):

    - envios de mensagem omitem `message_thread_id` (o Telegram rejeita `sendMessage(...thread_id=1)`)
    - ações de digitação ainda incluem `message_thread_id`

    Herança de tópico: entradas de tópico herdam configurações do grupo, a menos que sejam substituídas (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` é exclusivo do tópico e não herda dos padrões do grupo.

    **Roteamento de agente por tópico**: Cada tópico pode rotear para um agente diferente definindo `agentId` na config do tópico. Isso dá a cada tópico seu próprio workspace, memória e sessão isolados. Exemplo:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Tópico geral → agente main
                "3": { agentId: "zu" },        // Tópico dev → agente zu
                "5": { agentId: "coder" }      // Revisão de código → agente coder
              }
            }
          }
        }
      }
    }
    ```

    Cada tópico então tem sua própria chave de sessão: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Binding persistente de tópico ACP**: Tópicos de fórum podem fixar sessões do harness ACP através de bindings ACP tipados de nível superior:

    - `bindings[]` com `type: "acp"` e `match.channel: "telegram"`

    Exemplo:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/opencraft",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Isso está atualmente com escopo para tópicos de fórum em grupos e supergrupos.

    **Spawn ACP vinculado a thread do chat**:

    - `/acp spawn <agente> --thread here|auto` pode vincular o tópico Telegram atual a uma nova sessão ACP.
    - Mensagens subsequentes no tópico são roteadas diretamente para a sessão ACP vinculada (sem necessidade de `/acp steer`).
    - O OpenCraft fixa a mensagem de confirmação de spawn no tópico após um bind bem-sucedido.
    - Requer `channels.telegram.threadBindings.spawnAcpSessions=true`.

    O contexto do template inclui:

    - `MessageThreadId`
    - `IsForum`

    Comportamento de thread de DM:

    - chats privados com `message_thread_id` mantêm o roteamento de DM mas usam chaves de sessão/alvos de resposta cientes de thread.

  </Accordion>

  <Accordion title="Áudio, vídeo e adesivos">
    ### Mensagens de áudio

    O Telegram distingue notas de voz vs arquivos de áudio.

    - padrão: comportamento de arquivo de áudio
    - use a tag `[[audio_as_voice]]` na resposta do agente para forçar envio de nota de voz

    Exemplo de ação de mensagem:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Mensagens de vídeo

    O Telegram distingue arquivos de vídeo vs notas de vídeo.

    Exemplo de ação de mensagem:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Notas de vídeo não suportam legendas; o texto da mensagem fornecido é enviado separadamente.

    ### Adesivos

    Tratamento de adesivos de entrada:

    - WEBP estático: baixado e processado (placeholder `<media:sticker>`)
    - TGS animado: ignorado
    - WEBM de vídeo: ignorado

    Campos de contexto de adesivo:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Arquivo de cache de adesivos:

    - `~/.opencraft/telegram/sticker-cache.json`

    Adesivos são descritos uma vez (quando possível) e armazenados em cache para reduzir chamadas repetidas de visão.

    Habilitar ações de adesivo:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Ação de envio de adesivo:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Pesquisar adesivos em cache:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "gato acenando",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notificações de reação">
    As reações do Telegram chegam como atualizações `message_reaction` (separadas dos payloads de mensagem).

    Quando habilitado, o OpenCraft enfileira eventos de sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (padrão: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`)

    Notas:

    - `own` significa reações de usuário a mensagens enviadas pelo bot apenas (melhor esforço via cache de mensagens enviadas).
    - Eventos de reação ainda respeitam os controles de acesso do Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); remetentes não autorizados são descartados.
    - O Telegram não fornece IDs de thread em atualizações de reação.
      - grupos não-fórum roteiam para a sessão de chat do grupo
      - grupos de fórum roteiam para a sessão de tópico geral do grupo (`:topic:1`), não o tópico de origem exato

    `allowed_updates` para polling/webhook incluem `message_reaction` automaticamente.

  </Accordion>

  <Accordion title="Reações de ack">
    `ackReaction` envia um emoji de confirmação enquanto o OpenCraft está processando uma mensagem de entrada.

    Ordem de resolução:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback de emoji de identidade do agente (`agents.list[].identity.emoji`, caso contrário "👀")

    Notas:

    - O Telegram espera emoji unicode (por exemplo "👀").
    - Use `""` para desabilitar a reação para um canal ou conta.

  </Accordion>

  <Accordion title="Escritas de config de eventos e comandos do Telegram">
    Escritas de config de canal são habilitadas por padrão (`configWrites !== false`).

    Escritas acionadas pelo Telegram incluem:

    - eventos de migração de grupo (`migrate_to_chat_id`) para atualizar `channels.telegram.groups`
    - `/config set` e `/config unset` (requer habilitação de comando)

    Desabilitar:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling vs webhook">
    Padrão: long polling.

    Modo webhook:

    - defina `channels.telegram.webhookUrl`
    - defina `channels.telegram.webhookSecret` (obrigatório quando a URL do webhook está definida)
    - opcional `channels.telegram.webhookPath` (padrão `/telegram-webhook`)
    - opcional `channels.telegram.webhookHost` (padrão `127.0.0.1`)
    - opcional `channels.telegram.webhookPort` (padrão `8787`)

    O listener local padrão para o modo webhook se vincula a `127.0.0.1:8787`.

    Se seu endpoint público for diferente, coloque um proxy reverso na frente e aponte `webhookUrl` para a URL pública.
    Defina `webhookHost` (por exemplo `0.0.0.0`) quando precisar intencionalmente de ingresso externo.

  </Accordion>

  <Accordion title="Limites, retry e alvos de CLI">
    - O padrão de `channels.telegram.textChunkLimit` é 4000.
    - `channels.telegram.chunkMode="newline"` prefere limites de parágrafo (linhas em branco) antes da divisão por tamanho.
    - `channels.telegram.mediaMaxMb` (padrão 100) limita o tamanho de mídia Telegram de entrada e saída.
    - `channels.telegram.timeoutSeconds` substitui o timeout do cliente da API do Telegram (se não definido, o padrão do grammY se aplica).
    - o histórico de contexto de grupo usa `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (padrão 50); `0` desabilita.
    - controles de histórico de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - a config `channels.telegram.retry` se aplica aos helpers de envio do Telegram (CLI/ferramentas/ações) para erros de API de saída recuperáveis.

    O alvo de envio da CLI pode ser ID de chat numérico ou username:

```bash
opencraft message send --channel telegram --target 123456789 --message "oi"
opencraft message send --channel telegram --target @nome --message "oi"
```

    As enquetes do Telegram usam `opencraft message poll` e suportam tópicos de fórum:

```bash
opencraft message poll --channel telegram --target 123456789 \
  --poll-question "Publicar?" --poll-option "Sim" --poll-option "Não"
opencraft message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Escolha um horário" --poll-option "10h" --poll-option "14h" \
  --poll-duration-seconds 300 --poll-public
```

    Flags exclusivas do Telegram para enquetes:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` para tópicos de fórum (ou use um alvo `:topic:`)

    O envio do Telegram também suporta:

    - `--buttons` para teclados inline quando `channels.telegram.capabilities.inlineButtons` permite a superfície de destino
    - `--force-document` para enviar imagens e GIFs de saída como documentos em vez de uploads de foto comprimida ou mídia animada

    Controles de ação:

    - `channels.telegram.actions.sendMessage=false` desabilita mensagens Telegram de saída, incluindo enquetes
    - `channels.telegram.actions.poll=false` desabilita a criação de enquetes Telegram enquanto mantém os envios regulares habilitados

  </Accordion>

  <Accordion title="Aprovações de exec no Telegram">
    O Telegram suporta aprovações de exec em DMs de aprovador e pode opcionalmente postar prompts de aprovação no chat ou tópico de origem.

    Caminho de config:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers`
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`

    Os aprovadores devem ser IDs numéricos de usuário do Telegram. Quando `enabled` é falso ou `approvers` está vazio, o Telegram não atua como cliente de aprovação de exec. Solicitações de aprovação recaem para outras rotas de aprovação configuradas ou para a política de fallback de aprovação de exec.

    Regras de entrega:

    - `target: "dm"` envia prompts de aprovação apenas para DMs de aprovadores configurados
    - `target: "channel"` envia o prompt de volta para o chat/tópico Telegram de origem
    - `target: "both"` envia para DMs de aprovadores e o chat/tópico de origem

    Apenas aprovadores configurados podem aprovar ou negar. Não-aprovadores não podem usar `/approve` nem usar botões de aprovação do Telegram.

    A entrega no canal exibe o texto do comando no chat, então habilite `channel` ou `both` apenas em grupos/tópicos confiáveis. Quando o prompt aterrissa em um tópico de fórum, o OpenCraft preserva o tópico tanto para o prompt de aprovação quanto para o follow-up pós-aprovação.

    Botões de aprovação inline também dependem de `channels.telegram.capabilities.inlineButtons` permitindo a superfície de destino (`dm`, `group` ou `all`).

    Docs relacionados: [Aprovações de exec](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Bot não responde a mensagens de grupo sem menção">

    - Se `requireMention=false`, o modo de privacidade do Telegram deve permitir visibilidade total.
      - BotFather: `/setprivacy` -> Disable
      - depois remova + readicione o bot ao grupo
    - `opencraft channels status` avisa quando a config espera mensagens de grupo sem menção.
    - `opencraft channels status --probe` pode verificar IDs de grupo numéricos explícitos; o curinga `"*"` não pode ser verificado por associação.
    - teste rápido de sessão: `/activation always`.

  </Accordion>

  <Accordion title="Bot não vendo mensagens do grupo">

    - quando `channels.telegram.groups` existe, o grupo deve estar listado (ou incluir `"*"`)
    - verifique a associação do bot no grupo
    - revise os logs: `opencraft logs --follow` para motivos de ignorar

  </Accordion>

  <Accordion title="Comandos funcionam parcialmente ou não funcionam">

    - autorize sua identidade de remetente (pareamento e/ou `allowFrom` numérico)
    - a autorização de comando ainda se aplica mesmo quando a política de grupo é `open`
    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu nativo tem entradas demais; reduza comandos de plugin/skill/personalizados ou desabilite menus nativos
    - `setMyCommands failed` com erros de rede/fetch geralmente indica problemas de acessibilidade de DNS/HTTPS para `api.telegram.org`

  </Accordion>

  <Accordion title="Instabilidade de polling ou rede">

    - Node 22+ + fetch/proxy personalizado pode acionar comportamento de abort imediato se os tipos AbortSignal não corresponderem.
    - Alguns hosts resolvem `api.telegram.org` para IPv6 primeiro; egress IPv6 quebrado pode causar falhas intermitentes na API do Telegram.
    - Se os logs incluírem `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, o OpenCraft agora faz retry dessas como erros de rede recuperáveis.
    - Em hosts VPS com egress direto/TLS instável, roteie chamadas da API do Telegram através de `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ padrão para `autoSelectFamily=true` (exceto WSL2) e `dnsResultOrder=ipv4first`.
    - Se seu host for WSL2 ou funcionar explicitamente melhor com comportamento apenas IPv4, force a seleção de família:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Substituições de ambiente (temporárias):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Validar respostas DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Mais ajuda: [Solução de problemas de canal](/channels/troubleshooting).

## Referências de configuração do Telegram

Referência principal:

- `channels.telegram.enabled`: habilitar/desabilitar inicialização do canal.
- `channels.telegram.botToken`: token do bot (BotFather).
- `channels.telegram.tokenFile`: ler token de um caminho de arquivo regular. Symlinks são rejeitados.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.telegram.allowFrom`: lista de permissão de DM (IDs numéricos de usuário do Telegram). `allowlist` requer pelo menos um ID de remetente. `open` requer `"*"`. `opencraft doctor --fix` pode resolver entradas legadas `@username` para IDs e pode recuperar entradas de lista de permissão de arquivos do pairing-store em fluxos de migração de lista de permissão.
- `channels.telegram.actions.poll`: habilitar ou desabilitar a criação de enquetes no Telegram (padrão: habilitado; ainda requer `sendMessage`).
- `channels.telegram.defaultTo`: alvo Telegram padrão usado pelo CLI `--deliver` quando nenhum `--reply-to` explícito é fornecido.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist).
- `channels.telegram.groupAllowFrom`: lista de permissão de remetentes em grupo (IDs numéricos de usuário do Telegram). `opencraft doctor --fix` pode resolver entradas legadas `@username` para IDs. Entradas não numéricas são ignoradas no momento da autenticação. A autenticação de grupo não usa fallback do pairing-store de DM (`2026.2.25+`).
- Precedência de múltiplas contas:
  - Quando dois ou mais IDs de conta são configurados, defina `channels.telegram.defaultAccount` (ou inclua `channels.telegram.accounts.default`) para tornar o roteamento padrão explícito.
  - Se nenhum dos dois estiver definido, o OpenCraft recorre ao primeiro ID de conta normalizado e `opencraft doctor` avisa.
  - `channels.telegram.accounts.default.allowFrom` e `channels.telegram.accounts.default.groupAllowFrom` se aplicam apenas à conta `default`.
  - Contas nomeadas herdam `channels.telegram.allowFrom` e `channels.telegram.groupAllowFrom` quando os valores em nível de conta não estão definidos.
  - Contas nomeadas não herdam `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: padrões por grupo + lista de permissão (use `"*"` para padrões globais).
  - `channels.telegram.groups.<id>.groupPolicy`: substituição por grupo para groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: padrão de controle de menção.
  - `channels.telegram.groups.<id>.skills`: filtro de skill (omitir = todos os skills, vazio = nenhum).
  - `channels.telegram.groups.<id>.allowFrom`: substituição de lista de permissão de remetente por grupo.
  - `channels.telegram.groups.<id>.systemPrompt`: prompt de sistema extra para o grupo.
  - `channels.telegram.groups.<id>.enabled`: desabilitar o grupo quando `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: substituições por tópico (campos de grupo + `agentId` exclusivo de tópico).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: rotear este tópico para um agente específico (substitui roteamento em nível de grupo e de binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: substituição por tópico para groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: substituição de controle de menção por tópico.
- `bindings[]` de nível superior com `type: "acp"` e id de tópico canônico `chatId:topic:topicId` em `match.peer.id`: campos de binding persistente de tópico ACP (veja [Agentes ACP](/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: rotear tópicos de DM para um agente específico (mesmo comportamento dos tópicos de fórum).
- `channels.telegram.execApprovals.enabled`: habilitar o Telegram como cliente de aprovação de exec baseado em chat para esta conta.
- `channels.telegram.execApprovals.approvers`: IDs de usuário do Telegram permitidos para aprovar ou negar solicitações de exec. Obrigatório quando as aprovações de exec estão habilitadas.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (padrão: `dm`). `channel` e `both` preservam o tópico Telegram de origem quando presente.
- `channels.telegram.execApprovals.agentFilter`: filtro de ID de agente opcional para prompts de aprovação encaminhados.
- `channels.telegram.execApprovals.sessionFilter`: filtro de chave de sessão opcional (substring ou regex) para prompts de aprovação encaminhados.
- `channels.telegram.accounts.<conta>.execApprovals`: substituição por conta para roteamento de aprovação de exec do Telegram e autorização de aprovador.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (padrão: allowlist).
- `channels.telegram.accounts.<conta>.capabilities.inlineButtons`: substituição por conta.
- `channels.telegram.commands.nativeSkills`: habilitar/desabilitar comandos de skills nativos do Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (padrão: `off`).
- `channels.telegram.textChunkLimit`: tamanho do bloco de saída (caracteres).
- `channels.telegram.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- `channels.telegram.linkPreview`: alternar prévias de links para mensagens de saída (padrão: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (prévia de streaming ao vivo; padrão: `partial`; `progress` mapeia para `partial`; `block` é compat com modo de prévia legado). O streaming de prévia do Telegram usa uma única mensagem de prévia que é editada no lugar.
- `channels.telegram.mediaMaxMb`: cap de mídia Telegram de entrada/saída (MB, padrão: 100).
- `channels.telegram.retry`: política de retry para helpers de envio do Telegram (CLI/ferramentas/ações) em erros de API de saída recuperáveis (attempts, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: substituir Node autoSelectFamily (true=habilitar, false=desabilitar). Padrão habilitado no Node 22+, com WSL2 padrão desabilitado.
- `channels.telegram.network.dnsResultOrder`: substituir ordem de resultado DNS (`ipv4first` ou `verbatim`). Padrão `ipv4first` no Node 22+.
- `channels.telegram.proxy`: URL de proxy para chamadas da Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: habilitar modo webhook (requer `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: segredo do webhook (obrigatório quando webhookUrl estiver definido).
- `channels.telegram.webhookPath`: caminho local do webhook (padrão `/telegram-webhook`).
- `channels.telegram.webhookHost`: host de bind local do webhook (padrão `127.0.0.1`).
- `channels.telegram.webhookPort`: porta de bind local do webhook (padrão `8787`).
- `channels.telegram.actions.reactions`: controlar reações de ferramentas do Telegram.
- `channels.telegram.actions.sendMessage`: controlar envios de mensagens de ferramentas do Telegram.
- `channels.telegram.actions.deleteMessage`: controlar exclusões de mensagens de ferramentas do Telegram.
- `channels.telegram.actions.sticker`: controlar ações de adesivos do Telegram — enviar e pesquisar (padrão: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — controlar quais reações acionam eventos de sistema (padrão: `own` quando não definido).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — controlar a capacidade de reação do agente (padrão: `minimal` quando não definido).

- [Referência de configuração - Telegram](/gateway/configuration-reference#telegram)

Campos de alto valor específicos do Telegram:

- inicialização/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve apontar para um arquivo regular; symlinks são rejeitados)
- controle de acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nível superior (`type: "acp"`)
- aprovações de exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/respostas: `replyToMode`
- streaming: `streaming` (prévia), `blockStreaming`
- formatação/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- mídia/rede: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- ações/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reações: `reactionNotifications`, `reactionLevel`
- escritas/histórico: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Relacionados

- [Pareamento](/channels/pairing)
- [Roteamento de canal](/channels/channel-routing)
- [Roteamento multi-agente](/concepts/multi-agent)
- [Solução de problemas](/channels/troubleshooting)
