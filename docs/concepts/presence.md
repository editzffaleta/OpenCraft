---
summary: "Como entradas de presença do OpenCraft são produzidas, mescladas e exibidas"
read_when:
  - Depurando a aba Instances
  - Investigando linhas de instância duplicadas ou obsoletas
  - Alterando conexão WS do gateway ou beacons de system-event
title: "Presença"
---

# Presença

A "presença" do OpenCraft é uma visão leve e de melhor esforço de:

- o **Gateway** em si, e
- **clientes conectados ao Gateway** (app macOS, WebChat, CLI, etc.)

A presença é usada principalmente para renderizar a aba **Instances** do app macOS e fornecer
visibilidade rápida ao operador.

## Campos de presença (o que aparece)

Entradas de presença são objetos estruturados com campos como:

- `instanceId` (opcional, mas fortemente recomendado): identidade estável do cliente (geralmente `connect.client.instanceId`)
- `host`: nome de host amigável
- `ip`: endereço IP de melhor esforço
- `version`: string de versão do cliente
- `deviceFamily` / `modelIdentifier`: dicas de hardware
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: "segundos desde a última entrada do usuário" (se conhecido)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: timestamp da última atualização (ms desde epoch)

## Produtores (de onde vem a presença)

Entradas de presença são produzidas por múltiplas fontes e **mescladas**.

### 1) Entrada própria do Gateway

O Gateway sempre semeia uma entrada "self" na inicialização para que as UIs mostrem o host
do gateway mesmo antes de qualquer cliente se conectar.

### 2) Conexão WebSocket

Todo cliente WS começa com uma requisição `connect`. No handshake bem-sucedido, o
Gateway faz upsert de uma entrada de presença para aquela conexão.

#### Por que comandos CLI pontuais não aparecem

O CLI frequentemente conecta para comandos pontuais curtos. Para evitar spam na
lista de Instances, `client.mode === "cli"` **não** é transformado em uma entrada de presença.

### 3) Beacons `system-event`

Clientes podem enviar beacons periódicos mais ricos via o método `system-event`. O app
macOS usa isso para reportar nome do host, IP e `lastInputSeconds`.

### 4) Conexões de node (role: node)

Quando um node se conecta sobre o WebSocket do Gateway com `role: node`, o Gateway
faz upsert de uma entrada de presença para aquele node (mesmo fluxo que outros clientes WS).

## Regras de mesclagem + deduplicação (por que `instanceId` importa)

Entradas de presença são armazenadas em um único mapa em memória:

- Entradas são chaveadas por uma **chave de presença**.
- A melhor chave é um `instanceId` estável (de `connect.client.instanceId`) que sobrevive a reinicializações.
- Chaves são insensíveis a maiúsculas/minúsculas.

Se um cliente se reconectar sem um `instanceId` estável, pode aparecer como uma
linha **duplicada**.

## TTL e tamanho limitado

A presença é intencionalmente efêmera:

- **TTL:** entradas com mais de 5 minutos são removidas
- **Max de entradas:** 200 (as mais antigas são descartadas primeiro)

Isso mantém a lista atualizada e evita crescimento ilimitado de memória.

## Advertência sobre acesso remoto/túnel (IPs de loopback)

Quando um cliente se conecta por um túnel SSH / port forward local, o Gateway pode
ver o endereço remoto como `127.0.0.1`. Para evitar sobrescrever um IP
reportado pelo cliente que seja bom, endereços remotos de loopback são ignorados.

## Consumidores

### Aba Instances do macOS

O app macOS renderiza a saída de `system-presence` e aplica um pequeno indicador
de status (Active/Idle/Stale) baseado na idade da última atualização.

## Dicas de depuração

- Para ver a lista bruta, chame `system-presence` contra o Gateway.
- Se você ver duplicatas:
  - confirme que os clientes enviam um `client.instanceId` estável no handshake
  - confirme que beacons periódicos usam o mesmo `instanceId`
  - verifique se a entrada derivada de conexão está faltando `instanceId` (duplicatas são esperadas)
