---
summary: "Integração PeekabooBridge para automação de UI no macOS"
read_when:
  - Hospedando PeekabooBridge no OpenCraft.app
  - Integrando Peekaboo via Swift Package Manager
  - Alterando protocolo/caminhos do PeekabooBridge
title: "Peekaboo Bridge"
---

# Peekaboo Bridge (automação de UI no macOS)

O OpenCraft pode hospedar o **PeekabooBridge** como um broker de automação de UI local e
ciente de permissões. Isso permite que a CLI `peekaboo` acione automação de UI enquanto
reutiliza as permissões TCC do aplicativo macOS.

## O que é (e o que não é)

- **Host**: O OpenCraft.app pode atuar como um host PeekabooBridge.
- **Cliente**: use a CLI `peekaboo` (sem superfície separada `opencraft ui ...`).
- **UI**: overlays visuais ficam no Peekaboo.app; OpenCraft é um host broker fino.

## Ativar o bridge

No aplicativo macOS:

- Configurações → **Enable Peekaboo Bridge**

Quando ativado, o OpenCraft inicia um servidor de socket UNIX local. Se desativado, o host
é parado e o `peekaboo` recorrerá a outros hosts disponíveis.

## Ordem de descoberta do cliente

Clientes Peekaboo tipicamente tentam hosts nesta ordem:

1. Peekaboo.app (UX completa)
2. Claude.app (se instalado)
3. OpenCraft.app (broker fino)

Use `peekaboo bridge status --verbose` para ver qual host está ativo e qual
caminho de socket está em uso. Você pode substituir com:

```bash
export PEEKABOO_BRIDGE_SOCKET=/caminho/para/bridge.sock
```

## Segurança e permissões

- O bridge valida **assinaturas de código do chamador**; uma lista de permissão de TeamIDs é
  aplicada (TeamID do host Peekaboo + TeamID do aplicativo OpenCraft).
- As solicitações expiram após ~10 segundos.
- Se permissões necessárias estiverem faltando, o bridge retorna uma mensagem de erro clara
  em vez de abrir as Configurações do Sistema.

## Comportamento de snapshot (automação)

Snapshots são armazenados na memória e expiram automaticamente após uma curta janela.
Se você precisar de retenção mais longa, recapture a partir do cliente.

## Solução de problemas

- Se `peekaboo` relatar "bridge client is not authorized", certifique-se de que o cliente está
  devidamente assinado ou execute o host com `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  apenas no modo **debug**.
- Se nenhum host for encontrado, abra um dos aplicativos host (Peekaboo.app ou OpenCraft.app)
  e confirme que as permissões foram concedidas.
