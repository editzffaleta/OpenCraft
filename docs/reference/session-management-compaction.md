---
summary: "Mergulho profundo: armazenamento de sessão + transcrições, ciclo de vida e internos de (auto)compactação"
read_when:
  - Você precisa depurar ids de sessão, transcrição JSONL ou campos de sessions.json
  - Você está alterando o comportamento de auto-compactação ou adicionando limpeza "pré-compactação"
  - Você quer implementar flushes de memória ou turnos silenciosos de sistema
title: "Mergulho Profundo em Gerenciamento de Sessão"
---

# Gerenciamento de Sessão & Compactação (Mergulho Profundo)

Este documento explica como o OpenCraft gerencia sessões de ponta a ponta:

- **Roteamento de sessão** (como mensagens recebidas mapeiam para um `sessionKey`)
- **Armazenamento de sessão** (`sessions.json`) e o que ele rastreia
- **Persistência de transcrição** (`*.jsonl`) e sua estrutura
- **Higiene de transcrição** (correções específicas por provedor antes das execuções)
- **Limites de contexto** (janela de contexto vs tokens rastreados)
- **Compactação** (manual + auto-compactação) e onde conectar trabalho pré-compactação
- **Limpeza silenciosa** (ex.: escritas de memória que não devem produzir saída visível ao usuário)

Se você quer uma visão geral de mais alto nível primeiro, comece com:

- [/concepts/session](/concepts/session)
- [/concepts/compaction](/concepts/compaction)
- [/concepts/session-pruning](/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## Fonte da verdade: o Gateway

O OpenCraft é projetado em torno de um único **processo Gateway** que é dono do estado da sessão.

- UIs (app macOS, UI de Controle web, TUI) devem consultar o Gateway para listas de sessão e contagens de tokens.
- No modo remoto, os arquivos de sessão estão no host remoto; "verificar seus arquivos locais do Mac" não refletirá o que o Gateway está usando.

---

## Duas camadas de persistência

O OpenCraft persiste sessões em duas camadas:

1. **Armazenamento de sessão (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro para editar (ou excluir entradas)
   - Rastreia metadados da sessão (id da sessão atual, última atividade, toggles, contadores de tokens, etc.)

2. **Transcrição (`<sessionId>.jsonl`)**
   - Transcrição append-only com estrutura de árvore (entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de ferramentas + resumos de compactação
   - Usada para reconstruir o contexto do modelo para turnos futuros

---

## Localizações em disco

Por agente, no host do Gateway:

- Armazenamento: `~/.opencraft/agents/<agentId>/sessions/sessions.json`
- Transcrições: `~/.opencraft/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessões de tópico Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

O OpenCraft resolve estes via `src/config/sessions.ts`.

---

## Manutenção do armazenamento e controles de disco

A persistência de sessão tem controles automáticos de manutenção (`session.maintenance`) para `sessions.json` e artefatos de transcrição:

- `mode`: `warn` (padrão) ou `enforce`
- `pruneAfter`: corte de idade de entrada obsoleta (padrão `30d`)
- `maxEntries`: limite de entradas em `sessions.json` (padrão `500`)
- `rotateBytes`: rotacionar `sessions.json` quando superdimensionado (padrão `10mb`)
- `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>` (padrão: mesmo que `pruneAfter`; `false` desabilita limpeza)
- `maxDiskBytes`: orçamento opcional do diretório de sessões
- `highWaterBytes`: alvo opcional após limpeza (padrão `80%` de `maxDiskBytes`)

Ordem de aplicação para limpeza de orçamento de disco (`mode: "enforce"`):

1. Remover artefatos de transcrição arquivados ou órfãos mais antigos primeiro.
2. Se ainda acima do alvo, despejar entradas de sessão mais antigas e seus arquivos de transcrição.
3. Continuar até que o uso esteja em ou abaixo de `highWaterBytes`.

No `mode: "warn"`, o OpenCraft reporta possíveis despejos mas não altera o armazenamento/arquivos.

Execute manutenção sob demanda:

```bash
opencraft sessions cleanup --dry-run
opencraft sessions cleanup --enforce
```

---

## Sessões Cron e logs de execução

Execuções isoladas de cron também criam entradas/transcrições de sessão, e têm controles de retenção dedicados:

- `cron.sessionRetention` (padrão `24h`) poda sessões antigas de execução de cron isolada do armazenamento de sessão (`false` desabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podam arquivos `~/.opencraft/cron/runs/<jobId>.jsonl` (padrões: `2_000_000` bytes e `2000` linhas).

---

## Chaves de sessão (`sessionKey`)

Um `sessionKey` identifica _qual bucket de conversa_ você está (roteamento + isolamento).

Padrões comuns:

- Chat principal/direto (por agente): `agent:<agentId>:<mainKey>` (padrão `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a menos que substituído)

As regras canônicas estão documentadas em [/concepts/session](/concepts/session).

---

## Ids de sessão (`sessionId`)

Cada `sessionKey` aponta para um `sessionId` atual (o arquivo de transcrição que continua a conversa).

Regras gerais:

- **Reset** (`/new`, `/reset`) cria um novo `sessionId` para aquele `sessionKey`.
- **Reset diário** (padrão 4:00 da manhã, horário local no host do gateway) cria um novo `sessionId` na próxima mensagem após o limite de reset.
- **Expiração por ociosidade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria um novo `sessionId` quando uma mensagem chega após a janela de ociosidade. Quando diário + ociosidade estão ambos configurados, quem expirar primeiro vence.
- **Guarda de fork de thread pai** (`session.parentForkMaxTokens`, padrão `100000`) pula o fork de transcrição do pai quando a sessão pai já está muito grande; a nova thread começa limpa. Defina `0` para desabilitar.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Schema do armazenamento de sessão (`sessions.json`)

O tipo de valor do armazenamento é `SessionEntry` em `src/config/sessions.ts`.

Campos principais (não exaustivo):

- `sessionId`: id da transcrição atual (nome do arquivo é derivado disso a menos que `sessionFile` esteja definido)
- `updatedAt`: timestamp da última atividade
- `sessionFile`: substituição opcional de caminho explícito de transcrição
- `chatType`: `direct | group | room` (ajuda UIs e política de envio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadados para rotulagem de grupo/canal
- Toggles:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (substituição por sessão)
- Seleção de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (melhor esforço / dependente do provedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quantas vezes a auto-compactação completou para esta chave de sessão
- `memoryFlushAt`: timestamp do último flush de memória pré-compactação
- `memoryFlushCompactionCount`: contagem de compactação quando o último flush executou

O armazenamento é seguro para editar, mas o Gateway é a autoridade: ele pode reescrever ou rehidratar entradas conforme as sessões executam.

---

## Estrutura da transcrição (`*.jsonl`)

As transcrições são gerenciadas pelo `SessionManager` do `@mariozechner/pi-coding-agent`.

O arquivo é JSONL:

- Primeira linha: cabeçalho da sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, opcional `parentSession`)
- Depois: entradas de sessão com `id` + `parentId` (árvore)

Tipos de entrada notáveis:

- `message`: mensagens de usuário/assistente/toolResult
- `custom_message`: mensagens injetadas por extensão que _entram_ no contexto do modelo (podem ser ocultadas da UI)
- `custom`: estado de extensão que _não_ entra no contexto do modelo
- `compaction`: resumo de compactação persistido com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar um ramo da árvore

O OpenCraft intencionalmente **não** "corrige" transcrições; o Gateway usa o `SessionManager` para lê-las/escrevê-las.

---

## Janelas de contexto vs tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis ao modelo)
2. **Contadores do armazenamento de sessão**: estatísticas contínuas escritas em `sessions.json` (usadas para /status e dashboards)

Se você está ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser substituída via config).
- `contextTokens` no armazenamento é um valor de estimativa/relatório em tempo de execução; não trate como garantia estrita.

Para mais, veja [/token-use](/reference/token-use).

---

## Compactação: o que é

A compactação resume conversas mais antigas em uma entrada `compaction` persistida na transcrição e mantém mensagens recentes intactas.

Após a compactação, turnos futuros veem:

- O resumo da compactação
- Mensagens após `firstKeptEntryId`

A compactação é **persistente** (diferente da poda de sessão). Veja [/concepts/session-pruning](/concepts/session-pruning).

---

## Quando a auto-compactação acontece (runtime Pi)

No agente Pi embutido, a auto-compactação é acionada em dois casos:

1. **Recuperação de overflow**: o modelo retorna um erro de overflow de contexto → compactar → tentar novamente.
2. **Manutenção de threshold**: após um turno bem-sucedido, quando:

`contextTokens > contextWindow - reserveTokens`

Onde:

- `contextWindow` é a janela de contexto do modelo
- `reserveTokens` é a margem reservada para prompts + a próxima saída do modelo

Estas são semânticas do runtime Pi (o OpenCraft consome os eventos, mas o Pi decide quando compactar).

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

O OpenCraft também aplica um piso de segurança para execuções embutidas:

- Se `compaction.reserveTokens < reserveTokensFloor`, o OpenCraft aumenta o valor.
- O piso padrão é `20000` tokens.
- Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desabilitar o piso.
- Se já estiver mais alto, o OpenCraft não altera.

Por quê: deixar margem suficiente para "limpeza" multi-turno (como escritas de memória) antes que a compactação se torne inevitável.

Implementação: `ensurePiCompactionReserveTokens()` em `src/agents/pi-settings.ts`
(chamado de `src/agents/pi-embedded-runner.ts`).

---

## Superfícies visíveis ao usuário

Você pode observar a compactação e o estado da sessão via:

- `/status` (em qualquer sessão de chat)
- `opencraft status` (CLI)
- `opencraft sessions` / `sessions --json`
- Modo verboso: `🧹 Auto-compactação completa` + contagem de compactação

---

## Limpeza silenciosa (`NO_REPLY`)

O OpenCraft suporta turnos "silenciosos" para tarefas em segundo plano onde o usuário não deve ver saída intermediária.

Convenção:

- O assistente inicia sua saída com `NO_REPLY` para indicar "não entregue uma resposta ao usuário".
- O OpenCraft remove/suprime isso na camada de entrega.

A partir de `2026.1.10`, o OpenCraft também suprime **streaming de rascunho/digitação** quando um chunk parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída parcial no meio do turno.

---

## "Flush de memória" pré-compactação (implementado)

Objetivo: antes da auto-compactação acontecer, executar um turno agêntico silencioso que escreve estado
durável em disco (ex.: `memory/YYYY-MM-DD.md` no workspace do agente) para que a compactação não possa
apagar contexto crítico.

O OpenCraft usa a abordagem de **flush pré-threshold**:

1. Monitorar o uso de contexto da sessão.
2. Quando cruza um "threshold suave" (abaixo do threshold de compactação do Pi), executar uma
   diretiva silenciosa "escreva memória agora" para o agente.
3. Usar `NO_REPLY` para que o usuário não veja nada.

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (padrão: `true`)
- `softThresholdTokens` (padrão: `4000`)
- `prompt` (mensagem do usuário para o turno de flush)
- `systemPrompt` (prompt de sistema extra anexado para o turno de flush)

Notas:

- O prompt/prompt de sistema padrão inclui uma dica `NO_REPLY` para suprimir entrega.
- O flush executa uma vez por ciclo de compactação (rastreado em `sessions.json`).
- O flush executa apenas para sessões Pi embutidas (backends CLI pulam).
- O flush é pulado quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Veja [Memória](/concepts/memory) para o layout de arquivos do workspace e padrões de escrita.

O Pi também expõe um hook `session_before_compact` na API de extensão, mas a
lógica de flush do OpenCraft vive no lado do Gateway hoje.

---

## Lista de verificação de solução de problemas

- Chave de sessão errada? Comece com [/concepts/session](/concepts/session) e confirme o `sessionKey` em `/status`.
- Divergência entre armazenamento e transcrição? Confirme o host do Gateway e o caminho do armazenamento via `opencraft status`.
- Spam de compactação? Verifique:
  - janela de contexto do modelo (muito pequena)
  - configurações de compactação (`reserveTokens` muito alto para a janela do modelo pode causar compactação mais cedo)
  - inchaço de resultados de ferramentas: habilite/ajuste a poda de sessão
- Turnos silenciosos vazando? Confirme que a resposta começa com `NO_REPLY` (token exato) e que você está em uma build que inclui a correção de supressão de streaming.
