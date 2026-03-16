---
summary: "Flags de diagnóstico para logs de depuração direcionados"
read_when:
  - Você precisa de logs de depuração direcionados sem elevar os níveis globais de logging
  - Você precisa capturar logs específicos de subsistema para suporte
title: "Flags de Diagnóstico"
---

# Flags de Diagnóstico

As flags de diagnóstico permitem habilitar logs de depuração direcionados sem ativar o logging verboso em toda parte. As flags são opcionais e não têm efeito a menos que um subsistema as verifique.

## Como funciona

- As flags são strings (insensíveis a maiúsculas/minúsculas).
- Você pode habilitar flags via configuração ou por meio de uma variável de ambiente.
- Curingas são suportados:
  - `telegram.*` corresponde a `telegram.http`
  - `*` habilita todas as flags

## Habilitar via configuração

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Múltiplas flags:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Reinicie o gateway após alterar as flags.

## Substituição por variável de ambiente (uso pontual)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Desativar todas as flags:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Para onde vão os logs

As flags emitem logs no arquivo de log de diagnóstico padrão. Por padrão:

```
/tmp/opencraft/opencraft-YYYY-MM-DD.log
```

Se você definiu `logging.file`, use esse caminho. Os logs estão em formato JSONL (um objeto JSON por linha). A redação ainda se aplica com base em `logging.redactSensitive`.

## Extrair logs

Obter o arquivo de log mais recente:

```bash
ls -t /tmp/opencraft/opencraft-*.log | head -n 1
```

Filtrar por diagnósticos HTTP do Telegram:

```bash
rg "telegram http error" /tmp/opencraft/opencraft-*.log
```

Ou monitorar em tempo real enquanto reproduz o problema:

```bash
tail -f /tmp/opencraft/opencraft-$(date +%F).log | rg "telegram http error"
```

Para gateways remotos, você também pode usar `opencraft logs --follow` (veja [/cli/logs](/cli/logs)).

## Notas

- Se `logging.level` estiver definido acima de `warn`, esses logs podem ser suprimidos. O padrão `info` funciona bem.
- As flags podem ser deixadas habilitadas sem problemas; elas afetam apenas o volume de logs do subsistema específico.
- Use [/logging](/logging) para alterar destinos de log, níveis e configurações de redação.
