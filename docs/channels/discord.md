---
summary: "Status de suporte do bot Discord, capacidades e configuração"
read_when:
  - Trabalhando em recursos do canal Discord
title: "Discord"
---

# Discord (Bot API)

Status: pronto para DMs e canais de guild via gateway oficial do Discord.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/channels/pairing">
    DMs do Discord usam padrão de modo pareamento.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/tools/slash-commands">
    Comportamento de comando nativo e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas do canal" icon="wrench" href="/channels/troubleshooting">
    Fluxo de diagnóstico entre canais e reparo.
  </Card>
</CardGroup>

## Configuração rápida

Você precisará criar um novo aplicativo com um bot, adicionar o bot ao seu servidor e pareá-lo ao OpenCraft. Recomendamos adicionar seu bot ao seu próprio servidor privado. Se você não tiver um ainda, [crie um primeiro](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (escolha **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crie um aplicativo Discord e bot">
    Vá para o [Portal de Desenvolvedor Discord](https://discord.com/developers/applications) e clique em **New Application**. Nomeie como algo tipo "OpenCraft".

    Clique em **Bot** na barra lateral. Defina o **Username** para o que você chama seu agente OpenCraft.

  </Step>

  <Step title="Habilite intents privilegiados">
    Ainda na página **Bot**, role para baixo até **Privileged Gateway Intents** e habilite:

    - **Message Content Intent** (necessário)
    - **Server Members Intent** (recomendado; necessário para allowlists de função e matching de nome para ID)
    - **Presence Intent** (opcional; apenas necessário para atualizações de presença)

  </Step>

  <Step title="Copie seu token de bot">
    Role para trás na página **Bot** e clique em **Reset Token**.

    <Note>
    Apesar do nome, isso gera seu primeiro token — nada está sendo "resetado."
    </Note>

    Copie o token e salve em algum lugar. Este é seu **Bot Token** e você precisará dele em breve.

  </Step>

  <Step title="Gere uma URL de convite e adicione o bot ao seu servidor">
    Clique em **OAuth2** na barra lateral. Você gerará uma URL de convite com as permissões corretas para adicionar o bot ao seu servidor.

    Role para baixo até **OAuth2 URL Generator** e habilite:

    - `bot`
    - `applications.commands`

    Uma seção **Bot Permissions** aparecerá abaixo. Habilite:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opcional)

    Copie a URL gerada na base, cole em seu navegador, selecione seu servidor e clique em **Continue** para conectar. Você deve agora ver seu bot no servidor Discord.

  </Step>

  <Step title="Habilite Developer Mode e colete seus IDs">
    De volta no aplicativo Discord, você precisa habilitar Developer Mode para poder copiar IDs internos.

    1. Clique em **User Settings** (ícone de engrenagem ao lado do seu avatar) → **Advanced** → alterne **Developer Mode**
    2. Clique com botão direito no **ícone do seu servidor** na barra lateral → **Copy Server ID**
    3. Clique com botão direito no **seu avatar** → **Copy User ID**

    Salve seu **Server ID** e **User ID** junto com seu Bot Token — você enviará todos os três ao OpenCraft no próximo passo.

  </Step>

  <Step title="Permita DMs dos membros do servidor">
    Para pareamento funcionar, Discord precisa permitir que seu bot o DM. Clique com botão direito no **ícone do seu servidor** → **Privacy Settings** → alterne **Direct Messages**.

    Isso permite que membros do servidor (incluindo bots) o enviem DMs. Mantenha isso habilitado se quiser usar DMs do Discord com OpenCraft. Se você planeja apenas usar canais de guild, você pode desabilitar DMs após pareamento.

  </Step>

  <Step title="Passo 0: Defina seu token de bot com segurança (não o envie em chat)">
    Seu token de bot Discord é um segredo (como uma senha). Defina-o na máquina executando OpenCraft antes de enviar mensagens ao seu agente.

```bash
opencraft config set channels.discord.token '"YOUR_BOT_TOKEN"' --json
opencraft config set channels.discord.enabled true --json
opencraft gateway
```

    Se OpenCraft já está em execução como serviço de background, use `opencraft gateway restart` em vez disso.

  </Step>

  <Step title="Configure OpenCraft e pareie">

    <Tabs>
      <Tab title="Peça ao seu agente">
        Converse com seu agente OpenCraft em qualquer canal existente (ex: Telegram) e diga. Se Discord for seu primeiro canal, use a guia CLI / config em vez disso.

        > "Já defini meu token de bot Discord em config. Por favor finalize configuração do Discord com User ID `<user_id>` e Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Se você prefere configuração baseada em arquivo, defina:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "YOUR_BOT_TOKEN",
    },
  },
}
```

        Fallback de env para a conta padrão:

```bash
DISCORD_BOT_TOKEN=...
```

        Valores SecretRef também são suportados para `channels.discord.token` (provedores env/arquivo/exec). Veja [Gerenciamento de Segredos](/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Aprove primeiro pareamento de DM">
    Aguarde até que o gateway esteja em execução, então DM seu bot no Discord. Ele responderá com um código de pareamento.

    <Tabs>
      <Tab title="Peça ao seu agente">
        Envie o código de pareamento ao seu agente em seu canal existente:

        > "Aprove este código de pareamento do Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
opencraft pairing list discord
opencraft pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Códigos de pareamento expiram após 1 hora.

    Você deve agora conseguir conversar com seu agente no Discord via DM.

  </Step>
</Steps>

<Note>
Resolução de token é ciente de conta. Valores de token config vencem sobre fallback de env. `DISCORD_BOT_TOKEN` é usado apenas para a conta padrão.
Para chamadas de saída avançadas (ferramenta de mensagem/ações de canal), um `token` explícito por chamada é usado para essa chamada. Configurações de política/retry de conta ainda vêm da conta selecionada no snapshot de tempo de execução ativo.
</Note>

## Recomendado: Configure um espaço de trabalho de guild

Uma vez que DMs estão funcionando, você pode configurar seu servidor Discord como espaço de trabalho completo onde cada canal obtém sua própria sessão de agente com seu próprio contexto. Isto é recomendado para servidores privados onde é apenas você e seu bot.

<Steps>
  <Step title="Adicione seu servidor à lista de permissões de guild">
    Isto habilita seu agente a responder em qualquer canal em seu servidor, não apenas DMs.

    <Tabs>
      <Tab title="Peça ao seu agente">
        > "Adicione meu Server ID do Discord `<server_id>` à lista de permissões de guild"
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Permita respostas sem @mention">
    Por padrão, seu agente apenas responde em canais de guild quando @mencionado. Para um servidor privado, você provavelmente quer que responda a toda mensagem.

    <Tabs>
      <Tab title="Peça ao seu agente">
        > "Permita que meu agente responda neste servidor sem ter que ser @mencionado"
      </Tab>
      <Tab title="Config">
        Defina `requireMention: false` em sua config de guild:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planeje memória em canais de guild">
    Por padrão, memória de longo prazo (MEMORY.md) apenas carrega em sessões de DM. Canais de guild não carregam MEMORY.md automaticamente.

    <Tabs>
      <Tab title="Peça ao seu agente">
        > "Quando eu fizer perguntas em canais Discord, use memory_search ou memory_get se você precisar de contexto de longo prazo de MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Se você precisa de contexto compartilhado em todo canal, coloque as instruções estáveis em `AGENTS.md` ou `USER.md` (elas são injetadas para toda sessão). Mantenha notas de longo prazo em `MEMORY.md` e acesse-as sob demanda com ferramentas de memória.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Agora crie alguns canais em seu servidor Discord e comece a conversar. Seu agente pode ver o nome do canal e cada canal obtém sua própria sessão isolada — então você pode configurar `#coding`, `#home`, `#research` ou o que encaixa seu workflow.

## Modelo de tempo de execução

- Gateway possui a conexão Discord.
- Roteamento de resposta é determinístico: entrada Discord responde para Discord.
- Por padrão (`session.dmScope=main`), chats diretos compartilham a sessão principal do agente (`agent:main:main`).
- Canais de guild são chaves de sessão isoladas (`agent:<agentId>:discord:channel:<channelId>`).
- Grupo DMs são ignorados por padrão (`channels.discord.dm.groupEnabled=false`).
- Comandos slash nativos rodam em sessões de comando isoladas (`agent:<agentId>:discord:slash:<userId>`), enquanto ainda carregam `CommandTargetSessionKey` para a sessão de conversa roteada.

## Canais de fórum

Canais de fórum e mídia Discord apenas aceitam posts de thread. OpenCraft suporta duas formas de criá-los:

- Envie uma mensagem para o pai do fórum (`channel:<forumId>`) para auto-criar uma thread. O título da thread usa a primeira linha não-vazia da sua mensagem.
- Use `opencraft message thread create` para criar uma thread diretamente. Não passe `--message-id` para canais de fórum.

Exemplo: enviar para pai do fórum para criar uma thread

```bash
opencraft message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Exemplo: criar thread de fórum explicitamente

```bash
opencraft message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Pais do fórum não aceitam componentes Discord. Se você precisar de componentes, envie para a thread em si (`channel:<threadId>`).

## Componentes interativos

OpenCraft suporta contêineres de componentes Discord v2 para mensagens de agente. Use a ferramenta de mensagem com payload `components`. Resultados de interação são roteados de volta ao agente como mensagens de entrada normais e seguem as configurações `replyToMode` do Discord existentes.

Blocos suportados:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Linhas de ação permitem até 5 botões ou um único menu de seleção
- Tipos de seleção: `string`, `user`, `role`, `mentionable`, `channel`

Por padrão, componentes são único uso. Defina `components.reusable=true` para permitir que botões, seleções e formulários sejam usados múltiplas vezes até expirar.

Para restringir quem pode clicar um botão, defina `allowedUsers` naquele botão (IDs de usuário Discord, tags ou `*`). Quando configurado, usuários não correspondentes recebem negação efêmera.

Os comandos slash `/model` e `/models` abrem um seletor de modelo interativo com dropdowns de provedor e modelo mais um passo Submit. A resposta do seletor é efêmera e apenas o usuário invocador pode usá-la.

Anexos de arquivo:

- blocos `file` devem apontar para referência de anexo (`attachment://<filename>`)
- Forneça o anexo via `media`/`path`/`filePath` (arquivo único); use `media-gallery` para múltiplos arquivos
- Use `filename` para substituir o nome de upload quando deve corresponder à referência de anexo

Formulários modal:

- Adicione `components.modal` com até 5 campos
- Tipos de campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenCraft adiciona um botão de acionamento automaticamente

Exemplo:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de DM">
    `channels.discord.dmPolicy` controla acesso a DM (legado: `channels.discord.dm.policy`):

    - `pairing` (padrão)
    - `allowlist`
    - `open` (requer `channels.discord.allowFrom` para incluir `"*"`; legado: `channels.discord.dm.allowFrom`)
    - `disabled`

    Se a política de DM não é open, usuários desconhecidos são bloqueados (ou solicitados para pareamento em modo `pairing`).

    Precedência de multi-conta:

    - `channels.discord.accounts.default.allowFrom` se aplica apenas à conta `default`.
    - Contas nomeadas herdam `channels.discord.allowFrom` quando seu próprio `allowFrom` não está definido.
    - Contas nomeadas não herdam `channels.discord.accounts.default.allowFrom`.

    Formato de alvo de DM para entrega:

    - `user:<id>`
    - menção `<@id>`

    IDs numéricos nus são ambíguos e rejeitados a menos que um tipo de alvo de usuário/canal explícito seja fornecido.

  </Tab>

  <Tab title="Política de guild">
    O tratamento de guild é controlado por `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Baseline seguro quando `channels.discord` existe é `allowlist`.

    Comportamento de `allowlist`:

    - guild deve corresponder a `channels.discord.guilds` (id preferido, slug aceito)
    - allowlists de remetente opcionais: `users` (IDs estáveis recomendados) e `roles` (apenas IDs de role); se qualquer um estiver configurado, remetentes são permitidos quando correspondem a `users` OU `roles`
    - matching de nome/tag direto é desabilitado por padrão; habilite `channels.discord.dangerouslyAllowNameMatching: true` apenas como modo de compatibilidade de break-glass
    - nomes/tags são suportados para `users`, mas IDs são mais seguros; `opencraft security audit` avisa quando entradas de nome/tag são usadas
    - se uma guild tem `channels` configurado, canais não listados são negados
    - se uma guild não tem bloco `channels`, todos os canais naquela guild permitida são permitidos

    Exemplo:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Se você apenas define `DISCORD_BOT_TOKEN` e não cria bloco `channels.discord`, fallback de tempo de execução é `groupPolicy="allowlist"` (com aviso em logs), mesmo se `channels.defaults.groupPolicy` for `open`.

  </Tab>

  <Tab title="Menções e DMs de grupo">
    Mensagens de guild são mention-gated por padrão.

    Detecção de menção inclui:

    - menção explícita de bot
    - padrões de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta-ao-bot em casos suportados

    `requireMention` é configurado por guild/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcionalmente descarta mensagens que mencionam outro usuário/role mas não o bot (excluindo @everyone/@here).

    DMs de grupo:

    - padrão: ignorado (`dm.groupEnabled=false`)
    - allowlist opcional via `dm.groupChannels` (IDs de canal ou slugs)

  </Tab>
</Tabs>

### Roteamento de agente baseado em role

Use `bindings[].match.roles` para rotear membros de guild Discord para agentes diferentes por ID de role. Ligações baseadas em role aceitam apenas IDs de role e são avaliadas após ligações de peer ou parent-peer e antes de ligações apenas de guild. Se uma ligação também define outros campos de match (por exemplo `peer` + `guildId` + `roles`), todos os campos configurados devem corresponder.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Configuração do Portal de Desenvolvedores

<AccordionGroup>
  <Accordion title="Criar app e bot">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Copie token do bot

  </Accordion>

  <Accordion title="Intents privilegiados">
    Em **Bot -> Privileged Gateway Intents**, habilite:

    - Message Content Intent
    - Server Members Intent (recomendado)

    Presence intent é opcional e apenas necessário se quiser receber atualizações de presença. Definir presença do bot (`setPresence`) não requer habilitar atualizações de presença para membros.

  </Accordion>

  <Accordion title="Escopos OAuth e permissões de baseline">
    Gerador de URL OAuth:

    - escopos: `bot`, `applications.commands`

    Permissões de baseline típicas:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opcional)

    Evite `Administrator` a menos que explicitamente necessário.

  </Accordion>

  <Accordion title="Copiar IDs">
    Habilite Discord Developer Mode, então copie:

    - server ID
    - channel ID
    - user ID

    Prefira IDs numéricos em config OpenCraft para audits confiáveis e sondas.

  </Accordion>
</AccordionGroup>

## Comandos nativos e auth de comando

- `commands.native` usa padrão `"auto"` e é habilitado para Discord.
- Substituição por canal: `channels.discord.commands.native`.
- `commands.native=false` explicitamente limpa comandos nativos Discord previamente registrados.
- Auth de comando nativo usa as mesmas listas de permissões/políticas do Discord que manipulação normal de mensagem.
- Comandos podem ainda ser visíveis em UI Discord para usuários que não estão autorizados; execução ainda força auth OpenCraft e retorna "not authorized".

Veja [Comandos Slash](/tools/slash-commands) para catálogo de comando e comportamento.

Configurações de comando slash padrão:

- `ephemeral: true`

## Detalhes de recursos

<AccordionGroup>
  <Accordion title="Etiquetas de resposta e respostas nativas">
    Discord suporta etiquetas de resposta em saída de agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controlado por `channels.discord.replyToMode`:

    - `off` (padrão)
    - `first`
    - `all`

    Nota: `off` desabilita threading de resposta implícita. Etiquetas `[[reply_to_*]]` explícitas ainda são honradas.

    IDs de mensagem são surface em contexto/histórico para que agentes possam alvejar mensagens específicas.

  </Accordion>

  <Accordion title="Visualização ao vivo">
    OpenCraft pode transmitir respostas de rascunho enviando uma mensagem temporária e editando-a conforme texto chega.

    - `channels.discord.streaming` controla transmissão de visualização (`off` | `partial` | `block` | `progress`, padrão: `off`).
    - `progress` é aceito para consistência entre canais e mapeia para `partial` no Discord.
    - `channels.discord.streamMode` é um alias legado e é auto-migrado.
    - `partial` edita uma única mensagem de visualização conforme tokens chegam.
    - `block` emite chunks do tamanho do rascunho (use `draftChunk` para sintonizar tamanho e pontos de quebra).

    Exemplo:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    Chunking padrão de modo `block` (preso a `channels.discord.textChunkLimit`):

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    Transmissão de visualização é apenas texto; respostas de mídia retornam para entrega normal.

    Nota: transmissão de visualização é separada de transmissão de bloco. Quando transmissão de bloco é explicitamente
    habilitada para Discord, OpenCraft pula a transmissão de visualização para evitar dupla transmissão.

  </Accordion>

  <Accordion title="Histórico, contexto e comportamento de thread">
    Contexto de histórico de guild:

    - `channels.discord.historyLimit` padrão `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desativa

    Controles de histórico de DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento de thread:

    - Threads Discord são roteadas como sessões de canal
    - metadados de thread pai podem ser usados para linkage de sessão pai
    - config de thread herda config de canal pai a menos que entrada específica de thread exista

    Tópicos de canal são injetados como contexto **não confiável** (não como prompt de sistema).

  </Accordion>

  <Accordion title="Sessões ligadas a thread para subagentes">
    Discord pode ligar uma thread a um alvo de sessão para que mensagens subsequentes naquela thread mantenham roteamento para a mesma sessão (incluindo sessões de subagente).

    Comandos:

    - `/focus <target>` ligar thread atual/nova a alvo de subagente/sessão
    - `/unfocus` remover ligação de thread atual
    - `/agents` mostrar execuções ativas e estado de ligação
    - `/session idle <duration|off>` inspecionar/atualizar auto-unfocus de inatividade para ligações focadas
    - `/session max-age <duration|off>` inspecionar/atualizar hard max age para ligações focadas

    Config:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Notas:

    - `session.threadBindings.*` define padrões globais.
    - `channels.discord.threadBindings.*` substitui comportamento Discord.
    - `spawnSubagentSessions` deve ser true para auto-criar/ligar threads para `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` deve ser true para auto-criar/ligar threads para ACP (`/acp spawn ... --thread ...` ou `sessions_spawn({ runtime: "acp", thread: true })`).
    - Se thread bindings estão desabilitados para uma conta, `/focus` e operações de ligação de thread relacionadas estão indisponíveis.

    Veja [Sub-agentes](/tools/subagents), [Agentes ACP](/tools/acp-agents) e [Referência de Configuração](/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Ligações persistentes de canal ACP">
    Para espaços de trabalho ACP estáveis "sempre ligados", configure ligações ACP digitadas de nível superior direcionando conversas Discord.

    Caminho de config:

    - `bindings[]` com `type: "acp"` e `match.channel: "discord"`

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
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Notas:

    - Mensagens de thread podem herdar ligação ACP de canal pai.
    - Em um canal ou thread ligado, `/new` e `/reset` resetam a mesma sessão ACP no lugar.
    - Ligações de thread temporárias ainda funcionam e podem substituir resolução de alvo enquanto ativas.

    Veja [Agentes ACP](/tools/acp-agents) para detalhes de comportamento de ligação.

  </Accordion>

  <Accordion title="Notificações de reação">
    Modo de notificação de reação por guild:

    - `off`
    - `own` (padrão)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Eventos de reação são transformados em eventos de sistema e anexados à sessão Discord roteada.

  </Accordion>

  <Accordion title="Reações de reconhecimento">
    `ackReaction` envia um emoji de reconhecimento enquanto OpenCraft está processando uma mensagem de entrada.

    Ordem de resolução:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback de emoji de identidade do agente (`agents.list[].identity.emoji`, senão "👀")

    Notas:

    - Discord aceita emoji unicode ou nomes de emoji personalizados.
    - Use `""` para desabilitar a reação para um canal ou conta.

  </Accordion>

  <Accordion title="Gravações de config">
    Gravações de config iniciadas por canal são habilitadas por padrão.

    Isto afeta fluxos `/config set|unset` (quando recursos de comando estão habilitados).

    Desabilitar:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Proxy do gateway">
    Roteia tráfego WebSocket de gateway Discord e lookups REST de inicialização (ID de aplicativo + resolução de allowlist) através de proxy HTTP(S) com `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Substituição por conta:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Suporte PluralKit">
    Habilite resolução PluralKit para mapear mensagens proxiadas para identidade de membro do sistema:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // opcional; necessário para sistemas privados
      },
    },
  },
}
```

    Notas:

    - allowlists podem usar `pk:<memberId>`
    - nomes de exibição de membro são correspondidos por nome/slug apenas quando `channels.discord.dangerouslyAllowNameMatching: true`
    - lookups usam ID de mensagem original e são constrangidos por janela de tempo
    - se lookup falhar, mensagens proxiadas são tratadas como mensagens de bot e descartadas a menos que `allowBots=true`

  </Accordion>

  <Accordion title="Configuração de presença">
    Atualizações de presença são aplicadas quando você define um campo de status ou atividade, ou quando você habilita auto presença.

    Exemplo de status apenas:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Exemplo de atividade (status personalizado é o tipo de atividade padrão):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    Exemplo de transmissão:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/opencraft",
    },
  },
}
```

    Mapa de tipo de atividade:

    - 0: Playing
    - 1: Streaming (requer `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (usa texto de atividade como estado de status; emoji é opcional)
    - 5: Competing

    Exemplo de presença auto (sinal de saúde de tempo de execução):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    Auto presença mapeia disponibilidade de tempo de execução para status Discord: saudável => online, degradado ou desconhecido => idle, exaurido ou indisponível => dnd. Substituições de texto opcionais:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (suporta placeholder `{reason}`)

  </Accordion>

  <Accordion title="Aprovações exec no Discord">
    Discord suporta aprovações exec baseadas em botão em DMs e pode opcionalmente postar prompts de aprovação no canal originário.

    Caminho de config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Quando `target` é `channel` ou `both`, o prompt de aprovação é visível no canal. Apenas aprovadores configurados podem usar os botões; outros usuários recebem negação efêmera. Prompts de aprovação incluem o texto de comando, então apenas habilite entrega de canal em canais/tópicos confiáveis. Se o ID de canal não puder ser derivado da chave de sessão, OpenCraft retorna para entrega de DM.

    Auth de gateway para este handler usa o mesmo contrato de resolução de credencial compartilhado que outros clientes Gateway:

    - auth local priorizando env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` então `gateway.auth.*`)
    - em modo local, `gateway.remote.*` pode ser usado como fallback apenas quando `gateway.auth.*` não está definido; SecretRefs configuradas mas não resolvidas locais falham fechadas
    - suporte de modo remoto via `gateway.remote.*` quando aplicável
    - substituições de URL são override-seguras: substituições CLI não reutilizam credenciais implícitas e substituições de env usam apenas credenciais de env

    Se aprovações falharem com IDs de aprovação desconhecidos, verifique lista de aprovador e habilitação de recurso.

    Documentos relacionados: [Aprovações exec](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Ferramentas e portões de ação

Ações de mensagem Discord incluem messaging, administração de canal, moderação, presença e ações de metadados.

Exemplos principais:

- messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reações: `react`, `reactions`, `emojiList`
- moderação: `timeout`, `kick`, `ban`
- presença: `setPresence`

Portões de ação vivem sob `channels.discord.actions.*`.

Comportamento padrão de portão:

| Grupo de ação                                                                                                                                                             | Padrão   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reações, mensagens, threads, pins, pesquisas, search, memberInfo, roleInfo, channelInfo, canais, voiceStatus, eventos, stickers, emojiUploads, stickerUploads, permissões | habilitado  |
| roles                                                                                                                                                                    | desabilitado |
| moderação                                                                                                                                                               | desabilitado |
| presença                                                                                                                                                                 | desabilitado |

## UI Componentes v2

OpenCraft usa componentes Discord v2 para aprovações exec e marcadores entre contextos. Ações de mensagem Discord também podem aceitar `components` para UI personalizado (avançado; requer instâncias de componente Carbon), enquanto `embeds` legados permanecem disponíveis mas não são recomendados.

- `channels.discord.ui.components.accentColor` define a cor de acento usada por contêineres de componente Discord (hex).
- Defina por conta com `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` são ignorados quando componentes v2 estão presentes.

Exemplo:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Canais de voz

OpenCraft pode entrar em canais de voz Discord para conversas contínuas e em tempo real. Isto é separado de anexos de mensagens de voz.

Requisitos:

- Habilite comandos nativos (`commands.native` ou `channels.discord.commands.native`).
- Configure `channels.discord.voice`.
- O bot precisa de permissões Connect + Speak no canal de voz alvo.

Use o comando nativo apenas Discord `/vc join|leave|status` para controlar sessões. O comando usa o agente padrão de conta e segue as mesmas regras de allowlist e política de grupo que outros comandos Discord.

Exemplo de auto-join:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

Notas:

- `voice.tts` substitui `messages.tts` para playback de voz apenas.
- Turnos de transcrição de voz derivam status de proprietário de Discord `allowFrom` (ou `dm.allowFrom`); falantes não-proprietário não podem acessar ferramentas apenas de proprietário (por exemplo `gateway` e `cron`).
- Voz é habilitado por padrão; defina `channels.discord.voice.enabled=false` para desabilitar.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` passam para `@discordjs/voice` join options.
- Padrões `@discordjs/voice` são `daveEncryption=true` e `decryptionFailureTolerance=24` se não definido.
- OpenCraft também observa falhas de decrypt de recebimento e auto-recupera saindo/rejuntando o canal de voz após falhas repetidas em uma janela curta.
- Se logs de recebimento repetidamente mostram `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, isto pode ser o bug de recebimento upstream `@discordjs/voice` rastreado em [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Mensagens de voz

Mensagens de voz Discord mostram visualização de onda e requerem áudio OGG/Opus mais metadados. OpenCraft gera a onda automaticamente, mas precisa de `ffmpeg` e `ffprobe` disponíveis no host do gateway para inspecionar e converter arquivos de áudio.

Requisitos e restrições:

- Forneça um **caminho de arquivo local** (URLs são rejeitadas).
- Omita conteúdo de texto (Discord não permite texto + mensagem de voz no mesmo payload).
- Qualquer formato de áudio é aceito; OpenCraft converte para OGG/Opus quando necessário.

Exemplo:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Usou intents não permitidos ou bot não vê mensagens de guild">

    - habilite Message Content Intent
    - habilite Server Members Intent quando você depende de resolução de usuário/membro
    - reinicie gateway após mudar intents

  </Accordion>

  <Accordion title="Mensagens de guild bloqueadas inesperadamente">

    - verifique `groupPolicy`
    - verifique allowlist de guild em `channels.discord.guilds`
    - se mapa de `channels` de guild existe, apenas canais listados são permitidos
    - verifique comportamento de `requireMention` e padrões de menção

    Verificações úteis:

```bash
opencraft doctor
opencraft channels status --probe
opencraft logs --follow
```

  </Accordion>

  <Accordion title="Require mention false mas ainda bloqueado">
    Causas comuns:

    - `groupPolicy="allowlist"` sem allowlist de guild/canal correspondente
    - `requireMention` configurado no lugar errado (deve estar em `channels.discord.guilds` ou entrada de canal)
    - remetente bloqueado por allowlist de `users`/canal `users` de guild

  </Accordion>

  <Accordion title="Handlers de longa execução expiram ou respostas duplicadas">

    Logs típicos:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Knob de orçamento de ouvinte:

    - single-account: `channels.discord.eventQueue.listenerTimeout`
    - multi-account: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Knob de timeout de execução de worker:

    - single-account: `channels.discord.inboundWorker.runTimeoutMs`
    - multi-account: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - padrão: `1800000` (30 minutos); defina `0` para desabilitar

    Baseline recomendado:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Use `eventQueue.listenerTimeout` para configuração de ouvinte lento e `inboundWorker.runTimeoutMs`
    apenas se você quer uma válvula de segurança separada para turnos de agente enfileirados.

  </Accordion>

  <Accordion title="Mismatches de auditoria de permissões">
    `channels status --probe` verificações de permissão apenas funcionam para IDs de canal numéricos.

    Se você usa chaves de slug, matching de tempo de execução ainda pode funcionar, mas sondagem não pode verificar completamente permissões.

  </Accordion>

  <Accordion title="Problemas de DM e pareamento">

    - DM desabilitado: `channels.discord.dm.enabled=false`
    - política de DM desabilitada: `channels.discord.dmPolicy="disabled"` (legado: `channels.discord.dm.policy`)
    - aguardando aprovação de pareamento em modo `pairing`

  </Accordion>

  <Accordion title="Loops de bot para bot">
    Por padrão, mensagens criadas por bot são ignoradas.

    Se você definir `channels.discord.allowBots=true`, use regras de menção rígidas e allowlist para evitar comportamento de loop.
    Prefira `channels.discord.allowBots="mentions"` para apenas aceitar mensagens de bot que mencionam o bot.

  </Accordion>

  <Accordion title="Drops STT de voz com DecryptionFailed(...)">

    - mantenha OpenCraft atual (`opencraft update`) para que a lógica de recuperação de recebimento de voz Discord esteja presente
    - confirme `channels.discord.voice.daveEncryption=true` (padrão)
    - comece de `channels.discord.voice.decryptionFailureTolerance=24` (padrão upstream) e sintonize apenas se necessário
    - observe logs para:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se falhas continuarem após rejoin automático, colete logs e compare contra [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Ponteiros de referência de configuração

Referência primária:

- [Referência de configuração - Discord](/gateway/configuration-reference#discord)

Campos de alto sinal do Discord:

- inicialização/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- fila de eventos: `eventQueue.listenerTimeout` (orçamento de ouvinte), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker de entrada: `inboundWorker.runTimeoutMs`
- resposta/histórico: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- transmissão: `streaming` (alias legado: `streamMode`), `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- mídia/retry: `mediaMaxMb`, `retry`
  - `mediaMaxMb` limpa uploads Discord de saída (padrão: `8MB`)
- ações: `actions.*`
- presença: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- recursos: `threadBindings`, `bindings[]` de nível superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Segurança e operações

- Trate tokens de bot como segredos (`DISCORD_BOT_TOKEN` preferido em ambientes supervisionados).
- Conceda permissões Discord de menor privilégio.
- Se deploy/estado de comando está obsoleto, reinicie gateway e re-verifique com `opencraft channels status --probe`.

## Relacionados

- [Pareamento](/channels/pairing)
- [Roteamento de canal](/channels/channel-routing)
- [Roteamento multi-agente](/concepts/multi-agent)
- [Solução de problemas](/channels/troubleshooting)
- [Comandos Slash](/tools/slash-commands)
