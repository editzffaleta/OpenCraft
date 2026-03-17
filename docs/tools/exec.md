---
summary: "Uso da ferramenta exec, modos de stdin e suporte a TTY"
read_when:
  - Usando ou modificando a ferramenta exec
  - Depurando comportamento de stdin ou TTY
title: "Ferramenta Exec"
---

# Ferramenta exec

Execute comandos shell no workspace. Suporta execução em primeiro plano + segundo plano via `process`.
Se `process` não for permitido, `exec` executa de forma síncrona e ignora `yieldMs`/`background`.
Sessões em segundo plano são com escopo por agente; `process` só vê sessões do mesmo agente.

## Parâmetros

- `command` (obrigatório)
- `workdir` (padrão: cwd)
- `env` (substituições chave/valor)
- `yieldMs` (padrão 10000): colocar em segundo plano automaticamente após atraso
- `background` (bool): colocar em segundo plano imediatamente
- `timeout` (segundos, padrão 1800): encerrar ao expirar
- `pty` (bool): executar em pseudo-terminal quando disponível (CLIs apenas TTY, agentes de codificação, UIs de terminal)
- `host` (`sandbox | gateway | node`): onde executar
- `security` (`deny | allowlist | full`): modo de aplicação para `gateway`/`node`
- `ask` (`off | on-miss | always`): prompts de aprovação para `gateway`/`node`
- `node` (string): id/nome do node para `host=node`
- `elevated` (bool): solicitar modo elevado (host do Gateway); `security=full` só é forçado quando elevado resolve para `full`

Notas:

- `host` é `sandbox` por padrão.
- `elevated` é ignorado quando sandbox está desligado (exec já roda no host).
- Aprovações de `gateway`/`node` são controladas por `~/.opencraft/exec-approvals.json`.
- `node` requer um node pareado (aplicativo companion ou node host headless).
- Se múltiplos nodes estiverem disponíveis, defina `exec.node` ou `tools.exec.node` para selecionar um.
- Em hosts não-Windows, exec usa `SHELL` quando definido; se `SHELL` for `fish`, ele prefere `bash` (ou `sh`)
  do `PATH` para evitar scripts incompatíveis com fish, depois recorre ao `SHELL` se nenhum existir.
- Em hosts Windows, exec prefere descoberta do PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, depois PATH),
  depois recorre ao Windows PowerShell 5.1.
- Execução no host (`gateway`/`node`) rejeita `env.PATH` e substituições de loader (`LD_*`/`DYLD_*`) para
  prevenir sequestro de binários ou código injetado.
- O OpenCraft define `OPENCRAFT_SHELL=exec` no ambiente do comando iniciado (incluindo execução PTY e sandbox) para que regras de shell/profile possam detectar contexto de ferramenta exec.
- Importante: sandbox está **desligado por padrão**. Se sandbox estiver desligado e `host=sandbox` for explicitamente
  configurado/solicitado, exec agora falha fechado em vez de executar silenciosamente no host do Gateway.
  Habilite sandbox ou use `host=gateway` com aprovações.
- Verificações de preflight de scripts (para erros comuns de sintaxe shell Python/Node) só inspecionam arquivos dentro do
  limite efetivo do `workdir`. Se um caminho de script resolver fora do `workdir`, preflight é pulado para
  aquele arquivo.

## Config

- `tools.exec.notifyOnExit` (padrão: true): quando true, sessões exec em segundo plano enfileiram um evento de sistema e solicitam um heartbeat na saída.
- `tools.exec.approvalRunningNoticeMs` (padrão: 10000): emitir um único aviso "running" quando um exec com aprovação roda mais que isso (0 desabilita).
- `tools.exec.host` (padrão: `sandbox`)
- `tools.exec.security` (padrão: `deny` para sandbox, `allowlist` para Gateway + node quando não definido)
- `tools.exec.ask` (padrão: `on-miss`)
- `tools.exec.node` (padrão: não definido)
- `tools.exec.pathPrepend`: lista de diretórios para prepend ao `PATH` para execuções exec (apenas Gateway + sandbox).
- `tools.exec.safeBins`: binários seguros somente stdin que podem rodar sem entradas explícitas de allowlist. Para detalhes de comportamento, veja [Safe bins](/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: diretórios adicionais explícitos confiáveis para verificações de caminho de `safeBins`. Entradas de `PATH` nunca são auto-confiáveis. Padrões integrados são `/bin` e `/usr/bin`.
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

- `host=gateway`: mescla seu `PATH` do shell de login no ambiente exec. Substituições `env.PATH` são
  rejeitadas para execução no host. O daemon em si ainda roda com um `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: executa `sh -lc` (shell de login) dentro do container, então `/etc/profile` pode resetar o `PATH`.
  O OpenCraft faz prepend de `env.PATH` após sourcing do profile via variável env interna (sem interpolação shell);
  `tools.exec.pathPrepend` se aplica aqui também.
- `host=node`: apenas substituições de env não bloqueadas que você passa são enviadas ao node. Substituições `env.PATH` são
  rejeitadas para execução no host e ignoradas por node hosts. Se você precisar de entradas PATH adicionais em um node,
  configure o ambiente do serviço node host (systemd/launchd) ou instale ferramentas em localizações padrão.

Binding de node por agente (use o índice da lista de agentes na config):

```bash
opencraft config get agents.list
opencraft config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: a aba Nodes inclui um pequeno painel "Exec node binding" para as mesmas configurações.

## Substituições de sessão (`/exec`)

Use `/exec` para definir padrões **por sessão** para `host`, `security`, `ask` e `node`.
Envie `/exec` sem argumentos para mostrar os valores atuais.

Exemplo:

```
/exec host=gateway security=allowlist ask=on-miss node=mac-1
```

## Modelo de autorização

`/exec` só é honrado para **remetentes autorizados** (allowlists/pareamento de canal mais `commands.useAccessGroups`).
Atualiza apenas o **estado da sessão** e não escreve config. Para desabilitar exec permanentemente, negue via política
de ferramenta (`tools.deny: ["exec"]` ou por agente). Aprovações de host ainda se aplicam a menos que você explicitamente defina
`security=full` e `ask=off`.

## Aprovações exec (aplicativo companion / node host)

Agentes em sandbox podem exigir aprovação por requisição antes que `exec` rode no host do Gateway ou node.
Veja [Aprovações exec](/tools/exec-approvals) para a política, allowlist e fluxo de UI.

Quando aprovações são necessárias, a ferramenta exec retorna imediatamente com
`status: "approval-pending"` e um id de aprovação. Uma vez aprovado (ou negado / expirado),
o Gateway emite eventos de sistema (`Exec finished` / `Exec denied`). Se o comando ainda estiver
rodando após `tools.exec.approvalRunningNoticeMs`, um único aviso `Exec running` é emitido.

## Allowlist + safe bins

Aplicação de allowlist manual corresponde apenas a **caminhos de binários resolvidos** (sem correspondência por basename). Quando
`security=allowlist`, comandos shell são auto-permitidos apenas se cada segmento do pipeline for
da allowlist ou um safe bin. Encadeamento (`;`, `&&`, `||`) e redirecionamentos são rejeitados no
modo allowlist a menos que cada segmento de nível superior satisfaça a allowlist (incluindo safe bins).
Redirecionamentos permanecem não suportados.

`autoAllowSkills` é um caminho de conveniência separado nas aprovações exec. Não é o mesmo que
entradas manuais de allowlist de caminho. Para confiança explícita rigorosa, mantenha `autoAllowSkills` desabilitado.

Use os dois controles para trabalhos diferentes:

- `tools.exec.safeBins`: filtros de fluxo pequenos, somente stdin.
- `tools.exec.safeBinTrustedDirs`: diretórios confiáveis extras explícitos para caminhos de executáveis safe-bin.
- `tools.exec.safeBinProfiles`: política argv explícita para safe bins personalizados.
- allowlist: confiança explícita para caminhos de executáveis.

Não trate `safeBins` como uma allowlist genérica, e não adicione binários interpretadores/runtime (por exemplo `python3`, `node`, `ruby`, `bash`). Se precisar desses, use entradas explícitas de allowlist e mantenha prompts de aprovação habilitados.
`opencraft security audit` avisa quando entradas de `safeBins` de interpretadores/runtime estão faltando perfis explícitos, e `opencraft doctor --fix` pode criar scaffolds de entradas `safeBinProfiles` personalizadas ausentes.

Para detalhes completos de política e exemplos, veja [Aprovações exec](/tools/exec-approvals#safe-bins-stdin-only) e [Safe bins versus allowlist](/tools/exec-approvals#safe-bins-versus-allowlist).

## Exemplos

Primeiro plano:

```json
{ "tool": "exec", "command": "ls -la" }
```

Segundo plano + poll:

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

Colar (bracketed por padrão):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch (experimental)

`apply_patch` é uma sub-ferramenta de `exec` para edições estruturadas de múltiplos arquivos.
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
- Política de ferramenta ainda se aplica; `allow: ["exec"]` implicitamente permite `apply_patch`.
- Config fica em `tools.exec.applyPatch`.
- `tools.exec.applyPatch.workspaceOnly` é `true` por padrão (contido no workspace). Defina como `false` apenas se você intencionalmente quiser que `apply_patch` escreva/exclua fora do diretório do workspace.
