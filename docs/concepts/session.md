---
summary: "Regras de gerenciamento de sessao, chaves e persistencia para chats"
read_when:
  - Modificando tratamento ou armazenamento de sessoes
title: "Session Management"
---

# Gerenciamento de Sessoes

O OpenCraft trata **uma sessao de chat direto por agente** como primaria. Chats diretos colapsam para `agent:<agentId>:<mainKey>` (padrao `main`), enquanto chats de grupo/canal recebem suas proprias chaves. `session.mainKey` e respeitado.

Use `session.dmScope` para controlar como **mensagens diretas** sao agrupadas:

- `main` (padrao): todos os DMs compartilham a sessao principal para continuidade.
- `per-peer`: isolar por ID do remetente entre canais.
- `per-channel-peer`: isolar por canal + remetente (recomendado para caixas de entrada multi-usuario).
- `per-account-channel-peer`: isolar por conta + canal + remetente (recomendado para caixas de entrada multi-conta).
  Use `session.identityLinks` para mapear IDs de peer prefixados por provedor para uma identidade canonica para que a mesma pessoa compartilhe uma sessao de DM entre canais ao usar `per-peer`, `per-channel-peer` ou `per-account-channel-peer`.

## Modo DM seguro (recomendado para configuracoes multi-usuario)

> **Aviso de Seguranca:** Se seu agente pode receber DMs de **multiplas pessoas**, voce deve considerar fortemente habilitar o modo DM seguro. Sem ele, todos os usuarios compartilham o mesmo contexto de conversa, o que pode vazar informacoes privadas entre usuarios.

**Exemplo do problema com configuracoes padrao:**

- Alice (`<SENDER_A>`) envia uma mensagem ao seu agente sobre um topico privado (por exemplo, uma consulta medica)
- Bob (`<SENDER_B>`) envia uma mensagem ao seu agente perguntando "Sobre o que estavamos conversando?"
- Como ambos os DMs compartilham a mesma sessao, o modelo pode responder ao Bob usando o contexto anterior da Alice.

**A correcao:** Defina `dmScope` para isolar sessoes por usuario:

```json5
// ~/.editzffaleta/OpenCraft.json
{
  session: {
    // Modo DM seguro: isolar contexto de DM por canal + remetente.
    dmScope: "per-channel-peer",
  },
}
```

**Quando habilitar isso:**

- Voce tem aprovacoes de pareamento para mais de um remetente
- Voce usa uma lista de permissoes de DM com multiplas entradas
- Voce definiu `dmPolicy: "open"`
- Multiplos numeros de telefone ou contas podem enviar mensagens ao seu agente

Notas:

- O padrao e `dmScope: "main"` para continuidade (todos os DMs compartilham a sessao principal). Isso e adequado para configuracoes de usuario unico.
- O onboarding local do CLI grava `session.dmScope: "per-channel-peer"` por padrao quando nao definido (valores explicitos existentes sao preservados).
- Para caixas de entrada multi-conta no mesmo canal, prefira `per-account-channel-peer`.
- Se a mesma pessoa entra em contato com voce em multiplos canais, use `session.identityLinks` para colapsar suas sessoes de DM em uma identidade canonica.
- Voce pode verificar suas configuracoes de DM com `opencraft security audit` (veja [seguranca](/cli/security)).

## O Gateway e a fonte de verdade

Todo o estado de sessao e **de propriedade do Gateway** (o OpenCraft "mestre"). Clientes de UI (aplicativo macOS, WebChat, etc.) devem consultar o Gateway para listas de sessoes e contagens de Token em vez de ler arquivos locais.

- No **modo remoto**, o armazenamento de sessoes que voce se importa fica no host remoto do Gateway, nao no seu Mac.
- As contagens de Token mostradas nas UIs vem dos campos de armazenamento do Gateway (`inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`). Os clientes nao analisam transcricoes JSONL para "corrigir" totais.

## Onde o estado fica

- No **host do Gateway**:
  - Arquivo de armazenamento: `~/.opencraft/agents/<agentId>/sessions/sessions.json` (por agente).
- Transcricoes: `~/.opencraft/agents/<agentId>/sessions/<SessionId>.jsonl` (sessoes de topicos do Telegram usam `.../<SessionId>-topic-<threadId>.jsonl`).
- O armazenamento e um mapa `sessionKey -> { sessionId, updatedAt, ... }`. Excluir entradas e seguro; elas sao recriadas sob demanda.
- Entradas de grupo podem incluir `displayName`, `channel`, `subject`, `room` e `space` para rotular sessoes nas UIs.
- Entradas de sessao incluem metadados `origin` (rotulo + dicas de roteamento) para que as UIs possam explicar de onde uma sessao veio.
- O OpenCraft **nao** le pastas de sessao legadas Pi/Tau.

## Manutencao

O OpenCraft aplica manutencao do armazenamento de sessoes para manter `sessions.json` e artefatos de transcricao limitados ao longo do tempo.

### Padroes

- `session.maintenance.mode`: `warn`
- `session.maintenance.pruneAfter`: `30d`
- `session.maintenance.maxEntries`: `500`
- `session.maintenance.rotateBytes`: `10mb`
- `session.maintenance.resetArchiveRetention`: padrao e `pruneAfter` (`30d`)
- `session.maintenance.maxDiskBytes`: nao definido (desabilitado)
- `session.maintenance.highWaterBytes`: padrao e `80%` de `maxDiskBytes` quando o orcamento esta habilitado

### Como funciona

A manutencao executa durante gravacoes no armazenamento de sessoes, e voce pode aciona-la sob demanda com `opencraft sessions cleanup`.

- `mode: "warn"`: relata o que seria removido mas nao altera entradas/transcricoes.
- `mode: "enforce"`: aplica limpeza nesta ordem:
  1. remover entradas obsoletas mais antigas que `pruneAfter`
  2. limitar contagem de entradas a `maxEntries` (mais antigas primeiro)
  3. arquivar arquivos de transcricao para entradas removidas que nao sao mais referenciadas
  4. purgar arquivos antigos `*.deleted.<timestamp>` e `*.reset.<timestamp>` pela politica de retencao
  5. rotacionar `sessions.json` quando excede `rotateBytes`
  6. se `maxDiskBytes` estiver definido, aplicar orcamento de disco ate `highWaterBytes` (artefatos mais antigos primeiro, depois sessoes mais antigas)

### Ressalva de desempenho para armazenamentos grandes

Armazenamentos de sessoes grandes sao comuns em configuracoes de alto volume. O trabalho de manutencao e trabalho no caminho de gravacao, entao armazenamentos muito grandes podem aumentar a latencia de gravacao.

O que mais aumenta o custo:

- valores muito altos de `session.maintenance.maxEntries`
- janelas longas de `pruneAfter` que mantem entradas obsoletas
- muitos artefatos de transcricao/arquivo em `~/.opencraft/agents/<agentId>/sessions/`
- habilitar orcamentos de disco (`maxDiskBytes`) sem limites razoaveis de remocao/limite

O que fazer:

- use `mode: "enforce"` em producao para que o crescimento seja limitado automaticamente
- defina limites de tempo e contagem (`pruneAfter` + `maxEntries`), nao apenas um
- defina `maxDiskBytes` + `highWaterBytes` para limites superiores rigidos em grandes implantacoes
- mantenha `highWaterBytes` significativamente abaixo de `maxDiskBytes` (padrao e 80%)
- execute `opencraft sessions cleanup --dry-run --json` apos mudancas de configuracao para verificar o impacto projetado antes de aplicar
- para sessoes ativas frequentes, passe `--active-key` ao executar limpeza manual

### Exemplos de personalizacao

Use uma politica conservadora de aplicacao:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "45d",
      maxEntries: 800,
      rotateBytes: "20mb",
      resetArchiveRetention: "14d",
    },
  },
}
```

Habilite um orcamento rigido de disco para o diretorio de sessoes:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      maxDiskBytes: "1gb",
      highWaterBytes: "800mb",
    },
  },
}
```

Ajuste para instalacoes maiores (exemplo):

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "14d",
      maxEntries: 2000,
      rotateBytes: "25mb",
      maxDiskBytes: "2gb",
      highWaterBytes: "1.6gb",
    },
  },
}
```

Pre-visualize ou force a manutencao pelo CLI:

```bash
opencraft sessions cleanup --dry-run
opencraft sessions cleanup --enforce
```

## Remocao de sessao

O OpenCraft remove **resultados de ferramentas antigos** do contexto em memoria logo antes das chamadas de LLM por padrao.
Isso **nao** reescreve o historico JSONL. Veja [/concepts/session-pruning](/concepts/session-pruning).

## Despejo de memoria pre-compactacao

Quando uma sessao se aproxima da auto-compactacao, o OpenCraft pode executar um turno **silencioso de despejo de memoria**
que lembra o modelo de gravar notas duraveis no disco. Isso so executa quando
o workspace e gravavel. Veja [Memoria](/concepts/memory) e
[Compactacao](/concepts/compaction).

## Mapeando transportes → chaves de sessao

- Chats diretos seguem `session.dmScope` (padrao `main`).
  - `main`: `agent:<agentId>:<mainKey>` (continuidade entre dispositivos/canais).
    - Multiplos numeros de telefone e canais podem mapear para a mesma chave principal do agente; eles atuam como transportes em uma conversa.
  - `per-peer`: `agent:<agentId>:direct:<peerId>`.
  - `per-channel-peer`: `agent:<agentId>:<channel>:direct:<peerId>`.
  - `per-account-channel-peer`: `agent:<agentId>:<channel>:<accountId>:direct:<peerId>` (accountId padrao e `default`).
  - Se `session.identityLinks` corresponder a um ID de peer prefixado por provedor (por exemplo `telegram:123`), a chave canonica substitui `<peerId>` para que a mesma pessoa compartilhe uma sessao entre canais.
- Chats de grupo isolam o estado: `agent:<agentId>:<channel>:group:<id>` (salas/canais usam `agent:<agentId>:<channel>:channel:<id>`).
  - Topicos de forum do Telegram adicionam `:topic:<threadId>` ao ID do grupo para isolamento.
  - Chaves legadas `group:<id>` ainda sao reconhecidas para migracao.
- Contextos de entrada ainda podem usar `group:<id>`; o canal e inferido do `Provider` e normalizado para a forma canonica `agent:<agentId>:<channel>:group:<id>`.
- Outras fontes:
  - Trabalhos Cron: `cron:<job.id>` (isolado) ou personalizado `session:<custom-id>` (persistente)
  - Webhook: `hook:<uuid>` (a menos que explicitamente definido pelo hook)
  - Execucoes de Node: `node-<nodeId>`

## Ciclo de vida

- Politica de redefinicao: sessoes sao reutilizadas ate expirarem, e a expiracao e avaliada na proxima mensagem de entrada.
- Redefinicao diaria: padrao e **4:00 AM horario local no host do Gateway**. Uma sessao e obsoleta quando sua ultima atualizacao e anterior ao horario de redefinicao diaria mais recente.
- Redefinicao por inatividade (opcional): `idleMinutes` adiciona uma janela deslizante de inatividade. Quando ambas as redefinicoes diaria e por inatividade sao configuradas, **a que expirar primeiro** forca uma nova sessao.
- Inatividade apenas legado: se voce definir `session.idleMinutes` sem nenhuma configuracao `session.reset`/`resetByType`, o OpenCraft permanece no modo somente inatividade para compatibilidade retroativa.
- Substituicoes por tipo (opcional): `resetByType` permite substituir a politica para sessoes `direct`, `group` e `thread` (thread = threads Slack/Discord, topicos Telegram, threads Matrix quando fornecidos pelo conector).
- Substituicoes por canal (opcional): `resetByChannel` substitui a politica de redefinicao para um canal (aplica-se a todos os tipos de sessao para aquele canal e tem precedencia sobre `reset`/`resetByType`).
- Gatilhos de redefinicao: `/new` ou `/reset` exatos (mais quaisquer extras em `resetTriggers`) iniciam um novo ID de sessao e passam o restante da mensagem adiante. `/new <model>` aceita um alias de modelo, `provider/model` ou nome de provedor (correspondencia aproximada) para definir o modelo da nova sessao. Se `/new` ou `/reset` for enviado sozinho, o OpenCraft executa um breve turno de saudacao "hello" para confirmar a redefinicao.
- Redefinicao manual: exclua chaves especificas do armazenamento ou remova a transcricao JSONL; a proxima mensagem as recria.
- Trabalhos Cron isolados sempre criam um novo `sessionId` por execucao (sem reutilizacao por inatividade).

## Politica de envio (opcional)

Bloqueie a entrega para tipos de sessao especificos sem listar IDs individuais.

```json5
{
  session: {
    sendPolicy: {
      rules: [
        { action: "deny", match: { channel: "discord", chatType: "group" } },
        { action: "deny", match: { keyPrefix: "cron:" } },
        // Corresponde a chave bruta da sessao (incluindo o prefixo `agent:<id>:`).
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ],
      default: "allow",
    },
  },
}
```

Substituicao em tempo de execucao (somente proprietario):

- `/send on` → permitir para esta sessao
- `/send off` → negar para esta sessao
- `/send inherit` → limpar substituicao e usar regras de configuracao
  Envie estes como mensagens independentes para que sejam registrados.

## Configuracao (exemplo de renomeacao opcional)

```json5
// ~/.editzffaleta/OpenCraft.json
{
  session: {
    scope: "per-sender", // manter chaves de grupo separadas
    dmScope: "main", // continuidade de DM (defina per-channel-peer/per-account-channel-peer para caixas de entrada compartilhadas)
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      // Padroes: mode=daily, atHour=4 (horario local do host do Gateway).
      // Se voce tambem definir idleMinutes, o que expirar primeiro vence.
      mode: "daily",
      atHour: 4,
      idleMinutes: 120,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.opencraft/agents/{agentId}/sessions/sessions.json",
    mainKey: "main",
  },
}
```

## Inspecionando

- `opencraft status` — mostra o caminho do armazenamento e sessoes recentes.
- `opencraft sessions --json` — despeja todas as entradas (filtre com `--active <minutes>`).
- `opencraft gateway call sessions.list --params '{}'` — busca sessoes do Gateway em execucao (use `--url`/`--token` para acesso remoto ao Gateway).
- Envie `/status` como uma mensagem independente no chat para ver se o agente esta alcancavel, quanto do contexto da sessao esta usado, toggles atuais de pensamento/rapido/verbose e quando suas credenciais WhatsApp web foram atualizadas pela ultima vez (ajuda a identificar necessidades de re-vinculacao).
- Envie `/context list` ou `/context detail` para ver o que esta no prompt de sistema e arquivos de workspace injetados (e os maiores contribuidores de contexto).
- Envie `/stop` (ou frases de aborto independentes como `stop`, `stop action`, `stop run`, `stop opencraft`) para abortar a execucao atual, limpar followups enfileirados para aquela sessao e parar quaisquer execucoes de sub-agente originadas dela (a resposta inclui a contagem de paradas).
- Envie `/compact` (instrucoes opcionais) como uma mensagem independente para resumir contexto mais antigo e liberar espaco da janela. Veja [/concepts/compaction](/concepts/compaction).
- Transcricoes JSONL podem ser abertas diretamente para revisar turnos completos.

## Dicas

- Mantenha a chave primaria dedicada ao trafego 1:1; deixe os grupos manterem suas proprias chaves.
- Ao automatizar a limpeza, exclua chaves individuais em vez de todo o armazenamento para preservar o contexto em outros lugares.

## Metadados de origem da sessao

Cada entrada de sessao registra de onde ela veio (melhor esforco) em `origin`:

- `label`: rotulo humano (resolvido do rotulo de conversa + assunto/canal do grupo)
- `provider`: ID de canal normalizado (incluindo extensoes)
- `from`/`to`: IDs de roteamento brutos do envelope de entrada
- `accountId`: ID de conta do provedor (quando multi-conta)
- `threadId`: ID de thread/topico quando o canal suporta
  Os campos de origem sao preenchidos para mensagens diretas, canais e grupos. Se um
  conector apenas atualiza o roteamento de entrega (por exemplo, para manter uma sessao principal de DM
  atualizada), ele ainda deve fornecer contexto de entrada para que a sessao mantenha seus
  metadados explicativos. Extensoes podem fazer isso enviando `ConversationLabel`,
  `GroupSubject`, `GroupChannel`, `GroupSpace` e `SenderName` no contexto de
  entrada e chamando `recordSessionMetaFromInbound` (ou passando o mesmo contexto
  para `updateLastRoute`).
