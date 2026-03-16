---
summary: "Ciclo de vida do overlay de voz quando wake-word e push-to-talk se sobrepõem"
read_when:
  - Ajustando o comportamento do overlay de voz
title: "Voice Overlay"
---

# Ciclo de Vida do Voice Overlay (macOS)

Público: contribuidores do app macOS. Objetivo: manter o voice overlay previsível quando wake-word e push-to-talk se sobrepõem.

## Intenção atual

- Se o overlay já estiver visível pelo wake-word e o usuário pressionar o atalho, a sessão do atalho _adota_ o texto existente em vez de reiniciá-lo. O overlay permanece ativo enquanto o atalho é mantido pressionado. Quando o usuário soltar: envia se houver texto trimado, caso contrário descarta.
- Wake-word sozinho ainda faz auto-envio no silêncio; push-to-talk envia imediatamente ao soltar.

## Implementado (9 de dez de 2025)

- As sessões de overlay agora carregam um token por captura (wake-word ou push-to-talk). Atualizações de parcial/final/envio/descarte/nível são descartadas quando o token não corresponde, evitando callbacks obsoletos.
- Push-to-talk adota qualquer texto de overlay visível como prefixo (ao pressionar o atalho enquanto o overlay de wake está ativo, o texto é mantido e nova fala é adicionada). Aguarda até 1,5s por um transcript final antes de fazer fallback para o texto atual.
- O logging de chime/overlay é emitido em `info` nas categorias `voicewake.overlay`, `voicewake.ptt` e `voicewake.chime` (início de sessão, parcial, final, envio, descarte, motivo do chime).

## Próximos passos

1. **VoiceSessionCoordinator (actor)**
   - Possui exatamente uma `VoiceSession` por vez.
   - API (baseada em token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Descarta callbacks com tokens obsoletos (evita que reconhecedores antigos reabram o overlay).
2. **VoiceSession (model)**
   - Campos: `token`, `source` (wakeWord|pushToTalk), texto committed/volatile, flags de chime, timers (auto-envio, idle), `overlayMode` (display|editing|sending), deadline de cooldown.
3. **Vinculação do overlay**
   - `VoiceSessionPublisher` (`ObservableObject`) espelha a sessão ativa no SwiftUI.
   - `VoiceWakeOverlayView` renderiza apenas via o publisher; nunca muta singletons globais diretamente.
   - Ações do usuário no overlay (`sendNow`, `dismiss`, `edit`) fazem callback para o coordinator com o token de sessão.
4. **Caminho de envio unificado**
   - Em `endCapture`: se o texto trimado estiver vazio → descarta; caso contrário `performSend(session:)` (toca chime de envio uma vez, encaminha, descarta).
   - Push-to-talk: sem delay; wake-word: delay opcional para auto-envio.
   - Aplica um curto cooldown ao runtime de wake após o push-to-talk terminar para que wake-word não seja reativado imediatamente.
5. **Logging**
   - O coordinator emite logs `.info` no subsystem `ai.openclaw`, categorias `voicewake.overlay` e `voicewake.chime`.
   - Eventos-chave: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Checklist de depuração

- Transmitir logs enquanto reproduz um overlay preso:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verificar se há apenas um token de sessão ativo; callbacks obsoletos devem ser descartados pelo coordinator.
- Garantir que o release do push-to-talk sempre chame `endCapture` com o token ativo; se o texto estiver vazio, esperar `dismiss` sem chime ou envio.

## Passos de migração (sugerido)

1. Adicionar `VoiceSessionCoordinator`, `VoiceSession` e `VoiceSessionPublisher`.
2. Refatorar `VoiceWakeRuntime` para criar/atualizar/encerrar sessões em vez de tocar `VoiceWakeOverlayController` diretamente.
3. Refatorar `VoicePushToTalk` para adotar sessões existentes e chamar `endCapture` ao soltar; aplicar cooldown ao runtime.
4. Conectar `VoiceWakeOverlayController` ao publisher; remover chamadas diretas do runtime/PTT.
5. Adicionar testes de integração para adoção de sessão, cooldown e descarte de texto vazio.
