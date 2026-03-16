---
summary: "Lógica de status da barra de menu e o que é exibido ao usuário"
read_when:
  - Ajustando a UI do menu do Mac ou lógica de status
title: "Barra de Menu"
---

# Lógica de Status da Barra de Menu

## O que é exibido

- Exibimos o estado atual de trabalho do agente no ícone da barra de menu e na primeira linha de status do menu.
- O status de saúde fica oculto enquanto há trabalho ativo; ele retorna quando todas as sessões estão ociosas.
- O bloco "Nodes" no menu lista apenas **dispositivos** (nós pareados via `node.list`), não entradas de cliente/presença.
- Uma seção "Uso" aparece abaixo de Contexto quando snapshots de uso do provedor estão disponíveis.

## Modelo de estado

- Sessões: eventos chegam com `runId` (por execução) mais `sessionKey` no payload. A sessão "main" é a chave `main`; se ausente, fazemos fallback para a sessão atualizada mais recentemente.
- Prioridade: main sempre vence. Se main está ativa, seu estado é exibido imediatamente. Se main está ociosa, a sessão não-main ativa mais recentemente é exibida. Não alternamos no meio de uma atividade; só alternamos quando a sessão atual fica ociosa ou main fica ativa.
- Tipos de atividade:
  - `job`: execução de comando de alto nível (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` com `toolName` e `meta/args`.

## Enum IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (override de debug)

### ActivityKind → glifo

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- padrão → 🛠️

### Mapeamento visual

- `idle`: critter normal.
- `workingMain`: badge com glifo, tint completo, animação "working" das pernas.
- `workingOther`: badge com glifo, tint atenuado, sem scurry.
- `overridden`: usa o glifo/tint escolhido independentemente da atividade.

## Texto da linha de status (menu)

- Enquanto há trabalho ativo: `<Papel da sessão> · <rótulo da atividade>`
  - Exemplos: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenCraft/AppState.swift`.
- Quando ocioso: faz fallback para o resumo de saúde.

## Ingestão de eventos

- Fonte: eventos `agent` do canal de controle (`ControlChannel.handleAgentEvent`).
- Campos analisados:
  - `stream: "job"` com `data.state` para start/stop.
  - `stream: "tool"` com `data.phase`, `name`, `meta`/`args` opcionais.
- Rótulos:
  - `exec`: primeira linha de `args.command`.
  - `read`/`write`: caminho abreviado.
  - `edit`: caminho mais tipo de alteração inferido de `meta`/contagens de diff.
  - fallback: nome da tool.

## Override de debug

- Configurações ▸ Debug ▸ seletor "Icon override":
  - `System (auto)` (padrão)
  - `Working: main` (por tipo de tool)
  - `Working: other` (por tipo de tool)
  - `Idle`
- Armazenado via `@AppStorage("iconOverride")`; mapeado para `IconState.overridden`.

## Checklist de testes

- Disparar job da sessão main: verificar se o ícone muda imediatamente e a linha de status exibe o rótulo main.
- Disparar job de sessão não-main enquanto main está ociosa: ícone/status exibe não-main; permanece estável até terminar.
- Iniciar main enquanto outro está ativo: ícone muda para main instantaneamente.
- Bursts rápidos de tool: garantir que o badge não pisque (grace de TTL em resultados de tool).
- Linha de saúde reaparece quando todas as sessões ficam ociosas.
