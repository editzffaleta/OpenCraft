---
summary: "Lógica de status da barra de menus e o que é exibido aos usuários"
read_when:
  - Ajustando a UI do menu do macOS ou lógica de status
title: "Barra de Menus"
---

# Lógica de Status da Barra de Menus

## O que é exibido

- Exibimos o estado atual de trabalho do agente no ícone da barra de menus e na primeira linha de status do menu.
- O status de integridade fica oculto enquanto o trabalho está ativo; ele retorna quando todas as sessões estão inativas.
- O bloco "Nodes" no menu lista apenas **dispositivos** (nós emparelhados via `node.list`), não entradas de cliente/presença.
- Uma seção "Usage" aparece em Context quando snapshots de uso do provedor estão disponíveis.

## Modelo de estado

- Sessões: eventos chegam com `runId` (por execução) mais `sessionKey` no payload. A sessão "main" é a chave `main`; se ausente, recorremos à sessão atualizada mais recentemente.
- Prioridade: main sempre vence. Se main está ativa, seu estado é mostrado imediatamente. Se main está inativa, a sessão não-main mais recentemente ativa é mostrada. Não alternamos durante a atividade; só trocamos quando a sessão atual fica inativa ou main se torna ativa.
- Tipos de atividade:
  - `job`: execução de comando de alto nível (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` com `toolName` e `meta/args`.

## Enum IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (substituição de debug)

### ActivityKind → glifo

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- padrão → 🛠️

### Mapeamento visual

- `idle`: critter normal.
- `workingMain`: badge com glifo, tinta completa, animação de "trabalhando" nas pernas.
- `workingOther`: badge com glifo, tinta atenuada, sem corrida.
- `overridden`: usa o glifo/tinta escolhido independentemente da atividade.

## Texto da linha de status (menu)

- Enquanto o trabalho está ativo: `<Papel da sessão> · <rótulo de atividade>`
  - Exemplos: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenCraft/AppState.swift`.
- Quando inativo: recorre ao resumo de integridade.

## Ingestão de eventos

- Fonte: eventos `agent` do canal de controle (`ControlChannel.handleAgentEvent`).
- Campos analisados:
  - `stream: "job"` com `data.state` para início/parada.
  - `stream: "tool"` com `data.phase`, `name`, `meta`/`args` opcionais.
- Rótulos:
  - `exec`: primeira linha de `args.command`.
  - `read`/`write`: caminho abreviado.
  - `edit`: caminho mais tipo de mudança inferido de `meta`/contagens de diff.
  - fallback: nome da ferramenta.

## Substituição de debug

- Configurações → Debug → Seletor "Icon override":
  - `System (auto)` (padrão)
  - `Working: main` (por tipo de ferramenta)
  - `Working: other` (por tipo de ferramenta)
  - `Idle`
- Armazenado via `@AppStorage("iconOverride")`; mapeado para `IconState.overridden`.

## Lista de verificação de testes

- Dispare um job de sessão main: verifique se o ícone muda imediatamente e a linha de status mostra o rótulo main.
- Dispare um job de sessão não-main enquanto main está inativa: ícone/status mostra não-main; permanece estável até terminar.
- Inicie main enquanto outra está ativa: ícone muda para main instantaneamente.
- Rajadas rápidas de ferramentas: certifique-se de que o badge não oscile (TTL de tolerância nos resultados da ferramenta).
- A linha de integridade reaparece quando todas as sessões estão inativas.
