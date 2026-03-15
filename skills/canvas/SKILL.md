# Habilidade Canvas

Exibe conteúdo HTML em nodes OpenCraft conectados (app Mac, iOS, Android).

## Visão Geral

A ferramenta canvas permite apresentar conteúdo web na visualização de canvas de qualquer node conectado. Ótima para:

- Exibir jogos, visualizações, dashboards
- Mostrar conteúdo HTML gerado
- Demos interativas

## Como Funciona

### Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Canvas Host    │────▶│   Node Bridge    │────▶│  Node App   │
│  (HTTP Server)  │     │  (TCP Server)    │     │ (Mac/iOS/   │
│  Porta 18793    │     │  Porta 18790     │     │  Android)   │
└─────────────────┘     └──────────────────┘     └─────────────┘
```

1. **Servidor Canvas Host**: Serve arquivos HTML/CSS/JS estáticos do diretório `canvasHost.root`
2. **Node Bridge**: Comunica URLs de canvas para os nodes conectados
3. **Apps de Node**: Renderizam o conteúdo numa WebView

### Integração com Tailscale

O servidor canvas host faz bind baseado na configuração `gateway.bind`:

| Modo de Bind | Servidor faz bind em | URL do Canvas usa            |
| ------------ | -------------------- | ---------------------------- |
| `loopback`   | 127.0.0.1            | localhost (apenas local)     |
| `lan`        | Interface LAN        | Endereço IP da LAN           |
| `tailnet`    | Interface Tailscale  | Hostname do Tailscale        |
| `auto`       | Melhor disponível    | Tailscale > LAN > loopback   |

**Ponto chave:** O `canvasHostHostForBridge` é derivado do `bridgeHost`. Quando vinculado ao Tailscale, os nodes recebem URLs como:

```
http://<hostname-tailscale>:18793/__opencraft__/canvas/<arquivo>.html
```

Por isso URLs de localhost não funcionam — o node recebe o hostname do Tailscale pela bridge!

## Ações

| Ação       | Descrição                                     |
| ---------- | --------------------------------------------- |
| `present`  | Exibir canvas com URL alvo opcional           |
| `hide`     | Ocultar o canvas                              |
| `navigate` | Navegar para uma nova URL                     |
| `eval`     | Executar JavaScript no canvas                 |
| `snapshot` | Capturar screenshot do canvas                 |

## Configuração

Em `~/.opencraft/opencraft.json`:

```json
{
  "canvasHost": {
    "enabled": true,
    "port": 18793,
    "root": "/Users/voce/opencraft/canvas",
    "liveReload": true
  },
  "gateway": {
    "bind": "auto"
  }
}
```

### Live Reload

Com `liveReload: true` (padrão), o canvas host:

- Monitora o diretório raiz por mudanças (via chokidar)
- Injeta um cliente WebSocket nos arquivos HTML
- Recarrega automaticamente os canvases conectados quando os arquivos mudam

Ótimo para desenvolvimento!

## Fluxo de Trabalho

### 1. Criar conteúdo HTML

Coloque os arquivos no diretório raiz do canvas (padrão `~/opencraft/canvas/`):

```bash
cat > ~/opencraft/canvas/meu-jogo.html << 'HTML'
<!DOCTYPE html>
<html>
<head><title>Meu Jogo</title></head>
<body>
  <h1>Olá Canvas!</h1>
</body>
</html>
HTML
```

### 2. Encontrar a URL do canvas host

Verifique como seu gateway está vinculado:

```bash
cat ~/.opencraft/opencraft.json | jq '.gateway.bind'
```

Depois construa a URL:

- **loopback**: `http://127.0.0.1:18793/__opencraft__/canvas/<arquivo>.html`
- **lan/tailnet/auto**: `http://<hostname>:18793/__opencraft__/canvas/<arquivo>.html`

Encontre seu hostname do Tailscale:

```bash
tailscale status --json | jq -r '.Self.DNSName' | sed 's/\.$//'
```

### 3. Encontrar nodes conectados

```bash
opencraft nodes list
```

Procure nodes Mac/iOS/Android com capacidade de canvas.

### 4. Apresentar conteúdo

```
canvas action:present node:<node-id> target:<url-completa>
```

**Exemplo:**

```
canvas action:present node:mac-63599bc4-b54d-4392-9048-b97abd58343a target:http://meu-mac.sheep-coho.ts.net:18793/__opencraft__/canvas/snake.html
```

### 5. Navegar, capturar screenshot ou ocultar

```
canvas action:navigate node:<node-id> url:<nova-url>
canvas action:snapshot node:<node-id>
canvas action:hide node:<node-id>
```

## Depuração

### Tela branca / conteúdo não carrega

**Causa:** Incompatibilidade de URL entre o bind do servidor e a expectativa do node.

**Passos de depuração:**

1. Verificar bind do servidor: `cat ~/.opencraft/opencraft.json | jq '.gateway.bind'`
2. Verificar em qual porta o canvas está: `lsof -i :18793`
3. Testar URL diretamente: `curl http://<hostname>:18793/__opencraft__/canvas/<arquivo>.html`

**Solução:** Use o hostname completo correspondente ao seu modo de bind, não localhost.

### Erro "node required"

Sempre especifique o parâmetro `node:<node-id>`.

### Erro "node not connected"

O node está offline. Use `opencraft nodes list` para encontrar nodes online.

### Conteúdo não atualiza

Se o live reload não estiver funcionando:

1. Verifique `liveReload: true` na configuração
2. Certifique-se de que o arquivo está no diretório raiz do canvas
3. Verifique erros do watcher nos logs

## Estrutura do Caminho de URL

O canvas host serve com o prefixo `/__opencraft__/canvas/`:

```
http://<host>:18793/__opencraft__/canvas/index.html  → ~/opencraft/canvas/index.html
http://<host>:18793/__opencraft__/canvas/jogos/snake.html → ~/opencraft/canvas/jogos/snake.html
```

O prefixo `/__opencraft__/canvas/` é definido pela constante `CANVAS_HOST_PATH`.

## Dicas

- Mantenha o HTML autocontido (CSS/JS inline) para melhores resultados
- Use o index.html padrão como página de teste (tem diagnósticos da bridge)
- O canvas persiste até você ocultá-lo com `hide` ou navegar para outro lugar
- O live reload torna o desenvolvimento rápido — só salve e ele atualiza!
- Push de JSON A2UI está em desenvolvimento — use arquivos HTML por enquanto
