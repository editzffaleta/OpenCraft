---
summary: "Regras de roteamento por canal (WhatsApp, Telegram, Discord, Slack) e contexto compartilhado"
read_when:
  - Alterando o roteamento de canal ou comportamento de inbox
title: "Roteamento de Canal"
---

# Canais e roteamento

O OpenCraft roteia respostas **de volta ao canal de onde a mensagem veio**. O
modelo não escolhe um canal; o roteamento é determinístico e controlado pela
configuração do host.

## Termos-chave

- **Canal**: `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`, `webchat`.
- **AccountId**: instância de conta por canal (quando suportado).
- Conta padrão opcional por canal: `channels.<canal>.defaultAccount` escolhe
  qual conta é usada quando um caminho de saída não especifica `accountId`.
  - Em configurações com múltiplas contas, defina um padrão explícito (`defaultAccount` ou `accounts.default`) quando duas ou mais contas estiverem configuradas. Sem isso, o roteamento de fallback pode escolher o primeiro ID de conta normalizado.
- **AgentId**: um workspace isolado + store de sessão ("cérebro").
- **SessionKey**: a chave do bucket usada para armazenar contexto e controlar concorrência.

## Formatos de chave de sessão (exemplos)

Mensagens diretas colapsam para a sessão **principal** do agente:

- `agent:<agentId>:<mainKey>` (padrão: `agent:main:main`)

Grupos e canais permanecem isolados por canal:

- Grupos: `agent:<agentId>:<canal>:group:<id>`
- Canais/salas: `agent:<agentId>:<canal>:channel:<id>`

Threads:

- Threads do Slack/Discord adicionam `:thread:<threadId>` à chave base.
- Tópicos de fórum do Telegram incorporam `:topic:<topicId>` na chave de grupo.

Exemplos:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Fixação de rota de DM principal

Quando `session.dmScope` é `main`, mensagens diretas podem compartilhar uma sessão principal.
Para evitar que `lastRoute` da sessão seja sobrescrito por DMs de não-proprietários,
o OpenCraft infere um proprietário fixado a partir de `allowFrom` quando todas estas condições são verdadeiras:

- `allowFrom` tem exatamente uma entrada sem caractere curinga.
- A entrada pode ser normalizada para um ID de remetente concreto para aquele canal.
- O remetente do DM de entrada não corresponde a esse proprietário fixado.

Nesse caso de incompatibilidade, o OpenCraft ainda registra metadados de sessão de entrada, mas
ignora a atualização de `lastRoute` da sessão principal.

## Regras de roteamento (como um agente é escolhido)

O roteamento escolhe **um agente** para cada mensagem de entrada:

1. **Correspondência exata de peer** (`bindings` com `peer.kind` + `peer.id`).
2. **Correspondência de peer pai** (herança de thread).
3. **Correspondência de guild + papéis** (Discord) via `guildId` + `roles`.
4. **Correspondência de guild** (Discord) via `guildId`.
5. **Correspondência de equipe** (Slack) via `teamId`.
6. **Correspondência de conta** (`accountId` no canal).
7. **Correspondência de canal** (qualquer conta naquele canal, `accountId: "*"`).
8. **Agente padrão** (`agents.list[].default`, senão primeira entrada da lista, fallback para `main`).

Quando um binding inclui múltiplos campos de correspondência (`peer`, `guildId`, `teamId`, `roles`), **todos os campos fornecidos devem corresponder** para que aquele binding seja aplicado.

O agente correspondente determina qual workspace e store de sessão são usados.

## Grupos de transmissão (executar múltiplos agentes)

Grupos de transmissão permitem executar **múltiplos agentes** para o mesmo peer **quando o OpenCraft normalmente responderia** (por exemplo: em grupos do WhatsApp, após controle de menção/ativação).

Config:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+5511999999999": ["support", "logger"],
  },
}
```

Veja: [Grupos de Transmissão](/channels/broadcast-groups).

## Visão geral da config

- `agents.list`: definições de agentes nomeados (workspace, modelo, etc.).
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

## Armazenamento de sessão

Os stores de sessão ficam no diretório de estado (padrão `~/.opencraft`):

- `~/.opencraft/agents/<agentId>/sessions/sessions.json`
- Transcrições JSONL ficam junto ao store

Você pode substituir o caminho do store via `session.store` e templates com `{agentId}`.

A descoberta de sessão do gateway e do ACP também varre os stores de agente com backup em disco
sob a raiz padrão `agents/` e sob raízes de `session.store` com templates. Os stores descobertos
devem ficar dentro dessa raiz de agente resolvida e usar um arquivo `sessions.json` normal.
Symlinks e caminhos fora da raiz são ignorados.

## Comportamento do WebChat

O WebChat se anexa ao **agente selecionado** e padrão para a sessão principal do agente.
Por isso, o WebChat permite ver o contexto cross-canal para aquele agente em um único lugar.

## Contexto de resposta

As respostas de entrada incluem:

- `ReplyToId`, `ReplyToBody` e `ReplyToSender` quando disponíveis.
- Contexto citado é adicionado ao `Body` como um bloco `[Replying to ...]`.

Isso é consistente entre os canais.
