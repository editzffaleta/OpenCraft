---
summary: "Notas de pesquisa: sistema de memória offline para espaços de trabalho Clawd (Markdown como fonte da verdade + índice derivado)"
read_when:
  - Projetando memória de espaço de trabalho (~/.opencraft/workspace) além dos logs diários em Markdown
  - Decidindo: CLI autônoma vs integração profunda com OpenCraft
  - Adicionando recuperação e reflexão offline (retain/recall/reflect)
title: "Pesquisa de Memória de Espaço de Trabalho"
---

# Memória de Espaço de Trabalho v2 (offline): notas de pesquisa

Alvo: espaço de trabalho estilo Clawd (`agents.defaults.workspace`, padrão `~/.opencraft/workspace`) onde a "memória" é armazenada como um arquivo Markdown por dia (`memory/YYYY-MM-DD.md`) mais um pequeno conjunto de arquivos estáveis (ex.: `memory.md`, `SOUL.md`).

Este documento propõe uma arquitetura de memória **offline first** que mantém o Markdown como fonte da verdade canônica e revisável, mas adiciona **recuperação estruturada** (busca, resumos de entidades, atualizações de confiança) via um índice derivado.

## Por que mudar?

A configuração atual (um arquivo por dia) é excelente para:

- registro "append-only"
- edição humana
- durabilidade + auditabilidade com git
- captura sem atrito ("é só escrever")

É fraca para:

- recuperação de alta precisão ("o que decidimos sobre X?", "da última vez que tentamos Y?")
- respostas centradas em entidades ("me fale sobre Alice / O Castelo / warelay") sem reler muitos arquivos
- estabilidade de opiniões/preferências (e evidências quando muda)
- restrições temporais ("o que era verdade em nov/2025?") e resolução de conflitos

## Objetivos de design

- **Offline**: funciona sem rede; pode rodar em laptop/Castelo; sem dependência de nuvem.
- **Explicável**: itens recuperados devem ser atribuíveis (arquivo + localização) e separáveis da inferência.
- **Baixa cerimônia**: o registro diário permanece em Markdown, sem trabalho pesado de esquema.
- **Incremental**: v1 é útil apenas com FTS; semântico/vetor e grafos são melhorias opcionais.
- **Amigável ao agente**: facilita "recuperação dentro de orçamentos de tokens" (retorna pequenos pacotes de fatos).

## Modelo norte-estrela (Hindsight × Letta)

Dois componentes a combinar:

1. **Loop de controle estilo Letta/MemGPT**

- manter um "núcleo" pequeno sempre no contexto (persona + fatos-chave do usuário)
- todo o resto está fora do contexto e é recuperado via ferramentas
- escritas de memória são chamadas explícitas de ferramentas (append/replace/insert), persistidas e reinjetadas no próximo turno

2. **Substrato de memória estilo Hindsight**

- separar o que é observado vs o que se acredita vs o que foi resumido
- suporte a retain/recall/reflect
- opiniões com confiança que podem evoluir com evidências
- recuperação centrada em entidades + consultas temporais (mesmo sem grafos de conhecimento completos)

## Arquitetura proposta (Markdown como fonte da verdade + índice derivado)

### Armazenamento canônico (amigável ao git)

Manter `~/.opencraft/workspace` como memória legível por humanos de forma canônica.

Layout sugerido do espaço de trabalho:

```
~/.opencraft/workspace/
  memory.md                    # pequeno: fatos duráveis + preferências (quase núcleo)
  memory/
    YYYY-MM-DD.md              # log diário (append; narrativo)
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

- **O log diário permanece log diário**. Não precisa ser convertido em JSON.
- Os arquivos `bank/` são **curados**, produzidos por jobs de reflexão, e ainda podem ser editados manualmente.
- `memory.md` permanece "pequeno + quase núcleo": as coisas que você quer que o Clawd veja em cada sessão.

### Armazenamento derivado (recuperação por máquina)

Adicionar um índice derivado sob o espaço de trabalho (não necessariamente rastreado pelo git):

```
~/.opencraft/workspace/.memory/index.sqlite
```

Suportado por:

- Esquema SQLite para fatos + links de entidades + metadados de opinião
- **FTS5** do SQLite para recuperação lexical (rápido, pequeno, offline)
- tabela de embeddings opcional para recuperação semântica (ainda offline)

O índice é sempre **reconstruível a partir do Markdown**.

## Retain / Recall / Reflect (loop operacional)

### Retain: normalizar logs diários em "fatos"

Insight-chave do Hindsight que importa aqui: armazenar **fatos narrativos e autocontidos**, não pequenos fragmentos.

Regra prática para `memory/YYYY-MM-DD.md`:

- ao final do dia (ou durante), adicionar uma seção `## Retain` com 2-5 marcadores que sejam:
  - narrativos (contexto entre turnos preservado)
  - autocontidos (fazem sentido isoladamente depois)
  - marcados com tipo + menções de entidades

Exemplo:

```
## Retain
- W @Peter: Atualmente em Marrakech (27/nov–1/dez, 2025) para o aniversário do Andy.
- B @warelay: Corrigi o crash do WS do Baileys envolvendo os handlers connection.update em try/catch (ver memory/2025-11-27.md).
- O(c=0.95) @Peter: Prefere respostas concisas (&lt;1500 chars) no WhatsApp; conteúdo longo vai para arquivos.
```

Parsing mínimo:

- Prefixo de tipo: `W` (world/mundo), `B` (experience/biográfico), `O` (opinion/opinião), `S` (observation/observação/resumo; geralmente gerado)
- Entidades: `@Peter`, `@warelay`, etc. (slugs mapeiam para `bank/entities/*.md`)
- Confiança de opinião: `O(c=0.0..1.0)` opcional

Se você não quiser que os autores pensem nisso: o job de reflexão pode inferir esses marcadores do resto do log, mas ter uma seção explícita `## Retain` é a "alavanca de qualidade" mais fácil.

### Recall: consultas sobre o índice derivado

A recuperação deve suportar:

- **lexical**: "encontrar termos exatos / nomes / comandos" (FTS5)
- **entidade**: "me fale sobre X" (páginas de entidades + fatos vinculados a entidades)
- **temporal**: "o que aconteceu por volta de 27/nov" / "desde a semana passada"
- **opinião**: "o que Peter prefere?" (com confiança + evidência)

O formato de retorno deve ser amigável ao agente e citar fontes:

- `kind` (`world|experience|opinion|observation`)
- `timestamp` (dia de origem, ou intervalo de tempo extraído se presente)
- `entities` (`["Peter","warelay"]`)
- `content` (o fato narrativo)
- `source` (`memory/2025-11-27.md#L12` etc.)

### Reflect: produzir páginas estáveis + atualizar crenças

A reflexão é um job agendado (diário ou heartbeat `ultrathink`) que:

- atualiza `bank/entities/*.md` a partir de fatos recentes (resumos de entidades)
- atualiza a confiança em `bank/opinions.md` com base em reforço/contradição
- opcionalmente propõe edições em `memory.md` (fatos duráveis "quase núcleo")

Evolução de opiniões (simples e explicável):

- cada opinião tem:
  - declaração
  - confiança `c ∈ [0,1]`
  - last_updated
  - links de evidência (IDs de fatos de suporte + contradição)
- quando novos fatos chegam:
  - encontrar opiniões candidatas por sobreposição de entidades + similaridade (FTS primeiro, embeddings depois)
  - atualizar confiança por pequenos deltas; grandes saltos requerem contradição forte + evidência repetida

## Integração na CLI: autônoma vs integração profunda

Recomendação: **integração profunda no OpenCraft**, mas manter uma biblioteca central separável.

### Por que integrar no OpenCraft?

- O OpenCraft já conhece:
  - o caminho do espaço de trabalho (`agents.defaults.workspace`)
  - o modelo de sessão + heartbeats
  - padrões de logging + solução de problemas
- Você quer que o próprio agente chame as ferramentas:
  - `opencraft memory recall "…" --k 25 --since 30d`
  - `opencraft memory reflect --since 7d`

### Por que ainda separar em biblioteca?

- manter a lógica de memória testável sem gateway/runtime
- reutilizar de outros contextos (scripts locais, futuros aplicativos desktop, etc.)

Formato:
A ferramenta de memória deve ser uma pequena camada de CLI + biblioteca, mas isso é apenas exploratório.

## "S-Collide" / SuCo: quando usar (pesquisa)

Se "S-Collide" se refere ao **SuCo (Subspace Collision)**: é uma abordagem de recuperação ANN que visa bons trade-offs de recall/latência usando colisões aprendidas/estruturadas em subespaços (artigo: arXiv 2411.14754, 2024).

Visão pragmática para `~/.opencraft/workspace`:

- **não comece** com SuCo.
- comece com SQLite FTS + embeddings simples (opcionais); você terá a maioria dos ganhos de UX imediatamente.
- considere soluções como SuCo/HNSW/ScaNN apenas quando:
  - o corpus for grande (dezenas/centenas de milhares de chunks)
  - a busca por embedding bruta se tornar lenta demais
  - a qualidade de recall for significativamente limitada pela busca lexical

Alternativas amigáveis ao offline (em crescente complexidade):

- SQLite FTS5 + filtros de metadados (zero ML)
- Embeddings + força bruta (funciona surpreendentemente bem quando o número de chunks é baixo)
- Índice HNSW (comum, robusto; precisa de uma ligação de biblioteca)
- SuCo (nível de pesquisa; atraente se houver uma implementação sólida para embutir)

Questão em aberto:

- qual é o **melhor** modelo de embedding offline para "memória de assistente pessoal" em suas máquinas (laptop + desktop)?
  - se você já tem Ollama: faça embedding com um modelo local; caso contrário, inclua um modelo de embedding pequeno no conjunto de ferramentas.

## Piloto mínimo útil

Se você quiser uma versão mínima ainda útil:

- Adicionar páginas de entidades em `bank/` e uma seção `## Retain` nos logs diários.
- Usar SQLite FTS para recuperação com citações (caminho + números de linha).
- Adicionar embeddings somente se a qualidade de recuperação ou a escala o exigirem.

## Referências

- Conceitos Letta / MemGPT: "blocos de memória central" + "memória de arquivo" + memória autoeditorável orientada por ferramentas.
- Relatório Técnico Hindsight: "retain / recall / reflect", memória de quatro redes, extração de fatos narrativos, evolução de confiança de opiniões.
- SuCo: arXiv 2411.14754 (2024): "Subspace Collision" para recuperação de vizinhos mais próximos aproximados.
