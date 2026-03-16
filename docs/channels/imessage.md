---
summary: "Suporte legado ao iMessage via imsg (JSON-RPC sobre stdio). Novos setups devem usar BlueBubbles."
read_when:
  - Configurando suporte ao iMessage
  - Depurando envio/recebimento do iMessage
title: "iMessage"
---

# iMessage (legado: imsg)

<Warning>
Para novos deployments de iMessage, use <a href="/channels/bluebubbles">BlueBubbles</a>.

A integração `imsg` é legada e pode ser removida em uma versão futura.
</Warning>

Status: integração externa legada via CLI. O gateway spawna `imsg rpc` e se comunica via JSON-RPC no stdio (sem daemon/porta separados).

<CardGroup cols={3}>
  <Card title="BlueBubbles (recomendado)" icon="message-circle" href="/channels/bluebubbles">
    Caminho preferido de iMessage para novos setups.
  </Card>
  <Card title="Pareamento" icon="link" href="/channels/pairing">
    DMs do iMessage usam o modo pairing por padrão.
  </Card>
  <Card title="Referência de configuração" icon="settings" href="/gateway/configuration-reference#imessage">
    Referência completa de campos iMessage.
  </Card>
</CardGroup>

## Configuração rápida

<Tabs>
  <Tab title="Mac local (caminho rápido)">
    <Steps>
      <Step title="Instalar e verificar imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Configurar OpenCraft">

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

      <Step title="Iniciar gateway">

```bash
opencraft gateway
```

      </Step>

      <Step title="Aprovar primeiro pareamento de DM (dmPolicy padrão)">

```bash
opencraft pairing list imessage
opencraft pairing approve imessage <CÓDIGO>
```

        Solicitações de pareamento expiram após 1 hora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto via SSH">
    O OpenCraft só requer um `cliPath` compatível com stdio, então você pode apontar `cliPath` para um script wrapper que faz SSH em um Mac remoto e executa `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Config recomendada quando os anexos estão habilitados:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.opencraft/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // usado para buscas SCP de anexos
      includeAttachments: true,
      // Opcional: substituir raízes de anexo permitidas.
      // Os padrões incluem /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Se `remoteHost` não estiver definido, o OpenCraft tenta detectá-lo automaticamente ao parsear o script wrapper SSH.
    `remoteHost` deve ser `host` ou `user@host` (sem espaços ou opções SSH).
    O OpenCraft usa verificação estrita de chave de host para SCP, então a chave do host relay já deve existir em `~/.ssh/known_hosts`.
    Os caminhos de anexo são validados contra raízes permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisitos e permissões (macOS)

- O Messages deve estar conectado no Mac executando `imsg`.
- Acesso total ao disco é obrigatório para o contexto de processo que executa o OpenCraft/`imsg` (acesso ao banco de dados do Messages).
- Permissão de automação é obrigatória para enviar mensagens pelo Messages.app.

<Tip>
As permissões são concedidas por contexto de processo. Se o gateway executa headless (LaunchAgent/SSH), execute um comando interativo único nesse mesmo contexto para acionar os prompts:

```bash
imsg chats --limit 1
# ou
imsg send <handle> "test"
```

</Tip>

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de DM">
    `channels.imessage.dmPolicy` controla mensagens diretas:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (requer que `allowFrom` inclua `"*"`)
    - `disabled`

    Campo allowlist: `channels.imessage.allowFrom`.

    Entradas da allowlist podem ser handles ou alvos de chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Política de grupo + menções">
    `channels.imessage.groupPolicy` controla o tratamento de grupo:

    - `allowlist` (padrão quando configurado)
    - `open`
    - `disabled`

    Allowlist de remetentes de grupo: `channels.imessage.groupAllowFrom`.

    Fallback em runtime: se `groupAllowFrom` não estiver definido, as verificações de remetente de grupo do iMessage recorrem a `allowFrom` quando disponível.
    Nota de runtime: se `channels.imessage` estiver completamente ausente, o runtime recorre a `groupPolicy="allowlist"` e registra um aviso (mesmo se `channels.defaults.groupPolicy` estiver definido).

    Controle por menção para grupos:

    - O iMessage não tem metadados de menção nativos
    - A detecção de menção usa padrões regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - sem padrões configurados, o controle por menção não pode ser aplicado

    Comandos de controle de remetentes autorizados podem ignorar o controle por menção em grupos.

  </Tab>

  <Tab title="Sessões e respostas determinísticas">
    - DMs usam roteamento direto; grupos usam roteamento de grupo.
    - Com `session.dmScope=main` padrão, DMs do iMessage colapsam para a sessão principal do agente.
    - Sessões de grupo são isoladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Respostas roteiam de volta ao iMessage usando metadados de canal/alvo de origem.

    Comportamento de thread semelhante a grupo:

    Algumas threads iMessage com múltiplos participantes podem chegar com `is_group=false`.
    Se aquele `chat_id` estiver explicitamente configurado em `channels.imessage.groups`, o OpenCraft o trata como tráfego de grupo (controle de grupo + isolamento de sessão de grupo).

  </Tab>
</Tabs>

## Padrões de deployment

<AccordionGroup>
  <Accordion title="Usuário macOS bot dedicado (identidade iMessage separada)">
    Use um Apple ID dedicado e usuário macOS para que o tráfego do bot seja isolado do seu perfil pessoal do Messages.

    Fluxo típico:

    1. Crie/faça login em um usuário macOS dedicado.
    2. Faça login no Messages com o Apple ID do bot nesse usuário.
    3. Instale `imsg` nesse usuário.
    4. Crie um wrapper SSH para que o OpenCraft possa executar `imsg` naquele contexto de usuário.
    5. Aponte `channels.imessage.accounts.<id>.cliPath` e `.dbPath` para aquele perfil de usuário.

    A primeira execução pode exigir aprovações de GUI (Automação + Acesso Total ao Disco) naquela sessão de usuário do bot.

  </Accordion>

  <Accordion title="Mac remoto via Tailscale (exemplo)">
    Topologia comum:

    - gateway executa no Linux/VM
    - iMessage + `imsg` executa em um Mac na sua tailnet
    - wrapper `cliPath` usa SSH para executar `imsg`
    - `remoteHost` habilita buscas SCP de anexos

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

    Use chaves SSH para que tanto SSH quanto SCP sejam não-interativos.
    Certifique-se de que a chave do host está confiável primeiro (por exemplo `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` seja populado.

  </Accordion>

  <Accordion title="Padrão de múltiplas contas">
    O iMessage suporta config por conta em `channels.imessage.accounts`.

    Cada conta pode substituir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, configurações de histórico e listas de permissão de raízes de anexo.

  </Accordion>
</AccordionGroup>

## Mídia, fragmentação e alvos de entrega

<AccordionGroup>
  <Accordion title="Anexos e mídia">
    - a ingestão de anexos de entrada é opcional: `channels.imessage.includeAttachments`
    - caminhos de anexo remoto podem ser buscados via SCP quando `remoteHost` está definido
    - os caminhos de anexo devem corresponder às raízes permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - padrão de raiz padrão: `/Users/*/Library/Messages/Attachments`
    - SCP usa verificação estrita de chave de host (`StrictHostKeyChecking=yes`)
    - o tamanho de mídia de saída usa `channels.imessage.mediaMaxMb` (padrão 16 MB)
  </Accordion>

  <Accordion title="Fragmentação de saída">
    - limite de fragmento de texto: `channels.imessage.textChunkLimit` (padrão 4000)
    - modo de fragmento: `channels.imessage.chunkMode`
      - `length` (padrão)
      - `newline` (divisão por parágrafo primeiro)
  </Accordion>

  <Accordion title="Formatos de endereçamento">
    Alvos explícitos preferidos:

    - `chat_id:123` (recomendado para roteamento estável)
    - `chat_guid:...`
    - `chat_identifier:...`

    Alvos de handle também são suportados:

    - `imessage:+5511999999999`
    - `sms:+5511999999999`
    - `usuario@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Escritas de config

O iMessage permite escritas de config iniciadas pelo canal por padrão (para `/config set|unset` quando `commands.config: true`).

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

## Solução de problemas

<AccordionGroup>
  <Accordion title="imsg não encontrado ou RPC não suportado">
    Valide o binário e o suporte a RPC:

```bash
imsg rpc --help
opencraft channels status --probe
```

    Se o probe reportar RPC não suportado, atualize o `imsg`.

  </Accordion>

  <Accordion title="DMs são ignorados">
    Verifique:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprovações de pareamento (`opencraft pairing list imessage`)

  </Accordion>

  <Accordion title="Mensagens de grupo são ignoradas">
    Verifique:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamento de allowlist de `channels.imessage.groups`
    - configuração de padrões de menção (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Anexos remotos falham">
    Verifique:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticação SSH/SCP por chave a partir do host gateway
    - chave de host existe em `~/.ssh/known_hosts` no host gateway
    - legibilidade do caminho remoto no Mac executando o Messages

  </Accordion>

  <Accordion title="Prompts de permissão do macOS foram perdidos">
    Execute novamente em um terminal GUI interativo no mesmo contexto de usuário/sessão e aprove os prompts:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Confirme que o Acesso Total ao Disco + Automação estão concedidos para o contexto de processo que executa o OpenCraft/`imsg`.

  </Accordion>
</AccordionGroup>

## Ponteiros de referência de configuração

- [Referência de configuração - iMessage](/gateway/configuration-reference#imessage)
- [Configuração do gateway](/gateway/configuration)
- [Pareamento](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)
