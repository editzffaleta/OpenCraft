---
summary: "Perguntas paralelas efêmeras com /btw"
read_when:
  - Você quer fazer uma pergunta rápida paralela sobre a sessão atual
  - Você está implementando ou depurando comportamento do BTW entre clientes
title: "Perguntas Paralelas BTW"
---

# Perguntas Paralelas BTW

`/btw` permite que você faça uma pergunta rápida paralela sobre a **sessão atual** sem
transformar essa pergunta em histórico normal de conversa.

É modelado após o comportamento `/btw` do Claude Code, mas adaptado à arquitetura
de Gateway e multi-canal do OpenCraft.

## O que faz

Quando você envia:

```text
/btw what changed?
```

O OpenCraft:

1. captura o contexto da sessão atual,
2. executa uma chamada de modelo separada **sem ferramentas**,
3. responde apenas a pergunta paralela,
4. deixa a execução principal em paz,
5. **não** escreve a pergunta ou resposta BTW no histórico da sessão,
6. emite a resposta como um **resultado paralelo ao vivo** em vez de uma mensagem normal do assistente.

O modelo mental importante é:

- mesmo contexto de sessão
- consulta paralela única separada
- sem chamadas de ferramenta
- sem poluição de contexto futuro
- sem persistência de transcrição

## O que não faz

`/btw` **não**:

- cria uma nova sessão durável,
- continua a tarefa principal inacabada,
- executa ferramentas ou loops de ferramenta do agente,
- escreve dados de pergunta/resposta BTW no histórico de transcrição,
- aparece em `chat.history`,
- sobrevive a um reload.

É intencionalmente **efêmero**.

## Como o contexto funciona

BTW usa a sessão atual como **contexto de fundo apenas**.

Se a execução principal está atualmente ativa, o OpenCraft captura o estado atual da mensagem
e inclui o prompt principal em andamento como contexto de fundo, enquanto
explicitamente diz ao modelo:

- responda apenas a pergunta paralela,
- não retome nem complete a tarefa principal inacabada,
- não emita chamadas de ferramenta ou pseudo-chamadas de ferramenta.

Isso mantém o BTW isolado da execução principal enquanto ainda o torna ciente
do que a sessão se trata.

## Modelo de entrega

BTW **não** é entregue como uma mensagem normal de transcrição do assistente.

No nível do protocolo do Gateway:

- chat normal do assistente usa o evento `chat`
- BTW usa o evento `chat.side_result`

Essa separação é intencional. Se o BTW reutilizasse o caminho normal do evento `chat`,
os clientes o tratariam como histórico regular de conversa.

Como o BTW usa um evento ao vivo separado e não é reproduzido do
`chat.history`, ele desaparece após o reload.

## Comportamento na superfície

### TUI

Na TUI, o BTW é renderizado inline na visão da sessão atual, mas permanece
efêmero:

- visivelmente distinto de uma resposta normal do assistente
- dispensável com `Enter` ou `Esc`
- não reproduzido no reload

### Canais externos

Em canais como Telegram, WhatsApp e Discord, o BTW é entregue como uma
resposta única claramente identificada porque essas superfícies não têm conceito
de overlay efêmero local.

A resposta ainda é tratada como resultado paralelo, não histórico normal da sessão.

### Control UI / web

O Gateway emite o BTW corretamente como `chat.side_result`, e o BTW não é incluído
no `chat.history`, então o contrato de persistência já está correto para web.

A Control UI atual ainda precisa de um consumidor dedicado de `chat.side_result` para
renderizar o BTW ao vivo no browser. Até que esse suporte do lado do cliente chegue, o BTW é uma
funcionalidade no nível do Gateway com comportamento completo na TUI e canais externos, mas ainda
não é uma UX completa no browser.

## Quando usar BTW

Use `/btw` quando quiser:

- uma esclarecimento rápido sobre o trabalho atual,
- uma resposta factual enquanto uma execução longa ainda está em progresso,
- uma resposta temporária que não deve se tornar parte do contexto futuro da sessão.

Exemplos:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Quando não usar BTW

Não use `/btw` quando quiser que a resposta se torne parte do
contexto de trabalho futuro da sessão.

Nesse caso, pergunte normalmente na sessão principal em vez de usar BTW.

## Relacionado

- [Slash commands](/tools/slash-commands)
- [Níveis de Thinking](/tools/thinking)
- [Sessão](/concepts/session)
