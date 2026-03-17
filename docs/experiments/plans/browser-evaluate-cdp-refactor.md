---
summary: "Plano: isolar browser act:evaluate da fila do Playwright usando CDP, com prazos ponta a ponta e resolução de ref mais segura"
read_when:
  - Trabalhando em problemas de timeout, abort ou bloqueio de fila do browser `act:evaluate`
  - Planejando isolamento baseado em CDP para execução de evaluate
owner: "opencraft"
status: "draft"
last_updated: "2026-02-10"
title: "Browser Evaluate CDP Refactor"
---

# Plano de Refatoração CDP do Browser Evaluate

## Contexto

`act:evaluate` executa JavaScript fornecido pelo usuário na página. Hoje ele roda via Playwright
(`page.evaluate` ou `locator.evaluate`). O Playwright serializa comandos CDP por página, então um
evaluate travado ou de longa duração pode bloquear a fila de comandos da página e fazer toda ação posterior
naquela aba parecer "travada".

A PR #13498 adiciona uma rede de segurança pragmática (evaluate limitado, propagação de abort e recuperação
de melhor esforço). Este documento descreve uma refatoração maior que torna `act:evaluate` inerentemente
isolado do Playwright para que um evaluate travado não possa travar operações normais do Playwright.

## Objetivos

- `act:evaluate` não pode bloquear permanentemente ações posteriores do browser na mesma aba.
- Timeouts são fonte única da verdade ponta a ponta para que um chamador possa confiar em um orçamento.
- Abort e timeout são tratados da mesma forma em dispatch HTTP e em processo.
- Direcionamento de elemento para evaluate é suportado sem trocar tudo do Playwright.
- Manter compatibilidade retroativa para chamadores e payloads existentes.

## Não-objetivos

- Substituir todas as ações do browser (click, type, wait, etc.) com implementações CDP.
- Remover a rede de segurança existente introduzida na PR #13498 (ela permanece como fallback útil).
- Introduzir novas capacidades inseguras além do portão `browser.evaluateEnabled` existente.
- Adicionar isolamento de processo (processo/thread worker) para evaluate. Se ainda virmos estados travados
  difíceis de recuperar após esta refatoração, isso é uma ideia de follow-up.

## Arquitetura Atual (Por Que Trava)

Em alto nível:

- Chamadores enviam `act:evaluate` para o serviço de controle do browser.
- O handler de rota chama o Playwright para executar o JavaScript.
- O Playwright serializa comandos de página, então um evaluate que nunca termina bloqueia a fila.
- Uma fila travada significa que operações posteriores de click/type/wait na aba podem parecer travar.

## Arquitetura Proposta

### 1. Propagação de Prazo

Introduzir um conceito único de orçamento e derivar tudo dele:

- Chamador define `timeoutMs` (ou um prazo no futuro).
- O timeout da requisição externa, lógica do handler de rota e o orçamento de execução dentro da página
  todos usam o mesmo orçamento, com pequena margem onde necessário para overhead de serialização.
- Abort é propagado como um `AbortSignal` em todos os lugares para que cancelamento seja consistente.

Direção de implementação:

- Adicionar um pequeno helper (por exemplo `createBudget({ timeoutMs, signal })`) que retorna:
  - `signal`: o AbortSignal vinculado
  - `deadlineAtMs`: prazo absoluto
  - `remainingMs()`: orçamento restante para operações filhas
- Usar este helper em:
  - `src/browser/client-fetch.ts` (dispatch HTTP e em processo)
  - `src/node-host/runner.ts` (caminho proxy)
  - implementações de ações do browser (Playwright e CDP)

### 2. Engine de Evaluate Separada (Caminho CDP)

Adicionar uma implementação de evaluate baseada em CDP que não compartilha a fila de comandos
por página do Playwright. A propriedade chave é que o transporte de evaluate é uma conexão WebSocket
separada e uma sessão CDP separada anexada ao alvo.

Direção de implementação:

- Novo módulo, por exemplo `src/browser/cdp-evaluate.ts`, que:
  - Conecta ao endpoint CDP configurado (socket a nível de browser).
  - Usa `Target.attachToTarget({ targetId, flatten: true })` para obter um `sessionId`.
  - Executa:
    - `Runtime.evaluate` para evaluate a nível de página, ou
    - `DOM.resolveNode` mais `Runtime.callFunctionOn` para evaluate de elemento.
  - Em timeout ou abort:
    - Envia `Runtime.terminateExecution` de melhor esforço para a sessão.
    - Fecha o WebSocket e retorna um erro claro.

Notas:

- Isso ainda executa JavaScript na página, então a terminação pode ter efeitos colaterais. O ganho
  é que não trava a fila do Playwright, e é cancelável na camada de transporte
  matando a sessão CDP.

### 3. História de Ref (Direcionamento de Elemento Sem Reescrita Completa)

A parte difícil é o direcionamento de elemento. CDP precisa de um handle DOM ou `backendDOMNodeId`, enquanto
hoje a maioria das ações do browser usam localizadores Playwright baseados em refs de snapshots.

Abordagem recomendada: manter refs existentes, mas anexar um id resolvível por CDP opcional.

#### 3.1 Estender Informações de Ref Armazenadas

Estender os metadados de ref de role armazenados para opcionalmente incluir um id CDP:

- Hoje: `{ role, name, nth }`
- Proposto: `{ role, name, nth, backendDOMNodeId?: number }`

Isso mantém todas as ações existentes baseadas em Playwright funcionando e permite que o evaluate CDP aceite
o mesmo valor de `ref` quando o `backendDOMNodeId` está disponível.

#### 3.2 Popular backendDOMNodeId no Momento do Snapshot

Ao produzir um snapshot de role:

1. Gerar o mapa de ref de role existente como hoje (role, name, nth).
2. Buscar a árvore AX via CDP (`Accessibility.getFullAXTree`) e computar um mapa paralelo de
   `(role, name, nth) -> backendDOMNodeId` usando as mesmas regras de tratamento de duplicatas.
3. Mesclar o id de volta nas informações de ref armazenadas para a aba atual.

Se o mapeamento falhar para uma ref, deixar `backendDOMNodeId` indefinido. Isso torna a funcionalidade
de melhor esforço e segura para implementar.

#### 3.3 Comportamento de Evaluate Com Ref

Em `act:evaluate`:

- Se `ref` está presente e tem `backendDOMNodeId`, executar evaluate de elemento via CDP.
- Se `ref` está presente mas não tem `backendDOMNodeId`, recorrer ao caminho Playwright (com
  a rede de segurança).

Escape hatch opcional:

- Estender o formato de requisição para aceitar `backendDOMNodeId` diretamente para chamadores avançados (e
  para depuração), mantendo `ref` como a interface primária.

### 4. Manter um Caminho de Recuperação de Último Recurso

Mesmo com evaluate CDP, há outras formas de travar uma aba ou uma conexão. Manter os
mecanismos de recuperação existentes (terminar execução + desconectar Playwright) como último recurso
para:

- chamadores legados
- ambientes onde anexação CDP está bloqueada
- edge cases inesperados do Playwright

## Plano de Implementação (Iteração Única)

### Entregáveis

- Uma engine de evaluate baseada em CDP que roda fora da fila de comandos por página do Playwright.
- Um orçamento único de timeout/abort ponta a ponta usado consistentemente por chamadores e handlers.
- Metadados de ref que podem opcionalmente carregar `backendDOMNodeId` para evaluate de elemento.
- `act:evaluate` prefere a engine CDP quando possível e recorre ao Playwright quando não.
- Testes que provam que um evaluate travado não trava ações posteriores.
- Logs/métricas que tornam falhas e fallbacks visíveis.

### Checklist de Implementação

1. Adicionar um helper de "orçamento" compartilhado para vincular `timeoutMs` + `AbortSignal` upstream em:
   - um único `AbortSignal`
   - um prazo absoluto
   - um helper `remainingMs()` para operações downstream
2. Atualizar todos os caminhos de chamadores para usar esse helper para que `timeoutMs` signifique a mesma coisa em todos os lugares:
   - `src/browser/client-fetch.ts` (dispatch HTTP e em processo)
   - `src/node-host/runner.ts` (caminho proxy node)
   - Wrappers CLI que chamam `/act` (adicionar `--timeout-ms` a `browser evaluate`)
3. Implementar `src/browser/cdp-evaluate.ts`:
   - conectar ao socket CDP a nível de browser
   - `Target.attachToTarget` para obter um `sessionId`
   - executar `Runtime.evaluate` para evaluate de página
   - executar `DOM.resolveNode` + `Runtime.callFunctionOn` para evaluate de elemento
   - em timeout/abort: melhor esforço `Runtime.terminateExecution` depois fechar o socket
4. Estender metadados de ref de role armazenados para opcionalmente incluir `backendDOMNodeId`:
   - manter comportamento existente `{ role, name, nth }` para ações Playwright
   - adicionar `backendDOMNodeId?: number` para direcionamento de elemento CDP
5. Popular `backendDOMNodeId` durante criação de snapshot (melhor esforço):
   - buscar árvore AX via CDP (`Accessibility.getFullAXTree`)
   - computar `(role, name, nth) -> backendDOMNodeId` e mesclar no mapa de ref armazenado
   - se mapeamento é ambíguo ou ausente, deixar o id indefinido
6. Atualizar roteamento de `act:evaluate`:
   - se sem `ref`: sempre usar evaluate CDP
   - se `ref` resolve para um `backendDOMNodeId`: usar evaluate de elemento CDP
   - caso contrário: recorrer ao evaluate Playwright (ainda limitado e abortável)
7. Manter o caminho de recuperação de "último recurso" existente como fallback, não o caminho padrão.
8. Adicionar testes:
   - evaluate travado expira dentro do orçamento e o próximo click/type tem sucesso
   - abort cancela evaluate (desconexão do cliente ou timeout) e desbloqueia ações subsequentes
   - falhas de mapeamento recorrem limpa ao Playwright
9. Adicionar observabilidade:
   - duração de evaluate e contadores de timeout
   - uso de terminateExecution
   - taxa de fallback (CDP -> Playwright) e razões

### Critérios de Aceitação

- Um `act:evaluate` deliberadamente travado retorna dentro do orçamento do chamador e não trava a
  aba para ações posteriores.
- `timeoutMs` se comporta consistentemente entre CLI, ferramenta de agente, proxy node e chamadas em processo.
- Se `ref` pode ser mapeada para `backendDOMNodeId`, evaluate de elemento usa CDP; caso contrário o
  caminho de fallback ainda é limitado e recuperável.

## Plano de Testes

- Testes unitários:
  - Lógica de matching `(role, name, nth)` entre refs de role e nós da árvore AX.
  - Comportamento do helper de orçamento (margem, cálculo de tempo restante).
- Testes de integração:
  - Timeout de evaluate CDP retorna dentro do orçamento e não bloqueia a próxima ação.
  - Abort cancela evaluate e dispara terminação de melhor esforço.
- Testes de contrato:
  - Garantir que `BrowserActRequest` e `BrowserActResponse` permanecem compatíveis.

## Riscos e Mitigações

- Mapeamento é imperfeito:
  - Mitigação: mapeamento de melhor esforço, fallback para evaluate Playwright, e adicionar ferramentas de depuração.
- `Runtime.terminateExecution` tem efeitos colaterais:
  - Mitigação: usar somente em timeout/abort e documentar o comportamento nos erros.
- Overhead extra:
  - Mitigação: buscar árvore AX somente quando snapshots são solicitados, cache por alvo, e manter
    sessão CDP de curta vida.
- Limitações de relay de extensão:
  - Mitigação: usar APIs de anexação a nível de browser quando sockets por página não estão disponíveis, e
    manter o caminho Playwright atual como fallback.

## Perguntas em Aberto

- A nova engine deve ser configurável como `playwright`, `cdp`, ou `auto`?
- Queremos expor um novo formato "nodeRef" para usuários avançados, ou manter somente `ref`?
- Como snapshots de frame e snapshots com escopo de seletor devem participar no mapeamento AX?
