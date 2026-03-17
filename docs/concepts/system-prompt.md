---
summary: "O que o system prompt do OpenCraft contém e como ele é montado"
read_when:
  - Editando texto do system prompt, lista de ferramentas ou seções de hora/heartbeat
  - Alterando o bootstrap do workspace ou comportamento de injeção de skills
title: "System Prompt"
---

# System Prompt

O OpenCraft constrói um system prompt personalizado para cada execução de agente. O prompt é **de propriedade do OpenCraft** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pelo OpenCraft e injetado em cada execução de agente.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Ferramentas**: lista de ferramentas atual + descrições curtas.
- **Segurança**: lembrete curto de proteção para evitar comportamento de busca de poder ou contornar supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de Skill sob demanda.
- **Auto-atualização do OpenCraft**: como executar `config.apply` e `update.run`.
- **Workspace**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentação**: caminho local para os docs do OpenCraft (repositório ou pacote npm) e quando consultá-los.
- **Arquivos do Workspace (injetados)**: indica que arquivos de bootstrap estão incluídos abaixo.
- **Sandbox** (quando habilitado): indica runtime sandboxed, caminhos de sandbox e se exec elevado está disponível.
- **Data e Hora Atual**: hora local do usuário, fuso horário e formato de hora.
- **Reply Tags**: sintaxe opcional de tags de resposta para provedores suportados.
- **Heartbeats**: prompt de heartbeat e comportamento de confirmação.
- **Runtime**: host, SO, node, modelo, raiz do repositório (quando detectado), nível de thinking (uma linha).
- **Raciocínio**: nível de visibilidade atual + dica de alternância /reasoning.

As proteções de segurança no system prompt são consultivas. Elas guiam o comportamento do modelo, mas não aplicam políticas. Use política de ferramentas, aprovações de exec, sandboxing e listas de permissão de canais para aplicação rígida; operadores podem desabilitar isso por design.

## Modos de prompt

O OpenCraft pode renderizar system prompts menores para sub-agentes. O runtime define um
`promptMode` para cada execução (não é uma configuração voltada ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para sub-agentes; omite **Skills**, **Memory Recall**, **Auto-atualização do OpenCraft**, **Model Aliases**, **Identidade do Usuário**, **Reply Tags**,
  **Mensagens**, **Respostas Silenciosas** e **Heartbeats**. Ferramentas, **Segurança**,
  Workspace, Sandbox, Data e Hora Atual (quando conhecida), Runtime e contexto
  injetado permanecem disponíveis.
- `none`: retorna apenas a linha de identidade base.

Quando `promptMode=minimal`, prompts injetados extras são rotulados como **Contexto de
Sub-agente** em vez de **Contexto de Chat em Grupo**.

## Injeção de bootstrap do workspace

Arquivos de bootstrap são recortados e adicionados em **Contexto do Projeto** para que o modelo veja o contexto de identidade e perfil sem precisar de leituras explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (apenas em workspaces novos)
- `MEMORY.md` quando presente, caso contrário `memory.md` como fallback em minúsculas

Todos esses arquivos são **injetados na janela de contexto** a cada turno, o que
significa que eles consomem Token. Mantenha-os concisos — especialmente `MEMORY.md`, que pode
crescer ao longo do tempo e levar a uso de contexto inesperadamente alto e compactação mais
frequente.

> **Nota:** arquivos diários `memory/*.md` **não** são injetados automaticamente. Eles
> são acessados sob demanda via as ferramentas `memory_search` e `memory_get`, então não
> contam contra a janela de contexto a menos que o modelo os leia explicitamente.

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 20000). O conteúdo total de bootstrap
injetado entre todos os arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 150000). Arquivos ausentes injetam um marcador curto de arquivo ausente. Quando ocorre
truncamento, o OpenCraft pode injetar um bloco de aviso no Contexto do Projeto; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`).

Sessões de sub-agente injetam apenas `AGENTS.md` e `TOOLS.md` (outros arquivos de bootstrap
são filtrados para manter o contexto do sub-agente pequeno).

Hooks internos podem interceptar esta etapa via `agent:bootstrap` para mutar ou substituir
os arquivos de bootstrap injetados (por exemplo, trocar `SOUL.md` por uma persona alternativa).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs injetado, truncamento, mais overhead de schema de ferramentas), use `/context list` ou `/context detail`. Veja [Context](/concepts/context).

## Tratamento de hora

O system prompt inclui uma seção dedicada **Data e Hora Atual** quando o
fuso horário do usuário é conhecido. Para manter o cache do prompt estável, ele agora inclui
apenas o **fuso horário** (sem relógio dinâmico ou formato de hora).

Use `session_status` quando o agente precisar da hora atual; o cartão de status
inclui uma linha de timestamp.

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Veja [Date & Time](/date-time) para detalhes completos do comportamento.

## Skills

Quando Skills elegíveis existem, o OpenCraft injeta uma lista compacta de **skills disponíveis**
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** para cada Skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md na localização
listada (workspace, gerenciado ou integrado). Se nenhuma Skill for elegível, a
seção de Skills é omitida.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Isso mantém o prompt base pequeno enquanto ainda habilita o uso direcionado de Skills.

## Documentação

Quando disponível, o system prompt inclui uma seção de **Documentação** que aponta para o
diretório local de docs do OpenCraft (seja `docs/` no workspace do repositório ou os docs do
pacote npm integrado) e também menciona o espelho público, repositório fonte, Discord da comunidade e
ClawHub ([https://clawhub.com](https://clawhub.com)) para descoberta de Skills. O prompt instrui o modelo a consultar os docs locais primeiro
para comportamento, comandos, configuração ou arquitetura do OpenCraft, e a executar
`opencraft status` por conta própria quando possível (perguntando ao usuário apenas quando não tem acesso).
