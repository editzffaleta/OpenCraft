---
summary: "Regras de tratamento de imagem e mídia para envio, gateway e respostas do agente"
read_when:
  - Modificando pipeline de mídia ou anexos
title: "Suporte a Imagem e Mídia"
---

# Suporte a Imagem e Mídia — 2025-12-05

O canal WhatsApp roda via **Baileys Web**. Este documento captura as regras atuais de tratamento de mídia para envio, gateway e respostas do agente.

## Objetivos

- Enviar mídia com legendas opcionais via `opencraft message send --media`.
- Permitir respostas automáticas da caixa de entrada web incluir mídia junto com texto.
- Manter limites por tipo sensatos e previsíveis.

## Interface CLI

- `opencraft message send --media <path-or-url> [--message <caption>]`
  - `--media` opcional; legenda pode ser vazia para envios somente mídia.
  - `--dry-run` imprime o payload resolvido; `--json` emite `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamento do canal WhatsApp Web

- Entrada: caminho de arquivo local **ou** URL HTTP(S).
- Fluxo: carregar em um Buffer, detectar tipo de mídia e construir o payload correto:
  - **Imagens:** redimensionar e recomprimir para JPEG (lado máximo 2048px) mirando `agents.defaults.mediaMaxMb` (padrão 5 MB), limitado a 6 MB.
  - **Áudio/Voz/Vídeo:** passagem direta até 16 MB; áudio é enviado como nota de voz (`ptt: true`).
  - **Documentos:** qualquer outra coisa, até 100 MB, com nome de arquivo preservado quando disponível.
- Reprodução estilo GIF do WhatsApp: envie um MP4 com `gifPlayback: true` (CLI: `--gif-playback`) para que clientes móveis reproduzam em loop inline.
- Detecção de MIME prefere bytes mágicos, depois headers, depois extensão do arquivo.
- Legenda vem de `--message` ou `reply.text`; legenda vazia é permitida.
- Logging: não-verboso mostra `↩️`/`✅`; verboso inclui tamanho e caminho/URL de origem.

## Pipeline de Resposta Automática

- `getReplyFromConfig` retorna `{ text?, mediaUrl?, mediaUrls? }`.
- Quando mídia está presente, o remetente web resolve caminhos locais ou URLs usando o mesmo pipeline de `opencraft message send`.
- Múltiplas entradas de mídia são enviadas sequencialmente se fornecidas.

## Mídia Recebida para Comandos (Pi)

- Quando mensagens web recebidas incluem mídia, o OpenCraft baixa para um arquivo temporário e expõe variáveis de template:
  - `{{MediaUrl}}` pseudo-URL para a mídia recebida.
  - `{{MediaPath}}` caminho temporário local escrito antes de executar o comando.
- Quando um sandbox Docker por sessão está habilitado, a mídia recebida é copiada para o workspace do sandbox e `MediaPath`/`MediaUrl` são reescritos para um caminho relativo como `media/inbound/<filename>`.
- A compreensão de mídia (se configurada via `tools.media.*` ou `tools.media.models` compartilhado) roda antes do templating e pode inserir blocos `[Image]`, `[Audio]` e `[Video]` no `Body`.
  - Áudio define `{{Transcript}}` e usa a transcrição para parsing de comandos para que comandos slash ainda funcionem.
  - Descrições de vídeo e imagem preservam qualquer texto de legenda para parsing de comandos.
- Por padrão apenas o primeiro anexo de imagem/áudio/vídeo correspondente é processado; defina `tools.media.<cap>.attachments` para processar múltiplos anexos.

## Limites e Erros

**Limites de envio de saída (envio web WhatsApp)**

- Imagens: ~6 MB de limite após recompressão.
- Áudio/voz/vídeo: limite de 16 MB; documentos: limite de 100 MB.
- Mídia excedente ou ilegível → erro claro nos logs e a resposta é pulada.

**Limites de compreensão de mídia (transcrição/descrição)**

- Padrão de imagem: 10 MB (`tools.media.image.maxBytes`).
- Padrão de áudio: 20 MB (`tools.media.audio.maxBytes`).
- Padrão de vídeo: 50 MB (`tools.media.video.maxBytes`).
- Mídia excedente pula a compreensão, mas respostas ainda passam com o corpo original.

## Notas para Testes

- Cobrir fluxos de envio + resposta para casos de imagem/áudio/documento.
- Validar recompressão para imagens (limite de tamanho) e flag de nota de voz para áudio.
- Garantir que respostas com múltiplas mídias se expandam como envios sequenciais.
