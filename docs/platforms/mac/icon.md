---
summary: "Estados e animações do ícone da barra de menus do OpenCraft no macOS"
read_when:
  - Alterando o comportamento do ícone da barra de menus
title: "Ícone da Barra de Menus"
---

# Estados do Ícone da Barra de Menus

Autor: steipete · Atualizado: 2025-12-06 · Escopo: aplicativo macOS (`apps/macos`)

- **Inativo:** Animação normal do ícone (piscar, movimento ocasional).
- **Pausado:** O item de status usa `appearsDisabled`; sem movimento.
- **Ativação por voz (orelhas grandes):** O detector de Voice Wake chama `AppState.triggerVoiceEars(ttl: nil)` quando a palavra de ativação é ouvida, mantendo `earBoostActive=true` enquanto a fala é capturada. As orelhas aumentam (1.9x), ganham buracos circulares para legibilidade, depois diminuem via `stopVoiceEars()` após 1s de silêncio. Só é acionado pelo pipeline de voz interno do aplicativo.
- **Trabalhando (agente em execução):** `AppState.isWorking=true` aciona um micro-movimento de "corrida de cauda/pernas": movimento mais rápido das pernas e leve deslocamento enquanto o trabalho está em andamento. Atualmente alternado em torno das execuções de agente do WebChat; adicione o mesmo toggle em outras tarefas longas quando conectá-las.

Pontos de conexão

- Voice Wake: runtime/tester chamam `AppState.triggerVoiceEars(ttl: nil)` ao ativar e `stopVoiceEars()` após 1s de silêncio para corresponder à janela de captura.
- Atividade do agente: defina `AppStateStore.shared.setWorking(true/false)` em torno de períodos de trabalho (já feito na chamada do agente WebChat). Mantenha os períodos curtos e redefina em blocos `defer` para evitar animações travadas.

Formas e tamanhos

- Ícone base desenhado em `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- A escala da orelha padrão é `1.0`; o boost de voz define `earScale=1.9` e alterna `earHoles=true` sem alterar o frame geral (imagem template de 18×18 pt renderizada em um backing store Retina de 36×36 px).
- A corrida usa movimento de pernas até ~1.0 com um pequeno tremor horizontal; é aditivo a qualquer movimento inativo existente.

Notas comportamentais

- Sem toggle CLI/broker externo para orelhas/trabalhando; mantenha interno aos sinais do próprio aplicativo para evitar oscilação acidental.
- Mantenha TTLs curtos (&lt;10s) para que o ícone retorne à linha de base rapidamente se um trabalho travar.
