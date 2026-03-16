---
summary: "Runbook para o serviço do Gateway, ciclo de vida e operações"
read_when:
  - Rodando ou depurando o processo do gateway
title: "Gateway Runbook"
---

# Runbook do Gateway

Use esta página para operações de dia 1 (startup) e dia 2 do serviço Gateway.

<CardGroup cols={2}>
  <Card title="Resolução de problemas aprofundada" icon="siren" href="/gateway/troubleshooting">
    Diagnósticos orientados por sintoma com ladders exatos de comandos e assinaturas de log.
  </Card>
  <Card title="Configuração" icon="sliders" href="/gateway/configuration">
    Guia de setup orientado a tarefas + referência completa de configuração.
  </Card>
  <Card title="Gerenciamento de segredos" icon="key-round" href="/gateway/secrets">
    Contrato SecretRef, comportamento do snapshot de runtime e operações de migrate/reload.
  </Card>
  <Card title="Contrato do plano de segredos" icon="shield-check" href="/gateway/secrets-plan-contract">
    Regras exatas de alvo/path de `secrets apply` e comportamento de auth-profile somente ref.
  </Card>
</CardGroup>

## Startup local em 5 minutos

<Steps>
  <Step title="Iniciar o Gateway">

```bash
opencraft gateway --port 18789
# debug/trace espelhado para stdio
opencraft gateway --port 18789 --verbose
# forçar kill do listener na porta selecionada, depois iniciar
opencraft gateway --force
```

  </Step>

  <Step title="Verificar saúde do serviço">

```bash
opencraft gateway status
opencraft status
opencraft logs --follow
```

Baseline saudável: `Runtime: running` e `RPC probe: ok`.

  </Step>

  <Step title="Validar prontidão dos canais">

```bash
opencraft channels status --probe
```

  </Step>
</Steps>

<Note>
O reload de config do Gateway observa o path do arquivo de config ativo (resolvido de padrões de perfil/estado, ou `OPENCLAW_CONFIG_PATH` quando definido).
O modo padrão é `gateway.reload.mode="hybrid"`.
</Note>

## Modelo de runtime

- Um processo always-on para roteamento, plano de controle e conexões de canal.
- Porta única multiplexada para:
  - WebSocket controle/RPC
  - APIs HTTP (compatível com OpenAI, Responses, tools invoke)
  - UI de Controle e hooks
- Modo de bind padrão: `loopback`.
- Auth é obrigatória por padrão (`gateway.auth.token` / `gateway.auth.password`, ou `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).

### Precedência de porta e bind

| Configuração  | Ordem de resolução                                                |
| ------------- | ----------------------------------------------------------------- |
| Porta Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`    |
| Modo bind     | CLI/override → `gateway.bind` → `loopback`                        |

### Modos de hot reload

| `gateway.reload.mode` | Comportamento                                   |
| --------------------- | ----------------------------------------------- |
| `off`                 | Sem reload de config                            |
| `hot`                 | Aplicar apenas mudanças hot-safe                |
| `restart`             | Reiniciar em mudanças que requerem reload        |
| `hybrid` (padrão)     | Hot-apply quando seguro, reiniciar quando necessário |

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
Fallback: túnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Depois conecte clientes a `ws://127.0.0.1:18789` localmente.

<Warning>
Se auth do gateway estiver configurada, clientes ainda devem enviar auth (`token`/`password`) mesmo por túneis SSH.
</Warning>

Veja: [Remote Gateway](/gateway/remote), [Authentication](/gateway/authentication), [Tailscale](/gateway/tailscale).

## Supervisão e ciclo de vida do serviço

Use execuções supervisionadas para confiabilidade parecida com produção.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
opencraft gateway install
opencraft gateway status
opencraft gateway restart
opencraft gateway stop
```

Labels do LaunchAgent são `ai.opencraft.gateway` (padrão) ou `ai.opencraft.<profile>` (perfil nomeado). `opencraft doctor` audita e repara deriva de config do serviço.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
opencraft gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
opencraft gateway status
```

Para persistência após logout, habilite linger:

```bash
sudo loginctl enable-linger <user>
```

  </Tab>

  <Tab title="Linux (serviço de sistema)">

Use uma unit de sistema para hosts multi-usuário/always-on.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

  </Tab>
</Tabs>

## Múltiplos gateways em um host

A maioria dos setups deve rodar **um** Gateway.
Use múltiplos apenas para isolamento/redundância estrito (por exemplo um perfil de rescue).

Checklist por instância:

- `gateway.port` único
- `OPENCLAW_CONFIG_PATH` único
- `OPENCLAW_STATE_DIR` único
- `agents.defaults.workspace` único

Exemplo:

```bash
OPENCLAW_CONFIG_PATH=~/.opencraft/a.json OPENCLAW_STATE_DIR=~/.opencraft-a opencraft gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.opencraft/b.json OPENCLAW_STATE_DIR=~/.opencraft-b opencraft gateway --port 19002
```

Veja: [Multiple gateways](/gateway/multiple-gateways).

### Path rápido de perfil dev

```bash
opencraft --dev setup
opencraft --dev gateway --allow-unconfigured
opencraft --dev status
```

Os padrões incluem estado/config isolados e porta base do gateway `19001`.

## Referência rápida do protocolo (visão do operador)

- Primeiro frame do cliente deve ser `connect`.
- Gateway retorna snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limites/política).
- Requisições: `req(method, params)` → `res(ok/payload|error)`.
- Eventos comuns: `connect.challenge`, `agent`, `chat`, `presence`, `tick`, `health`, `heartbeat`, `shutdown`.

Execuções de agente são em dois estágios:

1. Ack de aceito imediato (`status:"accepted"`)
2. Resposta de conclusão final (`status:"ok"|"error"`), com eventos `agent` em streaming entre eles.

Veja docs completos do protocolo: [Gateway Protocol](/gateway/protocol).

## Verificações operacionais

### Liveness

- Abrir WS e enviar `connect`.
- Esperar resposta `hello-ok` com snapshot.

### Readiness

```bash
opencraft gateway status
opencraft channels status --probe
opencraft health
```

### Recuperação de gap

Eventos não são repetidos. Em gaps de sequência, atualize o estado (`health`, `system-presence`) antes de continuar.

## Assinaturas de falha comuns

| Assinatura                                                     | Problema provável                          |
| -------------------------------------------------------------- | ------------------------------------------ |
| `refusing to bind gateway ... without auth`                    | Bind não-loopback sem token/senha          |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflito de porta                          |
| `Gateway start blocked: set gateway.mode=local`                | Config definida para modo remoto           |
| `unauthorized` durante connect                                  | Incompatibilidade de auth entre cliente e gateway |

Para ladders completos de diagnóstico, use [Gateway Troubleshooting](/gateway/troubleshooting).

## Garantias de segurança

- Clientes do protocolo Gateway falham rapidamente quando o Gateway não está disponível (sem fallback implícito de canal direto).
- Primeiros frames inválidos/não-connect são rejeitados e fechados.
- Shutdown gracioso emite evento `shutdown` antes do fechamento do socket.

---

Relacionado:

- [Troubleshooting](/gateway/troubleshooting)
- [Background Process](/gateway/background-process)
- [Configuration](/gateway/configuration)
- [Health](/gateway/health)
- [Doctor](/gateway/doctor)
- [Authentication](/gateway/authentication)
