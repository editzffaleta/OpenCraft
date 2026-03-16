---
summary: "Comportamento e config para tratamento de mensagens de grupo no WhatsApp (mentionPatterns são compartilhados entre superfícies)"
read_when:
  - Alterando regras de mensagem de grupo ou menções
title: "Mensagens de Grupo"
---

# Mensagens de grupo (canal WhatsApp web)

Objetivo: deixar o OpenCraft em grupos do WhatsApp, acordar apenas quando mencionado e manter aquela thread separada da sessão pessoal de DM.

Nota: `agents.list[].groupChat.mentionPatterns` agora é usado pelo Telegram/Discord/Slack/iMessage também; este doc foca no comportamento específico do WhatsApp. Para configurações multi-agente, defina `agents.list[].groupChat.mentionPatterns` por agente (ou use `messages.groupChat.mentionPatterns` como fallback global).

## O que está implementado (2025-12-03)

- Modos de ativação: `mention` (padrão) ou `always`. `mention` requer um ping (real @menções do WhatsApp via `mentionedJids`, padrões regex seguros ou o E.164 do bot em qualquer lugar no texto). `always` acorda o agente em cada mensagem mas ele deve responder apenas quando puder agregar valor significativo; caso contrário retorna o token silencioso `NO_REPLY`. Os padrões podem ser definidos na config (`channels.whatsapp.groups`) e substituídos por grupo via `/activation`. Quando `channels.whatsapp.groups` está definido, também age como uma allowlist de grupo (inclua `"*"` para permitir todos).
- Política de grupo: `channels.whatsapp.groupPolicy` controla se as mensagens de grupo são aceitas (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` explícito). O padrão é `allowlist` (bloqueado até adicionar remetentes).
- Sessões por grupo: chaves de sessão parecem com `agent:<agentId>:whatsapp:group:<jid>` para que comandos como `/verbose on` ou `/think high` (enviados como mensagens independentes) sejam escopados para aquele grupo; o estado do DM pessoal não é afetado. Heartbeats são ignorados para threads de grupo.
- Injeção de contexto: mensagens de grupo **somente pendentes** (padrão 50) que _não_ acionaram uma execução são prefixadas em `[Chat messages since your last reply - for context]`, com a linha acionadora em `[Current message - respond to this]`. Mensagens já na sessão não são reinjetadas.
- Exposição do remetente: cada lote de grupo termina com `[from: Nome do Remetente (+E164)]` para que o agente saiba quem está falando.
- Efêmero/view-once: fazemos unwrap deles antes de extrair texto/menções, então pings dentro deles ainda acionam.
- System prompt de grupo: no primeiro turno de uma sessão de grupo (e sempre que `/activation` muda o modo) injetamos um blurb curto no system prompt como `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+55...), Bob (+55...), … Activation: trigger-only … Address the specific sender noted in the message context.` Se os metadados não estiverem disponíveis, ainda informamos ao agente que é um chat em grupo.

## Exemplo de config (WhatsApp)

Adicione um bloco `groupChat` ao `~/.opencraft/opencraft.json` para que pings de nome de exibição funcionem mesmo quando o WhatsApp remove o `@` visual no corpo do texto:

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
          mentionPatterns: ["@?opencraft", "\\+?5511999999999"],
        },
      },
    ],
  },
}
```

Notas:

- Os regexes são case-insensitive e usam os mesmos guardrails de regex seguro que outras superfícies de regex de config; padrões inválidos e repetição aninhada insegura são ignorados.
- O WhatsApp ainda envia menções canônicas via `mentionedJids` quando alguém toca o contato, então o fallback de número raramente é necessário mas é uma rede de segurança útil.

### Comando de ativação (somente proprietário)

Use o comando de chat em grupo:

- `/activation mention`
- `/activation always`

Apenas o número do proprietário (de `channels.whatsapp.allowFrom`, ou o próprio E.164 do bot quando não definido) pode mudar isso. Envie `/status` como mensagem independente no grupo para ver o modo de ativação atual.

## Como usar

1. Adicione sua conta do WhatsApp (a que está executando o OpenCraft) ao grupo.
2. Diga `@opencraft …` (ou inclua o número). Apenas remetentes na allowlist podem acioná-lo, a menos que você defina `groupPolicy: "open"`.
3. O prompt do agente incluirá o contexto recente do grupo mais o marcador final `[from: …]` para que ele possa endereçar a pessoa certa.
4. Diretivas de nível de sessão (`/verbose on`, `/think high`, `/new` ou `/reset`, `/compact`) se aplicam apenas à sessão daquele grupo; envie-as como mensagens independentes para que sejam registradas. Sua sessão de DM pessoal permanece independente.

## Teste / verificação

- Smoke manual:
  - Envie um ping `@opencraft` no grupo e confirme uma resposta que referencia o nome do remetente.
  - Envie um segundo ping e verifique se o bloco de histórico está incluído e limpo no próximo turno.
- Verifique os logs do gateway (execute com `--verbose`) para ver entradas `inbound web message` mostrando `from: <groupJid>` e o sufixo `[from: …]`.

## Considerações conhecidas

- Heartbeats são intencionalmente ignorados para grupos para evitar transmissões ruidosas.
- A supressão de eco usa a string combinada do lote; se você enviar texto idêntico duas vezes sem menções, apenas o primeiro receberá resposta.
- As entradas do store de sessão aparecerão como `agent:<agentId>:whatsapp:group:<jid>` no store de sessão (`~/.opencraft/agents/<agentId>/sessions/sessions.json` por padrão); uma entrada ausente apenas significa que o grupo ainda não acionou uma execução.
- Indicadores de digitação em grupos seguem `agents.defaults.typingMode` (padrão: `message` quando não mencionado).
