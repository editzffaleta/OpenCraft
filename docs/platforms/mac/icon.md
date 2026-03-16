---
summary: "Estados e animações do ícone da barra de menu do OpenCraft no macOS"
read_when:
  - Alterando o comportamento do ícone da barra de menu
title: "Ícone da Barra de Menu"
---

# Estados do Ícone da Barra de Menu

Autor: steipete · Atualizado em: 2025-12-06 · Escopo: app macOS (`apps/macos`)

- **Ocioso:** Animação de ícone normal (piscar, mexer ocasional).
- **Pausado:** O item de status usa `appearsDisabled`; sem movimento.
- **Gatilho de voz (orelhas grandes):** O detector de voice wake chama `AppState.triggerVoiceEars(ttl: nil)` quando a wake word é ouvida, mantendo `earBoostActive=true` enquanto o enunciado é capturado. As orelhas aumentam de escala (1,9x), ficam com buracos circulares para legibilidade, e depois caem via `stopVoiceEars()` após 1s de silêncio. Disparado apenas a partir do pipeline de voz interno do app.
- **Trabalhando (agente em execução):** `AppState.isWorking=true` aciona uma micro-animação de "scurry de cauda/pernas": agitação de perna mais rápida e leve deslocamento enquanto o trabalho está em andamento. Atualmente ativado em torno de execuções do agente no WebChat; adicione o mesmo toggle em torno de outras tarefas longas ao conectá-las.

Pontos de conexão

- Voice wake: o runtime/testador chama `AppState.triggerVoiceEars(ttl: nil)` no gatilho e `stopVoiceEars()` após 1s de silêncio para corresponder à janela de captura.
- Atividade do agente: defina `AppStateStore.shared.setWorking(true/false)` em torno dos spans de trabalho (já feito na chamada do agente do WebChat). Mantenha os spans curtos e redefina em blocos `defer` para evitar animações travadas.

Formas e tamanhos

- Ícone base desenhado em `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- Escala de orelha padrão em `1.0`; o boost de voz define `earScale=1.9` e alterna `earHoles=true` sem alterar o frame geral (imagem de template 18×18 pt renderizada em um backing store Retina de 36×36 px).
- O scurry usa agitação de perna até ~1,0 com um pequeno jiggle horizontal; é aditivo a qualquer agitação idle existente.

Notas comportamentais

- Sem toggle CLI/broker externo para orelhas/working; mantenha interno aos próprios sinais do app para evitar flapping acidental.
- Mantenha os TTLs curtos (&lt;10s) para que o ícone retorne ao baseline rapidamente se um job travar.
