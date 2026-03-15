---
name: voice-call
description: Inicie chamadas de voz via plugin voice-call do OpenCraft.
metadata:
  {
    "opencraft":
      {
        "emoji": "📞",
        "skillKey": "voice-call",
        "requires": { "config": ["plugins.entries.voice-call.enabled"] },
      },
  }
---

# Chamada de Voz

Use o plugin voice-call para iniciar ou inspecionar chamadas (Twilio, Telnyx, Plivo ou mock).

## CLI

```bash
opencraft voicecall call --to "+5511999999999" --message "Olá do OpenCraft"
opencraft voicecall status --call-id <id>
```

## Ferramenta

Use `voice_call` para chamadas iniciadas pelo agente.

Ações:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Notas:

- Requer que o plugin voice-call esteja habilitado.
- Configuração do plugin fica em `plugins.entries.voice-call.config`.
- Config Twilio: `provider: "twilio"` + `twilio.accountSid/authToken` + `fromNumber`.
- Config Telnyx: `provider: "telnyx"` + `telnyx.apiKey/connectionId` + `fromNumber`.
- Config Plivo: `provider: "plivo"` + `plivo.authId/authToken` + `fromNumber`.
- Fallback dev: `provider: "mock"` (sem rede).
