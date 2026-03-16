---
summary: "Arquitetura IPC macOS para o app OpenCraft, transporte do nó gateway e PeekabooBridge"
read_when:
  - Editando contratos IPC ou IPC do app de barra de menu
title: "IPC macOS"
---

# Arquitetura IPC macOS do OpenCraft

**Modelo atual:** um socket Unix local conecta o **serviço host do nó** ao **app macOS** para aprovações de exec + `system.run`. Existe um CLI de debug `openclaw-mac` para verificações de descoberta/conexão; as ações do agente ainda fluem pelo WebSocket do Gateway e `node.invoke`. A automação de UI usa PeekabooBridge.

## Objetivos

- Instância única de app GUI que possui todo o trabalho voltado ao TCC (notificações, gravação de tela, microfone, voz, AppleScript).
- Uma superfície pequena para automação: comandos do Gateway + nó, mais PeekabooBridge para automação de UI.
- Permissões previsíveis: sempre o mesmo bundle ID assinado, lançado pelo launchd, para que as concessões do TCC persistam.

## Como funciona

### Transporte Gateway + nó

- O app executa o Gateway (modo local) e se conecta a ele como um nó.
- As ações do agente são realizadas via `node.invoke` (ex: `system.run`, `system.notify`, `canvas.*`).

### Serviço de nó + IPC do app

- Um serviço host de nó headless conecta ao WebSocket do Gateway.
- Requisições `system.run` são encaminhadas para o app macOS via socket Unix local.
- O app realiza o exec no contexto de UI, solicita confirmação se necessário, e retorna a saída.

Diagrama (SCI):

```
Agente -> Gateway -> Serviço de Nó (WS)
                       |  IPC (UDS + token + HMAC + TTL)
                       v
                   App Mac (UI + TCC + system.run)
```

### PeekabooBridge (automação de UI)

- A automação de UI usa um socket UNIX separado chamado `bridge.sock` e o protocolo JSON PeekabooBridge.
- Ordem de preferência do host (lado cliente): Peekaboo.app → Claude.app → OpenCraft.app → execução local.
- Segurança: hosts bridge requerem um TeamID permitido; a saída de escape somente DEBUG para mesmo-UID é protegida por `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convenção Peekaboo).
- Veja: [Uso do PeekabooBridge](/platforms/mac/peekaboo) para detalhes.

## Fluxos operacionais

- Reiniciar/rebuildar: `SIGN_IDENTITY="Apple Development: <Nome do Desenvolvedor> (<TEAMID>)" scripts/restart-mac.sh`
  - Mata instâncias existentes
  - Build + empacotamento Swift
  - Escreve/bootstraps/kickstarts o LaunchAgent
- Instância única: o app sai cedo se outra instância com o mesmo bundle ID estiver rodando.

## Notas de endurecimento

- Prefira exigir correspondência de TeamID para todas as superfícies privilegiadas.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (somente DEBUG) pode permitir chamadores do mesmo UID para desenvolvimento local.
- Toda a comunicação permanece apenas local; nenhum socket de rede é exposto.
- Os prompts do TCC originam apenas do bundle do app GUI; mantenha o bundle ID assinado estável entre rebuilds.
- Endurecimento do IPC: modo de socket `0600`, token, verificações de peer-UID, desafio/resposta HMAC, TTL curto.
