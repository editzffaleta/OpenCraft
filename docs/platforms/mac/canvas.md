---
summary: "Painel Canvas controlado pelo agente embutido via WKWebView + esquema de URL customizado"
read_when:
  - Implementando o painel Canvas do macOS
  - Adicionando controles do agente para workspace visual
  - Depurando carregamentos de canvas no WKWebView
title: "Canvas"
---

# Canvas (app macOS)

O app macOS incorpora um **painel Canvas** controlado pelo agente usando `WKWebView`. É
um workspace visual leve para HTML/CSS/JS, A2UI e pequenas superfícies de UI interativas.

## Onde o Canvas fica

O estado do Canvas é armazenado em Application Support:

- `~/Library/Application Support/OpenCraft/canvas/<sessão>/...`

O painel Canvas serve esses arquivos via um **esquema de URL customizado**:

- `openclaw-canvas://<sessão>/<caminho>`

Exemplos:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Se não existir um `index.html` na raiz, o app exibe uma **página scaffold embutida**.

## Comportamento do painel

- Painel sem borda, redimensionável, ancorado próximo à barra de menu (ou cursor do mouse).
- Lembra tamanho/posição por sessão.
- Recarrega automaticamente quando arquivos de canvas locais mudam.
- Apenas um painel Canvas fica visível por vez (a sessão é alternada conforme necessário).

O Canvas pode ser desabilitado em Configurações → **Permitir Canvas**. Quando desabilitado,
comandos de canvas do nó retornam `CANVAS_DISABLED`.

## Superfície da API do agente

O Canvas é exposto via o **WebSocket do Gateway**, para que o agente possa:

- mostrar/ocultar o painel
- navegar para um caminho ou URL
- avaliar JavaScript
- capturar uma imagem de snapshot

Exemplos de CLI:

```bash
opencraft nodes canvas present --node <id>
opencraft nodes canvas navigate --node <id> --url "/"
opencraft nodes canvas eval --node <id> --js "document.title"
opencraft nodes canvas snapshot --node <id>
```

Notas:

- `canvas.navigate` aceita **caminhos de canvas locais**, URLs `http(s)` e URLs `file://`.
- Se você passar `"/"`, o Canvas exibe o scaffold local ou `index.html`.

## A2UI no Canvas

A2UI é hospedado pelo host canvas do Gateway e renderizado dentro do painel Canvas.
Quando o Gateway anuncia um host Canvas, o app macOS navega automaticamente para a
página do host A2UI na primeira abertura.

URL padrão do host A2UI:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Comandos A2UI (v0.8)

O Canvas atualmente aceita mensagens servidor→cliente **A2UI v0.8**:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) não é suportado.

Exemplo de CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"Se você consegue ler isso, o push A2UI funciona."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

opencraft nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Smoke rápido:

```bash
opencraft nodes canvas a2ui push --node <id> --text "Olá do A2UI"
```

## Disparando execuções do agente a partir do Canvas

O Canvas pode disparar novas execuções do agente via deep links:

- `openclaw://agent?...`

Exemplo (em JS):

```js
window.location.href = "openclaw://agent?message=Revise%20este%20design";
```

O app solicita confirmação a menos que uma chave válida seja fornecida.

## Notas de segurança

- O esquema do Canvas bloqueia traversal de diretório; os arquivos devem estar na raiz da sessão.
- O conteúdo Canvas local usa um esquema customizado (sem necessidade de servidor loopback).
- URLs `http(s)` externas são permitidas apenas quando navegadas explicitamente.
