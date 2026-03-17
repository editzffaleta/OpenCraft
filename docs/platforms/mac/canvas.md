---
summary: "Painel Canvas controlado pelo agente incorporado via WKWebView + esquema de URL personalizado"
read_when:
  - Implementando o painel Canvas do macOS
  - Adicionando controles de agente para workspace visual
  - Depurando carregamentos de Canvas no WKWebView
title: "Canvas"
---

# Canvas (aplicativo macOS)

O aplicativo macOS incorpora um **painel Canvas** controlado pelo agente usando `WKWebView`. É
um workspace visual leve para HTML/CSS/JS, A2UI e pequenas superfícies de UI
interativas.

## Onde o Canvas fica

O estado do Canvas é armazenado em Application Support:

- `~/Library/Application Support/OpenCraft/canvas/<session>/...`

O painel Canvas serve esses arquivos via um **esquema de URL personalizado**:

- `opencraft-canvas://<session>/<path>`

Exemplos:

- `opencraft-canvas://main/` → `<canvasRoot>/main/index.html`
- `opencraft-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `opencraft-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Se nenhum `index.html` existir na raiz, o aplicativo mostra uma **página scaffold incorporada**.

## Comportamento do painel

- Painel sem bordas, redimensionável, ancorado perto da barra de menus (ou cursor do mouse).
- Lembra tamanho/posição por sessão.
- Recarrega automaticamente quando arquivos locais do Canvas mudam.
- Apenas um painel Canvas é visível por vez (a sessão é alternada conforme necessário).

O Canvas pode ser desativado em Configurações → **Allow Canvas**. Quando desativado, os comandos
de nó do Canvas retornam `CANVAS_DISABLED`.

## Superfície de API do agente

O Canvas é exposto via o **WebSocket do Gateway**, permitindo que o agente:

- mostre/oculte o painel
- navegue para um caminho ou URL
- execute JavaScript
- capture uma imagem de snapshot

Exemplos de CLI:

```bash
opencraft nodes canvas present --node <id>
opencraft nodes canvas navigate --node <id> --url "/"
opencraft nodes canvas eval --node <id> --js "document.title"
opencraft nodes canvas snapshot --node <id>
```

Notas:

- `canvas.navigate` aceita **caminhos locais do Canvas**, URLs `http(s)` e URLs `file://`.
- Se você passar `"/"`, o Canvas mostra o scaffold local ou `index.html`.

## A2UI no Canvas

A2UI é hospedado pelo host de Canvas do Gateway e renderizado dentro do painel Canvas.
Quando o Gateway anuncia um host de Canvas, o aplicativo macOS navega automaticamente para a
página do host A2UI na primeira abertura.

URL padrão do host A2UI:

```
http://<gateway-host>:18789/__opencraft__/a2ui/
```

### Comandos A2UI (v0.8)

O Canvas atualmente aceita mensagens **A2UI v0.8** de servidor→cliente:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) não é suportado.

Exemplo de CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

opencraft nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Verificação rápida:

```bash
opencraft nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Disparando execuções de agente a partir do Canvas

O Canvas pode disparar novas execuções de agente via deep links:

- `opencraft://agent?...`

Exemplo (em JS):

```js
window.location.href = "opencraft://agent?message=Review%20this%20design";
```

O aplicativo solicita confirmação a menos que uma chave válida seja fornecida.

## Notas de segurança

- O esquema do Canvas bloqueia travessia de diretório; os arquivos devem estar dentro da raiz da sessão.
- O conteúdo local do Canvas usa um esquema personalizado (nenhum servidor loopback necessário).
- URLs `http(s)` externos são permitidos apenas quando explicitamente navegados.
