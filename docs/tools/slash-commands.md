---
summary: "Slash commands: texto vs nativo, configuração e comandos suportados"
read_when:
  - Usando ou configurando comandos de chat
  - Depurando roteamento de comandos ou permissões
title: "Slash Commands"
---

# Slash commands

Comandos são tratados pelo Gateway. A maioria dos comandos deve ser enviada como uma mensagem **independente** que começa com `/`.
O comando de chat bash somente no host usa `! <cmd>` (com `/bash <cmd>` como alias).

Existem dois sistemas relacionados:

- **Comandos**: mensagens independentes `/...`.
- **Diretivas**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Diretivas são removidas da mensagem antes que o modelo a veja.
  - Em mensagens de chat normais (não somente diretivas), são tratadas como "dicas inline" e **não** persistem configurações de sessão.
  - Em mensagens somente de diretivas (a mensagem contém apenas diretivas), persistem na sessão e respondem com um reconhecimento.
  - Diretivas só são aplicadas para **remetentes autorizados**. Se `commands.allowFrom` estiver definido, é a única
    allowlist usada; caso contrário, a autorização vem de allowlists/emparelhamento de canal mais `commands.useAccessGroups`.
    Remetentes não autorizados veem diretivas tratadas como texto simples.

Também existem alguns **atalhos inline** (somente remetentes na allowlist/autorizados): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Eles são executados imediatamente, removidos antes que o modelo veja a mensagem, e o texto restante continua pelo fluxo normal.

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
      "*": ["usuario1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (padrão `true`) habilita análise de `/...` em mensagens de chat.
  - Em superfícies sem comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/MS Teams), comandos de texto ainda funcionam mesmo se você definir isso como `false`.
- `commands.native` (padrão `"auto"`) registra comandos nativos.
  - Auto: ativado para Discord/Telegram; desativado para Slack (até você adicionar slash commands); ignorado para provedores sem suporte nativo.
  - Defina `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` para sobrescrever por provedor (bool ou `"auto"`).
  - `false` limpa comandos previamente registrados no Discord/Telegram na inicialização. Comandos do Slack são gerenciados no app Slack e não são removidos automaticamente.
- `commands.nativeSkills` (padrão `"auto"`) registra comandos de **skill** nativamente quando suportado.
  - Auto: ativado para Discord/Telegram; desativado para Slack (Slack requer criar um slash command por skill).
  - Defina `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` para sobrescrever por provedor (bool ou `"auto"`).
- `commands.bash` (padrão `false`) habilita `! <cmd>` para rodar comandos de shell do host (`/bash <cmd>` é um alias; requer allowlists `tools.elevated`).
- `commands.bashForegroundMs` (padrão `2000`) controla quanto tempo o bash aguarda antes de mudar para modo background (`0` vai para background imediatamente).
- `commands.config` (padrão `false`) habilita `/config` (lê/escreve `opencraft.json`).
- `commands.debug` (padrão `false`) habilita `/debug` (overrides somente em runtime).
- `commands.allowFrom` (opcional) define uma allowlist por provedor para autorização de comandos. Quando configurado, é a
  única fonte de autorização para comandos e diretivas (allowlists/emparelhamento de canal e `commands.useAccessGroups`
  são ignorados). Use `"*"` para um padrão global; chaves específicas de provedor sobrescrevem.
- `commands.useAccessGroups` (padrão `true`) aplica allowlists/políticas para comandos quando `commands.allowFrom` não está definido.

## Lista de comandos

Texto + nativo (quando habilitado):

- `/help`
- `/commands`
- `/skill <nome> [entrada]` (executar uma skill pelo nome)
- `/status` (mostrar status atual; inclui uso/quota do provedor para o provedor de modelo atual quando disponível)
- `/allowlist` (listar/adicionar/remover entradas de allowlist)
- `/approve <id> allow-once|allow-always|deny` (resolver prompts de aprovação exec)
- `/context [list|detail|json]` (explicar "contexto"; `detail` mostra tamanho por arquivo + por tool + por skill + prompt do sistema)
- `/btw <pergunta>` (fazer uma pergunta lateral efêmera sobre a sessão atual sem alterar o contexto futuro; veja [/tools/btw](/tools/btw))
- `/export-session [caminho]` (alias: `/export`) (exportar sessão atual para HTML com prompt do sistema completo)
- `/whoami` (mostrar seu id de remetente; alias: `/id`)
- `/session idle <duração|off>` (gerenciar auto-unfocus por inatividade para bindings de thread focados)
- `/session max-age <duração|off>` (gerenciar auto-unfocus de max-age fixo para bindings de thread focados)
- `/subagents list|kill|log|info|send|steer|spawn` (inspecionar, controlar ou criar execuções de sub-agente para a sessão atual)
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions` (inspecionar e controlar sessões de runtime ACP)
- `/agents` (listar agentes vinculados a thread para esta sessão)
- `/focus <alvo>` (Discord: vincular esta thread, ou uma nova thread, a um alvo de sessão/subagente)
- `/unfocus` (Discord: remover o vínculo de thread atual)
- `/kill <id|#|all>` (abortar imediatamente um ou todos os sub-agentes em execução para esta sessão; sem mensagem de confirmação)
- `/steer <id|#> <mensagem>` (direcionar um sub-agente em execução imediatamente: em-execução quando possível, caso contrário abortar trabalho atual e reiniciar na mensagem de direcionamento)
- `/tell <id|#> <mensagem>` (alias para `/steer`)
- `/config show|get|set|unset` (persistir config em disco, somente owner; requer `commands.config: true`)
- `/debug show|set|unset|reset` (overrides de runtime, somente owner; requer `commands.debug: true`)
- `/usage off|tokens|full|cost` (rodapé de uso por resposta ou resumo de custo local)
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio` (controlar TTS; veja [/tts](/tts))
  - Discord: comando nativo é `/voice` (Discord reserva `/tts`); texto `/tts` ainda funciona.
- `/stop`
- `/restart`
- `/dock-telegram` (alias: `/dock_telegram`) (mudar respostas para Telegram)
- `/dock-discord` (alias: `/dock_discord`) (mudar respostas para Discord)
- `/dock-slack` (alias: `/dock_slack`) (mudar respostas para Slack)
- `/activation mention|always` (somente grupos)
- `/send on|off|inherit` (somente owner)
- `/reset` ou `/new [modelo]` (dica de modelo opcional; o restante é passado adiante)
- `/think <off|minimal|low|medium|high|xhigh>` (opções dinâmicas por modelo/provedor; aliases: `/thinking`, `/t`)
- `/fast status|on|off` (omitir o argumento mostra o estado efetivo atual do modo rápido)
- `/verbose on|full|off` (alias: `/v`)
- `/reasoning on|off|stream` (alias: `/reason`; quando on, envia uma mensagem separada prefixada com `Reasoning:`; `stream` = somente rascunho Telegram)
- `/elevated on|off|ask|full` (alias: `/elev`; `full` pula aprovações de exec)
- `/exec host=<sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` (enviar `/exec` para mostrar os valores atuais)
- `/model <nome>` (alias: `/models`; ou `/<alias>` de `agents.defaults.models.*.alias`)
- `/queue <modo>` (mais opções como `debounce:2s cap:25 drop:summarize`; enviar `/queue` para ver configurações atuais)
- `/bash <comando>` (somente host; alias para `! <comando>`; requer `commands.bash: true` + allowlists `tools.elevated`)

Somente texto:

- `/compact [instruções]` (veja [/concepts/compaction](/concepts/compaction))
- `! <comando>` (somente host; um de cada vez; use `!poll` + `!stop` para jobs de longa duração)
- `!poll` (verificar saída / status; aceita `sessionId` opcional; `/bash poll` também funciona)
- `!stop` (parar o job bash em execução; aceita `sessionId` opcional; `/bash stop` também funciona)

Notas:

- Comandos aceitam um `:` opcional entre o comando e os args (ex.: `/think: high`, `/send: on`, `/help:`).
- `/new <modelo>` aceita um alias de modelo, `provedor/modelo` ou um nome de provedor (correspondência fuzzy); se não houver correspondência, o texto é tratado como corpo da mensagem.
- Para breakdown completo de uso do provedor, use `opencraft status --usage`.
- `/allowlist add|remove` requer `commands.config=true` e honra `configWrites` do canal.
- Em canais multi-conta, `/allowlist --account <id>` e `/config set channels.<provedor>.accounts.<id>...` direcionados à config também honram o `configWrites` da conta alvo.
- `/usage` controla o rodapé de uso por resposta; `/usage cost` imprime um resumo de custo local dos logs de sessão do OpenCraft.
- `/restart` está habilitado por padrão; defina `commands.restart: false` para desabilitá-lo.
- Comando nativo somente Discord: `/vc join|leave|status` controla canais de voz (requer `channels.discord.voice` e comandos nativos; não disponível como texto).
- Comandos de vinculação de thread do Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requerem que bindings de thread efetivos estejam habilitados (`session.threadBindings.enabled` e/ou `channels.discord.threadBindings.enabled`).
- Referência de comandos ACP e comportamento de runtime: [ACP Agents](/tools/acp-agents).
- `/verbose` é destinado para depuração e visibilidade extra; mantenha **desativado** no uso normal.
- `/fast on|off` persiste um override de sessão. Use a opção `inherit` na UI de Sessões para limpá-lo e voltar aos padrões de config.
- Resumos de falha de tool ainda são mostrados quando relevantes, mas texto de falha detalhado só é incluído quando `/verbose` é `on` ou `full`.
- `/reasoning` (e `/verbose`) são arriscados em configurações de grupo: podem revelar raciocínio interno ou saída de tool que você não pretendia expor. Prefira deixá-los desativados, especialmente em chats em grupo.
- **Caminho rápido:** mensagens somente de comando de remetentes na allowlist são tratadas imediatamente (bypass de fila + modelo).
- **Gate de menção em grupo:** mensagens somente de comando de remetentes na allowlist contornam requisitos de menção.
- **Atalhos inline (somente remetentes na allowlist):** certos comandos também funcionam quando incorporados em uma mensagem normal e são removidos antes que o modelo veja o texto restante.
  - Exemplo: `ei /status` aciona uma resposta de status, e o texto restante continua pelo fluxo normal.
- Atualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Mensagens somente de comando não autorizadas são silenciosamente ignoradas, e tokens `/...` inline são tratados como texto simples.
- **Comandos de skill:** skills `user-invocable` são expostas como slash commands. Nomes são sanitizados para `a-z0-9_` (máx 32 chars); colisões recebem sufixos numéricos (ex.: `_2`).
  - `/skill <nome> [entrada]` executa uma skill pelo nome (útil quando limites de comando nativo impedem comandos por skill).
  - Por padrão, comandos de skill são encaminhados ao modelo como uma requisição normal.
  - Skills podem opcionalmente declarar `command-dispatch: tool` para rotear o comando diretamente para uma tool (determinístico, sem modelo).
  - Exemplo: `/prose` (plugin OpenProse) — veja [OpenProse](/prose).
- **Argumentos de comando nativo:** Discord usa autocomplete para opções dinâmicas (e menus de botão quando você omite args obrigatórios). Telegram e Slack mostram um menu de botão quando um comando suporta opções e você omite o arg.

## Superfícies de uso (o que aparece onde)

- **Uso/quota do provedor** (exemplo: "Claude 80% restante") aparece em `/status` para o provedor de modelo atual quando o rastreamento de uso está habilitado.
- **Tokens/custo por resposta** é controlado por `/usage off|tokens|full` (anexado às respostas normais).
- `/model status` é sobre **modelos/autenticação/endpoints**, não sobre uso.

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

## Overrides de debug

`/debug` permite definir overrides de config **somente em runtime** (memória, não disco). Somente owner. Desabilitado por padrão; habilite com `commands.debug: true`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[opencraft]"
/debug set channels.whatsapp.allowFrom=["+55111","+55222"]
/debug unset messages.responsePrefix
/debug reset
```

Notas:

- Overrides se aplicam imediatamente a novas leituras de config, mas **não** escrevem em `opencraft.json`.
- Use `/debug reset` para limpar todos os overrides e retornar à config em disco.

## Atualizações de config

`/config` escreve na sua config em disco (`opencraft.json`). Somente owner. Desabilitado por padrão; habilite com `commands.config: true`.

Exemplos:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[opencraft]"
/config unset messages.responsePrefix
```

Notas:

- A config é validada antes de escrever; mudanças inválidas são rejeitadas.
- Atualizações de `/config` persistem entre reinicializações.

## Notas de superfície

- **Comandos de texto** rodam na sessão de chat normal (DMs compartilham `main`, grupos têm sua própria sessão).
- **Comandos nativos** usam sessões isoladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefixo configurável via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (targets a sessão de chat via `CommandTargetSessionKey`)
- **`/stop`** targets a sessão de chat ativa para que possa abortar a execução atual.
- **Slack:** `channels.slack.slashCommand` ainda é suportado para um único comando no estilo `/opencraft`. Se você habilitar `commands.native`, deve criar um slash command Slack por comando embutido (mesmos nomes que `/help`). Menus de argumentos de comando para Slack são entregues como botões Block Kit efêmeros.
  - Exceção nativa Slack: registre `/agentstatus` (não `/status`) porque o Slack reserva `/status`. Texto `/status` ainda funciona em mensagens do Slack.

## Perguntas laterais BTW

`/btw` é uma **pergunta lateral** rápida sobre a sessão atual.

Diferente do chat normal:

- usa a sessão atual como contexto de fundo,
- roda como uma chamada one-shot separada **sem ferramentas**,
- não altera o contexto futuro da sessão,
- não é escrito no histórico de transcript,
- é entregue como um resultado lateral ao vivo em vez de uma mensagem normal do assistente.

Isso torna o `/btw` útil quando você quer uma clarificação temporária enquanto a tarefa principal continua.

Exemplo:

```text
/btw o que estamos fazendo agora?
```

Veja [Perguntas Laterais BTW](/tools/btw) para o comportamento completo e detalhes de UX do cliente.
