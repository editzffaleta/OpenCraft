---
summary: "Usar modelos Venice AI com foco em privacidade no OpenCraft"
read_when:
  - Você quer inferência focada em privacidade no OpenCraft
  - Você quer orientação de configuração do Venice AI
title: "Venice AI"
---

# Venice AI (destaque Venice)

**Venice** é nossa configuração de destaque do Venice para inferência com foco em privacidade e acesso anonimizado opcional a modelos proprietários.

O Venice AI fornece inferência de IA focada em privacidade com suporte a modelos sem censura e acesso aos principais modelos proprietários via proxy anonimizado. Toda inferência é privada por padrão — sem treinamento com seus dados, sem logging.

## Por que usar Venice no OpenCraft

- **Inferência privada** para modelos open-source (sem logging).
- **Modelos sem censura** quando necessário.
- **Acesso anonimizado** a modelos proprietários (Opus/GPT/Gemini) quando a qualidade importa.
- Endpoints `/v1` compatíveis com OpenAI.

## Modos de Privacidade

O Venice oferece dois níveis de privacidade — entender isso é fundamental para escolher seu modelo:

| Modo           | Descrição                                                                                                                              | Modelos                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Privado**    | Totalmente privado. Prompts/respostas são **nunca armazenados ou logados**. Efêmero.                                                   | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, etc. |
| **Anonimizado** | Roteado pelo Venice com metadados removidos. O provedor subjacente (OpenAI, Anthropic, Google, xAI) vê requisições anonimizadas. | Claude, GPT, Gemini, Grok                                     |

## Recursos

- **Focado em privacidade**: Escolha entre modos "privado" (totalmente privado) e "anonimizado" (via proxy)
- **Modelos sem censura**: Acesso a modelos sem restrições de conteúdo
- **Acesso a grandes modelos**: Use Claude, GPT, Gemini e Grok via proxy anonimizado do Venice
- **API compatível com OpenAI**: Endpoints padrão `/v1` para fácil integração
- **Streaming**: Suportado em todos os modelos
- **Chamadas de função**: Suportado em modelos selecionados (verifique as capacidades do modelo)
- **Visão**: Suportado em modelos com capacidade de visão
- **Sem limites de taxa rígidos**: Throttling de uso razoável pode ser aplicado para uso extremo

## Configuração

### 1. Obter Chave de API

1. Crie uma conta em [venice.ai](https://venice.ai)
2. Vá em **Settings → API Keys → Create new key**
3. Copie sua chave de API (formato: `vapi_xxxxxxxxxxxx`)

### 2. Configurar o OpenCraft

**Opção A: Variável de Ambiente**

```bash
export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
```

**Opção B: Configuração Interativa (Recomendado)**

```bash
opencraft onboard --auth-choice venice-api-key
```

Isso irá:

1. Solicitar sua chave de API (ou usar `VENICE_API_KEY` existente)
2. Mostrar todos os modelos Venice disponíveis
3. Deixar você escolher seu modelo padrão
4. Configurar o provedor automaticamente

**Opção C: Não-interativo**

```bash
opencraft onboard --non-interactive \
  --auth-choice venice-api-key \
  --venice-api-key "vapi_xxxxxxxxxxxx"
```

### 3. Verificar Configuração

```bash
opencraft agent --model venice/kimi-k2-5 --message "Olá, você está funcionando?"
```

## Seleção de Modelo

Após a configuração, o OpenCraft mostra todos os modelos Venice disponíveis. Escolha de acordo com sua necessidade:

- **Modelo padrão**: `venice/kimi-k2-5` para raciocínio privado forte com visão.
- **Opção de alta capacidade**: `venice/claude-opus-4-6` para o caminho Venice anonimizado mais forte.
- **Privacidade**: Escolha modelos "privados" para inferência totalmente privada.
- **Capacidade**: Escolha modelos "anonimizados" para acessar Claude, GPT, Gemini via proxy do Venice.

Mude seu modelo padrão a qualquer momento:

```bash
opencraft models set venice/kimi-k2-5
opencraft models set venice/claude-opus-4-6
```

Liste todos os modelos disponíveis:

```bash
opencraft models list | grep venice
```

## Configurar via `opencraft configure`

1. Execute `opencraft configure`
2. Selecione **Model/auth**
3. Escolha **Venice AI**

## Qual Modelo Devo Usar?

| Caso de Uso                      | Modelo Recomendado               | Por quê                                               |
| -------------------------------- | -------------------------------- | ----------------------------------------------------- |
| **Chat geral (padrão)**          | `kimi-k2-5`                      | Raciocínio privado forte com visão                    |
| **Melhor qualidade geral**       | `claude-opus-4-6`                | Opção Venice anonimizada mais forte                   |
| **Privacidade + código**         | `qwen3-coder-480b-a35b-instruct` | Modelo de código privado com contexto grande          |
| **Visão privada**                | `kimi-k2-5`                      | Suporte a visão sem sair do modo privado              |
| **Rápido + barato**              | `qwen3-4b`                       | Modelo de raciocínio leve                             |
| **Tarefas privadas complexas**   | `deepseek-v3.2`                  | Raciocínio forte, mas sem suporte a tools do Venice   |
| **Sem censura**                  | `venice-uncensored`              | Sem restrições de conteúdo                            |

## Modelos Disponíveis (41 no total)

### Modelos Privados (26) — Totalmente Privados, Sem Logging

| ID do Modelo                           | Nome                                | Contexto | Recursos                   |
| -------------------------------------- | ----------------------------------- | -------- | -------------------------- |
| `kimi-k2-5`                            | Kimi K2.5                           | 256k     | Padrão, raciocínio, visão  |
| `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k     | Raciocínio                 |
| `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k     | Geral                      |
| `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k     | Geral                      |
| `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k     | Geral, tools desabilitadas |
| `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k     | Raciocínio                 |
| `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k     | Geral                      |
| `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k     | Código                     |
| `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k     | Código                     |
| `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k     | Raciocínio, visão          |
| `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k     | Geral                      |
| `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Visão)               | 256k     | Visão                      |
| `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k      | Rápido, raciocínio         |
| `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k     | Raciocínio, tools desab.   |
| `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k      | Sem censura, tools desab.  |
| `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k     | Visão                      |
| `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k     | Visão                      |
| `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k     | Geral                      |
| `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k     | Geral                      |
| `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k     | Raciocínio                 |
| `zai-org-glm-4.6`                      | GLM 4.6                             | 198k     | Geral                      |
| `zai-org-glm-4.7`                      | GLM 4.7                             | 198k     | Raciocínio                 |
| `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k     | Raciocínio                 |
| `zai-org-glm-5`                        | GLM 5                               | 198k     | Raciocínio                 |
| `minimax-m21`                          | MiniMax M2.1                        | 198k     | Raciocínio                 |
| `minimax-m25`                          | MiniMax M2.5                        | 198k     | Raciocínio                 |

### Modelos Anonimizados (15) — Via Proxy Venice

| ID do Modelo                    | Nome                              | Contexto | Recursos                     |
| ------------------------------- | --------------------------------- | -------- | ---------------------------- |
| `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)      | 1M       | Raciocínio, visão            |
| `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)      | 198k     | Raciocínio, visão            |
| `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice)    | 1M       | Raciocínio, visão            |
| `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice)    | 198k     | Raciocínio, visão            |
| `openai-gpt-54`                 | GPT-5.4 (via Venice)              | 1M       | Raciocínio, visão            |
| `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)        | 400k     | Raciocínio, visão, código    |
| `openai-gpt-52`                 | GPT-5.2 (via Venice)              | 256k     | Raciocínio                   |
| `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)        | 256k     | Raciocínio, visão, código    |
| `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)               | 128k     | Visão                        |
| `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)          | 128k     | Visão                        |
| `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)       | 1M       | Raciocínio, visão            |
| `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)         | 198k     | Raciocínio, visão            |
| `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)       | 256k     | Raciocínio, visão            |
| `grok-41-fast`                  | Grok 4.1 Fast (via Venice)        | 1M       | Raciocínio, visão            |
| `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)     | 256k     | Raciocínio, código           |

## Descoberta de Modelos

O OpenCraft descobre modelos automaticamente da API Venice quando `VENICE_API_KEY` está definida. Se a API estiver inacessível, usa um catálogo estático como fallback.

O endpoint `/models` é público (sem auth necessária para listagem), mas inferência requer uma chave de API válida.

## Suporte a Streaming e Tools

| Recurso              | Suporte                                                     |
| -------------------- | ----------------------------------------------------------- |
| **Streaming**        | Todos os modelos                                            |
| **Chamadas de função** | Maioria dos modelos (verifique `supportsFunctionCalling` na API) |
| **Visão/Imagens**    | Modelos marcados com o recurso "Vision"                     |
| **Modo JSON**        | Suportado via `response_format`                             |

## Preços

O Venice usa um sistema de créditos. Verifique [venice.ai/pricing](https://venice.ai/pricing) para taxas atuais:

- **Modelos privados**: Geralmente menor custo
- **Modelos anonimizados**: Similar ao preço direto da API + pequena taxa Venice

## Comparação: Venice vs API Direta

| Aspecto       | Venice (Anonimizado)           | API Direta          |
| ------------- | ------------------------------ | ------------------- |
| **Privacidade** | Metadados removidos, anonimizado | Sua conta vinculada |
| **Latência**  | +10-50ms (proxy)               | Direto              |
| **Recursos**  | Maioria dos recursos suportados | Recursos completos  |
| **Cobrança**  | Créditos Venice                | Cobrança do provedor |

## Exemplos de Uso

```bash
# Usar o modelo privado padrão
opencraft agent --model venice/kimi-k2-5 --message "Verificação rápida de saúde"

# Usar Claude Opus via Venice (anonimizado)
opencraft agent --model venice/claude-opus-4-6 --message "Resuma esta tarefa"

# Usar modelo sem censura
opencraft agent --model venice/venice-uncensored --message "Esboce opções"

# Usar modelo de visão com imagem
opencraft agent --model venice/qwen3-vl-235b-a22b --message "Revise a imagem anexada"

# Usar modelo de código
opencraft agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refatore esta função"
```

## Troubleshooting

### Chave de API não reconhecida

```bash
echo $VENICE_API_KEY
opencraft models list | grep venice
```

Certifique-se de que a chave começa com `vapi_`.

### Modelo não disponível

O catálogo de modelos Venice é atualizado dinamicamente. Execute `opencraft models list` para ver os modelos atualmente disponíveis. Alguns modelos podem estar temporariamente offline.

### Problemas de conexão

A API Venice está em `https://api.venice.ai/api/v1`. Certifique-se de que sua rede permite conexões HTTPS.

## Exemplo de arquivo de config

```json5
{
  env: { VENICE_API_KEY: "vapi_..." },
  agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
  models: {
    mode: "merge",
    providers: {
      venice: {
        baseUrl: "https://api.venice.ai/api/v1",
        apiKey: "${VENICE_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2-5",
            name: "Kimi K2.5",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Links

- [Venice AI](https://venice.ai)
- [Documentação da API](https://docs.venice.ai)
- [Preços](https://venice.ai/pricing)
- [Status](https://status.venice.ai)
