---
summary: "Onboarding e configuração de agente com script para o CLI do OpenCraft"
read_when:
  - Você está automatizando o onboarding em scripts ou CI
  - Você precisa de exemplos não interativos para provedores específicos
title: "Automação CLI"
sidebarTitle: "Automação CLI"
---

# Automação CLI

Use `--non-interactive` para automatizar o `opencraft onboard`.

<Note>
`--json` não implica modo não interativo. Use `--non-interactive` (e `--workspace`) para scripts.
</Note>

## Exemplo não interativo básico

```bash
opencraft onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Adicione `--json` para um resumo legível por máquina.

Use `--secret-input-mode ref` para armazenar refs com backup em env nos perfis de auth em vez de valores em texto simples.
A seleção interativa entre refs de env e refs de provedor configuradas (`file` ou `exec`) está disponível no fluxo do assistente de onboarding.

No modo `ref` não interativo, as variáveis de ambiente do provedor devem estar definidas no ambiente do processo.
Passar flags de chave inline sem a variável de ambiente correspondente falha rapidamente.

Exemplo:

```bash
opencraft onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Exemplos por provedor

<AccordionGroup>
  <Accordion title="Exemplo Gemini">
    ```bash
    opencraft onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo Z.AI">
    ```bash
    opencraft onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo Vercel AI Gateway">
    ```bash
    opencraft onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo Cloudflare AI Gateway">
    ```bash
    opencraft onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "seu-account-id" \
      --cloudflare-ai-gateway-gateway-id "seu-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo Moonshot">
    ```bash
    opencraft onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo Mistral">
    ```bash
    opencraft onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo Synthetic">
    ```bash
    opencraft onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo OpenCode">
    ```bash
    opencraft onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Troque para `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` para o catálogo Go.
  </Accordion>
  <Accordion title="Exemplo Ollama">
    ```bash
    opencraft onboard --non-interactive \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo de provedor personalizado">
    ```bash
    opencraft onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key` é opcional. Se omitido, o onboarding verifica `CUSTOM_API_KEY`.

    Variante com modo ref:

    ```bash
    export CUSTOM_API_KEY="sua-chave"
    opencraft onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    Neste modo, o onboarding armazena `apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

## Adicionar outro agente

Use `opencraft agents add <nome>` para criar um agente separado com seu próprio workspace,
sessões e perfis de auth. Executar sem `--workspace` lança o assistente.

```bash
opencraft agents add trabalho \
  --workspace ~/.opencraft/workspace-trabalho \
  --model openai/gpt-5.2 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

O que define:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notas:

- Workspaces padrão seguem `~/.opencraft/workspace-<agentId>`.
- Adicione `bindings` para rotear mensagens de entrada (o assistente pode fazer isso).
- Flags não interativas: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Documentação relacionada

- Hub de onboarding: [Assistente de Onboarding (CLI)](/start/wizard)
- Referência completa: [Referência CLI de Onboarding](/start/wizard-cli-reference)
- Referência de comando: [`opencraft onboard`](/cli/onboard)
