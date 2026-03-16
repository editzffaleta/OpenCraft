---
summary: "Usar a API unificada do Kilo Gateway para acessar muitos modelos no OpenCraft"
read_when:
  - Você quer uma única chave de API para muitos LLMs
  - Você quer rodar modelos via Kilo Gateway no OpenCraft
---

# Kilo Gateway

O Kilo Gateway fornece uma **API unificada** que roteia requisições para muitos modelos atrás de um único
endpoint e chave de API. É compatível com OpenAI, então a maioria dos SDKs OpenAI funciona trocando a URL base.

## Obtendo uma chave de API

1. Acesse [app.kilo.ai](https://app.kilo.ai)
2. Faça login ou crie uma conta
3. Navegue até API Keys e gere uma nova chave

## Configuração CLI

```bash
opencraft onboard --kilocode-api-key <chave>
```

Ou defina a variável de ambiente:

```bash
export KILOCODE_API_KEY="<sua-chave-kilocode>" # pragma: allowlist secret
```

## Trecho de config

```json5
{
  env: { KILOCODE_API_KEY: "<sua-chave-kilocode>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## Modelo padrão

O modelo padrão é `kilocode/kilo/auto`, um modelo de roteamento inteligente que seleciona automaticamente
o melhor modelo subjacente com base na tarefa:

- Tarefas de planejamento, depuração e orquestração são roteadas para Claude Opus
- Tarefas de escrita e exploração de código são roteadas para Claude Sonnet

## Modelos disponíveis

O OpenCraft descobre dinamicamente os modelos disponíveis do Kilo Gateway na inicialização. Use
`/models kilocode` para ver a lista completa de modelos disponíveis com sua conta.

Qualquer modelo disponível no gateway pode ser usado com o prefixo `kilocode/`:

```
kilocode/kilo/auto              (padrão - roteamento inteligente)
kilocode/anthropic/claude-sonnet-4
kilocode/openai/gpt-5.2
kilocode/google/gemini-3-pro-preview
...e muitos mais
```

## Notas

- Refs de modelo são `kilocode/<model-id>` (ex: `kilocode/anthropic/claude-sonnet-4`).
- Modelo padrão: `kilocode/kilo/auto`
- URL base: `https://api.kilo.ai/api/gateway/`
- Para mais opções de modelo/provedor, veja [/concepts/model-providers](/concepts/model-providers).
- O Kilo Gateway usa um token Bearer com sua chave de API internamente.
