---
summary: "Referência CLI para `opencraft onboard` (onboarding interativo)"
read_when:
  - Você quer configuração guiada para Gateway, workspace, autenticação, canais e Skills
title: "onboard"
---

# `opencraft onboard`

Onboarding interativo para configuração de Gateway local ou remoto.

## Guias relacionados

- Hub de onboarding CLI: [Onboarding (CLI)](/start/wizard)
- Visão geral do onboarding: [Onboarding Overview](/start/onboarding-overview)
- Referência de onboarding CLI: [CLI Setup Reference](/start/wizard-cli-reference)
- Automação CLI: [CLI Automation](/start/wizard-cli-automation)
- Onboarding macOS: [Onboarding (macOS App)](/start/onboarding)

## Exemplos

```bash
opencraft onboard
opencraft onboard --flow quickstart
opencraft onboard --flow manual
opencraft onboard --mode remote --remote-url wss://gateway-host:18789
```

Para destinos `ws://` em texto puro em redes privadas (apenas redes confiáveis), defina
`OPENCRAFT_ALLOW_INSECURE_PRIVATE_WS=1` no ambiente do processo de onboarding.

Provedor customizado não interativo:

```bash
opencraft onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` é opcional no modo não interativo. Se omitido, o onboarding verifica `CUSTOM_API_KEY`.

Ollama não interativo:

```bash
opencraft onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` tem como padrão `http://127.0.0.1:11434`. `--custom-model-id` é opcional; se omitido, o onboarding usa os padrões sugeridos pelo Ollama. IDs de modelo na nuvem como `kimi-k2.5:cloud` também funcionam aqui.

Armazenar chaves de provedor como referências em vez de texto puro:

```bash
opencraft onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Com `--secret-input-mode ref`, o onboarding escreve referências baseadas em env em vez de valores de chave em texto puro.
Para provedores baseados em perfil de autenticação, isso escreve entradas `keyRef`; para provedores customizados, isso escreve `models.providers.<id>.apiKey` como referência env (por exemplo `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrato do modo `ref` não interativo:

- Defina a variável de ambiente do provedor no ambiente do processo de onboarding (por exemplo `OPENAI_API_KEY`).
- Não passe flags de chave inline (por exemplo `--openai-api-key`) a menos que essa variável de ambiente também esteja definida.
- Se uma flag de chave inline for passada sem a variável de ambiente necessária, o onboarding falha imediatamente com orientação.

Opções de Token do Gateway no modo não interativo:

- `--gateway-auth token --gateway-token <token>` armazena um Token em texto puro.
- `--gateway-auth token --gateway-token-ref-env <name>` armazena `gateway.auth.token` como SecretRef de env.
- `--gateway-token` e `--gateway-token-ref-env` são mutuamente exclusivos.
- `--gateway-token-ref-env` requer uma variável de ambiente não vazia no ambiente do processo de onboarding.
- Com `--install-daemon`, quando autenticação por Token requer um Token, Tokens de Gateway gerenciados por SecretRef são validados mas não persistidos como texto puro resolvido nos metadados de ambiente do serviço supervisor.
- Com `--install-daemon`, se o modo de Token requer um Token e o SecretRef de Token configurado não está resolvido, o onboarding falha de forma fechada com orientação de remediação.
- Com `--install-daemon`, se tanto `gateway.auth.token` quanto `gateway.auth.password` estão configurados e `gateway.auth.mode` não está definido, o onboarding bloqueia a instalação até que o modo seja definido explicitamente.

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

Saúde do Gateway local não interativo:

- A menos que você passe `--skip-health`, o onboarding aguarda um Gateway local acessível antes de sair com sucesso.
- `--install-daemon` inicia o caminho de instalação do Gateway gerenciado primeiro. Sem ele, você já deve ter um Gateway local em execução, por exemplo `opencraft gateway run`.
- Se você quer apenas escritas de config/workspace/bootstrap em automação, use `--skip-health`.
- No Windows nativo, `--install-daemon` tenta Tarefas Agendadas primeiro e volta para um item de login da pasta Startup por usuário se a criação da tarefa for negada.

Comportamento do onboarding interativo com modo de referência:

- Escolha **Usar referência secreta** quando solicitado.
- Em seguida, escolha:
  - Variável de ambiente
  - Provedor de segredos configurado (`file` ou `exec`)
- O onboarding realiza uma validação rápida de pré-voo antes de salvar a referência.
  - Se a validação falhar, o onboarding mostra o erro e permite que você tente novamente.

Escolhas de endpoint Z.AI não interativas:

Nota: `--auth-choice zai-api-key` agora detecta automaticamente o melhor endpoint Z.AI para sua chave (prefere a API geral com `zai/glm-5`).
Se você quer especificamente os endpoints do GLM Coding Plan, escolha `zai-coding-global` ou `zai-coding-cn`.

```bash
# Seleção de endpoint sem prompts
opencraft onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Outras opções de endpoint Z.AI:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Exemplo não interativo Mistral:

```bash
opencraft onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Notas sobre fluxos:

- `quickstart`: prompts mínimos, gera automaticamente um Token de Gateway.
- `manual`: prompts completos para porta/bind/autenticação (alias de `advanced`).
- Comportamento de escopo de DM do onboarding local: [CLI Setup Reference](/start/wizard-cli-reference#outputs-and-internals).
- Chat mais rápido: `opencraft dashboard` (Interface de Controle, sem configuração de canal).
- Provedor Customizado: conecte qualquer endpoint compatível com OpenAI ou Anthropic,
  incluindo provedores hospedados não listados. Use Unknown para detectar automaticamente.

## Comandos de acompanhamento comuns

```bash
opencraft configure
opencraft agents add <name>
```

<Note>
`--json` não implica modo não interativo. Use `--non-interactive` para scripts.
</Note>
