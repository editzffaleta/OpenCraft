---
summary: "Usar sessões de runtime ACP para Pi, Claude Code, Codex, OpenCode, Gemini CLI e outros agentes harness"
read_when:
  - Executando harnesses de coding através do ACP
  - Configurando sessões ACP vinculadas a thread em canais com suporte a threads
  - Vinculando canais Discord ou tópicos de fórum Telegram a sessões ACP persistentes
  - Solucionando problemas de backend ACP e fiação de plugin
  - Operando comandos /acp do chat
title: "ACP Agents"
---

# ACP agents

Sessões [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permitem ao OpenCraft executar harnesses de coding externos (por exemplo Pi, Claude Code, Codex, OpenCode e Gemini CLI) através de um plugin de backend ACP.

Se você pedir ao OpenCraft em linguagem simples para "rodar isso no Codex" ou "iniciar Claude Code em uma thread", o OpenCraft deve rotear essa requisição para o runtime ACP (não o runtime nativo de sub-agente).

## Fluxo rápido do operador

Use quando você quer um runbook prático de `/acp`:

1. Criar uma sessão:
   - `/acp spawn codex --mode persistent --thread auto`
2. Trabalhar na thread vinculada (ou direcionar aquela chave de sessão explicitamente).
3. Verificar o estado do runtime:
   - `/acp status`
4. Ajustar opções de runtime conforme necessário:
   - `/acp model <provedor/modelo>`
   - `/acp permissions <perfil>`
   - `/acp timeout <segundos>`
5. Direcionar uma sessão ativa sem substituir o contexto:
   - `/acp steer aperte o logging e continue`
6. Parar o trabalho:
   - `/acp cancel` (parar o turno atual), ou
   - `/acp close` (fechar sessão + remover vínculos)

## Início rápido para humanos

Exemplos de requisições naturais:

- "Inicie uma sessão Codex persistente em uma thread aqui e mantenha-a focada."
- "Rode isso como uma sessão ACP Claude Code one-shot e resuma o resultado."
- "Use Gemini CLI para esta tarefa em uma thread, depois mantenha os seguimentos naquela mesma thread."

O que o OpenCraft deve fazer:

1. Escolher `runtime: "acp"`.
2. Resolver o alvo de harness solicitado (`agentId`, por exemplo `codex`).
3. Se vínculo de thread for solicitado e o canal atual suportar, vincular a sessão ACP à thread.
4. Rotear mensagens de seguimento na thread para aquela mesma sessão ACP até desfocar/fechar/expirar.

## ACP versus sub-agentes

Use ACP quando quiser um runtime de harness externo. Use sub-agentes quando quiser execuções delegadas nativas do OpenCraft.

| Área          | Sessão ACP                            | Execução de sub-agente                     |
| ------------- | ------------------------------------- | ------------------------------------------ |
| Runtime       | Plugin de backend ACP (ex.: acpx)     | Runtime nativo de sub-agente do OpenCraft  |
| Chave de sessão | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`          |
| Comandos principais | `/acp ...`                      | `/subagents ...`                           |
| Tool de spawn | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão)          |

Veja também [Sub-agentes](/tools/subagents).

## Sessões vinculadas a thread (agnóstico ao canal)

Quando os vínculos de thread estão habilitados para um adaptador de canal, sessões ACP podem ser vinculadas a threads:

- O OpenCraft vincula uma thread a uma sessão ACP alvo.
- Mensagens de seguimento naquela thread roteiam para a sessão ACP vinculada.
- Saída ACP é entregue de volta para a mesma thread.
- Desfoco/fechamento/arquivamento/timeout de inatividade ou expiração de max-age remove o vínculo.

Suporte a vínculo de thread é específico do adaptador. Se o adaptador do canal ativo não suportar vínculos de thread, o OpenCraft retorna uma mensagem clara de não suportado/indisponível.

Flags de funcionalidade necessárias para ACP vinculado a thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` está ativado por padrão (defina `false` para pausar despacho ACP)
- Flag de spawn ACP de thread do adaptador de canal habilitada (específica do adaptador)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canais com suporte a threads

- Qualquer adaptador de canal que expõe capacidade de vínculo de sessão/thread.
- Suporte embutido atual:
  - Threads/canais Discord
  - Tópicos Telegram (tópicos de fórum em grupos/supergrupos e tópicos DM)
- Canais de plugin podem adicionar suporte através da mesma interface de vínculo.

## Configurações específicas de canal

Para workflows não efêmeros, configure vínculos ACP persistentes em entradas `bindings[]` de nível superior.

### Modelo de vínculo

- `bindings[].type="acp"` marca um vínculo de conversa ACP persistente.
- `bindings[].match` identifica a conversa alvo:
  - Canal ou thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Tópico de fórum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- `bindings[].agentId` é o id do agente OpenCraft proprietário.
- Overrides ACP opcionais ficam em `bindings[].acp`:
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

Precedência de override para sessões ACP vinculadas:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. padrões ACP globais (por exemplo `acp.backend`)

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

- O OpenCraft garante que a sessão ACP configurada exista antes do uso.
- Mensagens naquele canal ou tópico roteiam para a sessão ACP configurada.
- Em conversas vinculadas, `/new` e `/reset` resetam a mesma chave de sessão ACP no lugar.
- Vínculos de runtime temporários (por exemplo criados por fluxos de thread-focus) ainda se aplicam quando presentes.

## Iniciar sessões ACP (interfaces)

### De `sessions_spawn`

Use `runtime: "acp"` para iniciar uma sessão ACP a partir de um turno de agente ou chamada de tool.

```json
{
  "task": "Abra o repositório e resuma os testes com falha",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Notas:

- `runtime` padrão é `subagent`, então defina `runtime: "acp"` explicitamente para sessões ACP.
- Se `agentId` for omitido, o OpenCraft usa `acp.defaultAgent` quando configurado.
- `mode: "session"` requer `thread: true` para manter uma conversa vinculada persistente.

Detalhes da interface:

- `task` (obrigatório): prompt inicial enviado para a sessão ACP.
- `runtime` (obrigatório para ACP): deve ser `"acp"`.
- `agentId` (opcional): id do harness ACP alvo. Cai para `acp.defaultAgent` se definido.
- `thread` (opcional, padrão `false`): solicitar fluxo de vínculo de thread onde suportado.
- `mode` (opcional): `run` (one-shot) ou `session` (persistente).
  - padrão é `run`
  - se `thread: true` e mode omitido, o OpenCraft pode padrão para comportamento persistente por caminho de runtime
  - `mode: "session"` requer `thread: true`
- `cwd` (opcional): diretório de trabalho de runtime solicitado (validado pela política de backend/runtime).
- `label` (opcional): rótulo voltado ao operador usado em texto de sessão/banner.
- `resumeSessionId` (opcional): retomar uma sessão ACP existente em vez de criar uma nova. O agente reproduz seu histórico de conversa via `session/load`. Requer `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resumos de progresso de execução ACP inicial de volta à sessão solicitante como eventos de sistema.
  - Quando disponível, respostas aceitas incluem `streamLogPath` apontando para um log JSONL com escopo de sessão (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para histórico completo de relay.

### Retomar uma sessão existente

Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de começar do zero. O agente reproduz seu histórico de conversa via `session/load`, então retoma com contexto completo do que veio antes.

```json
{
  "task": "Continue de onde paramos — corrija as falhas de teste restantes",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<id-sessão-anterior>"
}
```

Casos de uso comuns:

- Transferir uma sessão Codex do seu laptop para o celular — peça ao seu agente para continuar de onde parou
- Continuar uma sessão de coding que você iniciou interativamente no CLI, agora de forma headless pelo seu agente
- Retomar trabalho que foi interrompido por uma reinicialização do gateway ou timeout de inatividade

Notas:

- `resumeSessionId` requer `runtime: "acp"` — retorna um erro se usado com o runtime de sub-agente.
- `resumeSessionId` restaura o histórico de conversa ACP upstream; `thread` e `mode` ainda se aplicam normalmente à nova sessão OpenCraft que você está criando, então `mode: "session"` ainda requer `thread: true`.
- O agente alvo deve suportar `session/load` (Codex e Claude Code suportam).
- Se o ID de sessão não for encontrado, o spawn falha com um erro claro — sem fallback silencioso para uma nova sessão.

### Smoke test do operador

Use após um deploy do gateway quando você quer uma verificação ao vivo rápida de que o spawn ACP
está realmente funcionando de ponta a ponta, não apenas passando testes unitários.

Gate recomendado:

1. Verifique a versão/commit do gateway implantado no host alvo.
2. Confirme que a fonte implantada inclui a aceitação de linhagem ACP em
   `src/gateway/sessions-patch.ts` (sessões `subagent:* or acp:*`).
3. Abra uma sessão bridge ACPX temporária para um agente ao vivo.
4. Peça a aquele agente para chamar `sessions_spawn` com:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifique que o agente reporta:
   - `accepted=yes`
   - uma `childSessionKey` real
   - sem erro de validação
6. Limpe a sessão bridge ACPX temporária.

Prompt de exemplo para o agente ao vivo:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Notas:

- Mantenha este smoke test em `mode: "run"` a menos que você esteja intencionalmente testando
  sessões ACP persistentes vinculadas a thread.
- Não exija `streamTo: "parent"` para o gate básico. Esse caminho depende de
  capacidades de solicitante/sessão e é uma verificação de integração separada.
- Trate os testes de `mode: "session"` vinculados a thread como um segundo passo mais rico
  de integração a partir de uma thread Discord real ou tópico Telegram.

## Compatibilidade com sandbox

Sessões ACP atualmente rodam no runtime do host, não dentro do sandbox do OpenCraft.

Limitações atuais:

- Se a sessão solicitante está em sandbox, spawns ACP são bloqueados tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
  - Erro: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` com `runtime: "acp"` não suporta `sandbox: "require"`.
  - Erro: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Use `runtime: "subagent"` quando precisar de execução com sandbox aplicado.

### Do comando `/acp`

Use `/acp spawn` para controle explícito do operador pelo chat quando necessário.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --thread here
```

Flags principais:

- `--mode persistent|oneshot`
- `--thread auto|here|off`
- `--cwd <caminho-absoluto>`
- `--label <nome>`

Veja [Slash Commands](/tools/slash-commands).

## Resolução de alvo de sessão

A maioria das ações `/acp` aceita um alvo de sessão opcional (`session-key`, `session-id` ou `session-label`).

Ordem de resolução:

1. Argumento alvo explícito (ou `--session` para `/acp steer`)
   - tenta chave
   - depois id de sessão em formato UUID
   - depois rótulo
2. Vínculo de thread atual (se esta conversa/thread está vinculada a uma sessão ACP)
3. Fallback da sessão solicitante atual

Se nenhum alvo resolver, o OpenCraft retorna um erro claro (`Unable to resolve session target: ...`).

## Modos de thread de spawn

`/acp spawn` suporta `--thread auto|here|off`.

| Modo   | Comportamento                                                                                              |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| `auto` | Em uma thread ativa: vincular aquela thread. Fora de uma thread: criar/vincular uma thread filha quando suportado. |
| `here` | Requer thread ativa atual; falha se não estiver em uma.                                                    |
| `off`  | Sem vínculo. Sessão inicia não vinculada.                                                                  |

Notas:

- Em superfícies sem suporte a vínculo de thread, o comportamento padrão é efetivamente `off`.
- Spawn vinculado a thread requer suporte de política de canal:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

## Controles ACP

Família de comandos disponível:

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

`/acp status` mostra as opções de runtime efetivas e, quando disponível, identificadores de sessão de nível runtime e de nível backend.

Alguns controles dependem de capacidades do backend. Se um backend não suportar um controle, o OpenCraft retorna um erro claro de controle não suportado.

## Cookbook de comandos ACP

| Comando              | O que faz                                                     | Exemplo                                                          |
| -------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| `/acp spawn`         | Criar sessão ACP; vínculo opcional de thread.                 | `/acp spawn codex --mode persistent --thread auto --cwd /repo`   |
| `/acp cancel`        | Cancelar turno em andamento para sessão alvo.                 | `/acp cancel agent:codex:acp:<uuid>`                             |
| `/acp steer`         | Enviar instrução de direcionamento para sessão em execução.   | `/acp steer --session suporte inbox priorize testes com falha`   |
| `/acp close`         | Fechar sessão e desvincular threads alvo.                     | `/acp close`                                                     |
| `/acp status`        | Mostrar backend, modo, estado, opções de runtime, capacidades. | `/acp status`                                                   |
| `/acp set-mode`      | Definir modo de runtime para sessão alvo.                     | `/acp set-mode plan`                                             |
| `/acp set`           | Escrita genérica de opção de config de runtime.               | `/acp set model openai/gpt-5.2`                                  |
| `/acp cwd`           | Definir override de diretório de trabalho de runtime.         | `/acp cwd /Users/usuario/Projects/repo`                          |
| `/acp permissions`   | Definir perfil de política de aprovação.                      | `/acp permissions strict`                                        |
| `/acp timeout`       | Definir timeout de runtime (segundos).                        | `/acp timeout 120`                                               |
| `/acp model`         | Definir override de modelo de runtime.                        | `/acp model anthropic/claude-opus-4-5`                           |
| `/acp reset-options` | Remover overrides de opção de runtime de sessão.              | `/acp reset-options`                                             |
| `/acp sessions`      | Listar sessões ACP recentes do armazém.                       | `/acp sessions`                                                  |
| `/acp doctor`        | Saúde do backend, capacidades, correções acionáveis.          | `/acp doctor`                                                    |
| `/acp install`       | Imprimir etapas determinísticas de instalação e habilitação.  | `/acp install`                                                   |

`/acp sessions` lê o armazém para a sessão vinculada ou solicitante atual. Comandos que aceitam tokens `session-key`, `session-id` ou `session-label` resolvem alvos através da descoberta de sessão do gateway, incluindo raízes `session.store` por agente personalizadas.

## Mapeamento de opções de runtime

`/acp` tem comandos de conveniência e um setter genérico.

Operações equivalentes:

- `/acp model <id>` mapeia para chave de config de runtime `model`.
- `/acp permissions <perfil>` mapeia para chave de config de runtime `approval_policy`.
- `/acp timeout <segundos>` mapeia para chave de config de runtime `timeout`.
- `/acp cwd <caminho>` atualiza o override de cwd de runtime diretamente.
- `/acp set <chave> <valor>` é o caminho genérico.
  - Caso especial: `key=cwd` usa o caminho de override de cwd.
- `/acp reset-options` limpa todos os overrides de runtime para a sessão alvo.

## Suporte de harness acpx (atual)

Aliases de harness embutidos acpx atuais:

- `pi`
- `claude`
- `codex`
- `opencode`
- `gemini`
- `kimi`

Quando o OpenCraft usa o backend acpx, prefira esses valores para `agentId` a menos que sua config acpx defina aliases de agente personalizados.

O uso direto do CLI acpx também pode direcionar adaptadores arbitrários via `--agent <comando>`, mas essa saída de emergência bruta é um recurso do CLI acpx (não o caminho normal de `agentId` do OpenCraft).

## Config necessária

Baseline core ACP:

```json5
{
  acp: {
    enabled: true,
    // Opcional. Padrão é true; defina false para pausar despacho ACP mantendo controles /acp.
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

## Configuração do plugin para backend acpx

Instale e habilite o plugin:

```bash
opencraft plugins install acpx
opencraft config set plugins.entries.acpx.enabled true
```

Instalação local de workspace durante desenvolvimento:

```bash
opencraft plugins install ./extensions/acpx
```

Depois verifique a saúde do backend:

```text
/acp doctor
```

### Configuração de comando e versão do acpx

Por padrão, o plugin acpx (publicado como `@openclaw/acpx`) usa o binário fixado local do plugin:

1. Comando padrão para `extensions/acpx/node_modules/.bin/acpx`.
2. Versão esperada padrão para o pin da extensão.
3. Na inicialização, registra backend ACP imediatamente como não-pronto.
4. Um job de verificação em background verifica `acpx --version`.
5. Se o binário local do plugin estiver faltando ou com versão incorreta, roda:
   `npm install --omit=dev --no-save acpx@<fixado>` e re-verifica.

Você pode sobrescrever comando/versão na config do plugin:

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

- `command` aceita um caminho absoluto, caminho relativo ou nome de comando (`acpx`).
- Caminhos relativos resolvem a partir do diretório workspace do OpenCraft.
- `expectedVersion: "any"` desabilita a correspondência estrita de versão.
- Quando `command` aponta para um binário/caminho personalizado, a auto-instalação local do plugin é desabilitada.
- A inicialização do OpenCraft permanece não-bloqueante enquanto a verificação de saúde do backend roda.

Veja [Plugins](/tools/plugin).

## Configuração de permissões

Sessões ACP rodam de forma não interativa — não há TTY para aprovar ou negar prompts de permissão de escrita de arquivo e execução de shell. O plugin acpx fornece duas chaves de config que controlam como as permissões são tratadas:

### `permissionMode`

Controla quais operações o agente harness pode realizar sem solicitar.

| Valor           | Comportamento                                                     |
| --------------- | ----------------------------------------------------------------- |
| `approve-all`   | Auto-aprovar todas as escritas de arquivo e comandos shell.       |
| `approve-reads` | Auto-aprovar apenas leituras; escritas e exec requerem prompts.   |
| `deny-all`      | Negar todos os prompts de permissão.                              |

### `nonInteractivePermissions`

Controla o que acontece quando um prompt de permissão seria mostrado mas nenhum TTY interativo está disponível (o que é sempre o caso para sessões ACP).

| Valor  | Comportamento                                                                   |
| ------ | ------------------------------------------------------------------------------- |
| `fail` | Abortar a sessão com `AcpRuntimeError`. **(padrão)**                            |
| `deny` | Negar silenciosamente a permissão e continuar (degradação elegante).            |

### Configuração

Definir via config do plugin:

```bash
opencraft config set plugins.entries.acpx.config.permissionMode approve-all
opencraft config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o gateway após mudar esses valores.

> **Importante:** O OpenCraft atualmente padrão para `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Em sessões ACP não interativas, qualquer escrita ou exec que acione um prompt de permissão pode falhar com `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se você precisar restringir permissões, defina `nonInteractivePermissions` como `deny` para que as sessões degradem elegantemente em vez de travarem.

## Solução de problemas

| Sintoma                                                                  | Causa provável                                                                   | Correção                                                                                                                                                          |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                  | Plugin de backend faltando ou desabilitado.                                      | Instale e habilite o plugin de backend, depois rode `/acp doctor`.                                                                                                |
| `ACP is disabled by policy (acp.enabled=false)`                          | ACP globalmente desabilitado.                                                    | Defina `acp.enabled=true`.                                                                                                                                        |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`        | Despacho de mensagens normais de thread desabilitado.                            | Defina `acp.dispatch.enabled=true`.                                                                                                                               |
| `ACP agent "<id>" is not allowed by policy`                              | Agente não está na allowlist.                                                    | Use `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                          |
| `Unable to resolve session target: ...`                                  | Token de chave/id/rótulo inválido.                                               | Rode `/acp sessions`, copie a chave/rótulo exato, tente novamente.                                                                                                |
| `--thread here requires running /acp spawn inside an active ... thread`  | `--thread here` usado fora de um contexto de thread.                             | Mova para a thread alvo ou use `--thread auto`/`off`.                                                                                                             |
| `Only <user-id> can rebind this thread.`                                 | Outro usuário possui o vínculo de thread.                                        | Revincule como proprietário ou use uma thread diferente.                                                                                                          |
| `Thread bindings are unavailable for <channel>.`                         | Adaptador não tem capacidade de vínculo de thread.                               | Use `--thread off` ou mova para adaptador/canal suportado.                                                                                                        |
| `Sandboxed sessions cannot spawn ACP sessions ...`                       | Runtime ACP é no host; sessão solicitante está em sandbox.                       | Use `runtime="subagent"` de sessões em sandbox, ou rode spawn ACP de uma sessão não sandboxed.                                                                    |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`  | `sandbox="require"` solicitado para runtime ACP.                                 | Use `runtime="subagent"` para sandboxing obrigatório, ou use ACP com `sandbox="inherit"` de uma sessão não sandboxed.                                             |
| Metadados ACP faltando para sessão vinculada                             | Metadados de sessão ACP obsoletos/deletados.                                     | Recrie com `/acp spawn`, depois revincule/foque a thread.                                                                                                         |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` bloqueia escritas/exec em sessão ACP não interativa.            | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o gateway. Veja [Configuração de permissões](#configuração-de-permissões).      |
| Sessão ACP falha cedo com pouca saída                                    | Prompts de permissão bloqueados por `permissionMode`/`nonInteractivePermissions`. | Verifique logs do gateway para `AcpRuntimeError`. Para permissões completas, defina `permissionMode=approve-all`; para degradação elegante, defina `nonInteractivePermissions=deny`. |
| Sessão ACP trava indefinidamente após concluir o trabalho                | Processo harness terminou mas sessão ACP não reportou conclusão.                 | Monitore com `ps aux \| grep acpx`; mate processos obsoletos manualmente.                                                                                         |
