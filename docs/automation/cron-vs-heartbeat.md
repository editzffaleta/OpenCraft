---
summary: "Orientação para escolher entre heartbeat e cron jobs para automação"
read_when:
  - Decidindo como agendar tarefas recorrentes
  - Configurando monitoramento em background ou notificações
  - Otimizando uso de tokens para verificações periódicas
title: "Cron vs Heartbeat"
---

# Cron vs Heartbeat: Quando Usar Cada Um

Tanto heartbeats quanto cron jobs permitem executar tarefas em um agendamento. Este guia ajuda você a escolher o mecanismo certo para o seu caso de uso.

## Guia Rápido de Decisão

| Caso de Uso                               | Recomendado         | Por quê                                      |
| ----------------------------------------- | ------------------- | -------------------------------------------- |
| Verificar caixa de entrada a cada 30 min  | Heartbeat           | Agrupa com outras verificações, ciente do contexto |
| Enviar relatório diário às 9h em ponto    | Cron (isolado)      | Timing exato necessário                      |
| Monitorar calendário para eventos futuros | Heartbeat           | Encaixe natural para verificações periódicas |
| Executar análise semanal profunda         | Cron (isolado)      | Tarefa standalone, pode usar modelo diferente |
| Me lembrar em 20 minutos                  | Cron (main, `--at`) | One-shot com timing preciso                  |
| Verificação de saúde do projeto em bg     | Heartbeat           | Aproveita o ciclo existente                  |

## Heartbeat: Consciência Periódica

Heartbeats rodam na **sessão principal** em um intervalo regular (padrão: 30 min). São projetados para o agente verificar coisas e mostrar o que é importante.

### Quando usar heartbeat

- **Múltiplas verificações periódicas**: Em vez de 5 cron jobs separados verificando caixa de entrada, calendário, clima, notificações e status do projeto, um único heartbeat pode agrupar todos esses.
- **Decisões conscientes do contexto**: O agente tem contexto completo da sessão principal, então pode tomar decisões inteligentes sobre o que é urgente vs. o que pode esperar.
- **Continuidade conversacional**: Execuções de heartbeat compartilham a mesma sessão, então o agente lembra conversas recentes e pode fazer acompanhamentos naturalmente.
- **Monitoramento de baixo overhead**: Um heartbeat substitui muitas tarefas de polling pequenas.

### Vantagens do heartbeat

- **Agrupa múltiplas verificações**: Um turno do agente pode revisar caixa de entrada, calendário e notificações juntos.
- **Reduz chamadas de API**: Um único heartbeat é mais barato que 5 cron jobs isolados.
- **Ciente do contexto**: O agente sabe no que você estava trabalhando e pode priorizar adequadamente.
- **Supressão inteligente**: Se nada precisa de atenção, o agente responde `HEARTBEAT_OK` e nenhuma mensagem é entregue.
- **Timing natural**: Deriva levemente com base na carga da fila, o que está bem para a maioria dos monitoramentos.

### Exemplo de heartbeat: checklist HEARTBEAT.md

```md
# Checklist de heartbeat

- Verificar email por mensagens urgentes
- Revisar calendário para eventos nas próximas 2 horas
- Se uma tarefa em background terminou, resumir resultados
- Se inativo por 8+ horas, enviar um check-in breve
```

O agente lê isso em cada heartbeat e lida com todos os itens em um turno.

### Configurando heartbeat

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // intervalo
        target: "last", // alvo de entrega de alerta explícito (padrão é "none")
        activeHours: { start: "08:00", end: "22:00" }, // opcional
      },
    },
  },
}
```

Veja [Heartbeat](/gateway/heartbeat) para configuração completa.

## Cron: Agendamento Preciso

Cron jobs rodam em horários precisos e podem rodar em sessões isoladas sem afetar o contexto principal.
Agendamentos recorrentes no topo da hora são automaticamente distribuídos por um offset
determinístico por job em uma janela de 0-5 minutos.

### Quando usar cron

- **Timing exato necessário**: "Enviar isso às 9:00 todo Monday" (não "em algum momento perto das 9").
- **Tarefas standalone**: Tarefas que não precisam de contexto conversacional.
- **Modelo/thinking diferente**: Análise pesada que justifica um modelo mais poderoso.
- **Lembretes one-shot**: "Me lembre em 20 minutos" com `--at`.
- **Tarefas barulhentas/frequentes**: Tarefas que poluiriam o histórico da sessão principal.
- **Triggers externos**: Tarefas que devem rodar independentemente de o agente estar ativo.

### Vantagens do cron

- **Timing preciso**: Expressões cron de 5 campos ou 6 campos (segundos) com suporte a timezone.
- **Distribuição de carga embutida**: Agendamentos recorrentes no topo da hora são escalonados em até 5 minutos por padrão.
- **Controle por job**: Sobrescreva o stagger com `--stagger <duração>` ou force timing exato com `--exact`.
- **Isolamento de sessão**: Roda em `cron:<jobId>` sem poluir o histórico principal.
- **Override de modelo**: Use um modelo mais barato ou mais poderoso por job.
- **Controle de entrega**: Jobs isolados padrão para `announce` (resumo); escolha `none` conforme necessário.
- **Entrega imediata**: Modo announce posta diretamente sem esperar o heartbeat.
- **Sem contexto do agente necessário**: Roda mesmo se a sessão principal estiver inativa ou compactada.
- **Suporte a one-shot**: `--at` para timestamps futuros precisos.

### Exemplo de cron: Briefing matinal diário

```bash
opencraft cron add \
  --name "Briefing matinal" \
  --cron "0 7 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --message "Gerar o briefing de hoje: clima, calendário, top emails, resumo de notícias." \
  --model opus \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

Isso roda exatamente às 7:00 AM horário de New York, usa Opus para qualidade, e anuncia um resumo diretamente para o WhatsApp.

### Exemplo de cron: Lembrete one-shot

```bash
opencraft cron add \
  --name "Lembrete de reunião" \
  --at "20m" \
  --session main \
  --system-event "Lembrete: standup começa em 10 minutos." \
  --wake now \
  --delete-after-run
```

Veja [Cron jobs](/automation/cron-jobs) para referência completa do CLI.

## Fluxograma de Decisão

```
A tarefa precisa rodar em um horário EXATO?
  SIM -> Use cron
  NÃO -> Continue...

A tarefa precisa de isolamento da sessão principal?
  SIM -> Use cron (isolado)
  NÃO -> Continue...

Essa tarefa pode ser agrupada com outras verificações periódicas?
  SIM -> Use heartbeat (adicione ao HEARTBEAT.md)
  NÃO -> Use cron

É um lembrete one-shot?
  SIM -> Use cron com --at
  NÃO -> Continue...

Precisa de um modelo ou nível de thinking diferente?
  SIM -> Use cron (isolado) com --model/--thinking
  NÃO -> Use heartbeat
```

## Combinando Ambos

A configuração mais eficiente usa **ambos**:

1. **Heartbeat** lida com monitoramento de rotina (caixa de entrada, calendário, notificações) em um turno agrupado a cada 30 minutos.
2. **Cron** lida com agendamentos precisos (relatórios diários, revisões semanais) e lembretes one-shot.

### Exemplo: Configuração eficiente de automação

**HEARTBEAT.md** (verificado a cada 30 min):

```md
# Checklist de heartbeat

- Escanear caixa de entrada por emails urgentes
- Verificar calendário para eventos nas próximas 2h
- Revisar tarefas pendentes
- Check-in leve se quieto por 8+ horas
```

**Cron jobs** (timing preciso):

```bash
# Briefing matinal diário às 7h
opencraft cron add --name "Briefing matinal" --cron "0 7 * * *" --session isolated --message "..." --announce

# Revisão semanal de projeto nas Segundas às 9h
opencraft cron add --name "Revisão semanal" --cron "0 9 * * 1" --session isolated --message "..." --model opus

# Lembrete one-shot
opencraft cron add --name "Ligar de volta" --at "2h" --session main --system-event "Ligar de volta para o cliente" --wake now
```

## Lobster: Workflows determinísticos com aprovações

Lobster é o runtime de workflow para **pipelines de ferramentas multi-etapa** que precisam de execução determinística e aprovações explícitas.
Use quando a tarefa for mais que um único turno do agente e você quiser um workflow retomável com checkpoints humanos.

### Quando o Lobster se encaixa

- **Automação multi-etapa**: Você precisa de um pipeline fixo de chamadas de ferramentas, não um prompt único.
- **Gates de aprovação**: Efeitos colaterais devem pausar até você aprovar, depois retomar.
- **Execuções retomáveis**: Continue um workflow pausado sem re-executar etapas anteriores.

### Como se combina com heartbeat e cron

- **Heartbeat/cron** decide _quando_ uma execução acontece.
- **Lobster** define _quais passos_ acontecem quando a execução começa.

Para workflows agendados, use cron ou heartbeat para acionar um turno do agente que chama o Lobster.
Para workflows ad-hoc, chame o Lobster diretamente.

### Notas operacionais (do código)

- Lobster roda como um **subprocesso local** (`lobster` CLI) em modo tool e retorna um **envelope JSON**.
- Se a ferramenta retornar `needs_approval`, você retoma com um `resumeToken` e flag `approve`.
- A ferramenta é um **plugin opcional**; ative-o aditivamente via `tools.alsoAllow: ["lobster"]` (recomendado).
- Lobster espera que o CLI `lobster` esteja disponível no `PATH`.

Veja [Lobster](/tools/lobster) para uso completo e exemplos.

## Sessão Principal vs Sessão Isolada

Tanto heartbeat quanto cron podem interagir com a sessão principal, mas de formas diferentes:

|         | Heartbeat                       | Cron (main)              | Cron (isolado)                                    |
| ------- | ------------------------------- | ------------------------ | ------------------------------------------------- |
| Sessão  | Principal                       | Principal (via system event) | `cron:<jobId>` ou sessão customizada          |
| Histórico | Compartilhado                 | Compartilhado            | Novo a cada execução (isolado) / Persistente (custom) |
| Contexto | Completo                       | Completo                 | Nenhum (isolado) / Cumulativo (custom)            |
| Modelo  | Modelo da sessão principal      | Modelo da sessão principal | Pode sobrescrever                               |
| Saída   | Entregue se não for `HEARTBEAT_OK` | Prompt de heartbeat + evento | Resumo anunciado (padrão)                  |

### Quando usar cron na sessão principal

Use `--session main` com `--system-event` quando quiser:

- O lembrete/evento aparecer no contexto da sessão principal
- O agente lidar com isso no próximo heartbeat com contexto completo
- Sem execução isolada separada

```bash
opencraft cron add \
  --name "Verificar projeto" \
  --every "4h" \
  --session main \
  --system-event "Hora de uma verificação de saúde do projeto" \
  --wake now
```

### Quando usar cron isolado

Use `--session isolated` quando quiser:

- Uma lousa limpa sem contexto anterior
- Configurações diferentes de modelo ou thinking
- Resumos anunciados diretamente para um canal
- Histórico que não poluia a sessão principal

```bash
opencraft cron add \
  --name "Análise profunda" \
  --cron "0 6 * * 0" \
  --session isolated \
  --message "Análise semanal de progresso da codebase..." \
  --model opus \
  --thinking high \
  --announce
```

## Considerações de Custo

| Mecanismo       | Perfil de Custo                                               |
| --------------- | ------------------------------------------------------------- |
| Heartbeat       | Um turno a cada N minutos; escala com tamanho do HEARTBEAT.md |
| Cron (main)     | Adiciona evento ao próximo heartbeat (sem turno isolado)      |
| Cron (isolado)  | Turno completo do agente por job; pode usar modelo mais barato |

**Dicas**:

- Mantenha o `HEARTBEAT.md` pequeno para minimizar overhead de tokens.
- Agrupe verificações similares no heartbeat em vez de múltiplos cron jobs.
- Use `target: "none"` no heartbeat se quiser apenas processamento interno.
- Use cron isolado com um modelo mais barato para tarefas de rotina.

## Relacionado

- [Heartbeat](/gateway/heartbeat) - configuração completa do heartbeat
- [Cron jobs](/automation/cron-jobs) - referência completa de CLI e API do cron
- [System](/cli/system) - system events + controles de heartbeat
