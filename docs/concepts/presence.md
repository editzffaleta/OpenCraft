---
summary: "Como as entradas de presenca do OpenCraft sao produzidas, mescladas e exibidas"
read_when:
  - Depurando a aba Instancias
  - Investigando linhas de instancia duplicadas ou obsoletas
  - Alterando beacons de conexao WS do Gateway ou eventos de sistema
title: "Presence"
---

# Presenca

A "presenca" do OpenCraft e uma visao leve e de melhor esforco de:

- o proprio **Gateway**, e
- **clientes conectados ao Gateway** (aplicativo macOS, WebChat, CLI, etc.)

A presenca e usada principalmente para renderizar a aba **Instancias** do aplicativo macOS e para
fornecer visibilidade rapida ao operador.

## Campos de presenca (o que aparece)

As entradas de presenca sao objetos estruturados com campos como:

- `instanceId` (opcional mas fortemente recomendado): identidade estavel do cliente (geralmente `connect.client.instanceId`)
- `host`: nome de host amigavel
- `ip`: endereco IP de melhor esforco
- `version`: string de versao do cliente
- `deviceFamily` / `modelIdentifier`: dicas de hardware
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: "segundos desde a ultima entrada do usuario" (se conhecido)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: timestamp da ultima atualizacao (ms desde a epoca)

## Produtores (de onde vem a presenca)

As entradas de presenca sao produzidas por multiplas fontes e **mescladas**.

### 1) Entrada propria do Gateway

O Gateway sempre cria uma entrada "self" na inicializacao para que as UIs mostrem o host do Gateway
mesmo antes de qualquer cliente se conectar.

### 2) Conexao WebSocket

Todo cliente WS comeca com uma requisicao `connect`. Apos o handshake bem-sucedido, o
Gateway insere/atualiza uma entrada de presenca para aquela conexao.

#### Por que comandos unicos do CLI nao aparecem

O CLI frequentemente se conecta para comandos curtos e unicos. Para evitar poluir a
lista de Instancias, `client.mode === "cli"` **nao** e transformado em uma entrada de presenca.

### 3) Beacons `system-event`

Clientes podem enviar beacons periodicos mais ricos via o metodo `system-event`. O aplicativo
macOS usa isso para reportar nome do host, IP e `lastInputSeconds`.

### 4) Conexoes de Node (role: node)

Quando um node se conecta pelo WebSocket do Gateway com `role: node`, o Gateway
insere/atualiza uma entrada de presenca para aquele node (mesmo fluxo que outros clientes WS).

## Regras de mesclagem + deduplicacao (por que `instanceId` importa)

As entradas de presenca sao armazenadas em um unico mapa em memoria:

- As entradas sao chaveadas por uma **chave de presenca**.
- A melhor chave e um `instanceId` estavel (de `connect.client.instanceId`) que sobrevive a reinicializacoes.
- As chaves sao insensíveis a maiusculas/minusculas.

Se um cliente se reconectar sem um `instanceId` estavel, ele pode aparecer como uma
linha **duplicada**.

## TTL e tamanho limitado

A presenca e intencionalmente efemera:

- **TTL:** entradas mais antigas que 5 minutos sao removidas
- **Maximo de entradas:** 200 (mais antigas removidas primeiro)

Isso mantem a lista atualizada e evita crescimento ilimitado de memoria.

## Ressalva de remoto/tunel (IPs de loopback)

Quando um cliente se conecta por um tunel SSH / redirecionamento de porta local, o Gateway pode
ver o endereco remoto como `127.0.0.1`. Para evitar sobrescrever um bom IP
reportado pelo cliente, enderecos remotos de loopback sao ignorados.

## Consumidores

### Aba Instancias do macOS

O aplicativo macOS renderiza a saida de `system-presence` e aplica um pequeno indicador de
status (Ativo/Ocioso/Obsoleto) baseado na idade da ultima atualizacao.

## Dicas de depuracao

- Para ver a lista bruta, chame `system-presence` contra o Gateway.
- Se voce vir duplicatas:
  - confirme que os clientes enviam um `client.instanceId` estavel no handshake
  - confirme que beacons periodicos usam o mesmo `instanceId`
  - verifique se a entrada derivada da conexao esta sem `instanceId` (duplicatas sao esperadas)
