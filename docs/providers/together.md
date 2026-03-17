---
summary: "Configuração do Together AI (autenticação + seleção de modelo)"
read_when:
  - Você quer usar o Together AI com o OpenCraft
  - Você precisa da variável de ambiente da API key ou da opção de autenticação via CLI
---

# Together AI

O [Together AI](https://together.ai) fornece acesso a modelos open-source líderes incluindo Llama, DeepSeek, Kimi e mais através de uma API unificada.

- Provider: `together`
- Autenticação: `TOGETHER_API_KEY`
- API: Compatível com OpenAI

## Início rápido

1. Defina a API key (recomendado: armazene-a para o Gateway):

```bash
opencraft onboard --auth-choice together-api-key
```

2. Defina um modelo padrão:

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## Exemplo não interativo

```bash
opencraft onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

Isso definirá `together/moonshotai/Kimi-K2.5` como o modelo padrão.

## Nota sobre ambiente

Se o Gateway rodar como daemon (launchd/systemd), certifique-se de que `TOGETHER_API_KEY`
esteja disponível para esse processo (por exemplo, em `~/.opencraft/.env` ou via
`env.shellEnv`).

## Modelos disponíveis

O Together AI fornece acesso a diversos modelos open-source populares:

- **GLM 4.7 Fp8** - Modelo padrão com janela de contexto de 200K
- **Llama 3.3 70B Instruct Turbo** - Seguimento de instruções rápido e eficiente
- **Llama 4 Scout** - Modelo de visão com compreensão de imagens
- **Llama 4 Maverick** - Visão e raciocínio avançados
- **DeepSeek V3.1** - Modelo poderoso de codificação e raciocínio
- **DeepSeek R1** - Modelo de raciocínio avançado
- **Kimi K2 Instruct** - Modelo de alto desempenho com janela de contexto de 262K

Todos os modelos suportam chat completions padrão e são compatíveis com a API OpenAI.
