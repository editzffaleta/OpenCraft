---
summary: "Status de suporte ao bot Discord, capacidades e configuração"
read_when:
  - Trabalhando em recursos do canal Discord
title: "Discord"
---

# Discord (Bot API)

Status: pronto para DMs e canais de guilda via gateway oficial do Discord.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/channels/pairing">
    DMs do Discord usam modo de pareamento por padrão.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/tools/slash-commands">
    Comportamento de comando nativo e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas de canal" icon="wrench" href="/channels/troubleshooting">
    Diagnósticos entre canais e fluxo de reparo.
  </Card>
</CardGroup>

## Configuração rápida

Você precisará criar um novo aplicativo com um bot, adicionar o bot ao seu servidor e pareá-lo com o OpenCraft. Recomendamos adicionar seu bot ao seu próprio servidor privado. Se ainda não tiver um, [crie um primeiro](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (escolha **Create My Own > For me and my friends**).

<Steps>
  <Step title="Criar um aplicativo e bot no Discord">
    Vá ao [Portal do Desenvolvedor do Discord](https://discord.com/developers/applications) e clique em **New Application**. Nomeie como "OpenCraft".

    Clique em **Bot** na barra lateral. Defina o **Username** com o nome que você chama seu agente OpenCraft.

  </Step>

  <Step title="Habilitar intenções privilegiadas">
    Ainda na página **Bot**, role para baixo até **Privileged Gateway Intents** e habilite:

    - **Message Content Intent** (obrigatório)
    - **Server Members Intent** (recomendado; obrigatório para listas de permissão por função e correspondência nome-para-ID)
    - **Presence Intent** (opcional; só necessário para atualizações de presença)

  </Step>

  <Step title="Copiar seu token de bot">
    Role de volta para cima na página **Bot** e clique em **Reset Token**.

    <Note>
    Apesar do nome, isso gera seu primeiro token — nada está sendo "redefinido."
    </Note>

    Copie o token e salve em algum lugar. Este é o seu **Token de Bot** e você vai precisar em breve.

  </Step>

  <Step title="Gerar uma URL de convite e adicionar o bot ao seu servidor">
    Clique em **OAuth2** na barra lateral. Você vai gerar uma URL de convite com as permissões certas para adicionar o bot ao seu servidor.

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

    Copie a URL gerada na parte inferior, cole no seu navegador, selecione seu servidor e clique em **Continue** para conectar. Agora você deve ver seu bot no servidor Discord.

  </Step>

  <Step title="Habilitar o Modo de Desenvolvedor e coletar seus IDs">
    De volta ao app Discord, você precisa habilitar o Modo de Desenvolvedor para poder copiar IDs internos.

    1. Clique em **User Settings** (ícone de engrenagem ao lado do seu avatar) → **Advanced** → ative **Developer Mode**
    2. Clique com o botão direito no **ícone do seu servidor** na barra lateral → **Copy Server ID**
    3. Clique com o botão direito no **seu próprio avatar** → **Copy User ID**

    Salve o seu **Server ID** e **User ID** junto com o Token de Bot — você vai enviar todos os três ao OpenCraft no próximo passo.

  </Step>

  <Step title="Permitir DMs de membros do servidor">
    Para o pareamento funcionar, o Discord precisa permitir que seu bot envie DM para você. Clique com o botão direito no **ícone do seu servidor** → **Privacy Settings** → ative **Direct Messages**.

    Isso permite que membros do servidor (incluindo bots) enviem DMs para você. Mantenha habilitado se quiser usar DMs do Discord com o OpenCraft. Se você planeja usar apenas canais da guilda, pode desabilitar DMs após o pareamento.

  </Step>

  <Step title="Passo 0: Defina seu token de bot de forma segura (não o envie no chat)">
    O token do bot do Discord é um segredo (como uma senha). Defina-o na máquina que executa o OpenCraft antes de enviar mensagem ao seu agente.

```bash
opencraft config set channels.discord.token '"SEU_TOKEN_DE_BOT"' --json
opencraft config set channels.discord.enabled true --json
opencraft gateway
```

    Se o OpenCraft já estiver executando como serviço em background, use `opencraft gateway restart` em vez disso.

  </Step>

  <Step title="Configurar o OpenCraft e parear">

    <Tabs>
      <Tab title="Peça ao seu agente">
        Converse com seu agente OpenCraft em qualquer canal existente (por exemplo Telegram) e diga a ele. Se Discord for o seu primeiro canal, use a aba CLI / config em vez disso.

        > "Eu já defini meu token de bot do Discord na config. Por favor, finalize a configuração do Discord com o User ID `<user_id>` e o Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Se preferir config baseada em arquivo, defina:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "SEU_TOKEN_DE_BOT",
    },
  },
}
```

        Fallback de env para a conta padrão:

```bash
DISCORD_BOT_TOKEN=...
```

        Valores SecretRef também são suportados para `channels.discord.token` (provedores env/file/exec). Veja [Gerenciamento de Segredos](/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Aprovar o primeiro pareamento de DM">
    Aguarde até o gateway estar em execução, então envie DM ao seu bot no Discord. Ele responderá com um código de pareamento.

    <Tabs>
      <Tab title="Peça ao seu agente">
        Envie o código de pareamento ao seu agente no canal existente:

        > "Aprove este código de pareamento do Discord: `<CÓDIGO>`"
      </Tab>
      <Tab title="CLI">

```bash
opencraft pairing list discord
opencraft pairing approve discord <CÓDIGO>
```

      </Tab>
    </Tabs>

    Códigos de pareamento expiram após 1 hora.

    Agora você deve conseguir conversar com seu agente no Discord via DM.

  </Step>
</Steps>

<Note>
A resolução do token é ciente de contas. Valores de token na config vencem sobre o fallback de env. `DISCORD_BOT_TOKEN` é usado apenas para a conta padrão.
Para chamadas de saída avançadas (ferramenta de mensagem/ações de canal), um `token` explícito por chamada é usado para aquela chamada. As configurações de política/retry de conta ainda vêm da conta selecionada no snapshot de runtime ativo.
</Note>

## Recomendado: Configurar um workspace de guilda

Uma vez que os DMs estejam funcionando, você pode configurar seu servidor Discord como um workspace completo onde cada canal tem sua própria sessão de agente com seu próprio contexto. Isso é recomendado para servidores privados onde é só você e o bot.

<Steps>
  <Step title="Adicionar seu servidor à lista de permissão de guilda">
    Isso habilita seu agente a responder em qualquer canal do seu servidor, não apenas DMs.

    <Tabs>
      <Tab title="Peça ao seu agente">
        > "Adicione meu Discord Server ID `<server_id>` à lista de permissão de guilda"
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        SEU_SERVER_ID: {
          requireMention: true,
          users: ["SEU_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Permitir respostas sem @menção">
    Por padrão, seu agente só responde em canais de guilda quando é @mencionado. Para um servidor privado, provavelmente você quer que ele responda a todas as mensagens.

    <Tabs>
      <Tab title="Peça ao seu agente">
        > "Permita que meu agente responda neste servidor sem precisar ser @mencionado"
      </Tab>
      <Tab title="Config">
        Defina `requireMention: false` na sua config de guilda:

```json5
{
  channels: {
    discord: {
      guilds: {
        SEU_SERVER_ID: {
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

  <Step title="Planejar para memória em canais de guilda">
    Por padrão, memória de longo prazo (MEMORY.md) só carrega em sessões de DM. Canais de guilda não carregam MEMORY.md automaticamente.

    <Tabs>
      <Tab title="Peça ao seu agente">
        > "Quando eu fizer perguntas em canais do Discord, use memory_search ou memory_get se precisar de contexto de longo prazo do MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Se precisar de contexto compartilhado em cada canal, coloque as instruções estáveis em `AGENTS.md` ou `USER.md` (elas são injetadas para cada sessão). Mantenha notas de longo prazo em `MEMORY.md` e acesse-as sob demanda com ferramentas de memória.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Agora crie alguns canais no seu servidor Discord e comece a conversar. Seu agente pode ver o nome do canal, e cada canal recebe sua própria sessão isolada — então você pode configurar `#programacao`, `#casa`, `#pesquisa`, ou o que se encaixar no seu fluxo de trabalho.

## Modelo de runtime

- O Gateway possui a conexão Discord.
- O roteamento de resposta é determinístico: o inbound do Discord responde de volta ao Discord.
- Por padrão (`session.dmScope=main`), chats diretos compartilham a sessão principal do agente (`agent:main:main`).
- Canais de guilda são chaves de sessão isoladas (`agent:<agentId>:discord:channel:<channelId>`).
- DMs de grupo são ignorados por padrão (`channels.discord.dm.groupEnabled=false`).
- Comandos slash nativos executam em sessões de comando isoladas (`agent:<agentId>:discord:slash:<userId>`), enquanto ainda carregam `CommandTargetSessionKey` para a sessão de conversa roteada.

## Canais de fórum

Canais de fórum e mídia do Discord só aceitam posts de thread. O OpenCraft suporta duas formas de criá-los:

- Envie uma mensagem para o fórum pai (`channel:<forumId>`) para criar um thread automaticamente. O título do thread usa a primeira linha não vazia da sua mensagem.
- Use `opencraft message thread create` para criar um thread diretamente. Não passe `--message-id` para canais de fórum.

Exemplo: enviar para o pai do fórum para criar um thread

```bash
opencraft message send --channel discord --target channel:<forumId> \
  --message "Título do tópico\nCorpo do post"
```

Exemplo: criar um thread de fórum explicitamente

```bash
opencraft message thread create --channel discord --target channel:<forumId> \
  --thread-name "Título do tópico" --message "Corpo do post"
```

Pais de fórum não aceitam componentes do Discord. Se precisar de componentes, envie para o thread em si (`channel:<threadId>`).

## Componentes interativos

O OpenCraft suporta contêineres de componentes v2 do Discord para mensagens de agentes. Use a ferramenta de mensagem com um payload `components`. Os resultados de interação são roteados de volta ao agente como mensagens de entrada normais e seguem as configurações existentes de `replyToMode` do Discord.

Blocos suportados:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Linhas de ação permitem até 5 botões ou um único menu de seleção
- Tipos de seleção: `string`, `user`, `role`, `mentionable`, `channel`

Por padrão, os componentes são de uso único. Defina `components.reusable=true` para permitir que botões, selects e formulários sejam usados múltiplas vezes até expirarem.

Para restringir quem pode clicar em um botão, defina `allowedUsers` naquele botão (IDs, tags ou `*` de usuário Discord). Quando configurado, usuários não correspondentes recebem uma negação efêmera.

Os comandos slash `/model` e `/models` abrem um seletor de modelo interativo com menus suspensos de provedor e modelo mais uma etapa de Envio. A resposta do seletor é efêmera e apenas o usuário que invocou pode usá-lo.

Anexos de arquivo:

- Blocos `file` devem apontar para uma referência de anexo (`attachment://<nome_do_arquivo>`)
- Forneça o anexo via `media`/`path`/`filePath` (arquivo único); use `media-gallery` para múltiplos arquivos
- Use `filename` para substituir o nome de upload quando deve corresponder à referência de anexo

Formulários modais:

- Adicione `components.modal` com até 5 campos
- Tipos de campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- O OpenCraft adiciona um botão de acionamento automaticamente

Exemplo:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Texto de fallback opcional",
  components: {
    reusable: true,
    text: "Escolha um caminho",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Aprovar",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Recusar", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Escolha uma opção",
          options: [
            { label: "Opção A", value: "a" },
            { label: "Opção B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Detalhes",
      triggerLabel: "Abrir formulário",
      fields: [
        { type: "text", label: "Solicitante" },
        {
          type: "select",
          label: "Prioridade",
          options: [
            { label: "Baixa", value: "low" },
            { label: "Alta", value: "high" },
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
    `channels.discord.dmPolicy` controla o acesso a DM (legado: `channels.discord.dm.policy`):

    - `pairing` (padrão)
    - `allowlist`
    - `open` (requer que `channels.discord.allowFrom` inclua `"*"`; legado: `channels.discord.dm.allowFrom`)
    - `disabled`

    Se a política de DM não for aberta, usuários desconhecidos são bloqueados (ou solicitados para pareamento no modo `pairing`).

    Precedência de múltiplas contas:

    - `channels.discord.accounts.default.allowFrom` se aplica apenas à conta `default`.
    - Contas nomeadas herdam `channels.discord.allowFrom` quando seu próprio `allowFrom` não estiver definido.
    - Contas nomeadas não herdam `channels.discord.accounts.default.allowFrom`.

    Formato de alvo de DM para entrega:

    - `user:<id>`
    - menção `<@id>`

    IDs numéricos bare são ambíguos e rejeitados a menos que um tipo de alvo explícito de usuário/canal seja fornecido.

  </Tab>

  <Tab title="Política de guilda">
    O tratamento de guilda é controlado por `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    A linha de base segura quando `channels.discord` existe é `allowlist`.

    Comportamento de `allowlist`:

    - guilda deve corresponder a `channels.discord.guilds` (id preferido, slug aceito)
    - listas de permissão de remetentes opcionais: `users` (IDs estáveis recomendados) e `roles` (apenas IDs de função); se qualquer um for configurado, remetentes são permitidos quando correspondem a `users` OU `roles`
    - correspondência direta por nome/tag é desabilitada por padrão; habilite `channels.discord.dangerouslyAllowNameMatching: true` apenas como modo de compatibilidade emergencial
    - nomes/tags são suportados para `users`, mas IDs são mais seguros; `opencraft security audit` avisa quando entradas de nome/tag são usadas
    - se uma guilda tem `channels` configurado, canais não listados são negados
    - se uma guilda não tem bloco `channels`, todos os canais naquela guilda na lista de permissão são permitidos

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

    Se você apenas definir `DISCORD_BOT_TOKEN` e não criar um bloco `channels.discord`, o fallback de runtime é `groupPolicy="allowlist"` (com aviso nos logs), mesmo que `channels.defaults.groupPolicy` seja `open`.

  </Tab>

  <Tab title="Menções e DMs de grupo">
    Mensagens de guilda são controladas por menção por padrão.

    A detecção de menção inclui:

    - menção explícita do bot
    - padrões de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta ao bot em casos suportados

    `requireMention` é configurado por guilda/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcionalmente descarta mensagens que mencionam outro usuário/função mas não o bot (excluindo @everyone/@here).

    DMs de grupo:

    - padrão: ignorados (`dm.groupEnabled=false`)
    - lista de permissão opcional via `dm.groupChannels` (IDs de canal ou slugs)

  </Tab>
</Tabs>

### Roteamento de agente por função

Use `bindings[].match.roles` para rotear membros de guilda Discord para diferentes agentes por ID de função. Bindings baseados em função aceitam apenas IDs de função e são avaliados após bindings de peer ou peer-pai e antes de bindings apenas de guilda. Se um binding também define outros campos de correspondência (por exemplo `peer` + `guildId` + `roles`), todos os campos configurados devem corresponder.

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

## Configuração no Portal do Desenvolvedor

<AccordionGroup>
  <Accordion title="Criar app e bot">

    1. Portal do Desenvolvedor Discord -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Copiar token do bot

  </Accordion>

  <Accordion title="Intenções privilegiadas">
    Em **Bot -> Privileged Gateway Intents**, habilite:

    - Message Content Intent
    - Server Members Intent (recomendado)

    A intenção de Presence é opcional e só necessária se você quiser receber atualizações de presença. Definir presença do bot (`setPresence`) não requer habilitar atualizações de presença para membros.

  </Accordion>

  <Accordion title="Escopos OAuth e permissões de linha de base">
    Gerador de URL OAuth:

    - escopos: `bot`, `applications.commands`

    Permissões típicas de linha de base:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opcional)

    Evite `Administrator` a menos que seja explicitamente necessário.

  </Accordion>

  <Accordion title="Copiar IDs">
    Habilite o Modo de Desenvolvedor do Discord, depois copie:

    - ID do servidor
    - ID do canal
    - ID do usuário

    Prefira IDs numéricos na config do OpenCraft para auditorias e probes confiáveis.

  </Accordion>
</AccordionGroup>

## Comandos nativos e auth de comandos

- `commands.native` padrão é `"auto"` e está habilitado para Discord.
- Substituição por canal: `channels.discord.commands.native`.
- `commands.native=false` limpa explicitamente os comandos nativos Discord registrados anteriormente.
- A autenticação de comandos nativos usa as mesmas listas de permissão/políticas do Discord que o tratamento normal de mensagens.
- Comandos ainda podem ser visíveis na UI do Discord para usuários que não estão autorizados; a execução ainda aplica a autenticação do OpenCraft e retorna "não autorizado".

Veja [Comandos slash](/tools/slash-commands) para o catálogo e comportamento de comandos.

Configurações padrão de comandos slash:

- `ephemeral: true`

## Detalhes de recursos

<AccordionGroup>
  <Accordion title="Tags de resposta e respostas nativas">
    O Discord suporta tags de resposta na saída do agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controlado por `channels.discord.replyToMode`:

    - `off` (padrão)
    - `first`
    - `all`

    Nota: `off` desabilita o threading implícito de resposta. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.

    IDs de mensagem são exibidos em contexto/histórico para que os agentes possam visar mensagens específicas.

  </Accordion>

  <Accordion title="Prévia de streaming ao vivo">
    O OpenCraft pode transmitir rascunhos de respostas enviando uma mensagem temporária e editando-a conforme o texto chega.

    - `channels.discord.streaming` controla o streaming de prévia (`off` | `partial` | `block` | `progress`, padrão: `off`).
    - `progress` é aceito para consistência entre canais e mapeia para `partial` no Discord.
    - `channels.discord.streamMode` é um alias legado e é migrado automaticamente.
    - `partial` edita uma única mensagem de prévia conforme os tokens chegam.
    - `block` emite chunks do tamanho de rascunho (use `draftChunk` para ajustar tamanho e pontos de quebra).

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

    Padrões de chunking do modo `block` (limitados a `channels.discord.textChunkLimit`):

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

    O streaming de prévia é apenas texto; respostas de mídia recorrem à entrega normal.

    Nota: o streaming de prévia é separado do streaming de bloco. Quando o streaming de bloco é explicitamente habilitado para Discord, o OpenCraft pula o stream de prévia para evitar streaming duplo.

  </Accordion>

  <Accordion title="Histórico, contexto e comportamento de thread">
    Contexto de histórico de guilda:

    - padrão de `channels.discord.historyLimit`: `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desabilita

    Controles de histórico de DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento de thread:

    - threads do Discord são roteados como sessões de canal
    - metadados de thread pai podem ser usados para vinculação de sessão pai
    - a config do thread herda a config do canal pai, a menos que uma entrada específica de thread exista

    Tópicos de canal são injetados como contexto **não confiável** (não como prompt de sistema).

  </Accordion>

  <Accordion title="Sessões vinculadas a thread para subagentes">
    O Discord pode vincular um thread a um alvo de sessão para que mensagens subsequentes naquele thread continuem roteando para a mesma sessão (incluindo sessões de subagente).

    Comandos:

    - `/focus <alvo>` vincular thread atual/novo a um alvo de subagente/sessão
    - `/unfocus` remover vinculação de thread atual
    - `/agents` mostrar execuções ativas e estado de vinculação
    - `/session idle <duração|off>` inspecionar/atualizar auto-desvinculação por inatividade para vinculações focadas
    - `/session max-age <duração|off>` inspecionar/atualizar idade máxima para vinculações focadas

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
    - `channels.discord.threadBindings.*` substitui o comportamento do Discord.
    - `spawnSubagentSessions` deve ser true para auto-criar/vincular threads para `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` deve ser true para auto-criar/vincular threads para ACP (`/acp spawn ... --thread ...` ou `sessions_spawn({ runtime: "acp", thread: true })`).
    - Se os thread bindings estiverem desabilitados para uma conta, `/focus` e operações relacionadas de thread binding ficam indisponíveis.

    Veja [Sub-agentes](/tools/subagents), [Agentes ACP](/tools/acp-agents) e [Referência de Configuração](/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Bindings persistentes de canal ACP">
    Para workspaces ACP "sempre ativos" estáveis, configure bindings ACP tipados de nível superior visando conversas do Discord.

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

    - Mensagens de thread podem herdar o binding ACP do canal pai.
    - Em um canal ou thread vinculado, `/new` e `/reset` reiniciam a mesma sessão ACP no lugar.
    - Thread bindings temporários ainda funcionam e podem substituir a resolução de alvo enquanto ativos.

    Veja [Agentes ACP](/tools/acp-agents) para detalhes de comportamento de binding.

  </Accordion>

  <Accordion title="Notificações de reação">
    Modo de notificação de reação por guilda:

    - `off`
    - `own` (padrão)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Eventos de reação são transformados em eventos de sistema e anexados à sessão Discord roteada.

  </Accordion>

  <Accordion title="Reações de ack">
    `ackReaction` envia um emoji de confirmação enquanto o OpenCraft está processando uma mensagem de entrada.

    Ordem de resolução:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback de emoji de identidade do agente (`agents.list[].identity.emoji`, caso contrário "👀")

    Notas:

    - O Discord aceita emoji unicode ou nomes de emoji personalizados.
    - Use `""` para desabilitar a reação para um canal ou conta.

  </Accordion>

  <Accordion title="Escritas de config">
    Escritas de config iniciadas pelo canal são habilitadas por padrão.

    Isso afeta fluxos de `/config set|unset` (quando recursos de comando estão habilitados).

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
    Roteie o tráfego WebSocket do gateway Discord e buscas REST de inicialização (ID do aplicativo + resolução de lista de permissão) através de um proxy HTTP(S) com `channels.discord.proxy`.

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

  <Accordion title="Suporte ao PluralKit">
    Habilite a resolução do PluralKit para mapear mensagens proxiadas para a identidade do membro do sistema:

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

    - listas de permissão podem usar `pk:<memberId>`
    - nomes de exibição de membros são correspondidos por nome/slug apenas quando `channels.discord.dangerouslyAllowNameMatching: true`
    - buscas usam ID de mensagem original e são limitadas por janela de tempo
    - se a busca falhar, mensagens proxiadas são tratadas como mensagens de bot e descartadas a menos que `allowBots=true`

  </Accordion>

  <Accordion title="Configuração de presença">
    As atualizações de presença são aplicadas quando você define um campo de status ou atividade, ou quando habilita a presença automática.

    Exemplo apenas de status:

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
      activity: "Foco total",
      activityType: 4,
    },
  },
}
```

    Exemplo de streaming:

```json5
{
  channels: {
    discord: {
      activity: "Codando ao vivo",
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
    - 4: Custom (usa o texto da atividade como estado do status; emoji é opcional)
    - 5: Competing

    Exemplo de presença automática (sinal de saúde em runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token esgotado",
      },
    },
  },
}
```

    A presença automática mapeia a disponibilidade em runtime para o status do Discord: saudável => online, degradado ou desconhecido => idle, esgotado ou indisponível => dnd. Substituições de texto opcionais:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (suporta placeholder `{reason}`)

  </Accordion>

  <Accordion title="Aprovações de exec no Discord">
    O Discord suporta aprovações de exec baseadas em botões em DMs e pode opcionalmente postar prompts de aprovação no canal de origem.

    Caminho de config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Quando `target` é `channel` ou `both`, o prompt de aprovação é visível no canal. Apenas aprovadores configurados podem usar os botões; outros usuários recebem uma negação efêmera. Os prompts de aprovação incluem o texto do comando, então só habilite entrega no canal em canais confiáveis. Se o ID do canal não puder ser derivado da chave de sessão, o OpenCraft recorre à entrega por DM.

    A autenticação do gateway para este handler usa o mesmo contrato de resolução de credencial compartilhada que outros clientes do Gateway:

    - autenticação local env-first (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` depois `gateway.auth.*`)
    - no modo local, `gateway.remote.*` pode ser usado como fallback apenas quando `gateway.auth.*` não está definido; SecretRefs locais configurados mas não resolvidos falham de forma fechada
    - suporte a modo remoto via `gateway.remote.*` quando aplicável
    - substituições de URL são seguras: substituições de CLI não reutilizam credenciais implícitas, e substituições de env usam apenas credenciais de env

    Se as aprovações falharem com IDs de aprovação desconhecidos, verifique a lista de aprovadores e a habilitação do recurso.

    Docs relacionados: [Aprovações de exec](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Ferramentas e controles de ação

As ações de mensagem do Discord incluem mensagens, administração de canal, moderação, presença e ações de metadados.

Exemplos principais:

- mensagens: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reações: `react`, `reactions`, `emojiList`
- moderação: `timeout`, `kick`, `ban`
- presença: `setPresence`

Os controles de ação ficam em `channels.discord.actions.*`.

Comportamento de controle padrão:

| Grupo de ação                                                                                                                                                              | Padrão    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions   | habilitado |
| roles                                                                                                                                                                      | desabilitado |
| moderation                                                                                                                                                                 | desabilitado |
| presence                                                                                                                                                                   | desabilitado |

## UI de componentes v2

O OpenCraft usa os componentes v2 do Discord para aprovações de exec e marcadores de contexto cruzado. As ações de mensagem do Discord também podem aceitar `components` para UI personalizada (avançado; requer instâncias de componentes Carbon), enquanto `embeds` legados permanecem disponíveis mas não são recomendados.

- `channels.discord.ui.components.accentColor` define a cor de destaque usada pelos contêineres de componentes Discord (hex).
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

O OpenCraft pode entrar em canais de voz do Discord para conversas em tempo real e contínuas. Isso é separado de anexos de mensagens de voz.

Requisitos:

- Habilite comandos nativos (`commands.native` ou `channels.discord.commands.native`).
- Configure `channels.discord.voice`.
- O bot precisa de permissões Connect + Speak no canal de voz alvo.

Use o comando nativo exclusivo do Discord `/vc join|leave|status` para controlar sessões. O comando usa o agente padrão da conta e segue as mesmas regras de lista de permissão e política de grupo que outros comandos do Discord.

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

- `voice.tts` substitui `messages.tts` apenas para reprodução de voz.
- Turnos de transcrição de voz derivam o status de proprietário do `allowFrom` do Discord (ou `dm.allowFrom`); falantes não proprietários não podem acessar ferramentas exclusivas do proprietário (por exemplo `gateway` e `cron`).
- A voz está habilitada por padrão; defina `channels.discord.voice.enabled=false` para desabilitá-la.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` são passados para as opções de join do `@discordjs/voice`.
- Os padrões do `@discordjs/voice` são `daveEncryption=true` e `decryptionFailureTolerance=24` se não definidos.
- O OpenCraft também monitora falhas de decriptografia de recebimento e se recupera automaticamente saindo/entrando novamente no canal de voz após falhas repetidas em uma janela curta.
- Se os logs de recebimento mostrarem repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, isso pode ser o bug de recebimento do `@discordjs/voice` rastreado em [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Mensagens de voz

As mensagens de voz do Discord mostram uma prévia de forma de onda e requerem áudio OGG/Opus mais metadados. O OpenCraft gera a forma de onda automaticamente, mas precisa de `ffmpeg` e `ffprobe` disponíveis no host do gateway para inspecionar e converter arquivos de áudio.

Requisitos e restrições:

- Forneça um **caminho de arquivo local** (URLs são rejeitados).
- Omita conteúdo de texto (o Discord não permite texto + mensagem de voz no mesmo payload).
- Qualquer formato de áudio é aceito; o OpenCraft converte para OGG/Opus quando necessário.

Exemplo:

```bash
message(action="send", channel="discord", target="channel:123", path="/caminho/para/audio.mp3", asVoice=true)
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Intenções não permitidas ou bot não vê mensagens da guilda">

    - habilite a Message Content Intent
    - habilite a Server Members Intent quando depender de resolução de usuário/membro
    - reinicie o gateway após alterar intenções

  </Accordion>

  <Accordion title="Mensagens de guilda bloqueadas inesperadamente">

    - verifique `groupPolicy`
    - verifique a lista de permissão de guilda em `channels.discord.guilds`
    - se o mapa `channels` da guilda existir, apenas os canais listados são permitidos
    - verifique o comportamento de `requireMention` e padrões de menção

    Verificações úteis:

```bash
opencraft doctor
opencraft channels status --probe
opencraft logs --follow
```

  </Accordion>

  <Accordion title="requireMention false mas ainda bloqueado">
    Causas comuns:

    - `groupPolicy="allowlist"` sem lista de permissão de guilda/canal correspondente
    - `requireMention` configurado no lugar errado (deve estar em `channels.discord.guilds` ou entrada de canal)
    - remetente bloqueado pela lista de permissão `users` da guilda/canal

  </Accordion>

  <Accordion title="Handlers de longa duração expiram ou duplicam respostas">

    Logs típicos:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Ajuste de orçamento do listener:

    - conta única: `channels.discord.eventQueue.listenerTimeout`
    - múltiplas contas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Ajuste de timeout de execução do worker:

    - conta única: `channels.discord.inboundWorker.runTimeoutMs`
    - múltiplas contas: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - padrão: `1800000` (30 minutos); defina `0` para desabilitar

    Linha de base recomendada:

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

    Use `eventQueue.listenerTimeout` para configuração lenta de listener e `inboundWorker.runTimeoutMs` apenas se quiser uma válvula de segurança separada para turnos de agente enfileirados.

  </Accordion>

  <Accordion title="Incompatibilidades na auditoria de permissões">
    As verificações de permissão de `channels status --probe` só funcionam para IDs de canal numéricos.

    Se você usar chaves de slug, a correspondência em runtime ainda pode funcionar, mas o probe não pode verificar completamente as permissões.

  </Accordion>

  <Accordion title="Problemas de DM e pareamento">

    - DM desabilitado: `channels.discord.dm.enabled=false`
    - Política de DM desabilitada: `channels.discord.dmPolicy="disabled"` (legado: `channels.discord.dm.policy`)
    - Aguardando aprovação de pareamento no modo `pairing`

  </Accordion>

  <Accordion title="Loops bot para bot">
    Por padrão, mensagens de autoria de bot são ignoradas.

    Se você definir `channels.discord.allowBots=true`, use regras estritas de menção e lista de permissão para evitar comportamento de loop.
    Prefira `channels.discord.allowBots="mentions"` para aceitar apenas mensagens de bot que mencionem o bot.

  </Accordion>

  <Accordion title="Drops de STT de voz com DecryptionFailed(...)">

    - mantenha o OpenCraft atualizado (`opencraft update`) para que a lógica de recuperação de recebimento de voz Discord esteja presente
    - confirme `channels.discord.voice.daveEncryption=true` (padrão)
    - comece com `channels.discord.voice.decryptionFailureTolerance=24` (padrão upstream) e ajuste apenas se necessário
    - monitore os logs para:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se as falhas continuarem após o rejoin automático, colete os logs e compare com [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Referências de configuração

Referência principal:

- [Referência de configuração - Discord](/gateway/configuration-reference#discord)

Campos de alto valor do Discord:

- inicialização/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- fila de eventos: `eventQueue.listenerTimeout` (orçamento do listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker de entrada: `inboundWorker.runTimeoutMs`
- resposta/histórico: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legado: `streamMode`), `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- mídia/retry: `mediaMaxMb`, `retry`
  - `mediaMaxMb` limita uploads Discord de saída (padrão: `8MB`)
- ações: `actions.*`
- presença: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- recursos: `threadBindings`, `bindings[]` de nível superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Segurança e operações

- Trate os tokens de bot como segredos (`DISCORD_BOT_TOKEN` preferido em ambientes supervisionados).
- Conceda as permissões Discord de menor privilégio.
- Se o estado de deploy/comando estiver desatualizado, reinicie o gateway e verifique novamente com `opencraft channels status --probe`.

## Relacionados

- [Pareamento](/channels/pairing)
- [Roteamento de canal](/channels/channel-routing)
- [Roteamento multi-agente](/concepts/multi-agent)
- [Solução de problemas](/channels/troubleshooting)
- [Comandos slash](/tools/slash-commands)
