---
summary: "Visao geral de provedores de modelo com exemplos de configuracao + fluxos CLI"
read_when:
  - Voce precisa de uma referencia de configuracao provedor por provedor
  - Voce quer exemplos de configuracao ou comandos CLI de onboarding para provedores de modelo
title: "Model Providers"
---

# Provedores de modelo

Esta pagina cobre **provedores de LLM/modelo** (nao canais de chat como WhatsApp/Telegram).
Para regras de selecao de modelo, veja [/concepts/models](/concepts/models).

## Regras rapidas

- Refs de modelo usam `provider/model` (exemplo: `opencode/claude-opus-4-6`).
- Se voce definir `agents.defaults.models`, ele se torna a lista de permissoes.
- Auxiliares CLI: `opencraft onboard`, `opencraft models list`, `opencraft models set <provider/model>`.
- Plugin de provedores podem injetar catalogos de modelo via `registerProvider({ catalog })`;
  o OpenCraft mescla essa saida em `models.providers` antes de gravar
  `models.json`.
- Manifestos de provedores podem declarar `providerAuthEnvVars` para que
  sondas de autenticacao genericas baseadas em env nao precisem carregar o runtime do Plugin. O mapa de
  variaveis de ambiente do nucleo restante e apenas para provedores nao-plugin/nucleo e alguns casos de
  precedencia generica como onboarding de chave de API Anthropic primeiro.
- Plugin de provedores tambem podem possuir comportamento de runtime do provedor via
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `capabilities`, `prepareExtraParams`, `wrapStreamFn`, `formatApiKey`,
  `refreshOAuth`, `buildAuthDoctorHint`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`,
  `suppressBuiltInModel`, `augmentModelCatalog`, `isBinaryThinking`,
  `supportsXHighThinking`, `resolveDefaultThinkingLevel`,
  `isModernModelRef`, `prepareRuntimeAuth`, `resolveUsageAuth` e
  `fetchUsageSnapshot`.

## Comportamento do provedor gerenciado por Plugin

Plugin de provedores agora podem possuir a maior parte da logica especifica do provedor enquanto o OpenCraft mantem
o loop de inferencia generico.

Divisao tipica:

- `auth[].run` / `auth[].runNonInteractive`: o provedor possui fluxos de onboarding/login
  para `opencraft onboard`, `opencraft models auth` e configuracao headless
- `wizard.setup` / `wizard.modelPicker`: o provedor possui rotulos de escolha de autenticacao,
  aliases legados, dicas de lista de permissoes de onboarding e entradas de configuracao em onboarding/seletores de modelo
- `catalog`: o provedor aparece em `models.providers`
- `resolveDynamicModel`: o provedor aceita IDs de modelo nao presentes no
  catalogo estatico local ainda
- `prepareDynamicModel`: o provedor precisa de uma atualizacao de metadados antes de tentar novamente
  a resolucao dinamica
- `normalizeResolvedModel`: o provedor precisa de reescritas de transporte ou URL base
- `capabilities`: o provedor publica peculiaridades de transcricao/ferramentas/familia de provedor
- `prepareExtraParams`: o provedor define ou normaliza parametros de requisicao por modelo
- `wrapStreamFn`: o provedor aplica wrappers de cabecalhos/corpo/compatibilidade de modelo na requisicao
- `formatApiKey`: o provedor formata perfis de autenticacao armazenados na string
  `apiKey` de runtime esperada pelo transporte
- `refreshOAuth`: o provedor possui a renovacao OAuth quando os
  renovadores compartilhados `pi-ai` nao sao suficientes
- `buildAuthDoctorHint`: o provedor adiciona orientacao de reparo quando a renovacao OAuth
  falha
- `isCacheTtlEligible`: o provedor decide quais IDs de modelo upstream suportam TTL de cache de prompt
- `buildMissingAuthMessage`: o provedor substitui o erro generico do armazenamento de autenticacao
  por uma dica de recuperacao especifica do provedor
- `suppressBuiltInModel`: o provedor oculta linhas upstream obsoletas e pode retornar um
  erro do proprio fornecedor para falhas de resolucao direta
- `augmentModelCatalog`: o provedor adiciona linhas de catalogo sinteticas/finais apos
  descoberta e mesclagem de configuracao
- `isBinaryThinking`: o provedor possui UX de pensamento binario liga/desliga
- `supportsXHighThinking`: o provedor opta modelos selecionados para `xhigh`
- `resolveDefaultThinkingLevel`: o provedor possui a politica padrao de `/think` para uma
  familia de modelo
- `isModernModelRef`: o provedor possui correspondencia de modelo preferido em testes live/smoke
- `prepareRuntimeAuth`: o provedor transforma uma credencial configurada em um Token de runtime
  de curta duracao
- `resolveUsageAuth`: o provedor resolve credenciais de uso/cota para `/usage`
  e superficies relacionadas de status/relatorio
- `fetchUsageSnapshot`: o provedor possui a busca/analise do endpoint de uso enquanto
  o nucleo ainda possui o shell de resumo e formatacao

Exemplos empacotados atuais:

- `anthropic`: fallback de compatibilidade futura do Claude 4.6, dicas de reparo de autenticacao, busca de
  endpoint de uso e metadados de cache-TTL/familia de provedor
- `openrouter`: IDs de modelo pass-through, wrappers de requisicao, dicas de capacidade
  do provedor e politica de cache-TTL
- `github-copilot`: onboarding/login de dispositivo, fallback de compatibilidade futura de modelo,
  dicas de transcricao de pensamento Claude, troca de Token de runtime e busca de endpoint
  de uso
- `openai`: fallback de compatibilidade futura do GPT-5.4, normalizacao de transporte
  direto OpenAI, dicas de autenticacao ausente com suporte a Codex, supressao Spark, linhas de
  catalogo sinteticas OpenAI/Codex, politica de pensamento/modelo live e
  metadados de familia de provedor
- `google` e `google-gemini-cli`: fallback de compatibilidade futura do Gemini 3.1 e
  correspondencia de modelo moderno; OAuth do Gemini CLI tambem possui formatacao de Token de
  perfil de autenticacao, analise de Token de uso e busca de endpoint de cota para superficies
  de uso
- `moonshot`: transporte compartilhado, normalizacao de payload de pensamento gerenciada pelo Plugin
- `kilocode`: transporte compartilhado, cabecalhos de requisicao gerenciados pelo Plugin, normalizacao de payload de raciocinio,
  dicas de transcricao Gemini e politica de cache-TTL
- `zai`: fallback de compatibilidade futura do GLM-5, padroes de `tool_stream`, politica de
  cache-TTL, politica de pensamento binario/modelo live e busca de autenticacao de uso + cota
- `mistral`, `opencode` e `opencode-go`: metadados de capacidade gerenciados pelo Plugin
- `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`,
  `modelstudio`, `nvidia`, `qianfan`, `synthetic`, `together`, `venice`,
  `vercel-ai-gateway` e `volcengine`: apenas catalogos gerenciados pelo Plugin
- `qwen-portal`: catalogo gerenciado pelo Plugin, login OAuth e renovacao OAuth
- `minimax` e `xiaomi`: catalogos gerenciados pelo Plugin mais logica de autenticacao de uso/snapshot

O Plugin empacotado `openai` agora possui ambos os IDs de provedor: `openai` e
`openai-codex`.

Isso cobre provedores que ainda se encaixam nos transportes normais do OpenCraft. Um provedor
que precisa de um executor de requisicao totalmente personalizado e uma superficie de extensao separada e mais profunda.

## Rotacao de chave de API

- Suporta rotacao generica de provedor para provedores selecionados.
- Configure multiplas chaves via:
  - `OPENCRAFT_LIVE_<PROVIDER>_KEY` (substituicao unica ativa, maior prioridade)
  - `<PROVIDER>_API_KEYS` (lista separada por virgula ou ponto e virgula)
  - `<PROVIDER>_API_KEY` (chave primaria)
  - `<PROVIDER>_API_KEY_*` (lista numerada, ex. `<PROVIDER>_API_KEY_1`)
- Para provedores Google, `GOOGLE_API_KEY` tambem e incluido como fallback.
- A ordem de selecao de chaves preserva a prioridade e deduplica valores.
- As requisicoes sao tentadas novamente com a proxima chave apenas em respostas de limite de taxa (por exemplo `429`, `rate_limit`, `quota`, `resource exhausted`).
- Falhas que nao sao de limite de taxa falham imediatamente; nenhuma rotacao de chave e tentada.
- Quando todas as chaves candidatas falham, o erro final e retornado da ultima tentativa.

## Provedores integrados (catalogo pi-ai)

O OpenCraft vem com o catalogo pi-ai. Esses provedores nao requerem **nenhuma**
configuracao de `models.providers`; apenas defina a autenticacao + escolha um modelo.

### OpenAI

- Provedor: `openai`
- Autenticacao: `OPENAI_API_KEY`
- Rotacao opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, mais `OPENCRAFT_LIVE_OPENAI_KEY` (substituicao unica)
- Modelos de exemplo: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `opencraft onboard --auth-choice openai-api-key`
- O transporte padrao e `auto` (WebSocket primeiro, fallback SSE)
- Substitua por modelo via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- O aquecimento WebSocket de Responses da OpenAI e habilitado por padrao via `params.openaiWsWarmup` (`true`/`false`)
- O processamento prioritario da OpenAI pode ser habilitado via `agents.defaults.models["openai/<model>"].params.serviceTier`
- O modo rapido da OpenAI pode ser habilitado por modelo via `agents.defaults.models["<provider>/<model>"].params.fastMode`
- `openai/gpt-5.3-codex-spark` e intencionalmente suprimido no OpenCraft porque a API live da OpenAI o rejeita; Spark e tratado como exclusivo do Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provedor: `anthropic`
- Autenticacao: `ANTHROPIC_API_KEY` ou `claude setup-token`
- Rotacao opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, mais `OPENCRAFT_LIVE_ANTHROPIC_KEY` (substituicao unica)
- Modelo de exemplo: `anthropic/claude-opus-4-6`
- CLI: `opencraft onboard --auth-choice token` (cole o setup-token) ou `opencraft models auth paste-token --provider anthropic`
- Modelos de API direta suportam o toggle compartilhado `/fast` e `params.fastMode`; o OpenCraft mapeia isso para o `service_tier` da Anthropic (`auto` vs `standard_only`)
- Nota de politica: o suporte a setup-token e compatibilidade tecnica; a Anthropic bloqueou alguns usos de assinatura fora do Claude Code no passado. Verifique os termos atuais da Anthropic e decida com base na sua tolerancia a risco.
- Recomendacao: A autenticacao por chave de API da Anthropic e o caminho mais seguro e recomendado em relacao a autenticacao por setup-token de assinatura.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Provedor: `openai-codex`
- Autenticacao: OAuth (ChatGPT)
- Modelo de exemplo: `openai-codex/gpt-5.4`
- CLI: `opencraft onboard --auth-choice openai-codex` ou `opencraft models auth login --provider openai-codex`
- O transporte padrao e `auto` (WebSocket primeiro, fallback SSE)
- Substitua por modelo via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- Compartilha o mesmo toggle `/fast` e configuracao `params.fastMode` que o `openai/*` direto
- `openai-codex/gpt-5.3-codex-spark` permanece disponivel quando o catalogo OAuth do Codex o expoe; depende de direitos
- Nota de politica: O OAuth do OpenAI Codex e explicitamente suportado para ferramentas/fluxos de trabalho externos como o OpenCraft.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

### OpenCode

- Autenticacao: `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
- Provedor de runtime Zen: `opencode`
- Provedor de runtime Go: `opencode-go`
- Modelos de exemplo: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `opencraft onboard --auth-choice opencode-zen` ou `opencraft onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (chave de API)

- Provedor: `google`
- Autenticacao: `GEMINI_API_KEY`
- Rotacao opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCRAFT_LIVE_GEMINI_KEY` (substituicao unica)
- Modelos de exemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidade: configuracao legada do OpenCraft usando `google/gemini-3.1-flash-preview` e normalizada para `google/gemini-3-flash-preview`
- CLI: `opencraft onboard --auth-choice gemini-api-key`

### Google Vertex e Gemini CLI

- Provedores: `google-vertex`, `google-gemini-cli`
- Autenticacao: Vertex usa gcloud ADC; Gemini CLI usa seu fluxo OAuth
- Atencao: O OAuth do Gemini CLI no OpenCraft e uma integracao nao oficial. Alguns usuarios relataram restricoes de conta Google apos usar clientes de terceiros. Revise os termos do Google e use uma conta nao critica se voce decidir prosseguir.
- O OAuth do Gemini CLI e fornecido como parte do Plugin empacotado `google`.
  - Habilite: `opencraft plugins enable google`
  - Login: `opencraft models auth login --provider google-gemini-cli --set-default`
  - Nota: voce **nao** cola um client id ou secret no `opencraft.json`. O fluxo de login CLI armazena
    Token no perfis de autenticacao no host do Gateway.

### Z.AI (GLM)

- Provedor: `zai`
- Autenticacao: `ZAI_API_KEY`
- Modelo de exemplo: `zai/glm-5`
- CLI: `opencraft onboard --auth-choice zai-api-key`
  - Aliases: `z.ai/*` e `z-ai/*` normalizam para `zai/*`

### Vercel AI Gateway

- Provedor: `vercel-ai-gateway`
- Autenticacao: `AI_GATEWAY_API_KEY`
- Modelo de exemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `opencraft onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provedor: `kilocode`
- Autenticacao: `KILOCODE_API_KEY`
- Modelo de exemplo: `kilocode/anthropic/claude-opus-4.6`
- CLI: `opencraft onboard --kilocode-api-key <key>`
- URL base: `https://api.kilo.ai/api/gateway/`
- O catalogo integrado expandido inclui GLM-5 Free, MiniMax M2.5 Free, GPT-5.2, Gemini 3 Pro Preview, Gemini 3 Flash Preview, Grok Code Fast 1 e Kimi K2.5.

Veja [/providers/kilocode](/providers/kilocode) para detalhes de configuracao.

### Outros Plugin de provedor empacotados

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Modelo de exemplo: `openrouter/anthropic/claude-sonnet-4-5`
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Modelo de exemplo: `kilocode/anthropic/claude-opus-4.6`
- MiniMax: `minimax` (`MINIMAX_API_KEY`)
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Kimi Coding: `kimi-coding` (`KIMI_API_KEY` ou `KIMICODE_API_KEY`)
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Model Studio: `modelstudio` (`MODELSTUDIO_API_KEY`)
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Together: `together` (`TOGETHER_API_KEY`)
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- xAI: `xai` (`XAI_API_KEY`)
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Modelo de exemplo: `mistral/mistral-large-latest`
- CLI: `opencraft onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Modelos GLM no Cerebras usam os IDs `zai-glm-4.7` e `zai-glm-4.6`.
  - URL base compativel com OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Modelo de exemplo Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `opencraft onboard --auth-choice huggingface-api-key`. Veja [Hugging Face (Inference)](/providers/huggingface).

## Provedores via `models.providers` (personalizado/URL base)

Use `models.providers` (ou `models.json`) para adicionar provedores **personalizados** ou
proxies compativeis com OpenAI/Anthropic.

Muitos dos Plugin de provedor empacotados abaixo ja publicam um catalogo padrao.
Use entradas explicitas `models.providers.<id>` apenas quando voce quiser substituir a
URL base, cabecalhos ou lista de modelos padrao.

### Moonshot AI (Kimi)

O Moonshot usa endpoints compativeis com OpenAI, entao configure-o como um provedor personalizado:

- Provedor: `moonshot`
- Autenticacao: `MOONSHOT_API_KEY`
- Modelo de exemplo: `moonshot/kimi-k2.5`

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

O Kimi Coding usa o endpoint compativel com Anthropic da Moonshot AI:

- Provedor: `kimi-coding`
- Autenticacao: `KIMI_API_KEY`
- Modelo de exemplo: `kimi-coding/k2p5`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi-coding/k2p5" } },
  },
}
```

### Qwen OAuth (nivel gratuito)

O Qwen fornece acesso OAuth ao Qwen Coder + Vision via um fluxo de codigo de dispositivo.
O Plugin de provedor empacotado e habilitado por padrao, entao basta fazer login:

```bash
opencraft models auth login --provider qwen-portal --set-default
```

Refs de modelo:

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

Veja [/providers/qwen](/providers/qwen) para detalhes de configuracao e notas.

### Volcano Engine (Doubao)

O Volcano Engine (火山引擎) fornece acesso ao Doubao e outros modelos na China.

- Provedor: `volcengine` (codificacao: `volcengine-plan`)
- Autenticacao: `VOLCANO_ENGINE_API_KEY`
- Modelo de exemplo: `volcengine/doubao-seed-1-8-251228`
- CLI: `opencraft onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine/doubao-seed-1-8-251228" } },
  },
}
```

Modelos disponiveis:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modelos de codificacao (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (Internacional)

O BytePlus ARK fornece acesso aos mesmos modelos que o Volcano Engine para usuarios internacionais.

- Provedor: `byteplus` (codificacao: `byteplus-plan`)
- Autenticacao: `BYTEPLUS_API_KEY`
- Modelo de exemplo: `byteplus/seed-1-8-251228`
- CLI: `opencraft onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus/seed-1-8-251228" } },
  },
}
```

Modelos disponiveis:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modelos de codificacao (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

O Synthetic fornece modelos compativeis com Anthropic sob o provedor `synthetic`:

- Provedor: `synthetic`
- Autenticacao: `SYNTHETIC_API_KEY`
- Modelo de exemplo: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

O MiniMax e configurado via `models.providers` porque usa endpoints personalizados:

- MiniMax (compativel com Anthropic): `--auth-choice minimax-api`
- Autenticacao: `MINIMAX_API_KEY`

Veja [/providers/minimax](/providers/minimax) para detalhes de configuracao, opcoes de modelo e trechos de configuracao.

### Ollama

O Ollama vem como um Plugin de provedor empacotado e usa a API nativa do Ollama:

- Provedor: `ollama`
- Autenticacao: Nenhuma necessaria (servidor local)
- Modelo de exemplo: `ollama/llama3.3`
- Instalacao: [https://ollama.com/download](https://ollama.com/download)

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

O Ollama e detectado localmente em `http://127.0.0.1:11434` quando voce opta por usar com
`OLLAMA_API_KEY`, e o Plugin de provedor empacotado adiciona o Ollama diretamente ao
`opencraft onboard` e ao seletor de modelos. Veja [/providers/ollama](/providers/ollama)
para onboarding, modo nuvem/local e configuracao personalizada.

### vLLM

O vLLM vem como um Plugin de provedor empacotado para servidores locais/auto-hospedados compativeis com OpenAI:

- Provedor: `vllm`
- Autenticacao: Opcional (depende do seu servidor)
- URL base padrao: `http://127.0.0.1:8000/v1`

Para optar pela descoberta automatica localmente (qualquer valor funciona se seu servidor nao exigir autenticacao):

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

O SGLang vem como um Plugin de provedor empacotado para servidores rapidos auto-hospedados
compativeis com OpenAI:

- Provedor: `sglang`
- Autenticacao: Opcional (depende do seu servidor)
- URL base padrao: `http://127.0.0.1:30000/v1`

Para optar pela descoberta automatica localmente (qualquer valor funciona se seu servidor nao
exigir autenticacao):

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

Exemplo (compativel com OpenAI):

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

- Para provedores personalizados, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` sao opcionais.
  Quando omitidos, o OpenCraft usa como padrao:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recomendado: defina valores explicitos que correspondam aos limites do seu proxy/modelo.
- Para `api: "openai-completions"` em endpoints nao nativos (qualquer `baseUrl` nao vazio cujo host nao seja `api.openai.com`), o OpenCraft forca `compat.supportsDeveloperRole: false` para evitar erros 400 do provedor para roles `developer` nao suportadas.
- Se `baseUrl` estiver vazio/omitido, o OpenCraft mantem o comportamento padrao da OpenAI (que resolve para `api.openai.com`).
- Por seguranca, um `compat.supportsDeveloperRole: true` explicito ainda e substituido em endpoints `openai-completions` nao nativos.

## Exemplos CLI

```bash
opencraft onboard --auth-choice opencode-zen
opencraft models set opencode/claude-opus-4-6
opencraft models list
```

Veja tambem: [/gateway/configuration](/gateway/configuration) para exemplos completos de configuracao.
