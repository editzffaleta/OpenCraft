---
title: Sandbox vs Política de Tool vs Elevated
summary: "Por que uma tool está bloqueada: runtime do sandbox, política de allow/deny de tool e portões de exec elevado"
read_when: "Você encontrou 'sandbox jail' ou viu uma recusa de tool/elevated e quer a chave de config exata para mudar."
status: active
---

# Sandbox vs Política de Tool vs Elevated

O OpenCraft tem três controles relacionados (mas diferentes):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **onde as tools rodam** (Docker vs host).
2. **Política de tool** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **quais tools estão disponíveis/permitidas**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) é uma **válvula de escape somente para exec** para rodar no host quando você está no sandbox.

## Debug rápido

Use o inspector para ver o que o OpenCraft está _realmente_ fazendo:

```bash
opencraft sandbox explain
opencraft sandbox explain --session agent:main:main
opencraft sandbox explain --agent work
opencraft sandbox explain --json
```

Ele imprime:

- modo/escopo/acesso ao workspace efetivos do sandbox
- se a sessão está atualmente no sandbox (main vs não-main)
- allow/deny de tool efetivos do sandbox (e se veio do agente/global/padrão)
- portões elevated e caminhos de chave de correção

## Sandbox: onde as tools rodam

O sandboxing é controlado por `agents.defaults.sandbox.mode`:

- `"off"`: tudo roda no host.
- `"non-main"`: apenas sessões não-main são sandboxadas (surpresa comum para grupos/canais).
- `"all"`: tudo é sandboxado.

Veja [Sandboxing](/gateway/sandboxing) para a matriz completa (escopo, montagens de workspace, imagens).

### Bind mounts (verificação rápida de segurança)

- `docker.binds` _perfura_ o sistema de arquivos do sandbox: o que quer que você monte é visível dentro do container com o modo que você definir (`:ro` ou `:rw`).
- O padrão é leitura-escrita se você omitir o modo; prefira `:ro` para código-fonte/segredos.
- `scope: "shared"` ignora binds por agente (apenas binds globais se aplicam).
- Montar `/var/run/docker.sock` efetivamente entrega o controle do host ao sandbox; faça isso apenas intencionalmente.
- O acesso ao workspace (`workspaceAccess: "ro"`/`"rw"`) é independente dos modos de bind.

## Política de tool: quais tools existem/podem ser chamadas

Duas camadas importam:

- **Perfil de tool**: `tools.profile` e `agents.list[].tools.profile` (allowlist base)
- **Perfil de tool por provedor**: `tools.byProvider[provider].profile` e `agents.list[].tools.byProvider[provider].profile`
- **Política de tool global/por agente**: `tools.allow`/`tools.deny` e `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de tool por provedor**: `tools.byProvider[provider].allow/deny` e `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de tool do sandbox** (aplica-se apenas quando sandboxado): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` e `agents.list[].tools.sandbox.tools.*`

Regras gerais:

- `deny` sempre ganha.
- Se `allow` não estiver vazio, tudo mais é tratado como bloqueado.
- Política de tool é a parada definitiva: `/exec` não pode sobrescrever uma tool `exec` negada.
- `/exec` apenas muda os padrões de exec por sessão para remetentes autorizados; não concede acesso a tools.
  Chaves de tool por provedor aceitam `provider` (ex. `google-antigravity`) ou `provider/model` (ex. `openai/gpt-5.2`).

### Grupos de tool (atalhos)

Políticas de tool (global, agente, sandbox) suportam entradas `group:*` que se expandem para múltiplas tools:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Grupos disponíveis:

- `group:runtime`: `exec`, `bash`, `process`
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: todas as tools OpenCraft built-in (exclui plugins de provedor)

## Elevated: "rodar no host" somente para exec

Elevated **não** concede tools extras; afeta apenas `exec`.

- Se você está no sandbox, `/elevated on` (ou `exec` com `elevated: true`) roda no host (aprovações ainda podem se aplicar).
- Use `/elevated full` para pular aprovações de exec da sessão.
- Se você já está rodando diretamente, elevated é efetivamente um no-op (ainda portado).
- Elevated **não** tem escopo de skill e **não** sobrescreve allow/deny de tool.
- `/exec` é separado do elevated. Ele apenas ajusta padrões de exec por sessão para remetentes autorizados.

Portões:

- Habilitação: `tools.elevated.enabled` (e opcionalmente `agents.list[].tools.elevated.enabled`)
- Allowlists de remetente: `tools.elevated.allowFrom.<provider>` (e opcionalmente `agents.list[].tools.elevated.allowFrom.<provider>`)

Veja [Modo Elevated](/tools/elevated).

## Correções comuns de "sandbox jail"

### "Tool X bloqueada pela política de tool do sandbox"

Chaves de correção (escolha uma):

- Desabilitar sandbox: `agents.defaults.sandbox.mode=off` (ou por agente `agents.list[].sandbox.mode=off`)
- Permitir a tool dentro do sandbox:
  - remova-a de `tools.sandbox.tools.deny` (ou `agents.list[].tools.sandbox.tools.deny` por agente)
  - ou adicione-a a `tools.sandbox.tools.allow` (ou allow por agente)

### "Achei que era main, por que está no sandbox?"

No modo `"non-main"`, chaves de grupo/canal _não_ são main. Use a chave de sessão main (mostrada por `sandbox explain`) ou mude o modo para `"off"`.
