---
summary: "Superfícies de logging, logs de arquivo, estilos de log WS e formatação de console"
read_when:
  - Alterando saída ou formatos de logging
  - Depurando saída do CLI ou gateway
title: "Logging"
---

# Logging

Para uma visão geral voltada ao usuário (CLI + Control UI + config), veja [/logging](/logging).

O OpenCraft tem duas "superfícies" de log:

- **Saída de console** (o que você vê no terminal / Debug UI).
- **Logs de arquivo** (JSON lines) escritos pelo logger do gateway.

## Logger baseado em arquivo

- Arquivo de log rotativo padrão fica em `/tmp/openclaw/` (um arquivo por dia): `openclaw-YYYY-MM-DD.log`
  - A data usa o timezone local do host do gateway.
- O path do arquivo de log e o nível podem ser configurados via `~/.opencraft/opencraft.json`:
  - `logging.file`
  - `logging.level`

O formato do arquivo é um objeto JSON por linha.

A aba Logs do Control UI monitora este arquivo via gateway (`logs.tail`).
O CLI pode fazer o mesmo:

```bash
opencraft logs --follow
```

**Verbose vs. níveis de log**

- **Logs de arquivo** são controlados exclusivamente por `logging.level`.
- `--verbose` afeta apenas **verbosidade do console** (e estilo de log WS); **não**
  eleva o nível de log do arquivo.
- Para capturar detalhes somente-verbose em logs de arquivo, defina `logging.level` como `debug` ou
  `trace`.

## Captura de console

O CLI captura `console.log/info/warn/error/debug/trace` e os escreve em logs de arquivo,
enquanto ainda imprime em stdout/stderr.

Você pode ajustar a verbosidade do console independentemente via:

- `logging.consoleLevel` (padrão `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redação de resumo de tools

Resumos verbosos de tools (ex. `🛠️ Exec: ...`) podem mascarar tokens sensíveis antes de atingirem o
stream do console. Isso é **somente para tools** e não altera os logs de arquivo.

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: array de strings regex (substitui os padrões)
  - Use strings regex raw (auto `gi`), ou `/pattern/flags` se precisar de flags customizadas.
  - Correspondências são mascaradas mantendo os primeiros 6 + últimos 4 chars (tamanho >= 18), caso contrário `***`.
  - Padrões cobrem atribuições de chave comuns, flags CLI, campos JSON, headers bearer, blocos PEM e prefixos de token populares.

## Logs WebSocket do Gateway

O gateway imprime logs de protocolo WebSocket em dois modos:

- **Modo normal (sem `--verbose`)**: apenas resultados RPC "interessantes" são impressos:
  - erros (`ok=false`)
  - chamadas lentas (threshold padrão: `>= 50ms`)
  - erros de parse
- **Modo verbose (`--verbose`)**: imprime todo o tráfego de request/response WS.

### Estilo de log WS

`opencraft gateway` suporta uma troca de estilo por gateway:

- `--ws-log auto` (padrão): modo normal é otimizado; modo verbose usa saída compacta
- `--ws-log compact`: saída compacta (request/response pareados) quando verbose
- `--ws-log full`: saída completa por frame quando verbose
- `--compact`: alias para `--ws-log compact`

Exemplos:

```bash
# otimizado (apenas erros/lentos)
opencraft gateway

# mostrar todo o tráfego WS (pareado)
opencraft gateway --verbose --ws-log compact

# mostrar todo o tráfego WS (meta completa)
opencraft gateway --verbose --ws-log full
```

## Formatação de console (logging por subsistema)

O formatador de console é **consciente de TTY** e imprime linhas consistentes e prefixadas.
Loggers de subsistema mantêm a saída agrupada e escaneável.

Comportamento:

- **Prefixos de subsistema** em cada linha (ex. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Cores de subsistema** (estáveis por subsistema) mais coloração de nível
- **Cor quando a saída é um TTY ou o ambiente parece um terminal rico** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respeita `NO_COLOR`
- **Prefixos de subsistema abreviados**: remove `gateway/` + `channels/` iniciais, mantém os últimos 2 segmentos (ex. `whatsapp/outbound`)
- **Sub-loggers por subsistema** (prefixo automático + campo estruturado `{ subsystem }`)
- **`logRaw()`** para saída de QR/UX (sem prefixo, sem formatação)
- **Estilos de console** (ex. `pretty | compact | json`)
- **Nível de log do console** separado do nível de log do arquivo (arquivo mantém detalhes completos quando `logging.level` está definido como `debug`/`trace`)
- **Corpos de mensagem WhatsApp** são registrados em `debug` (use `--verbose` para vê-los)

Isso mantém os logs de arquivo existentes estáveis enquanto torna a saída interativa escaneável.
