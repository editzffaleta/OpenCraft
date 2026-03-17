---
summary: "Execute o OpenCraft através do LiteLLM Proxy para acesso unificado a modelos e rastreamento de custos"
read_when:
  - Você quer rotear o OpenCraft através de um proxy LiteLLM
  - Você precisa de rastreamento de custos, logging ou roteamento de modelos através do LiteLLM
---

# LiteLLM

O [LiteLLM](https://litellm.ai) é um gateway de LLM open-source que fornece uma API unificada para mais de 100 providers de modelo. Roteie o OpenCraft através do LiteLLM para obter rastreamento centralizado de custos, logging e a flexibilidade de trocar backends sem alterar a configuração do OpenCraft.

## Por que usar o LiteLLM com o OpenCraft?

- **Rastreamento de custos** -- Veja exatamente quanto o OpenCraft gasta em todos os modelos
- **Roteamento de modelos** -- Troque entre Claude, GPT-4, Gemini, Bedrock sem alterações de configuração
- **Chaves virtuais** -- Crie chaves com limites de gasto para o OpenCraft
- **Logging** -- Logs completos de requisição/resposta para depuração
- **Fallbacks** -- Failover automático se seu provider primário estiver fora do ar

## Início rápido

### Via onboarding

```bash
opencraft onboard --auth-choice litellm-api-key
```

### Configuração manual

1. Inicie o LiteLLM Proxy:

```bash
pip install 'litellm[proxy]'
litellm --model claude-opus-4-6
```

2. Aponte o OpenCraft para o LiteLLM:

```bash
export LITELLM_API_KEY="your-litellm-key"

opencraft
```

Pronto. O OpenCraft agora roteia através do LiteLLM.

## Configuração

### Variáveis de ambiente

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Arquivo de configuração

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Chaves virtuais

Crie uma chave dedicada para o OpenCraft com limites de gasto:

```bash
curl -X POST "http://localhost:4000/key/generate" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "opencraft",
    "max_budget": 50.00,
    "budget_duration": "monthly"
  }'
```

Use a chave gerada como `LITELLM_API_KEY`.

## Roteamento de modelos

O LiteLLM pode rotear requisições de modelo para diferentes backends. Configure no seu `config.yaml` do LiteLLM:

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: claude-opus-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

O OpenCraft continua solicitando `claude-opus-4-6` -- o LiteLLM cuida do roteamento.

## Visualizando o uso

Verifique o painel ou a API do LiteLLM:

```bash
# Informações da chave
curl "http://localhost:4000/key/info" \
  -H "Authorization: Bearer sk-litellm-key"

# Logs de gasto
curl "http://localhost:4000/spend/logs" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

## Notas

- O LiteLLM roda em `http://localhost:4000` por padrão
- O OpenCraft se conecta via o endpoint compatível com OpenAI `/v1/chat/completions`
- Todos os recursos do OpenCraft funcionam através do LiteLLM -- sem limitações

## Veja também

- [Documentação do LiteLLM](https://docs.litellm.ai)
- [Providers de Modelo](/concepts/model-providers)
