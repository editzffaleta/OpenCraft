---
summary: "Referência do CLI para `opencraft agent` (enviar um turno do agente via Gateway)"
read_when:
  - Você quer rodar um turno do agente a partir de scripts (opcionalmente entregar resposta)
title: "agent"
---

# `opencraft agent`

Rodar um turno do agente via Gateway (use `--local` para embutido).
Use `--agent <id>` para direcionar um agente configurado diretamente.

Relacionado:

- Ferramenta de envio do agente: [Agent send](/tools/agent-send)

## Exemplos

```bash
opencraft agent --to +15555550123 --message "atualização de status" --deliver
opencraft agent --agent ops --message "Resumir logs"
opencraft agent --session-id 1234 --message "Resumir caixa de entrada" --thinking medium
opencraft agent --agent ops --message "Gerar relatório" --deliver --reply-channel slack --reply-to "#reports"
```

## Notas

- Quando este comando aciona regeneração de `models.json`, credenciais de provedor gerenciadas por SecretRef são persistidas como marcadores não-secretos (por exemplo nomes de variáveis de env, `secretref-env:ENV_VAR_NAME`, ou `secretref-managed`), não texto simples de segredo resolvido.
- Escritas de marcador são autoritativas de fonte: o OpenCraft persiste marcadores do snapshot de config de fonte ativo, não de valores de segredo de runtime resolvidos.
