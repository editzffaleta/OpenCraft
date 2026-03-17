---
summary: "Referência CLI para `opencraft voicecall` (superfície de comandos do Plugin de chamada de voz)"
read_when:
  - Você usa o Plugin de chamada de voz e quer os pontos de entrada CLI
  - Você quer exemplos rápidos para `voicecall call|continue|status|tail|expose`
title: "voicecall"
---

# `opencraft voicecall`

`voicecall` é um comando fornecido por Plugin. Ele só aparece se o Plugin de chamada de voz estiver instalado e habilitado.

Documentação principal:

- Plugin de chamada de voz: [Voice Call](/plugins/voice-call)

## Comandos comuns

```bash
opencraft voicecall status --call-id <id>
opencraft voicecall call --to "+15555550123" --message "Hello" --mode notify
opencraft voicecall continue --call-id <id> --message "Any questions?"
opencraft voicecall end --call-id <id>
```

## Expondo Webhooks (Tailscale)

```bash
opencraft voicecall expose --mode serve
opencraft voicecall expose --mode funnel
opencraft voicecall expose --mode off
```

Nota de segurança: exponha o endpoint de Webhook apenas para redes em que você confia. Prefira Tailscale Serve em vez de Funnel quando possível.
