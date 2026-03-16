---
summary: "Proposta: modelo de autorização de comando de longo prazo para conversas vinculadas a ACP"
read_when:
  - Projetando comportamento de autenticação de comando nativo em canais/tópicos do Telegram/Discord vinculados a ACP
title: "Autorização de Comando Vinculado ACP (Proposta)"
---

# Autorização de Comando Vinculado ACP (Proposta)

Status: Proposto, **ainda não implementado**.

Este documento descreve um modelo de autorização de longo prazo para comandos nativos em
conversas vinculadas a ACP. É uma proposta de experimentos e não substitui
o comportamento de produção atual.

Para o comportamento implementado, leia o código-fonte e os testes em:

- `src/telegram/bot-native-commands.ts`
- `src/discord/monitor/native-command.ts`
- `src/auto-reply/reply/commands-core.ts`

## Problema

Hoje temos verificações específicas por comando (por exemplo `/new` e `/reset`) que
precisam funcionar dentro de canais/tópicos vinculados a ACP mesmo quando as listas de permissão estão vazias.
Isso resolve a dor imediata de UX, mas exceções baseadas em nome de comando não escalam.

## Forma de longo prazo

Mover a autorização de comando de lógica ad-hoc de handler para metadados de comando mais um
avaliador de política compartilhado.

### 1) Adicionar metadados de política de autenticação às definições de comando

Cada definição de comando deve declarar uma política de autenticação. Formato de exemplo:

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

Tanto os handlers nativos do Telegram quanto do Discord devem chamar o mesmo helper para evitar
divergência de comportamento.

### 3) Usar correspondência de vinculação como limite de bypass

Quando a política permite bypass de ACP vinculado, autorizar apenas se uma correspondência de vinculação
configurada foi resolvida para a conversa atual (não apenas porque a chave de sessão atual parece ACP).

Isso mantém o limite explícito e minimiza o alargamento acidental.

## Por que isso é melhor

- Escala para comandos futuros sem adicionar mais condicionais por nome de comando.
- Mantém o comportamento consistente entre canais.
- Preserva o modelo de segurança atual ao exigir correspondência de vinculação explícita.
- Mantém listas de permissão como proteção opcional em vez de requisito universal.

## Plano de implantação (futuro)

1. Adicionar campo de política de autenticação de comando aos tipos de registro de comando e dados de comando.
2. Implementar avaliador compartilhado e migrar handlers nativos do Telegram + Discord.
3. Mover `/new` e `/reset` para política orientada por metadados.
4. Adicionar testes por modo de política e superfície de canal.

## Não-Objetivos

- Esta proposta não muda o comportamento do ciclo de vida de sessão ACP.
- Esta proposta não exige listas de permissão para todos os comandos vinculados a ACP.
- Esta proposta não muda a semântica de vinculação de rota existente.

## Nota

Esta proposta é intencionalmente aditiva e não exclui nem substitui documentos de
experimentos existentes.
