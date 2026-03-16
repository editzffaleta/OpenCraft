---
summary: "Plano de refatoração: roteamento do exec host, aprovações de node e runner headless"
read_when:
  - Projetando roteamento do exec host ou aprovações de exec
  - Implementando node runner + IPC de UI
  - Adicionando modos de segurança do exec host e slash commands
title: "Refatoração do Exec Host"
---

# Plano de refatoração do exec host

## Objetivos

- Adicionar `exec.host` + `exec.security` para rotear a execução entre **sandbox**, **gateway** e **node**.
- Manter os padrões **seguros**: sem execução entre hosts a menos que explicitamente habilitado.
- Dividir a execução em um **serviço runner headless** com UI opcional (app macOS) via IPC local.
- Fornecer política **por agente**, allowlist, modo de pergunta e vinculação de node.
- Suportar **modos de pergunta** que funcionem _com_ ou _sem_ allowlists.
- Multiplataforma: socket Unix + autenticação por token (paridade macOS/Linux/Windows).

## Não-objetivos

- Sem migração de allowlist legada ou suporte a schema legado.
- Sem PTY/streaming para exec de node (apenas saída agregada).
- Sem nova camada de rede além do Bridge + Gateway existentes.

## Decisões (bloqueadas)

- **Chaves de configuração:** `exec.host` + `exec.security` (sobrescrita por agente permitida).
- **Elevação:** manter `/elevated` como alias para acesso completo ao gateway.
- **Padrão de pergunta:** `on-miss`.
- **Store de aprovações:** `~/.opencraft/exec-approvals.json` (JSON, sem migração legada).
- **Runner:** serviço de sistema headless; app de UI hospeda um socket Unix para aprovações.
- **Identidade do node:** usar `nodeId` existente.
- **Autenticação de socket:** socket Unix + token (multiplataforma); separar depois se necessário.
- **Estado do host do node:** `~/.opencraft/node.json` (id do node + token de pareamento).
- **Exec host macOS:** executar `system.run` dentro do app macOS; serviço de host do node encaminha requisições via IPC local.
- **Sem helper XPC:** manter socket Unix + token + verificações de peer.

## Conceitos-chave

### Host

- `sandbox`: exec Docker (comportamento atual).
- `gateway`: exec no host do gateway.
- `node`: exec no node runner via Bridge (`system.run`).

### Modo de segurança

- `deny`: sempre bloquear.
- `allowlist`: permitir apenas correspondências.
- `full`: permitir tudo (equivalente a elevated).

### Modo de pergunta

- `off`: nunca perguntar.
- `on-miss`: perguntar apenas quando a allowlist não corresponde.
- `always`: perguntar sempre.

O modo de pergunta é **independente** da allowlist; a allowlist pode ser usada com `always` ou `on-miss`.

### Resolução de política (por exec)

1. Resolver `exec.host` (parâmetro de ferramenta → sobrescrita de agente → padrão global).
2. Resolver `exec.security` e `exec.ask` (mesma precedência).
3. Se o host for `sandbox`, prosseguir com exec local em sandbox.
4. Se o host for `gateway` ou `node`, aplicar política de segurança + pergunta naquele host.

## Segurança padrão

- Padrão `exec.host = sandbox`.
- Padrão `exec.security = deny` para `gateway` e `node`.
- Padrão `exec.ask = on-miss` (relevante apenas se a segurança permitir).
- Se nenhuma vinculação de node estiver definida, **o agente pode ter como alvo qualquer node**, mas apenas se a política permitir.

## Superfície de configuração

### Parâmetros de ferramenta

- `exec.host` (opcional): `sandbox | gateway | node`.
- `exec.security` (opcional): `deny | allowlist | full`.
- `exec.ask` (opcional): `off | on-miss | always`.
- `exec.node` (opcional): id/nome do node a usar quando `host=node`.

### Chaves de configuração (global)

- `tools.exec.host`
- `tools.exec.security`
- `tools.exec.ask`
- `tools.exec.node` (vinculação padrão de node)

### Chaves de configuração (por agente)

- `agents.list[].tools.exec.host`
- `agents.list[].tools.exec.security`
- `agents.list[].tools.exec.ask`
- `agents.list[].tools.exec.node`

### Alias

- `/elevated on` = definir `tools.exec.host=gateway`, `tools.exec.security=full` para a sessão do agente.
- `/elevated off` = restaurar configurações anteriores de exec para a sessão do agente.

## Store de aprovações (JSON)

Caminho: `~/.opencraft/exec-approvals.json`

Propósito:

- Política local + allowlists para o **host de execução** (gateway ou node runner).
- Fallback de pergunta quando nenhuma UI está disponível.
- Credenciais IPC para clientes de UI.

Schema proposto (v1):

```json
{
  "version": 1,
  "socket": {
    "path": "~/.opencraft/exec-approvals.sock",
    "token": "base64-opaque-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny"
  },
  "agents": {
    "agent-id-1": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [
        {
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 0,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

Notas:

- Sem formatos de allowlist legados.
- `askFallback` se aplica apenas quando `ask` é necessário e nenhuma UI está acessível.
- Permissões de arquivo: `0600`.

## Serviço runner (headless)

### Papel

- Aplicar `exec.security` + `exec.ask` localmente.
- Executar comandos do sistema e retornar a saída.
- Emitir eventos Bridge para o ciclo de vida do exec (opcional, mas recomendado).

### Ciclo de vida do serviço

- Launchd/daemon no macOS; serviço de sistema no Linux/Windows.
- O JSON de aprovações é local ao host de execução.
- A UI hospeda um socket Unix local; runners se conectam sob demanda.

## Integração com UI (app macOS)

### IPC

- Socket Unix em `~/.opencraft/exec-approvals.sock` (0600).
- Token armazenado em `exec-approvals.json` (0600).
- Verificações de peer: apenas mesmo UID.
- Challenge/response: nonce + HMAC(token, request-hash) para prevenir replay.
- TTL curto (ex.: 10s) + payload máximo + rate limit.

### Fluxo de pergunta (exec host app macOS)

1. Serviço do node recebe `system.run` do gateway.
2. Serviço do node conecta ao socket local e envia o prompt/requisição de exec.
3. App valida peer + token + HMAC + TTL e exibe diálogo se necessário.
4. App executa o comando no contexto de UI e retorna a saída.
5. Serviço do node retorna a saída ao gateway.

Se a UI estiver ausente:

- Aplicar `askFallback` (`deny|allowlist|full`).

### Diagrama (SCI)

```
Agent -> Gateway -> Bridge -> Node Service (TS)
                         |  IPC (UDS + token + HMAC + TTL)
                         v
                     Mac App (UI + TCC + system.run)
```

## Identidade + vinculação do node

- Usar `nodeId` existente do pareamento Bridge.
- Modelo de vinculação:
  - `tools.exec.node` restringe o agente a um node específico.
  - Se não definido, o agente pode escolher qualquer node (a política ainda aplica os padrões).
- Resolução de seleção do node:
  - correspondência exata de `nodeId`
  - `displayName` (normalizado)
  - `remoteIp`
  - prefixo de `nodeId` (>= 6 chars)

## Eventos

### Quem vê os eventos

- Eventos do sistema são **por sessão** e mostrados ao agente no próximo prompt.
- Armazenados na fila em memória do gateway (`enqueueSystemEvent`).

### Texto do evento

- `Exec started (node=<id>, id=<runId>)`
- `Exec finished (node=<id>, id=<runId>, code=<code>)` + cauda de saída opcional
- `Exec denied (node=<id>, id=<runId>, <reason>)`

### Transporte

Opção A (recomendada):

- Runner envia frames Bridge de `event` `exec.started` / `exec.finished`.
- `handleBridgeEvent` do gateway mapeia para `enqueueSystemEvent`.

Opção B:

- Ferramenta `exec` do gateway lida com o ciclo de vida diretamente (apenas síncrono).

## Fluxos de exec

### Host sandbox

- Comportamento `exec` existente (Docker ou host quando sem sandbox).
- PTY suportado apenas no modo sem sandbox.

### Host gateway

- Processo do gateway executa na sua própria máquina.
- Aplica `exec-approvals.json` local (segurança/pergunta/allowlist).

### Host node

- Gateway chama `node.invoke` com `system.run`.
- Runner aplica aprovações locais.
- Runner retorna stdout/stderr agregados.
- Eventos Bridge opcionais para início/fim/negação.

## Limites de saída

- Limitar stdout+stderr combinados em **200k**; manter **cauda de 20k** para eventos.
- Truncar com sufixo claro (ex.: `"… (truncated)"`).

## Slash commands

- `/exec host=<sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`
- Sobrescritas por agente, por sessão; não persistentes a menos que salvas via configuração.
- `/elevated on|off|ask|full` permanece como atalho para `host=gateway security=full` (com `full` ignorando aprovações).

## História multiplataforma

- O serviço runner é o alvo de execução portátil.
- A UI é opcional; se ausente, `askFallback` se aplica.
- Windows/Linux suportam o mesmo JSON de aprovações + protocolo de socket.

## Fases de implementação

### Fase 1: configuração + roteamento de exec

- Adicionar schema de configuração para `exec.host`, `exec.security`, `exec.ask`, `exec.node`.
- Atualizar o plumbing da ferramenta para respeitar `exec.host`.
- Adicionar slash command `/exec` e manter alias `/elevated`.

### Fase 2: store de aprovações + aplicação no gateway

- Implementar leitor/escritor de `exec-approvals.json`.
- Aplicar allowlist + modos de pergunta para host `gateway`.
- Adicionar limites de saída.

### Fase 3: aplicação no node runner

- Atualizar node runner para aplicar allowlist + pergunta.
- Adicionar bridge de prompt via socket Unix ao app macOS de UI.
- Conectar `askFallback`.

### Fase 4: eventos

- Adicionar eventos Bridge de node → gateway para ciclo de vida do exec.
- Mapear para `enqueueSystemEvent` para prompts do agente.

### Fase 5: polish de UI

- App Mac: editor de allowlist, seletor por agente, UI de política de pergunta.
- Controles de vinculação de node (opcional).

## Plano de testes

- Testes unitários: correspondência de allowlist (glob + sem distinção de maiúsculas/minúsculas).
- Testes unitários: precedência de resolução de política (parâmetro de ferramenta → sobrescrita de agente → global).
- Testes de integração: fluxos de deny/allow/ask do node runner.
- Testes de evento Bridge: roteamento de evento do node → evento do sistema.

## Riscos em aberto

- Indisponibilidade de UI: garantir que `askFallback` seja respeitado.
- Comandos de longa duração: depender de timeout + limites de saída.
- Ambiguidade de múltiplos nodes: erro a menos que vinculação de node ou parâmetro de node explícito esteja presente.

## Docs relacionados

- [Ferramenta Exec](/tools/exec)
- [Aprovações de Exec](/tools/exec-approvals)
- [Nodes](/nodes)
- [Modo Elevated](/tools/elevated)
