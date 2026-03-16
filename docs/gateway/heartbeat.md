---
summary: "Mensagens de polling de heartbeat e regras de notificação"
read_when:
  - Ajustando cadência ou mensagens de heartbeat
  - Decidindo entre heartbeat e cron para tarefas agendadas
title: "Heartbeat"
---

# Heartbeat (Gateway)

> **Heartbeat vs Cron?** Veja [Cron vs Heartbeat](/automation/cron-vs-heartbeat) para orientação sobre quando usar cada um.

O Heartbeat executa **turnos periódicos do agente** na sessão principal para que o modelo possa
surfaçar qualquer coisa que precise de atenção sem enviar spam.

Resolução de problemas: [/automation/troubleshooting](/automation/troubleshooting)

## Início rápido (iniciante)

1. Deixe os heartbeats habilitados (padrão é `30m`, ou `1h` para OAuth/setup-token Anthropic) ou defina sua própria cadência.
2. Crie um pequeno checklist `HEARTBEAT.md` no workspace do agente (opcional mas recomendado).
3. Decida para onde as mensagens de heartbeat devem ir (`target: "none"` é o padrão; defina `target: "last"` para rotear ao último contato).
4. Opcional: habilite entrega de reasoning do heartbeat para transparência.
5. Opcional: use contexto de bootstrap leve se os runs de heartbeat precisarem apenas do `HEARTBEAT.md`.
6. Opcional: habilite sessões isoladas para evitar enviar histórico completo de conversa a cada heartbeat.
7. Opcional: restrinja heartbeats a horas ativas (horário local).

Exemplo de config:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita ao último contato (padrão é "none")
        directPolicy: "allow", // padrão: permitir targets diretos/DM; defina "block" para suprimir
        lightContext: true, // opcional: injeta apenas HEARTBEAT.md dos arquivos de bootstrap
        isolatedSession: true, // opcional: sessão fresh a cada run (sem histórico de conversa)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcional: enviar mensagem `Reasoning:` separada também
      },
    },
  },
}
```

## Padrões

- Intervalo: `30m` (ou `1h` quando OAuth/setup-token Anthropic é o modo de auth detectado). Defina `agents.defaults.heartbeat.every` ou por agente `agents.list[].heartbeat.every`; use `0m` para desabilitar.
- Corpo do prompt (configurável via `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- O prompt de heartbeat é enviado **verbatim** como a mensagem do usuário. O system
  prompt inclui uma seção "Heartbeat" e o run é sinalizado internamente.
- Horas ativas (`heartbeat.activeHours`) são verificadas no timezone configurado.
  Fora da janela, heartbeats são pulados até o próximo tick dentro da janela.

## Para que serve o prompt de heartbeat

O prompt padrão é intencionalmente amplo:

- **Tarefas em background**: "Consider outstanding tasks" incentiva o agente a revisar
  acompanhamentos (inbox, calendário, lembretes, trabalho em fila) e surfaçar qualquer urgente.
- **Check-in humano**: "Checkup sometimes on your human during day time" incentiva uma
  mensagem leve ocasional de "precisa de algo?", mas evita spam noturno
  usando seu timezone local configurado (veja [/concepts/timezone](/concepts/timezone)).

Se você quer que um heartbeat faça algo muito específico (ex. "verificar estatísticas PubSub do Gmail"
ou "verificar saúde do gateway"), defina `agents.defaults.heartbeat.prompt` (ou
`agents.list[].heartbeat.prompt`) com um corpo personalizado (enviado verbatim).

## Contrato de resposta

- Se nada precisa de atenção, responda com **`HEARTBEAT_OK`**.
- Durante runs de heartbeat, o OpenCraft trata `HEARTBEAT_OK` como um ack quando aparece
  no **início ou fim** da resposta. O token é removido e a resposta é
  descartada se o conteúdo restante for **≤ `ackMaxChars`** (padrão: 300).
- Se `HEARTBEAT_OK` aparecer no **meio** de uma resposta, não é tratado
  de forma especial.
- Para alertas, **não** inclua `HEARTBEAT_OK`; retorne apenas o texto do alerta.

Fora de heartbeats, `HEARTBEAT_OK` avulso no início/fim de uma mensagem é removido
e registrado; uma mensagem que é apenas `HEARTBEAT_OK` é descartada.

## Config

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // padrão: 30m (0m desabilita)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // padrão: false (entrega mensagem Reasoning: separada quando disponível)
        lightContext: false, // padrão: false; true mantém apenas HEARTBEAT.md dos arquivos de bootstrap do workspace
        isolatedSession: false, // padrão: false; true roda cada heartbeat em sessão fresh (sem histórico de conversa)
        target: "last", // padrão: none | opções: last | none | <channel id> (core ou plugin, ex. "bluebubbles")
        to: "+15551234567", // substituição opcional específica do canal
        accountId: "ops-bot", // id de conta multi-conta opcional
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // máximo de chars permitidos após HEARTBEAT_OK
      },
    },
  },
}
```

### Escopo e precedência

- `agents.defaults.heartbeat` define comportamento global de heartbeat.
- `agents.list[].heartbeat` mescla por cima; se qualquer agente tiver um bloco `heartbeat`, **apenas esses agentes** executam heartbeats.
- `channels.defaults.heartbeat` define padrões de visibilidade para todos os canais.
- `channels.<channel>.heartbeat` substitui os padrões do canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canais multi-conta) substitui configurações por canal.

### Heartbeats por agente

Se qualquer entrada `agents.list[]` incluir um bloco `heartbeat`, **apenas esses agentes**
executam heartbeats. O bloco por agente mescla por cima de `agents.defaults.heartbeat`
(então você pode definir padrões compartilhados uma vez e substituir por agente).

Exemplo: dois agentes, apenas o segundo agente executa heartbeats.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita ao último contato (padrão é "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Exemplo de horas ativas

Restrinja heartbeats ao horário comercial em um timezone específico:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita ao último contato (padrão é "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // opcional; usa seu userTimezone se definido, caso contrário timezone do host
        },
      },
    },
  },
}
```

Fora desta janela (antes das 9h ou após as 22h Eastern), heartbeats são pulados. O próximo tick agendado dentro da janela rodará normalmente.

### Setup 24/7

Se você quer que heartbeats rodem o dia todo, use um desses padrões:

- Omita `activeHours` completamente (sem restrição de janela de tempo; este é o comportamento padrão).
- Defina uma janela de dia completo: `activeHours: { start: "00:00", end: "24:00" }`.

Não defina o mesmo horário `start` e `end` (por exemplo `08:00` a `08:00`).
Isso é tratado como uma janela de largura zero, então heartbeats são sempre pulados.

### Exemplo multi-conta

Use `accountId` para direcionar a uma conta específica em canais multi-conta como Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // opcional: roteie para um tópico/thread específico
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "SEU_TOKEN_DE_BOT_TELEGRAM" },
      },
    },
  },
}
```

### Notas de campo

- `every`: intervalo de heartbeat (string de duração; unidade padrão = minutos).
- `model`: substituição de modelo opcional para runs de heartbeat (`provider/model`).
- `includeReasoning`: quando habilitado, também entrega a mensagem `Reasoning:` separada quando disponível (mesmo formato que `/reasoning on`).
- `lightContext`: quando true, runs de heartbeat usam contexto de bootstrap leve e mantêm apenas `HEARTBEAT.md` dos arquivos de bootstrap do workspace.
- `isolatedSession`: quando true, cada heartbeat roda em uma sessão fresh sem histórico de conversa anterior. Usa o mesmo padrão de isolamento que cron `sessionTarget: "isolated"`. Reduz dramaticamente o custo de tokens por heartbeat. Combine com `lightContext: true` para máxima economia. O roteamento de entrega ainda usa o contexto da sessão principal.
- `session`: chave de sessão opcional para runs de heartbeat.
  - `main` (padrão): sessão principal do agente.
  - Chave de sessão explícita (copie de `opencraft sessions --json` ou do [CLI de sessões](/cli/sessions)).
  - Formatos de chave de sessão: veja [Sessions](/concepts/session) e [Groups](/channels/groups).
- `target`:
  - `last`: entrega ao último canal externo usado.
  - canal explícito: `whatsapp` / `telegram` / `discord` / `googlechat` / `slack` / `msteams` / `signal` / `imessage`.
  - `none` (padrão): executa o heartbeat mas **não entrega** externamente.
- `directPolicy`: controla o comportamento de entrega direta/DM:
  - `allow` (padrão): permite entrega de heartbeat direto/DM.
  - `block`: suprime entrega direta/DM (`reason=dm-blocked`).
- `to`: substituição de destinatário opcional (id específico do canal, ex. E.164 para WhatsApp ou um chat id do Telegram). Para tópicos/threads do Telegram, use `<chatId>:topic:<messageThreadId>`.
- `accountId`: id de conta opcional para canais multi-conta. Quando `target: "last"`, o id de conta se aplica ao último canal resolvido se ele suportar contas; caso contrário é ignorado. Se o id de conta não corresponder a uma conta configurada para o canal resolvido, a entrega é pulada.
- `prompt`: substitui o corpo do prompt padrão (não mesclado).
- `ackMaxChars`: máximo de chars permitidos após `HEARTBEAT_OK` antes da entrega.
- `suppressToolErrorWarnings`: quando true, suprime payloads de aviso de erro de tool durante runs de heartbeat.
- `activeHours`: restringe runs de heartbeat a uma janela de tempo. Objeto com `start` (HH:MM, inclusivo; use `00:00` para início do dia), `end` (HH:MM exclusivo; `24:00` permitido para fim do dia), e `timezone` opcional.
  - Omitido ou `"user"`: usa seu `agents.defaults.userTimezone` se definido, caso contrário usa o timezone do sistema host.
  - `"local"`: sempre usa o timezone do sistema host.
  - Qualquer identificador IANA (ex. `America/New_York`): usado diretamente; se inválido, usa o comportamento `"user"` acima.
  - `start` e `end` não devem ser iguais para uma janela ativa; valores iguais são tratados como largura zero (sempre fora da janela).
  - Fora da janela ativa, heartbeats são pulados até o próximo tick dentro da janela.

## Comportamento de entrega

- Heartbeats rodam na sessão principal do agente por padrão (`agent:<id>:<mainKey>`),
  ou `global` quando `session.scope = "global"`. Defina `session` para substituir por uma
  sessão de canal específica (Discord/WhatsApp/etc.).
- `session` afeta apenas o contexto de run; a entrega é controlada por `target` e `to`.
- Para entregar a um canal/destinatário específico, defina `target` + `to`. Com
  `target: "last"`, a entrega usa o último canal externo para aquela sessão.
- Entregas de heartbeat permitem targets diretos/DM por padrão. Defina `directPolicy: "block"` para suprimir envios de target direto enquanto ainda executa o turno de heartbeat.
- Se a fila principal estiver ocupada, o heartbeat é pulado e tentado novamente depois.
- Se `target` resolver para nenhum destino externo, o run ainda acontece mas nenhuma
  mensagem de saída é enviada.
- Respostas somente de heartbeat **não** mantêm a sessão ativa; o último `updatedAt`
  é restaurado para que a expiração por inatividade funcione normalmente.

## Controles de visibilidade

Por padrão, acknowledgments `HEARTBEAT_OK` são suprimidos enquanto conteúdo de alerta é
entregue. Você pode ajustar isso por canal ou por conta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ocultar HEARTBEAT_OK (padrão)
      showAlerts: true # Mostrar mensagens de alerta (padrão)
      useIndicator: true # Emitir eventos de indicador (padrão)
  telegram:
    heartbeat:
      showOk: true # Mostrar acknowledgments OK no Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suprimir entrega de alertas para esta conta
```

Precedência: por conta → por canal → padrões do canal → padrões built-in.

### O que cada flag faz

- `showOk`: envia um acknowledgment `HEARTBEAT_OK` quando o modelo retorna uma resposta somente-OK.
- `showAlerts`: envia o conteúdo do alerta quando o modelo retorna uma resposta não-OK.
- `useIndicator`: emite eventos de indicador para superfícies de status da UI.

Se **todas as três** forem false, o OpenCraft pula o run de heartbeat completamente (sem chamada ao modelo).

### Exemplos por canal vs por conta

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # todas as contas Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suprime alertas apenas para a conta ops
  telegram:
    heartbeat:
      showOk: true
```

### Padrões comuns

| Objetivo                                            | Config                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamento padrão (OKs silenciosos, alertas on)  | _(sem config necessária)_                                                                |
| Totalmente silencioso (sem mensagens, sem indicador) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Somente indicador (sem mensagens)                   | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs em apenas um canal                              | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcional)

Se um arquivo `HEARTBEAT.md` existir no workspace, o prompt padrão diz ao
agente para lê-lo. Pense nele como seu "checklist de heartbeat": pequeno, estável e
seguro para incluir a cada 30 minutos.

Se `HEARTBEAT.md` existir mas estiver efetivamente vazio (apenas linhas em branco e
cabeçalhos markdown como `# Heading`), o OpenCraft pula o run de heartbeat para economizar chamadas de API.
Se o arquivo estiver faltando, o heartbeat ainda roda e o modelo decide o que fazer.

Mantenha-o pequeno (checklist curto ou lembretes) para evitar inchaço de prompt.

Exemplo de `HEARTBEAT.md`:

```md
# Checklist de heartbeat

- Varredura rápida: algo urgente nos inboxes?
- Se for de dia, faça um check-in leve se nada mais estiver pendente.
- Se uma tarefa estiver bloqueada, anote _o que está faltando_ e pergunte na próxima vez.
```

### O agente pode atualizar o HEARTBEAT.md?

Sim — se você pedir.

`HEARTBEAT.md` é apenas um arquivo normal no workspace do agente, então você pode dizer ao
agente (em uma conversa normal) algo como:

- "Atualize o `HEARTBEAT.md` para adicionar uma verificação diária de calendário."
- "Reescreva o `HEARTBEAT.md` para ser mais curto e focado em acompanhamentos de inbox."

Se você quer que isso aconteça proativamente, também pode incluir uma linha explícita no
seu prompt de heartbeat como: "Se o checklist ficar desatualizado, atualize HEARTBEAT.md
com um melhor."

Nota de segurança: não coloque segredos (chaves de API, números de telefone, tokens privados) no
`HEARTBEAT.md` — ele se torna parte do contexto do prompt.

## Wake manual (sob demanda)

Você pode enfileirar um evento de sistema e acionar um heartbeat imediato com:

```bash
opencraft system event --text "Check for urgent follow-ups" --mode now
```

Se múltiplos agentes tiverem `heartbeat` configurado, um wake manual executa cada um desses
heartbeats de agente imediatamente.

Use `--mode next-heartbeat` para aguardar o próximo tick agendado.

## Entrega de reasoning (opcional)

Por padrão, heartbeats entregam apenas o payload de "resposta" final.

Se você quer transparência, habilite:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando habilitado, heartbeats também entregarão uma mensagem separada prefixada
com `Reasoning:` (mesmo formato que `/reasoning on`). Isso pode ser útil quando o agente
está gerenciando múltiplas sessões/codexes e você quer ver por que ele decidiu te avisar
— mas também pode vazar mais detalhes internos do que você quer. Prefira manter desabilitado em chats de grupo.

## Consciência de custo

Heartbeats executam turnos completos do agente. Intervalos mais curtos consomem mais tokens. Para reduzir custos:

- Use `isolatedSession: true` para evitar enviar histórico completo de conversa (~100K tokens reduz para ~2-5K por run).
- Use `lightContext: true` para limitar arquivos de bootstrap a apenas `HEARTBEAT.md`.
- Defina um `model` mais barato (ex. `ollama/llama3.2:1b`).
- Mantenha `HEARTBEAT.md` pequeno.
- Use `target: "none"` se quiser apenas atualizações de estado interno.
