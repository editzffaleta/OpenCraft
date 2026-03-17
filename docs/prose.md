---
summary: "OpenProse: workflows .prose, comandos slash e estado no OpenCraft"
read_when:
  - Você quer executar ou escrever workflows .prose
  - Você quer habilitar o Plugin OpenProse
  - Você precisa entender o armazenamento de estado
title: "OpenProse"
---

# OpenProse

OpenProse é um formato de workflow portátil, baseado em Markdown, para orquestrar sessões de IA. No OpenCraft, ele é entregue como um Plugin que instala um pacote de Skills OpenProse mais um comando slash `/prose`. Programas ficam em arquivos `.prose` e podem gerar múltiplos subagentes com fluxo de controle explícito.

Site oficial: [https://www.prose.md](https://www.prose.md)

## O que ele pode fazer

- Pesquisa + síntese multi-agente com paralelismo explícito.
- Workflows repetíveis e seguros para aprovação (revisão de código, triagem de incidentes, pipelines de conteúdo).
- Programas `.prose` reutilizáveis que você pode executar em runtimes de agente suportados.

## Instalar + habilitar

Plugins incluídos são desabilitados por padrão. Habilite o OpenProse:

```bash
opencraft plugins enable open-prose
```

Reinicie o Gateway após habilitar o Plugin.

Checkout dev/local: `opencraft plugins install ./extensions/open-prose`

Documentação relacionada: [Plugins](/tools/plugin), [Manifesto de Plugin](/plugins/manifest), [Skills](/tools/skills).

## Comando slash

O OpenProse registra `/prose` como um comando de Skill invocável pelo usuário. Ele roteia para as instruções da VM OpenProse e usa ferramentas do OpenCraft internamente.

Comandos comuns:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Exemplo: um arquivo `.prose` simples

```prose
# Pesquisa + síntese com dois agentes rodando em paralelo.

input topic: "O que devemos pesquisar?"

agent researcher:
  model: sonnet
  prompt: "Você pesquisa minuciosamente e cita fontes."

agent writer:
  model: opus
  prompt: "Você escreve um resumo conciso."

parallel:
  findings = session: researcher
    prompt: "Pesquise {topic}."
  draft = session: writer
    prompt: "Resuma {topic}."

session "Junte as descobertas + rascunho em uma resposta final."
context: { findings, draft }
```

## Locais de arquivo

O OpenProse mantém o estado em `.prose/` no seu workspace:

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Agentes persistentes a nível de usuário ficam em:

```
~/.prose/agents/
```

## Modos de estado

O OpenProse suporta múltiplos backends de estado:

- **filesystem** (padrão): `.prose/runs/...`
- **in-context**: transitório, para programas pequenos
- **sqlite** (experimental): requer binário `sqlite3`
- **postgres** (experimental): requer `psql` e uma string de conexão

Notas:

- sqlite/postgres são opt-in e experimentais.
- Credenciais postgres fluem para logs de subagentes; use um banco de dados dedicado com privilégios mínimos.

## Programas remotos

`/prose run <handle/slug>` resolve para `https://p.prose.md/<handle>/<slug>`.
URLs diretas são buscadas como estão. Isso usa a ferramenta `web_fetch` (ou `exec` para POST).

## Mapeamento de runtime do OpenCraft

Programas OpenProse mapeiam para primitivas do OpenCraft:

| Conceito OpenProse             | Ferramenta OpenCraft |
| ------------------------------ | -------------------- |
| Gerar sessão / Ferramenta Task | `sessions_spawn`     |
| Leitura/escrita de arquivo     | `read` / `write`     |
| Busca na web                   | `web_fetch`          |

Se sua lista de permissão de ferramentas bloquear essas ferramentas, programas OpenProse falharão. Consulte [Configuração de Skills](/tools/skills-config).

## Segurança + aprovações

Trate arquivos `.prose` como código. Revise antes de executar. Use listas de permissão e gates de aprovação de ferramentas do OpenCraft para controlar efeitos colaterais.

Para workflows determinísticos e com gate de aprovação, compare com [Lobster](/tools/lobster).
