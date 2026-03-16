---
summary: "Configuração do Hugging Face Inference (auth + seleção de modelo)"
read_when:
  - Você quer usar Hugging Face Inference com o OpenCraft
  - Você precisa da variável de env do token HF ou da opção de auth CLI
title: "Hugging Face (Inference)"
---

# Hugging Face (Inference)

Os [Inference Providers do Hugging Face](https://huggingface.co/docs/inference-providers) oferecem chat completions compatíveis com OpenAI por meio de uma API de roteador único. Você tem acesso a muitos modelos (DeepSeek, Llama e mais) com um único token. O OpenCraft usa o **endpoint compatível com OpenAI** (somente chat completions); para text-to-image, embeddings ou fala, use os [clientes de inferência HF](https://huggingface.co/docs/api-inference/quicktour) diretamente.

- Provedor: `huggingface`
- Auth: `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN` (token refinado com permissão **Make calls to Inference Providers**)
- API: compatível com OpenAI (`https://router.huggingface.co/v1`)
- Cobrança: Token HF único; [preços](https://huggingface.co/docs/inference-providers/pricing) seguem as taxas do provedor com tier gratuito.

## Início rápido

1. Crie um token refinado em [Hugging Face → Settings → Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) com a permissão **Make calls to Inference Providers**.
2. Execute o onboarding e escolha **Hugging Face** no dropdown de provedor, depois insira sua chave de API quando solicitado:

```bash
opencraft onboard --auth-choice huggingface-api-key
```

3. No dropdown **Default Hugging Face model**, escolha o modelo que deseja (a lista é carregada da API de Inferência quando você tem um token válido; caso contrário, uma lista integrada é exibida). Sua escolha é salva como modelo padrão.
4. Você também pode definir ou alterar o modelo padrão mais tarde na config:

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
    },
  },
}
```

## Exemplo não-interativo

```bash
opencraft onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Isso define `huggingface/deepseek-ai/DeepSeek-R1` como modelo padrão.

## Nota sobre ambiente

Se o Gateway roda como daemon (launchd/systemd), certifique-se de que `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`
está disponível para esse processo (por exemplo, em `~/.opencraft/.env` ou via
`env.shellEnv`).

## Descoberta de modelos e dropdown do onboarding

O OpenCraft descobre modelos chamando o **endpoint de Inferência diretamente**:

```bash
GET https://router.huggingface.co/v1/models
```

(Opcional: envie `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` ou `$HF_TOKEN` para a lista completa; alguns endpoints retornam um subconjunto sem auth.) A resposta é no estilo OpenAI `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

Quando você configura uma chave de API do Hugging Face (via onboarding, `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`), o OpenCraft usa esse GET para descobrir modelos de chat completion disponíveis. Durante o **onboarding interativo**, após inserir seu token, você vê um dropdown **Default Hugging Face model** populado dessa lista (ou o catálogo integrado se a requisição falhar). Em runtime (por exemplo, inicialização do Gateway), quando uma chave está presente, o OpenCraft chama novamente **GET** `https://router.huggingface.co/v1/models` para atualizar o catálogo. A lista é mesclada com um catálogo integrado (para metadados como janela de contexto e custo). Se a requisição falhar ou nenhuma chave estiver definida, apenas o catálogo integrado é usado.

## Nomes de modelos e opções editáveis

- **Nome da API:** O nome de exibição do modelo é **hidratado via GET /v1/models** quando a API retorna `name`, `title` ou `display_name`; caso contrário é derivado do ID do modelo (ex: `deepseek-ai/DeepSeek-R1` → "DeepSeek R1").
- **Sobrescrever nome de exibição:** Você pode definir um rótulo personalizado por modelo na config para que apareça como você quer na CLI e na UI:

```json5
{
  agents: {
    defaults: {
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (rápido)" },
        "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (barato)" },
      },
    },
  },
}
```

- **Seleção de provedor/política:** Adicione um sufixo ao **ID do modelo** para escolher como o roteador seleciona o backend:
  - **`:fastest`** — maior throughput (roteador escolhe; a escolha de provedor é **bloqueada** — sem picker de backend interativo).
  - **`:cheapest`** — menor custo por token de saída (roteador escolhe; a escolha de provedor é **bloqueada**).
  - **`:provider`** — força um backend específico (ex: `:sambanova`, `:together`).

  Quando você seleciona **:cheapest** ou **:fastest** (ex: no dropdown de modelo do onboarding), o provedor é bloqueado: o roteador decide por custo ou velocidade e nenhum passo opcional de "preferir backend específico" é mostrado. Você pode adicionar estes como entradas separadas em `models.providers.huggingface.models` ou definir `model.primary` com o sufixo. Você também pode definir sua ordem padrão em [Inference Provider settings](https://hf.co/settings/inference-providers) (sem sufixo = usar essa ordem).

- **Mesclagem de config:** Entradas existentes em `models.providers.huggingface.models` (ex: em `models.json`) são mantidas ao mesclar configs. Então qualquer `name`, `alias` ou opções de modelo personalizadas que você definir lá são preservadas.

## IDs de modelo e exemplos de configuração

Refs de modelo usam o formato `huggingface/<org>/<model>` (IDs estilo Hub). A lista abaixo é de **GET** `https://router.huggingface.co/v1/models`; seu catálogo pode incluir mais.

**Exemplos de IDs (do endpoint de inferência):**

| Modelo                 | Ref (prefixe com `huggingface/`)    |
| ---------------------- | ----------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`           |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`         |
| Qwen3 8B               | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`          |
| Qwen3 32B              | `Qwen/Qwen3-32B`                    |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B           | `openai/gpt-oss-120b`               |
| GLM 4.7                | `zai-org/GLM-4.7`                   |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`              |

Você pode adicionar `:fastest`, `:cheapest` ou `:provider` (ex: `:together`, `:sambanova`) ao ID do modelo. Defina sua ordem padrão em [Inference Provider settings](https://hf.co/settings/inference-providers); veja [Inference Providers](https://huggingface.co/docs/inference-providers) e **GET** `https://router.huggingface.co/v1/models` para a lista completa.

### Exemplos completos de configuração

**DeepSeek R1 como primário com fallback Qwen:**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-R1",
        fallbacks: ["huggingface/Qwen/Qwen3-8B"],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
      },
    },
  },
}
```

**Qwen como padrão, com variantes :cheapest e :fastest:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen3-8B" },
      models: {
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
        "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (mais barato)" },
        "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (mais rápido)" },
      },
    },
  },
}
```

**DeepSeek + Llama + GPT-OSS com aliases:**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
        fallbacks: [
          "huggingface/meta-llama/Llama-3.3-70B-Instruct",
          "huggingface/openai/gpt-oss-120b",
        ],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
        "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
        "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
      },
    },
  },
}
```

**Forçar um backend específico com :provider:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1:together" },
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1:together": { alias: "DeepSeek R1 (Together)" },
      },
    },
  },
}
```

**Múltiplos modelos Qwen e DeepSeek com sufixos de política:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
      models: {
        "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
        "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (barato)" },
        "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (rápido)" },
        "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
      },
    },
  },
}
```
