---
summary: "Solucionar problemas de Gateway WSL2 + CDP Chrome remoto Windows e configurações de relay de extensão em camadas"
read_when:
  - Executando o Gateway do OpenCraft no WSL2 enquanto o Chrome está no Windows
  - Vendo erros sobrepostos de browser/control-ui entre WSL2 e Windows
  - Decidindo entre CDP remoto bruto e o relay de extensão Chrome em configurações de host dividido
title: "WSL2 + Windows + solução de problemas de Chrome CDP remoto"
---

# WSL2 + Windows + solução de problemas de Chrome CDP remoto

Este guia cobre a configuração comum de host dividido onde:

- O Gateway do OpenCraft roda dentro do WSL2
- O Chrome roda no Windows
- o controle de browser deve cruzar a fronteira WSL2/Windows

Também cobre o padrão de falha em camadas do [issue #39369](https://github.com/openclaw/openclaw/issues/39369): vários problemas independentes podem aparecer ao mesmo tempo, o que faz a camada errada parecer quebrada primeiro.

## Escolha o modo de browser correto primeiro

Você tem dois padrões válidos:

### Opção 1: CDP remoto bruto

Use um perfil de browser remoto que aponte do WSL2 para um endpoint CDP do Chrome no Windows.

Escolha isso quando:

- você só precisa de controle de browser
- você está confortável em expor a depuração remota do Chrome para o WSL2
- você não precisa do relay de extensão Chrome

### Opção 2: Relay de extensão Chrome

Use o perfil `chrome-relay` integrado mais a extensão Chrome do OpenCraft.

Escolha isso quando:

- você quer conectar a uma aba Chrome do Windows existente com o botão da barra de ferramentas
- você quer controle baseado em extensão em vez de `--remote-debugging-port` bruto
- o relay em si deve ser acessível pela fronteira WSL2/Windows

Se você usar o relay de extensão entre namespaces, `browser.relayBindHost` é a configuração importante introduzida em [Browser](/tools/browser) e [Extensão Chrome](/tools/chrome-extension).

## Arquitetura funcional

Forma de referência:

- WSL2 roda o Gateway em `127.0.0.1:18789`
- Windows abre o Control UI em um browser normal em `http://127.0.0.1:18789/`
- Chrome no Windows expõe um endpoint CDP na porta `9222`
- WSL2 pode atingir esse endpoint CDP do Windows
- O OpenCraft aponta um perfil de browser para o endereço acessível pelo WSL2

## Por que essa configuração é confusa

Várias falhas podem se sobrepor:

- WSL2 não consegue atingir o endpoint CDP do Windows
- o Control UI é aberto de uma origem não segura
- `gateway.controlUi.allowedOrigins` não corresponde à origem da página
- token ou pareamento está ausente
- o perfil de browser aponta para o endereço errado
- o relay de extensão ainda é somente loopback quando você realmente precisa de acesso entre namespaces

Por causa disso, corrigir uma camada ainda pode deixar um erro diferente visível.

## Regra crítica para o Control UI

Quando o UI é aberto do Windows, use o localhost do Windows a menos que você tenha uma configuração HTTPS deliberada.

Use:

`http://127.0.0.1:18789/`

Não use um IP de LAN como padrão para o Control UI. HTTP simples em um endereço de LAN ou tailnet pode acionar comportamento de origem insegura/autenticação de dispositivo que é não relacionado ao CDP em si. Veja [Control UI](/web/control-ui).

## Valide em camadas

Trabalhe de cima para baixo. Não pule adiante.

### Camada 1: Verificar se o Chrome está servindo CDP no Windows

Inicie o Chrome no Windows com depuração remota habilitada:

```powershell
chrome.exe --remote-debugging-port=9222
```

Do Windows, verifique o Chrome primeiro:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Se isso falhar no Windows, o OpenCraft ainda não é o problema.

### Camada 2: Verificar se o WSL2 consegue atingir esse endpoint do Windows

Do WSL2, teste o endereço exato que você planeja usar em `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Bom resultado:

- `/json/version` retorna JSON com metadados de Browser/Protocol-Version
- `/json/list` retorna JSON (array vazio é ok se não houver páginas abertas)

Se isso falhar:

- O Windows não está expondo a porta para o WSL2 ainda
- o endereço está errado para o lado do WSL2
- firewall / encaminhamento de porta / proxy local ainda está ausente

Corrija isso antes de tocar na configuração do OpenCraft.

### Camada 3: Configurar o perfil de browser correto

Para CDP remoto bruto, aponte o OpenCraft para o endereço acessível pelo WSL2:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Notas:

- use o endereço acessível pelo WSL2, não o que só funciona no Windows
- mantenha `attachOnly: true` para browsers gerenciados externamente
- teste a mesma URL com `curl` antes de esperar que o OpenCraft consiga

### Camada 4: Se você usar o relay de extensão Chrome

Se a máquina do browser e o Gateway estão separados por uma fronteira de namespace, o relay pode precisar de um endereço de bind não-loopback.

Exemplo:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "chrome-relay",
    relayBindHost: "0.0.0.0",
  },
}
```

Use isso apenas quando necessário:

- o comportamento padrão é mais seguro porque o relay fica somente loopback
- `0.0.0.0` expande a superfície de exposição
- mantenha autenticação do Gateway, pareamento de node e a rede circundante privada

Se você não precisar do relay de extensão, prefira o perfil de CDP remoto bruto acima.

### Camada 5: Verificar a camada do Control UI separadamente

Abra o UI do Windows:

`http://127.0.0.1:18789/`

Então verifique:

- a origem da página corresponde ao que `gateway.controlUi.allowedOrigins` espera
- autenticação por token ou pareamento está configurada corretamente
- você não está depurando um problema de autenticação do Control UI como se fosse um problema de browser

Página útil:

- [Control UI](/web/control-ui)

### Camada 6: Verificar o controle de browser de ponta a ponta

Do WSL2:

```bash
opencraft browser open https://example.com --browser-profile remote
opencraft browser tabs --browser-profile remote
```

Para o relay de extensão:

```bash
opencraft browser tabs --browser-profile chrome-relay
```

Bom resultado:

- a aba abre no Chrome do Windows
- `opencraft browser tabs` retorna o alvo
- ações posteriores (`snapshot`, `screenshot`, `navigate`) funcionam do mesmo perfil

## Erros comuns enganosos

Trate cada mensagem como uma pista específica de camada:

- `control-ui-insecure-auth`
  - Problema de origem do UI / contexto seguro, não problema de transporte CDP
- `token_missing`
  - Problema de configuração de autenticação
- `pairing required`
  - Problema de aprovação de dispositivo
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 não consegue atingir o `cdpUrl` configurado
- `gateway timeout after 1500ms`
  - frequentemente ainda é acessibilidade do CDP ou um endpoint remoto lento/inacessível
- `Chrome extension relay is running, but no tab is connected`
  - Perfil de relay de extensão selecionado, mas nenhuma aba conectada existe ainda

## Lista de verificação rápida de triagem

1. Windows: `curl http://127.0.0.1:9222/json/version` funciona?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` funciona?
3. Config do OpenCraft: `browser.profiles.<nome>.cdpUrl` usa exatamente esse endereço acessível pelo WSL2?
4. Control UI: você está abrindo `http://127.0.0.1:18789/` em vez de um IP de LAN?
5. Somente relay de extensão: você realmente precisa de `browser.relayBindHost`, e se sim, está definido explicitamente?

## Conclusão prática

A configuração geralmente é viável. A parte difícil é que transporte de browser, segurança de origem do Control UI, token/pareamento e topologia de relay de extensão podem falhar independentemente enquanto parecem similares do lado do usuário.

Em caso de dúvida:

- verifique o endpoint Chrome do Windows localmente primeiro
- verifique o mesmo endpoint do WSL2 em seguida
- só então depure a configuração do OpenCraft ou autenticação do Control UI
