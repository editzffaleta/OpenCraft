---
summary: "Plugin Voice Call: chamadas de saída e entrada via Twilio/Telnyx/Plivo (instalação de plugin + config + CLI)"
read_when:
  - Você quer fazer uma chamada de voz de saída do OpenCraft
  - Você está configurando ou desenvolvendo o plugin voice-call
title: "Plugin Voice Call"
---

# Voice Call (plugin)

Chamadas de voz para o OpenCraft via plugin. Suporta notificações de saída e
conversas multi-turno com políticas de entrada.

Provedores atuais:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transferência XML + GetInput para fala)
- `mock` (dev/sem rede)

Modelo mental rápido:

- Instalar plugin
- Reiniciar Gateway
- Configurar em `plugins.entries.voice-call.config`
- Usar `opencraft voicecall ...` ou a tool `voice_call`

## Onde roda (local vs remoto)

O plugin Voice Call roda **dentro do processo do Gateway**.

Se você usa um Gateway remoto, instale/configure o plugin na **máquina rodando o Gateway**, depois reinicie o Gateway para carregá-lo.

## Instalar

### Opção A: instalar do npm (recomendado)

```bash
opencraft plugins install @openclaw/voice-call
```

Reinicie o Gateway depois.

### Opção B: instalar de uma pasta local (dev, sem copiar)

```bash
opencraft plugins install ./extensions/voice-call
cd ./extensions/voice-call && pnpm install
```

Reinicie o Gateway depois.

## Config

Defina a config em `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // ou "telnyx" | "plivo" | "mock"
          fromNumber: "+5511999990000",
          toNumber: "+5511999990001",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Chave pública Telnyx do Telnyx Mission Control Portal
            // (string Base64; também pode ser definida via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Servidor webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Segurança do webhook (recomendado para túneis/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Exposição pública (escolha uma)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            streamPath: "/voice/stream",
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

Notas:

- Twilio/Telnyx requerem uma URL de webhook **acessível publicamente**.
- Plivo requer uma URL de webhook **acessível publicamente**.
- `mock` é um provedor de dev local (sem chamadas de rede).
- Telnyx requer `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`) a menos que `skipSignatureVerification` seja true.
- `skipSignatureVerification` é apenas para testes locais.
- Se você usa o free tier do ngrok, defina `publicUrl` para a URL exata do ngrok; a verificação de assinatura é sempre aplicada.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite webhooks do Twilio com assinaturas inválidas **apenas** quando `tunnel.provider="ngrok"` e `serve.bind` é loopback (agente local ngrok). Use apenas para dev local.
- URLs do free tier do ngrok podem mudar ou adicionar comportamento de intersticial; se `publicUrl` mudar, as assinaturas do Twilio falharão. Para produção, prefira um domínio estável ou Tailscale funnel.
- Padrões de segurança de streaming:
  - `streaming.preStartTimeoutMs` fecha sockets que nunca enviam um frame `start` válido.
  - `streaming.maxPendingConnections` limita sockets pré-start não autenticados no total.
  - `streaming.maxPendingConnectionsPerIp` limita sockets pré-start não autenticados por IP de origem.
  - `streaming.maxConnections` limita sockets de stream de mídia abertos no total (pendentes + ativos).

## Reaper de chamadas obsoletas

Use `staleCallReaperSeconds` para encerrar chamadas que nunca recebem um webhook terminal
(por exemplo, chamadas em modo notify que nunca completam). O padrão é `0`
(desabilitado).

Intervalos recomendados:

- **Produção:** `120`–`300` segundos para fluxos estilo notify.
- Mantenha este valor **maior que `maxDurationSeconds`** para que chamadas normais possam
  terminar. Um bom ponto de partida é `maxDurationSeconds + 30–60` segundos.

Exemplo:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Segurança do Webhook

Quando um proxy ou túnel fica na frente do Gateway, o plugin reconstrói a
URL pública para verificação de assinatura. Essas opções controlam quais headers
encaminhados são confiáveis.

`webhookSecurity.allowedHosts` cria allowlist de hosts de headers de encaminhamento.

`webhookSecurity.trustForwardingHeaders` confia em headers encaminhados sem allowlist.

`webhookSecurity.trustedProxyIPs` só confia em headers encaminhados quando o IP
remoto da requisição corresponde à lista.

A proteção contra replay de webhook está habilitada para Twilio e Plivo. Requisições de webhook
válidas replicadas são reconhecidas mas ignoradas para efeitos colaterais.

Turnos de conversação do Twilio incluem um token por turno em callbacks `<Gather>`, então
callbacks de fala obsoletos/replicados não podem satisfazer um turno de transcript pendente mais novo.

Exemplo com host público estável:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS para chamadas

O Voice Call usa a configuração principal de `messages.tts` (OpenAI ou ElevenLabs) para
fala em streaming nas chamadas. Você pode sobrescrever com a **mesma estrutura** na config do plugin —
ela faz deep-merge com `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    elevenlabs: {
      voiceId: "pMsXgVXv3BLzUgSXRplE",
      modelId: "eleven_multilingual_v2",
    },
  },
}
```

Notas:

- **Edge TTS é ignorado para chamadas de voz** (áudio de telefonia precisa de PCM; saída Edge é não confiável).
- TTS principal é usado quando streaming de mídia Twilio está habilitado; caso contrário, as chamadas caem de volta para vozes nativas do provedor.

### Mais exemplos

Usar apenas TTS principal (sem sobrescrição):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      openai: { voice: "alloy" },
    },
  },
}
```

Sobrescrever para ElevenLabs apenas para chamadas (manter padrão principal em outro lugar):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            elevenlabs: {
              apiKey: "elevenlabs_key",
              voiceId: "pMsXgVXv3BLzUgSXRplE",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

Sobrescrever apenas o modelo OpenAI para chamadas (exemplo de deep-merge):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            openai: {
              model: "gpt-4o-mini-tts",
              voice: "marin",
            },
          },
        },
      },
    },
  },
}
```

## Chamadas de entrada

A política de entrada padrão é `disabled`. Para habilitar chamadas de entrada, defina:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+5511999990000"],
  inboundGreeting: "Olá! Como posso ajudar?",
}
```

`inboundPolicy: "allowlist"` é uma triagem de caller-ID de baixa garantia. O plugin
normaliza o valor `From` fornecido pelo provedor e o compara com `allowFrom`.
A verificação de webhook autentica entrega do provedor e integridade de payload, mas
não prova propriedade do número chamador PSTN/VoIP. Trate `allowFrom` como
filtragem de caller-ID, não como identidade forte do chamador.

Respostas automáticas usam o sistema de agente. Ajuste com:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

## CLI

```bash
opencraft voicecall call --to "+5511999990001" --message "Olá do OpenCraft"
opencraft voicecall continue --call-id <id> --message "Alguma pergunta?"
opencraft voicecall speak --call-id <id> --message "Um momento"
opencraft voicecall end --call-id <id>
opencraft voicecall status --call-id <id>
opencraft voicecall tail
opencraft voicecall expose --mode funnel
```

## Tool do agente

Nome da tool: `voice_call`

Ações:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Este repo inclui um doc de skill correspondente em `skills/voice-call/SKILL.md`.

## RPC do Gateway

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
