---
summary: "Slash commands: texto vs nativo, config e comandos suportados"
read_when:
  - Usando ou configurando comandos de chat
  - Depurando roteamento ou permissões de comandos
title: "Slash Commands"
---

# Slash commands

Comandos são tratados pelo Gateway. A maioria dos comandos deve ser enviada como uma mensagem **independente** que começa com `/`.
O comando bash apenas do host usa `! <cmd>` (com `/bash <cmd>` como alias).

Existem dois sistemas relacionados:

- **Comandos**: mensagens independentes `/...`.
- **Diretivas**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Diretivas são removidas da mensagem antes que o modelo as veja.
  - Em mensagens de chat normais (não apenas diretivas), são tratadas como "dicas inline" e **não** persistem configurações de sessão.
  - Em mensagens apenas de diretiva (a mensagem contém apenas diretivas), persistem na sessão e respondem com uma confirmação.
  - Diretivas são aplicadas apenas para **remetentes autorizados**. Se `commands.allowFrom` estiver definido, é a única
    allowlist usada; caso contrário, a autorização vem de allowlists/pareamento de canal mais `commands.useAccessGroups`.
    Remetentes não autorizados veem diretivas tratadas como texto simples.

Também existem alguns **atalhos inline** (apenas remetentes autorizados/na allowlist): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Eles executam imediatamente, são removidos antes que o modelo veja a mensagem, e o texto restante continua pelo fluxo normal.

## Config

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    debug: false,
    restart: false,
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (padrão `true`) habilita parsing de `/...` em mensagens de chat.
  - Em superfícies sem comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/MS Teams), comandos de texto ainda funcionam mesmo se você definir isso como `false`.
- `commands.native` (padrão `"auto"`) registra comandos nativos.
  - Auto: ligado para Discord/Telegram; desligado para Slack (até você adicionar slash commands); ignorado para provedores sem suporte nativo.
  - Defina `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` para substituir por provedor (bool ou `"auto"`).
  - `false` limpa comandos previamente registrados no Discord/Telegram na inicialização. Comandos do Slack são gerenciados no app Slack e não são removidos automaticamente.
- `commands.nativeSkills` (padrão `"auto"`) registra comandos de **Skill** nativamente quando suportado.
  - Auto: ligado para Discord/Telegram; desligado para Slack (Slack requer criar um slash command por Skill).
  - Defina `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` para substituir por provedor (bool ou `"auto"`).
- `commands.bash` (padrão `false`) habilita `! <cmd>` para executar comandos shell do host (`/bash <cmd>` é alias; requer allowlists de `tools.elevated`).
- `commands.bashForegroundMs` (padrão `2000`) controla quanto tempo bash espera antes de mudar para modo de segundo plano (`0` coloca em segundo plano imediatamente).
- `commands.config` (padrão `false`) habilita `/config` (lê/escreve `opencraft.json`).
- `commands.debug` (padrão `false`) habilita `/debug` (substituições apenas em runtime).
- `commands.allowFrom` (opcional) define uma allowlist por provedor para autorização de comandos. Quando configurado, é a
  única fonte de autorização para comandos e diretivas (allowlists/pareamento de canal e `commands.useAccessGroups`
  são ignorados). Use `"*"` para um padrão global; chaves específicas de provedor o substituem.
- `commands.useAccessGroups` (padrão `true`) aplica allowlists/políticas para comandos quando `commands.allowFrom` não está definido.

## Lista de comandos

Texto + nativo (quando habilitado):

- `/help`
- `/commands`
- `/skill <name> [input]` (executar uma Skill pelo nome)
- `/status` (mostrar status atual; inclui uso/cota do provedor para o provedor de modelo atual quando disponível)
- `/allowlist` (listar/adicionar/remover entradas de allowlist)
- `/approve <id> allow-once|allow-always|deny` (resolver prompts de aprovação exec)
- `/context [list|detail|json]` (explicar "contexto"; `detail` mostra tamanho por arquivo + por ferramenta + por Skill + system prompt)
- `/btw <question>` (fazer uma pergunta paralela efêmera sobre a sessão atual sem mudar contexto futuro da sessão; veja [/tools/btw](/tools/btw))
- `/export-session [path]` (alias: `/export`) (exportar sessão atual para HTML com system prompt completo)
- `/whoami` (mostrar seu id de remetente; alias: `/id`)
- `/session idle <duration|off>` (gerenciar auto-desvínculo por inatividade para vínculos de thread focados)
- `/session max-age <duration|off>` (gerenciar auto-desvínculo por idade máxima rígida para vínculos de thread focados)
- `/subagents list|kill|log|info|send|steer|spawn` (inspecionar, controlar ou gerar execuções de subagent para a sessão atual)
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions` (inspecionar e controlar sessões de runtime ACP)
- `/agents` (listar agentes vinculados a thread para esta sessão)
- `/focus <target>` (Discord: vincular esta thread, ou uma nova thread, a um alvo de sessão/subagent)
- `/unfocus` (Discord: remover o vínculo de thread atual)
- `/kill <id|#|all>` (abortar imediatamente um ou todos os sub-agents em execução para esta sessão; sem mensagem de confirmação)
- `/steer <id|#> <message>` (direcionar um subagent em execução imediatamente: durante a execução quando possível, caso contrário abortar trabalho atual e reiniciar na mensagem de direcionamento)
- `/tell <id|#> <message>` (alias para `/steer`)
- `/config show|get|set|unset` (persistir config em disco, apenas proprietário; requer `commands.config: true`)
- `/debug show|set|unset|reset` (substituições em runtime, apenas proprietário; requer `commands.debug: true`)
- `/usage off|tokens|full|cost` (rodapé de uso por resposta ou resumo de custo local)
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio` (controlar TTS; veja [/tts](/tts))
  - Discord: comando nativo é `/voice` (Discord reserva `/tts`); texto `/tts` ainda funciona.
- `/stop`
- `/restart`
- `/dock-telegram` (alias: `/dock_telegram`) (mudar respostas para Telegram)
- `/dock-discord` (alias: `/dock_discord`) (mudar respostas para Discord)
- `/dock-slack` (alias: `/dock_slack`) (mudar respostas para Slack)
- `/activation mention|always` (apenas grupos)
- `/send on|off|inherit` (apenas proprietário)
- `/reset` ou `/new [model]` (dica opcional de modelo; restante é passado adiante)
- `/think <off|minimal|low|medium|high|xhigh>` (escolhas dinâmicas por modelo/provedor; aliases: `/thinking`, `/t`)
- `/fast status|on|off` (omitir o arg mostra o estado efetivo atual do modo rápido)
- `/verbose on|full|off` (alias: `/v`)
- `/reasoning on|off|stream` (alias: `/reason`; quando ligado, envia mensagem separada prefixada com `Reasoning:`; `stream` = apenas rascunho do Telegram)
- `/elevated on|off|ask|full` (alias: `/elev`; `full` pula aprovações exec)
- `/exec host=<sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` (envie `/exec` para mostrar atual)
- `/model <name>` (alias: `/models`; ou `/<alias>` de `agents.defaults.models.*.alias`)
- `/queue <mode>` (mais opções como `debounce:2s cap:25 drop:summarize`; envie `/queue` para ver configurações atuais)
- `/bash <command>` (apenas host; alias para `! <command>`; requer `commands.bash: true` + allowlists de `tools.elevated`)

Apenas texto:

- `/compact [instructions]` (veja [/concepts/compaction](/concepts/compaction))
- `! <command>` (apenas host; um por vez; use `!poll` + `!stop` para jobs de longa duração)
- `!poll` (verificar saída / status; aceita `sessionId` opcional; `/bash poll` também funciona)
- `!stop` (parar o job bash em execução; aceita `sessionId` opcional; `/bash stop` também funciona)

Notas:

- Comandos aceitam `:` opcional entre o comando e args (ex. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` aceita alias de modelo, `provider/model` ou nome de provedor (correspondência fuzzy); se não houver correspondência, o texto é tratado como corpo da mensagem.
- Para detalhamento completo de uso do provedor, use `opencraft status --usage`.
- `/allowlist add|remove` requer `commands.config=true` e respeita `configWrites` do canal.
- Em canais multi-conta, `/allowlist --account <id>` direcionado à config e `/config set channels.<provider>.accounts.<id>...` também respeitam `configWrites` da conta alvo.
- `/usage` controla o rodapé de uso por resposta; `/usage cost` imprime um resumo de custo local dos logs de sessão do OpenCraft.
- `/restart` é habilitado por padrão; defina `commands.restart: false` para desabilitá-lo.
- Comando nativo apenas Discord: `/vc join|leave|status` controla canais de voz (requer `channels.discord.voice` e comandos nativos; não disponível como texto).
- Comandos de vínculo de thread do Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requerem que vínculos de thread efetivos estejam habilitados (`session.threadBindings.enabled` e/ou `channels.discord.threadBindings.enabled`).
- Referência de comandos ACP e comportamento de runtime: [ACP Agents](/tools/acp-agents).
- `/verbose` é destinado a depuração e visibilidade extra; mantenha **desligado** em uso normal.
- `/fast on|off` persiste uma substituição de sessão. Use a opção `inherit` na UI de Sessões para limpar e voltar aos padrões de config.
- Resumos de falha de ferramenta ainda são mostrados quando relevante, mas texto detalhado de falha só é incluído quando `/verbose` é `on` ou `full`.
- `/reasoning` (e `/verbose`) são arriscados em configurações de grupo: podem revelar raciocínio interno ou saída de ferramenta que você não pretendia expor. Prefira mantê-los desligados, especialmente em chats de grupo.
- **Caminho rápido:** mensagens apenas de comando de remetentes na allowlist são tratadas imediatamente (ignoram fila + modelo).
- **Gating de menção em grupo:** mensagens apenas de comando de remetentes na allowlist ignoram requisitos de menção.
- **Atalhos inline (apenas remetentes na allowlist):** certos comandos também funcionam quando embutidos em uma mensagem normal e são removidos antes que o modelo veja o texto restante.
  - Exemplo: `hey /status` dispara uma resposta de status, e o texto restante continua pelo fluxo normal.
- Atualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Mensagens apenas de comando não autorizadas são silenciosamente ignoradas, e tokens inline `/...` são tratados como texto simples.
- **Comandos de Skill:** Skills `user-invocable` são expostas como slash commands. Nomes são sanitizados para `a-z0-9_` (máximo 32 caracteres); colisões recebem sufixos numéricos (ex. `_2`).
  - `/skill <name> [input]` executa uma Skill pelo nome (útil quando limites de comandos nativos impedem comandos por Skill).
  - Por padrão, comandos de Skill são encaminhados ao modelo como uma requisição normal.
  - Skills podem opcionalmente declarar `command-dispatch: tool` para rotear o comando diretamente para uma ferramenta (determinístico, sem modelo).
  - Exemplo: `/prose` (Plugin OpenProse) -- veja [OpenProse](/prose).
- **Argumentos de comando nativo:** Discord usa autocomplete para opções dinâmicas (e menus de botão quando você omite args obrigatórios). Telegram e Slack mostram um menu de botão quando um comando suporta escolhas e você omite o arg.

## Superfícies de uso (o que aparece onde)

- **Uso/cota do provedor** (exemplo: "Claude 80% restante") aparece em `/status` para o provedor de modelo atual quando rastreamento de uso está habilitado.
- **Tokens/custo por resposta** é controlado por `/usage off|tokens|full` (anexado a respostas normais).
- `/model status` é sobre **modelos/auth/endpoints**, não uso.

## Seleção de modelo (`/model`)

`/model` é implementado como uma diretiva.

Exemplos:

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model opus@anthropic:default
/model status
```

Notas:

- `/model` e `/model list` mostram um seletor compacto e numerado (família de modelo + provedores disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com dropdowns de provedor e modelo mais uma etapa de Submit.
- `/model <#>` seleciona daquele seletor (e prefere o provedor atual quando possível).
- `/model status` mostra a visualização detalhada, incluindo endpoint do provedor configurado (`baseUrl`) e modo de API (`api`) quando disponível.

## Substituições de debug

`/debug` permite definir substituições de config **apenas em runtime** (memória, não disco). Apenas proprietário. Desabilitado por padrão; habilite com `commands.debug: true`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[opencraft]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Notas:

- Substituições se aplicam imediatamente a novas leituras de config, mas **não** escrevem no `opencraft.json`.
- Use `/debug reset` para limpar todas as substituições e voltar à config em disco.

## Atualizações de config

`/config` escreve na sua config em disco (`opencraft.json`). Apenas proprietário. Desabilitado por padrão; habilite com `commands.config: true`.

Exemplos:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[opencraft]"
/config unset messages.responsePrefix
```

Notas:

- Config é validada antes da escrita; alterações inválidas são rejeitadas.
- Atualizações `/config` persistem entre reinícios.

## Notas de superfície

- **Comandos de texto** rodam na sessão de chat normal (DMs compartilham `main`, grupos têm sua própria sessão).
- **Comandos nativos** usam sessões isoladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefixo configurável via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (aponta para a sessão do chat via `CommandTargetSessionKey`)
- **`/stop`** aponta para a sessão de chat ativa para poder abortar a execução atual.
- **Slack:** `channels.slack.slashCommand` ainda é suportado para um único comando estilo `/opencraft`. Se você habilitar `commands.native`, deve criar um slash command Slack por comando integrado (mesmos nomes que `/help`). Menus de argumento de comando para Slack são entregues como botões Block Kit efêmeros.
  - Exceção nativa do Slack: registre `/agentstatus` (não `/status`) porque Slack reserva `/status`. Texto `/status` ainda funciona em mensagens do Slack.

## Perguntas paralelas BTW

`/btw` é uma **pergunta paralela** rápida sobre a sessão atual.

Diferente do chat normal:

- usa a sessão atual como contexto de fundo,
- roda como uma chamada única separada **sem ferramentas**,
- não muda contexto futuro da sessão,
- não é escrita no histórico de transcrição,
- é entregue como resultado paralelo ao vivo em vez de mensagem normal do assistente.

Isso torna `/btw` útil quando você quer um esclarecimento temporário enquanto a tarefa principal
continua.

Exemplo:

```text
/btw what are we doing right now?
```

Veja [Perguntas Paralelas BTW](/tools/btw) para o comportamento completo e detalhes da UX do cliente.
