---
summary: "Configuração e comportamento em runtime do Slack (Socket Mode + HTTP Events API)"
read_when:
  - Configurando o Slack ou depurando o modo socket/HTTP do Slack
title: "Slack"
---

# Slack

Status: pronto para produção para DMs + canais via integrações de app Slack. O modo padrão é Socket Mode; o modo HTTP Events API também é suportado.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/channels/pairing">
    DMs do Slack usam modo de pareamento por padrão.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/tools/slash-commands">
    Comportamento de comando nativo e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas de canal" icon="wrench" href="/channels/troubleshooting">
    Diagnósticos e playbooks de reparo entre canais.
  </Card>
</CardGroup>

## Configuração rápida

<Tabs>
  <Tab title="Socket Mode (padrão)">
    <Steps>
      <Step title="Criar app Slack e tokens">
        Nas configurações do app Slack:

        - habilite **Socket Mode**
        - crie **App Token** (`xapp-...`) com `connections:write`
        - instale o app e copie o **Bot Token** (`xoxb-...`)
      </Step>

      <Step title="Configurar o OpenCraft">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Fallback de env (apenas conta padrão):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Assinar eventos do app">
        Assine eventos de bot para:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Também habilite a **Messages Tab** do App Home para DMs.
      </Step>

      <Step title="Iniciar gateway">

```bash
opencraft gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="Modo HTTP Events API">
    <Steps>
      <Step title="Configurar app Slack para HTTP">

        - defina o modo como HTTP (`channels.slack.mode="http"`)
        - copie o **Signing Secret** do Slack
        - defina Event Subscriptions + Interactivity + Request URL de Slash command para o mesmo caminho de webhook (padrão `/slack/events`)

      </Step>

      <Step title="Configurar o modo HTTP do OpenCraft">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "seu-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

      </Step>

      <Step title="Usar caminhos de webhook únicos para múltiplas contas HTTP">
        O modo HTTP por conta é suportado.

        Dê a cada conta um `webhookPath` distinto para que os registros não colidam.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Modelo de token

- `botToken` + `appToken` são obrigatórios para Socket Mode.
- O modo HTTP requer `botToken` + `signingSecret`.
- Os tokens na config substituem o fallback de env.
- O fallback de env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` se aplica apenas à conta padrão.
- `userToken` (`xoxp-...`) é apenas config (sem fallback de env) e usa comportamento somente leitura por padrão (`userTokenReadOnly: true`).
- Opcional: adicione `chat:write.customize` se quiser que as mensagens de saída usem a identidade do agente ativo (`username` e ícone personalizados). `icon_emoji` usa a sintaxe `:nome_do_emoji:`.

<Tip>
Para leituras de ações/diretório, o token de usuário pode ser preferido quando configurado. Para escritas, o token de bot permanece preferido; escritas com token de usuário são permitidas apenas quando `userTokenReadOnly: false` e o token de bot está indisponível.
</Tip>

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de DM">
    `channels.slack.dmPolicy` controla o acesso a DM (legado: `channels.slack.dm.policy`):

    - `pairing` (padrão)
    - `allowlist`
    - `open` (requer que `channels.slack.allowFrom` inclua `"*"`; legado: `channels.slack.dm.allowFrom`)
    - `disabled`

    Flags de DM:

    - `dm.enabled` (padrão true)
    - `channels.slack.allowFrom` (preferido)
    - `dm.allowFrom` (legado)
    - `dm.groupEnabled` (DMs de grupo padrão false)
    - `dm.groupChannels` (lista de permissão MPIM opcional)

    Precedência de múltiplas contas:

    - `channels.slack.accounts.default.allowFrom` se aplica apenas à conta `default`.
    - Contas nomeadas herdam `channels.slack.allowFrom` quando seu próprio `allowFrom` não estiver definido.
    - Contas nomeadas não herdam `channels.slack.accounts.default.allowFrom`.

    O pareamento em DMs usa `opencraft pairing approve slack <código>`.

  </Tab>

  <Tab title="Política de canal">
    `channels.slack.groupPolicy` controla o tratamento de canais:

    - `open`
    - `allowlist`
    - `disabled`

    A lista de permissão de canais fica em `channels.slack.channels` e deve usar IDs de canal estáveis.

    Nota de runtime: se `channels.slack` estiver completamente ausente (configuração apenas com env), o runtime recorre a `groupPolicy="allowlist"` e registra um aviso (mesmo que `channels.defaults.groupPolicy` esteja definido).

    Resolução de nome/ID:

    - entradas de lista de permissão de canal e entradas de lista de permissão de DM são resolvidas na inicialização quando o acesso por token permite
    - entradas de nome de canal não resolvidas são mantidas conforme configurado mas ignoradas para roteamento por padrão
    - autorização de entrada e roteamento de canal são ID-first por padrão; correspondência direta por username/slug requer `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Menções e usuários de canal">
    Mensagens de canal são controladas por menção por padrão.

    Fontes de menção:

    - menção explícita do app (`<@botId>`)
    - padrões de regex de menção (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de thread de resposta ao bot

    Controles por canal (`channels.slack.channels.<id>`; nomes apenas via resolução na inicialização ou `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista de permissão)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Formato da chave `toolsBySender`: `id:`, `e164:`, `username:`, `name:`, ou o curinga `"*"`
      (chaves legadas sem prefixo ainda mapeiam apenas para `id:`)

  </Tab>
</Tabs>

## Comandos e comportamento slash

- O modo automático de comando nativo está **desligado** para o Slack (`commands.native: "auto"` não habilita comandos nativos do Slack).
- Habilite handlers de comando Slack nativos com `channels.slack.commands.native: true` (ou global `commands.native: true`).
- Quando os comandos nativos estão habilitados, registre comandos slash correspondentes no Slack (nomes `/<comando>`), com uma exceção:
  - registre `/agentstatus` para o comando de status (o Slack reserva `/status`)
- Se os comandos nativos não estiverem habilitados, você pode executar um único comando slash configurado via `channels.slack.slashCommand`.
- Os menus de arg nativos agora adaptam sua estratégia de renderização:
  - até 5 opções: blocos de botões
  - 6-100 opções: menu de seleção estática
  - mais de 100 opções: seleção externa com filtragem assíncrona de opções quando handlers de opções de interatividade estão disponíveis
  - se os valores de opção codificados excederem os limites do Slack, o fluxo recorre a botões
- Para payloads de opções longos, os menus de argumento de comandos Slash usam um diálogo de confirmação antes de despachar um valor selecionado.

## Respostas interativas

O Slack pode renderizar controles de resposta interativos de autoria do agente, mas este recurso está desabilitado por padrão.

Habilitar globalmente:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Ou habilitar apenas para uma conta Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Quando habilitado, os agentes podem emitir diretivas de resposta exclusivas do Slack:

- `[[slack_buttons: Aprovar:approve, Rejeitar:reject]]`
- `[[slack_select: Escolha um alvo | Canário:canary, Produção:production]]`

Essas diretivas são compiladas em Slack Block Kit e roteiam cliques ou seleções de volta pelo caminho de evento de interação Slack existente.

Notas:

- Esta é UI específica do Slack. Outros canais não traduzem diretivas Slack Block Kit para seus próprios sistemas de botão.
- Os valores de callback interativos são tokens opacos gerados pelo OpenCraft, não valores brutos de autoria do agente.
- Se os blocos interativos gerados excederem os limites do Slack Block Kit, o OpenCraft recorre à resposta de texto original em vez de enviar um payload de blocos inválido.

Configurações padrão de comandos slash:

- `enabled: false`
- `name: "opencraft"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Sessões slash usam chaves isoladas:

- `agent:<agentId>:slack:slash:<userId>`

e ainda roteiam a execução do comando em relação à sessão de conversa alvo (`CommandTargetSessionKey`).

## Threading, sessões e tags de resposta

- DMs roteiam como `direct`; canais como `channel`; MPIMs como `group`.
- Com o padrão `session.dmScope=main`, DMs do Slack recolhem para a sessão principal do agente.
- Sessões de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Respostas em thread podem criar sufixos de sessão de thread (`:thread:<threadTs>`) quando aplicável.
- O padrão de `channels.slack.thread.historyScope` é `thread`; o padrão de `thread.inheritParent` é `false`.
- `channels.slack.thread.initialHistoryLimit` controla quantas mensagens de thread existentes são obtidas quando uma nova sessão de thread começa (padrão `20`; defina `0` para desabilitar).

Controles de threading de resposta:

- `channels.slack.replyToMode`: `off|first|all` (padrão `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- fallback legado para chats diretos: `channels.slack.dm.replyToMode`

Tags de resposta manuais são suportadas:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Nota: `replyToMode="off"` desabilita **todo** threading de resposta no Slack, incluindo tags explícitas `[[reply_to_*]]`. Isso difere do Telegram, onde tags explícitas ainda são respeitadas no modo `"off"`. A diferença reflete os modelos de threading da plataforma: threads do Slack ocultam mensagens do canal, enquanto respostas do Telegram permanecem visíveis no fluxo principal do chat.

## Mídia, chunking e entrega

<AccordionGroup>
  <Accordion title="Anexos de entrada">
    Os anexos de arquivo do Slack são baixados de URLs privadas hospedadas pelo Slack (fluxo de requisição autenticado por token) e escritos no store de mídia quando a busca é bem-sucedida e os limites de tamanho permitem.

    O cap de tamanho de entrada em runtime padrão é `20MB` a menos que seja substituído por `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texto e arquivos de saída">
    - blocos de texto usam `channels.slack.textChunkLimit` (padrão 4000)
    - `channels.slack.chunkMode="newline"` habilita divisão com parágrafo primeiro
    - envios de arquivo usam APIs de upload do Slack e podem incluir respostas de thread (`thread_ts`)
    - o cap de mídia de saída segue `channels.slack.mediaMaxMb` quando configurado; caso contrário, envios de canal usam padrões de tipo MIME do pipeline de mídia
  </Accordion>

  <Accordion title="Alvos de entrega">
    Alvos explícitos preferidos:

    - `user:<id>` para DMs
    - `channel:<id>` para canais

    DMs do Slack são abertos via APIs de conversa do Slack ao enviar para alvos de usuário.

  </Accordion>
</AccordionGroup>

## Ações e controles

As ações do Slack são controladas por `channels.slack.actions.*`.

Grupos de ação disponíveis nas ferramentas Slack atuais:

| Grupo      | Padrão      |
| ---------- | ----------- |
| messages   | habilitado  |
| reactions  | habilitado  |
| pins       | habilitado  |
| memberInfo | habilitado  |
| emojiList  | habilitado  |

## Eventos e comportamento operacional

- Edições/exclusões/broadcasts de thread de mensagens são mapeados em eventos de sistema.
- Eventos de adicionar/remover reação são mapeados em eventos de sistema.
- Eventos de entrada/saída de membro, criação/renomeação de canal e adicionar/remover pino são mapeados em eventos de sistema.
- Atualizações de status de thread do assistente (para indicadores "está digitando..." em threads) usam `assistant.threads.setStatus` e requerem o escopo de bot `assistant:write`.
- `channel_id_changed` pode migrar chaves de config de canal quando `configWrites` está habilitado.
- Metadados de tópico/propósito do canal são tratados como contexto não confiável e podem ser injetados no contexto de roteamento.
- Ações de bloco e interações de modal emitem eventos de sistema estruturados `Slack interaction: ...` com campos de payload ricos:
  - ações de bloco: valores selecionados, rótulos, valores de seletor e metadados `workflow_*`
  - eventos `view_submission` e `view_closed` de modal com metadados de canal roteado e entradas de formulário

## Reações de ack

`ackReaction` envia um emoji de confirmação enquanto o OpenCraft está processando uma mensagem de entrada.

Ordem de resolução:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback de emoji de identidade do agente (`agents.list[].identity.emoji`, caso contrário "👀")

Notas:

- O Slack espera shortcodes (por exemplo `"eyes"`).
- Use `""` para desabilitar a reação para a conta Slack ou globalmente.

## Fallback de reação de digitação

`typingReaction` adiciona uma reação temporária à mensagem Slack de entrada enquanto o OpenCraft está processando uma resposta, depois a remove quando a execução termina. Isso é um fallback útil quando a digitação nativa do assistente do Slack está indisponível, especialmente em DMs.

Ordem de resolução:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notas:

- O Slack espera shortcodes (por exemplo `"hourglass_flowing_sand"`).
- A reação é de melhor esforço e a limpeza é tentada automaticamente após a resposta ou o caminho de falha ser concluído.

## Manifesto e checklist de escopos

<AccordionGroup>
  <Accordion title="Exemplo de manifesto do app Slack">

```json
{
  "display_information": {
    "name": "OpenCraft",
    "description": "Conector Slack para OpenCraft"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenCraft",
      "always_online": false
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/opencraft",
        "description": "Enviar uma mensagem para o OpenCraft",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "chat:write",
        "channels:history",
        "channels:read",
        "groups:history",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "users:read",
        "app_mentions:read",
        "assistant:write",
        "reactions:read",
        "reactions:write",
        "pins:read",
        "pins:write",
        "emoji:read",
        "commands",
        "files:read",
        "files:write"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "reaction_added",
        "reaction_removed",
        "member_joined_channel",
        "member_left_channel",
        "channel_rename",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

  </Accordion>

  <Accordion title="Escopos de token de usuário opcionais (operações de leitura)">
    Se você configurar `channels.slack.userToken`, os escopos de leitura típicos são:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (se depender de leituras de busca do Slack)

  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Sem respostas em canais">
    Verifique, em ordem:

    - `groupPolicy`
    - lista de permissão de canal (`channels.slack.channels`)
    - `requireMention`
    - lista de permissão `users` por canal

    Comandos úteis:

```bash
opencraft channels status --probe
opencraft logs --follow
opencraft doctor
```

  </Accordion>

  <Accordion title="Mensagens de DM ignoradas">
    Verifique:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (ou legado `channels.slack.dm.policy`)
    - aprovações de pareamento / entradas de lista de permissão

```bash
opencraft pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode não conectando">
    Valide tokens de bot + app e habilitação do Socket Mode nas configurações do app Slack.
  </Accordion>

  <Accordion title="Modo HTTP não recebendo eventos">
    Valide:

    - signing secret
    - caminho do webhook
    - Request URLs do Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` único por conta HTTP

  </Accordion>

  <Accordion title="Comandos nativos/slash não disparando">
    Verifique se você pretendia:

    - modo de comando nativo (`channels.slack.commands.native: true`) com comandos slash correspondentes registrados no Slack
    - ou modo de comando slash único (`channels.slack.slashCommand.enabled: true`)

    Também verifique `commands.useAccessGroups` e listas de permissão de canal/usuário.

  </Accordion>
</AccordionGroup>

## Streaming de texto

O OpenCraft suporta streaming de texto nativo do Slack via API de Agentes e Apps de IA.

`channels.slack.streaming` controla o comportamento de prévia ao vivo:

- `off`: desabilitar streaming de prévia ao vivo.
- `partial` (padrão): substituir o texto de prévia pela última saída parcial.
- `block`: anexar atualizações de prévia em chunks.
- `progress`: mostrar texto de status de progresso enquanto gera, depois enviar o texto final.

`channels.slack.nativeStreaming` controla a API de streaming nativo do Slack (`chat.startStream` / `chat.appendStream` / `chat.stopStream`) quando `streaming` é `partial` (padrão: `true`).

Desabilitar o streaming nativo do Slack (manter comportamento de prévia de rascunho):

```yaml
channels:
  slack:
    streaming: partial
    nativeStreaming: false
```

Chaves legadas:

- `channels.slack.streamMode` (`replace | status_final | append`) é migrado automaticamente para `channels.slack.streaming`.
- booleano `channels.slack.streaming` é migrado automaticamente para `channels.slack.nativeStreaming`.

### Requisitos

1. Habilite **Agents and AI Apps** nas configurações do seu app Slack.
2. Certifique-se de que o app tem o escopo `assistant:write`.
3. Um thread de resposta deve estar disponível para aquela mensagem. A seleção de thread ainda segue `replyToMode`.

### Comportamento

- O primeiro chunk de texto inicia um stream (`chat.startStream`).
- Chunks de texto posteriores são anexados ao mesmo stream (`chat.appendStream`).
- O fim da resposta finaliza o stream (`chat.stopStream`).
- Payloads de mídia e não-texto recorrem à entrega normal.
- Se o streaming falhar no meio da resposta, o OpenCraft recorre à entrega normal para os payloads restantes.

## Referências de configuração

Referência principal:

- [Referência de configuração - Slack](/gateway/configuration-reference#slack)

  Campos de alto valor do Slack:
  - modo/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - acesso a DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - toggle de compatibilidade: `dangerouslyAllowNameMatching` (emergencial; mantenha desligado a menos que necessário)
  - acesso a canal: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - threading/histórico: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - ops/recursos: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Relacionados

- [Pareamento](/channels/pairing)
- [Roteamento de canal](/channels/channel-routing)
- [Solução de problemas](/channels/troubleshooting)
- [Configuração](/gateway/configuration)
- [Comandos slash](/tools/slash-commands)
