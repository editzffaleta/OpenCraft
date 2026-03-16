---
summary: "Visão geral de provedores de modelo com exemplos de config + fluxos CLI"
read_when:
  - Você precisa de uma referência de configuração de modelo por provedor
  - Você quer exemplos de config ou comandos de onboarding CLI para provedores de modelo
title: "Provedores de Modelo"
---

# Provedores de modelo

Esta página cobre **provedores de LLM/modelo** (não canais de chat como WhatsApp/Telegram).
Para regras de seleção de modelo, veja [/concepts/models](/concepts/models).

## Regras rápidas

- Refs de modelo usam `provider/model` (exemplo: `opencode/claude-opus-4-6`).
- Se você definir `agents.defaults.models`, ele se torna a allowlist.
- Helpers CLI: `opencraft onboard`, `opencraft models list`, `opencraft models set <provider/model>`.

## Rotação de chave de API

- Suporta rotação genérica de provedor para provedores selecionados.
- Configure múltiplas chaves via:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override único ao vivo, maior prioridade)
  - `<PROVIDER>_API_KEYS` (lista separada por vírgula ou ponto-e-vírgula)
  - `<PROVIDER>_API_KEY` (chave primária)
  - `<PROVIDER>_API_KEY_*` (lista numerada, ex.: `<PROVIDER>_API_KEY_1`)
- Para provedores Google, `GOOGLE_API_KEY` também é incluído como fallback.
- A ordem de seleção de chave preserva prioridade e remove duplicatas.
- Requisições são refeitas com a próxima chave apenas em respostas de rate-limit (por exemplo `429`, `rate_limit`, `quota`, `resource exhausted`).
- Falhas não relacionadas a rate-limit falham imediatamente; nenhuma rotação de chave é tentada.
- Quando todas as chaves candidatas falharem, o erro final é retornado da última tentativa.

## Provedores embutidos (catálogo pi-ai)

O OpenCraft vem com o catálogo pi-ai. Esses provedores **não** requerem
config `models.providers`; basta definir auth + escolher um modelo.

### OpenAI

- Provedor: `openai`
- Auth: `OPENAI_API_KEY`
- Rotação opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, mais `OPENCLAW_LIVE_OPENAI_KEY` (override único)
- Modelos exemplo: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `opencraft onboard --auth-choice openai-api-key`
- Transport padrão é `auto` (WebSocket primeiro, fallback SSE)
- Override por modelo via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, ou `"auto"`)
- Warm-up WebSocket do OpenAI Responses padrão habilitado via `params.openaiWsWarmup` (`true`/`false`)
- Processamento prioritário do OpenAI pode ser habilitado via `agents.defaults.models["openai/<model>"].params.serviceTier`
- Modo rápido do OpenAI pode ser habilitado por modelo via `agents.defaults.models["<provider>/<model>"].params.fastMode`
- `openai/gpt-5.3-codex-spark` é intencionalmente suprimido no OpenCraft porque a API OpenAI ao vivo o rejeita; Spark é tratado como somente Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provedor: `anthropic`
- Auth: `ANTHROPIC_API_KEY` ou `claude setup-token`
- Rotação opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, mais `OPENCLAW_LIVE_ANTHROPIC_KEY` (override único)
- Modelo exemplo: `anthropic/claude-opus-4-6`
- CLI: `opencraft onboard --auth-choice token` (cole setup-token) ou `opencraft models auth paste-token --provider anthropic`
- Modelos de API direta suportam o toggle `/fast` compartilhado e `params.fastMode`; o OpenCraft mapeia isso para o Anthropic `service_tier` (`auto` vs `standard_only`)
- Nota de política: o suporte ao setup-token é compatibilidade técnica; a Anthropic bloqueou alguns usos de assinatura fora do Claude Code no passado. Verifique os termos atuais da Anthropic e decida com base em sua tolerância a risco.
- Recomendação: auth por chave de API da Anthropic é o caminho mais seguro e recomendado em vez do auth por setup-token de assinatura.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Provedor: `openai-codex`
- Auth: OAuth (ChatGPT)
- Modelo exemplo: `openai-codex/gpt-5.4`
- CLI: `opencraft onboard --auth-choice openai-codex` ou `opencraft models auth login --provider openai-codex`
- Transport padrão é `auto` (WebSocket primeiro, fallback SSE)
- Override por modelo via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, ou `"auto"`)
- Compartilha o mesmo toggle `/fast` e config `params.fastMode` que `openai/*` direto
- `openai-codex/gpt-5.3-codex-spark` permanece disponível quando o catálogo OAuth do Codex o expõe; dependente de titularidade
- Nota de política: OpenAI Codex OAuth é explicitamente suportado para ferramentas/fluxos externos como o OpenCraft.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

### OpenCode

- Auth: `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
- Provedor de runtime Zen: `opencode`
- Provedor de runtime Go: `opencode-go`
- Modelos exemplo: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `opencraft onboard --auth-choice opencode-zen` ou `opencraft onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (chave de API)

- Provedor: `google`
- Auth: `GEMINI_API_KEY`
- Rotação opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (override único)
- Modelos exemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidade: config legada do OpenCraft usando `google/gemini-3.1-flash-preview` é normalizada para `google/gemini-3-flash-preview`
- CLI: `opencraft onboard --auth-choice gemini-api-key`

### Google Vertex, Antigravity e Gemini CLI

- Provedores: `google-vertex`, `google-antigravity`, `google-gemini-cli`
- Auth: Vertex usa gcloud ADC; Antigravity/Gemini CLI usam seus respectivos fluxos de auth
- Cuidado: Antigravity e Gemini CLI OAuth no OpenCraft são integrações não-oficiais. Alguns usuários relataram restrições de conta Google após usar clientes de terceiros. Revise os termos do Google e use uma conta não-crítica se optar por prosseguir.
- Antigravity OAuth é fornecido como um plugin embutido (`google-antigravity-auth`, desabilitado por padrão).
  - Habilitar: `opencraft plugins enable google-antigravity-auth`
  - Login: `opencraft models auth login --provider google-antigravity --set-default`
- Gemini CLI OAuth é fornecido como um plugin embutido (`google-gemini-cli-auth`, desabilitado por padrão).
  - Habilitar: `opencraft plugins enable google-gemini-cli-auth`
  - Login: `opencraft models auth login --provider google-gemini-cli --set-default`
  - Nota: você **não** cola um client id ou secret no `opencraft.json`. O fluxo de login CLI armazena
    tokens em perfis de auth no host do gateway.

### Z.AI (GLM)

- Provedor: `zai`
- Auth: `ZAI_API_KEY`
- Modelo exemplo: `zai/glm-5`
- CLI: `opencraft onboard --auth-choice zai-api-key`
  - Aliases: `z.ai/*` e `z-ai/*` normalizam para `zai/*`

### Vercel AI Gateway

- Provedor: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Modelo exemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `opencraft onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provedor: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Modelo exemplo: `kilocode/anthropic/claude-opus-4.6`
- CLI: `opencraft onboard --kilocode-api-key <key>`
- URL base: `https://api.kilo.ai/api/gateway/`
- Catálogo embutido expandido inclui GLM-5 Free, MiniMax M2.5 Free, GPT-5.2, Gemini 3 Pro Preview, Gemini 3 Flash Preview, Grok Code Fast 1 e Kimi K2.5.

Veja [/providers/kilocode](/providers/kilocode) para detalhes de configuração.

### Outros provedores embutidos

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Modelo exemplo: `openrouter/anthropic/claude-sonnet-4-5`
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Modelo exemplo: `kilocode/anthropic/claude-opus-4.6`
- xAI: `xai` (`XAI_API_KEY`)
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Modelo exemplo: `mistral/mistral-large-latest`
- CLI: `opencraft onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Modelos GLM no Cerebras usam ids `zai-glm-4.7` e `zai-glm-4.6`.
  - URL base compatível com OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`) — roteador compatível com OpenAI; modelo exemplo: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `opencraft onboard --auth-choice huggingface-api-key`. Veja [Hugging Face (Inference)](/providers/huggingface).

## Provedores via `models.providers` (custom/base URL)

Use `models.providers` (ou `models.json`) para adicionar provedores **customizados** ou
proxies compatíveis com OpenAI/Anthropic.

### Moonshot AI (Kimi)

Moonshot usa endpoints compatíveis com OpenAI, então configure-o como um provedor customizado:

- Provedor: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Modelo exemplo: `moonshot/kimi-k2.5`

IDs de modelo Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-0905-preview`
- `moonshot/kimi-k2-turbo-preview`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding usa o endpoint compatível com Anthropic do Moonshot AI:

- Provedor: `kimi-coding`
- Auth: `KIMI_API_KEY`
- Modelo exemplo: `kimi-coding/k2p5`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi-coding/k2p5" } },
  },
}
```

### Qwen OAuth (tier gratuito)

Qwen fornece acesso OAuth ao Qwen Coder + Vision via um fluxo de device-code.
Habilite o plugin embutido, depois faça login:

```bash
opencraft plugins enable qwen-portal-auth
opencraft models auth login --provider qwen-portal --set-default
```

Refs de modelo:

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

Veja [/providers/qwen](/providers/qwen) para detalhes de configuração e notas.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) fornece acesso ao Doubao e outros modelos na China.

- Provedor: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Modelo exemplo: `volcengine/doubao-seed-1-8-251228`
- CLI: `opencraft onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine/doubao-seed-1-8-251228" } },
  },
}
```

Modelos disponíveis:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modelos de coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (Internacional)

BytePlus ARK fornece acesso aos mesmos modelos que o Volcano Engine para usuários internacionais.

- Provedor: `byteplus` (coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- Modelo exemplo: `byteplus/seed-1-8-251228`
- CLI: `opencraft onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus/seed-1-8-251228" } },
  },
}
```

Modelos disponíveis:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modelos de coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic fornece modelos compatíveis com Anthropic por trás do provedor `synthetic`:

- Provedor: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- Modelo exemplo: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `opencraft onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax é configurado via `models.providers` porque usa endpoints customizados:

- MiniMax (compatível com Anthropic): `--auth-choice minimax-api`
- Auth: `MINIMAX_API_KEY`

Veja [/providers/minimax](/providers/minimax) para detalhes de configuração, opções de modelo e snippets de config.

### Ollama

Ollama vem como um plugin de provedor embutido e usa a API nativa do Ollama:

- Provedor: `ollama`
- Auth: Nenhum necessário (servidor local)
- Modelo exemplo: `ollama/llama3.3`
- Instalação: [https://ollama.com/download](https://ollama.com/download)

```bash
# Instale o Ollama, depois baixe um modelo:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama é detectado localmente em `http://127.0.0.1:11434` quando você opta com
`OLLAMA_API_KEY`, e o plugin de provedor embutido adiciona Ollama diretamente ao
`opencraft onboard` e ao seletor de modelos. Veja [/providers/ollama](/providers/ollama)
para onboarding, modo cloud/local e configuração customizada.

### vLLM

vLLM vem como um plugin de provedor embutido para servidores OpenAI-compatíveis
locais/auto-hospedados:

- Provedor: `vllm`
- Auth: Opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:8000/v1`

Para optar pela auto-descoberta local (qualquer valor funciona se o seu servidor não impõe auth):

```bash
export VLLM_API_KEY="vllm-local"
```

Depois defina um modelo (substitua por um dos IDs retornados por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Veja [/providers/vllm](/providers/vllm) para detalhes.

### SGLang

SGLang vem como um plugin de provedor embutido para servidores OpenAI-compatíveis
auto-hospedados rápidos:

- Provedor: `sglang`
- Auth: Opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:30000/v1`

Para optar pela auto-descoberta local (qualquer valor funciona se o seu servidor não
impõe auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

Depois defina um modelo (substitua por um dos IDs retornados por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Veja [/providers/sglang](/providers/sglang) para detalhes.

### Proxies locais (LM Studio, vLLM, LiteLLM, etc.)

Exemplo (compatível com OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.5-gs32" },
      models: { "lmstudio/minimax-m2.5-gs32": { alias: "Minimax" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "LMSTUDIO_KEY",
        api: "openai-completions",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Notas:

- Para provedores customizados, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` são opcionais.
  Quando omitidos, o OpenCraft usa como padrão:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recomendado: defina valores explícitos que correspondam aos limites do seu proxy/modelo.
- Para `api: "openai-completions"` em endpoints não-nativos (qualquer `baseUrl` não-vazio cujo host não seja `api.openai.com`), o OpenCraft força `compat.supportsDeveloperRole: false` para evitar erros 400 do provedor para roles `developer` não suportados.
- Se `baseUrl` estiver vazio/omitido, o OpenCraft mantém o comportamento padrão do OpenAI (que resolve para `api.openai.com`).
- Por segurança, um `compat.supportsDeveloperRole: true` explícito ainda é sobrescrito em endpoints `openai-completions` não-nativos.

## Exemplos CLI

```bash
opencraft onboard --auth-choice opencode-zen
opencraft models set opencode/claude-opus-4-6
opencraft models list
```

Veja também: [/gateway/configuration](/gateway/configuration) para exemplos completos de configuração.
