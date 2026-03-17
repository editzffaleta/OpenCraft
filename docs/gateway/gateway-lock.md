---
summary: "Guarda de instância única do Gateway usando o bind do listener WebSocket"
read_when:
  - Executando ou debugando o processo do gateway
  - Investigando a aplicação de instância única
title: "Gateway Lock"
---

# Gateway lock

Última atualização: 2025-12-11

## Por quê

- Garantir que apenas uma instância do gateway seja executada por porta base no mesmo host; gateways adicionais devem usar perfis isolados e portas únicas.
- Sobreviver a crashes/SIGKILL sem deixar arquivos de lock obsoletos.
- Falhar rapidamente com um erro claro quando a porta de controle já está ocupada.

## Mecanismo

- O gateway faz bind do listener WebSocket (padrão `ws://127.0.0.1:18789`) imediatamente na inicialização usando um listener TCP exclusivo.
- Se o bind falhar com `EADDRINUSE`, a inicialização lança `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- O OS libera o listener automaticamente em qualquer saída do processo, incluindo crashes e SIGKILL — nenhum arquivo de lock separado ou etapa de limpeza é necessário.
- No shutdown, o gateway fecha o servidor WebSocket e o servidor HTTP subjacente para liberar a porta prontamente.

## Superfície de erro

- Se outro processo está segurando a porta, a inicialização lança `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Outras falhas de bind aparecem como `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Notas operacionais

- Se a porta está ocupada por _outro_ processo, o erro é o mesmo; libere a porta ou escolha outra com `opencraft gateway --port <port>`.
- O app macOS ainda mantém seu próprio guard leve de PID antes de gerar o gateway; o lock em runtime é aplicado pelo bind do WebSocket.
