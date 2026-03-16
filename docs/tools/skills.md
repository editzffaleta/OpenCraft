---
summary: "Skills: gerenciadas vs workspace, regras de filtro e conexão config/env"
read_when:
  - Adicionando ou modificando skills
  - Alterando filtros ou regras de carregamento de skill
title: "Skills"
---

# Skills (OpenCraft)

O OpenCraft usa pastas de skill compatíveis com **[AgentSkills](https://agentskills.io)** para ensinar ao agente como usar as tools. Cada skill é um diretório contendo um `SKILL.md` com frontmatter YAML e instruções. O OpenCraft carrega **skills embutidas** mais overrides locais opcionais, e as filtra no carregamento com base em ambiente, config e presença de binários.

## Locais e precedência

Skills são carregadas de **três** lugares:

1. **Skills embutidas**: enviadas com a instalação (pacote npm ou OpenCraft.app)
2. **Skills gerenciadas/locais**: `~/.opencraft/skills`
3. **Skills do workspace**: `<workspace>/skills`

Se um nome de skill conflitar, a precedência é:

`<workspace>/skills` (mais alta) → `~/.opencraft/skills` → skills embutidas (mais baixa)

Adicionalmente, você pode configurar pastas extras de skill (precedência mais baixa) via
`skills.load.extraDirs` em `~/.opencraft/opencraft.json`.

## Skills por agente vs compartilhadas

Em configurações **multi-agente**, cada agente tem seu próprio workspace. Isso significa:

- **Skills por agente** ficam em `<workspace>/skills` apenas para aquele agente.
- **Skills compartilhadas** ficam em `~/.opencraft/skills` (gerenciadas/locais) e são visíveis
  para **todos os agentes** na mesma máquina.
- **Pastas compartilhadas** também podem ser adicionadas via `skills.load.extraDirs` (menor
  precedência) se você quiser um pacote comum de skills usado por múltiplos agentes.

Se o mesmo nome de skill existe em mais de um lugar, a precedência usual se aplica:
workspace vence, depois gerenciada/local, depois embutida.

## Plugins + skills

Plugins podem incluir suas próprias skills listando diretórios `skills` em
`openclaw.plugin.json` (caminhos relativos à raiz do plugin). Skills de plugin carregam
quando o plugin está habilitado e participam das regras normais de precedência de skill.
Você pode filtrá-las via `metadata.openclaw.requires.config` na entrada de config do plugin.
Veja [Plugins](/tools/plugin) para descoberta/config e [Tools](/tools) para a
superfície de tools que aquelas skills ensinam.

## ClawHub (instalação + sincronização)

ClawHub é o registro público de skills para o OpenCraft. Explore em
[https://clawhub.com](https://clawhub.com). Use-o para descobrir, instalar, atualizar e fazer backup de skills.
Guia completo: [ClawHub](/tools/clawhub).

Fluxos comuns:

- Instalar uma skill no seu workspace:
  - `clawhub install <skill-slug>`
- Atualizar todas as skills instaladas:
  - `clawhub update --all`
- Sincronizar (escanear + publicar atualizações):
  - `clawhub sync --all`

Por padrão, `clawhub` instala em `./skills` no seu diretório de trabalho atual
(ou volta para o workspace OpenCraft configurado). O OpenCraft captura isso como `<workspace>/skills` na próxima sessão.

## Notas de segurança

- Trate skills de terceiros como **código não confiável**. Leia-as antes de habilitar.
- Prefira execuções em sandbox para entradas não confiáveis e tools arriscadas. Veja [Sandboxing](/gateway/sandboxing).
- Descoberta de skill em workspace e em dirs extras só aceita raízes de skill e arquivos `SKILL.md` cujo realpath resolvido fique dentro da raiz configurada.
- `skills.entries.*.env` e `skills.entries.*.apiKey` injetam secrets no processo **host**
  para aquele turno do agente (não no sandbox). Mantenha secrets fora de prompts e logs.
- Para um modelo de ameaça mais amplo e checklists, veja [Segurança](/gateway/security).

## Formato (compatível com AgentSkills + Pi)

`SKILL.md` deve incluir pelo menos:

```markdown
---
name: nano-banana-pro
description: Generate or edit images via Gemini 3 Pro Image
---
```

Notas:

- Seguimos a spec AgentSkills para layout/intenção.
- O parser usado pelo agente embutido suporta apenas chaves de frontmatter **de linha única**.
- `metadata` deve ser um **objeto JSON de linha única**.
- Use `{baseDir}` nas instruções para referenciar o caminho da pasta de skill.
- Chaves de frontmatter opcionais:
  - `homepage` — URL exibida como "Website" na UI de Skills do macOS (também suportada via `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (padrão: `true`). Quando `true`, a skill é exposta como um slash command do usuário.
  - `disable-model-invocation` — `true|false` (padrão: `false`). Quando `true`, a skill é excluída do prompt do modelo (ainda disponível via invocação do usuário).
  - `command-dispatch` — `tool` (opcional). Quando definido como `tool`, o slash command ignora o modelo e despacha diretamente para uma tool.
  - `command-tool` — nome da tool a invocar quando `command-dispatch: tool` está definido.
  - `command-arg-mode` — `raw` (padrão). Para despacho de tool, encaminha a string bruta de args para a tool (sem análise principal).

    A tool é invocada com params:
    `{ command: "<args brutos>", commandName: "<slash command>", skillName: "<nome da skill>" }`.

## Filtros (filtros no carregamento)

O OpenCraft **filtra skills no carregamento** usando `metadata` (JSON de linha única):

```markdown
---
name: nano-banana-pro
description: Generate or edit images via Gemini 3 Pro Image
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

Campos em `metadata.openclaw`:

- `always: true` — sempre incluir a skill (pular outros filtros).
- `emoji` — emoji opcional usado pela UI de Skills do macOS.
- `homepage` — URL opcional exibida como "Website" na UI de Skills do macOS.
- `os` — lista opcional de plataformas (`darwin`, `linux`, `win32`). Se definido, a skill só é elegível naqueles SOs.
- `requires.bins` — lista; cada um deve existir no `PATH`.
- `requires.anyBins` — lista; pelo menos um deve existir no `PATH`.
- `requires.env` — lista; var de ambiente deve existir **ou** ser fornecida na config.
- `requires.config` — lista de caminhos `opencraft.json` que devem ser truthy.
- `primaryEnv` — nome da var de ambiente associada a `skills.entries.<name>.apiKey`.
- `install` — array opcional de specs de instalador usado pela UI de Skills do macOS (brew/node/go/uv/download).

Nota sobre sandboxing:

- `requires.bins` é verificado no **host** no carregamento da skill.
- Se um agente está em sandbox, o binário também deve existir **dentro do container**.
  Instale via `agents.defaults.sandbox.docker.setupCommand` (ou uma imagem personalizada).
  `setupCommand` roda uma vez após o container ser criado.
  Instalações de pacote também requerem egress de rede, sistema de arquivos root gravável e usuário root no sandbox.
  Exemplo: a skill `summarize` (`skills/summarize/SKILL.md`) precisa do CLI `summarize`
  no container sandbox para rodar lá.

Exemplo de instalador:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
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
              "label": "Instalar Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

Notas:

- Se múltiplos instaladores estiverem listados, o gateway escolhe uma única opção preferida (brew quando disponível, caso contrário node).
- Se todos os instaladores são `download`, o OpenCraft lista cada entrada para que você possa ver os artefatos disponíveis.
- Specs de instalador podem incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opções por plataforma.
- Instalações Node respeitam `skills.install.nodeManager` em `opencraft.json` (padrão: npm; opções: npm/pnpm/yarn/bun).
  Isso só afeta **instalações de skill**; o runtime do Gateway ainda deve ser Node
  (Bun não é recomendado para WhatsApp/Telegram).
- Instalações Go: se `go` estiver faltando e `brew` estiver disponível, o gateway instala Go via Homebrew primeiro e define `GOBIN` para o `bin` do Homebrew quando possível.
- Instalações Download: `url` (obrigatório), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (padrão: auto quando arquivo detectado), `stripComponents`, `targetDir` (padrão: `~/.opencraft/tools/<skillKey>`).

Se nenhum `metadata.openclaw` está presente, a skill é sempre elegível (a menos que
desabilitada na config ou bloqueada por `skills.allowBundled` para skills embutidas).

## Overrides de config (`~/.opencraft/opencraft.json`)

Skills embutidas/gerenciadas podem ser alternadas e fornecidas com valores de env:

```json5
{
  skills: {
    entries: {
      "nano-banana-pro": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou string texto simples
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_AQUI",
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

Nota: se o nome da skill contém hífens, coloque a chave entre aspas (JSON5 permite chaves entre aspas).

Chaves de config correspondem ao **nome da skill** por padrão. Se uma skill define
`metadata.openclaw.skillKey`, use essa chave em `skills.entries`.

Regras:

- `enabled: false` desabilita a skill mesmo se for embutida/instalada.
- `env`: injetado **apenas se** a variável já não estiver definida no processo.
- `apiKey`: conveniência para skills que declaram `metadata.openclaw.primaryEnv`.
  Suporta string texto simples ou objeto SecretRef (`{ source, provider, id }`).
- `config`: bag opcional para campos personalizados por skill; chaves personalizadas devem ficar aqui.
- `allowBundled`: allowlist opcional apenas para skills **embutidas**. Se definido, apenas
  skills embutidas na lista são elegíveis (skills gerenciadas/workspace não afetadas).

## Injeção de ambiente (por execução de agente)

Quando uma execução de agente começa, o OpenCraft:

1. Lê metadados da skill.
2. Aplica qualquer `skills.entries.<key>.env` ou `skills.entries.<key>.apiKey` a
   `process.env`.
3. Constrói o prompt do sistema com skills **elegíveis**.
4. Restaura o ambiente original após a execução terminar.

Isso tem **escopo para a execução do agente**, não para um ambiente shell global.

## Snapshot de sessão (desempenho)

O OpenCraft faz snapshot das skills elegíveis **quando uma sessão começa** e reutiliza essa lista para turnos subsequentes na mesma sessão. Mudanças em skills ou config têm efeito na próxima nova sessão.

Skills também podem se atualizar durante a sessão quando o watcher de skills está habilitado ou quando um novo node remoto elegível aparece (veja abaixo). Pense nisso como um **hot reload**: a lista atualizada é capturada no próximo turno do agente.

## Nodes macOS remotos (gateway Linux)

Se o Gateway está rodando no Linux mas um **node macOS** está conectado **com `system.run` permitido** (segurança de aprovações exec não definida como `deny`), o OpenCraft pode tratar skills somente macOS como elegíveis quando os binários necessários estão presentes naquele node. O agente deve executar essas skills via tool `nodes` (tipicamente `nodes.run`).

Isso depende do node reportar seu suporte de comando e de uma sondagem de bin via `system.run`. Se o node macOS ficar offline depois, as skills permanecem visíveis; invocações podem falhar até o node se reconectar.

## Watcher de skills (auto-refresh)

Por padrão, o OpenCraft monitora pastas de skill e atualiza o snapshot quando arquivos `SKILL.md` mudam. Configure em `skills.load`:

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

## Impacto em tokens (lista de skills)

Quando skills são elegíveis, o OpenCraft injeta uma lista XML compacta de skills disponíveis no prompt do sistema (via `formatSkillsForPrompt` em `pi-coding-agent`). O custo é determinístico:

- **Overhead base (somente quando ≥1 skill):** 195 caracteres.
- **Por skill:** 97 caracteres + o comprimento dos valores XML-escapados de `<name>`, `<description>` e `<location>`.

Fórmula (caracteres):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Notas:

- Escape XML expande `& < > " '` em entidades (`&amp;`, `&lt;`, etc.), aumentando o comprimento.
- Contagens de tokens variam por tokenizador de modelo. Uma estimativa aproximada estilo OpenAI é ~4 chars/token, então **97 chars ≈ 24 tokens** por skill mais seus comprimentos reais de campo.

## Ciclo de vida de skills gerenciadas

O OpenCraft inclui um conjunto base de skills como **skills embutidas** como parte da
instalação (pacote npm ou OpenCraft.app). `~/.opencraft/skills` existe para overrides locais
(por exemplo, fixar/corrigir uma skill sem alterar a cópia embutida). Skills do workspace são de propriedade do usuário e sobrescrevem ambas em conflitos de nome.

## Referência de config

Veja [Config de skills](/tools/skills-config) para o schema completo de configuração.

## Procurando mais skills?

Explore [https://clawhub.com](https://clawhub.com).

---
