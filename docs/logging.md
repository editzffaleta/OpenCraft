---
summary: "Visão geral de logging: logs em arquivo, saída no console, tail via CLI e a Control UI"
read_when:
  - Você precisa de uma visão geral amigável para iniciantes sobre logging
  - Você quer configurar níveis de log ou formatos
  - Você está depurando e precisa encontrar logs rapidamente
title: "Logging"
---

# Logging

O OpenCraft registra em dois lugares:

- **Logs em arquivo** (JSON lines) escritos pelo Gateway.
- **Saída no console** mostrada em terminais e na Control UI.

Esta página explica onde os logs ficam, como lê-los e como configurar
níveis de log e formatos.

## Onde ficam os logs

Por padrão, o Gateway escreve um arquivo de log rotativo em:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

A data usa o fuso horário local do host do gateway.

Você pode sobrescrever isso em `~/.opencraft/opencraft.json`:

```json
{
  "logging": {
    "file": "/caminho/para/opencraft.log"
  }
}
```

## Como ler os logs

### CLI: tail em tempo real (recomendado)

Use o CLI para fazer tail do arquivo de log do gateway via RPC:

```bash
opencraft logs --follow
```

Modos de saída:

- **Sessões TTY**: linhas de log estruturadas, coloridas e formatadas.
- **Sessões não-TTY**: texto simples.
- `--json`: JSON delimitado por linha (um evento de log por linha).
- `--plain`: forçar texto simples em sessões TTY.
- `--no-color`: desabilitar cores ANSI.

No modo JSON, o CLI emite objetos com tag `type`:

- `meta`: metadados do stream (arquivo, cursor, tamanho)
- `log`: entrada de log parseada
- `notice`: dicas de truncamento/rotação
- `raw`: linha de log não parseada

Se o Gateway estiver inacessível, o CLI imprime uma dica rápida para rodar:

```bash
opencraft doctor
```

### Control UI (web)

A aba **Logs** da Control UI faz tail do mesmo arquivo usando `logs.tail`.
Veja [/web/control-ui](/web/control-ui) para como abri-la.

### Logs somente de canal

Para filtrar atividade de canal (WhatsApp/Telegram/etc), use:

```bash
opencraft channels logs --channel whatsapp
```

## Formatos de log

### Logs em arquivo (JSONL)

Cada linha no arquivo de log é um objeto JSON. O CLI e a Control UI parseiam estas
entradas para renderizar saída estruturada (tempo, nível, subsistema, mensagem).

### Saída no console

Logs no console são **cientes de TTY** e formatados para legibilidade:

- Prefixos de subsistema (ex.: `gateway/channels/whatsapp`)
- Coloração por nível (info/warn/error)
- Modo compacto ou JSON opcional

A formatação do console é controlada por `logging.consoleStyle`.

## Configurando o logging

Toda a configuração de logging fica sob `logging` em `~/.opencraft/opencraft.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
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

Você pode sobrescrever ambos via a variável de ambiente **`OPENCLAW_LOG_LEVEL`** (ex.: `OPENCLAW_LOG_LEVEL=debug`). A variável de ambiente tem precedência sobre o arquivo de config, então você pode aumentar a verbosidade para uma única execução sem editar o `opencraft.json`. Você também pode passar a opção global de CLI **`--log-level <nível>`** (por exemplo, `opencraft --log-level debug gateway run`), que sobrescreve a variável de ambiente para aquele comando.

`--verbose` afeta apenas a saída do console; não muda os níveis de log em arquivo.

### Estilos de console

`logging.consoleStyle`:

- `pretty`: amigável, colorido, com timestamps.
- `compact`: saída mais compacta (melhor para sessões longas).
- `json`: JSON por linha (para processadores de log).

### Redação

Resumos de tools podem redigir tokens sensíveis antes de chegarem ao console:

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: lista de strings regex para sobrescrever o conjunto padrão

A redação afeta **apenas a saída do console** e não altera os logs em arquivo.

## Diagnósticos + OpenTelemetry

Diagnósticos são eventos estruturados e legíveis por máquina para execuções de modelos **e**
telemetria de fluxo de mensagens (webhooks, fila, estado de sessão). Eles **não**
substituem os logs; existem para alimentar métricas, traces e outros exportadores.

Eventos de diagnóstico são emitidos em processo, mas exportadores só se conectam quando
diagnósticos + o plugin de exportador estão habilitados.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: o modelo de dados + SDKs para traces, métricas e logs.
- **OTLP**: o protocolo de wire usado para exportar dados OTel para um coletor/backend.
- O OpenCraft exporta via **OTLP/HTTP (protobuf)** atualmente.

### Sinais exportados

- **Métricas**: contadores + histogramas (uso de tokens, fluxo de mensagens, fila).
- **Traces**: spans para uso de modelos + processamento de webhook/mensagem.
- **Logs**: exportados via OTLP quando `diagnostics.otel.logs` está habilitado. O volume de log pode ser alto; considere `logging.level` e filtros do exportador.

### Catálogo de eventos de diagnóstico

Uso de modelos:

- `model.usage`: tokens, custo, duração, contexto, provedor/modelo/canal, ids de sessão.

Fluxo de mensagens:

- `webhook.received`: ingresso de webhook por canal.
- `webhook.processed`: webhook tratado + duração.
- `webhook.error`: erros no handler de webhook.
- `message.queued`: mensagem enfileirada para processamento.
- `message.processed`: resultado + duração + erro opcional.

Fila + sessão:

- `queue.lane.enqueue`: enfileiramento de lane de fila de comandos + profundidade.
- `queue.lane.dequeue`: desenfileiramento de lane de fila de comandos + tempo de espera.
- `session.state`: transição de estado de sessão + motivo.
- `session.stuck`: aviso de sessão travada + idade.
- `run.attempt`: metadados de retry/tentativa de run.
- `diagnostic.heartbeat`: contadores agregados (webhooks/fila/sessão).

### Habilitar diagnósticos (sem exportador)

Use isso se quiser eventos de diagnóstico disponíveis para plugins ou sinks personalizados:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Flags de diagnóstico (logs direcionados)

Use flags para ativar logs de debug extras e direcionados sem aumentar `logging.level`.
Flags são case-insensitive e suportam wildcards (ex.: `telegram.*` ou `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Sobrescrição via env (uso único):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Notas:

- Logs de flag vão para o arquivo de log padrão (mesmo que `logging.file`).
- A saída ainda é redatada conforme `logging.redactSensitive`.
- Guia completo: [/diagnostics/flags](/diagnostics/flags).

### Exportar para OpenTelemetry

Diagnósticos podem ser exportados via o plugin `diagnostics-otel` (OTLP/HTTP). Funciona
com qualquer coletor/backend OpenTelemetry que aceite OTLP/HTTP.

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
      "serviceName": "openclaw-gateway",
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

- Você também pode habilitar o plugin com `opencraft plugins enable diagnostics-otel`.
- `protocol` atualmente suporta apenas `http/protobuf`. `grpc` é ignorado.
- Métricas incluem uso de tokens, custo, tamanho de contexto, duração de run e contadores/histogramas de fluxo de mensagens (webhooks, fila, estado de sessão, profundidade/espera de fila).
- Traces/métricas podem ser alternados com `traces` / `metrics` (padrão: ativados). Traces incluem spans de uso de modelos mais spans de processamento de webhook/mensagem quando habilitados.
- Defina `headers` quando seu coletor requer auth.
- Variáveis de ambiente suportadas: `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Métricas exportadas (nomes + tipos)

Uso de modelos:

- `openclaw.tokens` (contador, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (contador, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Fluxo de mensagens:

- `openclaw.webhook.received` (contador, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (contador, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (contador, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (contador, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.outcome`)

Filas + sessões:

- `openclaw.queue.lane.enqueue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, attrs: `openclaw.lane` ou `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, attrs: `openclaw.lane`)
- `openclaw.session.state` (contador, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histograma, attrs: `openclaw.state`)
- `openclaw.run.attempt` (contador, attrs: `openclaw.attempt`)

### Spans exportados (nomes + atributos principais)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`, `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`, `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`, `openclaw.sessionKey`, `openclaw.sessionId`

### Sampling + flush

- Sampling de trace: `diagnostics.otel.sampleRate` (0.0–1.0, apenas spans raiz).
- Intervalo de exportação de métrica: `diagnostics.otel.flushIntervalMs` (mín 1000ms).

### Notas de protocolo

- Endpoints OTLP/HTTP podem ser definidos via `diagnostics.otel.endpoint` ou `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Se o endpoint já contém `/v1/traces` ou `/v1/metrics`, é usado como está.
- Se o endpoint já contém `/v1/logs`, é usado como está para logs.
- `diagnostics.otel.logs` habilita a exportação OTLP de log para a saída principal do logger.

### Comportamento de exportação de log

- Logs OTLP usam os mesmos registros estruturados escritos em `logging.file`.
- Respeita `logging.level` (nível de log em arquivo). A redação do console **não** se aplica a logs OTLP.
- Instalações de alto volume devem preferir sampling/filtragem no coletor OTLP.

## Dicas de resolução de problemas

- **Gateway inacessível?** Rode `opencraft doctor` primeiro.
- **Logs vazios?** Verifique se o Gateway está rodando e escrevendo no caminho do arquivo em `logging.file`.
- **Precisa de mais detalhes?** Defina `logging.level` como `debug` ou `trace` e tente novamente.
