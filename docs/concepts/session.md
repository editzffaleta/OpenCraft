---
summary: "Regras de gerenciamento de sessão, chaves e persistência para chats"
read_when:
  - Modificando tratamento ou armazenamento de sessão
title: "Gerenciamento de Sessão"
---

# Gerenciamento de Sessão

O OpenCraft trata **uma sessão de chat direto por agente** como primária. Chats diretos colapsam para `agent:<agentId>:<mainKey>` (padrão `main`), enquanto chats de grupo/canal recebem suas próprias chaves. `session.mainKey` é respeitado.

Use `session.dmScope` para controlar como **mensagens diretas** são agrupadas:

- `main` (padrão): todos os DMs compartilham a sessão principal para continuidade.
- `per-peer`: isolar por id de remetente entre canais.
- `per-channel-peer`: isolar por canal + remetente (recomendado para caixas de entrada multi-usuário).
- `per-account-channel-peer`: isolar por conta + canal + remetente (recomendado para caixas de entrada multi-conta).
  Use `session.identityLinks` para mapear ids de peer com prefixo de provedor para uma identidade canônica para que a mesma pessoa compartilhe uma sessão de DM entre canais ao usar `per-peer`, `per-channel-peer` ou `per-account-channel-peer`.

## Modo DM seguro (recomendado para configurações multi-usuário)

> **Aviso de Segurança:** Se seu agente pode receber DMs de **múltiplas pessoas**, você deve considerar fortemente habilitar o modo DM seguro. Sem ele, todos os usuários compartilham o mesmo contexto de conversa, o que pode vazar informações privadas entre usuários.

**Exemplo do problema com as configurações padrão:**

- Alice (`<SENDER_A>`) manda mensagem para seu agente sobre um tópico privado (por exemplo, uma consulta médica)
- Bob (`<SENDER_B>`) manda mensagem para seu agente perguntando "Sobre o que estávamos falando?"
- Como ambos os DMs compartilham a mesma sessão, o modelo pode responder ao Bob usando o contexto anterior da Alice.

**A correção:** Defina `dmScope` para isolar sessões por usuário:

```json5
// ~/.opencraft/opencraft.json
{
  session: {
    // Modo DM seguro: isolar contexto de DM por canal + remetente.
    dmScope: "per-channel-peer",
  },
}
```

**Quando habilitar:**

- Você tem aprovações de pareamento para mais de um remetente
- Você usa uma allowlist de DM com múltiplas entradas
- Você define `dmPolicy: "open"`
- Múltiplos números de telefone ou contas podem enviar mensagens para seu agente

Notas:

- Padrão é `dmScope: "main"` para continuidade (todos os DMs compartilham a sessão principal). Isso é adequado para configurações de usuário único.
- O onboarding local da CLI escreve `session.dmScope: "per-channel-peer"` por padrão quando não definido (valores explícitos existentes são preservados).
- Para caixas de entrada multi-conta no mesmo canal, prefira `per-account-channel-peer`.
- Se a mesma pessoa entrar em contato por múltiplos canais, use `session.identityLinks` para colapsar suas sessões de DM em uma identidade canônica.
- Você pode verificar suas configurações de DM com `opencraft security audit` (veja [security](/cli/security)).

## O gateway é a fonte da verdade

Todo o estado de sessão é **de propriedade do gateway** (o OpenCraft "master"). Clientes UI (app macOS, WebChat, etc.) devem consultar o gateway para listas de sessão e contagens de token em vez de ler arquivos locais.

- Em **modo remoto**, o armazenamento de sessão que você se importa fica no host do gateway remoto, não no seu Mac.
- Contagens de token mostradas nas UIs vêm dos campos de armazenamento do gateway (`inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`). Os clientes não analisam transcrições JSONL para "corrigir" totais.

## Onde o estado fica

- No **host do gateway**:
  - Arquivo de store: `~/.opencraft/agents/<agentId>/sessions/sessions.json` (por agente).
- Transcrições: `~/.opencraft/agents/<agentId>/sessions/<SessionId>.jsonl` (sessões de tópico Telegram usam `.../<SessionId>-topic-<threadId>.jsonl`).
- O store é um mapa `sessionKey -> { sessionId, updatedAt, ... }`. Deletar entradas é seguro; elas são recriadas sob demanda.
- Entradas de grupo podem incluir `displayName`, `channel`, `subject`, `room` e `space` para rotular sessões nas UIs.
- Entradas de sessão incluem metadados `origin` (rótulo + hints de roteamento) para que UIs possam explicar de onde uma sessão veio.
- O OpenCraft **não** lê pastas de sessão Pi/Tau legadas.

## Manutenção

O OpenCraft aplica manutenção de store de sessão para manter `sessions.json` e artefatos de transcrição limitados ao longo do tempo.

### Padrões

- `session.maintenance.mode`: `warn`
- `session.maintenance.pruneAfter`: `30d`
- `session.maintenance.maxEntries`: `500`
- `session.maintenance.rotateBytes`: `10mb`
- `session.maintenance.resetArchiveRetention`: padrão para `pruneAfter` (`30d`)
- `session.maintenance.maxDiskBytes`: não definido (desabilitado)
- `session.maintenance.highWaterBytes`: padrão para `80%` de `maxDiskBytes` quando orçamento estiver habilitado

### Como funciona

A manutenção roda durante escritas no store de sessão, e você pode acioná-la sob demanda com `opencraft sessions cleanup`.

- `mode: "warn"`: reporta o que seria despejado mas não muta entradas/transcrições.
- `mode: "enforce"`: aplica limpeza nesta ordem:
  1. remover entradas obsoletas mais antigas que `pruneAfter`
  2. limitar contagem de entradas a `maxEntries` (mais antigas primeiro)
  3. arquivar arquivos de transcrição para entradas removidas que não são mais referenciadas
  4. purgar archives antigos `*.deleted.<timestamp>` e `*.reset.<timestamp>` por política de retenção
  5. rotacionar `sessions.json` quando exceder `rotateBytes`
  6. se `maxDiskBytes` estiver definido, aplicar orçamento de disco em direção a `highWaterBytes` (artefatos mais antigos primeiro, depois sessões mais antigas)

### Advertência de performance para stores grandes

Stores de sessão grandes são comuns em configurações de alto volume. O trabalho de manutenção é trabalho no caminho de escrita, então stores muito grandes podem aumentar a latência de escrita.

O que mais aumenta o custo:

- valores muito altos de `session.maintenance.maxEntries`
- janelas `pruneAfter` longas que mantêm entradas obsoletas por perto
- muitos artefatos de transcrição/arquivo em `~/.opencraft/agents/<agentId>/sessions/`
- habilitar orçamentos de disco (`maxDiskBytes`) sem limites razoáveis de pruning/cap

O que fazer:

- use `mode: "enforce"` em produção para que o crescimento seja limitado automaticamente
- defina limites de tempo e contagem (`pruneAfter` + `maxEntries`), não apenas um
- defina `maxDiskBytes` + `highWaterBytes` para limites superiores rígidos em grandes implantações
- mantenha `highWaterBytes` significativamente abaixo de `maxDiskBytes` (padrão é 80%)
- rode `opencraft sessions cleanup --dry-run --json` após mudanças de config para verificar o impacto projetado antes de aplicar
- para sessões ativas frequentes, passe `--active-key` ao rodar limpeza manual

### Exemplos de customização

Use uma política de enforce conservadora:

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

Habilitar um orçamento de disco rígido para o diretório de sessões:

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

Ajustar para instalações maiores (exemplo):

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

Pré-visualizar ou forçar manutenção pela CLI:

```bash
opencraft sessions cleanup --dry-run
opencraft sessions cleanup --enforce
```

## Poda de sessão

O OpenCraft apara **resultados de ferramentas antigos** do contexto em memória logo antes das chamadas ao LLM por padrão.
Isso **não** reescreve o histórico JSONL. Veja [/concepts/session-pruning](/concepts/session-pruning).

## Flush de memória pré-compactação

Quando uma sessão se aproxima da auto-compactação, o OpenCraft pode rodar uma rodada **silenciosa de flush de memória**
que lembra o modelo de escrever notas duráveis em disco. Isso só roda quando
o workspace for gravável. Veja [Memória](/concepts/memory) e
[Compactação](/concepts/compaction).

## Mapeamento de transportes → chaves de sessão

- Chats diretos seguem `session.dmScope` (padrão `main`).
  - `main`: `agent:<agentId>:<mainKey>` (continuidade entre dispositivos/canais).
    - Múltiplos números de telefone e canais podem mapear para a mesma chave principal do agente; eles atuam como transportes para uma conversa.
  - `per-peer`: `agent:<agentId>:direct:<peerId>`.
  - `per-channel-peer`: `agent:<agentId>:<channel>:direct:<peerId>`.
  - `per-account-channel-peer`: `agent:<agentId>:<channel>:<accountId>:direct:<peerId>` (accountId padrão para `default`).
  - Se `session.identityLinks` corresponder a um id de peer com prefixo de provedor (por exemplo `telegram:123`), a chave canônica substitui `<peerId>` para que a mesma pessoa compartilhe uma sessão entre canais.
- Chats de grupo isolam estado: `agent:<agentId>:<channel>:group:<id>` (salas/canais usam `agent:<agentId>:<channel>:channel:<id>`).
  - Tópicos de fórum Telegram anexam `:topic:<threadId>` ao id do grupo para isolamento.
  - Chaves `group:<id>` legadas ainda são reconhecidas para migração.
- Contextos de entrada ainda podem usar `group:<id>`; o canal é inferido de `Provider` e normalizado para a forma canônica `agent:<agentId>:<channel>:group:<id>`.
- Outras fontes:
  - Jobs cron: `cron:<job.id>` (isolado) ou `session:<custom-id>` customizado (persistente)
  - Webhooks: `hook:<uuid>` (a não ser que explicitamente definido pelo hook)
  - Execuções de node: `node-<nodeId>`

## Ciclo de vida

- Política de reset: sessões são reutilizadas até expirarem, e a expiração é avaliada na próxima mensagem de entrada.
- Reset diário: padrão para **4:00 AM hora local no host do gateway**. Uma sessão fica obsoleta uma vez que sua última atualização seja anterior ao tempo de reset diário mais recente.
- Reset por ociosidade (opcional): `idleMinutes` adiciona uma janela de ociosidade deslizante. Quando ambos os resets diário e por ociosidade estão configurados, **o que expirar primeiro** força uma nova sessão.
- Legado somente ociosidade: se você definir `session.idleMinutes` sem nenhuma config `session.reset`/`resetByType`, o OpenCraft permanece no modo somente ociosidade para compatibilidade retroativa.
- Overrides por tipo (opcional): `resetByType` permite sobrescrever a política para sessões `direct`, `group` e `thread` (thread = threads do Slack/Discord, tópicos Telegram, threads Matrix quando fornecido pelo conector).
- Overrides por canal (opcional): `resetByChannel` sobrescreve a política de reset para um canal (aplica-se a todos os tipos de sessão para aquele canal e tem precedência sobre `reset`/`resetByType`).
- Gatilhos de reset: `/new` ou `/reset` exatos (mais quaisquer extras em `resetTriggers`) iniciam um novo id de sessão e passam o restante da mensagem. `/new <model>` aceita um alias de modelo, `provider/model` ou nome de provedor (match fuzzy) para definir o modelo da nova sessão. Se `/new` ou `/reset` for enviado sozinho, o OpenCraft roda um curto turno de saudação "hello" para confirmar o reset.
- Reset manual: deletar chaves específicas do store ou remover a transcrição JSONL; a próxima mensagem as recria.
- Jobs cron isolados sempre criam um novo `sessionId` por execução (sem reutilização por ociosidade).

## Política de envio (opcional)

Bloquear entrega para tipos específicos de sessão sem listar ids individuais.

```json5
{
  session: {
    sendPolicy: {
      rules: [
        { action: "deny", match: { channel: "discord", chatType: "group" } },
        { action: "deny", match: { keyPrefix: "cron:" } },
        // Corresponder à chave de sessão bruta (incluindo o prefixo `agent:<id>:`).
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ],
      default: "allow",
    },
  },
}
```

Override de runtime (apenas proprietário):

- `/send on` → permitir para esta sessão
- `/send off` → negar para esta sessão
- `/send inherit` → limpar override e usar regras de config
  Envie-os como mensagens standalone para que sejam registrados.

## Configuração (exemplo de renomeação opcional)

```json5
// ~/.opencraft/opencraft.json
{
  session: {
    scope: "per-sender", // manter chaves de grupo separadas
    dmScope: "main", // continuidade de DM (definir per-channel-peer/per-account-channel-peer para caixas de entrada compartilhadas)
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      // Padrões: mode=daily, atHour=4 (hora local do host do gateway).
      // Se você também definir idleMinutes, o que expirar primeiro vence.
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

- `opencraft status` — mostra caminho do store e sessões recentes.
- `opencraft sessions --json` — despeja todas as entradas (filtrar com `--active <minutes>`).
- `opencraft gateway call sessions.list --params '{}'` — busca sessões do gateway em execução (use `--url`/`--token` para acesso remoto ao gateway).
- Envie `/status` como uma mensagem standalone no chat para ver se o agente está acessível, quanto do contexto de sessão está sendo usado, toggles atuais de thinking/fast/verbose e quando suas credenciais do WhatsApp web foram atualizadas pela última vez (ajuda a identificar necessidades de revinculação).
- Envie `/context list` ou `/context detail` para ver o que está no system prompt e arquivos de workspace injetados (e os maiores contribuidores de contexto).
- Envie `/stop` (ou frases de aborto standalone como `stop`, `stop action`, `stop run`, `stop opencraft`) para abortar a execução atual, limpar followups enfileirados para aquela sessão e parar quaisquer execuções de sub-agente spawnadas a partir dela (a resposta inclui a contagem parada).
- Envie `/compact` (instruções opcionais) como uma mensagem standalone para resumir contexto mais antigo e liberar espaço da janela. Veja [/concepts/compaction](/concepts/compaction).
- Transcrições JSONL podem ser abertas diretamente para revisar turnos completos.

## Dicas

- Mantenha a chave primária dedicada ao tráfego 1:1; deixe grupos manter suas próprias chaves.
- Ao automatizar limpeza, delete chaves individuais em vez de todo o store para preservar contexto em outros lugares.

## Metadados de origem da sessão

Cada entrada de sessão registra de onde veio (melhor esforço) em `origin`:

- `label`: rótulo humano (resolvido a partir do rótulo de conversa + assunto/canal do grupo)
- `provider`: id de canal normalizado (incluindo extensões)
- `from`/`to`: ids de roteamento brutos do envelope de entrada
- `accountId`: id de conta do provedor (quando multi-conta)
- `threadId`: id de thread/tópico quando o canal suporta
  Os campos de origem são populados para mensagens diretas, canais e grupos. Se um
  conector apenas atualiza o roteamento de entrega (por exemplo, para manter uma sessão principal de DM
  atualizada), ele ainda deve fornecer contexto de entrada para que a sessão mantenha seus
  metadados explicativos. Extensões podem fazer isso enviando `ConversationLabel`,
  `GroupSubject`, `GroupChannel`, `GroupSpace` e `SenderName` no contexto de entrada
  e chamando `recordSessionMetaFromInbound` (ou passando o mesmo contexto
  para `updateLastRoute`).
