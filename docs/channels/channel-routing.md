---
summary: "Regras de roteamento por canal (WhatsApp, Telegram, Discord, Slack) e contexto compartilhado"
read_when:
  - Changing channel routing or inbox behavior
title: "Channel Routing"
---

# Canais e roteamento

O OpenCraft roteia as respostas **de volta ao canal de onde a mensagem veio**. O
modelo nao escolhe um canal; o roteamento e deterministico e controlado pela
configuracao do host.

## Termos-chave

- **Canal**: `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`, `webchat`.
- **AccountId**: instancia de conta por canal (quando suportado).
- Conta padrao opcional do canal: `channels.<channel>.defaultAccount` escolhe
  qual conta e usada quando um caminho de saida nao especifica `accountId`.
  - Em configuracoes com multiplas contas, defina um padrao explicito (`defaultAccount` ou `accounts.default`) quando duas ou mais contas estiverem configuradas. Sem isso, o roteamento de fallback pode escolher o primeiro ID de conta normalizado.
- **AgentId**: um workspace isolado + armazenamento de sessao ("cerebro").
- **SessionKey**: a chave do bucket usada para armazenar contexto e controlar concorrencia.

## Formatos de chave de sessao (exemplos)

Mensagens diretas sao agrupadas na sessao **principal** do agente:

- `agent:<agentId>:<mainKey>` (padrao: `agent:main:main`)

Grupos e canais permanecem isolados por canal:

- Grupos: `agent:<agentId>:<channel>:group:<id>`
- Canais/salas: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Threads do Slack/Discord adicionam `:thread:<threadId>` a chave base.
- Topicos de forum do Telegram incorporam `:topic:<topicId>` na chave do grupo.

Exemplos:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Fixacao de rota de DM principal

Quando `session.dmScope` e `main`, mensagens diretas podem compartilhar uma sessao principal.
Para evitar que o `lastRoute` da sessao seja sobrescrito por DMs de nao-proprietarios,
o OpenCraft infere um proprietario fixo a partir de `allowFrom` quando todas estas condicoes sao verdadeiras:

- `allowFrom` tem exatamente uma entrada nao-coringa.
- A entrada pode ser normalizada para um ID de remetente concreto para aquele canal.
- O remetente da DM de entrada nao corresponde ao proprietario fixo.

Nesse caso de incompatibilidade, o OpenCraft ainda registra os metadados da sessao de entrada, mas
pula a atualizacao do `lastRoute` da sessao principal.

## Regras de roteamento (como um agente e escolhido)

O roteamento escolhe **um agente** para cada mensagem de entrada:

1. **Correspondencia exata de peer** (`bindings` com `peer.kind` + `peer.id`).
2. **Correspondencia de peer pai** (heranca de thread).
3. **Correspondencia de guild + roles** (Discord) via `guildId` + `roles`.
4. **Correspondencia de guild** (Discord) via `guildId`.
5. **Correspondencia de team** (Slack) via `teamId`.
6. **Correspondencia de conta** (`accountId` no canal).
7. **Correspondencia de canal** (qualquer conta naquele canal, `accountId: "*"`).
8. **Agente padrao** (`agents.list[].default`, senao primeira entrada da lista, fallback para `main`).

Quando um binding inclui multiplos campos de correspondencia (`peer`, `guildId`, `teamId`, `roles`), **todos os campos fornecidos devem corresponder** para que aquele binding se aplique.

O agente correspondente determina qual workspace e armazenamento de sessao sao usados.

## Broadcast groups (executar multiplos agentes)

Broadcast groups permitem executar **multiplos agentes** para o mesmo peer **quando o OpenCraft normalmente responderia** (por exemplo: em grupos do WhatsApp, apos controle de mencao/ativacao).

Configuracao:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Veja: [Broadcast Groups](/channels/broadcast-groups).

## Visao geral da configuracao

- `agents.list`: definicoes de agentes nomeados (workspace, modelo, etc.).
- `bindings`: mapeia canais/contas/peers de entrada para agentes.

Exemplo:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.opencraft/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Armazenamento de sessao

Os armazenamentos de sessao ficam no diretorio de estado (padrao `~/.opencraft`):

- `~/.opencraft/agents/<agentId>/sessions/sessions.json`
- Transcricoes JSONL ficam junto ao armazenamento

Voce pode substituir o caminho do armazenamento via `session.store` e templates `{agentId}`.

O Gateway e a descoberta de sessao ACP tambem escaneiam armazenamentos de agentes em disco sob a
raiz padrao `agents/` e sob raizes de `session.store` com template. Armazenamentos
descobertos devem permanecer dentro da raiz resolvida do agente e usar um arquivo
`sessions.json` regular. Symlinks e caminhos fora da raiz sao ignorados.

## Comportamento do WebChat

O WebChat se conecta ao **agente selecionado** e usa como padrao a sessao principal
do agente. Por causa disso, o WebChat permite ver o contexto entre canais para aquele
agente em um so lugar.

## Contexto de resposta

Respostas de entrada incluem:

- `ReplyToId`, `ReplyToBody` e `ReplyToSender` quando disponiveis.
- O contexto citado e adicionado ao `Body` como um bloco `[Replying to ...]`.

Isso e consistente entre canais.
