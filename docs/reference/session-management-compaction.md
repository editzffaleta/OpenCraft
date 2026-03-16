---
summary: "Mergulho profundo: session store + transcritos, ciclo de vida e internos de (auto)compactação"
read_when:
  - Você precisa depurar ids de sessão, JSONL de transcript ou campos de sessions.json
  - Você está alterando o comportamento de auto-compactação ou adicionando housekeeping "pré-compactação"
  - Você quer implementar flushes de memória ou turnos de sistema silenciosos
title: "Mergulho Profundo em Gerenciamento de Sessão"
---

# Gerenciamento de Sessão e Compactação (Mergulho Profundo)

Este documento explica como o OpenCraft gerencia sessões de ponta a ponta:

- **Roteamento de sessão** (como mensagens recebidas mapeiam para um `sessionKey`)
- **Session store** (`sessions.json`) e o que ele rastreia
- **Persistência de transcript** (`*.jsonl`) e sua estrutura
- **Higiene de transcript** (correções específicas do provedor antes das execuções)
- **Limites de contexto** (janela de contexto vs tokens rastreados)
- **Compactação** (manual + auto-compactação) e onde inserir trabalho pré-compactação
- **Housekeeping silencioso** (ex: escritas de memória que não devem produzir saída visível ao usuário)

Se você quiser uma visão geral de alto nível primeiro, comece com:

- [/concepts/session](/concepts/session)
- [/concepts/compaction](/concepts/compaction)
- [/concepts/session-pruning](/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## Fonte da verdade: o Gateway

O OpenCraft é projetado em torno de um único **processo Gateway** que possui o estado de sessão.

- As UIs (app macOS, Control UI web, TUI) devem consultar o Gateway para listas de sessão e contagens de tokens.
- No modo remoto, os arquivos de sessão estão no host remoto; "verificar seus arquivos locais no Mac" não vai refletir o que o Gateway está usando.

---

## Duas camadas de persistência

O OpenCraft persiste sessões em duas camadas:

1. **Session store (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro para editar (ou excluir entradas)
   - Rastreia metadados de sessão (id de sessão atual, última atividade, toggles, contadores de tokens, etc.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Transcript apenas de adição com estrutura em árvore (entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de tools + resumos de compactação
   - Usado para reconstruir o contexto do modelo para turnos futuros

---

## Localizações no disco

Por agente, no host do Gateway:

- Store: `~/.opencraft/agents/<agentId>/sessions/sessions.json`
- Transcritos: `~/.opencraft/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessões de tópico Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

O OpenCraft resolve esses via `src/config/sessions.ts`.

---

## Manutenção do store e controles de disco

A persistência de sessão tem controles de manutenção automática (`session.maintenance`) para `sessions.json` e artefatos de transcript:

- `mode`: `warn` (padrão) ou `enforce`
- `pruneAfter`: corte de idade de entrada obsoleta (padrão `30d`)
- `maxEntries`: limita entradas em `sessions.json` (padrão `500`)
- `rotateBytes`: rotaciona `sessions.json` quando muito grande (padrão `10mb`)
- `resetArchiveRetention`: retenção para arquivos de transcript `*.reset.<timestamp>` (padrão: igual a `pruneAfter`; `false` desabilita limpeza)
- `maxDiskBytes`: orçamento opcional do diretório de sessões
- `highWaterBytes`: alvo opcional após limpeza (padrão `80%` de `maxDiskBytes`)

Ordem de execução para limpeza de orçamento de disco (`mode: "enforce"`):

1. Remover primeiro os artefatos de transcript mais antigos arquivados ou órfãos.
2. Se ainda acima do alvo, despejar as entradas de sessão mais antigas e seus arquivos de transcript.
3. Continue até que o uso esteja em ou abaixo de `highWaterBytes`.

Em `mode: "warn"`, o OpenCraft reporta possíveis despejos mas não muta o store/arquivos.

Execute manutenção sob demanda:

```bash
opencraft sessions cleanup --dry-run
opencraft sessions cleanup --enforce
```

---

## Sessões cron e logs de execução

Execuções cron isoladas também criam entradas/transcritos de sessão, e têm controles de retenção dedicados:

- `cron.sessionRetention` (padrão `24h`) limpa sessões de execução cron isoladas antigas do session store (`false` desabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` limpam arquivos `~/.opencraft/cron/runs/<jobId>.jsonl` (padrões: `2_000_000` bytes e `2000` linhas).

---

## Chaves de sessão (`sessionKey`)

Um `sessionKey` identifica _em qual balde de conversa_ você está (roteamento + isolamento).

Padrões comuns:

- Chat principal/direto (por agente): `agent:<agentId>:<mainKey>` (padrão `main`)
- Grupo: `agent:<agentId>:<canal>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<canal>:channel:<id>` ou `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a menos que sobrescrito)

As regras canônicas estão documentadas em [/concepts/session](/concepts/session).

---

## Ids de sessão (`sessionId`)

Cada `sessionKey` aponta para um `sessionId` atual (o arquivo de transcript que continua a conversa).

Regras práticas:

- **Reset** (`/new`, `/reset`) cria um novo `sessionId` para aquele `sessionKey`.
- **Reset diário** (padrão 4:00 da manhã no horário local do host do gateway) cria um novo `sessionId` na próxima mensagem após o limite de reset.
- **Expiração por inatividade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria um novo `sessionId` quando uma mensagem chega após a janela de inatividade. Quando diário + inatividade estão ambos configurados, o que expirar primeiro vence.
- **Guarda de fork de thread pai** (`session.parentForkMaxTokens`, padrão `100000`) pula o fork de transcript pai quando a sessão pai já é muito grande; o novo thread começa do zero. Defina `0` para desabilitar.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Schema do session store (`sessions.json`)

O tipo de valor do store é `SessionEntry` em `src/config/sessions.ts`.

Campos-chave (não exaustivo):

- `sessionId`: id do transcript atual (o nome de arquivo é derivado disso a menos que `sessionFile` esteja definido)
- `updatedAt`: timestamp da última atividade
- `sessionFile`: override explícito opcional do caminho do transcript
- `chatType`: `direct | group | room` (ajuda UIs e política de envio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadados para rotulagem de grupo/canal
- Toggles:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override por sessão)
- Seleção de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (melhor esforço / dependente do provedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quantas vezes a auto-compactação foi concluída para esta chave de sessão
- `memoryFlushAt`: timestamp do último flush de memória pré-compactação
- `memoryFlushCompactionCount`: contagem de compactação quando o último flush foi executado

O store é seguro para editar, mas o Gateway é a autoridade: ele pode reescrever ou reidratar entradas conforme as sessões rodam.

---

## Estrutura do transcript (`*.jsonl`)

Os transcritos são gerenciados pelo `SessionManager` do `@mariozechner/pi-coding-agent`.

O arquivo é JSONL:

- Primeira linha: cabeçalho de sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Em seguida: entradas de sessão com `id` + `parentId` (árvore)

Tipos de entrada notáveis:

- `message`: mensagens user/assistant/toolResult
- `custom_message`: mensagens injetadas por extensão que _entram_ no contexto do modelo (podem ser ocultas da UI)
- `custom`: estado de extensão que _não entra_ no contexto do modelo
- `compaction`: resumo de compactação persistido com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar por um ramo da árvore

O OpenCraft intencionalmente **não** "corrige" transcritos; o Gateway usa `SessionManager` para lê-los/escrevê-los.

---

## Janelas de contexto vs tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis para o modelo)
2. **Contadores do session store**: estatísticas contínuas escritas em `sessions.json` (usadas para /status e dashboards)

Se você estiver ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser sobrescrita via config).
- `contextTokens` no store é uma estimativa/valor de reporte do runtime; não o trate como uma garantia estrita.

Para mais, veja [/token-use](/reference/token-use).

---

## Compactação: o que é

A compactação resume uma conversa mais antiga em uma entrada `compaction` persistida no transcript e mantém as mensagens recentes intactas.

Após a compactação, os turnos futuros veem:

- O resumo de compactação
- Mensagens após `firstKeptEntryId`

A compactação é **persistente** (ao contrário da poda de sessão). Veja [/concepts/session-pruning](/concepts/session-pruning).

---

## Quando ocorre a auto-compactação (runtime Pi)

No agente Pi embutido, a auto-compactação é disparada em dois casos:

1. **Recuperação de overflow**: o modelo retorna um erro de overflow de contexto → compactar → tentar novamente.
2. **Manutenção de threshold**: após um turno bem-sucedido, quando:

`contextTokens > contextWindow - reserveTokens`

Onde:

- `contextWindow` é a janela de contexto do modelo
- `reserveTokens` é o espaço reservado para prompts + a próxima saída do modelo

Essas são semânticas do runtime Pi (o OpenCraft consome os eventos, mas Pi decide quando compactar).

---

## Configurações de compactação (`reserveTokens`, `keepRecentTokens`)

As configurações de compactação do Pi vivem nas configurações do Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

O OpenCraft também impõe um piso de segurança para execuções embutidas:

- Se `compaction.reserveTokens < reserveTokensFloor`, o OpenCraft o aumenta.
- O piso padrão é `20000` tokens.
- Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desabilitar o piso.
- Se já for maior, o OpenCraft o deixa em paz.

Por quê: deixar espaço suficiente para "housekeeping" multi-turno (como escritas de memória) antes que a compactação se torne inevitável.

Implementação: `ensurePiCompactionReserveTokens()` em `src/agents/pi-settings.ts`
(chamado de `src/agents/pi-embedded-runner.ts`).

---

## Superfícies visíveis ao usuário

Você pode observar compactação e estado de sessão via:

- `/status` (em qualquer sessão de chat)
- `opencraft status` (CLI)
- `opencraft sessions` / `sessions --json`
- Modo verbose: `🧹 Auto-compactação concluída` + contagem de compactação

---

## Housekeeping silencioso (`NO_REPLY`)

O OpenCraft suporta turnos "silenciosos" para tarefas em background onde o usuário não deve ver saída intermediária.

Convenção:

- O assistente inicia sua saída com `NO_REPLY` para indicar "não entregue uma resposta ao usuário".
- O OpenCraft remove/suprime isso na camada de entrega.

A partir de `2026.1.10`, o OpenCraft também suprime o **streaming de rascunho/digitação** quando um chunk parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída parcial no meio do turno.

---

## "Flush de memória" pré-compactação (implementado)

Objetivo: antes que a auto-compactação aconteça, executar um turno agêntico silencioso que escreve estado durável no disco (ex: `memory/YYYY-MM-DD.md` no workspace do agente) para que a compactação não possa apagar contexto crítico.

O OpenCraft usa a abordagem de **flush pré-threshold**:

1. Monitorar o uso de contexto da sessão.
2. Quando cruzar um "threshold suave" (abaixo do threshold de compactação do Pi), executar uma diretiva silenciosa "escrever memória agora" para o agente.
3. Usar `NO_REPLY` para que o usuário não veja nada.

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (padrão: `true`)
- `softThresholdTokens` (padrão: `4000`)
- `prompt` (mensagem de usuário para o turno de flush)
- `systemPrompt` (system prompt extra adicionado para o turno de flush)

Notas:

- O prompt/system prompt padrão inclui uma dica `NO_REPLY` para suprimir a entrega.
- O flush roda uma vez por ciclo de compactação (rastreado em `sessions.json`).
- O flush roda apenas para sessões Pi embutidas (backends CLI o ignoram).
- O flush é ignorado quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Veja [Memória](/concepts/memory) para o layout de arquivo do workspace e padrões de escrita.

O Pi também expõe um hook `session_before_compact` na API de extensão, mas a lógica de flush do OpenCraft vive no lado do Gateway hoje.

---

## Checklist de troubleshooting

- Chave de sessão errada? Comece com [/concepts/session](/concepts/session) e confirme o `sessionKey` em `/status`.
- Incompatibilidade entre store e transcript? Confirme o host do Gateway e o caminho do store de `opencraft status`.
- Spam de compactação? Verifique:
  - janela de contexto do modelo (muito pequena)
  - configurações de compactação (`reserveTokens` muito alto para a janela do modelo pode causar compactação mais cedo)
  - inchaço de tool-result: habilite/ajuste a poda de sessão
- Turnos silenciosos vazando? Confirme que a resposta começa com `NO_REPLY` (token exato) e que você está em um build que inclui a correção de supressão de streaming.
