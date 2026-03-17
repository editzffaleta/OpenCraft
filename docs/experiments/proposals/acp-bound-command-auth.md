---
summary: "Proposta: modelo de autorização de comando de longo prazo para conversas vinculadas a ACP"
read_when:
  - Projetando comportamento nativo de autenticação de comando em canais/tópicos vinculados a ACP do Telegram/Discord
title: "ACP Bound Command Authorization (Proposal)"
---

# Autorização de Comando Vinculado a ACP (Proposta)

Status: Proposto, **ainda não implementado**.

Este documento descreve um modelo de autorização de longo prazo para comandos nativos em
conversas vinculadas a ACP. É uma proposta experimental e não substitui
o comportamento atual de produção.

Para o comportamento implementado, leia o código-fonte e testes em:

- `src/telegram/bot-native-commands.ts`
- `src/discord/monitor/native-command.ts`
- `src/auto-reply/reply/commands-core.ts`

## Problema

Hoje temos verificações específicas por comando (por exemplo `/new` e `/reset`) que
precisam funcionar dentro de canais/tópicos vinculados a ACP mesmo quando listas de permissão estão vazias.
Isso resolve a dor imediata de UX, mas exceções baseadas em nome de comando não escalam.

## Formato de longo prazo

Mover autorização de comando de lógica ad-hoc de handler para metadados de comando mais um
avaliador de política compartilhado.

### 1) Adicionar metadados de política de autenticação às definições de comando

Cada definição de comando deve declarar uma política de autenticação. Formato exemplo:

```ts
type CommandAuthPolicy =
  | { mode: "owner_or_allowlist" } // padrão, comportamento estrito atual
  | { mode: "bound_acp_or_owner_or_allowlist" } // permitir em conversas ACP explicitamente vinculadas
  | { mode: "owner_only" };
```

`/new` e `/reset` usariam `bound_acp_or_owner_or_allowlist`.
A maioria dos outros comandos permaneceria `owner_or_allowlist`.

### 2) Compartilhar um avaliador entre canais

Introduzir um helper que avalia autenticação de comando usando:

- metadados de política do comando
- estado de autorização do remetente
- estado de vinculação de conversa resolvido

Tanto handlers nativos do Telegram quanto do Discord devem chamar o mesmo helper para evitar
divergência de comportamento.

### 3) Usar correspondência de vinculação como fronteira de bypass

Quando a política permite bypass de ACP vinculado, autorizar somente se uma correspondência de vinculação
configurada foi resolvida para a conversa atual (não apenas porque a chave de sessão atual
parece ser ACP).

Isso mantém a fronteira explícita e minimiza ampliação acidental.

## Por que isso é melhor

- Escala para futuros comandos sem adicionar mais condicionais de nome de comando.
- Mantém comportamento consistente entre canais.
- Preserva o modelo de segurança atual exigindo correspondência explícita de vinculação.
- Mantém listas de permissão como endurecimento opcional em vez de requisito universal.

## Plano de rollout (futuro)

1. Adicionar campo de política de autenticação de comando aos tipos e dados do registro de comandos.
2. Implementar avaliador compartilhado e migrar handlers nativos de Telegram + Discord.
3. Mover `/new` e `/reset` para política orientada a metadados.
4. Adicionar testes por modo de política e superfície de canal.

## Não-objetivos

- Esta proposta não altera o comportamento de ciclo de vida de sessão ACP.
- Esta proposta não exige listas de permissão para todos os comandos vinculados a ACP.
- Esta proposta não altera semânticas existentes de vinculação de rota.

## Nota

Esta proposta é intencionalmente aditiva e não deleta ou substitui documentos
experimentais existentes.
