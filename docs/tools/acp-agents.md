---
summary: "Usar sessões de runtime ACP para Pi, Claude Code, Codex, OpenCode, Gemini CLI e outros agentes de harness"
read_when:
  - Executando harnesses de codificação via ACP
  - Configurando sessões ACP vinculadas a threads em canais com suporte a threads
  - Vinculando canais do Discord ou tópicos de fórum do Telegram a sessões ACP persistentes
  - Solucionando problemas de backend ACP e conexão de Plugin
  - Operando comandos /acp a partir do chat
title: "ACP Agents"
---

# ACP agents

Sessões do [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permitem que o OpenCraft execute harnesses de codificação externos (por exemplo Pi, Claude Code, Codex, OpenCode e Gemini CLI) por meio de um Plugin de backend ACP.

Se você pedir ao OpenCraft em linguagem natural para "executar isso no Codex" ou "iniciar Claude Code em uma thread", o OpenCraft deve direcionar essa solicitação para o runtime ACP (não para o runtime nativo de subagent).

## Fluxo rápido para operadores

Use quando você quiser um roteiro prático de `/acp`:

1. Iniciar uma sessão:
   - `/acp spawn codex --mode persistent --thread auto`
2. Trabalhar na thread vinculada (ou apontar para aquela chave de sessão explicitamente).
3. Verificar o estado do runtime:
   - `/acp status`
4. Ajustar opções do runtime conforme necessário:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Dar um direcionamento a uma sessão ativa sem substituir o contexto:
   - `/acp steer tighten logging and continue`
6. Encerrar o trabalho:
   - `/acp cancel` (parar o turno atual), ou
   - `/acp close` (fechar sessão + remover vínculos)

## Início rápido para humanos

Exemplos de solicitações naturais:

- "Inicie uma sessão Codex persistente em uma thread aqui e mantenha o foco."
- "Execute isso como uma sessão ACP de Claude Code única e resuma o resultado."
- "Use Gemini CLI para esta tarefa em uma thread, depois mantenha os acompanhamentos nessa mesma thread."

O que o OpenCraft deve fazer:

1. Escolher `runtime: "acp"`.
2. Resolver o harness alvo solicitado (`agentId`, por exemplo `codex`).
3. Se o vínculo de thread for solicitado e o canal atual suportar, vincular a sessão ACP à thread.
4. Direcionar mensagens subsequentes da thread para a mesma sessão ACP até desvincular/fechar/expirar.

## ACP versus subagents

Use ACP quando quiser um runtime de harness externo. Use subagents quando quiser execuções delegadas nativas do OpenCraft.

| Área                | Sessão ACP                           | Execução de subagent                    |
| ------------------- | ------------------------------------ | --------------------------------------- |
| Runtime             | Plugin de backend ACP (por ex. acpx) | Runtime nativo de subagent do OpenCraft |
| Chave de sessão     | `agent:<agentId>:acp:<uuid>`         | `agent:<agentId>:subagent:<uuid>`       |
| Comandos principais | `/acp ...`                           | `/subagents ...`                        |
| Ferramenta de spawn | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão)       |

Veja também [Sub-agents](/tools/subagents).

## Sessões vinculadas a threads (agnóstico de canal)

Quando os vínculos de thread estão habilitados para um adaptador de canal, sessões ACP podem ser vinculadas a threads:

- O OpenCraft vincula uma thread a uma sessão ACP alvo.
- Mensagens subsequentes naquela thread são direcionadas para a sessão ACP vinculada.
- A saída do ACP é entregue de volta na mesma thread.
- Desvincular/fechar/arquivar/expiração por tempo ocioso ou idade máxima remove o vínculo.

O suporte a vínculo de thread é específico do adaptador. Se o adaptador de canal ativo não suportar vínculos de thread, o OpenCraft retorna uma mensagem clara de não suportado/indisponível.

Flags de funcionalidade necessárias para ACP vinculado a thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` está ativado por padrão (defina `false` para pausar o dispatch ACP)
- Flag de spawn de thread ACP do adaptador de canal habilitada (específico do adaptador)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canais com suporte a threads

- Qualquer adaptador de canal que exponha capacidade de vínculo de sessão/thread.
- Suporte integrado atual:
  - Threads/canais do Discord
  - Tópicos do Telegram (tópicos de fórum em grupos/supergrupos e tópicos de DM)
- Canais de Plugin podem adicionar suporte através da mesma interface de vínculo.

## Configurações específicas de canal

Para fluxos de trabalho não efêmeros, configure vínculos ACP persistentes nas entradas `bindings[]` de nível superior.

### Modelo de vínculo

- `bindings[].type="acp"` marca um vínculo de conversa ACP persistente.
- `bindings[].match` identifica a conversa alvo:
  - Canal ou thread do Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Tópico de fórum do Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- `bindings[].agentId` é o id do agente OpenCraft proprietário.
- Substituições opcionais do ACP ficam em `bindings[].acp`:
  - `mode` (`persistent` ou `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Padrões de runtime por agente

Use `agents.list[].runtime` para definir padrões ACP uma vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id do harness, por exemplo `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Precedência de substituição para sessões ACP vinculadas:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Padrões globais do ACP (por exemplo `acp.backend`)

Exemplo:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/opencraft",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Comportamento:

- O OpenCraft garante que a sessão ACP configurada existe antes do uso.
- Mensagens naquele canal ou tópico são direcionadas para a sessão ACP configurada.
- Em conversas vinculadas, `/new` e `/reset` reiniciam a mesma chave de sessão ACP.
- Vínculos de runtime temporários (por exemplo criados por fluxos de foco de thread) ainda se aplicam quando presentes.

## Iniciar sessões ACP (interfaces)

### A partir de `sessions_spawn`

Use `runtime: "acp"` para iniciar uma sessão ACP a partir de um turno de agente ou chamada de ferramenta.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Notas:

- `runtime` é `subagent` por padrão, então defina `runtime: "acp"` explicitamente para sessões ACP.
- Se `agentId` for omitido, o OpenCraft usa `acp.defaultAgent` quando configurado.
- `mode: "session"` requer `thread: true` para manter uma conversa vinculada persistente.

Detalhes da interface:

- `task` (obrigatório): prompt inicial enviado para a sessão ACP.
- `runtime` (obrigatório para ACP): deve ser `"acp"`.
- `agentId` (opcional): id do harness alvo ACP. Recorre a `acp.defaultAgent` se definido.
- `thread` (opcional, padrão `false`): solicita fluxo de vínculo de thread quando suportado.
- `mode` (opcional): `run` (único) ou `session` (persistente).
  - padrão é `run`
  - se `thread: true` e mode omitido, o OpenCraft pode usar comportamento persistente por padrão conforme o caminho do runtime
  - `mode: "session"` requer `thread: true`
- `cwd` (opcional): diretório de trabalho do runtime solicitado (validado pela política do backend/runtime).
- `label` (opcional): rótulo voltado ao operador usado no texto de sessão/banner.
- `resumeSessionId` (opcional): retomar uma sessão ACP existente em vez de criar uma nova. O agente reproduz o histórico de conversa via `session/load`. Requer `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resumos de progresso da execução ACP inicial de volta para a sessão solicitante como eventos de sistema.
  - Quando disponível, respostas aceitas incluem `streamLogPath` apontando para um log JSONL com escopo de sessão (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para o histórico completo de retransmissão.

### Retomar uma sessão existente

Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de começar do zero. O agente reproduz o histórico de conversa via `session/load`, então retoma com o contexto completo do que veio antes.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casos de uso comuns:

- Transferir uma sessão Codex do seu laptop para o celular — diga ao seu agente para retomar de onde parou
- Continuar uma sessão de codificação que você iniciou interativamente na CLI, agora de forma headless pelo seu agente
- Retomar trabalho que foi interrompido por reinício do Gateway ou tempo ocioso

Notas:

- `resumeSessionId` requer `runtime: "acp"` — retorna erro se usado com o runtime de subagent.
- `resumeSessionId` restaura o histórico de conversa ACP upstream; `thread` e `mode` ainda se aplicam normalmente à nova sessão OpenCraft que você está criando, então `mode: "session"` ainda requer `thread: true`.
- O agente alvo deve suportar `session/load` (Codex e Claude Code suportam).
- Se o id da sessão não for encontrado, o spawn falha com um erro claro — sem fallback silencioso para uma nova sessão.

### Teste de fumaça do operador

Use isso após um deploy do Gateway quando quiser uma verificação rápida ao vivo de que o spawn ACP
está realmente funcionando de ponta a ponta, não apenas passando nos testes unitários.

Gate recomendado:

1. Verifique a versão/commit do Gateway implantado no host alvo.
2. Confirme que o código-fonte implantado inclui a aceitação de linhagem ACP em
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Abra uma sessão de ponte ACPX temporária para um agente ao vivo (por exemplo
   `razor(main)` em `jpclawhq`).
4. Peça a esse agente para chamar `sessions_spawn` com:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifique se o agente reporta:
   - `accepted=yes`
   - uma `childSessionKey` real
   - sem erro de validação
6. Encerre a sessão de ponte ACPX temporária.

Exemplo de prompt para o agente ao vivo:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Notas:

- Mantenha este teste de fumaça em `mode: "run"` a menos que você esteja intencionalmente testando
  sessões ACP persistentes vinculadas a thread.
- Não exija `streamTo: "parent"` para o gate básico. Esse caminho depende de
  capacidades do solicitante/sessão e é uma verificação de integração separada.
- Trate o teste de `mode: "session"` vinculado a thread como uma segunda passagem de integração
  mais rica a partir de uma thread real do Discord ou tópico do Telegram.

## Compatibilidade com sandbox

Sessões ACP atualmente são executadas no runtime do host, não dentro do sandbox do OpenCraft.

Limitações atuais:

- Se a sessão solicitante estiver em sandbox, spawns ACP são bloqueados tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
  - Erro: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` com `runtime: "acp"` não suporta `sandbox: "require"`.
  - Erro: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Use `runtime: "subagent"` quando precisar de execução com sandbox obrigatório.

### A partir do comando `/acp`

Use `/acp spawn` para controle explícito do operador via chat quando necessário.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --thread here
```

Flags principais:

- `--mode persistent|oneshot`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Veja [Slash Commands](/tools/slash-commands).

## Resolução do alvo da sessão

A maioria das ações `/acp` aceita um alvo de sessão opcional (`session-key`, `session-id` ou `session-label`).

Ordem de resolução:

1. Argumento de alvo explícito (ou `--session` para `/acp steer`)
   - tenta chave
   - depois id de sessão em formato UUID
   - depois label
2. Vínculo de thread atual (se esta conversa/thread estiver vinculada a uma sessão ACP)
3. Fallback para sessão solicitante atual

Se nenhum alvo for resolvido, o OpenCraft retorna um erro claro (`Unable to resolve session target: ...`).

## Modos de thread no spawn

`/acp spawn` suporta `--thread auto|here|off`.

| Modo   | Comportamento                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------ |
| `auto` | Em uma thread ativa: vincular aquela thread. Fora de uma thread: criar/vincular uma thread filha quando suportado. |
| `here` | Requer thread ativa atual; falha se não estiver em uma.                                                            |
| `off`  | Sem vínculo. Sessão inicia desvinculada.                                                                           |

Notas:

- Em superfícies sem vínculo de thread, o comportamento padrão é efetivamente `off`.
- Spawn vinculado a thread requer suporte de política do canal:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

## Controles ACP

Família de comandos disponíveis:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` mostra as opções efetivas do runtime e, quando disponível, tanto identificadores de sessão no nível do runtime quanto no nível do backend.

Alguns controles dependem das capacidades do backend. Se um backend não suportar um controle, o OpenCraft retorna um erro claro de controle não suportado.

## Livro de receitas de comandos ACP

| Comando              | O que faz                                                      | Exemplo                                                        |
| -------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| `/acp spawn`         | Criar sessão ACP; vínculo de thread opcional.                  | `/acp spawn codex --mode persistent --thread auto --cwd /repo` |
| `/acp cancel`        | Cancelar turno em andamento para sessão alvo.                  | `/acp cancel agent:codex:acp:<uuid>`                           |
| `/acp steer`         | Enviar instrução de direcionamento para sessão em execução.    | `/acp steer --session support inbox prioritize failing tests`  |
| `/acp close`         | Fechar sessão e desvincular alvos de thread.                   | `/acp close`                                                   |
| `/acp status`        | Mostrar backend, modo, estado, opções do runtime, capacidades. | `/acp status`                                                  |
| `/acp set-mode`      | Definir modo do runtime para sessão alvo.                      | `/acp set-mode plan`                                           |
| `/acp set`           | Escrita genérica de opção de config do runtime.                | `/acp set model openai/gpt-5.2`                                |
| `/acp cwd`           | Definir substituição do diretório de trabalho do runtime.      | `/acp cwd /Users/user/Projects/repo`                           |
| `/acp permissions`   | Definir perfil de política de aprovação.                       | `/acp permissions strict`                                      |
| `/acp timeout`       | Definir timeout do runtime (segundos).                         | `/acp timeout 120`                                             |
| `/acp model`         | Definir substituição de modelo do runtime.                     | `/acp model anthropic/claude-opus-4-5`                         |
| `/acp reset-options` | Remover substituições de opções do runtime da sessão.          | `/acp reset-options`                                           |
| `/acp sessions`      | Listar sessões ACP recentes do armazenamento.                  | `/acp sessions`                                                |
| `/acp doctor`        | Saúde do backend, capacidades, correções acionáveis.           | `/acp doctor`                                                  |
| `/acp install`       | Imprimir etapas determinísticas de instalação e habilitação.   | `/acp install`                                                 |

`/acp sessions` lê o armazenamento para a sessão vinculada ou solicitante atual. Comandos que aceitam tokens `session-key`, `session-id` ou `session-label` resolvem alvos através da descoberta de sessão do Gateway, incluindo raízes `session.store` personalizadas por agente.

## Mapeamento de opções do runtime

`/acp` tem comandos de conveniência e um setter genérico.

Operações equivalentes:

- `/acp model <id>` mapeia para a chave de config do runtime `model`.
- `/acp permissions <profile>` mapeia para a chave de config do runtime `approval_policy`.
- `/acp timeout <seconds>` mapeia para a chave de config do runtime `timeout`.
- `/acp cwd <path>` atualiza a substituição de cwd do runtime diretamente.
- `/acp set <key> <value>` é o caminho genérico.
  - Caso especial: `key=cwd` usa o caminho de substituição de cwd.
- `/acp reset-options` limpa todas as substituições do runtime para a sessão alvo.

## Suporte ao harness acpx (atual)

Aliases de harness integrados do acpx atuais:

- `pi`
- `claude`
- `codex`
- `opencode`
- `gemini`
- `kimi`

Quando o OpenCraft usa o backend acpx, prefira esses valores para `agentId` a menos que sua configuração acpx defina aliases de agente personalizados.

O uso direto da CLI acpx também pode apontar para adaptadores arbitrários via `--agent <command>`, mas essa saída de escape é uma funcionalidade da CLI acpx (não o caminho normal de `agentId` do OpenCraft).

## Config necessária

Linha de base ACP principal:

```json5
{
  acp: {
    enabled: true,
    // Opcional. Padrão é true; defina false para pausar o dispatch ACP mantendo os controles /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: ["pi", "claude", "codex", "opencode", "gemini", "kimi"],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Config de vínculo de thread é específica do adaptador de canal. Exemplo para Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Se o spawn ACP vinculado a thread não funcionar, verifique a flag de funcionalidade do adaptador primeiro:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Veja [Referência de Configuração](/gateway/configuration-reference).

## Configuração do Plugin para backend acpx

Instalar e habilitar o Plugin:

```bash
opencraft plugins install acpx
opencraft config set plugins.entries.acpx.enabled true
```

Instalação local no workspace durante desenvolvimento:

```bash
opencraft plugins install ./extensions/acpx
```

Depois verifique a saúde do backend:

```text
/acp doctor
```

### Configuração de comando e versão do acpx

Por padrão, o Plugin acpx (publicado como `@opencraft/acpx`) usa o binário fixado local do Plugin:

1. O comando padrão é `extensions/acpx/node_modules/.bin/acpx`.
2. A versão esperada padrão é o pin da extensão.
3. Na inicialização, registra o backend ACP imediatamente como não pronto.
4. Um job de verificação em segundo plano verifica `acpx --version`.
5. Se o binário local do Plugin estiver ausente ou incompatível, executa:
   `npm install --omit=dev --no-save acpx@<pinned>` e verifica novamente.

Você pode substituir comando/versão na configuração do Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

Notas:

- `command` aceita caminho absoluto, caminho relativo ou nome de comando (`acpx`).
- Caminhos relativos são resolvidos a partir do diretório do workspace do OpenCraft.
- `expectedVersion: "any"` desabilita a correspondência estrita de versão.
- Quando `command` aponta para um binário/caminho personalizado, a instalação automática local do Plugin é desabilitada.
- A inicialização do OpenCraft permanece não-bloqueante enquanto a verificação de saúde do backend é executada.

Veja [Plugins](/tools/plugin).

## Configuração de permissões

Sessões ACP são executadas de forma não interativa — não há TTY para aprovar ou negar prompts de permissão de escrita de arquivo e exec de shell. O Plugin acpx fornece duas chaves de config que controlam como as permissões são tratadas:

### `permissionMode`

Controla quais operações o agente harness pode realizar sem solicitar aprovação.

| Valor           | Comportamento                                                     |
| --------------- | ----------------------------------------------------------------- |
| `approve-all`   | Auto-aprovar todas as escritas de arquivo e comandos shell.       |
| `approve-reads` | Auto-aprovar apenas leituras; escritas e exec requerem aprovação. |
| `deny-all`      | Negar todos os prompts de permissão.                              |

### `nonInteractivePermissions`

Controla o que acontece quando um prompt de permissão seria exibido mas nenhum TTY interativo está disponível (que é sempre o caso para sessões ACP).

| Valor  | Comportamento                                                        |
| ------ | -------------------------------------------------------------------- |
| `fail` | Abortar a sessão com `AcpRuntimeError`. **(padrão)**                 |
| `deny` | Negar silenciosamente a permissão e continuar (degradação graciosa). |

### Configuração

Defina via config do Plugin:

```bash
opencraft config set plugins.entries.acpx.config.permissionMode approve-all
opencraft config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o Gateway após alterar esses valores.

> **Importante:** O OpenCraft atualmente usa `permissionMode=approve-reads` e `nonInteractivePermissions=fail` como padrão. Em sessões ACP não interativas, qualquer escrita ou exec que dispare um prompt de permissão pode falhar com `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se você precisar restringir permissões, defina `nonInteractivePermissions` para `deny` para que as sessões degradem graciosamente em vez de travar.

## Solução de problemas

| Sintoma                                                                  | Causa provável                                                                        | Correção                                                                                                                                                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                  | Plugin de backend ausente ou desabilitado.                                            | Instale e habilite o Plugin de backend, depois execute `/acp doctor`.                                                                                                                   |
| `ACP is disabled by policy (acp.enabled=false)`                          | ACP desabilitado globalmente.                                                         | Defina `acp.enabled=true`.                                                                                                                                                              |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`        | Dispatch a partir de mensagens normais de thread desabilitado.                        | Defina `acp.dispatch.enabled=true`.                                                                                                                                                     |
| `ACP agent "<id>" is not allowed by policy`                              | Agente não está na allowlist.                                                         | Use um `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                                             |
| `Unable to resolve session target: ...`                                  | Token de chave/id/label inválido.                                                     | Execute `/acp sessions`, copie a chave/label exata, tente novamente.                                                                                                                    |
| `--thread here requires running /acp spawn inside an active ... thread`  | `--thread here` usado fora de um contexto de thread.                                  | Mova para a thread alvo ou use `--thread auto`/`off`.                                                                                                                                   |
| `Only <user-id> can rebind this thread.`                                 | Outro usuário é dono do vínculo de thread.                                            | Revincule como proprietário ou use uma thread diferente.                                                                                                                                |
| `Thread bindings are unavailable for <channel>.`                         | Adaptador não tem capacidade de vínculo de thread.                                    | Use `--thread off` ou mude para adaptador/canal suportado.                                                                                                                              |
| `Sandboxed sessions cannot spawn ACP sessions ...`                       | Runtime ACP é do lado do host; sessão solicitante está em sandbox.                    | Use `runtime="subagent"` de sessões em sandbox, ou execute spawn ACP de uma sessão sem sandbox.                                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`  | `sandbox="require"` solicitado para runtime ACP.                                      | Use `runtime="subagent"` para sandbox obrigatório, ou use ACP com `sandbox="inherit"` de uma sessão sem sandbox.                                                                        |
| Metadados ACP ausentes para sessão vinculada                             | Metadados de sessão ACP obsoletos/excluídos.                                          | Recrie com `/acp spawn`, depois revincule/foque a thread.                                                                                                                               |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` bloqueia escritas/exec em sessão ACP não interativa.                 | Defina `plugins.entries.acpx.config.permissionMode` para `approve-all` e reinicie o Gateway. Veja [Configuração de permissões](#configuração-de-permissões).                            |
| Sessão ACP falha cedo com pouca saída                                    | Prompts de permissão são bloqueados por `permissionMode`/`nonInteractivePermissions`. | Verifique os logs do Gateway para `AcpRuntimeError`. Para permissões completas, defina `permissionMode=approve-all`; para degradação graciosa, defina `nonInteractivePermissions=deny`. |
| Sessão ACP trava indefinidamente após concluir o trabalho                | Processo do harness terminou mas sessão ACP não reportou conclusão.                   | Monitore com `ps aux \| grep acpx`; encerre processos obsoletos manualmente.                                                                                                            |
