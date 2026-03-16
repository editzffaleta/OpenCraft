---
summary: "Status e próximos passos para desacoplar listeners do gateway Discord de turnos de agente de longa duração com um worker de entrada assíncrono específico do Discord"
owner: "opencraft"
status: "in_progress"
last_updated: "2026-03-05"
title: "Plano do Worker de Entrada Assíncrono do Discord"
---

# Plano do Worker de Entrada Assíncrono do Discord

## Objetivo

Remover o timeout do listener Discord como modo de falha visível ao usuário, tornando os turnos de entrada Discord assíncronos:

1. O listener do gateway aceita e normaliza eventos de entrada rapidamente.
2. Uma fila de execução Discord armazena jobs serializados com chave pelo mesmo limite de ordenação que usamos hoje.
3. Um worker executa o turno real do agente fora do tempo de vida do listener Carbon.
4. As respostas são entregues de volta ao canal ou thread de origem após a conclusão da execução.

Esta é a correção de longo prazo para execuções Discord enfileiradas que atingem timeout em `channels.discord.eventQueue.listenerTimeout` enquanto a execução do agente em si ainda está progredindo.

## Status atual

Este plano está parcialmente implementado.

Já concluído:

- O timeout do listener Discord e o timeout de execução Discord agora são configurações separadas.
- Turnos Discord de entrada aceitos são enfileirados em `src/discord/monitor/inbound-worker.ts`.
- O worker agora possui o turno de longa duração em vez do listener Carbon.
- A ordenação por rota existente é preservada pela chave da fila.
- Cobertura de regressão de timeout existe para o caminho do worker Discord.

O que isso significa em linguagem simples:

- o bug de timeout de produção está corrigido
- o turno de longa duração não morre mais apenas porque o orçamento do listener Discord expira
- a arquitetura do worker ainda não está terminada

O que ainda está faltando:

- `DiscordInboundJob` ainda está apenas parcialmente normalizado e ainda carrega referências de runtime ao vivo
- semântica de comandos (`stop`, `new`, `reset`, controles de sessão futuros) ainda não são totalmente nativas do worker
- observabilidade e status do operador do worker ainda são mínimos
- ainda não há durabilidade de reinicialização

## Por Que Existe

O comportamento atual vincula o turno completo do agente ao tempo de vida do listener:

- `src/discord/monitor/listeners.ts` aplica o timeout e o limite de abort.
- `src/discord/monitor/message-handler.ts` mantém a execução enfileirada dentro desse limite.
- `src/discord/monitor/message-handler.process.ts` realiza carregamento de mídia, roteamento, dispatch, digitação, streaming de rascunho e entrega de resposta final inline.

Essa arquitetura tem duas propriedades ruins:

- turnos longos mas saudáveis podem ser abortados pelo watchdog do listener
- usuários podem não receber resposta mesmo quando o runtime downstream teria produzido uma

Aumentar o timeout ajuda, mas não muda o modo de falha.

## Não-Objetivos

- Não redesenhar canais não Discord nesta passagem.
- Não ampliar isso para um framework de worker genérico de todos os canais na primeira implementação.
- Não extrair ainda uma abstração de worker de entrada compartilhada entre canais; apenas compartilhar primitivas de baixo nível quando a duplicação for óbvia.
- Não adicionar recuperação durável de falhas na primeira passagem a menos que necessário para publicar com segurança.
- Não mudar seleção de rota, semântica de vinculação ou política ACP neste plano.

## Restrições Atuais

O caminho de processamento Discord atual ainda depende de alguns objetos de runtime ao vivo que não devem permanecer dentro do payload do job de longo prazo:

- Carbon `Client`
- formatos de evento Discord brutos
- mapa de histórico de guild em memória
- callbacks do gerenciador de vinculação a thread
- estado de digitação ao vivo e de stream de rascunho

Já movemos a execução para uma fila de worker, mas o limite de normalização ainda está incompleto. Agora o worker é "executar mais tarde no mesmo processo com alguns dos mesmos objetos ao vivo", não um limite de job estritamente baseado em dados.

## Arquitetura Alvo

### 1. Estágio do listener

`DiscordMessageListener` permanece como ponto de entrada, mas seu trabalho torna-se:

- executar verificações de preflight e política
- normalizar entrada aceita em um `DiscordInboundJob` serializável
- enfileirar o job em uma fila assíncrona por sessão ou por canal
- retornar imediatamente ao Carbon assim que o enfileiramento for bem-sucedido

O listener não deve mais possuir o tempo de vida do turno LLM de ponta a ponta.

### 2. Payload normalizado do job

Introduzir um descritor de job serializável que contenha apenas os dados necessários para executar o turno mais tarde.

Formato mínimo:

- identidade de rota
  - `agentId`
  - `sessionKey`
  - `accountId`
  - `channel`
- identidade de entrega
  - id do canal de destino
  - id da mensagem alvo de resposta
  - id da thread se presente
- identidade do remetente
  - id do remetente, label, username, tag
- contexto do canal
  - id do guild
  - nome ou slug do canal
  - metadados da thread
  - substituição do prompt de sistema resolvida
- corpo normalizado da mensagem
  - texto base
  - texto efetivo da mensagem
  - descritores de anexo ou referências de mídia resolvidas
- decisões de controle
  - resultado de requisito de menção
  - resultado de autorização de comando
  - metadados de sessão ou agente vinculado, se aplicável

O payload do job não deve conter objetos Carbon ao vivo ou closures mutáveis.

Status atual de implementação:

- parcialmente concluído
- `src/discord/monitor/inbound-job.ts` existe e define o handoff para o worker
- o payload ainda contém contexto de runtime Discord ao vivo e deve ser reduzido

### 3. Estágio do worker

Adicionar um runner de worker específico do Discord responsável por:

- reconstruir o contexto de turno a partir de `DiscordInboundJob`
- carregar mídia e quaisquer metadados adicionais do canal necessários para a execução
- despachar o turno do agente
- entregar payloads de resposta final
- atualizar status e diagnósticos

Localização recomendada:

- `src/discord/monitor/inbound-worker.ts`
- `src/discord/monitor/inbound-job.ts`

### 4. Modelo de ordenação

A ordenação deve permanecer equivalente a hoje para um dado limite de rota.

Chave recomendada:

- usar a mesma lógica de chave de fila de `resolveDiscordRunQueueKey(...)`

Isso preserva o comportamento existente:

- uma conversa de agente vinculado não se intercala consigo mesma
- canais Discord diferentes ainda podem progredir de forma independente

### 5. Modelo de timeout

Após a transição, há duas classes de timeout separadas:

- timeout do listener
  - cobre apenas normalização e enfileiramento
  - deve ser curto
- timeout de execução
  - opcional, pertencente ao worker, explícito e visível ao usuário
  - não deve ser herdado acidentalmente das configurações do listener Carbon

Isso remove o acoplamento acidental atual entre "listener do gateway Discord permaneceu ativo" e "execução do agente está saudável".

## Fases de implementação recomendadas

### Fase 1: limite de normalização

- Status: parcialmente implementado
- Concluído:
  - extraído `buildDiscordInboundJob(...)`
  - adicionados testes de handoff do worker
- Restante:
  - tornar `DiscordInboundJob` somente dados simples
  - mover dependências de runtime ao vivo para serviços de propriedade do worker em vez de payload por job
  - parar de reconstruir contexto de processo costurando de volta refs do listener ao vivo no job

### Fase 2: fila de worker em memória

- Status: implementado
- Concluído:
  - adicionado `DiscordInboundWorkerQueue` com chave pela chave de fila de execução resolvida
  - listener enfileira jobs em vez de aguardar diretamente `processDiscordMessage(...)`
  - worker executa jobs em-processo, somente em memória

Esta é a primeira transição funcional.

### Fase 3: separação de processo

- Status: não iniciado
- Mover propriedade de entrega, digitação e streaming de rascunho para adaptadores voltados ao worker.
- Substituir uso direto de contexto de preflight ao vivo com reconstrução de contexto do worker.
- Manter `processDiscordMessage(...)` temporariamente como fachada se necessário, depois dividir.

### Fase 4: semântica de comandos

- Status: não iniciado
  Garantir que comandos Discord nativos ainda se comportem corretamente quando o trabalho está enfileirado:

- `stop`
- `new`
- `reset`
- quaisquer comandos de controle de sessão futuros

A fila do worker deve expor estado de execução suficiente para que os comandos possam atingir o turno ativo ou enfileirado.

### Fase 5: observabilidade e UX do operador

- Status: não iniciado
- emitir profundidade de fila e contagens de worker ativo no status do monitor
- registrar tempo de enfileiramento, tempo de início, tempo de conclusão e timeout ou motivo de cancelamento
- surfaçar timeouts de propriedade do worker ou falhas de entrega claramente nos logs

### Fase 6: acompanhamento de durabilidade opcional

- Status: não iniciado
  Somente após a versão em memória estar estável:

- decidir se jobs Discord enfileirados devem sobreviver a reinicializações do gateway
- se sim, persistir descritores de job e checkpoints de entrega
- se não, documentar o limite explícito em memória

Este deve ser um acompanhamento separado a menos que a recuperação de reinicialização seja necessária para publicar.

## Impacto em arquivos

Arquivos primários atuais:

- `src/discord/monitor/listeners.ts`
- `src/discord/monitor/message-handler.ts`
- `src/discord/monitor/message-handler.preflight.ts`
- `src/discord/monitor/message-handler.process.ts`
- `src/discord/monitor/status.ts`

Arquivos de worker atuais:

- `src/discord/monitor/inbound-job.ts`
- `src/discord/monitor/inbound-worker.ts`
- `src/discord/monitor/inbound-job.test.ts`
- `src/discord/monitor/message-handler.queue.test.ts`

Próximos pontos de contato prováveis:

- `src/auto-reply/dispatch.ts`
- `src/discord/monitor/reply-delivery.ts`
- `src/discord/monitor/thread-bindings.ts`
- `src/discord/monitor/native-command.ts`

## Próximo passo agora

O próximo passo é tornar o limite do worker real em vez de parcial.

Fazer isso agora:

1. Mover dependências de runtime ao vivo para fora de `DiscordInboundJob`
2. Manter essas dependências na instância do worker Discord em vez disso
3. Reduzir jobs enfileirados a dados simples específicos do Discord:
   - identidade de rota
   - alvo de entrega
   - informações do remetente
   - snapshot normalizado de mensagem
   - decisões de controle e vinculação
4. Reconstruir contexto de execução do worker a partir desses dados simples dentro do worker

Na prática, isso significa que:

- `client`
- `threadBindings`
- `guildHistories`
- `discordRestFetch`
- outros handles mutáveis somente de runtime

devem parar de viver em cada job enfileirado e em vez disso viver no próprio worker ou atrás de adaptadores de propriedade do worker.

Após isso ser publicado, o próximo acompanhamento deve ser a limpeza de estado de comando para `stop`, `new` e `reset`.

## Plano de testes

Manter a cobertura de repro de timeout existente em:

- `src/discord/monitor/message-handler.queue.test.ts`

Adicionar novos testes para:

1. listener retorna após enfileiramento sem aguardar o turno completo
2. ordenação por rota é preservada
3. canais diferentes ainda executam de forma concorrente
4. respostas são entregues ao destino de mensagem original
5. `stop` cancela a execução de propriedade do worker ativo
6. falha do worker produz diagnósticos visíveis sem bloquear jobs posteriores
7. canais Discord vinculados a ACP ainda roteiam corretamente sob execução do worker

## Riscos e mitigações

- Risco: semântica de comandos diverge do comportamento síncrono atual
  Mitigação: publicar plumbing de estado de comando na mesma transição, não depois

- Risco: entrega de resposta perde thread ou contexto de reply-to
  Mitigação: tornar identidade de entrega de primeira classe em `DiscordInboundJob`

- Risco: envios duplicados durante retentativas ou reinicializações de fila
  Mitigação: manter primeira passagem somente em memória, ou adicionar idempotência explícita de entrega antes da persistência

- Risco: `message-handler.process.ts` torna-se mais difícil de raciocinar durante migração
  Mitigação: dividir em helpers de normalização, execução e entrega antes ou durante a transição do worker

## Critérios de aceitação

O plano está completo quando:

1. O timeout do listener Discord não aborta mais turnos saudáveis de longa duração.
2. O tempo de vida do listener e o tempo de vida do turno do agente são conceitos separados no código.
3. A ordenação por sessão existente é preservada.
4. Canais Discord vinculados a ACP funcionam pelo mesmo caminho do worker.
5. `stop` tem como alvo a execução de propriedade do worker em vez da pilha de chamadas antiga de propriedade do listener.
6. Timeouts e falhas de entrega tornam-se resultados explícitos do worker, não drops silenciosos do listener.

## Estratégia de publicação restante

Concluir em PRs de acompanhamento:

1. tornar `DiscordInboundJob` somente dados simples e mover refs de runtime ao vivo para o worker
2. limpar propriedade de estado de comando para `stop`, `new` e `reset`
3. adicionar observabilidade do worker e status do operador
4. decidir se durabilidade é necessária ou documentar explicitamente o limite em memória

Este ainda é um acompanhamento limitado se mantido somente Discord e se continuarmos evitando uma abstração prematura de worker entre canais.
