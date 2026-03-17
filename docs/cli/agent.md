---
summary: "Referência CLI para `opencraft agent` (executa um turno de agente via Gateway)"
read_when:
  - Você quer executar um turno de agente a partir de scripts (opcionalmente entregar resposta)
title: "agent"
---

# `opencraft agent`

Executa um turno de agente via Gateway (use `--local` para modo embutido).
Use `--agent <id>` para direcionar um agente configurado diretamente.

Relacionado:

- Ferramenta de envio de agente: [Envio de agente](/tools/agent-send)

## Exemplos

```bash
opencraft agent --to +15555550123 --message "atualização de status" --deliver
opencraft agent --agent ops --message "Resumir logs"
opencraft agent --session-id 1234 --message "Resumir caixa de entrada" --thinking medium
opencraft agent --agent ops --message "Gerar relatório" --deliver --reply-channel slack --reply-to "#reports"
```

## Observações

- Quando este comando aciona a regeneração de `models.json`, credenciais de provedor gerenciadas por SecretRef são persistidas como marcadores não secretos (por exemplo, nomes de variáveis de ambiente, `secretref-env:ENV_VAR_NAME`, ou `secretref-managed`), não como texto secreto resolvido.
- As gravações de marcadores são autoritativas pela fonte: o OpenCraft persiste marcadores do snapshot de config de fonte ativa, não dos valores secretos resolvidos em tempo de execução.
