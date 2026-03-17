---
summary: "Referência CLI para `opencraft node` (host de nó headless)"
read_when:
  - Executando o host de nó headless
  - Pareando um nó não-macOS para system.run
title: "node"
---

# `opencraft node`

Executar um **host de nó headless** que conecta ao WebSocket do Gateway e expõe
`system.run` / `system.which` nesta máquina.

## Por que usar um host de nó?

Use um host de nó quando você quiser que agentes **executem comandos em outras máquinas** na sua
rede sem instalar o aplicativo companion completo do macOS lá.

Casos de uso comuns:

- Executar comandos em máquinas Linux/Windows remotas (servidores de build, máquinas de laboratório, NAS).
- Manter a execução em **sandbox** no Gateway, mas delegar execuções aprovadas para outros hosts.
- Fornecer um alvo de execução leve e headless para automação ou nós de CI.

A execução ainda é protegida por **aprovações de execução** e listas de permissão por agente no
host do nó, então você pode manter o acesso a comandos com escopo definido e explícito.

## Proxy de navegador (configuração zero)

Hosts de nó automaticamente anunciam um proxy de navegador se `browser.enabled` não estiver
desativado no nó. Isso permite que o agente use automação de navegador naquele nó
sem configuração extra.

Desative no nó se necessário:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Executar (primeiro plano)

```bash
opencraft node run --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: Host WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: Porta WebSocket do Gateway (padrão: `18789`)
- `--tls`: Usar TLS para a conexão com o Gateway
- `--tls-fingerprint <sha256>`: Fingerprint esperado do certificado TLS (sha256)
- `--node-id <id>`: Sobrepor o id do nó (limpa o Token de pareamento)
- `--display-name <name>`: Sobrepor o nome de exibição do nó

## Autenticação do Gateway para host de nó

`opencraft node run` e `opencraft node install` resolvem autenticação do Gateway a partir de config/env (sem flags `--token`/`--password` nos comandos de nó):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` são verificados primeiro.
- Em seguida, fallback de config local: `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host do nó intencionalmente não herda `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não resolvido, a resolução de autenticação do nó falha de forma fechada (sem fallback remoto mascarando).
- No `gateway.mode=remote`, campos de cliente remoto (`gateway.remote.token` / `gateway.remote.password`) também são elegíveis conforme regras de precedência remota.
- Variáveis de ambiente legadas `CLAWDBOT_GATEWAY_*` são ignoradas para resolução de autenticação do host de nó.

## Serviço (segundo plano)

Instalar um host de nó headless como serviço de usuário.

```bash
opencraft node install --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: Host WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: Porta WebSocket do Gateway (padrão: `18789`)
- `--tls`: Usar TLS para a conexão com o Gateway
- `--tls-fingerprint <sha256>`: Fingerprint esperado do certificado TLS (sha256)
- `--node-id <id>`: Sobrepor o id do nó (limpa o Token de pareamento)
- `--display-name <name>`: Sobrepor o nome de exibição do nó
- `--runtime <runtime>`: Runtime do serviço (`node` ou `bun`)
- `--force`: Reinstalar/sobrescrever se já instalado

Gerenciar o serviço:

```bash
opencraft node status
opencraft node stop
opencraft node restart
opencraft node uninstall
```

Use `opencraft node run` para um host de nó em primeiro plano (sem serviço).

Comandos de serviço aceitam `--json` para saída legível por máquina.

## Pareamento

A primeira conexão cria uma solicitação de pareamento de dispositivo pendente (`role: node`) no Gateway.
Aprove via:

```bash
opencraft devices list
opencraft devices approve <requestId>
```

O host do nó armazena seu id de nó, Token, nome de exibição e informações de conexão do Gateway em
`~/.opencraft/node.json`.

## Aprovações de execução

`system.run` é controlado por aprovações de execução locais:

- `~/.opencraft/exec-approvals.json`
- [Exec approvals](/tools/exec-approvals)
- `opencraft approvals --node <id|name|ip>` (editar a partir do Gateway)
