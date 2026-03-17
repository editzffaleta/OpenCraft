---
summary: "Superfícies de logging, logs em arquivo, estilos de log WS e formatação de console"
read_when:
  - Alterando saída ou formatos de logging
  - Debugando saída do CLI ou gateway
title: "Logging"
---

# Logging

Para uma visão geral voltada ao usuário (CLI + Control UI + config), veja [/logging](/logging).

OpenCraft tem duas "superfícies" de log:

- **Saída no console** (o que você vê no terminal / Debug UI).
- **Logs em arquivo** (linhas JSON) escritos pelo logger do gateway.

## Logger baseado em arquivo

- Arquivo de log rotativo padrão está em `/tmp/opencraft/` (um arquivo por dia): `opencraft-YYYY-MM-DD.log`
  - A data usa o fuso horário local do host do gateway.
- O caminho do arquivo de log e o nível podem ser configurados via `~/.editzffaleta/OpenCraft.json`:
  - `logging.file`
  - `logging.level`

O formato do arquivo é um objeto JSON por linha.

A aba Logs da Control UI faz tail deste arquivo via o gateway (`logs.tail`).
O CLI pode fazer o mesmo:

```bash
opencraft logs --follow
```

**Verbose vs. níveis de log**

- **Logs em arquivo** são controlados exclusivamente por `logging.level`.
- `--verbose` afeta apenas a **verbosidade do console** (e o estilo de log WS); ele **não** eleva o nível de log do arquivo.
- Para capturar detalhes exclusivos do verbose em logs de arquivo, defina `logging.level` para `debug` ou `trace`.

## Captura de console

O CLI captura `console.log/info/warn/error/debug/trace` e os escreve em logs de arquivo, enquanto ainda imprime no stdout/stderr.

Você pode ajustar a verbosidade do console independentemente via:

- `logging.consoleLevel` (padrão `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redação de resumo de ferramentas

Resumos verbosos de ferramentas (ex. `🛠️ Exec: ...`) podem mascarar tokens sensíveis antes de chegarem ao stream do console. Isso é **apenas para ferramentas** e não altera logs de arquivo.

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: array de strings regex (sobrescreve os padrões)
  - Use strings de regex cruas (auto `gi`), ou `/pattern/flags` se precisar de flags customizadas.
  - Matches são mascarados mantendo os primeiros 6 + últimos 4 caracteres (comprimento >= 18), caso contrário `***`.
  - Os padrões cobrem atribuições comuns de chaves, flags de CLI, campos JSON, headers bearer, blocos PEM e prefixos populares de tokens.

## Logs WebSocket do Gateway

O gateway imprime logs de protocolo WebSocket em dois modos:

- **Modo normal (sem `--verbose`)**: apenas resultados RPC "interessantes" são impressos:
  - erros (`ok=false`)
  - chamadas lentas (threshold padrão: `>= 50ms`)
  - erros de parse
- **Modo verbose (`--verbose`)**: imprime todo o tráfego WS de request/response.

### Estilo de log WS

`opencraft gateway` suporta um switch de estilo por gateway:

- `--ws-log auto` (padrão): modo normal é otimizado; modo verbose usa saída compacta
- `--ws-log compact`: saída compacta (request/response pareados) quando verbose
- `--ws-log full`: saída completa por frame quando verbose
- `--compact`: alias para `--ws-log compact`

Exemplos:

```bash
# otimizado (apenas erros/lentos)
opencraft gateway

# mostrar todo tráfego WS (pareado)
opencraft gateway --verbose --ws-log compact

# mostrar todo tráfego WS (meta completo)
opencraft gateway --verbose --ws-log full
```

## Formatação de console (logging por subsistema)

O formatador de console é **sensível a TTY** e imprime linhas consistentes e prefixadas.
Loggers de subsistema mantêm a saída agrupada e escaneável.

Comportamento:

- **Prefixos de subsistema** em cada linha (ex. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Cores de subsistema** (estáveis por subsistema) mais coloração de nível
- **Cor quando saída é um TTY ou o ambiente parece um terminal rico** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respeita `NO_COLOR`
- **Prefixos de subsistema encurtados**: remove `gateway/` + `channels/` iniciais, mantém os últimos 2 segmentos (ex. `whatsapp/outbound`)
- **Sub-loggers por subsistema** (prefixo automático + campo estruturado `{ subsystem }`)
- **`logRaw()`** para saída QR/UX (sem prefixo, sem formatação)
- **Estilos de console** (ex. `pretty | compact | json`)
- **Nível de log do console** separado do nível de log de arquivo (arquivo mantém detalhes completos quando `logging.level` está definido como `debug`/`trace`)
- **Corpos de mensagens WhatsApp** são logados em `debug` (use `--verbose` para vê-los)

Isso mantém logs de arquivo existentes estáveis enquanto torna a saída interativa escaneável.
