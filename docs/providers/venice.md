---
summary: "Use modelos focados em privacidade do Venice AI no OpenCraft"
read_when:
  - Você quer inferência focada em privacidade no OpenCraft
  - Você precisa de orientação para configurar o Venice AI
title: "Venice AI"
---

# Venice AI (Destaque Venice)

**Venice** é nossa configuração destaque Venice para inferência com privacidade em primeiro lugar, com acesso anonimizado opcional a modelos proprietários.

O Venice AI fornece inferência de IA focada em privacidade com suporte para modelos sem censura e acesso a grandes modelos proprietários através de seu proxy anonimizado. Toda inferência é privada por padrão -- sem treinamento com seus dados, sem registro de logs.

## Por que Venice no OpenCraft

- **Inferência privada** para modelos open-source (sem registro de logs).
- **Modelos sem censura** quando você precisar.
- **Acesso anonimizado** a modelos proprietários (Opus/GPT/Gemini) quando a qualidade importa.
- Endpoints `/v1` compatíveis com OpenAI.

## Modos de privacidade

O Venice oferece dois níveis de privacidade -- entender isso é fundamental para escolher seu modelo:

| Modo            | Descrição                                                                                                                              | Modelos                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Privado**     | Totalmente privado. Prompts/respostas **nunca são armazenados ou registrados**. Efêmero.                                               | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, etc. |
| **Anonimizado** | Roteado através do Venice com metadados removidos. O provider subjacente (OpenAI, Anthropic, Google, xAI) vê requisições anonimizadas. | Claude, GPT, Gemini, Grok                                     |

## Recursos

- **Focado em privacidade**: Escolha entre modos "privado" (totalmente privado) e "anonimizado" (via proxy)
- **Modelos sem censura**: Acesso a modelos sem restrições de conteúdo
- **Acesso a grandes modelos**: Use Claude, GPT, Gemini e Grok via proxy anonimizado do Venice
- **API compatível com OpenAI**: Endpoints `/v1` padrão para fácil integração
- **Streaming**: Suportado em todos os modelos
- **Chamada de funções**: Suportada em modelos selecionados (verifique as capacidades do modelo)
- **Visão**: Suportada em modelos com capacidade de visão
- **Sem limites rígidos de taxa**: Limitação por uso justo pode se aplicar em uso extremo

## Configuração

### 1. Obtenha a API key

1. Registre-se em [venice.ai](https://venice.ai)
2. Vá em **Settings -> API Keys -> Create new key**
3. Copie sua API key (formato: `vapi_xxxxxxxxxxxx`)

### 2. Configure o OpenCraft

**Opção A: Variável de ambiente**

```bash
export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
```

**Opção B: Configuração interativa (recomendada)**

```bash
opencraft onboard --auth-choice venice-api-key
```

Isso irá:

1. Solicitar sua API key (ou usar `VENICE_API_KEY` existente)
2. Mostrar todos os modelos Venice disponíveis
3. Permitir que você escolha seu modelo padrão
4. Configurar o provider automaticamente

**Opção C: Não interativo**

```bash
opencraft onboard --non-interactive \
  --auth-choice venice-api-key \
  --venice-api-key "vapi_xxxxxxxxxxxx"
```

### 3. Verifique a configuração

```bash
opencraft agent --model venice/kimi-k2-5 --message "Olá, você está funcionando?"
```

## Seleção de modelo

Após a configuração, o OpenCraft mostra todos os modelos Venice disponíveis. Escolha com base nas suas necessidades:

- **Modelo padrão**: `venice/kimi-k2-5` para raciocínio privado forte mais visão.
- **Opção de alta capacidade**: `venice/claude-opus-4-6` para o caminho Venice anonimizado mais forte.
- **Privacidade**: Escolha modelos "privados" para inferência totalmente privada.
- **Capacidade**: Escolha modelos "anonimizados" para acessar Claude, GPT, Gemini via proxy do Venice.

Altere seu modelo padrão a qualquer momento:

```bash
opencraft models set venice/kimi-k2-5
opencraft models set venice/claude-opus-4-6
```

Liste todos os modelos disponíveis:

```bash
opencraft models list | grep venice
```

## Configure via `opencraft configure`

1. Execute `opencraft configure`
2. Selecione **Model/auth**
3. Escolha **Venice AI**

## Qual modelo devo usar?

| Caso de uso                    | Modelo recomendado               | Por quê                                                |
| ------------------------------ | -------------------------------- | ------------------------------------------------------ |
| **Chat geral (padrão)**        | `kimi-k2-5`                      | Raciocínio privado forte mais visão                    |
| **Melhor qualidade geral**     | `claude-opus-4-6`                | Opção Venice anonimizada mais forte                    |
| **Privacidade + codificação**  | `qwen3-coder-480b-a35b-instruct` | Modelo de codificação privado com contexto grande      |
| **Visão privada**              | `kimi-k2-5`                      | Suporte a visão sem sair do modo privado               |
| **Rápido + barato**            | `qwen3-4b`                       | Modelo de raciocínio leve                              |
| **Tarefas privadas complexas** | `deepseek-v3.2`                  | Raciocínio forte, mas sem suporte a ferramentas Venice |
| **Sem censura**                | `venice-uncensored`              | Sem restrições de conteúdo                             |

## Modelos disponíveis (41 no total)

### Modelos privados (26) -- Totalmente privados, sem registro de logs

| ID do modelo                           | Nome                                | Contexto | Recursos                         |
| -------------------------------------- | ----------------------------------- | -------- | -------------------------------- |
| `kimi-k2-5`                            | Kimi K2.5                           | 256k     | Padrão, raciocínio, visão        |
| `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k     | Raciocínio                       |
| `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k     | Geral                            |
| `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k     | Geral                            |
| `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k     | Geral, ferramentas desabilitadas |
| `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k     | Raciocínio                       |
| `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k     | Geral                            |
| `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k     | Codificação                      |
| `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k     | Codificação                      |
| `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k     | Raciocínio, visão                |
| `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k     | Geral                            |
| `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Visão)               | 256k     | Visão                            |
| `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k      | Rápido, raciocínio               |
| `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k     | Raciocínio, ferramentas desab.   |
| `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k      | Sem censura, ferramentas desab.  |
| `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k     | Visão                            |
| `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k     | Visão                            |
| `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k     | Geral                            |
| `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k     | Geral                            |
| `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k     | Raciocínio                       |
| `zai-org-glm-4.6`                      | GLM 4.6                             | 198k     | Geral                            |
| `zai-org-glm-4.7`                      | GLM 4.7                             | 198k     | Raciocínio                       |
| `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k     | Raciocínio                       |
| `zai-org-glm-5`                        | GLM 5                               | 198k     | Raciocínio                       |
| `minimax-m21`                          | MiniMax M2.1                        | 198k     | Raciocínio                       |
| `minimax-m25`                          | MiniMax M2.5                        | 198k     | Raciocínio                       |

### Modelos anonimizados (15) -- Via proxy Venice

| ID do modelo                    | Nome                           | Contexto | Recursos                       |
| ------------------------------- | ------------------------------ | -------- | ------------------------------ |
| `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M       | Raciocínio, visão              |
| `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)   | 198k     | Raciocínio, visão              |
| `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M       | Raciocínio, visão              |
| `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice) | 198k     | Raciocínio, visão              |
| `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M       | Raciocínio, visão              |
| `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k     | Raciocínio, visão, codificação |
| `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k     | Raciocínio                     |
| `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k     | Raciocínio, visão, codificação |
| `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k     | Visão                          |
| `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k     | Visão                          |
| `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M       | Raciocínio, visão              |
| `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k     | Raciocínio, visão              |
| `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k     | Raciocínio, visão              |
| `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M       | Raciocínio, visão              |
| `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)  | 256k     | Raciocínio, codificação        |

## Descoberta de modelos

O OpenCraft descobre modelos automaticamente da API do Venice quando `VENICE_API_KEY` está definido. Se a API estiver inacessível, ele recorre a um catálogo estático.

O endpoint `/models` é público (não requer autenticação para listagem), mas a inferência requer uma API key válida.

## Suporte a streaming e ferramentas

| Recurso                | Suporte                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| **Streaming**          | Todos os modelos                                                   |
| **Chamada de funções** | A maioria dos modelos (verifique `supportsFunctionCalling` na API) |
| **Visão/Imagens**      | Modelos marcados com recurso "Visão"                               |
| **Modo JSON**          | Suportado via `response_format`                                    |

## Preços

O Venice usa um sistema baseado em créditos. Consulte [venice.ai/pricing](https://venice.ai/pricing) para as taxas atuais:

- **Modelos privados**: Geralmente custo mais baixo
- **Modelos anonimizados**: Similar ao preço direto da API + pequena taxa do Venice

## Comparação: Venice vs API direta

| Aspecto         | Venice (Anonimizado)              | API direta           |
| --------------- | --------------------------------- | -------------------- |
| **Privacidade** | Metadados removidos, anonimizado  | Sua conta vinculada  |
| **Latência**    | +10-50ms (proxy)                  | Direta               |
| **Recursos**    | A maioria dos recursos suportados | Todos os recursos    |
| **Cobrança**    | Créditos Venice                   | Cobrança do provider |

## Exemplos de uso

```bash
# Use o modelo privado padrão
opencraft agent --model venice/kimi-k2-5 --message "Verificação rápida de saúde"

# Use Claude Opus via Venice (anonimizado)
opencraft agent --model venice/claude-opus-4-6 --message "Resuma esta tarefa"

# Use modelo sem censura
opencraft agent --model venice/venice-uncensored --message "Elabore opções"

# Use modelo de visão com imagem
opencraft agent --model venice/qwen3-vl-235b-a22b --message "Analise a imagem anexada"

# Use modelo de codificação
opencraft agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refatore esta função"
```

## Solução de problemas

### API key não reconhecida

```bash
echo $VENICE_API_KEY
opencraft models list | grep venice
```

Certifique-se de que a chave começa com `vapi_`.

### Modelo não disponível

O catálogo de modelos do Venice é atualizado dinamicamente. Execute `opencraft models list` para ver os modelos disponíveis no momento. Alguns modelos podem estar temporariamente offline.

### Problemas de conexão

A API do Venice está em `https://api.venice.ai/api/v1`. Certifique-se de que sua rede permite conexões HTTPS.

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
