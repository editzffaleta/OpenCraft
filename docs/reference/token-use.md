---
summary: "Como o OpenCraft constrói o contexto do prompt e reporta uso de tokens + custos"
read_when:
  - Explicando uso de tokens, custos ou janelas de contexto
  - Depurando crescimento de contexto ou comportamento de compactação
title: "Uso de Tokens e Custos"
---

# Uso de tokens e custos

O OpenCraft rastreia **tokens**, não caracteres. Os tokens são específicos do modelo, mas a maioria
dos modelos no estilo OpenAI tem uma média de ~4 caracteres por token para texto em inglês.

## Como o system prompt é construído

O OpenCraft monta seu próprio system prompt a cada execução. Ele inclui:

- Lista de tools + descrições curtas
- Lista de skills (apenas metadados; as instruções são carregadas sob demanda com `read`)
- Instruções de auto-atualização
- Workspace + arquivos de bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando novo, mais `MEMORY.md` quando presente ou `memory.md` como fallback em minúsculas). Arquivos grandes são truncados por `agents.defaults.bootstrapMaxChars` (padrão: 20000), e a injeção total de bootstrap é limitada por `agents.defaults.bootstrapTotalMaxChars` (padrão: 150000). Os arquivos `memory/*.md` são sob demanda via tools de memória e não são auto-injetados.
- Hora (UTC + fuso horário do usuário)
- Tags de resposta + comportamento de heartbeat
- Metadados de runtime (host/OS/modelo/pensamento)

Veja o detalhamento completo em [System Prompt](/concepts/system-prompt).

## O que conta na janela de contexto

Tudo que o modelo recebe conta para o limite de contexto:

- System prompt (todas as seções listadas acima)
- Histórico de conversa (mensagens de usuário + assistente)
- Tool calls e resultados de tool
- Anexos/transcritos (imagens, áudio, arquivos)
- Resumos de compactação e artefatos de poda
- Wrappers do provedor ou cabeçalhos de segurança (não visíveis, mas ainda contados)

Para imagens, o OpenCraft reduz payloads de imagem de transcript/tool antes das chamadas ao provedor.
Use `agents.defaults.imageMaxDimensionPx` (padrão: `1200`) para ajustar isso:

- Valores menores geralmente reduzem o uso de tokens de visão e o tamanho do payload.
- Valores maiores preservam mais detalhes visuais para screenshots com muito texto/UI.

Para um detalhamento prático (por arquivo injetado, tools, skills e tamanho do system prompt), use `/context list` ou `/context detail`. Veja [Contexto](/concepts/context).

## Como ver o uso atual de tokens

Use estes no chat:

- `/status` → **cartão de status rico em emojis** com o modelo da sessão, uso do contexto,
  tokens de entrada/saída da última resposta e **custo estimado** (somente chave de API).
- `/usage off|tokens|full` → adiciona um **rodapé de uso por resposta** a cada resposta.
  - Persiste por sessão (armazenado como `responseUsage`).
  - Auth OAuth **oculta o custo** (somente tokens).
- `/usage cost` → mostra um resumo de custo local dos logs de sessão do OpenCraft.

Outras superfícies:

- **TUI/Web TUI:** `/status` + `/usage` são suportados.
- **CLI:** `opencraft status --usage` e `opencraft channels list` mostram
  janelas de cota do provedor (não custos por resposta).

## Estimativa de custo (quando exibida)

Os custos são estimados a partir da sua configuração de preços do modelo:

```
models.providers.<provider>.models[].cost
```

Esses são **USD por 1M tokens** para `input`, `output`, `cacheRead` e
`cacheWrite`. Se os preços estiverem ausentes, o OpenCraft mostra apenas tokens. Tokens OAuth
nunca mostram custo em dólar.

## Impacto do TTL de cache e da poda

O cache de prompt do provedor só se aplica dentro da janela de TTL do cache. O OpenCraft pode
opcionalmente executar **poda cache-ttl**: ele poda a sessão assim que o TTL do cache
expirar, depois redefine a janela de cache para que requisições subsequentes possam reutilizar o contexto
recém-armazenado em cache em vez de rearmazenar todo o histórico. Isso mantém os custos de
escrita de cache mais baixos quando uma sessão fica inativa além do TTL.

Configure em [Configuração do Gateway](/gateway/configuration) e veja os
detalhes de comportamento em [Poda de Sessão](/concepts/session-pruning).

O heartbeat pode manter o cache **aquecido** durante lacunas de inatividade. Se o TTL do cache do seu modelo
for `1h`, definir o intervalo de heartbeat um pouco abaixo disso (ex: `55m`) pode evitar
rearmazenar em cache o prompt completo, reduzindo os custos de escrita de cache.

Em configurações multi-agente, você pode manter uma configuração de modelo compartilhada e ajustar o comportamento de cache
por agente com `agents.list[].params.cacheRetention`.

Para um guia controle por controle completo, veja [Cache de Prompt](/reference/prompt-caching).

Para preços da API da Anthropic, leituras de cache são significativamente mais baratas que tokens de entrada,
enquanto escritas de cache são cobradas a um multiplicador maior. Veja os preços de
cache de prompt da Anthropic para as taxas e multiplicadores de TTL mais recentes:
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
          cacheRetention: "long" # linha de base padrão para a maioria dos agentes
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # manter cache longo aquecido para sessões profundas
    - id: "alerts"
      params:
        cacheRetention: "none" # evitar escritas de cache para notificações com muita atividade
```

`agents.list[].params` mescla sobre os `params` do modelo selecionado, então você pode
sobrescrever apenas `cacheRetention` e herdar outros padrões do modelo inalterados.

### Exemplo: habilitar header beta de contexto 1M da Anthropic

A janela de contexto de 1M da Anthropic está atualmente em beta fechado. O OpenCraft pode injetar o
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

Isso mapeia para o header beta `context-1m-2025-08-07` da Anthropic.

Isso só se aplica quando `context1m: true` está definido nessa entrada do modelo.

Requisito: a credencial deve ser elegível para uso de contexto longo (cobrança por chave API,
ou assinatura com Extra Usage habilitado). Caso contrário, a Anthropic responde
com `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Se você autenticar Anthropic com tokens OAuth/assinatura (`sk-ant-oat-*`),
o OpenCraft pula o header beta `context-1m-*` porque a Anthropic atualmente
rejeita essa combinação com HTTP 401.

## Dicas para reduzir a pressão de tokens

- Use `/compact` para resumir sessões longas.
- Corte grandes saídas de tool nos seus fluxos de trabalho.
- Reduza `agents.defaults.imageMaxDimensionPx` para sessões com muitos screenshots.
- Mantenha as descrições de skills curtas (a lista de skills é injetada no prompt).
- Prefira modelos menores para trabalho verbose e exploratório.

Veja [Skills](/tools/skills) para a fórmula exata de overhead da lista de skills.
