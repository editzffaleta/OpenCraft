---
summary: "Plano: isolar browser act:evaluate da fila Playwright usando CDP, com deadlines ponta a ponta e resolução de ref mais segura"
read_when:
  - Trabalhando em problemas de timeout, abort ou bloqueio de fila do `act:evaluate` do browser
  - Planejando isolamento baseado em CDP para execução de evaluate
owner: "opencraft"
status: "draft"
last_updated: "2026-02-10"
title: "Refatoração Browser Evaluate CDP"
---

# Plano de Refatoração Browser Evaluate CDP

## Contexto

`act:evaluate` executa JavaScript fornecido pelo usuário na página. Atualmente ele roda via Playwright
(`page.evaluate` ou `locator.evaluate`). O Playwright serializa comandos CDP por página, portanto um
evaluate travado ou de longa duração pode bloquear a fila de comandos da página e fazer com que todas as
ações posteriores naquela aba pareçam "travadas".

O PR #13498 adiciona uma rede de segurança pragmática (evaluate com limite, propagação de abort e
recuperação de melhor esforço). Este documento descreve uma refatoração maior que torna o `act:evaluate`
inerentemente isolado do Playwright, de modo que um evaluate travado não consiga bloquear operações
normais do Playwright.

## Objetivos

- `act:evaluate` não pode bloquear permanentemente ações posteriores do browser na mesma aba.
- Timeouts são a única fonte da verdade de ponta a ponta, para que um chamador possa confiar em um orçamento.
- Abort e timeout são tratados da mesma forma em HTTP e despacho em-processo.
- O direcionamento de elemento para evaluate é suportado sem migrar tudo para fora do Playwright.
- Manter compatibilidade retroativa para chamadores e payloads existentes.

## Não-objetivos

- Substituir todas as ações do browser (click, type, wait, etc.) por implementações CDP.
- Remover a rede de segurança existente introduzida no PR #13498 (ela permanece como fallback útil).
- Introduzir novas capacidades inseguras além do portão `browser.evaluateEnabled` existente.
- Adicionar isolamento de processo (worker process/thread) para evaluate. Se ainda observarmos estados
  travados difíceis de recuperar após esta refatoração, isso é uma ideia para acompanhamento.

## Arquitetura Atual (Por Que Trava)

Em alto nível:

- Chamadores enviam `act:evaluate` para o serviço de controle do browser.
- O handler de rota chama o Playwright para executar o JavaScript.
- O Playwright serializa comandos de página, portanto um evaluate que nunca termina bloqueia a fila.
- Uma fila bloqueada significa que operações posteriores de click/type/wait na aba podem parecer travadas.

## Arquitetura Proposta

### 1. Propagação de Deadline

Introduzir um único conceito de orçamento e derivar tudo dele:

- O chamador define `timeoutMs` (ou um deadline no futuro).
- O timeout externo da requisição, a lógica do handler de rota e o orçamento de execução dentro da
  página usam o mesmo orçamento, com pequena margem onde necessário para sobrecarga de serialização.
- O abort é propagado como `AbortSignal` em todo lugar, para que o cancelamento seja consistente.

Direção de implementação:

- Adicionar um pequeno helper (por exemplo `createBudget({ timeoutMs, signal })`) que retorna:
  - `signal`: o AbortSignal vinculado
  - `deadlineAtMs`: deadline absoluto
  - `remainingMs()`: orçamento restante para operações filhas
- Usar este helper em:
  - `src/browser/client-fetch.ts` (HTTP e despacho em-processo)
  - `src/node-host/runner.ts` (caminho proxy)
  - implementações de ação do browser (Playwright e CDP)

### 2. Motor de Evaluate Separado (Caminho CDP)

Adicionar uma implementação de evaluate baseada em CDP que não compartilha a fila de comandos por página
do Playwright. A propriedade-chave é que o transporte de evaluate é uma conexão WebSocket separada e
uma sessão CDP separada anexada ao target.

Direção de implementação:

- Novo módulo, por exemplo `src/browser/cdp-evaluate.ts`, que:
  - Conecta ao endpoint CDP configurado (socket de nível do browser).
  - Usa `Target.attachToTarget({ targetId, flatten: true })` para obter um `sessionId`.
  - Executa:
    - `Runtime.evaluate` para evaluate de nível de página, ou
    - `DOM.resolveNode` mais `Runtime.callFunctionOn` para evaluate de elemento.
  - Em timeout ou abort:
    - Envia `Runtime.terminateExecution` de melhor esforço para a sessão.
    - Fecha o WebSocket e retorna um erro claro.

Notas:

- Isso ainda executa JavaScript na página, portanto a terminação pode ter efeitos colaterais. O ganho
  é que não bloqueia a fila do Playwright, e é cancelável na camada de transporte matando a sessão CDP.

### 3. Histórico de Refs (Direcionamento de Elemento Sem Reescrita Completa)

A parte difícil é o direcionamento de elementos. O CDP precisa de um handle DOM ou `backendDOMNodeId`,
enquanto hoje a maioria das ações do browser usa locators do Playwright baseados em refs de snapshots.

Abordagem recomendada: manter os refs existentes, mas anexar um id resolvível pelo CDP opcional.

#### 3.1 Estender Informações do Ref Armazenado

Estender os metadados do ref de role armazenado para incluir opcionalmente um id CDP:

- Hoje: `{ role, name, nth }`
- Proposto: `{ role, name, nth, backendDOMNodeId?: number }`

Isso mantém todas as ações existentes baseadas em Playwright funcionando e permite que o evaluate CDP
aceite o mesmo valor de `ref` quando o `backendDOMNodeId` estiver disponível.

#### 3.2 Popular backendDOMNodeId no Momento do Snapshot

Ao produzir um snapshot de role:

1. Gerar o mapa de ref de role existente como hoje (role, name, nth).
2. Buscar a árvore AX via CDP (`Accessibility.getFullAXTree`) e calcular um mapa paralelo de
   `(role, name, nth) -> backendDOMNodeId` usando as mesmas regras de tratamento de duplicatas.
3. Mesclar o id de volta nas informações de ref armazenadas para a aba atual.

Se o mapeamento falhar para um ref, deixar `backendDOMNodeId` indefinido. Isso torna o recurso de
melhor esforço e seguro para implantação gradual.

#### 3.3 Comportamento de Evaluate com Ref

Em `act:evaluate`:

- Se `ref` estiver presente e tiver `backendDOMNodeId`, executar evaluate de elemento via CDP.
- Se `ref` estiver presente mas não tiver `backendDOMNodeId`, recorrer ao caminho Playwright (com
  a rede de segurança).

Escape hatch opcional:

- Estender o formato da requisição para aceitar `backendDOMNodeId` diretamente para chamadores avançados
  (e para depuração), mantendo `ref` como interface primária.

### 4. Manter um Caminho de Recuperação de Último Recurso

Mesmo com evaluate CDP, há outras formas de bloquear uma aba ou conexão. Manter os mecanismos de
recuperação existentes (terminar execução + desconectar Playwright) como último recurso para:

- chamadores legados
- ambientes onde o attach CDP é bloqueado
- casos extremos inesperados do Playwright

## Plano de Implementação (Iteração Única)

### Entregáveis

- Um motor de evaluate baseado em CDP que roda fora da fila de comandos por página do Playwright.
- Um único orçamento de timeout/abort ponta a ponta usado consistentemente por chamadores e handlers.
- Metadados de ref que podem opcionalmente carregar `backendDOMNodeId` para evaluate de elemento.
- `act:evaluate` prefere o motor CDP quando possível e recorre ao Playwright quando não.
- Testes que provam que um evaluate travado não bloqueia ações posteriores.
- Logs/métricas que tornam falhas e fallbacks visíveis.

### Checklist de Implementação

1. Adicionar um helper "budget" compartilhado para vincular `timeoutMs` + `AbortSignal` upstream em:
   - um único `AbortSignal`
   - um deadline absoluto
   - um helper `remainingMs()` para operações downstream
2. Atualizar todos os caminhos de chamador para usar esse helper para que `timeoutMs` signifique a
   mesma coisa em todo lugar:
   - `src/browser/client-fetch.ts` (HTTP e despacho em-processo)
   - `src/node-host/runner.ts` (caminho proxy de node)
   - Wrappers CLI que chamam `/act` (adicionar `--timeout-ms` a `browser evaluate`)
3. Implementar `src/browser/cdp-evaluate.ts`:
   - conectar ao socket CDP de nível do browser
   - `Target.attachToTarget` para obter um `sessionId`
   - executar `Runtime.evaluate` para evaluate de página
   - executar `DOM.resolveNode` + `Runtime.callFunctionOn` para evaluate de elemento
   - em timeout/abort: `Runtime.terminateExecution` de melhor esforço e fechar o socket
4. Estender metadados de ref de role armazenado para incluir opcionalmente `backendDOMNodeId`:
   - manter comportamento `{ role, name, nth }` existente para ações Playwright
   - adicionar `backendDOMNodeId?: number` para direcionamento de elemento CDP
5. Popular `backendDOMNodeId` durante a criação de snapshot (melhor esforço):
   - buscar árvore AX via CDP (`Accessibility.getFullAXTree`)
   - calcular `(role, name, nth) -> backendDOMNodeId` e mesclar no mapa de ref armazenado
   - se o mapeamento for ambíguo ou ausente, deixar o id indefinido
6. Atualizar roteamento de `act:evaluate`:
   - se não houver `ref`: sempre usar evaluate CDP
   - se `ref` resolver para um `backendDOMNodeId`: usar evaluate de elemento CDP
   - caso contrário: recorrer ao evaluate Playwright (ainda com limite e cancelável)
7. Manter o caminho de recuperação "último recurso" existente como fallback, não como caminho padrão.
8. Adicionar testes:
   - evaluate travado expira dentro do orçamento e o próximo click/type é bem-sucedido
   - abort cancela evaluate (desconexão do cliente ou timeout) e desbloqueia ações subsequentes
   - falhas de mapeamento recorrem limpa e corretamente ao Playwright
9. Adicionar observabilidade:
   - duração do evaluate e contadores de timeout
   - uso de terminateExecution
   - taxa de fallback (CDP -> Playwright) e motivos

### Critérios de Aceitação

- Um `act:evaluate` deliberadamente travado retorna dentro do orçamento do chamador e não bloqueia
  a aba para ações posteriores.
- `timeoutMs` se comporta de forma consistente via CLI, ferramenta do agente, proxy de node e chamadas em-processo.
- Se `ref` puder ser mapeado para `backendDOMNodeId`, evaluate de elemento usa CDP; caso contrário,
  o caminho de fallback ainda é limitado e recuperável.

## Plano de Testes

- Testes unitários:
  - lógica de correspondência `(role, name, nth)` entre refs de role e nós da árvore AX.
  - comportamento do helper de budget (margem, cálculo de tempo restante).
- Testes de integração:
  - timeout do evaluate CDP retorna dentro do orçamento e não bloqueia a próxima ação.
  - abort cancela evaluate e aciona terminação de melhor esforço.
- Testes de contrato:
  - garantir que `BrowserActRequest` e `BrowserActResponse` permaneçam compatíveis.

## Riscos e Mitigações

- O mapeamento é imperfeito:
  - Mitigação: mapeamento de melhor esforço, fallback para evaluate Playwright e adicionar ferramentas de debug.
- `Runtime.terminateExecution` tem efeitos colaterais:
  - Mitigação: usar apenas em timeout/abort e documentar o comportamento nos erros.
- Overhead adicional:
  - Mitigação: buscar árvore AX apenas quando snapshots forem solicitados, fazer cache por target e manter
    a sessão CDP de curta duração.
- Limitações do relay de extensão:
  - Mitigação: usar APIs de attach de nível do browser quando sockets por página não estão disponíveis e
    manter o caminho Playwright atual como fallback.

## Questões em Aberto

- O novo motor deve ser configurável como `playwright`, `cdp` ou `auto`?
- Queremos expor um novo formato "nodeRef" para usuários avançados, ou manter apenas `ref`?
- Como snapshots de frame e snapshots com escopo de seletor participam no mapeamento AX?
