---
summary: "Regras de tratamento de imagem e mídia para envio, gateway e respostas do agente"
read_when:
  - Modificando o pipeline de mídia ou anexos
title: "Suporte a Imagem e Mídia"
---

# Suporte a Imagem e Mídia — 2025-12-05

O canal WhatsApp roda via **Baileys Web**. Este documento captura as regras atuais de tratamento de mídia para envio, gateway e respostas do agente.

## Objetivos

- Enviar mídia com legendas opcionais via `opencraft message send --media`.
- Permitir auto-respostas da caixa de entrada web para incluir mídia junto ao texto.
- Manter limites por tipo sensatos e previsíveis.

## Superfície CLI

- `opencraft message send --media <path-or-url> [--message <caption>]`
  - `--media` opcional; legenda pode estar vazia para envios apenas de mídia.
  - `--dry-run` imprime o payload resolvido; `--json` emite `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamento do canal WhatsApp Web

- Entrada: caminho de arquivo local **ou** URL HTTP(S).
- Fluxo: carregar em um Buffer, detectar o tipo de mídia e construir o payload correto:
  - **Imagens:** redimensionar e recomprimir para JPEG (lado máximo 2048px) com alvo `agents.defaults.mediaMaxMb` (padrão 5 MB), limitado a 6 MB.
  - **Áudio/Voz/Vídeo:** passagem direta até 16 MB; áudio é enviado como nota de voz (`ptt: true`).
  - **Documentos:** qualquer outra coisa, até 100 MB, com nome de arquivo preservado quando disponível.
- Reprodução no estilo GIF do WhatsApp: envie um MP4 com `gifPlayback: true` (CLI: `--gif-playback`) para que clientes mobile façam loop inline.
- Detecção de MIME prefere bytes mágicos, depois headers, depois extensão do arquivo.
- Legenda vem de `--message` ou `reply.text`; legenda vazia é permitida.
- Logging: não-verbose mostra `↩️`/`✅`; verbose inclui tamanho e caminho/URL de origem.

## Pipeline de Auto-Resposta

- `getReplyFromConfig` retorna `{ text?, mediaUrl?, mediaUrls? }`.
- Quando mídia está presente, o remetente web resolve caminhos locais ou URLs usando o mesmo pipeline de `opencraft message send`.
- Múltiplas entradas de mídia são enviadas sequencialmente quando fornecidas.

## Mídia de Entrada para Comandos (Pi)

- Quando mensagens web de entrada incluem mídia, o OpenCraft faz download para um arquivo temp e expõe variáveis de template:
  - `{{MediaUrl}}` pseudo-URL para a mídia de entrada.
  - `{{MediaPath}}` caminho temp local escrito antes de rodar o comando.
- Quando um sandbox Docker por sessão está habilitado, a mídia de entrada é copiada para o workspace do sandbox e `MediaPath`/`MediaUrl` são reescritos para um caminho relativo como `media/inbound/<filename>`.
- Entendimento de mídia (se configurado via `tools.media.*` ou `tools.media.models` compartilhado) roda antes do template e pode inserir blocos `[Image]`, `[Audio]` e `[Video]` em `Body`.
  - Áudio define `{{Transcript}}` e usa o transcript para análise de comandos para que slash commands ainda funcionem.
  - Descrições de vídeo e imagem preservam qualquer texto de legenda para análise de comandos.
- Por padrão apenas o primeiro anexo de imagem/áudio/vídeo correspondente é processado; defina `tools.media.<cap>.attachments` para processar múltiplos anexos.

## Limites e Erros

**Limites de envio de saída (envio web WhatsApp)**

- Imagens: ~6 MB após recompressão.
- Áudio/voz/vídeo: 16 MB; documentos: 100 MB.
- Mídia muito grande ou ilegível → erro claro nos logs e a resposta é ignorada.

**Limites de entendimento de mídia (transcrição/descrição)**

- Padrão de imagem: 10 MB (`tools.media.image.maxBytes`).
- Padrão de áudio: 20 MB (`tools.media.audio.maxBytes`).
- Padrão de vídeo: 50 MB (`tools.media.video.maxBytes`).
- Mídia muito grande pula o entendimento, mas as respostas ainda passam com o corpo original.

## Notas para Testes

- Cobrir fluxos de envio + resposta para casos de imagem/áudio/documento.
- Validar recompressão para imagens (limite de tamanho) e flag de nota de voz para áudio.
- Garantir que respostas com múltiplas mídias são enviadas como envios sequenciais.
