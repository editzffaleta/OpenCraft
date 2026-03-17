---
summary: "Serviço integrado de controle de browser + comandos de ação"
read_when:
  - Adicionando automação de browser controlada por agente
  - Depurando por que opencraft está interferindo no seu próprio Chrome
  - Implementando configurações + ciclo de vida do browser no app macOS
title: "Browser (gerenciado pelo OpenCraft)"
---

# Browser (gerenciado pelo opencraft)

O OpenCraft pode executar um **perfil dedicado de Chrome/Brave/Edge/Chromium** que o agente controla.
É isolado do seu browser pessoal e é gerenciado através de um pequeno serviço de controle
local dentro do Gateway (apenas loopback).

Visão para iniciantes:

- Pense nisso como um **browser separado, apenas para o agente**.
- O perfil `opencraft` **não** toca seu perfil de browser pessoal.
- O agente pode **abrir abas, ler páginas, clicar e digitar** em uma faixa segura.
- O perfil `user` integrado se conecta à sua sessão real logada do Chrome via Chrome MCP.

## O que você obtém

- Um perfil de browser separado chamado **opencraft** (destaque laranja por padrão).
- Controle determinístico de abas (listar/abrir/focar/fechar).
- Ações do agente (clicar/digitar/arrastar/selecionar), snapshots, screenshots, PDFs.
- Suporte opcional a múltiplos perfis (`opencraft`, `work`, `remote`, ...).

Este browser **não** é seu navegador do dia a dia. É uma superfície segura e isolada para
automação e verificação do agente.

## Início rápido

```bash
opencraft browser --browser-profile opencraft status
opencraft browser --browser-profile opencraft start
opencraft browser --browser-profile opencraft open https://example.com
opencraft browser --browser-profile opencraft snapshot
```

Se você receber "Browser disabled", habilite na config (veja abaixo) e reinicie o
Gateway.

## Perfis: `opencraft` vs `user`

- `opencraft`: browser gerenciado e isolado (sem extensão necessária).
- `user`: perfil Chrome MCP integrado de attach para sua **sessão real logada do Chrome**.

Para chamadas de ferramenta de browser do agente:

- Padrão: use o browser `opencraft` isolado.
- Prefira `profile="user"` quando sessões logadas existentes importam e o usuário
  está no computador para clicar/aprovar qualquer prompt de attach.
- `profile` é a substituição explícita quando você quer um modo de browser específico.

Defina `browser.defaultProfile: "opencraft"` se quiser modo gerenciado por padrão.

## Configuração

Configurações de browser ficam em `~/.editzffaleta/OpenCraft.json`.

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
    remoteCdpHandshakeTimeoutMs: 3000, // timeout de handshake WebSocket de CDP remoto (ms)
    defaultProfile: "opencraft",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      opencraft: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

Notas:

- O serviço de controle de browser se vincula ao loopback em uma porta derivada de `gateway.port`
  (padrão: `18791`, que é Gateway + 2).
- Se você substituir a porta do Gateway (`gateway.port` ou `OPENCRAFT_GATEWAY_PORT`),
  as portas derivadas do browser mudam para ficar na mesma "família".
- `cdpUrl` usa a porta CDP gerenciada local por padrão quando não definido.
- `remoteCdpTimeoutMs` se aplica a verificações de acessibilidade CDP remoto (não loopback).
- `remoteCdpHandshakeTimeoutMs` se aplica a verificações de acessibilidade WebSocket CDP remoto.
- Navegação/abrir-aba do browser é protegida contra SSRF antes da navegação e re-verificada por melhor esforço na URL `http(s)` final após navegação.
- No modo SSRF estrito, descoberta/probes de endpoint CDP remoto (`cdpUrl`, incluindo buscas `/json/version`) também são verificadas.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` é `true` por padrão (modelo de rede confiável). Defina como `false` para navegação estrita apenas pública.
- `browser.ssrfPolicy.allowPrivateNetwork` permanece suportado como alias legado para compatibilidade.
- `attachOnly: true` significa "nunca iniciar um browser local; apenas conectar se já estiver rodando."
- `color` + `color` por perfil colorem a UI do browser para que você veja qual perfil está ativo.
- Perfil padrão é `opencraft` (browser standalone gerenciado pelo OpenCraft). Use `defaultProfile: "user"` para optar pelo browser do usuário logado.
- Ordem de auto-detecção: browser padrão do sistema se baseado em Chromium; caso contrário Chrome -> Brave -> Edge -> Chromium -> Chrome Canary.
- Perfis `opencraft` locais auto-atribuem `cdpPort`/`cdpUrl` -- defina esses apenas para CDP remoto.
- `driver: "existing-session"` usa Chrome DevTools MCP em vez de CDP bruto. Não
  defina `cdpUrl` para esse driver.
- Defina `browser.profiles.<name>.userDataDir` quando um perfil existing-session
  deve se conectar a um perfil de usuário Chromium não padrão como Brave ou Edge.

## Usar Brave (ou outro browser baseado em Chromium)

Se seu browser **padrão do sistema** é baseado em Chromium (Chrome/Brave/Edge/etc),
o OpenCraft o usa automaticamente. Defina `browser.executablePath` para substituir
a auto-detecção:

Exemplo via CLI:

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
- **Controle remoto (node host):** execute um node host na máquina que tem o browser; o Gateway faz proxy das ações do browser para ele.
- **CDP remoto:** defina `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) para
  se conectar a um browser baseado em Chromium remoto. Neste caso, o OpenCraft não iniciará um browser local.

URLs de CDP remoto podem incluir autenticação:

- Query tokens (ex., `https://provider.example?token=<token>`)
- Autenticação HTTP Basic (ex., `https://user:pass@provider.example`)

O OpenCraft preserva a autenticação ao chamar endpoints `/json/*` e ao conectar
ao WebSocket CDP. Prefira variáveis de ambiente ou gerenciadores de segredos para
tokens em vez de incluí-los em arquivos de config.

## Proxy de browser do node (padrão zero-config)

Se você executar um **node host** na máquina que tem seu browser, o OpenCraft pode
auto-rotear chamadas de ferramenta de browser para aquele node sem config extra de browser.
Este é o caminho padrão para Gateways remotos.

Notas:

- O node host expõe seu serviço local de controle de browser via um **comando proxy**.
- Perfis vêm da própria config `browser.profiles` do node (mesmo que local).
- Desabilite se não quiser:
  - No node: `nodeHost.browserProxy.enabled=false`
  - No Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto hospedado)

[Browserless](https://browserless.io) é um serviço hospedado de Chromium que expõe
endpoints CDP via HTTPS. Você pode apontar um perfil de browser do OpenCraft para um
endpoint regional Browserless e autenticar com sua chave de API.

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

- Substitua `<BROWSERLESS_API_KEY>` pelo seu Token Browserless real.
- Escolha o endpoint regional que corresponde à sua conta Browserless (veja a documentação deles).

## Provedores CDP de WebSocket direto

Alguns serviços de browser hospedados expõem um endpoint **WebSocket direto** em vez
da descoberta CDP padrão via HTTP (`/json/version`). O OpenCraft suporta ambos:

- **Endpoints HTTP(S)** (ex. Browserless) -- O OpenCraft chama `/json/version` para
  descobrir a URL do debugger WebSocket, depois conecta.
- **Endpoints WebSocket** (`ws://` / `wss://`) -- O OpenCraft conecta diretamente,
  pulando `/json/version`. Use para serviços como
  [Browserbase](https://www.browserbase.com) ou qualquer provedor que forneça uma
  URL WebSocket.

### Browserbase

[Browserbase](https://www.browserbase.com) é uma plataforma cloud para executar
browsers headless com resolução integrada de CAPTCHA, modo stealth e proxies
residenciais.

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

- [Cadastre-se](https://www.browserbase.com/sign-up) e copie sua **API Key**
  do [painel Overview](https://www.browserbase.com/overview).
- Substitua `<BROWSERBASE_API_KEY>` pela sua chave de API Browserbase real.
- Browserbase auto-cria uma sessão de browser na conexão WebSocket, então nenhuma
  etapa manual de criação de sessão é necessária.
- O plano gratuito permite uma sessão concorrente e uma hora de browser por mês.
  Veja [preços](https://www.browserbase.com/pricing) para limites de planos pagos.
- Veja a [documentação Browserbase](https://docs.browserbase.com) para referência completa de API,
  guias de SDK e exemplos de integração.

## Segurança

Ideias-chave:

- Controle de browser é apenas loopback; acesso flui através da autenticação do Gateway ou pareamento de node.
- Se controle de browser está habilitado e nenhuma autenticação está configurada, o OpenCraft auto-gera `gateway.auth.token` na inicialização e persiste na config.
- Mantenha o Gateway e quaisquer node hosts em uma rede privada (Tailscale); evite exposição pública.
- Trate URLs/tokens de CDP remoto como segredos; prefira variáveis de ambiente ou gerenciador de segredos.

Dicas de CDP remoto:

- Prefira endpoints criptografados (HTTPS ou WSS) e tokens de vida curta quando possível.
- Evite embutir tokens de vida longa diretamente em arquivos de config.

## Perfis (multi-browser)

O OpenCraft suporta múltiplos perfis nomeados (configs de roteamento). Perfis podem ser:

- **gerenciados pelo opencraft**: uma instância dedicada de browser baseado em Chromium com seu próprio diretório de dados de usuário + porta CDP
- **remoto**: uma URL CDP explícita (browser baseado em Chromium rodando em outro lugar)
- **sessão existente**: seu perfil Chrome existente via auto-conexão Chrome DevTools MCP

Padrões:

- O perfil `opencraft` é auto-criado se ausente.
- O perfil `user` é integrado para attach de sessão existente Chrome MCP.
- Perfis de sessão existente são opt-in além de `user`; crie-os com `--driver existing-session`.
- Portas CDP locais alocam de **18800-18899** por padrão.
- Excluir um perfil move seu diretório de dados local para a Lixeira.

Todos os endpoints de controle aceitam `?profile=<name>`; a CLI usa `--browser-profile`.

## Sessão existente via Chrome DevTools MCP

O OpenCraft também pode se conectar a um perfil de browser baseado em Chromium em execução através do
servidor Chrome DevTools MCP oficial. Isso reutiliza as abas e estado de login
já abertos naquele perfil de browser.

Referências oficiais de background e configuração:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado:

- `user`

Opcional: crie seu próprio perfil personalizado de sessão existente se quiser um
nome, cor ou diretório de dados de browser diferente.

Comportamento padrão:

- O perfil `user` integrado usa auto-conexão Chrome MCP, que aponta para o
  perfil padrão local do Google Chrome.

Use `userDataDir` para Brave, Edge, Chromium ou um perfil Chrome não padrão:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Depois no browser correspondente:

1. Abra a página de inspeção daquele browser para depuração remota.
2. Habilite depuração remota.
3. Mantenha o browser rodando e aprove o prompt de conexão quando o OpenCraft se conectar.

Páginas de inspeção comuns:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Teste de fumaça de attach ao vivo:

```bash
opencraft browser --browser-profile user start
opencraft browser --browser-profile user status
opencraft browser --browser-profile user tabs
opencraft browser --browser-profile user snapshot --format ai
```

Como é o sucesso:

- `status` mostra `driver: existing-session`
- `status` mostra `transport: chrome-mcp`
- `status` mostra `running: true`
- `tabs` lista suas abas já abertas no browser
- `snapshot` retorna refs da aba ao vivo selecionada

O que verificar se o attach não funcionar:

- o browser alvo baseado em Chromium é versão `144+`
- depuração remota está habilitada na página de inspeção daquele browser
- o browser mostrou e você aceitou o prompt de consentimento de attach
- `opencraft doctor` migra config de browser legada baseada em extensão e verifica que
  Chrome está instalado localmente para perfis de auto-conexão padrão, mas não pode
  habilitar depuração remota do lado do browser para você

Uso pelo agente:

- Use `profile="user"` quando precisar do estado logado do browser do usuário.
- Se usar um perfil personalizado de sessão existente, passe aquele nome de perfil explícito.
- Escolha este modo apenas quando o usuário está no computador para aprovar o
  prompt de attach.
- o Gateway ou node host pode iniciar `npx chrome-devtools-mcp@latest --autoConnect`

Notas:

- Este caminho é mais arriscado que o perfil `opencraft` isolado porque pode
  agir dentro da sua sessão de browser logada.
- O OpenCraft não inicia o browser para este driver; ele se conecta a uma
  sessão existente apenas.
- O OpenCraft usa o fluxo `--autoConnect` oficial do Chrome DevTools MCP aqui. Se
  `userDataDir` estiver definido, o OpenCraft o passa para apontar para aquele diretório
  explícito de dados de usuário Chromium.
- Screenshots de sessão existente suportam capturas de página e capturas de elemento `--ref`
  de snapshots, mas não seletores CSS `--element`.
- `wait --url` de sessão existente suporta padrões exatos, substring e glob
  como outros drivers de browser. `wait --load networkidle` ainda não é suportado.
- Algumas funcionalidades ainda requerem o caminho de browser gerenciado, como exportação PDF e
  interceptação de download.
- Sessão existente é local ao host. Se Chrome está em uma máquina diferente ou um
  namespace de rede diferente, use CDP remoto ou um node host em vez disso.

## Garantias de isolamento

- **Diretório de dados de usuário dedicado**: nunca toca seu perfil pessoal de browser.
- **Portas dedicadas**: evita `9222` para prevenir colisões com workflows de desenvolvimento.
- **Controle determinístico de abas**: aponta abas por `targetId`, não "última aba".

## Seleção de browser

Ao iniciar localmente, o OpenCraft escolhe o primeiro disponível:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Você pode substituir com `browser.executablePath`.

Plataformas:

- macOS: verifica `/Applications` e `~/Applications`.
- Linux: procura `google-chrome`, `brave`, `microsoft-edge`, `chromium`, etc.
- Windows: verifica locais comuns de instalação.

## API de Controle (opcional)

Apenas para integrações locais, o Gateway expõe uma pequena API HTTP de loopback:

- Status/iniciar/parar: `GET /`, `POST /start`, `POST /stop`
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

Todos os endpoints aceitam `?profile=<name>`.

Se autenticação do Gateway está configurada, rotas HTTP do browser requerem autenticação também:

- `Authorization: Bearer <gateway token>`
- `x-opencraft-password: <gateway password>` ou autenticação HTTP Basic com essa senha

### Requisito do Playwright

Algumas funcionalidades (navigate/act/AI snapshot/role snapshot, screenshots de elemento, PDF) requerem
Playwright. Se Playwright não estiver instalado, esses endpoints retornam um erro 501 claro.
Snapshots ARIA e screenshots básicos ainda funcionam para Chrome gerenciado pelo opencraft.

Se você vir `Playwright is not available in this gateway build`, instale o pacote
Playwright completo (não `playwright-core`) e reinicie o Gateway, ou reinstale
o OpenCraft com suporte a browser.

#### Instalação Playwright no Docker

Se seu Gateway roda em Docker, evite `npx playwright` (conflitos de substituição npm).
Use a CLI integrada em vez disso:

```bash
docker compose run --rm opencraft-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para persistir downloads de browser, defina `PLAYWRIGHT_BROWSERS_PATH` (por exemplo,
`/home/node/.cache/ms-playwright`) e garanta que `/home/node` está persistido via
`OPENCRAFT_HOME_VOLUME` ou um bind mount. Veja [Docker](/install/docker).

## Como funciona (interno)

Fluxo de alto nível:

- Um pequeno **servidor de controle** aceita requisições HTTP.
- Conecta a browsers baseados em Chromium (Chrome/Brave/Edge/Chromium) via **CDP**.
- Para ações avançadas (clicar/digitar/snapshot/PDF), usa **Playwright** sobre
  CDP.
- Quando Playwright está ausente, apenas operações sem Playwright estão disponíveis.

Este design mantém o agente em uma interface estável e determinística enquanto permite
trocar browsers e perfis locais/remotos.

## Referência rápida da CLI

Todos os comandos aceitam `--browser-profile <name>` para apontar para um perfil específico.
Todos os comandos também aceitam `--json` para saída legível por máquina (payloads estáveis).

Básicos:

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
- `opencraft browser upload /tmp/opencraft/uploads/file.pdf`
- `opencraft browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `opencraft browser dialog --accept`
- `opencraft browser wait --text "Done"`
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

- `upload` e `dialog` são chamadas de **armamento**; execute-as antes do clique/tecla
  que dispara o seletor/diálogo.
- Caminhos de saída de download e trace são restritos a raízes temporárias do OpenCraft:
  - traces: `/tmp/opencraft` (fallback: `${os.tmpdir()}/opencraft`)
  - downloads: `/tmp/opencraft/downloads` (fallback: `${os.tmpdir()}/opencraft/downloads`)
- Caminhos de upload são restritos a uma raiz de uploads temporária do OpenCraft:
  - uploads: `/tmp/opencraft/uploads` (fallback: `${os.tmpdir()}/opencraft/uploads`)
- `upload` também pode definir inputs de arquivo diretamente via `--input-ref` ou `--element`.
- `snapshot`:
  - `--format ai` (padrão quando Playwright está instalado): retorna um snapshot IA com refs numéricos (`aria-ref="<n>"`).
  - `--format aria`: retorna a árvore de acessibilidade (sem refs; apenas inspeção).
  - `--efficient` (ou `--mode efficient`): preset de snapshot de role compacto (interactive + compact + depth + maxChars menor).
  - Padrão de config (apenas ferramenta/CLI): defina `browser.snapshotDefaults.mode: "efficient"` para usar snapshots eficientes quando o chamador não passa um modo (veja [Configuração do Gateway](/gateway/configuration#browser-opencraft-managed-browser)).
  - Opções de snapshot de role (`--interactive`, `--compact`, `--depth`, `--selector`) forçam um snapshot baseado em role com refs como `ref=e12`.
  - `--frame "<iframe selector>"` escopa snapshots de role para um iframe (combina com refs de role como `e12`).
  - `--interactive` produz uma lista plana e fácil de escolher de elementos interativos (melhor para conduzir ações).
  - `--labels` adiciona um screenshot apenas do viewport com rótulos de ref sobrepostos (imprime `MEDIA:<path>`).
- `click`/`type`/etc requerem um `ref` de `snapshot` (numérico `12` ou ref de role `e12`).
  Seletores CSS intencionalmente não são suportados para ações.

## Snapshots e refs

O OpenCraft suporta dois estilos de "snapshot":

- **Snapshot IA (refs numéricos)**: `opencraft browser snapshot` (padrão; `--format ai`)
  - Saída: um snapshot de texto que inclui refs numéricos.
  - Ações: `opencraft browser click 12`, `opencraft browser type 23 "hello"`.
  - Internamente, o ref é resolvido via `aria-ref` do Playwright.

- **Snapshot de role (refs de role como `e12`)**: `opencraft browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Saída: uma lista/árvore baseada em role com `[ref=e12]` (e `[nth=1]` opcional).
  - Ações: `opencraft browser click e12`, `opencraft browser highlight e12`.
  - Internamente, o ref é resolvido via `getByRole(...)` (mais `nth()` para duplicados).
  - Adicione `--labels` para incluir um screenshot do viewport com rótulos `e12` sobrepostos.

Comportamento de refs:

- Refs **não são estáveis entre navegações**; se algo falhar, re-execute `snapshot` e use um ref novo.
- Se o snapshot de role foi tirado com `--frame`, refs de role são escopados àquele iframe até o próximo snapshot de role.

## Poderes extras do Wait

Você pode esperar por mais do que apenas tempo/texto:

- Esperar por URL (globs suportados pelo Playwright):
  - `opencraft browser wait --url "**/dash"`
- Esperar por estado de carregamento:
  - `opencraft browser wait --load networkidle`
- Esperar por predicado JS:
  - `opencraft browser wait --fn "window.ready===true"`
- Esperar por seletor ficar visível:
  - `opencraft browser wait "#main"`

Podem ser combinados:

```bash
opencraft browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Workflows de depuração

Quando uma ação falha (ex. "not visible", "strict mode violation", "covered"):

1. `opencraft browser snapshot --interactive`
2. Use `click <ref>` / `type <ref>` (prefira refs de role no modo interativo)
3. Se ainda falhar: `opencraft browser highlight <ref>` para ver o que Playwright está apontando
4. Se a página se comportar de forma estranha:
   - `opencraft browser errors --clear`
   - `opencraft browser requests --filter api --clear`
5. Para depuração profunda: grave um trace:
   - `opencraft browser trace start`
   - reproduza o problema
   - `opencraft browser trace stop` (imprime `TRACE:<path>`)

## Saída JSON

`--json` é para scripts e ferramental estruturado.

Exemplos:

```bash
opencraft browser status --json
opencraft browser snapshot --interactive --json
opencraft browser requests --filter api --json
opencraft browser cookies --json
```

Snapshots de role em JSON incluem `refs` mais um pequeno bloco `stats` (linhas/chars/refs/interactive) para que ferramentas possam raciocinar sobre tamanho e densidade do payload.

## Controles de estado e ambiente

Úteis para workflows "faça o site se comportar como X":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (legado `set headers --json '{"X-Debug":"1"}'` permanece suportado)
- Autenticação HTTP basic: `set credentials user pass` (ou `--clear`)
- Geolocalização: `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Mídia: `set media dark|light|no-preference|none`
- Fuso horário / locale: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (presets de dispositivo Playwright)
  - `set viewport 1280 720`

## Segurança e privacidade

- O perfil de browser opencraft pode conter sessões logadas; trate como sensível.
- `browser act kind=evaluate` / `opencraft browser evaluate` e `wait --fn`
  executam JavaScript arbitrário no contexto da página. Injeção de prompt pode direcionar
  isso. Desabilite com `browser.evaluateEnabled=false` se não precisar.
- Para logins e notas anti-bot (X/Twitter, etc.), veja [Login no browser + postagem no X/Twitter](/tools/browser-login).
- Mantenha o Gateway/node host privado (apenas loopback ou tailnet).
- Endpoints CDP remotos são poderosos; encapsule e proteja-os.

Exemplo de modo estrito (bloquear destinos privados/internos por padrão):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // permissão exata opcional
    },
  },
}
```

## Solução de problemas

Para problemas específicos do Linux (especialmente Chromium snap), veja
[Solução de problemas do browser](/tools/browser-linux-troubleshooting).

Para configurações de host dividido com Gateway WSL2 + Chrome Windows, veja
[Solução de problemas WSL2 + Windows + Chrome CDP remoto](/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

## Ferramentas do agente + como o controle funciona

O agente recebe **uma ferramenta** para automação de browser:

- `browser` -- status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Como mapeia:

- `browser snapshot` retorna uma árvore de UI estável (IA ou ARIA).
- `browser act` usa os IDs `ref` do snapshot para clicar/digitar/arrastar/selecionar.
- `browser screenshot` captura pixels (página completa ou elemento).
- `browser` aceita:
  - `profile` para escolher um perfil de browser nomeado (opencraft, chrome ou CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para selecionar onde o browser está.
  - Em sessões em sandbox, `target: "host"` requer `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` for omitido: sessões em sandbox usam `sandbox` por padrão, sessões sem sandbox usam `host` por padrão.
  - Se um node com capacidade de browser estiver conectado, a ferramenta pode auto-rotear para ele a menos que você fixe `target="host"` ou `target="node"`.

Isso mantém o agente determinístico e evita seletores frágeis.
