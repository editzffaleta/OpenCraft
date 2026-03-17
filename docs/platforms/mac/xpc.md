---
summary: "Arquitetura IPC do macOS para aplicativo OpenCraft, transporte do nó do Gateway e PeekabooBridge"
read_when:
  - Editando contratos IPC ou IPC do aplicativo da barra de menus
title: "IPC macOS"
---

# Arquitetura IPC do OpenCraft no macOS

**Modelo atual:** um socket Unix local conecta o **serviço de host do nó** ao **aplicativo macOS** para aprovações de execução + `system.run`. Uma CLI de debug `opencraft-mac` existe para verificações de descoberta/conexão; ações de agente ainda fluem através do WebSocket do Gateway e `node.invoke`. Automação de UI usa PeekabooBridge.

## Objetivos

- Uma única instância de aplicativo GUI que possui todo o trabalho voltado ao TCC (notificações, gravação de tela, microfone, fala, AppleScript).
- Uma superfície pequena para automação: comandos de Gateway + nó, mais PeekabooBridge para automação de UI.
- Permissões previsíveis: sempre o mesmo bundle ID assinado, iniciado pelo launchd, para que as concessões TCC persistam.

## Como funciona

### Transporte do Gateway + nó

- O aplicativo executa o Gateway (modo local) e se conecta a ele como um nó.
- Ações de agente são realizadas via `node.invoke` (por exemplo `system.run`, `system.notify`, `canvas.*`).

### Serviço de nó + IPC do aplicativo

- Um serviço de host de nó headless se conecta ao WebSocket do Gateway.
- Solicitações `system.run` são encaminhadas para o aplicativo macOS através de um socket Unix local.
- O aplicativo realiza a execução no contexto de UI, solicita confirmação se necessário e retorna a saída.

Diagrama (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (automação de UI)

- A automação de UI usa um socket UNIX separado chamado `bridge.sock` e o protocolo JSON do PeekabooBridge.
- Ordem de preferência de host (lado do cliente): Peekaboo.app → Claude.app → OpenCraft.app → execução local.
- Segurança: hosts do bridge exigem um TeamID permitido; escape de mesmo UID somente em DEBUG é protegido por `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convenção Peekaboo).
- Veja: [Uso do PeekabooBridge](/platforms/mac/peekaboo) para detalhes.

## Fluxos operacionais

- Reiniciar/recompilar: `SIGN_IDENTITY="Apple Development: <Nome do Desenvolvedor> (<TEAMID>)" scripts/restart-mac.sh`
  - Mata instâncias existentes
  - Build Swift + empacotamento
  - Escreve/inicializa/reativa o LaunchAgent
- Instância única: o aplicativo encerra cedo se outra instância com o mesmo bundle ID estiver em execução.

## Notas de endurecimento

- Prefira exigir correspondência de TeamID para todas as superfícies privilegiadas.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (somente DEBUG) pode permitir chamadores de mesmo UID para desenvolvimento local.
- Toda comunicação permanece somente local; nenhum socket de rede é exposto.
- Prompts TCC se originam apenas do bundle do aplicativo GUI; mantenha o bundle ID assinado estável entre recompilações.
- Endurecimento IPC: modo de socket `0600`, token, verificações de peer-UID, desafio/resposta HMAC, TTL curto.
