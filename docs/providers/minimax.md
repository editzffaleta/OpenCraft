---
summary: "Use o MiniMax M2.5 no OpenCraft"
read_when:
  - Você quer modelos MiniMax no OpenCraft
  - Você precisa de orientação para configurar o MiniMax
title: "MiniMax"
---

# MiniMax

MiniMax é uma empresa de IA que desenvolve a família de modelos **M2/M2.5**. O lançamento
atual focado em codificação é o **MiniMax M2.5** (23 de dezembro de 2025), construído para
tarefas complexas do mundo real.

Fonte: [Nota de lançamento do MiniMax M2.5](https://www.minimax.io/news/minimax-m25)

## Visão geral do modelo (M2.5)

O MiniMax destaca estas melhorias no M2.5:

- **Codificação multilíngue** mais forte (Rust, Java, Go, C++, Kotlin, Objective-C, TS/JS).
- Melhor **desenvolvimento web/app** e qualidade estética de saída (incluindo mobile nativo).
- Melhor tratamento de **instruções compostas** para fluxos de trabalho estilo escritório, baseado em
  pensamento intercalado e execução de restrições integrada.
- **Respostas mais concisas** com menor uso de Token e loops de iteração mais rápidos.
- Maior compatibilidade com **frameworks de ferramentas/agentes** e gerenciamento de contexto (Claude Code,
  Droid/Factory AI, Cline, Kilo Code, Roo Code, BlackBox).
- Saídas de **diálogo e escrita técnica** de maior qualidade.

## MiniMax M2.5 vs MiniMax M2.5 Highspeed

- **Velocidade:** `MiniMax-M2.5-highspeed` é o nível rápido oficial na documentação do MiniMax.
- **Custo:** A tabela de preços do MiniMax lista o mesmo custo de entrada e um custo de saída maior para o highspeed.
- **IDs de modelo atuais:** use `MiniMax-M2.5` ou `MiniMax-M2.5-highspeed`.

## Escolha uma configuração

### MiniMax OAuth (Coding Plan) — recomendado

**Melhor para:** configuração rápida com MiniMax Coding Plan via OAuth, sem necessidade de API key.

Habilite o Plugin OAuth integrado e autentique-se:

```bash
opencraft plugins enable minimax  # pule se já estiver carregado.
opencraft gateway restart  # reinicie se o Gateway já estiver em execução
opencraft onboard --auth-choice minimax-portal
```

Você será solicitado a selecionar um endpoint:

- **Global** - Usuários internacionais (`api.minimax.io`)
- **CN** - Usuários na China (`api.minimaxi.com`)

Veja o [README do Plugin MiniMax](https://github.com/editzffaleta/OpenCraft/tree/main/extensions/minimax) para detalhes.

### MiniMax M2.5 (API key)

**Melhor para:** MiniMax hospedado com API compatível com Anthropic.

Configure via CLI:

- Execute `opencraft configure`
- Selecione **Model/auth**
- Escolha **MiniMax M2.5**

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.5" } } },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.12 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
          {
            id: "MiniMax-M2.5-highspeed",
            name: "MiniMax M2.5 Highspeed",
            reasoning: true,
            input: ["text"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.12 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### MiniMax M2.5 como fallback (exemplo)

**Melhor para:** manter seu modelo mais forte de última geração como primário, com failover para o MiniMax M2.5.
O exemplo abaixo usa o Opus como primário concreto; substitua pelo seu modelo preferido de última geração.

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "primary" },
        "minimax/MiniMax-M2.5": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.5"],
      },
    },
  },
}
```

### Opcional: Local via LM Studio (manual)

**Melhor para:** inferência local com LM Studio.
Observamos resultados fortes com o MiniMax M2.5 em hardware potente (ex: um
desktop/servidor) usando o servidor local do LM Studio.

Configure manualmente via `opencraft.json`:

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.5-gs32" },
      models: { "lmstudio/minimax-m2.5-gs32": { alias: "Minimax" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5 GS32",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Configure via `opencraft configure`

Use o assistente de configuração interativo para configurar o MiniMax sem editar JSON:

1. Execute `opencraft configure`.
2. Selecione **Model/auth**.
3. Escolha **MiniMax M2.5**.
4. Escolha seu modelo padrão quando solicitado.

## Opções de configuração

- `models.providers.minimax.baseUrl`: prefira `https://api.minimax.io/anthropic` (compatível com Anthropic); `https://api.minimax.io/v1` é opcional para payloads compatíveis com OpenAI.
- `models.providers.minimax.api`: prefira `anthropic-messages`; `openai-completions` é opcional para payloads compatíveis com OpenAI.
- `models.providers.minimax.apiKey`: API key do MiniMax (`MINIMAX_API_KEY`).
- `models.providers.minimax.models`: defina `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost`.
- `agents.defaults.models`: crie alias para os modelos que você quer na lista permitida.
- `models.mode`: mantenha `merge` se quiser adicionar o MiniMax junto com os modelos integrados.

## Notas

- As referências de modelo são `minimax/<model>`.
- IDs de modelo recomendados: `MiniMax-M2.5` e `MiniMax-M2.5-highspeed`.
- API de uso do Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (requer uma chave de coding plan).
- Atualize os valores de preço em `models.json` se precisar de rastreamento de custos exato.
- Link de indicação para o MiniMax Coding Plan (10% de desconto): [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
- Veja [/concepts/model-providers](/concepts/model-providers) para regras de provider.
- Use `opencraft models list` e `opencraft models set minimax/MiniMax-M2.5` para alternar.

## Solução de problemas

### "Unknown model: minimax/MiniMax-M2.5"

Isso geralmente significa que o **provider MiniMax não está configurado** (sem entrada de provider
e sem perfil de autenticação/chave de ambiente do MiniMax encontrado). Uma correção para essa detecção está na
versão **2026.1.12** (não lançada no momento da escrita). Corrija:

- Atualizando para **2026.1.12** (ou execute a partir do código-fonte `main`), depois reiniciando o Gateway.
- Executando `opencraft configure` e selecionando **MiniMax M2.5**, ou
- Adicionando o bloco `models.providers.minimax` manualmente, ou
- Definindo `MINIMAX_API_KEY` (ou um perfil de autenticação MiniMax) para que o provider possa ser injetado.

Certifique-se de que o id do modelo é **sensível a maiúsculas/minúsculas**:

- `minimax/MiniMax-M2.5`
- `minimax/MiniMax-M2.5-highspeed`

Depois verifique com:

```bash
opencraft models list
```
