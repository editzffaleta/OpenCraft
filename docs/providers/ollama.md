---
summary: "Rodar o OpenCraft com Ollama (modelos em nuvem e locais)"
read_when:
  - Você quer rodar o OpenCraft com modelos em nuvem ou locais via Ollama
  - Você precisa de orientação de configuração do Ollama
title: "Ollama"
---

# Ollama

O Ollama é um runtime LLM local que facilita rodar modelos open-source na sua máquina. O OpenCraft integra com a API nativa do Ollama (`/api/chat`), suporta streaming e chamadas de tool, e pode auto-descobrir modelos Ollama locais quando você opta com `OLLAMA_API_KEY` (ou um perfil de autenticação) e não define uma entrada explícita `models.providers.ollama`.

<Warning>
**Usuários Ollama remotos**: Não use a URL compatível com OpenAI `/v1` (`http://host:11434/v1`) com o OpenCraft. Isso quebra chamadas de tool e os modelos podem retornar JSON bruto de tool como texto simples. Use a URL da API nativa do Ollama: `baseUrl: "http://host:11434"` (sem `/v1`).
</Warning>

## Início rápido

### Wizard de onboarding (recomendado)

A forma mais rápida de configurar o Ollama é pelo wizard de onboarding:

```bash
opencraft onboard
```

Selecione **Ollama** na lista de provedores. O wizard irá:

1. Pedir a URL base do Ollama onde sua instância pode ser acessada (padrão `http://127.0.0.1:11434`).
2. Deixar você escolher **Cloud + Local** (modelos em nuvem e locais) ou **Local** (somente modelos locais).
3. Abrir um fluxo de login no browser se você escolher **Cloud + Local** e não estiver logado no ollama.com.
4. Descobrir modelos disponíveis e sugerir padrões.
5. Auto-fazer pull do modelo selecionado se não estiver disponível localmente.

Modo não-interativo também é suportado:

```bash
opencraft onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

Opcionalmente especifique uma URL base personalizada ou modelo:

```bash
opencraft onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

### Configuração manual

1. Instale o Ollama: [https://ollama.com/download](https://ollama.com/download)

2. Faça pull de um modelo local se quiser inferência local:

```bash
ollama pull glm-4.7-flash
# ou
ollama pull gpt-oss:20b
# ou
ollama pull llama3.3
```

3. Se quiser modelos em nuvem também, faça login:

```bash
ollama signin
```

4. Rode o onboarding e escolha `Ollama`:

```bash
opencraft onboard
```

- `Local`: somente modelos locais
- `Cloud + Local`: modelos locais mais modelos em nuvem
- Modelos em nuvem como `kimi-k2.5:cloud`, `minimax-m2.5:cloud` e `glm-5:cloud` **não** requerem `ollama pull` local

O OpenCraft atualmente sugere:

- padrão local: `glm-4.7-flash`
- padrões em nuvem: `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`

5. Se preferir configuração manual, habilite o Ollama para o OpenCraft diretamente (qualquer valor funciona; o Ollama não requer uma chave real):

```bash
# Definir variável de ambiente
export OLLAMA_API_KEY="ollama-local"

# Ou configurar no seu arquivo de config
opencraft config set models.providers.ollama.apiKey "ollama-local"
```

6. Inspecionar ou trocar modelos:

```bash
opencraft models list
opencraft models set ollama/glm-4.7-flash
```

7. Ou defina o padrão na config:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/glm-4.7-flash" },
    },
  },
}
```

## Descoberta de modelos (provedor implícito)

Quando você define `OLLAMA_API_KEY` (ou um perfil de autenticação) e **não** define `models.providers.ollama`, o OpenCraft descobre modelos da instância Ollama local em `http://127.0.0.1:11434`:

- Consulta `/api/tags`
- Usa lookups `/api/show` best-effort para ler `contextWindow` quando disponível
- Marca `reasoning` com uma heurística de nome de modelo (`r1`, `reasoning`, `think`)
- Define `maxTokens` para o cap padrão de max-token do Ollama usado pelo OpenCraft
- Define todos os custos para `0`

Isso evita entradas manuais de modelo enquanto mantém o catálogo alinhado com a instância Ollama local.

Para ver quais modelos estão disponíveis:

```bash
ollama list
opencraft models list
```

Para adicionar um novo modelo, basta fazer pull com o Ollama:

```bash
ollama pull mistral
```

O novo modelo será automaticamente descoberto e disponível para uso.

Se você definir `models.providers.ollama` explicitamente, a auto-descoberta é pulada e você deve definir modelos manualmente (veja abaixo).

## Configuração

### Configuração básica (descoberta implícita)

A forma mais simples de habilitar o Ollama é via variável de ambiente:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### Configuração explícita (modelos manuais)

Use config explícita quando:

- O Ollama roda em outro host/porta.
- Você quer forçar janelas de contexto ou listas de modelo específicas.
- Você quer definições de modelo totalmente manuais.

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [
          {
            id: "gpt-oss:20b",
            name: "GPT-OSS 20B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

Se `OLLAMA_API_KEY` estiver definido, você pode omitir `apiKey` na entrada do provedor e o OpenCraft o preencherá para verificações de disponibilidade.

### URL base personalizada (config explícita)

Se o Ollama está rodando em um host ou porta diferente (config explícita desabilita a auto-descoberta, então defina modelos manualmente):

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // Sem /v1 - use a URL da API nativa do Ollama
        api: "ollama", // Defina explicitamente para garantir comportamento nativo de chamadas de tool
      },
    },
  },
}
```

<Warning>
Não adicione `/v1` à URL. O caminho `/v1` usa modo compatível com OpenAI, onde chamadas de tool não são confiáveis. Use a URL base do Ollama sem sufixo de caminho.
</Warning>

### Seleção de modelo

Uma vez configurado, todos seus modelos Ollama estão disponíveis:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Modelos em nuvem

Modelos em nuvem permitem rodar modelos hospedados na nuvem (por exemplo `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`) junto com seus modelos locais.

Para usar modelos em nuvem, selecione o modo **Cloud + Local** durante o onboarding. O wizard verifica se você está logado e abre um fluxo de login no browser quando necessário. Se a autenticação não puder ser verificada, o wizard volta para padrões de modelos locais.

Você também pode fazer login diretamente em [ollama.com/signin](https://ollama.com/signin).

## Avançado

### Modelos de raciocínio

O OpenCraft trata modelos com nomes como `deepseek-r1`, `reasoning` ou `think` como capazes de raciocínio por padrão:

```bash
ollama pull deepseek-r1:32b
```

### Custos de modelo

O Ollama é gratuito e roda localmente, então todos os custos de modelo são definidos como $0.

### Configuração de streaming

A integração Ollama do OpenCraft usa a **API nativa do Ollama** (`/api/chat`) por padrão, que suporta completamente streaming e chamadas de tool simultaneamente. Nenhuma configuração especial é necessária.

#### Modo compatível OpenAI legado

<Warning>
**Chamadas de tool não são confiáveis no modo compatível com OpenAI.** Use este modo apenas se você precisar do formato OpenAI para um proxy e não depender do comportamento nativo de chamadas de tool.
</Warning>

Se você precisar usar o endpoint compatível com OpenAI (ex: atrás de um proxy que suporta apenas formato OpenAI), defina `api: "openai-completions"` explicitamente:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: true, // padrão: true
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

Este modo pode não suportar streaming + chamadas de tool simultaneamente. Pode ser necessário desabilitar streaming com `params: { streaming: false }` na config do modelo.

Quando `api: "openai-completions"` é usado com Ollama, o OpenCraft injeta `options.num_ctx` por padrão para que o Ollama não volte silenciosamente para uma janela de contexto de 4096. Se seu proxy/upstream rejeitar campos `options` desconhecidos, desabilite este comportamento:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: false,
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

### Janelas de contexto

Para modelos auto-descobertos, o OpenCraft usa a janela de contexto reportada pelo Ollama quando disponível, caso contrário usa a janela de contexto padrão do Ollama. Você pode sobrescrever `contextWindow` e `maxTokens` na config explícita do provedor.

## Troubleshooting

### Ollama não detectado

Certifique-se de que o Ollama está rodando e que você definiu `OLLAMA_API_KEY` (ou um perfil de autenticação), e que **não** definiu uma entrada explícita `models.providers.ollama`:

```bash
ollama serve
```

E que a API está acessível:

```bash
curl http://localhost:11434/api/tags
```

### Nenhum modelo disponível

Se seu modelo não está listado:

- Faça pull do modelo localmente, ou
- Defina o modelo explicitamente em `models.providers.ollama`.

Para adicionar modelos:

```bash
ollama list  # Ver o que está instalado
ollama pull glm-4.7-flash
ollama pull gpt-oss:20b
ollama pull llama3.3     # Ou outro modelo
```

### Conexão recusada

Verifique se o Ollama está rodando na porta correta:

```bash
# Verificar se o Ollama está rodando
ps aux | grep ollama

# Ou reiniciar o Ollama
ollama serve
```

## Veja também

- [Provedores de Modelo](/concepts/model-providers) - Visão geral de todos os provedores
- [Seleção de Modelo](/concepts/models) - Como escolher modelos
- [Configuração](/gateway/configuration) - Referência completa de config
