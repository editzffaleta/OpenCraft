---
summary: "Modos de voice wake e push-to-talk mais detalhes de roteamento no app mac"
read_when:
  - Trabalhando nos caminhos de voice wake ou PTT
title: "Voice Wake"
---

# Voice Wake e Push-to-Talk

## Modos

- **Modo wake-word** (padrão): reconhecedor de fala sempre ativo aguarda tokens de gatilho (`swabbleTriggerWords`). Ao detectar, inicia a captura, mostra o overlay com texto parcial, e faz auto-envio após silêncio.
- **Push-to-talk (segurar Option direito)**: segure a tecla Option direita para capturar imediatamente — sem necessidade de gatilho. O overlay aparece enquanto pressionado; soltar finaliza e encaminha após um curto delay para que você possa ajustar o texto.

## Comportamento do runtime (wake-word)

- O reconhecedor de fala vive em `VoiceWakeRuntime`.
- O gatilho só dispara quando há uma **pausa significativa** entre a wake word e a próxima palavra (~0.55s de gap). O overlay/chime pode começar na pausa mesmo antes do comando iniciar.
- Janelas de silêncio: 2,0s quando a fala está fluindo, 5,0s se apenas o gatilho foi ouvido.
- Parada forçada: 120s para evitar sessões sem fim.
- Debounce entre sessões: 350ms.
- O overlay é controlado via `VoiceWakeOverlayController` com coloração committed/volatile.
- Após o envio, o reconhecedor reinicia limpo para ouvir o próximo gatilho.

## Invariantes do ciclo de vida

- Se o Voice Wake estiver habilitado e as permissões concedidas, o reconhecedor de wake-word deve estar escutando (exceto durante uma captura explícita de push-to-talk).
- A visibilidade do overlay (incluindo descarte manual via o botão X) nunca deve impedir o reconhecedor de retomar.

## Modo de falha de overlay preso (anterior)

Anteriormente, se o overlay travasse visível e você o fechasse manualmente, o Voice Wake poderia parecer "morto" porque a tentativa de reinício do runtime poderia ser bloqueada pela visibilidade do overlay e nenhum reinício subsequente era agendado.

Endurecimento:

- O reinício do runtime de wake não é mais bloqueado pela visibilidade do overlay.
- A conclusão do descarte do overlay dispara um `VoiceWakeRuntime.refresh(...)` via `VoiceSessionCoordinator`, para que o descarte manual com X sempre retome a escuta.

## Especificidades do push-to-talk

- A detecção do atalho usa um monitor global `.flagsChanged` para **Option direito** (`keyCode 61` + `.option`). Apenas observamos eventos (sem engolir).
- O pipeline de captura vive em `VoicePushToTalk`: inicia a fala imediatamente, transmite parciais para o overlay, e chama `VoiceWakeForwarder` ao soltar.
- Quando o push-to-talk inicia, pausamos o runtime de wake-word para evitar taps de áudio concorrentes; ele reinicia automaticamente após soltar.
- Permissões: requer Microfone + Fala; observar eventos requer aprovação de Acessibilidade/Monitoramento de Entrada.
- Teclados externos: alguns podem não expor Option direito como esperado — ofereça um atalho de fallback se usuários relatarem falhas.

## Configurações voltadas ao usuário

- Toggle **Voice Wake**: habilita o runtime de wake-word.
- **Segurar Cmd+Fn para falar**: habilita o monitor push-to-talk. Desabilitado no macOS < 26.
- Seletores de idioma e microfone, medidor de nível ao vivo, tabela de palavras de gatilho, testador (somente local; não encaminha).
- O seletor de microfone preserva a última seleção se um dispositivo for desconectado, mostra uma dica de desconectado, e recorre temporariamente ao padrão do sistema até retornar.
- **Sons**: chimes na detecção do gatilho e no envio; usa como padrão o som de sistema "Glass" do macOS. Você pode escolher qualquer arquivo carregável pelo `NSSound` (ex: MP3/WAV/AIFF) para cada evento ou escolher **Sem Som**.

## Comportamento de encaminhamento

- Quando o Voice Wake está habilitado, os transcritos são encaminhados para o gateway/agente ativo (o mesmo modo local vs remoto usado pelo resto do app mac).
- As respostas são entregues para o **último provedor principal usado** (WhatsApp/Telegram/Discord/WebChat). Se a entrega falhar, o erro é registrado e a execução ainda fica visível via WebChat/logs de sessão.

## Payload de encaminhamento

- `VoiceWakeForwarder.prefixedTranscript(_:)` adiciona a dica de máquina antes de enviar. Compartilhado entre os caminhos de wake-word e push-to-talk.

## Verificação rápida

- Ative push-to-talk, segure Cmd+Fn, fale, solte: o overlay deve mostrar parciais e depois enviar.
- Enquanto segura, as orelhas na barra de menu devem permanecer expandidas (usa `triggerVoiceEars(ttl:nil)`); elas caem após soltar.
