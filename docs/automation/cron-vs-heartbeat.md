---
summary: "Orientação para escolher entre heartbeat e Cron jobs para automação"
read_when:
  - Decidindo como agendar tarefas recorrentes
  - Configurando monitoramento ou notificações em segundo plano
  - Otimizando uso de Token para verificações periódicas
title: "Cron vs Heartbeat"
---

# Cron vs Heartbeat: Quando Usar Cada Um

Tanto heartbeats quanto Cron jobs permitem que você execute tarefas em um agendamento. Este guia ajuda você a escolher o mecanismo certo para seu caso de uso.

## Guia de Decisão Rápida

| Caso de Uso                                      | Recomendado         | Por quê                                            |
| ------------------------------------------------ | ------------------- | -------------------------------------------------- |
| Verificar caixa de entrada a cada 30 min         | Heartbeat           | Agrupa com outras verificações, ciente do contexto |
| Enviar relatório diário às 9h em ponto           | Cron (isolado)      | Necessita de horário exato                         |
| Monitorar calendário para próximos eventos       | Heartbeat           | Encaixe natural para percepção periódica           |
| Executar análise profunda semanal                | Cron (isolado)      | Tarefa independente, pode usar modelo diferente    |
| Lembrar-me em 20 minutos                         | Cron (main, `--at`) | Único com horário preciso                          |
| Verificação de saúde do projeto em segundo plano | Heartbeat           | Aproveita o ciclo existente                        |

## Heartbeat: Percepção Periódica

Heartbeats executam na **sessão principal** em um intervalo regular (padrão: 30 min). São projetados para o agente verificar coisas e destacar o que for importante.

### Quando usar heartbeat

- **Múltiplas verificações periódicas**: Em vez de 5 Cron jobs separados verificando caixa de entrada, calendário, clima, notificações e status do projeto, um único heartbeat pode agrupar tudo isso.
- **Decisões cientes do contexto**: O agente tem o contexto completo da sessão principal, então pode tomar decisões inteligentes sobre o que é urgente vs. o que pode esperar.
- **Continuidade conversacional**: Execuções de heartbeat compartilham a mesma sessão, então o agente lembra de conversas recentes e pode dar seguimento naturalmente.
- **Monitoramento de baixo custo**: Um heartbeat substitui muitas pequenas tarefas de polling.

### Vantagens do heartbeat

- **Agrupa múltiplas verificações**: Uma única execução do agente pode revisar caixa de entrada, calendário e notificações juntos.
- **Reduz chamadas de API**: Um único heartbeat é mais barato que 5 Cron jobs isolados.
- **Ciente do contexto**: O agente sabe no que você esteve trabalhando e pode priorizar adequadamente.
- **Supressão inteligente**: Se nada precisa de atenção, o agente responde `HEARTBEAT_OK` e nenhuma mensagem é entregue.
- **Temporização natural**: Desloca levemente baseado na carga da fila, o que é aceitável para a maioria dos monitoramentos.

### Exemplo de heartbeat: checklist HEARTBEAT.md

```md
# Checklist do heartbeat

- Verificar email para mensagens urgentes
- Revisar calendário para eventos nas próximas 2 horas
- Se uma tarefa em segundo plano terminou, resumir resultados
- Se inativo por 8+ horas, enviar um breve check-in
```

O agente lê isso em cada heartbeat e lida com todos os itens em uma única execução.

### Configurando heartbeat

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // intervalo
        target: "last", // alvo explícito de entrega de alertas (padrão é "none")
        activeHours: { start: "08:00", end: "22:00" }, // opcional
      },
    },
  },
}
```

Veja [Heartbeat](/gateway/heartbeat) para configuração completa.

## Cron: Agendamento Preciso

Cron jobs executam em horários precisos e podem executar em sessões isoladas sem afetar o contexto principal.
Agendamentos recorrentes no topo da hora são automaticamente distribuídos por um
deslocamento determinístico por job em uma janela de 0-5 minutos.

### Quando usar Cron

- **Horário exato necessário**: "Enviar isso às 9:00 toda segunda-feira" (não "em algum momento perto das 9").
- **Tarefas independentes**: Tarefas que não precisam de contexto conversacional.
- **Modelo/pensamento diferente**: Análise pesada que justifica um modelo mais poderoso.
- **Lembretes únicos**: "Lembrar-me em 20 minutos" com `--at`.
- **Tarefas ruidosas/frequentes**: Tarefas que poluiriam o histórico da sessão principal.
- **Gatilhos externos**: Tarefas que devem executar independentemente de o agente estar ativo ou não.

### Vantagens do Cron

- **Temporização precisa**: Expressões Cron de 5 ou 6 campos (segundos) com suporte a fuso horário.
- **Distribuição de carga integrada**: agendamentos recorrentes no topo da hora são escalonados em até 5 minutos por padrão.
- **Controle por job**: sobrescreva o escalonamento com `--stagger <duração>` ou force horário exato com `--exact`.
- **Isolamento de sessão**: Executa em `cron:<jobId>` sem poluir o histórico principal.
- **Sobrescrita de modelo**: Use um modelo mais barato ou mais poderoso por job.
- **Controle de entrega**: Jobs isolados usam `announce` (resumo) por padrão; escolha `none` conforme necessário.
- **Entrega imediata**: Modo announce publica diretamente sem esperar pelo heartbeat.
- **Sem necessidade de contexto do agente**: Executa mesmo se a sessão principal estiver ociosa ou compactada.
- **Suporte a execução única**: `--at` para timestamps futuros precisos.

### Exemplo de Cron: Briefing matinal diário

```bash
opencraft cron add \
  --name "Morning briefing" \
  --cron "0 7 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --message "Generate today's briefing: weather, calendar, top emails, news summary." \
  --model opus \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

Isso executa exatamente às 7:00 no horário de Nova York, usa Opus para qualidade, e anuncia um resumo diretamente no WhatsApp.

### Exemplo de Cron: Lembrete único

```bash
opencraft cron add \
  --name "Meeting reminder" \
  --at "20m" \
  --session main \
  --system-event "Reminder: standup meeting starts in 10 minutes." \
  --wake now \
  --delete-after-run
```

Veja [Cron jobs](/automation/cron-jobs) para referência completa do CLI.

## Fluxograma de Decisão

```
A tarefa precisa executar em um horário EXATO?
  SIM -> Use Cron
  NÃO -> Continue...

A tarefa precisa de isolamento da sessão principal?
  SIM -> Use Cron (isolado)
  NÃO -> Continue...

Essa tarefa pode ser agrupada com outras verificações periódicas?
  SIM -> Use heartbeat (adicione ao HEARTBEAT.md)
  NÃO -> Use Cron

É um lembrete único?
  SIM -> Use Cron com --at
  NÃO -> Continue...

Precisa de um modelo ou nível de pensamento diferente?
  SIM -> Use Cron (isolado) com --model/--thinking
  NÃO -> Use heartbeat
```

## Combinando Ambos

A configuração mais eficiente usa **ambos**:

1. **Heartbeat** lida com monitoramento rotineiro (caixa de entrada, calendário, notificações) em uma única execução agrupada a cada 30 minutos.
2. **Cron** lida com agendamentos precisos (relatórios diários, revisões semanais) e lembretes únicos.

### Exemplo: Configuração eficiente de automação

**HEARTBEAT.md** (verificado a cada 30 min):

```md
# Checklist do heartbeat

- Escanear caixa de entrada para emails urgentes
- Verificar calendário para eventos nas próximas 2h
- Revisar tarefas pendentes
- Check-in leve se silencioso por 8+ horas
```

**Cron jobs** (temporização precisa):

```bash
# Briefing matinal diário às 7h
opencraft cron add --name "Morning brief" --cron "0 7 * * *" --session isolated --message "..." --announce

# Revisão semanal do projeto às segundas às 9h
opencraft cron add --name "Weekly review" --cron "0 9 * * 1" --session isolated --message "..." --model opus

# Lembrete único
opencraft cron add --name "Call back" --at "2h" --session main --system-event "Call back the client" --wake now
```

## Lobster: Fluxos de trabalho determinísticos com aprovações

Lobster é o runtime de fluxo de trabalho para **pipelines de ferramentas em múltiplas etapas** que precisam de execução determinística e aprovações explícitas.
Use quando a tarefa é mais que uma única execução do agente, e você quer um fluxo de trabalho resumível com pontos de verificação humanos.

### Quando Lobster se encaixa

- **Automação em múltiplas etapas**: Você precisa de um pipeline fixo de chamadas de ferramentas, não uma prompt única.
- **Portões de aprovação**: Efeitos colaterais devem pausar até que você aprove, depois retomar.
- **Execuções resumíveis**: Continue um fluxo de trabalho pausado sem re-executar etapas anteriores.

### Como combina com heartbeat e Cron

- **Heartbeat/Cron** decidem _quando_ uma execução acontece.
- **Lobster** define _quais etapas_ acontecem quando a execução inicia.

Para fluxos de trabalho agendados, use Cron ou heartbeat para disparar uma execução do agente que chama Lobster.
Para fluxos de trabalho ad-hoc, chame Lobster diretamente.

### Notas operacionais (do código)

- Lobster executa como um **subprocesso local** (CLI `lobster`) em modo ferramenta e retorna um **envelope JSON**.
- Se a ferramenta retorna `needs_approval`, você retoma com um `resumeToken` e flag `approve`.
- A ferramenta é um **Plugin opcional**; habilite-o aditivamente via `tools.alsoAllow: ["lobster"]` (recomendado).
- Lobster espera que o CLI `lobster` esteja disponível no `PATH`.

Veja [Lobster](/tools/lobster) para uso completo e exemplos.

## Sessão Principal vs Sessão Isolada

Tanto heartbeat quanto Cron podem interagir com a sessão principal, mas de formas diferentes:

|           | Heartbeat                          | Cron (main)                       | Cron (isolado)                                               |
| --------- | ---------------------------------- | --------------------------------- | ------------------------------------------------------------ |
| Sessão    | Principal                          | Principal (via evento do sistema) | `cron:<jobId>` ou sessão personalizada                       |
| Histórico | Compartilhado                      | Compartilhado                     | Novo a cada execução (isolado) / Persistente (personalizado) |
| Contexto  | Completo                           | Completo                          | Nenhum (isolado) / Cumulativo (personalizado)                |
| Modelo    | Modelo da sessão principal         | Modelo da sessão principal        | Pode sobrescrever                                            |
| Saída     | Entregue se não for `HEARTBEAT_OK` | Prompt do heartbeat + evento      | Resumo anunciado (padrão)                                    |

### Quando usar Cron na sessão principal

Use `--session main` com `--system-event` quando você quer:

- O lembrete/evento aparecer no contexto da sessão principal
- O agente lidar com isso durante o próximo heartbeat com contexto completo
- Nenhuma execução isolada separada

```bash
opencraft cron add \
  --name "Check project" \
  --every "4h" \
  --session main \
  --system-event "Time for a project health check" \
  --wake now
```

### Quando usar Cron isolado

Use `--session isolated` quando você quer:

- Uma tela limpa sem contexto anterior
- Configurações de modelo ou pensamento diferentes
- Anunciar resumos diretamente em um canal
- Histórico que não polui a sessão principal

```bash
opencraft cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 0" \
  --session isolated \
  --message "Weekly codebase analysis..." \
  --model opus \
  --thinking high \
  --announce
```

## Considerações de Custo

| Mecanismo      | Perfil de Custo                                                   |
| -------------- | ----------------------------------------------------------------- |
| Heartbeat      | Uma execução a cada N minutos; escala com tamanho do HEARTBEAT.md |
| Cron (main)    | Adiciona evento ao próximo heartbeat (sem execução isolada)       |
| Cron (isolado) | Execução completa do agente por job; pode usar modelo mais barato |

**Dicas**:

- Mantenha `HEARTBEAT.md` pequeno para minimizar sobrecarga de Token.
- Agrupe verificações similares no heartbeat em vez de múltiplos Cron jobs.
- Use `target: "none"` no heartbeat se você quer apenas processamento interno.
- Use Cron isolado com um modelo mais barato para tarefas rotineiras.

## Relacionados

- [Heartbeat](/gateway/heartbeat) - configuração completa do heartbeat
- [Cron jobs](/automation/cron-jobs) - referência completa do CLI e API de Cron
- [System](/cli/system) - eventos do sistema + controles de heartbeat
