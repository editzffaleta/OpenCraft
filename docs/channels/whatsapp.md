---
summary: "Suporte ao canal WhatsApp, controles de acesso, comportamento de entrega e operações"
read_when:
  - Trabalhando no comportamento do canal WhatsApp/web ou roteamento de caixa de entrada
title: "WhatsApp"
---

# WhatsApp (Canal Web)

Status: pronto para produção via WhatsApp Web (Baileys). Gateway possui sessão(ões) vinculada(s).

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/channels/pairing">
    A política padrão de DM é pareamento para remetentes desconhecidos.
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
  <Step title="Configure a política de acesso do WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
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

  <Step title="Aprovar primeira solicitação de pareamento (se usando modo de pareamento)">

```bash
opencraft pairing list whatsapp
opencraft pairing approve whatsapp <CODE>
```

    Solicitações de pareamento expiram após 1 hora. Solicitações pendentes são limitadas a 3 por canal.

  </Step>
</Steps>

<Note>
O OpenCraft recomenda executar o WhatsApp em um número separado quando possível. (O fluxo de metadados de canal e configuração são otimizados para essa configuração, mas configurações de número pessoal também são suportadas.)
</Note>

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    Este é o modo operacional mais limpo:

    - identidade WhatsApp separada para OpenCraft
    - limites de roteamento e listas de permissões de DM mais claros
    - menor chance de confusão de auto-chat

    Padrão de política mínima:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fallback de número pessoal">
    A integração suporta modo de número pessoal e escreve uma linha de base amigável a auto-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclui seu número pessoal
    - `selfChatMode: true`

    Em tempo de execução, proteções de auto-chat usam o número pessoal vinculado e `allowFrom`.

  </Accordion>

  <Accordion title="Escopo do canal somente WhatsApp Web">
    O canal da plataforma de mensagens é baseado em WhatsApp Web (`Baileys`) na arquitetura atual do canal OpenCraft.

    Não há canal de mensagens WhatsApp Twilio separado no registro de canal de chat integrado.

  </Accordion>
</AccordionGroup>

## Modelo de tempo de execução

- Gateway possui o socket WhatsApp e loop de reconexão.
- Envios de saída requerem um ouvinte ativo do WhatsApp para a conta de destino.
- Chats de status e transmissão são ignorados (`@status`, `@broadcast`).
- Chats diretos usam regras de sessão de DM (`session.dmScope`; padrão `main` coloca DMs na sessão principal do agente).
- Sessões de grupo são isoladas (`agent:<agentId>:whatsapp:group:<jid>`).

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de DM">
    `channels.whatsapp.dmPolicy` controla o acesso ao chat direto:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (requer `allowFrom` para incluir `"*"`)
    - `disabled`

    `allowFrom` aceita números em estilo E.164 (normalizados internamente).

    Substituição de multi-conta: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) têm precedência sobre padrões de nível de canal para essa conta.

    Detalhes do comportamento em tempo de execução:

    - pareamentos são persistidos no armazenamento de permissões do canal e mesclados com `allowFrom` configurado
    - se nenhuma lista de permissões for configurada, o número pessoal vinculado é permitido por padrão
    - DMs de saída `fromMe` nunca são pareados automaticamente

  </Tab>

  <Tab title="Política de grupo + listas de permissões">
    O acesso ao grupo tem duas camadas:

    1. **Lista de permissões de membros do grupo** (`channels.whatsapp.groups`)
       - se `groups` for omitido, todos os grupos são elegíveis
       - se `groups` estiver presente, funciona como uma lista de permissões de grupo (`"*"` permitido)

    2. **Política de remetente do grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: lista de permissões de remetente ignorada
       - `allowlist`: remetente deve corresponder a `groupAllowFrom` (ou `*`)
       - `disabled`: bloquear toda entrada de grupo

    Fallback de lista de permissões de remetente:

    - se `groupAllowFrom` não estiver definido, tempo de execução retorna para `allowFrom` quando disponível
    - listas de permissões de remetente são avaliadas antes de ativação de menção/resposta

    Nota: se não existir bloco `channels.whatsapp` nenhum, fallback de política de grupo em tempo de execução é `allowlist` (com log de aviso), mesmo se `channels.defaults.groupPolicy` estiver definido.

  </Tab>

  <Tab title="Menções + /activation">
    Respostas de grupo requerem menção por padrão.

    A detecção de menção inclui:

    - menções explícitas do WhatsApp da identidade do bot
    - padrões de regex de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - detecção implícita de resposta ao bot (remetente de resposta corresponde à identidade do bot)

    Nota de segurança:

    - citação/resposta apenas satisfaz gating de menção; **não** concede autorização de remetente
    - com `groupPolicy: "allowlist"`, remetentes não autorizados ainda estão bloqueados mesmo se responderem a uma mensagem de usuário autorizado

    Comando de ativação de nível de sessão:

    - `/activation mention`
    - `/activation always`

    `activation` atualiza o estado da sessão (não a configuração global). É protegido pelo proprietário.

  </Tab>
</Tabs>

## Comportamento de número pessoal e auto-chat

Quando o número pessoal vinculado também está presente em `allowFrom`, proteções de auto-chat do WhatsApp são ativadas:

- pular recibos de leitura para turnos de auto-chat
- ignorar comportamento de acionamento automático de menção-JID que o pingueria
- se `messages.responsePrefix` não estiver definido, respostas de auto-chat usam como padrão `[{identity.name}]` ou `[opencraft]`

## Normalização de mensagem e contexto

<AccordionGroup>
  <Accordion title="Envelope de entrada + contexto de resposta">
    Mensagens de entrada do WhatsApp são envolvidas no envelope de entrada compartilhado.

    Se existir uma resposta entre aspas, o contexto é anexado neste formulário:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Campos de metadados de resposta também são preenchidos quando disponíveis (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 do remetente).

  </Accordion>

  <Accordion title="Placeholders de mídia e extração de localização/contato">
    Mensagens de entrada apenas de mídia são normalizadas com placeholders como:

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
    - `0` desativa

    Marcadores de injeção:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Recibos de leitura">
    Recibos de leitura são habilitados por padrão para mensagens de entrada do WhatsApp aceitas.

    Desativar globalmente:

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

    Turnos de auto-chat pulam recibos de leitura mesmo quando habilitados globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, divisão em blocos e mídia

<AccordionGroup>
  <Accordion title="Divisão em blocos de texto">
    - limite de bloco padrão: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - modo `newline` prefere limites de parágrafo (linhas em branco) e então retorna para divisão segura de comprimento
  </Accordion>

  <Accordion title="Comportamento de mídia de saída">
    - suporta payloads de imagem, vídeo, áudio (nota de voz PTT) e documento
    - `audio/ogg` é reescrito para `audio/ogg; codecs=opus` para compatibilidade com nota de voz
    - playback de GIF animado é suportado via `gifPlayback: true` em envios de vídeo
    - legendas são aplicadas ao primeiro item de mídia ao enviar payloads de resposta de mídia múltipla
    - fonte de mídia pode ser HTTP(S), `file://` ou caminhos locais
  </Accordion>

  <Accordion title="Limites de tamanho de mídia e comportamento de fallback">
    - limite de cap de mídia de entrada: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - limite de cap de envio de mídia de saída: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - substituições por conta usam `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - imagens são otimizadas automaticamente (redimensionar/varredura de qualidade) para se adequar aos limites
    - na falha de envio de mídia, envio de fallback do primeiro item envia aviso de texto em vez de descartar a resposta silenciosamente
  </Accordion>
</AccordionGroup>

## Reações de reconhecimento

WhatsApp suporta reações de reconhecimento imediatas no recebimento de entrada via `channels.whatsapp.ackReaction`.

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

- enviado imediatamente após a entrada ser aceita (pré-resposta)
- falhas são registradas mas não bloqueiam entrega normal de resposta
- modo de grupo `mentions` reage em turnos acionados por menção; ativação de grupo `always` funciona como bypass para essa verificação
- WhatsApp usa `channels.whatsapp.ackReaction` (legado `messages.ackReaction` não é usado aqui)

## Multi-conta e credenciais

<AccordionGroup>
  <Accordion title="Seleção de conta e padrões">
    - ids de conta vêm de `channels.whatsapp.accounts`
    - seleção de conta padrão: `default` se presente, caso contrário, primeiro id de conta configurado (classificado)
    - ids de conta são normalizados internamente para lookup
  </Accordion>

  <Accordion title="Caminhos de credencial e compatibilidade com versão legada">
    - caminho de auth atual: `~/.opencraft/credentials/whatsapp/<accountId>/creds.json`
    - arquivo de backup: `creds.json.bak`
    - auth padrão legado em `~/.opencraft/credentials/` ainda é reconhecido/migrado para fluxos de conta padrão
  </Accordion>

  <Accordion title="Comportamento de logout">
    `opencraft channels logout --channel whatsapp [--account <id>]` limpa o estado de auth do WhatsApp para essa conta.

    Em diretórios de auth legados, `oauth.json` é preservado enquanto arquivos de auth do Baileys são removidos.

  </Accordion>
</AccordionGroup>

## Ferramentas, ações e gravações de config

- Suporte de ferramenta do agente inclui ação de reação do WhatsApp (`react`).
- Portões de ação:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Gravações de config iniciadas por canal são habilitadas por padrão (desabilitar via `channels.whatsapp.configWrites=false`).

## Solução de problemas

<AccordionGroup>
  <Accordion title="Não vinculado (QR necessário)">
    Sintoma: status do canal relata não vinculado.

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

    Se necessário, revincule com `channels login`.

  </Accordion>

  <Accordion title="Nenhum ouvinte ativo ao enviar">
    Envios de saída falham rapidamente quando não existe ouvinte de gateway ativo para a conta de destino.

    Certifique-se de que o gateway está em execução e a conta está vinculada.

  </Accordion>

  <Accordion title="Mensagens de grupo inesperadamente ignoradas">
    Verifique nesta ordem:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas de lista de permissões `groups`
    - gating de menção (`requireMention` + padrões de menção)
    - chaves duplicadas em `opencraft.json` (JSON5): entradas posteriores substituem as anteriores, portanto mantenha um único `groupPolicy` por escopo

  </Accordion>

  <Accordion title="Aviso de tempo de execução Bun">
    O tempo de execução do gateway WhatsApp deve usar Node. Bun é sinalizado como incompatível para operação estável do gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Ponteiros de referência de configuração

Referência primária:

- [Referência de configuração - WhatsApp](/gateway/configuration-reference#whatsapp)

Campos de alto sinal do WhatsApp:

- acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`
- multi-conta: `accounts.<id>.enabled`, `accounts.<id>.authDir`, substituições de nível de conta
- operações: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamento de sessão: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## Relacionados

- [Pareamento](/channels/pairing)
- [Roteamento de canal](/channels/channel-routing)
- [Roteamento multi-agente](/concepts/multi-agent)
- [Solução de problemas](/channels/troubleshooting)
