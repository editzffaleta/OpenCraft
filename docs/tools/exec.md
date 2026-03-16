---
summary: "Uso da tool exec, modos stdin e suporte a TTY"
read_when:
  - Usando ou modificando a tool exec
  - Depurando comportamento de stdin ou TTY
title: "Tool Exec"
---

# Tool exec

Rodar comandos shell no workspace. Suporta execução em foreground + background via `process`.
Se `process` não é permitido, `exec` roda sincronamente e ignora `yieldMs`/`background`.
Sessões em background têm escopo por agente; `process` só vê sessões do mesmo agente.

## Parâmetros

- `command` (obrigatório)
- `workdir` (padrão é cwd)
- `env` (overrides chave/valor)
- `yieldMs` (padrão 10000): auto-background após delay
- `background` (bool): background imediato
- `timeout` (segundos, padrão 1800): matar ao expirar
- `pty` (bool): rodar em pseudo-terminal quando disponível (CLIs somente TTY, agentes de coding, UIs de terminal)
- `host` (`sandbox | gateway | node`): onde executar
- `security` (`deny | allowlist | full`): modo de aplicação para `gateway`/`node`
- `ask` (`off | on-miss | always`): prompts de aprovação para `gateway`/`node`
- `node` (string): id/nome do node para `host=node`
- `elevated` (bool): solicitar modo elevado (host gateway); `security=full` é forçado apenas quando elevated resolve para `full`

Notas:

- `host` padrão é `sandbox`.
- `elevated` é ignorado quando sandboxing está desligado (exec já roda no host).
- Aprovações `gateway`/`node` são controladas por `~/.opencraft/exec-approvals.json`.
- `node` requer um node emparelhado (app companheiro ou host de node headless).
- Se múltiplos nodes estiverem disponíveis, defina `exec.node` ou `tools.exec.node` para selecionar um.
- Em hosts não-Windows, exec usa `SHELL` quando definido; se `SHELL` é `fish`, prefere `bash` (ou `sh`)
  do `PATH` para evitar scripts incompatíveis com fish, depois volta para `SHELL` se nenhum existe.
- Em hosts Windows, exec prefere descoberta do PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, depois PATH),
  depois volta para Windows PowerShell 5.1.
- Execução no host (`gateway`/`node`) rejeita `env.PATH` e overrides de loader (`LD_*`/`DYLD_*`) para
  prevenir hijacking de binários ou código injetado.
- O OpenCraft define `OPENCLAW_SHELL=exec` no ambiente de comando criado (incluindo execução PTY e sandbox) para que regras de shell/perfil possam detectar contexto de tool exec.
- Importante: sandboxing está **desligado por padrão**. Se sandboxing está desligado e `host=sandbox` está explicitamente
  configurado/solicitado, exec agora falha de forma segura em vez de rodar silenciosamente no host gateway.
  Habilite sandboxing ou use `host=gateway` com aprovações.
- Verificações de preflight de script (para erros comuns de sintaxe shell Python/Node) só inspecionam arquivos dentro do
  limite efetivo de `workdir`. Se um caminho de script resolve fora de `workdir`, preflight é pulado para
  aquele arquivo.

## Config

- `tools.exec.notifyOnExit` (padrão: true): quando true, sessões exec em background enfileiram um evento de sistema e solicitam um heartbeat ao sair.
- `tools.exec.approvalRunningNoticeMs` (padrão: 10000): emitir um único aviso "running" quando um exec controlado por aprovação rodar mais tempo que isso (0 desabilita).
- `tools.exec.host` (padrão: `sandbox`)
- `tools.exec.security` (padrão: `deny` para sandbox, `allowlist` para gateway + node quando não definido)
- `tools.exec.ask` (padrão: `on-miss`)
- `tools.exec.node` (padrão: não definido)
- `tools.exec.pathPrepend`: lista de diretórios para antepor ao `PATH` para execuções exec (somente gateway + sandbox).
- `tools.exec.safeBins`: binários seguros somente stdin que podem rodar sem entradas explícitas de allowlist. Para detalhes de comportamento, veja [Safe bins](/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: diretórios explícitos adicionais confiáveis para verificações de caminho de `safeBins`. Entradas de `PATH` nunca são auto-confiáveis. Padrões embutidos são `/bin` e `/usr/bin`.
- `tools.exec.safeBinProfiles`: política argv personalizada opcional por safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Exemplo:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Tratamento de PATH

- `host=gateway`: mescla seu `PATH` do shell de login no ambiente exec. Overrides de `env.PATH` são
  rejeitados para execução no host. O daemon em si ainda roda com um `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: roda `sh -lc` (shell de login) dentro do container, então `/etc/profile` pode redefinir `PATH`.
  O OpenCraft antepõe `env.PATH` após carregamento do perfil via variável de ambiente interna (sem interpolação shell);
  `tools.exec.pathPrepend` se aplica aqui também.
- `host=node`: apenas overrides de env não bloqueados que você passa são enviados ao node. Overrides de `env.PATH` são
  rejeitados para execução no host e ignorados pelos hosts de node. Se você precisa de entradas adicionais de PATH em um node,
  configure o ambiente do serviço do host de node (systemd/launchd) ou instale ferramentas em locais padrão.

Vinculação de node por agente (use o índice da lista de agentes na config):

```bash
opencraft config get agents.list
opencraft config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: a aba Nodes inclui um painel pequeno de "Vinculação de exec ao node" para as mesmas configurações.

## Overrides de sessão (`/exec`)

Use `/exec` para definir padrões **por sessão** para `host`, `security`, `ask` e `node`.
Envie `/exec` sem argumentos para mostrar os valores atuais.

Exemplo:

```
/exec host=gateway security=allowlist ask=on-miss node=mac-1
```

## Modelo de autorização

`/exec` é honrado apenas para **remetentes autorizados** (allowlists/emparelhamento de canal mais `commands.useAccessGroups`).
Ele atualiza **apenas o estado da sessão** e não escreve config. Para hard-disable do exec, negue-o via política de tool
(`tools.deny: ["exec"]` ou por agente). Aprovações do host ainda se aplicam a menos que você defina explicitamente
`security=full` e `ask=off`.

## Aprovações exec (app companheiro / host de node)

Agentes em sandbox podem requerer aprovação por requisição antes que `exec` rode no gateway ou host de node.
Veja [Aprovações exec](/tools/exec-approvals) para a política, allowlist e fluxo de UI.

Quando aprovações são necessárias, a tool exec retorna imediatamente com
`status: "approval-pending"` e um id de aprovação. Uma vez aprovado (ou negado / timeout),
o Gateway emite eventos de sistema (`Exec finalizado` / `Exec negado`). Se o comando ainda
estiver rodando após `tools.exec.approvalRunningNoticeMs`, um único aviso de `Exec rodando` é emitido.

## Allowlist + safe bins

Aplicação manual de allowlist corresponde **apenas caminhos binários resolvidos** (sem correspondências de basename). Quando
`security=allowlist`, comandos shell são auto-permitidos apenas se cada segmento de pipeline está na
allowlist ou é um safe bin. Encadeamento (`;`, `&&`, `||`) e redirecionamentos são rejeitados em
modo allowlist a menos que cada segmento de nível superior satisfaça a allowlist (incluindo safe bins).
Redirecionamentos permanecem sem suporte.

`autoAllowSkills` é um caminho de conveniência separado em aprovações exec. Não é o mesmo que
entradas manuais de allowlist de caminho. Para confiança explícita estrita, mantenha `autoAllowSkills` desabilitado.

Use os dois controles para trabalhos diferentes:

- `tools.exec.safeBins`: pequenos filtros de stream somente stdin.
- `tools.exec.safeBinTrustedDirs`: diretórios confiáveis explícitos extras para caminhos de executáveis safe-bin.
- `tools.exec.safeBinProfiles`: política argv explícita para safe bins personalizados.
- allowlist: confiança explícita para caminhos de executáveis.

Não trate `safeBins` como uma allowlist genérica, e não adicione binários de interpretador/runtime (por exemplo `python3`, `node`, `ruby`, `bash`). Se precisar deles, use entradas explícitas de allowlist e mantenha prompts de aprovação habilitados.
`opencraft security audit` avisa quando entradas de `safeBins` de interpretador/runtime não têm perfis explícitos, e `opencraft doctor --fix` pode criar entradas ausentes de `safeBinProfiles` personalizados.

Para detalhes completos de política e exemplos, veja [Aprovações exec](/tools/exec-approvals#safe-bins-stdin-only) e [Safe bins versus allowlist](/tools/exec-approvals#safe-bins-versus-allowlist).

## Exemplos

Foreground:

```json
{ "tool": "exec", "command": "ls -la" }
```

Background + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Enviar teclas (estilo tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Submit (enviar apenas CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Paste (entre colchetes por padrão):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "linha1\nlinha2\n" }
```

## apply_patch (experimental)

`apply_patch` é uma subtool de `exec` para edições estruturadas multi-arquivo.
Habilite explicitamente:

```json5
{
  tools: {
    exec: {
      applyPatch: { enabled: true, workspaceOnly: true, allowModels: ["gpt-5.2"] },
    },
  },
}
```

Notas:

- Disponível apenas para modelos OpenAI/OpenAI Codex.
- Política de tool ainda se aplica; `allow: ["exec"]` implicitamente permite `apply_patch`.
- Config fica em `tools.exec.applyPatch`.
- `tools.exec.applyPatch.workspaceOnly` padrão é `true` (contido no workspace). Defina como `false` apenas se você intencionalmente quer que `apply_patch` escreva/delete fora do diretório workspace.
