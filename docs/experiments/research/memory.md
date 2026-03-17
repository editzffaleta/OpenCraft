---
summary: "Notas de pesquisa: sistema de memória offline para workspaces Clawd (Markdown como fonte da verdade + índice derivado)"
read_when:
  - Projetando memória de workspace (~/.opencraft/workspace) além de logs Markdown diários
  - Decidindo: CLI standalone vs integração profunda com o OpenCraft
  - Adicionando recall + reflexão offline (retain/recall/reflect)
title: "Workspace Memory Research"
---

# Memória de Workspace v2 (offline): notas de pesquisa

Alvo: workspace estilo Clawd (`agents.defaults.workspace`, padrão `~/.opencraft/workspace`) onde "memória" é armazenada como um arquivo Markdown por dia (`memory/YYYY-MM-DD.md`) mais um pequeno conjunto de arquivos estáveis (ex. `memory.md`, `SOUL.md`).

Este documento propõe uma arquitetura de memória **offline-first** que mantém Markdown como a fonte da verdade canônica e revisável, mas adiciona **recall estruturado** (busca, resumos de entidade, atualizações de confiança) via um índice derivado.

## Por que mudar?

A configuração atual (um arquivo por dia) é excelente para:

- journaling "somente-adição"
- edição humana
- durabilidade + auditabilidade baseada em git
- captura de baixa fricção ("apenas escreva")

É fraca para:

- recuperação de alto recall ("o que decidimos sobre X?", "última vez que tentamos Y?")
- respostas centradas em entidade ("me fale sobre Alice / O Castelo / warelay") sem reler muitos arquivos
- estabilidade de opinião/preferência (e evidência quando muda)
- restrições temporais ("o que era verdade durante Nov 2025?") e resolução de conflitos

## Objetivos de design

- **Offline**: funciona sem rede; pode rodar em laptop/Castle; sem dependência de nuvem.
- **Explicável**: itens recuperados devem ser atribuíveis (arquivo + localização) e separáveis de inferência.
- **Baixa cerimônia**: logging diário permanece Markdown, sem trabalho pesado de esquema.
- **Incremental**: v1 é útil somente com FTS; semântico/vetor e grafos são upgrades opcionais.
- **Amigável ao agente**: facilita "recall dentro de orçamentos de Token" (retornar pequenos pacotes de fatos).

## Modelo norte-estrela (Hindsight x Letta)

Duas peças para mesclar:

1. **Loop de controle estilo Letta/MemGPT**

- manter um "core" pequeno sempre em contexto (persona + fatos chave do usuário)
- todo o resto é fora de contexto e recuperado via ferramentas
- escritas de memória são chamadas de ferramenta explícitas (append/replace/insert), persistidas, depois reinjetadas no próximo turno

2. **Substrato de memória estilo Hindsight**

- separar o que é observado vs o que é acreditado vs o que é resumido
- suportar retain/recall/reflect
- opiniões com confiança que podem evoluir com evidência
- recuperação ciente de entidade + consultas temporais (mesmo sem grafos de conhecimento completos)

## Arquitetura proposta (Markdown como fonte da verdade + índice derivado)

### Armazenamento canônico (amigável a git)

Manter `~/.opencraft/workspace` como memória canônica legível por humanos.

Layout de workspace sugerido:

```
~/.opencraft/workspace/
  memory.md                    # pequeno: fatos duráveis + preferências (core-ish)
  memory/
    YYYY-MM-DD.md              # log diário (adição; narrativa)
  bank/                        # páginas de memória "tipadas" (estáveis, revisáveis)
    world.md                   # fatos objetivos sobre o mundo
    experience.md              # o que o agente fez (primeira pessoa)
    opinions.md                # preferências/julgamentos subjetivos + confiança + ponteiros de evidência
    entities/
      Peter.md
      The-Castle.md
      warelay.md
      ...
```

Notas:

- **Log diário permanece log diário**. Não precisa transformar em JSON.
- Os arquivos `bank/` são **curados**, produzidos por jobs de reflexão, e ainda podem ser editados manualmente.
- `memory.md` permanece "pequeno + core-ish": as coisas que você quer que Clawd veja toda sessão.

### Armazenamento derivado (recall de máquina)

Adicionar um índice derivado sob o workspace (não necessariamente rastreado pelo git):

```
~/.opencraft/workspace/.memory/index.sqlite
```

Apoiar com:

- Esquema SQLite para fatos + links de entidade + metadados de opinião
- **FTS5** SQLite para recall lexical (rápido, minúsculo, offline)
- tabela opcional de embeddings para recall semântico (ainda offline)

O índice é sempre **reconstruível a partir do Markdown**.

## Retain / Recall / Reflect (loop operacional)

### Retain: normalizar logs diários em "fatos"

O insight chave do Hindsight que importa aqui: armazenar **fatos narrativos, autocontidos**, não trechos pequenos.

Regra prática para `memory/YYYY-MM-DD.md`:

- no final do dia (ou durante), adicionar uma seção `## Retain` com 2-5 bullets que são:
  - narrativos (contexto entre turnos preservado)
  - autocontidos (fazem sentido sozinhos depois)
  - marcados com tipo + menções de entidade

Exemplo:

```
## Retain
- W @Peter: Currently in Marrakech (Nov 27–Dec 1, 2025) for Andy's birthday.
- B @warelay: I fixed the Baileys WS crash by wrapping connection.update handlers in try/catch (see memory/2025-11-27.md).
- O(c=0.95) @Peter: Prefers concise replies (<1500 chars) on WhatsApp; long content goes into files.
```

Parsing mínimo:

- Prefixo de tipo: `W` (mundo), `B` (experiência/biográfico), `O` (opinião), `S` (observação/resumo; geralmente gerado)
- Entidades: `@Peter`, `@warelay`, etc (slugs mapeiam para `bank/entities/*.md`)
- Confiança de opinião: `O(c=0.0..1.0)` opcional

Se você não quer que autores pensem nisso: o job de reflexão pode inferir esses bullets do resto do log, mas ter uma seção `## Retain` explícita é a "alavanca de qualidade" mais fácil.

### Recall: consultas sobre o índice derivado

Recall deve suportar:

- **lexical**: "encontrar termos/nomes/comandos exatos" (FTS5)
- **entidade**: "me fale sobre X" (páginas de entidade + fatos vinculados a entidade)
- **temporal**: "o que aconteceu por volta de Nov 27" / "desde semana passada"
- **opinião**: "o que Peter prefere?" (com confiança + evidência)

Formato de retorno deve ser amigável ao agente e citar fontes:

- `kind` (`world|experience|opinion|observation`)
- `timestamp` (dia de origem, ou faixa de tempo extraída se presente)
- `entities` (`["Peter","warelay"]`)
- `content` (o fato narrativo)
- `source` (`memory/2025-11-27.md#L12` etc)

### Reflect: produzir páginas estáveis + atualizar crenças

Reflexão é um job agendado (diário ou heartbeat `ultrathink`) que:

- atualiza `bank/entities/*.md` a partir de fatos recentes (resumos de entidade)
- atualiza confiança de `bank/opinions.md` baseado em reforço/contradição
- opcionalmente propõe edições em `memory.md` (fatos duráveis "core-ish")

Evolução de opinião (simples, explicável):

- cada opinião tem:
  - declaração
  - confiança `c ∈ [0,1]`
  - last_updated
  - links de evidência (IDs de fatos de suporte + contradição)
- quando novos fatos chegam:
  - encontrar opiniões candidatas por sobreposição de entidade + similaridade (FTS primeiro, embeddings depois)
  - atualizar confiança por deltas pequenos; saltos grandes requerem contradição forte + evidência repetida

## Integração CLI: standalone vs integração profunda

Recomendação: **integração profunda no OpenCraft**, mas manter uma biblioteca core separável.

### Por que integrar no OpenCraft?

- O OpenCraft já conhece:
  - o caminho do workspace (`agents.defaults.workspace`)
  - o modelo de sessão + heartbeats
  - padrões de logging + troubleshooting
- Você quer que o próprio agente chame as ferramentas:
  - `opencraft memory recall "…" --k 25 --since 30d`
  - `opencraft memory reflect --since 7d`

### Por que ainda separar uma biblioteca?

- manter lógica de memória testável sem Gateway/runtime
- reusar de outros contextos (scripts locais, futuro app desktop, etc.)

Formato:
A ferramenta de memória é planejada para ser uma pequena camada de CLI + biblioteca, mas isso é somente exploratório.

## "S-Collide" / SuCo: quando usar (pesquisa)

Se "S-Collide" se refere a **SuCo (Subspace Collision)**: é uma abordagem de recuperação ANN que visa tradeoffs fortes de recall/latência usando colisões aprendidas/estruturadas em subespaços (paper: arXiv 2411.14754, 2024).

Visão pragmática para `~/.opencraft/workspace`:

- **não comece** com SuCo.
- comece com FTS SQLite + (opcional) embeddings simples; você terá a maioria dos ganhos de UX imediatamente.
- considere soluções da classe SuCo/HNSW/ScaNN somente quando:
  - corpus é grande (dezenas/centenas de milhares de chunks)
  - busca de embeddings por força bruta se torna muito lenta
  - qualidade de recall é significativamente gargalada por busca lexical

Alternativas amigáveis ao offline (em complexidade crescente):

- FTS5 SQLite + filtros de metadados (zero ML)
- Embeddings + força bruta (funciona surpreendentemente bem se a contagem de chunks é baixa)
- Índice HNSW (comum, robusto; precisa de binding de biblioteca)
- SuCo (grau de pesquisa; atraente se houver implementação sólida que você pode embutir)

Pergunta em aberto:

- qual é o **melhor** modelo de embedding offline para "memória de assistente pessoal" nas suas máquinas (laptop + desktop)?
  - se você já tem Ollama: embutir com modelo local; caso contrário enviar um modelo de embedding pequeno na toolchain.

## Menor piloto útil

Se você quer uma versão mínima, ainda útil:

- Adicione páginas de entidade `bank/` e uma seção `## Retain` nos logs diários.
- Use FTS SQLite para recall com citações (caminho + números de linha).
- Adicione embeddings somente se qualidade de recall ou escala demandar.

## Referências

- Conceitos Letta / MemGPT: "blocos de memória core" + "memória de arquivo" + memória de auto-edição orientada a ferramentas.
- Relatório Técnico Hindsight: "retain / recall / reflect", memória de quatro redes, extração de fatos narrativos, evolução de confiança de opinião.
- SuCo: arXiv 2411.14754 (2024): recuperação de vizinho mais próximo aproximado por "Subspace Collision".
