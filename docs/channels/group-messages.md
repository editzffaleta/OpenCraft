---
summary: "Comportamento e configuracao para tratamento de mensagens de grupo do WhatsApp (mentionPatterns sao compartilhados entre superficies)"
read_when:
  - Changing group message rules or mentions
title: "Group Messages"
---

# Mensagens de grupo (canal web do WhatsApp)

Objetivo: permitir que o Clawd fique em grupos do WhatsApp, acorde apenas quando chamado, e mantenha essa thread separada da sessao pessoal de DM.

Nota: `agents.list[].groupChat.mentionPatterns` agora e usado por Telegram/Discord/Slack/iMessage tambem; este documento foca no comportamento especifico do WhatsApp. Para configuracoes multi-agente, defina `agents.list[].groupChat.mentionPatterns` por agente (ou use `messages.groupChat.mentionPatterns` como fallback global).

## O que esta implementado (2025-12-03)

- Modos de ativacao: `mention` (padrao) ou `always`. `mention` requer uma chamada (mencoes reais do WhatsApp via `mentionedJids`, padroes regex seguros, ou o E.164 do Bot em qualquer lugar no texto). `always` acorda o agente em cada mensagem, mas ele deve responder apenas quando puder agregar valor significativo; caso contrario, retorna o token silencioso `NO_REPLY`. Padroes podem ser definidos na configuracao (`channels.whatsapp.groups`) e substituidos por grupo via `/activation`. Quando `channels.whatsapp.groups` esta definido, tambem atua como uma lista de permitidos de grupo (inclua `"*"` para permitir todos).
- Politica de grupo: `channels.whatsapp.groupPolicy` controla se mensagens de grupo sao aceitas (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` explicito). O padrao e `allowlist` (bloqueado ate voce adicionar remetentes).
- Sessoes por grupo: chaves de sessao se parecem com `agent:<agentId>:whatsapp:group:<jid>` entao comandos como `/verbose on` ou `/think high` (enviados como mensagens standalone) sao limitados aquele grupo; o estado pessoal de DM nao e afetado. Heartbeats sao pulados para threads de grupo.
- Injecao de contexto: mensagens de grupo **somente pendentes** (padrao 50) que _nao_ acionaram uma execucao sao prefixadas sob `[Chat messages since your last reply - for context]`, com a linha acionadora sob `[Current message - respond to this]`. Mensagens ja na sessao nao sao reinjetadas.
- Exibicao do remetente: cada lote de grupo agora termina com `[from: Nome do Remetente (+E164)]` para que o Pi saiba quem esta falando.
- Efemero/visualizacao unica: desempacotamos antes de extrair texto/mencoes, entao chamadas dentro deles ainda acionam.
- Prompt de sistema de grupo: no primeiro turno de uma sessao de grupo (e sempre que `/activation` muda o modo) injetamos um pequeno texto no prompt do sistema como `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` Se os metadados nao estiverem disponiveis, ainda informamos ao agente que e um chat em grupo.

## Exemplo de configuracao (WhatsApp)

Adicione um bloco `groupChat` ao `~/.editzffaleta/OpenCraft.json` para que chamadas por nome de exibicao funcionem mesmo quando o WhatsApp remove o `@` visual no corpo do texto:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?opencraft", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Notas:

- Os regex sao case-insensitive e usam as mesmas protecoes de regex seguro que outras superficies de configuracao regex; padroes invalidos e repeticao aninhada insegura sao ignorados.
- O WhatsApp ainda envia mencoes canonicas via `mentionedJids` quando alguem toca no contato, entao o fallback por numero raramente e necessario, mas e uma rede de seguranca util.

### Comando de ativacao (somente proprietario)

Use o comando de chat em grupo:

- `/activation mention`
- `/activation always`

Apenas o numero do proprietario (de `channels.whatsapp.allowFrom`, ou o E.164 do proprio Bot quando nao definido) pode alterar isso. Envie `/status` como mensagem standalone no grupo para ver o modo de ativacao atual.

## Como usar

1. Adicione sua conta do WhatsApp (a que executa o OpenCraft) ao grupo.
2. Diga `@opencraft ...` (ou inclua o numero). Apenas remetentes permitidos podem acionar, a menos que voce defina `groupPolicy: "open"`.
3. O prompt do agente incluira o contexto recente do grupo mais o marcador `[from: ...]` para que ele possa se dirigir a pessoa certa.
4. Diretivas de nivel de sessao (`/verbose on`, `/think high`, `/new` ou `/reset`, `/compact`) se aplicam apenas a sessao daquele grupo; envie-as como mensagens standalone para que sejam registradas. Sua sessao pessoal de DM permanece independente.

## Teste / verificacao

- Teste manual:
  - Envie um ping `@opencraft` no grupo e confirme uma resposta que referencia o nome do remetente.
  - Envie um segundo ping e verifique se o bloco de historico e incluido e depois limpo no proximo turno.
- Verifique os logs do Gateway (execute com `--verbose`) para ver entradas `inbound web message` mostrando `from: <groupJid>` e o sufixo `[from: ...]`.

## Consideracoes conhecidas

- Heartbeats sao intencionalmente pulados para grupos para evitar broadcasts ruidosos.
- A supressao de eco usa a string combinada do lote; se voce enviar texto identico duas vezes sem mencoes, apenas o primeiro recebera uma resposta.
- Entradas do armazenamento de sessao aparecerao como `agent:<agentId>:whatsapp:group:<jid>` no armazenamento de sessao (`~/.opencraft/agents/<agentId>/sessions/sessions.json` por padrao); uma entrada ausente apenas significa que o grupo ainda nao acionou uma execucao.
- Indicadores de digitacao em grupos seguem `agents.defaults.typingMode` (padrao: `message` quando nao mencionado).
