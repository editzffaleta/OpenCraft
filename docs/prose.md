---
summary: "OpenProse: workflows .prose, slash commands e estado no OpenCraft"
read_when:
  - Você quer rodar ou escrever workflows .prose
  - Você quer habilitar o plugin OpenProse
  - Você precisa entender o armazenamento de estado
title: "OpenProse"
---

# OpenProse

O OpenProse é um formato de workflow portátil e baseado em markdown para orquestrar sessões de IA. No OpenCraft ele vem como um plugin que instala um skill pack do OpenProse mais um slash command `/prose`. Os programas ficam em arquivos `.prose` e podem spawnar múltiplos sub-agentes com fluxo de controle explícito.

Site oficial: [https://www.prose.md](https://www.prose.md)

## O que pode fazer

- Pesquisa + síntese multi-agente com paralelismo explícito.
- Workflows repetíveis com aprovação segura (revisão de código, triagem de incidentes, pipelines de conteúdo).
- Programas `.prose` reutilizáveis que você pode rodar em runtimes de agente suportados.

## Instalar + habilitar

Plugins embutidos são desabilitados por padrão. Habilitar o OpenProse:

```bash
opencraft plugins enable open-prose
```

Reinicie o Gateway após habilitar o plugin.

Checkout dev/local: `opencraft plugins install ./extensions/open-prose`

Docs relacionados: [Plugins](/tools/plugin), [Manifesto de plugin](/plugins/manifest), [Skills](/tools/skills).

## Slash command

O OpenProse registra `/prose` como um comando skill invocável pelo usuário. Ele roteia para as instruções da VM do OpenProse e usa as tools do OpenCraft por baixo dos panos.

Comandos comuns:

```
/prose help
/prose run <arquivo.prose>
/prose run <handle/slug>
/prose run <https://exemplo.com/arquivo.prose>
/prose compile <arquivo.prose>
/prose examples
/prose update
```

## Exemplo: um arquivo `.prose` simples

```prose
# Pesquisa + síntese com dois agentes rodando em paralelo.

input topic: "O que devemos pesquisar?"

agent pesquisador:
  model: sonnet
  prompt: "Você pesquisa minuciosamente e cita fontes."

agent escritor:
  model: opus
  prompt: "Você escreve um resumo conciso."

parallel:
  descobertas = session: pesquisador
    prompt: "Pesquise {topic}."
  rascunho = session: escritor
    prompt: "Resuma {topic}."

session "Mescle as descobertas + rascunho em uma resposta final."
context: { descobertas, rascunho }
```

## Locais de arquivo

O OpenProse mantém estado em `.prose/` no seu workspace:

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

Agentes persistentes de nível de usuário ficam em:

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
- Credenciais do postgres fluem para logs de subagente; use um DB dedicado com privilégios mínimos.

## Programas remotos

`/prose run <handle/slug>` resolve para `https://p.prose.md/<handle>/<slug>`.
URLs diretas são buscadas como estão. Usa a tool `web_fetch` (ou `exec` para POST).

## Mapeamento do runtime do OpenCraft

Programas OpenProse mapeiam para primitivos do OpenCraft:

| Conceito OpenProse         | Tool do OpenCraft |
| -------------------------- | ----------------- |
| Spawnar sessão / Task tool | `sessions_spawn`  |
| Leitura/escrita de arquivo | `read` / `write`  |
| Busca web                  | `web_fetch`       |

Se sua allowlist de tools bloquear essas tools, os programas OpenProse falharão. Veja [Config de Skills](/tools/skills-config).

## Segurança + aprovações

Trate arquivos `.prose` como código. Revise antes de rodar. Use allowlists de tools e portões de aprovação do OpenCraft para controlar efeitos colaterais.

Para workflows determinísticos com aprovação obrigatória, compare com [Lobster](/tools/lobster).
