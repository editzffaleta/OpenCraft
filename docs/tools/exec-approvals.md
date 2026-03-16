---
summary: "Aprovações de exec, allowlists e prompts de escape de sandbox"
read_when:
  - Configurando aprovações de exec ou allowlists
  - Implementando UX de aprovação de exec no app macOS
  - Revisando prompts de escape de sandbox e implicações
title: "Aprovações Exec"
---

# Aprovações exec

Aprovações exec são o **guardrail do app companheiro / host de node** para permitir que um agente em sandbox rode
comandos em um host real (`gateway` ou `node`). Pense nisso como um intertravamento de segurança:
comandos são permitidos apenas quando política + allowlist + (aprovação opcional do usuário) concordam.
Aprovações exec são **adicionais** à política de tool e gating elevado (a menos que elevado seja definido como `full`, que pula aprovações).
A política efetiva é a **mais restritiva** entre `tools.exec.*` e padrões de aprovações; se um campo de aprovações for omitido, o valor `tools.exec` é usado.

Se a UI do app companheiro **não estiver disponível**, qualquer requisição que requer um prompt é
resolvida pelo **fallback de ask** (padrão: deny).

## Onde se aplica

Aprovações exec são aplicadas localmente no host de execução:

- **Host do gateway** → processo `opencraft` na máquina gateway
- **Host de node** → runner de node (app companheiro macOS ou host de node headless)

Nota do modelo de confiança:

- Chamadores autenticados via Gateway são operadores confiáveis para aquele Gateway.
- Nodes emparelhados estendem essa capacidade de operador confiável para o host de node.
- Aprovações exec reduzem o risco de execução acidental, mas não são um limite de autenticação por usuário.
- Execuções aprovadas no host de node vinculam contexto de execução canônico: cwd canônico, argv exato, binding de env quando presente, e caminho de executável fixado quando aplicável.
- Para scripts shell e invocações diretas de arquivo interpretador/runtime, o OpenCraft também tenta vincular um operando de arquivo local concreto. Se esse arquivo vinculado mudar após a aprovação mas antes da execução, a execução é negada em vez de executar conteúdo alterado.
- Esse vínculo de arquivo é intencionalmente best-effort, não um modelo semântico completo de todo caminho de carregador interpretador/runtime. Se o modo de aprovação não consegue identificar exatamente um arquivo local concreto para vincular, ele recusa criar uma execução com respaldo de aprovação em vez de fingir cobertura completa.

Split macOS:

- O **serviço host de node** encaminha `system.run` para o **app macOS** via IPC local.
- O **app macOS** aplica aprovações + executa o comando no contexto da UI.

## Configurações e armazenamento

Aprovações ficam em um arquivo JSON local no host de execução:

`~/.opencraft/exec-approvals.json`

Exemplo de schema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.opencraft/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/usuario/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Configurações de política

### Security (`exec.security`)

- **deny**: bloquear todas as requisições de exec no host.
- **allowlist**: permitir apenas comandos na allowlist.
- **full**: permitir tudo (equivalente ao modo elevado).

### Ask (`exec.ask`)

- **off**: nunca solicitar.
- **on-miss**: solicitar apenas quando a allowlist não corresponde.
- **always**: solicitar em cada comando.

### Ask fallback (`askFallback`)

Se um prompt é necessário mas nenhuma UI está acessível, o fallback decide:

- **deny**: bloquear.
- **allowlist**: permitir apenas se a allowlist corresponde.
- **full**: permitir.

## Allowlist (por agente)

Allowlists são **por agente**. Se múltiplos agentes existem, mude qual agente você está
editando no app macOS. Padrões são **correspondências glob case-insensitive**.
Padrões devem resolver para **caminhos binários** (entradas apenas de basename são ignoradas).
Entradas legadas `agents.default` são migradas para `agents.main` no carregamento.

Exemplos:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Cada entrada de allowlist rastreia:

- **id** UUID estável usado para identidade na UI (opcional)
- **last used** timestamp
- **last used command**
- **last resolved path**

## Auto-permitir CLIs de skill

Quando **Auto-allow skill CLIs** está habilitado, executáveis referenciados por skills conhecidas
são tratados como na allowlist em nodes (node macOS ou host de node headless). Isso usa
`skills.bins` via RPC do Gateway para buscar a lista de bins de skill. Desabilite se quiser allowlists manuais estritas.

Notas importantes de confiança:

- Esta é uma **allowlist de conveniência implícita**, separada de entradas manuais de allowlist de caminho.
- Destinada a ambientes de operadores confiáveis onde Gateway e node estão no mesmo limite de confiança.
- Se você requer confiança explícita estrita, mantenha `autoAllowSkills: false` e use apenas entradas manuais de allowlist de caminho.

## Safe bins (somente stdin) {#safe-bins-stdin-only}

`tools.exec.safeBins` define uma pequena lista de binários **somente stdin** (por exemplo `jq`)
que podem rodar em modo allowlist **sem** entradas explícitas de allowlist. Safe bins rejeitam
args posicionais de arquivo e tokens semelhantes a caminhos, então eles só podem operar no stream de entrada.
Trate isso como um caminho rápido estreito para filtros de stream, não uma lista de confiança geral.
**Não** adicione binários de interpretador ou runtime (por exemplo `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) ao `safeBins`.
Se um comando pode avaliar código, executar subcomandos ou ler arquivos por design, prefira entradas explícitas de allowlist e mantenha prompts de aprovação habilitados.
Safe bins personalizados devem definir um perfil explícito em `tools.exec.safeBinProfiles.<bin>`.
A validação é determinística apenas a partir da forma do argv (sem verificações de existência no filesystem do host), o que
previne comportamento de oracle de existência de arquivo a partir de diferenças de allow/deny.
Opções orientadas a arquivo são negadas para safe bins padrão (por exemplo `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Safe bins também aplicam política explícita de flag por binário para opções que quebram o
comportamento somente stdin (por exemplo `sort -o/--output/--compress-program` e flags recursivas do grep).
Opções longas são validadas com fail-closed no modo safe-bin: flags desconhecidas e
abreviações ambíguas são rejeitadas.
Flags negadas por perfil de safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins também forçam que tokens argv sejam tratados como **texto literal** no momento da execução (sem globbing
e sem expansão de `$VARS`) para segmentos somente stdin, então padrões como `*` ou `$HOME/...` não podem ser
usados para contrabandear leituras de arquivo.
Safe bins também devem resolver a partir de diretórios binários confiáveis (padrões do sistema mais
`tools.exec.safeBinTrustedDirs` opcional). Entradas de `PATH` nunca são auto-confiáveis.
Diretórios padrão confiáveis de safe-bin são intencionalmente mínimos: `/bin`, `/usr/bin`.
Se seu executável safe-bin fica em caminhos de gerenciador de pacotes/usuário (por exemplo
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), adicione-os explicitamente
a `tools.exec.safeBinTrustedDirs`.
Encadeamento de shell e redirecionamentos não são auto-permitidos no modo allowlist.

Encadeamento de shell (`&&`, `||`, `;`) é permitido quando cada segmento de nível superior satisfaz a allowlist
(incluindo safe bins ou auto-permit de skill). Redirecionamentos permanecem não suportados no modo allowlist.
Substituição de comando (`$()` / backticks) é rejeitada durante a análise de allowlist, incluindo dentro de
aspas duplas; use aspas simples se precisar de texto literal `$()`.
Em aprovações do app companheiro macOS, texto shell bruto contendo sintaxe de controle ou expansão de shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é tratado como miss de allowlist a menos que
o binário de shell em si esteja na allowlist.
Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), overrides de env com escopo de requisição são reduzidos a
uma allowlist explícita pequena (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Para decisões always-allow no modo allowlist, wrappers de dispatch conhecidos
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos de executável interno em vez de caminhos de wrapper.
Multiplexadores de shell (`busybox`, `toybox`) também são desembrulhados para applets de shell (`sh`, `ash`,
etc.) para que executáveis internos sejam persistidos em vez de binários de multiplexador. Se um wrapper ou
multiplexador não puder ser seguramente desembrulhado, nenhuma entrada de allowlist é persistida automaticamente.

Safe bins padrão: `jq`, `cut`, `uniq`, `head`, `tail`, `tr`, `wc`.

`grep` e `sort` não estão na lista padrão. Se você optar por incluí-los, mantenha entradas explícitas de allowlist
para seus fluxos de trabalho não-stdin.
Para `grep` em modo safe-bin, forneça o padrão com `-e`/`--regexp`; a forma de padrão posicional é
rejeitada para que operandos de arquivo não possam ser contrabandeados como posicionais ambíguos.

### Safe bins versus allowlist {#safe-bins-versus-allowlist}

| Tópico              | `tools.exec.safeBins`                                   | Allowlist (`exec-approvals.json`)                           |
| ------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| Objetivo            | Auto-permitir filtros stdin estreitos                   | Confiar explicitamente em executáveis específicos           |
| Tipo de correspondência | Nome de executável + política argv de safe-bin      | Padrão glob de caminho de executável resolvido              |
| Escopo de argumento | Restrito por perfil safe-bin e regras de token literal  | Apenas correspondência de caminho; argumentos são sua responsabilidade |
| Exemplos típicos    | `jq`, `head`, `tail`, `wc`                              | `python3`, `node`, `ffmpeg`, CLIs personalizadas           |
| Melhor uso          | Transformações de texto de baixo risco em pipelines    | Qualquer tool com comportamento mais amplo ou efeitos colaterais |

Local de configuração:

- `safeBins` vem da config (`tools.exec.safeBins` ou por agente `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` vem da config (`tools.exec.safeBinTrustedDirs` ou por agente `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` vem da config (`tools.exec.safeBinProfiles` ou por agente `agents.list[].tools.exec.safeBinProfiles`). Chaves de perfil por agente sobrescrevem chaves globais.
- Entradas de allowlist ficam em `~/.opencraft/exec-approvals.json` local do host em `agents.<id>.allowlist` (ou via Control UI / `opencraft approvals allowlist ...`).
- `opencraft security audit` avisa com `tools.exec.safe_bins_interpreter_unprofiled` quando bins de interpretador/runtime aparecem em `safeBins` sem perfis explícitos.
- `opencraft doctor --fix` pode criar entradas ausentes de `safeBinProfiles.<bin>` personalizados como `{}` (revise e restrinja depois). Bins de interpretador/runtime não são auto-criados.

Exemplo de perfil personalizado:

```json5
{
  tools: {
    exec: {
      safeBins: ["jq", "meufilter"],
      safeBinProfiles: {
        meufilter: {
          minPositional: 0,
          maxPositional: 0,
          allowedValueFlags: ["-n", "--limit"],
          deniedFlags: ["-f", "--file", "-c", "--command"],
        },
      },
    },
  },
}
```

## Edição na Control UI

Use o card **Control UI → Nodes → Exec approvals** para editar padrões, overrides por agente
e allowlists. Escolha um escopo (Padrões ou um agente), ajuste a política,
adicione/remova padrões de allowlist, depois **Salve**. A UI mostra metadados de **last used**
por padrão para que você mantenha a lista organizada.

O seletor de alvo escolhe **Gateway** (aprovações locais) ou um **Node**. Nodes
devem anunciar `system.execApprovals.get/set` (app macOS ou host de node headless).
Se um node não anunciar exec approvals ainda, edite seu
`~/.opencraft/exec-approvals.json` local diretamente.

CLI: `opencraft approvals` suporta edição no gateway ou node (veja [CLI de Aprovações](/cli/approvals)).

## Fluxo de aprovação

Quando um prompt é necessário, o gateway transmite `exec.approval.requested` para clientes operadores.
A Control UI e o app macOS o resolvem via `exec.approval.resolve`, depois o gateway encaminha a
requisição aprovada para o host de node.

Para `host=node`, requisições de aprovação incluem um payload `systemRunPlan` canônico. O gateway usa
esse plano como o contexto de comando/cwd/sessão autoritativo quando encaminha requisições aprovadas de `system.run`.

## Comandos de interpretador/runtime

Execuções com respaldo de aprovação de interpretador/runtime são intencionalmente conservadoras:

- Contexto exato de argv/cwd/env é sempre vinculado.
- Formas de script shell direto e arquivo runtime direto são vinculadas best-effort a um snapshot de arquivo local concreto.
- Formas comuns de wrapper de gerenciador de pacotes que ainda resolvem para um arquivo local direto (por exemplo
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) são desembrulhadas antes do vínculo.
- Se o OpenCraft não consegue identificar exatamente um arquivo local concreto para um comando interpretador/runtime
  (por exemplo scripts de pacote, formas eval, cadeias de carregador específicas de runtime, ou formas ambíguas de múltiplos arquivos),
  execução com respaldo de aprovação é negada em vez de afirmar cobertura semântica que não tem.
- Para esses fluxos de trabalho, prefira sandboxing, um limite de host separado, ou um fluxo explícito de allowlist/full confiável onde o operador aceita a semântica mais ampla de runtime.

Quando aprovações são necessárias, a tool exec retorna imediatamente com um id de aprovação. Use esse id para
correlacionar eventos de sistema posteriores (`Exec finalizado` / `Exec negado`). Se nenhuma decisão chegar antes do
timeout, a requisição é tratada como timeout de aprovação e apresentada como motivo de negação.

O diálogo de confirmação inclui:

- comando + args
- cwd
- id do agente
- caminho de executável resolvido
- metadados de host + política

Ações:

- **Permitir uma vez** → executar agora
- **Sempre permitir** → adicionar à allowlist + executar
- **Negar** → bloquear

## Encaminhamento de aprovação para canais de chat

Você pode encaminhar prompts de aprovação exec para qualquer canal de chat (incluindo canais de plugin) e aprová-los
com `/approve`. Isso usa o pipeline normal de entrega de saída.

Config:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // substring ou regex
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

Resposta no chat:

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

### Clientes de aprovação de chat embutidos

Discord e Telegram também podem atuar como clientes explícitos de aprovação exec com config específica de canal.

- Discord: `channels.discord.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Esses clientes são opt-in. Se um canal não tem aprovações exec habilitadas, o OpenCraft não trata
aquele canal como superfície de aprovação apenas porque a conversa aconteceu lá.

Comportamento compartilhado:

- apenas aprovadores configurados podem aprovar ou negar
- o solicitante não precisa ser um aprovador
- quando entrega via canal está habilitada, prompts de aprovação incluem o texto do comando
- se nenhuma UI de operador ou cliente de aprovação configurado pode aceitar a requisição, o prompt recai para `askFallback`

O Telegram padrão é DMs de aprovador (`target: "dm"`). Você pode mudar para `channel` ou `both` quando
quer que prompts de aprovação apareçam também no chat/tópico Telegram de origem. Para tópicos de fórum Telegram,
o OpenCraft preserva o tópico para o prompt de aprovação e o follow-up pós-aprovação.

Veja:

- [Discord](/channels/discord#exec-approvals-in-discord)
- [Telegram](/channels/telegram#exec-approvals-in-telegram)

### Fluxo IPC macOS

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + approvals + system.run)
```

Notas de segurança:

- Modo do socket Unix `0600`, token armazenado em `exec-approvals.json`.
- Verificação de peer com mesmo UID.
- Challenge/response (nonce + HMAC token + hash da requisição) + TTL curto.

## Eventos de sistema

O ciclo de vida do exec é apresentado como mensagens de sistema:

- `Exec running` (apenas se o comando exceder o limite de aviso de execução)
- `Exec finished`
- `Exec denied`

Esses são postados na sessão do agente após o node reportar o evento.
Aprovações exec no host do gateway emitem os mesmos eventos de ciclo de vida quando o comando termina (e opcionalmente quando rodando mais tempo que o limite).
Execs com gate de aprovação reutilizam o id de aprovação como `runId` nessas mensagens para fácil correlação.

## Implicações

- **full** é poderoso; prefira allowlists quando possível.
- **ask** mantém você no loop enquanto ainda permite aprovações rápidas.
- Allowlists por agente evitam que aprovações de um agente vazem para outros.
- Aprovações só se aplicam a requisições de exec no host de **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência de nível de sessão para operadores autorizados e pula aprovações por design.
  Para bloquear permanentemente exec no host, defina a segurança de aprovações como `deny` ou negue a tool `exec` via política de tool.

Relacionado:

- [Tool exec](/tools/exec)
- [Modo Elevado](/tools/elevated)
- [Skills](/tools/skills)
