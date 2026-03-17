---
summary: "Sintaxe de diretiva para /think, /fast, /verbose e visibilidade de raciocínio"
read_when:
  - Ajustando parsing ou padrões de diretivas de thinking, modo rápido ou verbose
title: "Níveis de Thinking"
---

# Níveis de Thinking (diretivas /think)

## O que faz

- Diretiva inline em qualquer corpo de entrada: `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Níveis (aliases): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal -> "think"
  - low -> "think hard"
  - medium -> "think harder"
  - high -> "ultrathink" (orçamento máximo)
  - xhigh -> "ultrathink+" (apenas modelos GPT-5.2 + Codex)
  - adaptive -> orçamento de raciocínio adaptativo gerenciado pelo provedor (suportado para família de modelos Anthropic Claude 4.6)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` mapeiam para `xhigh`.
  - `highest`, `max` mapeiam para `high`.
- Notas de provedores:
  - Modelos Anthropic Claude 4.6 usam `adaptive` por padrão quando nenhum nível explícito de thinking é definido.
  - Z.AI (`zai/*`) suporta apenas thinking binário (`on`/`off`). Qualquer nível diferente de `off` é tratado como `on` (mapeado para `low`).
  - Moonshot (`moonshot/*`) mapeia `/think off` para `thinking: { type: "disabled" }` e qualquer nível diferente de `off` para `thinking: { type: "enabled" }`. Quando thinking está habilitado, Moonshot aceita apenas `tool_choice` `auto|none`; o OpenCraft normaliza valores incompatíveis para `auto`.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se apenas àquela mensagem).
2. Substituição de sessão (definida enviando uma mensagem apenas de diretiva).
3. Padrão global (`agents.defaults.thinkingDefault` na config).
4. Fallback: `adaptive` para modelos Anthropic Claude 4.6, `low` para outros modelos com capacidade de raciocínio, `off` caso contrário.

## Definindo um padrão de sessão

- Envie uma mensagem que seja **apenas** a diretiva (espaço em branco permitido), ex. `/think:medium` ou `/t high`.
- Isso persiste para a sessão atual (por remetente por padrão); limpo com `/think:off` ou reset por inatividade da sessão.
- Resposta de confirmação é enviada (`Thinking level set to high.` / `Thinking disabled.`). Se o nível for inválido (ex. `/thinking big`), o comando é rejeitado com uma dica e o estado da sessão permanece inalterado.
- Envie `/think` (ou `/think:`) sem argumento para ver o nível de thinking atual.

## Aplicação por agente

- **Pi Embutido**: o nível resolvido é passado para o runtime do agente Pi em processo.

## Modo rápido (/fast)

- Níveis: `on|off`.
- Mensagem apenas de diretiva alterna uma substituição de modo rápido da sessão e responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envie `/fast` (ou `/fast status`) sem modo para ver o estado efetivo atual do modo rápido.
- O OpenCraft resolve o modo rápido nesta ordem:
  1. Inline/diretiva-apenas `/fast on|off`
  2. Substituição de sessão
  3. Config por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  4. Fallback: `off`
- Para `openai/*`, modo rápido aplica o perfil rápido OpenAI: `service_tier=priority` quando suportado, mais esforço de raciocínio baixo e verbosidade de texto baixa.
- Para `openai-codex/*`, modo rápido aplica o mesmo perfil de baixa latência em Codex Responses. O OpenCraft mantém um toggle `/fast` compartilhado entre ambos os caminhos de autenticação.
- Para requisições diretas de chave de API `anthropic/*`, modo rápido mapeia para níveis de serviço Anthropic: `/fast on` define `service_tier=auto`, `/fast off` define `service_tier=standard_only`.
- Modo rápido Anthropic é apenas para chave de API. O OpenCraft pula a injeção de nível de serviço Anthropic para autenticação via setup-token / OAuth do Claude e para base URLs de proxy não-Anthropic.

## Diretivas verbose (/verbose ou /v)

- Níveis: `on` (mínimo) | `full` | `off` (padrão).
- Mensagem apenas de diretiva alterna verbose da sessão e responde `Verbose logging enabled.` / `Verbose logging disabled.`; níveis inválidos retornam uma dica sem mudar o estado.
- `/verbose off` armazena uma substituição de sessão explícita; limpe via UI de Sessões escolhendo `inherit`.
- Diretiva inline afeta apenas aquela mensagem; padrões de sessão/globais se aplicam caso contrário.
- Envie `/verbose` (ou `/verbose:`) sem argumento para ver o nível verbose atual.
- Quando verbose está ligado, agentes que emitem resultados estruturados de ferramenta (Pi, outros agentes JSON) enviam cada chamada de ferramenta como sua própria mensagem apenas de metadados, prefixada com `<emoji> <tool-name>: <arg>` quando disponível (caminho/comando). Esses resumos de ferramenta são enviados assim que cada ferramenta inicia (bolhas separadas), não como deltas de streaming.
- Resumos de falha de ferramenta permanecem visíveis no modo normal, mas sufixos de detalhe de erro bruto ficam ocultos a menos que verbose seja `on` ou `full`.
- Quando verbose é `full`, saídas de ferramenta também são encaminhadas após conclusão (bolha separada, truncada para comprimento seguro). Se você alternar `/verbose on|full|off` enquanto uma execução está em andamento, bolhas de ferramenta subsequentes honram a nova configuração.

## Visibilidade de raciocínio (/reasoning)

- Níveis: `on|off|stream`.
- Mensagem apenas de diretiva alterna se blocos de thinking são mostrados nas respostas.
- Quando habilitado, raciocínio é enviado como uma **mensagem separada** prefixada com `Reasoning:`.
- `stream` (apenas Telegram): transmite raciocínio na bolha de rascunho do Telegram enquanto a resposta é gerada, depois envia a resposta final sem raciocínio.
- Alias: `/reason`.
- Envie `/reasoning` (ou `/reasoning:`) sem argumento para ver o nível de raciocínio atual.

## Relacionado

- Documentação do modo elevado está em [Modo elevado](/tools/elevated).

## Heartbeats

- O corpo de probe de heartbeat é o prompt de heartbeat configurado (padrão: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Diretivas inline em uma mensagem de heartbeat se aplicam como de costume (mas evite mudar padrões de sessão a partir de heartbeats).
- A entrega de heartbeat usa por padrão apenas o payload final. Para também enviar a mensagem separada `Reasoning:` (quando disponível), defina `agents.defaults.heartbeat.includeReasoning: true` ou por agente `agents.list[].heartbeat.includeReasoning: true`.

## UI de web chat

- O seletor de thinking do web chat espelha o nível armazenado da sessão do armazenamento/config de sessão de entrada quando a página carrega.
- Escolher outro nível se aplica apenas à próxima mensagem (`thinkingOnce`); após enviar, o seletor volta ao nível armazenado da sessão.
- Para mudar o padrão da sessão, envie uma diretiva `/think:<level>` (como antes); o seletor refletirá após o próximo reload.
