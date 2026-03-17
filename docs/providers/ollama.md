---
summary: "Execute o OpenCraft com Ollama (modelos na nuvem e locais)"
read_when:
  - Você quer executar o OpenCraft com modelos na nuvem ou locais via Ollama
  - Você precisa de orientação para configuração do Ollama
title: "Ollama"
---

# Ollama

Ollama é um runtime de LLM local que facilita a execução de modelos open-source na sua máquina. O OpenCraft se integra com a API nativa do Ollama (`/api/chat`), suporta streaming e chamada de ferramentas, e pode descobrir automaticamente modelos Ollama locais quando você opta por usar `OLLAMA_API_KEY` (ou um perfil de autenticação) e não define uma entrada explícita em `models.providers.ollama`.

<Warning>
**Usuários de Ollama remoto**: Não use a URL compatível com OpenAI `/v1` (`http://host:11434/v1`) com o OpenCraft. Isso quebra a chamada de ferramentas e os modelos podem gerar JSON de ferramentas como texto simples. Use a URL nativa da API do Ollama: `baseUrl: "http://host:11434"` (sem `/v1`).
</Warning>

## Início rápido

### Onboarding (recomendado)

A maneira mais rápida de configurar o Ollama é através do onboarding:

```bash
opencraft onboard
```

Selecione **Ollama** na lista de providers. O onboarding irá:

1. Solicitar a URL base do Ollama onde sua instância pode ser acessada (padrão `http://127.0.0.1:11434`).
2. Permitir que você escolha **Cloud + Local** (modelos na nuvem e locais) ou **Local** (apenas modelos locais).
3. Abrir um fluxo de login no navegador se você escolher **Cloud + Local** e não estiver logado no ollama.com.
4. Descobrir modelos disponíveis e sugerir padrões.
5. Baixar automaticamente o modelo selecionado se ele não estiver disponível localmente.

O modo não interativo também é suportado:

```bash
opencraft onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

Opcionalmente, especifique uma URL base personalizada ou modelo:

```bash
opencraft onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

### Configuração manual

1. Instale o Ollama: [https://ollama.com/download](https://ollama.com/download)

2. Baixe um modelo local se quiser inferência local:

```bash
ollama pull glm-4.7-flash
# ou
ollama pull gpt-oss:20b
# ou
ollama pull llama3.3
```

3. Se você também quiser modelos na nuvem, faça login:

```bash
ollama signin
```

4. Execute o onboarding e escolha `Ollama`:

```bash
opencraft onboard
```

- `Local`: apenas modelos locais
- `Cloud + Local`: modelos locais mais modelos na nuvem
- Modelos na nuvem como `kimi-k2.5:cloud`, `minimax-m2.5:cloud` e `glm-5:cloud` **não** requerem `ollama pull` local

O OpenCraft atualmente sugere:

- padrão local: `glm-4.7-flash`
- padrões na nuvem: `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`

5. Se preferir configuração manual, habilite o Ollama para o OpenCraft diretamente (qualquer valor funciona; o Ollama não requer uma chave real):

```bash
# Defina a variável de ambiente
export OLLAMA_API_KEY="ollama-local"

# Ou configure no seu arquivo de config
opencraft config set models.providers.ollama.apiKey "ollama-local"
```

6. Inspecione ou alterne modelos:

```bash
opencraft models list
opencraft models set ollama/glm-4.7-flash
```

7. Ou defina o padrão no config:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/glm-4.7-flash" },
    },
  },
}
```

## Descoberta de modelos (provider implícito)

Quando você define `OLLAMA_API_KEY` (ou um perfil de autenticação) e **não** define `models.providers.ollama`, o OpenCraft descobre modelos da instância local do Ollama em `http://127.0.0.1:11434`:

- Consulta `/api/tags`
- Usa consultas `/api/show` com melhor esforço para ler `contextWindow` quando disponível
- Marca `reasoning` com uma heurística de nome de modelo (`r1`, `reasoning`, `think`)
- Define `maxTokens` com o limite padrão de Token máximo do Ollama usado pelo OpenCraft
- Define todos os custos como `0`

Isso evita entradas manuais de modelos mantendo o catálogo alinhado com a instância local do Ollama.

Para ver quais modelos estão disponíveis:

```bash
ollama list
opencraft models list
```

Para adicionar um novo modelo, simplesmente baixe-o com o Ollama:

```bash
ollama pull mistral
```

O novo modelo será automaticamente descoberto e disponível para uso.

Se você definir `models.providers.ollama` explicitamente, a descoberta automática é ignorada e você deve definir os modelos manualmente (veja abaixo).

## Configuração

### Configuração básica (descoberta implícita)

A maneira mais simples de habilitar o Ollama é via variável de ambiente:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### Configuração explícita (modelos manuais)

Use config explícito quando:

- O Ollama roda em outro host/porta.
- Você quer forçar janelas de contexto ou listas de modelos específicas.
- Você quer definições de modelos totalmente manuais.

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

Se `OLLAMA_API_KEY` estiver definido, você pode omitir `apiKey` na entrada do provider e o OpenCraft preencherá para verificações de disponibilidade.

### URL base personalizada (config explícito)

Se o Ollama estiver rodando em um host ou porta diferente (config explícito desabilita a descoberta automática, então defina os modelos manualmente):

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // Sem /v1 - use a URL nativa da API do Ollama
        api: "ollama", // Defina explicitamente para garantir comportamento nativo de chamada de ferramentas
      },
    },
  },
}
```

<Warning>
Não adicione `/v1` à URL. O caminho `/v1` usa o modo compatível com OpenAI, onde a chamada de ferramentas não é confiável. Use a URL base do Ollama sem sufixo de caminho.
</Warning>

### Seleção de modelo

Uma vez configurado, todos os seus modelos Ollama estão disponíveis:

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

## Modelos na nuvem

Os modelos na nuvem permitem que você execute modelos hospedados na nuvem (por exemplo `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`) junto com seus modelos locais.

Para usar modelos na nuvem, selecione o modo **Cloud + Local** durante a configuração. O assistente verifica se você está logado e abre um fluxo de login no navegador quando necessário. Se a autenticação não puder ser verificada, o assistente volta aos padrões de modelos locais.

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

A integração do OpenCraft com o Ollama usa a **API nativa do Ollama** (`/api/chat`) por padrão, que suporta totalmente streaming e chamada de ferramentas simultaneamente. Nenhuma configuração especial é necessária.

#### Modo legado compatível com OpenAI

<Warning>
**A chamada de ferramentas não é confiável no modo compatível com OpenAI.** Use este modo apenas se precisar do formato OpenAI para um proxy e não depender do comportamento nativo de chamada de ferramentas.
</Warning>

Se precisar usar o endpoint compatível com OpenAI (por exemplo, atrás de um proxy que suporta apenas o formato OpenAI), defina `api: "openai-completions"` explicitamente:

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

Este modo pode não suportar streaming + chamada de ferramentas simultaneamente. Pode ser necessário desabilitar o streaming com `params: { streaming: false }` na config do modelo.

Quando `api: "openai-completions"` é usado com o Ollama, o OpenCraft injeta `options.num_ctx` por padrão para que o Ollama não volte silenciosamente para uma janela de contexto de 4096. Se seu proxy/upstream rejeitar campos `options` desconhecidos, desabilite esse comportamento:

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

Para modelos descobertos automaticamente, o OpenCraft usa a janela de contexto reportada pelo Ollama quando disponível, caso contrário volta para a janela de contexto padrão do Ollama usada pelo OpenCraft. Você pode sobrescrever `contextWindow` e `maxTokens` na config explícita do provider.

## Solução de problemas

### Ollama não detectado

Certifique-se de que o Ollama está em execução e que você definiu `OLLAMA_API_KEY` (ou um perfil de autenticação), e que você **não** definiu uma entrada explícita em `models.providers.ollama`:

```bash
ollama serve
```

E que a API está acessível:

```bash
curl http://localhost:11434/api/tags
```

### Nenhum modelo disponível

Se seu modelo não está listado, ou:

- Baixe o modelo localmente, ou
- Defina o modelo explicitamente em `models.providers.ollama`.

Para adicionar modelos:

```bash
ollama list  # Veja o que está instalado
ollama pull glm-4.7-flash
ollama pull gpt-oss:20b
ollama pull llama3.3     # Ou outro modelo
```

### Conexão recusada

Verifique se o Ollama está rodando na porta correta:

```bash
# Verifique se o Ollama está em execução
ps aux | grep ollama

# Ou reinicie o Ollama
ollama serve
```

## Veja também

- [Providers de modelo](/concepts/model-providers) - Visão geral de todos os providers
- [Seleção de modelo](/concepts/models) - Como escolher modelos
- [Configuração](/gateway/configuration) - Referência completa de config
