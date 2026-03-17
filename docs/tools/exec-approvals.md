---
summary: "Aprovações exec, allowlists e prompts de escape de sandbox"
read_when:
  - Configurando aprovações exec ou allowlists
  - Implementando UX de aprovação exec no app macOS
  - Revisando prompts de escape de sandbox e implicações
title: "Aprovações Exec"
---

# Aprovações exec

Aprovações exec são a **proteção do aplicativo companion / node host** para permitir que um agente em sandbox execute
comandos em um host real (`gateway` ou `node`). Pense nisso como uma trava de segurança:
comandos são permitidos apenas quando política + allowlist + (opcional) aprovação do usuário todos concordam.
Aprovações exec são **adicionais** à política de ferramenta e gating elevado (a menos que elevado esteja definido como `full`, que pula aprovações).
A política efetiva é a **mais restritiva** entre `tools.exec.*` e padrões de aprovações; se um campo de aprovações for omitido, o valor de `tools.exec` é usado.

Se a UI do aplicativo companion **não** estiver disponível, qualquer requisição que requeira um prompt é
resolvida pelo **fallback de ask** (padrão: deny).

## Onde se aplica

Aprovações exec são aplicadas localmente no host de execução:

- **host do Gateway** -> processo `opencraft` na máquina do Gateway
- **node host** -> executador do node (aplicativo companion macOS ou node host headless)

Nota do modelo de confiança:

- Chamadores autenticados pelo Gateway são operadores confiáveis para aquele Gateway.
- Nodes pareados estendem essa capacidade de operador confiável para o node host.
- Aprovações exec reduzem risco de execução acidental, mas não são um limite de autenticação por usuário.
- Execuções aprovadas no node host vinculam contexto canônico de execução: cwd canônico, argv exato, env
  binding quando presente e caminho de executável fixado quando aplicável.
- Para scripts shell e invocações diretas de arquivo interpretador/runtime, o OpenCraft também tenta vincular
  um operando concreto de arquivo local. Se aquele arquivo vinculado mudar após aprovação mas antes da execução,
  a execução é negada em vez de executar conteúdo divergente.
- Esse vínculo de arquivo é intencionalmente melhor esforço, não um modelo semântico completo de cada
  caminho de loader de interpretador/runtime. Se o modo de aprovação não conseguir identificar exatamente um arquivo local concreto
  para vincular, ele recusa criar uma execução respaldada por aprovação em vez de fingir cobertura total.

Divisão macOS:

- **serviço node host** encaminha `system.run` para o **app macOS** via IPC local.
- **app macOS** aplica aprovações + executa o comando no contexto da UI.

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
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Controles de política

### Security (`exec.security`)

- **deny**: bloquear todas as requisições de exec no host.
- **allowlist**: permitir apenas comandos na allowlist.
- **full**: permitir tudo (equivalente a elevado).

### Ask (`exec.ask`)

- **off**: nunca solicitar.
- **on-miss**: solicitar apenas quando allowlist não corresponde.
- **always**: solicitar em cada comando.

### Ask fallback (`askFallback`)

Se um prompt é necessário mas nenhuma UI está acessível, fallback decide:

- **deny**: bloquear.
- **allowlist**: permitir apenas se allowlist corresponder.
- **full**: permitir.

## Allowlist (por agente)

Allowlists são **por agente**. Se múltiplos agentes existem, alterne qual agente você está
editando no app macOS. Padrões são **correspondência glob case-insensitive**.
Padrões devem resolver para **caminhos de binário** (entradas apenas com basename são ignoradas).
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

## Auto-permitir CLIs de Skill

Quando **Auto-permitir CLIs de Skill** está habilitado, executáveis referenciados por Skills conhecidas
são tratados como da allowlist em nodes (node macOS ou node host headless). Isso usa
`skills.bins` via RPC do Gateway para buscar a lista de binários de Skill. Desabilite isso se quiser allowlists manuais estritas.

Notas importantes de confiança:

- Esta é uma **allowlist de conveniência implícita**, separada de entradas manuais de allowlist de caminho.
- É destinada a ambientes de operador confiável onde Gateway e node estão no mesmo limite de confiança.
- Se você requer confiança explícita estrita, mantenha `autoAllowSkills: false` e use apenas entradas manuais de allowlist de caminho.

## Safe bins (somente stdin)

`tools.exec.safeBins` define uma pequena lista de binários **somente stdin** (por exemplo `jq`)
que podem rodar no modo allowlist **sem** entradas explícitas de allowlist. Safe bins rejeitam
argumentos posicionais de arquivo e tokens com aparência de caminho, então podem operar apenas no fluxo de entrada.
Trate isso como um caminho rápido estreito para filtros de fluxo, não uma lista de confiança geral.
**Não** adicione binários interpretadores ou runtime (por exemplo `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) a `safeBins`.
Se um comando pode avaliar código, executar subcomandos ou ler arquivos por design, prefira entradas explícitas de allowlist e mantenha prompts de aprovação habilitados.
Safe bins personalizados devem definir um perfil explícito em `tools.exec.safeBinProfiles.<bin>`.
A validação é determinística apenas a partir do formato do argv (sem verificações de existência no filesystem do host), o que
previne comportamento de oráculo de existência de arquivo por diferenças de permitir/negar.
Opções orientadas a arquivo são negadas para safe bins padrão (por exemplo `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Safe bins também aplicam política explícita de flag por binário para opções que quebram comportamento
somente stdin (por exemplo `sort -o/--output/--compress-program` e flags recursivas do grep).
Opções longas são validadas com fail-closed no modo safe-bin: flags desconhecidas e
abreviações ambíguas são rejeitadas.
Flags negadas por perfil safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins também forçam tokens argv a serem tratados como **texto literal** no momento da execução (sem globbing
e sem expansão `$VARS`) para segmentos somente stdin, então padrões como `*` ou `$HOME/...` não podem ser
usados para contrabandear leituras de arquivo.
Safe bins também devem resolver de diretórios de binários confiáveis (padrões do sistema mais
`tools.exec.safeBinTrustedDirs` opcionais). Entradas de `PATH` nunca são auto-confiáveis.
Diretórios padrão confiáveis de safe-bin são intencionalmente mínimos: `/bin`, `/usr/bin`.
Se seu executável safe-bin fica em caminhos de gerenciador de pacotes/usuário (por exemplo
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), adicione-os explicitamente
a `tools.exec.safeBinTrustedDirs`.
Encadeamento shell e redirecionamentos não são auto-permitidos no modo allowlist.

Encadeamento shell (`&&`, `||`, `;`) é permitido quando cada segmento de nível superior satisfaz a allowlist
(incluindo safe bins ou auto-allow de Skill). Redirecionamentos permanecem não suportados no modo allowlist.
Substituição de comando (`$()` / crases) é rejeitada durante parsing de allowlist, incluindo dentro
de aspas duplas; use aspas simples se precisar de texto literal `$()`.
Em aprovações do aplicativo companion macOS, texto shell bruto contendo sintaxe de controle ou expansão shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é tratado como miss de allowlist a menos que
o binário shell em si esteja na allowlist.
Para wrappers shell (`bash|sh|zsh ... -c/-lc`), substituições de env com escopo de requisição são reduzidas a uma
pequena allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Para decisões de sempre-permitir no modo allowlist, wrappers de despacho conhecidos
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos de executável interno em vez de caminhos
de wrapper. Multiplexadores shell (`busybox`, `toybox`) também são desembrulhados para applets shell (`sh`, `ash`,
etc.) então executáveis internos são persistidos em vez de binários multiplexadores. Se um wrapper ou
multiplexador não puder ser desembrulhado com segurança, nenhuma entrada de allowlist é persistida automaticamente.

Safe bins padrão: `jq`, `cut`, `uniq`, `head`, `tail`, `tr`, `wc`.

`grep` e `sort` não estão na lista padrão. Se optar por incluí-los, mantenha entradas explícitas de allowlist para
seus workflows não-stdin.
Para `grep` no modo safe-bin, forneça o padrão com `-e`/`--regexp`; forma de padrão posicional é
rejeitada para que operandos de arquivo não possam ser contrabandeados como posicionais ambíguos.

### Safe bins versus allowlist

| Tópico                  | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                      |
| ----------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| Objetivo                | Auto-permitir filtros estreitos de stdin               | Confiar explicitamente em executáveis específicos                      |
| Tipo de correspondência | Nome do executável + política argv safe-bin            | Padrão glob de caminho de executável resolvido                         |
| Escopo de argumento     | Restrito por perfil safe-bin e regras de Token literal | Correspondência de caminho apenas; argumentos são responsabilidade sua |
| Exemplos típicos        | `jq`, `head`, `tail`, `wc`                             | `python3`, `node`, `ffmpeg`, CLIs personalizados                       |
| Melhor uso              | Transformações de texto de baixo risco em pipelines    | Qualquer ferramenta com comportamento mais amplo ou efeitos colaterais |

Localização da configuração:

- `safeBins` vem da config (`tools.exec.safeBins` ou por agente `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` vem da config (`tools.exec.safeBinTrustedDirs` ou por agente `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` vem da config (`tools.exec.safeBinProfiles` ou por agente `agents.list[].tools.exec.safeBinProfiles`). Chaves de perfil por agente substituem chaves globais.
- Entradas de allowlist ficam no `~/.opencraft/exec-approvals.json` local do host em `agents.<id>.allowlist` (ou via Control UI / `opencraft approvals allowlist ...`).
- `opencraft security audit` avisa com `tools.exec.safe_bins_interpreter_unprofiled` quando binários interpretadores/runtime aparecem em `safeBins` sem perfis explícitos.
- `opencraft doctor --fix` pode criar scaffolds de entradas `safeBinProfiles.<bin>` personalizadas ausentes como `{}` (revise e reforce depois). Binários interpretadores/runtime não recebem scaffold automaticamente.

Exemplo de perfil personalizado:

```json5
{
  tools: {
    exec: {
      safeBins: ["jq", "myfilter"],
      safeBinProfiles: {
        myfilter: {
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

Use o card **Control UI -> Nodes -> Exec approvals** para editar padrões, substituições
por agente e allowlists. Escolha um escopo (Defaults ou um agente), ajuste a política,
adicione/remova padrões de allowlist, depois **Save**. A UI mostra metadados de **último uso**
por padrão para manter a lista organizada.

O seletor de alvo escolhe **Gateway** (aprovações locais) ou um **Node**. Nodes
devem anunciar `system.execApprovals.get/set` (app macOS ou node host headless).
Se um node ainda não anuncia aprovações exec, edite seu
`~/.opencraft/exec-approvals.json` local diretamente.

CLI: `opencraft approvals` suporta edição no Gateway ou node (veja [CLI de Aprovações](/cli/approvals)).

## Fluxo de aprovação

Quando um prompt é necessário, o Gateway difunde `exec.approval.requested` para clientes operadores.
A Control UI e o app macOS resolvem via `exec.approval.resolve`, depois o Gateway encaminha a
requisição aprovada para o node host.

Para `host=node`, requisições de aprovação incluem um payload canônico `systemRunPlan`. O Gateway usa
esse plano como o comando/cwd/contexto de sessão autoritativo ao encaminhar requisições `system.run` aprovadas.

## Comandos interpretador/runtime

Execuções respaldadas por aprovação de interpretador/runtime são intencionalmente conservadoras:

- Contexto exato de argv/cwd/env é sempre vinculado.
- Formas diretas de script shell e arquivo runtime direto são vinculadas por melhor esforço a um snapshot concreto
  de arquivo local.
- Formas comuns de wrapper de gerenciador de pacotes que ainda resolvem para um arquivo local direto (por exemplo
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) são desembrulhadas antes do vínculo.
- Se o OpenCraft não conseguir identificar exatamente um arquivo local concreto para um comando interpretador/runtime
  (por exemplo scripts de pacote, formas eval, cadeias de loader específicas do runtime ou formas ambíguas multi-arquivo),
  execução respaldada por aprovação é negada em vez de reivindicar cobertura semântica que não tem.
- Para esses workflows, prefira sandbox, um limite de host separado ou um workflow explícito de
  allowlist confiável/full onde o operador aceita a semântica mais ampla do runtime.

Quando aprovações são necessárias, a ferramenta exec retorna imediatamente com um id de aprovação. Use esse id para
correlacionar eventos de sistema posteriores (`Exec finished` / `Exec denied`). Se nenhuma decisão chegar antes do
timeout, a requisição é tratada como timeout de aprovação e apresentada como motivo de negação.

O diálogo de confirmação inclui:

- comando + args
- cwd
- id do agente
- caminho do executável resolvido
- host + metadados de política

Ações:

- **Permitir uma vez** -> executar agora
- **Sempre permitir** -> adicionar à allowlist + executar
- **Negar** -> bloquear

## Encaminhamento de aprovação para canais de chat

Você pode encaminhar prompts de aprovação exec para qualquer canal de chat (incluindo canais de Plugin) e aprová-los
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

Responda no chat:

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

### Clientes de aprovação de chat integrados

Discord e Telegram também podem atuar como clientes explícitos de aprovação exec com config específica de canal.

- Discord: `channels.discord.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Esses clientes são opt-in. Se um canal não tem aprovações exec habilitadas, o OpenCraft não trata
aquele canal como superfície de aprovação apenas porque a conversa aconteceu lá.

Comportamento compartilhado:

- apenas aprovadores configurados podem aprovar ou negar
- o solicitante não precisa ser um aprovador
- quando entrega de canal está habilitada, prompts de aprovação incluem o texto do comando
- se nenhuma UI de operador ou cliente de aprovação configurado pode aceitar a requisição, o prompt recorre ao `askFallback`

Telegram usa DMs de aprovador por padrão (`target: "dm"`). Você pode mudar para `channel` ou `both` quando
quiser que prompts de aprovação apareçam no chat/tópico Telegram de origem também. Para tópicos de fórum
Telegram, o OpenCraft preserva o tópico para o prompt de aprovação e o acompanhamento pós-aprovação.

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

- Modo de socket Unix `0600`, Token armazenado em `exec-approvals.json`.
- Verificação de peer mesmo-UID.
- Desafio/resposta (nonce + HMAC Token + hash de requisição) + TTL curto.

## Eventos de sistema

O ciclo de vida exec é apresentado como mensagens de sistema:

- `Exec running` (apenas se o comando exceder o limiar de aviso de execução)
- `Exec finished`
- `Exec denied`

Estes são postados na sessão do agente após o node reportar o evento.
Aprovações exec no host do Gateway emitem os mesmos eventos de ciclo de vida quando o comando termina (e opcionalmente quando rodando mais que o limiar).
Execs com gating de aprovação reutilizam o id de aprovação como `runId` nestas mensagens para fácil correlação.

## Implicações

- **full** é poderoso; prefira allowlists quando possível.
- **ask** mantém você informado enquanto ainda permite aprovações rápidas.
- Allowlists por agente previnem que aprovações de um agente vazem para outros.
- Aprovações se aplicam apenas a requisições de exec no host de **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência no nível de sessão para operadores autorizados e pula aprovações por design.
  Para bloquear exec no host permanentemente, defina security de aprovações como `deny` ou negue a ferramenta `exec` via política de ferramenta.

Relacionado:

- [Ferramenta exec](/tools/exec)
- [Modo elevado](/tools/elevated)
- [Skills](/tools/skills)
