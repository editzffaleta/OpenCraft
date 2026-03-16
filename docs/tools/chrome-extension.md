---
summary: "Extensão Chrome: deixe o OpenCraft controlar sua aba Chrome existente"
read_when:
  - Você quer que o agente controle uma aba Chrome existente (botão da barra de ferramentas)
  - Você precisa de Gateway remoto + automação de browser local via Tailscale
  - Você quer entender as implicações de segurança do controle de browser
title: "Extensão Chrome"
---

# Extensão Chrome (relay de browser)

A extensão Chrome do OpenCraft permite que o agente controle suas **abas Chrome existentes** (sua janela Chrome normal) em vez de iniciar um perfil Chrome separado gerenciado pelo opencraft.

A conexão/desconexão acontece via um **único botão na barra de ferramentas do Chrome**.

Se você quer o fluxo de conexão MCP oficial do DevTools do Chrome em vez do relay de extensão do OpenCraft, use um perfil de browser `existing-session`. Veja
[Browser](/tools/browser#chrome-existing-session-via-mcp). Para a documentação de configuração do Chrome, veja [Chrome for Developers: Use Chrome DevTools MCP with your
browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
e o [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp).

## O que é (conceito)

Há três partes:

- **Serviço de controle de browser** (Gateway ou node): a API que o agente/tool chama (via Gateway)
- **Servidor relay local** (CDP loopback): faz a ponte entre o servidor de controle e a extensão (`http://127.0.0.1:18792` por padrão)
- **Extensão Chrome MV3**: conecta-se à aba ativa usando `chrome.debugger` e encaminha mensagens CDP para o relay

O OpenCraft então controla a aba conectada através da superfície normal da tool `browser` (selecionando o perfil correto).

## Instalar / carregar (descompactado)

1. Instale a extensão em um caminho local estável:

```bash
opencraft browser extension install
```

2. Imprima o caminho do diretório da extensão instalada:

```bash
opencraft browser extension path
```

3. Chrome → `chrome://extensions`

- Habilite "Modo do desenvolvedor"
- "Carregar sem compactação" → selecione o diretório impresso acima

4. Fixe a extensão.

## Atualizações (sem etapa de build)

A extensão é incluída no lançamento do OpenCraft (pacote npm) como arquivos estáticos. Não há etapa de "build" separada.

Após atualizar o OpenCraft:

- Re-execute `opencraft browser extension install` para atualizar os arquivos instalados no diretório de estado do OpenCraft.
- Chrome → `chrome://extensions` → clique em "Recarregar" na extensão.

## Usar (definir token do gateway uma vez)

Para usar o relay de extensão, crie um perfil de browser para ele:

Antes da primeira conexão, abra as Opções da extensão e defina:

- `Port` (padrão `18792`)
- `Gateway token` (deve corresponder a `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`)

Então crie um perfil:

```bash
opencraft browser create-profile \
  --name meu-chrome \
  --driver extension \
  --cdp-url http://127.0.0.1:18792 \
  --color "#00AA00"
```

Use-o:

- CLI: `opencraft browser --browser-profile meu-chrome tabs`
- Tool de agente: `browser` com `profile="meu-chrome"`

### Portas de gateway personalizadas

Se você estiver usando uma porta de gateway personalizada, a porta do relay de extensão é derivada automaticamente:

**Porta do Relay de Extensão = Porta do Gateway + 3**

Exemplo: se `gateway.port: 19001`, então:

- Porta do relay de extensão: `19004` (gateway + 3)

Configure a extensão para usar a porta de relay derivada na página de Opções da extensão.

## Conectar / desconectar (botão da barra de ferramentas)

- Abra a aba que você quer que o OpenCraft controle.
- Clique no ícone da extensão.
  - O badge mostra `ON` quando conectado.
- Clique novamente para desconectar.

## Qual aba ela controla?

- Ela **não** controla automaticamente "qualquer aba que você esteja olhando".
- Ela controla **apenas a(s) aba(s) que você explicitamente conectou** clicando no botão da barra de ferramentas.
- Para trocar: abra a outra aba e clique no ícone da extensão lá.

## Badge + erros comuns

- `ON`: conectado; o OpenCraft pode controlar aquela aba.
- `…`: conectando ao relay local.
- `!`: relay não acessível/autenticado (mais comum: servidor relay não rodando, ou token do gateway ausente/errado).

Se você ver `!`:

- Certifique-se de que o Gateway está rodando localmente (configuração padrão), ou execute um node host nesta máquina se o Gateway rodar em outro lugar.
- Abra a página de Opções da extensão; ela valida a acessibilidade do relay + autenticação por gateway-token.

## Gateway remoto (use um node host)

### Gateway local (mesma máquina que o Chrome) — geralmente **sem etapas extras**

Se o Gateway roda na mesma máquina que o Chrome, ele inicia o serviço de controle de browser no loopback
e inicia automaticamente o servidor relay. A extensão fala com o relay local; as chamadas CLI/tool vão para o Gateway.

### Gateway remoto (Gateway roda em outro lugar) — **execute um node host**

Se seu Gateway roda em outra máquina, inicie um node host na máquina que roda o Chrome.
O Gateway fará proxy das ações de browser para aquele node; a extensão + relay ficam locais na máquina do browser.

Se vários nodes estiverem conectados, fixe um com `gateway.nodes.browser.node` ou defina `gateway.nodes.browser.mode`.

## Sandboxing (containers de tool)

Se sua sessão de agente está em sandbox (`agents.defaults.sandbox.mode != "off"`), a tool `browser` pode ser restrita:

- Por padrão, sessões em sandbox frequentemente apontam para o **browser sandbox** (`target="sandbox"`), não para o Chrome do host.
- O controle via relay de extensão Chrome requer controlar o servidor de controle do browser do **host**.

Opções:

- Mais fácil: use a extensão de uma sessão/agente **não sandboxado**.
- Ou permita controle do browser do host para sessões em sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

Então certifique-se de que a tool não é negada pela política de tool e (se necessário) chame `browser` com `target="host"`.

Depuração: `opencraft sandbox explain`

## Dicas de acesso remoto

- Mantenha o Gateway e o node host na mesma tailnet; evite expor portas de relay para LAN ou Internet pública.
- Pareie nodes intencionalmente; desabilite o roteamento de proxy de browser se você não quer controle remoto (`gateway.nodes.browser.mode="off"`).
- Deixe o relay no loopback a menos que você tenha uma necessidade real entre namespaces. Para WSL2 ou configurações similares de host dividido, defina `browser.relayBindHost` para um endereço de bind explícito como `0.0.0.0`, então mantenha o acesso restrito com autenticação do Gateway, pareamento de node e uma rede privada.

## Como "extension path" funciona

`opencraft browser extension path` imprime o diretório em disco **instalado** contendo os arquivos da extensão.

O CLI intencionalmente **não** imprime um caminho `node_modules`. Sempre execute `opencraft browser extension install` primeiro para copiar a extensão para um local estável sob o diretório de estado do OpenCraft.

Se você mover ou excluir esse diretório de instalação, o Chrome marcará a extensão como quebrada até que você a recarregue de um caminho válido.

## Implicações de segurança (leia isto)

Isso é poderoso e arriscado. Trate como dar ao modelo "mãos no seu browser".

- A extensão usa a API de depuração do Chrome (`chrome.debugger`). Quando conectado, o modelo pode:
  - clicar/digitar/navegar naquela aba
  - ler conteúdo da página
  - acessar o que a sessão com login da aba pode acessar
- **Isso não é isolado** como o perfil dedicado gerenciado pelo opencraft.
  - Se você conectar ao seu perfil/aba de uso diário, está concedendo acesso ao estado daquela conta.

Recomendações:

- Prefira um perfil Chrome dedicado (separado do seu navegador pessoal) para uso do relay de extensão.
- Mantenha o Gateway e quaisquer node hosts somente na tailnet; dependa da autenticação do Gateway + pareamento de node.
- Evite expor portas de relay pela LAN (`0.0.0.0`) e evite o Funnel (público).
- O relay bloqueia origens que não sejam da extensão e requer autenticação por gateway-token tanto para `/cdp` quanto para `/extension`.

Relacionado:

- Visão geral da tool de browser: [Browser](/tools/browser)
- Auditoria de segurança: [Segurança](/gateway/security)
- Configuração do Tailscale: [Tailscale](/gateway/tailscale)
