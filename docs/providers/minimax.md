---
summary: "Usar MiniMax M2.5 no OpenCraft"
read_when:
  - Você quer modelos MiniMax no OpenCraft
  - Você precisa de orientação de configuração do MiniMax
title: "MiniMax"
---

# MiniMax

O MiniMax é uma empresa de IA que desenvolve a família de modelos **M2/M2.5**. O
lançamento atual focado em código é o **MiniMax M2.5** (23 de dezembro de 2025), construído para
tarefas complexas do mundo real.

Fonte: [Nota de lançamento do MiniMax M2.5](https://www.minimax.io/news/minimax-m25)

## Visão geral do modelo (M2.5)

O MiniMax destaca estas melhorias no M2.5:

- **Programação multilíngue** mais forte (Rust, Java, Go, C++, Kotlin, Objective-C, TS/JS).
- Melhor **desenvolvimento web/app** e qualidade de saída estética (incluindo mobile nativo).
- Melhor tratamento de **instruções compostas** para fluxos de trabalho estilo office, com base em
  thinking intercalado e execução de restrições integrada.
- **Respostas mais concisas** com menor uso de tokens e ciclos de iteração mais rápidos.
- Melhor compatibilidade com **frameworks de tool/agente** e gerenciamento de contexto (Claude Code,
  Droid/Factory AI, Cline, Kilo Code, Roo Code, BlackBox).
- Saídas de **diálogo e escrita técnica** de maior qualidade.

## MiniMax M2.5 vs MiniMax M2.5 Highspeed

- **Velocidade:** `MiniMax-M2.5-highspeed` é o tier rápido oficial nos docs do MiniMax.
- **Custo:** O preço do MiniMax lista o mesmo custo de entrada e um custo de saída maior para highspeed.
- **IDs de modelo atuais:** use `MiniMax-M2.5` ou `MiniMax-M2.5-highspeed`.

## Escolha uma configuração

### MiniMax OAuth (Coding Plan) — recomendado

**Ideal para:** configuração rápida com o MiniMax Coding Plan via OAuth, sem chave de API necessária.

Habilite o plugin OAuth integrado e autentique-se:

```bash
opencraft plugins enable minimax-portal-auth  # pule se já carregado.
opencraft gateway restart  # reinicie se o gateway já estiver rodando
opencraft onboard --auth-choice minimax-portal
```

Você será solicitado a selecionar um endpoint:

- **Global** - Usuários internacionais (`api.minimax.io`)
- **CN** - Usuários na China (`api.minimaxi.com`)

Veja o [README do plugin MiniMax OAuth](https://github.com/openclaw/openclaw/tree/main/extensions/minimax-portal-auth) para detalhes.

### MiniMax M2.5 (chave de API)

**Ideal para:** MiniMax hospedado com API compatível com Anthropic.

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

**Ideal para:** manter seu modelo mais forte da geração mais recente como primário e falhar para o MiniMax M2.5.
O exemplo abaixo usa Opus como primário concreto; troque pelo seu modelo primário de última geração preferido.

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

**Ideal para:** inferência local com LM Studio.
Vimos ótimos resultados com o MiniMax M2.5 em hardware poderoso (como um
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

## Configurar via `opencraft configure`

Use o wizard de config interativo para configurar o MiniMax sem editar JSON:

1. Execute `opencraft configure`.
2. Selecione **Model/auth**.
3. Escolha **MiniMax M2.5**.
4. Escolha seu modelo padrão quando solicitado.

## Opções de configuração

- `models.providers.minimax.baseUrl`: prefira `https://api.minimax.io/anthropic` (compatível com Anthropic); `https://api.minimax.io/v1` é opcional para payloads compatíveis com OpenAI.
- `models.providers.minimax.api`: prefira `anthropic-messages`; `openai-completions` é opcional para payloads compatíveis com OpenAI.
- `models.providers.minimax.apiKey`: chave de API MiniMax (`MINIMAX_API_KEY`).
- `models.providers.minimax.models`: defina `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost`.
- `agents.defaults.models`: crie alias para modelos que você quer na allowlist.
- `models.mode`: mantenha `merge` se quiser adicionar MiniMax junto com os built-ins.

## Notas

- Refs de modelo são `minimax/<model>`.
- IDs de modelo recomendados: `MiniMax-M2.5` e `MiniMax-M2.5-highspeed`.
- API de uso do Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (requer chave do coding plan).
- Atualize os valores de preço em `models.json` se precisar de rastreamento exato de custos.
- Link de referral para o MiniMax Coding Plan (10% de desconto): [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
- Veja [/concepts/model-providers](/concepts/model-providers) para regras de provedor.
- Use `opencraft models list` e `opencraft models set minimax/MiniMax-M2.5` para trocar.

## Troubleshooting

### "Unknown model: minimax/MiniMax-M2.5"

Isso geralmente significa que o **provedor MiniMax não está configurado** (sem entrada de provedor
e sem perfil de auth ou chave de env do MiniMax encontrada). Uma correção para essa detecção está na
**2026.1.12** (ainda não lançada no momento da escrita). Corrija:

- Atualizando para **2026.1.12** (ou rode do source `main`) e reiniciando o gateway.
- Executando `opencraft configure` e selecionando **MiniMax M2.5**, ou
- Adicionando o bloco `models.providers.minimax` manualmente, ou
- Definindo `MINIMAX_API_KEY` (ou um perfil de auth MiniMax) para que o provedor possa ser injetado.

Certifique-se de que o ID do modelo é **sensível a maiúsculas/minúsculas**:

- `minimax/MiniMax-M2.5`
- `minimax/MiniMax-M2.5-highspeed`

Depois verifique com:

```bash
opencraft models list
```
