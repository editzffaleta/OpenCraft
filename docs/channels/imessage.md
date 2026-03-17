---
summary: "Suporte legado ao iMessage via imsg (JSON-RPC sobre stdio). Novas configuracoes devem usar BlueBubbles."
read_when:
  - Setting up iMessage support
  - Debugging iMessage send/receive
title: "iMessage"
---

# iMessage (legado: imsg)

<Warning>
Para novas implantacoes de iMessage, use <a href="/channels/bluebubbles">BlueBubbles</a>.

A integracao `imsg` e legada e pode ser removida em uma versao futura.
</Warning>

Status: integracao legada com CLI externo. O Gateway inicia `imsg rpc` e se comunica via JSON-RPC no stdio (sem daemon/porta separados).

<CardGroup cols={3}>
  <Card title="BlueBubbles (recomendado)" icon="message-circle" href="/channels/bluebubbles">
    Caminho preferido para iMessage em novas configuracoes.
  </Card>
  <Card title="Pareamento" icon="link" href="/channels/pairing">
    DMs do iMessage usam modo de pareamento por padrao.
  </Card>
  <Card title="Referencia de configuracao" icon="settings" href="/gateway/configuration-reference#imessage">
    Referencia completa de campos do iMessage.
  </Card>
</CardGroup>

## Configuracao rapida

<Tabs>
  <Tab title="Mac local (caminho rapido)">
    <Steps>
      <Step title="Instale e verifique o imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Configure o OpenCraft">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/<voce>/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Inicie o Gateway">

```bash
opencraft gateway
```

      </Step>

      <Step title="Aprove o primeiro pareamento de DM (dmPolicy padrao)">

```bash
opencraft pairing list imessage
opencraft pairing approve imessage <CODE>
```

        Solicitacoes de pareamento expiram apos 1 hora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto via SSH">
    O OpenCraft requer apenas um `cliPath` compativel com stdio, entao voce pode apontar `cliPath` para um script wrapper que faz SSH a um Mac remoto e executa `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Configuracao recomendada quando anexos estao habilitados:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.opencraft/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // usado para busca de anexos via SCP
      includeAttachments: true,
      // Opcional: substituir raizes de anexos permitidas.
      // Padroes incluem /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Se `remoteHost` nao estiver definido, o OpenCraft tenta auto-detecta-lo analisando o script wrapper SSH.
    `remoteHost` deve ser `host` ou `user@host` (sem espacos ou opcoes SSH).
    O OpenCraft usa verificacao rigorosa de chave do host para SCP, entao a chave do host de relay ja deve existir em `~/.ssh/known_hosts`.
    Caminhos de anexo sao validados contra raizes permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisitos e permissoes (macOS)

- O Messages deve estar logado no Mac que executa `imsg`.
- Acesso Total ao Disco e necessario para o contexto de processo que executa o OpenCraft/`imsg` (acesso ao DB do Messages).
- Permissao de Automacao e necessaria para enviar mensagens atraves do Messages.app.

<Tip>
As permissoes sao concedidas por contexto de processo. Se o Gateway roda headless (LaunchAgent/SSH), execute um comando interativo unico naquele mesmo contexto para acionar os prompts:

```bash
imsg chats --limit 1
# ou
imsg send <handle> "test"
```

</Tip>

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Politica de DM">
    `channels.imessage.dmPolicy` controla mensagens diretas:

    - `pairing` (padrao)
    - `allowlist`
    - `open` (requer que `allowFrom` inclua `"*"`)
    - `disabled`

    Campo de lista de permitidos: `channels.imessage.allowFrom`.

    Entradas da lista de permitidos podem ser handles ou alvos de chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Politica de grupo + mencoes">
    `channels.imessage.groupPolicy` controla o tratamento de grupos:

    - `allowlist` (padrao quando configurado)
    - `open`
    - `disabled`

    Lista de permitidos de remetentes de grupo: `channels.imessage.groupAllowFrom`.

    Fallback em runtime: se `groupAllowFrom` nao estiver definido, verificacoes de remetente de grupo do iMessage caem para `allowFrom` quando disponivel.
    Nota de runtime: se `channels.imessage` estiver completamente ausente, o runtime cai para `groupPolicy="allowlist"` e registra um aviso (mesmo se `channels.defaults.groupPolicy` estiver definido).

    Controle por mencao para grupos:

    - iMessage nao tem metadados de mencao nativos
    - a deteccao de mencao usa padroes regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - sem padroes configurados, o controle por mencao nao pode ser aplicado

    Comandos de controle de remetentes autorizados podem ignorar o controle por mencao em grupos.

  </Tab>

  <Tab title="Sessoes e respostas deterministicas">
    - DMs usam roteamento direto; grupos usam roteamento de grupo.
    - Com `session.dmScope=main` padrao, DMs do iMessage sao agrupadas na sessao principal do agente.
    - Sessoes de grupo sao isoladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Respostas sao roteadas de volta ao iMessage usando metadados de canal/alvo de origem.

    Comportamento de thread tipo grupo:

    Algumas threads de iMessage com multiplos participantes podem chegar com `is_group=false`.
    Se aquele `chat_id` estiver explicitamente configurado em `channels.imessage.groups`, o OpenCraft o trata como trafego de grupo (controle de grupo + isolamento de sessao de grupo).

  </Tab>
</Tabs>

## Padroes de implantacao

<AccordionGroup>
  <Accordion title="Usuario macOS dedicado para Bot (identidade iMessage separada)">
    Use um Apple ID dedicado e usuario macOS para que o trafego do Bot fique isolado do seu perfil pessoal do Messages.

    Fluxo tipico:

    1. Crie/faca login em um usuario macOS dedicado.
    2. Faca login no Messages com o Apple ID do Bot naquele usuario.
    3. Instale `imsg` naquele usuario.
    4. Crie um wrapper SSH para que o OpenCraft possa executar `imsg` naquele contexto de usuario.
    5. Aponte `channels.imessage.accounts.<id>.cliPath` e `.dbPath` para aquele perfil de usuario.

    A primeira execucao pode requerer aprovacoes de GUI (Automacao + Acesso Total ao Disco) naquela sessao de usuario do Bot.

  </Accordion>

  <Accordion title="Mac remoto via Tailscale (exemplo)">
    Topologia comum:

    - O Gateway roda em Linux/VM
    - iMessage + `imsg` roda em um Mac no seu tailnet
    - O wrapper `cliPath` usa SSH para executar `imsg`
    - `remoteHost` habilita busca de anexos via SCP

    Exemplo:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.opencraft/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    Use chaves SSH para que tanto SSH quanto SCP sejam nao interativos.
    Certifique-se de que a chave do host seja confiavel primeiro (por exemplo `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` seja populado.

  </Accordion>

  <Accordion title="Padrao multi-conta">
    iMessage suporta configuracao por conta em `channels.imessage.accounts`.

    Cada conta pode substituir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, configuracoes de historico e listas de permitidos de raiz de anexo.

  </Accordion>
</AccordionGroup>

## Midia, chunking e alvos de entrega

<AccordionGroup>
  <Accordion title="Anexos e midia">
    - ingestao de anexos de entrada e opcional: `channels.imessage.includeAttachments`
    - caminhos de anexo remoto podem ser buscados via SCP quando `remoteHost` esta definido
    - caminhos de anexo devem corresponder a raizes permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - padrao de raiz padrao: `/Users/*/Library/Messages/Attachments`
    - SCP usa verificacao rigorosa de chave do host (`StrictHostKeyChecking=yes`)
    - tamanho de midia de saida usa `channels.imessage.mediaMaxMb` (padrao 16 MB)
  </Accordion>

  <Accordion title="Chunking de saida">
    - limite de bloco de texto: `channels.imessage.textChunkLimit` (padrao 4000)
    - modo de bloco: `channels.imessage.chunkMode`
      - `length` (padrao)
      - `newline` (divisao por paragrafo primeiro)
  </Accordion>

  <Accordion title="Formatos de enderecamento">
    Alvos explicitos preferidos:

    - `chat_id:123` (recomendado para roteamento estavel)
    - `chat_guid:...`
    - `chat_identifier:...`

    Alvos por handle tambem sao suportados:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Escritas de configuracao

iMessage permite escritas de configuracao iniciadas pelo canal por padrao (para `/config set|unset` quando `commands.config: true`).

Desabilitar:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## Solucao de problemas

<AccordionGroup>
  <Accordion title="imsg nao encontrado ou RPC nao suportado">
    Valide o binario e suporte a RPC:

```bash
imsg rpc --help
opencraft channels status --probe
```

    Se o probe reportar RPC nao suportado, atualize o `imsg`.

  </Accordion>

  <Accordion title="DMs sao ignoradas">
    Verifique:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprovacoes de pareamento (`opencraft pairing list imessage`)

  </Accordion>

  <Accordion title="Mensagens de grupo sao ignoradas">
    Verifique:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamento de lista de permitidos em `channels.imessage.groups`
    - configuracao de padroes de mencao (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Anexos remotos falham">
    Verifique:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticacao de chave SSH/SCP do host do Gateway
    - chave do host existe em `~/.ssh/known_hosts` no host do Gateway
    - legibilidade do caminho remoto no Mac que executa o Messages

  </Accordion>

  <Accordion title="Prompts de permissao do macOS foram perdidos">
    Re-execute em um terminal GUI interativo no mesmo contexto de usuario/sessao e aprove os prompts:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Confirme que Acesso Total ao Disco + Automacao estao concedidos para o contexto de processo que executa o OpenCraft/`imsg`.

  </Accordion>
</AccordionGroup>

## Ponteiros de referencia de configuracao

- [Referencia de configuracao - iMessage](/gateway/configuration-reference#imessage)
- [Configuracao do Gateway](/gateway/configuration)
- [Pareamento](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)
