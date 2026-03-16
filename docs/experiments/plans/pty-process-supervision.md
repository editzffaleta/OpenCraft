---
summary: "Plano de produção para supervisão confiável de processos interativos (PTY + não-PTY) com propriedade explícita, ciclo de vida unificado e limpeza determinística"
read_when:
  - Trabalhando em propriedade do ciclo de vida de execução/processo e limpeza
  - Depurando comportamento de supervisão PTY e não-PTY
owner: "opencraft"
status: "in-progress"
last_updated: "2026-02-15"
title: "Plano de Supervisão PTY e Processo"
---

# Plano de Supervisão PTY e Processo

## 1. Problema e objetivo

Precisamos de um ciclo de vida confiável único para execução de comandos de longa duração em:

- execuções em primeiro plano com `exec`
- execuções em segundo plano com `exec`
- ações de acompanhamento do `process` (`poll`, `log`, `send-keys`, `paste`, `submit`, `kill`, `remove`)
- subprocessos do runner de agente CLI

O objetivo não é apenas suportar PTY. O objetivo é propriedade previsível, cancelamento, timeout e limpeza sem heurísticas inseguras de correspondência de processos.

## 2. Escopo e limites

- Manter a implementação interna em `src/process/supervisor`.
- Não criar um novo pacote para isso.
- Manter compatibilidade de comportamento atual onde prático.
- Não ampliar o escopo para replay de terminal ou persistência de sessão estilo tmux.

## 3. Implementado nesta branch

### Baseline do supervisor já presente

- Módulo supervisor está implementado em `src/process/supervisor/*`.
- Runtime de execução e runner CLI já são roteados via spawn e wait do supervisor.
- Finalização do registry é idempotente.

### Esta passagem concluída

1. Contrato explícito de comando PTY

- `SpawnInput` agora é uma union discriminada em `src/process/supervisor/types.ts`.
- Execuções PTY exigem `ptyCommand` em vez de reutilizar `argv` genérico.
- O supervisor não reconstrói mais strings de comando PTY a partir de joins de argv em `src/process/supervisor/supervisor.ts`.
- O runtime de execução agora passa `ptyCommand` diretamente em `src/agents/bash-tools.exec-runtime.ts`.

2. Desacoplamento de tipos da camada de processo

- Tipos do supervisor não importam mais `SessionStdin` de agents.
- Contrato de stdin local do processo vive em `src/process/supervisor/types.ts` (`ManagedRunStdin`).
- Adaptadores agora dependem apenas de tipos de nível de processo:
  - `src/process/supervisor/adapters/child.ts`
  - `src/process/supervisor/adapters/pty.ts`

3. Melhoria de propriedade do ciclo de vida da ferramenta de processo

- `src/agents/bash-tools.process.ts` agora solicita cancelamento através do supervisor primeiro.
- `process kill/remove` agora usa terminação de fallback de árvore de processos quando a busca no supervisor falha.
- `remove` mantém comportamento de remoção determinística descartando imediatamente entradas de sessão em execução após o pedido de terminação.

4. Padrões únicos do watchdog

- Adicionados padrões compartilhados em `src/agents/cli-watchdog-defaults.ts`.
- `src/agents/cli-backends.ts` consome os padrões compartilhados.
- `src/agents/cli-runner/reliability.ts` consome os mesmos padrões compartilhados.

5. Limpeza de helpers mortos

- Removido caminho do helper `killSession` não utilizado de `src/agents/bash-tools.shared.ts`.

6. Testes diretos do caminho do supervisor adicionados

- Adicionado `src/agents/bash-tools.process.supervisor.test.ts` para cobrir roteamento de kill e remove via cancelamento do supervisor.

7. Correções de lacunas de confiabilidade concluídas

- `src/agents/bash-tools.process.ts` agora recorre à terminação real de processo no nível do SO quando a busca no supervisor falha.
- `src/process/supervisor/adapters/child.ts` agora usa semântica de terminação de árvore de processos para caminhos padrão de cancel/timeout kill.
- Adicionado utilitário de árvore de processos compartilhado em `src/process/kill-tree.ts`.

8. Cobertura de casos extremos do contrato PTY adicionada

- Adicionado `src/process/supervisor/supervisor.pty-command.test.ts` para encaminhamento verbatim de comando PTY e rejeição de comando vazio.
- Adicionado `src/process/supervisor/adapters/child.test.ts` para comportamento de kill por árvore de processos no cancelamento do adaptador filho.

## 4. Lacunas restantes e decisões

### Status de confiabilidade

As duas lacunas de confiabilidade necessárias para esta passagem estão agora fechadas:

- `process kill/remove` agora tem um fallback de terminação real do SO quando a busca no supervisor falha.
- cancel/timeout filho agora usa semântica de kill por árvore de processos para o caminho padrão de kill.
- Testes de regressão foram adicionados para ambos os comportamentos.

### Durabilidade e reconciliação na inicialização

O comportamento de reinicialização é agora explicitamente definido como ciclo de vida somente em memória.

- `reconcileOrphans()` permanece como no-op em `src/process/supervisor/supervisor.ts` por design.
- Execuções ativas não são recuperadas após reinicialização do processo.
- Esse limite é intencional para esta passagem de implementação, a fim de evitar riscos de persistência parcial.

### Acompanhamentos de manutenibilidade

1. `runExecProcess` em `src/agents/bash-tools.exec-runtime.ts` ainda lida com múltiplas responsabilidades e pode ser dividido em helpers focados em um acompanhamento.

## 5. Plano de implementação

A passagem de implementação para itens de confiabilidade e contrato necessários está completa.

Concluído:

- fallback de terminação real para `process kill/remove`
- cancelamento de árvore de processos para caminho padrão de kill do adaptador filho
- testes de regressão para fallback de kill e caminho de kill do adaptador filho
- testes de casos extremos de comando PTY sob `ptyCommand` explícito
- limite explícito de reinicialização em memória com no-op de `reconcileOrphans()` por design

Acompanhamento opcional:

- dividir `runExecProcess` em helpers focados sem desvio de comportamento

## 6. Mapa de arquivos

### Supervisor de processo

- `src/process/supervisor/types.ts` atualizado com input de spawn discriminado e contrato de stdin local do processo.
- `src/process/supervisor/supervisor.ts` atualizado para usar `ptyCommand` explícito.
- `src/process/supervisor/adapters/child.ts` e `src/process/supervisor/adapters/pty.ts` desacoplados de tipos de agent.
- `src/process/supervisor/registry.ts` finalização idempotente inalterada e mantida.

### Integração de execução e processo

- `src/agents/bash-tools.exec-runtime.ts` atualizado para passar comando PTY explicitamente e manter caminho de fallback.
- `src/agents/bash-tools.process.ts` atualizado para cancelar via supervisor com terminação de fallback real por árvore de processos.
- `src/agents/bash-tools.shared.ts` removeu caminho direto do helper kill.

### Confiabilidade CLI

- `src/agents/cli-watchdog-defaults.ts` adicionado como baseline compartilhado.
- `src/agents/cli-backends.ts` e `src/agents/cli-runner/reliability.ts` agora consomem os mesmos padrões.

## 7. Execução de validação nesta passagem

Testes unitários:

- `pnpm vitest src/process/supervisor/registry.test.ts`
- `pnpm vitest src/process/supervisor/supervisor.test.ts`
- `pnpm vitest src/process/supervisor/supervisor.pty-command.test.ts`
- `pnpm vitest src/process/supervisor/adapters/child.test.ts`
- `pnpm vitest src/agents/cli-backends.test.ts`
- `pnpm vitest src/agents/bash-tools.exec.pty-cleanup.test.ts`
- `pnpm vitest src/agents/bash-tools.process.poll-timeout.test.ts`
- `pnpm vitest src/agents/bash-tools.process.supervisor.test.ts`
- `pnpm vitest src/process/exec.test.ts`

Alvos E2E:

- `pnpm vitest src/agents/cli-runner.test.ts`
- `pnpm vitest run src/agents/bash-tools.exec.pty-fallback.test.ts src/agents/bash-tools.exec.background-abort.test.ts src/agents/bash-tools.process.send-keys.test.ts`

Nota de verificação de tipos:

- Use `pnpm build` (e `pnpm check` para a barreira completa de lint/docs) neste repositório. Notas mais antigas que mencionam `pnpm tsgo` estão obsoletas.

## 8. Garantias operacionais preservadas

- O comportamento de proteção do ambiente de execução está inalterado.
- O fluxo de aprovação e lista de permissões está inalterado.
- A sanitização de saída e os limites de saída estão inalterados.
- O adaptador PTY ainda garante liquidação de wait em kill forçado e descarte de listener.

## 9. Definição de concluído

1. Supervisor é o proprietário do ciclo de vida para execuções gerenciadas.
2. O spawn PTY usa contrato explícito de comando sem reconstrução de argv.
3. A camada de processo não tem dependência de tipo na camada de agent para contratos stdin do supervisor.
4. Padrões do watchdog são fonte única.
5. Testes unitários e e2e direcionados permanecem verdes.
6. O limite de durabilidade de reinicialização é explicitamente documentado ou totalmente implementado.

## 10. Resumo

A branch agora tem uma forma de supervisão coerente e mais segura:

- contrato PTY explícito
- camadas de processo mais limpas
- caminho de cancelamento orientado pelo supervisor para operações de processo
- terminação de fallback real quando a busca no supervisor falha
- cancelamento por árvore de processos para caminhos padrão de kill de execução filha
- padrões de watchdog unificados
- limite explícito de reinicialização em memória (sem reconciliação de órfãos após reinicialização nesta passagem)
