---
summary: "Visão geral de logging: logs em arquivo, saída do console, tail via CLI e a Control UI"
read_when:
  - Você precisa de uma visão geral amigável para iniciantes sobre logging
  - Você quer configurar níveis ou formatos de log
  - Você está solucionando problemas e precisa encontrar logs rapidamente
title: "Logging"
---

# Logging

O OpenCraft registra logs em dois lugares:

- **Logs em arquivo** (linhas JSON) escritos pelo Gateway.
- **Saída do console** exibida em terminais e na Control UI.

Esta página explica onde os logs ficam, como lê-los e como configurar níveis
e formatos de log.

## Onde os logs ficam

Por padrão, o Gateway escreve um arquivo de log rotativo em:

`/tmp/editzffaleta/OpenCraft-YYYY-MM-DD.log`

A data usa o fuso horário local do host do Gateway.

Você pode substituir isso em `~/.editzffaleta/OpenCraft.json`:

```json
{
  "logging": {
    "file": "/caminho/para/opencraft.log"
  }
}
```

## Como ler os logs

### CLI: tail ao vivo (recomendado)

Use o CLI para acompanhar o arquivo de log do Gateway via RPC:

```bash
opencraft logs --follow
```

Modos de saída:

- **Sessões TTY**: linhas de log estruturadas, bonitas e coloridas.
- **Sessões não-TTY**: texto simples.
- `--json`: JSON delimitado por linha (um evento de log por linha).
- `--plain`: forçar texto simples em sessões TTY.
- `--no-color`: desabilitar cores ANSI.

No modo JSON, o CLI emite objetos com tag `type`:

- `meta`: metadados do stream (arquivo, cursor, tamanho)
- `log`: entrada de log analisada
- `notice`: dicas de truncamento / rotação
- `raw`: linha de log não analisada

Se o Gateway estiver inacessível, o CLI imprime uma dica curta para executar:

```bash
opencraft doctor
```

### Control UI (web)

A aba **Logs** da Control UI acompanha o mesmo arquivo usando `logs.tail`.
Consulte [/web/control-ui](/web/control-ui) para como abri-la.

### Logs apenas de canal

Para filtrar atividade de canal (WhatsApp/Telegram/etc), use:

```bash
opencraft channels logs --channel whatsapp
```

## Formatos de log

### Logs em arquivo (JSONL)

Cada linha no arquivo de log é um objeto JSON. O CLI e a Control UI analisam essas
entradas para renderizar saída estruturada (hora, nível, subsistema, mensagem).

### Saída do console

Logs do console são **conscientes do TTY** e formatados para legibilidade:

- Prefixos de subsistema (por exemplo `gateway/channels/whatsapp`)
- Coloração por nível (info/warn/error)
- Modo compacto ou JSON opcional

A formatação do console é controlada por `logging.consoleStyle`.

## Configurando logging

Toda configuração de logging fica em `logging` no `~/.editzffaleta/OpenCraft.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/editzffaleta/OpenCraft-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Níveis de log

- `logging.level`: nível dos **logs em arquivo** (JSONL).
- `logging.consoleLevel`: nível de verbosidade do **console**.

Você pode substituir ambos via a variável de ambiente **`OPENCRAFT_LOG_LEVEL`** (por exemplo `OPENCRAFT_LOG_LEVEL=debug`). A variável de ambiente tem precedência sobre o arquivo de configuração, para que você possa aumentar a verbosidade para uma única execução sem editar `opencraft.json`. Você também pode passar a opção global do CLI **`--log-level <level>`** (por exemplo, `opencraft --log-level debug gateway run`), que substitui a variável de ambiente para esse comando.

`--verbose` afeta apenas a saída do console; não altera níveis de log em arquivo.

### Estilos de console

`logging.consoleStyle`:

- `pretty`: amigável para humanos, colorido, com timestamps.
- `compact`: saída mais enxuta (melhor para sessões longas).
- `json`: JSON por linha (para processadores de log).

### Redação

Resumos de ferramentas podem redatar Tokens sensíveis antes de chegarem ao console:

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: lista de strings regex para substituir o conjunto padrão

A redação afeta **apenas a saída do console** e não altera logs em arquivo.

## Diagnósticos + OpenTelemetry

Diagnósticos são eventos estruturados e legíveis por máquina para execuções de modelo **e**
telemetria de fluxo de mensagens (Webhooks, enfileiramento, estado de sessão). Eles **não**
substituem logs; existem para alimentar métricas, traces e outros exportadores.

Eventos de diagnóstico são emitidos em processo, mas exportadores só se conectam quando
diagnósticos + o Plugin exportador estão habilitados.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: o modelo de dados + SDKs para traces, métricas e logs.
- **OTLP**: o protocolo de transmissão usado para exportar dados OTel para um coletor/backend.
- O OpenCraft exporta via **OTLP/HTTP (protobuf)** atualmente.

### Sinais exportados

- **Métricas**: contadores + histogramas (uso de Tokens, fluxo de mensagens, enfileiramento).
- **Traces**: spans para uso de modelo + processamento de Webhooks/mensagens.
- **Logs**: exportados via OTLP quando `diagnostics.otel.logs` está habilitado. O
  volume de logs pode ser alto; tenha em mente `logging.level` e filtros do exportador.

### Catálogo de eventos de diagnóstico

Uso de modelo:

- `model.usage`: Tokens, custo, duração, contexto, provedor/modelo/canal, IDs de sessão.

Fluxo de mensagens:

- `webhook.received`: entrada de Webhook por canal.
- `webhook.processed`: Webhook tratado + duração.
- `webhook.error`: erros do handler de Webhook.
- `message.queued`: mensagem enfileirada para processamento.
- `message.processed`: resultado + duração + erro opcional.

Fila + sessão:

- `queue.lane.enqueue`: enfileiramento de faixa da fila de comandos + profundidade.
- `queue.lane.dequeue`: desenfileiramento de faixa da fila de comandos + tempo de espera.
- `session.state`: transição de estado de sessão + motivo.
- `session.stuck`: aviso de sessão travada + idade.
- `run.attempt`: metadados de retentativa/tentativa de execução.
- `diagnostic.heartbeat`: contadores agregados (Webhooks/fila/sessão).

### Habilitar diagnósticos (sem exportador)

Use isto se você quer eventos de diagnóstico disponíveis para Plugins ou sinks personalizados:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Flags de diagnóstico (logs direcionados)

Use flags para ativar logs extras de depuração direcionados sem aumentar `logging.level`.
Flags são insensíveis a maiúsculas/minúsculas e suportam wildcards (por exemplo `telegram.*` ou `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Substituição via variável de ambiente (pontual):

```
OPENCRAFT_DIAGNOSTICS=telegram.http,telegram.payload
```

Notas:

- Logs de flags vão para o arquivo de log padrão (mesmo que `logging.file`).
- A saída ainda é redatada conforme `logging.redactSensitive`.
- Guia completo: [/diagnostics/flags](/diagnostics/flags).

### Exportar para OpenTelemetry

Diagnósticos podem ser exportados via o Plugin `diagnostics-otel` (OTLP/HTTP). Isso
funciona com qualquer coletor/backend OpenTelemetry que aceite OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "opencraft-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

Notas:

- Você também pode habilitar o Plugin com `opencraft plugins enable diagnostics-otel`.
- `protocol` atualmente suporta apenas `http/protobuf`. `grpc` é ignorado.
- Métricas incluem uso de Tokens, custo, tamanho de contexto, duração de execução e
  contadores/histogramas de fluxo de mensagens (Webhooks, enfileiramento, estado de sessão, profundidade/espera de fila).
- Traces/métricas podem ser alternados com `traces` / `metrics` (padrão: ativado). Traces
  incluem spans de uso de modelo mais spans de processamento de Webhooks/mensagens quando habilitados.
- Defina `headers` quando seu coletor requer autenticação.
- Variáveis de ambiente suportadas: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Métricas exportadas (nomes + tipos)

Uso de modelo:

- `opencraft.tokens` (counter, attrs: `opencraft.token`, `opencraft.channel`,
  `opencraft.provider`, `opencraft.model`)
- `opencraft.cost.usd` (counter, attrs: `opencraft.channel`, `opencraft.provider`,
  `opencraft.model`)
- `opencraft.run.duration_ms` (histogram, attrs: `opencraft.channel`,
  `opencraft.provider`, `opencraft.model`)
- `opencraft.context.tokens` (histogram, attrs: `opencraft.context`,
  `opencraft.channel`, `opencraft.provider`, `opencraft.model`)

Fluxo de mensagens:

- `opencraft.webhook.received` (counter, attrs: `opencraft.channel`,
  `opencraft.webhook`)
- `opencraft.webhook.error` (counter, attrs: `opencraft.channel`,
  `opencraft.webhook`)
- `opencraft.webhook.duration_ms` (histogram, attrs: `opencraft.channel`,
  `opencraft.webhook`)
- `opencraft.message.queued` (counter, attrs: `opencraft.channel`,
  `opencraft.source`)
- `opencraft.message.processed` (counter, attrs: `opencraft.channel`,
  `opencraft.outcome`)
- `opencraft.message.duration_ms` (histogram, attrs: `opencraft.channel`,
  `opencraft.outcome`)

Filas + sessões:

- `opencraft.queue.lane.enqueue` (counter, attrs: `opencraft.lane`)
- `opencraft.queue.lane.dequeue` (counter, attrs: `opencraft.lane`)
- `opencraft.queue.depth` (histogram, attrs: `opencraft.lane` ou
  `opencraft.channel=heartbeat`)
- `opencraft.queue.wait_ms` (histogram, attrs: `opencraft.lane`)
- `opencraft.session.state` (counter, attrs: `opencraft.state`, `opencraft.reason`)
- `opencraft.session.stuck` (counter, attrs: `opencraft.state`)
- `opencraft.session.stuck_age_ms` (histogram, attrs: `opencraft.state`)
- `opencraft.run.attempt` (counter, attrs: `opencraft.attempt`)

### Spans exportados (nomes + atributos-chave)

- `opencraft.model.usage`
  - `opencraft.channel`, `opencraft.provider`, `opencraft.model`
  - `opencraft.sessionKey`, `opencraft.sessionId`
  - `opencraft.tokens.*` (input/output/cache_read/cache_write/total)
- `opencraft.webhook.processed`
  - `opencraft.channel`, `opencraft.webhook`, `opencraft.chatId`
- `opencraft.webhook.error`
  - `opencraft.channel`, `opencraft.webhook`, `opencraft.chatId`,
    `opencraft.error`
- `opencraft.message.processed`
  - `opencraft.channel`, `opencraft.outcome`, `opencraft.chatId`,
    `opencraft.messageId`, `opencraft.sessionKey`, `opencraft.sessionId`,
    `opencraft.reason`
- `opencraft.session.stuck`
  - `opencraft.state`, `opencraft.ageMs`, `opencraft.queueDepth`,
    `opencraft.sessionKey`, `opencraft.sessionId`

### Amostragem + envio

- Amostragem de traces: `diagnostics.otel.sampleRate` (0.0-1.0, apenas spans raiz).
- Intervalo de exportação de métricas: `diagnostics.otel.flushIntervalMs` (mínimo 1000ms).

### Notas sobre protocolo

- Endpoints OTLP/HTTP podem ser definidos via `diagnostics.otel.endpoint` ou
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Se o endpoint já contém `/v1/traces` ou `/v1/metrics`, ele é usado como está.
- Se o endpoint já contém `/v1/logs`, ele é usado como está para logs.
- `diagnostics.otel.logs` habilita exportação de logs OTLP para a saída principal do logger.

### Comportamento de exportação de logs

- Logs OTLP usam os mesmos registros estruturados escritos em `logging.file`.
- Respeitam `logging.level` (nível de log em arquivo). A redação do console **não** se aplica
  a logs OTLP.
- Instalações de alto volume devem preferir amostragem/filtragem do coletor OTLP.

## Dicas de solução de problemas

- **Gateway inacessível?** Execute `opencraft doctor` primeiro.
- **Logs vazios?** Verifique se o Gateway está rodando e escrevendo no caminho de arquivo
  em `logging.file`.
- **Precisa de mais detalhes?** Defina `logging.level` para `debug` ou `trace` e tente novamente.
