---
summary: "Solucionar problemas de Gateway WSL2 + Chrome Windows CDP remoto em camadas"
read_when:
  - Executando OpenCraft Gateway no WSL2 enquanto Chrome está no Windows
  - Vendo erros sobrepostos de browser/control-ui entre WSL2 e Windows
  - Decidindo entre Chrome MCP local do host e CDP remoto bruto em configurações divididas
title: "Solução de problemas WSL2 + Windows + Chrome CDP remoto"
---

# Solução de problemas WSL2 + Windows + Chrome CDP remoto

Este guia cobre a configuração comum de host dividido onde:

- O Gateway do OpenCraft roda dentro do WSL2
- O Chrome roda no Windows
- O controle do browser precisa cruzar a fronteira WSL2/Windows

Também cobre o padrão de falha em camadas do [issue #39369](https://github.com/editzffaleta/OpenCraft/issues/39369): vários problemas independentes podem aparecer ao mesmo tempo, fazendo a camada errada parecer quebrada primeiro.

## Escolha o modo de browser correto primeiro

Você tem dois padrões válidos:

### Opção 1: CDP remoto bruto do WSL2 para o Windows

Use um perfil de browser remoto que aponte do WSL2 para um endpoint CDP do Chrome no Windows.

Escolha quando:

- o Gateway permanece dentro do WSL2
- o Chrome roda no Windows
- você precisa que o controle do browser cruze a fronteira WSL2/Windows

### Opção 2: Chrome MCP local do host

Use `existing-session` / `user` apenas quando o Gateway roda no mesmo host que o Chrome.

Escolha quando:

- OpenCraft e Chrome estão na mesma máquina
- você quer o estado de login do browser local
- você não precisa de transporte de browser entre hosts

Para Gateway WSL2 + Chrome Windows, prefira CDP remoto bruto. Chrome MCP é local do host, não uma ponte WSL2-para-Windows.

## Arquitetura funcional

Formato de referência:

- WSL2 roda o Gateway em `127.0.0.1:18789`
- Windows abre a Control UI em um browser normal em `http://127.0.0.1:18789/`
- Chrome do Windows expõe um endpoint CDP na porta `9222`
- WSL2 pode alcançar o endpoint CDP do Windows
- OpenCraft aponta um perfil de browser para o endereço acessível pelo WSL2

## Por que esta configuração é confusa

Várias falhas podem se sobrepor:

- WSL2 não consegue alcançar o endpoint CDP do Windows
- A Control UI é aberta de uma origem não segura
- `gateway.controlUi.allowedOrigins` não corresponde à origem da página
- Token ou pareamento está faltando
- O perfil do browser aponta para o endereço errado

Por causa disso, corrigir uma camada ainda pode deixar um erro diferente visível.

## Regra crítica para a Control UI

Quando a UI é aberta do Windows, use localhost do Windows a menos que você tenha uma configuração HTTPS deliberada.

Use:

`http://127.0.0.1:18789/`

Não use um IP de LAN por padrão para a Control UI. HTTP simples em um endereço de LAN ou tailnet pode disparar comportamento de origem insegura/autenticação de dispositivo que não está relacionado ao CDP em si. Veja [Control UI](/web/control-ui).

## Valide em camadas

Trabalhe de cima para baixo. Não pule etapas.

### Camada 1: Verifique se o Chrome está servindo CDP no Windows

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

### Camada 2: Verifique se o WSL2 consegue alcançar o endpoint do Windows

Do WSL2, teste o endereço exato que você planeja usar em `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Bom resultado:

- `/json/version` retorna JSON com metadados de Browser / Protocol-Version
- `/json/list` retorna JSON (array vazio é ok se não houver páginas abertas)

Se isso falhar:

- O Windows não está expondo a porta para o WSL2 ainda
- O endereço está errado para o lado do WSL2
- Firewall / encaminhamento de porta / proxy local ainda está faltando

Corrija isso antes de mexer na config do OpenCraft.

### Camada 3: Configure o perfil de browser correto

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

- use o endereço acessível pelo WSL2, não aquele que só funciona no Windows
- mantenha `attachOnly: true` para browsers gerenciados externamente
- teste a mesma URL com `curl` antes de esperar que o OpenCraft funcione

### Camada 4: Verifique a camada da Control UI separadamente

Abra a UI do Windows:

`http://127.0.0.1:18789/`

Depois verifique:

- a origem da página corresponde ao que `gateway.controlUi.allowedOrigins` espera
- autenticação por Token ou pareamento está configurado corretamente
- você não está depurando um problema de autenticação da Control UI como se fosse um problema do browser

Página útil:

- [Control UI](/web/control-ui)

### Camada 5: Verifique o controle de browser de ponta a ponta

Do WSL2:

```bash
opencraft browser open https://example.com --browser-profile remote
opencraft browser tabs --browser-profile remote
```

Bom resultado:

- a aba abre no Chrome do Windows
- `opencraft browser tabs` retorna o alvo
- ações posteriores (`snapshot`, `screenshot`, `navigate`) funcionam do mesmo perfil

## Erros enganosos comuns

Trate cada mensagem como uma pista específica da camada:

- `control-ui-insecure-auth`
  - Problema de origem da UI / contexto seguro, não um problema de transporte CDP
- `token_missing`
  - Problema de configuração de autenticação
- `pairing required`
  - Problema de aprovação de dispositivo
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 não consegue alcançar o `cdpUrl` configurado
- `gateway timeout after 1500ms`
  - frequentemente ainda é acessibilidade do CDP ou um endpoint remoto lento/inacessível
- `No Chrome tabs found for profile="user"`
  - Perfil Chrome MCP local selecionado onde nenhuma aba local do host está disponível

## Checklist de triagem rápida

1. Windows: `curl http://127.0.0.1:9222/json/version` funciona?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` funciona?
3. Config do OpenCraft: `browser.profiles.<name>.cdpUrl` usa exatamente o endereço acessível pelo WSL2?
4. Control UI: você está abrindo `http://127.0.0.1:18789/` em vez de um IP de LAN?
5. Você está tentando usar `existing-session` entre WSL2 e Windows em vez de CDP remoto bruto?

## Conclusão prática

A configuração geralmente é viável. A parte difícil é que transporte do browser, segurança de origem da Control UI e Token/pareamento podem falhar independentemente enquanto parecem similares do lado do usuário.

Em caso de dúvida:

- verifique o endpoint do Chrome Windows localmente primeiro
- verifique o mesmo endpoint do WSL2 em segundo lugar
- só depois depure a config do OpenCraft ou autenticação da Control UI
