---
summary: "Modos Voice Wake e push-to-talk além de detalhes de roteamento no aplicativo macOS"
read_when:
  - Trabalhando nos caminhos de Voice Wake ou PTT
title: "Voice Wake"
---

# Voice Wake e Push-to-Talk

## Modos

- **Modo wake-word** (padrão): reconhecedor de fala sempre ativo aguarda tokens de ativação (`swabbleTriggerWords`). Ao corresponder, inicia a captura, mostra o overlay com texto parcial e envia automaticamente após silêncio.
- **Push-to-talk (segurar Option direito)**: segure a tecla Option direita para capturar imediatamente — sem necessidade de ativação. O overlay aparece enquanto segura; soltar finaliza e encaminha após um curto atraso para que você possa ajustar o texto.

## Comportamento do runtime (wake-word)

- O reconhecedor de fala reside em `VoiceWakeRuntime`.
- A ativação só dispara quando há uma **pausa significativa** entre a wake word e a próxima palavra (~0,55s de intervalo). O overlay/chime pode começar na pausa mesmo antes do comando iniciar.
- Janelas de silêncio: 2,0s quando a fala está fluindo, 5,0s se apenas a ativação foi ouvida.
- Parada forçada: 120s para evitar sessões descontroladas.
- Debounce entre sessões: 350ms.
- O overlay é controlado via `VoiceWakeOverlayController` com coloração committed/volatile.
- Após enviar, o reconhecedor reinicia limpo para ouvir a próxima ativação.

## Invariantes do ciclo de vida

- Se Voice Wake está ativado e as permissões foram concedidas, o reconhecedor de wake-word deve estar ouvindo (exceto durante uma captura push-to-talk explícita).
- A visibilidade do overlay (incluindo descarte manual via botão X) nunca deve impedir o reconhecedor de retomar.

## Modo de falha do overlay travado (anterior)

Anteriormente, se o overlay ficasse travado visível e você o fechasse manualmente, o Voice Wake poderia parecer "morto" porque a tentativa de reinicialização do runtime poderia ser bloqueada pela visibilidade do overlay e nenhuma reinicialização subsequente era agendada.

Endurecimento:

- A reinicialização do runtime de wake não é mais bloqueada pela visibilidade do overlay.
- O descarte do overlay dispara um `VoiceWakeRuntime.refresh(...)` via `VoiceSessionCoordinator`, então descarte manual via X sempre retoma a escuta.

## Especificidades do push-to-talk

- A detecção de atalho usa um monitor global `.flagsChanged` para **Option direito** (`keyCode 61` + `.option`). Apenas observamos eventos (sem engolir).
- O pipeline de captura reside em `VoicePushToTalk`: inicia Speech imediatamente, transmite parciais para o overlay e chama `VoiceWakeForwarder` ao soltar.
- Quando push-to-talk inicia, pausamos o runtime de wake-word para evitar capturas de áudio em conflito; ele reinicia automaticamente após soltar.
- Permissões: requer Microfone + Fala; ver eventos precisa de aprovação de Acessibilidade/Input Monitoring.
- Teclados externos: alguns podem não expor Option direito como esperado — ofereça um atalho alternativo se os usuários relatarem falhas.

## Configurações voltadas ao usuário

- Toggle **Voice Wake**: ativa o runtime de wake-word.
- **Segurar Cmd+Fn para falar**: ativa o monitor push-to-talk. Desativado no macOS < 26.
- Seletores de idioma e microfone, medidor de nível ao vivo, tabela de palavras de ativação, testador (somente local; não encaminha).
- O seletor de microfone preserva a última seleção se um dispositivo desconectar, mostra uma dica de desconectado e recorre temporariamente ao padrão do sistema até que retorne.
- **Sons**: chimes na detecção de ativação e no envio; padrão para o som de sistema "Glass" do macOS. Você pode escolher qualquer arquivo carregável por `NSSound` (por exemplo MP3/WAV/AIFF) para cada evento ou escolher **No Sound**.

## Comportamento de encaminhamento

- Quando Voice Wake está ativado, transcrições são encaminhadas para o Gateway/agente ativo (o mesmo modo local vs remoto usado pelo resto do aplicativo macOS).
- Respostas são entregues ao **último provedor principal usado** (WhatsApp/Telegram/Discord/WebChat). Se a entrega falhar, o erro é registrado e a execução ainda é visível via WebChat/logs de sessão.

## Payload de encaminhamento

- `VoiceWakeForwarder.prefixedTranscript(_:)` adiciona a dica da máquina antes de enviar. Compartilhado entre os caminhos de wake-word e push-to-talk.

## Verificação rápida

- Ative push-to-talk, segure Cmd+Fn, fale, solte: o overlay deve mostrar parciais e depois enviar.
- Enquanto segura, as orelhas da barra de menus devem permanecer aumentadas (usa `triggerVoiceEars(ttl:nil)`); elas diminuem após soltar.
