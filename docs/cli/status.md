---
summary: "Referência do CLI para `opencraft status` (diagnósticos, probes, snapshots de uso)"
read_when:
  - Você quer um diagnóstico rápido de saúde dos canais + destinatários de sessões recentes
  - Você quer um status "all" colável para depuração
title: "status"
---

# `opencraft status`

Diagnósticos para canais + sessões.

```bash
opencraft status
opencraft status --all
opencraft status --deep
opencraft status --usage
```

Notas:

- `--deep` roda probes ao vivo (WhatsApp Web + Telegram + Discord + Google Chat + Slack + Signal).
- A saída inclui stores de sessão por agente quando múltiplos agentes estão configurados.
- A visão geral inclui status de instalação/runtime do serviço do Gateway + host de node quando disponível.
- A visão geral inclui canal de atualização + git SHA (para checkouts de fonte).
- Info de atualização aparece na Visão Geral; se uma atualização estiver disponível, status imprime uma dica para rodar `opencraft update` (veja [Updating](/install/updating)).
- Superfícies de status read-only (`status`, `status --json`, `status --all`) resolvem SecretRefs suportados para seus paths de config direcionados quando possível.
- Se um SecretRef de canal suportado estiver configurado mas não disponível no path de comando atual, status permanece read-only e reporta saída degradada em vez de travar. Saída humana mostra avisos como "configured token unavailable in this command path", e saída JSON inclui `secretDiagnostics`.
