---
summary: "Referência CLI para `opencraft status` (diagnósticos, sondagens, snapshots de uso)"
read_when:
  - Você quer um diagnóstico rápido da saúde do canal + destinatários recentes da sessão
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

- `--deep` executa sondagens ao vivo (WhatsApp Web + Telegram + Discord + Google Chat + Slack + Signal).
- A saída inclui armazenamentos de sessão por agente quando múltiplos agentes estão configurados.
- A visão geral inclui status de instalação/runtime do serviço Gateway + host de nó quando disponível.
- A visão geral inclui canal de atualização + SHA git (para checkouts de código-fonte).
- Informações de atualização aparecem na Visão Geral; se uma atualização estiver disponível, o status imprime uma dica para executar `opencraft update` (veja [Updating](/install/updating)).
- Superfícies de status somente leitura (`status`, `status --json`, `status --all`) resolvem SecretRefs suportados para seus caminhos de config direcionados quando possível.
- Se um SecretRef de canal suportado estiver configurado mas indisponível no caminho de comando atual, o status permanece somente leitura e reporta saída degradada em vez de travar. A saída humana mostra avisos como "configured token unavailable in this command path", e a saída JSON inclui `secretDiagnostics`.
- Quando a resolução de SecretRef local ao comando tem sucesso, o status prefere o snapshot resolvido e limpa marcadores transitórios de "secret unavailable" do canal na saída final.
