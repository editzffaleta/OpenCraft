---
summary: "O que o system prompt do OpenCraft contém e como é montado"
read_when:
  - Editando texto do system prompt, lista de ferramentas ou seções de tempo/heartbeat
  - Alterando comportamento de bootstrap do workspace ou injeção de skills
title: "System Prompt"
---

# System Prompt

O OpenCraft constrói um system prompt customizado para cada execução de agente. O prompt é **de propriedade do OpenCraft** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pelo OpenCraft e injetado em cada execução de agente.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Tooling**: lista atual de ferramentas + descrições curtas.
- **Safety**: lembrete curto de guardrail para evitar comportamento de busca de poder ou contornar supervisão.
- **Skills** (quando disponíveis): diz ao modelo como carregar instruções de skill sob demanda.
- **OpenCraft Self-Update**: como rodar `config.apply` e `update.run`.
- **Workspace**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentation**: caminho local para os docs do OpenCraft (repo ou pacote npm) e quando lê-los.
- **Workspace Files (injected)**: indica que arquivos de bootstrap estão incluídos abaixo.
- **Sandbox** (quando habilitado): indica runtime em sandbox, caminhos de sandbox e se exec elevado está disponível.
- **Current Date & Time**: hora local do usuário, fuso horário e formato de hora.
- **Reply Tags**: sintaxe de tag de resposta opcional para provedores suportados.
- **Heartbeats**: prompt de heartbeat e comportamento de ack.
- **Runtime**: host, SO, node, modelo, raiz do repo (quando detectado), nível de thinking (uma linha).
- **Reasoning**: nível de visibilidade atual + hint de toggle `/reasoning`.

Os guardrails de segurança no system prompt são consultivos. Eles guiam o comportamento do modelo mas não impõem política. Use política de ferramentas, aprovações de exec, sandboxing e allowlists de canal para aplicação rígida; operadores podem desabilitar esses por design.

## Modos de prompt

O OpenCraft pode renderizar system prompts menores para sub-agentes. O runtime define um
`promptMode` para cada execução (não é uma config voltada ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para sub-agentes; omite **Skills**, **Memory Recall**, **OpenCraft
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** e **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (quando conhecido), Runtime e contexto
  injetado permanecem disponíveis.
- `none`: retorna apenas a linha de identidade base.

Quando `promptMode=minimal`, prompts injetados extras são rotulados como **Subagent
Context** em vez de **Group Chat Context**.

## Injeção de bootstrap do workspace

Arquivos de bootstrap são aparados e anexados em **Project Context** para que o modelo veja identidade e contexto de perfil sem precisar de leituras explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (apenas em workspaces completamente novos)
- `MEMORY.md` quando presente, caso contrário `memory.md` como fallback em minúsculas

Todos esses arquivos são **injetados na janela de contexto** a cada turno, o que
significa que consomem tokens. Mantenha-os concisos — especialmente `MEMORY.md`, que pode
crescer ao longo do tempo e levar a uso de contexto inesperadamente alto e compactação mais frequente.

> **Nota:** Arquivos diários `memory/*.md` **não** são injetados automaticamente. Eles
> são acessados sob demanda via as ferramentas `memory_search` e `memory_get`, então não
> contam para a janela de contexto a não ser que o modelo os leia explicitamente.

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 20000). O conteúdo de bootstrap injetado total
entre arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 150000). Arquivos ausentes injetam um marcador curto de arquivo ausente. Quando truncamento
ocorre, o OpenCraft pode injetar um bloco de aviso em Project Context; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`).

Sessões de sub-agente injetam apenas `AGENTS.md` e `TOOLS.md` (outros arquivos de bootstrap
são filtrados para manter o contexto do sub-agente pequeno).

Hooks internos podem interceptar este passo via `agent:bootstrap` para mutar ou substituir
os arquivos de bootstrap injetados (por exemplo trocar `SOUL.md` por uma persona alternativa).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs injetado, truncamento, mais overhead de schema de ferramenta), use `/context list` ou `/context detail`. Veja [Contexto](/concepts/context).

## Tratamento de tempo

O system prompt inclui uma seção dedicada **Current Date & Time** quando o
fuso horário do usuário é conhecido. Para manter o cache do prompt estável, agora inclui apenas
o **fuso horário** (sem relógio dinâmico ou formato de hora).

Use `session_status` quando o agente precisar da hora atual; o cartão de status
inclui uma linha de timestamp.

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Veja [Data e Hora](/date-time) para detalhes completos de comportamento.

## Skills

Quando skills elegíveis existem, o OpenCraft injeta uma **lista de skills disponíveis** compacta
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** para cada skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md no local listado
(workspace, gerenciado ou embutido). Se nenhum skill for elegível, a
seção Skills é omitida.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Isso mantém o prompt base pequeno enquanto ainda habilita o uso direcionado de skills.

## Documentação

Quando disponível, o system prompt inclui uma seção **Documentation** que aponta para o
diretório de docs local do OpenCraft (seja `docs/` no workspace do repo ou os docs do pacote npm
embutido) e também observa o mirror público, repo de origem, Discord da comunidade e
ClawHub ([https://clawhub.com](https://clawhub.com)) para descoberta de skills. O prompt instrui o modelo a consultar os docs locais primeiro
para comportamento, comandos, configuração ou arquitetura do OpenCraft, e a rodar
`opencraft status` por conta própria quando possível (perguntando ao usuário apenas quando não tiver acesso).
