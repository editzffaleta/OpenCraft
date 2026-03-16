---
summary: "Suporte ao canal WhatsApp, controles de acesso, comportamento de entrega e operações"
read_when:
  - Trabalhando no comportamento do canal WhatsApp/web ou roteamento de inbox
title: "WhatsApp"
---

# WhatsApp (Canal Web)

Status: pronto para produção via WhatsApp Web (Baileys). O Gateway gerencia a(s) sessão(ões) vinculada(s).

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/channels/pairing">
    A política de DM padrão é pareamento para remetentes desconhecidos.
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
  <Step title="Configurar política de acesso do WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+5511999999999"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+5511999999999"],
    },
  },
}
```

  </Step>

  <Step title="Vincular WhatsApp (QR)">

```bash
opencraft channels login --channel whatsapp
```

    Para uma conta específica:

```bash
opencraft channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Iniciar o gateway">

```bash
opencraft gateway
```

  </Step>

  <Step title="Aprovar a primeira solicitação de pareamento (se usar modo de pareamento)">

```bash
opencraft pairing list whatsapp
opencraft pairing approve whatsapp <CÓDIGO>
```

    As solicitações de pareamento expiram após 1 hora. Solicitações pendentes são limitadas a 3 por canal.

  </Step>
</Steps>

<Note>
O OpenCraft recomenda usar o WhatsApp em um número separado quando possível. (Os metadados do canal e o fluxo de onboarding são otimizados para essa configuração, mas configurações com número pessoal também são suportadas.)
</Note>

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    Este é o modo operacional mais limpo:

    - identidade WhatsApp separada para o OpenCraft
    - listas de permissão de DM e limites de roteamento mais claros
    - menor chance de confusão de auto-chat

    Padrão de política mínima:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+5511999999999"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fallback para número pessoal">
    O onboarding suporta modo de número pessoal e escreve uma linha de base amigável para auto-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclui seu número pessoal
    - `selfChatMode: true`

    Em runtime, as proteções de auto-chat são baseadas no número self vinculado e em `allowFrom`.

  </Accordion>

  <Accordion title="Escopo do canal apenas WhatsApp Web">
    O canal da plataforma de mensagens é baseado em WhatsApp Web (`Baileys`) na arquitetura atual de canais do OpenCraft.

    Não há um canal separado de mensagens WhatsApp via Twilio no registro de canais de chat embutido.

  </Accordion>
</AccordionGroup>

## Modelo de runtime

- O Gateway possui o socket WhatsApp e o loop de reconexão.
- Envios de saída requerem um listener WhatsApp ativo para a conta de destino.
- Chats de status e broadcast são ignorados (`@status`, `@broadcast`).
- Chats diretos usam regras de sessão de DM (`session.dmScope`; o padrão `main` recolhe DMs para a sessão principal do agente).
- Sessões de grupo são isoladas (`agent:<agentId>:whatsapp:group:<jid>`).

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de DM">
    `channels.whatsapp.dmPolicy` controla o acesso a chats diretos:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (requer que `allowFrom` inclua `"*"`)
    - `disabled`

    `allowFrom` aceita números no formato E.164 (normalizados internamente).

    Substituição por conta múltipla: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) têm precedência sobre os padrões em nível de canal para aquela conta.

    Detalhes de comportamento em runtime:

    - pareamentos são persistidos no allow-store do canal e mesclados com o `allowFrom` configurado
    - se nenhuma lista de permissão estiver configurada, o número self vinculado é permitido por padrão
    - DMs de saída `fromMe` nunca são pareados automaticamente

  </Tab>

  <Tab title="Política de grupo + listas de permissão">
    O acesso a grupos tem duas camadas:

    1. **Lista de permissão de membros do grupo** (`channels.whatsapp.groups`)
       - se `groups` for omitido, todos os grupos são elegíveis
       - se `groups` estiver presente, atua como uma lista de permissão de grupos (`"*"` permitido)

    2. **Política de remetente em grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: lista de permissão de remetentes ignorada
       - `allowlist`: remetente deve corresponder a `groupAllowFrom` (ou `*`)
       - `disabled`: bloquear todo inbound de grupo

    Fallback da lista de permissão de remetentes:

    - se `groupAllowFrom` não estiver definido, o runtime recorre a `allowFrom` quando disponível
    - listas de permissão de remetentes são avaliadas antes da ativação por menção/resposta

    Nota: se nenhum bloco `channels.whatsapp` existir, o fallback de política de grupo em runtime é `allowlist` (com log de aviso), mesmo que `channels.defaults.groupPolicy` esteja definido.

  </Tab>

  <Tab title="Menções + /activation">
    Respostas em grupo requerem menção por padrão.

    A detecção de menção inclui:

    - menções explícitas do WhatsApp à identidade do bot
    - padrões de regex de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - detecção implícita de resposta ao bot (remetente da resposta corresponde à identidade do bot)

    Nota de segurança:

    - citação/resposta apenas satisfaz o controle de menção; **não** concede autorização ao remetente
    - com `groupPolicy: "allowlist"`, remetentes fora da lista de permissão ainda são bloqueados mesmo que respondam à mensagem de um usuário na lista

    Comando de ativação em nível de sessão:

    - `/activation mention`
    - `/activation always`

    `activation` atualiza o estado da sessão (não a configuração global). É restrito ao proprietário.

  </Tab>
</Tabs>

## Comportamento de número pessoal e auto-chat

Quando o número self vinculado também está presente em `allowFrom`, as proteções de auto-chat do WhatsApp são ativadas:

- pular confirmações de leitura para turnos de auto-chat
- ignorar o comportamento de auto-trigger de menção-JID que de outra forma faria você se mencionar
- se `messages.responsePrefix` não estiver definido, as respostas de auto-chat padrão são `[{identity.name}]` ou `[opencraft]`

## Normalização de mensagens e contexto

<AccordionGroup>
  <Accordion title="Envelope de entrada + contexto de resposta">
    As mensagens de entrada do WhatsApp são encapsuladas no envelope de entrada compartilhado.

    Se uma citação de resposta existir, o contexto é adicionado neste formato:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Os campos de metadados de resposta também são preenchidos quando disponíveis (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 do remetente).

  </Accordion>

  <Accordion title="Placeholders de mídia e extração de localização/contato">
    Mensagens de entrada apenas com mídia são normalizadas com placeholders como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Payloads de localização e contato são normalizados em contexto textual antes do roteamento.

  </Accordion>

  <Accordion title="Injeção de histórico de grupo pendente">
    Para grupos, mensagens não processadas podem ser armazenadas em buffer e injetadas como contexto quando o bot é finalmente acionado.

    - limite padrão: `50`
    - config: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desabilita

    Marcadores de injeção:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Confirmações de leitura">
    As confirmações de leitura são habilitadas por padrão para mensagens de entrada WhatsApp aceitas.

    Desabilitar globalmente:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Substituição por conta:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Turnos de auto-chat pulam confirmações de leitura mesmo quando habilitadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, divisão em blocos e mídia

<AccordionGroup>
  <Accordion title="Divisão de texto em blocos">
    - limite de bloco padrão: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - modo `newline` prefere limites de parágrafo (linhas em branco), depois recorre à divisão segura por tamanho
  </Accordion>

  <Accordion title="Comportamento de mídia de saída">
    - suporta payloads de imagem, vídeo, áudio (nota de voz PTT) e documento
    - `audio/ogg` é reescrito para `audio/ogg; codecs=opus` para compatibilidade com nota de voz
    - reprodução de GIF animado é suportada via `gifPlayback: true` em envios de vídeo
    - legendas são aplicadas ao primeiro item de mídia ao enviar payloads de resposta com múltiplas mídias
    - a fonte de mídia pode ser HTTP(S), `file://` ou caminhos locais
  </Accordion>

  <Accordion title="Limites de tamanho de mídia e comportamento de fallback">
    - cap de salvamento de mídia de entrada: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - cap de envio de mídia de saída: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - substituições por conta usam `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - imagens são otimizadas automaticamente (redimensionamento/varredura de qualidade) para caber nos limites
    - em caso de falha no envio de mídia, o fallback do primeiro item envia aviso de texto em vez de descartar a resposta silenciosamente
  </Accordion>
</AccordionGroup>

## Reações de confirmação

O WhatsApp suporta reações de ack imediatas no recebimento de entrada via `channels.whatsapp.ackReaction`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Notas de comportamento:

- enviado imediatamente após a aceitação do inbound (pré-resposta)
- falhas são registradas em log mas não bloqueiam a entrega normal da resposta
- modo de grupo `mentions` reage em turnos acionados por menção; ativação de grupo `always` age como bypass para esta verificação
- o WhatsApp usa `channels.whatsapp.ackReaction` (o legado `messages.ackReaction` não é usado aqui)

## Múltiplas contas e credenciais

<AccordionGroup>
  <Accordion title="Seleção de conta e padrões">
    - ids de conta vêm de `channels.whatsapp.accounts`
    - seleção de conta padrão: `default` se presente, caso contrário o primeiro id de conta configurado (ordenado)
    - ids de conta são normalizados internamente para busca
  </Accordion>

  <Accordion title="Caminhos de credenciais e compatibilidade legada">
    - caminho de auth atual: `~/.opencraft/credentials/whatsapp/<accountId>/creds.json`
    - arquivo de backup: `creds.json.bak`
    - auth padrão legado em `~/.opencraft/credentials/` ainda é reconhecido/migrado para fluxos de conta padrão
  </Accordion>

  <Accordion title="Comportamento de logout">
    `opencraft channels logout --channel whatsapp [--account <id>]` limpa o estado de auth do WhatsApp para aquela conta.

    Em diretórios de auth legados, `oauth.json` é preservado enquanto os arquivos de auth do Baileys são removidos.

  </Accordion>
</AccordionGroup>

## Ferramentas, ações e escritas de config

- O suporte a ferramentas do agente inclui a ação de reação do WhatsApp (`react`).
- Controles de ação:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Escritas de config iniciadas pelo canal são habilitadas por padrão (desabilitar via `channels.whatsapp.configWrites=false`).

## Solução de problemas

<AccordionGroup>
  <Accordion title="Não vinculado (QR necessário)">
    Sintoma: o status do canal reporta não vinculado.

    Correção:

    ```bash
    opencraft channels login --channel whatsapp
    opencraft channels status
    ```

  </Accordion>

  <Accordion title="Vinculado mas desconectado / loop de reconexão">
    Sintoma: conta vinculada com desconexões repetidas ou tentativas de reconexão.

    Correção:

    ```bash
    opencraft doctor
    opencraft logs --follow
    ```

    Se necessário, vincule novamente com `channels login`.

  </Accordion>

  <Accordion title="Sem listener ativo ao enviar">
    Envios de saída falham rapidamente quando nenhum listener de gateway ativo existe para a conta de destino.

    Certifique-se de que o gateway está em execução e a conta está vinculada.

  </Accordion>

  <Accordion title="Mensagens de grupo inesperadamente ignoradas">
    Verifique nesta ordem:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas da lista de permissão `groups`
    - controle de menção (`requireMention` + padrões de menção)
    - chaves duplicadas em `opencraft.json` (JSON5): entradas posteriores substituem as anteriores, então mantenha um único `groupPolicy` por escopo

  </Accordion>

  <Accordion title="Aviso de runtime Bun">
    O runtime do gateway WhatsApp deve usar Node. O Bun é sinalizado como incompatível para operação estável do gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Referências de configuração

Referência principal:

- [Referência de configuração - WhatsApp](/gateway/configuration-reference#whatsapp)

Campos de alto valor do WhatsApp:

- acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`
- múltiplas contas: `accounts.<id>.enabled`, `accounts.<id>.authDir`, substituições em nível de conta
- operações: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamento de sessão: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## Relacionados

- [Pareamento](/channels/pairing)
- [Roteamento de canal](/channels/channel-routing)
- [Roteamento multi-agente](/concepts/multi-agent)
- [Solução de problemas](/channels/troubleshooting)
