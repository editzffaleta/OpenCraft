---
summary: "Runbook para o serviço Gateway, lifecycle e operações"
read_when:
  - Executando ou debugando o processo gateway
title: "Gateway Runbook"
---

# Gateway runbook

Use esta página para startup de dia-1 e operações de dia-2 do serviço Gateway.

<CardGroup cols={2}>
  <Card title="Deep troubleshooting" icon="siren" href="/gateway/troubleshooting">
    Diagnósticos com foco em sintomas com command ladders exatos e assinaturas de log.
  </Card>
  <Card title="Configuration" icon="sliders" href="/gateway/configuration">
    Guia de configuração orientado a tarefas + referência de configuração completa.
  </Card>
  <Card title="Secrets management" icon="key-round" href="/gateway/secrets">
    Contrato SecretRef, comportamento de snapshot em runtime e operações de migrate/reload.
  </Card>
  <Card title="Secrets plan contract" icon="shield-check" href="/gateway/secrets-plan-contract">
    Regras exatas de target/path para `secrets apply` e comportamento ref-only de auth-profile.
  </Card>
</CardGroup>

## Startup local de 5 minutos

<Steps>
  <Step title="Inicie o Gateway">

```bash
opencraft gateway --port 18789
# debug/trace espelhado para stdio
opencraft gateway --port 18789 --verbose
# force-kill listener na porta selecionada, depois inicie
opencraft gateway --force
```

  </Step>

  <Step title="Verifique a saúde do serviço">

```bash
opencraft gateway status
opencraft status
opencraft logs --follow
```

Linha de base saudável: `Runtime: running` e `RPC probe: ok`.

  </Step>

  <Step title="Valide a prontidão do canal">

```bash
opencraft channels status --probe
```

  </Step>
</Steps>

<Note>
Gateway config reload observa o caminho do arquivo de config ativo (resolvido a partir de profile/state defaults, ou `OPENCRAFT_CONFIG_PATH` quando definido).
Modo padrão é `gateway.reload.mode="hybrid"`.
</Note>

## Modelo de runtime

- Um processo sempre ativo para roteamento, control plane e conexões de canais.
- Porta multiplexada única para:
  - Controle WebSocket/RPC
  - APIs HTTP (compatíveis com OpenAI, Responses, tools invoke)
  - Control UI e hooks
- Modo de bind padrão: `loopback`.
- Autenticação é necessária por padrão (`gateway.auth.token` / `gateway.auth.password`, ou `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).

### Precedência de port e bind

| Setting      | Ordem de resolução                                               |
| ------------ | -------------------------------------------------------------- |
| Gateway port | `--port` → `OPENCRAFT_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind mode    | CLI/override → `gateway.bind` → `loopback`                     |

### Modos de hot reload

| `gateway.reload.mode` | Comportamento                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | Sem config reload                           |
| `hot`                 | Aplicar apenas mudanças hot-safe                |
| `restart`             | Reiniciar em mudanças que requerem reload         |
| `hybrid` (padrão)    | Hot-apply quando seguro, reiniciar quando necessário |

## Conjunto de comandos do operador

```bash
opencraft gateway status
opencraft gateway status --deep
opencraft gateway status --json
opencraft gateway install
opencraft gateway restart
opencraft gateway stop
opencraft secrets reload
opencraft logs --follow
opencraft doctor
```

## Acesso remoto

Preferido: Tailscale/VPN.
Fallback: SSH tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Então conecte clientes a `ws://127.0.0.1:18789` localmente.

<Warning>
Se gateway auth está configurado, clientes ainda devem enviar auth (`token`/`password`) mesmo sobre SSH tunnels.
</Warning>

Veja: [Remote Gateway](/gateway/remote), [Authentication](/gateway/authentication), [Tailscale](/gateway/tailscale).

## Supervisão e lifecycle do serviço

Use execuções supervisionadas para confiabilidade parecida com produção.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
opencraft gateway install
opencraft gateway status
opencraft gateway restart
opencraft gateway stop
```

LaunchAgent labels são `ai.opencraft.gateway` (padrão) ou `ai.opencraft.<profile>` (named profile). `opencraft doctor` audita e repara config drift do serviço.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
opencraft gateway install
systemctl --user enable --now opencraft-gateway[-<profile>].service
opencraft gateway status
```

Para persistência após logout, habilite lingering:

```bash
sudo loginctl enable-linger <user>
```

  </Tab>

  <Tab title="Linux (system service)">

Use uma unit do sistema para hosts multi-user/sempre-on.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now opencraft-gateway[-<profile>].service
```

  </Tab>
</Tabs>

## Múltiplos gateways em um host

A maioria das configurações deve executar **um** Gateway.
Use múltiplos apenas para isolamento/redundância estrita (por exemplo um perfil de resgate).

Checklist por instância:

- `gateway.port` único
- `OPENCRAFT_CONFIG_PATH` único
- `OPENCRAFT_STATE_DIR` único
- `agents.defaults.workspace` único

Exemplo:

```bash
OPENCRAFT_CONFIG_PATH=~/.opencraft/a.json OPENCRAFT_STATE_DIR=~/.opencraft-a opencraft gateway --port 19001
OPENCRAFT_CONFIG_PATH=~/.opencraft/b.json OPENCRAFT_STATE_DIR=~/.opencraft-b opencraft gateway --port 19002
```

Veja: [Multiple gateways](/gateway/multiple-gateways).

### Caminho rápido de perfil de dev

```bash
opencraft --dev setup
opencraft --dev gateway --allow-unconfigured
opencraft --dev status
```

Os padrões incluem estado/config isolado e gateway port base `19001`.

## Referência rápida de protocolo (visualização do operador)

- Primeiro frame do cliente deve ser `connect`.
- Gateway retorna snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- Requests: `req(method, params)` → `res(ok/payload|error)`.
- Eventos comuns: `connect.challenge`, `agent`, `chat`, `presence`, `tick`, `health`, `heartbeat`, `shutdown`.

Execuções de agentes são em dois estágios:

1. Ack aceito imediatamente (`status:"accepted"`)
2. Resposta de conclusão final (`status:"ok"|"error"`), com eventos `agent` em stream no meio.

Veja documentação de protocolo completo: [Gateway Protocol](/gateway/protocol).

## Verificações operacionais

### Liveness

- Abra WS e envie `connect`.
- Espere resposta `hello-ok` com snapshot.

### Readiness

```bash
opencraft gateway status
opencraft channels status --probe
opencraft health
```

### Gap recovery

Eventos não são replicados. Em gaps de sequência, atualize estado (`health`, `system-presence`) antes de continuar.

## Assinaturas de falha comuns

| Assinatura                                                      | Problema provável                             |
| -------------------------------------------------------------- | ---------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind não-loopback sem token/password |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflito de port                            |
| `Gateway start blocked: set gateway.mode=local`                | Config definido para modo remoto                |
| `unauthorized` durante connect                                  | Desajuste de auth entre cliente e gateway |

Para diagnosis ladders completos, use [Gateway Troubleshooting](/gateway/troubleshooting).

## Garantias de segurança

- Clientes do protocolo Gateway falham rápido quando Gateway não está disponível (sem fallback de canal direto implícito).
- Frames não-connect inválidos/iniciais são rejeitados e fechados.
- Shutdown gracioso emite evento `shutdown` antes de socket close.

---

Relacionado:

- [Troubleshooting](/gateway/troubleshooting)
- [Background Process](/gateway/background-process)
- [Configuration](/gateway/configuration)
- [Health](/gateway/health)
- [Doctor](/gateway/doctor)
- [Authentication](/gateway/authentication)
