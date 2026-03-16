---
summary: "Referência do CLI para `opencraft models` (status/list/set/scan, aliases, fallbacks, auth)"
read_when:
  - Você quer mudar modelos padrão ou ver status de auth do provedor
  - Você quer escanear modelos/provedores disponíveis e depurar perfis de auth
title: "models"
---

# `opencraft models`

Descoberta, escaneamento e configuração de modelos (modelo padrão, fallbacks, perfis de auth).

Relacionado:

- Provedores + modelos: [Models](/providers/models)
- Setup de auth de provedor: [Getting started](/start/getting-started)

## Comandos comuns

```bash
opencraft models status
opencraft models list
opencraft models set <model-or-alias>
opencraft models scan
```

`opencraft models status` mostra o padrão/fallbacks resolvidos mais uma visão geral de auth.
Quando snapshots de uso de provedor estão disponíveis, a seção de status OAuth/token inclui
cabeçalhos de uso do provedor.
Adicione `--probe` para rodar probes de auth ao vivo contra cada perfil de provedor configurado.
Probes são requisições reais (podem consumir tokens e acionar rate limits).
Use `--agent <id>` para inspecionar o estado de modelo/auth de um agente configurado. Quando omitido,
o comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se definido, caso contrário o
agente padrão configurado.

Notas:

- `models set <model-or-alias>` aceita `provider/model` ou um alias.
- Refs de modelo são analisadas dividindo no **primeiro** `/`. Se o ID do modelo incluir `/` (estilo OpenRouter), inclua o prefixo do provedor (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, OpenCraft trata a entrada como um alias ou um modelo para o **provedor padrão** (só funciona quando não há `/` no ID do modelo).
- `models status` pode mostrar `marker(<value>)` na saída de auth para placeholders não secretos (por exemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `qwen-oauth`, `ollama-local`) em vez de mascará-los como segredos.

### `models status`

Opções:

- `--json`
- `--plain`
- `--check` (sair 1=expirado/ausente, 2=expirando)
- `--probe` (probe ao vivo de perfis de auth configurados)
- `--probe-provider <name>` (fazer probe de um provedor)
- `--probe-profile <id>` (repetir ou ids de perfil separados por vírgula)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id de agente configurado; sobrescreve `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

## Aliases + fallbacks

```bash
opencraft models aliases list
opencraft models fallbacks list
```

## Perfis de auth

```bash
opencraft models auth add
opencraft models auth login --provider <id>
opencraft models auth setup-token
opencraft models auth paste-token
```

`models auth login` roda o fluxo de auth do plugin do provedor (OAuth/API key). Use
`opencraft plugins list` para ver quais provedores estão instalados.

Notas:

- `setup-token` solicita um valor de setup-token (gere com `claude setup-token` em qualquer máquina).
- `paste-token` aceita uma string de token gerada em outro lugar ou de automação.
- Nota de política Anthropic: suporte a setup-token é compatibilidade técnica. A Anthropic bloqueou algum uso de assinatura fora do Claude Code no passado, então verifique os termos atuais antes de usá-lo amplamente.
