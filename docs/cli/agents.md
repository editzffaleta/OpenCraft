---
summary: "Referência do CLI para `opencraft agents` (list/add/delete/bindings/bind/unbind/set identity)"
read_when:
  - Você quer múltiplos agentes isolados (workspaces + roteamento + auth)
title: "agents"
---

# `opencraft agents`

Gerenciar agentes isolados (workspaces + auth + roteamento).

Relacionado:

- Roteamento multi-agente: [Roteamento Multi-Agente](/concepts/multi-agent)
- Workspace do agente: [Agent workspace](/concepts/agent-workspace)

## Exemplos

```bash
opencraft agents list
opencraft agents add work --workspace ~/.opencraft/workspace-work
opencraft agents bindings
opencraft agents bind --agent work --bind telegram:ops
opencraft agents unbind --agent work --bind telegram:ops
opencraft agents set-identity --workspace ~/.opencraft/workspace --from-identity
opencraft agents set-identity --agent main --avatar avatars/opencraft.png
opencraft agents delete work
```

## Bindings de roteamento

Use bindings de roteamento para fixar tráfego de canal de entrada a um agente específico.

Listar bindings:

```bash
opencraft agents bindings
opencraft agents bindings --agent work
opencraft agents bindings --json
```

Adicionar bindings:

```bash
opencraft agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Se você omitir `accountId` (`--bind <channel>`), o OpenCraft o resolve de padrões de canal e hooks de setup de plugin quando disponível.

### Comportamento de escopo de binding

- Um binding sem `accountId` corresponde apenas à conta padrão do canal.
- `accountId: "*"` é o fallback amplo do canal (todas as contas) e é menos específico que um binding de conta explícita.
- Se o mesmo agente já tem um binding de canal correspondente sem `accountId`, e você mais tarde vincula com um `accountId` explícito ou resolvido, o OpenCraft atualiza esse binding existente no lugar em vez de adicionar um duplicado.

Exemplo:

```bash
# binding inicial apenas de canal
opencraft agents bind --agent work --bind telegram

# mais tarde fazer upgrade para binding com escopo de conta
opencraft agents bind --agent work --bind telegram:ops
```

Após o upgrade, o roteamento para esse binding tem escopo de `telegram:ops`. Se você também quiser roteamento de conta padrão, adicione-o explicitamente (por exemplo `--bind telegram:default`).

Remover bindings:

```bash
opencraft agents unbind --agent work --bind telegram:ops
opencraft agents unbind --agent work --all
```

## Arquivos de identidade

Cada workspace de agente pode incluir um `IDENTITY.md` na raiz do workspace:

- Exemplo de path: `~/.opencraft/workspace/IDENTITY.md`
- `set-identity --from-identity` lê da raiz do workspace (ou de um `--identity-file` explícito)

Paths de avatar resolvem relativos à raiz do workspace.

## Set identity

`set-identity` escreve campos em `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (path relativo ao workspace, URL http(s), ou data URI)

Carregar de `IDENTITY.md`:

```bash
opencraft agents set-identity --workspace ~/.opencraft/workspace --from-identity
```

Sobrescrever campos explicitamente:

```bash
opencraft agents set-identity --agent main --name "OpenCraft" --emoji "🦞" --avatar avatars/opencraft.png
```

Exemplo de config:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenCraft",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/opencraft.png",
        },
      },
    ],
  },
}
```
