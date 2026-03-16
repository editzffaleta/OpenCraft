---
summary: "Referência do CLI para `opencraft browser` (perfis, tabs, ações, relay de extensão)"
read_when:
  - Você usa `opencraft browser` e quer exemplos para tarefas comuns
  - Você quer controlar um browser rodando em outra máquina via host de node
  - Você quer usar o relay de extensão Chrome (anexar/desanexar via botão da barra de ferramentas)
title: "browser"
---

# `opencraft browser`

Gerenciar o servidor de controle de browser do OpenCraft e rodar ações de browser (tabs, snapshots, screenshots, navegação, cliques, digitação).

Relacionado:

- Ferramenta Browser + API: [Browser tool](/tools/browser)
- Relay de extensão Chrome: [Chrome extension](/tools/chrome-extension)

## Flags comuns

- `--url <gatewayWsUrl>`: URL WebSocket do Gateway (padrão da config).
- `--token <token>`: token do Gateway (se necessário).
- `--timeout <ms>`: timeout de requisição (ms).
- `--browser-profile <name>`: escolher um perfil de browser (padrão da config).
- `--json`: saída legível por máquina (onde suportado).

## Início rápido (local)

```bash
opencraft browser profiles
opencraft browser --browser-profile opencraft start
opencraft browser --browser-profile opencraft open https://example.com
opencraft browser --browser-profile opencraft snapshot
```

## Perfis

Perfis são configs de roteamento de browser nomeadas. Na prática:

- `opencraft`: inicia/anexa a uma instância Chrome dedicada gerenciada pelo OpenCraft (diretório de dados de usuário isolado).
- `user`: controla sua sessão Chrome logada existente via Chrome DevTools MCP.
- `chrome-relay`: controla sua(s) tab(s) Chrome existente(s) via relay de extensão Chrome.

```bash
opencraft browser profiles
opencraft browser create-profile --name work --color "#FF5A36"
opencraft browser delete-profile --name work
```

Usar um perfil específico:

```bash
opencraft browser --browser-profile work tabs
```

## Tabs

```bash
opencraft browser tabs
opencraft browser open https://docs.openclaw.ai
opencraft browser focus <targetId>
opencraft browser close <targetId>
```

## Snapshot / screenshot / ações

Snapshot:

```bash
opencraft browser snapshot
```

Screenshot:

```bash
opencraft browser screenshot
```

Navegar/clicar/digitar (automação de UI baseada em ref):

```bash
opencraft browser navigate https://example.com
opencraft browser click <ref>
opencraft browser type <ref> "olá"
```

## Relay de extensão Chrome (anexar via botão da barra de ferramentas)

Este modo permite que o agente controle uma tab Chrome existente que você anexa manualmente (não anexa automaticamente).

Instalar a extensão desempacotada em um path estável:

```bash
opencraft browser extension install
opencraft browser extension path
```

Depois Chrome → `chrome://extensions` → habilitar "Modo desenvolvedor" → "Carregar sem compactação" → selecionar a pasta impressa.

Guia completo: [Chrome extension](/tools/chrome-extension)

## Controle remoto de browser (proxy de host de node)

Se o Gateway roda em uma máquina diferente da que tem o browser, rode um **host de node** na máquina que tem Chrome/Brave/Edge/Chromium. O Gateway fará proxy de ações de browser para esse node (sem servidor de controle de browser separado necessário).

Use `gateway.nodes.browser.mode` para controlar roteamento automático e `gateway.nodes.browser.node` para fixar um node específico se múltiplos estiverem conectados.

Segurança + setup remoto: [Browser tool](/tools/browser), [Acesso remoto](/gateway/remote), [Tailscale](/gateway/tailscale), [Segurança](/gateway/security)
