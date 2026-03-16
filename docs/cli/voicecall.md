---
summary: "Referência do CLI para `opencraft voicecall` (superfície de comandos CLI do plugin voice-call)"
read_when:
  - Você usa o plugin voice-call e quer os pontos de entrada CLI
  - Você quer exemplos rápidos para `voicecall call|continue|status|tail|expose`
title: "voicecall"
---

# `opencraft voicecall`

`voicecall` é um comando fornecido por plugin. Só aparece se o plugin voice-call estiver instalado e habilitado.

Doc principal:

- Plugin voice-call: [Voice Call](/plugins/voice-call)

## Comandos comuns

```bash
opencraft voicecall status --call-id <id>
opencraft voicecall call --to "+15555550123" --message "Hello" --mode notify
opencraft voicecall continue --call-id <id> --message "Any questions?"
opencraft voicecall end --call-id <id>
```

## Expondo webhooks (Tailscale)

```bash
opencraft voicecall expose --mode serve
opencraft voicecall expose --mode funnel
opencraft voicecall expose --mode off
```

Nota de segurança: só exponha o endpoint webhook para redes em que você confia. Prefira Tailscale Serve em vez de Funnel quando possível.
