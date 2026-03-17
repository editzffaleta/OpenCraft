---
summary: "Referência CLI para `opencraft models` (status/list/set/scan, aliases, fallbacks, autenticação)"
read_when:
  - Você quer alterar modelos padrão ou ver o status de autenticação do provedor
  - Você quer escanear modelos/provedores disponíveis e depurar perfis de autenticação
title: "models"
---

# `opencraft models`

Descoberta, escaneamento e configuração de modelos (modelo padrão, fallbacks, perfis de autenticação).

Relacionado:

- Provedores + modelos: [Models](/providers/models)
- Configuração de autenticação do provedor: [Getting started](/start/getting-started)

## Comandos comuns

```bash
opencraft models status
opencraft models list
opencraft models set <model-or-alias>
opencraft models scan
```

`opencraft models status` mostra o padrão/fallbacks resolvidos mais uma visão geral de autenticação.
Quando snapshots de uso do provedor estão disponíveis, a seção de status OAuth/Token inclui
cabeçalhos de uso do provedor.
Adicione `--probe` para executar sondagens ao vivo de autenticação contra cada perfil de provedor configurado.
Sondagens são requisições reais (podem consumir Tokens e acionar limites de taxa).
Use `--agent <id>` para inspecionar o estado de modelo/autenticação de um agente configurado. Quando omitido,
o comando usa `OPENCRAFT_AGENT_DIR`/`PI_CODING_AGENT_DIR` se definido, caso contrário o
agente padrão configurado.

Notas:

- `models set <model-or-alias>` aceita `provider/model` ou um alias.
- Referências de modelo são analisadas dividindo no **primeiro** `/`. Se o ID do modelo incluir `/` (estilo OpenRouter), inclua o prefixo do provedor (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenCraft trata a entrada como um alias ou um modelo para o **provedor padrão** (só funciona quando não há `/` no ID do modelo).
- `models status` pode mostrar `marker(<value>)` na saída de autenticação para placeholders não secretos (por exemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `qwen-oauth`, `ollama-local`) em vez de mascará-los como segredos.

### `models status`

Opções:

- `--json`
- `--plain`
- `--check` (sair 1=expirado/ausente, 2=expirando)
- `--probe` (sondagem ao vivo dos perfis de autenticação configurados)
- `--probe-provider <name>` (sondar um provedor)
- `--probe-profile <id>` (repetível ou ids de perfil separados por vírgula)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id do agente configurado; sobrepõe `OPENCRAFT_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

## Aliases + fallbacks

```bash
opencraft models aliases list
opencraft models fallbacks list
```

## Perfis de autenticação

```bash
opencraft models auth add
opencraft models auth login --provider <id>
opencraft models auth setup-token
opencraft models auth paste-token
```

`models auth login` executa o fluxo de autenticação do Plugin do provedor (OAuth/chave de API). Use
`opencraft plugins list` para ver quais provedores estão instalados.

Notas:

- `setup-token` solicita um valor de setup-token (gere-o com `claude setup-token` em qualquer máquina).
- `paste-token` aceita uma string de Token gerada em outro lugar ou por automação.
- Nota sobre política da Anthropic: o suporte a setup-token é compatibilidade técnica. A Anthropic bloqueou algum uso de assinatura fora do Claude Code no passado, então verifique os termos atuais antes de usá-lo amplamente.
