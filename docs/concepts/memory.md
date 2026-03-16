---
title: "Memória"
summary: "Como funciona a memória do OpenCraft (arquivos do workspace + flush automático de memória)"
read_when:
  - Você quer o layout dos arquivos de memória e o fluxo de trabalho
  - Você quer ajustar o flush automático de memória pré-compactação
---

# Memória

A memória do OpenCraft é **Markdown simples no workspace do agente**. Os arquivos são
a fonte da verdade; o modelo só "lembra" o que é escrito em disco.

As ferramentas de busca em memória são fornecidas pelo plugin de memória ativo (padrão:
`memory-core`). Desative plugins de memória com `plugins.slots.memory = "none"`.

## Arquivos de memória (Markdown)

O layout padrão do workspace usa duas camadas de memória:

- `memory/YYYY-MM-DD.md`
  - Log diário (somente append).
  - Lê hoje + ontem no início da sessão.
- `MEMORY.md` (opcional)
  - Memória de longo prazo curada.
  - Se `MEMORY.md` e `memory.md` existirem na raiz do workspace, o OpenCraft carrega apenas `MEMORY.md`.
  - `memory.md` em minúsculas é usado apenas como fallback quando `MEMORY.md` está ausente.
  - **Carregado apenas na sessão principal e privada** (nunca em contextos de grupo).

Esses arquivos ficam no workspace (`agents.defaults.workspace`, padrão
`~/.opencraft/workspace`). Veja [Workspace do agente](/concepts/agent-workspace) para o layout completo.

## Ferramentas de memória

O OpenCraft expõe duas ferramentas voltadas ao agente para esses arquivos Markdown:

- `memory_search` — busca semântica sobre snippets indexados.
- `memory_get` — leitura direcionada de um arquivo/intervalo de linha Markdown específico.

`memory_get` agora **degrada graciosamente quando um arquivo não existe** (por exemplo,
o log diário de hoje antes da primeira escrita). Tanto o gerenciador embutido quanto o
backend QMD retornam `{ text: "", path }` em vez de lançar `ENOENT`, para que agentes
possam lidar com "nada registrado ainda" e continuar seu fluxo de trabalho sem envolver
a chamada de ferramenta em try/catch.

## Quando escrever memória

- Decisões, preferências e fatos duráveis vão para `MEMORY.md`.
- Notas do dia a dia e contexto em andamento vão para `memory/YYYY-MM-DD.md`.
- Se alguém disser "lembre disso", escreva (não mantenha na RAM).
- Esta área ainda está evoluindo. Ajuda lembrar o modelo de armazenar memórias; ele saberá o que fazer.
- Se você quiser que algo persista, **peça ao bot para escrever** na memória.

## Flush automático de memória (ping pré-compactação)

Quando uma sessão está **próxima da auto-compactação**, o OpenCraft aciona uma **rodada
agentic silenciosa** que lembra o modelo de escrever memória durável **antes** do contexto
ser compactado. Os prompts padrão dizem explicitamente que o modelo _pode responder_,
mas normalmente `NO_REPLY` é a resposta correta para que o usuário nunca veja essa rodada.

Isso é controlado por `agents.defaults.compaction.memoryFlush`:

```json5
{
  agents: {
    defaults: {
      compaction: {
        reserveTokensFloor: 20000,
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 4000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

Detalhes:

- **Soft threshold**: o flush é acionado quando a estimativa de tokens da sessão cruza
  `contextWindow - reserveTokensFloor - softThresholdTokens`.
- **Silencioso** por padrão: os prompts incluem `NO_REPLY` para que nada seja entregue.
- **Dois prompts**: um prompt de usuário mais um append de system prompt adicionam o lembrete.
- **Um flush por ciclo de compactação** (rastreado em `sessions.json`).
- **O workspace deve ser gravável**: se a sessão rodar em sandbox com
  `workspaceAccess: "ro"` ou `"none"`, o flush é ignorado.

Para o ciclo de vida completo da compactação, veja
[Gerenciamento de sessão + compactação](/reference/session-management-compaction).

## Busca vetorial em memória

O OpenCraft pode construir um pequeno índice vetorial sobre `MEMORY.md` e `memory/*.md` para
que consultas semânticas encontrem notas relacionadas mesmo quando a formulação difere.

Padrões:

- Habilitado por padrão.
- Observa arquivos de memória por mudanças (com debounce).
- Configure a busca em memória em `agents.defaults.memorySearch` (não no nível
  raiz `memorySearch`).
- Usa embeddings remotos por padrão. Se `memorySearch.provider` não estiver definido, o OpenCraft seleciona automaticamente:
  1. `local` se `memorySearch.local.modelPath` estiver configurado e o arquivo existir.
  2. `openai` se uma chave OpenAI puder ser resolvida.
  3. `gemini` se uma chave Gemini puder ser resolvida.
  4. `voyage` se uma chave Voyage puder ser resolvida.
  5. `mistral` se uma chave Mistral puder ser resolvida.
  6. Caso contrário, a busca em memória permanece desabilitada até ser configurada.
- O modo local usa node-llama-cpp e pode requerer `pnpm approve-builds`.
- Usa sqlite-vec (quando disponível) para acelerar a busca vetorial dentro do SQLite.
- `memorySearch.provider = "ollama"` também é suportado para embeddings Ollama
  locais/auto-hospedados (`/api/embeddings`), mas não é selecionado automaticamente.

Embeddings remotos **requerem** uma chave de API para o provedor de embedding. O OpenCraft
resolve chaves de perfis de auth, `models.providers.*.apiKey` ou variáveis de ambiente.
OAuth do Codex cobre apenas chat/completions e **não** satisfaz
embeddings para busca em memória. Para Gemini, use `GEMINI_API_KEY` ou
`models.providers.google.apiKey`. Para Voyage, use `VOYAGE_API_KEY` ou
`models.providers.voyage.apiKey`. Para Mistral, use `MISTRAL_API_KEY` ou
`models.providers.mistral.apiKey`. Ollama normalmente não requer uma chave de API real
(um placeholder como `OLLAMA_API_KEY=ollama-local` é suficiente quando necessário por
política local).
Ao usar um endpoint compatível com OpenAI customizado,
defina `memorySearch.remote.apiKey` (e `memorySearch.remote.headers` opcional).

### Backend QMD (experimental)

Defina `memory.backend = "qmd"` para trocar o indexador SQLite embutido por
[QMD](https://github.com/tobi/qmd): um sidecar de busca local-first que combina
BM25 + vetores + reranking. O Markdown permanece como fonte da verdade; o OpenCraft
usa shell para chamar o QMD para recuperação. Pontos principais:

**Pré-requisitos**

- Desabilitado por padrão. Opt-in por configuração (`memory.backend = "qmd"`).
- Instale o CLI do QMD separadamente (`bun install -g https://github.com/tobi/qmd` ou obtenha
  um release) e garanta que o binário `qmd` esteja no `PATH` do gateway.
- QMD precisa de um build SQLite que permita extensões (`brew install sqlite` no
  macOS).
- QMD roda totalmente local via Bun + `node-llama-cpp` e faz download automático de modelos GGUF
  do HuggingFace no primeiro uso (não requer daemon Ollama separado).
- O gateway roda o QMD em um home XDG isolado em
  `~/.opencraft/agents/<agentId>/qmd/` definindo `XDG_CONFIG_HOME` e
  `XDG_CACHE_HOME`.
- Suporte de SO: macOS e Linux funcionam out-of-the-box quando Bun + SQLite estão
  instalados. Windows tem melhor suporte via WSL2.

**Como o sidecar roda**

- O gateway escreve um home QMD isolado em
  `~/.opencraft/agents/<agentId>/qmd/` (config + cache + banco sqlite).
- Coleções são criadas via `qmd collection add` a partir de `memory.qmd.paths`
  (mais arquivos de memória padrão do workspace), depois `qmd update` + `qmd embed` rodam
  na inicialização e em um intervalo configurável (`memory.qmd.update.interval`,
  padrão 5 m).
- O gateway agora inicializa o gerenciador QMD na inicialização, então os timers de
  atualização periódica são armados mesmo antes da primeira chamada `memory_search`.
- O refresh de boot agora roda em background por padrão para que a inicialização do chat não
  seja bloqueada; defina `memory.qmd.update.waitForBootSync = true` para manter o
  comportamento de bloqueio anterior.
- Buscas rodam via `memory.qmd.searchMode` (padrão `qmd search --json`; também
  suporta `vsearch` e `query`). Se o modo selecionado rejeitar flags no seu
  build QMD, o OpenCraft tenta novamente com `qmd query`. Se o QMD falhar ou o binário
  estiver ausente, o OpenCraft automaticamente faz fallback para o gerenciador SQLite embutido para
  que as ferramentas de memória continuem funcionando.
- O OpenCraft não expõe tuning de batch-size de embed do QMD hoje; o comportamento de batch é
  controlado pelo próprio QMD.
- **A primeira busca pode ser lenta**: o QMD pode fazer download de modelos GGUF locais (reranker/query
  expansion) na primeira execução de `qmd query`.
  - O OpenCraft define `XDG_CONFIG_HOME`/`XDG_CACHE_HOME` automaticamente quando roda o QMD.
  - Se você quiser pré-baixar modelos manualmente (e aquecer o mesmo índice que o OpenCraft
    usa), rode uma consulta única com os diretórios XDG do agente.

    O estado QMD do OpenCraft fica no seu **diretório de estado** (padrão `~/.opencraft`).
    Você pode apontar `qmd` para o mesmo índice exportando as mesmas variáveis XDG que
    o OpenCraft usa:

    ```bash
    # Escolha o mesmo diretório de estado que o OpenCraft usa
    STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.opencraft}"

    export XDG_CONFIG_HOME="$STATE_DIR/agents/main/qmd/xdg-config"
    export XDG_CACHE_HOME="$STATE_DIR/agents/main/qmd/xdg-cache"

    # (Opcional) força refresh do índice + embeddings
    qmd update
    qmd embed

    # Aquece / aciona downloads de modelo pela primeira vez
    qmd query "test" -c memory-root --json >/dev/null 2>&1
    ```

**Superfície de config (`memory.qmd.*`)**

- `command` (padrão `qmd`): sobrescreve o caminho do executável.
- `searchMode` (padrão `search`): escolhe qual comando QMD apoia
  `memory_search` (`search`, `vsearch`, `query`).
- `includeDefaultMemory` (padrão `true`): auto-indexa `MEMORY.md` + `memory/**/*.md`.
- `paths[]`: adiciona diretórios/arquivos extras (`path`, `pattern` opcional, `name` estável opcional).
- `sessions`: opt-in para indexação de JSONL de sessão (`enabled`, `retentionDays`,
  `exportDir`).
- `update`: controla cadência de refresh e execução de manutenção:
  (`interval`, `debounceMs`, `onBoot`, `waitForBootSync`, `embedInterval`,
  `commandTimeoutMs`, `updateTimeoutMs`, `embedTimeoutMs`).
- `limits`: limita o payload de recall (`maxResults`, `maxSnippetChars`,
  `maxInjectedChars`, `timeoutMs`).
- `scope`: mesmo schema de [`session.sendPolicy`](/gateway/configuration#session).
  O padrão é apenas DM (`deny` tudo, `allow` chats diretos); relaxe para surfaçar hits do QMD
  em grupos/canais.
  - `match.keyPrefix` corresponde à chave de sessão **normalizada** (minúsculas, com qualquer
    prefixo `agent:<id>:` removido). Exemplo: `discord:channel:`.
  - `match.rawKeyPrefix` corresponde à chave de sessão **bruta** (minúsculas), incluindo
    `agent:<id>:`. Exemplo: `agent:main:discord:`.
  - Legado: `match.keyPrefix: "agent:..."` ainda é tratado como prefixo de chave bruta,
    mas prefira `rawKeyPrefix` para clareza.
- Quando `scope` nega uma busca, o OpenCraft registra um aviso com o `channel`/`chatType`
  derivado para que resultados vazios sejam mais fáceis de depurar.
- Snippets originados fora do workspace aparecem como
  `qmd/<collection>/<relative-path>` em resultados de `memory_search`; `memory_get`
  entende esse prefixo e lê da raiz de coleção QMD configurada.
- Quando `memory.qmd.sessions.enabled = true`, o OpenCraft exporta transcrições de sessão
  sanitizadas (turnos User/Assistant) em uma coleção QMD dedicada em
  `~/.opencraft/agents/<id>/qmd/sessions/`, para que `memory_search` possa recuperar conversas
  recentes sem tocar no índice SQLite embutido.
- Snippets de `memory_search` agora incluem um rodapé `Source: <path#line>` quando
  `memory.citations` é `auto`/`on`; defina `memory.citations = "off"` para manter
  os metadados de caminho internos (o agente ainda recebe o caminho para
  `memory_get`, mas o texto do snippet omite o rodapé e o system prompt
  avisa o agente para não citá-lo).

**Exemplo**

```json5
memory: {
  backend: "qmd",
  citations: "auto",
  qmd: {
    includeDefaultMemory: true,
    update: { interval: "5m", debounceMs: 15000 },
    limits: { maxResults: 6, timeoutMs: 4000 },
    scope: {
      default: "deny",
      rules: [
        { action: "allow", match: { chatType: "direct" } },
        // Prefixo de chave de sessão normalizado (remove `agent:<id>:`).
        { action: "deny", match: { keyPrefix: "discord:channel:" } },
        // Prefixo de chave de sessão bruta (inclui `agent:<id>:`).
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ]
    },
    paths: [
      { name: "docs", path: "~/notes", pattern: "**/*.md" }
    ]
  }
}
```

**Citations & fallback**

- `memory.citations` se aplica independentemente do backend (`auto`/`on`/`off`).
- Quando `qmd` roda, marcamos `status().backend = "qmd"` para que diagnósticos mostrem qual
  motor serviu os resultados. Se o subprocesso QMD sair ou a saída JSON não puder ser
  analisada, o gerenciador de busca registra um aviso e retorna o provedor embutido
  (embeddings Markdown existentes) até que o QMD se recupere.

### Caminhos de memória adicionais

Se você quiser indexar arquivos Markdown fora do layout padrão do workspace, adicione
caminhos explícitos:

```json5
agents: {
  defaults: {
    memorySearch: {
      extraPaths: ["../team-docs", "/srv/shared-notes/overview.md"]
    }
  }
}
```

Notas:

- Caminhos podem ser absolutos ou relativos ao workspace.
- Diretórios são varridos recursivamente por arquivos `.md`.
- Por padrão, apenas arquivos Markdown são indexados.
- Se `memorySearch.multimodal.enabled = true`, o OpenCraft também indexa arquivos de imagem/áudio suportados em `extraPaths` apenas. As raízes de memória padrão (`MEMORY.md`, `memory.md`, `memory/**/*.md`) permanecem apenas Markdown.
- Symlinks são ignorados (arquivos ou diretórios).

### Arquivos de memória multimodal (Gemini image + audio)

O OpenCraft pode indexar arquivos de imagem e áudio de `memorySearch.extraPaths` ao usar Gemini embedding 2:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-2-preview",
      extraPaths: ["assets/reference", "voice-notes"],
      multimodal: {
        enabled: true,
        modalities: ["image", "audio"], // ou ["all"]
        maxFileBytes: 10000000
      },
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

Notas:

- Memória multimodal é atualmente suportada apenas para `gemini-embedding-2-preview`.
- Indexação multimodal aplica-se apenas a arquivos descobertos via `memorySearch.extraPaths`.
- Modalidades suportadas nesta fase: imagem e áudio.
- `memorySearch.fallback` deve permanecer `"none"` enquanto memória multimodal estiver habilitada.
- Bytes de arquivos de imagem/áudio correspondentes são enviados ao endpoint de embedding Gemini configurado durante a indexação.
- Extensões de imagem suportadas: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`.
- Extensões de áudio suportadas: `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac`.
- Consultas de busca permanecem em texto, mas o Gemini pode comparar essas consultas de texto com embeddings de imagem/áudio indexados.
- `memory_get` ainda lê apenas Markdown; arquivos binários são pesquisáveis mas não retornados como conteúdo de arquivo bruto.

### Embeddings Gemini (nativo)

Defina o provedor como `gemini` para usar a API de embeddings Gemini diretamente:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-001",
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

Notas:

- `remote.baseUrl` é opcional (padrão para a URL base da API Gemini).
- `remote.headers` permite adicionar headers extras se necessário.
- Modelo padrão: `gemini-embedding-001`.
- `gemini-embedding-2-preview` também é suportado: limite de 8192 tokens e dimensões configuráveis (768 / 1536 / 3072, padrão 3072).

#### Gemini Embedding 2 (preview)

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-2-preview",
      outputDimensionality: 3072,  // opcional: 768, 1536, ou 3072 (padrão)
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

> **⚠️ Reindexação necessária:** Trocar de `gemini-embedding-001` (768 dimensões)
> para `gemini-embedding-2-preview` (3072 dimensões) muda o tamanho do vetor. O mesmo vale se você
> mudar `outputDimensionality` entre 768, 1536 e 3072.
> O OpenCraft vai reindexar automaticamente quando detectar uma mudança de modelo ou dimensão.

Se você quiser usar um **endpoint compatível com OpenAI customizado** (OpenRouter, vLLM ou um proxy),
pode usar a configuração `remote` com o provedor OpenAI:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_OPENAI_COMPAT_API_KEY",
        headers: { "X-Custom-Header": "value" }
      }
    }
  }
}
```

Se você não quiser definir uma chave de API, use `memorySearch.provider = "local"` ou defina
`memorySearch.fallback = "none"`.

Fallbacks:

- `memorySearch.fallback` pode ser `openai`, `gemini`, `voyage`, `mistral`, `ollama`, `local`, ou `none`.
- O provedor de fallback é usado apenas quando o provedor de embedding primário falha.

Indexação em batch (OpenAI + Gemini + Voyage):

- Desabilitado por padrão. Defina `agents.defaults.memorySearch.remote.batch.enabled = true` para habilitar para indexação de corpus grande (OpenAI, Gemini e Voyage).
- O comportamento padrão aguarda a conclusão do batch; ajuste `remote.batch.wait`, `remote.batch.pollIntervalMs` e `remote.batch.timeoutMinutes` se necessário.
- Defina `remote.batch.concurrency` para controlar quantos jobs de batch são submetidos em paralelo (padrão: 2).
- O modo batch se aplica quando `memorySearch.provider = "openai"` ou `"gemini"` e usa a chave de API correspondente.
- Jobs de batch Gemini usam o endpoint de batch de embeddings assíncrono e requerem disponibilidade da Batch API do Gemini.

Por que o batch OpenAI é rápido + barato:

- Para backfills grandes, OpenAI é tipicamente a opção mais rápida que suportamos porque podemos submeter muitas requisições de embedding em um único job de batch e deixar o OpenAI processá-las assincronamente.
- O OpenAI oferece preços com desconto para workloads da Batch API, então grandes execuções de indexação são geralmente mais baratas do que enviar as mesmas requisições de forma síncrona.
- Veja os docs e preços da Batch API do OpenAI para detalhes:
  - [https://platform.openai.com/docs/api-reference/batch](https://platform.openai.com/docs/api-reference/batch)
  - [https://platform.openai.com/pricing](https://platform.openai.com/pricing)

Exemplo de config:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      fallback: "openai",
      remote: {
        batch: { enabled: true, concurrency: 2 }
      },
      sync: { watch: true }
    }
  }
}
```

Ferramentas:

- `memory_search` — retorna snippets com arquivo + intervalos de linha.
- `memory_get` — lê conteúdo de arquivo de memória por caminho.

Modo local:

- Defina `agents.defaults.memorySearch.provider = "local"`.
- Forneça `agents.defaults.memorySearch.local.modelPath` (GGUF ou URI `hf:`).
- Opcional: defina `agents.defaults.memorySearch.fallback = "none"` para evitar fallback remoto.

### Como as ferramentas de memória funcionam

- `memory_search` busca semanticamente chunks Markdown (~400 tokens alvo, 80 tokens de overlap) de `MEMORY.md` + `memory/**/*.md`. Retorna texto de snippet (limitado a ~700 chars), caminho do arquivo, intervalo de linha, score, provedor/modelo e se houve fallback de local → embeddings remotos. Nenhum payload de arquivo completo é retornado.
- `memory_get` lê um arquivo Markdown de memória específico (relativo ao workspace), opcionalmente a partir de uma linha inicial e por N linhas. Caminhos fora de `MEMORY.md` / `memory/` são rejeitados.
- Ambas as ferramentas são habilitadas apenas quando `memorySearch.enabled` resolve como true para o agente.

### O que é indexado (e quando)

- Tipo de arquivo: apenas Markdown (`MEMORY.md`, `memory/**/*.md`).
- Armazenamento do índice: SQLite por agente em `~/.opencraft/memory/<agentId>.sqlite` (configurável via `agents.defaults.memorySearch.store.path`, suporta token `{agentId}`).
- Atualidade: watcher em `MEMORY.md` + `memory/` marca o índice como obsoleto (debounce 1,5s). Sync é agendado no início da sessão, na busca ou em intervalo e roda assincronamente. Transcrições de sessão usam limites delta para acionar sync em background.
- Gatilhos de reindexação: o índice armazena a **fingerprint de provedor/modelo de embedding + endpoint + parâmetros de chunking**. Se qualquer um deles mudar, o OpenCraft automaticamente reseta e reindexar todo o armazenamento.

### Busca híbrida (BM25 + vetorial)

Quando habilitado, o OpenCraft combina:

- **Similaridade vetorial** (match semântico, a formulação pode diferir)
- **Relevância de palavras-chave BM25** (tokens exatos como IDs, env vars, símbolos de código)

Se a busca de texto completo não estiver disponível na sua plataforma, o OpenCraft faz fallback para busca vetorial apenas.

#### Por que híbrido?

A busca vetorial é ótima para "isso significa a mesma coisa":

- "Mac Studio gateway host" vs "a máquina rodando o gateway"
- "debounce file updates" vs "avoid indexing on every write"

Mas pode ser fraca com tokens exatos de alto sinal:

- IDs (`a828e60`, `b3b9895a…`)
- símbolos de código (`memorySearch.query.hybrid`)
- strings de erro ("sqlite-vec unavailable")

BM25 (texto completo) é o oposto: forte com tokens exatos, mais fraco com paráfrases.
Busca híbrida é o meio-termo pragmático: **use ambos os sinais de recuperação** para obter
bons resultados tanto para consultas em "linguagem natural" quanto para consultas de "agulha no palheiro".

#### Como mesclamos resultados (o design atual)

Esboço de implementação:

1. Recuperar um pool de candidatos de ambos os lados:

- **Vetorial**: top `maxResults * candidateMultiplier` por similaridade de cosseno.
- **BM25**: top `maxResults * candidateMultiplier` por rank BM25 FTS5 (menor é melhor).

2. Converter rank BM25 em score 0..1-ish:

- `textScore = 1 / (1 + max(0, bm25Rank))`

3. Unir candidatos por chunk id e calcular um score ponderado:

- `finalScore = vectorWeight * vectorScore + textWeight * textScore`

Notas:

- `vectorWeight` + `textWeight` é normalizado para 1,0 na resolução de config, então os pesos se comportam como porcentagens.
- Se embeddings estiverem indisponíveis (ou o provedor retornar um zero-vector), ainda rodamos BM25 e retornamos matches por palavra-chave.
- Se FTS5 não puder ser criado, mantemos busca vetorial apenas (sem falha grave).

Isso não é "perfeito em teoria de IR", mas é simples, rápido e tende a melhorar recall/precisão em notas reais.
Se quisermos ficar mais sofisticados depois, os próximos passos comuns são Reciprocal Rank Fusion (RRF) ou normalização de score
(min/max ou z-score) antes de misturar.

#### Pipeline de pós-processamento

Após mesclar scores vetoriais e de palavras-chave, dois estágios opcionais de pós-processamento
refinam a lista de resultados antes de chegar ao agente:

```
Vetorial + Palavras-chave → Mesclagem Ponderada → Decaimento Temporal → Ordenação → MMR → Resultados Top-K
```

Ambos os estágios estão **desligados por padrão** e podem ser habilitados independentemente.

#### Re-ranking MMR (diversidade)

Quando a busca híbrida retorna resultados, múltiplos chunks podem conter conteúdo similar ou sobreposto.
Por exemplo, buscar por "configuração de rede doméstica" pode retornar cinco snippets quase idênticos
de diferentes notas diárias que mencionam a mesma configuração de roteador.

**MMR (Maximal Marginal Relevance)** re-rankeia os resultados para equilibrar relevância com diversidade,
garantindo que os resultados principais cubram diferentes aspectos da consulta em vez de repetir as mesmas informações.

Como funciona:

1. Os resultados são pontuados por sua relevância original (score ponderado vetorial + BM25).
2. O MMR seleciona iterativamente resultados que maximizam: `λ × relevância − (1−λ) × max_similaridade_para_selecionados`.
3. A similaridade entre resultados é medida usando similaridade de texto Jaccard em conteúdo tokenizado.

O parâmetro `lambda` controla o trade-off:

- `lambda = 1.0` → relevância pura (sem penalidade de diversidade)
- `lambda = 0.0` → máxima diversidade (ignora relevância)
- Padrão: `0.7` (equilibrado, leve viés para relevância)

**Exemplo — consulta: "configuração de rede doméstica"**

Dados esses arquivos de memória:

```
memory/2026-02-10.md  → "Configurei roteador Omada, defini VLAN 10 para dispositivos IoT"
memory/2026-02-08.md  → "Configurei roteador Omada, movi IoT para VLAN 10"
memory/2026-02-05.md  → "Configurei AdGuard DNS em 192.168.10.2"
memory/network.md     → "Roteador: Omada ER605, AdGuard: 192.168.10.2, VLAN 10: IoT"
```

Sem MMR — 3 primeiros resultados:

```
1. memory/2026-02-10.md  (score: 0.92)  ← roteador + VLAN
2. memory/2026-02-08.md  (score: 0.89)  ← roteador + VLAN (quase duplicado!)
3. memory/network.md     (score: 0.85)  ← doc de referência
```

Com MMR (λ=0.7) — 3 primeiros resultados:

```
1. memory/2026-02-10.md  (score: 0.92)  ← roteador + VLAN
2. memory/network.md     (score: 0.85)  ← doc de referência (diverso!)
3. memory/2026-02-05.md  (score: 0.78)  ← AdGuard DNS (diverso!)
```

O quase-duplicado de 8 de fevereiro cai fora, e o agente recebe três peças distintas de informação.

**Quando habilitar:** Se você notar que `memory_search` retorna snippets redundantes ou quase duplicados,
especialmente com notas diárias que frequentemente repetem informações similares ao longo dos dias.

#### Decaimento temporal (boost de recência)

Agentes com notas diárias acumulam centenas de arquivos datados ao longo do tempo. Sem decaimento,
uma nota bem formulada de seis meses atrás pode superar a atualização de ontem sobre o mesmo tópico.

**Decaimento temporal** aplica um multiplicador exponencial aos scores baseado na idade de cada resultado,
para que memórias recentes naturalmente se classifiquem mais alto enquanto as antigas desvanecem:

```
decayedScore = score × e^(-λ × ageInDays)
```

onde `λ = ln(2) / halfLifeDays`.

Com a meia-vida padrão de 30 dias:

- Notas de hoje: **100%** do score original
- 7 dias atrás: **~84%**
- 30 dias atrás: **50%**
- 90 dias atrás: **12,5%**
- 180 dias atrás: **~1,6%**

**Arquivos evergreen nunca sofrem decaimento:**

- `MEMORY.md` (arquivo de memória raiz)
- Arquivos sem data em `memory/` (ex.: `memory/projects.md`, `memory/network.md`)
- Esses contêm informações de referência duráveis que devem sempre se classificar normalmente.

**Arquivos diários datados** (`memory/YYYY-MM-DD.md`) usam a data extraída do nome do arquivo.
Outras fontes (ex.: transcrições de sessão) fazem fallback para o tempo de modificação do arquivo (`mtime`).

**Exemplo — consulta: "qual é o horário de trabalho do Rod?"**

Dados esses arquivos de memória (hoje é 10 de fevereiro):

```
memory/2025-09-15.md  → "Rod trabalha Seg-Sex, standup às 10h, pair às 14h"  (148 dias atrás)
memory/2026-02-10.md  → "Rod tem standup às 14:15, 1:1 com Zeb às 14:45"     (hoje)
memory/2026-02-03.md  → "Rod entrou em novo time, standup movido para 14:15" (7 dias atrás)
```

Sem decaimento:

```
1. memory/2025-09-15.md  (score: 0.91)  ← melhor match semântico, mas desatualizado!
2. memory/2026-02-10.md  (score: 0.82)
3. memory/2026-02-03.md  (score: 0.80)
```

Com decaimento (halfLife=30):

```
1. memory/2026-02-10.md  (score: 0.82 × 1.00 = 0.82)  ← hoje, sem decaimento
2. memory/2026-02-03.md  (score: 0.80 × 0.85 = 0.68)  ← 7 dias, decaimento leve
3. memory/2025-09-15.md  (score: 0.91 × 0.03 = 0.03)  ← 148 dias, quase eliminado
```

A nota obsoleta de setembro cai para o fundo apesar de ter o melhor match semântico bruto.

**Quando habilitar:** Se seu agente tem meses de notas diárias e você encontra informações antigas e
desatualizadas superando contexto recente. Uma meia-vida de 30 dias funciona bem para
fluxos de trabalho com muitas notas diárias; aumente (ex.: 90 dias) se você referencia notas antigas com frequência.

#### Configuração

Ambos os recursos são configurados em `memorySearch.query.hybrid`:

```json5
agents: {
  defaults: {
    memorySearch: {
      query: {
        hybrid: {
          enabled: true,
          vectorWeight: 0.7,
          textWeight: 0.3,
          candidateMultiplier: 4,
          // Diversidade: reduz resultados redundantes
          mmr: {
            enabled: true,    // padrão: false
            lambda: 0.7       // 0 = máxima diversidade, 1 = máxima relevância
          },
          // Recência: impulsiona memórias mais novas
          temporalDecay: {
            enabled: true,    // padrão: false
            halfLifeDays: 30  // score reduz pela metade a cada 30 dias
          }
        }
      }
    }
  }
}
```

Você pode habilitar qualquer recurso independentemente:

- **Apenas MMR** — útil quando você tem muitas notas similares mas a idade não importa.
- **Apenas decaimento temporal** — útil quando recência importa mas seus resultados já são diversos.
- **Ambos** — recomendado para agentes com históricos grandes e longos de notas diárias.

### Cache de embedding

O OpenCraft pode armazenar em cache **embeddings de chunks** no SQLite para que reindexação e atualizações frequentes (especialmente transcrições de sessão) não re-embeds texto inalterado.

Config:

```json5
agents: {
  defaults: {
    memorySearch: {
      cache: {
        enabled: true,
        maxEntries: 50000
      }
    }
  }
}
```

### Busca em memória de sessão (experimental)

Você pode opcionalmente indexar **transcrições de sessão** e surfaçá-las via `memory_search`.
Isso está protegido por uma flag experimental.

```json5
agents: {
  defaults: {
    memorySearch: {
      experimental: { sessionMemory: true },
      sources: ["memory", "sessions"]
    }
  }
}
```

Notas:

- Indexação de sessão é **opt-in** (desligada por padrão).
- Atualizações de sessão são debounced e **indexadas assincronamente** uma vez que cruzem limites delta (best-effort).
- `memory_search` nunca bloqueia na indexação; resultados podem estar levemente desatualizados até que o sync em background termine.
- Resultados ainda incluem apenas snippets; `memory_get` permanece limitado a arquivos de memória.
- Indexação de sessão é isolada por agente (apenas os logs de sessão daquele agente são indexados).
- Logs de sessão ficam em disco (`~/.opencraft/agents/<agentId>/sessions/*.jsonl`). Qualquer processo/usuário com acesso ao sistema de arquivos pode lê-los, então trate o acesso ao disco como o limite de confiança. Para isolamento mais estrito, rode agentes sob usuários de SO ou hosts separados.

Limites delta (padrões mostrados):

```json5
agents: {
  defaults: {
    memorySearch: {
      sync: {
        sessions: {
          deltaBytes: 100000,   // ~100 KB
          deltaMessages: 50     // linhas JSONL
        }
      }
    }
  }
}
```

### Aceleração vetorial SQLite (sqlite-vec)

Quando a extensão sqlite-vec está disponível, o OpenCraft armazena embeddings em uma
tabela virtual SQLite (`vec0`) e realiza consultas de distância vetorial no
banco de dados. Isso mantém a busca rápida sem carregar todos os embeddings no JS.

Configuração (opcional):

```json5
agents: {
  defaults: {
    memorySearch: {
      store: {
        vector: {
          enabled: true,
          extensionPath: "/path/to/sqlite-vec"
        }
      }
    }
  }
}
```

Notas:

- `enabled` padrão é true; quando desabilitado, a busca faz fallback para
  similaridade de cosseno em processo sobre embeddings armazenados.
- Se a extensão sqlite-vec estiver ausente ou falhar ao carregar, o OpenCraft registra o
  erro e continua com o fallback JS (sem tabela vetorial).
- `extensionPath` sobrescreve o caminho sqlite-vec embutido (útil para builds customizados
  ou locais de instalação não padrão).

### Download automático de embedding local

- Modelo de embedding local padrão: `hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB).
- Quando `memorySearch.provider = "local"`, `node-llama-cpp` resolve `modelPath`; se o GGUF estiver ausente ele **faz download automático** para o cache (ou `local.modelCacheDir` se definido), depois o carrega. Downloads retomam no retry.
- Requisito de build nativo: rode `pnpm approve-builds`, escolha `node-llama-cpp`, depois `pnpm rebuild node-llama-cpp`.
- Fallback: se a configuração local falhar e `memorySearch.fallback = "openai"`, automaticamente mudamos para embeddings remotos (`openai/text-embedding-3-small` a não ser que sobrescrito) e registramos o motivo.

### Exemplo de endpoint compatível com OpenAI customizado

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_REMOTE_API_KEY",
        headers: {
          "X-Organization": "org-id",
          "X-Project": "project-id"
        }
      }
    }
  }
}
```

Notas:

- `remote.*` tem precedência sobre `models.providers.openai.*`.
- `remote.headers` se mesclam com os headers OpenAI; remote vence em conflitos de chave. Omita `remote.headers` para usar os padrões OpenAI.
