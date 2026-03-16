---
summary: "Referência do CLI para `opencraft onboard` (wizard de onboarding interativo)"
read_when:
  - Você quer setup guiado para gateway, workspace, auth, canais e skills
title: "onboard"
---

# `opencraft onboard`

Wizard de onboarding interativo (setup de Gateway local ou remoto).

## Guias relacionados

- Hub de onboarding CLI: [Onboarding Wizard (CLI)](/start/wizard)
- Visão geral de onboarding: [Onboarding Overview](/start/onboarding-overview)
- Referência de onboarding CLI: [CLI Onboarding Reference](/start/wizard-cli-reference)
- Automação CLI: [CLI Automation](/start/wizard-cli-automation)
- Onboarding macOS: [Onboarding (macOS App)](/start/onboarding)

## Exemplos

```bash
opencraft onboard
opencraft onboard --flow quickstart
opencraft onboard --flow manual
opencraft onboard --mode remote --remote-url wss://gateway-host:18789
```

Para alvos `ws://` de rede privada em texto simples (apenas redes confiáveis), defina
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` no ambiente do processo de onboarding.

Provedor personalizado não interativo:

```bash
opencraft onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` é opcional em modo não interativo. Se omitido, o onboarding verifica `CUSTOM_API_KEY`.

Ollama não interativo:

```bash
opencraft onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` padrão é `http://127.0.0.1:11434`. `--custom-model-id` é opcional; se omitido, o onboarding usa os padrões sugeridos do Ollama. IDs de modelo cloud como `kimi-k2.5:cloud` também funcionam aqui.

Armazenar chaves de provedor como refs em vez de texto simples:

```bash
opencraft onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Com `--secret-input-mode ref`, o onboarding escreve refs com backup de env em vez de valores de chave em texto simples.
Para provedores com suporte de perfil de auth isso escreve entradas `keyRef`; para provedores personalizados escreve `models.providers.<id>.apiKey` como uma ref de env (por exemplo `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrato do modo `ref` não interativo:

- Defina a var de env do provedor no ambiente do processo de onboarding (por exemplo `OPENAI_API_KEY`).
- Não passe flags de chave inline (por exemplo `--openai-api-key`) a menos que essa var de env também esteja definida.
- Se uma flag de chave inline for passada sem a var de env necessária, o onboarding falha rapidamente com orientação.

Opções de token do Gateway em modo não interativo:

- `--gateway-auth token --gateway-token <token>` armazena um token em texto simples.
- `--gateway-auth token --gateway-token-ref-env <name>` armazena `gateway.auth.token` como um SecretRef de env.
- `--gateway-token` e `--gateway-token-ref-env` são mutuamente exclusivos.
- `--gateway-token-ref-env` requer uma var de env não vazia no ambiente do processo de onboarding.
- Com `--install-daemon`, quando auth por token requer um token, tokens de gateway gerenciados por SecretRef são validados mas não persistidos como texto simples resolvido nos metadados de ambiente do serviço supervisor.
- Com `--install-daemon`, se o modo token requer um token e o SecretRef de token configurado não está resolvido, o onboarding falha fechado com orientação de remediação.
- Com `--install-daemon`, se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o onboarding bloqueia a instalação até que o modo seja definido explicitamente.

Exemplo:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
opencraft onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Saúde do gateway local não interativo:

- A menos que você passe `--skip-health`, o onboarding aguarda um gateway local acessível antes de sair com sucesso.
- `--install-daemon` inicia o path de instalação do gateway gerenciado primeiro. Sem ele, você já deve ter um gateway local rodando, por exemplo `opencraft gateway run`.
- Se você só quer writes de config/workspace/bootstrap em automação, use `--skip-health`.
- No Windows nativo, `--install-daemon` tenta Scheduled Tasks primeiro e recorre a um login item na pasta Startup por usuário se a criação de task for negada.

Comportamento interativo de onboarding com modo ref:

- Escolha **Use secret reference** quando solicitado.
- Depois escolha entre:
  - Variável de ambiente
  - Provedor de segredo configurado (`file` ou `exec`)
- O onboarding executa uma validação preflight rápida antes de salvar o ref.
  - Se a validação falhar, o onboarding mostra o erro e permite que você tente novamente.

Escolhas de endpoint Z.AI não interativas:

Nota: `--auth-choice zai-api-key` agora auto-detecta o melhor endpoint Z.AI para sua chave (prefere a API geral com `zai/glm-5`).
Se você especificamente quer os endpoints do GLM Coding Plan, escolha `zai-coding-global` ou `zai-coding-cn`.

```bash
# Seleção de endpoint sem prompts
opencraft onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Outras escolhas de endpoint Z.AI:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Exemplo Mistral não interativo:

```bash
opencraft onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Notas de flow:

- `quickstart`: prompts mínimos, auto-gera um token de gateway.
- `manual`: prompts completos para porta/bind/auth (alias de `advanced`).
- Comportamento de escopo DM de onboarding local: [CLI Onboarding Reference](/start/wizard-cli-reference#outputs-and-internals).
- Primeira conversa mais rápida: `opencraft dashboard` (UI de Controle, sem setup de canal).
- Provedor Personalizado: conectar qualquer endpoint compatível com OpenAI ou Anthropic,
  incluindo provedores hospedados não listados. Use Unknown para auto-detectar.

## Comandos comuns de follow-up

```bash
opencraft configure
opencraft agents add <name>
```

<Note>
`--json` não implica modo não interativo. Use `--non-interactive` para scripts.
</Note>
