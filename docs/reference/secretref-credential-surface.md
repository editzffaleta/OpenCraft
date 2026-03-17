---
summary: "Superfície canônica de credenciais SecretRef suportadas vs não suportadas"
read_when:
  - Verificando cobertura de credenciais SecretRef
  - Auditando se uma credencial é elegível para `secrets configure` ou `secrets apply`
  - Verificando por que uma credencial está fora da superfície suportada
title: "Superfície de Credenciais SecretRef"
---

# Superfície de credenciais SecretRef

Esta página define a superfície canônica de credenciais SecretRef.

Intenção de escopo:

- No escopo: estritamente credenciais fornecidas pelo usuário que o OpenCraft não cria ou rotaciona.
- Fora do escopo: credenciais criadas em tempo de execução ou rotativas, material de refresh OAuth e artefatos semelhantes a sessão.

## Credenciais suportadas

### Alvos `opencraft.json` (`secrets configure` + `secrets apply` + `secrets audit`)

[//]: # "secretref-supported-list-start"

- `models.providers.*.apiKey`
- `models.providers.*.headers.*`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.elevenlabs.apiKey`
- `messages.tts.openai.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `tools.web.search.apiKey`
- `tools.web.search.gemini.apiKey`
- `tools.web.search.grok.apiKey`
- `tools.web.search.kimi.apiKey`
- `tools.web.search.perplexity.apiKey`
- `gateway.auth.password`
- `gateway.auth.token`
- `gateway.remote.token`
- `gateway.remote.password`
- `cron.webhookToken`
- `channels.telegram.botToken`
- `channels.telegram.webhookSecret`
- `channels.telegram.accounts.*.botToken`
- `channels.telegram.accounts.*.webhookSecret`
- `channels.slack.botToken`
- `channels.slack.appToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.discord.token`
- `channels.discord.pluralkit.token`
- `channels.discord.voice.tts.elevenlabs.apiKey`
- `channels.discord.voice.tts.openai.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.elevenlabs.apiKey`
- `channels.discord.accounts.*.voice.tts.openai.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.bluebubbles.password`
- `channels.bluebubbles.accounts.*.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.password`
- `channels.nextcloud-talk.botSecret`
- `channels.nextcloud-talk.apiPassword`
- `channels.nextcloud-talk.accounts.*.botSecret`
- `channels.nextcloud-talk.accounts.*.apiPassword`
- `channels.zalo.botToken`
- `channels.zalo.webhookSecret`
- `channels.zalo.accounts.*.botToken`
- `channels.zalo.accounts.*.webhookSecret`
- `channels.googlechat.serviceAccount` via `serviceAccountRef` irmão (exceção de compatibilidade)
- `channels.googlechat.accounts.*.serviceAccount` via `serviceAccountRef` irmão (exceção de compatibilidade)

### Alvos `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`)
- `profiles.*.tokenRef` (`type: "token"`)

[//]: # "secretref-supported-list-end"

Notas:

- Alvos de plano de perfil de autenticação requerem `agentId`.
- Entradas de plano visam `profiles.*.key` / `profiles.*.token` e escrevem refs irmãos (`keyRef` / `tokenRef`).
- Refs de perfil de autenticação são incluídos na resolução em tempo de execução e cobertura de auditoria.
- Para provedores de modelo gerenciados por SecretRef, entradas `agents/*/agent/models.json` geradas persistem marcadores não-secretos (não valores de segredo resolvidos) para superfícies `apiKey`/header.
- A persistência de marcadores é autoritativa pela fonte: o OpenCraft escreve marcadores do snapshot da config de origem ativa (pré-resolução), não de valores de segredo resolvidos em tempo de execução.
- Para busca web:
  - No modo de provedor explícito (`tools.web.search.provider` definido), apenas a chave do provedor selecionado está ativa.
  - No modo automático (`tools.web.search.provider` não definido), apenas a primeira chave de provedor que resolve por precedência está ativa.
  - No modo automático, refs de provedor não selecionados são tratados como inativos até serem selecionados.

## Credenciais não suportadas

Credenciais fora do escopo incluem:

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `channels.matrix.accessToken`
- `channels.matrix.accounts.*.accessToken`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `discord.threadBindings.*.webhookToken`
- `whatsapp.creds.json`

[//]: # "secretref-unsupported-list-end"

Justificativa:

- Essas credenciais são classes criadas, rotacionadas, portadoras de sessão ou duráveis OAuth que não se encaixam na resolução SecretRef externa somente leitura.
