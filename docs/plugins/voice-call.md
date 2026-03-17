---
summary: "Plugin Voice Call: chamadas de saída + entrada via Twilio/Telnyx/Plivo (instalação do Plugin + config + CLI)"
read_when:
  - Você quer realizar uma chamada de voz de saída pelo OpenCraft
  - Você está configurando ou desenvolvendo o Plugin de chamada de voz
title: "Voice Call Plugin"
---

# Voice Call (Plugin)

Chamadas de voz para o OpenCraft via Plugin. Suporta notificações de saída e
conversas multi-turno com políticas de entrada.

Provedores atuais:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (desenvolvimento/sem rede)

Modelo mental rápido:

- Instale o Plugin
- Reinicie o Gateway
- Configure em `plugins.entries.voice-call.config`
- Use `opencraft voicecall ...` ou a ferramenta `voice_call`

## Onde roda (local vs remoto)

O Plugin Voice Call roda **dentro do processo do Gateway**.

Se você usa um Gateway remoto, instale/configure o Plugin na **máquina que está executando o Gateway**, depois reinicie o Gateway para carregá-lo.

## Instalação

### Opção A: instalar do npm (recomendado)

```bash
opencraft plugins install @opencraft/voice-call
```

Reinicie o Gateway depois.

### Opção B: instalar de uma pasta local (desenvolvimento, sem cópia)

```bash
opencraft plugins install ./extensions/voice-call
cd ./extensions/voice-call && pnpm install
```

Reinicie o Gateway depois.

## Config

Defina o config em `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // ou "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Chave pública do Webhook Telnyx do Telnyx Mission Control Portal
            // (string Base64; também pode ser definida via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Servidor de Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Segurança de Webhook (recomendado para túneis/proxies)
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

- Twilio/Telnyx requerem uma URL de Webhook **publicamente acessível**.
- Plivo requer uma URL de Webhook **publicamente acessível**.
- `mock` é um provedor de desenvolvimento local (sem chamadas de rede).
- Telnyx requer `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`) a menos que `skipSignatureVerification` seja true.
- `skipSignatureVerification` é apenas para testes locais.
- Se você usar o tier gratuito do ngrok, defina `publicUrl` para a URL exata do ngrok; a verificação de assinatura é sempre aplicada.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite Webhooks do Twilio com assinaturas inválidas **apenas** quando `tunnel.provider="ngrok"` e `serve.bind` é loopback (agente local ngrok). Use apenas para desenvolvimento local.
- URLs do tier gratuito do ngrok podem mudar ou adicionar comportamento intersticial; se `publicUrl` divergir, assinaturas do Twilio falharão. Para produção, prefira um domínio estável ou Tailscale funnel.
- Padrões de segurança de streaming:
  - `streaming.preStartTimeoutMs` fecha sockets que nunca enviam um frame `start` válido.
  - `streaming.maxPendingConnections` limita o total de sockets pré-start não autenticados.
  - `streaming.maxPendingConnectionsPerIp` limita sockets pré-start não autenticados por IP de origem.
  - `streaming.maxConnections` limita o total de sockets de media stream abertos (pendentes + ativos).

## Ceifador de chamadas obsoletas

Use `staleCallReaperSeconds` para encerrar chamadas que nunca recebem um Webhook terminal
(por exemplo, chamadas no modo notify que nunca completam). O padrão é `0`
(desabilitado).

Faixas recomendadas:

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

## Segurança de Webhook

Quando um proxy ou túnel fica na frente do Gateway, o Plugin reconstrói a
URL pública para verificação de assinatura. Essas opções controlam quais cabeçalhos
encaminhados são confiáveis.

`webhookSecurity.allowedHosts` define uma allowlist de hosts de cabeçalhos de encaminhamento.

`webhookSecurity.trustForwardingHeaders` confia em cabeçalhos encaminhados sem allowlist.

`webhookSecurity.trustedProxyIPs` só confia em cabeçalhos encaminhados quando o IP
remoto da requisição corresponde à lista.

A proteção contra replay de Webhook está habilitada para Twilio e Plivo. Requisições de Webhook
válidas mas repetidas são confirmadas porém ignoradas para efeitos colaterais.

Turnos de conversa do Twilio incluem um Token por turno em callbacks `<Gather>`, então
callbacks de fala obsoletos/repetidos não podem satisfazer um turno de transcrição pendente mais recente.

Exemplo com um host público estável:

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

Voice Call usa a configuração core `messages.tts` para
fala em streaming nas chamadas. Você pode sobrescrever no config do Plugin com o
**mesmo formato** — ele faz deep-merge com `messages.tts`.

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

- **Fala da Microsoft é ignorada para chamadas de voz** (áudio de telefonia precisa de PCM; o transporte atual da Microsoft não expõe saída PCM de telefonia).
- TTS core é usado quando streaming de mídia do Twilio está habilitado; caso contrário, chamadas usam vozes nativas do provedor como fallback.

### Mais exemplos

Usar apenas TTS core (sem sobrescrita):

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

Sobrescrever para ElevenLabs apenas para chamadas (manter o padrão core em outros lugares):

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
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` é uma triagem de caller-ID de baixa garantia. O Plugin
normaliza o valor `From` fornecido pelo provedor e o compara com `allowFrom`.
A verificação de Webhook autentica a entrega do provedor e a integridade do payload, mas
não prova propriedade do número de chamada PSTN/VoIP. Trate `allowFrom` como
filtragem de caller-ID, não como identidade forte do chamador.

Respostas automáticas usam o sistema de agente. Ajuste com:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

## CLI

```bash
opencraft voicecall call --to "+15555550123" --message "Hello from OpenCraft"
opencraft voicecall continue --call-id <id> --message "Any questions?"
opencraft voicecall speak --call-id <id> --message "One moment"
opencraft voicecall end --call-id <id>
opencraft voicecall status --call-id <id>
opencraft voicecall tail
opencraft voicecall expose --mode funnel
```

## Ferramenta de agente

Nome da ferramenta: `voice_call`

Ações:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Este repositório inclui um documento de Skill correspondente em `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
