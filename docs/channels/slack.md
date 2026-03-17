---
summary: "Configuração e comportamento de runtime do Slack (Socket Mode + HTTP Events API)"
read_when:
  - Configurando Slack ou depurando modo socket/HTTP do Slack
title: "Slack"
---

# Slack

Status: pronto para produção para DMs + canais via integrações de app Slack. Modo padrão é Socket Mode; modo HTTP Events API também é suportado.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/channels/pairing">
    DMs do Slack usam modo de pareamento por padrão.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/tools/slash-commands">
    Comportamento de comandos nativos e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/channels/troubleshooting">
    Diagnósticos e manuais de reparo entre canais.
  </Card>
</CardGroup>

## Configuração rápida

<Tabs>
  <Tab title="Socket Mode (padrão)">
    <Steps>
      <Step title="Criar app Slack e Tokens">
        Nas configurações do app Slack:

        - habilite **Socket Mode**
        - crie **App Token** (`xapp-...`) com `connections:write`
        - instale o app e copie o **Bot Token** (`xoxb-...`)
      </Step>

      <Step title="Configurar OpenCraft">

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

      <Step title="Inscrever eventos do app">
        Inscreva eventos do Bot para:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Também habilite a **Aba de Mensagens** do App Home para DMs.
      </Step>

      <Step title="Iniciar Gateway">

```bash
opencraft gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="Modo HTTP Events API">
    <Steps>
      <Step title="Configurar app Slack para HTTP">

        - defina o modo para HTTP (`channels.slack.mode="http"`)
        - copie o **Signing Secret** do Slack
        - defina a Request URL de Event Subscriptions + Interactivity + Slash command para o mesmo caminho de Webhook (padrão `/slack/events`)

      </Step>

      <Step title="Configurar modo HTTP do OpenCraft">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

      </Step>

      <Step title="Usar caminhos de Webhook únicos para múltiplas contas HTTP">
        Modo HTTP por conta é suportado.

        Dê a cada conta um `webhookPath` distinto para que registros não colidam.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Modelo de Token

- `botToken` + `appToken` são necessários para Socket Mode.
- Modo HTTP requer `botToken` + `signingSecret`.
- Tokens de configuração sobrescrevem fallback de env.
- Fallback de env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` aplica-se apenas à conta padrão.
- `userToken` (`xoxp-...`) é apenas via configuração (sem fallback de env) e tem comportamento padrão somente leitura (`userTokenReadOnly: true`).
- Opcional: adicione `chat:write.customize` se quiser que mensagens de saída usem a identidade do agente ativo (`username` e ícone personalizados). `icon_emoji` usa sintaxe `:emoji_name:`.

<Tip>
Para ações/leituras de diretório, o Token de usuário pode ser preferido quando configurado. Para escritas, o Token de Bot permanece preferido; escritas com Token de usuário só são permitidas quando `userTokenReadOnly: false` e o Token de Bot não está disponível.
</Tip>

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de DM">
    `channels.slack.dmPolicy` controla acesso a DM (legado: `channels.slack.dm.policy`):

    - `pairing` (padrão)
    - `allowlist`
    - `open` (requer `channels.slack.allowFrom` incluir `"*"`; legado: `channels.slack.dm.allowFrom`)
    - `disabled`

    Flags de DM:

    - `dm.enabled` (padrão true)
    - `channels.slack.allowFrom` (preferido)
    - `dm.allowFrom` (legado)
    - `dm.groupEnabled` (DMs de grupo padrão false)
    - `dm.groupChannels` (allowlist MPIM opcional)

    Precedência de múltiplas contas:

    - `channels.slack.accounts.default.allowFrom` aplica-se apenas à conta `default`.
    - Contas nomeadas herdam `channels.slack.allowFrom` quando seu próprio `allowFrom` não está definido.
    - Contas nomeadas não herdam `channels.slack.accounts.default.allowFrom`.

    Pareamento em DMs usa `opencraft pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canal">
    `channels.slack.groupPolicy` controla tratamento de canal:

    - `open`
    - `allowlist`
    - `disabled`

    A allowlist de canais fica em `channels.slack.channels` e deve usar IDs de canal estáveis.

    Nota de tempo de execução: se `channels.slack` estiver completamente ausente (configuração apenas via env), o tempo de execução retorna para `groupPolicy="allowlist"` e registra um aviso (mesmo que `channels.defaults.groupPolicy` esteja definido).

    Resolução de nome/ID:

    - entradas da allowlist de canais e de DM são resolvidas na inicialização quando o acesso via Token permite
    - entradas de nome de canal não resolvidas são mantidas como configuradas mas ignoradas para roteamento por padrão
    - autorização de entrada e roteamento de canal são por ID primeiro por padrão; correspondência direta de username/slug requer `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Menções e usuários de canal">
    Mensagens de canal são controladas por menção por padrão.

    Fontes de menção:

    - menção explícita do app (`<@botId>`)
    - padrões regex de menção (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta ao Bot em thread

    Controles por canal (`channels.slack.channels.<id>`; nomes apenas via resolução na inicialização ou `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Formato de chave `toolsBySender`: `id:`, `e164:`, `username:`, `name:`, ou curinga `"*"`
      (chaves legadas sem prefixo ainda mapeiam apenas para `id:`)

  </Tab>
</Tabs>

## Comandos e comportamento de slash

- Modo automático de comandos nativos está **desligado** para o Slack (`commands.native: "auto"` não habilita comandos nativos do Slack).
- Habilite handlers de comandos nativos do Slack com `channels.slack.commands.native: true` (ou global `commands.native: true`).
- Quando comandos nativos estão habilitados, registre comandos slash correspondentes no Slack (nomes `/<command>`), com uma exceção:
  - registre `/agentstatus` para o comando de status (o Slack reserva `/status`)
- Se comandos nativos não estiverem habilitados, você pode executar um único comando slash configurado via `channels.slack.slashCommand`.
- Menus de argumentos nativos agora adaptam sua estratégia de renderização:
  - até 5 opções: blocos de botões
  - 6-100 opções: menu de seleção estático
  - mais de 100 opções: seleção externa com filtragem assíncrona de opções quando handlers de opções de interatividade estão disponíveis
  - se valores de opções codificados excederem limites do Slack, o fluxo retorna para botões
- Para payloads de opções longas, menus de argumentos de comando Slash usam um diálogo de confirmação antes de despachar um valor selecionado.

## Respostas interativas

O Slack pode renderizar controles de resposta interativa criados pelo agente, mas esta funcionalidade está desabilitada por padrão.

Habilite globalmente:

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

Ou habilite para apenas uma conta Slack:

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

Quando habilitado, agentes podem emitir diretivas de resposta específicas do Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Estas diretivas compilam para Slack Block Kit e roteiam cliques ou seleções de volta pelo caminho existente de evento de interação do Slack.

Notas:

- Esta é uma UI específica do Slack. Outros canais não traduzem diretivas do Slack Block Kit para seus próprios sistemas de botões.
- Os valores de callback interativos são Tokens opacos gerados pelo OpenCraft, não valores autorais brutos do agente.
- Se blocos interativos gerados excederem os limites do Slack Block Kit, o OpenCraft retorna para a resposta de texto original em vez de enviar um payload de blocos inválido.

Configurações padrão de comando slash:

- `enabled: false`
- `name: "opencraft"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Sessões slash usam chaves isoladas:

- `agent:<agentId>:slack:slash:<userId>`

e ainda roteiam execução de comando contra a sessão da conversa alvo (`CommandTargetSessionKey`).

## Threads, sessões e tags de resposta

- DMs roteiam como `direct`; canais como `channel`; MPIMs como `group`.
- Com `session.dmScope=main` padrão, DMs do Slack colapsam para sessão principal do agente.
- Sessões de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Respostas em thread podem criar sufixos de sessão de thread (`:thread:<threadTs>`) quando aplicável.
- `channels.slack.thread.historyScope` padrão é `thread`; `thread.inheritParent` padrão é `false`.
- `channels.slack.thread.initialHistoryLimit` controla quantas mensagens existentes de thread são buscadas quando uma nova sessão de thread inicia (padrão `20`; defina `0` para desabilitar).

Controles de thread de resposta:

- `channels.slack.replyToMode`: `off|first|all` (padrão `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- fallback legado para chats diretos: `channels.slack.dm.replyToMode`

Tags de resposta manual são suportadas:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Nota: `replyToMode="off"` desabilita **todos** os threads de resposta no Slack, incluindo tags explícitas `[[reply_to_*]]`. Isso difere do Telegram, onde tags explícitas ainda são respeitadas no modo `"off"`. A diferença reflete os modelos de thread das plataformas: threads do Slack escondem mensagens do canal, enquanto respostas do Telegram permanecem visíveis no fluxo principal do chat.

## Mídia, divisão e entrega

<AccordionGroup>
  <Accordion title="Anexos de entrada">
    Anexos de arquivo do Slack são baixados de URLs privadas hospedadas pelo Slack (fluxo de solicitação autenticado por Token) e gravados no armazenamento de mídia quando o download sucede e os limites de tamanho permitem.

    O limite de tamanho de entrada em tempo de execução padrão é `20MB`, a menos que sobrescrito por `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texto e arquivos de saída">
    - blocos de texto usam `channels.slack.textChunkLimit` (padrão 4000)
    - `channels.slack.chunkMode="newline"` habilita divisão por parágrafo primeiro
    - envio de arquivos usa APIs de upload do Slack e pode incluir respostas em thread (`thread_ts`)
    - limite de mídia de saída segue `channels.slack.mediaMaxMb` quando configurado; caso contrário, envios de canal usam padrões de tipo MIME do pipeline de mídia
  </Accordion>

  <Accordion title="Alvos de entrega">
    Alvos explícitos preferidos:

    - `user:<id>` para DMs
    - `channel:<id>` para canais

    DMs do Slack são abertas via APIs de conversa do Slack ao enviar para alvos de usuário.

  </Accordion>
</AccordionGroup>

## Ações e controles

Ações do Slack são controladas por `channels.slack.actions.*`.

Grupos de ação disponíveis nas ferramentas atuais do Slack:

| Grupo      | Padrão     |
| ---------- | ---------- |
| messages   | habilitado |
| reactions  | habilitado |
| pins       | habilitado |
| memberInfo | habilitado |
| emojiList  | habilitado |

## Eventos e comportamento operacional

- Edições/exclusões/broadcasts de thread de mensagens são mapeados em eventos do sistema.
- Eventos de adicionar/remover reação são mapeados em eventos do sistema.
- Eventos de entrada/saída de membro, canal criado/renomeado e adicionar/remover pin são mapeados em eventos do sistema.
- Atualizações de status de thread do assistente (para indicadores "digitando..." em threads) usam `assistant.threads.setStatus` e requerem escopo de Bot `assistant:write`.
- `channel_id_changed` pode migrar chaves de configuração de canal quando `configWrites` está habilitado.
- Metadados de tópico/propósito do canal são tratados como contexto não confiável e podem ser injetados no contexto de roteamento.
- Ações de bloco e interações modais emitem eventos do sistema estruturados `Slack interaction: ...` com campos de payload ricos:
  - ações de bloco: valores selecionados, rótulos, valores de seletor e metadados `workflow_*`
  - eventos modais `view_submission` e `view_closed` com metadados de canal roteado e entradas de formulário

## Reações de confirmação

`ackReaction` envia um emoji de confirmação enquanto o OpenCraft está processando uma mensagem de entrada.

Ordem de resolução:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback de emoji de identidade do agente (`agents.list[].identity.emoji`, senão "👀")

Notas:

- O Slack espera shortcodes (por exemplo `"eyes"`).
- Use `""` para desabilitar a reação para a conta Slack ou globalmente.

## Fallback de reação de digitação

`typingReaction` adiciona uma reação temporária à mensagem Slack de entrada enquanto o OpenCraft está processando uma resposta, depois a remove quando a execução termina. Este é um fallback útil quando a digitação nativa do assistente do Slack não está disponível, especialmente em DMs.

Ordem de resolução:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notas:

- O Slack espera shortcodes (por exemplo `"hourglass_flowing_sand"`).
- A reação é de melhor esforço e a limpeza é tentada automaticamente após a resposta ou caminho de falha ser completado.

## Manifesto e checklist de escopos

<AccordionGroup>
  <Accordion title="Exemplo de manifesto do app Slack">

```json
{
  "display_information": {
    "name": "OpenCraft",
    "description": "Slack connector for OpenCraft"
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
        "description": "Send a message to OpenCraft",
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

  <Accordion title="Escopos opcionais de Token de usuário (operações de leitura)">
    Se você configurar `channels.slack.userToken`, escopos típicos de leitura são:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (se você depende de leituras de busca do Slack)

  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Sem respostas em canais">
    Verifique, em ordem:

    - `groupPolicy`
    - allowlist de canais (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` por canal

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
    - aprovações de pareamento / entradas de allowlist

```bash
opencraft pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode não conectando">
    Valide Tokens de Bot + app e habilitação do Socket Mode nas configurações do app Slack.
  </Accordion>

  <Accordion title="Modo HTTP não recebendo eventos">
    Valide:

    - signing secret
    - caminho do Webhook
    - Request URLs do Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` único por conta HTTP

  </Accordion>

  <Accordion title="Comandos nativos/slash não disparando">
    Verifique se você pretendia:

    - modo de comando nativo (`channels.slack.commands.native: true`) com comandos slash correspondentes registrados no Slack
    - ou modo de comando slash único (`channels.slack.slashCommand.enabled: true`)

    Também verifique `commands.useAccessGroups` e allowlists de canal/usuário.

  </Accordion>
</AccordionGroup>

## Streaming de texto

O OpenCraft suporta streaming de texto nativo do Slack via Agents and AI Apps API.

`channels.slack.streaming` controla o comportamento de preview ao vivo:

- `off`: desabilitar streaming de preview ao vivo.
- `partial` (padrão): substituir texto de preview com a saída parcial mais recente.
- `block`: anexar atualizações de preview em blocos.
- `progress`: mostrar texto de status de progresso enquanto gera, depois enviar texto final.

`channels.slack.nativeStreaming` controla a API de streaming nativa do Slack (`chat.startStream` / `chat.appendStream` / `chat.stopStream`) quando `streaming` é `partial` (padrão: `true`).

Desabilitar streaming nativo do Slack (manter comportamento de preview de rascunho):

```yaml
channels:
  slack:
    streaming: partial
    nativeStreaming: false
```

Chaves legadas:

- `channels.slack.streamMode` (`replace | status_final | append`) é auto-migrado para `channels.slack.streaming`.
- booleano `channels.slack.streaming` é auto-migrado para `channels.slack.nativeStreaming`.

### Requisitos

1. Habilite **Agents and AI Apps** nas configurações do seu app Slack.
2. Certifique-se de que o app tem o escopo `assistant:write`.
3. Um thread de resposta deve estar disponível para aquela mensagem. A seleção de thread ainda segue `replyToMode`.

### Comportamento

- Primeiro bloco de texto inicia um stream (`chat.startStream`).
- Blocos de texto posteriores anexam ao mesmo stream (`chat.appendStream`).
- Fim da resposta finaliza o stream (`chat.stopStream`).
- Mídia e payloads não textuais retornam para entrega normal.
- Se o streaming falhar no meio da resposta, o OpenCraft retorna para entrega normal para payloads restantes.

## Referências de configuração

Referência principal:

- [Referência de configuração - Slack](/gateway/configuration-reference#slack)

  Campos de alta relevância do Slack:
  - modo/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - acesso a DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - toggle de compatibilidade: `dangerouslyAllowNameMatching` (emergência; mantenha desligado a menos que necessário)
  - acesso a canal: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - threading/histórico: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - ops/funcionalidades: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Relacionados

- [Pairing](/channels/pairing)
- [Channel routing](/channels/channel-routing)
- [Troubleshooting](/channels/troubleshooting)
- [Configuration](/gateway/configuration)
- [Slash commands](/tools/slash-commands)
