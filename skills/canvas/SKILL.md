# Skill Canvas

Exiba conteúdo HTML em nós conectados do OpenCraft (app Mac, iOS, Android).

## Visão Geral

A ferramenta canvas permite apresentar conteúdo web na visualização canvas de qualquer nó conectado. Ótimo para:

- Exibir jogos, visualizações, dashboards
- Mostrar conteúdo HTML gerado
- Demos interativos

## Como Funciona

### Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Canvas Host    │────▶│   Node Bridge    │────▶│  Node App   │
│  (HTTP Server)  │     │  (TCP Server)    │     │ (Mac/iOS/   │
│  Port 18793     │     │  Port 18790      │     │  Android)   │
└─────────────────┘     └──────────────────┘     └─────────────┘
```

1. **Canvas Host Server**: Serve arquivos estáticos HTML/CSS/JS do diretório `canvasHost.root`
2. **Node Bridge**: Comunica URLs do canvas para os nós conectados
3. **Node Apps**: Renderiza o conteúdo em uma WebView

### Integração com Tailscale

O servidor canvas host faz bind baseado na configuração `gateway.bind`:

| Modo de Bind | Servidor faz Bind em | URL do Canvas usa           |
| ------------ | ------------------- | -------------------------- |
| `loopback`   | 127.0.0.1           | localhost (apenas local)   |
| `lan`        | Interface LAN       | Endereço IP da LAN         |
| `tailnet`    | Interface Tailscale | Hostname do Tailscale      |
| `auto`       | Melhor disponível   | Tailscale > LAN > loopback |

**Ponto importante:** O `canvasHostHostForBridge` é derivado do `bridgeHost`. Quando vinculado ao Tailscale, os nós recebem URLs como:

```
http://<tailscale-hostname>:18793/__opencraft__/canvas/<file>.html
```

Por isso URLs de localhost não funcionam — o nó recebe o hostname do Tailscale pelo bridge!

## Ações

| Ação       | Descrição                                        |
| ---------- | ------------------------------------------------ |
| `present`  | Exibir canvas com URL alvo opcional              |
| `hide`     | Ocultar o canvas                                 |
| `navigate` | Navegar para uma nova URL                        |
| `eval`     | Executar JavaScript no canvas                    |
| `snapshot` | Capturar screenshot do canvas                    |

## Configuração

Em `~/.editzffaleta/OpenCraft.json`:

```json
{
  "canvasHost": {
    "enabled": true,
    "port": 18793,
    "root": "/Users/you/clawd/canvas",
    "liveReload": true
  },
  "gateway": {
    "bind": "auto"
  }
}
```

### Recarga Automática

Quando `liveReload: true` (padrão), o canvas host:

- Monitora o diretório raiz por alterações (via chokidar)
- Injeta um cliente WebSocket nos arquivos HTML
- Recarrega automaticamente os canvases conectados quando os arquivos mudam

Ótimo para desenvolvimento!

## Fluxo de Trabalho

### 1. Criar conteúdo HTML

Coloque os arquivos no diretório raiz do canvas (padrão: `~/clawd/canvas/`):

```bash
cat > ~/clawd/canvas/my-game.html << 'HTML'
<!DOCTYPE html>
<html>
<head><title>My Game</title></head>
<body>
  <h1>Hello Canvas!</h1>
</body>
</html>
HTML
```

### 2. Encontrar a URL do canvas host

Verifique como seu gateway está vinculado:

```bash
cat ~/.editzffaleta/OpenCraft.json | jq '.gateway.bind'
```

Depois construa a URL:

- **loopback**: `http://127.0.0.1:18793/__opencraft__/canvas/<file>.html`
- **lan/tailnet/auto**: `http://<hostname>:18793/__opencraft__/canvas/<file>.html`

Encontre seu hostname do Tailscale:

```bash
tailscale status --json | jq -r '.Self.DNSName' | sed 's/\.$//'
```

### 3. Encontrar nós conectados

```bash
opencraft nodes list
```

Procure por nós Mac/iOS/Android com capacidade de canvas.

### 4. Apresentar conteúdo

```
canvas action:present node:<node-id> target:<full-url>
```

**Exemplo:**

```
canvas action:present node:mac-63599bc4-b54d-4392-9048-b97abd58343a target:http://peters-mac-studio-1.sheep-coho.ts.net:18793/__opencraft__/canvas/snake.html
```

### 5. Navegar, tirar screenshot ou ocultar

```
canvas action:navigate node:<node-id> url:<new-url>
canvas action:snapshot node:<node-id>
canvas action:hide node:<node-id>
```

## Depuração

### Tela branca / conteúdo não carrega

**Causa:** Incompatibilidade de URL entre o bind do servidor e a expectativa do nó.

**Passos de depuração:**

1. Verifique o bind do servidor: `cat ~/.editzffaleta/OpenCraft.json | jq '.gateway.bind'`
2. Verifique em qual porta o canvas está: `lsof -i :18793`
3. Teste a URL diretamente: `curl http://<hostname>:18793/__opencraft__/canvas/<file>.html`

**Solução:** Use o hostname completo correspondente ao seu modo de bind, não localhost.

### Erro "node required"

Sempre especifique o parâmetro `node:<node-id>`.

### Erro "node not connected"

O nó está offline. Use `opencraft nodes list` para encontrar nós online.

### Conteúdo não atualiza

Se a recarga automática não estiver funcionando:

1. Verifique `liveReload: true` na configuração
2. Certifique-se de que o arquivo está no diretório raiz do canvas
3. Verifique erros do watcher nos logs

## Estrutura de Caminho da URL

O canvas host serve a partir do prefixo `/__opencraft__/canvas/`:

```
http://<host>:18793/__opencraft__/canvas/index.html  → ~/clawd/canvas/index.html
http://<host>:18793/__opencraft__/canvas/games/snake.html → ~/clawd/canvas/games/snake.html
```

O prefixo `/__opencraft__/canvas/` é definido pela constante `CANVAS_HOST_PATH`.

## Dicas

- Mantenha o HTML autocontido (CSS/JS inline) para melhores resultados
- Use o index.html padrão como página de teste (tem diagnósticos do bridge)
- O canvas persiste até você ocultá-lo ou navegar para outro lugar
- A recarga automática torna o desenvolvimento rápido — basta salvar e ele atualiza!
- O push JSON A2UI está em desenvolvimento — use arquivos HTML por enquanto
