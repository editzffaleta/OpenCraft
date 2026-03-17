---
summary: "Status de suporte do bot Telegram, capacidades e configuração"
read_when:
  - Trabalhando em recursos do Telegram ou webhooks
title: "Telegram"
---

# Telegram (Bot API)

Status: pronto para produção para DMs de bot + grupos via grammY. Long polling é o modo padrão; webhook é opcional.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/channels/pairing">
    A política padrão de DM para Telegram é pareamento.
  </Card>
  <Card title="Solução de problemas do canal" icon="wrench" href="/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de reparo.
  </Card>
  <Card title="Configuração do Gateway" icon="settings" href="/gateway/configuration">
    Padrões e exemplos completos de configuração de canal.
  </Card>
</CardGroup>

## Configuração rápida

<Steps>
  <Step title="Crie o token do bot no BotFather">
    Abra o Telegram e converse com **@BotFather** (confirme se o identificador é exatamente `@BotFather`).

    Execute `/newbot`, siga os prompts e salve o token.

  </Step>

  <Step title="Configure token e política de DM">

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
    Telegram **não** usa `opencraft channels login telegram`; configure token em config/env e então inicie o gateway.

  </Step>

  <Step title="Inicie o gateway e aprove o primeiro DM">

```bash
opencraft gateway
opencraft pairing list telegram
opencraft pairing approve telegram <CODE>
```

    Códigos de pareamento expiram após 1 hora.

  </Step>

  <Step title="Adicione o bot a um grupo">
    Adicione o bot ao seu grupo e então defina `channels.telegram.groups` e `groupPolicy` para corresponder ao seu modelo de acesso.
  </Step>
</Steps>

<Note>
A ordem de resolução de token é ciente de conta. Na prática, valores de config vencem sobre fallback de env, e `TELEGRAM_BOT_TOKEN` se aplica apenas à conta padrão.
</Note>

## Configurações do lado do Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidade e visibilidade do grupo">
    Bots do Telegram usam como padrão **Modo de Privacidade**, que limita quais mensagens de grupo eles recebem.

    Se o bot deve ver todas as mensagens do grupo, então:

    - desative o modo de privacidade via `/setprivacy`, ou
    - torne o bot um administrador do grupo.

    Ao alternar o modo de privacidade, remova + readicione o bot em cada grupo para que o Telegram aplique a alteração.

  </Accordion>

  <Accordion title="Permissões de grupo">
    O status de administrador é controlado nas configurações de grupo do Telegram.

    Bots administradores recebem todas as mensagens de grupo, o que é útil para comportamento de grupo sempre ativo.

  </Accordion>

  <Accordion title="Alternâncias úteis do BotFather">

    - `/setjoingroups` para permitir/negar adições de grupo
    - `/setprivacy` para comportamento de visibilidade de grupo

  </Accordion>
</AccordionGroup>

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de DM">
    `channels.telegram.dmPolicy` controla o acesso a mensagens diretas:

    - `pairing` (padrão)
    - `allowlist` (requer pelo menos um ID de remetente em `allowFrom`)
    - `open` (requer `allowFrom` para incluir `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` aceita IDs de usuário numéricos do Telegram. Prefixos `telegram:` / `tg:` são aceitos e normalizados.
    `dmPolicy: "allowlist"` com `allowFrom` vazio bloqueia todos os DMs e é rejeitado pela validação de configuração.
    Integração aceita entrada `@username` e a resolve para IDs numéricos.
    Se você atualizou e sua configuração contém entradas de lista de permissões `@username`, execute `opencraft doctor --fix` para resolvê-las (melhor esforço; requer token de bot do Telegram).
    Se você dependia anteriormente de arquivos de lista de permissões do armazenamento de pareamento, `opencraft doctor --fix` pode recuperar entradas em `channels.telegram.allowFrom` em fluxos de migração de lista de permissões (por exemplo quando `dmPolicy: "allowlist"` ainda não tem IDs explícitos).

    Para bots de um proprietário, prefira `dmPolicy: "allowlist"` com IDs `allowFrom` numéricos explícitos para manter a política de acesso durável em config (em vez de depender de aprovações de pareamento anteriores).

    ### Encontrando seu ID de usuário do Telegram

    Mais seguro (sem bot de terceiros):

    1. DM seu bot.
    2. Execute `opencraft logs --follow`.
    3. Leia `from.id`.

    Método oficial de Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Método de terceiros (menos privado): `@userinfobot` ou `@getidsbot`.

  </Tab>

  <Tab title="Política de grupo e listas de permissões">
    Dois controles se aplicam juntos:

    1. **Quais grupos são permitidos** (`channels.telegram.groups`)
       - sem config de `groups`:
         - com `groupPolicy: "open"`: qualquer grupo pode passar nas verificações de ID de grupo
         - com `groupPolicy: "allowlist"` (padrão): grupos são bloqueados até você adicionar entradas `groups` (ou `"*"`)
       - `groups` configurado: funciona como lista de permissões (IDs explícitos ou `"*"`)

    2. **Quais remetentes são permitidos em grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (padrão)
       - `disabled`

    `groupAllowFrom` é usado para filtragem de remetente de grupo. Se não definido, Telegram retorna para `allowFrom`.
    Entradas `groupAllowFrom` devem ser IDs de usuário numéricos do Telegram (prefixos `telegram:` / `tg:` são normalizados).
    Não coloque IDs de chat de grupo ou supergrupo do Telegram em `groupAllowFrom`. IDs de chat negativos pertencem em `channels.telegram.groups`.
    Entradas não numéricas são ignoradas para autorização de remetente.
    Limite de segurança (`2026.2.25+`): auth de remetente de grupo **não** herda aprovações do armazenamento de pareamento de DM.
    Pareamento permanece apenas DM. Para grupos, defina `groupAllowFrom` ou `allowFrom` por grupo/tópico.
    Nota de tempo de execução: se `channels.telegram` estiver completamente faltando, tempo de execução usa padrão fail-closed `groupPolicy="allowlist"` a menos que `channels.defaults.groupPolicy` esteja explicitamente definido.

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
      Erro comum: `groupAllowFrom` não é uma lista de permissões de grupo do Telegram.

      - Coloque IDs de chat de grupo ou supergrupo negativos do Telegram como `-1001234567890` em `channels.telegram.groups`.
      - Coloque IDs de usuário do Telegram como `8734062810` em `groupAllowFrom` quando quiser limitar quais pessoas dentro de um grupo permitido podem acioná-lo.
      - Use `groupAllowFrom: ["*"]` apenas quando quiser que qualquer membro de um grupo permitido possa conversar com o bot.
    </Warning>

  </Tab>

  <Tab title="Comportamento de menção">
    Respostas de grupo requerem menção por padrão.

    Menção pode vir de:

    - menção nativa `@botusername`, ou
    - padrões de menção em:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Alternâncias de comando de nível de sessão:

    - `/activation always`
    - `/activation mention`

    Estas atualizam apenas o estado da sessão. Use config para persistência.

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

    Obtendo o ID de chat do grupo:

    - encaminhe uma mensagem de grupo para `@userinfobot` / `@getidsbot`
    - ou leia `chat.id` de `opencraft logs --follow`
    - ou inspecione o Bot API `getUpdates`

  </Tab>
</Tabs>

## Comportamento de tempo de execução

- Telegram é de propriedade do processo Gateway.
- Roteamento é determinístico: entrada de Telegram responde de volta ao Telegram (o modelo não escolhe canais).
- Mensagens de entrada normalizam no envelope de canal compartilhado com metadados de resposta e placeholders de mídia.
- Sessões de grupo são isoladas por ID de grupo. Tópicos de fórum anexam `:topic:<threadId>` para manter tópicos isolados.
- Mensagens de DM podem carregar `message_thread_id`; OpenCraft as roteia com chaves de sessão cientes de thread e preserva ID de thread para respostas.
- Long polling usa runner grammY com sequenciamento por chat/thread. Concorrência geral do sink de runner usa `agents.defaults.maxConcurrent`.
- Telegram Bot API não tem suporte de recibo de leitura (`sendReadReceipts` não se aplica).

## Referência de recursos

<AccordionGroup>
  <Accordion title="Visualização ao vivo (edições de mensagem)">
    OpenCraft pode transmitir respostas parciais em tempo real:

    - chats diretos: mensagem de visualização + `editMessageText`
    - grupos/tópicos: mensagem de visualização + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` é `off | partial | block | progress` (padrão: `partial`)
    - `progress` mapeia para `partial` no Telegram (compatibilidade com nomenclatura entre canais)
    - valores booleanos legados `channels.telegram.streamMode` e `streaming` são automapeados

    Para respostas apenas de texto:

    - DM: OpenCraft mantém a mesma mensagem de visualização e executa uma edição final no lugar (nenhuma segunda mensagem)
    - grupo/tópico: OpenCraft mantém a mesma mensagem de visualização e executa uma edição final no lugar (nenhuma segunda mensagem)

    Para respostas complexas (por exemplo payloads de mídia), OpenCraft retorna para entrega final normal e então limpa a mensagem de visualização.

    Transmissão de visualização é separada da transmissão de bloco. Quando transmissão de bloco é explicitamente habilitada para Telegram, OpenCraft pula a transmissão de visualização para evitar dupla transmissão.

    Se transporte de rascunho nativo está indisponível/rejeitado, OpenCraft retorna automaticamente para `sendMessage` + `editMessageText`.

    Fluxo de raciocínio somente Telegram:

    - `/reasoning stream` envia raciocínio para visualização ao vivo durante a geração
    - resposta final é enviada sem texto de raciocínio

  </Accordion>

  <Accordion title="Formatação e fallback HTML">
    Texto de saída usa Telegram `parse_mode: "HTML"`.

    - Texto tipo Markdown é renderizado para HTML seguro do Telegram.
    - HTML do modelo bruto é escapado para reduzir falhas de análise do Telegram.
    - Se o Telegram rejeitar HTML analisado, OpenCraft tenta novamente como texto simples.

    Visualizações de link são habilitadas por padrão e podem ser desabilitadas com `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandos nativos e comandos personalizados">
    O registro do menu de comandos do Telegram é manipulado na inicialização com `setMyCommands`.

    Padrões de comando nativo:

    - `commands.native: "auto"` habilita comandos nativos para Telegram

    Adicione entradas de menu de comando personalizado:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Regras:

    - nomes são normalizados (remover `/` inicial, minúsculas)
    - padrão válido: `a-z`, `0-9`, `_`, comprimento `1..32`
    - comandos personalizados não podem substituir comandos nativos
    - conflitos/duplicatas são puladas e registradas

    Notas:

    - comandos personalizados são apenas entradas de menu; eles não implementam comportamento automaticamente
    - comandos de plugin/skill ainda podem funcionar quando digitados mesmo que não sejam mostrados no menu do Telegram

    Se comandos nativos forem desabilitados, integrados são removidos. Comandos personalizados/plugin podem ainda se registrar se configurados.

    Falhas de configuração comuns:

    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa o menu do Telegram ainda transbordou após o corte; reduza comandos plugin/skill/personalizados ou desabilite `channels.telegram.commands.native`.
    - `setMyCommands failed` com erros de rede/fetch geralmente significa saída DNS/HTTPS para `api.telegram.org` é bloqueada.

    ### Comandos de pareamento de dispositivo (plugin `device-pair`)

    Quando o plugin `device-pair` está instalado:

    1. `/pair` gera código de configuração
    2. cole o código no aplicativo iOS
    3. `/pair approve` aprova a solicitação pendente mais recente

    Mais detalhes: [Pareamento](/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Botões inline">
    Configure escopo do teclado inline:

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

    Legado `capabilities: ["inlineButtons"]` mapeia para `inlineButtons: "all"`.

    Exemplo de ação de mensagem:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Cliques de callback são passados ao agente como texto:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Ações de mensagem Telegram para agentes e automação">
    Ações de ferramenta Telegram incluem:

    - `sendMessage` (`to`, `content`, `mediaUrl` opcional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opcional, `iconCustomEmojiId`)

    As ações de mensagem de canal expõem aliases ergonômicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (padrão: desabilitado)

    Nota: `edit` e `topic-create` estão habilitados por padrão atualmente e não têm alternâncias `channels.telegram.actions.*` separadas.
    Envios em tempo de execução usam o snapshot de config/secrets ativo (inicialização/recarga), portanto caminhos de ação não executam re-resolução ad-hoc de SecretRef por envio.

    Semântica de remoção de reação: [/tools/reactions](/tools/reactions)

  </Accordion>

  <Accordion title="Etiquetas de thread de resposta">
    Telegram suporta etiquetas explícitas de thread de resposta em saída gerada:

    - `[[reply_to_current]]` responde à mensagem de acionamento
    - `[[reply_to:<id>]]` responde a um ID de mensagem Telegram específico

    `channels.telegram.replyToMode` controla manipulação:

    - `off` (padrão)
    - `first`
    - `all`

    Nota: `off` desabilita threading de resposta implícita. Etiquetas `[[reply_to_*]]` explícitas ainda são honradas.

  </Accordion>

  <Accordion title="Tópicos de fórum e comportamento de thread">
    Supergrupos de fórum:

    - chaves de sessão de tópico anexam `:topic:<threadId>`
    - respostas e digitação visam o thread de tópico
    - caminho de config de tópico:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Tópico geral (`threadId=1`) caso especial:

    - envios de mensagem omitem `message_thread_id` (Telegram rejeita `sendMessage(...thread_id=1)`)
    - ações de digitação ainda incluem `message_thread_id`

    Herança de tópico: entradas de tópico herdam configurações de grupo a menos que sejam substituídas (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` é apenas de tópico e não herda de padrões de grupo.

    **Roteamento de agente por tópico**: Cada tópico pode rotear para um agente diferente definindo `agentId` na config de tópico. Isso dá a cada tópico seu próprio espaço de trabalho, memória e sessão isolados. Exemplo:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Cada tópico então tem sua própria chave de sessão: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Ligação persistente de tópico ACP**: Tópicos de fórum podem fixar sessões de harness ACP através de ligações ACP digitadas de nível superior:

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

    Isso está atualmente limitado a tópicos de fórum em grupos e supergrupos.

    **Spawn de ACP ligado a thread a partir do chat**:

    - `/acp spawn <agent> --thread here|auto` pode ligar o tópico Telegram atual a uma nova sessão ACP.
    - Mensagens de tópico subsequentes roteia para a sessão ACP ligada diretamente (não requer `/acp steer`).
    - OpenCraft fixa a mensagem de confirmação de spawn no tópico após uma ligação bem-sucedida.
    - Requer `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Contexto de template inclui:

    - `MessageThreadId`
    - `IsForum`

    Comportamento de thread de DM:

    - chats privados com `message_thread_id` mantêm roteamento de DM mas usam chaves de sessão cientes de thread/alvo de resposta.

  </Accordion>

  <Accordion title="Áudio, vídeo e stickers">
    ### Mensagens de áudio

    Telegram distingue notas de voz vs arquivos de áudio.

    - padrão: comportamento de arquivo de áudio
    - tag `[[audio_as_voice]]` na resposta do agente para forçar envio de nota de voz

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

    Telegram distingue arquivos de vídeo vs notas de vídeo.

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

    Notas de vídeo não suportam legendas; texto de mensagem fornecido é enviado separadamente.

    ### Stickers

    Manipulação de sticker de entrada:

    - WEBP estático: baixado e processado (placeholder `<media:sticker>`)
    - TGS animado: pulado
    - WEBM de vídeo: pulado

    Campos de contexto de sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Arquivo de cache de sticker:

    - `~/.opencraft/telegram/sticker-cache.json`

    Stickers são descritos uma vez (quando possível) e armazenados em cache para reduzir chamadas de visão repetidas.

    Ativar ações de sticker:

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

    Ação de envio de sticker:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Buscar stickers em cache:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notificações de reação">
    Reações do Telegram chegam como atualizações `message_reaction` (separadas de payloads de mensagem).

    Quando habilitado, OpenCraft enfileira eventos de sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (padrão: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`)

    Notas:

    - `own` significa apenas reações de usuário a mensagens enviadas pelo bot (melhor esforço via cache de mensagens enviadas).
    - Eventos de reação ainda respeitam controles de acesso do Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); remetentes não autorizados são descartados.
    - Telegram não fornece IDs de thread em atualizações de reação.
      - grupos não-fórum roteia para sessão de chat de grupo
      - grupos de fórum roteia para sessão de tópico geral de grupo (`:topic:1`), não o tópico originário exato

    `allowed_updates` para polling/webhook incluem `message_reaction` automaticamente.

  </Accordion>

  <Accordion title="Reações de reconhecimento">
    `ackReaction` envia um emoji de reconhecimento enquanto OpenCraft está processando uma mensagem de entrada.

    Ordem de resolução:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback de emoji de identidade do agente (`agents.list[].identity.emoji`, senão "👀")

    Notas:

    - Telegram espera emoji unicode (por exemplo "👀").
    - Use `""` para desabilitar a reação para um canal ou conta.

  </Accordion>

  <Accordion title="Gravações de config a partir de eventos e comandos do Telegram">
    Gravações de config iniciadas por canal são habilitadas por padrão (`configWrites !== false`).

    Gravações acionadas por Telegram incluem:

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
    - defina `channels.telegram.webhookSecret` (necessário quando webhook URL está definido)
    - `channels.telegram.webhookPath` opcional (padrão `/telegram-webhook`)
    - `channels.telegram.webhookHost` opcional (padrão `127.0.0.1`)
    - `channels.telegram.webhookPort` opcional (padrão `8787`)

    Ouvinte local padrão para modo webhook se vincula a `127.0.0.1:8787`.

    Se seu endpoint público for diferente, coloque um proxy reverso na frente e aponte `webhookUrl` para a URL pública.
    Defina `webhookHost` (por exemplo `0.0.0.0`) quando você intencionalmente precisar de entrada externa.

  </Accordion>

  <Accordion title="Limites, retry e alvos CLI">
    - `channels.telegram.textChunkLimit` padrão é 4000.
    - `channels.telegram.chunkMode="newline"` prefere limites de parágrafo (linhas em branco) antes de divisão de comprimento.
    - `channels.telegram.mediaMaxMb` (padrão 100) limita tamanho de mídia Telegram de entrada e saída.
    - `channels.telegram.timeoutSeconds` substitui timeout do cliente de API Telegram (se não definido, padrão grammY se aplica).
    - histórico de contexto de grupo usa `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (padrão 50); `0` desativa.
    - controles de histórico de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - config `channels.telegram.retry` se aplica aos auxiliares de envio Telegram (CLI/tools/actions) para erros de API de saída recuperáveis.

    Alvo de envio CLI pode ser ID de chat numérico ou nome de usuário:

```bash
opencraft message send --channel telegram --target 123456789 --message "hi"
opencraft message send --channel telegram --target @name --message "hi"
```

    Pesquisas Telegram usam `opencraft message poll` e suportam tópicos de fórum:

```bash
opencraft message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
opencraft message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Sinalizadores de pesquisa apenas do Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` para tópicos de fórum (ou use um alvo `:topic:`)

    Envio Telegram também suporta:

    - `--buttons` para teclados inline quando `channels.telegram.capabilities.inlineButtons` permite
    - `--force-document` para enviar imagens e GIFs de saída como documentos em vez de uploads de foto comprimida ou mídia animada

    Gating de ação:

    - `channels.telegram.actions.sendMessage=false` desabilita mensagens Telegram de saída, incluindo pesquisas
    - `channels.telegram.actions.poll=false` desabilita criação de pesquisa Telegram enquanto deixa envios regulares habilitados

  </Accordion>

  <Accordion title="Aprovações exec no Telegram">
    Telegram suporta aprovações exec em DMs de aprovador e pode opcionalmente postar prompts de aprovação no chat originário ou tópico.

    Caminho de config:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers`
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`

    Aprovadores devem ser IDs de usuário Telegram numéricos. Quando `enabled` é false ou `approvers` está vazio, Telegram não funciona como cliente de aprovação exec. Solicitações de aprovação retornam para outras rotas de aprovação configuradas ou a política de fallback de aprovação exec.

    Regras de entrega:

    - `target: "dm"` envia prompts de aprovação apenas para DMs de aprovador configurados
    - `target: "channel"` envia o prompt de volta para o chat/tópico Telegram originário
    - `target: "both"` envia para DMs de aprovador e chat/tópico originário

    Apenas aprovadores configurados podem aprovar ou negar. Não-aprovadores não podem usar `/approve` e não podem usar botões de aprovação do Telegram.

    Entrega de canal mostra o texto de comando no chat, então apenas habilite `channel` ou `both` em grupos/tópicos confiáveis. Quando o prompt chega a um tópico de fórum, OpenCraft preserva o tópico para ambos o prompt de aprovação e o acompanhamento pós-aprovação.

    Botões de aprovação inline também dependem de `channels.telegram.capabilities.inlineButtons` permitir a superfície de destino (`dm`, `group` ou `all`).

    Documentos relacionados: [Aprovações exec](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Bot não responde a mensagens de grupo sem menção">

    - Se `requireMention=false`, o modo de privacidade do Telegram deve permitir visibilidade completa.
      - BotFather: `/setprivacy` -> Desabilitar
      - então remova + readicione bot ao grupo
    - `opencraft channels status` avisa quando config espera mensagens de grupo sem menção.
    - `opencraft channels status --probe` pode verificar IDs de grupo numéricos explícitos; curinga `"*"` não pode ser sondado de membros.
    - teste rápido de sessão: `/activation always`.

  </Accordion>

  <Accordion title="Bot não vendo mensagens de grupo nenhuma">

    - quando `channels.telegram.groups` existe, grupo deve estar listado (ou incluir `"*"`)
    - verifique membros do bot em grupo
    - revise logs: `opencraft logs --follow` por razões de pulo

  </Accordion>

  <Accordion title="Comandos funcionam parcialmente ou nenhum">

    - autorize sua identidade de remetente (pareamento e/ou `allowFrom` numérico)
    - autorização de comando ainda se aplica mesmo quando política de grupo é `open`
    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa o menu nativo tem muitas entradas; reduza comandos plugin/skill/personalizados ou desabilite menus nativos
    - `setMyCommands failed` com erros de rede/fetch geralmente indicam problemas de acessibilidade DNS/HTTPS para `api.telegram.org`

  </Accordion>

  <Accordion title="Polling ou instabilidade de rede">

    - Node 22+ + fetch/proxy personalizado pode acionar comportamento de aborto imediato se tipos de AbortSignal não corresponderem.
    - Alguns hosts resolvem `api.telegram.org` para IPv6 primeiro; saída IPv6 quebrada pode causar falhas intermitentes de Telegram API.
    - Se logs incluem `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, OpenCraft agora tenta estes como erros de rede recuperáveis.
    - Em hosts VPS com saída/TLS instável direta, rotear chamadas de API Telegram através de `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa padrão `autoSelectFamily=true` (exceto WSL2) e `dnsResultOrder=ipv4first`.
    - Se seu host é WSL2 ou explicitamente funciona melhor com comportamento apenas IPv4, force seleção de família:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Substituições de ambiente (temporárias):
      - `OPENCRAFT_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCRAFT_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCRAFT_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Validar respostas DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Mais ajuda: [Solução de problemas do canal](/channels/troubleshooting).

## Ponteiros de referência de config Telegram

Referência primária:

- `channels.telegram.enabled`: habilitar/desabilitar inicialização de canal.
- `channels.telegram.botToken`: token do bot (BotFather).
- `channels.telegram.tokenFile`: ler token de um caminho de arquivo regular. Symlinks são rejeitados.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.telegram.allowFrom`: lista de permissões de DM (IDs de usuário Telegram numéricos). `allowlist` requer pelo menos um ID de remetente. `open` requer `"*"`. `opencraft doctor --fix` pode resolver entradas `@username` legadas para IDs e pode recuperar entradas de lista de permissões de arquivos de armazenamento de pareamento em fluxos de migração de lista de permissões.
- `channels.telegram.actions.poll`: habilitar ou desabilitar criação de pesquisa Telegram (padrão: habilitado; ainda requer `sendMessage`).
- `channels.telegram.defaultTo`: alvo padrão do Telegram usado por CLI `--deliver` quando nenhum `--reply-to` explícito é fornecido.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist).
- `channels.telegram.groupAllowFrom`: lista de permissões de remetente de grupo (IDs de usuário Telegram numéricos). `opencraft doctor --fix` pode resolver entradas `@username` legadas para IDs. Entradas não numéricas são ignoradas em tempo de auth. Auth de grupo não usa fallback de armazenamento de pareamento de DM (`2026.2.25+`).
- Precedência de multi-conta:
  - Quando dois ou mais IDs de conta são configurados, defina `channels.telegram.defaultAccount` (ou inclua `channels.telegram.accounts.default`) para tornar o roteamento padrão explícito.
  - Se nenhum estiver definido, OpenCraft retorna para o primeiro ID de conta normalizado e `opencraft doctor` avisa.
  - `channels.telegram.accounts.default.allowFrom` e `channels.telegram.accounts.default.groupAllowFrom` se aplicam apenas à conta `default`.
  - Contas nomeadas herdam `channels.telegram.allowFrom` e `channels.telegram.groupAllowFrom` quando valores de nível de conta não estão definidos.
  - Contas nomeadas não herdam `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: padrões por grupo + lista de permissões (use `"*"` para padrões globais).
  - `channels.telegram.groups.<id>.groupPolicy`: substituição por grupo para groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: padrão gating de menção.
  - `channels.telegram.groups.<id>.skills`: filtro de skill (omitir = todas as skills, vazio = nenhuma).
  - `channels.telegram.groups.<id>.allowFrom`: substituição de lista de permissões de remetente por grupo.
  - `channels.telegram.groups.<id>.systemPrompt`: prompt de sistema extra para o grupo.
  - `channels.telegram.groups.<id>.enabled`: desabilitar o grupo quando `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: substituições por tópico (campos de grupo + `agentId` apenas de tópico).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: roteia este tópico para um agente específico (substitui roteamento de nível de grupo e ligação).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: substituição por tópico para groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: substituição gating de menção por tópico.
- `bindings[]` de nível superior com `type: "acp"` e id de tópico canônico `chatId:topic:topicId` em `match.peer.id`: campos de ligação persistente de tópico ACP (veja [Agentes ACP](/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: roteia tópicos de DM para um agente específico (mesmo comportamento que tópicos de fórum).
- `channels.telegram.execApprovals.enabled`: habilitar Telegram como cliente de aprovação exec baseado em chat para esta conta.
- `channels.telegram.execApprovals.approvers`: IDs de usuário Telegram permitidos para aprovar ou negar solicitações exec. Necessário quando aprovações exec estão habilitadas.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (padrão: `dm`). `channel` e `both` preservam o tópico Telegram originário quando presente.
- `channels.telegram.execApprovals.agentFilter`: filtro de ID de agente opcional para prompts de aprovação encaminhados.
- `channels.telegram.execApprovals.sessionFilter`: filtro de chave de sessão opcional (substring ou regex) para prompts de aprovação encaminhados.
- `channels.telegram.accounts.<account>.execApprovals`: substituição por conta para roteamento de aprovação exec Telegram e autorização de aprovador.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (padrão: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: substituição por conta.
- `channels.telegram.commands.nativeSkills`: habilitar/desabilitar comandos de skills nativos do Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (padrão: `off`).
- `channels.telegram.textChunkLimit`: tamanho de bloco de saída (chars).
- `channels.telegram.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes de chunking de comprimento.
- `channels.telegram.linkPreview`: alternar visualizações de link para mensagens de saída (padrão: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (visualização ao vivo; padrão: `partial`; `progress` mapeia para `partial`; `block` é compatibilidade de modo de visualização legado). Transmissão de visualização Telegram usa uma única mensagem de visualização que é editada no lugar.
- `channels.telegram.mediaMaxMb`: limite de mídia Telegram de entrada/saída (MB, padrão: 100).
- `channels.telegram.retry`: política de retry para auxiliares de envio Telegram (CLI/tools/actions) em erros de API de saída recuperáveis (attempts, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: substituir Node autoSelectFamily (true=habilitar, false=desabilitar). Padrão habilitado em Node 22+, com WSL2 usando padrão desabilitado.
- `channels.telegram.network.dnsResultOrder`: substituir ordem de resultado DNS (`ipv4first` ou `verbatim`). Padrão `ipv4first` em Node 22+.
- `channels.telegram.proxy`: URL de proxy para chamadas Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: habilitar modo webhook (requer `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: segredo webhook (necessário quando webhookUrl está definido).
- `channels.telegram.webhookPath`: caminho webhook local (padrão `/telegram-webhook`).
- `channels.telegram.webhookHost`: host bind webhook local (padrão `127.0.0.1`).
- `channels.telegram.webhookPort`: porta bind webhook local (padrão `8787`).
- `channels.telegram.actions.reactions`: gate reações de ferramenta Telegram.
- `channels.telegram.actions.sendMessage`: gate envios de mensagem de ferramenta Telegram.
- `channels.telegram.actions.deleteMessage`: gate deleções de mensagem de ferramenta Telegram.
- `channels.telegram.actions.sticker`: gate ações de sticker Telegram — enviar e buscar (padrão: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — controlar quais reações acionam eventos de sistema (padrão: `own` quando não definido).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — controlar capacidade de reação do agente (padrão: `minimal` quando não definido).

- [Referência de configuração - Telegram](/gateway/configuration-reference#telegram)

Campos de alto sinal específicos do Telegram:

- inicialização/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve apontar para arquivo regular; symlinks são rejeitados)
- controle de acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nível superior (`type: "acp"`)
- aprovações exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/respostas: `replyToMode`
- transmissão: `streaming` (visualização), `blockStreaming`
- formatação/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- mídia/rede: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- ações/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reações: `reactionNotifications`, `reactionLevel`
- gravações/histórico: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Relacionados

- [Pareamento](/channels/pairing)
- [Roteamento de canal](/channels/channel-routing)
- [Roteamento multi-agente](/concepts/multi-agent)
- [Solução de problemas](/channels/troubleshooting)
