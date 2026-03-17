---
summary: "Ciclo de vida do overlay de voz quando wake-word e push-to-talk se sobrepõem"
read_when:
  - Ajustando comportamento do overlay de voz
title: "Overlay de Voz"
---

# Ciclo de Vida do Overlay de Voz (macOS)

Público: contribuidores do aplicativo macOS. Objetivo: manter o overlay de voz previsível quando wake-word e push-to-talk se sobrepõem.

## Intenção atual

- Se o overlay já está visível por wake-word e o usuário pressiona a tecla de atalho, a sessão de atalho _adota_ o texto existente em vez de redefini-lo. O overlay permanece enquanto o atalho é mantido. Quando o usuário solta: envia se houver texto aparado, caso contrário descarta.
- Wake-word sozinho ainda envia automaticamente no silêncio; push-to-talk envia imediatamente ao soltar.

## Implementado (9 de dezembro de 2025)

- Sessões de overlay agora carregam um token por captura (wake-word ou push-to-talk). Atualizações parciais/finais/envio/descarte/nível são descartadas quando o token não corresponde, evitando callbacks obsoletos.
- Push-to-talk adota qualquer texto de overlay visível como prefixo (então pressionar o atalho enquanto o overlay de wake está visível mantém o texto e adiciona nova fala). Aguarda até 1,5s por uma transcrição final antes de recorrer ao texto atual.
- Logging de chime/overlay é emitido em `info` nas categorias `voicewake.overlay`, `voicewake.ptt` e `voicewake.chime` (início de sessão, parcial, final, envio, descarte, motivo do chime).

## Próximos passos

1. **VoiceSessionCoordinator (actor)**
   - Possui exatamente uma `VoiceSession` por vez.
   - API (baseada em token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Descarta callbacks que carregam tokens obsoletos (impede que reconhecedores antigos reabram o overlay).
2. **VoiceSession (model)**
   - Campos: `token`, `source` (wakeWord|pushToTalk), texto committed/volatile, flags de chime, timers (auto-envio, inatividade), `overlayMode` (display|editing|sending), deadline de cooldown.
3. **Binding do overlay**
   - `VoiceSessionPublisher` (`ObservableObject`) espelha a sessão ativa no SwiftUI.
   - `VoiceWakeOverlayView` renderiza apenas via o publisher; nunca modifica singletons globais diretamente.
   - Ações do usuário no overlay (`sendNow`, `dismiss`, `edit`) chamam de volta o coordenador com o token da sessão.
4. **Caminho de envio unificado**
   - Em `endCapture`: se o texto aparado estiver vazio → descarta; senão `performSend(session:)` (toca chime de envio uma vez, encaminha, descarta).
   - Push-to-talk: sem atraso; wake-word: atraso opcional para auto-envio.
   - Aplica um curto cooldown no runtime de wake após push-to-talk terminar para que wake-word não reative imediatamente.
5. **Logging**
   - O coordenador emite logs `.info` no subsistema `ai.opencraft`, categorias `voicewake.overlay` e `voicewake.chime`.
   - Eventos-chave: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Lista de verificação de depuração

- Transmita logs enquanto reproduz um overlay travado:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.opencraft" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verifique que há apenas um token de sessão ativo; callbacks obsoletos devem ser descartados pelo coordenador.
- Certifique-se de que soltar push-to-talk sempre chama `endCapture` com o token ativo; se o texto estiver vazio, espere `dismiss` sem chime ou envio.

## Etapas de migração (sugeridas)

1. Adicione `VoiceSessionCoordinator`, `VoiceSession` e `VoiceSessionPublisher`.
2. Refatore `VoiceWakeRuntime` para criar/atualizar/encerrar sessões em vez de tocar `VoiceWakeOverlayController` diretamente.
3. Refatore `VoicePushToTalk` para adotar sessões existentes e chamar `endCapture` ao soltar; aplique cooldown no runtime.
4. Conecte `VoiceWakeOverlayController` ao publisher; remova chamadas diretas do runtime/PTT.
5. Adicione testes de integração para adoção de sessão, cooldown e descarte de texto vazio.
