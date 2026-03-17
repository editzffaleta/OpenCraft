---
summary: "Skills: managed vs workspace, gating rules e config/env wiring"
read_when:
  - Adicionando ou modificando skills
  - Mudando skill gating ou load rules
title: "Skills"
---

# Skills (OpenCraft)

OpenCraft usa **[AgentSkills](https://agentskills.io)-compatível** skill folders para ensinar o agente como usar tools. Cada skill é um diretório contendo um `SKILL.md` com YAML frontmatter e instruções. OpenCraft carrega **bundled skills** mais local overrides opcionais e filtra eles em load time baseado em environment, config e binary presence.

## Localizações e precedência

Skills são carregadas de **três** lugares:

1. **Bundled skills**: shipped com o install (npm package ou OpenCraft.app)
2. **Managed/local skills**: `~/.opencraft/skills`
3. **Workspace skills**: `<workspace>/skills`

Se um nome de skill conflita, precedência é:

`<workspace>/skills` (mais alto) → `~/.opencraft/skills` → bundled skills (mais baixo)

Adicionalmente, você pode configurar extra skill folders (mais baixa precedência) via
`skills.load.extraDirs` em `~/.editzffaleta/OpenCraft.json`.

## Per-agent vs shared skills

Em setups **multi-agent**, cada agente tem seu próprio workspace. Isto significa:

- **Per-agent skills** vivem em `<workspace>/skills` para apenas aquele agente.
- **Shared skills** vivem em `~/.opencraft/skills` (managed/local) e são visíveis para **todos agentes** na mesma máquina.
- **Shared folders** também podem ser adicionadas via `skills.load.extraDirs` (mais baixa precedência) se você quer um common skills pack usado por múltiplos agentes.

Se o mesmo nome de skill existe em mais de um lugar, a usual precedência se aplica: workspace wins, depois managed/local, depois bundled.

## Plugins + skills

Plugins podem ship seus próprios skills listando diretórios `skills` em `opencraft.plugin.json` (paths relativos ao plugin root). Plugin skills carregam quando o plugin está habilitado e participam das normal skill precedence rules.
Você pode gateá-los via `metadata.opencraft.requires.config` na plugin's config entry. Veja [Plugins](/tools/plugin) para discovery/config e [Tools](/tools) para a tool surface aqueles skills ensinam.

## ClawHub (install + sync)

ClawHub é o public skills registry para OpenCraft. Navegue em [https://clawhub.com](https://clawhub.com). Use-o para descobrir, instalar, atualizar e fazer backup de skills.
Guia completo: [ClawHub](/tools/clawhub).

Fluxos comuns:

- Instale um skill em seu workspace:
  - `clawhub install <skill-slug>`
- Atualize todos os installed skills:
  - `clawhub update --all`
- Sync (scan + publish updates):
  - `clawhub sync --all`

Por padrão, `clawhub` instala em `./skills` sob seu diretório de trabalho atual (ou cai para o OpenCraft workspace configurado). OpenCraft pega aquilo como `<workspace>/skills` na próxima sessão.

## Notas de segurança

- Trate third-party skills como **código não confiável**. Leia eles antes de habilitar.
- Prefira runs sandboxed para inputs não confiáveis e tools risky. Veja [Sandboxing](/gateway/sandboxing).
- Workspace e extra-dir skill discovery apenas aceitam skill roots e arquivos `SKILL.md` cujo resolved realpath fica dentro do configured root.
- `skills.entries.*.env` e `skills.entries.*.apiKey` injetam secrets no **host** process para aquele agent turn (não o sandbox). Mantenha secrets fora de prompts e logs.
- Para um broader threat model e checklists, veja [Security](/gateway/security).

## Format (AgentSkills + Pi-compatível)

`SKILL.md` deve incluir pelo menos:

```markdown
---
name: nano-banana-pro
description: Generate or edit images via Gemini 3 Pro Image
---
```

Notas:

- Nós seguimos o AgentSkills spec para layout/intent.
- O parser usado pelo embedded agent suporta **single-line** frontmatter keys apenas.
- `metadata` deve ser um **single-line JSON object**.
- Use `{baseDir}` em instruções para referenciar o skill folder path.
- Frontmatter keys opcionais:
  - `homepage` — URL surfaced como "Website" na macOS Skills UI (também suportado via `metadata.opencraft.homepage`).
  - `user-invocable` — `true|false` (padrão: `true`). Quando `true`, o skill é exposto como um user slash command.
  - `disable-model-invocation` — `true|false` (padrão: `false`). Quando `true`, o skill é excluído do model prompt (ainda disponível via user invocation).
  - `command-dispatch` — `tool` (opcional). Quando definido para `tool`, o slash command bypassa o model e dispatch diretamente a um tool.
  - `command-tool` — tool name para invocar quando `command-dispatch: tool` está definido.
  - `command-arg-mode` — `raw` (padrão). Para tool dispatch, forward os raw args string ao tool (sem core parsing).

    O tool é invocado com params:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (load-time filters)

OpenCraft **filtra skills em load time** usando `metadata` (single-line JSON):

```markdown
---
name: nano-banana-pro
description: Generate or edit images via Gemini 3 Pro Image
metadata:
  {
    "opencraft":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

Fields sob `metadata.opencraft`:

- `always: true` — sempre inclua o skill (pule outros gates).
- `emoji` — opcional emoji usado pela macOS Skills UI.
- `homepage` — opcional URL mostrado como "Website" na macOS Skills UI.
- `os` — optional list de platforms (`darwin`, `linux`, `win32`). Se definido, o skill é apenas elegível em aqueles OSes.
- `requires.bins` — list; cada um deve existir em `PATH`.
- `requires.anyBins` — list; pelo menos um deve existir em `PATH`.
- `requires.env` — list; env var deve existir **ou** ser fornecido em config.
- `requires.config` — list de `opencraft.json` paths que devem ser truthy.
- `primaryEnv` — env var name associado com `skills.entries.<name>.apiKey`.
- `install` — optional array de installer specs usado pela macOS Skills UI (brew/node/go/uv/download).

Nota no sandboxing:

- `requires.bins` é checado no **host** em skill load time.
- Se um agente é sandboxed, o binário deve também existir **dentro do container**.
  Instale-o via `agents.defaults.sandbox.docker.setupCommand` (ou uma imagem custom).
  `setupCommand` executa uma vez depois que o container é criado.
  Package installs também requerem network egress, um writable root FS e um root user no sandbox.
  Exemplo: o `summarize` skill (`skills/summarize/SKILL.md`) precisa do `summarize` CLI
  no sandbox container para rodar lá.

Exemplo de installer:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "opencraft":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

Notas:

- Se múltiplos installers estão listados, o gateway pega uma **única** opção preferida (brew quando disponível, de outra forma node).
- Se todos installers são `download`, OpenCraft lista cada entrada então você pode ver os artifacts disponíveis.
- Installer specs podem incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opções por platform.
- Node installs honram `skills.install.nodeManager` em `opencraft.json` (padrão: npm; opções: npm/pnpm/yarn/bun).
  Isto apenas afeta **skill installs**; o Gateway runtime deve ainda ser Node (Bun não é recomendado para WhatsApp/Telegram).
- Go installs: se `go` está faltando e `brew` está disponível, o gateway instala Go via Homebrew primeiro e define `GOBIN` para Homebrew's `bin` quando possível.
- Download installs: `url` (required), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (padrão: auto quando archive detectado), `stripComponents`, `targetDir` (padrão: `~/.opencraft/tools/<skillKey>`).

Se nenhum `metadata.opencraft` está presente, o skill é sempre elegível (a menos que desabilitado em config ou bloqueado por `skills.allowBundled` para bundled skills).

## Config overrides (`~/.editzffaleta/OpenCraft.json`)

Bundled/managed skills podem ser toggled e fornecidos com env values:

```json5
{
  skills: {
    entries: {
      "nano-banana-pro": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Nota: se o nome de skill contém hyphens, quote a chave (JSON5 permite quoted keys).

Config keys correspondem ao **skill name** por padrão. Se um skill define `metadata.opencraft.skillKey`, use aquela chave sob `skills.entries`.

Regras:

- `enabled: false` desabilita o skill mesmo que ele seja bundled/installed.
- `env`: injetado **apenas se** a variável não está já definida no processo.
- `apiKey`: conveniência para skills que declaram `metadata.opencraft.primaryEnv`.
  Suporta plaintext string ou SecretRef object (`{ source, provider, id }`).
- `config`: optional bag para custom per-skill fields; custom keys devem ficar aqui.
- `allowBundled`: optional allowlist para **bundled** skills apenas. Se definido, apenas bundled skills na list são elegíveis (managed/workspace skills não afetados).

## Injeção de ambiente (per agent run)

Quando um agent run começa, OpenCraft:

1. Lê skill metadata.
2. Aplica qualquer `skills.entries.<key>.env` ou `skills.entries.<key>.apiKey` para `process.env`.
3. Constrói o system prompt com **elegível** skills.
4. Restaura o environment original depois que o run termina.

Isto é **scoped para o agent run**, não um global shell environment.

## Session snapshot (performance)

OpenCraft snapshots o **elegível** skills quando uma sessão começa e reutiliza aquela list para turns subsequentes na mesma sessão. Mudanças para skills ou config entram em efeito na próxima nova sessão.

Skills também podem refresh mid-session quando o skills watcher está habilitado ou quando um novo remote node elegível aparece (veja abaixo). Pense nisto como um **hot reload**: a list atualizada é pega no próximo agent turn.

## Remote macOS nodes (Linux gateway)

Se o Gateway está rodando em Linux mas um **macOS node** está conectado **com `system.run` permitido** (Exec approvals security não definido para `deny`), OpenCraft pode tratar macOS-only skills como elegíveis quando os binários requeridos estão presentes naquele node. O agente deve executar aqueles skills via o `nodes` tool (tipicamente `nodes.run`).

Isto depende do node reportando seu command support e em uma bin probe via `system.run`. Se o macOS node fica offline depois, as skills permanecem visíveis; invocações podem falhar até que o node reconecte.

## Skills watcher (auto-refresh)

Por padrão, OpenCraft observa skill folders e bumps o skills snapshot quando arquivos `SKILL.md` mudam. Configure isto sob `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Impacto de token (skills list)

Quando skills estão elegíveis, OpenCraft injeta uma compact XML list de available skills no system prompt (via `formatSkillsForPrompt` em `pi-coding-agent`). O custo é determinístico:

- **Base overhead (apenas quando ≥1 skill):** 195 caracteres.
- **Per skill:** 97 caracteres + o comprimento de XML-escaped `<name>`, `<description>` e `<location>` values.

Fórmula (caracteres):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Notas:

- XML escaping expande `& < > " '` em entities (`&amp;`, `&lt;`, etc.), aumentando comprimento.
- Token counts variam por model tokenizer. Uma rough OpenAI-style estimate é ~4 chars/token, então **97 chars ≈ 24 tokens** per skill mais seus field lengths atuais.

## Managed skills lifecycle

OpenCraft ships um baseline set de skills como **bundled skills** como parte do install (npm package ou OpenCraft.app). `~/.opencraft/skills` existe para local overrides (por exemplo, pinning/patching um skill sem mudar o bundled copy). Workspace skills são user-owned e override ambos em name conflicts.

## Config reference

Veja [Skills config](/tools/skills-config) para o schema de configuração completo.

## Procurando mais skills?

Navegue [https://clawhub.com](https://clawhub.com).

---
