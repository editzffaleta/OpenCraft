---
summary: "Como o OpenCraft constrói o contexto de prompt e reporta uso de tokens + custos"
read_when:
  - Explicando uso de tokens, custos ou janelas de contexto
  - Depurando crescimento de contexto ou comportamento de compactação
title: "Uso e Custos de Token"
---

# Uso e custos de Token

O OpenCraft rastreia **tokens**, não caracteres. Tokens são específicos por modelo, mas a maioria
dos modelos estilo OpenAI tem em média ~4 caracteres por token para texto em inglês.

## Como o prompt de sistema é construído

O OpenCraft monta seu próprio prompt de sistema a cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas
- Lista de skills (apenas metadados; instruções são carregadas sob demanda com `read`)
- Instruções de auto-atualização
- Arquivos de workspace + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando novo, mais `MEMORY.md` quando presente ou `memory.md` como fallback em minúsculo). Arquivos grandes são truncados por `agents.defaults.bootstrapMaxChars` (padrão: 20000), e a injeção total de bootstrap é limitada por `agents.defaults.bootstrapTotalMaxChars` (padrão: 150000). Arquivos `memory/*.md` são sob demanda via ferramentas de memória e não são auto-injetados.
- Hora (UTC + fuso horário do usuário)
- Tags de resposta + comportamento de heartbeat
- Metadados de runtime (host/SO/modelo/pensamento)

Veja o detalhamento completo em [Prompt de Sistema](/concepts/system-prompt).

## O que conta na janela de contexto

Tudo que o modelo recebe conta para o limite de contexto:

- Prompt de sistema (todas as seções listadas acima)
- Histórico de conversa (mensagens de usuário + assistente)
- Chamadas de ferramentas e resultados de ferramentas
- Anexos/transcrições (imagens, áudio, arquivos)
- Resumos de compactação e artefatos de poda
- Wrappers de provedor ou cabeçalhos de segurança (não visíveis, mas ainda contados)

Para imagens, o OpenCraft reduz escala de payloads de imagem de transcrição/ferramenta antes de chamadas ao provedor.
Use `agents.defaults.imageMaxDimensionPx` (padrão: `1200`) para ajustar isso:

- Valores menores geralmente reduzem o uso de tokens de visão e tamanho do payload.
- Valores maiores preservam mais detalhe visual para OCR/screenshots pesados de UI.

Para um detalhamento prático (por arquivo injetado, ferramentas, skills e tamanho do prompt de sistema), use `/context list` ou `/context detail`. Veja [Contexto](/concepts/context).

## Como ver o uso atual de tokens

Use estes no chat:

- `/status` → **cartão de status com emojis** com o modelo da sessão, uso de contexto,
  tokens de entrada/saída da última resposta e **custo estimado** (apenas chave de API).
- `/usage off|tokens|full` → anexa um **rodapé de uso por resposta** a cada resposta.
  - Persiste por sessão (armazenado como `responseUsage`).
  - Autenticação OAuth **oculta custo** (apenas tokens).
- `/usage cost` → mostra um resumo de custo local dos logs de sessão do OpenCraft.

Outras superfícies:

- **TUI/Web TUI:** `/status` + `/usage` são suportados.
- **CLI:** `opencraft status --usage` e `opencraft channels list` mostram
  janelas de cota do provedor (não custos por resposta).

## Estimativa de custo (quando mostrada)

Custos são estimados a partir da sua config de preços de modelo:

```
models.providers.<provider>.models[].cost
```

Estes são **USD por 1M tokens** para `input`, `output`, `cacheRead` e
`cacheWrite`. Se os preços estiverem ausentes, o OpenCraft mostra apenas tokens. Tokens OAuth
nunca mostram custo em dólares.

## Impacto de TTL de cache e poda

Prompt caching de provedor só se aplica dentro da janela de TTL do cache. O OpenCraft pode
opcionalmente executar **poda cache-ttl**: ele poda a sessão quando o TTL do cache
expira, depois reseta a janela de cache para que requisições subsequentes possam reutilizar o
contexto recém-cacheado em vez de recachear todo o histórico. Isso mantém
custos de escrita de cache mais baixos quando uma sessão fica ociosa além do TTL.

Configure em [Configuração do Gateway](/gateway/configuration) e veja os
detalhes de comportamento em [Poda de sessão](/concepts/session-pruning).

O heartbeat pode manter o cache **aquecido** entre intervalos ociosos. Se o TTL de cache do seu modelo
é `1h`, definir o intervalo de heartbeat logo abaixo disso (ex.: `55m`) pode evitar
recachear o prompt completo, reduzindo custos de escrita de cache.

Em configurações multi-agente, você pode manter uma config de modelo compartilhada e ajustar o comportamento de cache
por agente com `agents.list[].params.cacheRetention`.

Para um guia completo controle por controle, veja [Prompt Caching](/reference/prompt-caching).

Para preços de API da Anthropic, leituras de cache são significativamente mais baratas que tokens
de entrada, enquanto escritas de cache são cobradas com um multiplicador maior. Veja os preços de
prompt caching da Anthropic para as taxas e multiplicadores de TTL mais recentes:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemplo: manter cache de 1h aquecido com heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Exemplo: tráfego misto com estratégia de cache por agente

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # baseline padrão para a maioria dos agentes
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # manter cache longo aquecido para sessões profundas
    - id: "alerts"
      params:
        cacheRetention: "none" # evitar escritas de cache para notificações intermitentes
```

`agents.list[].params` faz merge sobre os `params` do modelo selecionado, então você pode
substituir apenas `cacheRetention` e herdar outros padrões do modelo sem alteração.

### Exemplo: habilitar cabeçalho beta de contexto 1M da Anthropic

A janela de contexto de 1M da Anthropic está atualmente limitada por beta. O OpenCraft pode injetar o
valor `anthropic-beta` necessário quando você habilita `context1m` em modelos Opus
ou Sonnet suportados.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Isso mapeia para o cabeçalho beta `context-1m-2025-08-07` da Anthropic.

Isso só se aplica quando `context1m: true` está definido naquela entrada de modelo.

Requisito: a credencial deve ser elegível para uso de contexto longo (cobrança por chave de API
ou assinatura com Extra Usage habilitado). Caso contrário, a Anthropic responde
com `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Se você autenticar Anthropic com tokens OAuth/assinatura (`sk-ant-oat-*`),
o OpenCraft pula o cabeçalho beta `context-1m-*` porque a Anthropic atualmente
rejeita essa combinação com HTTP 401.

## Dicas para reduzir pressão de tokens

- Use `/compact` para resumir sessões longas.
- Reduza saídas grandes de ferramentas nos seus workflows.
- Diminua `agents.defaults.imageMaxDimensionPx` para sessões pesadas em screenshots.
- Mantenha descrições de skills curtas (a lista de skills é injetada no prompt).
- Prefira modelos menores para trabalho verboso e exploratório.

Veja [Skills](/tools/skills) para a fórmula exata de overhead da lista de skills.
