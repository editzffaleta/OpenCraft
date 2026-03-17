---
summary: "Configuração do Hugging Face Inference (autenticação + seleção de modelo)"
read_when:
  - Você quer usar o Hugging Face Inference com OpenCraft
  - Você precisa da variável de ambiente do token HF ou da opção de autenticação via CLI
title: "Hugging Face (Inference)"
---

# Hugging Face (Inference)

Os [Provedores de Inference do Hugging Face](https://huggingface.co/docs/inference-providers) oferecem completações de chat compatíveis com OpenAI através de uma única API roteadora. Você obtém acesso a muitos modelos (DeepSeek, Llama e mais) com um token. O OpenCraft usa o **endpoint compatível com OpenAI** (apenas completações de chat); para texto-para-imagem, embeddings ou fala, use os [clientes de inference HF](https://huggingface.co/docs/api-inference/quicktour) diretamente.

- Provider: `huggingface`
- Autenticação: `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN` (token refinado com **Make calls to Inference Providers**)
- API: compatível com OpenAI (`https://router.huggingface.co/v1`)
- Cobrança: token HF único; os [preços](https://huggingface.co/docs/inference-providers/pricing) seguem as taxas do provider com um nível gratuito.

## Início rápido

1. Crie um token refinado em [Hugging Face → Settings → Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) com a permissão **Make calls to Inference Providers**.
2. Execute o onboarding e escolha **Hugging Face** no dropdown de providers, depois insira sua chave de API quando solicitado:

```bash
opencraft onboard --auth-choice huggingface-api-key
```

3. No dropdown **Default Hugging Face model**, escolha o modelo que você quer (a lista é carregada da API de Inference quando você tem um token válido; caso contrário, uma lista integrada é exibida). Sua escolha é salva como o modelo padrão.
4. Você também pode definir ou alterar o modelo padrão depois na configuração:

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
    },
  },
}
```

## Exemplo não interativo

```bash
opencraft onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Isso definirá `huggingface/deepseek-ai/DeepSeek-R1` como o modelo padrão.

## Nota sobre ambiente

Se o Gateway roda como daemon (launchd/systemd), certifique-se de que `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`
está disponível para aquele processo (por exemplo, em `~/.opencraft/.env` ou via
`env.shellEnv`).

## Descoberta de modelos e dropdown do onboarding

O OpenCraft descobre modelos chamando o **endpoint de Inference diretamente**:

```bash
GET https://router.huggingface.co/v1/models
```

(Opcional: envie `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` ou `$HF_TOKEN` para a lista completa; alguns endpoints retornam um subconjunto sem autenticação.) A resposta é no estilo OpenAI `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

Quando você configura uma chave de API do Hugging Face (via onboarding, `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`), o OpenCraft usa esse GET para descobrir modelos de completação de chat disponíveis. Durante a **configuração interativa**, após inserir seu token, você vê um dropdown **Default Hugging Face model** populado a partir dessa lista (ou do catálogo integrado se a requisição falhar). Em tempo de execução (ex.: inicialização do Gateway), quando uma chave está presente, o OpenCraft novamente chama **GET** `https://router.huggingface.co/v1/models` para atualizar o catálogo. A lista é mesclada com um catálogo integrado (para metadados como janela de contexto e custo). Se a requisição falhar ou nenhuma chave for definida, apenas o catálogo integrado é usado.

## Nomes de modelos e opções editáveis

- **Nome da API:** O nome de exibição do modelo é **hidratado do GET /v1/models** quando a API retorna `name`, `title` ou `display_name`; caso contrário, é derivado do ID do modelo (ex.: `deepseek-ai/DeepSeek-R1` -> "DeepSeek R1").
- **Sobrescrever nome de exibição:** Você pode definir um rótulo customizado por modelo na configuração para que apareça como você quer no CLI e na UI:

```json5
{
  agents: {
    defaults: {
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
        "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
      },
    },
  },
}
```

- **Seleção de provider / política:** Adicione um sufixo ao **ID do modelo** para escolher como o roteador seleciona o backend:
  - **`:fastest`** -- maior throughput (o roteador escolhe; a escolha do provider é **travada** -- sem seletor interativo de backend).
  - **`:cheapest`** -- menor custo por token de saída (o roteador escolhe; a escolha do provider é **travada**).
  - **`:provider`** -- forçar um backend específico (ex.: `:sambanova`, `:together`).

  Quando você seleciona **:cheapest** ou **:fastest** (ex.: no dropdown de modelo do onboarding), o provider é travado: o roteador decide por custo ou velocidade e nenhuma etapa opcional "preferir backend específico" é exibida. Você pode adicioná-los como entradas separadas em `models.providers.huggingface.models` ou definir `model.primary` com o sufixo. Você também pode definir sua ordem padrão em [Configurações de Inference Provider](https://hf.co/settings/inference-providers) (sem sufixo = usar aquela ordem).

- **Mesclagem de configuração:** Entradas existentes em `models.providers.huggingface.models` (ex.: em `models.json`) são mantidas quando a configuração é mesclada. Portanto, qualquer `name`, `alias` ou opções de modelo customizadas que você definiu lá são preservadas.

## IDs de modelo e exemplos de configuração

Referências de modelo usam o formato `huggingface/<org>/<model>` (IDs no estilo Hub). A lista abaixo é do **GET** `https://router.huggingface.co/v1/models`; seu catálogo pode incluir mais.

**Exemplos de IDs (do endpoint de inference):**

| Modelo                 | Ref (prefixar com `huggingface/`)   |
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

Você pode adicionar `:fastest`, `:cheapest` ou `:provider` (ex.: `:together`, `:sambanova`) ao ID do modelo. Defina sua ordem padrão em [Configurações de Inference Provider](https://hf.co/settings/inference-providers); veja [Inference Providers](https://huggingface.co/docs/inference-providers) e **GET** `https://router.huggingface.co/v1/models` para a lista completa.

### Exemplos completos de configuração

**DeepSeek R1 primário com fallback para Qwen:**

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
        "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
        "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
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
        "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
        "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
        "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
      },
    },
  },
}
```
