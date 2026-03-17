---
summary: "Mensagens de polling periódico do heartbeat e regras de notificação"
read_when:
  - Ajustando cadência ou mensagens do heartbeat
  - Decidindo entre heartbeat e cron para tarefas agendadas
title: "Heartbeat"
---

# Heartbeat (Gateway)

> **Heartbeat vs Cron?** Veja [Cron vs Heartbeat](/automation/cron-vs-heartbeat) para orientação sobre quando usar cada um.

O Heartbeat executa **turnos periódicos de agente** na sessão principal para que o modelo possa trazer à tona qualquer coisa que precise de atenção sem enviar spam.

Solução de problemas: [/automation/troubleshooting](/automation/troubleshooting)

## Início rápido (iniciante)

1. Deixe heartbeats habilitados (o padrão é `30m`, ou `1h` para Anthropic OAuth/setup-token) ou defina sua própria cadência.
2. Crie um pequeno checklist `HEARTBEAT.md` no workspace do agente (opcional mas recomendado).
3. Decida para onde mensagens de heartbeat devem ir (`target: "none"` é o padrão; defina `target: "last"` para rotear ao último contato).
4. Opcional: habilite entrega de raciocínio do heartbeat para transparência.
5. Opcional: use contexto de bootstrap leve se execuções de heartbeat precisam apenas do `HEARTBEAT.md`.
6. Opcional: habilite sessões isoladas para evitar enviar histórico completo de conversa a cada heartbeat.
7. Opcional: restrinja heartbeats a horários ativos (hora local).

Exemplo de config:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita ao último contato (padrão é "none")
        directPolicy: "allow", // padrão: permitir alvos diretos/DM; defina "block" para suprimir
        lightContext: true, // opcional: injetar apenas HEARTBEAT.md dos arquivos de bootstrap
        isolatedSession: true, // opcional: sessão nova a cada execução (sem histórico de conversa)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcional: enviar mensagem separada `Reasoning:` também
      },
    },
  },
}
```

## Padrões

- Intervalo: `30m` (ou `1h` quando Anthropic OAuth/setup-token é o modo de auth detectado). Defina `agents.defaults.heartbeat.every` ou por agente `agents.list[].heartbeat.every`; use `0m` para desabilitar.
- Corpo do prompt (configurável via `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- O prompt do heartbeat é enviado **literalmente** como a mensagem do usuário. O system prompt inclui uma seção "Heartbeat" e a execução é sinalizada internamente.
- Horários ativos (`heartbeat.activeHours`) são verificados no fuso horário configurado. Fora da janela, heartbeats são pulados até o próximo tick dentro da janela.

## Para que serve o prompt do heartbeat

O prompt padrão é intencionalmente amplo:

- **Tarefas em background**: "Consider outstanding tasks" incentiva o agente a revisar follow-ups (inbox, calendário, lembretes, trabalho em fila) e trazer à tona qualquer coisa urgente.
- **Check-in humano**: "Checkup sometimes on your human during day time" incentiva uma mensagem leve ocasional "precisa de algo?", mas evita spam noturno usando seu fuso horário local configurado (veja [/concepts/timezone](/concepts/timezone)).

Se você quer que um heartbeat faça algo muito específico (ex. "verificar stats PubSub do Gmail" ou "verificar saúde do gateway"), defina `agents.defaults.heartbeat.prompt` (ou `agents.list[].heartbeat.prompt`) com um corpo customizado (enviado literalmente).

## Contrato de resposta

- Se nada precisa de atenção, responda com **`HEARTBEAT_OK`**.
- Durante execuções de heartbeat, OpenCraft trata `HEARTBEAT_OK` como um ack quando aparece no **início ou fim** da resposta. O token é removido e a resposta é descartada se o conteúdo restante é **≤ `ackMaxChars`** (padrão: 300).
- Se `HEARTBEAT_OK` aparece no **meio** de uma resposta, não é tratado especialmente.
- Para alertas, **não** inclua `HEARTBEAT_OK`; retorne apenas o texto do alerta.

Fora de heartbeats, `HEARTBEAT_OK` perdido no início/fim de uma mensagem é removido e logado; uma mensagem que é apenas `HEARTBEAT_OK` é descartada.

## Config

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // padrão: 30m (0m desabilita)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // padrão: false (entregar mensagem separada Reasoning: quando disponível)
        lightContext: false, // padrão: false; true mantém apenas HEARTBEAT.md dos arquivos de bootstrap do workspace
        isolatedSession: false, // padrão: false; true executa cada heartbeat em uma sessão nova (sem histórico de conversa)
        target: "last", // padrão: none | opções: last | none | <channel id> (core ou plugin, ex. "bluebubbles")
        to: "+15551234567", // override opcional específico de canal
        accountId: "ops-bot", // id de canal multi-conta opcional
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // máximo de chars permitidos após HEARTBEAT_OK
      },
    },
  },
}
```

### Escopo e precedência

- `agents.defaults.heartbeat` define o comportamento global do heartbeat.
- `agents.list[].heartbeat` faz merge por cima; se qualquer agente tem um bloco `heartbeat`, **apenas esses agentes** executam heartbeats.
- `channels.defaults.heartbeat` define padrões de visibilidade para todos os canais.
- `channels.<channel>.heartbeat` sobrescreve padrões de canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canais multi-conta) sobrescreve configurações por canal.

### Heartbeats por agente

Se qualquer entrada `agents.list[]` incluir um bloco `heartbeat`, **apenas esses agentes** executam heartbeats. O bloco por agente faz merge por cima de `agents.defaults.heartbeat` (então você pode definir padrões compartilhados uma vez e sobrescrever por agente).

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

### Exemplo de horários ativos

Restrinja heartbeats ao horário comercial em um fuso horário específico:

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
          timezone: "America/New_York", // opcional; usa seu userTimezone se definido, caso contrário tz do host
        },
      },
    },
  },
}
```

Fora desta janela (antes das 9h ou depois das 22h Horário do Leste), heartbeats são pulados. O próximo tick agendado dentro da janela executará normalmente.

### Setup 24/7

Se você quer que heartbeats executem o dia todo, use um destes padrões:

- Omita `activeHours` inteiramente (sem restrição de janela de tempo; este é o comportamento padrão).
- Defina uma janela de dia completo: `activeHours: { start: "00:00", end: "24:00" }`.

Não defina o mesmo horário de `start` e `end` (por exemplo `08:00` a `08:00`). Isso é tratado como uma janela de largura zero, então heartbeats são sempre pulados.

### Exemplo multi-conta

Use `accountId` para direcionar uma conta específica em canais multi-conta como Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // opcional: rotear para um tópico/thread específico
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Notas dos campos

- `every`: intervalo do heartbeat (string de duração; unidade padrão = minutos).
- `model`: override opcional de modelo para execuções de heartbeat (`provider/model`).
- `includeReasoning`: quando habilitado, também entrega a mensagem separada `Reasoning:` quando disponível (mesmo formato que `/reasoning on`).
- `lightContext`: quando true, execuções de heartbeat usam contexto de bootstrap leve e mantêm apenas `HEARTBEAT.md` dos arquivos de bootstrap do workspace.
- `isolatedSession`: quando true, cada heartbeat executa em uma sessão nova sem histórico de conversa anterior. Usa o mesmo padrão de isolamento que cron `sessionTarget: "isolated"`. Reduz dramaticamente o custo de tokens por heartbeat. Combine com `lightContext: true` para máxima economia. Roteamento de entrega ainda usa o contexto da sessão principal.
- `session`: chave de sessão opcional para execuções de heartbeat.
  - `main` (padrão): sessão principal do agente.
  - Chave de sessão explícita (copie de `opencraft sessions --json` ou do [sessions CLI](/cli/sessions)).
  - Formatos de chave de sessão: veja [Sessions](/concepts/session) e [Groups](/channels/groups).
- `target`:
  - `last`: entregar ao último canal externo usado.
  - canal explícito: `whatsapp` / `telegram` / `discord` / `googlechat` / `slack` / `msteams` / `signal` / `imessage`.
  - `none` (padrão): executar o heartbeat mas **não entregar** externamente.
- `directPolicy`: controla comportamento de entrega direta/DM:
  - `allow` (padrão): permitir entrega de heartbeat direta/DM.
  - `block`: suprimir entrega direta/DM (`reason=dm-blocked`).
- `to`: override opcional de destinatário (id específico de canal, ex. E.164 para WhatsApp ou id de chat do Telegram). Para tópicos/threads do Telegram, use `<chatId>:topic:<messageThreadId>`.
- `accountId`: id opcional de conta para canais multi-conta. Quando `target: "last"`, o id de conta se aplica ao canal last resolvido se ele suporta contas; caso contrário é ignorado. Se o id de conta não corresponde a uma conta configurada para o canal resolvido, a entrega é pulada.
- `prompt`: sobrescreve o corpo do prompt padrão (não faz merge).
- `ackMaxChars`: máximo de chars permitidos após `HEARTBEAT_OK` antes da entrega.
- `suppressToolErrorWarnings`: quando true, suprime payloads de aviso de erro de ferramenta durante execuções de heartbeat.
- `activeHours`: restringe execuções de heartbeat a uma janela de tempo. Objeto com `start` (HH:MM, inclusivo; use `00:00` para início do dia), `end` (HH:MM exclusivo; `24:00` permitido para fim do dia) e `timezone` opcional.
  - Omitido ou `"user"`: usa seu `agents.defaults.userTimezone` se definido, caso contrário cai para o fuso horário do sistema host.
  - `"local"`: sempre usa o fuso horário do sistema host.
  - Qualquer identificador IANA (ex. `America/New_York`): usado diretamente; se inválido, cai para o comportamento `"user"` acima.
  - `start` e `end` não devem ser iguais para uma janela ativa; valores iguais são tratados como largura zero (sempre fora da janela).
  - Fora da janela ativa, heartbeats são pulados até o próximo tick dentro da janela.

## Comportamento de entrega

- Heartbeats executam na sessão principal do agente por padrão (`agent:<id>:<mainKey>`), ou `global` quando `session.scope = "global"`. Defina `session` para sobrescrever para uma sessão específica de canal (Discord/WhatsApp/etc.).
- `session` afeta apenas o contexto de execução; entrega é controlada por `target` e `to`.
- Para entregar a um canal/destinatário específico, defina `target` + `to`. Com `target: "last"`, entrega usa o último canal externo para aquela sessão.
- Entregas de heartbeat permitem alvos diretos/DM por padrão. Defina `directPolicy: "block"` para suprimir envios de alvo direto enquanto ainda executa o turno de heartbeat.
- Se a fila principal está ocupada, o heartbeat é pulado e tentado novamente depois.
- Se `target` resolve para nenhum destino externo, a execução ainda acontece mas nenhuma mensagem outbound é enviada.
- Respostas apenas-heartbeat **não** mantêm a sessão viva; o último `updatedAt` é restaurado para que expiração por ociosidade se comporte normalmente.

## Controles de visibilidade

Por padrão, acknowledgments `HEARTBEAT_OK` são suprimidos enquanto conteúdo de alerta é entregue. Você pode ajustar isso por canal ou por conta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ocultar HEARTBEAT_OK (padrão)
      showAlerts: true # Mostrar mensagens de alerta (padrão)
      useIndicator: true # Emitir eventos indicadores (padrão)
  telegram:
    heartbeat:
      showOk: true # Mostrar acknowledgments OK no Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suprimir entrega de alerta para esta conta
```

Precedência: por conta → por canal → padrões de canal → padrões built-in.

### O que cada flag faz

- `showOk`: envia um acknowledgment `HEARTBEAT_OK` quando o modelo retorna uma resposta apenas-OK.
- `showAlerts`: envia o conteúdo de alerta quando o modelo retorna uma resposta não-OK.
- `useIndicator`: emite eventos indicadores para superfícies de status de UI.

Se **todos os três** são false, OpenCraft pula a execução do heartbeat inteiramente (sem chamada de modelo).

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
          showAlerts: false # suprimir alertas apenas para a conta ops
  telegram:
    heartbeat:
      showOk: true
```

### Padrões comuns

| Objetivo                                                | Config                                                                                   |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamento padrão (OKs silenciosos, alertas ligados) | _(sem config necessária)_                                                                |
| Totalmente silencioso (sem mensagens, sem indicador)    | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Apenas indicador (sem mensagens)                        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs apenas em um canal                                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcional)

Se um arquivo `HEARTBEAT.md` existe no workspace, o prompt padrão diz ao agente para lê-lo. Pense nisso como seu "checklist de heartbeat": pequeno, estável e seguro para incluir a cada 30 minutos.

Se `HEARTBEAT.md` existe mas está efetivamente vazio (apenas linhas em branco e headers markdown como `# Heading`), OpenCraft pula a execução do heartbeat para economizar chamadas de API. Se o arquivo está faltando, o heartbeat ainda executa e o modelo decide o que fazer.

Mantenha-o pequeno (checklist curto ou lembretes) para evitar inchaço de prompt.

Exemplo `HEARTBEAT.md`:

```md
# Checklist do heartbeat

- Varredura rápida: algo urgente nas inboxes?
- Se é dia, faça um check-in leve se nada mais está pendente.
- Se uma tarefa está bloqueada, anote _o que está faltando_ e pergunte ao Peter na próxima vez.
```

### O agente pode atualizar o HEARTBEAT.md?

Sim — se você pedir.

`HEARTBEAT.md` é apenas um arquivo normal no workspace do agente, então você pode dizer ao agente (em um chat normal) algo como:

- "Atualize o `HEARTBEAT.md` para adicionar uma verificação diária de calendário."
- "Reescreva o `HEARTBEAT.md` para ser mais curto e focado em follow-ups de inbox."

Se você quer que isso aconteça proativamente, também pode incluir uma linha explícita no seu prompt de heartbeat como: "Se o checklist ficar obsoleto, atualize o HEARTBEAT.md com um melhor."

Nota de segurança: não coloque secrets (API keys, números de telefone, tokens privados) no `HEARTBEAT.md` — ele se torna parte do contexto do prompt.

## Wake manual (sob demanda)

Você pode enfileirar um evento de sistema e disparar um heartbeat imediato com:

```bash
opencraft system event --text "Check for urgent follow-ups" --mode now
```

Se múltiplos agentes têm `heartbeat` configurado, um wake manual executa cada um desses heartbeats de agente imediatamente.

Use `--mode next-heartbeat` para aguardar o próximo tick agendado.

## Entrega de raciocínio (opcional)

Por padrão, heartbeats entregam apenas o payload final de "resposta".

Se você quer transparência, habilite:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando habilitado, heartbeats também entregarão uma mensagem separada prefixada com `Reasoning:` (mesmo formato que `/reasoning on`). Isso pode ser útil quando o agente está gerenciando múltiplas sessões/codexes e você quer ver por que ele decidiu enviar ping — mas também pode vazar mais detalhes internos do que você deseja. Prefira manter desligado em chats de grupo.

## Consciência de custos

Heartbeats executam turnos completos de agente. Intervalos mais curtos queimam mais tokens. Para reduzir custos:

- Use `isolatedSession: true` para evitar enviar histórico completo de conversa (~100K tokens reduzidos para ~2-5K por execução).
- Use `lightContext: true` para limitar arquivos de bootstrap apenas ao `HEARTBEAT.md`.
- Defina um `model` mais barato (ex. `ollama/llama3.2:1b`).
- Mantenha o `HEARTBEAT.md` pequeno.
- Use `target: "none"` se você quer apenas atualizações de estado internas.
