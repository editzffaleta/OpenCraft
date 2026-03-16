---
summary: "Serviço de controle de browser integrado + comandos de ação"
read_when:
  - Adicionando automação de browser controlada pelo agente
  - Depurando por que o opencraft está interferindo com seu Chrome
  - Implementando configurações de browser + ciclo de vida no app macOS
title: "Browser (gerenciado pelo OpenCraft)"
---

# Browser (gerenciado pelo opencraft)

O OpenCraft pode rodar um **perfil dedicado de Chrome/Brave/Edge/Chromium** que o agente controla.
Ele é isolado do seu browser pessoal e é gerenciado através de um pequeno serviço de
controle local dentro do Gateway (somente loopback).

Visão para iniciantes:

- Pense nisso como um **browser separado, somente para o agente**.
- O perfil `openclaw` **não** toca o seu perfil de browser pessoal.
- O agente pode **abrir abas, ler páginas, clicar e digitar** em uma faixa segura.
- O perfil integrado `user` se conecta à sua sessão Chrome real com login;
  `chrome-relay` é o perfil explícito de relay de extensão.

## O que você obtém

- Um perfil de browser separado chamado **openclaw** (acento laranja por padrão).
- Controle determinístico de abas (listar/abrir/focar/fechar).
- Ações do agente (clicar/digitar/arrastar/selecionar), snapshots, screenshots, PDFs.
- Suporte multi-perfil opcional (`openclaw`, `work`, `remote`, ...).

Este browser **não** é o seu browser diário. É uma superfície segura e isolada para
automação e verificação do agente.

## Início rápido

```bash
opencraft browser --browser-profile openclaw status
opencraft browser --browser-profile openclaw start
opencraft browser --browser-profile openclaw open https://example.com
opencraft browser --browser-profile openclaw snapshot
```

Se você receber "Browser disabled", habilite-o na config (veja abaixo) e reinicie o
Gateway.

## Perfis: `openclaw` vs `user` vs `chrome-relay`

- `openclaw`: browser gerenciado e isolado (sem extensão necessária).
- `user`: perfil de conexão MCP do Chrome integrado para sua sessão Chrome **real com login**.
- `chrome-relay`: relay de extensão para o seu **browser do sistema** (requer que a
  extensão do OpenCraft esteja conectada a uma aba).

Para chamadas de tool de browser do agente:

- Padrão: use o browser `openclaw` isolado.
- Prefira `profile="user"` quando sessões com login existentes importam e o usuário
  está no computador para clicar/aprovar qualquer prompt de conexão.
- Use `profile="chrome-relay"` apenas quando o usuário explicitamente quiser o fluxo de
  extensão Chrome / botão da barra de ferramentas.
- `profile` é a substituição explícita quando você quer um modo de browser específico.

Defina `browser.defaultProfile: "openclaw"` se você quiser o modo gerenciado por padrão.

## Configuração

As configurações do browser ficam em `~/.opencraft/opencraft.json`.

```json5
{
  browser: {
    enabled: true, // padrão: true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // modo de rede confiável padrão
      // allowPrivateNetwork: true, // alias legado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // substituição legada de perfil único
    remoteCdpTimeoutMs: 1500, // timeout HTTP de CDP remoto (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // timeout de handshake WebSocket CDP remoto (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      "chrome-relay": {
        driver: "extension",
        cdpUrl: "http://127.0.0.1:18792",
        color: "#00AA00",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

Notas:

- O serviço de controle de browser se vincula ao loopback em uma porta derivada de `gateway.port`
  (padrão: `18791`, que é gateway + 2). O relay usa a próxima porta (`18792`).
- Se você sobrescrever a porta do Gateway (`gateway.port` ou `OPENCLAW_GATEWAY_PORT`),
  as portas de browser derivadas mudam para ficar na mesma "família".
- `cdpUrl` padrão é a porta de relay quando não definido.
- `remoteCdpTimeoutMs` se aplica a verificações de acessibilidade de CDP remoto (não-loopback).
- `remoteCdpHandshakeTimeoutMs` se aplica a verificações de acessibilidade WebSocket CDP remoto.
- Navegação/abertura de aba do browser é protegida por SSRF antes da navegação e verificada de melhor esforço na URL final `http(s)` após a navegação.
- No modo SSRF estrito, descoberta/probes de endpoint CDP remoto (`cdpUrl`, incluindo buscas `/json/version`) também são verificados.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` padrão é `true` (modelo de rede confiável). Defina como `false` para navegação pública estrita.
- `browser.ssrfPolicy.allowPrivateNetwork` permanece suportado como alias legado para compatibilidade.
- `attachOnly: true` significa "nunca iniciar um browser local; apenas conectar se já estiver rodando."
- `color` + `color` por perfil tingem a UI do browser para que você possa ver qual perfil está ativo.
- Perfil padrão é `openclaw` (browser standalone gerenciado pelo OpenCraft). Use `defaultProfile: "user"` para optar pelo browser do usuário com login, ou `defaultProfile: "chrome-relay"` para o relay de extensão.
- Ordem de detecção automática: browser padrão do sistema se baseado em Chromium; caso contrário Chrome → Brave → Edge → Chromium → Chrome Canary.
- Perfis locais `openclaw` atribuem automaticamente `cdpPort`/`cdpUrl` — defina esses apenas para CDP remoto.
- `driver: "existing-session"` usa Chrome DevTools MCP em vez de CDP bruto. Não
  defina `cdpUrl` para esse driver.

## Usar Brave (ou outro browser baseado em Chromium)

Se o seu browser padrão do **sistema** é baseado em Chromium (Chrome/Brave/Edge/etc),
o OpenCraft o usa automaticamente. Defina `browser.executablePath` para sobrescrever
a detecção automática:

Exemplo de CLI:

```bash
opencraft config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Controle local vs remoto

- **Controle local (padrão):** o Gateway inicia o serviço de controle loopback e pode iniciar um browser local.
- **Controle remoto (node host):** execute um node host na máquina que tem o browser; o Gateway faz proxy das ações de browser para ele.
- **CDP remoto:** defina `browser.profiles.<nome>.cdpUrl` (ou `browser.cdpUrl`) para
  se conectar a um browser baseado em Chromium remoto. Neste caso, o OpenCraft não iniciará um browser local.

URLs de CDP remoto podem incluir autenticação:

- Tokens de query (ex.: `https://provider.example?token=<token>`)
- HTTP Basic auth (ex.: `https://user:pass@provider.example`)

O OpenCraft preserva a autenticação ao chamar endpoints `/json/*` e ao se conectar
ao WebSocket CDP. Prefira variáveis de ambiente ou gerenciadores de secrets para
tokens em vez de comprometê-los em arquivos de config.

## Proxy de browser de node (zero-config padrão)

Se você roda um **node host** na máquina que tem seu browser, o OpenCraft pode
auto-rotear chamadas de tool de browser para aquele node sem nenhuma config de browser extra.
Este é o caminho padrão para gateways remotos.

Notas:

- O node host expõe seu servidor de controle de browser local via um **comando proxy**.
- Perfis vêm da config própria `browser.profiles` do node (igual ao local).
- Desabilite se você não quiser:
  - No node: `nodeHost.browserProxy.enabled=false`
  - No gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto hospedado)

[Browserless](https://browserless.io) é um serviço Chromium hospedado que expõe
endpoints CDP via HTTPS. Você pode apontar um perfil de browser do OpenCraft para um
endpoint de região do Browserless e autenticar com sua chave de API.

Exemplo:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "https://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Notas:

- Substitua `<BROWSERLESS_API_KEY>` pelo seu token Browserless real.
- Escolha o endpoint de região que corresponde à sua conta Browserless (veja a documentação deles).

## Provedores de CDP WebSocket direto

Alguns serviços de browser hospedados expõem um endpoint **WebSocket direto** em vez do
descoberta CDP padrão baseada em HTTP (`/json/version`). O OpenCraft suporta ambos:

- **Endpoints HTTP(S)** (ex.: Browserless) — o OpenCraft chama `/json/version` para
  descobrir a URL do debugger WebSocket, então se conecta.
- **Endpoints WebSocket** (`ws://` / `wss://`) — o OpenCraft se conecta diretamente,
  pulando `/json/version`. Use isso para serviços como
  [Browserbase](https://www.browserbase.com) ou qualquer provedor que entregue uma
  URL WebSocket.

### Browserbase

[Browserbase](https://www.browserbase.com) é uma plataforma na nuvem para rodar
browsers headless com resolução de CAPTCHA integrada, modo stealth e proxies residenciais.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Notas:

- [Crie uma conta](https://www.browserbase.com/sign-up) e copie sua **Chave de API**
  do [dashboard Overview](https://www.browserbase.com/overview).
- Substitua `<BROWSERBASE_API_KEY>` pela sua chave de API Browserbase real.
- O Browserbase cria automaticamente uma sessão de browser na conexão WebSocket, então nenhuma
  etapa manual de criação de sessão é necessária.
- O tier gratuito permite uma sessão simultânea e uma hora de browser por mês.
  Veja [preços](https://www.browserbase.com/pricing) para limites de planos pagos.
- Veja a [documentação do Browserbase](https://docs.browserbase.com) para referência completa de API,
  guias de SDK e exemplos de integração.

## Segurança

Ideias principais:

- O controle de browser é somente loopback; o acesso flui pela autenticação do Gateway ou pareamento de node.
- Se o controle de browser estiver habilitado e nenhuma autenticação estiver configurada, o OpenCraft gera automaticamente `gateway.auth.token` na inicialização e o persiste na config.
- Mantenha o Gateway e quaisquer node hosts em uma rede privada (Tailscale); evite exposição pública.
- Trate URLs/tokens de CDP remoto como secrets; prefira vars de env ou um gerenciador de secrets.

Dicas de CDP remoto:

- Prefira endpoints criptografados (HTTPS ou WSS) e tokens de curta duração quando possível.
- Evite incorporar tokens de longa duração diretamente em arquivos de config.

## Perfis (multi-browser)

O OpenCraft suporta múltiplos perfis nomeados (configs de roteamento). Perfis podem ser:

- **gerenciados pelo opencraft**: uma instância de browser dedicada baseada em Chromium com seu próprio diretório de dados de usuário + porta CDP
- **remoto**: uma URL CDP explícita (browser baseado em Chromium rodando em outro lugar)
- **relay de extensão**: suas abas Chrome existentes via relay local + extensão Chrome
- **sessão existente**: seu perfil Chrome existente via conexão automática Chrome DevTools MCP

Padrões:

- O perfil `openclaw` é criado automaticamente se ausente.
- O perfil `chrome-relay` é integrado para o relay de extensão Chrome (aponta para `http://127.0.0.1:18792` por padrão).
- Perfis de sessão existente são opt-in; crie-os com `--driver existing-session`.
- Portas CDP locais são alocadas de **18800–18899** por padrão.
- Excluir um perfil move seu diretório de dados local para a Lixeira.

Todos os endpoints de controle aceitam `?profile=<nome>`; o CLI usa `--browser-profile`.

## Relay de extensão Chrome (use seu Chrome existente)

O OpenCraft também pode controlar **suas abas Chrome existentes** (sem instância Chrome separada "openclaw") via relay CDP local + extensão Chrome.

Guia completo: [Extensão Chrome](/tools/chrome-extension)

Fluxo:

- O Gateway roda localmente (mesma máquina) ou um node host roda na máquina do browser.
- Um **servidor relay** local escuta em um `cdpUrl` loopback (padrão: `http://127.0.0.1:18792`).
- Você clica no ícone da extensão **OpenCraft Browser Relay** em uma aba para conectar (ela não se conecta automaticamente).
- O agente controla aquela aba via a tool `browser` normal, selecionando o perfil correto.

Se o Gateway rodar em outro lugar, execute um node host na máquina do browser para que o Gateway possa fazer proxy das ações de browser.

### Sessões em sandbox

Se a sessão do agente estiver em sandbox, a tool `browser` pode usar `target="sandbox"` (browser sandbox) por padrão.
O controle via relay de extensão Chrome requer controle de browser do host, então:

- execute a sessão sem sandbox, ou
- defina `agents.defaults.sandbox.browser.allowHostControl: true` e use `target="host"` ao chamar a tool.

### Configuração

1. Carregue a extensão (dev/descompactado):

```bash
opencraft browser extension install
```

- Chrome → `chrome://extensions` → habilite "Modo do desenvolvedor"
- "Carregar sem compactação" → selecione o diretório impresso por `opencraft browser extension path`
- Fixe a extensão, então clique nela na aba que você quer controlar (badge mostra `ON`).

2. Use-a:

- CLI: `opencraft browser --browser-profile chrome-relay tabs`
- Tool de agente: `browser` com `profile="chrome-relay"`

Opcional: se você quiser um nome ou porta de relay diferente, crie seu próprio perfil:

```bash
opencraft browser create-profile \
  --name meu-chrome \
  --driver extension \
  --cdp-url http://127.0.0.1:18792 \
  --color "#00AA00"
```

Notas:

- Este modo usa Playwright-on-CDP para a maioria das operações (screenshots/snapshots/ações).
- Desconecte clicando no ícone da extensão novamente.
- Uso pelo agente: prefira `profile="user"` para sites com login. Use `profile="chrome-relay"`
  apenas quando você especificamente quiser o fluxo de extensão. O usuário deve estar presente
  para clicar na extensão e conectar a aba.

## Chrome sessão existente via MCP

O OpenCraft também pode se conectar a um perfil Chrome rodando através do servidor oficial
Chrome DevTools MCP. Isso reutiliza as abas e o estado de login já abertos naquele
perfil Chrome.

Referências oficiais de contexto e configuração:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado:

- `user`

Opcional: crie seu próprio perfil de sessão existente personalizado se você quiser um
nome ou cor diferente.

Então no Chrome:

1. Abra `chrome://inspect/#remote-debugging`
2. Habilite depuração remota
3. Mantenha o Chrome rodando e aprove o prompt de conexão quando o OpenCraft se conectar

Teste de smoke de conexão ao vivo:

```bash
opencraft browser --browser-profile user start
opencraft browser --browser-profile user status
opencraft browser --browser-profile user tabs
opencraft browser --browser-profile user snapshot --format ai
```

Como parece o sucesso:

- `status` mostra `driver: existing-session`
- `status` mostra `transport: chrome-mcp`
- `status` mostra `running: true`
- `tabs` lista suas abas Chrome já abertas
- `snapshot` retorna refs da aba ao vivo selecionada

O que verificar se a conexão não funcionar:

- Chrome versão `144+`
- depuração remota habilitada em `chrome://inspect/#remote-debugging`
- Chrome mostrou e você aceitou o prompt de consentimento de conexão

Uso pelo agente:

- Use `profile="user"` quando você precisar do estado do browser com login do usuário.
- Se você usar um perfil de sessão existente personalizado, passe esse nome de perfil explícito.
- Prefira `profile="user"` sobre `profile="chrome-relay"` a menos que o usuário
  explicitamente queira o fluxo de extensão / conectar-aba.
- Escolha este modo apenas quando o usuário está no computador para aprovar o prompt de conexão.
- o Gateway ou node host pode iniciar `npx chrome-devtools-mcp@latest --autoConnect`

Notas:

- Este caminho é de maior risco do que o perfil `openclaw` isolado porque pode
  agir dentro da sua sessão de browser com login.
- O OpenCraft não inicia o Chrome para este driver; ele se conecta a uma sessão existente apenas.
- O OpenCraft usa o fluxo oficial `--autoConnect` do Chrome DevTools MCP aqui, não
  o fluxo legado de porta de depuração remota de perfil padrão.
- Screenshots de sessão existente suportam capturas de página e capturas de elemento `--ref`
  de snapshots, mas não seletores CSS `--element`.
- `wait --url` de sessão existente suporta padrões exatos, de substring e glob
  como outros drivers de browser. `wait --load networkidle` ainda não é suportado.
- Alguns recursos ainda requerem o relay de extensão ou caminho de browser gerenciado, como
  exportação de PDF e interceptação de download.
- Deixe o relay somente loopback por padrão. Se o relay precisar ser acessível de um namespace de rede diferente (por exemplo Gateway no WSL2, Chrome no Windows), defina `browser.relayBindHost` para um endereço de bind explícito como `0.0.0.0` enquanto mantém a rede circundante privada e autenticada.

Exemplo WSL2 / entre namespaces:

```json5
{
  browser: {
    enabled: true,
    relayBindHost: "0.0.0.0",
    defaultProfile: "chrome-relay",
  },
}
```

## Garantias de isolamento

- **Diretório de dados de usuário dedicado**: nunca toca o seu perfil de browser pessoal.
- **Portas dedicadas**: evita `9222` para prevenir colisões com workflows de dev.
- **Controle determinístico de abas**: alveja abas por `targetId`, não "última aba".

## Seleção de browser

Ao iniciar localmente, o OpenCraft escolhe o primeiro disponível:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Você pode sobrescrever com `browser.executablePath`.

Plataformas:

- macOS: verifica `/Applications` e `~/Applications`.
- Linux: procura por `google-chrome`, `brave`, `microsoft-edge`, `chromium`, etc.
- Windows: verifica locais de instalação comuns.

## API de Controle (opcional)

Apenas para integrações locais, o Gateway expõe uma pequena API HTTP loopback:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Abas: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Ações: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Depuração: `GET /console`, `POST /pdf`
- Depuração: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Rede: `POST /response/body`
- Estado: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Estado: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Configurações: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Todos os endpoints aceitam `?profile=<nome>`.

Se a autenticação do gateway estiver configurada, rotas HTTP de browser também requerem autenticação:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou HTTP Basic auth com essa senha

### Requisito Playwright

Alguns recursos (navigate/act/AI snapshot/role snapshot, screenshots de elemento, PDF) requerem
Playwright. Se o Playwright não estiver instalado, esses endpoints retornam um erro 501 claro.
Snapshots ARIA e screenshots básicos ainda funcionam para Chrome gerenciado pelo opencraft.
Para o driver de relay de extensão Chrome, snapshots ARIA e screenshots requerem Playwright.

Se você ver `Playwright is not available in this gateway build`, instale o pacote completo do
Playwright (não `playwright-core`) e reinicie o gateway, ou reinstale
o OpenCraft com suporte a browser.

#### Instalação do Playwright no Docker

Se seu Gateway rodar no Docker, evite `npx playwright` (conflitos de substituição npm).
Use o CLI empacotado:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para persistir downloads de browser, defina `PLAYWRIGHT_BROWSERS_PATH` (por exemplo,
`/home/node/.cache/ms-playwright`) e certifique-se de que `/home/node` seja persistido via
`OPENCLAW_HOME_VOLUME` ou um bind mount. Veja [Docker](/install/docker).

## Como funciona (interno)

Fluxo de alto nível:

- Um pequeno **servidor de controle** aceita requisições HTTP.
- Ele se conecta a browsers baseados em Chromium (Chrome/Brave/Edge/Chromium) via **CDP**.
- Para ações avançadas (clicar/digitar/snapshot/PDF), usa **Playwright** em cima do CDP.
- Quando o Playwright está ausente, apenas operações não-Playwright estão disponíveis.

Este design mantém o agente em uma interface estável e determinística enquanto permite
trocar browsers locais/remotos e perfis.

## Referência rápida do CLI

Todos os comandos aceitam `--browser-profile <nome>` para apontar para um perfil específico.
Todos os comandos também aceitam `--json` para saída legível por máquina (payloads estáveis).

Básico:

- `opencraft browser status`
- `opencraft browser start`
- `opencraft browser stop`
- `opencraft browser tabs`
- `opencraft browser tab`
- `opencraft browser tab new`
- `opencraft browser tab select 2`
- `opencraft browser tab close 2`
- `opencraft browser open https://example.com`
- `opencraft browser focus abcd1234`
- `opencraft browser close abcd1234`

Inspeção:

- `opencraft browser screenshot`
- `opencraft browser screenshot --full-page`
- `opencraft browser screenshot --ref 12`
- `opencraft browser screenshot --ref e12`
- `opencraft browser snapshot`
- `opencraft browser snapshot --format aria --limit 200`
- `opencraft browser snapshot --interactive --compact --depth 6`
- `opencraft browser snapshot --efficient`
- `opencraft browser snapshot --labels`
- `opencraft browser snapshot --selector "#main" --interactive`
- `opencraft browser snapshot --frame "iframe#main" --interactive`
- `opencraft browser console --level error`
- `opencraft browser errors --clear`
- `opencraft browser requests --filter api --clear`
- `opencraft browser pdf`
- `opencraft browser responsebody "**/api" --max-chars 5000`

Ações:

- `opencraft browser navigate https://example.com`
- `opencraft browser resize 1280 720`
- `opencraft browser click 12 --double`
- `opencraft browser click e12 --double`
- `opencraft browser type 23 "hello" --submit`
- `opencraft browser press Enter`
- `opencraft browser hover 44`
- `opencraft browser scrollintoview e12`
- `opencraft browser drag 10 11`
- `opencraft browser select 9 OptionA OptionB`
- `opencraft browser download e12 report.pdf`
- `opencraft browser waitfordownload report.pdf`
- `opencraft browser upload /tmp/openclaw/uploads/file.pdf`
- `opencraft browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `opencraft browser dialog --accept`
- `opencraft browser wait --text "Concluído"`
- `opencraft browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `opencraft browser evaluate --fn '(el) => el.textContent' --ref 7`
- `opencraft browser highlight e12`
- `opencraft browser trace start`
- `opencraft browser trace stop`

Estado:

- `opencraft browser cookies`
- `opencraft browser cookies set session abc123 --url "https://example.com"`
- `opencraft browser cookies clear`
- `opencraft browser storage local get`
- `opencraft browser storage local set theme dark`
- `opencraft browser storage session clear`
- `opencraft browser set offline on`
- `opencraft browser set headers --headers-json '{"X-Debug":"1"}'`
- `opencraft browser set credentials user pass`
- `opencraft browser set credentials --clear`
- `opencraft browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `opencraft browser set geo --clear`
- `opencraft browser set media dark`
- `opencraft browser set timezone America/New_York`
- `opencraft browser set locale en-US`
- `opencraft browser set device "iPhone 14"`

Notas:

- `upload` e `dialog` são chamadas de **armamento**; execute-as antes do clique/pressionamento
  que aciona o seletor/diálogo.
- Caminhos de saída de download e trace são restritos às raízes temporárias do OpenCraft:
  - traces: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - downloads: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- Caminhos de upload são restritos a uma raiz de uploads temporários do OpenCraft:
  - uploads: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` também pode definir inputs de arquivo diretamente via `--input-ref` ou `--element`.
- `snapshot`:
  - `--format ai` (padrão quando o Playwright está instalado): retorna um snapshot de IA com refs numéricos (`aria-ref="<n>"`).
  - `--format aria`: retorna a árvore de acessibilidade (sem refs; somente inspeção).
  - `--efficient` (ou `--mode efficient`): preset de snapshot de role compacto (interativo + compact + depth + maxChars menor).
  - Padrão de config (somente tool/CLI): defina `browser.snapshotDefaults.mode: "efficient"` para usar snapshots eficientes quando o chamador não passa um modo (veja [Configuração do Gateway](/gateway/configuration#browser-openclaw-managed-browser)).
  - Opções de snapshot de role (`--interactive`, `--compact`, `--depth`, `--selector`) forçam um snapshot baseado em role com refs como `ref=e12`.
  - `--frame "<seletor iframe>"` escopa snapshots de role a um iframe (combina com refs de role como `e12`).
  - `--interactive` gera uma lista plana e fácil de escolher de elementos interativos (melhor para conduzir ações).
  - `--labels` adiciona um screenshot somente de viewport com labels de ref sobrepostos (imprime `MEDIA:<caminho>`).
- `click`/`type`/etc requerem um `ref` de `snapshot` (tanto numérico `12` quanto ref de role `e12`).
  Seletores CSS intencionalmente não são suportados para ações.

## Snapshots e refs

O OpenCraft suporta dois estilos de "snapshot":

- **AI snapshot (refs numéricos)**: `opencraft browser snapshot` (padrão; `--format ai`)
  - Saída: um snapshot de texto que inclui refs numéricos.
  - Ações: `opencraft browser click 12`, `opencraft browser type 23 "hello"`.
  - Internamente, o ref é resolvido via `aria-ref` do Playwright.

- **Role snapshot (refs de role como `e12`)**: `opencraft browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Saída: uma lista/árvore baseada em role com `[ref=e12]` (e `[nth=1]` opcional).
  - Ações: `opencraft browser click e12`, `opencraft browser highlight e12`.
  - Internamente, o ref é resolvido via `getByRole(...)` (mais `nth()` para duplicatas).
  - Adicione `--labels` para incluir um screenshot de viewport com labels `e12` sobrepostos.

Comportamento de refs:

- Refs **não são estáveis entre navegações**; se algo falhar, re-execute `snapshot` e use um ref fresco.
- Se o snapshot de role foi tirado com `--frame`, refs de role são escopados a aquele iframe até o próximo snapshot de role.

## Power-ups de wait

Você pode aguardar mais do que apenas tempo/texto:

- Aguardar URL (globs suportados pelo Playwright):
  - `opencraft browser wait --url "**/dash"`
- Aguardar estado de carregamento:
  - `opencraft browser wait --load networkidle`
- Aguardar um predicado JS:
  - `opencraft browser wait --fn "window.ready===true"`
- Aguardar um seletor ficar visível:
  - `opencraft browser wait "#main"`

Esses podem ser combinados:

```bash
opencraft browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Workflows de depuração

Quando uma ação falha (ex.: "not visible", "strict mode violation", "covered"):

1. `opencraft browser snapshot --interactive`
2. Use `click <ref>` / `type <ref>` (prefira refs de role no modo interativo)
3. Se ainda falhar: `opencraft browser highlight <ref>` para ver o que o Playwright está mirando
4. Se a página se comportar estranhamente:
   - `opencraft browser errors --clear`
   - `opencraft browser requests --filter api --clear`
5. Para depuração profunda: grave um trace:
   - `opencraft browser trace start`
   - reproduza o problema
   - `opencraft browser trace stop` (imprime `TRACE:<caminho>`)

## Saída JSON

`--json` é para scripting e ferramentas estruturadas.

Exemplos:

```bash
opencraft browser status --json
opencraft browser snapshot --interactive --json
opencraft browser requests --filter api --json
opencraft browser cookies --json
```

Snapshots de role em JSON incluem `refs` mais um pequeno bloco `stats` (linhas/chars/refs/interativos) para que ferramentas possam raciocinar sobre tamanho e densidade do payload.

## Knobs de estado e ambiente

Estes são úteis para workflows "fazer o site se comportar como X":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (legado `set headers --json '{"X-Debug":"1"}'` permanece suportado)
- HTTP basic auth: `set credentials user pass` (ou `--clear`)
- Geolocalização: `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Mídia: `set media dark|light|no-preference|none`
- Fuso horário / locale: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (presets de dispositivo Playwright)
  - `set viewport 1280 720`

## Segurança e privacidade

- O perfil de browser opencraft pode conter sessões com login; trate-o como sensível.
- `browser act kind=evaluate` / `opencraft browser evaluate` e `wait --fn`
  executam JavaScript arbitrário no contexto da página. Injeção de prompt pode
  direcionar isso. Desabilite com `browser.evaluateEnabled=false` se você não precisar.
- Para notas de login e anti-bot (X/Twitter, etc.), veja [Login no browser + postagem no X/Twitter](/tools/browser-login).
- Mantenha o Gateway/node host privado (somente loopback ou tailnet).
- Endpoints CDP remotos são poderosos; faça tunnel e os proteja.

Exemplo de modo estrito (blocar destinos privados/internos por padrão):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // allow exato opcional
    },
  },
}
```

## Solução de problemas

Para problemas específicos do Linux (especialmente Chromium snap), veja
[Solução de problemas do browser](/tools/browser-linux-troubleshooting).

Para configurações de host dividido Gateway WSL2 + Chrome Windows, veja
[WSL2 + Windows + solução de problemas de Chrome CDP remoto](/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

## Tools do agente + como o controle funciona

O agente recebe **uma tool** para automação de browser:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Como mapeiam:

- `browser snapshot` retorna uma árvore de UI estável (IA ou ARIA).
- `browser act` usa os IDs `ref` do snapshot para clicar/digitar/arrastar/selecionar.
- `browser screenshot` captura pixels (página completa ou elemento).
- `browser` aceita:
  - `profile` para escolher um perfil de browser nomeado (openclaw, chrome ou CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para selecionar onde o browser vive.
  - Em sessões em sandbox, `target: "host"` requer `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` for omitido: sessões em sandbox usam `sandbox` como padrão, sessões sem sandbox usam `host`.
  - Se um node com capacidade de browser estiver conectado, a tool pode auto-rotear para ele a menos que você fixe `target="host"` ou `target="node"`.

Isso mantém o agente determinístico e evita seletores frágeis.
