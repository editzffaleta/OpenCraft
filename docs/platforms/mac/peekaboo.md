---
summary: "Integração PeekabooBridge para automação de UI macOS"
read_when:
  - Hospedando PeekabooBridge no OpenCraft.app
  - Integrando Peekaboo via Swift Package Manager
  - Alterando o protocolo/caminhos do PeekabooBridge
title: "Peekaboo Bridge"
---

# Peekaboo Bridge (automação de UI macOS)

O OpenCraft pode hospedar o **PeekabooBridge** como um broker de automação de UI local e ciente de permissões. Isso permite que a CLI `peekaboo` controle a automação de UI reutilizando as permissões TCC do app macOS.

## O que é isso (e o que não é)

- **Host**: OpenCraft.app pode atuar como host PeekabooBridge.
- **Cliente**: use a CLI `peekaboo` (sem superfície `opencraft ui ...` separada).
- **UI**: overlays visuais ficam no Peekaboo.app; o OpenCraft é apenas um host broker fino.

## Habilitar o bridge

No app macOS:

- Configurações → **Enable Peekaboo Bridge**

Quando habilitado, o OpenCraft inicia um servidor de socket UNIX local. Se desabilitado, o host
é parado e `peekaboo` fará fallback para outros hosts disponíveis.

## Ordem de descoberta do cliente

Os clientes Peekaboo normalmente tentam hosts nesta ordem:

1. Peekaboo.app (UX completo)
2. Claude.app (se instalado)
3. OpenCraft.app (broker fino)

Use `peekaboo bridge status --verbose` para ver qual host está ativo e qual
caminho de socket está em uso. Você pode sobrescrever com:

```bash
export PEEKABOO_BRIDGE_SOCKET=/caminho/para/bridge.sock
```

## Segurança e permissões

- O bridge valida **assinaturas de código do chamador**; uma allowlist de TeamIDs é
  aplicada (TeamID do host Peekaboo + TeamID do app OpenCraft).
- As requisições expiram após ~10 segundos.
- Se as permissões necessárias estiverem ausentes, o bridge retorna uma mensagem de erro clara
  em vez de abrir as Configurações do Sistema.

## Comportamento de snapshot (automação)

Os snapshots são armazenados em memória e expiram automaticamente após uma janela curta.
Se você precisar de retenção mais longa, recapture a partir do cliente.

## Troubleshooting

- Se `peekaboo` reportar "bridge client is not authorized", certifique-se de que o cliente está
  devidamente assinado ou execute o host com `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  somente no modo **debug**.
- Se nenhum host for encontrado, abra um dos apps host (Peekaboo.app ou OpenCraft.app)
  e confirme que as permissões foram concedidas.
