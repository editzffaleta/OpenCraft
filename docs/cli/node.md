---
summary: "Referência do CLI para `opencraft node` (host de node headless)"
read_when:
  - Rodando o host de node headless
  - Pareando um node não-macOS para system.run
title: "node"
---

# `opencraft node`

Rodar um **host de node headless** que conecta ao WebSocket do Gateway e expõe
`system.run` / `system.which` nesta máquina.

## Por que usar um host de node?

Use um host de node quando quiser que agentes **rodem comandos em outras máquinas** da sua
rede sem instalar um app companion completo do macOS.

Casos de uso comuns:

- Rodar comandos em boxes Linux/Windows remotas (servidores de build, máquinas de lab, NAS).
- Manter exec **sandboxado** no gateway, mas delegar execuções aprovadas para outros hosts.
- Fornecer um alvo de execução headless leve para nodes de automação ou CI.

A execução ainda é protegida por **aprovações de exec** e allowlists por agente no
host de node, então você pode manter o acesso a comandos com escopo e explícito.

## Proxy de browser (zero-config)

Hosts de node anunciam automaticamente um proxy de browser se `browser.enabled` não estiver
desabilitado no node. Isso permite que o agente use automação de browser naquele node
sem configuração extra.

Desabilite no node se necessário:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Rodar (foreground)

```bash
opencraft node run --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: host WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: porta WebSocket do Gateway (padrão: `18789`)
- `--tls`: usar TLS para a conexão do gateway
- `--tls-fingerprint <sha256>`: fingerprint esperado do certificado TLS (sha256)
- `--node-id <id>`: sobrescrever id do node (limpa token de pareamento)
- `--display-name <name>`: sobrescrever o nome de exibição do node

## Auth do gateway para host de node

`opencraft node run` e `opencraft node install` resolvem auth do gateway de config/env (sem flags `--token`/`--password` em comandos de node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` são verificados primeiro.
- Depois fallback de config local: `gateway.auth.token` / `gateway.auth.password`.
- Em modo local, o host de node intencionalmente não herda `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não resolvido, a resolução de auth do node falha fechada (sem mascaramento de fallback remoto).
- Em `gateway.mode=remote`, campos de cliente remoto (`gateway.remote.token` / `gateway.remote.password`) também são elegíveis de acordo com regras de precedência remota.
- Vars de env `CLAWDBOT_GATEWAY_*` legadas são ignoradas para resolução de auth do host de node.

## Serviço (background)

Instalar um host de node headless como serviço de usuário.

```bash
opencraft node install --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: host WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: porta WebSocket do Gateway (padrão: `18789`)
- `--tls`: usar TLS para a conexão do gateway
- `--tls-fingerprint <sha256>`: fingerprint esperado do certificado TLS (sha256)
- `--node-id <id>`: sobrescrever id do node (limpa token de pareamento)
- `--display-name <name>`: sobrescrever o nome de exibição do node
- `--runtime <runtime>`: runtime do serviço (`node` ou `bun`)
- `--force`: reinstalar/sobrescrever se já instalado

Gerenciar o serviço:

```bash
opencraft node status
opencraft node stop
opencraft node restart
opencraft node uninstall
```

Use `opencraft node run` para um host de node em foreground (sem serviço).

Comandos de serviço aceitam `--json` para saída legível por máquina.

## Pareamento

A primeira conexão cria uma solicitação de pareamento de dispositivo pendente (`role: node`) no Gateway.
Aprove via:

```bash
opencraft devices list
opencraft devices approve <requestId>
```

O host de node armazena seu id de node, token, nome de exibição e info de conexão do gateway em
`~/.opencraft/node.json`.

## Aprovações de exec

`system.run` é protegido por aprovações de exec locais:

- `~/.opencraft/exec-approvals.json`
- [Exec approvals](/tools/exec-approvals)
- `opencraft approvals --node <id|name|ip>` (editar do Gateway)
