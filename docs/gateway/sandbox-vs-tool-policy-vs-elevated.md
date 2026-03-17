---
title: Sandbox vs Tool Policy vs Elevated
summary: "Por que uma ferramenta está bloqueada: runtime sandbox, política de allow/deny de ferramentas e gates de exec elevated"
read_when: "Você encontrou 'sandbox jail' ou viu uma recusa de ferramenta/elevated e quer a chave de config exata para mudar."
status: active
---

# Sandbox vs Tool Policy vs Elevated

OpenCraft tem três controles relacionados (mas diferentes):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **onde as ferramentas executam** (Docker vs host).
2. **Política de ferramentas** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **quais ferramentas estão disponíveis/permitidas**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) é uma **saída de emergência somente para exec** para executar no host quando você está em sandbox.

## Debug rápido

Use o inspetor para ver o que o OpenCraft está _realmente_ fazendo:

```bash
opencraft sandbox explain
opencraft sandbox explain --session agent:main:main
opencraft sandbox explain --agent work
opencraft sandbox explain --json
```

Ele exibe:

- modo/escopo/acesso ao workspace efetivo do sandbox
- se a sessão está atualmente em sandbox (main vs não-main)
- política de ferramentas do sandbox efetiva (allow/deny) e se veio de agent/global/default
- gates de elevated e caminhos de chaves para correção

## Sandbox: onde as ferramentas executam

O sandboxing é controlado por `agents.defaults.sandbox.mode`:

- `"off"`: tudo executa no host.
- `"non-main"`: apenas sessões não-main ficam em sandbox (surpresa comum para grupos/canais).
- `"all"`: tudo fica em sandbox.

Veja [Sandboxing](/gateway/sandboxing) para a matriz completa (escopo, montagens de workspace, imagens).

### Montagens de bind (verificação rápida de segurança)

- `docker.binds` _atravessa_ o filesystem do sandbox: o que você montar fica visível dentro do container com o modo que você definiu (`:ro` ou `:rw`).
- O padrão é leitura-escrita se você omitir o modo; prefira `:ro` para código fonte/secrets.
- `scope: "shared"` ignora binds por agente (apenas binds globais se aplicam).
- Montar `/var/run/docker.sock` efetivamente entrega o controle do host ao sandbox; faça isso apenas intencionalmente.
- Acesso ao workspace (`workspaceAccess: "ro"`/`"rw"`) é independente dos modos de bind.

## Política de ferramentas: quais ferramentas existem/são chamáveis

Duas camadas importam:

- **Perfil de ferramentas**: `tools.profile` e `agents.list[].tools.profile` (allowlist base)
- **Perfil de ferramentas por provider**: `tools.byProvider[provider].profile` e `agents.list[].tools.byProvider[provider].profile`
- **Política global/por agente de ferramentas**: `tools.allow`/`tools.deny` e `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de ferramentas por provider**: `tools.byProvider[provider].allow/deny` e `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de ferramentas do sandbox** (aplica-se apenas quando em sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` e `agents.list[].tools.sandbox.tools.*`

Regras práticas:

- `deny` sempre vence.
- Se `allow` não estiver vazio, todo o resto é tratado como bloqueado.
- A política de ferramentas é a parada final: `/exec` não pode sobrescrever uma ferramenta `exec` negada.
- `/exec` apenas muda os padrões da sessão para remetentes autorizados; não concede acesso a ferramentas.
  Chaves de ferramentas por provider aceitam tanto `provider` (ex: `google-antigravity`) quanto `provider/model` (ex: `openai/gpt-5.2`).

### Grupos de ferramentas (atalhos)

Políticas de ferramentas (global, agente, sandbox) suportam entradas `group:*` que expandem para múltiplas ferramentas:

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
- `group:opencraft`: todas as ferramentas built-in do OpenCraft (exclui plugins de provider)

## Elevated: "executar no host" somente para exec

Elevated **não** concede ferramentas extras; afeta apenas `exec`.

- Se você está em sandbox, `/elevated on` (ou `exec` com `elevated: true`) executa no host (aprovações ainda podem se aplicar).
- Use `/elevated full` para pular aprovações de exec na sessão.
- Se você já está executando direto, elevated é efetivamente um no-op (ainda com gate).
- Elevated **não** tem escopo de Skill e **não** sobrescreve allow/deny de ferramentas.
- `/exec` é separado de elevated. Ele apenas ajusta os padrões de exec por sessão para remetentes autorizados.

Gates:

- Habilitação: `tools.elevated.enabled` (e opcionalmente `agents.list[].tools.elevated.enabled`)
- Allowlists de remetentes: `tools.elevated.allowFrom.<provider>` (e opcionalmente `agents.list[].tools.elevated.allowFrom.<provider>`)

Veja [Modo Elevated](/tools/elevated).

## Correções comuns de "sandbox jail"

### "Ferramenta X bloqueada pela política de ferramentas do sandbox"

Chaves de correção (escolha uma):

- Desabilitar sandbox: `agents.defaults.sandbox.mode=off` (ou por agente `agents.list[].sandbox.mode=off`)
- Permitir a ferramenta dentro do sandbox:
  - remova-a de `tools.sandbox.tools.deny` (ou por agente `agents.list[].tools.sandbox.tools.deny`)
  - ou adicione-a em `tools.sandbox.tools.allow` (ou allow por agente)

### "Eu achei que era main, por que está em sandbox?"

No modo `"non-main"`, chaves de grupo/canal _não_ são main. Use a chave de sessão main (mostrada por `sandbox explain`) ou mude o modo para `"off"`.
