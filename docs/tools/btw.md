---
summary: "Perguntas laterais efêmeras com /btw"
read_when:
  - Você quer fazer uma pergunta lateral rápida sobre a sessão atual
  - Você está implementando ou depurando o comportamento BTW em diferentes clientes
title: "Perguntas Laterais BTW"
---

# Perguntas Laterais BTW

`/btw` permite fazer uma pergunta lateral rápida sobre a **sessão atual** sem
transformar essa pergunta em histórico de conversa normal.

É modelado a partir do comportamento `/btw` do Claude Code, mas adaptado ao
Gateway e arquitetura multicanal do OpenCraft.

## O que faz

Quando você envia:

```text
/btw o que mudou?
```

O OpenCraft:

1. tira um snapshot do contexto da sessão atual,
2. executa uma chamada de modelo **sem ferramentas** separada,
3. responde apenas à pergunta lateral,
4. deixa a execução principal intacta,
5. **não** escreve a pergunta ou resposta BTW no histórico da sessão,
6. emite a resposta como um **resultado lateral ao vivo** em vez de uma mensagem normal do assistente.

O modelo mental importante é:

- mesmo contexto de sessão
- consulta lateral separada de uma única vez
- sem chamadas de ferramentas
- sem poluição de contexto futuro
- sem persistência no transcript

## O que não faz

`/btw` **não**:

- cria uma nova sessão durável,
- continua a tarefa principal inacabada,
- executa ferramentas ou loops de ferramentas do agente,
- escreve dados de pergunta/resposta BTW no histórico do transcript,
- aparece em `chat.history`,
- sobrevive a um recarregamento.

É intencionalmente **efêmero**.

## Como o contexto funciona

O BTW usa a sessão atual apenas como **contexto de fundo**.

Se a execução principal estiver ativa, o OpenCraft tira um snapshot do estado
atual da mensagem e inclui o prompt principal em andamento como contexto de fundo,
enquanto diz explicitamente ao modelo:

- responda apenas à pergunta lateral,
- não retome nem complete a tarefa principal inacabada,
- não emita chamadas de ferramentas nem pseudo-chamadas de ferramentas.

Isso mantém o BTW isolado da execução principal enquanto ainda o torna ciente
do que a sessão está tratando.

## Modelo de entrega

O BTW **não** é entregue como uma mensagem normal de transcript do assistente.

No nível do protocolo Gateway:

- o chat normal do assistente usa o evento `chat`
- o BTW usa o evento `chat.side_result`

Essa separação é intencional. Se o BTW reutilizasse o caminho do evento `chat` normal,
os clientes o tratariam como histórico de conversa regular.

Como o BTW usa um evento ao vivo separado e não é reproduzido a partir de
`chat.history`, ele desaparece após o recarregamento.

## Comportamento por superfície

### TUI

Na TUI, o BTW é renderizado inline na visualização da sessão atual, mas permanece
efêmero:

- visualmente distinto de uma resposta normal do assistente
- descartável com `Enter` ou `Esc`
- não reproduzido ao recarregar

### Canais externos

Em canais como Telegram, WhatsApp e Discord, o BTW é entregue como uma resposta
única claramente identificada, pois essas superfícies não têm conceito de overlay
efêmero local.

A resposta ainda é tratada como resultado lateral, não como histórico normal da sessão.

### UI de controle / web

O Gateway emite o BTW corretamente como `chat.side_result`, e o BTW não está incluído
em `chat.history`, então o contrato de persistência já está correto para web.

A UI de controle atual ainda precisa de um consumer dedicado `chat.side_result` para
renderizar o BTW ao vivo no navegador. Até que esse suporte do lado do cliente chegue,
o BTW é um recurso no nível do Gateway com comportamento completo na TUI e em canais
externos, mas ainda não uma UX de navegador completa.

## Quando usar BTW

Use `/btw` quando quiser:

- uma esclarecimento rápido sobre o trabalho atual,
- uma resposta factual lateral enquanto uma execução longa ainda está em progresso,
- uma resposta temporária que não deve fazer parte do contexto futuro da sessão.

Exemplos:

```text
/btw que arquivo estamos editando?
/btw o que significa esse erro?
/btw resuma a tarefa atual em uma frase
/btw quanto é 17 * 19?
```

## Quando não usar BTW

Não use `/btw` quando quiser que a resposta se torne parte do contexto de
trabalho futuro da sessão.

Nesse caso, pergunte normalmente na sessão principal em vez de usar o BTW.

## Relacionado

- [Slash commands](/tools/slash-commands)
- [Níveis de Thinking](/tools/thinking)
- [Sessão](/concepts/session)
