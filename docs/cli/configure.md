---
summary: "Referência do CLI para `opencraft configure` (prompts de configuração interativos)"
read_when:
  - Você quer ajustar credenciais, dispositivos ou padrões do agente de forma interativa
title: "configure"
---

# `opencraft configure`

Prompt interativo para configurar credenciais, dispositivos e padrões do agente.

Nota: A seção **Modelo** agora inclui uma seleção múltipla para a
allowlist `agents.defaults.models` (o que aparece em `/model` e no seletor de modelo).

Dica: `opencraft config` sem um subcomando abre o mesmo wizard. Use
`opencraft config get|set|unset` para edições não interativas.

Relacionado:

- Referência de configuração do Gateway: [Configuration](/gateway/configuration)
- CLI de config: [Config](/cli/config)

Notas:

- Escolher onde o Gateway roda sempre atualiza `gateway.mode`. Você pode selecionar "Continuar" sem outras seções se for tudo que você precisa.
- Serviços orientados a canal (Slack/Discord/Matrix/Microsoft Teams) solicitam allowlists de canal/sala durante o setup. Você pode inserir nomes ou IDs; o wizard resolve nomes para IDs quando possível.
- Se você rodar o passo de instalação do daemon, auth por token requer um token, e `gateway.auth.token` é gerenciado por SecretRef, configure valida o SecretRef mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço supervisor.
- Se auth por token requer um token e o SecretRef de token configurado não está resolvido, configure bloqueia instalação do daemon com orientação de remediação acionável.
- Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, configure bloqueia instalação do daemon até que o modo seja definido explicitamente.

## Exemplos

```bash
opencraft configure
opencraft configure --section model --section channels
```
