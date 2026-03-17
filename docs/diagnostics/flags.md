---
summary: "Flags de diagnóstico para logs de depuração direcionados"
read_when:
  - Você precisa de logs de depuração direcionados sem elevar os níveis globais de logging
  - Você precisa capturar logs específicos de subsistema para suporte
title: "Diagnostics Flags"
---

# Flags de Diagnóstico

Flags de diagnóstico permitem que você habilite logs de depuração direcionados sem ativar logging verboso em todos os lugares. As flags são opt-in e não têm efeito a menos que um subsistema as verifique.

## Como funciona

- Flags são strings (insensíveis a maiúsculas/minúsculas).
- Você pode habilitar flags na configuração ou via sobrescrita de variável de ambiente.
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

Reinicie o Gateway após alterar as flags.

## Sobrescrita via variável de ambiente (uso único)

```bash
OPENCRAFT_DIAGNOSTICS=telegram.http,telegram.payload
```

Desabilitar todas as flags:

```bash
OPENCRAFT_DIAGNOSTICS=0
```

## Para onde vão os logs

Flags emitem logs no arquivo de log de diagnóstico padrão. Por padrão:

```
/tmp/editzffaleta/OpenCraft-YYYY-MM-DD.log
```

Se você definir `logging.file`, use esse caminho em vez disso. Os logs são JSONL (um objeto JSON por linha). A redação ainda se aplica baseada em `logging.redactSensitive`.

## Extrair logs

Escolha o arquivo de log mais recente:

```bash
ls -t /tmp/editzffaleta/OpenCraft-*.log | head -n 1
```

Filtrar por diagnósticos HTTP do Telegram:

```bash
rg "telegram http error" /tmp/editzffaleta/OpenCraft-*.log
```

Ou acompanhar enquanto reproduz:

```bash
tail -f /tmp/editzffaleta/OpenCraft-$(date +%F).log | rg "telegram http error"
```

Para Gateways remotos, você também pode usar `opencraft logs --follow` (veja [/cli/logs](/cli/logs)).

## Notas

- Se `logging.level` estiver definido acima de `warn`, esses logs podem ser suprimidos. O padrão `info` está ok.
- Flags são seguras para deixar habilitadas; elas afetam apenas o volume de log do subsistema específico.
- Use [/logging](/logging) para alterar destinos de log, níveis e redação.
