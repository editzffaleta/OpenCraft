---
summary: "Sintaxe de diretivas para /think, /fast, /verbose e visibilidade de raciocínio"
read_when:
  - Ajustando thinking, modo rápido ou análise de diretivas verbose
title: "Níveis de Thinking"
---

# Níveis de Thinking (diretivas /think)

## O que faz

- Diretiva inline em qualquer corpo de mensagem recebida: `/t <nível>`, `/think:<nível>`, ou `/thinking <nível>`.
- Níveis (aliases): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (orçamento máximo)
  - xhigh → "ultrathink+" (apenas modelos GPT-5.2 + Codex)
  - adaptive → orçamento de raciocínio adaptativo gerenciado pelo provedor (suportado para a família de modelos Anthropic Claude 4.6)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` mapeiam para `xhigh`.
  - `highest`, `max` mapeiam para `high`.
- Notas por provedor:
  - Os modelos Anthropic Claude 4.6 padrão para `adaptive` quando nenhum nível explícito é definido.
  - Z.AI (`zai/*`) suporta apenas thinking binário (`on`/`off`). Qualquer nível não-`off` é tratado como `on` (mapeado para `low`).
  - Moonshot (`moonshot/*`) mapeia `/think off` para `thinking: { type: "disabled" }` e qualquer nível não-`off` para `thinking: { type: "enabled" }`. Com thinking ativo, o Moonshot aceita apenas `tool_choice` `auto|none`; o OpenCraft normaliza valores incompatíveis para `auto`.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se apenas àquela mensagem).
2. Override de sessão (definido enviando uma mensagem somente com a diretiva).
3. Padrão global (`agents.defaults.thinkingDefault` na configuração).
4. Fallback: `adaptive` para modelos Anthropic Claude 4.6, `low` para outros modelos com capacidade de raciocínio, `off` caso contrário.

## Definindo um padrão de sessão

- Envie uma mensagem que seja **apenas** a diretiva (espaços permitidos), ex.: `/think:medium` ou `/t high`.
- Isso persiste para a sessão atual (por remetente, por padrão); limpo por `/think:off` ou reset por inatividade da sessão.
- Uma resposta de confirmação é enviada (`Nível de thinking definido como high.` / `Thinking desativado.`). Se o nível for inválido (ex.: `/thinking absurdo`), o comando é rejeitado com uma dica e o estado da sessão não é alterado.
- Envie `/think` (ou `/think:`) sem argumento para ver o nível de thinking atual.

## Aplicação por agente

- **Pi embarcado**: o nível resolvido é passado para o runtime do agente Pi em processo.

## Modo rápido (/fast)

- Níveis: `on|off`.
- Mensagem somente com diretiva alterna o override de modo rápido da sessão e responde `Modo rápido ativado.` / `Modo rápido desativado.`.
- Envie `/fast` (ou `/fast status`) sem modo para ver o estado efetivo atual do modo rápido.
- O OpenCraft resolve o modo rápido nesta ordem:
  1. Inline/somente diretiva `/fast on|off`
  2. Override de sessão
  3. Configuração por modelo: `agents.defaults.models["<provedor>/<modelo>"].params.fastMode`
  4. Fallback: `off`
- Para `openai/*`, o modo rápido aplica o perfil rápido OpenAI: `service_tier=priority` quando suportado, mais baixo esforço de raciocínio e baixa verbosidade de texto.
- Para `openai-codex/*`, o modo rápido aplica o mesmo perfil de baixa latência nas Respostas Codex. O OpenCraft mantém um único toggle `/fast` compartilhado entre ambos os caminhos de autenticação.
- Para requisições diretas via API `anthropic/*`, o modo rápido mapeia para camadas de serviço Anthropic: `/fast on` define `service_tier=auto`, `/fast off` define `service_tier=standard_only`.
- O modo rápido Anthropic é exclusivo para chave de API. O OpenCraft pula a injeção de camada de serviço Anthropic para setup-token / autenticação OAuth do Claude e para URLs base de proxy não-Anthropic.

## Diretivas verbose (/verbose ou /v)

- Níveis: `on` (mínimo) | `full` | `off` (padrão).
- Mensagem somente com diretiva alterna o verbose da sessão e responde `Logging verbose ativado.` / `Logging verbose desativado.`; níveis inválidos retornam uma dica sem alterar o estado.
- `/verbose off` armazena um override explícito de sessão; limpe-o pela UI de Sessões escolhendo `inherit`.
- Diretiva inline afeta apenas aquela mensagem; padrões de sessão/global se aplicam caso contrário.
- Envie `/verbose` (ou `/verbose:`) sem argumento para ver o nível verbose atual.
- Com verbose ativo, agentes que emitem resultados de ferramentas estruturados (Pi, outros agentes JSON) enviam cada chamada de ferramenta de volta como sua própria mensagem somente de metadados, prefixada com `<emoji> <nome-da-ferramenta>: <arg>` quando disponível (caminho/comando). Esses resumos de ferramentas são enviados assim que cada ferramenta inicia (bolhas separadas), não como deltas de streaming.
- Resumos de falha de ferramenta permanecem visíveis no modo normal, mas sufixos com detalhes de erro brutos são ocultados a menos que verbose seja `on` ou `full`.
- Com verbose `full`, as saídas de ferramentas também são encaminhadas após a conclusão (bolha separada, truncada em tamanho seguro). Se você alternar `/verbose on|full|off` enquanto uma execução está em andamento, as bolhas de ferramentas subsequentes respeitam a nova configuração.

## Visibilidade do raciocínio (/reasoning)

- Níveis: `on|off|stream`.
- Mensagem somente com diretiva alterna se os blocos de thinking são mostrados nas respostas.
- Quando ativado, o raciocínio é enviado como uma **mensagem separada** prefixada com `Reasoning:`.
- `stream` (somente Telegram): transmite o raciocínio para a bolha de rascunho do Telegram enquanto a resposta é gerada, depois envia a resposta final sem o raciocínio.
- Alias: `/reason`.
- Envie `/reasoning` (ou `/reasoning:`) sem argumento para ver o nível de raciocínio atual.

## Relacionado

- Documentação do modo elevado em [Modo Elevado](/tools/elevated).

## Heartbeats

- O corpo do probe de heartbeat é o prompt de heartbeat configurado (padrão: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Diretivas inline em uma mensagem de heartbeat se aplicam normalmente (mas evite alterar padrões de sessão a partir de heartbeats).
- A entrega do heartbeat padrão é apenas o payload final. Para também enviar a mensagem separada `Reasoning:` (quando disponível), defina `agents.defaults.heartbeat.includeReasoning: true` ou por agente `agents.list[].heartbeat.includeReasoning: true`.

## Interface web de chat

- O seletor de thinking na interface de chat web espelha o nível armazenado da sessão no armazenamento/configuração da sessão de entrada quando a página carrega.
- Escolher outro nível aplica-se apenas à próxima mensagem (`thinkingOnce`); após enviar, o seletor volta para o nível de sessão armazenado.
- Para alterar o padrão da sessão, envie uma diretiva `/think:<nível>` (como antes); o seletor refletirá a mudança após o próximo recarregamento.
