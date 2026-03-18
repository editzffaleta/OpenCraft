---
name: peekaboo
description: Capture e automatize a interface do macOS com o CLI Peekaboo.
homepage: https://peekaboo.boo
metadata:
  {
    "opencraft":
      {
        "emoji": "👀",
        "os": ["darwin"],
        "requires": { "bins": ["peekaboo"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "steipete/tap/peekaboo",
              "bins": ["peekaboo"],
              "label": "Instalar Peekaboo (brew)",
            },
          ],
      },
  }
---

# Peekaboo

O Peekaboo é um CLI completo de automação de interface do macOS: capture/inspecione telas, direcione elementos
de UI, controle entradas e gerencie apps/janelas/menus. Os comandos compartilham um cache de snapshots
e suportam `--json`/`-j` para scripts. Execute `peekaboo` ou
`peekaboo <cmd> --help` para ver os flags; `peekaboo --version` exibe os metadados do build.
Dica: execute via `polter peekaboo` para garantir builds atualizados.

## Funcionalidades (todas as capacidades do CLI, excluindo agent/MCP)

Principal

- `bridge`: inspeciona a conectividade do host do Peekaboo Bridge
- `capture`: captura ao vivo ou ingestão de vídeo + extração de frames
- `clean`: limpa o cache de snapshots e arquivos temporários
- `config`: init/show/edit/validate, provedores, modelos, credenciais
- `image`: captura screenshots (tela/janela/regiões da barra de menu)
- `learn`: exibe o guia completo do agente + catálogo de ferramentas
- `list`: apps, janelas, telas, menubar, permissões
- `permissions`: verifica o status de Gravação de Tela/Acessibilidade
- `run`: executa scripts `.peekaboo.json`
- `sleep`: pausa a execução por uma duração
- `tools`: lista as ferramentas disponíveis com opções de filtragem/exibição

Interação

- `click`: direciona por ID/query/coords com esperas inteligentes
- `drag`: arrastar e soltar entre elementos/coords/Dock
- `hotkey`: combinações de modificadores como `cmd,shift,t`
- `move`: posicionamento do cursor com suavização opcional
- `paste`: define a área de transferência → cola → restaura
- `press`: sequências de teclas especiais com repetições
- `scroll`: rolagem direcional (direcionada + suave)
- `swipe`: arrastos no estilo gesto entre alvos
- `type`: texto + teclas de controle (`--clear`, delays)

Sistema

- `app`: iniciar/encerrar/reiniciar/ocultar/exibir/alternar/listar apps
- `clipboard`: ler/gravar área de transferência (texto/imagens/arquivos)
- `dialog`: clicar/inserir/arquivo/dispensar/listar diálogos do sistema
- `dock`: iniciar/clicar com botão direito/ocultar/exibir/listar itens do Dock
- `menu`: clicar/listar menus de aplicativos + extras de menu
- `menubar`: listar/clicar itens da barra de status
- `open`: `open` aprimorado com direcionamento de app + payloads JSON
- `space`: listar/alternar/mover-janela (Spaces)
- `visualizer`: exercita as animações de feedback visual do Peekaboo
- `window`: fechar/minimizar/maximizar/mover/redimensionar/focar/listar

Visão

- `see`: mapas de UI anotados, IDs de snapshot, análise opcional

Flags globais de execução

- `--json`/`-j`, `--verbose`/`-v`, `--log-level <level>`
- `--no-remote`, `--bridge-socket <path>`

## Início rápido (caminho feliz)

```bash
peekaboo permissions
peekaboo list apps --json
peekaboo see --annotate --path /tmp/peekaboo-see.png
peekaboo click --on B1
peekaboo type "Hello" --return
```

## Parâmetros de direcionamento comuns (maioria dos comandos de interação)

- App/janela: `--app`, `--pid`, `--window-title`, `--window-id`, `--window-index`
- Direcionamento de snapshot: `--snapshot` (ID do `see`; padrão é o mais recente)
- Elemento/coords: `--on`/`--id` (ID do elemento), `--coords x,y`
- Controle de foco: `--no-auto-focus`, `--space-switch`, `--bring-to-current-space`,
  `--focus-timeout-seconds`, `--focus-retry-count`

## Parâmetros comuns de captura

- Saída: `--path`, `--format png|jpg`, `--retina`
- Direcionamento: `--mode screen|window|frontmost`, `--screen-index`,
  `--window-title`, `--window-id`
- Análise: `--analyze "prompt"`, `--annotate`
- Engine de captura: `--capture-engine auto|classic|cg|modern|sckit`

## Parâmetros comuns de movimento/digitação

- Temporização: `--duration` (drag/swipe), `--steps`, `--delay` (type/scroll/press)
- Movimento humanizado: `--profile human|linear`, `--wpm` (digitação)
- Rolagem: `--direction up|down|left|right`, `--amount <ticks>`, `--smooth`

## Exemplos

### See -> click -> type (fluxo mais confiável)

```bash
peekaboo see --app Safari --window-title "Login" --annotate --path /tmp/see.png
peekaboo click --on B3 --app Safari
peekaboo type "user@example.com" --app Safari
peekaboo press tab --count 1 --app Safari
peekaboo type "supersecret" --app Safari --return
```

### Direcionar por ID de janela

```bash
peekaboo list windows --app "Visual Studio Code" --json
peekaboo click --window-id 12345 --coords 120,160
peekaboo type "Hello from Peekaboo" --window-id 12345
```

### Capturar screenshots + analisar

```bash
peekaboo image --mode screen --screen-index 0 --retina --path /tmp/screen.png
peekaboo image --app Safari --window-title "Dashboard" --analyze "Summarize KPIs"
peekaboo see --mode screen --screen-index 0 --analyze "Summarize the dashboard"
```

### Captura ao vivo (com detecção de movimento)

```bash
peekaboo capture live --mode region --region 100,100,800,600 --duration 30 \
  --active-fps 8 --idle-fps 2 --highlight-changes --path /tmp/capture
```

### Gerenciamento de apps e janelas

```bash
peekaboo app launch "Safari" --open https://example.com
peekaboo window focus --app Safari --window-title "Example"
peekaboo window set-bounds --app Safari --x 50 --y 50 --width 1200 --height 800
peekaboo app quit --app Safari
```

### Menus, menubar, dock

```bash
peekaboo menu click --app Safari --item "New Window"
peekaboo menu click --app TextEdit --path "Format > Font > Show Fonts"
peekaboo menu click-extra --title "WiFi"
peekaboo dock launch Safari
peekaboo menubar list --json
```

### Entrada com mouse + gestos

```bash
peekaboo move 500,300 --smooth
peekaboo drag --from B1 --to T2
peekaboo swipe --from-coords 100,500 --to-coords 100,200 --duration 800
peekaboo scroll --direction down --amount 6 --smooth
```

### Entrada pelo teclado

```bash
peekaboo hotkey --keys "cmd,shift,t"
peekaboo press escape
peekaboo type "Line 1\nLine 2" --delay 10
```

Observações

- Requer permissões de Gravação de Tela + Acessibilidade.
- Use `peekaboo see --annotate` para identificar alvos antes de clicar.
